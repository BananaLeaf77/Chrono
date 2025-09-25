package repository

import (
    "chronosphere/domain"
    "context"

    "gorm.io/gorm"
)

type teacherRepository struct {
    db *gorm.DB
}

func NewTeacherRepository(db *gorm.DB) domain.TeacherRepository {
    return &teacherRepository{db: db}
}

func (r *teacherRepository) GetAllTeachers(ctx context.Context) ([]domain.User, error) {
    var teachers []domain.User
    if err := r.db.WithContext(ctx).Where("role = ?", "teacher").Find(&teachers).Error; err != nil {
        return nil, err
    }
    return teachers, nil
}

func (r *teacherRepository) GetTeacherByUUID(ctx context.Context, uuid string) (*domain.User, error) {
    var teacher domain.User
    if err := r.db.WithContext(ctx).Where("uuid = ? AND role = ?", uuid, "teacher").First(&teacher).Error; err != nil {
        return nil, err
    }
    return &teacher, nil
}

func (r *teacherRepository) GetTeacherProfile(ctx context.Context, uuid string) (*domain.TeacherProfile, error) {
    var profile domain.TeacherProfile
    if err := r.db.WithContext(ctx).Preload("Instruments").First(&profile, "user_uuid = ?", uuid).Error; err != nil {
        return nil, err
    }
    return &profile, nil
}

func (r *teacherRepository) UpdateTeacherProfile(ctx context.Context, profile *domain.TeacherProfile) error {
    return r.db.WithContext(ctx).Save(profile).Error
}

func (r *teacherRepository) AssignInstrument(ctx context.Context, teacherUUID, instrumentName string) error {
    var instrument domain.Instrument
    if err := r.db.WithContext(ctx).FirstOrCreate(&instrument, domain.Instrument{Name: instrumentName}).Error; err != nil {
        return err
    }

    var profile domain.TeacherProfile
    if err := r.db.WithContext(ctx).First(&profile, "user_uuid = ?", teacherUUID).Error; err != nil {
        return err
    }

    return r.db.WithContext(ctx).Model(&profile).Association("Instruments").Append(&instrument)
}

func (r *teacherRepository) RemoveInstrument(ctx context.Context, teacherUUID, instrumentName string) error {
    var instrument domain.Instrument
    if err := r.db.WithContext(ctx).First(&instrument, "name = ?", instrumentName).Error; err != nil {
        return err
    }

    var profile domain.TeacherProfile
    if err := r.db.WithContext(ctx).First(&profile, "user_uuid = ?", teacherUUID).Error; err != nil {
        return err
    }

    return r.db.WithContext(ctx).Model(&profile).Association("Instruments").Delete(&instrument)
}