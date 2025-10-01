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

type TeacherProfile struct {
	UserUUID    string       `gorm:"primaryKey;type:uuid" json:"user_uuid"`
	Bio         string       `json:"bio"`
	Instruments []Instrument `gorm:"many2many:teacher_instruments" json:"instruments"`
}

type Instrument struct {
	ID        int        `gorm:"primaryKey" json:"id"`
	Name      string     `gorm:"unique;not null" json:"name"`
	CreatedAt time.Time  `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"autoUpdateTime" json:"updated_at"`
	DeletedAt *time.Time `gorm:"index" json:"deleted_at,omitempty"`
}

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

// USE CASE
type AdminUseCase interface {
	CreateTeacher(ctx context.Context, user *User) (*User, error)
	UpdateTeacherProfile(ctx context.Context, profile *TeacherProfile) error

	AssignPackageToStudent(ctx context.Context, studentUUID string, packageID int) error

	CreatePackage(ctx context.Context, pkg *Package) (*Package, error)
	UpdatePackage(ctx context.Context, pkg *Package) error
	DeletePackage(ctx context.Context, id int) error

	CreateInstrument(ctx context.Context, instrument *Instrument) (*Instrument, error)
	UpdateInstrument(ctx context.Context, instrument *Instrument) error
	DeleteInstrument(ctx context.Context, id int) error

	GetAllPackages(ctx context.Context) ([]Package, error)
	GetAllInstruments(ctx context.Context) ([]Instrument, error)
	GetAllUsers(ctx context.Context) ([]User, error)
	GetAllTeachers(ctx context.Context) ([]User, error)
	GetAllStudents(ctx context.Context) ([]User, error)

	GetStudentByUUID(ctx context.Context, uuid string) (*User, error)
	GetTeacherByUUID(ctx context.Context, uuid string) (*User, error)

	DeleteUser(ctx context.Context, uuid string) error
}

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
type TeacherUseCase interface {
	GetMyProfile(ctx context.Context, userUUID string) (*User, error)
	UpdateTeacherData(ctx context.Context, userUUID string, user *User) error
}

type StudentUseCase interface {
	GetMyProfile(ctx context.Context, userUUID string) (*User, error)
	UpdateStudentData(ctx context.Context, userUUID string, user *User) error
}

// REPOSITORY
type AdminRepository interface {
	CreateTeacher(ctx context.Context, user *User) (*User, error)
	UpdateTeacherProfile(ctx context.Context, profile *TeacherProfile) error

	AssignPackageToStudent(ctx context.Context, studentUUID string, packageID int) error

	CreatePackage(ctx context.Context, pkg *Package) (*Package, error)
	UpdatePackage(ctx context.Context, pkg *Package) error
	DeletePackage(ctx context.Context, id int) error

	CreateInstrument(ctx context.Context, instrument *Instrument) (*Instrument, error)
	UpdateInstrument(ctx context.Context, instrument *Instrument) error
	DeleteInstrument(ctx context.Context, id int) error

	GetAllPackages(ctx context.Context) ([]Package, error)
	GetAllInstruments(ctx context.Context) ([]Instrument, error)
	GetAllUsers(ctx context.Context) ([]User, error)
	GetAllTeachers(ctx context.Context) ([]User, error)
	GetAllStudents(ctx context.Context) ([]User, error)

	GetStudentByUUID(ctx context.Context, uuid string) (*User, error)
	GetTeacherByUUID(ctx context.Context, uuid string) (*User, error)

	DeleteUser(ctx context.Context, uuid string) error
}

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
type TeacherRepository interface {
	GetMyProfile(ctx context.Context, userUUID string) (*User, error)
	UpdateTeacherData(ctx context.Context, userUUID string, user *User) error
}

type StudentRepository interface {
	GetMyProfile(ctx context.Context, userUUID string) (*User, error)
	UpdateStudentData(ctx context.Context, userUUID string, user *User) error
}
