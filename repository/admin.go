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

type adminRepo struct {
	db *gorm.DB
}

func NewAdminRepository(db *gorm.DB) domain.AdminRepository {
	return &adminRepo{db: db}
}

func (r *adminRepo) UpdateInstrument(ctx context.Context, instrument *domain.Instrument) error {
	var existing domain.Instrument

	// ✅ Cek apakah instrument ada dan belum dihapus (soft delete)
	if err := r.db.WithContext(ctx).
		Where("id = ? AND deleted_at IS NULL", instrument.ID).
		First(&existing).Error; err != nil {

		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New(utils.TranslateDBError(err)) // pakai translator
		}
		return errors.New(utils.TranslateDBError(err))
	}

	// ✅ Update data instrument
	if err := r.db.WithContext(ctx).Save(instrument).Error; err != nil {
		return errors.New(utils.TranslateDBError(err)) // pakai translator
	}

	return nil
}

func (r *adminRepo) UpdatePackage(ctx context.Context, pkg *domain.Package) error {
	err := r.db.WithContext(ctx).Model(&domain.Package{}).Where("id = ?", pkg.ID).Updates(pkg).Error
	if err != nil {
		return err
	}
	return nil
}

// AssignPackageToStudent assigns a package to a student
func (r *adminRepo) AssignPackageToStudent(ctx context.Context, studentUUID string, packageID int) error {
	var pkg domain.Package
	if err := r.db.WithContext(ctx).First(&pkg, packageID).Error; err != nil {
		return err
	}
	sp := &domain.StudentPackage{
		StudentUUID:    studentUUID,
		PackageID:      packageID,
		RemainingQuota: pkg.Quota,
		StartDate:      time.Now(),
		EndDate:        time.Now().AddDate(0, 1, 0), // default 1 month, can adjust
	}
	return r.db.WithContext(ctx).Create(sp).Error
}

// CreatePackage inserts a new package
func (r *adminRepo) CreatePackage(ctx context.Context, pkg *domain.Package) (*domain.Package, error) {
	err := r.db.WithContext(ctx).Create(pkg).Error
	return pkg, err
}

// ✅ Create Instrument
func (r *adminRepo) CreateInstrument(ctx context.Context, instrument *domain.Instrument) (*domain.Instrument, error) {
	// Cek apakah sudah ada instrument dengan nama sama & belum dihapus
	var existing domain.Instrument
	if err := r.db.WithContext(ctx).
		Where("name = ? AND deleted_at IS NULL", instrument.Name).
		First(&existing).Error; err == nil {
		// Sudah ada, return error user-friendly
		return nil, errors.New(utils.TranslateDBError(errors.New("23505"))) // mimic unique violation
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		// Error lain saat check
		return nil, errors.New(utils.TranslateDBError(err))
	}

	// Simpan instrument baru
	if err := r.db.WithContext(ctx).Create(instrument).Error; err != nil {
		return nil, errors.New(utils.TranslateDBError(err))
	}

	return instrument, nil
}

// GetAllPackages returns all packages
func (r *adminRepo) GetAllPackages(ctx context.Context) ([]domain.Package, error) {
	var packages []domain.Package
	err := r.db.WithContext(ctx).Find(&packages).Error
	return packages, err
}

// ✅ Get All Instruments (skip soft deleted)
func (r *adminRepo) GetAllInstruments(ctx context.Context) ([]domain.Instrument, error) {
	var instruments []domain.Instrument

	if err := r.db.WithContext(ctx).
		Where("deleted_at IS NULL").
		Find(&instruments).Error; err != nil {
		return nil, errors.New(utils.TranslateDBError(err))
	}

	return instruments, nil
}

// GetAllUsers returns all users
func (r *adminRepo) GetAllUsers(ctx context.Context) ([]domain.User, error) {
	var users []domain.User
	err := r.db.WithContext(ctx).Find(&users).Error
	return users, err
}

