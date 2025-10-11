package delivery

import (
	"chronosphere/config"
	"chronosphere/domain"
	"chronosphere/dto"
	"chronosphere/middleware"
	"chronosphere/utils"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// AdminHandler handles admin routes
type AdminHandler struct {
	uc domain.AdminUseCase
}

func NewAdminHandler(app *gin.Engine, uc domain.AdminUseCase, jwtManager *utils.JWTManager) {
	h := &AdminHandler{uc: uc}

	admin := app.Group("/admin")
	admin.Use(config.AuthMiddleware(jwtManager), middleware.AdminOnly())
	{
		// Teacher
		admin.POST("/teachers", h.CreateTeacher)
		admin.PUT("/teachers/modify/:uuid", h.UpdateTeacher)
		admin.GET("/teachers", h.GetAllTeachers)
		admin.GET("/teachers/:uuid", h.GetTeacherByUUID)

		// Student
		admin.GET("/students", h.GetAllStudents)
		admin.GET("/students/:uuid", h.GetStudentByUUID)

		// Users
		admin.GET("/users", h.GetAllUsers)
		admin.DELETE("/users/:uuid", h.DeleteUser)

		// Packages
		admin.POST("/packages", h.CreatePackage)
		admin.PUT("/packages/modify/:id", h.UpdatePackage)
		admin.DELETE("/packages/:id", h.DeletePackage)
		admin.GET("/packages", h.GetAllPackages)

		// Instruments
		admin.POST("/instruments", h.CreateInstrument)
		admin.PUT("/instruments/modify/:id", h.UpdateInstrument)
		admin.DELETE("/instruments/:id", h.DeleteInstrument)
		admin.GET("/instruments", h.GetAllInstruments)

		// Assign package to student
		admin.POST("/assign-package", h.AssignPackageToStudent)
	}
}

/* ---------- Request DTOs ---------- */
type CreatePackageRequest struct {
	Name  string `json:"name" binding:"required"`
	Quota int    `json:"quota" binding:"required,min=1"`
}

type UpdatePackageRequest struct {
	Name  *string `json:"name,omitempty"`
	Quota *int    `json:"quota,omitempty"`
}

type CreateInstrumentRequest struct {
	Name string `json:"name" binding:"required,min=1,max=30"`
}

type UpdateInstrumentRequest struct {
	Name string `json:"name" binding:"required,min=1,max=30"`
}

type AssignPackageRequest struct {
	StudentUUID string `json:"student_uuid" binding:"required,uuid"`
	PackageID   int    `json:"package_id" binding:"required"`
}

/* ---------- Handlers ---------- */

// TEACHER MANAGEMENT
func (h *AdminHandler) CreateTeacher(c *gin.Context) {
	var req dto.CreateTeacherRequest // pakai DTO
	adminName := utils.GetAPIHitter(c)

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.PrintLogInfo(&adminName, 400, "CreateTeacher - BindJSON", &err)
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   utils.TranslateValidationError(err),
		})
		return
	}

	user := dto.MapCreateTeacherRequestToUser(&req)

	// ✅ panggil dengan instrumentIDs
	created, err := h.uc.CreateTeacher(c.Request.Context(), user, req.InstrumentIDs)
	if err != nil {
		utils.PrintLogInfo(&adminName, 500, "CreateTeacher - UseCase", &err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   utils.TranslateDBError(err),
		})
		return
	}

	utils.PrintLogInfo(&adminName, 201, "CreateTeacher", nil)
	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    created,
	})
}

func (h *AdminHandler) UpdateTeacher(c *gin.Context) {
	uuid := c.Param("uuid") // ambil UUID dari URL
	var req dto.UpdateTeacherProfileRequest
	adminName := utils.GetAPIHitter(c)

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.PrintLogInfo(&adminName, 400, "UpdateTeacher - BindJSON", &err)
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   utils.TranslateValidationError(err),
		})
		return
	}

	user := dto.MapUpdateTeacherRequestToUser(&req)
	utils.PrintDTO("user to update", user)
	user.UUID = uuid // assign dari URL, bukan dari JSON

	if err := h.uc.UpdateTeacher(c.Request.Context(), user, req.InstrumentIDs); err != nil {
		utils.PrintLogInfo(&adminName, 500, "UpdateTeacher - UseCase", &err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   utils.TranslateDBError(err),
		})
		return
	}

	utils.PrintLogInfo(&adminName, 200, "UpdateTeacher", nil)
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Teacher profile updated",
	})
}

