package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type WorkingHours struct {
	ID            primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	User          primitive.ObjectID `bson:"user" json:"user"`
	Date          time.Time          `bson:"date" json:"date"`
	TargetHours   float64            `bson:"targetHours" json:"targetHours"`
	AchievedHours float64            `bson:"achievedHours" json:"achievedHours"`
	Category      string             `bson:"category" json:"category"`
	Notes         string             `bson:"notes,omitempty" json:"notes,omitempty"`
	Mood          string             `bson:"mood" json:"mood"`
	CreatedAt     time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt     time.Time          `bson:"updatedAt" json:"updatedAt"`
}

// Virtual properties logic (ProgressPercentage, Status) will be handled in the Controller/Service layer or a method.
func (w *WorkingHours) ProgressPercentage() float64 {
	if w.TargetHours == 0 {
		return 0
	}
	return (w.AchievedHours / w.TargetHours) * 100
}

func (w *WorkingHours) Status() string {
	percentage := w.ProgressPercentage()
	if percentage >= 100 {
		return "Completed"
	}
	if percentage >= 75 {
		return "On Track"
	}
	if percentage >= 50 {
		return "In Progress"
	}
	return "Behind"
}
