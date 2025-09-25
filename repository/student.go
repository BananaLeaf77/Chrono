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

func (r *studentRepository) GetAllStudents(ctx context.Context) ([]domain.User, error) {
	var students []domain.User
	if err := r.db.WithContext(ctx).Where("role = ?", "student").Find(&students).Error; err != nil {
		return nil, err
	}
	return students, nil
}

func (r *studentRepository) GetStudentByUUID(ctx context.Context, uuid string) (*domain.User, error) {
	var student domain.User
	if err := r.db.WithContext(ctx).Where("uuid = ? AND role = ?", uuid, "student").First(&student).Error; err != nil {
		return nil, err
	}
	return &student, nil
}

func (r *studentRepository) GetStudentProfile(ctx context.Context, uuid string) (*domain.StudentProfile, error) {
	var profile domain.StudentProfile
	if err := r.db.WithContext(ctx).Preload("Packages").First(&profile, "user_uuid = ?", uuid).Error; err != nil {
		return nil, err
	}
	return &profile, nil
}

func (r *studentRepository) UpdateStudentQuota(ctx context.Context, studentUUID string, packageID int, delta int) error {
	var studentPackage domain.StudentPackage
	if err := r.db.WithContext(ctx).First(&studentPackage, "student_uuid = ? AND package_id = ?", studentUUID, packageID).Error; err != nil {
		return err
	}
	studentPackage.RemainingQuota += delta
	if studentPackage.RemainingQuota < 0 {
		studentPackage.RemainingQuota = 0
	}
	return r.db.WithContext(ctx).Save(&studentPackage).Error
}

func (r *studentRepository) AssignPackageToStudent(ctx context.Context, studentUUID string, packageID int) error {
	var studentProfile domain.StudentProfile
	// Find the student profile by user_uuid
	if err := r.db.WithContext(ctx).Preload("Packages").First(&studentProfile, "user_uuid = ?", studentUUID).Error; err != nil {
		return err
	}

	// Check if the package exists
	var pkg domain.Package
	if err := r.db.WithContext(ctx).First(&pkg, "id = ?", packageID).Error; err != nil {
		return err
	}

	// Create a new StudentPackage
	studentPackage := domain.StudentPackage{
		StudentUUID:    studentUUID,
		PackageID:      packageID,
		RemainingQuota: pkg.Quota,
		StartDate:      time.Now(),
		EndDate:        time.Now().AddDate(0, 1, 0), // Example: 1 month duration
	}

	// Save the new StudentPackage
	if err := r.db.WithContext(ctx).Create(&studentPackage).Error; err != nil {
		return err
	}

	return nil
}
