package delivery

import (
	"chronosphere/config"
	"chronosphere/domain"
	"chronosphere/dto"
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
		teacher.GET("/schedules", h.GetMySchedules)
		teacher.PUT("/modify", h.UpdateTeacherData)
		teacher.POST("/create-available-class", h.AddAvailability)
		teacher.DELETE("/delete-available-class/:id", h.DeleteAddAvailability)

	}
}

func (th *TeacherHandler) GetMySchedules(c *gin.Context) {
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

	teacherSchedules, err := th.tc.GetMySchedules(c.Request.Context(), userUUID.(string))
	if err != nil {
		utils.PrintLogInfo(&name, 500, "GetMySchedules", &err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	utils.PrintLogInfo(&name, 200, "GetMySchedules", nil)
	c.JSON(http.StatusOK, gin.H{
		"data":    &teacherSchedules,
		"success": false,
		"error":   err.Error(),
	})

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
	var req dto.UpdateTeacherProfileRequestByTeacher

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.PrintLogInfo(&name, 400, "UpdateTeacher - BindJSON", &err)
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   utils.TranslateValidationError(err),
		})
		return
	}

	filtered := dto.MapCreateTeacherRequestToUserByTeacher(&req)
	utils.PrintDTO("filtered", filtered)

	if err := th.tc.UpdateTeacherData(c.Request.Context(), userUUID.(string), filtered); err != nil {
		utils.PrintLogInfo(&name, 500, "UpdateTeacher - UseCase", &err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   utils.TranslateDBError(err),
		})
		return
	}

	utils.PrintLogInfo(&name, 200, "UpdateTeacher", nil)
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Teacher profile updated",
	})
}

func (th *TeacherHandler) AddAvailability(c *gin.Context) {

}

func (th *TeacherHandler) DeleteAddAvailability(c *gin.Context) {

}
