package delivery

import (
	"chronosphere/domain"

	"github.com/gin-gonic/gin"
)

type StudentHandler struct {
	authUC domain.StudentUseCase
}

func NewStudentHandler(r *gin.Engine, authUC domain.StudentUseCase) {
	handler := &StudentHandler{authUC: authUC}

	route := r.Group("/student")
	{
		route.GET("/profile", handler.GetMyProfile)
		route.PUT("/modify", handler.UpdateStudentData)
	}

}

func (h *StudentHandler) GetMyProfile(c *gin.Context) {
	userUUID, exists := c.Get("userUUID")

	if !exists {
		c.JSON(401, gin.H{"message": "Unauthorized", "success": false})
		return
	}
	user, err := h.authUC.GetMyProfile(c.Request.Context(), userUUID.(string))
	if err != nil {
		c.JSON(500, gin.H{"message": "Failed to get profile", "success": false, "error": err.Error()})
		return
	}
	c.JSON(200, gin.H{"message": "Profile fetched successfully", "success": true, "data": user})
}

func (h *StudentHandler) UpdateStudentData(c *gin.Context) {
	userUUID, exists := c.Get("userUUID")

	if !exists {
		c.JSON(401, gin.H{"message": "Unauthorized", "success": false})
		return
	}
	var user domain.User
	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(400, gin.H{"message": "Invalid request", "success": false, "error": err.Error()})
		return
	}
	if err := h.authUC.UpdateStudentData(c.Request.Context(), userUUID.(string), &user); err != nil {
		c.JSON(500, gin.H{"message": "Failed to update profile", "success": false, "error": err.Error()})
		return
	}
	c.JSON(200, gin.H{"message": "Profile updated successfully", "success": true})
}
