package auth

import "time"

type User struct {
	ID                 string    `json:"id" db:"id"`
	Email              string    `json:"email" db:"email"`
	PasswordHash       string    `json:"-" db:"password_hash"`
	DisplayName        string    `json:"displayName" db:"display_name"`
	Role               string    `json:"role" db:"role"`
	Verified           bool      `json:"verified" db:"verified"`
	EmailVerified      bool      `json:"emailVerified" db:"email_verified"`
	CompanyName        string    `json:"companyName,omitempty" db:"company_name"`
	BIN                string    `json:"bin,omitempty" db:"bin"`
	Position           string    `json:"position,omitempty" db:"position"`
	Phone              string    `json:"phone,omitempty" db:"phone"`
	VerificationStatus string    `json:"verificationStatus" db:"verification_status"`
	CreatedAt          time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt          time.Time `json:"updatedAt" db:"updated_at"`
}

type UserPayload struct {
	ID                 string `json:"id"`
	Email              string `json:"email"`
	DisplayName        string `json:"displayName"`
	Role               string `json:"role"`
	Verified           bool   `json:"verified"`
	CompanyName        string `json:"companyName,omitempty"`
	BIN                string `json:"bin,omitempty"`
	Phone              string `json:"phone,omitempty"`
	VerificationStatus string `json:"verificationStatus"`
}

func (u *User) ToPayload() *UserPayload {
	return &UserPayload{
		ID:                 u.ID,
		Email:              u.Email,
		DisplayName:        u.DisplayName,
		Role:               u.Role,
		Verified:           u.Verified,
		CompanyName:        u.CompanyName,
		BIN:                u.BIN,
		Phone:              u.Phone,
		VerificationStatus: u.VerificationStatus,
	}
}

type RegisterInput struct {
	Email       string `json:"email" binding:"required,email"`
	Password    string `json:"password" binding:"required,min=6"`
	DisplayName string `json:"displayName" binding:"required"`
	Role        string `json:"role" binding:"required,oneof=buyer seller"`
	Phone       string `json:"phone"`
	CompanyName string `json:"companyName"`
	BIN         string `json:"bin"`
	Position    string `json:"position"`
}

type LoginInput struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}
