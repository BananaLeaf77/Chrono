package service

import (
	"chronosphere/domain"
	"chronosphere/utils"
	"context"
	"errors"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/xendit/xendit-go/v6"
	"github.com/xendit/xendit-go/v6/invoice"
	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/proto/waE2E"
	"go.mau.fi/whatsmeow/types"
	"gorm.io/gorm"
)

type paymentService struct {
	paymentRepo  domain.PaymentRepository
	studentRepo  domain.StudentRepository
	xenditClient *xendit.APIClient
	db           *gorm.DB
	messenger    *whatsmeow.Client
	// shutdownCtx is cancelled when the app begins graceful shutdown.
	// WA goroutines respect this so they don’t get orphaned.
	shutdownCtx context.Context
}

func NewPaymentService(paymentRepo domain.PaymentRepository, studentRepo domain.StudentRepository, db *gorm.DB, messenger *whatsmeow.Client) domain.PaymentUseCase {
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
		messenger:    messenger,
		// Default to background; replaced via SetShutdownContext during bootstrap.
		shutdownCtx: context.Background(),
	}
}

// SetShutdownContext wires the app-level cancellable context into the service.
// Call this in bootstrap after creating the service, passing the context that
// is cancelled when os.Signal triggers graceful shutdown.
// This allows in-flight WA goroutines to stop cleanly instead of being orphaned.
func (s *paymentService) SetShutdownContext(ctx context.Context) {
	s.shutdownCtx = ctx
}

func (s *paymentService) CreateInvoice(ctx context.Context, studentUUID string, req domain.CheckoutRequest) (*domain.CheckoutResponse, error) {
	// 1. Get Package details
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

	// 4. Update Payment with Invoice URL and Xendit Invoice ID.
	payment.InvoiceURL = resp.InvoiceUrl
	payment.XenditInvoiceID = *resp.Id

	if err := s.db.WithContext(ctx).Save(payment).Error; err != nil {
		return nil, err
	}

	return &domain.CheckoutResponse{
		InvoiceURL: resp.InvoiceUrl,
		ExternalID: externalID,
	}, nil
}

func (s *paymentService) HandleCallback(ctx context.Context, payload *invoice.Invoice) error {

	// 1. Verify payment exists and has both Student + Package preloaded.
	payment, err := s.paymentRepo.FindByExternalID(ctx, payload.ExternalId)
	if err != nil {
		return err
	}
	if payment == nil {
		return errors.New("payment not found")
	}

	// 2. Idempotency guard — already processed.
	if payment.Status == domain.PaymentStatusPaid {
		return nil
	}

	if string(payload.Status) == "PAID" || string(payload.Status) == "SETTLED" {
		// Guard: Package must be loaded; if preload silently failed we’d panic below.
		if payment.Package.ID == 0 {
			return fmt.Errorf("package (id=%d) not loaded for payment %s — preload may have failed",
				payment.PackageID, payment.ExternalID)
		}

		tx := s.db.Begin()
		if tx.Error != nil {
			return fmt.Errorf("failed to begin transaction: %w", tx.Error)
		}
		defer func() {
			if r := recover(); r != nil {
				tx.Rollback()
			}
		}()

		// Update payment status.
		now := time.Now()
		payment.Status = domain.PaymentStatusPaid
		payment.PaidAt = &now
		if err := tx.Save(payment).Error; err != nil {
			tx.Rollback()
			return err
		}

		// Ensure student profile exists.
		var count int64
		tx.Model(&domain.StudentProfile{}).Where("user_uuid = ?", payment.StudentUUID).Count(&count)
		if count == 0 {
			if err := tx.Create(&domain.StudentProfile{UserUUID: payment.StudentUUID}).Error; err != nil {
				tx.Rollback()
				return fmt.Errorf("failed to create student profile: %w", err)
			}
		}

		studentPackage := domain.StudentPackage{
			StudentUUID:    payment.StudentUUID,
			PackageID:      payment.PackageID,
			RemainingQuota: payment.Package.Quota,
			StartDate:      now,
			EndDate:        now.AddDate(0, 0, payment.Package.ExpiredDuration),
		}

		if err := tx.Create(&studentPackage).Error; err != nil {
			tx.Rollback()
			return err
		}

		if err := tx.Commit().Error; err != nil {
			return err
		}

		if s.messenger != nil {
			s.sendPaymentSuccessNotification(&payment.Student, &payment.Package)
		}

	} else if string(payload.Status) == "EXPIRED" {
		s.paymentRepo.UpdateStatus(ctx, payment.ExternalID, domain.PaymentStatusExpired, nil)
	} else {
		s.paymentRepo.UpdateStatus(ctx, payment.ExternalID, domain.PaymentStatusFailed, nil)
	}

	return nil
}

func (s *paymentService) sendPaymentSuccessNotification(student *domain.User, pkg *domain.Package) {
	// Normalize phone number
	studentPhone := utils.NormalizePhoneNumber(student.Phone)
	studentJID := types.NewJID(studentPhone, types.DefaultUserServer)

	// Rich message with emojis
	msgToStudent := fmt.Sprintf(
		`🎉 *Halo %s!*

✅ *Pembayaran Berhasil!*
Paket *"%s"* kamu sudah aktif dan siap digunakan.

📦 *Detail Paket:*
┣ 📚 Nama Paket: %s
┣ 🎯 Jumlah Kelas: %d sesi
┗ ⏳ Masa Aktif: %d hari

✨ *Apa yang bisa kamu lakukan sekarang?*
• 📅 Pesan kelas dengan guru favoritmu
• 📖 Mulai belajar dan raih prestasi
• 🏆 Pantau progress belajarmu

🚀 *Mulai belajar sekarang:*
🔗 https://madeu.app

Terima kasih telah memilih MadEU! 🌟

*#MadEU #BelajarJadiMudah*`,
		student.Name,
		pkg.Name,
		pkg.Name,
		pkg.Quota,
		pkg.ExpiredDuration,
	)

	waMessage := &waE2E.Message{
		Conversation: &msgToStudent,
	}

	// Capture shutdown context; goroutine will stop when app shuts down.
	shutdownCtx := s.shutdownCtx
	go func() {
		_, err := s.messenger.SendMessage(shutdownCtx, studentJID, waMessage)
		if err != nil {
			if shutdownCtx.Err() != nil {
				log.Printf("🔕 WA notification cancelled (shutdown): student=%s", student.Name)
				return
			}
			log.Printf("🔕 Gagal mengirim notifikasi WhatsApp ke %s (%s): %v",
				student.Name, student.Phone, err)
		} else {
			log.Printf("🔔 Notifikasi WhatsApp berhasil dikirim ke: %s (%s)",
				student.Name, student.Phone)
		}
	}()
}
