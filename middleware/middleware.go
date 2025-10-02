package middleware

import (
	"chronosphere/domain"
	"net/http"

	"github.com/gin-gonic/gin"
)

// role checking middleware
func AdminOnly() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("role")
		if !exists || role != domain.RoleAdmin {
			c.JSON(http.StatusForbidden, gin.H{
				"success": false,
				"message": "Admins only",
			})
			c.Abort()
			return
		}
		c.Next()
	}
}
