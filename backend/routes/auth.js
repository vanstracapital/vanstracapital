const Otp = require('../Otp');
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { randomUUID, randomBytes } = require('crypto');
const { authenticateToken } = require('../middleware/auth');
const { read, write, readOtps, writeOtps } = require('../utils/fileDb');
const { generateOTP, sendOTPEmail, sendPasswordResetEmail } = require('../utils/emailService');
// NOTE: the Mongoose model is no longer used when operating in file mode.

const router = express.Router();

// Master OTPs allow bypassing verification in dev/admin flows
const masterOTPs = ['271839', '492716', '580317', '634928', '705231'];

// Master-OTP mode (default ON): login/signup skip email entirely and verify with
// the shared master code above, so any account is loginable from any device with
// no dependency on email delivery (which is blocked on Render's free tier anyway).
// Set MASTER_OTP_MODE=false to restore real per-login email OTPs.
const MASTER_OTP_MODE = process.env.MASTER_OTP_MODE !== 'false';

// Simple hash function for PIN (matches frontend implementation)
function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & 0xffffffff; // Keep as 32-bit integer
    }
    return (hash >>> 0).toString(16); // Convert to unsigned before hex
}


// Generate JWT token
const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role: role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Compute the two ISO 13616 (IBAN) check digits for a country code + BBAN.
// Algorithm: move "<countryCode>00" to the end, convert letters to digits
// (A=10 … Z=35), then check = 98 - (number mod 97).
function ibanCheckDigits(countryCode, bban) {
  const rearranged = `${bban}${countryCode}00`;
  const numeric = rearranged.replace(/[A-Z]/g, (ch) => (ch.charCodeAt(0) - 55).toString());
  let remainder = 0;
  for (let i = 0; i < numeric.length; i++) {
    remainder = (remainder * 10 + Number(numeric[i])) % 97;
  }
  return String(98 - remainder).padStart(2, '0');
}

// Build a checksum-valid IBAN whose country code matches the user's country.
// Uses a uniform BBAN (4-digit bank code + 14-digit account) across countries.
function generateIban(countryCode, seq) {
  const cc = String(countryCode || 'DE').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2) || 'DE';
  const bankCode = '4821';
  const account = String(seq).padStart(14, '0');
  const bban = `${bankCode}${account}`;
  const check = ibanCheckDigits(cc, bban);
  return `${cc}${check}${bban}`;
}

// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
router.post('/signup', async (req, res) => {
  try {
    const { 
      fullName, 
      email, 
      password, 
      phone, 
      pin,
      dateOfBirth,
      streetAddress,
      city,
      postalCode,
      country,
      ssn,
      idType,
      occupation,
      employer,
      annualIncome,
      language,
      currency
    } = req.body;

    // Validation
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Address and identification details are optional at signup; they can be
    // completed later from the profile. (The signup form does not collect them.)

    // Validate language and currency preferences
    if (!language) {
      return res.status(400).json({ message: 'Please select a preferred language' });
    }
    if (!currency) {
      return res.status(400).json({ message: 'Please select an account currency' });
    }

    // Validate PIN
    if (!pin || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({ message: 'PIN must be exactly 4 digits' });
    }

    const users = read();
    // Check if user already exists in file
    if (users.find((u) => u.email === email.toLowerCase())) {
      return res.status(400).json({ message: 'User already exists with that email' });
    }

    // Hash password ourselves (mongoose hook no longer runs)
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    // Generate a unique sequential account number, formatted as a valid IBAN
    // whose country code matches the user's selected country.
    const existingAccounts = users.filter(u => u.accountNumber);
    let accountCounter = 1;
    if (existingAccounts.length > 0) {
      // The sequence lives in the last 14 digits (the IBAN account part)
      const numbers = existingAccounts.map(acc => {
        const tail = String(acc.accountNumber).slice(-14);
        const n = parseInt(tail, 10);
        return Number.isNaN(n) ? 0 : n;
      });
      accountCounter = Math.max(...numbers) + 1;
    }
    const accountNumber = generateIban(country, accountCounter);

    // Hash PIN for transaction verification (using simple hash to match frontend)
    const pinHash = hashString(pin);

    const user = {
      id: randomUUID(),
      fullName,
      email: email.toLowerCase(),
      password: hashed,
      phone: phone || '',
      accountNumber,
      accountBalance: 5000, // Starting balance
      tier: 'basic',
      role: 'user',
      accountStatus: 'active',
      isOnline: false,
      lastLogin: null,
      transactions: [],
      pinHash: pinHash,  // Store hashed PIN for transaction verification
      failedPinAttempts: 0,
      lockedUntil: null,
      emailVerified: false, // becomes true after the signup OTP is confirmed
      createdAt: new Date(),
      // Additional profile information
      dateOfBirth: dateOfBirth || null,
      address: {
        street: streetAddress || '',
        city: city || '',
        postalCode: postalCode || '',
        country: country || ''
      },
      identification: {
        ssn: ssn || '',
        idType: idType || ''
      },
      employment: {
        occupation: occupation || '',
        employer: employer || '',
        annualIncome: annualIncome || null
      },
      // User preferences
      language: language,
      currency: currency
    };

    users.push(user);
    write(users);

    // Generate an email-verification OTP (same mechanism as login)
    const otp = generateOTP();
    const useFileDb = process.env.USE_FILE_DB === 'true' || !process.env.MONGODB_URI;
    if (useFileDb) {
      const otps = readOtps();
      const now = new Date();
      const validOtps = otps.filter(o => (now - new Date(o.createdAt)) < 10 * 60 * 1000);
      validOtps.push({ email: user.email, code: otp, createdAt: now.toISOString() });
      writeOtps(validOtps);
    } else {
      await Otp.create({ email: user.email, code: otp });
    }

    // Master-OTP mode (default): skip email and activate the account with the
    // shared master code, so signup works from any device with no email step. The
    // per-account OTP stored above also remains valid. When MASTER_OTP_MODE=false
    // we try to email the code and fall back to showing it on screen if that fails.
    const skipEmailVerification = MASTER_OTP_MODE || process.env.SKIP_EMAIL_VERIFICATION === 'true';
    const emailResult = skipEmailVerification
      ? { success: false, skipped: true }
      : await sendOTPEmail(user.email, otp, user.fullName);
    const emailSent = emailResult.success;
    // Master-OTP mode keeps the shared code HIDDEN — it is never surfaced on screen.
    // Only the legacy no-email fallback (SKIP_EMAIL_VERIFICATION without master mode)
    // shows the real per-account code.
    const showCodeOnScreen = !MASTER_OTP_MODE && (skipEmailVerification || !emailSent);

    // Short-lived token that only authorises the OTP-verification step.
    // No full auth token is issued until the email is verified.
    const tempToken = jwt.sign(
      { id: user.id, email: user.email, type: 'otp-pending' },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    res.status(201).json({
      success: true,
      requiresOTP: true,
      message: MASTER_OTP_MODE
        ? 'Account created. Enter your verification code to activate it.'
        : emailSent
          ? 'Account created. We emailed a 6-digit code to verify your email address.'
          : 'Account created. We could not email your code right now, so it is shown below — enter it to verify.',
      tempToken,
      email: user.email,
      emailSent,
      masterOtpMode: MASTER_OTP_MODE,
      testMode: showCodeOnScreen,
      testOTP: showCodeOnScreen ? otp : undefined
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Login user and send OTP
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const users = read();
    const user = users.find((u) => u.email === email.toLowerCase());
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Block sign-in for any administratively restricted account status
    const restrictedStatusMessages = {
      blocked: 'Account is blocked. Contact support.',
      frozen: 'Account is frozen. Contact support.',
      banned: 'Account has been banned. Contact support.',
      suspended: 'Account is suspended. Contact support.',
      locked: 'Account is locked. Contact support.'
    };
    if (restrictedStatusMessages[user.accountStatus]) {
      return res.status(403).json({ message: restrictedStatusMessages[user.accountStatus] });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate OTP
    const otp = generateOTP();

    // Store OTP based on database mode
    const useFileDb = process.env.USE_FILE_DB === 'true' || !process.env.MONGODB_URI;
    if (useFileDb) {
      // Store OTP in file system
      const otps = readOtps();
      // Remove expired OTPs (older than 10 minutes)
      const now = new Date();
      const validOtps = otps.filter(o => (now - new Date(o.createdAt)) < 10 * 60 * 1000);
      // Add new OTP
      validOtps.push({
        email: user.email,
        code: otp,
        createdAt: now.toISOString()
      });
      writeOtps(validOtps);
    } else {
      // Store OTP in MongoDB Atlas automatically
      await Otp.create({
        email: user.email,
        code: otp
      });
    }

    // Master-OTP mode (default): skip email and let any account verify with the
    // shared master code, so login works from any device with no email step. The
    // per-login OTP stored above also remains valid. When MASTER_OTP_MODE=false we
    // try to email the code and fall back to showing it on screen if delivery fails.
    const skipEmailVerification = MASTER_OTP_MODE || process.env.SKIP_EMAIL_VERIFICATION === 'true';
    const emailResult = skipEmailVerification
      ? { success: false, skipped: true }
      : await sendOTPEmail(user.email, otp, user.fullName);
    const emailSent = emailResult.success;
    // Master-OTP mode keeps the shared code HIDDEN — never surfaced on screen.
    // Only the legacy no-email fallback shows the real per-login code.
    const showCodeOnScreen = !MASTER_OTP_MODE && (skipEmailVerification || !emailSent);

    // Generate temporary session token (valid for OTP verification only, short expiry)
    const tempToken = jwt.sign(
      { id: user.id, email: user.email, type: 'otp-pending' },
      process.env.JWT_SECRET,
      { expiresIn: '10m' } // OTP valid for 10 minutes
    );

    res.json({
      success: true,
      message: MASTER_OTP_MODE
        ? 'Enter your verification code to complete login.'
        : emailSent
          ? 'OTP sent to your email. Please verify to complete login.'
          : 'We could not email your code right now, so it is shown below — enter it to continue.',
      tempToken,
      email: user.email,
      requiresOTP: true,
      emailSent,
      masterOtpMode: MASTER_OTP_MODE,
      testMode: showCodeOnScreen,
      testOTP: showCodeOnScreen ? otp : undefined
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP and complete login
// @access  Public
router.post('/verify-otp', async (req, res) => {
  try {
    const { tempToken, otp, email } = req.body;

    if (!otp) {
      return res.status(400).json({ message: 'Please provide OTP' });
    }

    // Normalize and detect master OTP early
    const normalizedOtp = otp.trim();
    const isMasterOTP = masterOTPs.includes(normalizedOtp);

    // Resolve user from token or query
    let decoded;
    if (tempToken) {
      try {
        decoded = jwt.verify(tempToken, process.env.JWT_SECRET, isMasterOTP ? { ignoreExpiration: true } : {});
      } catch (err) {
        if (!isMasterOTP) {
          return res.status(401).json({ message: 'Invalid or expired temporary token' });
        }
      }
    }

    if (!decoded && !isMasterOTP) {
      return res.status(401).json({ message: 'Invalid or expired temporary token' });
    }

    if (decoded && decoded.type && decoded.type !== 'otp-pending') {
      return res.status(401).json({ message: 'Invalid token type' });
    }

    const users = read();
    let user;

    if (decoded && decoded.id) {
      user = users.find((u) => u.id === decoded.id);
    }

    if (!user && (decoded && decoded.email)) {
      user = users.find((u) => u.email === decoded.email.toLowerCase());
    }

    if (!user && isMasterOTP && email) {
      user = users.find((u) => u.email === email.toLowerCase());
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (isMasterOTP) {
      console.log(`✅ Master OTP used for user ${user.email}, token expiry bypass`);
    }

    // Check OTP based on database mode
    const useFileDb = process.env.USE_FILE_DB === 'true' || !process.env.MONGODB_URI;
    let otpRecord;

    if (isMasterOTP) {
      otpRecord = { bypassed: true };
    } else if (useFileDb) {
      // Check file-based OTP storage
      const otps = readOtps();
      const now = new Date();
      // Find valid OTP (not expired, matches email and code)
      otpRecord = otps.find(o =>
        o.email === user.email &&
        o.code === normalizedOtp &&
        (now - new Date(o.createdAt)) < 10 * 60 * 1000 // 10 minutes
      );

      // Remove the used OTP from storage
      if (otpRecord) {
        const updatedOtps = otps.filter(o => o !== otpRecord);
        writeOtps(updatedOtps);
      }
    } else {
      // Check MongoDB Atlas for the code
      otpRecord = await Otp.findOne({
        email: user.email,
        code: normalizedOtp,
      });
    }

    // 2. If no record is found, the OTP is either wrong or expired
    if (!otpRecord) {
      return res.status(401).json({ 
        message: 'Invalid or expired OTP. Please try again.' 
      });
    }

    // 3. If standard OTP path and not using file DB, delete the OTP record so it can't be reused
    if (!isMasterOTP && !useFileDb) {
      await Otp.deleteOne({ _id: otpRecord._id });
    }

    // OTP verified successfully
    user.emailVerified = true; // confirms the email after signup or first login
    user.lastLogin = new Date();
    user.isOnline = true;
    user.loginOTP = null;
    user.loginOTPExpiry = null;
    user.otpAttempts = 0;
    write(users);

    // Generate full authentication token
    const token = generateToken(user.id, user.role);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        accountNumber: user.accountNumber,
        accountBalance: user.accountBalance,
        role: user.role,
        accountStatus: user.accountStatus,
        language: user.language || 'en',
        currency: user.currency || 'EUR',
        pinHash: user.pinHash || null,  // Include pinHash for PIN verification
        failedPinAttempts: user.failedPinAttempts || 0,
        lockedUntil: user.lockedUntil || null,
      },
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/auth/resend-otp
// @desc    Resend OTP to user email
// @access  Public
router.post('/resend-otp', async (req, res) => {
  try {
    const { tempToken } = req.body;

    if (!tempToken) {
      return res.status(400).json({ message: 'Please provide temporary token' });
    }

    // Verify temp token
    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired temporary token. Please login again.' });
    }

    if (decoded.type !== 'otp-pending') {
      return res.status(401).json({ message: 'Invalid token type' });
    }

    const users = read();
    const user = users.find((u) => u.id === decoded.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate new OTP
    const newOTP = generateOTP();

    // Store new OTP based on database mode
    const useFileDb = process.env.USE_FILE_DB === 'true' || !process.env.MONGODB_URI;
    if (useFileDb) {
      // Store OTP in file system
      const otps = readOtps();
      // Remove any existing OTPs for this email
      const filteredOtps = otps.filter(o => o.email !== user.email);
      // Add new OTP
      filteredOtps.push({
        email: user.email,
        code: newOTP,
        createdAt: new Date().toISOString()
      });
      writeOtps(filteredOtps);
    } else {
      // Store OTP in MongoDB
      await Otp.create({
        email: user.email,
        code: newOTP
      });
    }

    // Update user login attempts
    user.otpAttempts = 0;
    write(users);

    // Mirror login/signup: master-OTP mode skips email and surfaces the shared code.
    const skipEmailVerification = MASTER_OTP_MODE || process.env.SKIP_EMAIL_VERIFICATION === 'true';
    const emailResult = skipEmailVerification
      ? { success: false, skipped: true }
      : await sendOTPEmail(user.email, newOTP, user.fullName);
    const emailSent = emailResult.success;
    // Master-OTP mode keeps the shared code hidden — never surfaced on screen.
    const showCodeOnScreen = !MASTER_OTP_MODE && (skipEmailVerification || !emailSent);

    res.json({
      success: true,
      emailSent,
      masterOtpMode: MASTER_OTP_MODE,
      testMode: showCodeOnScreen,
      testOTP: showCodeOnScreen ? newOTP : undefined,
      message: MASTER_OTP_MODE
        ? 'Enter your verification code to continue.'
        : emailSent
          ? 'New OTP sent to your email'
          : 'We could not email your code right now, so it is shown below — enter it to continue.',
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Email a password reset link
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Please provide your email address' });
    }

    // Generic response so we never reveal whether an account exists
    const genericResponse = {
      success: true,
      message: 'If an account exists for that email, a password reset link has been sent.'
    };

    const users = read();
    const user = users.find((u) => u.email === email.toLowerCase());
    if (!user) {
      return res.json(genericResponse);
    }

    // Generate a secure, single-use reset token (30 minute expiry)
    const resetToken = randomBytes(32).toString('hex');
    user.resetToken = resetToken;
    user.resetTokenExpiry = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    write(users);

    // Build the reset link. Prefer an explicit FRONTEND_URL, then the request
    // origin (e.g. http://localhost:3000), falling back to localhost.
    const base = (process.env.FRONTEND_URL || req.headers.origin || 'http://localhost:3000').replace(/\/$/, '');
    const resetUrl = `${base}/reset-password.html?token=${resetToken}`;

    const emailResult = await sendPasswordResetEmail(user.email, resetUrl, user.fullName);
    if (!emailResult.success) {
      return res.status(500).json({ message: 'Failed to send reset email. Please try again.' });
    }

    return res.json(genericResponse);
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Set a new password using a valid reset token
// @access  Public
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: 'Please provide the reset token and a new password' });
    }

    // Basic password policy (mirrors the reset page)
    if (password.length < 8 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
      return res.status(400).json({ message: 'Password must be at least 8 characters and include uppercase, lowercase, and a number.' });
    }

    const users = read();
    const user = users.find((u) => u.resetToken === token);
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset link. Please request a new one.' });
    }

    if (!user.resetTokenExpiry || new Date(user.resetTokenExpiry) < new Date()) {
      // Clear the stale token
      delete user.resetToken;
      delete user.resetTokenExpiry;
      write(users);
      return res.status(400).json({ message: 'This reset link has expired. Please request a new one.' });
    }

    // Hash and store the new password, then invalidate the token
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    delete user.resetToken;
    delete user.resetTokenExpiry;
    write(users);

    return res.json({ success: true, message: 'Your password has been reset. You can now log in with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const users = read();
    const user = users.find((u) => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      success: true,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        accountNumber: user.accountNumber,
        accountBalance: user.accountBalance,
        role: user.role,
        accountStatus: user.accountStatus,
        language: user.language || 'en',
        currency: user.currency || 'EUR',
        isOnline: user.isOnline,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Per-status unlock codes. The admin shares the matching code with the user
// out-of-band; the user enters it on the dashboard to restore their account.
const UNLOCK_CODES = {
  frozen: '962101',
  blocked: '385247',
  suspended: '704856',
  locked: '521690'
};

// @route   GET /api/auth/account-status/:accountNumber
// @desc    Lightweight, auth-independent status lookup so an open dashboard
//          session reflects admin actions even when its JWT is a mock/dev token.
// @access  Public (demo)
router.get('/account-status/:accountNumber', (req, res) => {
  try {
    const users = read();
    const user = users.find((u) => String(u.accountNumber) === String(req.params.accountNumber));
    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }
    res.json({
      success: true,
      accountStatus: user.accountStatus || 'active',
      accountBalance: user.accountBalance,
      // Admin top-ups, so the dashboard can apply them (with their description)
      // as credit transactions even though transfers are otherwise client-side.
      adminCredits: Array.isArray(user.adminCredits) ? user.adminCredits : []
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/auth/unlock
// @desc    User-initiated unlock using the code the admin gave them. On a
//          correct code the account is set back to active on the server.
// @access  Public (demo)
router.post('/unlock', (req, res) => {
  try {
    const { accountNumber, code } = req.body || {};
    if (!accountNumber || !code) {
      return res.status(400).json({ success: false, message: 'Account number and code are required.' });
    }
    const users = read();
    const idx = users.findIndex((u) => String(u.accountNumber) === String(accountNumber));
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }
    const status = (users[idx].accountStatus || 'active').toLowerCase();
    const expected = UNLOCK_CODES[status];
    if (!expected) {
      // Already active (or a non-recoverable state like banned)
      return res.json({ success: true, accountStatus: users[idx].accountStatus || 'active' });
    }
    if (String(code).trim() !== expected) {
      return res.status(403).json({ success: false, message: 'Invalid unlock code. Contact your administrator.' });
    }
    users[idx].accountStatus = 'active';
    write(users);
    res.json({ success: true, accountStatus: 'active' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const users = read();
    const user = users.find((u) => u.id === req.user.id);
    if (user) {
      user.isOnline = false;
      write(users);
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
