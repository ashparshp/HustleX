package services

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"service-exchange-backend-go/internal/database"
	"service-exchange-backend-go/internal/models"

	"github.com/google/generative-ai-go/genai"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
	"google.golang.org/api/option"
)

var genAIClient *genai.Client
var genAIModel *genai.GenerativeModel

func InitAI() {
	ctx := context.Background()
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		log.Println("⚠️ GEMINI_API_KEY is not set. AI features will fail.")
		return
	}

	client, err := genai.NewClient(ctx, option.WithAPIKey(apiKey))
	if err != nil {
		log.Printf("❌ Failed to create GenAI client: %v", err)
		return
	}
	genAIClient = client
	genAIModel = client.GenerativeModel("gemini-2.5-flash")
}

// UserData struct to hold aggregated data
type UserData struct {
	Schedules    []models.Schedule
	Skills       []models.Skill
	Timetables   []models.Timetable
	WorkingHours []models.WorkingHours
}

func fetchUserData(ctx context.Context, userID string, dateFilter bson.M) (*UserData, error) {
	userObjID, _ := primitive.ObjectIDFromHex(userID)

	// Schedules
	scheduleFilter := bson.M{"user": userObjID}
	if val, ok := dateFilter["date"]; ok {
		scheduleFilter["date"] = val
	}
	schedCursor, _ := database.GetCollection("schedules").Find(ctx, scheduleFilter, options.Find().SetSort(bson.M{"date": -1}))
	var schedules []models.Schedule
	schedCursor.All(ctx, &schedules)

	// Skills (usually all skills)
	skillsCursor, _ := database.GetCollection("skills").Find(ctx, bson.M{"user": userObjID})
	var skills []models.Skill
	skillsCursor.All(ctx, &skills)

	// Timetables
	ttCursor, _ := database.GetCollection("timetables").Find(ctx, bson.M{"user": userObjID})
	var timetables []models.Timetable
	ttCursor.All(ctx, &timetables)

	// WorkingHours
	whFilter := bson.M{"user": userObjID}
	if val, ok := dateFilter["date"]; ok {
		whFilter["date"] = val
	}
	whCursor, _ := database.GetCollection("workinghours").Find(ctx, whFilter, options.Find().SetSort(bson.M{"date": -1}))
	var workingHours []models.WorkingHours
	whCursor.All(ctx, &workingHours)

	return &UserData{
		Schedules:    schedules,
		Skills:       skills,
		Timetables:   timetables,
		WorkingHours: workingHours,
	}, nil
}

func formatUserDataForAI(data *UserData) string {
	var sb strings.Builder
	sb.WriteString("User's Productivity Data:\n\n")

	// Schedules
	if len(data.Schedules) > 0 {
		sb.WriteString("SCHEDULES:\n")
		for i, s := range data.Schedules {
			sb.WriteString(fmt.Sprintf("%d. Date: %s\n", i+1, s.Date.Format("2006-01-02")))
			sb.WriteString(fmt.Sprintf("   Day Type: %s\n", s.DayType))
			sb.WriteString(fmt.Sprintf("   Status: %s\n", s.Status))
			sb.WriteString(fmt.Sprintf("   Total Hours: %.2f\n", s.TotalHours))
			if len(s.Items) > 0 {
				sb.WriteString(fmt.Sprintf("   Tasks (%d):\n", len(s.Items)))
				for _, item := range s.Items {
					sb.WriteString(fmt.Sprintf("     - %s (%s-%s)\n", item.Title, item.StartTime, item.EndTime))
					sb.WriteString(fmt.Sprintf("       Category: %s, Priority: %s, Completed: %v\n", item.Category, item.Priority, item.Completed))
				}
			}
			sb.WriteString("\n")
		}
	}

	// Skills
	if len(data.Skills) > 0 {
		sb.WriteString("SKILLS:\n")
		for i, s := range data.Skills {
			sb.WriteString(fmt.Sprintf("%d. %s (%s)\n", i+1, s.Name, s.Category))
			sb.WriteString(fmt.Sprintf("   Status: %s, Progress: %d%%\n", s.Status, s.Progress))
			sb.WriteString(fmt.Sprintf("   Priority: %s\n", s.Priority))
		}
		sb.WriteString("\n")
	}

	// Timetables
	if len(data.Timetables) > 0 {
		sb.WriteString("TIMETABLES:\n")
		for i, t := range data.Timetables {
			sb.WriteString(fmt.Sprintf("%d. %s (Active: %v)\n", i+1, t.Name, t.IsActive))
			sb.WriteString(fmt.Sprintf("   Overall Completion: %.2f%%\n", t.CurrentWeek.OverallCompletionRate))
			if len(t.CurrentWeek.Activities) > 0 {
				sb.WriteString("   Activities:\n")
				for _, act := range t.CurrentWeek.Activities {
					sb.WriteString(fmt.Sprintf("     - %s: %.2f%%\n", act.Activity.Name, act.CompletionRate))
				}
			}
			sb.WriteString("\n")
		}
	}

	// Working Hours
	if len(data.WorkingHours) > 0 {
		sb.WriteString("WORKING HOURS:\n")
		for i, wh := range data.WorkingHours {
			sb.WriteString(fmt.Sprintf("%d. Date: %s\n", i+1, wh.Date.Format("2006-01-02")))
			sb.WriteString(fmt.Sprintf("   Category: %s\n", wh.Category))
			sb.WriteString(fmt.Sprintf("   Target: %.1fh, Achieved: %.1fh\n", wh.TargetHours, wh.AchievedHours))
			sb.WriteString(fmt.Sprintf("   Mood: %s\n", wh.Mood))
			if wh.Notes != "" {
				sb.WriteString(fmt.Sprintf("   Notes: %s\n", wh.Notes))
			}
			sb.WriteString("\n")
		}
	}

	return sb.String()
}

