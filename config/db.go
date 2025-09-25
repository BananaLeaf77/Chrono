package config

import (
	"chronosphere/domain"
	"chronosphere/utils"
	"fmt"
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
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
	db, err := gorm.Open(postgres.Open(address), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to ", utils.ColorText("Database: ", utils.Red), err)
		return nil, nil, err
	}

	// Auto-migrate database schemas here if needed
	err = db.AutoMigrate(&domain.User{})
	if err != nil {
		log.Fatal("Failed to ", utils.ColorText("auto-migrate database schemas", utils.Red), " error: ", err)
		return nil, nil, err
	}

	log.Print("Connected to ", utils.ColorText("Database", utils.Green), " successfully")
	return db, &address, nil
}
