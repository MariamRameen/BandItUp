const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { updateProfile, getProfile, changePassword, completeBaseline } = require("../controllers/profileController");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const User = require("../models/User");
const Report = require("../models/Report");

const uploadsDir = path.join(__dirname, "../uploads/avatars");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `avatar-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed (JPEG, PNG, GIF, etc.)"), false);
    }
  },
});

router.post("/upload-avatar", auth, upload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: "No file uploaded" });
    }
    const avatarUrl = `/avatars/${req.file.filename}`;
    await User.findByIdAndUpdate(req.user.id, { avatarUrl });
    res.json({ msg: "Avatar uploaded successfully", avatarUrl });
  } catch (err) {
    console.error("Avatar upload error:", err);
    if (req.file) {
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) console.error("Error deleting uploaded file:", unlinkErr);
      });
    }
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ msg: "File too large. Maximum size is 5MB." });
      }
    }
    res.status(500).json({ msg: err.message || "Server error during avatar upload" });
  }
});

router.get("/me", auth, getProfile);
router.put("/update", auth, updateProfile);
router.put("/change-password", auth, changePassword);
router.post("/complete-baseline", auth, completeBaseline);


router.post("/reports", auth, async (req, res) => {
  try {
    const { subject, message } = req.body;
    if (!subject || !message) {
      return res.status(400).json({ success: false, message: "Subject and message are required." });
    }
    const report = await Report.create({
      userId: req.user._id,
      userEmail: req.user.email,
      userName: req.user.displayName,
      subject,
      message,
    });
    res.status(201).json({ success: true, report });
  } catch (err) {
    console.error("Submit report error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


router.get("/reports", auth, async (req, res) => {
  try {
    const reports = await Report.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, reports });
  } catch (err) {
    console.error("Get my reports error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


router.post("/reports/:reportId/reply", auth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ success: false, message: "Message is required." });

    const report = await Report.findOne({ _id: req.params.reportId, userId: req.user._id });
    if (!report) return res.status(404).json({ success: false, message: "Report not found." });

    report.replies.push({ message, sentBy: "user", senderName: req.user.displayName });
    await report.save();

    res.json({ success: true, report });
  } catch (err) {
    console.error("User reply error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/reports/notifications", auth, async (req, res) => {
  try {
    const reports = await Report.find({ userId: req.user._id });
    const unread = reports.filter(r =>
      r.replies.length > 0 && r.replies[r.replies.length - 1].sentBy === 'admin'
    ).length;
    res.json({ success: true, unread });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;