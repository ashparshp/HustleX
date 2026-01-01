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

func calculateScheduleStats(schedule *models.Schedule) {
	var totalHours float64
	completedItems := 0

	for _, item := range schedule.Items {
		start, _ := time.Parse("15:04", item.StartTime)
		end, _ := time.Parse("15:04", item.EndTime)

		diff := end.Sub(start).Hours()
		if diff < 0 {
			diff += 24
		}
		totalHours += diff

		if item.Completed {
			completedItems++
		}
	}

	schedule.TotalHours = totalHours

	if len(schedule.Items) > 0 {
		completionPercentage := (float64(completedItems) / float64(len(schedule.Items))) * 100
		if completionPercentage == 0 {
			schedule.Status = models.ScheduleStatusPlanned
		} else if completionPercentage < 100 {
			schedule.Status = models.ScheduleStatusInProgress
		} else {
			schedule.Status = models.ScheduleStatusCompleted
		}
	} else {
		schedule.Status = models.ScheduleStatusPlanned
	}
}

func GetSchedules(w http.ResponseWriter, r *http.Request) {
	startDateStr := r.URL.Query().Get("startDate")
	endDateStr := r.URL.Query().Get("endDate")
	status := r.URL.Query().Get("status")

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
	if status != "" {
		query["status"] = status
	}

	collection := database.GetCollection("schedules")
	opts := options.Find().SetSort(bson.M{"date": 1})
	cursor, err := collection.Find(r.Context(), query, opts)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer cursor.Close(r.Context())

	var schedules []models.Schedule
	if err = cursor.All(r.Context(), &schedules); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"count":   len(schedules),
		"data":    schedules,
	})
}

func CreateSchedule(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Date  string                `json:"date"`
		Items []models.ScheduleItem `json:"items"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	userID := r.Context().Value(auth.UserContextKey).(string)
	userObjID, _ := primitive.ObjectIDFromHex(userID)

	date, _ := time.Parse(time.RFC3339, input.Date)
	if date.IsZero() {
		date, _ = time.Parse("2006-01-02", input.Date)
	}
	y, m, d := date.Date()
	scheduleDate := time.Date(y, m, d, 0, 0, 0, 0, date.Location())

	collection := database.GetCollection("schedules")
	count, _ := collection.CountDocuments(r.Context(), bson.M{
		"user": userObjID,
		"date": scheduleDate,
	})
	if count > 0 {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Schedule already exists for this date",
		})
		return
	}

	dayType := "Weekday"
	if scheduleDate.Weekday() == time.Saturday || scheduleDate.Weekday() == time.Sunday {
		dayType = "Weekend"
	}

	schedule := models.Schedule{
		ID:        primitive.NewObjectID(),
		User:      userObjID,
		Date:      scheduleDate,
		DayType:   dayType,
		Items:     input.Items,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	for i := range schedule.Items {
		if schedule.Items[i].ID.IsZero() {
			schedule.Items[i].ID = primitive.NewObjectID()
		}
	}

	calculateScheduleStats(&schedule)

	_, err := collection.InsertOne(r.Context(), schedule)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    schedule,
	})
}

func UpdateSchedule(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(r.URL.Path, "/")
	id := parts[len(parts)-1]
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	var input struct {
		Date    string                `json:"date"`
		Items   []models.ScheduleItem `json:"items"`
		DayType string                `json:"dayType"`
		Status  string                `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	userID := r.Context().Value(auth.UserContextKey).(string)
	userObjID, _ := primitive.ObjectIDFromHex(userID)
	collection := database.GetCollection("schedules")

	var schedule models.Schedule
	err = collection.FindOne(r.Context(), bson.M{"_id": objID, "user": userObjID}).Decode(&schedule)
	if err != nil {
		http.Error(w, "Schedule not found", http.StatusNotFound)
		return
	}

	if input.Date != "" {
		date, _ := time.Parse(time.RFC3339, input.Date)
		if date.IsZero() {
			date, _ = time.Parse("2006-01-02", input.Date)
		}
		schedule.Date = date
	}
	if input.Items != nil {
		schedule.Items = input.Items
		for i := range schedule.Items {
			if schedule.Items[i].ID.IsZero() {
				schedule.Items[i].ID = primitive.NewObjectID()
			}
		}
	}
	if input.DayType != "" {
		schedule.DayType = input.DayType
	}
	if input.Status != "" {
		schedule.Status = models.ScheduleStatus(input.Status)
	}

	calculateScheduleStats(&schedule)
	schedule.UpdatedAt = time.Now()

	_, err = collection.UpdateOne(r.Context(), bson.M{"_id": objID}, bson.M{"$set": schedule})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    schedule,
	})
}

func DeleteSchedule(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(r.URL.Path, "/")
	id := parts[len(parts)-1]
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	userID := r.Context().Value(auth.UserContextKey).(string)
	userObjID, _ := primitive.ObjectIDFromHex(userID)
	collection := database.GetCollection("schedules")

	res, err := collection.DeleteOne(r.Context(), bson.M{"_id": objID, "user": userObjID})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if res.DeletedCount == 0 {
		http.Error(w, "Schedule not found", http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Schedule deleted successfully",
	})
}

