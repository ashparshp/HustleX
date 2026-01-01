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

func calculateProgress(achieved, target float64) float64 {
	if target == 0 {
		return 0
	}
	return (achieved / target) * 100
}

func GetWorkingHours(w http.ResponseWriter, r *http.Request) {
	startDateStr := r.URL.Query().Get("startDate")
	endDateStr := r.URL.Query().Get("endDate")
	category := r.URL.Query().Get("category")

	userID := r.Context().Value(auth.UserContextKey).(string)
	userObjID, _ := primitive.ObjectIDFromHex(userID)

	query := bson.M{"user": userObjID}

	if startDateStr != "" && endDateStr != "" {
		startDate, _ := time.Parse(time.RFC3339, startDateStr)
		endDate, _ := time.Parse(time.RFC3339, endDateStr)
		if startDate.IsZero() {
			startDate, _ = time.Parse("2006-01-02", startDateStr)
			endDate, _ = time.Parse("2006-01-02", endDateStr)
		}

		if !startDate.IsZero() {
			query["date"] = bson.M{
				"$gte": startDate,
				"$lte": endDate,
			}
		}
	}

	if category != "" {
		query["category"] = category
	}

	collection := database.GetCollection("workinghours")
	opts := options.Find().SetSort(bson.M{"date": -1}).SetLimit(30)

	cursor, err := collection.Find(r.Context(), query, opts)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer cursor.Close(r.Context())

	var workingHours []models.WorkingHours
	if err = cursor.All(r.Context(), &workingHours); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	totalDays := len(workingHours)
	var totalTargetHours, totalAchievedHours, sumProgress float64
	categoryBreakdown := make(map[string]float64)
	moodDistribution := make(map[string]int)

	for _, wh := range workingHours {
		totalTargetHours += wh.TargetHours
		totalAchievedHours += wh.AchievedHours
		sumProgress += calculateProgress(wh.AchievedHours, wh.TargetHours)
		categoryBreakdown[wh.Category] += wh.AchievedHours
		moodDistribution[wh.Mood]++
	}

	averageCompletion := 0.0
	if totalDays > 0 {
		averageCompletion = sumProgress / float64(totalDays)
	}

	stats := map[string]interface{}{
		"totalDays":          totalDays,
		"totalTargetHours":   totalTargetHours,
		"totalAchievedHours": totalAchievedHours,
		"averageCompletion":  averageCompletion,
		"categoryBreakdown":  categoryBreakdown,
		"moodDistribution":   moodDistribution,
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":      true,
		"workingHours": workingHours,
		"stats":        stats,
	})
}

