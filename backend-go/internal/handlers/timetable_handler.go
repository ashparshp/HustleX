package handlers

import (
	"encoding/json"
	"math"
	"net/http"
	"strconv"
	"strings"
	"time"

	"service-exchange-backend-go/internal/auth"
	"service-exchange-backend-go/internal/database"
	"service-exchange-backend-go/internal/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

func startNewWeek(timetable *models.Timetable) {
	if len(timetable.CurrentWeek.Activities) > 0 {
		timetable.History = append(timetable.History, timetable.CurrentWeek)
	}

	now := time.Now()
	offset := int(now.Weekday())
	if offset == 0 {
		offset = 6
	} else {
		offset = offset - 1
	}

	monday := time.Date(now.Year(), now.Month(), now.Day()-offset, 0, 0, 0, 0, now.Location())
	sunday := monday.Add(6 * 24 * time.Hour).Add(23*time.Hour + 59*time.Minute + 59*time.Second)

	newActivities := []models.DailyProgress{}
	for _, act := range timetable.DefaultActivities {
		newActivities = append(newActivities, models.DailyProgress{
			ID:             primitive.NewObjectID(), // FIX: Generate ID
			Activity:       act,
			DailyStatus:    make([]bool, 7),
			CompletionRate: 0,
		})
	}

	timetable.CurrentWeek = models.Week{
		WeekStartDate:         monday,
		WeekEndDate:           sunday,
		Activities:            newActivities,
		OverallCompletionRate: 0,
	}
}

func calculateTimetableStats(timetable *models.Timetable) {
	if len(timetable.CurrentWeek.Activities) > 0 {
		totalPossible := float64(len(timetable.CurrentWeek.Activities) * 7)
		totalCompleted := 0.0

		for i := range timetable.CurrentWeek.Activities {
			completedDays := 0.0
			for _, status := range timetable.CurrentWeek.Activities[i].DailyStatus {
				if status {
					completedDays++
				}
			}
			timetable.CurrentWeek.Activities[i].CompletionRate = (completedDays / 7.0) * 100
			totalCompleted += completedDays
		}

		if totalPossible > 0 {
			timetable.CurrentWeek.OverallCompletionRate = (totalCompleted / totalPossible) * 100
		} else {
			timetable.CurrentWeek.OverallCompletionRate = 0
		}
	}
}

func setCacheHeaders(w http.ResponseWriter) {
	w.Header().Set("Cache-Control", "no-store, no-cache, must-revalidate, private")
	w.Header().Set("Pragma", "no-cache")
	w.Header().Set("Expires", "0")
}

func GetTimetables(w http.ResponseWriter, r *http.Request) {
	setCacheHeaders(w)
	userID := r.Context().Value(auth.UserContextKey).(string)
	userObjID, _ := primitive.ObjectIDFromHex(userID)

	collection := database.GetCollection("timetables")
	cursor, err := collection.Find(r.Context(), bson.M{"user": userObjID})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer cursor.Close(r.Context())

	var timetables []models.Timetable
	if err = cursor.All(r.Context(), &timetables); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	response := []map[string]interface{}{}
	for _, t := range timetables {
		response = append(response, map[string]interface{}{
			"id":              t.ID,
			"name":            t.Name,
			"description":     t.Description,
			"isActive":        t.IsActive,
			"createdAt":       t.CreatedAt,
			"updatedAt":       t.UpdatedAt,
			"activitiesCount": len(t.DefaultActivities),
			"completionRate":  t.CurrentWeek.OverallCompletionRate,
		})
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"count":   len(timetables),
		"data":    response,
	})
}

