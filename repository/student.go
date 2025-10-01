package repository

import (
	"chronosphere/domain"
	"context"
	"time"

	"gorm.io/gorm"
)

type studentRepository struct {
	db *gorm.DB
}

func NewStudentRepository(db *gorm.DB) domain.StudentRepository {
	return &studentRepository{db: db}
}

func (r *studentRepository) GetMyProfile(ctx context.Context, userUUID string) (*domain.User, error) {
	var student domain.User
	if err := r.db.WithContext(ctx).Where("uuid = ? AND role = ?", userUUID, "student").First(&student).Error; err != nil {
		return nil, err
	}
	return &student, nil
}

func (r *studentRepository) UpdateStudentData(ctx context.Context, userUUID string, user *domain.User) error {
	user.UpdatedAt = time.Now()
	return r.db.WithContext(ctx).Model(&domain.User{}).Where("uuid = ?", userUUID).Updates(user).Error
}
