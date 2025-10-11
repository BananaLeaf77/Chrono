package domain

import (
	"context"
	"time"
)

type TeacherProfile struct {
	UserUUID    string       `gorm:"primaryKey;type:uuid;constraint:OnDelete:CASCADE;" json:"user_uuid"`
	Bio         string       `json:"bio"`
	Instruments []Instrument `gorm:"many2many:teacher_instruments;constraint:OnDelete:CASCADE;" json:"instruments"`
}

type Instrument struct {
	ID        int        `gorm:"primaryKey" json:"id"`
	Name      string     `gorm:"unique;size:30;not null" json:"name"`
	CreatedAt time.Time  `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"autoUpdateTime" json:"updated_at"`
	DeletedAt *time.Time `gorm:"index" json:"deleted_at,omitempty"`
}

type Booking struct {
	ID            int        `gorm:"primaryKey" json:"id"`
	StudentUUID   string     `gorm:"type:uuid;not null" json:"student_uuid"`
	ScheduleID    int        `gorm:"not null" json:"schedule_id"`
	Status        string     `gorm:"size:20;default:'booked'" json:"status"` // booked | completed | cancelled | rescheduled
	BookedAt      time.Time  `gorm:"autoCreateTime" json:"booked_at"`
	CompletedAt   *time.Time `json:"completed_at,omitempty"`
	RescheduledAt *time.Time `json:"rescheduled_at,omitempty"`
	CancelledAt   *time.Time `json:"cancelled_at,omitempty"`
	Notes         *string    `json:"notes,omitempty"`

	Schedule TeacherSchedule `gorm:"foreignKey:ScheduleID" json:"schedule"`
}

type TeacherSchedule struct {
	ID          int        `gorm:"primaryKey" json:"id"`
	TeacherUUID string     `gorm:"type:uuid;not null" json:"teacher_uuid"`
	DayOfWeek   string     `gorm:"size:10;not null" json:"day_of_week"` // e.g. "Monday"
	StartTime   string     `gorm:"not null" json:"start_time"`          // "15:00"
	EndTime     string     `gorm:"not null" json:"end_time"`            // "17:00"
	IsBooked    bool       `gorm:"default:false" json:"is_booked"`
	CreatedAt   time.Time  `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt   time.Time  `gorm:"autoUpdateTime" json:"updated_at"`
	DeletedAt   *time.Time `gorm:"index" json:"deleted_at,omitempty"`

	Teacher User `gorm:"foreignKey:TeacherUUID;constraint:OnDelete:CASCADE;" json:"teacher"`
}

type TeacherUseCase interface {
	GetMyProfile(ctx context.Context, userUUID string) (*User, error)
	UpdateTeacherData(ctx context.Context, userUUID string, user *User) error
}

type TeacherRepository interface {
	GetMyProfile(ctx context.Context, userUUID string) (*User, error)
	UpdateTeacherData(ctx context.Context, userUUID string, user *User) error
}
