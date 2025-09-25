package main

import (
	"chronosphere/config"
	"chronosphere/delivery"
	"chronosphere/repository"
	"chronosphere/service"
	"log"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
		panic("Error loading .env file")
	}

	db, _, err := config.BootDB()
	if err != nil {
		panic("Failed to connect to database")
	}

	// whatsMeow, _, err := config.InitWA(*address)
	// if err != nil {
	// 	panic("Failed to initialize Whatsapp client")
	// }

	// Repository Initialization
	userRepo := repository.NewUserRepository(db)

	// Use Case Initialization
	userUseCase := service.NewUserService(userRepo)

	// Gin Initialization
	app := gin.Default()
	// Middleware Initialization
	config.InitMiddleware(app)
	// Handler Initialization
	delivery.NewUserHandler(app, userUseCase)
	// Start the server
	app.Run(":8080")

}
