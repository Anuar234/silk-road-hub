package file

import (
	"context"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
	"github.com/h2non/filetype"
)

var allowedMIME = map[string]string{
	"application/pdf": ".pdf",
	"image/png":       ".png",
	"image/jpeg":      ".jpg",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
}

type Service struct {
	repo      *Repository
	uploadDir string
	maxBytes  int64
}

func NewService(repo *Repository, uploadDir string, maxBytes int64) *Service {
	return &Service{repo: repo, uploadDir: uploadDir, maxBytes: maxBytes}
}

func (s *Service) Upload(ctx context.Context, header *multipart.FileHeader, uploaderID string) (*StoredFile, error) {
	if header.Size > s.maxBytes {
		return nil, fmt.Errorf("file too large (max %d bytes)", s.maxBytes)
	}

	src, err := header.Open()
	if err != nil {
		return nil, fmt.Errorf("open upload: %w", err)
	}
	defer src.Close()

	// Read first 261 bytes for magic detection
	headBuf := make([]byte, 261)
	n, err := src.Read(headBuf)
	if err != nil && err != io.EOF {
		return nil, fmt.Errorf("read header: %w", err)
	}
	headBuf = headBuf[:n]

	kind, _ := filetype.Match(headBuf)
	mime := kind.MIME.Value
	if mime == "" {
		// Fallback for DOCX (ZIP-based)
		if isDocx(headBuf, header.Filename) {
			mime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
		}
	}

	ext, ok := allowedMIME[mime]
	if !ok {
		return nil, fmt.Errorf("file type not allowed: %s", mime)
	}

	// Seek back to start
	if seeker, ok := src.(io.Seeker); ok {
		if _, err := seeker.Seek(0, io.SeekStart); err != nil {
			return nil, fmt.Errorf("seek: %w", err)
		}
	}

	id := uuid.NewString()
	filename := id + ext
	destPath := filepath.Join(s.uploadDir, filename)

	if err := os.MkdirAll(s.uploadDir, 0o755); err != nil {
		return nil, fmt.Errorf("mkdir: %w", err)
	}

	dst, err := os.Create(destPath)
	if err != nil {
		return nil, fmt.Errorf("create dest: %w", err)
	}
	defer dst.Close()

	// Write the head bytes first, then copy the rest
	if _, err := dst.Write(headBuf); err != nil {
		return nil, fmt.Errorf("write head: %w", err)
	}
	if _, err := io.Copy(dst, src); err != nil {
		return nil, fmt.Errorf("copy file: %w", err)
	}

	f := &StoredFile{
		ID:           id,
		OriginalName: header.Filename,
		Mime:         mime,
		Size:         header.Size,
		Ext:          ext,
		StoragePath:  destPath,
		UploadedBy:   uploaderID,
	}

	if err := s.repo.Create(ctx, f); err != nil {
		os.Remove(destPath)
		return nil, err
	}

	return f, nil
}

func (s *Service) GetByID(ctx context.Context, id string) (*StoredFile, error) {
	return s.repo.GetByID(ctx, id)
}

func isDocx(head []byte, filename string) bool {
	// DOCX is a ZIP; check PK magic + filename extension
	if len(head) >= 4 && head[0] == 0x50 && head[1] == 0x4B {
		return strings.HasSuffix(strings.ToLower(filename), ".docx")
	}
	return false
}
