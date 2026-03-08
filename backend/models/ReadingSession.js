const mongoose = require('mongoose');

// Schema for individual questions
const questionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: [
      'multiple_choice',
      'multiple_choice_multiple',
      'matching_headings',
      'matching_information',
      'matching_features',
      'matching_sentence_endings',
      'sentence_completion',
      'summary_completion',
      'note_completion',
      'table_completion',
      'flow_chart_completion',
      'diagram_label_completion',
      'short_answer',
      'true_false_not_given',
      'yes_no_not_given',
    ],
    required: true,
  },
  questionText: {
    type: String,
    required: true,
  },
  instruction: {
    type: String,
  },
  options: [{
    type: String,
  }],
  correctAnswer: {
    type: mongoose.Schema.Types.Mixed, // String or [String] for multiple answers
    required: true,
  },
  paragraphRef: {
    type: String, // Reference to paragraph ID (e.g., "A", "B", "C")
  },
  explanation: {
    type: String,
  },
  userAnswer: {
    type: mongoose.Schema.Types.Mixed, // String or [String]
  },
  isCorrect: {
    type: Boolean,
  },
}, { _id: false });

// Schema for paragraphs
const paragraphSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
}, { _id: false });

// Schema for passage
const passageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  topic: {
    type: String,
    required: true,
  },
  wordCount: {
    type: Number,
    required: true,
  },
  paragraphs: [paragraphSchema],
  source: {
    type: String, // Optional attribution
  },
}, { _id: false });

// Schema for question type analysis
const questionTypeAnalysisSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
  },
  attempted: {
    type: Number,
    default: 0,
  },
  correct: {
    type: Number,
    default: 0,
  },
  accuracy: {
    type: Number,
    default: 0,
  },
}, { _id: false });

// Schema for feedback
const feedbackSchema = new mongoose.Schema({
  overallAnalysis: {
    type: String,
  },
  strengths: [{
    type: String,
  }],
  weaknesses: [{
    type: String,
  }],
  recommendedPractice: [{
    type: String,
  }],
  questionTypeAnalysis: [questionTypeAnalysisSchema],
}, { _id: false });

// Schema for AI usage tracking
const aiUsageSchema = new mongoose.Schema({
  promptTokens: {
    type: Number,
  },
  completionTokens: {
    type: Number,
  },
  totalTokens: {
    type: Number,
  },
  model: {
    type: String,
  },
}, { _id: false });

// Main ReadingSession schema
const readingSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  examType: {
    type: String,
    enum: ['Academic', 'General'],
    required: true,
  },
  difficulty: {
    type: String,
    enum: ['Band 5-6', 'Band 6-7', 'Band 7-8', 'Band 8-9'],
    default: 'Band 6-7',
  },
  passage: {
    type: passageSchema,
    required: true,
  },
  questions: {
    type: [questionSchema],
    required: true,
    validate: [
      {
        validator: function(v) {
          return v.length >= 1 && v.length <= 20;
        },
        message: 'Questions must be between 1 and 20',
      },
    ],
  },
  totalQuestions: {
    type: Number,
    required: true,
  },
  correctAnswers: {
    type: Number,
    default: 0,
  },
  score: {
    type: Number, // Percentage (0-100)
    default: 0,
  },
  bandScore: {
    type: Number, // IELTS band (4.0-9.0)
    min: 0,
    max: 9,
  },
  timeLimit: {
    type: Number, // in seconds (default 1200 = 20 min)
    required: true,
    default: 1200,
  },
  timeSpent: {
    type: Number, // in seconds
    default: 0,
  },
  status: {
    type: String,
    enum: ['in-progress', 'completed', 'abandoned'],
    default: 'in-progress',
  },
  feedback: feedbackSchema,
  aiUsage: aiUsageSchema,
  startedAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Indexes for efficient queries
readingSessionSchema.index({ userId: 1, createdAt: -1 });
readingSessionSchema.index({ userId: 1, status: 1 });
readingSessionSchema.index({ userId: 1, examType: 1 });

// Static method: Convert raw score to band score
readingSessionSchema.statics.calculateBandScore = function(correctAnswers, totalQuestions = 40) {
  // Normalize to 40-question scale if different
  const normalized = Math.round((correctAnswers / totalQuestions) * 40);
  
  // IELTS Reading band score conversion
  if (normalized >= 39) return 9.0;
  if (normalized >= 37) return 8.5;
  if (normalized >= 35) return 8.0;
  if (normalized >= 33) return 7.5;
  if (normalized >= 30) return 7.0;
  if (normalized >= 27) return 6.5;
  if (normalized >= 23) return 6.0;
  if (normalized >= 19) return 5.5;
  if (normalized >= 15) return 5.0;
  if (normalized >= 13) return 4.5;
  if (normalized >= 10) return 4.0;
  if (normalized >= 6) return 3.5;
  if (normalized >= 4) return 3.0;
  return 2.5;
};

