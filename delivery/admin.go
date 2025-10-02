package delivery

import (
	"chronosphere/config"
	"chronosphere/domain"
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
		admin.PUT("/teachers/:uuid/profile", h.UpdateTeacherProfile)
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
		admin.PUT("/packages/:id", h.UpdatePackage)
		admin.DELETE("/packages/:id", h.DeletePackage)
		admin.GET("/packages", h.GetAllPackages)

		// Instruments
		admin.POST("/instruments", h.CreateInstrument)
		admin.PUT("/instruments/:id", h.UpdateInstrument)
		admin.DELETE("/instruments/:id", h.DeleteInstrument)
		admin.GET("/instruments", h.GetAllInstruments)

		// Assign package to student
		admin.POST("/assign-package", h.AssignPackageToStudent)
	}
}

/* ---------- Request DTOs ---------- */

type CreateTeacherRequest struct {
	Name     string  `json:"name" binding:"required"`
	Email    string  `json:"email" binding:"required,email"`
	Phone    string  `json:"phone" binding:"required"`
	Password string  `json:"password" binding:"required"`
	Image    *string `json:"image,omitempty"`
}

type UpdateTeacherProfileRequest struct {
	UserUUID string  `json:"user_uuid" binding:"required"`
	Bio      *string `json:"bio,omitempty"`
	// instruments could be names or ids; keep it simple for now
}

type CreatePackageRequest struct {
	Name  string `json:"name" binding:"required"`
	Quota int    `json:"quota" binding:"required,min=1"`
}

type UpdatePackageRequest struct {
	Name  *string `json:"name,omitempty"`
	Quota *int    `json:"quota,omitempty"`
}

type CreateInstrumentRequest struct {
	Name string `json:"name" binding:"required"`
}

type UpdateInstrumentRequest struct {
	Name *string `json:"name,omitempty"`
}

type AssignPackageRequest struct {
	StudentUUID string `json:"student_uuid" binding:"required,uuid"`
	PackageID   int    `json:"package_id" binding:"required"`
}

/* ---------- Handlers ---------- */

func (h *AdminHandler) CreateTeacher(c *gin.Context) {
	var req CreateTeacherRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.PrintLogInfo(nil, 400, "CreateTeacher - BindJSON")
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	user := &domain.User{
		Name:     req.Name,
		Email:    req.Email,
		Phone:    req.Phone,
		Password: req.Password,
		Role:     domain.RoleTeacher,
		Image:    req.Image,
	}

	created, err := h.uc.CreateTeacher(c.Request.Context(), user)
	if err != nil {
		utils.PrintLogInfo(&req.Email, 500, "CreateTeacher - UseCase")
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"success": true, "data": created})
}

func (h *AdminHandler) UpdateTeacherProfile(c *gin.Context) {
	var req UpdateTeacherProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.PrintLogInfo(nil, 400, "UpdateTeacherProfile - BindJSON")
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	profile := &domain.TeacherProfile{
		UserUUID: req.UserUUID,
	}
	if req.Bio != nil {
		profile.Bio = *req.Bio
	}

	if err := h.uc.UpdateTeacherProfile(c.Request.Context(), profile); err != nil {
		utils.PrintLogInfo(&req.UserUUID, 500, "UpdateTeacherProfile - UseCase")
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	utils.PrintLogInfo(&req.UserUUID, 200, "UpdateTeacherProfile")
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Teacher profile updated"})
}

func (h *AdminHandler) AssignPackageToStudent(c *gin.Context) {
	var req AssignPackageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.PrintLogInfo(nil, 400, "AssignPackageToStudent - BindJSON")
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	if err := h.uc.AssignPackageToStudent(c.Request.Context(), req.StudentUUID, req.PackageID); err != nil {
		utils.PrintLogInfo(&req.StudentUUID, 500, "AssignPackageToStudent - UseCase")
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	utils.PrintLogInfo(&req.StudentUUID, 200, "AssignPackageToStudent")
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Package assigned to student"})
}

func (h *AdminHandler) CreatePackage(c *gin.Context) {
	var req CreatePackageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.PrintLogInfo(nil, 400, "CreatePackage - BindJSON")
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	pkg := &domain.Package{
		Name:  req.Name,
		Quota: req.Quota,
	}

	created, err := h.uc.CreatePackage(c.Request.Context(), pkg)
	if err != nil {
		utils.PrintLogInfo(nil, 500, "CreatePackage - UseCase")
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"success": true, "data": created})
}

func (h *AdminHandler) UpdatePackage(c *gin.Context) {
	idStr := c.Param("id")
	id, _ := strconv.Atoi(idStr)

	var req UpdatePackageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.PrintLogInfo(&idStr, 400, "UpdatePackage - BindJSON")
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
		utils.PrintLogInfo(&idStr, 500, "UpdatePackage - UseCase")
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	utils.PrintLogInfo(&idStr, 200, "UpdatePackage")
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Package updated"})
}

func (h *AdminHandler) DeletePackage(c *gin.Context) {
	idStr := c.Param("id")
	id, _ := strconv.Atoi(idStr)
	if err := h.uc.DeletePackage(c.Request.Context(), id); err != nil {
		utils.PrintLogInfo(&idStr, 500, "DeletePackage - UseCase")
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}
	utils.PrintLogInfo(&idStr, 200, "DeletePackage")
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Package deleted"})
}

func (h *AdminHandler) CreateInstrument(c *gin.Context) {
	var req CreateInstrumentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.PrintLogInfo(nil, 400, "CreateInstrument - BindJSON")
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	inst := &domain.Instrument{Name: req.Name}
	created, err := h.uc.CreateInstrument(c.Request.Context(), inst)
	if err != nil {
		utils.PrintLogInfo(nil, 500, "CreateInstrument - UseCase")
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"success": true, "data": created})
}

