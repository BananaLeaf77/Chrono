// domain/otp.go
package domain

import (
	"context"
	"time"
)

type OTP struct {
	ID        int       `gorm:"primaryKey"`
	Email     string    `gorm:"uniqueIndex;not null"`
	OTP       string    `gorm:"not null"`
	Password  string    `gorm:"not null"` // password sementara
	ExpiresAt time.Time `gorm:"not null"`
}

type OTPRepository interface {
	SaveOTP(ctx context.Context, email, otp, password, name, phone string, ttl time.Duration) error
	VerifyOTP(ctx context.Context, email, otp string) (map[string]string, bool, error) // return password kalau valid
	DeleteOTP(ctx context.Context, email string) error
	GetOTP(ctx context.Context, email string) (map[string]string, error)
}
