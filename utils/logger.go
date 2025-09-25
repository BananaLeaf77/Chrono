package utils

import (
	"fmt"
	"net/http"

	"github.com/rs/zerolog/log"
)

func PrintLogInfo(username *string, statusCode int, functionName string) {
	var logColor string

	switch statusCode {
	case http.StatusOK, http.StatusCreated, http.StatusAccepted:
		logColor = Green
	case http.StatusBadRequest, http.StatusUnauthorized, http.StatusForbidden, http.StatusNotFound:
		logColor = Yellow
	case http.StatusInternalServerError, http.StatusNotImplemented, http.StatusBadGateway, http.StatusServiceUnavailable:
		logColor = Red
	default:
		logColor = Reset
	}

	user := "Unknown"
	if username != nil {
		user = *username
	}

	log.Info().Msg(fmt.Sprintf("User: %s | Status: %s | Function: %s", user, ColorStatus(statusCode), functionName))
	fmt.Printf("%sUser: %s | Status: %s | Function: %s%s\n", logColor, user, ColorStatus(statusCode), functionName, Reset)
}
