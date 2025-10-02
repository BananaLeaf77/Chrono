package utils

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type JWTManager struct {
	secretKey     []byte
	tokenDuration time.Duration
}

func NewJWTManager(secretKey string, duration time.Duration) *JWTManager {
	return &JWTManager{
		secretKey:     []byte(secretKey),
		tokenDuration: duration,
	}
}

// GenerateToken membuat JWT token dengan payload userUUID dan role
func (j *JWTManager) GenerateToken(userUUID string, role string) (string, error) {
	claims := jwt.MapClaims{
		"sub":  userUUID,
		"role": role,
		"exp":  time.Now().Add(j.tokenDuration).Unix(),
		"iat":  time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(j.secretKey)
}

// VerifyToken memverifikasi token dan mengembalikan UUID + Role
func (j *JWTManager) VerifyToken(tokenStr string) (string, string, error) {
	token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method")
		}
		return j.secretKey, nil
	})

	if err != nil || !token.Valid {
		return "", "", fmt.Errorf("invalid token: %w", err)
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return "", "", fmt.Errorf("invalid token claims")
	}

	userUUID, ok := claims["sub"].(string)
	if !ok {
		return "", "", fmt.Errorf("invalid sub claim")
	}

	role, ok := claims["role"].(string)
	if !ok {
		return "", "", fmt.Errorf("invalid role claim")
	}

	return userUUID, role, nil
}