func (h *AdminHandler) GetAllTeachers(c *gin.Context) {
	teachers, err := h.uc.GetAllTeachers(c.Request.Context())
	if err != nil {
		utils.PrintLogInfo(nil, 500, "GetAllTeachers - UseCase", &err)
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}
	utils.PrintLogInfo(nil, 200, "GetAllTeachers", nil)
	c.JSON(http.StatusOK, gin.H{"success": true, "data": teachers})
}

func (h *AdminHandler) GetTeacherByUUID(c *gin.Context) {
	uuid := c.Param("uuid")
	teacher, err := h.uc.GetTeacherByUUID(c.Request.Context(), uuid)
	if err != nil {
		utils.PrintLogInfo(&uuid, 500, "GetTeacherByUUID - UseCase", &err)
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	utils.PrintLogInfo(&uuid, 200, "GetTeacherByUUID", nil)
	c.JSON(http.StatusOK, gin.H{"success": true, "data": teacher})
}

func (h *AdminHandler) DeleteUser(c *gin.Context) {
	uuid := c.Param("uuid")
	if err := h.uc.DeleteUser(c.Request.Context(), uuid); err != nil {
		utils.PrintLogInfo(&uuid, 500, "DeleteUser - UseCase", &err)
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}
	utils.PrintLogInfo(&uuid, 200, "DeleteUser", nil)
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "User deleted"})
}

func (h *AdminHandler) AssignPackageToStudent(c *gin.Context) {
	var req AssignPackageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.PrintLogInfo(nil, 400, "AssignPackageToStudent - BindJSON", &err)
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	if err := h.uc.AssignPackageToStudent(c.Request.Context(), req.StudentUUID, req.PackageID); err != nil {
		utils.PrintLogInfo(&req.StudentUUID, 500, "AssignPackageToStudent - UseCase", &err)
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	utils.PrintLogInfo(&req.StudentUUID, 200, "AssignPackageToStudent", nil)
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Package assigned to student"})
}

func (h *AdminHandler) CreatePackage(c *gin.Context) {
	var req CreatePackageRequest
	name := utils.GetAPIHitter(c)
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.PrintLogInfo(&name, 400, "CreatePackage - BindJSON", &err)
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": utils.TranslateValidationError(err)})
		return
	}

	pkg := &domain.Package{
		Name:  req.Name,
		Quota: req.Quota,
	}

	created, err := h.uc.CreatePackage(c.Request.Context(), pkg)
	if err != nil {
		utils.PrintLogInfo(&name, 500, "CreatePackage - UseCase", &err)
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}
	utils.PrintLogInfo(&name, 201, "CreatePackage", nil)
	c.JSON(http.StatusCreated, gin.H{"success": true, "data": created})
}

func (h *AdminHandler) UpdatePackage(c *gin.Context) {
	idStr := c.Param("id")
	id, _ := strconv.Atoi(idStr)

	var req UpdatePackageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.PrintLogInfo(&idStr, 400, "UpdatePackage - BindJSON", &err)
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	// Get existing package object to update fields (you can also accept full pkg)
	pkg := &domain.Package{ID: id}
	if req.Name != nil {
		pkg.Name = *req.Name
	}
	if req.Quota != nil {
		pkg.Quota = *req.Quota
	}

	if err := h.uc.UpdatePackage(c.Request.Context(), pkg); err != nil {
		utils.PrintLogInfo(&idStr, 500, "UpdatePackage - UseCase", &err)
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	utils.PrintLogInfo(&idStr, 200, "UpdatePackage", nil)
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Package updated"})
}

func (h *AdminHandler) DeletePackage(c *gin.Context) {
	idStr := c.Param("id")
	id, _ := strconv.Atoi(idStr)
	if err := h.uc.DeletePackage(c.Request.Context(), id); err != nil {
		utils.PrintLogInfo(&idStr, 500, "DeletePackage - UseCase", &err)
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}
	utils.PrintLogInfo(&idStr, 200, "DeletePackage", nil)
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Package deleted"})
}

func (h *AdminHandler) CreateInstrument(c *gin.Context) {
	var req CreateInstrumentRequest
	name := utils.GetAPIHitter(c)
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.PrintLogInfo(&name, 400, "CreateInstrument - BindJSON", &err)
		c.JSON(http.StatusBadRequest, gin.H{"message": "Failed to create instrument", "success": false, "error": err.Error()})
		return
	}

	inst := &domain.Instrument{Name: req.Name}
	created, err := h.uc.CreateInstrument(c.Request.Context(), inst)
	if err != nil {
		utils.PrintLogInfo(&name, 500, "CreateInstrument - UseCase", &err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to create instrument", "success": false, "error": err.Error()})
		return
	}
	utils.PrintLogInfo(&name, 201, "CreateInstrument", nil)
	c.JSON(http.StatusCreated, gin.H{"message": "Instrument created successfully", "success": true, "data": created})
}

func (h *AdminHandler) UpdateInstrument(c *gin.Context) {
	name := utils.GetAPIHitter(c)
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		utils.PrintLogInfo(&name, 400, "UpdateInstrument - Atoi", &err)
		c.JSON(http.StatusBadRequest, gin.H{"message": "Failed to update instrument", "success": false, "error": "Invalid instrument ID"})
		return
	}

	var req UpdateInstrumentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.PrintLogInfo(&name, 400, "UpdateInstrument - BindJSON", &err)
		c.JSON(http.StatusBadRequest, gin.H{"message": "Failed to update instrument", "success": false, "error": utils.TranslateValidationError(err)})
		return
	}

	inst := &domain.Instrument{ID: id}
	if req.Name != "" {
		inst.Name = req.Name
	}

	if err := h.uc.UpdateInstrument(c.Request.Context(), inst); err != nil {
		utils.PrintLogInfo(&name, 500, "UpdateInstrument - UseCase", &err)
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	utils.PrintLogInfo(&name, 200, "UpdateInstrument", nil)
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Instrument updated"})
}

