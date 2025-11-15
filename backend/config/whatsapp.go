package config

import (
	"chronosphere/utils"
	"context"
	"fmt"
	"log"
	"os"

	_ "github.com/lib/pq"
	"github.com/mdp/qrterminal"

	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/store/sqlstore"
	"go.mau.fi/whatsmeow/types/events"
	waLog "go.mau.fi/whatsmeow/util/log"
)

func eventHandler(evt interface{}) {
	switch v := evt.(type) {
	case *events.Message:
		fmt.Println("Received a message!", v.Message.GetConversation())
	}
}

func InitWA(dbAddress string) (*whatsmeow.Client, context.Context, error) {
	dbLog := waLog.Stdout("Database", "DEBUG", true)
	ctx := context.Background()
	container, err := sqlstore.New(ctx, "postgres", dbAddress, dbLog)
	if err != nil {
		log.Fatal("Failed to initialize ", utils.ColorText("Whatsapp ", utils.Red), "client, error: ", err)
		return nil, nil, fmt.Errorf("failed to create sqlstore: %w", err)
	}

	deviceStore, err := container.GetFirstDevice(ctx)
	if err != nil {
		log.Fatal("Failed to get ", utils.ColorText("Device first ", utils.Yellow), ", error: ", err)
		return nil, nil, fmt.Errorf("failed to get device: %w", err)
	}

	clientLog := waLog.Stdout("Client", "DEBUG", true)
	client := whatsmeow.NewClient(deviceStore, clientLog)
	client.AddEventHandler(eventHandler)

	if client.Store.ID == nil {
		qrChan, _ := client.GetQRChannel(ctx)
		if err := client.Connect(); err != nil {
			log.Fatal("Failed to connect ", utils.ColorText("Whatsapp ", utils.Red), "client, error: ", err)
			return nil, nil, fmt.Errorf("failed to connect client: %w", err)
		}
		for evt := range qrChan {
			if evt.Event == "code" {
				fmt.Println("Scan this QR code with WhatsApp:")
				qrterminal.GenerateHalfBlock(evt.Code, qrterminal.L, os.Stdout)
			} else {
				fmt.Println("Login event:", evt.Event)
			}
		}
	} else {
		if err := client.Connect(); err != nil {
			log.Fatal("Failed to connect ", utils.ColorText("Whatsapp ", utils.Red), "client, error: ", err)
			return nil, nil, fmt.Errorf("failed to connect client: %w", err)
		}
	}

	log.Print("Connected to ", utils.ColorText("Whatsapp", utils.Green), " successfully")
	return client, ctx, nil
}
