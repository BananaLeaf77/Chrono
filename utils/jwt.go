package utils

import (
	"errors"
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

// GenerateToken membuat JWT token dengan payload userUUID
func (j *JWTManager) GenerateToken(userUUID string) (string, error) {
	claims := jwt.MapClaims{
		"sub": userUUID,
		"exp": time.Now().Add(j.tokenDuration).Unix(),
		"iat": time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(j.secretKey)
}

// VerifyToken memvalidasi JWT dan mengembalikan userUUID
func (j *JWTManager) VerifyToken(tokenStr string) (string, error) {
	token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
		// pastikan signing method benar
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("invalid signing method")
		}
		return j.secretKey, nil
	})
	if err != nil {
		return "", err
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return "", errors.New("invalid token")
	}

	// ambil user UUID dari "sub"
	userUUID, ok := claims["sub"].(string)
	if !ok {
		return "", errors.New("invalid token subject")
	}

	return userUUID, nil
}
