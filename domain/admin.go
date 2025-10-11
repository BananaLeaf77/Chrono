package domain

import "context"

type AdminUseCase interface {
	CreateTeacher(ctx context.Context, user *User, instrumentIDs []int) (*User, error)
	UpdateTeacher(ctx context.Context, user *User, instrumentIDs []int) error

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

type AdminRepository interface {
	CreateTeacher(ctx context.Context, user *User, instrumentIDs []int) (*User, error)
	UpdateTeacher(ctx context.Context, user *User, instrumentIDs []int) error

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
