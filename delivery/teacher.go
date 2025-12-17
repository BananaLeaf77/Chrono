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
	"gorm.io/gorm"
)

type TeacherHandler struct {
	tc domain.TeacherUseCase ``
}

func NewTeacherHandler(app *gin.Engine, tc domain.TeacherUseCase, jwtManager *utils.JWTManager, db *gorm.DB) {
	h := &TeacherHandler{tc: tc}

	teacher := app.Group("/teacher")
	teacher.Use(config.AuthMiddleware(jwtManager), middleware.TeacherAndAdminOnly(), middleware.ValidateTurnedOffUserMiddleware(db))
	{
		teacher.GET("/profile", h.GetMyProfile)
		teacher.GET("/schedules", h.GetMySchedules)
		teacher.PUT("/modify", h.UpdateTeacherData)
		teacher.POST("/create-available-class", h.AddAvailability)
		teacher.DELETE("/delete-available-class/:id", h.DeleteAddAvailability)
		teacher.GET("/booked", h.GetAllBookedClass)
		teacher.GET("/class-history", h.GetMyClassHistory)
		teacher.DELETE("/cancel/:id", h.CancelBookedClass)
		teacher.PUT("/finish-class/:id", h.FinishClass)
		teacher.DELETE("/delete-availability-by-day/:day", h.DeleteAvailabilityBasedOnDay)

	}
}

func (h *TeacherHandler) DeleteAvailabilityBasedOnDay(c *gin.Context) {
	name := utils.GetAPIHitter(c)
	userUUID, exists := c.Get("userUUID")
	if !exists {
		utils.PrintLogInfo(&name, http.StatusUnauthorized, "DeleteAvailabilityBasedOnDay", nil)
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "Unauthorized: missing user context",
			"message": "Failed to delete availability based on day",
		})
		return
	}

	dayOfWeek := c.Param("day")

	err := h.tc.DeleteAvailabilityBasedOnDay(c.Request.Context(), userUUID.(string), dayOfWeek)
	if err != nil {
		utils.PrintLogInfo(&name, http.StatusInternalServerError, "DeleteAvailabilityBasedOnDay", &err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   err.Error(),
			"message": "Failed to delete availability based on day",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": fmt.Sprintf("Successfully deleted availability for %s", dayOfWeek),
	})
}

func (h *TeacherHandler) GetMyClassHistory(c *gin.Context) {
	name := utils.GetAPIHitter(c)
	userUUID, exists := c.Get("userUUID")
	if !exists {
		utils.PrintLogInfo(&name, http.StatusUnauthorized, "GetMyClassHistory", nil)
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "Unauthorized: missing user context",
			"message": "Failed to finish class",
		})
		return
	}

	teacherUUID := userUUID.(string)
	data, err := h.tc.GetMyClassHistory(c.Request.Context(), teacherUUID)
	if err != nil {
		utils.PrintLogInfo(&name, http.StatusInternalServerError, "GetMyClassHistory", &err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   err.Error(),
			"message": "Failed to get class history",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    data,
	})
}

func (h *TeacherHandler) FinishClass(c *gin.Context) {
	name := utils.GetAPIHitter(c)

	// ✅ Get teacher UUID from context
	uuidVal, exists := c.Get("userUUID")
	if !exists {
		utils.PrintLogInfo(&name, http.StatusUnauthorized, "FinishClass - MissingUserUUID", nil)
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "Unauthorized: missing user context",
			"message": "Failed to finish class",
		})
		return
	}
	teacherUUID := uuidVal.(string)

	// ✅ Parse booking ID from URL param
	bookingID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		utils.PrintLogInfo(&name, http.StatusBadRequest, "FinishClass - InvalidBookingID", &err)
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid booking ID",
			"message": "Failed to finish class",
		})
		return
	}

	// ✅ Bind JSON body to DTO
	var req dto.FinishClassRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.PrintLogInfo(&name, http.StatusBadRequest, "FinishClass - BindJSON", &err)
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   utils.TranslateValidationError(err),
			"message": "Failed to finish class",
		})
		return
	}

	// ✅ Map DTO → domain model (this now returns error)
	payload, err := dto.MapFinishClassRequestToClassHistory(&req, bookingID, teacherUUID)
	if err != nil {
		utils.PrintLogInfo(&name, http.StatusBadRequest, "FinishClass - MapDTO", &err)
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   err.Error(),
			"message": "Failed to finish class",
		})
		return
	}

	// ✅ Call usecase
	if err := h.tc.FinishClass(c.Request.Context(), bookingID, teacherUUID, payload); err != nil {
		status := http.StatusInternalServerError

		// Determine appropriate status code
		errorMsg := err.Error()
		if strings.Contains(errorMsg, "tidak ditemukan") ||
			strings.Contains(errorMsg, "tidak memiliki akses") {
			status = http.StatusForbidden
		} else if strings.Contains(errorMsg, "sudah selesai") ||
			strings.Contains(errorMsg, "belum selesai") {
			status = http.StatusBadRequest
		}

		utils.PrintLogInfo(&name, status, "FinishClass - UseCase", &err)
		c.JSON(status, gin.H{
			"success": false,
			"error":   errorMsg,
			"message": "Failed to finish class",
		})
		return
	}

	// ✅ Success
	utils.PrintLogInfo(&name, http.StatusOK, "FinishClass", nil)
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Class finished successfully",
	})
}

