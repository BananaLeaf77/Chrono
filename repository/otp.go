package repository

import (
	"chronosphere/domain"
	"context"
	"time"

	"gorm.io/gorm"
)

type otpRepository struct {
	db *gorm.DB
}

type OTP struct {
	ID        int       `gorm:"primaryKey"`
	Email     string    `gorm:"uniqueIndex;not null"`
	OTP       string    `gorm:"not null"`
	Password  string    `gorm:"not null"` // password sementara
	ExpiresAt time.Time `gorm:"not null"`
}

func NewOTPRepository(db *gorm.DB) domain.OTPRepository {
	return &otpRepository{db: db}
}

func (r *otpRepository) SaveOTP(ctx context.Context, email, otp, password string, ttl time.Duration) error {
	record := OTP{
		Email:     email,
		OTP:       otp,
		Password:  password,
		ExpiresAt: time.Now().Add(ttl),
	}
	// UPSERT: jika email sudah ada, update
	return r.db.WithContext(ctx).Where("email = ?", email).Assign(record).FirstOrCreate(&record).Error
}

func (r *otpRepository) VerifyOTP(ctx context.Context, email, otp string) (string, bool, error) {
	var record OTP
	if err := r.db.WithContext(ctx).First(&record, "email = ?", email).Error; err != nil {
		return "", false, err
	}

	if record.ExpiresAt.Before(time.Now()) {
		return "", false, nil
	}
	if record.OTP != otp {
		return "", false, nil
	}

	return record.Password, true, nil
}

func (r *otpRepository) DeleteOTP(ctx context.Context, email string) error {
	return r.db.WithContext(ctx).Delete(&OTP{}, "email = ?", email).Error
}
