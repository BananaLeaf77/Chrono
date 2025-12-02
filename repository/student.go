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

type studentRepository struct {
	db *gorm.DB
}

func NewStudentRepository(db *gorm.DB) domain.StudentRepository {
	return &studentRepository{db: db}
}

func (r *studentRepository) CancelBookedClass(ctx context.Context, bookingID int, studentUUID string, reason *string) error {
	tx := r.db.WithContext(ctx).Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	var booking domain.Booking

	// 🔍 Load booking + schedule
	if err := tx.Preload("Schedule").
		Where("id = ? AND status = ?", bookingID, domain.StatusBooked).
		First(&booking).Error; err != nil {
		tx.Rollback()
		return errors.New("booking tidak ditemukan atau sudah dibatalkan")
	}

	// ✅ Ownership check
	if booking.StudentUUID != studentUUID {
		tx.Rollback()
		return errors.New("anda tidak memiliki akses ke booking ini")
	}

	// 🔎 Get class history to check actual date
	var classHistory domain.ClassHistory
	if err := tx.Where("booking_id = ?", booking.ID).First(&classHistory).Error; err != nil {
		tx.Rollback()
		return errors.New("data kelas tidak ditemukan untuk booking ini")
	}

	// 🕐 Check if within allowed time (H-1)
	if time.Until(classHistory.Date) < 24*time.Hour {
		tx.Rollback()
		return errors.New("pembatalan hanya dapat dilakukan maksimal H-1 sebelum kelas dimulai")
	}

	// 🔁 Update booking status
	cancelTime := time.Now()
	if err := tx.Model(&domain.Booking{}).
		Where("id = ?", booking.ID).
		Updates(map[string]interface{}{
			"status":       domain.StatusCancelled,
			"cancelled_at": cancelTime,
			"canceled_by":  studentUUID,
			"notes":        reason,
		}).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("gagal membatalkan booking: %w", err)
	}

	// 🔁 Update class history status
	if err := tx.Model(&domain.ClassHistory{}).
		Where("booking_id = ?", booking.ID).
		Update("status", domain.StatusCancelled).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("gagal memperbarui status riwayat kelas: %w", err)
	}

	// ♻️ Refund quota (if class used a package)
	if classHistory.PackageID != nil {
		if err := tx.Model(&domain.StudentPackage{}).
			Where("student_uuid = ? AND package_id = ?", booking.StudentUUID, *classHistory.PackageID).
			UpdateColumn("remaining_quota", gorm.Expr("remaining_quota + ?", 1)).
			Error; err != nil {
			tx.Rollback()
			return fmt.Errorf("gagal mengembalikan kuota paket: %w", err)
		}
	}

	// 🔓 Mark schedule as available again
	if err := tx.Model(&domain.TeacherSchedule{}).
		Where("id = ?", booking.ScheduleID).
		Update("is_booked", false).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("gagal memperbarui jadwal pengajar: %w", err)
	}

	// ✅ Commit
	if err := tx.Commit().Error; err != nil {
		return fmt.Errorf("gagal menyimpan pembatalan: %w", err)
	}

	return nil
}

