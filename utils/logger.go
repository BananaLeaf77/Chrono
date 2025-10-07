package utils

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
)

func PrintLogInfo(username *string, statusCode int, functionName string, err *error) {
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

	if err != nil && *err != nil {
		log.Error().Msg(fmt.Sprintf("User: %s | Status: %s | Function: %s | Error: %v", user, ColorStatus(statusCode), functionName, *err))
		fmt.Printf("%sUser: %s | Status: %s | Function: %s | Error: %v%s\n", logColor, user, ColorStatus(statusCode), functionName, *err, Reset)
		return
	}
	log.Info().Msg(fmt.Sprintf("User: %s | Status: %s | Function: %s", user, ColorStatus(statusCode), functionName))
	fmt.Printf("%sUser: %s | Status: %s | Function: %s%s\n", logColor, user, ColorStatus(statusCode), functionName, Reset)
}

func GetAPIHitter(c *gin.Context) string {
	apiHitterVal, _ := c.Get("name")      // ini masih interface{}
	apiHitter, _ := apiHitterVal.(string) // type assertion jadi string
	if apiHitterVal == nil {
		apiHitter = "unknown"
		PrintLogInfo(nil, 401, "Get API Hitter - Get Admin Name", nil)
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Unauthorized"})
	}
	return apiHitter
}
