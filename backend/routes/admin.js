const express = require('express');
const jwt = require('jsonwebtoken');
// switch to file-based storage
const { read, write, readAudits, writeAudits } = require('../utils/fileDb');
const { authenticateToken, isAdmin } = require('../middleware/auth');

const ADMIN_VERIFICATION_CODES = {
  frozen: '962101',
  blocked: '385247',
  suspended: '704856',
  locked: '521690',
};

const STATUS_DESCRIPTIONS = {
  frozen: 'COT - Customer Offset Token',
  blocked: 'AFD - Account Freeze Directive',
  suspended: 'SVR - Suspension Verification Request',
  locked: 'ACE - Account Clearance Encryption',
};

function requiresAdminVerification(status) {
  return Object.prototype.hasOwnProperty.call(ADMIN_VERIFICATION_CODES, status);
}

function isVerificationCodeValid(status, code) {
  return requiresAdminVerification(status) && ADMIN_VERIFICATION_CODES[status] === code;
}

const router = express.Router();

function logAdminAction(admin, action, targetUserId, details = {}) {
  const audits = readAudits();
  audits.unshift({
    id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    adminId: admin?.id || 'unknown',
    adminEmail: admin?.email || 'unknown',
    timestamp: new Date().toISOString(),
    action,
    targetUserId,
    details,
  });
  writeAudits(audits);
}

