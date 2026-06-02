const express = require('express');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Protect all user routes with authentication
router.use(authenticateToken);

// @route   GET /api/users/profile
// @desc    Get current user's profile
// @access  Private
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    res.json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        accountNumber: user.accountNumber,
        accountBalance: user.accountBalance,
        accountStatus: user.accountStatus,
        isOnline: user.isOnline,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        transactions: user.transactions,
        tier: user.tier,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/users/profile
// @desc    Update current user's profile
// @access  Private
router.put('/profile', async (req, res) => {
  try {
    const { fullName, phone, avatar } = req.body;

    const user = await User.findById(req.user.id);

    if (fullName) user.fullName = fullName;
    if (phone) user.phone = phone;
    if (avatar) user.avatar = avatar;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        accountNumber: user.accountNumber,
        accountBalance: user.accountBalance,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/users/transaction
// @desc    Add a transaction record
// @access  Private
router.post('/transaction', async (req, res) => {
  try {
    const { type, amount, description, recipientId, status } = req.body;

    if (!type || !amount || amount <= 0) {
      return res.status(400).json({ message: 'Please provide valid transaction data' });
    }

    const user = await User.findById(req.user.id);

    const transaction = {
      id: `TXN-${Date.now()}`,
      type,
      amount,
      description: description || '',
      timestamp: new Date(),
      status: status || 'completed',
      recipientId: recipientId || null,
    };

    if (!user.transactions) {
      user.transactions = [];
    }

    user.transactions.push(transaction);

    // Deduct from balance if sending money
    if (type === 'transfer' || type === 'payment') {
      if (user.accountBalance < amount) {
        return res.status(400).json({ message: 'Insufficient balance' });
      }
      user.accountBalance -= amount;
    } else if (type === 'deposit') {
      user.accountBalance += amount;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Transaction recorded',
      transaction,
      newBalance: user.accountBalance,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/users/transactions
// @desc    Get all transactions for current user
// @access  Private
router.get('/transactions', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    const transactions = user.transactions || [];

    res.json({
      success: true,
      count: transactions.length,
      transactions: transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
