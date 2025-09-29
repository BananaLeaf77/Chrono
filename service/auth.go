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
	log.Printf("=== LOGIN: Attempting login for %s", email)

	user, err := s.userRepo.GetUserByEmail(ctx, email)
	if err != nil {
		log.Printf("❌ LOGIN: User not found - %s", email)
		return nil, errors.New("invalid credentials")
	}
	// Compare password
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err != nil {
		log.Printf("❌ LOGIN: Password mismatch for %s: %v", email, err)
		return nil, errors.New("invalid credentials")
	}

	log.Printf("✅ LOGIN: Password verified for %s", email)

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

	log.Printf("REGISTER: Generated hash: %s", hashedPassword)
	log.Printf("REGISTER: Hash length: %d", len(hashedPassword))

	// Test hash immediately
	testErr := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
	if testErr != nil {
		log.Printf("❌ REGISTER: Hash verification failed: %v", testErr)
		return fmt.Errorf("hash verification failed: %w", testErr)
	}
	log.Printf("✅ REGISTER: Hash verification passed")

	// Generate OTP
	otp, err := utils.GenerateOTP(6)
	if err != nil {
		return fmt.Errorf("failed to generate OTP: %w", err)
	}

	// Save to Redis
	if err := s.otpRepo.SaveOTP(ctx, email, otp, hashedPassword, name, telephone, 5*time.Minute); err != nil {
		return fmt.Errorf("failed to save OTP: %w", err)
	}

	log.Printf("REGISTER: OTP for %s = %s", email, otp)
	log.Printf("REGISTER: Successfully saved registration data to Redis")

	// Kirim email OTP
	subject := "Your MadEU OTP Code"
	body := fmt.Sprintf("Your OTP code is: %s (valid for 5 minutes)", otp)
	if err := utils.SendEmail(email, subject, body); err != nil {
		return fmt.Errorf("failed to send OTP email: %w", err)
	}

	log.Printf("✅ REGISTER: Registration process completed for %s", email)
	return nil
}

func (s *authService) VerifyOTP(ctx context.Context, email, otp string) error {
	log.Printf("=== VERIFY OTP: Verifying OTP for %s", email)

	data, valid, err := s.otpRepo.VerifyOTP(ctx, email, otp)
	if err != nil {
		return fmt.Errorf("failed to verify OTP: %w", err)
	}
	if !valid {
		return errors.New("invalid or expired OTP")
	}

	log.Printf("VERIFY OTP: Redis password hash: %s", data["password"])
	log.Printf("VERIFY OTP: Redis hash length: %d", len(data["password"]))

	// SELALU gunakan hash dari Redis (tidak perlu test dengan password hardcoded)
	// Hash sudah diverifikasi saat registrasi
	user := &domain.User{
		Name:     data["name"],
		Email:    email,
		Phone:    data["phone"],
		Password: data["password"], // Gunakan hash dari Redis
		Role:     "student",
	}

	log.Printf("VERIFY OTP: Creating user with hash: %s", user.Password)

	// Create user
	if err := s.userRepo.CreateUser(ctx, user); err != nil {
		log.Printf("❌ VERIFY OTP: Failed to create user: %v", err)
		return fmt.Errorf("failed to create user: %w", err)
	}

	// Verify the stored user
	storedUser, err := s.userRepo.GetUserByEmail(ctx, email)
	if err != nil {
		log.Printf("❌ VERIFY OTP: Failed to fetch user after creation: %v", err)
	} else {
		log.Printf("✅ VERIFY OTP: User created successfully - UUID: %s", storedUser.UUID)
		log.Printf("VERIFY OTP: Final stored hash: %s", storedUser.Password)
	}

	// Clean up OTP
	if err := s.otpRepo.DeleteOTP(ctx, email); err != nil {
		log.Printf("WARNING: Failed to delete OTP: %v", err)
	}

	log.Printf("✅ VERIFY OTP: OTP verification completed for %s", email)
	return nil
}

func (s *authService) ForgotPassword(ctx context.Context, email string) error {
	_, err := s.userRepo.GetUserByEmail(ctx, email)
	if err != nil {
		return errors.New("email not found")
	}

	otp, err := utils.GenerateOTP(6)
	if err != nil {
		return err
	}

	return s.otpRepo.SaveOTP(ctx, email, otp, "", "", "", 5*time.Minute)
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
