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
	"go.mongodb.org/mongo-driver/mongo/options"
)

func GetSkills(w http.ResponseWriter, r *http.Request) {
	category := r.URL.Query().Get("category")
	status := r.URL.Query().Get("status")

	userID := r.Context().Value(auth.UserContextKey).(string)
	userObjID, _ := primitive.ObjectIDFromHex(userID)

	query := bson.M{"user": userObjID}
	if category != "" {
		query["category"] = category
	}
	if status != "" {
		query["status"] = status
	}

	collection := database.GetCollection("skills")
	opts := options.Find().SetSort(bson.M{
		"category":   1,
		"orderIndex": 1,
		"name":       1,
	})

	cursor, err := collection.Find(r.Context(), query, opts)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer cursor.Close(r.Context())

	var skills []models.Skill
	if err = cursor.All(r.Context(), &skills); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	groupedSkills := make(map[string][]models.Skill)
	for _, skill := range skills {
		groupedSkills[skill.Category] = append(groupedSkills[skill.Category], skill)
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":       true,
		"count":         len(skills),
		"data":          skills,
		"groupedSkills": groupedSkills,
	})
}

func AddSkill(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Name        string            `json:"name"`
		Category    string            `json:"category"`
		Status      string            `json:"status"`
		Progress    int               `json:"progress"`
		Description string            `json:"description"`
		Resources   []models.Resource `json:"resources"`
		Priority    string            `json:"priority"`
		OrderIndex  *int              `json:"orderIndex"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if input.Name == "" || input.Category == "" {
		http.Error(w, "Name and category are required", http.StatusBadRequest)
		return
	}

	userID := r.Context().Value(auth.UserContextKey).(string)
	userObjID, _ := primitive.ObjectIDFromHex(userID)
	collection := database.GetCollection("skills")

	// Check duplicates
	count, _ := collection.CountDocuments(r.Context(), bson.M{
		"user":     userObjID,
		"name":     strings.TrimSpace(input.Name),
		"category": input.Category,
	})
	if count > 0 {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Skill already exists in this category",
		})
		return
	}

	orderIndex := 0
	if input.OrderIndex != nil {
		orderIndex = *input.OrderIndex
	} else {
		// Find highest order index
		var highestSkill models.Skill
		opts := options.FindOne().SetSort(bson.M{"orderIndex": -1})
		err := collection.FindOne(r.Context(), bson.M{"user": userObjID, "category": input.Category}, opts).Decode(&highestSkill)
		if err == nil {
			orderIndex = highestSkill.OrderIndex + 1
		}
	}

	skill := models.Skill{
		ID:          primitive.NewObjectID(),
		User:        userObjID,
		Name:        strings.TrimSpace(input.Name),
		Category:    input.Category,
		Status:      models.SkillStatus(input.Status),
		Progress:    input.Progress,
		Description: input.Description,
		Resources:   input.Resources,
		Priority:    models.SkillPriority(input.Priority),
		OrderIndex:  orderIndex,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if skill.Status == "" {
		skill.Status = models.SkillStatusUpcoming
	}

	if skill.Status == models.SkillStatusInProgress {
		now := time.Now()
		skill.StartDate = &now
	}
	if skill.Status == models.SkillStatusCompleted {
		now := time.Now()
		skill.CompletionDate = &now
		skill.Progress = 100
	}

	_, err := collection.InsertOne(r.Context(), skill)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    skill,
	})
}

func UpdateSkill(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(r.URL.Path, "/")
	id := parts[len(parts)-1]
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	var input map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	userID := r.Context().Value(auth.UserContextKey).(string)
	userObjID, _ := primitive.ObjectIDFromHex(userID)
	collection := database.GetCollection("skills")

	var skill models.Skill
	err = collection.FindOne(r.Context(), bson.M{"_id": objID, "user": userObjID}).Decode(&skill)
	if err != nil {
		http.Error(w, "Skill not found", http.StatusNotFound)
		return
	}

	update := bson.M{"updatedAt": time.Now()}

	// Handle name/category uniqueness check if changed
	name, hasName := input["name"].(string)
	category, hasCategory := input["category"].(string)

	if (hasName && name != skill.Name) || (hasCategory && category != skill.Category) {
		checkName := skill.Name
		if hasName {
			checkName = strings.TrimSpace(name)
		}
		checkCategory := skill.Category
		if hasCategory {
			checkCategory = category
		}

		count, _ := collection.CountDocuments(r.Context(), bson.M{
			"user":     userObjID,
			"name":     checkName,
			"category": checkCategory,
			"_id":      bson.M{"$ne": skill.ID},
		})
		if count > 0 {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success": false,
				"message": "Skill already exists in this category",
			})
			return
		}
	}

	// Status change logic
	statusStr, hasStatus := input["status"].(string)
	if hasStatus && models.SkillStatus(statusStr) != skill.Status {
		status := models.SkillStatus(statusStr)
		if status == models.SkillStatusInProgress && skill.StartDate == nil {
			now := time.Now()
			update["startDate"] = now
		}
		if status == models.SkillStatusCompleted && skill.CompletionDate == nil {
			now := time.Now()
			update["completionDate"] = now
			update["progress"] = 100
		}
		if status != models.SkillStatusCompleted && skill.Status == models.SkillStatusCompleted {
			update["completionDate"] = nil
		}
	}

	for k, v := range input {
		if k == "name" {
			update[k] = strings.TrimSpace(v.(string))
		} else {
			update[k] = v
		}
	}

	_, err = collection.UpdateOne(r.Context(), bson.M{"_id": objID}, bson.M{"$set": update})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	collection.FindOne(r.Context(), bson.M{"_id": objID}).Decode(&skill)

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    skill,
	})
}

func DeleteSkill(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(r.URL.Path, "/")
	id := parts[len(parts)-1]
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	userID := r.Context().Value(auth.UserContextKey).(string)
	userObjID, _ := primitive.ObjectIDFromHex(userID)
	collection := database.GetCollection("skills")

	var skill models.Skill
	err = collection.FindOneAndDelete(r.Context(), bson.M{"_id": objID, "user": userObjID}).Decode(&skill)
	if err != nil {
		http.Error(w, "Skill not found", http.StatusNotFound)
		return
	}

	// Reorder remaining skills
	_, err = collection.UpdateMany(r.Context(),
		bson.M{
			"user":       userObjID,
			"category":   skill.Category,
			"orderIndex": bson.M{"$gt": skill.OrderIndex},
		},
		bson.M{"$inc": bson.M{"orderIndex": -1}},
	)
	if err != nil {
		// Log error but success for deletion
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Skill deleted successfully",
	})
}

func GetSkillStats(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(auth.UserContextKey).(string)
	userObjID, _ := primitive.ObjectIDFromHex(userID)
	collection := database.GetCollection("skills")

	cursor, err := collection.Find(r.Context(), bson.M{"user": userObjID})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer cursor.Close(r.Context())

	var skills []models.Skill
	if err = cursor.All(r.Context(), &skills); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	total := len(skills)
	completed := 0
	inProgress := 0
	upcoming := 0
	sumProgress := 0

	categoryCounts := make(map[string]int)

	for _, skill := range skills {
		if skill.Status == models.SkillStatusCompleted {
			completed++
		} else if skill.Status == models.SkillStatusInProgress {
			inProgress++
		} else {
			upcoming++
		}
		sumProgress += skill.Progress
		categoryCounts[skill.Category]++
	}

	completionRate := 0.0
	averageProgress := 0.0
	if total > 0 {
		completionRate = (float64(completed) / float64(total)) * 100
		averageProgress = float64(sumProgress) / float64(total)
	}

	stats := map[string]interface{}{
		"total":           total,
		"completed":       completed,
		"inProgress":      inProgress,
		"upcoming":        upcoming,
		"completionRate":  completionRate,
		"averageProgress": averageProgress,
		"categoryCounts":  categoryCounts,
		"statusDistribution": map[string]int{
			"completed":  completed,
			"inProgress": inProgress,
			"upcoming":   upcoming,
		},
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"stats":   stats,
	})
}
