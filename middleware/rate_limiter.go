package middleware

import (
	"context"
	"fmt"
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

// RateLimiterConfig holds configuration for rate limiting
type RateLimiterConfig struct {
	// Requests per window
	RequestsPerWindow int
	// Window duration
	WindowDuration time.Duration
	// Key prefix for Redis
	KeyPrefix string
	// Skip rate limiting for these paths
	SkipPaths []string
}

// RateLimiter interface for different implementations
type RateLimiter interface {
	Allow(ctx context.Context, key string) (bool, error)
	GetRemaining(ctx context.Context, key string) (int, error)
}

// RedisRateLimiter implements rate limiting using Redis
type RedisRateLimiter struct {
	client *redis.Client
	config RateLimiterConfig
}

// NewRedisRateLimiter creates a new Redis-based rate limiter
func NewRedisRateLimiter(redisAddr string, config RateLimiterConfig) *RedisRateLimiter {
	client := redis.NewClient(&redis.Options{
		Addr: redisAddr,
		DB:   0,
	})

	return &RedisRateLimiter{
		client: client,
		config: config,
	}
}

// Allow checks if request is allowed based on rate limit
func (r *RedisRateLimiter) Allow(ctx context.Context, key string) (bool, error) {
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
		return false, err
	}

	count := result.(int64)
	return count != -1, nil
}

// GetRemaining returns remaining requests in current window
func (r *RedisRateLimiter) GetRemaining(ctx context.Context, key string) (int, error) {
	fullKey := fmt.Sprintf("%s:%s", r.config.KeyPrefix, key)

	val, err := r.client.Get(ctx, fullKey).Result()
	if err == redis.Nil {
		return r.config.RequestsPerWindow, nil
	}
	if err != nil {
		return 0, err
	}

	count, _ := strconv.Atoi(val)
	remaining := r.config.RequestsPerWindow - count
	if remaining < 0 {
		remaining = 0
	}

	return remaining, nil
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
			// On error, allow request but log the error
			c.Next()
			return
		}

		// Get remaining requests
		remaining, _ := limiter.GetRemaining(c.Request.Context(), identifier)

		// Set rate limit headers
		c.Header("X-RateLimit-Limit", strconv.Itoa(config.RequestsPerWindow))
		c.Header("X-RateLimit-Remaining", strconv.Itoa(remaining))
		c.Header("X-RateLimit-Window", config.WindowDuration.String())

		if !allowed {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"success":     false,
				"message":     "Rate limit exceeded. Please try again later.",
				"error":       "too_many_requests",
				"retry_after": int(config.WindowDuration.Seconds()),
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// getIdentifier returns a unique identifier for rate limiting
func getIdentifier(c *gin.Context) string {
	// Try to get authenticated user UUID first
	if uuid, exists := c.Get("userUUID"); exists {
		return fmt.Sprintf("user:%s", uuid)
	}

	// Fall back to IP address
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
			c.Next()
			return
		}

		remaining, _ := limiter.GetRemaining(c.Request.Context(), key)

		c.Header("X-RateLimit-Limit", strconv.Itoa(config.RequestsPerWindow))
		c.Header("X-RateLimit-Remaining", strconv.Itoa(remaining))

		if !allowed {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"success": false,
				"message": fmt.Sprintf("Rate limit exceeded for %s. Please try again later.", endpoint),
				"error":   "too_many_requests",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}
