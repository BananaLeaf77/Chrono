package utils

import "fmt"

const (
	Red    = "\033[31m"
	Green  = "\033[32m"
	Yellow = "\033[33m"
	Reset  = "\033[0m"
)

func ColorStatus(code int) string {
	switch {
	case code >= 500:
		return Red + fmt.Sprint(code) + Reset
	case code >= 400:
		return Yellow + fmt.Sprint(code) + Reset
	case code >= 200:
		return Green + fmt.Sprint(code) + Reset
	default:
		return fmt.Sprint(code)
	}
}

func ColorText(text, color string) string {
	return color + text + Reset
}
