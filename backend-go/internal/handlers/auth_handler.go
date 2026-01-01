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
	"go.mongodb.org/mongo-driver/mongo"
)

func sendTokenResponse(user *models.User, statusCode int, w http.ResponseWriter) {
	token, err := auth.GenerateToken(user.ID.Hex())
	if err != nil {
		http.Error(w, "Error generating token", http.StatusInternalServerError)
		return
	}

	cookie := http.Cookie{
		Name:     "token",
		Value:    token,
		Expires:  time.Now().Add(30 * 24 * time.Hour),
		HttpOnly: true,
	}
	http.SetCookie(w, &cookie)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"token":   token,
		"user":    user,
	})
}

func Register(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Name        string `json:"name"`
		Email       string `json:"email"`
		PhoneNumber string `json:"phoneNumber"`
		Password    string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	collection := database.GetCollection("users")
	var existingUser models.User
	err := collection.FindOne(r.Context(), bson.M{"email": input.Email}).Decode(&existingUser)
	if err == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Email is already registered",
		})
		return
	}

	hashedPassword, err := auth.HashPassword(input.Password)
	if err != nil {
		http.Error(w, "Error hashing password", http.StatusInternalServerError)
		return
	}

	user := models.User{
		ID:              primitive.NewObjectID(),
		Name:            input.Name,
		Email:           input.Email,
		PhoneNumber:     input.PhoneNumber,
		Password:        hashedPassword,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
		IsEmailVerified: false,
		IsPhoneVerified: false,
	}

	_, err = collection.InsertOne(r.Context(), user)
	if err != nil {
		http.Error(w, "Error creating user", http.StatusInternalServerError)
		return
	}

	sendTokenResponse(&user, http.StatusCreated, w)
}

func Login(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if input.Email == "" || input.Password == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Please provide email and password",
		})
		return
	}

	collection := database.GetCollection("users")
	var user models.User
	err := collection.FindOne(r.Context(), bson.M{"email": input.Email}).Decode(&user)
	if err == mongo.ErrNoDocuments {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Invalid credentials",
		})
		return
	} else if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if !auth.CheckPasswordHash(input.Password, user.Password) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Invalid credentials",
		})
		return
	}

	sendTokenResponse(&user, http.StatusOK, w)
}

func GetMe(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(auth.UserContextKey).(string)
	objID, _ := primitive.ObjectIDFromHex(userID)

	collection := database.GetCollection("users")
	var user models.User
	err := collection.FindOne(r.Context(), bson.M{"_id": objID}).Decode(&user)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    user,
	})
}

func Logout(w http.ResponseWriter, r *http.Request) {
	cookie := http.Cookie{
		Name:     "token",
		Value:    "none",
		Expires:  time.Now().Add(10 * time.Second),
		HttpOnly: true,
	}
	http.SetCookie(w, &cookie)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    map[string]string{},
	})
}

func UpdateDetails(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Name        string `json:"name"`
		PhoneNumber string `json:"phoneNumber"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	userID := r.Context().Value(auth.UserContextKey).(string)
	objID, _ := primitive.ObjectIDFromHex(userID)
	collection := database.GetCollection("users")

	update := bson.M{}
	if input.Name != "" {
		update["name"] = input.Name
	}

	if input.PhoneNumber != "" {
		var user models.User
		collection.FindOne(r.Context(), bson.M{"_id": objID}).Decode(&user)
		if user.PhoneNumber != input.PhoneNumber {
			update["phoneNumber"] = input.PhoneNumber
			update["isPhoneVerified"] = false
		}
	}

	if len(update) > 0 {
		_, err := collection.UpdateOne(r.Context(), bson.M{"_id": objID}, bson.M{"$set": update})
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	var updatedUser models.User
	collection.FindOne(r.Context(), bson.M{"_id": objID}).Decode(&updatedUser)

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    updatedUser,
	})
}

func UpdatePassword(w http.ResponseWriter, r *http.Request) {
	var input struct {
		CurrentPassword string `json:"currentPassword"`
		NewPassword     string `json:"newPassword"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if input.CurrentPassword == "" || input.NewPassword == "" {
		http.Error(w, "Please provide current and new passwords", http.StatusBadRequest)
		return
	}

	userID := r.Context().Value(auth.UserContextKey).(string)
	objID, _ := primitive.ObjectIDFromHex(userID)
	collection := database.GetCollection("users")

	var user models.User
	err := collection.FindOne(r.Context(), bson.M{"_id": objID}).Decode(&user)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	if !auth.CheckPasswordHash(input.CurrentPassword, user.Password) {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Current password is incorrect",
		})
		return
	}

	hashed, _ := auth.HashPassword(input.NewPassword)
	collection.UpdateOne(r.Context(), bson.M{"_id": objID}, bson.M{"$set": bson.M{"password": hashed}})

	sendTokenResponse(&user, http.StatusOK, w)
}

func ForgotPassword(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Email string `json:"email"`
	}
	json.NewDecoder(r.Body).Decode(&input)
	if input.Email == "" {
		http.Error(w, "Please provide your email", http.StatusBadRequest)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Password reset email sent (Stub)",
	})
}

func ResetPassword(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(r.URL.Path, "/")
	token := parts[len(parts)-1]

	if token == "" {
		http.Error(w, "Token required", http.StatusBadRequest)
		return
	}

	var input struct {
		Password string `json:"password"`
	}
	json.NewDecoder(r.Body).Decode(&input)

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Password updated (Stub)",
	})
}

func VerifyEmail(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html")
	w.Write([]byte(`<h1>Email Verified (Stub)</h1>`))
}

func VerifyPhone(w http.ResponseWriter, r *http.Request) {
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Phone verified (Stub)",
	})
}

func ResendVerification(w http.ResponseWriter, r *http.Request) {
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Verification email resent (Stub)",
	})
}

func ResendPhoneVerification(w http.ResponseWriter, r *http.Request) {
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Verification SMS resent (Stub)",
	})
}
