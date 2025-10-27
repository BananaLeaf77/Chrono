package dto

import "chronosphere/domain"

// Request untuk Create Teacher
type CreateTeacherRequest struct {
	Name          string  `json:"name" binding:"required,min=3,max=50"`
	Email         string  `json:"email" binding:"required,email"`
	Phone         string  `json:"phone" binding:"required,numeric,min=9,max=14"`
	Password      string  `json:"password" binding:"required,min=8"`
	Image         *string `json:"image" binding:"omitempty,url"`
	Bio           *string `json:"bio" binding:"omitempty,max=500"`
	InstrumentIDs []int   `json:"instrument_ids" binding:"required,min=1,dive,gt=0"`
}

// Request untuk Update Teacher
type UpdateTeacherProfileRequest struct {
	Name          string  `json:"name" binding:"required,min=3,max=50"`
	Email         string  `json:"email" binding:"required,email"`
	Phone         string  `json:"phone" binding:"required,numeric,min=9,max=14"`
	Image         *string `json:"image" binding:"omitempty,url"`
	Bio           *string `json:"bio" binding:"omitempty,max=500"`
	InstrumentIDs []int   `json:"instrument_ids" binding:"required,min=1,dive,gt=0"`
}

type UpdateTeacherProfileRequestByTeacher struct {
	Name  string  `json:"name" binding:"required,min=3,max=50"`
	Email string  `json:"email" binding:"required,email"`
	Phone string  `json:"phone" binding:"required,numeric,min=9,max=14"`
	Image *string `json:"image" binding:"omitempty,url"`
	Bio   *string `json:"bio" binding:"omitempty,max=500"`
}

func MapCreateTeacherRequestToUserByTeacher(req *UpdateTeacherProfileRequestByTeacher) domain.User {
	return domain.User{
		Name:  req.Name,
		Email: req.Email,
		Phone: req.Phone,
		Image: req.Image,
		TeacherProfile: &domain.TeacherProfile{
			Bio: deref(req.Bio),
		},
	}
}

// Mapper: Convert DTO → Domain
func MapCreateTeacherRequestToUser(req *CreateTeacherRequest) *domain.User {
	return &domain.User{
		Name:     req.Name,
		Email:    req.Email,
		Phone:    req.Phone,
		Password: req.Password,
		Role:     domain.RoleTeacher,
		Image:    req.Image,
		TeacherProfile: &domain.TeacherProfile{
			Bio:         deref(req.Bio),
			Instruments: mapInstrumentIDs(req.InstrumentIDs),
		},
	}
}

func MapUpdateTeacherRequestToUser(req *UpdateTeacherProfileRequest) *domain.User {
	return &domain.User{
		Name:  req.Name,
		Email: req.Email,
		Phone: req.Phone,
		Image: req.Image,
		TeacherProfile: &domain.TeacherProfile{
			Bio:         deref(req.Bio),
			Instruments: mapInstrumentIDs(req.InstrumentIDs),
		},
	}
}

// helper internal
func mapInstrumentIDs(ids []int) []domain.Instrument {
	instruments := make([]domain.Instrument, len(ids))
	for i, id := range ids {
		instruments[i] = domain.Instrument{ID: id}
	}
	return instruments
}

func deref(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}
