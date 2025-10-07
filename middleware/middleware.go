package middleware

import (
	"chronosphere/domain"
	"chronosphere/utils"
	"net/http"

	"github.com/gin-gonic/gin"
)

// role checking middleware
func AdminOnly() gin.HandlerFunc {
	return func(c *gin.Context) {
		name := utils.GetAPIHitter(c)
		role, exists := c.Get("role")
		if !exists || role != domain.RoleAdmin {
			utils.PrintLogInfo(&name, 403, "AdminOnly Middleware - Role Check", nil)
			c.JSON(http.StatusForbidden, gin.H{
				"success": false,
				"message": "Admin access required",
			})
			c.Abort()
			return
		}
		c.Next()
	}
}
