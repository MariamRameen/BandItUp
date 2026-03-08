const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
  questionNumber:  { type: Number, required: true },
  type:            { type: String, enum: ["multiple_choice", "form_completion", "true_false_ng"] },
  prompt:          { type: String, required: true },
  options:         [String],
  correctAnswer:   { type: String, required: true },
  acceptedAnswers: [String],
});

const SpeakingPromptSchema = new mongoose.Schema({
  promptNumber: Number,
  type:         { type: String, enum: ["part1", "part2"] },
  title:        String,
  question:     String,
  prepTime:     Number,
  responseTime: Number,
  guidance:     String,
});

const BaselineTestSchema = new mongoose.Schema({
  version:  { type: Number, default: 1 },
  isActive: { type: Boolean, default: true },

  listening: {
    title:        String,
    topic:        String,
    passageText:  String,
    audioBase64:  String,   // generated once at seed time, stored permanently
    audioDuration: Number,
    timeLimit:    Number,
    questions:    [QuestionSchema],
  },

  reading: {
    title:     String,
    passage:   String,
    timeLimit: Number,
    questions: [QuestionSchema],
  },

  writing: {
    title:           String,
    timeLimit:       Number,
    prompt:          String,
    minWords:        Number,
    maxWords:        Number,
    gradingCriteria: mongoose.Schema.Types.Mixed,
  },

  speaking: {
    title:     String,
    timeLimit: Number,
    prompts:   [SpeakingPromptSchema],
  },
}, { timestamps: true });

module.exports = mongoose.model("BaselineTest", BaselineTestSchema);