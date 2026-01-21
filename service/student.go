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

func (s *studentUseCase) BookClass(ctx context.Context, studentUUID string, scheduleID int, instrumentID int) error {
	return s.repo.BookClass(ctx, studentUUID, scheduleID, instrumentID)
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
	// student, err := s.repo.GetMyProfile(ctx, studentUUID)
	// if err != nil {
	// 	return nil, err
	// }

	// validPackages := make(map[int]map[int]bool)
	// var validInstrumentIDs []int
	// packageSameInstrumentDifferentDuration := []int{}

	// for _, sp := range student.StudentProfile.Packages {
	// 	if sp.Package == nil {
	// 		continue
	// 	}

	// 	instID := sp.Package.InstrumentID
	// 	duration := sp.Package.Duration // e.g., 30 or 60

	// 	_, exists := validPackages[instID]
	// 	if !exists {
	// 		packageSameInstrumentDifferentDuration = append(packageSameInstrumentDifferentDuration, instID)
	// 		validPackages[instID] = make(map[int]bool)
	// 		validInstrumentIDs = append(validInstrumentIDs, instID)
	// 	}
	// 	validPackages[instID][duration] = true
	// }

	// if len(validInstrumentIDs) == 0 {
	// 	return &[]domain.TeacherSchedule{}, nil
	// }

	// schedules, err := s.repo.GetTeacherSchedulesBasedOnInstrumentIDs(ctx, validInstrumentIDs)
	// if err != nil {
	// 	return nil, err
	// }

	// Truee := true
	// FalseFlag := false

	// for _, v := range *schedules {
	// 	for _, instrumentIDs := range packageSameInstrumentDifferentDuration {
	// 		if v.TeacherProfile.InstrumentID == instrumentIDs {
	// 			v.IsDurationCompatible = &Truee
	// 		}
	// 	}
	// 	if v.IsDurationCompatible == nil {
	// 		v.IsDurationCompatible = &FalseFlag
	// 	}
	// }

	// return nil, nil
	return s.repo.GetAvailableSchedules(ctx, studentUUID)

}
