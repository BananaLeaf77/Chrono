package config

import (
	"chronosphere/domain"
	"chronosphere/utils"
	"fmt"
	"log"
	"os"
	"reflect"
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
		gormLogger = logger.Default.LogMode(logger.Info) // show SQL
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
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)
	sqlDB.SetConnMaxIdleTime(30 * time.Minute)

	// 🔄 Migrate in dependency-safe order
	models := []interface{}{
		// Base
		&domain.User{},
		&domain.Instrument{},

		// Profiles (depend on User)
		&domain.TeacherProfile{},
		&domain.StudentProfile{},

		// Packages
		&domain.Package{},
		&domain.StudentPackage{},

		// Schedule & Booking (depend on User, TeacherProfile)
		&domain.TeacherSchedule{},
		&domain.Booking{},

		// Class & Docs
		&domain.ClassHistory{},
		&domain.ClassDocumentation{},
	}

	for _, m := range models {
		modelName := reflect.TypeOf(m).Elem().Name()
		if err := db.AutoMigrate(m); err != nil {
			log.Fatalf("❌ Failed to migrate model %s: %v", modelName, err)
			return nil, nil, err
		}
		log.Printf("✅ Migrated %s", modelName)
	}

	// ✅ Seed initial admin user
	var count int64
	db.Model(&domain.User{}).Where("role = ?", domain.RoleAdmin).Count(&count)
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
				Role:     domain.RoleAdmin,
			}
			if err := db.Create(&adminUser).Error; err != nil {
				log.Fatalf("❌ Failed to seed admin user: %v", err)
			} else {
				log.Printf("✅ Seeded admin user: %s", adminEmail)
			}
		} else {
			log.Print("⚠️ Skipping admin seeding — missing ADMIN_EMAIL or ADMIN_PASSWORD in env")
		}
	}

	// ✅ Seed common instruments if missing
	commonInstruments := []string{
		"guitar", "piano", "violin", "drums", "bass",
		"ukulele", "vocal", "flute", "saxophone",
	}

	for _, name := range commonInstruments {
		var exists int64
		db.Model(&domain.Instrument{}).Where("LOWER(name) = LOWER(?)", name).Count(&exists)
		if exists == 0 {
			if err := db.Create(&domain.Instrument{Name: name}).Error; err != nil {
				log.Printf("⚠️ Failed to seed instrument '%s': %v", name, err)
			} else {
				log.Printf("✅ Seeded instrument: %s", name)
			}
		}
	}

	log.Print("✅ Connected to ", utils.ColorText("Database", utils.Green), " successfully")
	return db, &address, nil
}