func (h *TeacherHandler) CancelBookedClass(c *gin.Context) {
	name := utils.GetAPIHitter(c)
	userUUID, exists := c.Get("userUUID")
	if !exists {
		utils.PrintLogInfo(&name, 401, "CancelBookedClass", nil)
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "Unauthorized: missing user context",
			"message": "Failed to cancel booked class",
		})
		return
	}

	// 🔹 Parse booking_id
	bookid := c.Param("id")
	convertedID, err := strconv.Atoi(bookid)
	if err != nil {
		utils.PrintLogInfo(&name, 400, "CancelBookedClass", &err)
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid booking ID parameter",
			"message": "Failed to cancel booked class",
		})
		return
	}

	// 🔹 Parse request body for optional reason
	var req dto.CancelBookingRequest
	if err := c.ShouldBindJSON(&req); err != nil && err.Error() != "EOF" {
		utils.PrintLogInfo(&name, 400, "CancelBookedClass", &err)
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request body",
			"message": "Failed to cancel booked class",
		})
		return
	}

	if req.Reason != nil && len(*req.Reason) == 0 {
		req.Reason = nil
	}

	// 🔹 Call use case with reason
	err = h.tc.CancelBookedClass(c.Request.Context(), convertedID, userUUID.(string), req.Reason)
	if err != nil {
		utils.PrintLogInfo(&name, 500, "CancelBookedClass", &err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   err.Error(),
			"message": "Failed to cancel booked class",
		})
		return
	}

	utils.PrintLogInfo(&name, 200, "CancelBookedClass", nil)
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Booked class cancelled successfully",
	})
}

func (h *TeacherHandler) GetAllBookedClass(c *gin.Context) {
	name := utils.GetAPIHitter(c)
	uuid, theBool := c.Get("userUUID")
	if !theBool {
		utils.PrintLogInfo(&name, 401, "GetAllBookedClass", nil)
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "Unauthorized: missing user context",
			"message": "Failed to Get All Booked Class",
		})
		return
	}

	bookedClasses, err := h.tc.GetAllBookedClass(c.Request.Context(), uuid.(string))
	if err != nil {
		utils.PrintLogInfo(&name, 500, "GetAllBookedClass", &err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   err.Error(),
			"message": "Failed to Get All Booked Class",
		})
		return
	}

	utils.PrintLogInfo(&name, 200, "GetAllBookedClass", nil)
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    bookedClasses,
	})
}

func (h *TeacherHandler) AddAvailability(c *gin.Context) {
	name := utils.GetAPIHitter(c)

	var req dto.AddMultipleAvailabilityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.PrintLogInfo(&name, 400, "AddAvailability - BindJSON", &err)
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Failed to add availability",
			"error":   utils.TranslateValidationError(err),
		})
		return
	}

	// Extract teacher UUID from JWT token
	teacherUUID, exists := c.Get("userUUID")
	if !exists {
		utils.PrintLogInfo(&name, 401, "AddAvailability - MissingUserUUID", nil)
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Failed to add availability",
			"error":   "Unauthorized: missing user context",
		})
		return
	}

	teacherID := teacherUUID.(string)

	// Convert DTO to domain models with validation
	schedules, err := h.convertToTeacherSchedules(teacherID, req.SlotsAvailability)
	if err != nil {
		utils.PrintLogInfo(&name, 400, "AddAvailability - ConvertDTO", &err)
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Failed to add availability",
			"error":   err.Error(),
		})
		return
	}

	ctx := c.Request.Context()

	// Call the use case with the converted domain models
	if err := h.tc.AddAvailability(ctx, &schedules); err != nil {
		statusCode := http.StatusInternalServerError
		errorMsg := err.Error()

		// Better error handling for specific cases
		if strings.Contains(errorMsg, "invalid") ||
			strings.Contains(errorMsg, "duplicate") ||
			strings.Contains(errorMsg, "overlapping") ||
			strings.Contains(errorMsg, "must be exactly 1 hour") ||
			strings.Contains(errorMsg, "between 07:00 and 22:00") {
			statusCode = http.StatusBadRequest
		}

		utils.PrintLogInfo(&name, statusCode, "AddAvailability - UseCaseError", &err)
		c.JSON(statusCode, gin.H{
			"success": false,
			"message": "Failed to add availability",
			"error":   errorMsg,
		})
		return
	}

	utils.PrintLogInfo(&name, 201, "AddAvailability - Success", nil)
	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": fmt.Sprintf("Berhasil menambahkan %d slot jadwal tersedia.", len(schedules)),
		"data": gin.H{
			"total_slots_added": len(schedules),
			"teacher_uuid":      teacherID,
		},
	})
}

