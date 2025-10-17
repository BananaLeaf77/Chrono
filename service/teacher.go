package service

import (
	"chronosphere/domain"
	"context"
	"errors"
	"time"
)

type teacherService struct {
	repo domain.TeacherRepository
}

func NewTeacherService(TeacherRepo domain.TeacherRepository) domain.TeacherUseCase {
	return &teacherService{repo: TeacherRepo}
}

func (s *teacherService) GetMyProfile(ctx context.Context, uuid string) (*domain.User, error) {
	return s.repo.GetMyProfile(ctx, uuid)
}

func (s *teacherService) UpdateTeacherData(ctx context.Context, userUUID string, user *domain.User) error {
	if user == nil {
		return nil
	}
	return s.repo.UpdateTeacherData(ctx, userUUID, user)
}

// ✅ Get teacher schedules
func (uc *teacherService) GetMySchedules(ctx context.Context, teacherUUID string) ([]domain.TeacherSchedule, error) {
	return uc.repo.GetMySchedules(ctx, teacherUUID)
}

// ✅ Add availability (validation)
func (uc *teacherService) AddAvailability(ctx context.Context, teacherUUID string, schedule *domain.TeacherSchedule) error {
	if schedule.DayOfWeek == "" || schedule.StartTime == "" || schedule.EndTime == "" {
		return errors.New("day_of_week, start_time, and end_time are required")
	}

	// Optional validation: ensure duration = 1 hour
	start, err1 := time.Parse("15:04", schedule.StartTime)
	end, err2 := time.Parse("15:04", schedule.EndTime)
	if err1 != nil || err2 != nil {
		return errors.New("invalid time format, use HH:MM")
	}
	if end.Sub(start) != time.Hour {
		return errors.New("class duration must be exactly 1 hour")
	}

	schedule.TeacherUUID = teacherUUID
	schedule.IsBooked = false
	return uc.repo.AddAvailability(ctx, schedule)
}

// ✅ Delete availability (only if not booked)
func (uc *teacherService) DeleteAvailability(ctx context.Context, scheduleID int, teacherUUID string) error {
	return uc.repo.DeleteAvailability(ctx, scheduleID, teacherUUID)
}
