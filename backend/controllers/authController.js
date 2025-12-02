const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { OAuth2Client } = require('google-auth-library');
const nodemailer = require("nodemailer");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

transporter.verify((error) => {
  if (error) {
    console.log('❌ Email server error:', error.message);
  } else {
    console.log('✅ Email server ready');
  }
});

const sendVerificationEmail = async (email, verificationToken) => {
  try {
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
    
    const mailOptions = {
      from: `"BandItUp" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email - BandItUp',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #7D3CFF; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Welcome to BandItUp!</h1>
          </div>
          <div style="padding: 30px; background-color: #f9f9f9;">
            <h2>Verify Your Email</h2>
            <p>Hello,</p>
            <p>Please click below to verify your email address:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" style="background-color: #7D3CFF; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                Verify Email
              </a>
            </div>
            <p>Or copy this link:</p>
            <p style="background-color: #f0f0f0; padding: 10px; border-radius: 5px;">
              ${verificationLink}
            </p>
            <p>Link expires in 24 hours.</p>
          </div>
        </div>
      `
    };

    console.log('📧 Sending verification email to:', email);
    console.log('🔗 Verification link:', verificationLink);

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent:', info.messageId);
    
  } catch (error) {
    console.error('❌ Email send error:', error.message);
  }
};


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
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = Date.now() + 24 * 60 * 60 * 1000; 
    
    const user = new User({
      email,
      passwordHash,
      displayName,
      subscriptionStatus: "free_trial",
      isVerified: false,  
      verificationTokenExpiry
    });

    await user.save();
    await sendVerificationEmail(email, verificationToken);

   
    res.status(201).json({
      success: true,
      message: "Registration successful! Please check your email to verify your account.",
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        isVerified: user.isVerified 
      }
  
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};


const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ msg: "Verification token is required" });
    }

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        success: false,
        msg: "Invalid or expired verification token" 
      });
    }

   
    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpiry = null;
    await user.save();

    
    const authToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { 
      expiresIn: "1d" 
    });

    res.json({
      success: true,
      message: "Email verified successfully!",
      token: authToken,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        isVerified: user.isVerified,
        subscriptionStatus: user.subscriptionStatus
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ msg: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
  
      return res.json({ 
        message: "If an account exists with this email, a verification link has been sent." 
      });
    }

    if (user.isVerified) {
      return res.status(400).json({ 
        success: false,
        msg: "Email is already verified" 
      });
    }

   
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = Date.now() + 24 * 60 * 60 * 1000;

    user.verificationToken = verificationToken;
    user.verificationTokenExpiry = verificationTokenExpiry;
    await user.save();

    await sendVerificationEmail(email, verificationToken);

    res.json({ 
      success: true,
      message: "Verification email sent. Please check your inbox."
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

    if (user.googleId && !user.passwordHash) {
      return res.status(400).json({ 
        msg: "Account created with Google. Use Google login or reset password.",
        googleUser: true  
      });
    }
    
    if (!user.passwordHash) {
      return res.status(400).json({ 
        msg: "Please use the correct login method for this account" 
      });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

   
    if (!user.isVerified && user.verificationToken) {
      
      return res.status(403).json({ 
        success: false,
        msg: "Please verify your email address before logging in.",
        unverified: true,
        email: user.email
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.json({
      success: true,
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
        role: user.role,
        isVerified: user.isVerified
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

    let user = await User.findOne({ 
      $or: [{ email }, { googleId }] 
    });

    if (user) {
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
      user = new User({
        email,
        displayName: name || `User-${Date.now()}`,
        googleId,
        avatarUrl: picture,
        isVerified: true, // Google users are auto-verified
        subscriptionStatus: "free_trial"
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { 
      expiresIn: "1d" 
    });

    res.json({
      success: true,
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
        role: user.role,
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
      resetToken
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};


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

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpiry = null;
    await user.save();

    res.json({ 
      msg: "Password reset successfully",
      note: user.googleId ? 
        "You can now login with either Google or email/password" : 
        "Password updated successfully"
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};


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
        role: req.user.role,
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
  googleLogin,
  forgotPassword,
  resetPassword,
  getMe,
  verifyEmail,          
  resendVerificationEmail 
};