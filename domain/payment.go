package domain

import (
	"context"
	"time"

	"github.com/xendit/xendit-go/v6/invoice"
)

const (
	PaymentStatusPending = "PENDING"
	PaymentStatusPaid    = "PAID"
	PaymentStatusExpired = "EXPIRED"
	PaymentStatusFailed  = "FAILED"
)

type Payment struct {
	ID              int        `gorm:"primaryKey" json:"id"`
	ExternalID      string     `gorm:"unique;not null" json:"external_id"` // Xendit External ID
	StudentUUID     string     `gorm:"type:uuid;not null" json:"student_uuid"`
	Student         User       `gorm:"foreignKey:StudentUUID;references:UUID" json:"student"`
	PackageID       int        `gorm:"not null" json:"package_id"`
	Package         Package    `gorm:"foreignKey:PackageID" json:"package"`
	Amount          float64    `gorm:"not null" json:"amount"`
	Status          string     `gorm:"size:20;default:'PENDING'" json:"status"`
	InvoiceURL      string     `gorm:"type:text" json:"invoice_url"`
	XenditInvoiceID string     `gorm:"unique" json:"xendit_invoice_id,omitempty"`
	PaidAt          *time.Time `json:"paid_at,omitempty"`
	CreatedAt       time.Time  `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt       time.Time  `gorm:"autoUpdateTime" json:"updated_at"`
}

type CheckoutRequest struct {
	PackageID int `json:"package_id" binding:"required"`
}

type CheckoutResponse struct {
	InvoiceURL string `json:"invoice_url"`
	ExternalID string `json:"external_id"`
}

type PaymentCallback struct {
	ID                 string    `json:"id"`
	ExternalID         string    `json:"external_id"`
	Status             string    `json:"status"`
	MerchantName       string    `json:"merchant_name"`
	Amount             float64   `json:"amount"`
	PayerEmail         string    `json:"payer_email"`
	Description        string    `json:"description"`
	PaidAt             time.Time `json:"paid_at"`
	PaymentMethod      string    `json:"payment_method"`
	PaymentChannel     string    `json:"payment_channel"`
	PaymentDestination string    `json:"payment_destination"`
}

type ProfitFilter struct {
	StartDate string `form:"start_date"` // YYYY-MM-DD
	EndDate   string `form:"end_date"`   // YYYY-MM-DD
}

type HistoryFilter struct {
	Page      int    `form:"page,default=1"`
	Limit     int    `form:"limit,default=10"`
	StartDate string `form:"start_date"`
	EndDate   string `form:"end_date"`
	Status    string `form:"status"` // PENDING, PAID, EXPIRED, FAILED
}

type PackageSummary struct {
	PackageName  string  `json:"package_name"`
	TotalSold    int     `json:"total_sold"`
	TotalRevenue float64 `json:"total_revenue"`
}

type PaymentRepository interface {
	Create(ctx context.Context, payment *Payment) error
	UpdateStatus(ctx context.Context, externalID string, status string, paidAt *time.Time) (*Payment, error)
	FindByExternalID(ctx context.Context, externalID string) (*Payment, error)
	GetTotalProfit(ctx context.Context, filter ProfitFilter) (float64, error)
	GetPaymentHistory(ctx context.Context, filter HistoryFilter) ([]Payment, int64, error)
	GetPackageSummary(ctx context.Context) ([]PackageSummary, error)
	GetStudentBuyerDetailsAndPackage(ctx context.Context, studentUUID string, packageID int) (*User, *Package, error)
	CheckStudentProfileExist(ctx context.Context, studentUUID string) (bool, error)
}

type PaymentUseCase interface {
	CreateInvoice(ctx context.Context, studentUUID string, req CheckoutRequest) (*CheckoutResponse, error)
	HandleCallback(ctx context.Context, payload *invoice.Invoice) error
}
