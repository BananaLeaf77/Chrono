package repository

import (
	"chronosphere/domain"
	"context"
	"time"

	"gorm.io/gorm"
)

type adminRepo struct {
	db *gorm.DB
}

func NewAdminRepository(db *gorm.DB) domain.AdminRepository {
	return &adminRepo{db: db}
}

// CreateTeacher creates a teacher (User with role=teacher)
func (r *adminRepo) CreateTeacher(ctx context.Context, user *domain.User) (*domain.User, error) {
	err := r.db.WithContext(ctx).Create(user).Error
	return user, err
}

// UpdateTeacherProfile updates a teacher’s profile
func (r *adminRepo) UpdateTeacher(ctx context.Context, profile *domain.User) error {
	profile.UpdatedAt = time.Now()
	return r.db.WithContext(ctx).Model(&domain.User{}).Where("uuid = ?", profile.UUID).Updates(profile).Error
}

func (r *adminRepo) UpdateInstrument(ctx context.Context, instrument *domain.Instrument) error {
	return r.db.WithContext(ctx).Save(instrument).Error
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

// CreateInstrument inserts a new instrument
func (r *adminRepo) CreateInstrument(ctx context.Context, instrument *domain.Instrument) (*domain.Instrument, error) {
	err := r.db.WithContext(ctx).Create(instrument).Error
	return instrument, err
}

// GetAllPackages returns all packages
func (r *adminRepo) GetAllPackages(ctx context.Context) ([]domain.Package, error) {
	var packages []domain.Package
	err := r.db.WithContext(ctx).Find(&packages).Error
	return packages, err
}

// GetAllInstruments returns all instruments
func (r *adminRepo) GetAllInstruments(ctx context.Context) ([]domain.Instrument, error) {
	var instruments []domain.Instrument
	err := r.db.WithContext(ctx).Find(&instruments).Error
	return instruments, err
}

// GetAllUsers returns all users
func (r *adminRepo) GetAllUsers(ctx context.Context) ([]domain.User, error) {
	var users []domain.User
	err := r.db.WithContext(ctx).Find(&users).Error
	return users, err
}

// GetAllTeachers returns all users with role=teacher
func (r *adminRepo) GetAllTeachers(ctx context.Context) ([]domain.User, error) {
	var teachers []domain.User
	err := r.db.WithContext(ctx).
		Where("role = ?", domain.RoleTeacher).
		Find(&teachers).Error
	return teachers, err
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

// GetTeacherByUUID fetches a teacher by UUID
func (r *adminRepo) GetTeacherByUUID(ctx context.Context, uuid string) (*domain.User, error) {
	var teacher domain.User
	err := r.db.WithContext(ctx).Preload("TeacherProfile").
		Where("uuid = ? AND role = ?", uuid, domain.RoleTeacher).
		First(&teacher).Error
	if err != nil {
		return nil, err
	}
	return &teacher, nil
}

// DeleteUser removes a user by UUID (will cascade if FK constraints are set)
func (r *adminRepo) DeleteUser(ctx context.Context, uuid string) error {
	return r.db.WithContext(ctx).Delete(&domain.User{}, "uuid = ?", uuid).Error
}

func (r *adminRepo) DeleteInstrument(ctx context.Context, id int) error {
	return r.db.WithContext(ctx).Delete(&domain.Instrument{}, "id = ?", id).Error
}

func (r *adminRepo) DeletePackage(ctx context.Context, id int) error {
	return r.db.WithContext(ctx).Delete(&domain.Package{}, "id = ?", id).Error
}
