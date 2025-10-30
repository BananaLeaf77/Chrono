package service

import (
	"chronosphere/domain"
	"context"
)

type teacherService struct {
	repo domain.TeacherRepository
}

func NewTeacherService(TeacherRepo domain.TeacherRepository) domain.TeacherUseCase {
	return &teacherService{repo: TeacherRepo}
}

func (s *teacherService) CancelBookedClass(ctx context.Context, bookingID int, teacherUUID string) error {
	return s.repo.CancelBookedClass(ctx, bookingID, teacherUUID)
}

func (s *teacherService) GetAllBookedClass(ctx context.Context, teacherUUID string) (*[]domain.Booking, error) {
	return s.repo.GetAllBookedClass(ctx, teacherUUID)
}

func (s *teacherService) GetMyProfile(ctx context.Context, uuid string) (*domain.User, error) {
	return s.repo.GetMyProfile(ctx, uuid)
}

func (s *teacherService) UpdateTeacherData(ctx context.Context, userUUID string, user domain.User) error {
	return s.repo.UpdateTeacherData(ctx, userUUID, user)
}

// ✅ Get teacher schedules
func (uc *teacherService) GetMySchedules(ctx context.Context, teacherUUID string) (*[]domain.TeacherSchedule, error) {
	return uc.repo.GetMySchedules(ctx, teacherUUID)
}

func (uc *teacherService) AddAvailability(ctx context.Context, teacherUUID string, schedule *domain.TeacherSchedule) error {
	return uc.repo.AddAvailability(ctx, schedule)
}

// ✅ Delete availability (only if not booked)
func (uc *teacherService) DeleteAvailability(ctx context.Context, scheduleID int, teacherUUID string) error {
	return uc.repo.DeleteAvailability(ctx, scheduleID, teacherUUID)
}
