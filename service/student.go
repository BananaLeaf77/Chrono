package service

import (
	"chronosphere/domain"
	"context"
)

type studentUseCase struct {
	repo domain.StudentRepository
}

func NewStudentUseCase(repo domain.StudentRepository) domain.StudentUseCase {
	return &studentUseCase{repo: repo}
}

func (s *studentUseCase) GetMyClassHistory(ctx context.Context, studentUUID string) (*[]domain.ClassHistory, error) {
	return s.repo.GetMyClassHistory(ctx, studentUUID)
}

func (s *studentUseCase) CancelBookedClass(ctx context.Context, bookingID int, studentUUID string, reason *string) error {
	return s.repo.CancelBookedClass(ctx, bookingID, studentUUID, reason)
}

func (s *studentUseCase) BookClass(ctx context.Context, studentUUID string, scheduleID int) error {
	return s.repo.BookClass(ctx, studentUUID, scheduleID)
}

func (s *studentUseCase) GetMyProfile(ctx context.Context, userUUID string) (*domain.User, error) {
	return s.repo.GetMyProfile(ctx, userUUID)
}

func (s *studentUseCase) UpdateStudentData(ctx context.Context, userUUID string, user domain.User) error {
	return s.repo.UpdateStudentData(ctx, userUUID, user)
}

func (s *studentUseCase) GetAllAvailablePackages(ctx context.Context) (*[]domain.Package, error) {
	return s.repo.GetAllAvailablePackages(ctx)
}

func (s *studentUseCase) GetMyBookedClasses(ctx context.Context, studentUUID string) (*[]domain.Booking, error) {
	return s.repo.GetMyBookedClasses(ctx, studentUUID)
}

func (s *studentUseCase) GetAvailableSchedules(ctx context.Context, studentUUID string) (*[]domain.TeacherSchedule, error) {
	return s.repo.GetAvailableSchedules(ctx, studentUUID)
}
