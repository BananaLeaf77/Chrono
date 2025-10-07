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

	// Default language
	lang := strings.ToUpper(strings.TrimSpace(os.Getenv("APP_API_RETURN_LANG")))
	if lang == "" {
		lang = "EN"
	}

	// Handle PostgreSQL error
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		switch pgErr.Code {
		case "23505": // Unique violation
			if lang == "IDN" {
				return "Data sudah ada, gunakan nilai lain"
			}
			return "Duplicate value, please use another"

		case "23503": // Foreign key violation
			if lang == "IDN" {
				return "Data ini sedang digunakan di tabel lain"
			}
			return "This data is referenced by another record"

		case "23502": // Not null violation
			if lang == "IDN" {
				return "Ada kolom yang wajib diisi namun kosong"
			}
			return "Some required fields are missing"

		case "22P02": // Invalid text representation (e.g., UUID salah format)
			if lang == "IDN" {
				return "Format data tidak valid"
			}
			return "Invalid data format"

		case "42703": // Undefined column
			if lang == "IDN" {
				return "Kolom yang dirujuk tidak ditemukan"
			}
			return "Column not found in database"

		default:
			if lang == "IDN" {
				return "Terjadi kesalahan pada database"
			}
			return "A database error occurred"
		}
	}

	// Handle GORM-level error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		if lang == "IDN" {
			return "Data tidak ditemukan"
		}
		return "Record not found"
	}

	// Fallback — tampilkan pesan asli
	if lang == "IDN" && strings.Contains(strings.ToLower(err.Error()), "connection") {
		return "Gagal terhubung ke database"
	}

	return err.Error()
}
