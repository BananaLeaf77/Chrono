package domain

import (
	"context"
	"time"
)

const (
	RoleAdmin   = "admin"
	RoleTeacher = "teacher"
	RoleStudent = "student"
)

type User struct {
	UUID     string  `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"uuid"`
	Name     string  `gorm:"not null;size:50" json:"name"`
	Email    string  `gorm:"unique;not null" json:"email"`
	Phone    string  `gorm:"unique;not null;size:14" json:"phone"`
	Password string  `gorm:"not null" json:"-"`
	Role     string  `gorm:"not null" json:"role"`             // student | teacher | admin
	Image    *string `gorm:"type:text" json:"image,omitempty"` // nullable, default NULL

	CreatedAt time.Time  `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"autoUpdateTime" json:"updated_at"`
	DeletedAt *time.Time `gorm:"index" json:"deleted_at,omitempty"`

	TeacherProfile *TeacherProfile `gorm:"foreignKey:UserUUID" json:"teacher_profile,omitempty"`
	StudentProfile *StudentProfile `gorm:"foreignKey:UserUUID" json:"student_profile,omitempty"`
}


// USE CASE

type UserUseCase interface {
	GetUserByEmail(ctx context.Context, email string) (*User, error)
	GetUserByTelephone(ctx context.Context, telephone string) (*User, error)
	CreateUser(ctx context.Context, user *User) error
	GetAllUsers(ctx context.Context) ([]User, error)
	GetUserByUUID(ctx context.Context, uuid string) (*User, error)
	UpdateUser(ctx context.Context, user *User) error
	DeleteUser(ctx context.Context, uuid string) error
	Login(ctx context.Context, email, password string) (*User, error)
}

// REPOSITORY
type UserRepository interface {
	GetUserByEmail(ctx context.Context, email string) (*User, error)
	GetUserByTelephone(ctx context.Context, telephone string) (*User, error)
	CreateUser(ctx context.Context, user *User) error
	GetAllUsers(ctx context.Context) ([]User, error)
	GetUserByUUID(ctx context.Context, uuid string) (*User, error)
	UpdateUser(ctx context.Context, user *User) error
	DeleteUser(ctx context.Context, uuid string) error
	Login(ctx context.Context, email, password string) (*User, error)
}


