package service

import (
	"chronosphere/domain"
	"context"
	"errors"
	"fmt"
	"os"
	"time"

	"github.com/xendit/xendit-go/v6"
	"github.com/xendit/xendit-go/v6/invoice"
	"gorm.io/gorm"
)

type paymentService struct {
	paymentRepo  domain.PaymentRepository
	studentRepo  domain.StudentRepository // We need to add packages to student
	xenditClient *xendit.APIClient
	db           *gorm.DB // Needed for transaction if we want atomic package addition
}

func NewPaymentService(paymentRepo domain.PaymentRepository, studentRepo domain.StudentRepository, db *gorm.DB) domain.PaymentUseCase {
	// Initialize Xendit Client
	// Note: In a real scenario, we might pass the client in, but here we can init it if keys are in env
	// Or better yet, initialize it here using Env vars.
	// However, usually dependencies are passed in. For now, let's create it here or assume the handler/bootstrap sets it up?
	// The implementation plan didn't specify Xendit Client injection in NewPaymentService, but it's cleaner.
	// Let's instantiate it here using os.Getenv to follow the standard pattern if not passed.

	xenditKey := os.Getenv("XENDIT_API_KEY")
	if xenditKey == "" {
		fmt.Println("WARNING: XENDIT_API_KEY is not set")
	}

	client := xendit.NewClient(xenditKey)

	return &paymentService{
		paymentRepo:  paymentRepo,
		studentRepo:  studentRepo,
		xenditClient: client,
		db:           db,
	}
}

func (s *paymentService) CreateInvoice(ctx context.Context, studentUUID string, req domain.CheckoutRequest) (*domain.CheckoutResponse, error) {
	// 1. Get Package Details
	// We need a method to get package details. studentRepo has GetAllAvailablePackages, but maybe not GetPackageByID?
	// Let's assume we can fetch it or we need to add a method.
	// Checking repository/student.go, we only have GetAllAvailablePackages.
	// We might need to query the DB directly since we have the DB instance or add a repo method.
	// Since we have `s.db`, let's query the Package.

	var pkg domain.Package
	if err := s.db.WithContext(ctx).First(&pkg, req.PackageID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("package not found")
		}
		return nil, err
	}

	var student domain.User
	if err := s.db.WithContext(ctx).Where("uuid = ?", studentUUID).First(&student).Error; err != nil {
		return nil, errors.New("student not found")
	}

	// 2. Create Payment Record (Pending)
	externalID := fmt.Sprintf("invoice-%s-%d-%d", studentUUID, req.PackageID, time.Now().Unix())

	payment := &domain.Payment{
		ExternalID:  externalID,
		StudentUUID: studentUUID,
		PackageID:   req.PackageID,
		Amount:      pkg.Price,
		Status:      domain.PaymentStatusPending,
	}

	if err := s.paymentRepo.Create(ctx, payment); err != nil {
		return nil, err
	}

	// 3. Call Xendit API
	createInvoiceRequest := *invoice.NewCreateInvoiceRequest(externalID, pkg.Price)
	createInvoiceRequest.SetPayerEmail(student.Email)
	createInvoiceRequest.SetDescription(fmt.Sprintf("Payment for %s", pkg.Name))

	// Add success redirect URL if needed, maybe from env
	// createInvoiceRequest.SetSuccessRedirectUrl("https://your-frontend.com/success")

	resp, _, err := s.xenditClient.InvoiceApi.CreateInvoice(ctx).CreateInvoiceRequest(createInvoiceRequest).Execute()
	if err != nil {
		// Update status to FAILED
		s.paymentRepo.UpdateStatus(ctx, externalID, domain.PaymentStatusFailed, nil)
		return nil, fmt.Errorf("xendit error: %v", err)
	}

	// 4. Update Payment with Invoice URL and Xendit ID
	// We need to store Xendit Invoice ID? We added it to the struct.
	// Reuse UpdateStatus or manual update? The repo only has UpdateStatus.
	// Let's do a direct update here via DB for the generic fields if repo doesn't support it,
	// OR better: Update the payment object we just created and save it.

	payment.InvoiceURL = resp.InvoiceUrl
	payment.XenditInvoiceID = *resp.Id

	// Saving changes
	if err := s.db.WithContext(ctx).Save(payment).Error; err != nil {
		return nil, err
	}

	return &domain.CheckoutResponse{
		InvoiceURL: resp.InvoiceUrl,
		ExternalID: externalID,
	}, nil
}

func (s *paymentService) HandleCallback(ctx context.Context, payload *invoice.Invoice) error {
	// 1. Verify payment exists
	payment, err := s.paymentRepo.FindByExternalID(ctx, payload.ExternalId)
	if err != nil {
		return err
	}
	if payment == nil {
		return errors.New("payment not found")
	}

	// 2. Check status
	if payment.Status == domain.PaymentStatusPaid {
		return nil // Already paid
	}

	// Map Xendit status to domain status
	// Xendit: PAID, EXPIRED, PENDING sent as ... string?
	// The payload.Status is *InvoiceStatus which is a string enum in the SDK

	// If PAID
	if string(payload.Status) == "PAID" || string(payload.Status) == "SETTLED" {
		// Start Transaction
		tx := s.db.Begin()
		defer func() {
			if r := recover(); r != nil {
				tx.Rollback()
			}
		}()

		// Update payment status
		now := time.Now()
		payment.Status = domain.PaymentStatusPaid
		payment.PaidAt = &now
		if err := tx.Save(payment).Error; err != nil {
			tx.Rollback()
			return err
		}

		// Activate Package for Student
		// Logic: Create StudentPackage record
		// Calculate EndDate based on StartDate (now) and Duration?
		// Wait, duration is minutes (30/60) per class, but package validity?
		// Looking at `StudentPackage` struct in `domain/main_table.go`:
		// StartDate time.Time
		// EndDate time.Time
		// RemainingQuota int

		// How long is a package valid?
		// The `Package` struct has `Quota`.
		// Usually a package might be valid for X months?
		// The current `main_table.go` doesn't show "ValidityDuration" on `Package` struct.
		// "Duration" field is for class duration (30/60 mins).
		// Let's assume a default validity (e.g. 1 month) or maybe it's infinite until quota runs out?
		// Existing code: `student_packages.end_date >= ?` implies they expire.
		// Let's check if there is a convention.
		// For now, let's assume 1 Month validity? Or 3 months?
		// Better to be safe, maybe 3 months? Or check if Package has description saying validity.
		// I will create the `StudentPackage` with 30 days validity for now + Quota from package.

		studentPackage := domain.StudentPackage{
			StudentUUID:    payment.StudentUUID,
			PackageID:      payment.PackageID,
			RemainingQuota: payment.Package.Quota, // Assuming Package was preloaded in FindByExternalID
			StartDate:      now,
			EndDate:        now.AddDate(0, 1, 0), // Adds 1 month
		}

		if err := tx.Create(&studentPackage).Error; err != nil {
			tx.Rollback()
			return err
		}

		if err := tx.Commit().Error; err != nil {
			return err
		}
	} else if string(payload.Status) == "EXPIRED" {
		s.paymentRepo.UpdateStatus(ctx, payment.ExternalID, domain.PaymentStatusExpired, nil)
	} else {
		// Other statuses
		s.paymentRepo.UpdateStatus(ctx, payment.ExternalID, domain.PaymentStatusFailed, nil)
	}

	return nil
}
