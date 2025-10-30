package delivery

import (
	"chronosphere/config"
	"chronosphere/domain"
	"chronosphere/dto"
	"chronosphere/middleware"
	"chronosphere/utils"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/text/cases"
	"golang.org/x/text/language"
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
		teacher.GET("/booked", h.GetAllBookedClass)
		teacher.PUT("/cancel-booked-class/:id", h.CancelBookedClass)

	}
}

func (h *TeacherHandler) GetAllBookedClass(c *gin.Context) {
	name := utils.GetAPIHitter()

}

func (h *TeacherHandler) AddAvailability(c *gin.Context) {
	name := utils.GetAPIHitter(c)

	var req dto.AddAvailabilityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.PrintLogInfo(&name, 400, "AddAvailability - BindJSON", &err)
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   utils.TranslateValidationError(err),
		})
		return
	}

	// ✅ Validate day of week (Indonesian version)
	validDays := map[string]bool{
		"senin":  true,
		"selasa": true,
		"rabu":   true,
		"kamis":  true,
		"jumat":  true,
		"sabtu":  true,
		"minggu": true,
	}

	day := strings.ToLower(strings.TrimSpace(req.DayOfWeek))
	if !validDays[day] {
		utils.PrintLogInfo(&name, 400, "AddAvailability - InvalidDay", nil)
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": fmt.Sprintf("hari tidak sesuai: '%s'. gunakan nama hari yang valid (Senin–Minggu).", req.DayOfWeek),
		})
		return
	}

	teacherUUID, exists := c.Get("userUUID")
	if !exists {
		utils.PrintLogInfo(&name, 401, "GetMyProfile", nil)
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Unauthorized: missing user context",
		})
		return
	}

	for _, startTimeStr := range req.Times {
		startTime, err := time.Parse("15:04", startTimeStr)
		if err != nil {
			utils.PrintLogInfo(&name, 400, "AddAvailability - InvalidTimeFormat", &err)
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": fmt.Sprintf("Format jam tidak valid: %s (gunakan HH:mm, contoh 14:00)", startTimeStr),
			})
			return
		}

		endTime := startTime.Add(1 * time.Hour)

		schedule := &domain.TeacherSchedule{
			TeacherUUID: teacherUUID.(string),
			DayOfWeek:   cases.Title(language.Indonesian).String(day),
			StartTime:   startTime,
			EndTime:     endTime,
		}

		if err := h.tc.AddAvailability(c.Request.Context(), teacherUUID.(string), schedule); err != nil {
			utils.PrintLogInfo(&name, 500, "AddAvailability - UseCase", &err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": err.Error(),
			})
			return
		}
	}

	utils.PrintLogInfo(&name, 200, "AddAvailability", nil)
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Jadwal tersedia berhasil ditambahkan",
	})
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
		"success": true,
		"message": "Fetched schedules successfully",
		"data":    teacherSchedules, // ✅ not &teacherSchedules
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

func (th *TeacherHandler) DeleteAddAvailability(c *gin.Context) {
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

	scheduleID := c.Param("id")
	convertedID, err := strconv.Atoi(scheduleID)
	if err != nil {
		utils.PrintLogInfo(&name, 400, "DeleteAddAvailability - InvalidID", &err)
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "atoi failure",
		})
		return
	}

	if err := th.tc.DeleteAvailability(c.Request.Context(), convertedID, userUUID.(string)); err != nil {
		utils.PrintLogInfo(&name, 500, "DeleteAddAvailability - UseCase", &err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   utils.TranslateDBError(err),
		})
		return
	}

	utils.PrintLogInfo(&name, 200, "DeleteAddAvailability", nil)
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Availability deleted successfully",
	})
}
