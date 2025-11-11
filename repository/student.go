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

func (r *studentRepository) CancelBookedClass(ctx context.Context, bookingID int, studentUUID string) error {
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

	// ✅ Check that this student owns the booking
	if booking.StudentUUID != studentUUID {
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
			"status":       domain.StatusCancelled,
			"cancelled_at": cancelTime,
		}).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("gagal membatalkan booking: %w", err)
	}

	// 🧾 Refund student’s quota (if linked to a package)
	var classHistory domain.ClassHistory
	if err := tx.Where("booking_id = ?", booking.ID).First(&classHistory).Error; err == nil {
		if classHistory.PackageID != nil {
			if err := tx.Model(&domain.StudentPackage{}).
				Where("student_uuid = ? AND package_id = ?", booking.StudentUUID, *classHistory.PackageID).
				UpdateColumn("remaining_quota", gorm.Expr("remaining_quota + ?", 1)).
				Error; err != nil {
				tx.Rollback()
				return fmt.Errorf("gagal mengembalikan kuota paket: %w", err)
			}
		}
	}

	// ✅ Commit transaction
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

	// 1️⃣ Ambil student + packages (cek kuota dan masa aktif)
	var student domain.User
	if err := tx.
		Preload("StudentProfile.Packages.Package").
		Where("uuid = ? AND role = ?", studentUUID, domain.RoleStudent).
		First(&student).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("gagal mengambil data student: %w", err)
	}

	if student.StudentProfile == nil || len(student.StudentProfile.Packages) == 0 {
		tx.Rollback()
		return errors.New("student belum memiliki paket aktif")
	}

	now := time.Now()
	activeInstruments := map[int]bool{}
	for _, sp := range student.StudentProfile.Packages {
		if sp.Package != nil && sp.RemainingQuota > 0 && sp.EndDate.After(now) {
			activeInstruments[sp.Package.InstrumentID] = true
		}
	}
	if len(activeInstruments) == 0 {
		tx.Rollback()
		return errors.New("tidak ada paket aktif dengan kuota tersisa")
	}

	// 2️⃣ Ambil schedule dan validasi
	var schedule domain.TeacherSchedule
	if err := tx.Where("id = ? AND deleted_at IS NULL", scheduleID).First(&schedule).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("jadwal tidak ditemukan: %w", err)
	}

	if schedule.IsBooked {
		tx.Rollback()
		return errors.New("jadwal ini sudah dibooking oleh student lain")
	}

	// 3️⃣ Cek apakah teacher yang punya jadwal itu mengajar instrumen sesuai paket student
	var teacherInstruments []int
	if err := tx.
		Table("teacher_instruments").
		Select("instrument_id").
		Joins("JOIN teacher_profiles ON teacher_profiles.user_uuid = teacher_instruments.teacher_profile_user_uuid").
		Where("teacher_profiles.user_uuid = ?", schedule.TeacherUUID).
		Scan(&teacherInstruments).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("gagal memeriksa instrumen teacher: %w", err)
	}

	match := false
	for _, tid := range teacherInstruments {
		if activeInstruments[tid] {
			match = true
			break
		}
	}
	if !match {
		tx.Rollback()
		return errors.New("teacher tidak mengajar instrumen yang sesuai dengan paket aktif student")
	}

	// 4️⃣ Tandai jadwal sebagai booked
	if err := tx.Model(&domain.TeacherSchedule{}).
		Where("id = ?", schedule.ID).
		Update("is_booked", true).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("gagal memperbarui status jadwal: %w", err)
	}

	// 5️⃣ Buat record Booking
	newBooking := &domain.Booking{
		StudentUUID: studentUUID,
		ScheduleID:  schedule.ID,
		Status:      domain.StatusBooked,
		BookedAt:    time.Now(),
	}
	if err := tx.Create(&newBooking).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("gagal membuat booking: %w", err)
	}

	// 6️⃣ Kurangi 1 kuota pada paket yang digunakan (paket pertama yang match)
	for _, sp := range student.StudentProfile.Packages {
		if sp.Package != nil && activeInstruments[sp.Package.InstrumentID] {
			if sp.RemainingQuota > 0 {
				sp.RemainingQuota -= 1
				if err := tx.Model(&domain.StudentPackage{}).
					Where("id = ?", sp.ID).
					Update("remaining_quota", sp.RemainingQuota).Error; err != nil {
					tx.Rollback()
					return fmt.Errorf("gagal mengurangi kuota paket: %w", err)
				}
				break
			}
		}
	}

	// 7️⃣ Commit transaksi
	if err := tx.Commit().Error; err != nil {
		return fmt.Errorf("gagal commit transaksi: %w", err)
	}

	return nil
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
	// 1️⃣ Ambil student beserta paket dan paket detail
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

	// 2️⃣ Filter paket aktif (belum expired dan masih ada kuota)
	now := time.Now()
	instrumentIDs := make([]int, 0)
	for _, sp := range student.StudentProfile.Packages {
		isActive := sp.RemainingQuota > 0 && sp.EndDate.After(now)
		if isActive && sp.Package != nil {
			instrumentIDs = append(instrumentIDs, sp.Package.InstrumentID)
		}
	}

	if len(instrumentIDs) == 0 {
		return nil, fmt.Errorf("tidak ada paket aktif yang tersedia atau semua sudah expired")
	}

	// 3️⃣ Ambil jadwal guru berdasarkan instrumen yang diizinkan oleh student package
	var schedules []domain.TeacherSchedule
	err = r.db.WithContext(ctx).
		Model(&domain.TeacherSchedule{}).
		Joins("JOIN teacher_profiles ON teacher_profiles.user_uuid = teacher_schedules.teacher_uuid").
		Joins("JOIN teacher_instruments ON teacher_instruments.teacher_profile_user_uuid = teacher_profiles.user_uuid").
		Where("teacher_instruments.instrument_id IN ?", instrumentIDs).
		Where("teacher_schedules.is_booked = ?", false).
		Where("teacher_schedules.deleted_at IS NULL").
		Preload("Teacher").
		Preload("TeacherProfile.Instruments").
		Order("teacher_schedules.day_of_week ASC, teacher_schedules.start_time ASC").
		Find(&schedules).Error

	if err != nil {
		return nil, fmt.Errorf("gagal mengambil jadwal guru: %w", err)
	}

	if len(schedules) == 0 {
		return nil, fmt.Errorf("tidak ada jadwal guru yang cocok dengan paket aktif kamu")
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
