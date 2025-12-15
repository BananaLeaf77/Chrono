package dto

import (
	"chronosphere/domain"
	"strings"
)

// Request untuk Create Teacher
type CreateManagerRequest struct {
	Name     string  `json:"name" binding:"required,min=3,max=50"`
	Email    string  `json:"email" binding:"required,email"`
	Phone    string  `json:"phone" binding:"required,numeric,min=9,max=14"`
	Password string  `json:"password" binding:"required,min=8"`
	Image    *string `json:"image" binding:"omitempty,url"`
	Bio      *string `json:"bio" binding:"omitempty,max=500"`
}

// Request untuk Update Teacher
type UpdateManagerProfileRequest struct {
	Name  string  `json:"name" binding:"required,min=3,max=50"`
	Email string  `json:"email" binding:"required,email"`
	Phone string  `json:"phone" binding:"required,numeric,min=9,max=14"`
	Image *string `json:"image" binding:"omitempty,url"`
}

type UpdateManagerProfileRequestByManager struct {
	Name  string  `json:"name" binding:"required,min=3,max=50"`
	Email string  `json:"email" binding:"required,email"`
	Phone string  `json:"phone" binding:"required,numeric,min=9,max=14"`
	Image *string `json:"image" binding:"omitempty,url"`
}

func MapCreateManagerRequestToUserByManager(req *UpdateManagerProfileRequestByManager) domain.User {
	return domain.User{
		Name:  req.Name,
		Email: strings.ToLower(req.Email),
		Phone: req.Phone,
		Image: req.Image,
	}
}

// Mapper: Convert DTO → Domain
func MapCreateManagerRequestToUser(req *CreateManagerRequest) *domain.User {
	return &domain.User{
		Name:     req.Name,
		Email:    strings.ToLower(req.Email),
		Phone:    req.Phone,
		Password: req.Password,
		Role:     domain.RoleManagement,
		Image:    req.Image,
	}
}

func MapUpdateManagerRequestToUser(req *UpdateManagerProfileRequest) *domain.User {
	return &domain.User{
		Name:  req.Name,
		Email: req.Email,
		Phone: req.Phone,
		Image: req.Image,
	}
}

type UpdateManagerRequest struct {
	UUID  string  `json:"uuid" binding:"required,uuid"`
	Name  string  `json:"name" binding:"required,min=3,max=50"`
	Email string  `json:"email" binding:"required,email"`
	Phone string  `json:"phone" binding:"required,numeric,min=9,max=14"`
	Image *string `json:"image" binding:"omitempty,url"`
}

func MapUpdateManagerRequestByManager(req *UpdateManagerRequest) *domain.User {
	return &domain.User{
		UUID:  req.UUID,
		Name:  req.Name,
		Email: strings.ToLower(req.Email),
		Phone: req.Phone,
		Image: req.Image,
	}
}
