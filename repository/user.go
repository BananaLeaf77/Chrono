package repository

import (
	"chronosphere/domain"
	"context"

	"gorm.io/gorm"
)

type userRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) domain.UserRepository {
	return &userRepository{
		db: db,
	}
}

func (r *userRepository) CreateUser(ctx context.Context, user *domain.User) error {
	return r.db.WithContext(ctx).Create(user).Error
}
func (r *userRepository) GetAllUsers(ctx context.Context) (*[]domain.User, error) {
	var users []domain.User
	if err := r.db.WithContext(ctx).Find(&users).Error; err != nil {
		return nil, err
	}
	return &users, nil
}
func (r *userRepository) GetUserByUUID(ctx context.Context, uuid string) (*domain.User, error) {
	var user domain.User
	if err := r.db.WithContext(ctx).First(&user, "uuid = ?", uuid).Error; err != nil {
		return nil, err
	}
	return &user, nil
}
func (r *userRepository) UpdateUser(ctx context.Context, user *domain.User) error {
	return r.db.WithContext(ctx).Save(user).Error
}
func (r *userRepository) DeleteUser(ctx context.Context, uuid string) error {
	return r.db.WithContext(ctx).Delete(&domain.User{}, "uuid = ?", uuid).Error
}
