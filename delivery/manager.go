package delivery

import (
	"chronosphere/config"
	"chronosphere/domain"
	"chronosphere/middleware"
	"chronosphere/utils"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type ManagerHandler struct {
	uc domain.ManagerUseCase
}

func NewManagerHandler(app *gin.Engine, uc domain.ManagerUseCase, jwtManager *utils.JWTManager, db *gorm.DB) {
	h := &ManagerHandler{uc: uc}

	manager := app.Group("/manager")
	manager.Use(config.AuthMiddleware(jwtManager), middleware.ManagerAndAdminOnly(), middleware.ValidateTurnedOffUserMiddleware(db))
	{
		manager.GET("/students", h.GetAllStudents)
		manager.GET("/students/:uuid", h.GetStudentByUUID)
		manager.PUT("/students/:uuid/packages/:package_id/quota", h.ModifyStudentPackageQuota)
	}
}

func (h *ManagerHandler) GetAllStudents(c *gin.Context) {
	name := utils.GetAPIHitter(c)
	students, err := h.uc.GetAllStudents(c.Request.Context())
	if err != nil {
		utils.PrintLogInfo(&name, 500, "GetAllStudents - UseCase", &err)
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error(), "message": "Failed to retrieve students"})
		return
	}
	utils.PrintLogInfo(&name, 200, "GetAllStudents", nil)
	c.JSON(http.StatusOK, gin.H{"success": true, "data": students, "message": "Students retrieved successfully"})
}

func (h *ManagerHandler) GetStudentByUUID(c *gin.Context) {
	name := utils.GetAPIHitter(c)
	uuid := c.Param("uuid")
	student, err := h.uc.GetStudentByUUID(c.Request.Context(), uuid)
	if err != nil {
		utils.PrintLogInfo(&name, 500, "GetStudentByUUID - UseCase", &err)
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error(), "message": "Failed to retrieve student"})
		return
	}

	utils.PrintLogInfo(&name, 200, "GetStudentByUUID", nil)
	c.JSON(http.StatusOK, gin.H{"success": true, "data": student, "message": "Student retrieved successfully"})
}

func (h *ManagerHandler) ModifyStudentPackageQuota(c *gin.Context) {
	name := utils.GetAPIHitter(c)

	studentUUID := c.Param("uuid")
	packageID, err := strconv.Atoi(c.Param("package_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Failed to modify student quota", "error": "Invalid package ID"})
		return
	}

	var req struct {
		IncomingQuota int `json:"incoming_quota" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.PrintLogInfo(&name, 400, "ModifyStudentPackageQuota - BindJSON", &err)
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   utils.TranslateValidationError(err),
			"message": "Failed to modify student quota",
		})
		return
	}

	if err := h.uc.ModifyStudentPackageQuota(c.Request.Context(), studentUUID, packageID, req.IncomingQuota); err != nil {
		utils.PrintLogInfo(&name, 500, "ModifyStudentPackageQuota - UseCase", &err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   err.Error(),
			"message": "Failed to modify student quota",
		})
		return
	}

	utils.PrintLogInfo(&name, 200, "ModifyStudentPackageQuota", nil)
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Package quota modified successfully",
	})
}