// GetAllStudents returns all users with role=student
func (r *adminRepo) GetAllStudents(ctx context.Context) ([]domain.User, error) {
	var students []domain.User
	err := r.db.WithContext(ctx).
		Where("role = ?", domain.RoleStudent).
		Find(&students).Error
	return students, err
}

// GetStudentByUUID fetches a student by UUID
func (r *adminRepo) GetStudentByUUID(ctx context.Context, uuid string) (*domain.User, error) {
	var student domain.User
	err := r.db.WithContext(ctx).Preload("StudentProfile").
		Where("uuid = ? AND role = ?", uuid, domain.RoleStudent).
		First(&student).Error
	if err != nil {
		return nil, err
	}
	return &student, nil
}

// ✅ Delete Instrument (soft delete aware)
func (r *adminRepo) DeleteInstrument(ctx context.Context, id int) error {
	// Cek apakah instrument masih aktif (belum dihapus)
	var existing domain.Instrument
	if err := r.db.WithContext(ctx).
		Where("id = ? AND deleted_at IS NULL", id).
		First(&existing).Error; err != nil {

		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New(utils.TranslateDBError(err))
		}
		return errors.New(utils.TranslateDBError(err))
	}

	// Lakukan soft delete
	if err := r.db.WithContext(ctx).Delete(&existing).Error; err != nil {
		return errors.New(utils.TranslateDBError(err))
	}

	return nil
}
func (r *adminRepo) DeletePackage(ctx context.Context, id int) error {
	return r.db.WithContext(ctx).Delete(&domain.Package{}, "id = ?", id).Error
}

// TEACHER MANAGEMENT
func (r *adminRepo) CreateTeacher(ctx context.Context, user *domain.User, instrumentIDs []int) (*domain.User, error) {
	tx := r.db.WithContext(ctx).Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 1️⃣ Pastikan user belum ada (by email / phone)
	var existing domain.User
	if err := tx.
		Where("(email = ? OR phone = ?) AND deleted_at IS NULL", user.Email, user.Phone).
		First(&existing).Error; err == nil {
		tx.Rollback()
		return nil, errors.New("email atau nomor telepon sudah digunakan")
	}

	if len(instrumentIDs) > 0 {
		// 6a. Validasi: Pastikan semua instrument IDs ada di database
		var validInstruments []domain.Instrument
		if err := tx.
			Where("id IN ? AND deleted_at IS NULL", instrumentIDs).
			Find(&validInstruments).Error; err != nil {
			tx.Rollback()
			return nil, errors.New("gagal memvalidasi instrumen")
		}

		// 6b. Cek apakah jumlah instrument yang ditemukan sama dengan yang diminta
		if len(validInstruments) != len(instrumentIDs) {
			tx.Rollback()

			// Cari instrument IDs yang tidak valid
			var foundIDs []int
			for _, inst := range validInstruments {
				foundIDs = append(foundIDs, inst.ID)
			}

			invalidIDs := findMissingIDs(instrumentIDs, foundIDs)
			return nil, fmt.Errorf("instrumen dengan ID %v tidak ditemukan atau sudah dihapus", invalidIDs)
		}

	}
	// 2️⃣ Set StudentProfile ke nil karena ini function khusus buat teacher
	user.StudentProfile = nil

	// 3️⃣ Buat user baru
	if err := tx.Create(user).Error; err != nil {
		tx.Rollback()
		return nil, errors.New(utils.TranslateDBError(err))
	}

	// 4️⃣ Refresh user untuk dapat UUID (jika belum ada)
	if user.UUID == "" {
		if err := tx.
			Where("email = ? AND deleted_at IS NULL", user.Email).
			First(user).Error; err != nil {
			tx.Rollback()
			return nil, errors.New("gagal mendapatkan UUID user")
		}
	}

	// 7️⃣ Preload data lengkap untuk response
	if err := tx.
		Preload("TeacherProfile.Instruments", "deleted_at IS NULL"). // ✅ Filter instruments yang aktif
		Where("uuid = ? AND deleted_at IS NULL", user.UUID).
		First(user).Error; err != nil {
		tx.Rollback()
		return nil, errors.New("gagal memuat data user")
	}

	// 8️⃣ Commit transaksi
	if err := tx.Commit().Error; err != nil {
		return nil, errors.New(utils.TranslateDBError(err))
	}

	return user, nil
}

