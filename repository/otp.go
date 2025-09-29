package repository

import (
	"chronosphere/domain"
	"context"
	"log"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
)

type otpRedisRepository struct {
	client *redis.Client
}

func NewOTPRedisRepository(addr, password string, db int) domain.OTPRepository {
	rdb := redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: password,
		DB:       db,
	})
	return &otpRedisRepository{client: rdb}
}

func (r *otpRedisRepository) SaveOTP(ctx context.Context, email, otp, hashedPassword, name, phone string, ttl time.Duration) error {
	key := "otp:" + email

	// Trim all values to remove invisible characters
	data := map[string]string{
		"otp":      strings.TrimSpace(otp),
		"password": strings.TrimSpace(hashedPassword),
		"name":     strings.TrimSpace(name),
		"phone":    strings.TrimSpace(phone),
	}

	if err := r.client.HSet(ctx, key, data).Err(); err != nil {
		return err
	}

	return r.client.Expire(ctx, key, ttl).Err()
}

// Verifikasi OTP
func (r *otpRedisRepository) VerifyOTP(ctx context.Context, email, otp string) (map[string]string, bool, error) {
	key := "otp:" + email
	vals, err := r.client.HGetAll(ctx, key).Result()
	if err != nil {
		return nil, false, err
	}
	if len(vals) == 0 {
		return nil, false, nil // expired atau tidak ada
	}

	if vals["otp"] != otp {
		return nil, false, nil
	}
	log.Println("DEBUG VerifyOTP raw password from Redis:", vals["password"])

	return vals, true, nil
}

// Hapus data registrasi setelah sukses
func (r *otpRedisRepository) DeleteOTP(ctx context.Context, email string) error {
	return r.client.Del(ctx, "otp:"+email).Err()
}
