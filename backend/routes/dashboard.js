const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { read } = require('../utils/fileDb');

const router = express.Router();

router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const users = read();
    const totalBalance = users.reduce((sum, user) => sum + (user.accountBalance || 0), 0);

    res.json({
      success: true,
      stats: {
        totalUsers: users.length,
        totalBalance,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
