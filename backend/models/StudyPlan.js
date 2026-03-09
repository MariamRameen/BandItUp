const mongoose = require("mongoose");

/**
 * Study Plan - AI-generated personalized learning schedule
 * Generated from baseline results, adapts based on progress
 */

const DailyTaskSchema = new mongoose.Schema({
  taskId:       { type: String, required: true },  // Unique ID for the task
  skill:        { type: String, enum: ["listening", "reading", "writing", "speaking", "vocabulary"], required: true },
  taskType:     { type: String, required: true },  // e.g., "practice", "quiz", "review", "mock"
  title:        { type: String, required: true },
  description:  String,
  duration:     { type: Number, default: 15 },      // Minutes
  difficulty:   { type: Number, min: 4, max: 9 },   // Target band level
  isCompleted:  { type: Boolean, default: false },
  completedAt:  Date,
  sessionId:    mongoose.Schema.Types.ObjectId,     // Reference to completed session
}, { _id: false });

const WeeklyGoalSchema = new mongoose.Schema({
  skill:          { type: String, required: true },
  targetSessions: { type: Number, default: 3 },
  completedSessions: { type: Number, default: 0 },
  focusAreas:     [String],  // e.g., ["sentence completion", "paraphrasing"]
}, { _id: false });

const StudyPlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,  // One active plan per user
  },

  // Target & baseline info
  targetBand:   { type: Number, min: 4, max: 9, required: true },
  baselineBand: { type: Number, min: 1, max: 9 },
  baselineScores: {
    listening: Number,
    reading:   Number,
    writing:   Number,
    speaking:  Number,
  },

  // Current week data
  weekNumber:     { type: Number, default: 1 },
  weekStartDate:  { type: Date, default: Date.now },
  
  // Daily tasks for the week (indexed by day: 0=Mon, 1=Tue, etc.)
  dailyTasks: {
    type: Map,
    of: [DailyTaskSchema],
    default: {},
  },

  // Weekly goals per skill
  weeklyGoals: [WeeklyGoalSchema],

  // Streak tracking
  currentStreak:    { type: Number, default: 0 },
  longestStreak:    { type: Number, default: 0 },
  lastActivityDate: Date,

  // AI-generated insights
  weeklyFocus:      String,  // "This week focuses on Reading speed and Listening accuracy"
  aiRecommendations: [String],
  
  // Progress tracking
  totalTasksCompleted: { type: Number, default: 0 },
  totalMinutesPracticed: { type: Number, default: 0 },

  // Plan status
  status: {
    type: String,
    enum: ["active", "paused", "completed"],
    default: "active",
  },

}, { timestamps: true });

// Index for efficient weekly queries
StudyPlanSchema.index({ userId: 1, weekStartDate: -1 });

module.exports = mongoose.model("StudyPlan", StudyPlanSchema);
