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
	// ✅ Get instrument IDs based on student’s packages
	instrumentIDs, err := s.repo.GetStudentInstrumentIDs(ctx, studentUUID)
	if err != nil {
		return nil, err
	}

	// ✅ Get available schedules for given instrument IDs
	return s.repo.GetAvailableSchedules(ctx, instrumentIDs)
}
