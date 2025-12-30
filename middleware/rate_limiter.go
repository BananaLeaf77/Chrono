package middleware

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

// RateLimiterConfig holds configuration for rate limiting
type RateLimiterConfig struct {
	RequestsPerWindow int
	WindowDuration    time.Duration
	KeyPrefix         string
	SkipPaths         []string
}

// RateLimiter interface for different implementations
type RateLimiter interface {
	Allow(ctx context.Context, key string) (bool, error)
	GetRemaining(ctx context.Context, key string) (int, error)
	GetResetTime(ctx context.Context, key string) (time.Time, error)
}

// RedisRateLimiter implements rate limiting using Redis
type RedisRateLimiter struct {
	client *redis.Client
	config RateLimiterConfig
}

// NewRedisRateLimiter creates a new Redis-based rate limiter
func NewRedisRateLimiter(redisAddr string, config RateLimiterConfig) *RedisRateLimiter {
	client := redis.NewClient(&redis.Options{
		Addr:         redisAddr,
		DB:           0,
		DialTimeout:  5 * time.Second,
		ReadTimeout:  3 * time.Second,
		WriteTimeout: 3 * time.Second,
		PoolSize:     10,
		MinIdleConns: 5,
	})

	// Test connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		log.Printf("⚠️  Redis connection failed, falling back to in-memory rate limiter: %v", err)
		return &RedisRateLimiter{
			client: nil, // Will trigger fallback
			config: config,
		}
	}

	log.Println("✅ Redis rate limiter connected successfully")
	return &RedisRateLimiter{
		client: client,
		config: config,
	}
}

// Allow checks if request is allowed based on rate limit
func (r *RedisRateLimiter) Allow(ctx context.Context, key string) (bool, error) {
	if r.client == nil {
		return true, nil // Fallback: allow all if Redis unavailable
	}

	fullKey := fmt.Sprintf("%s:%s", r.config.KeyPrefix, key)

	// Lua script for atomic increment and expiry
	script := `
		local current = redis.call('GET', KEYS[1])
		if current == false then
			redis.call('SET', KEYS[1], 1, 'EX', ARGV[1])
			return 1
		end
		
		local count = tonumber(current)
		if count < tonumber(ARGV[2]) then
			redis.call('INCR', KEYS[1])
			return count + 1
		end
		
		return -1
	`

	result, err := r.client.Eval(ctx, script, []string{fullKey},
		int(r.config.WindowDuration.Seconds()),
		r.config.RequestsPerWindow).Result()

	if err != nil {
		log.Printf("⚠️  Rate limiter error (allowing request): %v", err)
		return true, nil // Fail open: allow request if Redis errors
	}

	count := result.(int64)
	return count != -1, nil
}

// GetRemaining returns remaining requests in current window
func (r *RedisRateLimiter) GetRemaining(ctx context.Context, key string) (int, error) {
	if r.client == nil {
		return r.config.RequestsPerWindow, nil
	}

	fullKey := fmt.Sprintf("%s:%s", r.config.KeyPrefix, key)

	val, err := r.client.Get(ctx, fullKey).Result()
	if err == redis.Nil {
		return r.config.RequestsPerWindow, nil
	}
	if err != nil {
		return r.config.RequestsPerWindow, nil // Fail open
	}

	count, _ := strconv.Atoi(val)
	remaining := r.config.RequestsPerWindow - count
	if remaining < 0 {
		remaining = 0
	}

	return remaining, nil
}

// GetResetTime returns when the rate limit window resets
func (r *RedisRateLimiter) GetResetTime(ctx context.Context, key string) (time.Time, error) {
	if r.client == nil {
		return time.Now().Add(r.config.WindowDuration), nil
	}

	fullKey := fmt.Sprintf("%s:%s", r.config.KeyPrefix, key)

	ttl, err := r.client.TTL(ctx, fullKey).Result()
	if err != nil || ttl < 0 {
		return time.Now().Add(r.config.WindowDuration), nil
	}

	return time.Now().Add(ttl), nil
}

// InMemoryRateLimiter implements rate limiting using in-memory storage (fallback)
type InMemoryRateLimiter struct {
	mu      sync.RWMutex
	buckets map[string]*bucket
	config  RateLimiterConfig
}

type bucket struct {
	count     int
	resetTime time.Time
}

// NewInMemoryRateLimiter creates a new in-memory rate limiter
func NewInMemoryRateLimiter(config RateLimiterConfig) *InMemoryRateLimiter {
	limiter := &InMemoryRateLimiter{
		buckets: make(map[string]*bucket),
		config:  config,
	}

	// Cleanup goroutine
	go limiter.cleanup()

	log.Println("⚠️  Using in-memory rate limiter (not recommended for production)")
	return limiter
}

func (m *InMemoryRateLimiter) cleanup() {
	ticker := time.NewTicker(m.config.WindowDuration)
	defer ticker.Stop()

	for range ticker.C {
		m.mu.Lock()
		now := time.Now()
		for key, b := range m.buckets {
			if now.After(b.resetTime) {
				delete(m.buckets, key)
			}
		}
		m.mu.Unlock()
	}
}

