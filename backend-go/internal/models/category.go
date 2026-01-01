package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type CategoryType string

const (
	CategoryTypeWorkingHours CategoryType = "working-hours"
	CategoryTypeSkills       CategoryType = "skills"
	CategoryTypeSchedule     CategoryType = "schedule"
	CategoryTypeTimetable    CategoryType = "timetable"
)

type Category struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	User        primitive.ObjectID `bson:"user" json:"user"`
	Name        string             `bson:"name" json:"name"`
	Type        CategoryType       `bson:"type" json:"type"`
	Color       string             `bson:"color" json:"color"`
	Icon        string             `bson:"icon" json:"icon"`
	Description string             `bson:"description,omitempty" json:"description,omitempty"`
	CreatedAt   time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt   time.Time          `bson:"updatedAt" json:"updatedAt"`
}
