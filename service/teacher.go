package service

import "chronosphere/domain"

type teacherService struct {
	repo domain.TeacherRepository
}

func NewTeacherService(TeacherRepo domain.TeacherRepository) domain.TeacherUseCase {
	return &teacherService{repo: TeacherRepo}
}
