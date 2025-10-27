package domain

import (
	"context"
)

type TeacherUseCase interface {
	GetMyProfile(ctx context.Context, userUUID string) (*User, error)
	UpdateTeacherData(ctx context.Context, userUUID string, payload User) error

	GetMySchedules(ctx context.Context, teacherUUID string) (*[]TeacherSchedule, error)
	AddAvailability(ctx context.Context, teacherUUID string, schedule *TeacherSchedule) error
	DeleteAvailability(ctx context.Context, scheduleID int, teacherUUID string) error
}

type TeacherRepository interface {
	GetMyProfile(ctx context.Context, userUUID string) (*User, error)
	UpdateTeacherData(ctx context.Context, userUUID string, payload User) error

	GetMySchedules(ctx context.Context, teacherUUID string) (*[]TeacherSchedule, error)
	AddAvailability(ctx context.Context, schedule *TeacherSchedule) error
	DeleteAvailability(ctx context.Context, scheduleID int, teacherUUID string) error
}
