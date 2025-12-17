package dto

import "chronosphere/domain"

type UpdateAdminProfileRequest struct {
	Name   string `json:"name" binding:"required,min=3,max=50"`
	Email  string `json:"email" binding:"required,email"`
	Phone  string `json:"phone" binding:"required,numeric,min=9,max=14"`
	Image  string `json:"image" binding:"omitempty,url"`
	Gender string `json:"gender" binding:"required,oneof=male female"`
}

func MakeUpdateAdminProfileRequest(req *UpdateAdminProfileRequest) domain.User {
	return domain.User{
		Name:   req.Name,
		Email:  req.Email,
		Phone:  req.Phone,
		Image:  &req.Image,
		Gender: req.Gender,
	}
}
