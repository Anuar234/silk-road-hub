package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"

	"github.com/silkroadhub/backend/internal/config"
	"github.com/silkroadhub/backend/internal/middleware"
	"github.com/silkroadhub/backend/internal/module/analytics"
	"github.com/silkroadhub/backend/internal/module/audit"
	"github.com/silkroadhub/backend/internal/module/auth"
	"github.com/silkroadhub/backend/internal/module/contract"
	"github.com/silkroadhub/backend/internal/module/deal"
	"github.com/silkroadhub/backend/internal/module/file"
	"github.com/silkroadhub/backend/internal/module/investment"
	"github.com/silkroadhub/backend/internal/module/investmentrequest"
	"github.com/silkroadhub/backend/internal/module/product"
	"github.com/silkroadhub/backend/internal/module/reference"
	"github.com/silkroadhub/backend/internal/module/shipment"
	"github.com/silkroadhub/backend/internal/module/user"
	"github.com/silkroadhub/backend/internal/session"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		slog.Error("failed to load config", "err", err)
		os.Exit(1)
	}

	ctx := context.Background()

	// --- Database ---
	pool, err := pgxpool.New(ctx, cfg.DBUrl)
	if err != nil {
		slog.Error("failed to connect to database", "err", err)
		os.Exit(1)
	}
	defer pool.Close()

	if err := pool.Ping(ctx); err != nil {
		slog.Error("failed to ping database", "err", err)
		os.Exit(1)
	}
	slog.Info("database connected")

	// --- Migrations ---
	if cfg.RunMigrations {
		if err := runMigrations(cfg.MigrationsPath, cfg.DBUrl); err != nil {
			slog.Error("migration failed", "err", err)
			os.Exit(1)
		}
	}

	// --- Redis ---
	redisOpts, err := redis.ParseURL(cfg.RedisURL)
	if err != nil {
		slog.Error("invalid redis url", "err", err)
		os.Exit(1)
	}
	rdb := redis.NewClient(redisOpts)
	defer rdb.Close()

	if err := rdb.Ping(ctx).Err(); err != nil {
		slog.Error("failed to connect to redis", "err", err)
		os.Exit(1)
	}
	slog.Info("redis connected")

	// --- Session store ---
	sessStore := session.NewStore(rdb, cfg.SessionTTL)

	// --- Gin ---
	r := gin.Default()
	r.MaxMultipartMemory = cfg.MaxUploadBytes

	r.Use(middleware.CORS(cfg.CORSOrigin))

	api := r.Group("/api")
	api.Use(middleware.CSRF())

	// --- Audit log (middleware applied to all /api/* routes below) ---
	auditRepo := audit.NewRepository(pool)
	auditSvc := audit.NewService(auditRepo)
	api.Use(audit.Middleware(auditSvc))

	// --- Modules ---
	authRepo := auth.NewRepository(pool)
	authSvc := auth.NewService(authRepo)
	auth.RegisterRoutes(api, authSvc, sessStore, cfg)

	userRepo := user.NewRepository(pool)
	userSvc := user.NewService(userRepo)
	user.RegisterRoutes(api, userSvc, sessStore)

	fileRepo := file.NewRepository(pool)
	fileSvc := file.NewService(fileRepo, cfg.UploadDir, cfg.MaxUploadBytes)
	file.RegisterRoutes(api, fileSvc, sessStore)

	productRepo := product.NewRepository(pool)
	productSvc := product.NewService(productRepo)
	product.RegisterRoutes(api, productSvc, sessStore)

	investRepo := investment.NewRepository(pool)
	investSvc := investment.NewService(investRepo)
	investment.RegisterRoutes(api, investSvc, sessStore)

	invReqRepo := investmentrequest.NewRepository(pool)
	invReqSvc := investmentrequest.NewService(invReqRepo)
	investmentrequest.RegisterRoutes(api, invReqSvc, sessStore)

	contractRepo := contract.NewRepository(pool)
	contractSvc := contract.NewService(contractRepo)
	contract.RegisterRoutes(api, contractSvc, sessStore)

	shipmentRepo := shipment.NewRepository(pool)
	shipmentSvc := shipment.NewService(shipmentRepo)
	shipment.RegisterRoutes(api, shipmentSvc, sessStore)

	dealRepo := deal.NewRepository(pool)
	dealSvc := deal.NewService(dealRepo)
	deal.RegisterRoutes(api, dealSvc, sessStore)

	analytics.RegisterRoutes(api, pool, sessStore)
	audit.RegisterRoutes(api, auditSvc, sessStore)

	refRepo := reference.NewRepository(pool)
	refSvc := reference.NewService(refRepo)
	reference.RegisterRoutes(api, refSvc)

	// --- Server ---
	addr := fmt.Sprintf(":%d", cfg.Port)
	srv := &http.Server{
		Addr:         addr,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		slog.Info("server starting", "addr", addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("server error", "err", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	slog.Info("shutting down...")

	shutdownCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		slog.Error("server forced shutdown", "err", err)
	}
	slog.Info("server stopped")
}

func runMigrations(source, dbURL string) error {
	m, err := migrate.New(source, dbURL)
	if err != nil {
		return fmt.Errorf("migrate init: %w", err)
	}
	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("migrate up: %w", err)
	}
	slog.Info("migrations applied")
	return nil
}
