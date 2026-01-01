package database

import (
	"context"
	"log"
	"os"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var Client *mongo.Client
var DB *mongo.Database

func ConnectDB() {
	uri := os.Getenv("MONGODB_URI")
	if uri == "" {
		log.Fatal("MONGODB_URI is not defined")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri))
	if err != nil {
		log.Fatal(err)
	}

	// Ping the database
	err = client.Ping(ctx, nil)
	if err != nil {
		log.Fatal(err)
	}

	Client = client
	// Assuming the DB name is part of the URI, but we can also set a default or env var.
	// Often Mongoose defaults to 'test' if not specified, but usually the URI has it.
	// We can pick a default name if needed, or parse it.
	// For now, let's look at the URI or just use a default "service-exchange" if not provided?
	// Mongoose typically handles this. Let's see if we can get it or just expect the URI to have it.
	// Actually, the best practice is to explicitely select the database.
	// Let's assume the DB name is "service-exchange" if we can't find one, or use a separate env var.
	// Re-reading server.js: await mongoose.connect(process.env.MONGODB_URI, ...);
	// Usually the URI ends with /dbname.
	// We'll stick to a default "service-exchange" or allow config.

	// Let's try to extract it or just use "service-exchange" for now.
	DB = client.Database("service-exchange")

	log.Println("✅ MongoDB Connected!")
}

func GetCollection(collectionName string) *mongo.Collection {
	return DB.Collection(collectionName)
}
