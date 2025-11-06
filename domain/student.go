package domain

import (
	"context"
)

type StudentUseCase interface {
	GetMyProfile(ctx context.Context, userUUID string) (*User, error)
	UpdateStudentData(ctx context.Context, userUUID string, user User) error
	// GetAllAvailablePackages(ctx context.Context) (*[]Package, error)
}

type StudentRepository interface {
	GetMyProfile(ctx context.Context, userUUID string) (*User, error)
	UpdateStudentData(ctx context.Context, userUUID string, user User) error
	// GetAllAvailablePackages(ctx context.Context) (*[]Package, error)
}
