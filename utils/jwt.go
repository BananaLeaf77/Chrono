package utils

import (
	"errors"
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
func (j *JWTManager) GenerateToken(userUUID string, role, name string) (string, error) {
	claims := jwt.MapClaims{
		"sub":  userUUID,
		"name": name,
		"role": role,
		"exp":  time.Now().Add(j.tokenDuration).Unix(),
		"iat":  time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(j.secretKey)
}

// VerifyToken memverifikasi token dan mengembalikan UUID + Role
func (j *JWTManager) VerifyToken(tokenStr string) (string, string, string, error) {
	token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return j.secretKey, nil
	})

	if err != nil {
		return "", "", "", err
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		userUUID, _ := claims["sub"].(string)
		role, _ := claims["role"].(string)
		name, _ := claims["name"].(string)
		return userUUID, role, name, nil
	}

	return "", "", "", errors.New("invalid token claims")
}