func GenerateContent(ctx context.Context, prompt string) (string, error) {
	if genAIModel == nil {
		return "", fmt.Errorf("AI model not initialized")
	}
	resp, err := genAIModel.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		return "", err
	}
	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("no content generated")
	}

	if txt, ok := resp.Candidates[0].Content.Parts[0].(genai.Text); ok {
		return string(txt), nil
	}
	return "", fmt.Errorf("unexpected content type")
}

func GenerateInsights(ctx context.Context, userID string, detailLevel string) (string, error) {
	data, _ := fetchUserData(ctx, userID, bson.M{})
	contextStr := formatUserDataForAI(data)

	instructions := ""
	if detailLevel == "brief" {
		instructions = `You are an expert productivity analyst.
    Format STRICTLY using ONLY these section headings (markdown level 3):
    ### Executive Summary
    ### Productivity Patterns
    ### Strengths
    ### Areas for Improvement
    ### Action Plan`
	} else {
		instructions = `Produce a structured productivity analysis.
    SECTION ORDER (markdown level 3 headings):
    ### Executive Summary
    ### Productivity Patterns
    ### Strengths`
	}

	prompt := fmt.Sprintf("%s\n\n%s", contextStr, instructions)
	return GenerateContent(ctx, prompt)
}

func QueryUserData(ctx context.Context, userID, question string) (string, error) {
	dateFilter := bson.M{}
	data, _ := fetchUserData(ctx, userID, dateFilter)
	contextStr := formatUserDataForAI(data)

	prompt := fmt.Sprintf("%s\n\nUser Question: %s\n\nAnswer based on data:", contextStr, question)
	return GenerateContent(ctx, prompt)
}

func GetRecommendations(ctx context.Context, userID, focusArea string) (string, error) {
	data, _ := fetchUserData(ctx, userID, bson.M{})
	contextStr := formatUserDataForAI(data)

	prompt := fmt.Sprintf("%s\n\nProvide 5-7 data-driven recommendations.", contextStr)
	if focusArea != "" {
		prompt += fmt.Sprintf(" Focus on: %s", focusArea)
	}
	return GenerateContent(ctx, prompt)
}

func GenerateScheduleSuggestions(ctx context.Context, userID string) (string, error) {
	data, _ := fetchUserData(ctx, userID, bson.M{})
	contextStr := formatUserDataForAI(data)
	prompt := fmt.Sprintf("%s\n\nSuggest 3 optimized schedule templates.", contextStr)
	return GenerateContent(ctx, prompt)
}

func AnalyzeSkills(ctx context.Context, userID string) (string, error) {
	data, _ := fetchUserData(ctx, userID, bson.M{})
	contextStr := formatUserDataForAI(data)
	prompt := fmt.Sprintf("%s\n\nAnalyze skill development progress.", contextStr)
	return GenerateContent(ctx, prompt)
}

func GenerateWeeklyReport(ctx context.Context, userID, startDate, endDate string) (string, error) {
	start, _ := time.Parse(time.RFC3339, startDate)
	end, _ := time.Parse(time.RFC3339, endDate)
	if start.IsZero() {
		start, _ = time.Parse("2006-01-02", startDate)
		end, _ = time.Parse("2006-01-02", endDate)
	}

	dateFilter := bson.M{"date": bson.M{"$gte": start, "$lte": end}}
	data, _ := fetchUserData(ctx, userID, dateFilter)
	contextStr := formatUserDataForAI(data)

	prompt := fmt.Sprintf("%s\n\nGenerate a weekly report for %s to %s.", contextStr, startDate, endDate)
	return GenerateContent(ctx, prompt)
}