func CreateTimetable(w http.ResponseWriter, r *http.Request) {
	setCacheHeaders(w)
	var input struct {
		Name              string            `json:"name"`
		Description       string            `json:"description"`
		DefaultActivities []models.Activity `json:"defaultActivities"`
		IsActive          *bool             `json:"isActive"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if input.Name == "" {
		http.Error(w, "Name is required", http.StatusBadRequest)
		return
	}

	userID := r.Context().Value(auth.UserContextKey).(string)
	userObjID, _ := primitive.ObjectIDFromHex(userID)
	collection := database.GetCollection("timetables")

	count, _ := collection.CountDocuments(r.Context(), bson.M{
		"user": userObjID,
		"name": strings.TrimSpace(input.Name),
	})
	if count > 0 {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "A timetable with this name already exists",
		})
		return
	}

	isActive := true
	if input.IsActive != nil {
		isActive = *input.IsActive
	}

	timetable := models.Timetable{
		ID:                primitive.NewObjectID(),
		User:              userObjID,
		Name:              strings.TrimSpace(input.Name),
		Description:       input.Description,
		DefaultActivities: input.DefaultActivities,
		IsActive:          isActive,
		CreatedAt:         time.Now(),
		UpdatedAt:         time.Now(),
	}
	if timetable.DefaultActivities == nil {
		timetable.DefaultActivities = []models.Activity{}
	}

	startNewWeek(&timetable)
	calculateTimetableStats(&timetable)

	if timetable.IsActive {
		collection.UpdateMany(r.Context(),
			bson.M{"user": userObjID, "_id": bson.M{"$ne": timetable.ID}},
			bson.M{"$set": bson.M{"isActive": false}},
		)
	}

	_, err := collection.InsertOne(r.Context(), timetable)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    timetable,
	})
}

func GetTimetable(w http.ResponseWriter, r *http.Request) {
	setCacheHeaders(w)
	parts := strings.Split(r.URL.Path, "/")
	id := parts[len(parts)-1]
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	userID := r.Context().Value(auth.UserContextKey).(string)
	userObjID, _ := primitive.ObjectIDFromHex(userID)
	collection := database.GetCollection("timetables")

	var timetable models.Timetable
	err = collection.FindOne(r.Context(), bson.M{"_id": objID, "user": userObjID}).Decode(&timetable)
	if err != nil {
		http.Error(w, "Timetable not found", http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    timetable,
	})
}

func UpdateTimetable(w http.ResponseWriter, r *http.Request) {
	setCacheHeaders(w)
	parts := strings.Split(r.URL.Path, "/")
	id := parts[len(parts)-1]
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	var input struct {
		Name        *string `json:"name"`
		Description *string `json:"description"`
		IsActive    *bool   `json:"isActive"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	userID := r.Context().Value(auth.UserContextKey).(string)
	userObjID, _ := primitive.ObjectIDFromHex(userID)
	collection := database.GetCollection("timetables")

	var timetable models.Timetable
	err = collection.FindOne(r.Context(), bson.M{"_id": objID, "user": userObjID}).Decode(&timetable)
	if err != nil {
		http.Error(w, "Timetable not found", http.StatusNotFound)
		return
	}

	update := bson.M{"updatedAt": time.Now()}

	if input.Name != nil && *input.Name != timetable.Name {
		count, _ := collection.CountDocuments(r.Context(), bson.M{
			"user": userObjID,
			"name": strings.TrimSpace(*input.Name),
			"_id":  bson.M{"$ne": objID},
		})
		if count > 0 {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success": false,
				"message": "A timetable with this name already exists",
			})
			return
		}
		update["name"] = strings.TrimSpace(*input.Name)
	}

	if input.Description != nil {
		update["description"] = *input.Description
	}

	if input.IsActive != nil {
		update["isActive"] = *input.IsActive
		if *input.IsActive {
			collection.UpdateMany(r.Context(),
				bson.M{"user": userObjID, "_id": bson.M{"$ne": objID}},
				bson.M{"$set": bson.M{"isActive": false}},
			)
		}
	}

	_, err = collection.UpdateOne(r.Context(), bson.M{"_id": objID}, bson.M{"$set": update})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	collection.FindOne(r.Context(), bson.M{"_id": objID}).Decode(&timetable)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    timetable,
	})
}

func DeleteTimetable(w http.ResponseWriter, r *http.Request) {
	setCacheHeaders(w)
	parts := strings.Split(r.URL.Path, "/")
	id := parts[len(parts)-1]
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	userID := r.Context().Value(auth.UserContextKey).(string)
	userObjID, _ := primitive.ObjectIDFromHex(userID)
	collection := database.GetCollection("timetables")

	count, _ := collection.CountDocuments(r.Context(), bson.M{"user": userObjID})
	if count <= 1 {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Cannot delete the only timetable. Create another one first.",
		})
		return
	}

	var timetable models.Timetable
	err = collection.FindOne(r.Context(), bson.M{"_id": objID, "user": userObjID}).Decode(&timetable)
	if err != nil {
		http.Error(w, "Timetable not found", http.StatusNotFound)
		return
	}

	if timetable.IsActive {
		var another models.Timetable
		err := collection.FindOne(r.Context(), bson.M{
			"user": userObjID,
			"_id":  bson.M{"$ne": objID},
		}).Decode(&another)
		if err == nil {
			collection.UpdateOne(r.Context(), bson.M{"_id": another.ID}, bson.M{"$set": bson.M{"isActive": true}})
		}
	}

	collection.DeleteOne(r.Context(), bson.M{"_id": objID})

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Timetable deleted successfully",
	})
}