func (r *studentRepository) BookClass(ctx context.Context, studentUUID string, scheduleID int) error {
	tx := r.db.WithContext(ctx).Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 1️⃣ Get student with packages
	var student domain.User
	if err := tx.Preload("StudentProfile.Packages.Package.Instrument").
		Where("uuid = ? AND role = ? AND deleted_at IS NULL", studentUUID, domain.RoleStudent).
		First(&student).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("gagal mengambil data student: %w", err)
	}

	// 2️⃣ Check if student has a profile
	if student.StudentProfile == nil {
		tx.Rollback()
		return errors.New("profile student tidak ditemukan, silakan hubungi admin")
	}

	// 3️⃣ Find active packages with quota
	now := time.Now()
	activePackages := []domain.StudentPackage{}
	for _, sp := range student.StudentProfile.Packages {
		if sp.RemainingQuota > 0 && sp.EndDate.After(now) {
			activePackages = append(activePackages, sp)
		}
	}

	if len(activePackages) == 0 {
		tx.Rollback()
		return errors.New("tidak ada paket aktif dengan kuota tersisa")
	}

	// 4️⃣ Get schedule with teacher profile
	var schedule domain.TeacherSchedule
	if err := tx.Preload("TeacherProfile.Instruments").
		Where("id = ? AND is_booked = ? AND deleted_at IS NULL", scheduleID, false).
		First(&schedule).Error; err != nil {
		tx.Rollback()
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("jadwal tidak tersedia atau sudah dibooking")
		}
		return fmt.Errorf("gagal mengambil jadwal: %w", err)
	}

	// 5️⃣ Calculate next class date
	classDate := utils.GetNextClassDate(schedule.DayOfWeek, schedule.StartTime)

	// ✅ Validate class date is in the future
	if classDate.Before(now) {
		classDate = classDate.AddDate(0, 0, 7) // Next week
	}

	// 6️⃣ Check if student already has a booking at this time
	var existingBooking domain.Booking
	if err := tx.Preload("Schedule").
		Where("student_uuid = ? AND status IN ?", studentUUID, []string{domain.StatusBooked, domain.StatusRescheduled}).
		Find(&existingBooking).Error; err == nil {
		// Check for time conflicts
		existingDate := utils.GetNextClassDate(existingBooking.Schedule.DayOfWeek, existingBooking.Schedule.StartTime)
		if existingDate.Equal(classDate) {
			// Check if times overlap
			if schedule.StartTime.Hour() == existingBooking.Schedule.StartTime.Hour() &&
				schedule.StartTime.Minute() == existingBooking.Schedule.StartTime.Minute() {
				tx.Rollback()
				return errors.New("anda sudah memiliki booking di waktu yang sama")
			}
		}
	}

	// 7️⃣ Find matching package by instrument
	var selectedPackage *domain.StudentPackage
	for i, sp := range activePackages {
		if sp.Package != nil && sp.Package.InstrumentID > 0 {
			// Check if teacher teaches this instrument
			for _, inst := range schedule.TeacherProfile.Instruments {
				if inst.ID == sp.Package.InstrumentID {
					if selectedPackage == nil || sp.RemainingQuota > selectedPackage.RemainingQuota {
						selectedPackage = &activePackages[i]
					}
				}
			}
		}
	}

	if selectedPackage == nil {
		tx.Rollback()
		return errors.New("tidak ada paket yang sesuai dengan instrumen yang diajarkan guru ini")
	}

	// 8️⃣ Create booking
	newBooking := domain.Booking{
		StudentUUID: studentUUID,
		ScheduleID:  schedule.ID,
		ClassDate:   classDate,
		Status:      domain.StatusBooked,
		BookedAt:    time.Now(),
	}
	if err := tx.Create(&newBooking).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("gagal membuat booking: %w", err)
	}

	// 9️⃣ Mark schedule as booked
	if err := tx.Model(&domain.TeacherSchedule{}).
		Where("id = ?", schedule.ID).
		Update("is_booked", true).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("gagal memperbarui status jadwal: %w", err)
	}

	// 🔟 Reduce quota
	if err := tx.Model(&domain.StudentPackage{}).
		Where("student_uuid = ? AND package_id = ?", studentUUID, selectedPackage.PackageID).
		UpdateColumn("remaining_quota", gorm.Expr("remaining_quota - ?", 1)).
		Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("gagal mengurangi kuota paket: %w", err)
	}

	// ✅ Commit
	if err := tx.Commit().Error; err != nil {
		return fmt.Errorf("gagal menyimpan booking: %w", err)
	}

	return nil
}

func (r *studentRepository) GetMyBookedClasses(ctx context.Context, studentUUID string) (*[]domain.Booking, error) {
	var bookings []domain.Booking

	err := r.db.WithContext(ctx).
		Where("student_uuid = ? AND status IN ?", studentUUID, []string{domain.StatusBooked, domain.StatusRescheduled}).
		Preload("Schedule").
		Preload("Schedule.Teacher").
		Preload("Schedule.TeacherProfile.Instruments").
		Order("class_date ASC, booked_at DESC").
		Find(&bookings).Error

	if err != nil {
		return nil, fmt.Errorf("failed to fetch booked classes: %w", err)
	}

	// ✅ Add status indicators
	now := time.Now()
	for i := range bookings {
		classDateTime := time.Date(
			bookings[i].ClassDate.Year(),
			bookings[i].ClassDate.Month(),
			bookings[i].ClassDate.Day(),
			bookings[i].Schedule.StartTime.Hour(),
			bookings[i].Schedule.StartTime.Minute(),
			0, 0, time.Local,
		)

		switch {
		case now.Before(classDateTime):
			bookings[i].Status = domain.StatusUpcoming
		case now.After(classDateTime.Add(time.Hour)):
			bookings[i].IsReadyToFinish = true
		}
	}

	return &bookings, nil
}

