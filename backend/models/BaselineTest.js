const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
  questionNumber:  { type: Number, required: true },
  type:            { type: String, enum: ["multiple_choice", "form_completion", "true_false_ng"] },
  prompt:          { type: String, required: true },
  options:         [String],
  correctAnswer:   { type: String, required: true },
  acceptedAnswers: [String],
});

const BaselineTestSchema = new mongoose.Schema({
  version:  { type: Number, default: 1 },
  isActive: { type: Boolean, default: true },

  listening: {
    title:       String,
    audioBase64: String,   // MP3 stored at seed time, served via /api/baseline/audio
    timeLimit:   Number,
    questions:   [QuestionSchema],
  },

  reading: {
    title:     String,
    passage:   String,
    timeLimit: Number,
    questions: [QuestionSchema],
  },

  writing: {
    title:     String,
    prompt:    String,
    minWords:  Number,
    maxWords:  Number,
    timeLimit: Number,
  },

  speaking: {
    title:        String,
    question:     String,
    responseTime: Number,
    timeLimit:    Number,
  },

}, { timestamps: true });

module.exports = mongoose.model("BaselineTest", BaselineTestSchema);