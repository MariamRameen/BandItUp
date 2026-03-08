const mongoose = require("mongoose");

const SectionResultSchema = new mongoose.Schema({
  band:     Number,
  rawScore: Number,
  maxScore: Number,
  feedback: String,
  details:  mongoose.Schema.Types.Mixed,
});

const BaselineResultSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  testId:      { type: mongoose.Schema.Types.ObjectId, ref: "BaselineTest", required: true },
  completedAt: { type: Date, default: Date.now },
  timeUsed:    Number,

  listening: SectionResultSchema,
  reading:   SectionResultSchema,
  writing:   SectionResultSchema,
  speaking:  SectionResultSchema,

  overallBand:  Number,
  skillLabel:   String,

  diagnosticReport: {
    strengths:        [String],
    weaknesses:       [String],
    advice:           [String],
    studyPlanSummary: String,
  },

  listeningAnswers: [{ questionNumber: Number, userAnswer: String, isCorrect: Boolean }],
  readingAnswers:   [{ questionNumber: Number, userAnswer: String, isCorrect: Boolean }],
  writingResponse:  String,
  speakingResults:  [{
    promptNumber: Number,
    azureScores:  mongoose.Schema.Types.Mixed,
    transcript:   String,
    gptFeedback:  String,
    band:         Number,
  }],
}, { timestamps: true });

module.exports = mongoose.model("BaselineResult", BaselineResultSchema);