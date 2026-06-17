package domain

import (
	"context"
	"errors"
	"time"
)

var (
	// ErrNotFound is returned when a requested entity does not exist.
	ErrNotFound = errors.New("not found")
	// ErrValidation is returned when request payload or business rules are invalid.
	ErrValidation = errors.New("validation failed")
	// ErrUnauthorized is returned when credentials or tokens are invalid.
	ErrUnauthorized = errors.New("unauthorized")
	// ErrConflict is returned when a unique/consistency constraint is violated.
	ErrConflict = errors.New("conflict")
	// ErrUnavailable is returned when a downstream dependency is unavailable.
	ErrUnavailable = errors.New("service unavailable")
)

// AdminUser is the persisted admin account.
type AdminUser struct {
	ID           int64     `json:"id"`
	Username     string    `json:"username"`
	PasswordHash string    `json:"-"`
	CreatedAt    time.Time `json:"created_at"`
}

// AdminLoginRequest is the admin authentication payload.
type AdminLoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// AdminLoginResponse is returned after a successful JWT issuance.
type AdminLoginResponse struct {
	Token     string    `json:"token"`
	ExpiresAt time.Time `json:"expires_at"`
	Username  string    `json:"username"`
}

// AdminUserRepository is the storage contract for admin accounts.
type AdminUserRepository interface {
	GetByUsername(ctx context.Context, username string) (*AdminUser, error)
}
