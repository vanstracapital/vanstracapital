require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');
const { read, write } = require('../utils/fileDb');

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Clear existing users
    await User.deleteMany({});
    console.log('Cleared existing users');

    // Create admin user in MongoDB
    const adminUser = await User.create({
      fullName: 'Admin User',
      email: process.env.ADMIN_EMAIL || 'admin@vanstra.bank',
      password: process.env.ADMIN_PASSWORD || 'admin123',
      phone: '+49123456789',
      accountBalance: 1000000,
      role: 'admin',
      accountStatus: 'active',
      tier: 'platinum',
    });

    console.log('✓ Admin user created (Mongo):', adminUser.email);

    // Also seed JSON file database if it exists
    try {
      const fileUsers = [];
      const salt = await bcrypt.genSalt(10);
      const hashedPw = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', salt);
      const randomNum = Math.floor(Math.random() * 1000000000);
      fileUsers.push({
        id: randomUUID(),
        fullName: 'Admin User',
        email: (process.env.ADMIN_EMAIL || 'admin@vanstra.bank').toLowerCase(),
        password: hashedPw,
        phone: '+49123456789',
        accountNumber: `DE${Date.now()}${randomNum}`,
        accountBalance: 1000000,
        role: 'admin',
        accountStatus: 'active',
        tier: 'platinum',
        isOnline: false,
        lastLogin: null,
        transactions: [],
        createdAt: new Date(),
      });
      // test users will be added below
      console.log('✓ Admin user added to file DB');
      write(fileUsers);
    } catch (e) {
      console.warn('file DB seed skipped:', e.message);
    }

    console.log('\n✅ Database seeding completed!');
    console.log('\nAdmin Login:');
    console.log('  Email:', process.env.ADMIN_EMAIL || 'admin@vanstra.bank');
    console.log('  Password:', process.env.ADMIN_PASSWORD || 'admin123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
    process.exit(1);
  }
};

seedDatabase();
