package httpdelivery

import (
	"context"
	"log/slog"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"sunstore/internal/config"
	"sunstore/internal/usecase"
)

// HealthChecker is the subset required for /healthz.
type HealthChecker interface {
	Ping(ctx context.Context) error
}

// RouterDeps groups all delivery-layer dependencies.
type RouterDeps struct {
	Config        *config.Config
	Logger        *slog.Logger
	DB            HealthChecker
	Products      *usecase.ProductUseCase
	Orders        *usecase.OrderUseCase
	Payments      *usecase.PaymentUseCase
	Admins        *usecase.AdminUseCase
	Notifications *usecase.PaymentNotificationUseCase
}

// NewRouter builds the entire Phase 2 HTTP surface.
func NewRouter(deps RouterDeps) *gin.Engine {
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(requestLogger(deps.Logger))
	r.Use(corsMiddleware(deps.Config.App.AllowedOrigins))

	productHandler := NewProductHandler(deps.Products)
	orderHandler := NewOrderHandler(deps.Orders, deps.Payments)
	adminHandler := NewAdminHandler(deps.Admins)
	webhookHandler := NewWebhookHandler(deps.Logger, deps.Notifications)

	r.GET("/healthz", func(c *gin.Context) {
		pingCtx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
		defer cancel()
		if err := deps.DB.Ping(pingCtx); err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"status": "degraded",
				"db":     "down",
			})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"status": "ok",
			"db":     "up",
		})
	})

	api := r.Group("/api/v1")
	{
		api.GET("/products", productHandler.ListStorefront)
		api.GET("/products/:slug", productHandler.GetStorefrontBySlug)
		api.POST("/checkout/init", orderHandler.CheckoutInit)

		adminAuth := api.Group("/admin/auth")
		adminAuth.POST("/login", adminHandler.Login)

		admin := api.Group("/admin")
		admin.Use(adminAuthMiddleware(deps.Admins))
		{
			admin.GET("/products", productHandler.ListAdmin)
			admin.POST("/products", productHandler.CreateAdmin)
			admin.PUT("/products/:id", productHandler.UpdateAdmin)
			admin.DELETE("/products/:id", productHandler.DeleteAdmin)
			admin.GET("/orders", orderHandler.ListAdmin)
		}

		webhooks := api.Group("/webhooks")
		webhooks.POST("/tbank", webhookHandler.TBank)
	}

	return r
}
