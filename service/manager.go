package service

import (
	"chronosphere/domain"
	"context"
)

func NewManagerService(managerRepo domain.ManagerRepository) domain.ManagerUseCase {
	return &managerService{
		managerRepo: managerRepo,
	}
}

type managerService struct {
	managerRepo domain.ManagerRepository
}

// Students =====================================================================================================
// ✅ Get All Students
func (s *managerService) GetAllStudents(ctx context.Context) ([]domain.User, error) {
	data, err := s.managerRepo.GetAllStudents(ctx)
	if err != nil {
		return nil, err
	}

	return data, nil
}

// ✅ Get Student by UUID
func (s *managerService) GetStudentByUUID(ctx context.Context, uuid string) (*domain.User, error) {
	data, err := s.managerRepo.GetStudentByUUID(ctx, uuid)
	if err != nil {
		return nil, err
	}

	return data, nil
}

// ✅ Modify Student Package Quota
func (s *managerService) ModifyStudentPackageQuota(ctx context.Context, studentUUID string, packageID int, incomingQuota int) error {
	return s.managerRepo.ModifyStudentPackageQuota(ctx, studentUUID, packageID, incomingQuota)
}
