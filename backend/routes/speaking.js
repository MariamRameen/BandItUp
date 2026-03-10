const express = require("express");
const router  = express.Router();
const multer  = require("multer");
const auth    = require("../middleware/auth");
const ctrl    = require("../controllers/speakingController");

const upload = multer({ storage: multer.memoryStorage() }).fields([
  { name: "audio", maxCount: 1 },
]);

router.use(auth);

router.get("/prompt",       ctrl.getPrompt);
router.post("/evaluate",    upload, ctrl.evaluate);
router.get("/stats",        ctrl.getStats);
router.get("/history",      ctrl.getHistory);
router.get("/weekly-mock",  ctrl.getWeeklyMock);

module.exports = router;