// @route   POST /api/admin/login
// @desc    Authenticate an administrator and issue an admin JWT
// @access  Public
router.post('/login', (req, res) => {
  try {
    const { username, email, password } = req.body;
    const identifier = (username || email || '').toString().trim().toLowerCase();
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@vanstra.bank').toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    const idOk = identifier === 'admin' || identifier === adminEmail;
    if (!idOk || password !== adminPassword) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    const token = jwt.sign(
      { id: 'admin', role: 'admin', email: adminEmail },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );
    res.json({ success: true, token, admin: { email: adminEmail } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Protect all routes below with authentication and admin check
router.use(authenticateToken);
router.use(isAdmin);

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private/Admin
router.get('/users', (req, res) => {
  try {
    const users = read();
    const filtered = users
      .filter((u) => u.role === 'user')
      .map((user) => ({
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        accountNumber: user.accountNumber,
        accountBalance: user.accountBalance,
        accountStatus: user.accountStatus,
        isOnline: user.isOnline,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        transactions: user.transactions,
        tier: user.tier,
      }));

    res.json({
      success: true,
      count: filtered.length,
      users: filtered,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/admin/users/:id
// @desc    Get single user by ID
// @access  Private/Admin
router.get('/users/:id', (req, res) => {
  try {
    const users = read();
    const user = users.find((u) => u.id === req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
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
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/admin/users/:id/balance
// @desc    Update user balance
// @access  Private/Admin
router.put('/users/:id/balance', (req, res) => {
  try {
    const { balance } = req.body;

    if (balance === undefined || balance < 0) {
      return res.status(400).json({ message: 'Please provide a valid balance' });
    }

    const users = read();
    const idx = users.findIndex((u) => u.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ message: 'User not found' });
    }
    users[idx].accountBalance = balance;
    write(users);

    logAdminAction(req.user, 'update_balance', users[idx].id, {
      fullName: users[idx].fullName,
      newBalance: balance,
    });

    res.json({
      success: true,
      message: `Balance updated to €${balance.toFixed(2)}`,
      user: {
        id: users[idx].id,
        fullName: users[idx].fullName,
        accountBalance: users[idx].accountBalance,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/admin/update-balance/:id
// @desc    Update user balance (alias)
// @access  Private/Admin
router.put('/update-balance/:id', (req, res) => {
  try {
    const { balance } = req.body;
    if (balance === undefined || balance < 0) {
      return res.status(400).json({ message: 'Please provide a valid balance' });
    }
    const users = read();
    const idx = users.findIndex((u) => u.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ message: 'User not found' });
    }
    users[idx].accountBalance = balance;
    write(users);
    res.json({ message: 'Balance updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/admin/users/:id/topup
// @desc    Add funds to a user's balance with a description. The credit is
//          recorded in user.adminCredits so the user's dashboard can pick it up
//          (via the account-status poll) and show it as a transaction.
// @access  Private/Admin
router.post('/users/:id/topup', (req, res) => {
  try {
    const { amount, description } = req.body;
    const amt = Number(amount);
    if (!amt || !isFinite(amt) || amt <= 0) {
      return res.status(400).json({ message: 'Please provide a valid top-up amount greater than 0' });
    }

    const users = read();
    const idx = users.findIndex((u) => u.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[idx];
    const prevBalance = Number(user.accountBalance) || 0;
    user.accountBalance = prevBalance + amt;

    const credit = {
      id: 'CR-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase(),
      amount: amt,
      description: (description && String(description).trim()) || 'Account credit',
      timestamp: new Date().toISOString(),
      by: (req.user && req.user.email) ? req.user.email : 'admin'
    };
    if (!Array.isArray(user.adminCredits)) user.adminCredits = [];
    user.adminCredits.push(credit);
    if (user.adminCredits.length > 50) user.adminCredits = user.adminCredits.slice(-50);

    users[idx] = user;
    write(users);

    logAdminAction(req.user, 'topup_balance', user.id, {
      fullName: user.fullName,
      amount: amt,
      description: credit.description,
      newBalance: user.accountBalance
    });

    res.json({
      success: true,
      message: `Topped up €${amt.toFixed(2)} — “${credit.description}”. New balance €${user.accountBalance.toFixed(2)}.`,
      credit,
      user: {
        id: user.id,
        fullName: user.fullName,
        accountBalance: user.accountBalance
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/admin/users/:id/status
// @desc    Update user account status (freeze, block, activate, banned, suspended, locked)
// @access  Private/Admin
router.put('/users/:id/status', (req, res) => {
  try {
    const { status, verificationCode } = req.body;
    const validStatuses = ['active', 'frozen', 'blocked', 'restricted', 'banned', 'suspended', 'locked'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be active, frozen, blocked, restricted, suspended, locked, or banned' });
    }

    if (requiresAdminVerification(status)) {
      if (!verificationCode) {
        return res.status(400).json({ message: `Verification code required to change account to ${status}` });
      }

      if (!isVerificationCodeValid(status, verificationCode)) {
        return res.status(403).json({ message: 'Invalid verification code for this administrative action' });
      }
    }

    const users = read();
    const idx = users.findIndex((u) => u.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ message: 'User not found' });
    }

    users[idx].accountStatus = status;
    write(users);

    logAdminAction(req.user, 'update_status', users[idx].id, {
      fullName: users[idx].fullName,
      newStatus: status,
    });

    res.json({
      success: true,
      message: `Account status updated to ${status}`,
      user: {
        id: users[idx].id,
        fullName: users[idx].fullName,
        accountStatus: users[idx].accountStatus,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/admin/verification-codes
// @desc    Get admin-only verification code details for account actions
// @access  Private/Admin
router.get('/verification-codes', (req, res) => {
  try {
    res.json({
      success: true,
      codes: STATUS_DESCRIPTIONS,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/admin/update-status/:id
// @desc    Change account status (alias)
// @access  Private/Admin
router.put('/update-status/:id', (req, res) => {
  try {
    const { status, verificationCode } = req.body;
    const validStatuses = ['active', 'frozen', 'blocked', 'restricted', 'suspended', 'locked', 'banned'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be active, frozen, blocked, restricted, suspended, locked, or banned' });
    }

    if (requiresAdminVerification(status)) {
      if (!verificationCode) {
        return res.status(400).json({ message: `Verification code required to change account to ${status}` });
      }

      if (!isVerificationCodeValid(status, verificationCode)) {
        return res.status(403).json({ message: 'Invalid verification code for this administrative action' });
      }
    }

    const users = read();
    const idx = users.findIndex((u) => u.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ message: 'User not found' });
    }

    users[idx].accountStatus = status;
    write(users);

    logAdminAction(req.user, 'update_status', users[idx].id, {
      fullName: users[idx].fullName,
      newStatus: status,
    });

    res.json({ message: 'Status updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// helper to generate numeric codes for restriction
function generateVerificationQueue() {
  const count = Math.floor(Math.random() * 5) + 3; // 3-7 codes
  const codes = [];
  for (let i = 0; i < count; i++) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    codes.push(code);
  }
  return codes;
}

// @route   PUT /api/admin/users/:id/restrict
// @desc    Put a user into restricted mode and seed verification queue
// @access  Private/Admin
router.put('/users/:id/restrict', async (req, res) => {
  try {
    const codes = generateVerificationQueue();
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        accountStatus: 'restricted',
        verificationQueue: codes,
        currentStep: 0,
        failedAttempts: 0,
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // note: we do not return the queue itself
    res.json({
      success: true,
      message: 'User has been restricted and verification queue initialized',
      user: {
        id: user._id,
        fullName: user.fullName,
        accountStatus: user.accountStatus,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/admin/audit
// @desc    Get audit log entries for admin actions
// @access  Private/Admin
router.get('/audit', (req, res) => {
  try {
    const audits = readAudits();
    res.json({
      success: true,
      count: audits.length,
      audits,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/admin/stats
// @desc    Get dashboard statistics
// @access  Private/Admin
router.get('/stats', (req, res) => {
  try {
    const users = read();
    const allUsers = users;
    const regularUsers = users.filter((u) => u.role === 'user');

    const totalBalance = regularUsers.reduce((sum, user) => sum + (user.accountBalance || 0), 0);
    const onlineCount = regularUsers.filter((user) => user.isOnline).length;
    const blockedCount = regularUsers.filter((user) => user.accountStatus === 'blocked').length;
    const frozenCount = regularUsers.filter((user) => user.accountStatus === 'frozen').length;
    const bannedCount = regularUsers.filter((user) => user.accountStatus === 'banned').length;

    // Count transactions from today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let transactionCount = 0;

    regularUsers.forEach((user) => {
      if (user.transactions && Array.isArray(user.transactions)) {
        transactionCount += user.transactions.filter(
          (tx) => new Date(tx.timestamp) >= today
        ).length;
      }
    });

    res.json({
      success: true,
      stats: {
        totalUsers: regularUsers.length,
        onlineUsers: onlineCount,
        totalBalance: totalBalance,
        totalAdmins: allUsers.filter((u) => u.role === 'admin').length,
        blockedAccounts: blockedCount,
        frozenAccounts: frozenCount,
        bannedAccounts: bannedCount,
        todayTransactions: transactionCount,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user (hard delete)
// @access  Private/Admin
router.delete('/users/:id', (req, res) => {
  try {
    const users = read();
    const idx = users.findIndex((u) => u.id === req.params.id);

    if (idx === -1) {
      return res.status(404).json({ message: 'User not found' });
    }

    const [deletedUser] = users.splice(idx, 1);
    write(users);

    logAdminAction(req.user, 'delete_user', deletedUser.id, {
      fullName: deletedUser.fullName,
      email: deletedUser.email,
    });

    res.json({
      success: true,
      message: `User ${deletedUser.fullName} has been deleted`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
