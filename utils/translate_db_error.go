package utils

import (
	"errors"
	"os"
	"strings"

	"github.com/jackc/pgconn"
	"gorm.io/gorm"
)

// TranslateDBError mengubah pesan error database menjadi pesan yang lebih manusiawi
func TranslateDBError(err error) string {
	if err == nil {
		return ""
	}

	defer func() {
		if r := recover(); r != nil {
			err = errors.New("internal error translating DB error")
		}
	}()

	lang := strings.ToUpper(strings.TrimSpace(os.Getenv("APP_API_RETURN_LANG")))
	if lang == "" {
		lang = "EN"
	}

	// PostgreSQL-specific errors
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		switch pgErr.Code {
		case "23505": // Unique violation
			msg := "Duplicate value, please use another"
			if strings.Contains(pgErr.Message, "users_email_key") {
				msg = "Email already exists"
			} else if strings.Contains(pgErr.Message, "users_phone_key") {
				msg = "Phone number already exists"
			}
			if lang == "IDN" {
				msg = strings.ReplaceAll(msg, "already exists", "sudah digunakan")
			}
			return msg

		case "23503":
			if lang == "IDN" {
				return "Data ini sedang digunakan di tabel lain"
			}
			return "This record is referenced by another table"

		case "23502":
			if lang == "IDN" {
				return "Ada kolom yang wajib diisi namun kosong"
			}
			return "Some required fields are missing"

		case "22P02":
			if lang == "IDN" {
				return "Format data tidak valid"
			}
			return "Invalid data format"

		case "42703":
			if lang == "IDN" {
				return "Kolom yang dirujuk tidak ditemukan"
			}
			return "Column not found in database"
		}

		if lang == "IDN" {
			return "Terjadi kesalahan pada database"
		}
		return "A database error occurred"
	}

	// Handle GORM errors
	if errors.Is(err, gorm.ErrRecordNotFound) {
		if lang == "IDN" {
			return "Data tidak ditemukan"
		}
		return "Record not found"
	}

	// Handle context timeouts
	lowerErr := strings.ToLower(err.Error())
	if strings.Contains(lowerErr, "context deadline exceeded") {
		if lang == "IDN" {
			return "Permintaan melebihi batas waktu"
		}
		return "Request timeout"
	}
	if strings.Contains(lowerErr, "context canceled") {
		if lang == "IDN" {
			return "Permintaan dibatalkan"
		}
		return "Request was cancelled"
	}

	// Connection error fallback
	if lang == "IDN" && strings.Contains(lowerErr, "connection") {
		return "Gagal terhubung ke database"
	}

	return err.Error()
}
