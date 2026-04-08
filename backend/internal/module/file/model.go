package file

import "time"

type StoredFile struct {
	ID           string    `json:"id" db:"id"`
	OriginalName string    `json:"originalName" db:"original_name"`
	Mime         string    `json:"mime" db:"mime"`
	Size         int64     `json:"size" db:"size"`
	Ext          string    `json:"ext" db:"ext"`
	StoragePath  string    `json:"-" db:"storage_path"`
	UploadedBy   string    `json:"uploadedBy" db:"uploaded_by"`
	UploadedAt   time.Time `json:"uploadedAt" db:"uploaded_at"`
}
