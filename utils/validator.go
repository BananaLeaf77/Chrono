package utils

import (
	"errors"
	"os"
	"strings"
	"time"

	"github.com/go-playground/validator/v10"
)

// RegisterCustomValidations registers custom validation rules
func RegisterCustomValidations(v *validator.Validate) {
	v.RegisterValidation("timeformat", validateTimeFormat)
}

// validateTimeFormat checks if string is valid HH:MM format
func validateTimeFormat(fl validator.FieldLevel) bool {
	timeStr := fl.Field().String()
	_, err := time.Parse("15:04", timeStr)
	return err == nil
}

func TranslateValidationError(err error) string {
	lang := os.Getenv("APP_API_RETURN_LANG")
	if lang == "" {
		lang = "EN"
	}

	var ve validator.ValidationErrors
	if errors.As(err, &ve) {
		var messages []string
		for _, fe := range ve {
			field := fe.Field()
			switch lang {
			case "IDN":
				switch fe.Tag() {
				case "required":
					messages = append(messages, field+" wajib diisi")
				case "email":
					messages = append(messages, "format email tidak valid")
				case "min":
					messages = append(messages, field+" minimal "+fe.Param()+" karakter")
				case "max":
					messages = append(messages, field+" maksimal "+fe.Param()+" karakter")
				case "len":
					messages = append(messages, field+" harus kurang dari / maksimal "+fe.Param()+" karakter")
				case "numeric":
					messages = append(messages, field+" hanya boleh berisi angka")
				case "timeformat":
					messages = append(messages, field+" harus berformat HH:MM (contoh: 14:00)")
				case "oneof":
					messages = append(messages, field+" harus salah satu dari: "+fe.Param())
				default:
					messages = append(messages, field+" tidak valid")
				}

			default: // English
				switch fe.Tag() {
				case "required":
					messages = append(messages, field+" is required")
				case "email":
					messages = append(messages, "invalid email format")
				case "min":
					messages = append(messages, field+" must be at least "+fe.Param()+" characters")
				case "max":
					messages = append(messages, field+" must be at most "+fe.Param()+" characters")
				case "len":
					messages = append(messages, field+" must be under or "+fe.Param()+" characters")
				case "numeric":
					messages = append(messages, field+" must contain only numbers")
				case "timeformat":
					messages = append(messages, field+" must be in HH:MM format (e.g., 14:00)")
				case "oneof":
					messages = append(messages, field+" must be one of: "+fe.Param())
				default:
					messages = append(messages, field+" is invalid")
				}
			}
		}
		return strings.Join(messages, ", ")
	}
	return err.Error()
}
