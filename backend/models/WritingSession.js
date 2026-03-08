const mongoose = require("mongoose");

const grammarErrorSchema = new mongoose.Schema({
  original: { type: String, required: true },
  correction: { type: String, required: true },
  explanation: { type: String },
  startIndex: { type: Number },
  endIndex: { type: Number },
}, { _id: false });

const vocabSuggestionSchema = new mongoose.Schema({
  original: { type: String, required: true },
  upgrade: { type: String, required: true },
  context: { type: String },
}, { _id: false });

const criterionSchema = new mongoose.Schema({
  band: { type: Number, min: 0, max: 9 },
  feedback: { type: String },
}, { _id: false });

const evaluationSchema = new mongoose.Schema({
  overallBand: { type: Number, min: 0, max: 9 },
  criteria: {
    taskResponse: criterionSchema,
    coherenceCohesion: criterionSchema,
    lexicalResource: criterionSchema,
    grammaticalRange: criterionSchema,
  },
  strengths: [String],
  improvements: [String],
  grammarErrors: [grammarErrorSchema],
  vocabularySuggestions: [vocabSuggestionSchema],
  wordCountAnalysis: { type: String },
}, { _id: false });

const writingSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    taskType: {
      type: Number,
      enum: [1, 2],
      required: true,
    },
    examType: {
      type: String,
      enum: ["Academic", "General"],
      required: true,
    },
    task: {
      prompt: { type: String, required: true },
      image: { type: String }, // URL for Task 1 charts/graphs
      essayType: { type: String }, // opinion, discussion, problem-solution, advantages-disadvantages, two-part
      topic: { type: String },
    },
    essay: {
      type: String,
      default: "",
    },
    wordCount: {
      type: Number,
      default: 0,
    },
    evaluation: evaluationSchema,
    timeSpent: {
      type: Number, // seconds
      default: 0,
    },
    timeLimit: {
      type: Number, // seconds (1200 for Task 1, 2400 for Task 2)
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "submitted", "evaluated"],
      default: "draft",
    },
    mode: {
      type: String,
      enum: ["practice", "test", "baseline", "mock"],
      default: "practice",
    },
    completedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Compound index for efficient queries
writingSessionSchema.index({ userId: 1, createdAt: -1 });
writingSessionSchema.index({ userId: 1, status: 1 });
writingSessionSchema.index({ userId: 1, taskType: 1 });

// Virtual for calculating if word count meets requirement
writingSessionSchema.virtual("meetsWordCount").get(function () {
  const minWords = this.taskType === 1 ? 150 : 250;
  return this.wordCount >= minWords;
});

// Method to calculate word count from essay
writingSessionSchema.methods.updateWordCount = function () {
  this.wordCount = this.essay.trim() ? this.essay.trim().split(/\s+/).length : 0;
  return this.wordCount;
};

// Static method to get user's writing statistics
writingSessionSchema.statics.getUserStats = async function (userId) {
  const stats = await this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), status: "evaluated" } },
    {
      $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        averageBand: { $avg: "$evaluation.overallBand" },
        bestBand: { $max: "$evaluation.overallBand" },
        totalWords: { $sum: "$wordCount" },
        task1Count: {
          $sum: { $cond: [{ $eq: ["$taskType", 1] }, 1, 0] },
        },
        task2Count: {
          $sum: { $cond: [{ $eq: ["$taskType", 2] }, 1, 0] },
        },
        lastPracticed: { $max: "$completedAt" },
      },
    },
  ]);

  if (stats.length === 0) {
    return {
      totalSessions: 0,
      averageBand: 0,
      bestBand: 0,
      totalWords: 0,
      task1Count: 0,
      task2Count: 0,
      lastPracticed: null,
    };
  }

  const result = stats[0];
  delete result._id;
  result.averageBand = Math.round(result.averageBand * 2) / 2; // Round to 0.5
  return result;
};

// Static method to get band history for progress tracking
writingSessionSchema.statics.getBandHistory = async function (userId, limit = 10) {
  return this.find(
    { userId, status: "evaluated" },
    { "evaluation.overallBand": 1, taskType: 1, completedAt: 1 }
  )
    .sort({ completedAt: -1 })
    .limit(limit)
    .lean();
};

module.exports = mongoose.model("WritingSession", writingSessionSchema);
