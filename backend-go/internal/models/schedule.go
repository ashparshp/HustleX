package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type ScheduleItem struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"` // Use ObjectID if needed, or just embed
	Title       string             `bson:"title" json:"title"`
	Description string             `bson:"description,omitempty" json:"description,omitempty"`
	StartTime   string             `bson:"startTime" json:"startTime"`
	EndTime     string             `bson:"endTime" json:"endTime"`
	Category    string             `bson:"category" json:"category"`
	Priority    string             `bson:"priority" json:"priority"`
	Completed   bool               `bson:"completed" json:"completed"`
	Notes       string             `bson:"notes,omitempty" json:"notes,omitempty"`
}

type ScheduleStatus string

const (
	ScheduleStatusPlanned    ScheduleStatus = "Planned"
	ScheduleStatusInProgress ScheduleStatus = "In Progress"
	ScheduleStatusCompleted  ScheduleStatus = "Completed"
)

type Schedule struct {
	ID         primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	User       primitive.ObjectID `bson:"user" json:"user"`
	Date       time.Time          `bson:"date" json:"date"`
	DayType    string             `bson:"dayType" json:"dayType"`
	Items      []ScheduleItem     `bson:"items" json:"items"`
	TotalHours float64            `bson:"totalHours" json:"totalHours"`
	Status     ScheduleStatus     `bson:"status" json:"status"`
	CreatedAt  time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt  time.Time          `bson:"updatedAt" json:"updatedAt"`
}
