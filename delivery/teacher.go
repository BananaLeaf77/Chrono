package delivery

import (
	"chronosphere/config"
	"chronosphere/domain"
	"chronosphere/middleware"
	"chronosphere/utils"

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

}

func (th *TeacherHandler) UpdateTeacherData(c *gin.Context) {

}

func (th *TeacherHandler) AddAvailability(c *gin.Context) {

}

func (th *TeacherHandler) DeleteAddAvailability(c *gin.Context) {

}