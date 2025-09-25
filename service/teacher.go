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

func (s *teacherService) GetAllTeachers(ctx context.Context) ([]domain.User, error) {
	return s.repo.GetAllTeachers(ctx)
}

func (s *teacherService) GetTeacherByUUID(ctx context.Context, uuid string) (*domain.User, error) {
	return s.repo.GetTeacherByUUID(ctx, uuid)
}

func (s *teacherService) GetTeacherProfile(ctx context.Context, uuid string) (*domain.TeacherProfile, error) {
	return s.repo.GetTeacherProfile(ctx, uuid)
}

func (s *teacherService) UpdateTeacherProfile(ctx context.Context, profile *domain.TeacherProfile) error {
	return s.repo.UpdateTeacherProfile(ctx, profile)
}

func (s *teacherService) AssignInstrument(ctx context.Context, teacherUUID, instrumentName string) error {
	return s.repo.AssignInstrument(ctx, teacherUUID, instrumentName)
}

func (s *teacherService) RemoveInstrument(ctx context.Context, teacherUUID, instrumentName string) error {
	return s.repo.RemoveInstrument(ctx, teacherUUID, instrumentName)
}
