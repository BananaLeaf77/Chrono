package domain

import (
	"context"
)

type TeacherUseCase interface {
	GetMyProfile(ctx context.Context, userUUID string) (*User, error)
	UpdateTeacherData(ctx context.Context, userUUID string, user *User) error
}

type TeacherRepository interface {
	GetMyProfile(ctx context.Context, userUUID string) (*User, error)
	UpdateTeacherData(ctx context.Context, userUUID string, user *User) error
}
