package usecase

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"sunstore/internal/domain"
)

// AdminClaims is the JWT payload for admin sessions.
type AdminClaims struct {
	UserID   int64  `json:"user_id"`
	Username string `json:"username"`
	jwt.RegisteredClaims
}

// AdminUseCase authenticates admins and issues/parses JWTs.
type AdminUseCase struct {
	repo   domain.AdminUserRepository
	secret []byte
	issuer string
	ttl    time.Duration
}

// NewAdminUseCase constructs an AdminUseCase.
func NewAdminUseCase(repo domain.AdminUserRepository, secret []byte, issuer string, ttl time.Duration) *AdminUseCase {
	return &AdminUseCase{
		repo:   repo,
		secret: secret,
		issuer: issuer,
		ttl:    ttl,
	}
}

// Login validates credentials and returns a signed token.
func (uc *AdminUseCase) Login(ctx context.Context, req domain.AdminLoginRequest) (*domain.AdminLoginResponse, error) {
	username := strings.TrimSpace(req.Username)
	password := strings.TrimSpace(req.Password)
	if username == "" || password == "" {
		return nil, fmt.Errorf("%w: username and password are required", domain.ErrValidation)
	}

	user, err := uc.repo.GetByUsername(ctx, username)
	if err != nil {
		return nil, err
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, fmt.Errorf("%w: invalid credentials", domain.ErrUnauthorized)
	}

	now := time.Now().UTC()
	expiresAt := now.Add(uc.ttl)
	claims := AdminClaims{
		UserID:   user.ID,
		Username: user.Username,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    uc.issuer,
			Subject:   user.Username,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(expiresAt),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString(uc.secret)
	if err != nil {
		return nil, fmt.Errorf("sign jwt: %w", err)
	}

	return &domain.AdminLoginResponse{
		Token:     signed,
		ExpiresAt: expiresAt,
		Username:  user.Username,
	}, nil
}

// ParseToken validates a bearer token and returns its claims.
func (uc *AdminUseCase) ParseToken(tokenString string) (*AdminClaims, error) {
	tokenString = strings.TrimSpace(tokenString)
	if tokenString == "" {
		return nil, fmt.Errorf("%w: missing token", domain.ErrUnauthorized)
	}

	parsed, err := jwt.ParseWithClaims(tokenString, &AdminClaims{}, func(token *jwt.Token) (any, error) {
		if token.Method != jwt.SigningMethodHS256 {
			return nil, fmt.Errorf("%w: invalid signing method", domain.ErrUnauthorized)
		}
		return uc.secret, nil
	}, jwt.WithIssuer(uc.issuer))
	if err != nil {
		return nil, fmt.Errorf("%w: %v", domain.ErrUnauthorized, err)
	}

	claims, ok := parsed.Claims.(*AdminClaims)
	if !ok || !parsed.Valid {
		return nil, fmt.Errorf("%w: invalid token", domain.ErrUnauthorized)
	}
	return claims, nil
}
