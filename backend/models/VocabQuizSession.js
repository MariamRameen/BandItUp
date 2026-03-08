const mongoose = require("mongoose");

const questionResultSchema = new mongoose.Schema(
  {
    wordId: { type: mongoose.Schema.Types.ObjectId, ref: "Word" },
    word: String,
    questionType: {
      type: String,
      enum: ["meaning_mcq", "collocation_mcq", "fill_blank_mcq", "written"],
    },
    isCorrect: Boolean,
    userAnswer: String,
    correctAnswer: String,
   
    aiEvaluation: {
      bandScore: Number,
      marks: Number,        
      feedback: String,     
      lowBandWords: [String],
      suggestions: [String],
    },
  },
  { _id: false }
);

const vocabQuizSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sessionId: { type: String, required: true, unique: true }, 
    bandLevel: { type: Number, required: true },
    topics: [String], 
    questions: [questionResultSchema],

    
    totalQuestions: { type: Number },
    correctAnswers: { type: Number },
    mcqScore: { type: Number },         
    writtenScore: { type: Number },     
    writtenBand: { type: Number },      
    quizBandScore: { type: Number },    
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

vocabQuizSessionSchema.index({ userId: 1, bandLevel: 1 });

module.exports = mongoose.model("VocabQuizSession", vocabQuizSessionSchema);