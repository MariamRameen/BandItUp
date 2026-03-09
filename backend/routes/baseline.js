const express = require("express");
const multer  = require("multer");
const router  = express.Router();
const auth    = require("../middleware/auth");
const ctrl    = require("../controllers/baselineController");

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 15 * 1024 * 1024 }, 
}).fields([{ name: "speaking_audio", maxCount: 1 }]);


router.get("/audio", ctrl.getAudio);


router.use(auth);
router.get("/test",    ctrl.getTest);
router.get("/status",  ctrl.getStatus);
router.get("/result",  ctrl.getResult);
router.post("/submit", upload, ctrl.submitTest);

module.exports = router;