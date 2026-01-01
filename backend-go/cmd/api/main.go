package main

import (
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"service-exchange-backend-go/internal/auth"
	"service-exchange-backend-go/internal/database"
	"service-exchange-backend-go/internal/handlers"
	"service-exchange-backend-go/internal/services"

	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load("../../.env"); err != nil {
		if err := godotenv.Load(".env"); err != nil {
			log.Println("No .env file found, using environment variables")
		}
	}

	database.ConnectDB()
	services.InitAI()

	mux := http.NewServeMux()

	// Auth Routes
	mux.HandleFunc("/api/auth/register", handlers.Register)
	mux.HandleFunc("/api/auth/login", handlers.Login)
	mux.HandleFunc("/api/auth/logout", handlers.Logout)
	mux.HandleFunc("/api/auth/me", auth.Protect(handlers.GetMe))
	mux.HandleFunc("/api/auth/update-details", auth.Protect(handlers.UpdateDetails))
	mux.HandleFunc("/api/auth/update-password", auth.Protect(handlers.UpdatePassword))
	mux.HandleFunc("/api/auth/forgot-password", handlers.ForgotPassword)
	// /api/auth/reset-password/:token handled via prefix or regex if using standard mux.
	// Since standard mux (pre 1.22) doesn't do wildcards easily, we handle specific cases or prefixes.
	// We'll use a prefix handler for reset-password and verify-email.
	mux.HandleFunc("/api/auth/reset-password/", handlers.ResetPassword)
	mux.HandleFunc("/api/auth/verify-email/", handlers.VerifyEmail)
	mux.HandleFunc("/api/auth/verify-phone", auth.Protect(handlers.VerifyPhone))
	mux.HandleFunc("/api/auth/resend-verification", auth.Protect(handlers.ResendVerification))
	mux.HandleFunc("/api/auth/resend-phone-verification", auth.Protect(handlers.ResendPhoneVerification))


	// Category Routes
	mux.HandleFunc("/api/categories", auth.Protect(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			handlers.GetCategories(w, r)
		case http.MethodPost:
			handlers.CreateCategory(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	}))
	mux.HandleFunc("/api/categories/defaults/", auth.Protect(handlers.GetDefaultCategories))
	mux.HandleFunc("/api/categories/", auth.Protect(func(w http.ResponseWriter, r *http.Request) {
		// defaults check if not caught above (Mux matches longest prefix)
		if strings.HasPrefix(r.URL.Path, "/api/categories/defaults/") {
			handlers.GetDefaultCategories(w, r)
			return
		}
		if r.Method == http.MethodPut {
			handlers.UpdateCategory(w, r)
		} else if r.Method == http.MethodDelete {
			handlers.DeleteCategory(w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	}))


	// Working Hours
	mux.HandleFunc("/api/working-hours", auth.Protect(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			handlers.GetWorkingHours(w, r)
		case http.MethodPost:
			handlers.AddWorkingHours(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	}))
	mux.HandleFunc("/api/working-hours/stats", auth.Protect(handlers.GetWorkingHoursStats))
	mux.HandleFunc("/api/working-hours/categories", auth.Protect(handlers.GetWorkingHoursCategories))

	mux.HandleFunc("/api/working-hours/", auth.Protect(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/stats") {
			handlers.GetWorkingHoursStats(w, r)
			return
		}
		if strings.HasSuffix(r.URL.Path, "/categories") {
			handlers.GetWorkingHoursCategories(w, r)
			return
		}

		if r.Method == http.MethodPut {
			handlers.UpdateWorkingHours(w, r)
		} else if r.Method == http.MethodDelete {
			handlers.DeleteWorkingHours(w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	}))

	// Skills
	mux.HandleFunc("/api/skills", auth.Protect(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			handlers.GetSkills(w, r)
		case http.MethodPost:
			handlers.AddSkill(w, r)
		case http.MethodPut:
			handlers.ReorderSkills(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	}))
	mux.HandleFunc("/api/skills/stats", auth.Protect(handlers.GetSkillStats))
	mux.HandleFunc("/api/skills/categories", auth.Protect(handlers.GetSkillCategories))
	mux.HandleFunc("/api/skills/", auth.Protect(func(w http.ResponseWriter, r *http.Request) {
		// Handlers above should catch exact matches, but suffix check here too if needed
		if strings.HasSuffix(r.URL.Path, "/stats") {
			handlers.GetSkillStats(w, r)
			return
		}
		if strings.HasSuffix(r.URL.Path, "/categories") {
			handlers.GetSkillCategories(w, r)
			return
		}

		if r.Method == http.MethodPut {
			handlers.UpdateSkill(w, r)
		} else if r.Method == http.MethodDelete {
			handlers.DeleteSkill(w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	}))

	// Schedules
	mux.HandleFunc("/api/schedules", auth.Protect(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			handlers.GetSchedules(w, r)
		case http.MethodPost:
			handlers.CreateSchedule(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	}))
	mux.HandleFunc("/api/schedules/categories", auth.Protect(handlers.GetScheduleCategories))

	mux.HandleFunc("/api/schedules/", auth.Protect(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/categories") {
			handlers.GetScheduleCategories(w, r)
			return
		}

		// Items
		// /api/schedules/:id/items
		// /api/schedules/:id/items/:itemId
		if strings.Contains(r.URL.Path, "/items") {
			if strings.HasSuffix(r.URL.Path, "/items") && r.Method == http.MethodPost {
				handlers.AddScheduleItem(w, r)
				return
			}
			// itemId in path
			if r.Method == http.MethodPut {
				handlers.UpdateScheduleItem(w, r)
				return
			}
			if r.Method == http.MethodDelete {
				handlers.DeleteScheduleItem(w, r)
				return
			}
		}

		if r.Method == http.MethodPut {
			handlers.UpdateSchedule(w, r)
		} else if r.Method == http.MethodDelete {
			handlers.DeleteSchedule(w, r)
		} else if r.Method == http.MethodGet {
			handlers.GetSchedule(w, r)
		}
	}))

	// Timetables
	mux.HandleFunc("/api/timetables", auth.Protect(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			handlers.GetTimetables(w, r)
		case http.MethodPost:
			handlers.CreateTimetable(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	}))
	mux.HandleFunc("/api/timetables/current-week", auth.Protect(handlers.GetCurrentWeek))
	mux.HandleFunc("/api/timetables/categories", auth.Protect(handlers.GetTimetableCategories))

	mux.HandleFunc("/api/timetables/", auth.Protect(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/current-week") {
			handlers.GetCurrentWeek(w, r)
			return
		}
		if strings.HasSuffix(r.URL.Path, "/stats") {
			handlers.GetTimetableStats(w, r)
			return
		}
		if strings.HasSuffix(r.URL.Path, "/new-week") {
			handlers.StartNewWeekHandler(w, r)
			return
		}
		if strings.HasSuffix(r.URL.Path, "/activities") {
			handlers.UpdateDefaultActivities(w, r)
			return
		}
		if strings.HasSuffix(r.URL.Path, "/toggle-status") {
			handlers.ToggleActivityStatus(w, r)
			return
		}
		if strings.HasSuffix(r.URL.Path, "/history") {
			handlers.GetHistory(w, r)
			return
		}
		if strings.HasSuffix(r.URL.Path, "/categories") {
			handlers.GetTimetableCategories(w, r)
			return
		}

		if r.Method == http.MethodGet {
			handlers.GetTimetable(w, r)
		} else if r.Method == http.MethodPut {
			handlers.UpdateTimetable(w, r)
		} else if r.Method == http.MethodDelete {
			handlers.DeleteTimetable(w, r)
		}
	}))


	// AI Routes
	mux.HandleFunc("/api/ai/insights", auth.Protect(handlers.GetInsights))
	mux.HandleFunc("/api/ai/recommendations", auth.Protect(handlers.GetRecommendations))
	mux.HandleFunc("/api/ai/query", auth.Protect(handlers.QueryData))
	mux.HandleFunc("/api/ai/chat", auth.Protect(handlers.Chat))
	mux.HandleFunc("/api/ai/schedule-suggestions", auth.Protect(handlers.GetScheduleSuggestions))
	mux.HandleFunc("/api/ai/skill-analysis", auth.Protect(handlers.AnalyzeSkills))
	mux.HandleFunc("/api/ai/weekly-report", auth.Protect(handlers.GetWeeklyReport))


	// Health Check
	mux.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"success","message":"API is running","serverTime":"` + time.Now().Format(time.RFC3339) + `"}`))
	})

	handler := CorsMiddleware(LoggerMiddleware(mux))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Server is running on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, handler))
}

func LoggerMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		log.Printf("%s %s", r.Method, r.URL.Path)
		next.ServeHTTP(w, r)
		log.Printf("Completed in %v", time.Since(start))
	})
}

func CorsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Allow origin logic
		origin := r.Header.Get("Origin")
		// Check allowed origins if strictly needed, or allow all/reflect
		allowedOrigins := strings.Split(os.Getenv("CLIENT_URLS"), ",")
		if len(allowedOrigins) == 0 {
			allowedOrigins = []string{"http://localhost:5173"}
		}

		allowed := false
		for _, o := range allowedOrigins {
			if o == origin {
				allowed = true
				break
			}
		}
		// Fallback for dev
		if origin == "http://localhost:5173" {
			allowed = true
		}

		if allowed {
			w.Header().Set("Access-Control-Allow-Origin", origin)
		}

		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Credentials", "true")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}
