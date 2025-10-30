package utils

import (
	"fmt"
	"strings"
	"time"
)

func CalculateEndTime(startTime string, durationHours float64) string {
	const timeLayout = "15:04" // 24-hour format

	// Parse the input start time
	t, err := time.Parse(timeLayout, startTime)
	if err != nil {
		// Return fallback (start time) if invalid format
		fmt.Printf("⚠️ Invalid time format: %v\n", err)
		return startTime
	}

	// Add hours (durationHours can be fractional, e.g., 1.5 for 1 hour 30 min)
	duration := time.Duration(durationHours * float64(time.Hour))
	endTime := t.Add(duration)

	// Return as "HH:mm"
	return endTime.Format(timeLayout)
}

func GetNextClassDate(dayOfWeek string, startTime time.Time) time.Time {
	dayMap := map[string]time.Weekday{
		"minggu": time.Sunday,
		"senin":  time.Monday,
		"selasa": time.Tuesday,
		"rabu":   time.Wednesday,
		"kamis":  time.Thursday,
		"jumat":  time.Friday,
		"sabtu":  time.Saturday,
	}

	targetDay, ok := dayMap[strings.ToLower(dayOfWeek)]
	if !ok {
		return time.Now() // fallback if input invalid
	}

	now := time.Now()
	diff := (int(targetDay) - int(now.Weekday()) + 7) % 7
	nextClassDate := now.AddDate(0, 0, diff)

	return time.Date(
		nextClassDate.Year(),
		nextClassDate.Month(),
		nextClassDate.Day(),
		startTime.Hour(),
		startTime.Minute(),
		0, 0, time.Local)
}
