const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth"); // your existing auth middleware
const {
  getBandSummary,
  getWords,
  markWordSeen,
  getWordOfDay,
  markWordOfDayViewed,
  generateQuiz,
  submitQuiz,
  getProgress,
  getQuizHistory,
} = require("../controllers/vocabController");

// All vocab routes require authentication
router.use(auth);

router.get("/bands", getBandSummary);
router.get("/words", getWords);
router.post("/seen", markWordSeen);
router.get("/word-of-day", getWordOfDay);
router.post("/word-of-day/viewed", markWordOfDayViewed);
router.get("/quiz/generate", generateQuiz);
router.post("/quiz/submit", submitQuiz);
router.get("/progress", getProgress);
router.get("/quiz/history", getQuizHistory);

module.exports = router;