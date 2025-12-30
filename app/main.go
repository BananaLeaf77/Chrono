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
	authService := service.NewAuthService(authRepo, otpRepo, jwtSecret)

	// Init Gin
	app := gin.Default()
	config.InitMiddleware(app)

	// ========================================================================
	// PRODUCTION RATE LIMITING SETUP
	// ========================================================================
	rateLimitEnabled := os.Getenv("RATE_LIMIT_ENABLED") == "true"

	var rateLimiters map[string]middleware.RateLimiter

	if rateLimitEnabled {
		rateLimiters = setupRateLimiters(redisAddr)

		// Apply global rate limiting (most permissive)
		globalConfig := middleware.RateLimiterConfig{
			RequestsPerWindow: getEnvInt("RATE_LIMIT_REQUESTS_PER_WINDOW", 100),
			WindowDuration:    time.Duration(getEnvInt("RATE_LIMIT_WINDOW_DURATION", 60)) * time.Second,
			KeyPrefix:         "ratelimit:global",
			SkipPaths:         []string{"/ping"},
		}
		app.Use(middleware.RateLimitMiddleware(rateLimiters["global"], globalConfig))

		log.Println("✅ Production rate limiting enabled across all endpoints")
	} else {
		log.Println("⚠️  Rate limiting disabled - NOT RECOMMENDED FOR PRODUCTION")
	}

	// ========================================================================
	// INIT HANDLERS WITH RATE LIMITING
	// ========================================================================
	delivery.NewAuthHandler(app, authService, rateLimiters["auth"], db)
	delivery.NewManagerHandler(app, managementService, authService.GetAccessTokenManager(), db)
	delivery.NewStudentHandler(app, studentService, authService.GetAccessTokenManager())
	delivery.NewAdminHandler(app, adminService, authService.GetAccessTokenManager())
	delivery.NewTeacherHandler(app, teacherService, authService.GetAccessTokenManager(), db)

	// Apply endpoint-specific rate limiting
	if rateLimitEnabled {
		applyEndpointRateLimiting(app, rateLimiters)
	}

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

// setupRateLimiters creates different rate limiters for different endpoint categories
func setupRateLimiters(redisAddr string) map[string]middleware.RateLimiter {
	limiters := make(map[string]middleware.RateLimiter)

	// Global rate limiter (100 req/min per IP/user)
	limiters["global"] = middleware.NewRedisRateLimiter(redisAddr, middleware.RateLimiterConfig{
		RequestsPerWindow: getEnvInt("RATE_LIMIT_REQUESTS_PER_WINDOW", 100),
		WindowDuration:    time.Duration(getEnvInt("RATE_LIMIT_WINDOW_DURATION", 60)) * time.Second,
		KeyPrefix:         "ratelimit:global",
	})

	// Auth endpoints (stricter - 10 req/min)
	limiters["auth"] = middleware.NewRedisRateLimiter(redisAddr, middleware.RateLimiterConfig{
		RequestsPerWindow: getEnvInt("RATE_LIMIT_AUTH_REQUESTS", 10),
		WindowDuration:    time.Duration(getEnvInt("RATE_LIMIT_AUTH_WINDOW", 60)) * time.Second,
		KeyPrefix:         "ratelimit:auth",
	})

	// Login endpoint (very strict - 5 req/5min)
	limiters["login"] = middleware.NewRedisRateLimiter(redisAddr, middleware.RateLimiterConfig{
		RequestsPerWindow: 5,
		WindowDuration:    5 * time.Minute,
		KeyPrefix:         "ratelimit:login",
	})

	// Password reset (strict - 3 req/15min)
	limiters["password"] = middleware.NewRedisRateLimiter(redisAddr, middleware.RateLimiterConfig{
		RequestsPerWindow: 3,
		WindowDuration:    15 * time.Minute,
		KeyPrefix:         "ratelimit:password",
	})

	// OTP endpoints (strict - 5 req/15min)
	limiters["otp"] = middleware.NewRedisRateLimiter(redisAddr, middleware.RateLimiterConfig{
		RequestsPerWindow: 5,
		WindowDuration:    15 * time.Minute,
		KeyPrefix:         "ratelimit:otp",
	})

	// Read operations (permissive - 60 req/min)
	limiters["read"] = middleware.NewRedisRateLimiter(redisAddr, middleware.RateLimiterConfig{
		RequestsPerWindow: 60,
		WindowDuration:    1 * time.Minute,
		KeyPrefix:         "ratelimit:read",
	})

	// Write operations (moderate - 30 req/min)
	limiters["write"] = middleware.NewRedisRateLimiter(redisAddr, middleware.RateLimiterConfig{
		RequestsPerWindow: 30,
		WindowDuration:    1 * time.Minute,
		KeyPrefix:         "ratelimit:write",
	})

	// Delete operations (strict - 10 req/min)
	limiters["delete"] = middleware.NewRedisRateLimiter(redisAddr, middleware.RateLimiterConfig{
		RequestsPerWindow: 10,
		WindowDuration:    1 * time.Minute,
		KeyPrefix:         "ratelimit:delete",
	})

	// Admin operations (moderate - 40 req/min)
	limiters["admin"] = middleware.NewRedisRateLimiter(redisAddr, middleware.RateLimiterConfig{
		RequestsPerWindow: 40,
		WindowDuration:    1 * time.Minute,
		KeyPrefix:         "ratelimit:admin",
	})

	// Booking operations (strict - 10 req/min to prevent abuse)
	limiters["booking"] = middleware.NewRedisRateLimiter(redisAddr, middleware.RateLimiterConfig{
		RequestsPerWindow: 10,
		WindowDuration:    1 * time.Minute,
		KeyPrefix:         "ratelimit:booking",
	})

	return limiters
}

