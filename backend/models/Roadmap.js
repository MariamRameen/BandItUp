const mongoose = require("mongoose");

/**
 * Roadmap - AI-generated path from current band to target band
 * Shows estimated weeks, milestones, and skill targets
 */

const MilestoneSchema = new mongoose.Schema({
  weekNumber: { type: Number, required: true },
  targetOverall: { type: Number, required: true },
  skillTargets: {
    listening: { type: Number },
    reading: { type: Number },
    writing: { type: Number },
    speaking: { type: Number },
  },
  keyFocus: [String],
  tasks: [String],  // Key tasks for this milestone
  isCompleted: { type: Boolean, default: false },
  actualBand: { type: Number },  // Actual score if mock test taken
  mockTestId: { type: mongoose.Schema.Types.ObjectId, ref: "MockTestResult" },
  completedAt: { type: Date },
}, { _id: true });

const RoadmapSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },

  // Band scores
  baselineBand: { type: Number, required: true },
  currentBand: { type: Number, required: true },
  targetBand: { type: Number, required: true },

  // Timeline
  estimatedWeeks: { type: Number, required: true },
  currentWeek: { type: Number, default: 1 },
  startDate: { type: Date, default: Date.now },
  estimatedEndDate: { type: Date },

  // Progress
  progressPercentage: { type: Number, default: 0 },
  bandImprovement: { type: Number, default: 0 },
  
  // Milestones
  milestones: [MilestoneSchema],

  // AI-generated insights
  overallStrategy: { type: String },
  keyRecommendations: [String],
  estimatedStudyHoursPerWeek: { type: Number, default: 10 },

  // Status
  status: {
    type: String,
    enum: ["active", "completed", "paused", "revised"],
    default: "active",
  },

  // History of revisions
  revisionHistory: [{
    revisedAt: Date,
    reason: String,
    previousTarget: Number,
    newTarget: Number,
  }],

}, { timestamps: true });

// Calculate progress when queried
RoadmapSchema.methods.calculateProgress = function() {
  const totalGap = this.targetBand - this.baselineBand;
  const achieved = this.currentBand - this.baselineBand;
  
  if (totalGap <= 0) return 100;
  
  this.bandImprovement = parseFloat(achieved.toFixed(1));
  this.progressPercentage = Math.min(100, Math.round((achieved / totalGap) * 100));
  
  return this.progressPercentage;
};

// Update current week based on date
RoadmapSchema.methods.updateCurrentWeek = function() {
  const now = new Date();
  const start = new Date(this.startDate);
  const diffTime = now - start;
  const diffWeeks = Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000)) + 1;
  
  this.currentWeek = Math.min(diffWeeks, this.estimatedWeeks);
  return this.currentWeek;
};

// Index for efficient queries
RoadmapSchema.index({ userId: 1 });

module.exports = mongoose.model("Roadmap", RoadmapSchema);
