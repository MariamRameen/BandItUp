const mongoose = require("mongoose");

/**
 * Mock Test Result - Weekly assessment tests
 * Used to track progress from baseline
 */

const SectionResultSchema = new mongoose.Schema({
  band:     { type: Number, min: 0, max: 9 },
  rawScore: Number,
  maxScore: Number,
  feedback: String,
  details:  mongoose.Schema.Types.Mixed,
}, { _id: false });

const MockTestResultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  
  // Test info
  testNumber:   { type: Number, required: true },  // Sequential test number for user
  testType:     { type: String, enum: ["full", "listening", "reading", "writing", "speaking"], default: "full" },
  examType:     { type: String, enum: ["Academic", "General"], default: "Academic" },
  difficulty:   { type: Number, min: 4, max: 9 },  // Adaptive difficulty
  
  // Section scores
  listening: SectionResultSchema,
  reading:   SectionResultSchema,
  writing:   SectionResultSchema,
  speaking:  SectionResultSchema,
  
  // Overall results
  overallBand:   { type: Number, min: 0, max: 9 },
  skillLabel:    String,  // "Competent", "Modest", etc.
  
  // Comparison with baseline
  baselineBand:      Number,
  improvementFromBaseline: Number,
  
  // Comparison with previous mock
  previousMockBand:  Number,
  improvementFromPrevious: Number,
  
  // AI diagnostic
  diagnosticReport: {
    strengths:    [String],
    weaknesses:   [String],
    advice:       [String],
    focusAreas:   [String],
  },
  
  // Timing
  scheduledFor:     Date,
  startedAt:        Date,
  completedAt:      Date,
  timeUsed:         Number,  // Minutes taken
  
  // Status
  status: {
    type: String,
    enum: ["scheduled", "in-progress", "completed", "abandoned"],
    default: "scheduled",
  },
  
  // Session references for each section (if applicable)
  listeningSessionId: mongoose.Schema.Types.ObjectId,
  readingSessionId:   mongoose.Schema.Types.ObjectId,
  writingSessionId:   mongoose.Schema.Types.ObjectId,

}, { timestamps: true });

// Index for efficient queries
MockTestResultSchema.index({ userId: 1, testNumber: -1 });
MockTestResultSchema.index({ userId: 1, status: 1 });

// Helper to convert band to label
MockTestResultSchema.methods.getBandLabel = function() {
  const b = this.overallBand;
  if (b >= 8.5) return "Expert";
  if (b >= 7.5) return "Very Good";
  if (b >= 6.5) return "Competent";
  if (b >= 5.5) return "Modest";
  if (b >= 4.5) return "Limited";
  return "Beginner";
};

module.exports = mongoose.model("MockTestResult", MockTestResultSchema);
