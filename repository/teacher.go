package repository

import (
	"chronosphere/domain"
	"chronosphere/utils"
	"context"
	"errors"
	"fmt"
	"time"

	"gorm.io/gorm"
)

type teacherRepository struct {
	db *gorm.DB
}

func NewTeacherRepository(db *gorm.DB) domain.TeacherRepository {
	return &teacherRepository{db: db}
}

func (r *teacherRepository) GetMyClassHistory(ctx context.Context, teacherUUID string) (*[]domain.ClassHistory, error) {
	var histories []domain.ClassHistory

	err := r.db.WithContext(ctx).
		Where("teacher_uuid = ?", teacherUUID).
		Preload("Booking").
		Preload("Booking.Schedule").
		Preload("Booking.Schedule.Teacher").
		Preload("Booking.Schedule.Student").
		Preload("Booking.Schedule.TeacherProfile.Instruments").
		Preload("Teacher").
		Preload("Documentations").
		Order("date DESC, start_time DESC").
		Find(&histories).Error

	if err != nil {
		return nil, fmt.Errorf("failed to fetch class history: %w", err)
	}

	return &histories, nil
}

func (r *teacherRepository) AddAvailability(ctx context.Context, schedules *[]domain.TeacherSchedule) error {
	// ✅ Check for overlaps BEFORE inserting
	for _, schedule := range *schedules {
		var count int64
		err := r.db.WithContext(ctx).
			Model(&domain.TeacherSchedule{}).
			Where("teacher_uuid = ? AND day_of_week = ? AND deleted_at IS NULL", schedule.TeacherUUID, schedule.DayOfWeek).
			Where(`
				(start_time, end_time) OVERLAPS (?, ?)
			`, schedule.StartTime, schedule.EndTime).
			Count(&count).Error
		if err != nil {
			return fmt.Errorf("failed to check overlap: %w", err)
		}
		if count > 0 {
			return fmt.Errorf("slot waktu %s %s-%s konflik dengan jadwal yang sudah ada",
				schedule.DayOfWeek,
				schedule.StartTime.Format("15:04"),
				schedule.EndTime.Format("15:04"))
		}
	}

	// ✅ If no conflicts, insert all schedules
	if err := r.db.WithContext(ctx).Create(schedules).Error; err != nil {
		return fmt.Errorf("failed to add schedule: %w", err)
	}

	return nil
}

func (r *teacherRepository) FinishClass(ctx context.Context, bookingID int, teacherUUID string, payload domain.ClassHistory) error {
	tx := r.db.WithContext(ctx).Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 1️⃣ Get booking
	var booking domain.Booking
	err := tx.Preload("Schedule").
		Where("id = ? AND status = ?", bookingID, domain.StatusBooked).
		First(&booking).Error
	if err != nil {
		tx.Rollback()
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("booking tidak ditemukan atau sudah selesai")
		}
		return fmt.Errorf("gagal mengambil booking: %w", err)
	}

	// 2️⃣ Verify teacher ownership
	if booking.Schedule.TeacherUUID != teacherUUID {
		tx.Rollback()
		return errors.New("anda tidak memiliki akses ke booking ini")
	}

	// 3️⃣ Verify class time has passed
	classEndTime := time.Date(
		booking.ClassDate.Year(),
		booking.ClassDate.Month(),
		booking.ClassDate.Day(),
		booking.Schedule.EndTime.Hour(),
		booking.Schedule.EndTime.Minute(),
		0, 0, time.Local,
	)

	if time.Now().Before(classEndTime) {
		tx.Rollback()
		return errors.New("kelas belum selesai, tunggu hingga waktu berakhir")
	}

	// 6️⃣ Create ClassHistory
	classHistory := domain.ClassHistory{
		BookingID: booking.ID,
		Status:    domain.StatusCompleted,
		Notes:     payload.Notes,
	}

	if err := tx.Create(&classHistory).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("gagal membuat riwayat kelas: %w", err)
	}

	// 7️⃣ Save documentations
	for _, doc := range payload.Documentations {
		doc.ClassHistoryID = classHistory.ID
		if err := tx.Create(&doc).Error; err != nil {
			tx.Rollback()
			return fmt.Errorf("gagal menyimpan dokumentasi: %w", err)
		}
	}

	// 8️⃣ Update booking status
	completedAt := time.Now()
	if err := tx.Model(&domain.Booking{}).
		Where("id = ?", booking.ID).
		Updates(map[string]interface{}{
			"status":       domain.StatusCompleted,
			"completed_at": completedAt,
		}).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("gagal memperbarui status booking: %w", err)
	}

	// 9️⃣ Mark schedule as available again
	if err := tx.Model(&domain.TeacherSchedule{}).
		Where("id = ?", booking.ScheduleID).
		Update("is_booked", false).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("gagal memperbarui jadwal: %w", err)
	}

	// ✅ Commit
	if err := tx.Commit().Error; err != nil {
		return fmt.Errorf("gagal menyimpan transaksi: %w", err)
	}

	return nil
}

// func (r *teacherRepository) AddAvailability(ctx context.Context, schedule *domain.TeacherSchedule) error {
// 	var count int64
// 	err := r.db.WithContext(ctx).
// 		Model(&domain.TeacherSchedule{}).
// 		Where("teacher_uuid = ? AND day_of_week = ? AND deleted_at IS NULL", schedule.TeacherUUID, schedule.DayOfWeek).
// 		Where(`
// 			(start_time, end_time) OVERLAPS (?, ?)
// 		`, schedule.StartTime, schedule.EndTime).
// 		Count(&count).Error
// 	if err != nil {
// 		return fmt.Errorf("failed to check overlap: %w", err)
// 	}
// 	if count > 0 {
// 		return errors.New("slot waktu konflik mohon check kembali waktu anda")
// 	}

