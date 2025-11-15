package utils

import (
	"fmt"
	"net/smtp"
	"os"
)

func SendEmail(to, subject, body string) error {
	from := os.Getenv("SMTP_USER")
	pass := os.Getenv("SMTP_PASS")
	host := os.Getenv("SMTP_HOST")
	port := os.Getenv("SMTP_PORT")

	addr := fmt.Sprintf("%s:%s", host, port)
	msg := []byte(
		"From: " + os.Getenv("SMTP_FROM") + "\r\n" +
			"To: " + to + "\r\n" +
			"Subject: " + subject + "\r\n" +
			"Content-Type: text/plain; charset=\"utf-8\"\r\n" +
			"\r\n" +
			body + "\r\n")

	auth := smtp.PlainAuth("", from, pass, host)
	return smtp.SendMail(addr, auth, from, []string{to}, msg)
}
