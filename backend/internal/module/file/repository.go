package file

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (r *Repository) Create(ctx context.Context, f *StoredFile) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO files (id, original_name, mime, size, ext, storage_path, uploaded_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7)`,
		f.ID, f.OriginalName, f.Mime, f.Size, f.Ext, f.StoragePath, f.UploadedBy,
	)
	if err != nil {
		return fmt.Errorf("create file: %w", err)
	}
	return nil
}

func (r *Repository) GetByID(ctx context.Context, id string) (*StoredFile, error) {
	var f StoredFile
	err := r.pool.QueryRow(ctx, `
		SELECT id, original_name, mime, size, ext, storage_path, uploaded_by, uploaded_at
		FROM files WHERE id = $1`, id).Scan(
		&f.ID, &f.OriginalName, &f.Mime, &f.Size, &f.Ext,
		&f.StoragePath, &f.UploadedBy, &f.UploadedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("get file: %w", err)
	}
	return &f, nil
}
