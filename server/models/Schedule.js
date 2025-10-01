const mongoose = require("mongoose");

const scheduleItemSchema = new mongoose.Schema({
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
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ["High", "Medium", "Low"],
    default: "Medium"
  },
  completed: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    trim: true
  }
});

const scheduleSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    dayType: {
      type: String,
      enum: ["Weekday", "Weekend"],
      required: true
    },
    items: [scheduleItemSchema],
    totalHours: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ["Planned", "In Progress", "Completed"],
      default: "Planned"
    }
  },
  { timestamps: true }
);


scheduleSchema.pre("save", function (next) {
  let total = 0;
  let completedItems = 0;

  this.items.forEach((item) => {

    const start = new Date(`2000-01-01T${item.startTime}`);
    const end = new Date(`2000-01-01T${item.endTime}`);
    total += (end - start) / (1000 * 60 * 60);


    if (item.completed) {
      completedItems++;
    }
  });

  this.totalHours = total;


  if (this.items.length > 0) {
    const completionPercentage = completedItems / this.items.length * 100;

    if (completionPercentage === 0) {
      this.status = "Planned";
    } else if (completionPercentage < 100) {
      this.status = "In Progress";
    } else {
      this.status = "Completed";
    }
  } else {
    this.status = "Planned";
  }

  next();
});


scheduleSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Schedule", scheduleSchema);