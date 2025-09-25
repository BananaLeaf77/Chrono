package service

import (
    "chronosphere/domain"
    "context"
)

type studentUseCase struct {
    repo domain.StudentRepository
}

func NewStudentUseCase(repo domain.StudentRepository) domain.StudentUseCase {
    return &studentUseCase{repo: repo}
}

func (u *studentUseCase) GetAllStudents(ctx context.Context) ([]domain.User, error) {
    return u.repo.GetAllStudents(ctx)
}

func (u *studentUseCase) GetStudentByUUID(ctx context.Context, uuid string) (*domain.User, error) {
    return u.repo.GetStudentByUUID(ctx, uuid)
}

func (u *studentUseCase) GetStudentProfile(ctx context.Context, uuid string) (*domain.StudentProfile, error) {
    return u.repo.GetStudentProfile(ctx, uuid)
}

func (u *studentUseCase) AssignPackageToStudent(ctx context.Context, studentUUID string, packageID int) error {
    return u.repo.AssignPackageToStudent(ctx, studentUUID, packageID)
}

func (u *studentUseCase) UpdateStudentQuota(ctx context.Context, studentUUID string, packageID int, delta int) error {
    return u.repo.UpdateStudentQuota(ctx, studentUUID, packageID, delta)
}