// Instance method: Calculate and set scores
readingSessionSchema.methods.calculateScores = function() {
  const correctCount = this.questions.filter(q => q.isCorrect === true).length;
  this.correctAnswers = correctCount;
  this.score = Math.round((correctCount / this.totalQuestions) * 100);
  this.bandScore = this.constructor.calculateBandScore(correctCount, this.totalQuestions);
  return this;
};

// Instance method: Analyze question type performance
readingSessionSchema.methods.analyzeQuestionTypes = function() {
  const typeAnalysis = {};
  
  this.questions.forEach(q => {
    if (!typeAnalysis[q.type]) {
      typeAnalysis[q.type] = { type: q.type, attempted: 0, correct: 0 };
    }
    if (q.userAnswer !== undefined && q.userAnswer !== null && q.userAnswer !== '') {
      typeAnalysis[q.type].attempted++;
      if (q.isCorrect) {
        typeAnalysis[q.type].correct++;
      }
    }
  });
  
  // Calculate accuracy for each type
  Object.values(typeAnalysis).forEach(analysis => {
    analysis.accuracy = analysis.attempted > 0 
      ? Math.round((analysis.correct / analysis.attempted) * 100) 
      : 0;
  });
  
  return Object.values(typeAnalysis);
};

// Instance method: Check single answer
readingSessionSchema.methods.checkAnswer = function(questionId, userAnswer) {
  const question = this.questions.find(q => q.id === questionId);
  if (!question) return null;
  
  question.userAnswer = userAnswer;
  
  // Handle different answer formats
  const correct = question.correctAnswer;
  
  if (Array.isArray(correct)) {
    // Multiple correct answers (e.g., matching, multiple selection)
    if (Array.isArray(userAnswer)) {
      question.isCorrect = correct.length === userAnswer.length &&
        correct.every(ans => userAnswer.includes(ans));
    } else {
      question.isCorrect = false;
    }
  } else {
    // Single answer - case-insensitive comparison for text answers
    const normalizedUser = String(userAnswer).toLowerCase().trim();
    const normalizedCorrect = String(correct).toLowerCase().trim();
    question.isCorrect = normalizedUser === normalizedCorrect;
  }
  
  return question.isCorrect;
};

// Instance method: Check all answers
readingSessionSchema.methods.checkAllAnswers = function(answers) {
  // answers is an object: { questionId: userAnswer, ... }
  Object.entries(answers).forEach(([questionId, userAnswer]) => {
    this.checkAnswer(questionId, userAnswer);
  });
  
  this.calculateScores();
  return this;
};

// Static method: Get user statistics
readingSessionSchema.statics.getUserStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), status: 'completed' } },
    {
      $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        avgBandScore: { $avg: '$bandScore' },
        avgScore: { $avg: '$score' },
        avgTimeSpent: { $avg: '$timeSpent' },
        totalCorrect: { $sum: '$correctAnswers' },
        totalQuestions: { $sum: '$totalQuestions' },
        academicCount: {
          $sum: { $cond: [{ $eq: ['$examType', 'Academic'] }, 1, 0] },
        },
        generalCount: {
          $sum: { $cond: [{ $eq: ['$examType', 'General'] }, 1, 0] },
        },
      },
    },
  ]);
  
  if (stats.length === 0) {
    return {
      totalSessions: 0,
      avgBandScore: 0,
      avgScore: 0,
      avgTimeSpent: 0,
      overallAccuracy: 0,
      academicCount: 0,
      generalCount: 0,
    };
  }
  
  const result = stats[0];
  return {
    totalSessions: result.totalSessions,
    avgBandScore: Math.round(result.avgBandScore * 10) / 10,
    avgScore: Math.round(result.avgScore),
    avgTimeSpent: Math.round(result.avgTimeSpent),
    overallAccuracy: result.totalQuestions > 0 
      ? Math.round((result.totalCorrect / result.totalQuestions) * 100) 
      : 0,
    academicCount: result.academicCount,
    generalCount: result.generalCount,
  };
};

// Static method: Get recent progress
readingSessionSchema.statics.getRecentProgress = async function(userId, limit = 10) {
  return this.find({ userId, status: 'completed' })
    .sort({ completedAt: -1 })
    .limit(limit)
    .select('completedAt bandScore score examType difficulty passage.topic')
    .lean();
};

const ReadingSession = mongoose.model('ReadingSession', readingSessionSchema);

module.exports = ReadingSession;
