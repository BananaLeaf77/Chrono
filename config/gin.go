package config

import (
	"chronosphere/utils"
	"context"
	"net/http"
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
		MaxAge:           12 * time.Hour,
	}))

	// Logging & Recovery
	app.Use(gin.Logger())
	app.Use(gin.Recovery())

	// Security Headers
	app.Use(func(c *gin.Context) {
		c.Writer.Header().Set("X-Content-Type-Options", "nosniff")
		c.Writer.Header().Set("X-Frame-Options", "DENY")
		c.Writer.Header().Set("X-XSS-Protection", "1; mode=block")
		c.Writer.Header().Set("Content-Security-Policy", "default-src 'self'")
		c.Writer.Header().Set("Strict-Transport-Security", "max-age=63072000; includeSubDomains")
		c.Writer.Header().Set("Referrer-Policy", "no-referrer")
		c.Next()
	})

	// Timeout Middleware
	app.Use(func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
		defer cancel()

		c.Request = c.Request.WithContext(ctx)

		done := make(chan struct{})
		go func() {
			c.Next()
			close(done)
		}()

		select {
		case <-ctx.Done():
			c.JSON(http.StatusGatewayTimeout, gin.H{"error": "request timed out"})
			c.Abort()
		case <-done:
			// selesai normal
		}
	})
}

// Auth Middleware
func AuthMiddleware(jwtManager *utils.JWTManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := strings.TrimSpace(c.GetHeader("Authorization"))
		if !strings.HasPrefix(authHeader, "Bearer ") {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid authorization header"})
			c.Abort()
			return
		}

		tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
		userUUID, err := jwtManager.VerifyToken(tokenStr)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			c.Abort()
			return
		}

		// simpan userUUID ke context
		c.Set("userUUID", userUUID)
		c.Next()
	}
}
