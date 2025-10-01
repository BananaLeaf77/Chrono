package repository

import (
	"chronosphere/domain"
	"context"

	"gorm.io/gorm"
)

type teacherRepository struct {
	db *gorm.DB
}

func NewTeacherRepository(db *gorm.DB) domain.TeacherRepository {
	return &teacherRepository{db: db}
}

func (r *teacherRepository) GetMyProfile(ctx context.Context, userUUID string) (*domain.User, error) {
	var teacher domain.User
	if err := r.db.WithContext(ctx).Preload("TeacherProfile").Where("uuid = ? AND role = ?", userUUID, "teacher").First(&teacher).Error; err != nil {
		return nil, err
	}
	return &teacher, nil
}

func (r *teacherRepository) UpdateTeacherData(ctx context.Context, userUUID string, user *domain.User) error {
	return r.db.WithContext(ctx).Model(&domain.User{}).Where("uuid = ?", userUUID).Updates(user).Error
}
