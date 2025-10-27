package repository

import (
	"chronosphere/domain"
	"context"
	"errors"
	"fmt"

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

func (r *teacherRepository) UpdateTeacherData(ctx context.Context, uuid string, payload domain.User) error {
	// Mulai transaction
	tx := r.db.WithContext(ctx).Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Cek apakah user exists dan belum dihapus
	var existingUser domain.User
	err := tx.Where("uuid = ? AND deleted_at IS NULL", uuid).First(&existingUser).Error
	if err != nil {
		tx.Rollback()
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("guru tidak ditemukan")
		}
		return fmt.Errorf("error mencari guru: %w", err)
	}

	// Check email duplicate dengan user lain
	var emailCount int64
	err = tx.Model(&domain.User{}).
		Where("email = ? AND uuid != ? AND deleted_at IS NULL", payload.Email, uuid).
		Count(&emailCount).Error
	if err != nil {
		tx.Rollback()
		return fmt.Errorf("error checking email: %w", err)
	}
	if emailCount > 0 {
		tx.Rollback()
		return errors.New("email sudah digunakan oleh user lain")
	}

	// Check phone duplicate dengan user lain
	var phoneCount int64
	err = tx.Model(&domain.User{}).
		Where("phone = ? AND uuid != ? AND deleted_at IS NULL", payload.Phone, uuid).
		Count(&phoneCount).Error
	if err != nil {
		tx.Rollback()
		return fmt.Errorf("error checking phone: %w", err)
	}
	if phoneCount > 0 {
		tx.Rollback()
		return errors.New("nomor telepon sudah digunakan oleh user lain")
	}

	// Update user data
	err = tx.Model(&domain.User{}).
		Where("uuid = ?", uuid).
		Updates(payload).Error
	if err != nil {
		tx.Rollback()
		return fmt.Errorf("gagal memperbarui data guru: %w", err)
	}

	// Update TeacherProfile bio jika ada
	if payload.TeacherProfile != nil {
		// Cek apakah teacher profile sudah ada atau perlu dibuat baru
		var profileCount int64
		err = tx.Model(&domain.TeacherProfile{}).
			Where("user_uuid = ?", uuid).
			Count(&profileCount).Error
		if err != nil {
			tx.Rollback()
			return fmt.Errorf("error checking teacher profile: %w", err)
		}

		if profileCount > 0 {
			// Update existing profile
			err = tx.Model(&domain.TeacherProfile{}).
				Where("user_uuid = ?", uuid).
				Update("bio", payload.TeacherProfile.Bio).Error
		} else {
			// Create new profile
			err = tx.Create(&domain.TeacherProfile{
				UserUUID: uuid,
				Bio:      payload.TeacherProfile.Bio,
			}).Error
		}

		if err != nil {
			tx.Rollback()
			return fmt.Errorf("gagal memperbarui profil guru: %w", err)
		}
	}

	// Commit transaction jika semua berhasil
	if err := tx.Commit().Error; err != nil {
		return fmt.Errorf("gagal commit transaction: %w", err)
	}

	return nil
}

// ✅ Get all schedules owned by a teacher
func (r *teacherRepository) GetMySchedules(ctx context.Context, teacherUUID string) (*[]domain.TeacherSchedule, error) {
	var schedules []domain.TeacherSchedule
	err := r.db.WithContext(ctx).
		Where("teacher_uuid = ? AND deleted_at IS NULL", teacherUUID).
		Order("day_of_week, start_time").
		Find(&schedules).Error
	return &schedules, err
}

// ✅ Add new availability (schedule)
func (r *teacherRepository) AddAvailability(ctx context.Context, schedule *domain.TeacherSchedule) error {
	return r.db.WithContext(ctx).Create(schedule).Error
}

// ✅ Delete availability (only if not booked)
func (r *teacherRepository) DeleteAvailability(ctx context.Context, scheduleID int, teacherUUID string) error {
	return r.db.WithContext(ctx).
		Where("id = ? AND teacher_uuid = ? AND is_booked = false", scheduleID, teacherUUID).
		Delete(&domain.TeacherSchedule{}).Error
}
