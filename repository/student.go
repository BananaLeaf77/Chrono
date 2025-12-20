package repository

import (
	"chronosphere/domain"
	"chronosphere/utils"
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"gorm.io/gorm"
)

type studentRepository struct {
	db *gorm.DB
}

func NewStudentRepository(db *gorm.DB) domain.StudentRepository {
	return &studentRepository{db: db}
}

// Student's history (your current function fixed):
func (r *studentRepository) GetMyClassHistory(ctx context.Context, studentUUID string) (*[]domain.ClassHistory, error) {
	var histories []domain.ClassHistory

	err := r.db.WithContext(ctx).
		Preload("Booking").
		Preload("Booking.Schedule").
		Preload("Booking.Schedule.Teacher").
		Preload("Booking.Schedule.TeacherProfile").
		Preload("Booking.Schedule.TeacherProfile.Instruments").
		Preload("Booking.Student").
		Preload("Booking.StudentPackage").
		Preload("Booking.StudentPackage.Package").
		Preload("Documentations").
		Joins("LEFT JOIN bookings ON class_histories.booking_id = bookings.id").
		Where("bookings.student_uuid = ?", studentUUID). // Filter by student UUID
		Order("bookings.class_date DESC").
		Find(&histories).Error

	if err != nil {
		return nil, fmt.Errorf("failed to fetch class history: %w", err)
	}

	return &histories, nil
}

