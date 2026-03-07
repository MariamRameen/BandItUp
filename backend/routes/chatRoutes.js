const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { chatHandler, getCostStats } = require("../controllers/chatController");


router.post("/message", auth, chatHandler);


router.get("/cost-stats", auth, getCostStats);

module.exports = router;