func (h *AdminHandler) UpdateInstrument(c *gin.Context) {
	idStr := c.Param("id")
	id, _ := strconv.Atoi(idStr)

	var req UpdateInstrumentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.PrintLogInfo(&idStr, 400, "UpdateInstrument - BindJSON")
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	inst := &domain.Instrument{ID: id}
	if req.Name != nil {
		inst.Name = *req.Name
	}

	if err := h.uc.UpdateInstrument(c.Request.Context(), inst); err != nil {
		utils.PrintLogInfo(&idStr, 500, "UpdateInstrument - UseCase")
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	utils.PrintLogInfo(&idStr, 200, "UpdateInstrument")
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Instrument updated"})
}

func (h *AdminHandler) DeleteInstrument(c *gin.Context) {
	idStr := c.Param("id")
	id, _ := strconv.Atoi(idStr)
	if err := h.uc.DeleteInstrument(c.Request.Context(), id); err != nil {
		utils.PrintLogInfo(&idStr, 500, "DeleteInstrument - UseCase")
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}
	utils.PrintLogInfo(&idStr, 200, "DeleteInstrument")
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Instrument deleted"})
}

func (h *AdminHandler) GetAllPackages(c *gin.Context) {
	pkgs, err := h.uc.GetAllPackages(c.Request.Context())
	if err != nil {
		utils.PrintLogInfo(nil, 500, "GetAllPackages - UseCase")
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": pkgs})
}

func (h *AdminHandler) GetAllInstruments(c *gin.Context) {
	insts, err := h.uc.GetAllInstruments(c.Request.Context())
	if err != nil {
		utils.PrintLogInfo(nil, 500, "GetAllInstruments - UseCase")
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": insts})
}

func (h *AdminHandler) GetAllUsers(c *gin.Context) {
	users, err := h.uc.GetAllUsers(c.Request.Context())
	if err != nil {
		utils.PrintLogInfo(nil, 500, "GetAllUsers - UseCase")
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": users})
}

func (h *AdminHandler) GetAllTeachers(c *gin.Context) {
	teachers, err := h.uc.GetAllTeachers(c.Request.Context())
	if err != nil {
		utils.PrintLogInfo(nil, 500, "GetAllTeachers - UseCase")
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": teachers})
}

func (h *AdminHandler) GetAllStudents(c *gin.Context) {
	students, err := h.uc.GetAllStudents(c.Request.Context())
	if err != nil {
		utils.PrintLogInfo(nil, 500, "GetAllStudents - UseCase")
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": students})
}

func (h *AdminHandler) GetStudentByUUID(c *gin.Context) {
	uuid := c.Param("uuid")
	student, err := h.uc.GetStudentByUUID(c.Request.Context(), uuid)
	if err != nil {
		utils.PrintLogInfo(&uuid, 500, "GetStudentByUUID - UseCase")
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": student})
}

func (h *AdminHandler) GetTeacherByUUID(c *gin.Context) {
	uuid := c.Param("uuid")
	teacher, err := h.uc.GetTeacherByUUID(c.Request.Context(), uuid)
	if err != nil {
		utils.PrintLogInfo(&uuid, 500, "GetTeacherByUUID - UseCase")
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": teacher})
}

func (h *AdminHandler) DeleteUser(c *gin.Context) {
	uuid := c.Param("uuid")
	if err := h.uc.DeleteUser(c.Request.Context(), uuid); err != nil {
		utils.PrintLogInfo(&uuid, 500, "DeleteUser - UseCase")
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}
	utils.PrintLogInfo(&uuid, 200, "DeleteUser")
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "User deleted"})
}
