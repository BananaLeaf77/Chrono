package dto

import (
	"chronosphere/domain"
	"fmt"
	"strings"
	"time"
)

type AddMultipleAvailabilityRequest struct {
	SlotsAvailability []SlotsAvailability `json:"slots_availability" binding:"required,min=1,dive"`
}

type SlotsAvailability struct {
	DayOfTheWeek []string `json:"day_of_the_week" binding:"required,min=1,dive,oneof=senin selasa rabu kamis jumat sabtu minggu"`
	StartTime    string   `json:"start_time" binding:"required,timeformat"`
	EndTime      string   `json:"end_time" binding:"required,timeformat"`
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
	InstrumentID int      `json:"instrument_id" binding:"required"`
	PackageID    *int     `json:"package_id,omitempty"`          // optional, only if class used a package
	Date         string   `json:"date" binding:"required"`       // e.g. "2025-11-03"
	StartTime    string   `json:"start_time" binding:"required"` // ✅ Changed to string
	EndTime      string   `json:"end_time" binding:"required"`   // ✅ Changed to string
	Notes        string   `json:"notes" binding:"required"`      // progress note from teacher (required)
	DocumentURLs []string `json:"documentations,omitempty"`      // optional, list of uploaded file URLs
}

// ✅ Update mapper to handle string time conversion
func MapFinishClassRequestToClassHistory(req *FinishClassRequest, bookingID int, teacherUUID string) (domain.ClassHistory, error) {
	// Parse date
	parsedDate, err := time.Parse("2006-01-02", req.Date)
	if err != nil {
		return domain.ClassHistory{}, fmt.Errorf("invalid date format, use YYYY-MM-DD: %w", err)
	}

	// Parse start time
	startTime, err := time.Parse("15:04", req.StartTime)
	if err != nil {
		return domain.ClassHistory{}, fmt.Errorf("invalid start_time format, use HH:MM: %w", err)
	}

	// Parse end time
	endTime, err := time.Parse("15:04", req.EndTime)
	if err != nil {
		return domain.ClassHistory{}, fmt.Errorf("invalid end_time format, use HH:MM: %w", err)
	}

	// ✅ Validate that it's exactly 1 hour
	if endTime.Sub(startTime) != time.Hour {
		return domain.ClassHistory{}, fmt.Errorf("class duration must be exactly 1 hour")
	}

	history := domain.ClassHistory{
		BookingID:   bookingID,
		TeacherUUID: teacherUUID,
		PackageID:   req.PackageID,
		Date:        parsedDate,
		StartTime:   startTime,
		EndTime:     endTime,
		Notes:       &req.Notes,
		Status:      domain.StatusCompleted,
	}

	// Add documentation URLs if provided
	if len(req.DocumentURLs) > 0 {
		for _, url := range req.DocumentURLs {
			history.Documentations = append(history.Documentations, domain.ClassDocumentation{
				URL: url,
			})
		}
	}

	return history, nil
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
