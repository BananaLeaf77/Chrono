// domain/auth.go
package domain

import (
	"chronosphere/utils"
	"context"
)

type AuthUseCase interface {
	GetAccessTokenManager() *utils.JWTManager
	Register(ctx context.Context, email string, name string, telephone string, password string) error
	VerifyOTP(ctx context.Context, email, otp string) error
	Login(ctx context.Context, email, password string) (*AuthTokens, error)
	ForgotPassword(ctx context.Context, email string) error
	ResetPassword(ctx context.Context, email, otp, newPassword string) error
	ChangePassword(ctx context.Context, userUUID, oldPassword, newPassword string) error
}

type AuthTokens struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
}