func GetCurrentWeek(w http.ResponseWriter, r *http.Request) {
	setCacheHeaders(w)
	userID := r.Context().Value(auth.UserContextKey).(string)
	userObjID, _ := primitive.ObjectIDFromHex(userID)
	collection := database.GetCollection("timetables")

	var timetable models.Timetable
	var err error

	parts := strings.Split(r.URL.Path, "/")
	// /api/timetables/<id>/current-week -> len 5
	// /api/timetables/current-week -> len 4

	if len(parts) >= 5 {
		id := parts[len(parts)-2]
		objID, _ := primitive.ObjectIDFromHex(id)
		err = collection.FindOne(r.Context(), bson.M{"_id": objID, "user": userObjID}).Decode(&timetable)
	} else {
		err = collection.FindOne(r.Context(), bson.M{"user": userObjID, "isActive": true}).Decode(&timetable)
		if err == mongo.ErrNoDocuments {
			err = collection.FindOne(r.Context(), bson.M{"user": userObjID}).Decode(&timetable)
			if err == mongo.ErrNoDocuments {
				timetable = models.Timetable{
					ID: primitive.NewObjectID(),
					User: userObjID,
					Name: "Default Timetable",
					DefaultActivities: []models.Activity{
						{Name: "DS & Algo", Time: "18:00-00:00", Category: "Core"},
						{Name: "Backend", Time: "10:00-12:00", Category: "Backend"},
					},
					IsActive: true,
					CreatedAt: time.Now(),
					UpdatedAt: time.Now(),
				}
				startNewWeek(&timetable)
				collection.InsertOne(r.Context(), timetable)
				err = nil
			} else {
				collection.UpdateOne(r.Context(), bson.M{"_id": timetable.ID}, bson.M{"$set": bson.M{"isActive": true}})
				timetable.IsActive = true
			}
		}
	}

	if err != nil {
		http.Error(w, "Timetable not found", http.StatusNotFound)
		return
	}

	now := time.Now()
	if !timetable.CurrentWeek.WeekEndDate.IsZero() && now.After(timetable.CurrentWeek.WeekEndDate) {
		startNewWeek(&timetable)
		calculateTimetableStats(&timetable)
		timetable.UpdatedAt = time.Now()
		collection.UpdateOne(r.Context(), bson.M{"_id": timetable.ID}, bson.M{"$set": timetable})
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":       true,
		"timetableId":   timetable.ID,
		"timetableName": timetable.Name,
		"data":          timetable.CurrentWeek,
	})
}

