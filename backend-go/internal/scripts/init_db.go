package main

import (
	"context"
	"log"
	"os"
	"time"

	"service-exchange-backend-go/internal/database"
	"service-exchange-backend-go/internal/models"

	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func main() {
	if err := godotenv.Load("../../.env"); err != nil {
		log.Println("No .env file found")
	}

	database.ConnectDB()
	collection := database.GetCollection("skills")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Hardcoded dummy user ID for init script or we skip user assignment if schema requires it?
	// Schema requires User ID. The original script didn't set user ID, which would fail validation in real app
	// unless schema has default or required=false.
	// Looking at models/Skills.js: user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
	// The initDb.js script would likely fail if run as is against that schema, OR it relies on a specific user being logged in?
	// Actually, `initDb.js` imports `Skill` model. If Mongoose validation is on, it fails.
	// Maybe it was just a template.

	// I will just create the structure of the script but probably not run it blindly.
	// I'll assume we want to seed data for a specific user or just have the capability.

	log.Println("Initializing DB... (This is a placeholder as actual user ID is needed for valid data)")

	// Example of what it would do:
	/*
	defaultSkills := []models.Skill{
		{
			ID: primitive.NewObjectID(),
			// User: someUserID,
			Category: "MERN Stack",
			Name: "React",
			Status: models.SkillStatusInProgress,
		},
		// ...
	}
	collection.InsertMany(ctx, defaultSkills)
	*/
}
