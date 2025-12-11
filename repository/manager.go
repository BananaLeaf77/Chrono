package repository

import (
	"chronosphere/domain"
	"context"
	"errors"
	"fmt"
	"time"

	"gorm.io/gorm"
)

type managerRepo struct {
	db *gorm.DB
}

func NewManagerRepository(db *gorm.DB) domain.ManagerRepository {
	return &managerRepo{db: db}
}

func (r *managerRepo) GetAllStudents(ctx context.Context) ([]domain.User, error) {
	var students []domain.User
	if err := r.db.WithContext(ctx).
		Preload("StudentProfile.Packages", "end_date >= ?", time.Now()).
		Preload("StudentProfile.Packages.Package.Instrument").
		Where("role = ? AND deleted_at IS NULL", domain.RoleStudent).
		Find(&students).Error; err != nil {
		return nil, err
	}
	return students, nil
}

func (r *managerRepo) GetStudentByUUID(ctx context.Context, uuid string) (*domain.User, error) {
	var student domain.User
	if err := r.db.WithContext(ctx).
		Preload("StudentProfile.Packages", "end_date >= ?", time.Now()).
		Preload("StudentProfile.Packages.Package.Instrument").
		Where("uuid = ? AND role = ? AND deleted_at IS NULL", uuid, domain.RoleStudent).
		First(&student).Error; err != nil {
		return nil, err
	}
	return &student, nil
}

func (r *managerRepo) ModifyStudentPackageQuota(ctx context.Context, studentUUID string, packageID int, incomingQuota int) error {
	// First, find the student package directly
	var studentPackage domain.StudentPackage
	if err := r.db.WithContext(ctx).
		Preload("Package").
		Where("student_uuid = ? AND package_id = ? AND end_date >= ?", studentUUID, packageID, time.Now()).
		First(&studentPackage).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return fmt.Errorf("active package not found for this student")
		}
		return err
	}

	// Verify the student exists and has the correct role
	var student domain.User
	if err := r.db.WithContext(ctx).
		Where("uuid = ? AND role = ? AND deleted_at IS NULL", studentUUID, domain.RoleStudent).
		First(&student).Error; err != nil {
		return err
	}

	// Update the remaining quota
	studentPackage.RemainingQuota = incomingQuota

	// Ensure remaining quota doesn't go negative
	if studentPackage.RemainingQuota < 0 {
		studentPackage.RemainingQuota = 0
	}

	return r.db.WithContext(ctx).Save(&studentPackage).Error
}
