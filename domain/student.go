package domain

import (
	"context"
)

type StudentUseCase interface {
	GetMyProfile(ctx context.Context, userUUID string) (*User, error)
	UpdateStudentData(ctx context.Context, userUUID string, user User) error
	GetAllAvailablePackages(ctx context.Context) (*[]Package, error)

	BookClass(ctx context.Context, studentUUID string, scheduleID int) error
	GetMyBookedClasses(ctx context.Context, studentUUID string) (*[]Booking, error)
	CancelBookedClass(ctx context.Context, bookingID int, studentUUID string) error
	GetAvailableSchedules(ctx context.Context, studentUUID string) (*[]TeacherSchedule, error)
}

type StudentRepository interface {
	GetMyProfile(ctx context.Context, userUUID string) (*User, error)
	UpdateStudentData(ctx context.Context, userUUID string, user User) error
	GetAllAvailablePackages(ctx context.Context) (*[]Package, error)

	BookClass(ctx context.Context, studentUUID string, scheduleID int) error
	GetMyBookedClasses(ctx context.Context, studentUUID string) (*[]Booking, error)
	CancelBookedClass(ctx context.Context, bookingID int, studentUUID string) error
	GetAvailableSchedules(ctx context.Context, studentUUID string) (*[]TeacherSchedule, error)
}
