// Package httpdelivery contains the JWT helpers for site-scoped admins and
// central super-admins.
package httpdelivery

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"

	"sunstore/internal/config"
	"sunstore/internal/domain"
)

// Claims carries super-admin or site-admin identity.
type Claims struct {
	Kind     string `json:"kind"`               // "super" | "site"
	Subject  string `json:"sub,omitempty"`
	Username string `json:"username"`
	SiteID   int64  `json:"site_id,omitempty"`
	SiteSlug string `json:"site_slug,omitempty"`
	Role     string `json:"role,omitempty"`
	jwt.RegisteredClaims
}

// signSiteAdminJWT produces a JWT bound to a specific site.
func signSiteAdminJWT(site *domain.Site, admin *domain.SiteAdmin) (string, error) {
	cfg := currentJWTConfig
	if cfg == nil {
		return "", errors.New("jwt config not initialized")
	}
	claims := Claims{
		Kind:     "site",
		Subject:  subjectSite,
		Username: admin.Username,
		SiteID:   site.ID,
		SiteSlug: site.Slug,
		Role:     admin.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    cfg.Issuer,
			Subject:   subjectSite,
			IssuedAt:  jwt.NewNumericDate(time.Now().UTC()),
			ExpiresAt: jwt.NewNumericDate(time.Now().UTC().Add(cfg.TTL)),
		},
	}
	tok := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return tok.SignedString(cfg.Secret)
}

// SignSuperAdminJWT produces a JWT for a central super-admin.
func SignSuperAdminJWT(admin *domain.SuperAdmin) (string, error) {
	cfg := currentJWTConfig
	if cfg == nil {
		return "", errors.New("jwt config not initialized")
	}
	claims := Claims{
		Kind:     "super",
		Subject:  subjectSuper,
		Username: admin.Username,
		Role:     "super",
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    cfg.Issuer,
			Subject:   subjectSuper,
			IssuedAt:  jwt.NewNumericDate(time.Now().UTC()),
			ExpiresAt: jwt.NewNumericDate(time.Now().UTC().Add(cfg.TTL)),
		},
	}
	tok := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return tok.SignedString(cfg.Secret)
}

const (
	subjectSuper = "super-admin"
	subjectSite  = "site-admin"
)

var currentJWTConfig *config.JWTConfig

// SetJWTConfig is called once at startup.
func SetJWTConfig(c config.JWTConfig) { currentJWTConfig = &c }
