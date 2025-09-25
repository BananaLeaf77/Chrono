package repository

import (
	"chronosphere/domain"

	"gorm.io/gorm"
)

type studentRepository struct {
	db *gorm.DB
}

func NewStudentRepository(db *gorm.DB) domain.StudentRepository {
	return &studentRepository{db: db}
}

func (r *studentRepository) CreateStudentProfile(student *domain.StudentProfile) error {
	return r.db.Create(student).Error
}

func (r *studentRepository) UpdateStudentProfile(student *domain.StudentProfile) error {
	return r.db.Save(student).Error
}

func (r *studentRepository) GetStudentProfileByUserID(userID uint) (*domain.StudentProfile, error) {
	var profile domain.StudentProfile
	if err := r.db.Preload("Packages.Package").First(&profile, "user_id = ?", userID).Error; err != nil {
		return nil, err
	}
	return &profile, nil
}

