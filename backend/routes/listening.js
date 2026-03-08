const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  generateSession,
  submitSession,
  getProgress,
  getSession,
  generateMockTest,
  getHistory,
} = require("../controllers/listeningController");

router.use(auth);

router.post("/generate",            generateSession);   // start practice session
router.post("/submit/:sessionId",   submitSession);     // submit answers
router.get("/progress",             getProgress);       // progress dashboard
router.get("/session/:sessionId",   getSession);        // fetch single session
router.post("/mock/generate",       generateMockTest);  // generate full mock test
router.get("/history",              getHistory);        // session history

module.exports = router;