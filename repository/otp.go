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

	data := map[string]string{
		"otp":      strings.TrimSpace(otp),
		"password": strings.TrimSpace(hashedPassword),
		"name":     strings.TrimSpace(name),
		"phone":    strings.TrimSpace(phone),
	}

	if err := r.client.HSet(ctx, key, data).Err(); err != nil {
		return err
	}
	if err := r.client.Expire(ctx, key, ttl).Err(); err != nil {
		return err
	}
	return nil
}

// GetOTP ambil data OTP dari Redis
func (r *otpRedisRepository) GetOTP(ctx context.Context, email string) (map[string]string, error) {
	key := "otp:" + email
	data, err := r.client.HGetAll(ctx, key).Result()
	if err != nil {
		return nil, err
	}
	if len(data) == 0 {
		return nil, nil // not found
	}
	return data, nil
}

func (r *otpRedisRepository) VerifyOTP(ctx context.Context, email, otp string) (map[string]string, bool, error) {
	key := "otp:" + email
	vals, err := r.client.HGetAll(ctx, key).Result()
	if err != nil {
		return nil, false, err
	}
	if len(vals) == 0 {
		return nil, false, nil
	}

	if vals["otp"] != otp {
		return nil, false, nil
	}

	log.Println("DEBUG VerifyOTP raw password from Redis:", vals["password"])
	return vals, true, nil
}

func (r *otpRedisRepository) DeleteOTP(ctx context.Context, email string) error {
	return r.client.Del(ctx, "otp:"+email).Err()
}
