package domain

import (
	"context"
	"time"
)

type StudentProfile struct {
	UserUUID string           `gorm:"primaryKey;type:uuid" json:"user_uuid"`
	Packages []StudentPackage `gorm:"foreignKey:StudentUUID" json:"packages"`
}

type Package struct {
	ID          int        `gorm:"primaryKey" json:"id"`
	Name        string     `gorm:"not null" json:"name"`  // contoh: "Gitar Privat 4x/Bulan"
	Quota       int        `gorm:"not null" json:"quota"` // contoh: 4
	Description string     `json:"description"`
	CreatedAt   time.Time  `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt   time.Time  `gorm:"autoUpdateTime" json:"updated_at"`
	DeletedAt   *time.Time `gorm:"index" json:"deleted_at,omitempty"`
}

type StudentPackage struct {
	ID             int       `gorm:"primaryKey" json:"id"`
	StudentUUID    string    `gorm:"type:uuid;not null" json:"student_uuid"`
	PackageID      int       `gorm:"not null" json:"package_id"`
	RemainingQuota int       `gorm:"not null" json:"remaining_quota"`
	StartDate      time.Time `json:"start_date"`
	EndDate        time.Time `json:"end_date"`

	Package *Package `gorm:"foreignKey:PackageID" json:"package,omitempty"`
}
type StudentUseCase interface {
	GetMyProfile(ctx context.Context, userUUID string) (*User, error)
	UpdateStudentData(ctx context.Context, userUUID string, user *User) error
}

type StudentRepository interface {
	GetMyProfile(ctx context.Context, userUUID string) (*User, error)
	UpdateStudentData(ctx context.Context, userUUID string, user *User) error
}
