const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const createAdmin = async () => {
  try {
    console.log('🚀 Starting admin setup...');
    
   
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/banditup');
    console.log('✅ Connected to MongoDB');
    
    const adminEmail = 'admin@banditup.com';
    const adminPassword = 'Admin@123'; 
    
    
    let admin = await User.findOne({ email: adminEmail });
    
    if (admin) {
      console.log('👤 Admin user already exists');
      
  
      admin.role = 'admin';
      admin.subscriptionStatus = 'admin';
      admin.displayName = 'BandItUp Admin';
      admin.isVerified = true;
      await admin.save();
      console.log('✅ Admin permissions updated!');
    } else {
      
      console.log('👤 Creating new admin user...');
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      
      admin = new User({
        email: adminEmail,
        passwordHash,
        displayName: 'BandItUp Admin',
        role: 'admin',
        subscriptionStatus: 'admin',
        isVerified: true,
        theme: 'dark'
      });
      
      await admin.save();
      console.log(' Admin user created successfully!');
    }
    

    console.log('\n📋 ADMIN CREDENTIALS:');
    console.log('📧 Email:', adminEmail);
    console.log('🔐 Password:', adminPassword);
    console.log('⚠️  IMPORTANT: Change password after first login!');
    
    // Show all admins
    const admins = await User.find({ role: 'admin' });
    console.log('\n👥 All Admin Users:');
    admins.forEach((a, i) => {
      console.log(`${i + 1}. ${a.email} (${a.displayName})`);
    });
    
  
    const totalUsers = await User.countDocuments();
    console.log(`\n📊 Total Users: ${totalUsers}`);
    
    mongoose.disconnect();
    console.log('\n Admin setup complete!');
    
  } catch (error) {
    console.error(' Error:', error.message);
    process.exit(1);
  }
};

createAdmin();