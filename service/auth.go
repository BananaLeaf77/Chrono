package service

import (
	"chronosphere/domain"
	"chronosphere/utils"
	"context"
	"errors"
	"fmt"
	"log"
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
		accessToken:  utils.NewJWTManager(secret, time.Hour),
		refreshToken: utils.NewJWTManager(secret, 7*24*time.Hour),
	}
}

func (s *authService) Login(ctx context.Context, email, password string) (*domain.AuthTokens, error) {

	user, err := s.userRepo.GetUserByEmail(ctx, email)
	if err != nil {
		return nil, errors.New("invalid credentials")
	}

	// Compare password
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err != nil {
		return nil, errors.New("invalid credentials")
	}

	// Generate tokens
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

func (s *authService) Register(ctx context.Context, email string, name string, telephone string, password string) error {
	// Validasi input
	if password == "" {
		return errors.New("password cannot be empty")
	}
	if email == "" {
		return errors.New("email cannot be empty")
	}

	// Cek email & telepon
	if _, err := s.userRepo.GetUserByEmail(ctx, email); err == nil {
		return errors.New("email already exists")
	}
	if _, err := s.userRepo.GetUserByTelephone(ctx, telephone); err == nil {
		return errors.New("telephone already exists")
	}

	// Hash password
	hashedBytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}
	hashedPassword := string(hashedBytes)

	// Test hash immediately
	testErr := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
	if testErr != nil {
		return fmt.Errorf("hash verification failed: %w", testErr)
	}

	// Generate OTP
	otp, err := utils.GenerateOTP(6)
	if err != nil {
		return fmt.Errorf("failed to generate OTP: %w", err)
	}

	// Save to Redis
	if err := s.otpRepo.SaveOTP(ctx, email, otp, hashedPassword, name, telephone, 5*time.Minute); err != nil {
		return fmt.Errorf("failed to save OTP: %w", err)
	}

	// Kirim email OTP
	subject := "Your MadEU OTP Code"
	body := fmt.Sprintf("Your OTP code is: %s (valid for 5 minutes)", otp)
	if err := utils.SendEmail(email, subject, body); err != nil {
		return fmt.Errorf("failed to send OTP email: %w", err)
	}

	return nil
}

func (s *authService) VerifyOTP(ctx context.Context, email, otp string) error {
	data, valid, err := s.otpRepo.VerifyOTP(ctx, email, otp)
	if err != nil {
		return fmt.Errorf("failed to verify OTP: %w", err)
	}
	if !valid {
		return errors.New("invalid or expired OTP")
	}

	// SELALU gunakan hash dari Redis (tidak perlu test dengan password hardcoded)
	// Hash sudah diverifikasi saat registrasi
	user := &domain.User{
		Name:     data["name"],
		Email:    email,
		Phone:    data["phone"],
		Password: data["password"], // Gunakan hash dari Redis
		Role:     "student",
	}

	if err := s.userRepo.CreateUser(ctx, user); err != nil {
		return fmt.Errorf("failed to create user: %w", err)
	}

	storedUser, err := s.userRepo.GetUserByEmail(ctx, email)
	if err != nil {
		log.Printf("❌ VERIFY OTP: Failed to fetch user after creation: %v", err)
	} else {
		log.Printf("✅ VERIFY OTP: User created successfully - UUID: %s", storedUser.UUID)
	}

	// Clean up OTP
	if err := s.otpRepo.DeleteOTP(ctx, email); err != nil {
		log.Printf("WARNING: Failed to delete OTP: %v", err)
	}

	return nil
}

func (s *authService) ForgotPassword(ctx context.Context, email string) error {
	user, err := s.userRepo.GetUserByEmail(ctx, email)
	if err != nil {
		return errors.New("email not found")
	}

	otp, err := utils.GenerateOTP(6)
	if err != nil {
		return err
	}

	if err := s.otpRepo.SaveOTP(ctx, email, otp, "", "", "", 5*time.Minute); err != nil {
		return err
	}

	// Kirim email OTP
	subject := "MadEU Reset Password OTP"
	body := fmt.Sprintf("Halo %s,\n\nKode OTP untuk reset password akun Anda adalah: %s\nKode ini hanya berlaku selama 5 menit.\n\nJika Anda tidak merasa melakukan permintaan ini, abaikan email ini.",
		user.Name, otp)
	if err := utils.SendEmail(email, subject, body); err != nil {
		return fmt.Errorf("failed to send OTP email: %w", err)
	}

	return nil
}

func (s *authService) ResetPassword(ctx context.Context, email, otp, newPassword string) error {
	_, valid, err := s.otpRepo.VerifyOTP(ctx, email, otp)
	if err != nil {
		return err
	}
	if !valid {
		return errors.New("invalid or expired OTP")
	}

	// Hash new password
	hashed, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	user, err := s.userRepo.GetUserByEmail(ctx, email)
	if err != nil {
		return err
	}
	user.Password = string(hashed)

	if err := s.userRepo.UpdateUser(ctx, user); err != nil {
		return err
	}

	_ = s.otpRepo.DeleteOTP(ctx, email)
	return nil
}

func (s *authService) ChangePassword(ctx context.Context, userUUID, oldPassword, newPassword string) error {
	user, err := s.userRepo.GetUserByUUID(ctx, userUUID)
	if err != nil {
		return err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(oldPassword)); err != nil {
		return errors.New("old password mismatch")
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	user.Password = string(hashed)
	return s.userRepo.UpdateUser(ctx, user)
}

func (s *authService) GetAccessTokenManager() *utils.JWTManager {
	return s.accessToken
}
