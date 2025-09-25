package domain

import (
	"context"
	"time"
)

type User struct {
	UUID      string     `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"uuid"`
	Name      string     `gorm:"not null" json:"name"` // max 50
	Email     string     `gorm:"unique;not null" json:"email"`
	Phone     string     `gorm:"unique;not null" json:"phone"` // max 14
	Password  string     `gorm:"not null" json:"-"`
	Role      string     `gorm:"not null" json:"role"` // student | teacher | admin
	CreatedAt time.Time  `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"autoUpdateTime" json:"updated_at"`
	DeletedAt *time.Time `gorm:"index" json:"deleted_at,omitempty"`

	TeacherProfile *TeacherProfile `gorm:"foreignKey:UserUUID" json:"teacher_profile,omitempty"`
	StudentProfile *StudentProfile `gorm:"foreignKey:UserUUID" json:"student_profile,omitempty"`
}

type TeacherProfile struct {
	UserUUID string `gorm:"primaryKey;type:uuid" json:"user_uuid"`
	Bio      string `json:"bio"`
	// Instruments → relasi ke tabel teacher_instruments
	Instruments []Instrument `gorm:"many2many:teacher_instruments" json:"instruments"`
}

type Instrument struct {
	ID   int    `gorm:"primaryKey" json:"id"`
	Name string `gorm:"unique;not null" json:"name"`
}

type StudentProfile struct {
	UserUUID       string   `gorm:"primaryKey;type:uuid" json:"user_uuid"`
	PackageID      *int     `json:"package_id"`
	RemainingQuota int      `json:"remaining_quota"`
	Package        *Package `gorm:"foreignKey:PackageID" json:"package,omitempty"`
}

type Package struct {
	ID    int    `gorm:"primaryKey" json:"id"`
	Name  string `gorm:"not null" json:"name"`
	Quota int    `gorm:"not null" json:"quota"`
}

type UserRepository interface {
	CreateUser(ctx context.Context, user *User) error
	GetAllUsers(ctx context.Context) (*[]User, error)
	GetUserByUUID(ctx context.Context, uuid string) (*User, error)
	UpdateUser(ctx context.Context, user *User) error
	DeleteUser(ctx context.Context, uuid string) error
}

type UserUseCase interface {
	CreateUser(ctx context.Context, user *User) error
	GetAllUsers(ctx context.Context) (*[]User, error)
	GetUserByUUID(ctx context.Context, uuid string) (*User, error)
	UpdateUser(ctx context.Context, user *User) error
	DeleteUser(ctx context.Context, uuid string) error
}
