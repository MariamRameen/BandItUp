const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const User = require("../models/User");

// Check if user is admin
const isAdmin = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin only.' 
      });
    }
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Apply auth and admin check to all routes
router.use(auth);
router.use(isAdmin);

// Get all users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash -googleId -resetPasswordToken -resetPasswordExpiry');
    
    res.json({
      success: true,
      users: users
    });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Get admin stats
router.get("/stats", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const premiumUsers = await User.countDocuments({ subscriptionStatus: 'premium' });
    const freeUsers = await User.countDocuments({ subscriptionStatus: 'free_trial' });
    const academicUsers = await User.countDocuments({ examType: 'Academic' });
    const generalUsers = await User.countDocuments({ examType: 'General Training' });
    const verifiedUsers = await User.countDocuments({ isVerified: true });
   
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const newUsers = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activeToday = await User.countDocuments({ lastLogin: { $gte: today } });
    
    res.json({
      success: true,
      stats: {
        totalUsers,
        adminUsers,
        premiumUsers,
        freeUsers,
        academicUsers,
        generalUsers,
        verifiedUsers,
        newUsers,
        activeToday
      }
    });
  } catch (err) {
    console.error('Get stats error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Update user role
router.put("/users/:userId/role", async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid role' 
      });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Don't allow changing your own role
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot change your own role' 
      });
    }
    
    user.role = role;
    await user.save();
    
    res.json({
      success: true,
      message: `User role updated to ${role}`,
      user: {
        id: user._id,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Update role error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Delete user
router.delete("/users/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Don't allow deleting yourself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete yourself' 
      });
    }
    
    // Don't allow deleting other admins
    if (user.role === 'admin') {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete admin users' 
      });
    }
    
    await User.findByIdAndDelete(userId);
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

module.exports = router;