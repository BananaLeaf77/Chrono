package service

import "chronosphere/domain"

type studentService struct {
	repo domain.StudentRepository
}

func NewstudentService(StudentRepo domain.StudentRepository) domain.StudentUseCase {
	return &studentService{repo: StudentRepo}
}