func AddScheduleItem(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) < 2 {
		http.Error(w, "Invalid URL", http.StatusBadRequest)
		return
	}
	id := parts[len(parts)-2]
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	var item models.ScheduleItem
	if err := json.NewDecoder(r.Body).Decode(&item); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if item.Title == "" || item.StartTime == "" || item.EndTime == "" || item.Category == "" {
		http.Error(w, "Missing required fields", http.StatusBadRequest)
		return
	}
	item.ID = primitive.NewObjectID()

	userID := r.Context().Value(auth.UserContextKey).(string)
	userObjID, _ := primitive.ObjectIDFromHex(userID)
	collection := database.GetCollection("schedules")

	var schedule models.Schedule
	err = collection.FindOne(r.Context(), bson.M{"_id": objID, "user": userObjID}).Decode(&schedule)
	if err != nil {
		http.Error(w, "Schedule not found", http.StatusNotFound)
		return
	}

	schedule.Items = append(schedule.Items, item)
	calculateScheduleStats(&schedule)
	schedule.UpdatedAt = time.Now()

	collection.UpdateOne(r.Context(), bson.M{"_id": objID}, bson.M{"$set": schedule})

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    schedule,
	})
}

func DeleteScheduleItem(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(r.URL.Path, "/")
	itemId := parts[len(parts)-1]
	scheduleId := parts[len(parts)-3]

	scheduleObjID, _ := primitive.ObjectIDFromHex(scheduleId)
	itemObjID, _ := primitive.ObjectIDFromHex(itemId)

	userID := r.Context().Value(auth.UserContextKey).(string)
	userObjID, _ := primitive.ObjectIDFromHex(userID)
	collection := database.GetCollection("schedules")

	var schedule models.Schedule
	err := collection.FindOne(r.Context(), bson.M{"_id": scheduleObjID, "user": userObjID}).Decode(&schedule)
	if err != nil {
		http.Error(w, "Schedule not found", http.StatusNotFound)
		return
	}

	newItems := []models.ScheduleItem{}
	for _, item := range schedule.Items {
		if item.ID != itemObjID {
			newItems = append(newItems, item)
		}
	}
	schedule.Items = newItems
	calculateScheduleStats(&schedule)
	schedule.UpdatedAt = time.Now()

	collection.UpdateOne(r.Context(), bson.M{"_id": scheduleObjID}, bson.M{"$set": schedule})

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    schedule,
	})
}

func GetSchedule(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(r.URL.Path, "/")
	id := parts[len(parts)-1]
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	userID := r.Context().Value(auth.UserContextKey).(string)
	userObjID, _ := primitive.ObjectIDFromHex(userID)
	collection := database.GetCollection("schedules")

	var schedule models.Schedule
	err = collection.FindOne(r.Context(), bson.M{"_id": objID, "user": userObjID}).Decode(&schedule)
	if err != nil {
		http.Error(w, "Schedule not found", http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    schedule,
	})
}

func UpdateScheduleItem(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(r.URL.Path, "/")
	// .../schedules/:id/items/:itemId
	if len(parts) < 3 {
		http.Error(w, "Invalid URL", http.StatusBadRequest)
		return
	}
	itemId := parts[len(parts)-1]
	scheduleId := parts[len(parts)-3]

	scheduleObjID, _ := primitive.ObjectIDFromHex(scheduleId)
	itemObjID, _ := primitive.ObjectIDFromHex(itemId)

	var input map[string]interface{}
	json.NewDecoder(r.Body).Decode(&input)

	userID := r.Context().Value(auth.UserContextKey).(string)
	userObjID, _ := primitive.ObjectIDFromHex(userID)
	collection := database.GetCollection("schedules")

	var schedule models.Schedule
	err := collection.FindOne(r.Context(), bson.M{"_id": scheduleObjID, "user": userObjID}).Decode(&schedule)
	if err != nil {
		http.Error(w, "Schedule not found", http.StatusNotFound)
		return
	}

	found := false
	for i, item := range schedule.Items {
		if item.ID == itemObjID {
			if val, ok := input["title"]; ok { schedule.Items[i].Title = val.(string) }
			if val, ok := input["description"]; ok { schedule.Items[i].Description = val.(string) }
			if val, ok := input["startTime"]; ok { schedule.Items[i].StartTime = val.(string) }
			if val, ok := input["endTime"]; ok { schedule.Items[i].EndTime = val.(string) }
			if val, ok := input["category"]; ok { schedule.Items[i].Category = val.(string) }
			if val, ok := input["priority"]; ok { schedule.Items[i].Priority = val.(string) }
			if val, ok := input["completed"]; ok { schedule.Items[i].Completed = val.(bool) }
			if val, ok := input["notes"]; ok { schedule.Items[i].Notes = val.(string) }

			found = true
			break
		}
	}

	if !found {
		http.Error(w, "Item not found", http.StatusNotFound)
		return
	}

	calculateScheduleStats(&schedule)
	collection.UpdateOne(r.Context(), bson.M{"_id": scheduleObjID}, bson.M{"$set": schedule})

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    schedule,
	})
}

func GetScheduleCategories(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(auth.UserContextKey).(string)
	userObjID, _ := primitive.ObjectIDFromHex(userID)
	collection := database.GetCollection("schedules")

	cursor, _ := collection.Find(r.Context(), bson.M{"user": userObjID})
	var schedules []models.Schedule
	cursor.All(r.Context(), &schedules)

	catSet := make(map[string]bool)
	for _, s := range schedules {
		for _, i := range s.Items {
			catSet[i.Category] = true
		}
	}

	catCollection := database.GetCollection("categories")
	catCursor, _ := catCollection.Find(r.Context(), bson.M{"user": userObjID, "type": "schedule"})
	var userCats []models.Category
	catCursor.All(r.Context(), &userCats)
	for _, c := range userCats {
		catSet[c.Name] = true
	}

	cats := []string{}
	for k := range catSet {
		cats = append(cats, k)
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"categories": cats,
	})
}