func (r *studentRepository) GetStudentInstrumentIDs(ctx context.Context, studentUUID string) ([]int, error) {
	var ids []int
	err := r.db.WithContext(ctx).
		Table("student_packages").
		Select("packages.instrument_id").
		Joins("JOIN packages ON packages.id = student_packages.package_id").
		Where("student_packages.student_uuid = ?", studentUUID).
		Where("student_packages.end_date >= ?", time.Now()).
		Scan(&ids).Error
	return ids, err
}

func (r *studentRepository) GetAvailableSchedules(ctx context.Context, studentUUID string) (*[]domain.TeacherSchedule, error) {
	// 1️⃣ Get student with packages
	var student domain.User
	err := r.db.WithContext(ctx).
		Preload("StudentProfile.Packages.Package.Instrument").
		Where("uuid = ? AND role = ? AND deleted_at IS NULL", studentUUID, domain.RoleStudent).
		First(&student).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("student tidak ditemukan")
		}
		return nil, fmt.Errorf("gagal mengambil data student: %w", err)
	}

	if student.StudentProfile == nil {
		return nil, fmt.Errorf("student belum memiliki paket apapun")
	}

	// 2️⃣ Get active packages and collect instrument IDs
	now := time.Now()
	instrumentIDs := make(map[int]bool)
	hasActivePackage := false

	for _, sp := range student.StudentProfile.Packages {
		isActive := sp.RemainingQuota > 0 && sp.EndDate.After(now)
		if isActive && sp.Package != nil {
			instrumentIDs[sp.Package.InstrumentID] = true
			hasActivePackage = true
		}
	}

	if !hasActivePackage {
		return &[]domain.TeacherSchedule{}, nil // Return empty array, not error
	}

	// Convert map to slice
	var instrumentIDSlice []int
	for id := range instrumentIDs {
		instrumentIDSlice = append(instrumentIDSlice, id)
	}

	// 3️⃣ Get available schedules matching student's instruments
	var schedules []domain.TeacherSchedule
	err = r.db.WithContext(ctx).
		Distinct("teacher_schedules.*").
		Table("teacher_schedules").
		Joins("JOIN teacher_profiles ON teacher_profiles.user_uuid = teacher_schedules.teacher_uuid").
		Joins("JOIN teacher_instruments ON teacher_instruments.teacher_profile_user_uuid = teacher_profiles.user_uuid").
		Where("teacher_instruments.instrument_id IN ?", instrumentIDSlice).
		Where("teacher_schedules.is_booked = ?", false).
		Where("teacher_schedules.deleted_at IS NULL").
		Preload("Teacher").
		Preload("TeacherProfile.Instruments").
		Order("teacher_schedules.day_of_week ASC, teacher_schedules.start_time ASC").
		Find(&schedules).Error

	if err != nil {
		return nil, fmt.Errorf("gagal mengambil jadwal guru: %w", err)
	}

	// 4️⃣ Add next class date to each schedule
	for i := range schedules {
		nextDate := utils.GetNextClassDate(schedules[i].DayOfWeek, schedules[i].StartTime)
		schedules[i].NextClassDate = &nextDate
	}

	return &schedules, nil
}

func (r *studentRepository) GetAllAvailablePackages(ctx context.Context) (*[]domain.Package, error) {
	var packages []domain.Package
	if err := r.db.WithContext(ctx).Preload("Instrument").Where("deleted_at IS NULL").Find(&packages).Error; err != nil {
		return nil, err
	}
	return &packages, nil
}

func (r *studentRepository) GetMyProfile(ctx context.Context, userUUID string) (*domain.User, error) {
	var student domain.User
	err := r.db.WithContext(ctx).
		Preload("StudentProfile.Packages", "end_date >= ?", time.Now()).
		Preload("StudentProfile.Packages.Package.Instrument").
		Where("uuid = ? AND role = ? AND deleted_at IS NULL", userUUID, domain.RoleStudent).
		First(&student).Error
	if err != nil {
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
	err := tx.Where("uuid = ? AND role = ? AND deleted_at IS NULL", uuid, domain.RoleStudent).First(&existingUser).Error
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
