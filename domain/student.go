package domain

import (
	"context"
)

type StudentUseCase interface {
	GetMyProfile(ctx context.Context, userUUID string) (*User, error)
	UpdateStudentData(ctx context.Context, userUUID string, user User) error
	GetAllAvailablePackages(ctx context.Context) (*[]Package, error)

	GetMyBookedClasses(ctx context.Context, studentUUID string) (*[]Booking, error)
	GetAvailableSchedules(ctx context.Context, studentUUID string) (*[]TeacherSchedule, error)
}

type StudentRepository interface {
	GetMyProfile(ctx context.Context, userUUID string) (*User, error)
	UpdateStudentData(ctx context.Context, userUUID string, user User) error
	GetAllAvailablePackages(ctx context.Context) (*[]Package, error)

	GetMyBookedClasses(ctx context.Context, studentUUID string) (*[]Booking, error)
	GetAvailableSchedules(ctx context.Context, instrumentIDs []int) (*[]TeacherSchedule, error)

	GetStudentInstrumentIDs(ctx context.Context, studentUUID string) ([]int, error)
}
