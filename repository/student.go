package repository

import (
	"chronosphere/domain"
	"context"
	"errors"
	"fmt"

	"gorm.io/gorm"
)

type studentRepository struct {
	db *gorm.DB
}

func NewStudentRepository(db *gorm.DB) domain.StudentRepository {
	return &studentRepository{db: db}
}

func (r *studentRepository) GetMyBookedClasses(ctx context.Context, studentUUID string) (*[]domain.Booking, error) {
	var bookings []domain.Booking

	err := r.db.WithContext(ctx).
		Where("student_uuid = ? AND status != ?", studentUUID, domain.StatusCancelled).
		Preload("Schedule").
		Preload("Schedule.TeacherProfile.Instruments").
		Preload("Schedule.TeacherProfile").
		Preload("Schedule.TeacherProfile.Instruments").
		Preload("Student").
		Order("booked_at DESC").
		Find(&bookings).Error

	if err != nil {
		return nil, fmt.Errorf("failed to fetch booked classes: %w", err)
	}

	return &bookings, nil
}

func (r *studentRepository) GetStudentInstrumentIDs(ctx context.Context, studentUUID string) ([]int, error) {
	var student domain.User

	err := r.db.WithContext(ctx).
		Preload("StudentProfile.Packages.Package").
		Where("uuid = ? AND role = ?", studentUUID, domain.RoleStudent).
		First(&student).Error
	if err != nil {
		return nil, fmt.Errorf("failed to fetch student: %w", err)
	}

	if student.StudentProfile == nil {
		return nil, fmt.Errorf("tidak ada paket terdaftar")
	}

	instrumentIDs := make(map[int]bool)
	for _, sp := range student.StudentProfile.Packages {
		if sp.Package != nil {
			instrumentIDs[sp.Package.InstrumentID] = true
		}
	}

	// Convert map to slice (unique IDs)
	result := make([]int, 0, len(instrumentIDs))
	for id := range instrumentIDs {
		result = append(result, id)
	}

	return result, nil
}

// ✅ Get available schedules for teachers that teach those instruments
func (r *studentRepository) GetAvailableSchedules(ctx context.Context, instrumentIDs []int) (*[]domain.TeacherSchedule, error) {
	if len(instrumentIDs) == 0 {
		return &[]domain.TeacherSchedule{}, nil
	}

	var schedules []domain.TeacherSchedule

	err := r.db.WithContext(ctx).
		Table("teacher_schedules").
		Joins("JOIN teacher_profiles ON teacher_profiles.user_uuid = teacher_schedules.teacher_uuid").
		Joins("JOIN teacher_instruments ON teacher_instruments.teacher_profile_user_uuid = teacher_profiles.user_uuid").
		Where("teacher_instruments.instrument_id IN ?", instrumentIDs).
		Where("teacher_schedules.is_booked = ?", false).
		Where("teacher_schedules.deleted_at IS NULL").
		Preload("TeacherProfile").
		Preload("TeacherProfile.Instruments").
		Order("teacher_schedules.day_of_week, teacher_schedules.start_time ASC").
		Find(&schedules).Error

	if err != nil {
		return nil, fmt.Errorf("failed to fetch available schedules: %w", err)
	}

	return &schedules, nil
}

func (r *studentRepository) GetAllAvailablePackages(ctx context.Context) (*[]domain.Package, error) {
	var packages []domain.Package
	if err := r.db.WithContext(ctx).Where("deleted_at IS NULL").Find(&packages).Error; err != nil {
		return nil, err
	}
	return &packages, nil
}

func (r *studentRepository) GetMyProfile(ctx context.Context, userUUID string) (*domain.User, error) {
	var student domain.User
	if err := r.db.WithContext(ctx).Preload("StudentProfile").Where("uuid = ? AND role = ?", userUUID, "student").First(&student).Error; err != nil {
		return nil, err
	}
	return &student, nil
}

func (r *studentRepository) UpdateStudentData(ctx context.Context, uuid string, payload domain.User) error {
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
			return errors.New("pengguna tidak ditemukan")
		}
		return fmt.Errorf("error mencari pengguna: %w", err)
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
		return errors.New("email sudah digunakan oleh pengguna lain")
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
		return errors.New("nomor telepon sudah digunakan oleh pengguna lain")
	}

	// Update user data
	err = tx.Model(&domain.User{}).
		Where("uuid = ?", uuid).
		Updates(payload).Error
	if err != nil {
		tx.Rollback()
		return fmt.Errorf("gagal memperbarui data pengguna: %w", err)
	}

	// Commit transaction jika semua berhasil
	if err := tx.Commit().Error; err != nil {
		return fmt.Errorf("gagal commit transaction: %w", err)
	}

	return nil
}
