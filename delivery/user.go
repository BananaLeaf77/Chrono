package delivery

import (
	"chronosphere/domain"
	"chronosphere/utils"

	"github.com/gin-gonic/gin"
)

type userHandler struct {
	uc domain.UserUseCase
}

func NewUserHandler(app *gin.Engine, uc domain.UserUseCase) {
	handler := &userHandler{uc: uc}

	route := app.Group("/users")
	route.POST("/create", handler.CreateUser)
	route.GET("/all", handler.GetAllUsers)
	route.GET("/:uuid", handler.GetUserByUUID)
	route.PUT("/modify/:uuid", handler.UpdateUser)
	route.DELETE("/delete/:uuid", handler.DeleteUser)
}

func (h *userHandler) CreateUser(c *gin.Context) {
	var user domain.User
	user.Role = "student" // Default role is student
	
	if err := c.ShouldBindJSON(&user); err != nil {
		utils.PrintLogInfo(nil, 400, "CreateUser - BindJSON")
		c.JSON(400, gin.H{
			"success": false,
			"code":    400,
			"message": "Invalid request payload",
			"error":   err.Error()})
		return
	}
	if err := h.uc.CreateUser(c.Request.Context(), &user); err != nil {
		c.JSON(500, gin.H{
			"success": false,
			"code":    500,
			"message": "Failed to create user",
			"error":   err.Error()})
		return
	}

	utils.PrintLogInfo(nil, 201, "CreateUser")
	c.JSON(201, gin.H{"message": "User created successfully", "user": user})
}

func (h *userHandler) GetAllUsers(c *gin.Context) {
	users, err := h.uc.GetAllUsers(c.Request.Context())
	if err != nil {
		utils.PrintLogInfo(nil, 500, "GetAllUsers - UseCase")
		c.JSON(500, gin.H{
			"success": false,
			"code":    500,
			"message": "Failed to retrieve users",
			"error":   err.Error()})
		return
	}
	utils.PrintLogInfo(nil, 200, "GetAllUsers")
	c.JSON(200, gin.H{
		"success": true,
		"code":    200,
		"message": "Users retrieved successfully",
		"data":    users})
}

func (h *userHandler) GetUserByUUID(c *gin.Context) {
	uuid := c.Param("uuid")
	user, err := h.uc.GetUserByUUID(c.Request.Context(), uuid)
	if err != nil {
		utils.PrintLogInfo(&uuid, 500, "GetUserByUUID - UseCase")
		c.JSON(500, gin.H{
			"success": false,
			"code":    500,
			"message": "Failed to retrieve user",
			"error":   err.Error()})
		return
	}
	utils.PrintLogInfo(&uuid, 200, "GetUserByUUID")
	c.JSON(200, gin.H{
		"success": true,
		"code":    200,
		"message": "User retrieved successfully",
		"data":    user})
}

func (h *userHandler) UpdateUser(c *gin.Context) {
	uuid := c.Param("uuid")
	var user domain.User
	if err := c.ShouldBindJSON(&user); err != nil {
		utils.PrintLogInfo(&uuid, 400, "UpdateUser - BindJSON")
		c.JSON(400, gin.H{
			"success": false,
			"code":    400,
			"message": "Invalid request payload",
			"error":   err.Error()})
		return
	}
	user.UUID = uuid
	if err := h.uc.UpdateUser(c.Request.Context(), &user); err != nil {
		utils.PrintLogInfo(&uuid, 500, "UpdateUser - UseCase")
		c.JSON(500, gin.H{
			"success": false,
			"code":    500,
			"message": "Failed to update user",
			"error":   err.Error()})
		return
	}
	utils.PrintLogInfo(&uuid, 200, "UpdateUser")
	c.JSON(200, gin.H{"message": "User updated successfully", "user": user})
}

func (h *userHandler) DeleteUser(c *gin.Context) {
	uuid := c.Param("uuid")
	if err := h.uc.DeleteUser(c.Request.Context(), uuid); err != nil {
		utils.PrintLogInfo(&uuid, 500, "DeleteUser - UseCase")
		c.JSON(500, gin.H{
			"success": false,
			"code":    500,
			"message": "Failed to delete user",
			"error":   err.Error()})
		return
	}
	utils.PrintLogInfo(&uuid, 200, "DeleteUser")
	c.JSON(200, gin.H{"message": "User deleted successfully"})
}
