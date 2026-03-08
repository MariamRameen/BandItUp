const express = require("express");
const multer  = require("multer");
const router  = express.Router();
const auth    = require("../middleware/auth");
const ctrl    = require("../controllers/baselineController");


const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 10 * 1024 * 1024 }, 
}).fields([
  { name: "speaking_1", maxCount: 1 },
  { name: "speaking_2", maxCount: 1 },
  { name: "speaking_3", maxCount: 1 }, 
]);

router.get("/audio", ctrl.getAudio);

router.use(auth);

router.get("/test",   ctrl.getTest);
router.get("/status",  ctrl.getStatus);
router.get("/result",  ctrl.getResult);


router.post("/submit", upload, ctrl.submitTest);

module.exports = router;