func (h *AdminHandler) DeleteInstrument(c *gin.Context) {
	name := utils.GetAPIHitter(c)

	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		utils.PrintLogInfo(&name, 400, "DeleteInstrument - Atoi", &err)
		c.JSON(http.StatusBadRequest, gin.H{"message": "Failed to delete instrument", "success": false, "error": "Invalid instrument ID"})
		return
	}

	if err := h.uc.DeleteInstrument(c.Request.Context(), id); err != nil {
		utils.PrintLogInfo(&name, 500, "DeleteInstrument - UseCase", &err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to delete instrument", "success": false, "error": err.Error()})
		return
	}

	utils.PrintLogInfo(&name, 200, "DeleteInstrument", nil)
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Instrument deleted"})
}

func (h *AdminHandler) GetAllPackages(c *gin.Context) {
	pkgs, err := h.uc.GetAllPackages(c.Request.Context())
	if err != nil {
		utils.PrintLogInfo(nil, 500, "GetAllPackages - UseCase", &err)
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}
	utils.PrintLogInfo(nil, 200, "GetAllPackages", nil)
	c.JSON(http.StatusOK, gin.H{"success": true, "data": pkgs})
}

func (h *AdminHandler) GetAllInstruments(c *gin.Context) {
	name := utils.GetAPIHitter(c)

	insts, err := h.uc.GetAllInstruments(c.Request.Context())
	if err != nil {
		utils.PrintLogInfo(&name, 500, "GetAllInstruments - UseCase", &err)
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}
	utils.PrintLogInfo(&name, 200, "GetAllInstruments", nil)
	c.JSON(http.StatusOK, gin.H{"success": true, "data": insts})
}

func (h *AdminHandler) GetAllUsers(c *gin.Context) {
	users, err := h.uc.GetAllUsers(c.Request.Context())
	if err != nil {
		utils.PrintLogInfo(nil, 500, "GetAllUsers - UseCase", &err)
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}
	utils.PrintLogInfo(nil, 200, "GetAllUsers", nil)
	c.JSON(http.StatusOK, gin.H{"success": true, "data": users})
}

func (h *AdminHandler) GetAllStudents(c *gin.Context) {
	students, err := h.uc.GetAllStudents(c.Request.Context())
	if err != nil {
		utils.PrintLogInfo(nil, 500, "GetAllStudents - UseCase", &err)
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}
	utils.PrintLogInfo(nil, 200, "GetAllStudents", nil)
	c.JSON(http.StatusOK, gin.H{"success": true, "data": students})
}

func (h *AdminHandler) GetStudentByUUID(c *gin.Context) {
	uuid := c.Param("uuid")
	student, err := h.uc.GetStudentByUUID(c.Request.Context(), uuid)
	if err != nil {
		utils.PrintLogInfo(&uuid, 500, "GetStudentByUUID - UseCase", &err)
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}
	utils.PrintLogInfo(&uuid, 200, "GetStudentByUUID", nil)
	c.JSON(http.StatusOK, gin.H{"success": true, "data": student})
}
