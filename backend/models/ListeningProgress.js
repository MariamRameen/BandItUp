const mongoose = require("mongoose");

// Rolling window entry for adaptive difficulty
const RollingEntrySchema = new mongoose.Schema({
  sessionId:    { type: mongoose.Schema.Types.ObjectId, ref: "ListeningSession" },
  score:        Number,   // 0–1 ratio (correct/total)
  bandEstimate: Number,
  difficulty:   String,
  createdAt:    { type: Date, default: Date.now },
}, { _id: false });

// Per-part adaptive state
const PartStateSchema = new mongoose.Schema({
  part:             { type: Number, enum: [1, 2, 3, 4] },
  currentDifficulty:{ type: String, enum: ["easy", "medium", "hard", "advanced"], default: "easy" },
  totalSessions:    { type: Number, default: 0 },
  rollingWindow:    [RollingEntrySchema],   // last 5 sessions only
  avgScore:         { type: Number, default: 0 },   // rolling avg (0–1)
  avgBand:          { type: Number, default: 0 },
}, { _id: false });

// Weakness tracking
const WeaknessSchema = new mongoose.Schema({
  type:        String,   // e.g. "number_recognition", "distractor_confusion"
  label:       String,   // human readable
  hitCount:    { type: Number, default: 1 },
  lastSeenAt:  { type: Date, default: Date.now },
}, { _id: false });

const ListeningProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // Overall stats
    overallBand:      { type: Number, default: 0 },
    totalSessions:    { type: Number, default: 0 },
    totalMockTests:   { type: Number, default: 0 },
    overallAccuracy:  { type: Number, default: 0 },  // 0–100 %

    // Per-part state (parts 1–4)
    partStates: [PartStateSchema],

    // Weakness profile — top weaknesses tracked across all sessions
    weaknesses: [WeaknessSchema],

    // Skill level label for motivation layer
    skillLabel: {
      type: String,
      enum: ["Beginner", "Elementary", "Intermediate", "Upper-Intermediate", "Advanced"],
      default: "Beginner",
    },

    // Weekly mock test tracking
    firstPracticeAt:  { type: Date, default: null },
    lastMockAt:       { type: Date, default: null },
    nextMockDue:      { type: Date, default: null },
    mockAvailable:    { type: Boolean, default: false },

    // Recent session IDs (last 10 for progress chart)
    recentSessions: [{ type: mongoose.Schema.Types.ObjectId, ref: "ListeningSession" }],
  },
  { timestamps: true }
);

ListeningProgressSchema.index({ userId: 1 });

module.exports = mongoose.model("ListeningProgress", ListeningProgressSchema);