package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type User struct {
	ID                       primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Name                     string             `bson:"name" json:"name"`
	Email                    string             `bson:"email" json:"email"`
	PhoneNumber              string             `bson:"phoneNumber,omitempty" json:"phoneNumber,omitempty"`
	Password                 string             `bson:"password" json:"-"` // Don't return password in JSON
	IsEmailVerified          bool               `bson:"isEmailVerified" json:"isEmailVerified"`
	IsPhoneVerified          bool               `bson:"isPhoneVerified" json:"isPhoneVerified"`
	EmailVerificationToken   string             `bson:"emailVerificationToken,omitempty" json:"-"`
	EmailVerificationExpire  time.Time          `bson:"emailVerificationExpire,omitempty" json:"-"`
	ResetPasswordToken       string             `bson:"resetPasswordToken,omitempty" json:"-"`
	ResetPasswordExpire      time.Time          `bson:"resetPasswordExpire,omitempty" json:"-"`
	PhoneVerificationCode    string             `bson:"phoneVerificationCode,omitempty" json:"-"`
	PhoneVerificationExpire  time.Time          `bson:"phoneVerificationExpire,omitempty" json:"-"`
	CreatedAt                time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt                time.Time          `bson:"updatedAt" json:"updatedAt"`
}