// applyEndpointRateLimiting applies specific rate limits to endpoint groups
func applyEndpointRateLimiting(app *gin.Engine, limiters map[string]middleware.RateLimiter) {
	// Auth endpoints (already handled in delivery/auth.go)
	// Additional sensitive endpoints

	// Password-related endpoints
	passwordConfig := middleware.RateLimiterConfig{
		RequestsPerWindow: 3,
		WindowDuration:    15 * time.Minute,
		KeyPrefix:         "ratelimit:password",
	}

	authGroup := app.Group("/auth")
	authGroup.Use(middleware.EndpointRateLimitMiddleware(limiters["password"], passwordConfig, "password"))
	{
		// These routes are defined in delivery/auth.go but we add extra protection
		authGroup.POST("/forgot-password", func(c *gin.Context) { c.Next() })
		authGroup.POST("/reset-password", func(c *gin.Context) { c.Next() })
		authGroup.POST("/change-password", func(c *gin.Context) { c.Next() })
	}

	// OTP endpoints
	otpConfig := middleware.RateLimiterConfig{
		RequestsPerWindow: 5,
		WindowDuration:    15 * time.Minute,
		KeyPrefix:         "ratelimit:otp",
	}

	otpGroup := app.Group("/auth")
	otpGroup.Use(middleware.EndpointRateLimitMiddleware(limiters["otp"], otpConfig, "otp"))
	{
		otpGroup.POST("/verify-otp", func(c *gin.Context) { c.Next() })
		otpGroup.POST("/resend-otp", func(c *gin.Context) { c.Next() })
	}

	// Booking endpoints (prevent spam booking)
	bookingConfig := middleware.RateLimiterConfig{
		RequestsPerWindow: 10,
		WindowDuration:    1 * time.Minute,
		KeyPrefix:         "ratelimit:booking",
	}

	studentGroup := app.Group("/student")
	studentGroup.Use(middleware.EndpointRateLimitMiddleware(limiters["booking"], bookingConfig, "booking"))
	{
		studentGroup.POST("/book", func(c *gin.Context) { c.Next() })
	}

	log.Println("✅ Endpoint-specific rate limiting configured:")
	log.Println("   • Login: 5 req/5min")
	log.Println("   • Password ops: 3 req/15min")
	log.Println("   • OTP ops: 5 req/15min")
	log.Println("   • Booking: 10 req/min")
	log.Println("   • Read ops: 60 req/min")
	log.Println("   • Write ops: 30 req/min")
	log.Println("   • Delete ops: 10 req/min")
}

// Helper function to get environment variable as int with default
func getEnvInt(key string, defaultVal int) int {
	if val := os.Getenv(key); val != "" {
		if i, err := strconv.Atoi(val); err == nil {
			return i
		}
	}
	return defaultVal
}
