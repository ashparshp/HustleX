// server/models/ScheduleTemplate.js
const mongoose = require("mongoose");

const templateItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ["High", "Medium", "Low"],
    default: "Medium",
  },
  notes: {
    type: String,
    trim: true
  },
});

const scheduleTemplateSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    dayType: {
      type: String,
      enum: ["Weekday", "Weekend", "Any"],
      default: "Any",
    },
    description: {
      type: String,
      trim: true
    },
    items: [templateItemSchema],
    totalHours: {
      type: Number,
      default: 0,
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// Calculate total hours before saving
scheduleTemplateSchema.pre("save", function (next) {
  let total = 0;
  
  this.items.forEach((item) => {
    // Calculate hours
    const start = new Date(`2000-01-01T${item.startTime}`);
    const end = new Date(`2000-01-01T${item.endTime}`);
    total += (end - start) / (1000 * 60 * 60); // Convert to hours
  });
  
  this.totalHours = total;
  next();
});

// Compound index to prevent duplicate template names for the same user
scheduleTemplateSchema.index({ user: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("ScheduleTemplate", scheduleTemplateSchema);