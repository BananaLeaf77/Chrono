package config

import (
	"chronosphere/domain"
	"chronosphere/utils"
	"fmt"
	"log"
	"os"
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func GetDatabaseURL() string {
	dsn := fmt.Sprintf(
		"postgres://%s:%s@%s:%s/%s?sslmode=%s",
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_HOST"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_NAME"),
		os.Getenv("DB_SSLMODE"),
	)
	return dsn
}

func BootDB() (*gorm.DB, *string, error) {
	address := GetDatabaseURL()

	// Setup logger level (debug mode vs production)
	var gormLogger logger.Interface
	if os.Getenv("APP_ENV") == "development" {
		gormLogger = logger.Default.LogMode(logger.Info) // show all SQL
	} else {
		gormLogger = logger.Default.LogMode(logger.Silent)
	}

	db, err := gorm.Open(postgres.Open(address), &gorm.Config{
		Logger: gormLogger,
	})
	if err != nil {
		log.Fatal("❌ Failed to connect to ", utils.ColorText("Database: ", utils.Red), err)
		return nil, nil, err
	}

	// Setup connection pool
	sqlDB, err := db.DB()
	if err != nil {
		return nil, nil, err
	}
	sqlDB.SetMaxIdleConns(10)           // idle connections
	sqlDB.SetMaxOpenConns(100)          // max open connections
	sqlDB.SetConnMaxLifetime(time.Hour) // max lifetime
	sqlDB.SetConnMaxIdleTime(30 * time.Minute)

	// Auto migrate semua schema
	err = db.AutoMigrate(
		// Base entities first
		&domain.User{},
		&domain.Instrument{},

		// Profiles (depend on User)
		&domain.TeacherProfile{},
		&domain.StudentProfile{},

		// Package related tables (depend on Instrument)
		&domain.Package{},
		&domain.StudentPackage{},

		// Schedule and booking (depend on User)
		&domain.TeacherSchedule{},
		&domain.Booking{},

		// Class and documentation (depend on Booking, User, Package, Instrument)
		&domain.ClassHistory{},
		&domain.ClassDocumentation{},
	)
	if err != nil {
		log.Fatal("❌ Failed to ", utils.ColorText("auto-migrate database schemas", utils.Red), " error: ", err)
		return nil, nil, err
	}

	// Seed initial admin user
	var count int64
	db.Model(&domain.User{}).Where("role = ?", "admin").Count(&count)
	if count == 0 {
		adminEmail := os.Getenv("ADMIN_EMAIL")
		adminPass := os.Getenv("ADMIN_PASSWORD")
		adminName := os.Getenv("ADMIN_NAME")
		adminPhone := os.Getenv("ADMIN_PHONE")

		if adminEmail != "" && adminPass != "" {
			hashed, _ := bcrypt.GenerateFromPassword([]byte(adminPass), bcrypt.DefaultCost)
			adminUser := domain.User{
				Name:     adminName,
				Email:    adminEmail,
				Phone:    adminPhone,
				Password: string(hashed),
				Role:     "admin",
			}

			if err := db.Create(&adminUser).Error; err != nil {
				log.Fatalf("❌ Failed to seed admin user: %v", err)
			} else {
				log.Printf("✅ Seeded admin user: %s", adminEmail)
			}
		} else {
			log.Print("⚠️ Skipping admin seeding, missing ADMIN_EMAIL or ADMIN_PASSWORD in env")
		}
	}

	// ✅ Seed common instruments if they don't exist
	commonInstruments := []string{
		"Guitar",
		"Piano",
		"Violin",
		"Drums",
		"Bass",
		"Ukulele",
		"Vocal",
		"Flute",
		"Saxophone",
	}

	for _, instrumentName := range commonInstruments {
		var count int64
		db.Model(&domain.Instrument{}).Where("name = ?", instrumentName).Count(&count)
		if count == 0 {
			if err := db.Create(&domain.Instrument{Name: instrumentName}).Error; err != nil {
				log.Printf("⚠️ Failed to seed instrument '%s': %v", instrumentName, err)
			} else {
				log.Printf("✅ Seeded instrument: %s", instrumentName)
			}
		}
	}

	log.Print("✅ Connected to ", utils.ColorText("Database", utils.Green), " successfully")
	return db, &address, nil
}
