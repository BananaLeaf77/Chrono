package utils

import (
	"errors"
	"os"
	"strings"

	"github.com/go-playground/validator/v10"
)

func TranslateValidationError(err error) string {
	lang := os.Getenv("APP_API_RETURN_LANG")
	if lang == "" {
		lang = "EN" // default
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
				default:
					messages = append(messages, field+" is invalid")
				}
			}
		}
		return strings.Join(messages, ", ")
	}
	return err.Error()
}
