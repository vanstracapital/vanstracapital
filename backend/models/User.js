const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false, // Don't return password by default
    },
    phone: {
      type: String,
      default: '',
    },
    accountNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    accountBalance: {
      type: Number,
      default: 0,
    },
    accountStatus: {
      type: String,
      enum: ['active', 'frozen', 'blocked', 'restricted', 'banned'], // 'restricted' for multi-step verification, 'banned' for admin ban
      default: 'active',
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    transactions: [
      {
        id: String,
        type: String,
        amount: Number,
        description: String,
        timestamp: Date,
        status: String,
      },
    ],
    avatar: {
      type: String,
      default: '',
    },
    tier: {
      type: String,
      enum: ['basic', 'silver', 'gold', 'platinum'],
      default: 'basic',
    },

    // fields for restricted account verification process; never selected in queries
    verificationQueue: {
      type: [String],
      default: [],
      select: false,
    },
    currentStep: {
      type: Number,
      default: 0,
      select: false,
    },
    failedAttempts: {
      type: Number,
      default: 0,
      select: false,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  // only hash when password field has been modified (or is new)
  if (!this.isModified('password')) {
    // call next and exit early to avoid re-hashing an already hashed password
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Generate account number if not exists
userSchema.pre('save', async function (next) {
  if (!this.accountNumber) {
    const randomNum = Math.floor(Math.random() * 1000000000);
    this.accountNumber = `DE${Date.now()}${randomNum}`;
  }
  next();
});

// Method to match password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
