package config

import (
	"time"

	"github.com/caarlos0/env/v11"
)

type Config struct {
	Port           int           `env:"SRH_PORT" envDefault:"8080"`
	DBUrl          string        `env:"SRH_DB_URL" envDefault:"postgres://srh:srh_dev_pass@localhost:5432/silkroadhub?sslmode=disable"`
	RedisURL       string        `env:"SRH_REDIS_URL" envDefault:"redis://localhost:6379/0"`
	SessionSecret  string        `env:"SRH_SESSION_SECRET" envDefault:"dev-session-secret-change-me"`
	SessionTTL     time.Duration `env:"SRH_SESSION_TTL" envDefault:"12h"`
	CORSOrigin     string        `env:"SRH_CORS_ORIGIN" envDefault:"http://localhost:3000"`
	SecureCookies  bool          `env:"SRH_SECURE_COOKIES" envDefault:"false"`
	UploadDir      string        `env:"SRH_UPLOAD_DIR" envDefault:"./storage/uploads"`
	MaxUploadBytes int64         `env:"SRH_MAX_UPLOAD_BYTES" envDefault:"10485760"`
	RunMigrations  bool          `env:"SRH_RUN_MIGRATIONS" envDefault:"true"`
	MigrationsPath string        `env:"SRH_MIGRATIONS_PATH" envDefault:"file://migrations"`
}

func Load() (*Config, error) {
	cfg := &Config{}
	if err := env.Parse(cfg); err != nil {
		return nil, err
	}
	return cfg, nil
}
