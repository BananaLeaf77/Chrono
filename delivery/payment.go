package delivery

import (
	"chronosphere/domain"
	"chronosphere/middleware"
	"chronosphere/utils"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/xendit/xendit-go/v6/invoice"
)

type PaymentHandler struct {
	paymentUseCase domain.PaymentUseCase
}

func NewPaymentHandler(r *gin.Engine, paymentUseCase domain.PaymentUseCase, authMiddleware gin.HandlerFunc) {
	handler := &PaymentHandler{
		paymentUseCase: paymentUseCase,
	}

	paymentGroup := r.Group("/api/v1/payment")
	{
		// Authenticated route for checkout
		paymentGroup.POST("/checkout", authMiddleware, middleware.StudentOnly(), handler.Checkout)

		// Public route for webhook (Xendit will call this)
		paymentGroup.POST("/callback", handler.PaymentCallback)
	}
}

// Checkout godoc
// @Summary Purchase a package
// @Description Create an invoice for a student package
// @Tags payment
// @Accept json
// @Produce json
// @Param request body domain.CheckoutRequest true "Checkout Request"
// @Success 200 {object} domain.CheckoutResponse
// @Failure 401 {object} utils.Response
// @Router /payment/checkout [post]
func (h *PaymentHandler) Checkout(c *gin.Context) {
	// Extract Student UUID from context (set by middleware)
	studentID, exists := c.Get("userUUID") // Changed to userUUID based on config/gin.go
	studentName := utils.GetAPIHitter(c)
	if !exists {
		utils.PrintLogInfo(&studentName, http.StatusUnauthorized, "Checkout - Create Invoice", nil)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	studentUUID := studentID.(string)

	var req domain.CheckoutRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.PrintLogInfo(&studentName, http.StatusBadRequest, "Checkout - Create Invoice", &err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	resp, err := h.paymentUseCase.CreateInvoice(c.Request.Context(), studentUUID, req)
	if err != nil {
		utils.PrintLogInfo(&studentName, http.StatusInternalServerError, "Checkout - Create Invoice", &err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	utils.PrintLogInfo(&studentName, http.StatusOK, "Checkout - Create Invoice", nil)
	c.JSON(http.StatusOK, gin.H{
		"message": "Invoice created successfully",
		"data":    resp,
	})
}

// PaymentCallback godoc
// @Summary Handle Xendit Callback
// @Description Webhook receiver for payment updates
// @Tags payment
// @Accept json
// @Produce json
// @Router /payment/callback [post]
func (h *PaymentHandler) PaymentCallback(c *gin.Context) {
	// Verify Xendit Callback Token or Header (Optional but recommended)
	// Xendit sends `x-callback-token` header.
	token := c.GetHeader("x-callback-token")
	expectedToken := os.Getenv("XENDIT_WEBHOOK_TOKEN")

	if expectedToken != "" && token != expectedToken {
		c.JSON(http.StatusForbidden, gin.H{"error": "Invalid callback token"})
		return
	}

	// Parse Body
	var invoiceData invoice.Invoice
	if err := c.ShouldBindJSON(&invoiceData); err != nil {
		// Xendit might send test events differently, but assuming standard Invoice Callback
		// Fallback or log error
		// Note: Xendit v6 SDK might expect specific structs.
		// If binding fails, it might be a different event type or malformed.
		// For now simple binding.
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse webhook body"})
		return
	}

	// Process
	err := h.paymentUseCase.HandleCallback(c.Request.Context(), &invoiceData)
	if err != nil {
		// We return 200 even on error to tell Xendit we received it,
		// otherwise they keep retrying. But maybe 500 if temporary error?
		// Usually 5xx triggers retry. 4xx doesn't.
		// If it's a logic error (e.g. payment not found), maybe 200 is fine but log it.
		// Let's return 500 for now if it fails so I successfully get alerts if logic is wrong.
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}
