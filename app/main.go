package main

import (
	"chronosphere/config"
	"chronosphere/delivery"
	"chronosphere/repository"
	"chronosphere/service"
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env
	if err := godotenv.Load(); err != nil {
		log.Fatal("Error loading .env file")
	}

	// Boot DB
	db, _, err := config.BootDB()
	if err != nil {
		log.Fatal("Failed to connect to database: ", err)
	}

	// Init repositories
	userRepo := repository.NewUserRepository(db)
	studentRepo := repository.NewStudentRepository(db)
	otpRepo := repository.NewOTPRedisRepository("localhost:6379", "", 0) // ✅ pakai Redis

	// Init services
	studentService := service.NewStudentUseCase(studentRepo)

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		log.Fatal("JWT_SECRET not found in .env")
	}
	authService := service.NewAuthService(userRepo, otpRepo, jwtSecret)

	// Init Gin
	app := gin.Default()
	config.InitMiddleware(app)

	// Init handlers
	delivery.NewStudentHandler(app, studentService)
	delivery.NewAuthHandler(app, authService)

	// Start server
	if err := app.Run(":8080"); err != nil {
		log.Fatal("Failed to start server: ", err)
	}
}
