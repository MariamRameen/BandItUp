const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
  questionNumber: Number,
  type: {
    type: String,
    enum: ["multiple_choice", "form_completion", "matching"],
  },
  prompt: String,
  options: [String],           // for MCQ and matching
  matchingPairs: [             // for matching: left side items
    { label: String, options: [String] }
  ],
  correctAnswer: mongoose.Schema.Types.Mixed, // string or object for matching
  userAnswer:    mongoose.Schema.Types.Mixed,
  isCorrect:     { type: Boolean, default: false },
});

const ListeningSessionSchema = new mongoose.Schema(
  {
    userId:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sessionType:  { type: String, enum: ["practice", "mock"], default: "practice" },
    part:         { type: Number, enum: [1, 2, 3, 4], required: true },
    accent:       { type: String, enum: ["american", "australian", "british"], required: true },
    difficulty:   { type: String, enum: ["easy", "medium", "hard", "advanced"], required: true },

    // GPT-generated content
    passageText:  { type: String, required: true },
    passageTitle: { type: String, default: "" },
    topic:        { type: String, default: "" },
    questions:    [QuestionSchema],

    // Audio — stored as base64 data URL (Azure TTS output)
    audioUrl:       { type: String, default: null },  // base64 data:audio/mp3;base64,...
    audioDuration:  { type: Number, default: 0 },     // seconds
    replayCount:    { type: Number, default: 0 },
    maxReplays:     { type: Number, default: 2 },     // 0 for mock

    // Timing
    timeLimitSeconds: { type: Number, required: true },
    timeUsedSeconds:  { type: Number, default: 0 },
    autoSubmitted:    { type: Boolean, default: false },

    // Scoring
    totalQuestions: { type: Number, default: 5 },
    correctCount:   { type: Number, default: 0 },
    scaledScore:    { type: Number, default: 0 },  // (correct/total)*40
    bandEstimate:   { type: Number, default: 0 },

    // GPT feedback
    feedback: {
      strengths:        [String],
      weakQuestionTypes:[String],
      listeningIssues:  [String],
      improvementTips:  [String],
      rawText:          String,
    },

    // Session state (for localStorage sync recovery)
    completed:    { type: Boolean, default: false },
    submittedAt:  { type: Date, default: null },
  },
  { timestamps: true }
);

// Indexes
ListeningSessionSchema.index({ userId: 1, createdAt: -1 });
ListeningSessionSchema.index({ userId: 1, part: 1, sessionType: 1 });

module.exports = mongoose.model("ListeningSession", ListeningSessionSchema);