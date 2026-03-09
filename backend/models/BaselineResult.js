const mongoose = require("mongoose");

const SectionSchema = new mongoose.Schema({
  band:     Number,
  rawScore: Number,
  maxScore: Number,
  feedback: String,
  details:  mongoose.Schema.Types.Mixed,
}, { _id: false });

const BaselineResultSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  testId:   { type: mongoose.Schema.Types.ObjectId, ref: "BaselineTest", required: true },
  timeUsed: Number,

  listening: SectionSchema,
  reading:   SectionSchema,
  writing:   SectionSchema,
  speaking:  SectionSchema,

  overallBand: Number,
  skillLabel:  String,

  diagnosticReport: {
    strengths:        [String],
    weaknesses:       [String],
    advice:           [String],
    studyPlanSummary: String,
  },

  // Raw answers for review tab
  listeningAnswers: [{ questionNumber: Number, userAnswer: String, isCorrect: Boolean }],
  readingAnswers:   [{ questionNumber: Number, userAnswer: String, isCorrect: Boolean }],
  writingResponse:  String,
  speakingResult: {
    transcript:   String,
    azureScores:  mongoose.Schema.Types.Mixed,
    gptFeedback:  String,
  },

}, { timestamps: true });

module.exports = mongoose.model("BaselineResult", BaselineResultSchema);