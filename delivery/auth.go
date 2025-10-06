package delivery

import (
	"chronosphere/config"
	"chronosphere/domain"
	"chronosphere/utils"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	authUC domain.AuthUseCase
}

func NewAuthHandler(r *gin.Engine, authUC domain.AuthUseCase) {
	handler := &AuthHandler{authUC: authUC}

	auth := r.Group("/auth")
	{
		auth.POST("/register", handler.Register)
		auth.POST("/verify-otp", handler.VerifyOTP)
		auth.POST("/login", handler.Login)
		auth.POST("/forgot-password", handler.ForgotPassword)
		auth.POST("/reset-password", handler.ResetPassword)
		auth.POST("/resend-otp", handler.ResendOTP)

		// Protected route
		auth.Use(config.AuthMiddleware(handler.authUC.GetAccessTokenManager()))
		auth.POST("/change-password", handler.ChangePassword)
	}

}

type ResendOTPRequest struct {
	Email string `json:"email" binding:"required,email"`
}

func (h *AuthHandler) ResendOTP(c *gin.Context) {
	var req ResendOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request",
			"error":   err.Error(),
		})
		return
	}

	if err := h.authUC.ResendOTP(c.Request.Context(), req.Email); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to resend OTP",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "OTP resent successfully",
	})
}

type ChangePasswordRequest struct {
	OldPassword string `json:"old_password" binding:"required"`
	NewPassword string `json:"new_password" binding:"required"`
}

type RegisterRequest struct {
	Name     string `json:"name" binding:"required,min=3,max=50"`
	Phone    string `json:"phone" binding:"required,min=10,max=14,numeric"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8,max=64"`
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		fmt.Println(req)
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request payload",
			"error":   utils.TranslateValidationError(err),
		})
		return
	}

	// role hardcoded student
	if err := h.authUC.Register(
		c.Request.Context(),
		req.Email,
		req.Name,
		req.Phone,
		req.Password,
	); err != nil {
		c.JSON(http.StatusConflict, gin.H{
			"success": false,
			"message": "Failed to register",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "OTP sent to your email",
	})
}

type VerifyOTPRequest struct {
	Email string `json:"email" binding:"required,email"`
	OTP   string `json:"otp" binding:"required"`
}

func (h *AuthHandler) VerifyOTP(c *gin.Context) {
	var req VerifyOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid request",
			"success": false,
			"error":   err.Error()})
		return
	}
	if err := h.authUC.VerifyOTP(c.Request.Context(), req.Email, req.OTP); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"message": "Failed to verify OTP",
			"success": false,
			"error":   err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "User created successfully"})
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid request",
			"success": false,
			"error":   err.Error()})
		return
	}

	tokens, err := h.authUC.Login(c.Request.Context(), req.Email, req.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"message": "Login failed",
			"success": false,
			"error":   err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":       true,
		"access_token":  tokens.AccessToken,
		"refresh_token": tokens.RefreshToken,
		"message":       "Login successful"})
}

type ForgotPasswordRequest struct {
	Email string `json:"email" binding:"required,email"`
}

type ResetPasswordRequest struct {
	Email       string `json:"email" binding:"required,email"`
	OTP         string `json:"otp" binding:"required"`
	NewPassword string `json:"new_password" binding:"required"`
}

func (h *AuthHandler) ForgotPassword(c *gin.Context) {
	var req ForgotPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request",
			"error":   err.Error()})
		return
	}

	if err := h.authUC.ForgotPassword(c.Request.Context(), req.Email); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to process request",
			"error":   err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "OTP sent for reset password"})
}

func (h *AuthHandler) ResetPassword(c *gin.Context) {
	var req ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request",
			"error":   err.Error()})
		return
	}

	if err := h.authUC.ResetPassword(c.Request.Context(), req.Email, req.OTP, req.NewPassword); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Failed to reset password",
			"error":   err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Password reset successfully"})
}

func (h *AuthHandler) ChangePassword(c *gin.Context) {
	var req ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request",
			"error":   err.Error()})
		return
	}

	userUUID, exists := c.Get("userUUID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Failed to get user from context",
			"error":   "unauthorized"})
		return
	}

	if err := h.authUC.ChangePassword(c.Request.Context(), userUUID.(string), req.OldPassword, req.NewPassword); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Failed to change password",
			"error":   err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Password changed successfully"})
}
