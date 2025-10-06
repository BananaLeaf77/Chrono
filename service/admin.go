package service

import (
	"chronosphere/domain"
	"context"
	"errors"

	"golang.org/x/crypto/bcrypt"
)

type adminService struct {
	adminRepo domain.AdminRepository
}

func NewAdminService(adminRepo domain.AdminRepository) domain.AdminUseCase {
	return &adminService{
		adminRepo: adminRepo,
	}
}

// CreateTeacher creates a new teacher user with role=teacher
func (s *adminService) CreateTeacher(ctx context.Context, user *domain.User) (*domain.User, error) {
	if user == nil {
		return nil, errors.New("user is nil")
	}

	// set role if not provided
	if user.Role == "" {
		user.Role = domain.RoleTeacher
	}

	// hash password if provided (teachers will login)
	if user.Password != "" {
		hashed, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
		if err != nil {
			return nil, err
		}
		user.Password = string(hashed)
	}

	created, err := s.adminRepo.CreateTeacher(ctx, user)
	if err != nil {
		return nil, err
	}
	return created, nil
}

// UpdateTeacherProfile updates teacher’s profile
func (s *adminService) UpdateTeacher(ctx context.Context, profile *domain.User) error {
	if profile == nil {
		return errors.New("profile is nil")
	}
	return s.adminRepo.UpdateTeacher(ctx, profile)
}

// AssignPackageToStudent assigns a package to a student
func (s *adminService) AssignPackageToStudent(ctx context.Context, studentUUID string, packageID int) error {
	if studentUUID == "" {
		return errors.New("student uuid is required")
	}
	if packageID <= 0 {
		return errors.New("invalid package id")
	}
	return s.adminRepo.AssignPackageToStudent(ctx, studentUUID, packageID)
}

// CreatePackage creates a package
func (s *adminService) CreatePackage(ctx context.Context, pkg *domain.Package) (*domain.Package, error) {
	if pkg == nil {
		return nil, errors.New("pkg is nil")
	}
	created, err := s.adminRepo.CreatePackage(ctx, pkg)
	if err != nil {
		return nil, err
	}
	return created, nil
}

func (s *adminService) UpdatePackage(ctx context.Context, pkg *domain.Package) error {
	if pkg == nil {
		return errors.New("pkg is nil")
	}
	return s.adminRepo.UpdatePackage(ctx, pkg)
}

func (s *adminService) DeletePackage(ctx context.Context, id int) error {
	if id <= 0 {
		return errors.New("invalid package id")
	}
	return s.adminRepo.DeletePackage(ctx, id)
}

// CreateInstrument creates a new instrument (note: accepts *domain.Instrument)
func (s *adminService) CreateInstrument(ctx context.Context, instrument *domain.Instrument) (*domain.Instrument, error) {
	if instrument == nil {
		return nil, errors.New("instrument is nil")
	}
	if instrument.Name == "" {
		return nil, errors.New("instrument name cannot be empty")
	}
	created, err := s.adminRepo.CreateInstrument(ctx, instrument)
	if err != nil {
		return nil, err
	}
	return created, nil
}

func (s *adminService) UpdateInstrument(ctx context.Context, instrument *domain.Instrument) error {
	if instrument == nil {
		return errors.New("instrument is nil")
	}
	return s.adminRepo.UpdateInstrument(ctx, instrument)
}

func (s *adminService) DeleteInstrument(ctx context.Context, id int) error {
	if id <= 0 {
		return errors.New("invalid instrument id")
	}
	return s.adminRepo.DeleteInstrument(ctx, id)
}

// GetAllPackages returns all packages
func (s *adminService) GetAllPackages(ctx context.Context) ([]domain.Package, error) {
	return s.adminRepo.GetAllPackages(ctx)
}

// GetAllInstruments returns all instruments
func (s *adminService) GetAllInstruments(ctx context.Context) ([]domain.Instrument, error) {
	return s.adminRepo.GetAllInstruments(ctx)
}

// GetAllTeachers returns all teachers
func (s *adminService) GetAllTeachers(ctx context.Context) ([]domain.User, error) {
	return s.adminRepo.GetAllTeachers(ctx)
}

// GetAllStudents returns all students
func (s *adminService) GetAllStudents(ctx context.Context) ([]domain.User, error) {
	return s.adminRepo.GetAllStudents(ctx)
}

// GetAllUsers returns all users
func (s *adminService) GetAllUsers(ctx context.Context) ([]domain.User, error) {
	return s.adminRepo.GetAllUsers(ctx)
}

// GetStudentByUUID fetches a student by UUID
func (s *adminService) GetStudentByUUID(ctx context.Context, uuid string) (*domain.User, error) {
	if uuid == "" {
		return nil, errors.New("uuid is required")
	}
	return s.adminRepo.GetStudentByUUID(ctx, uuid)
}

// GetTeacherByUUID fetches a teacher by UUID
func (s *adminService) GetTeacherByUUID(ctx context.Context, uuid string) (*domain.User, error) {
	if uuid == "" {
		return nil, errors.New("uuid is required")
	}
	return s.adminRepo.GetTeacherByUUID(ctx, uuid)
}

// DeleteUser deletes a user (soft delete)
func (s *adminService) DeleteUser(ctx context.Context, uuid string) error {
	if uuid == "" {
		return errors.New("uuid is required")
	}
	return s.adminRepo.DeleteUser(ctx, uuid)
}
