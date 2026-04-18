package audit

import "time"

type Entry struct {
	ID         string    `json:"id" db:"id"`
	UserID     *string   `json:"userId,omitempty" db:"user_id"`
	Method     string    `json:"method" db:"method"`
	Path       string    `json:"path" db:"path"`
	StatusCode int       `json:"statusCode" db:"status_code"`
	IPAddress  *string   `json:"ipAddress,omitempty" db:"ip_address"`
	UserAgent  *string   `json:"userAgent,omitempty" db:"user_agent"`
	DurationMs int64     `json:"durationMs" db:"duration_ms"`
	CreatedAt  time.Time `json:"createdAt" db:"created_at"`
}

type ListFilters struct {
	UserID *string
	Method *string
	From   *time.Time
	To     *time.Time
	Limit  int
	Offset int
}
