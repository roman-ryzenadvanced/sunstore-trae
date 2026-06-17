package postgres

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"

	"sunstore/internal/domain"
)

// AdminUserRepository is the PostgreSQL implementation of domain.AdminUserRepository.
type AdminUserRepository struct {
	db DBTX
}

// NewAdminUserRepository constructs an AdminUserRepository.
func NewAdminUserRepository(db DBTX) *AdminUserRepository {
	return &AdminUserRepository{db: db}
}

// GetByUsername loads one admin user by login name.
func (r *AdminUserRepository) GetByUsername(ctx context.Context, username string) (*domain.AdminUser, error) {
	query := `
		SELECT id, username, password_hash, created_at
		FROM admin_users
		WHERE username = $1
	`
	var user domain.AdminUser
	if err := r.db.QueryRow(ctx, query, username).Scan(
		&user.ID,
		&user.Username,
		&user.PasswordHash,
		&user.CreatedAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("%w: invalid credentials", domain.ErrUnauthorized)
		}
		return nil, fmt.Errorf("get admin user by username: %w", err)
	}
	return &user, nil
}
