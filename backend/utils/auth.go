package utils

import (
	"crypto/rand"
)

func GenerateOTP(length int) (string, error) {
	const digits = "0123456789"
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}

	otp := make([]byte, length)
	for i, b := range bytes {
		otp[i] = digits[int(b)%len(digits)]
	}
	return string(otp), nil
}
