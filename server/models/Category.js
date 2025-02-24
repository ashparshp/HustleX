// server/models/Category.js
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['working-hours', 'skills', 'schedule', 'timetable', 'goals'],
    default: 'working-hours'
  },
  color: {
    type: String,
    default: '#3498db' // Default blue color
  },
  icon: {
    type: String,
    default: 'circle' // Default icon name
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate categories of the same type for a user
categorySchema.index({ user: 1, name: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);