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
		log.Println("⚠️  .env file not found, using system environment variables")
	}

	// Boot DB
	db, _, err := config.BootDB()
	if err != nil {
		log.Fatal("❌ Failed to connect to database: ", err)
	}

	// Redis config
	redisAddr := os.Getenv("REDIS_ADDR")
	if redisAddr == "" {
		redisAddr = "localhost:6379"
	}

	// JWT secret
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		log.Fatal("❌ JWT_SECRET not found in .env")
	}

	// Init repositories
	authRepo := repository.NewAuthRepository(db)
	studentRepo := repository.NewStudentRepository(db)
	adminRepo := repository.NewAdminRepository(db)
	otpRepo := repository.NewOTPRedisRepository(redisAddr, "", 0)

	// Init services
	studentService := service.NewStudentUseCase(studentRepo)
	adminService := service.NewAdminService(adminRepo)

	// Auth service with token managers
	authService := service.NewAuthService(authRepo, otpRepo, jwtSecret)

	// Init Gin
	app := gin.Default()
	config.InitMiddleware(app)

	// Init handlers (inject dependencies)
	delivery.NewAuthHandler(app, authService)
	delivery.NewStudentHandler(app, studentService)
	delivery.NewAdminHandler(app, adminService, authService.GetAccessTokenManager())

	// Start server
	port := os.Getenv("APP_PORT")
	if port == "" {
		port = "8080"
	}
	srvAddr := ":" + port

	log.Printf("🚀 Server running at http://localhost%s", srvAddr)
	if err := app.Run(srvAddr); err != nil {
		log.Fatal("❌ Failed to start server: ", err)
	}
}
