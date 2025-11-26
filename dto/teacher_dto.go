package dto

import (
	"chronosphere/domain"
	"strings"
	"time"
)

type AddMultipleAvailabilityRequest struct {
	TeacherUUID string        `json:"teacher_uuid" binding:"required,uuid"`
	Slots       []TimeSlotDTO `json:"slots" binding:"required,min=1"`
}

type TimeSlotDTO struct {
	DayOfWeek string `json:"day_of_week" binding:"required"`
	StartTime string `json:"start_time" binding:"required"`
	EndTime   string `json:"end_time" binding:"required"`
}

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
		Email:    strings.ToLower(req.Email),
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

type FinishClassRequest struct {
	InstrumentID int       `json:"instrument_id" binding:"required"`
	PackageID    *int      `json:"package_id,omitempty"`          // optional, only if class used a package
	Date         string    `json:"date" binding:"required"`       // e.g. "2025-11-03"
	StartTime    time.Time `json:"start_time" binding:"required"` // e.g. "14:00"
	EndTime      time.Time `json:"end_time" binding:"required"`   // e.g. "15:00"
	Notes        string    `json:"notes" binding:"required"`      // progress note from teacher (required)
	DocumentURLs []string  `json:"documentations,omitempty"`      // optional, list of uploaded file URLs
}

// ✅ Converts DTO → domain.ClassHistory (for repository/usecase)
func MapFinishClassRequestToClassHistory(req *FinishClassRequest, bookingID int, teacherUUID string) domain.ClassHistory {
	parsedDate, _ := time.Parse("2006-01-02", req.Date)

	history := domain.ClassHistory{
		BookingID:    bookingID,
		TeacherUUID:  teacherUUID,
		InstrumentID: req.InstrumentID,
		PackageID:    req.PackageID,
		Date:         parsedDate,
		StartTime:    req.StartTime,
		EndTime:      req.EndTime,
		Notes:        &req.Notes,
		Status:       domain.StatusCompleted,
	}

	// Add documentation URLs if provided
	if len(req.DocumentURLs) > 0 {
		for _, url := range req.DocumentURLs {
			history.Documentations = append(history.Documentations, domain.ClassDocumentation{
				URL: url,
			})
		}
	}

	return history
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
