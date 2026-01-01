package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Activity struct {
	Name     string `bson:"name" json:"name"`
	Time     string `bson:"time" json:"time"`
	Category string `bson:"category" json:"category"`
}

type DailyProgress struct {
	ID             primitive.ObjectID `bson:"_id,omitempty" json:"_id"` // Added ID
	Activity       Activity           `bson:"activity" json:"activity"`
	DailyStatus    []bool             `bson:"dailyStatus" json:"dailyStatus"` // array of 7 bools
	CompletionRate float64            `bson:"completionRate" json:"completionRate"`
}

type Week struct {
	WeekStartDate         time.Time       `bson:"weekStartDate" json:"weekStartDate"`
	WeekEndDate           time.Time       `bson:"weekEndDate" json:"weekEndDate"`
	Activities            []DailyProgress `bson:"activities" json:"activities"`
	OverallCompletionRate float64         `bson:"overallCompletionRate" json:"overallCompletionRate"`
	Notes                 string          `bson:"notes,omitempty" json:"notes,omitempty"`
}

type Timetable struct {
	ID                primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	User              primitive.ObjectID `bson:"user" json:"user"`
	Name              string             `bson:"name" json:"name"`
	Description       string             `bson:"description,omitempty" json:"description,omitempty"`
	IsActive          bool               `bson:"isActive" json:"isActive"`
	CurrentWeek       Week               `bson:"currentWeek" json:"currentWeek"`
	History           []Week             `bson:"history" json:"history"`
	DefaultActivities []Activity         `bson:"defaultActivities" json:"defaultActivities"`
	CreatedAt         time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt         time.Time          `bson:"updatedAt" json:"updatedAt"`
}
