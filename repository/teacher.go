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

// ✅ Get all schedules owned by a teacher
func (r *teacherRepository) GetMySchedules(ctx context.Context, teacherUUID string) ([]domain.TeacherSchedule, error) {
	var schedules []domain.TeacherSchedule
	err := r.db.WithContext(ctx).
		Where("teacher_uuid = ? AND deleted_at IS NULL", teacherUUID).
		Order("day_of_week, start_time").
		Find(&schedules).Error
	return schedules, err
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
