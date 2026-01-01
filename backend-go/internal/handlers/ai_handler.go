package handlers

import (
	"encoding/json"
	"net/http"

	"service-exchange-backend-go/internal/auth"
	"service-exchange-backend-go/internal/services"
)

func GetInsights(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(auth.UserContextKey).(string)

	var input struct {
		DetailLevel string `json:"detailLevel"`
	}
	json.NewDecoder(r.Body).Decode(&input) // optional

	insights, err := services.GenerateInsights(r.Context(), userID, input.DetailLevel)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data": map[string]string{
			"insights": insights,
		},
	})
}

func GetRecommendations(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(auth.UserContextKey).(string)

	var input struct {
		FocusArea string `json:"focusArea"`
	}
	json.NewDecoder(r.Body).Decode(&input)

	recommendations, err := services.GetRecommendations(r.Context(), userID, input.FocusArea)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data": map[string]string{
			"recommendations": recommendations,
		},
	})
}

func QueryData(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(auth.UserContextKey).(string)

	var input struct {
		Question string `json:"question"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	answer, err := services.QueryUserData(r.Context(), userID, input.Question)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data": map[string]string{
			"answer": answer,
		},
	})
}

func Chat(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(auth.UserContextKey).(string)

	var input struct {
		Message string `json:"message"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Chat uses same logic as QueryUserData but format might differ slightly in response
	answer, err := services.QueryUserData(r.Context(), userID, input.Message)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data": map[string]string{
			"userMessage": input.Message,
			"aiResponse":  answer,
		},
	})
}

func GetScheduleSuggestions(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(auth.UserContextKey).(string)

	suggestions, err := services.GenerateScheduleSuggestions(r.Context(), userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data": map[string]string{
			"suggestions": suggestions,
		},
	})
}

func AnalyzeSkills(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(auth.UserContextKey).(string)

	analysis, err := services.AnalyzeSkillProgress(r.Context(), userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data": map[string]string{
			"analysis": analysis,
		},
	})
}

func GetWeeklyReport(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(auth.UserContextKey).(string)

	var input struct {
		StartDate string `json:"startDate"`
		EndDate   string `json:"endDate"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	report, err := services.GenerateWeeklyReport(r.Context(), userID, input.StartDate, input.EndDate)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data": map[string]string{
			"report": report,
		},
	})
}
