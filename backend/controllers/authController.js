const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require('google-auth-library');
const twilio = require("twilio")(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


const register = async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password || !displayName) {
      return res.status(400).json({ msg: "Email, password, and display name are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ msg: "Password must be at least 6 characters" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: "User already exists with this email" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = new User({
      email,
      passwordHash,
      displayName,
      subscriptionStatus: "free_trial"
    });

    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        phone: user.phone,
        displayName: user.displayName,
        examType: user.examType,
        targetScore: user.targetScore,
        language: user.language,
        timezone: user.timezone,
        avatarUrl: user.avatarUrl,
        theme: user.theme,
        subscriptionStatus: user.subscriptionStatus
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};


const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ msg: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    if (!user.passwordHash) {
      return res.status(400).json({ msg: "Please use the correct login method for this account" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        phone: user.phone,
        displayName: user.displayName,
        examType: user.examType,
        targetScore: user.targetScore,
        language: user.language,
        timezone: user.timezone,
        avatarUrl: user.avatarUrl,
        theme: user.theme,
        subscriptionStatus: user.subscriptionStatus
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};


const sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ msg: "Phone number is required" });
    }

    let user = await User.findOne({ phone });
    if (!user) {
      user = new User({ 
        phone, 
        displayName: `User-${Date.now()}`,
        subscriptionStatus: "free_trial"
      });
      await user.save();
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpiry = Date.now() + 2 * 60 * 1000; // 2 minutes
    await user.save();

    // Send OTP via Twilio
    await twilio.messages.create({
      body: `Your BandItUp OTP is ${otp}. Valid for 2 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });

    res.json({ msg: "OTP sent successfully" });
  } catch (err) {
    console.error(err);
    
    if (err.code === 21211) {
      return res.status(400).json({ msg: "Invalid phone number format" });
    } else if (err.code === 21408) {
      return res.status(400).json({ msg: "Phone number not authorized" });
    }
    
    res.status(500).json({ msg: "Failed to send OTP", error: err.message });
  }
};

// Verify Phone OTP
const loginWithPhone = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ msg: "Phone and OTP are required" });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(400).json({ msg: "User not found" });
    }

    if (user.otp !== otp || !user.otpExpiry || user.otpExpiry < Date.now()) {
      return res.status(400).json({ msg: "Invalid or expired OTP" });
    }

    // Clear OTP after successful verification
    user.otp = null;
    user.otpExpiry = null;
    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    
    res.json({ 
      token, 
      user: {
        id: user._id,
        email: user.email,
        phone: user.phone,
        displayName: user.displayName,
        examType: user.examType,
        targetScore: user.targetScore,
        language: user.language,
        timezone: user.timezone,
        avatarUrl: user.avatarUrl,
        theme: user.theme,
        subscriptionStatus: user.subscriptionStatus
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};


const googleLogin = async (req, res) => {
  try {
    const { tokenId } = req.body;

    if (!tokenId) {
      return res.status(400).json({ msg: "Google token is required" });
    }

    const ticket = await client.verifyIdToken({
      idToken: tokenId,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    if (!email) {
      return res.status(400).json({ msg: "Email not provided by Google" });
    }

    // Find or create user
    let user = await User.findOne({ 
      $or: [{ email }, { googleId }] 
    });

    if (user) {
      // Update existing user with Google data if needed
      if (!user.googleId) {
        user.googleId = googleId;
      }
      if (!user.avatarUrl) {
        user.avatarUrl = picture;
      }
      if (!user.displayName && name) {
        user.displayName = name;
      }
      user.isVerified = true;
    } else {
      // Create new user with Google data
      user = new User({
        email,
        displayName: name || `User-${Date.now()}`,
        googleId,
        avatarUrl: picture,
        isVerified: true,
        subscriptionStatus: "free_trial"
      });
    }

    
    user.lastLogin = new Date();
    await user.save();

   
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { 
      expiresIn: "1d" 
    });

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        phone: user.phone,
        displayName: user.displayName,
        examType: user.examType,
        targetScore: user.targetScore,
        language: user.language,
        timezone: user.timezone,
        avatarUrl: user.avatarUrl,
        theme: user.theme,
        subscriptionStatus: user.subscriptionStatus,
        isVerified: user.isVerified
      }
    });
  } catch (err) {
    console.error('Google login error:', err);
    
    if (err.message.includes('Token used too late')) {
      return res.status(400).json({ msg: "Google token has expired" });
    }
    
    res.status(500).json({ 
      msg: "Google authentication failed", 
      error: err.message 
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ msg: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      
      return res.json({ msg: "If the email exists, a reset link will be sent" });
    }

    
    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { 
      expiresIn: '1h' 
    });

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiry = Date.now() + 60 * 60 * 1000; 
    await user.save();

   
    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    
    console.log(`Password reset link for ${email}: ${resetLink}`);
    
    res.json({ 
      msg: "If the email exists, a reset link will be sent",
      resetToken // Remove this in production - only for testing
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ msg: "Token and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ msg: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ msg: "Invalid or expired reset token" });
    }

    // Update password
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpiry = null;
    await user.save();

    res.json({ msg: "Password reset successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// Get Current User
const getMe = async (req, res) => {
  try {
    res.json({
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
        theme: req.user.theme,
        subscriptionStatus: req.user.subscriptionStatus,
        isVerified: req.user.isVerified,
        lastLogin: req.user.lastLogin,
        createdAt: req.user.createdAt
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

module.exports = {
  register,
  login,
  sendOtp,
  loginWithPhone,
  googleLogin,
  forgotPassword,
  resetPassword,
  getMe
};