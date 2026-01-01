package handlers

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"service-exchange-backend-go/internal/auth"
	"service-exchange-backend-go/internal/database"
	"service-exchange-backend-go/internal/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func GetCategories(w http.ResponseWriter, r *http.Request) {
	categoryType := r.URL.Query().Get("type")
	if categoryType == "" {
		http.Error(w, "Category type is required", http.StatusBadRequest)
		return
	}

	userID := r.Context().Value(auth.UserContextKey).(string)
	userObjID, _ := primitive.ObjectIDFromHex(userID)

	collection := database.GetCollection("categories")

	cursor, err := collection.Find(r.Context(), bson.M{
		"user": userObjID,
		"type": categoryType,
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer cursor.Close(r.Context())

	var categories []models.Category
	if err = cursor.All(r.Context(), &categories); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"count":   len(categories),
		"data":    categories,
	})
}

func CreateCategory(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Name        string `json:"name"`
		Type        string `json:"type"`
		Color       string `json:"color"`
		Icon        string `json:"icon"`
		Description string `json:"description"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if input.Name == "" || input.Type == "" {
		http.Error(w, "Name and type are required", http.StatusBadRequest)
		return
	}

	userID := r.Context().Value(auth.UserContextKey).(string)
	userObjID, _ := primitive.ObjectIDFromHex(userID)

	collection := database.GetCollection("categories")

	count, _ := collection.CountDocuments(r.Context(), bson.M{
		"user": userObjID,
		"name": strings.TrimSpace(input.Name),
		"type": input.Type,
	})
	if count > 0 {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Category with this name already exists",
		})
		return
	}

	category := models.Category{
		ID:          primitive.NewObjectID(),
		User:        userObjID,
		Name:        strings.TrimSpace(input.Name),
		Type:        models.CategoryType(input.Type),
		Color:       input.Color,
		Icon:        input.Icon,
		Description: input.Description,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	_, err := collection.InsertOne(r.Context(), category)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    category,
	})
}

func UpdateCategory(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(r.URL.Path, "/")
	id := parts[len(parts)-1]
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	var input struct {
		Name        string `json:"name"`
		Color       string `json:"color"`
		Icon        string `json:"icon"`
		Description string `json:"description"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	userID := r.Context().Value(auth.UserContextKey).(string)
	userObjID, _ := primitive.ObjectIDFromHex(userID)
	collection := database.GetCollection("categories")

	var category models.Category
	err = collection.FindOne(r.Context(), bson.M{"_id": objID, "user": userObjID}).Decode(&category)
	if err != nil {
		http.Error(w, "Category not found", http.StatusNotFound)
		return
	}

	update := bson.M{"updatedAt": time.Now()}

	if input.Name != "" && input.Name != category.Name {
		count, _ := collection.CountDocuments(r.Context(), bson.M{
			"user": userObjID,
			"name": strings.TrimSpace(input.Name),
			"type": category.Type,
			"_id":  bson.M{"$ne": category.ID},
		})
		if count > 0 {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success": false,
				"message": "Category with this name already exists",
			})
			return
		}
		update["name"] = strings.TrimSpace(input.Name)
	}

	if input.Color != "" {
		update["color"] = input.Color
	}
	if input.Icon != "" {
		update["icon"] = input.Icon
	}
	if input.Description != "" {
		update["description"] = input.Description
	}

	_, err = collection.UpdateOne(r.Context(), bson.M{"_id": objID}, bson.M{"$set": update})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	collection.FindOne(r.Context(), bson.M{"_id": objID}).Decode(&category)

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    category,
	})
}

func DeleteCategory(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(r.URL.Path, "/")
	id := parts[len(parts)-1]
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	userID := r.Context().Value(auth.UserContextKey).(string)
	userObjID, _ := primitive.ObjectIDFromHex(userID)
	collection := database.GetCollection("categories")

	res, err := collection.DeleteOne(r.Context(), bson.M{"_id": objID, "user": userObjID})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if res.DeletedCount == 0 {
		http.Error(w, "Category not found", http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Category deleted successfully",
	})
}

func GetDefaultCategories(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(r.URL.Path, "/")
	catType := parts[len(parts)-1]

	var defaultCategories []map[string]string

	switch catType {
	case "working-hours":
		defaultCategories = []map[string]string{
			{"name": "Coding", "color": "#3498db", "icon": "code"},
			{"name": "Learning", "color": "#2ecc71", "icon": "book"},
			{"name": "Project Work", "color": "#e74c3c", "icon": "briefcase"},
			{"name": "Other", "color": "#95a5a6", "icon": "more-horizontal"},
		}
	case "skills":
		defaultCategories = []map[string]string{
			{"name": "MERN Stack", "color": "#3498db", "icon": "server"},
			{"name": "Java & Ecosystem", "color": "#e67e22", "icon": "coffee"},
			{"name": "DevOps", "color": "#9b59b6", "icon": "settings"},
			{"name": "Data Science & ML", "color": "#2ecc71", "icon": "bar-chart-2"},
			{"name": "Mobile Development", "color": "#e74c3c", "icon": "smartphone"},
			{"name": "Go Backend", "color": "#1abc9c", "icon": "send"},
		}
	case "schedule":
		defaultCategories = []map[string]string{
			{"name": "DSA", "color": "#3498db", "icon": "code"},
			{"name": "System Design", "color": "#9b59b6", "icon": "git-branch"},
			{"name": "Development", "color": "#2ecc71", "icon": "code-sandbox"},
			{"name": "Learning", "color": "#f39c12", "icon": "book-open"},
			{"name": "Problem Solving", "color": "#e74c3c", "icon": "zap"},
			{"name": "Other", "color": "#95a5a6", "icon": "more-horizontal"},
		}
	case "timetable":
		defaultCategories = []map[string]string{
			{"name": "Career", "color": "#3498db", "icon": "briefcase"},
			{"name": "Backend", "color": "#2ecc71", "icon": "server"},
			{"name": "Core", "color": "#e74c3c", "icon": "cpu"},
			{"name": "Frontend", "color": "#f39c12", "icon": "layout"},
			{"name": "Mobile", "color": "#9b59b6", "icon": "smartphone"},
		}
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    defaultCategories,
	})
}
