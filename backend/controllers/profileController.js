const User = require("../models/User");
const bcrypt = require("bcrypt");

exports.getProfile = async (req, res) => {
  try {
    res.json({
      id: req.user._id,
      email: req.user.email,
      phone: req.user.phone,
      displayName: req.user.displayName,
      examType: req.user.examType,
      targetScore: req.user.targetScore,
      language: req.user.language,
      timezone: req.user.timezone,
      avatarUrl: req.user.avatarUrl,
      theme: req.user.theme,
      subscriptionStatus: req.user.subscriptionStatus,
      lastLogin: req.user.lastLogin,
      createdAt: req.user.createdAt
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const allowedFields = [
      "displayName", "examType", "targetScore", "language", 
      "timezone", "avatarUrl", "theme", "email", "phone"
    ];

    // Check email uniqueness
    if (req.body.email && req.body.email !== req.user.email) {
      const emailExists = await User.findOne({ 
        email: req.body.email, 
        _id: { $ne: req.user._id } 
      });
      if (emailExists) {
        return res.status(400).json({ msg: "Email already in use" });
      }
    }

    // Check phone uniqueness
    if (req.body.phone && req.body.phone !== req.user.phone) {
      const phoneExists = await User.findOne({ 
        phone: req.body.phone, 
        _id: { $ne: req.user._id } 
      });
      if (phoneExists) {
        return res.status(400).json({ msg: "Phone number already in use" });
      }
    }

    // Update allowed fields
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        req.user[field] = req.body[field];
      }
    });

    await req.user.save();

    res.json({ 
      msg: "Profile updated successfully", 
      user: {
        id: req.user._id,
        email: req.user.email,
        phone: req.user.phone,
        displayName: req.user.displayName,
        examType: req.user.examType,
        targetScore: req.user.targetScore,
        language: req.user.language,
        timezone: req.user.timezone,
        avatarUrl: req.user.avatarUrl,
        theme: req.user.theme
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ msg: "Current and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ msg: "New password must be at least 6 characters" });
    }

    const valid = await bcrypt.compare(currentPassword, req.user.passwordHash);
    if (!valid) {
      return res.status(400).json({ msg: "Current password is incorrect" });
    }

    req.user.passwordHash = await bcrypt.hash(newPassword, 10);
    await req.user.save();

    res.json({ msg: "Password changed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};