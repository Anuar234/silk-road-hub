package session

import "time"

type Data struct {
	UserID    string `json:"userId"`
	Email     string `json:"email"`
	Role      string `json:"role"`
	Name      string `json:"name"`
	CSRFToken string `json:"csrfToken"`
	CreatedAt int64  `json:"createdAt"`
}

func (d *Data) IsExpired(ttl time.Duration) bool {
	return time.Since(time.UnixMilli(d.CreatedAt)) > ttl
}
