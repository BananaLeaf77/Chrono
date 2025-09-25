package service

import (
	"chronosphere/domain"
	"chronosphere/utils"
	"context"
	"errors"
	"time"

	"golang.org/x/crypto/bcrypt"
)

type authService struct {
	userRepo     domain.UserRepository
	otpRepo      domain.OTPRepository
	accessToken  *utils.JWTManager
	refreshToken *utils.JWTManager
}

func NewAuthService(userRepo domain.UserRepository, otpRepo domain.OTPRepository, secret string) domain.AuthUseCase {
	return &authService{
		userRepo:     userRepo,
		otpRepo:      otpRepo,
		accessToken:  utils.NewJWTManager(secret, time.Hour),      // 1 jam
		refreshToken: utils.NewJWTManager(secret, 7*24*time.Hour), // 7 hari
	}
}

func (s *authService) Login(ctx context.Context, email, password string) (*domain.AuthTokens, error) {
	user, err := s.userRepo.GetUserByEmail(ctx, email)
	if err != nil {
		return nil, errors.New("invalid credentials")
	}

	if bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)) != nil {
		return nil, errors.New("invalid credentials")
	}

	// generate tokens pakai JWTManager
	accessToken, err := s.accessToken.GenerateToken(user.UUID)
	if err != nil {
		return nil, err
	}

	refreshToken, err := s.refreshToken.GenerateToken(user.UUID)
	if err != nil {
		return nil, err
	}

	return &domain.AuthTokens{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, nil
}

func (s *authService) Register(ctx context.Context, email, password string) error {
	// cek apakah email sudah ada
	_, err := s.userRepo.GetUserByEmail(ctx, email)
	if err == nil {
		return errors.New("email already exists")
	}

	// generate otp
	otp, err := utils.GenerateOTP(6)
	if err != nil {
		return err
	}

	// simpan otp + password sementara
	if err := s.otpRepo.SaveOTP(ctx, email, otp, password, 5*time.Minute); err != nil {
		return err
	}

	// TODO: kirim OTP ke email/whatsapp
	return nil
}

func (s *authService) VerifyOTP(ctx context.Context, email, otp string) error {
	// ambil password dari OTPRepo
	rawPass, valid, err := s.otpRepo.VerifyOTP(ctx, email, otp)
	if err != nil {
		return err
	}
	if !valid {
		return errors.New("invalid or expired otp")
	}

	// hash password
	hashed, _ := bcrypt.GenerateFromPassword([]byte(rawPass), bcrypt.DefaultCost)

	user := &domain.User{
		Email:    email,
		Password: string(hashed),
		Role:     "student", // default role
	}

	// buat user
	if err := s.userRepo.CreateUser(ctx, user); err != nil {
		return err
	}

	// hapus OTP biar ga bisa reuse
	_ = s.otpRepo.DeleteOTP(ctx, email)

	return nil
}

// Forgot Password -> simpan OTP dengan password kosong
func (s *authService) ForgotPassword(ctx context.Context, email string) error {
	_, err := s.userRepo.GetUserByEmail(ctx, email)
	if err != nil {
		return errors.New("email not found")
	}

	otp, err := utils.GenerateOTP(6)
	if err != nil {
		return err
	}

	// save OTP (password kosong)
	return s.otpRepo.SaveOTP(ctx, email, otp, "", 5*time.Minute)
}

// Reset Password
func (s *authService) ResetPassword(ctx context.Context, email, otp, newPassword string) error {
	_, valid, err := s.otpRepo.VerifyOTP(ctx, email, otp)
	if err != nil {
		return err
	}
	if !valid {
		return errors.New("invalid or expired otp")
	}

	// hash new password
	hashed, _ := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)

	user, err := s.userRepo.GetUserByEmail(ctx, email)
	if err != nil {
		return err
	}
	user.Password = string(hashed)

	// update user
	if err := s.userRepo.UpdateUser(ctx, user); err != nil {
		return err
	}

	// hapus OTP biar ga reuse
	_ = s.otpRepo.DeleteOTP(ctx, email)

	return nil
}

func (s *authService) ChangePassword(ctx context.Context, userUUID, oldPassword, newPassword string) error {
	user, err := s.userRepo.GetUserByUUID(ctx, userUUID)
	if err != nil {
		return err
	}

	if bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(oldPassword)) != nil {
		return errors.New("old password mismatch")
	}

	hashed, _ := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	user.Password = string(hashed)
	return s.userRepo.UpdateUser(ctx, user)
}

func (s *authService) GetAccessTokenManager() *utils.JWTManager {
	return s.accessToken
}
