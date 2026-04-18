package news

import "time"

type Article struct {
	ID          string     `json:"id" db:"id"`
	Slug        string     `json:"slug" db:"slug"`
	Title       string     `json:"title" db:"title"`
	Summary     string     `json:"summary" db:"summary"`
	Body        string     `json:"body" db:"body"`
	CoverFileID *string    `json:"coverFileId,omitempty" db:"cover_file_id"`
	Status      string     `json:"status" db:"status"`
	AuthorID    *string    `json:"authorId,omitempty" db:"author_id"`
	Tags        []string   `json:"tags" db:"tags"`
	PublishedAt *time.Time `json:"publishedAt,omitempty" db:"published_at"`
	CreatedAt   time.Time  `json:"createdAt" db:"created_at"`
	UpdatedAt   time.Time  `json:"updatedAt" db:"updated_at"`
}

type CreateInput struct {
	Slug        string   `json:"slug" binding:"required,min=2,max=255"`
	Title       string   `json:"title" binding:"required,min=2,max=512"`
	Summary     string   `json:"summary"`
	Body        string   `json:"body"`
	CoverFileID *string  `json:"coverFileId"`
	Tags        []string `json:"tags"`
	Status      string   `json:"status" binding:"omitempty,oneof=draft published archived"`
}

type UpdateInput struct {
	Title       *string  `json:"title"`
	Summary     *string  `json:"summary"`
	Body        *string  `json:"body"`
	CoverFileID *string  `json:"coverFileId"`
	Tags        []string `json:"tags"`
	Status      *string  `json:"status" binding:"omitempty,oneof=draft published archived"`
	Slug        *string  `json:"slug"`
}

type ListFilter struct {
	Status string
	Tag    string
	Limit  int
	Offset int
}
