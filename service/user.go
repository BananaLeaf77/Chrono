package service

import (
	"chronosphere/domain"
	"context"
)

type userService struct {
	repo domain.UserRepository
}

func NewUserService(userRepo domain.UserRepository) domain.UserRepository {
	return &userService{repo: userRepo}
}

func (s *userService) CreateUser(ctx context.Context, user *domain.User) error {
	return s.repo.CreateUser(ctx, user)
}
func (s *userService) GetAllUsers(ctx context.Context) (*[]domain.User, error) {
	return s.repo.GetAllUsers(ctx)
}
func (s *userService) GetUserByUUID(ctx context.Context, uuid string) (*domain.User, error) {
	return s.repo.GetUserByUUID(ctx, uuid)
}
func (s *userService) UpdateUser(ctx context.Context, user *domain.User) error {
	return s.repo.UpdateUser(ctx, user)
}
func (s *userService) DeleteUser(ctx context.Context, uuid string) error {
	return s.repo.DeleteUser(ctx, uuid)
}