func AddWorkingHours(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Date          string  `json:"date"`
		TargetHours   float64 `json:"targetHours"`
		AchievedHours float64 `json:"achievedHours"`
		Category      string  `json:"category"`
		Notes         string  `json:"notes"`
		Mood          string  `json:"mood"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if input.Category == "" {
		http.Error(w, "Category is required", http.StatusBadRequest)
		return
	}

	userID := r.Context().Value(auth.UserContextKey).(string)
	userObjID, _ := primitive.ObjectIDFromHex(userID)

	date, _ := time.Parse(time.RFC3339, input.Date)
	if date.IsZero() {
		date, _ = time.Parse("2006-01-02", input.Date)
	}
	y, m, d := date.Date()
	startOfDay := time.Date(y, m, d, 0, 0, 0, 0, date.Location())

	collection := database.GetCollection("workinghours")

	var existingEntry models.WorkingHours
	err := collection.FindOne(r.Context(), bson.M{
		"user": userObjID,
		"date": bson.M{
			"$gte": startOfDay,
			"$lt":  startOfDay.Add(24 * time.Hour),
		},
	}).Decode(&existingEntry)

	if err == nil {
		update := bson.M{
			"$set": bson.M{
				"targetHours":   input.TargetHours,
				"achievedHours": input.AchievedHours,
				"category":      input.Category,
				"notes":         input.Notes,
				"mood":          input.Mood,
				"updatedAt":     time.Now(),
			},
		}
		collection.UpdateOne(r.Context(), bson.M{"_id": existingEntry.ID}, update)
		collection.FindOne(r.Context(), bson.M{"_id": existingEntry.ID}).Decode(&existingEntry)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": true,
			"data":    existingEntry,
		})
	} else {
		newEntry := models.WorkingHours{
			ID:            primitive.NewObjectID(),
			User:          userObjID,
			Date:          date,
			TargetHours:   input.TargetHours,
			AchievedHours: input.AchievedHours,
			Category:      input.Category,
			Notes:         input.Notes,
			Mood:          input.Mood,
			CreatedAt:     time.Now(),
			UpdatedAt:     time.Now(),
		}
		collection.InsertOne(r.Context(), newEntry)
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": true,
			"data":    newEntry,
		})
	}
}

func UpdateWorkingHours(w http.ResponseWriter, r *http.Request) {
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
	delete(input, "user")

	userID := r.Context().Value(auth.UserContextKey).(string)
	userObjID, _ := primitive.ObjectIDFromHex(userID)
	collection := database.GetCollection("workinghours")

	res, err := collection.UpdateOne(r.Context(),
		bson.M{"_id": objID, "user": userObjID},
		bson.M{"$set": input},
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if res.MatchedCount == 0 {
		http.Error(w, "Entry not found", http.StatusNotFound)
		return
	}

	var updated models.WorkingHours
	collection.FindOne(r.Context(), bson.M{"_id": objID}).Decode(&updated)

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    updated,
	})
}

func DeleteWorkingHours(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(r.URL.Path, "/")
	id := parts[len(parts)-1]
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	userID := r.Context().Value(auth.UserContextKey).(string)
	userObjID, _ := primitive.ObjectIDFromHex(userID)
	collection := database.GetCollection("workinghours")

	res, err := collection.DeleteOne(r.Context(), bson.M{"_id": objID, "user": userObjID})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if res.DeletedCount == 0 {
		http.Error(w, "Entry not found", http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Working hours entry deleted successfully",
	})
}

func GetWorkingHoursStats(w http.ResponseWriter, r *http.Request) {
	startDateStr := r.URL.Query().Get("startDate")
	endDateStr := r.URL.Query().Get("endDate")

	userID := r.Context().Value(auth.UserContextKey).(string)
	userObjID, _ := primitive.ObjectIDFromHex(userID)
	query := bson.M{"user": userObjID}

	if startDateStr != "" && endDateStr != "" {
		startDate, _ := time.Parse(time.RFC3339, startDateStr)
		endDate, _ := time.Parse(time.RFC3339, endDateStr)
		if startDate.IsZero() {
			startDate, _ = time.Parse("2006-01-02", startDateStr)
			endDate, _ = time.Parse("2006-01-02", endDateStr)
		}
		if !startDate.IsZero() {
			query["date"] = bson.M{"$gte": startDate, "$lte": endDate}
		}
	}

	collection := database.GetCollection("workinghours")
	cursor, err := collection.Find(r.Context(), query)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer cursor.Close(r.Context())

	var workingHours []models.WorkingHours
	if err = cursor.All(r.Context(), &workingHours); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	totalDays := len(workingHours)
	var totalTargetHours, totalAchievedHours, sumProgress float64
	categoryBreakdown := make(map[string]float64)
	moodDistribution := make(map[string]int)

	for _, wh := range workingHours {
		totalTargetHours += wh.TargetHours
		totalAchievedHours += wh.AchievedHours
		sumProgress += calculateProgress(wh.AchievedHours, wh.TargetHours)
		categoryBreakdown[wh.Category] += wh.AchievedHours
		moodDistribution[wh.Mood]++
	}

	averageCompletion := 0.0
	if totalDays > 0 {
		averageCompletion = sumProgress / float64(totalDays)
	}

	stats := map[string]interface{}{
		"totalDays":          totalDays,
		"totalTargetHours":   totalTargetHours,
		"totalAchievedHours": totalAchievedHours,
		"averageCompletion":  averageCompletion,
		"categoryBreakdown":  categoryBreakdown,
		"moodDistribution":   moodDistribution,
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"stats":   stats,
	})
}

func GetWorkingHoursCategories(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(auth.UserContextKey).(string)
	userObjID, _ := primitive.ObjectIDFromHex(userID)

	collection := database.GetCollection("workinghours")
	categoriesRaw, err := collection.Distinct(r.Context(), "category", bson.M{"user": userObjID})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	catCollection := database.GetCollection("categories")
	cursor, _ := catCollection.Find(r.Context(), bson.M{"user": userObjID, "type": "working-hours"})
	var userCats []models.Category
	cursor.All(r.Context(), &userCats)

	catSet := make(map[string]bool)
	for _, c := range categoriesRaw {
		if s, ok := c.(string); ok {
			catSet[s] = true
		}
	}
	for _, c := range userCats {
		catSet[c.Name] = true
	}

	allCats := []string{}
	for k := range catSet {
		allCats = append(allCats, k)
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":    true,
		"categories": allCats,
	})
}
