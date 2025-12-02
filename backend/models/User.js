const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: { 
      type: String, 
      required: true, 
      unique: true,
      lowercase: true,
      trim: true
    },
    passwordHash: String,
    displayName: { type: String, required: true },
    
   
    role: { 
      type: String, 
      enum: ['user', 'admin'], 
      default: 'user' 
    },
    
    examType: { 
      type: String, 
      enum: ['Academic', 'General'], 
      default: 'Academic' 
    },
    targetScore: { 
      type: Number, 
      min: 4.0, 
      max: 9.0,
      default: 6.5 
    },
    language: { 
      type: String, 
      default: 'English' 
    },
    timezone: { 
      type: String, 
      default: 'UTC+05:00' 
    },
    avatarUrl: String,
    theme: { 
      type: String, 
      enum: ['light', 'dark'], 
      default: 'light' 
    },

    stripeCustomerId: String,
    stripeSubscriptionId: String,
    subscriptionStatus: { 
      type: String, 
      enum: ['free_trial', 'active', 'inactive', 'cancelled', 'admin'],
      default: "free_trial" 
    },
    
    googleId: { 
      type: String, 
      unique: true, 
      sparse: true 
    },
    
    resetPasswordToken: String,
    resetPasswordExpiry: Date,
    lastLogin: Date,
    isVerified: {
    type: Boolean,
    default: true
  },
  verificationToken: String,
  verificationTokenExpiry: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);