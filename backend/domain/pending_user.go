package domain

import (
	"context"
	"time"
)

// domain/pending_user.go
type PendingUserRepository interface {
	SavePendingPassword(ctx context.Context, email, password string, ttl time.Duration) error
	GetPendingPassword(ctx context.Context, email string) (string, error)
	DeletePendingPassword(ctx context.Context, email string) error
}