// 	// If no conflicts, proceed
// 	if err := r.db.WithContext(ctx).Create(schedule).Error; err != nil {
// 		return fmt.Errorf("failed to add schedule: %w", err)
// 	}

// 	return nil
// }

func (r *teacherRepository) GetMyProfile(ctx context.Context, userUUID string) (*domain.User, error) {
	var teacher domain.User
	if err := r.db.WithContext(ctx).Preload("TeacherProfile.Instruments").Where("uuid = ? AND role = ?", userUUID, "teacher").First(&teacher).Error; err != nil {
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
	err := tx.Where("uuid = ? AND role = ? AND deleted_at IS NULL", uuid, domain.RoleTeacher).First(&existingUser).Error
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

func (r *teacherRepository) DeleteAvailability(ctx context.Context, scheduleID int, teacherUUID string) error {
	var schedule domain.TeacherSchedule
	err := r.db.WithContext(ctx).
		Where("id = ? AND teacher_uuid = ? AND deleted_at IS NULL", scheduleID, teacherUUID).
		First(&schedule).Error
	if err != nil {
		return errors.New("jadwal tidak ditemukan")
	}

	// 1️⃣ Check if this schedule has any active bookings
	var count int64
	if err := r.db.WithContext(ctx).
		Model(&domain.Booking{}).
		Where("schedule_id = ? AND status IN ?", scheduleID, []string{"booked", "rescheduled"}).
		Count(&count).Error; err != nil {
		return err
	}

	if count > 0 {
		return errors.New("jadwal ini sudah dipesan, tidak bisa dihapus. harap lakukan pembatalan terlebih dahulu")
	}

	// 2️⃣ Check if the class has already completed (linked to ClassHistory)
	var completedCount int64
	if err := r.db.WithContext(ctx).
		Model(&domain.ClassHistory{}).
		Where("booking_id IN (SELECT id FROM bookings WHERE schedule_id = ?)", scheduleID).
		Count(&completedCount).Error; err != nil {
		return err
	}

	if completedCount > 0 {
		return errors.New("jadwal ini sudah memiliki riwayat kelas dan tidak dapat dihapus")
	}

	// 3️⃣ Soft delete (mark as deleted)
	if err := r.db.WithContext(ctx).Model(&domain.TeacherSchedule{}).
		Where("id = ?", scheduleID).
		Update("deleted_at", time.Now()).Error; err != nil {
		return err
	}

	return nil
}

func (r *teacherRepository) GetAllBookedClass(ctx context.Context, teacherUUID string) (*[]domain.Booking, error) {
	var bookings []domain.Booking

	err := r.db.WithContext(ctx).
		Preload("Student").
		Preload("Schedule").
		Preload("Schedule.Teacher").
		Where("schedule_id IN (SELECT id FROM teacher_schedules WHERE teacher_uuid = ? AND deleted_at IS NULL)", teacherUUID).
		Find(&bookings).Error

	if err != nil {
		return nil, err
	}

	now := time.Now()
	for i := range bookings {
		start := (bookings)[i].Schedule.StartTime
		end := (bookings)[i].Schedule.EndTime

		switch {
		case now.Before(start):
			(bookings)[i].Status = domain.StatusUpcoming
		case now.After(start) && now.Before(end):
			(bookings)[i].Status = domain.StatusOngoing
		case now.After(end):
			(bookings)[i].IsReadyToFinish = true
		}
	}
	return &bookings, nil
}

func (r *teacherRepository) CancelBookedClass(ctx context.Context, bookingID int, teacherUUID string) error {
	tx := r.db.WithContext(ctx).Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	var booking domain.Booking

	// 🔍 Load booking + schedule to verify ownership and timing
	if err := tx.Preload("Schedule").
		Where("id = ? AND status = ?", bookingID, "booked").
		First(&booking).Error; err != nil {
		tx.Rollback()
		return errors.New("booking tidak ditemukan atau sudah dibatalkan")
	}

	// ✅ Check that this teacher owns the booking
	if booking.Schedule.TeacherUUID != teacherUUID {
		tx.Rollback()
		return errors.New("anda tidak memiliki akses ke booking ini")
	}

	// 🕐 Check if cancellation is within allowed time window (H-1)
	classDate := utils.GetNextClassDate(booking.Schedule.DayOfWeek, booking.Schedule.StartTime)
	if time.Until(classDate) < 24*time.Hour {
		tx.Rollback()
		return errors.New("pembatalan hanya dapat dilakukan maksimal H-1 sebelum kelas dimulai")
	}

	// 🔁 Mark booking as cancelled
	cancelTime := time.Now()
	if err := tx.Model(&domain.Booking{}).
		Where("id = ?", booking.ID).
		Updates(map[string]interface{}{
			"status":       "cancelled",
			"cancelled_at": cancelTime,
		}).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("gagal membatalkan booking: %w", err)
	}

	// 🧾 Refund student’s quota (if linked to a package)
	var classHistory domain.ClassHistory
	if err := tx.Where("booking_id = ?", booking.ID).First(&classHistory).Error; err == nil {
		if err := tx.Model(&domain.StudentPackage{}).
			Where("student_uuid = ?", booking.StudentUUID).
			UpdateColumn("remaining_quota", gorm.Expr("remaining_quota + ?", 1)).
			Error; err != nil {
			tx.Rollback()
			return fmt.Errorf("gagal mengembalikan kuota paket: %w", err)
		}
	}

	// ✅ Commit transaction
	if err := tx.Commit().Error; err != nil {
		return fmt.Errorf("gagal menyimpan pembatalan: %w", err)
	}

	return nil
}
