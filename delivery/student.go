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

type StudentHandler struct {
	studUC domain.StudentUseCase
}

func NewStudentHandler(r *gin.Engine, studUC domain.StudentUseCase, jwtManager *utils.JWTManager) {
	handler := &StudentHandler{studUC: studUC}

	student := r.Group("/student")
	student.Use(config.AuthMiddleware(jwtManager), middleware.StudentAndAdminOnly())
	{
		student.GET("/packages", handler.GetAllAvailablePackages)
		student.GET("/profile", handler.GetMyProfile)
		student.GET("/booked", handler.GetMyBookedClasses)
		student.GET("/classes", handler.GetAvailableSchedules)
		student.PUT("/modify", handler.UpdateStudentData)

	}

}

func (h *StudentHandler) GetAvailableSchedules(c *gin.Context) {
	name := utils.GetAPIHitter(c)

	userUUID, exists := c.Get("userUUID")
	if !exists {
		utils.PrintLogInfo(&name, 401, "GetAvailableSchedules", nil)
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "Unauthorized: missing user context",
			"message": "Failed to Get Available Schedules",
		})
		return
	}

	schedules, err := h.studUC.GetAvailableSchedules(c.Request.Context(), userUUID.(string))
	if err != nil {
		utils.PrintLogInfo(&name, 500, "GetAvailableSchedules", &err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   err.Error(),
			"message": "Failed to Get Available Schedules",
		})
		return
	}

	utils.PrintLogInfo(&name, 200, "GetAvailableSchedules", nil)
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    schedules,
	})
}

func (h *StudentHandler) GetMyBookedClasses(c *gin.Context) {
	name := utils.GetAPIHitter(c)

	userUUID, exists := c.Get("userUUID")
	if !exists {
		utils.PrintLogInfo(&name, 401, "GetMyBookedClasses", nil)
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "Unauthorized: missing user context",
			"message": "Failed to Get My Booked Classes",
		})
		return
	}

	bookings, err := h.studUC.GetMyBookedClasses(c.Request.Context(), userUUID.(string))
	if err != nil {
		utils.PrintLogInfo(&name, 500, "GetMyBookedClasses", &err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   err.Error(),
			"message": "Failed to Get My Booked Classes",
		})
		return
	}

	utils.PrintLogInfo(&name, 200, "GetMyBookedClasses", nil)
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    bookings,
	})
}

func (h *StudentHandler) GetAllAvailablePackages(c *gin.Context) {
	name := utils.GetAPIHitter(c)

	packages, err := h.studUC.GetAllAvailablePackages(c.Request.Context())
	if err != nil {
		utils.PrintLogInfo(&name, 500, "GetAllAvailablePackages", &err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   err.Error(),
			"message": "Failed to Get Available Packages",
		})
		return
	}

	utils.PrintLogInfo(&name, 200, "GetAllAvailablePackages", nil)
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    packages,
	})
}

func (h *StudentHandler) GetMyProfile(c *gin.Context) {
	name := utils.GetAPIHitter(c)
	userUUID, exists := c.Get("userUUID")
	if !exists {
		utils.PrintLogInfo(&name, 401, "GetMyProfile", nil)
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "Unauthorized: missing user context",
			"message": "Failed to Get My Profile",
		})
		return
	}

	// Call usecase to get teacher data
	user, err := h.studUC.GetMyProfile(c.Request.Context(), userUUID.(string))
	if err != nil {
		utils.PrintLogInfo(&name, 500, "GetMyProfile", &err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   err.Error(),
			"message": "Failed to Get My Profile",
		})
		return
	}

	utils.PrintLogInfo(&name, 200, "GetMyProfile", nil)
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    user,
	})
}

func (h *StudentHandler) UpdateStudentData(c *gin.Context) {
	name := utils.GetAPIHitter(c)
	userUUID, exists := c.Get("userUUID")
	if !exists {
		utils.PrintLogInfo(&name, 401, "UpdateStudentData", nil)
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "Unauthorized: missing user context",
			"message": "Failed to Update Student Data",
		})
		return
	}

	var payload dto.UpdateStudentDataRequest
	if err := c.ShouldBindJSON(&payload); err != nil {
		utils.PrintLogInfo(&name, 400, "UpdateStudentData", &err)
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   utils.TranslateValidationError(err),
			"message": "Invalid request payload",
		})
		return
	}

	filteredPayload := dto.MapUpdateStudentRequestByStudent(&payload)
	err := h.studUC.UpdateStudentData(c.Request.Context(), userUUID.(string), filteredPayload)
	if err != nil {
		utils.PrintLogInfo(&name, 500, "UpdateStudentData", &err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   err.Error(),
			"message": "Failed to Update Student Data",
		})
		return
	}

	utils.PrintLogInfo(&name, 200, "UpdateStudentData", nil)
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Student Data Updated Successfully",
	})
}
