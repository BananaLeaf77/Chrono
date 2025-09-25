package config

import (
	"context"
	"os"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func InitMiddleware(app *gin.Engine) {
	// CORS Middleware
	app.Use(cors.New(cors.Config{
		AllowOrigins:     strings.Split(os.Getenv("ALLOW_ORIGINS"), ","),
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))
	// Logging Middleware
	app.Use(gin.Logger())
	// Recovery Middleware
	app.Use(gin.Recovery())
	// Security Middleware
	app.Use(func(c *gin.Context) {
		c.Writer.Header().Set("X-Content-Type-Options", "nosniff")
		c.Writer.Header().Set("X-Frame-Options", "DENY")
		c.Writer.Header().Set("X-XSS-Protection", "1; mode=block")
		c.Writer.Header().Set("Content-Security-Policy", "default-src 'self'")
		c.Next()
	})
	// Timeout Middleware
	app.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Content-Type", "application/json")
		c.Request.Context()
		ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
		defer cancel()
		c.Request = c.Request.WithContext(ctx)
		c.Next()
	})
}
