package service

import (
	"chronosphere/domain"
	"context"
	"errors"

	"golang.org/x/crypto/bcrypt"
)

type userService struct {
	repo domain.UserRepository
}

func NewUserService(userRepo domain.UserRepository) domain.UserUseCase {
	return &userService{repo: userRepo}
}

func (s *userService) CreateUser(ctx context.Context, user *domain.User) error {
	// hash password sebelum simpan
	hashed, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		return errors.New("failed to hash password")
	}
	user.Password = string(hashed)

	// validasi role
	if user.Role != domain.RoleStudent && user.Role != domain.RoleTeacher && user.Role != domain.RoleAdmin {
		return errors.New("invalid role")
	}

	return s.repo.CreateUser(ctx, user)
}

func (s *userService) GetAllUsers(ctx context.Context) ([]domain.User, error) {
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

// tambahan
func (s *userService) Login(ctx context.Context, email, password string) (*domain.User, error) {
	user, err := s.repo.GetUserByEmail(ctx, email)
	if err != nil {
		return nil, errors.New("invalid email or password")
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err != nil {
		return nil, errors.New("invalid email or password")
	}

	return user, nil
}
