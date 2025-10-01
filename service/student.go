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

func (s *studentUseCase) UpdateStudentData(ctx context.Context, userUUID string, user *domain.User) error {
	if user == nil {
		return nil
	}
	return s.repo.UpdateStudentData(ctx, userUUID, user)
}
