package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type ResourceType string

const (
	ResourceTypeCourse        ResourceType = "course"
	ResourceTypeDocumentation ResourceType = "documentation"
	ResourceTypeTutorial      ResourceType = "tutorial"
	ResourceTypeVideo         ResourceType = "video"
	ResourceTypeBook          ResourceType = "book"
	ResourceTypeOther         ResourceType = "other"
)

type Resource struct {
	Title string       `bson:"title" json:"title"`
	URL   string       `bson:"url" json:"url"`
	Type  ResourceType `bson:"type" json:"type"`
}

type SkillStatus string

const (
	SkillStatusUpcoming   SkillStatus = "upcoming"
	SkillStatusInProgress SkillStatus = "in-progress"
	SkillStatusCompleted  SkillStatus = "completed"
)

type SkillPriority string

const (
	SkillPriorityHigh   SkillPriority = "high"
	SkillPriorityMedium SkillPriority = "medium"
	SkillPriorityLow    SkillPriority = "low"
)

type Skill struct {
	ID             primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	User           primitive.ObjectID `bson:"user" json:"user"`
	Category       string             `bson:"category" json:"category"`
	Name           string             `bson:"name" json:"name"`
	Status         SkillStatus        `bson:"status" json:"status"`
	StartDate      *time.Time         `bson:"startDate,omitempty" json:"startDate,omitempty"`
	CompletionDate *time.Time         `bson:"completionDate,omitempty" json:"completionDate,omitempty"`
	Progress       int                `bson:"progress" json:"progress"`
	Description    string             `bson:"description,omitempty" json:"description,omitempty"`
	Resources      []Resource         `bson:"resources" json:"resources"`
	Priority       SkillPriority      `bson:"priority" json:"priority"`
	OrderIndex     int                `bson:"orderIndex" json:"orderIndex"`
	CreatedAt      time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt      time.Time          `bson:"updatedAt" json:"updatedAt"`
}
