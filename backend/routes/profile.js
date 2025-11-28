const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { updateProfile, getProfile, changePassword } = require("../controllers/profileController");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const User = require('../models/User');

const uploadsDir = path.join(__dirname, '../uploads/avatars');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    
    const uniqueName = `avatar-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed (JPEG, PNG, GIF, etc.)"), false);
    }
  }
});

router.post("/upload-avatar", auth, upload.single("avatar"), async (req, res) => {
  try {
    console.log('Avatar upload request received');
    
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }

    
    const avatarUrl = `/avatars/${req.file.filename}`;
    console.log('Updating user avatar:', avatarUrl);

    await User.findByIdAndUpdate(req.user.id, { avatarUrl });

    res.json({ 
      msg: 'Avatar uploaded successfully',
      avatarUrl: avatarUrl
    });

  } catch (err) {
    console.error('Avatar upload error:', err);
    
    if (req.file) {
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) console.error('Error deleting uploaded file:', unlinkErr);
      });
    }
    
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ msg: 'File too large. Maximum size is 5MB.' });
      }
    }
    
    res.status(500).json({ msg: err.message || 'Server error during avatar upload' });
  }
});


router.get("/me", auth, getProfile);
router.put("/update", auth, updateProfile);
router.put("/change-password", auth, changePassword);

module.exports = router;