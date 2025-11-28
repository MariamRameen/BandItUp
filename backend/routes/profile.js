const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth"); 
const { updateProfile, getProfile, changePassword } = require("../controllers/profileController");

const auth = require("../middleware/auth");


const multer = require("multer");
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) return cb(new Error("Invalid file type"), false);
    cb(null, true);
  }
});

router.post("/upload-avatar", authenticate, upload.single("avatar"), async (req, res) => {
  req.user.avatarUrl = `/uploads/${req.file.filename}`;
  await req.user.save();
  res.json({ avatarUrl: req.user.avatarUrl });
});

router.get("/me", auth, getProfile);
router.put("/update", auth, updateProfile);
router.put("/change-password", authenticate, changePassword); // NEW


module.exports = router;
