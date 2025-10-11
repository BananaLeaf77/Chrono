package domain

import "time"

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

type StudentProfile struct {
	UserUUID string           `gorm:"primaryKey;type:uuid" json:"user_uuid"`
	Packages []StudentPackage `gorm:"foreignKey:StudentUUID" json:"packages"`
}

type Package struct {
	ID           int        `gorm:"primaryKey" json:"id"`
	Name         string     `gorm:"not null" json:"name"`
	Quota        int        `gorm:"not null" json:"quota"`
	Description  string     `json:"description"`
	InstrumentID int        `gorm:"not null" json:"instrument_id"`
	Instrument   Instrument `gorm:"foreignKey:InstrumentID" json:"instrument"`
	CreatedAt    time.Time  `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt    time.Time  `gorm:"autoUpdateTime" json:"updated_at"`
	DeletedAt    *time.Time `gorm:"index" json:"deleted_at,omitempty"`
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

type ClassHistory struct {
	ID           int       `gorm:"primaryKey" json:"id"`
	BookingID    int       `gorm:"not null;unique" json:"booking_id"`
	TeacherUUID  string    `gorm:"type:uuid;not null" json:"teacher_uuid"`
	StudentUUID  string    `gorm:"type:uuid;not null" json:"student_uuid"`
	InstrumentID int       `gorm:"not null" json:"instrument_id"`
	PackageID    *int      `json:"package_id,omitempty"`
	Status       string    `gorm:"size:20;default:'completed'" json:"status"`
	Date         time.Time `gorm:"not null" json:"date"`
	StartTime    string    `gorm:"not null" json:"start_time"`
	EndTime      string    `gorm:"not null" json:"end_time"`
	Notes        *string   `json:"notes,omitempty"`

	Instrument     Instrument           `gorm:"foreignKey:InstrumentID" json:"instrument"`
	Package        *Package             `gorm:"foreignKey:PackageID" json:"package,omitempty"`
	Teacher        User                 `gorm:"foreignKey:TeacherUUID" json:"teacher"`
	Student        User                 `gorm:"foreignKey:StudentUUID" json:"student"`
	Documentations []ClassDocumentation `gorm:"foreignKey:ClassHistoryID" json:"documentations"`
	CreatedAt      time.Time            `gorm:"autoCreateTime" json:"created_at"`
}

type ClassDocumentation struct {
	ID             int       `gorm:"primaryKey" json:"id"`
	ClassHistoryID int       `gorm:"not null;index" json:"class_history_id"`
	URL            string    `gorm:"type:text;not null" json:"url"`
	CreatedAt      time.Time `gorm:"autoCreateTime" json:"created_at"`

	ClassHistory ClassHistory `gorm:"foreignKey:ClassHistoryID;constraint:OnDelete:CASCADE;" json:"-"`
}