// Helper function untuk mencari IDs yang tidak valid
func findMissingIDs(requestedIDs, foundIDs []int) []int {
	foundMap := make(map[int]bool)
	for _, id := range foundIDs {
		foundMap[id] = true
	}

	var missing []int
	for _, id := range requestedIDs {
		if !foundMap[id] {
			missing = append(missing, id)
		}
	}
	return missing
}

func (r *adminRepo) UpdateTeacher(ctx context.Context, user *domain.User, instrumentIDs []int) error {
	tx := r.db.WithContext(ctx).Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 1️⃣ Ambil data user (pastikan belum dihapus)
	var existing domain.User
	if err := tx.
		Where("uuid = ? AND deleted_at IS NULL", user.UUID).
		First(&existing).Error; err != nil {
		tx.Rollback()
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("guru tidak ditemukan")
		}
		return errors.New(utils.TranslateDBError(err))
	}

	// 2️⃣ Update data user
	if err := tx.Model(&existing).Updates(map[string]interface{}{
		"name":  user.Name,
		"email": user.Email,
		"phone": user.Phone,
		"image": user.Image,
	}).Error; err != nil {
		tx.Rollback()
		return errors.New(utils.TranslateDBError(err))
	}

	// 3️⃣ Update TeacherProfile (Bio)
	if user.TeacherProfile != nil {
		if err := tx.
			Model(&domain.TeacherProfile{}).
			Where("user_uuid = ? AND deleted_at IS NULL", user.UUID).
			Update("bio", user.TeacherProfile.Bio).Error; err != nil {
			tx.Rollback()
			return errors.New(utils.TranslateDBError(err))
		}
	}

	// 4️⃣ Update Instruments (filter yang belum dihapus)
	var instruments []domain.Instrument
	if err := tx.
		Where("id IN ? AND deleted_at IS NULL", instrumentIDs).
		Find(&instruments).Error; err != nil {
		tx.Rollback()
		return errors.New(utils.TranslateDBError(err))
	}

	if err := tx.
		Model(&domain.TeacherProfile{UserUUID: user.UUID}).
		Association("Instruments").
		Replace(instruments); err != nil {
		tx.Rollback()
		return err
	}

	// 5️⃣ Commit transaksi
	if err := tx.Commit().Error; err != nil {
		return errors.New(utils.TranslateDBError(err))
	}

	return nil
}

func (r *adminRepo) GetAllTeachers(ctx context.Context) ([]domain.User, error) {
	var teachers []domain.User
	if err := r.db.WithContext(ctx).
		Preload("TeacherProfile.Instruments").
		Where("role = ? AND deleted_at IS NULL", domain.RoleTeacher).
		Find(&teachers).Error; err != nil {
		return nil, errors.New(utils.TranslateDBError(err))
	}

	return teachers, nil
}

func (r *adminRepo) GetTeacherByUUID(ctx context.Context, uuid string) (*domain.User, error) {
	var teacher domain.User
	if err := r.db.WithContext(ctx).
		Preload("TeacherProfile.Instruments").
		Where("uuid = ? AND role = ? AND deleted_at IS NULL", uuid, domain.RoleTeacher).
		First(&teacher).Error; err != nil {
		return nil, errors.New(utils.TranslateDBError(err))
	}

	return &teacher, nil
}

func (r *adminRepo) DeleteUser(ctx context.Context, uuid string) error {
	// Soft delete
	if err := r.db.WithContext(ctx).
		Where("uuid = ? AND deleted_at IS NULL", uuid).
		Delete(&domain.User{}).Error; err != nil {
		return errors.New(utils.TranslateDBError(err))
	}
	return nil
}