func (r *studentRepository) CancelBookedClass(
	ctx context.Context,
	bookingID int,
	studentUUID string,
	reason *string,
) error {

	tx := r.db.WithContext(ctx).Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	var booking domain.Booking

	// Load booking + schedule
	if err := tx.Preload("Schedule").
		Where("id = ? AND status = ?", bookingID, domain.StatusBooked).
		First(&booking).Error; err != nil {
		tx.Rollback()
		return errors.New("booking tidak ditemukan atau sudah dibatalkan")
	}

	// Ownership check
	if booking.StudentUUID != studentUUID {
		tx.Rollback()
		return errors.New("anda tidak memiliki akses ke booking ini")
	}

	// Check if class is in the future
	if booking.ClassDate.Before(time.Now()) {
		tx.Rollback()
		return errors.New("tidak bisa membatalkan kelas yang sudah lewat")
	}

	// H-1 cancellation rule (24 hours before class)
	minCancelTime := booking.ClassDate.Add(-24 * time.Hour)
	if time.Now().After(minCancelTime) {
		tx.Rollback()
		return errors.New("pembatalan hanya bisa dilakukan minimal H-1 (24 jam) sebelum kelas")
	}

	// Default reason
	if reason == nil || *reason == "" {
		defaultReason := "Alasan tidak diberikan"
		reason = &defaultReason
	}

	cancelTime := time.Now()

	// 🔁 Update booking status
	if err := tx.Model(&booking).
		UpdateColumns(map[string]interface{}{
			"status":       domain.StatusCancelled,
			"cancelled_at": cancelTime,
			"canceled_by":  studentUUID,
			"notes":        reason,
		}).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("gagal membatalkan booking: %w", err)
	}

	// 🔁 Refund quota to the exact package used in this booking
	if err := tx.Model(&domain.StudentPackage{}).
		Where("id = ?", booking.StudentPackageID).
		Update("remaining_quota", gorm.Expr("remaining_quota + 1")).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("gagal refund quota: %w", err)
	}

	// 🔁 Update schedule availability
	if err := tx.Model(&domain.TeacherSchedule{}).
		Where("id = ?", booking.ScheduleID).
		Update("is_booked", false).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("gagal memperbarui jadwal pengajar: %w", err)
	}

	// 🔁 Update or Insert into ClassHistory
	var history domain.ClassHistory
	err := tx.Where("booking_id = ?", booking.ID).First(&history).Error

	if errors.Is(err, gorm.ErrRecordNotFound) {
		// Insert new cancel history
		newHistory := domain.ClassHistory{
			BookingID: booking.ID,
			Status:    domain.StatusCancelled,
			Notes:     reason,
		}
		if err := tx.Create(&newHistory).Error; err != nil {
			tx.Rollback()
			return fmt.Errorf("gagal membuat riwayat kelas (cancel): %w", err)
		}
	} else if err == nil {
		// Update existing history
		history.Status = domain.StatusCancelled
		history.Notes = reason
		if err := tx.Save(&history).Error; err != nil {
			tx.Rollback()
			return fmt.Errorf("gagal update class history: %w", err)
		}
	} else {
		tx.Rollback()
		return err
	}

	// Commit
	if err := tx.Commit().Error; err != nil {
		return fmt.Errorf("gagal menyimpan pembatalan: %w", err)
	}

	return nil
}
func (r *studentRepository) BookClass(
	ctx context.Context, studentUUID string, scheduleID int, packageID int) error {
	tx := r.db.WithContext(ctx).Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 1️⃣ Verify and get the student package
	var studentPackage domain.StudentPackage
	err := tx.Preload("Package.Instrument").
		Where("id = ? AND student_uuid = ?", packageID, studentUUID).
		First(&studentPackage).Error

	if err != nil {
		tx.Rollback()
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("paket tidak ditemukan atau bukan milik anda")
		}
		return fmt.Errorf("gagal memverifikasi paket: %w", err)
	}

	// 2️⃣ Check package is active and has quota
	now := time.Now()
	if studentPackage.EndDate.Before(now) {
		tx.Rollback()
		return errors.New("paket sudah kadaluarsa, silakan perpanjang paket anda")
	}

	if studentPackage.RemainingQuota <= 0 {
		tx.Rollback()
		return errors.New("kuota paket sudah habis, silakan perpanjang atau beli paket baru")
	}

	// 3️⃣ Get schedule with teacher profile and instruments
	var schedule domain.TeacherSchedule
	err = tx.Preload("Teacher").
		Preload("TeacherProfile.Instruments").
		Where("id = ? AND deleted_at IS NULL", scheduleID).
		First(&schedule).Error

	if err != nil {
		tx.Rollback()
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("jadwal tidak ditemukan")
		}
		return fmt.Errorf("gagal mengambil jadwal: %w", err)
	}

	// 4️⃣ Verify schedule is available
	if schedule.IsBooked {
		tx.Rollback()
		return errors.New("jadwal sudah dibooking oleh siswa lain")
	}

	// 5️⃣ ✅ CRITICAL: Check if teacher teaches the instrument in student's package
	teacherInstrumentIDs := make(map[int]bool)
	var teacherInstrumentNames []string
	for _, inst := range schedule.TeacherProfile.Instruments {
		teacherInstrumentIDs[inst.ID] = true
		teacherInstrumentNames = append(teacherInstrumentNames, inst.Name)
	}

	if !teacherInstrumentIDs[studentPackage.Package.InstrumentID] {
		tx.Rollback()
		instrumentName := studentPackage.Package.Instrument.Name
		teacherInstrumentsStr := strings.Join(teacherInstrumentNames, ", ")

		return fmt.Errorf(
			"guru ini tidak mengajar %s. Guru hanya mengajar: %s. Silakan pilih jadwal guru yang mengajar %s",
			instrumentName,
			teacherInstrumentsStr,
			instrumentName,
		)
	}

	// 6️⃣ Calculate next class date
	classDate := utils.GetNextClassDate(schedule.DayOfWeek, schedule.StartTime)
	if classDate.Before(now) {
		classDate = classDate.AddDate(0, 0, 7) // Next week
	}

	// 7️⃣ Check if student already has a booking at this exact time
	var existingBookingCount int64
	err = tx.Model(&domain.Booking{}).
		Joins("JOIN teacher_schedules ON teacher_schedules.id = bookings.schedule_id").
		Where("bookings.student_uuid = ?", studentUUID).
		Where("bookings.status IN ?", []string{domain.StatusBooked, domain.StatusRescheduled}).
		Where("bookings.class_date = ?", classDate).
		Where("teacher_schedules.start_time = ?", schedule.StartTime).
		Count(&existingBookingCount).Error

	if err != nil {
		tx.Rollback()
		return fmt.Errorf("gagal memeriksa konflik jadwal: %w", err)
	}

	if existingBookingCount > 0 {
		tx.Rollback()
		return fmt.Errorf(
			"anda sudah memiliki kelas di %s pukul %s. Silakan pilih waktu lain",
			utils.GetDayName(classDate.Weekday()),
			schedule.StartTime.Format("15:04"),
		)
	}

	// 8️⃣ Create booking
	newBooking := domain.Booking{
		StudentUUID:      studentUUID,
		ScheduleID:       schedule.ID,
		StudentPackageID: studentPackage.ID, // ✅ LINK TO VERIFIED PACKAGE
		ClassDate:        classDate,
		Status:           domain.StatusBooked,
		BookedAt:         time.Now(),
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

	// 🔟 Reduce quota from the specified package
	if err := tx.Model(&domain.StudentPackage{}).
		Where("id = ?", studentPackage.ID).
		UpdateColumn("remaining_quota", gorm.Expr("remaining_quota - ?", 1)).
		Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("gagal mengurangi kuota paket: %w", err)
	}

	// ✅ Commit transaction
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
		// Add JOIN with users table to check if teacher is not deleted
		Joins("JOIN users ON users.uuid = teacher_schedules.teacher_uuid").
		Where("teacher_instruments.instrument_id IN ?", instrumentIDSlice).
		Where("teacher_schedules.is_booked = ?", false).
		Where("teacher_schedules.deleted_at IS NULL").
		// Ensure teacher user is not soft-deleted
		Where("users.deleted_at IS NULL").
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
	// var emailCount int64
	// err = tx.Model(&domain.User{}).
	// 	Where("email = ? AND uuid != ?", payload.Email, uuid).
	// 	Count(&emailCount).Error
	// if err != nil {
	// 	tx.Rollback()
	// 	return fmt.Errorf("error checking email: %w", err)
	// }
	// if emailCount > 0 {
	// 	tx.Rollback()
	// 	return errors.New("email sudah digunakan oleh pengguna lain")
	// }

	// Check phone duplicate dengan user lain
	var phoneCount int64
	err = tx.Model(&domain.User{}).
		Where("phone = ? AND uuid != ?", payload.Phone, uuid).
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