// Helper function to convert DTO to domain models with strict validation
func (h *TeacherHandler) convertToTeacherSchedules(teacherUUID string, slots []dto.SlotsAvailability) ([]domain.TeacherSchedule, error) {
	var schedules []domain.TeacherSchedule
	uniqueSlots := make(map[string]bool)

	for _, slotGroup := range slots {
		// Parse times once per slot group
		startTime, err := time.Parse("15:04", slotGroup.StartTime)
		if err != nil {
			return nil, fmt.Errorf("invalid start_time format '%s'", slotGroup.StartTime)
		}

		endTime, err := time.Parse("15:04", slotGroup.EndTime)
		if err != nil {
			return nil, fmt.Errorf("invalid end_time format '%s'", slotGroup.EndTime)
		}

		// ✅ STRICT: Validate exactly 1-hour duration
		if endTime.Sub(startTime) != time.Hour {
			return nil, fmt.Errorf("time slot must be exactly 1 hour, got %s - %s", slotGroup.StartTime, slotGroup.EndTime)
		}

		// ✅ Validate business hours (7:00 - 22:00)
		if startTime.Hour() < 7 || endTime.Hour() > 22 {
			return nil, fmt.Errorf("time slot %s - %s must be between 07:00 and 22:00", slotGroup.StartTime, slotGroup.EndTime)
		}

		// Create schedules for each day in the group
		for _, day := range slotGroup.DayOfTheWeek {
			// Check for duplicate slots in the request
			slotKey := fmt.Sprintf("%s-%s-%s", day, slotGroup.StartTime, slotGroup.EndTime)
			if uniqueSlots[slotKey] {
				return nil, fmt.Errorf("duplicate time slot: %s %s-%s", day, slotGroup.StartTime, slotGroup.EndTime)
			}
			uniqueSlots[slotKey] = true

			// Convert day to title case (e.g., "senin" -> "Senin")
			dayTitleCase := cases.Title(language.Indonesian).String(day)

			// Create domain schedule
			schedule := domain.TeacherSchedule{
				TeacherUUID: teacherUUID,
				DayOfWeek:   dayTitleCase,
				StartTime:   startTime,
				EndTime:     endTime,
				IsBooked:    false,
				CreatedAt:   time.Now(),
				UpdatedAt:   time.Now(),
			}

			schedules = append(schedules, schedule)
		}
	}

	return schedules, nil
}

func (th *TeacherHandler) GetMySchedules(c *gin.Context) {
	name := utils.GetAPIHitter(c)
	userUUID, exists := c.Get("userUUID")
	if !exists {
		utils.PrintLogInfo(&name, 401, "GetMySchedules", nil)
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "Unauthorized: missing user context",
			"message": "Failed to Get My Schedules",
		})
		return
	}

	teacherSchedules, err := th.tc.GetMySchedules(c.Request.Context(), userUUID.(string))
	if err != nil {
		utils.PrintLogInfo(&name, 500, "GetMySchedules", &err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   err.Error(),
			"message": "Failed to Get My Schedules",
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
			"error":   "Unauthorized: missing user context",
			"message": "Failed to Get My Profile",
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

func (th *TeacherHandler) UpdateTeacherData(c *gin.Context) {
	name := utils.GetAPIHitter(c)
	userUUID, exists := c.Get("userUUID")

	if !exists {
		utils.PrintLogInfo(&name, 401, "GetMyProfile", nil)
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "Unauthorized: missing user context",
			"message": "Failed to Update Teacher Data",
		})
		return
	}
	var req dto.UpdateTeacherProfileRequestByTeacher

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.PrintLogInfo(&name, 400, "UpdateTeacher - BindJSON", &err)
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   utils.TranslateValidationError(err),
			"message": "Failed to Update Teacher Data",
		})
		return
	}

	filtered := dto.MapCreateTeacherRequestToUserByTeacher(&req)

	if err := th.tc.UpdateTeacherData(c.Request.Context(), userUUID.(string), filtered); err != nil {
		utils.PrintLogInfo(&name, 500, "UpdateTeacher - UseCase", &err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   utils.TranslateDBError(err),
			"message": "Failed to Update Teacher Data",
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
			"message": "Failed to Delete Availability",
			"error":   "Unauthorized: missing user context",
		})
		return
	}

	scheduleID := c.Param("id")
	convertedID, err := strconv.Atoi(scheduleID)
	if err != nil {
		utils.PrintLogInfo(&name, 400, "DeleteAddAvailability - InvalidID", &err)
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Failed to Delete Availability",
			"error":   "atoi failure",
		})
		return
	}

	if err := th.tc.DeleteAvailability(c.Request.Context(), convertedID, userUUID.(string)); err != nil {
		utils.PrintLogInfo(&name, 500, "DeleteAddAvailability - UseCase", &err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   utils.TranslateDBError(err),
			"message": "Failed to Delete Availability",
		})
		return
	}

	utils.PrintLogInfo(&name, 200, "DeleteAddAvailability", nil)
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Availability deleted successfully",
	})
}
