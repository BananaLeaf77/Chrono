package repository

import (
	"chronosphere/domain"
	"context"
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
	var student domain.User
	if err := r.db.WithContext(ctx).
		Preload("StudentProfile.Packages", "end_date >= ?", time.Now()).
		Where("uuid = ? AND role = ? AND deleted_at IS NULL", studentUUID, domain.RoleStudent).
		First(&student).Error; err != nil {
		return err
	}

	var pkg domain.Package
	if err := r.db.WithContext(ctx).First(&pkg, packageID).Error; err != nil {
		return err
	}

	for i, sp := range student.StudentProfile.Packages {
		if sp.PackageID == packageID {
			student.StudentProfile.Packages[i].Package.Quota += incomingQuota
			return r.db.WithContext(ctx).Save(&student.StudentProfile.Packages[i]).Error
		} else {
			return fmt.Errorf("paket tidak ditemukan pada student (expired/belum subscribe)")
		}
	}

	return nil
}
