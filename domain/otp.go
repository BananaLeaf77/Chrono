// domain/otp.go
package domain

import (
	"context"
	"time"
)

type OTPRepository interface {
	SaveOTP(ctx context.Context, email, otp, password string, ttl time.Duration) error
	VerifyOTP(ctx context.Context, email, otp string) (string, bool, error) // return password kalau valid
	DeleteOTP(ctx context.Context, email string) error
}
