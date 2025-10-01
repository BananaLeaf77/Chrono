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

func (s *teacherService) GetMyProfile(ctx context.Context, uuid string) (*domain.User, error) {
	return s.repo.GetMyProfile(ctx, uuid)
}

func (s *teacherService) UpdateTeacherData(ctx context.Context, userUUID string, user *domain.User) error {
	if user == nil {
		return nil
	}
	return s.repo.UpdateTeacherData(ctx, userUUID, user)
}
