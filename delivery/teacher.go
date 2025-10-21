package delivery

import (
	"chronosphere/config"
	"chronosphere/domain"
	"chronosphere/middleware"
	"chronosphere/utils"
	"net/http"

	"github.com/gin-gonic/gin"
)

type TeacherHandler struct {
	tc domain.TeacherUseCase
}

func NewTeacherHandler(app *gin.Engine, tc domain.TeacherUseCase, jwtManager *utils.JWTManager) {
	h := &TeacherHandler{tc: tc}

	teacher := app.Group("/teacher")
	teacher.Use(config.AuthMiddleware(jwtManager), middleware.TeacherAndAdminOnly())
	{
		teacher.GET("/profile", h.GetMyProfile)
		teacher.PUT("/modify/:id", h.UpdateTeacherData)
		teacher.POST("/availability", h.AddAvailability)
		teacher.DELETE("/availability/delete/:id", h.DeleteAddAvailability)

	}
}

func (th *TeacherHandler) GetMyProfile(c *gin.Context) {
	name := utils.GetAPIHitter(c)
	userUUID, exists := c.Get("userUUID")
	if !exists {
		utils.PrintLogInfo(&name, 401, "GetMyProfile", nil)
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Unauthorized: missing user context",
		})
		return
	}

	// Call usecase to get teacher data
	user, err := th.tc.GetMyProfile(c.Request.Context(), userUUID.(string))
	if err != nil {
		utils.PrintLogInfo(&name, 500, "GetMyProfile", &err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	utils.PrintLogInfo(&name, 200, "GetMyProfile", nil)
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    user,
	})
}

func (th *TeacherHandler) UpdateTeacherData(c *gin.Context) {
	
}

func (th *TeacherHandler) AddAvailability(c *gin.Context) {

}

func (th *TeacherHandler) DeleteAddAvailability(c *gin.Context) {

}
