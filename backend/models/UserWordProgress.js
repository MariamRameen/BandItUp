const mongoose = require("mongoose");

// Stores per-attempt quiz data for a specific word
const wordAttemptSchema = new mongoose.Schema(
  {
    quizSessionId: { type: String }, // groups attempts by quiz session
    correct: { type: Boolean, required: true },
    questionType: {
      type: String,
      enum: ["meaning_mcq", "collocation_mcq", "fill_blank_mcq", "written"],
    },
    attemptedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const userWordProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    wordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Word",
      required: true,
    },
    word: { type: String }, // denormalized for easy lookup

    // Flashcard tracking
    seenCount: { type: Number, default: 0 },
    lastReviewedDate: { type: Date },

    // Quiz tracking — array of all attempts for this word
    attempts: [wordAttemptSchema],

    // Mastery — only true when ALL attempts for this word are correct
    // AND the word has appeared in at least 2 quiz sessions
    masteryStatus: {
      type: String,
      enum: ["unseen", "learning", "mastered"],
      default: "unseen",
    },
    masteredAt: { type: Date },

    // Per-word accuracy computed field
    accuracy: { type: Number, default: 0 }, // 0–100

    // Word of the Day tracking — when this word was last shown as WoD
    wordOfDayShownAt: { type: Date, default: null },
    wordOfDayViewed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userWordProgressSchema.index({ userId: 1, wordId: 1 }, { unique: true });
userWordProgressSchema.index({ userId: 1, masteryStatus: 1 });

/**
 * Recalculates mastery after quiz attempts are added.
 * Rules:
 *  - Word must appear in >= 2 distinct quiz sessions
 *  - Accuracy across ALL attempts must be 100%
 *  - If accuracy drops below 100% later, mastery is revoked
 */
userWordProgressSchema.methods.recalculateMastery = function () {
  const attempts = this.attempts;
  if (!attempts || attempts.length === 0) {
    this.accuracy = 0;
    this.masteryStatus = this.seenCount > 0 ? "learning" : "unseen";
    return;
  }

  const totalAttempts = attempts.length;
  const correctAttempts = attempts.filter((a) => a.correct).length;
  this.accuracy = Math.round((correctAttempts / totalAttempts) * 100);

  // Count distinct quiz sessions this word appeared in
  const sessions = new Set(attempts.map((a) => a.quizSessionId).filter(Boolean));

  if (sessions.size >= 2 && this.accuracy === 100) {
    if (this.masteryStatus !== "mastered") {
      this.masteryStatus = "mastered";
      this.masteredAt = new Date();
    }
  } else {
   
    this.masteryStatus = "learning";
    this.masteredAt = undefined;
  }
};

module.exports = mongoose.model("UserWordProgress", userWordProgressSchema);