func ToggleActivityStatus(w http.ResponseWriter, r *http.Request) {
	setCacheHeaders(w)
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) < 3 {
		http.Error(w, "Invalid URL", http.StatusBadRequest)
		return
	}
	id := parts[len(parts)-2]
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	var input struct {
		ActivityID string `json:"activityId"`
		DayIndex   int    `json:"dayIndex"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if input.DayIndex < 0 || input.DayIndex > 6 {
		http.Error(w, "Day index must be between 0 and 6", http.StatusBadRequest)
		return
	}

	userID := r.Context().Value(auth.UserContextKey).(string)
	userObjID, _ := primitive.ObjectIDFromHex(userID)
	collection := database.GetCollection("timetables")

	var timetable models.Timetable
	err = collection.FindOne(r.Context(), bson.M{"_id": objID, "user": userObjID}).Decode(&timetable)
	if err != nil {
		http.Error(w, "Timetable not found", http.StatusNotFound)
		return
	}

	found := false
	for i, activity := range timetable.CurrentWeek.Activities {
		if activity.ID.Hex() == input.ActivityID {
			timetable.CurrentWeek.Activities[i].DailyStatus[input.DayIndex] = !timetable.CurrentWeek.Activities[i].DailyStatus[input.DayIndex]
			found = true
			break
		}
	}

	if !found {
		http.Error(w, "Activity not found", http.StatusNotFound)
		return
	}

	calculateTimetableStats(&timetable)
	timetable.UpdatedAt = time.Now()

	_, err = collection.UpdateOne(r.Context(), bson.M{"_id": objID}, bson.M{"$set": timetable})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    timetable.CurrentWeek,
	})
}

func UpdateDefaultActivities(w http.ResponseWriter, r *http.Request) {
	setCacheHeaders(w)
	parts := strings.Split(r.URL.Path, "/")
	id := parts[len(parts)-2]
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	var input struct {
		Activities []models.Activity `json:"activities"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	userID := r.Context().Value(auth.UserContextKey).(string)
	userObjID, _ := primitive.ObjectIDFromHex(userID)
	collection := database.GetCollection("timetables")

	var timetable models.Timetable
	err = collection.FindOne(r.Context(), bson.M{"_id": objID, "user": userObjID}).Decode(&timetable)
	if err != nil {
		http.Error(w, "Timetable not found", http.StatusNotFound)
		return
	}

	timetable.DefaultActivities = input.Activities

	newCurrentActivities := []models.DailyProgress{}
	for _, newAct := range input.Activities {
		var matched *models.DailyProgress
		for _, oldAct := range timetable.CurrentWeek.Activities {
			if oldAct.Activity.Name == newAct.Name &&
			   oldAct.Activity.Time == newAct.Time &&
			   oldAct.Activity.Category == newAct.Category {
				matched = &oldAct
				break
			}
		}

		dp := models.DailyProgress{
			ID: primitive.NewObjectID(), // Ensure ID
			Activity: newAct,
			DailyStatus: make([]bool, 7),
			CompletionRate: 0,
		}
		if matched != nil {
			dp.ID = matched.ID // Preserve ID if matched? Or generate new? Node code tries to match status.
			// If we preserve ID, toggle status works.
			dp.DailyStatus = matched.DailyStatus
			dp.CompletionRate = matched.CompletionRate
		}
		newCurrentActivities = append(newCurrentActivities, dp)
	}
	timetable.CurrentWeek.Activities = newCurrentActivities
	calculateTimetableStats(&timetable)
	timetable.UpdatedAt = time.Now()

	collection.UpdateOne(r.Context(), bson.M{"_id": objID}, bson.M{"$set": timetable})

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data": map[string]interface{}{
			"defaultActivities": timetable.DefaultActivities,
			"currentWeek":       timetable.CurrentWeek,
		},
	})
}

func GetTimetableStats(w http.ResponseWriter, r *http.Request) {
	setCacheHeaders(w)
	parts := strings.Split(r.URL.Path, "/")
	id := parts[len(parts)-2]
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	userID := r.Context().Value(auth.UserContextKey).(string)
	userObjID, _ := primitive.ObjectIDFromHex(userID)
	collection := database.GetCollection("timetables")

	var timetable models.Timetable
	err = collection.FindOne(r.Context(), bson.M{"_id": objID, "user": userObjID}).Decode(&timetable)
	if err != nil {
		http.Error(w, "Timetable not found", http.StatusNotFound)
		return
	}

	currentWeekStats := map[string]interface{}{
		"completionRate": timetable.CurrentWeek.OverallCompletionRate,
		"byCategory":     make(map[string]map[string]interface{}),
	}

	byCategory := currentWeekStats["byCategory"].(map[string]map[string]interface{})

	for _, act := range timetable.CurrentWeek.Activities {
		cat := act.Activity.Category
		if _, ok := byCategory[cat]; !ok {
			byCategory[cat] = map[string]interface{}{
				"total":     0.0,
				"completed": 0.0,
			}
		}

		completedCount := 0.0
		for _, status := range act.DailyStatus {
			if status {
				completedCount++
			}
		}

		byCategory[cat]["total"] = byCategory[cat]["total"].(float64) + 7.0
		byCategory[cat]["completed"] = byCategory[cat]["completed"].(float64) + completedCount
	}

	for _, v := range byCategory {
		total := v["total"].(float64)
		completed := v["completed"].(float64)
		if total > 0 {
			v["completionRate"] = (completed / total) * 100
		} else {
			v["completionRate"] = 0.0
		}
	}

	allWeeks := append(timetable.History, timetable.CurrentWeek)
	totalSum := 0.0
	for _, w := range allWeeks {
		totalSum += w.OverallCompletionRate
	}

	averageCompletionRate := 0.0
	if len(allWeeks) > 0 {
		averageCompletionRate = totalSum / float64(len(allWeeks))
	}

	bestRate := -1.0
	worstRate := 101.0
	var bestWeek, worstWeek *models.Week

	for i := range allWeeks {
		w := allWeeks[i]
		if w.OverallCompletionRate > bestRate {
			bestRate = w.OverallCompletionRate
			bestWeek = &w
		}
		if w.OverallCompletionRate < worstRate {
			worstRate = w.OverallCompletionRate
			worstWeek = &w
		}
	}

	overallStats := map[string]interface{}{
		"totalWeeks":            len(allWeeks),
		"averageCompletionRate": averageCompletionRate,
		"bestWeek":              nil,
		"worstWeek":             nil,
	}
	if bestWeek != nil {
		overallStats["bestWeek"] = map[string]interface{}{
			"weekStartDate": bestWeek.WeekStartDate,
			"completionRate": bestWeek.OverallCompletionRate,
		}
	}
	if worstWeek != nil {
		overallStats["worstWeek"] = map[string]interface{}{
			"weekStartDate": worstWeek.WeekStartDate,
			"completionRate": worstWeek.OverallCompletionRate,
		}
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data": map[string]interface{}{
			"currentWeek": currentWeekStats,
			"overall":     overallStats,
		},
	})
}

