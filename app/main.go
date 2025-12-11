package main

import (
	"chronosphere/config"
	"chronosphere/delivery"
	"chronosphere/middleware"
	"chronosphere/repository"
	"chronosphere/service"
	"chronosphere/utils"
	"log"
	"os"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/validator/v10"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env
	if err := godotenv.Load(); err != nil {
		log.Println("⚠️  .env file not found, using system environment variables")
	}

	// ✅ Register custom validators
	if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
		utils.RegisterCustomValidations(v)
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
	teacherRepo := repository.NewTeacherRepository(db)
	managerRepo := repository.NewManagerRepository(db)
	adminRepo := repository.NewAdminRepository(db)
	otpRepo := repository.NewOTPRedisRepository(redisAddr, "", 0)

	// Init services
	studentService := service.NewStudentUseCase(studentRepo)
	managementService := service.NewManagerService(managerRepo)
	adminService := service.NewAdminService(adminRepo)
	teacherService := service.NewTeacherService(teacherRepo)

	// Auth service with token managers
	authService := service.NewAuthService(authRepo, otpRepo, jwtSecret)

	// Init Gin
	app := gin.Default()
	config.InitMiddleware(app)

	// ========================================================================
	// RATE LIMITING SETUP
	// ========================================================================
	rateLimitEnabled := os.Getenv("RATE_LIMIT_ENABLED") == "true"

	var globalLimiter middleware.RateLimiter
	var authLimiter middleware.RateLimiter

	if rateLimitEnabled {
		// Parse configurations
		globalRequests, _ := strconv.Atoi(os.Getenv("RATE_LIMIT_REQUESTS_PER_WINDOW"))
		if globalRequests == 0 {
			globalRequests = 100
		}

		globalWindow, _ := strconv.Atoi(os.Getenv("RATE_LIMIT_WINDOW_DURATION"))
		if globalWindow == 0 {
			globalWindow = 60
		}

		authRequests, _ := strconv.Atoi(os.Getenv("RATE_LIMIT_AUTH_REQUESTS"))
		if authRequests == 0 {
			authRequests = 10
		}

		authWindow, _ := strconv.Atoi(os.Getenv("RATE_LIMIT_AUTH_WINDOW"))
		if authWindow == 0 {
			authWindow = 60
		}

		// Global rate limiter configuration
		globalConfig := middleware.RateLimiterConfig{
			RequestsPerWindow: globalRequests,
			WindowDuration:    time.Duration(globalWindow) * time.Second,
			KeyPrefix:         "ratelimit:global",
			SkipPaths:         []string{"/ping"},
		}

		// Try Redis first, fallback to in-memory
		globalLimiter = middleware.NewRedisRateLimiter(redisAddr, globalConfig)

		// Apply global rate limiting
		app.Use(middleware.RateLimitMiddleware(globalLimiter, globalConfig))

		// Auth-specific rate limiter (stricter)
		authConfig := middleware.RateLimiterConfig{
			RequestsPerWindow: authRequests,
			WindowDuration:    time.Duration(authWindow) * time.Second,
			KeyPrefix:         "ratelimit:auth",
		}
		authLimiter = middleware.NewRedisRateLimiter(redisAddr, authConfig)

		log.Printf("✅ Rate limiting enabled (Global: %d req/%ds, Auth: %d req/%ds)",
			globalRequests, globalWindow, authRequests, authWindow)
	} else {
		log.Println("⚠️  Rate limiting disabled")
	}

	// ========================================================================
	// INIT HANDLERS
	// ========================================================================
	delivery.NewAuthHandler(app, authService, authLimiter, db)
	delivery.NewManagerHandler(app, managementService, authService.GetAccessTokenManager(), db)
	delivery.NewStudentHandler(app, studentService, authService.GetAccessTokenManager())
	delivery.NewAdminHandler(app, adminService, authService.GetAccessTokenManager())
	delivery.NewTeacherHandler(app, teacherService, authService.GetAccessTokenManager(), db)

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