// Allow checks if request is allowed
func (m *InMemoryRateLimiter) Allow(ctx context.Context, key string) (bool, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	now := time.Now()
	b, exists := m.buckets[key]

	if !exists || now.After(b.resetTime) {
		m.buckets[key] = &bucket{
			count:     1,
			resetTime: now.Add(m.config.WindowDuration),
		}
		return true, nil
	}

	if b.count < m.config.RequestsPerWindow {
		b.count++
		return true, nil
	}

	return false, nil
}

// GetRemaining returns remaining requests
func (m *InMemoryRateLimiter) GetRemaining(ctx context.Context, key string) (int, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	b, exists := m.buckets[key]
	if !exists || time.Now().After(b.resetTime) {
		return m.config.RequestsPerWindow, nil
	}

	remaining := m.config.RequestsPerWindow - b.count
	if remaining < 0 {
		remaining = 0
	}

	return remaining, nil
}

// GetResetTime returns when the rate limit window resets
func (m *InMemoryRateLimiter) GetResetTime(ctx context.Context, key string) (time.Time, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	b, exists := m.buckets[key]
	if !exists {
		return time.Now().Add(m.config.WindowDuration), nil
	}

	return b.resetTime, nil
}

// RateLimitMiddleware creates rate limiting middleware
func RateLimitMiddleware(limiter RateLimiter, config RateLimiterConfig) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Check if path should skip rate limiting
		for _, skipPath := range config.SkipPaths {
			if c.Request.URL.Path == skipPath {
				c.Next()
				return
			}
		}

		// Get identifier (IP or user UUID)
		identifier := getIdentifier(c)

		// Check rate limit
		allowed, err := limiter.Allow(c.Request.Context(), identifier)
		if err != nil {
			// On error, log and allow request (fail open)
			log.Printf("⚠️  Rate limiter error: %v", err)
			c.Next()
			return
		}

		// Get remaining requests and reset time
		remaining, _ := limiter.GetRemaining(c.Request.Context(), identifier)
		resetTime, _ := limiter.GetResetTime(c.Request.Context(), identifier)

		// Set rate limit headers
		c.Header("X-RateLimit-Limit", strconv.Itoa(config.RequestsPerWindow))
		c.Header("X-RateLimit-Remaining", strconv.Itoa(remaining))
		c.Header("X-RateLimit-Reset", strconv.FormatInt(resetTime.Unix(), 10))
		c.Header("X-RateLimit-Window", config.WindowDuration.String())

		if !allowed {
			retryAfter := int(time.Until(resetTime).Seconds())
			if retryAfter < 0 {
				retryAfter = int(config.WindowDuration.Seconds())
			}

			c.Header("Retry-After", strconv.Itoa(retryAfter))

			c.JSON(http.StatusTooManyRequests, gin.H{
				"success":     false,
				"message":     "Terlalu banyak permintaan. Silakan coba lagi nanti.",
				"error":       "too_many_requests",
				"retry_after": retryAfter,
				"reset_at":    resetTime.Unix(),
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// getIdentifier returns a unique identifier for rate limiting
func getIdentifier(c *gin.Context) string {
	// Priority 1: Use authenticated user UUID
	if uuid, exists := c.Get("userUUID"); exists {
		return fmt.Sprintf("user:%s", uuid)
	}

	// Priority 2: Use X-Forwarded-For header (for proxy/load balancer)
	if xff := c.GetHeader("X-Forwarded-For"); xff != "" {
		return fmt.Sprintf("ip:%s", xff)
	}

	// Priority 3: Fall back to direct client IP
	ip := c.ClientIP()
	return fmt.Sprintf("ip:%s", ip)
}

// EndpointRateLimitMiddleware creates endpoint-specific rate limiting
func EndpointRateLimitMiddleware(limiter RateLimiter, config RateLimiterConfig, endpoint string) gin.HandlerFunc {
	return func(c *gin.Context) {
		identifier := getIdentifier(c)
		key := fmt.Sprintf("%s:%s", endpoint, identifier)

		allowed, err := limiter.Allow(c.Request.Context(), key)
		if err != nil {
			log.Printf("⚠️  Rate limiter error for %s: %v", endpoint, err)
			c.Next()
			return
		}

		remaining, _ := limiter.GetRemaining(c.Request.Context(), key)
		resetTime, _ := limiter.GetResetTime(c.Request.Context(), key)

		c.Header("X-RateLimit-Limit", strconv.Itoa(config.RequestsPerWindow))
		c.Header("X-RateLimit-Remaining", strconv.Itoa(remaining))
		c.Header("X-RateLimit-Reset", strconv.FormatInt(resetTime.Unix(), 10))

		if !allowed {
			retryAfter := int(time.Until(resetTime).Seconds())
			if retryAfter < 0 {
				retryAfter = int(config.WindowDuration.Seconds())
			}

			c.Header("Retry-After", strconv.Itoa(retryAfter))

			c.JSON(http.StatusTooManyRequests, gin.H{
				"success":     false,
				"message":     fmt.Sprintf("Terlalu banyak permintaan untuk %s. Silakan coba lagi nanti.", endpoint),
				"error":       "too_many_requests",
				"retry_after": retryAfter,
				"reset_at":    resetTime.Unix(),
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// HealthCheckMiddleware adds health check endpoint that bypasses rate limiting
func HealthCheckMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.URL.Path == "/health" || c.Request.URL.Path == "/ping" {
			c.JSON(http.StatusOK, gin.H{
				"status":    "healthy",
				"timestamp": time.Now().Unix(),
			})
			c.Abort()
			return
		}
		c.Next()
	}
}
