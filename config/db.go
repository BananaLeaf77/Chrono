package config

import (
	"chronosphere/domain"
	"chronosphere/utils"
	"fmt"
	"log"
	"os"
	"time"

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
		&domain.User{},
		&domain.TeacherProfile{},
		&domain.Instrument{},
		&domain.StudentProfile{},
		&domain.Package{},
		&domain.StudentPackage{},
	)
	if err != nil {
		log.Fatal("❌ Failed to ", utils.ColorText("auto-migrate database schemas", utils.Red), " error: ", err)
		return nil, nil, err
	}

	log.Print("✅ Connected to ", utils.ColorText("Database", utils.Green), " successfully")
	return db, &address, nil
}
