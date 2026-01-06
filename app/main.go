package main

import (
	"chronosphere/config"
	"chronosphere/delivery"
	"chronosphere/middleware"
	"chronosphere/repository"
	"chronosphere/service"
	"chronosphere/utils"
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
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

	// JWT secret validation
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		log.Fatal("❌ JWT_SECRET not found in .env")
	}
	if len(jwtSecret) < 32 {
		log.Fatal("❌ JWT_SECRET must be at least 32 characters for security. Generate one with: openssl rand -base64 32")
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

	// ⚠️ REMOVED: applyEndpointRateLimiting(app, rateLimiters)
	// Rate limiting is already applied in delivery/auth.go for each endpoint

	// ========================================================================
	// GRACEFUL SHUTDOWN SETUP
	// ========================================================================
	port := os.Getenv("APP_PORT")
	if port == "" {
		port = "8080"
	}
	srvAddr := ":" + port

	// Create HTTP server with custom configuration
	srv := &http.Server{
		Addr:           srvAddr,
		Handler:        app,
		ReadTimeout:    15 * time.Second,
		WriteTimeout:   15 * time.Second,
		IdleTimeout:    60 * time.Second,
		MaxHeaderBytes: 1 << 20, // 1MB
	}

	// Start server in a goroutine
	go func() {
		log.Printf("🚀 Server running at http://localhost%s", srvAddr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Printf("❌ Server error: %v", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("🛑 Shutting down server...")

	// The context is used to inform the server it has 10 seconds to finish
	// the request it is currently handling
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("⚠️  Server forced to shutdown: %v", err)
	}

	log.Println("✅ Server exited gracefully")
}

// setupRateLimiters creates different rate limiters (reuses single Redis connection)
func setupRateLimiters(redisAddr string) map[string]middleware.RateLimiter {
	limiters := make(map[string]middleware.RateLimiter)

	// All limiters now share the same Redis connection internally

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

	log.Println("✅ Rate limiters configured (shared Redis connection)")
	return limiters
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
