const express = require('express');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// rate limiter: small window for verification attempts
const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 12, // allow a dozen attempts per window
  message: { message: 'Too many verification attempts, please wait and try again later.' },
});

// endpoint used by frontend after login to check restricted status
// We augment the existing login logic in auth route but additional
// helper may be useful elsewhere.
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('accountStatus');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ restricted: user.accountStatus === 'restricted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// verify code endpoint
router.post('/verify-code', authenticateToken, verifyLimiter, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ message: 'Code is required' });
    }

    const user = await User.findById(req.user.id).select('+verificationQueue +currentStep +failedAttempts accountStatus');
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    // lockout check
    if (user.failedAttempts >= 3) {
      return res.json({ status: 'locked' });
    }

    const expected = user.verificationQueue[user.currentStep];
    if (code === expected) {
      user.currentStep += 1;
      user.failedAttempts = 0;
      if (user.currentStep >= user.verificationQueue.length) {
        user.accountStatus = 'active';
        // clear queue to be safe
        user.verificationQueue = [];
        user.currentStep = 0;
        user.failedAttempts = 0;
        await user.save();
        return res.json({ status: 'complete' });
      } else {
        await user.save();
        return res.json({ status: 'continue' });
      }
    } else {
      user.failedAttempts += 1;
      await user.save();
      return res.json({ status: 'error' });
    }
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