func StartNewWeekHandler(w http.ResponseWriter, r *http.Request) {
	setCacheHeaders(w)
	parts := strings.Split(r.URL.Path, "/")
	id := parts[len(parts)-2]
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	userID := r.Context().Value(auth.UserContextKey).(string)
	userObjID, _ := primitive.ObjectIDFromHex(userID)
	collection := database.GetCollection("timetables")

	var timetable models.Timetable
	err = collection.FindOne(r.Context(), bson.M{"_id": objID, "user": userObjID}).Decode(&timetable)
	if err != nil {
		http.Error(w, "Timetable not found", http.StatusNotFound)
		return
	}

	startNewWeek(&timetable)
	collection.UpdateOne(r.Context(), bson.M{"_id": objID}, bson.M{"$set": timetable})

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "New week started successfully",
		"data":    timetable.CurrentWeek,
	})
}

func GetTimetableCategories(w http.ResponseWriter, r *http.Request) {
	setCacheHeaders(w)
	userID := r.Context().Value(auth.UserContextKey).(string)
	userObjID, _ := primitive.ObjectIDFromHex(userID)
	collection := database.GetCollection("timetables")

	cursor, err := collection.Find(r.Context(), bson.M{"user": userObjID})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer cursor.Close(r.Context())

	var timetables []models.Timetable
	if err = cursor.All(r.Context(), &timetables); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	categorySet := make(map[string]bool)
	for _, t := range timetables {
		for _, act := range t.DefaultActivities {
			categorySet[act.Category] = true
		}
	}

	catCollection := database.GetCollection("categories")
	catCursor, _ := catCollection.Find(r.Context(), bson.M{"user": userObjID, "type": "timetable"})
	var userCats []models.Category
	if catCursor != nil {
		catCursor.All(r.Context(), &userCats)
		for _, c := range userCats {
			categorySet[c.Name] = true
		}
	}

	categories := []string{}
	for k := range categorySet {
		categories = append(categories, k)
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":    true,
		"categories": categories,
	})
}

func GetHistory(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(r.URL.Path, "/")
	id := parts[len(parts)-2]
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	pageStr := r.URL.Query().Get("page")
	limitStr := r.URL.Query().Get("limit")
	page := 1
	limit := 10
	if pageStr != "" {
		page, _ = strconv.Atoi(pageStr)
	}
	if limitStr != "" {
		limit, _ = strconv.Atoi(limitStr)
	}

	userID := r.Context().Value(auth.UserContextKey).(string)
	userObjID, _ := primitive.ObjectIDFromHex(userID)
	collection := database.GetCollection("timetables")

	var timetable models.Timetable
	err = collection.FindOne(r.Context(), bson.M{"_id": objID, "user": userObjID}).Decode(&timetable)
	if err != nil {
		http.Error(w, "Timetable not found", http.StatusNotFound)
		return
	}

	totalWeeks := len(timetable.History)
	totalPages := int(math.Ceil(float64(totalWeeks) / float64(limit)))

	start := (page - 1) * limit
	end := start + limit
	if start > totalWeeks {
		start = totalWeeks
	}
	if end > totalWeeks {
		end = totalWeeks
	}

	history := timetable.History[start:end]

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":    true,
		"history":    history,
		"currentPage": page,
		"totalPages": totalPages,
		"totalWeeks": totalWeeks,
	})
}
