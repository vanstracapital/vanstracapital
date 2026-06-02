# Email OTP Login Implementation Guide

## Overview

Your Vanstra Bank platform now has a complete **Email OTP (One-Time Password)** verification system. Every user must verify their email with an OTP code after successful login to complete authentication.

## System Flow

### User Login Process
1. User enters email and password on **login.html**
2. Backend verifies credentials
3. If valid, system generates a 6-digit OTP and sends it via email
4. User is redirected to **verify-otp.html** with a temporary token
5. User enters the 6-digit code
6. Backend verifies the OTP
7. User receives full authentication token and is redirected to dashboard

### Security Features
- **OTP Expiry**: 10 minutes
- **Attempt Limiting**: 5 failed attempts before lockout
- **Temporary Tokens**: Short-lived tokens valid only for OTP verification
- **Email Confirmation**: Secure email delivery confirmation
- **Rate Limiting**: Resend OTP with 60-second cooldown

## Setup Instructions

### 1. Install Dependencies

Run the following command in the `/backend` directory:

```bash
npm install nodemailer
```

### 2. Configure Email Service

Create or update your `.env` file in the `/backend` directory with email credentials:

```env
# Gmail Configuration (Recommended)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password

# Or use another email service by modifying emailService.js

JWT_SECRET=your-jwt-secret
JWT_EXPIRE=24h
```

#### Getting Gmail App Password

If using Gmail:
1. Enable 2-Factor Authentication on your Google Account
2. Go to [Google Account Security](https://myaccount.google.com/security)
3. Find "App passwords" section
4. Generate a new app password for "Mail" and "Windows"
5. Use this 16-character password in `EMAIL_PASSWORD`

#### Alternative Email Services

To use SendGrid, Mailgun, or other services, modify `backend/utils/emailService.js`:

```javascript
// Example for SendGrid
const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY
  }
});
```

### 3. Start the Backend Server

```bash
cd backend
npm install  # Install nodemailer
npm start
```

The server should now be running with email OTP support at `http://localhost:5000`

## Files Modified/Created

### Backend Files

#### 1. `backend/utils/emailService.js` (NEW)
- Handles all email operations
- Generates OTP codes
- Sends formatted HTML emails
- Functions:
  - `generateOTP()` - Creates 6-digit random code
  - `sendOTPEmail()` - Sends OTP to user email
  - `sendWelcomeEmail()` - Sends welcome email on signup

#### 2. `backend/routes/auth.js` (MODIFIED)
- **Modified `/api/auth/login**
  - Now sends OTP instead of full token
  - Returns temporary token valid for 10 minutes
  - Stores OTP in user record
  
- **New `/api/auth/verify-otp`** (POST)
  - Verifies user-entered OTP
  - Returns full authentication token on success
  - Tracks failed attempts
  
- **New `/api/auth/resend-otp`** (POST)
  - Allows users to request a new OTP
  - Rate-limited to 60-second intervals
  - Resets attempt counter

#### 3. `backend/package.json` (MODIFIED)
- Added nodemailer dependency

### Frontend Files

#### 1. `login.html` (MODIFIED)
- Updated `handleLogin()` function
- Now calls `/api/auth/login` endpoint
- Redirects to OTP verification page on success
- Shows error messages from backend

#### 2. `verify-otp.html` (NEW)
- Beautiful OTP verification interface
- 6 individual digit input fields
- Supports:
  - Individual digit input
  - Paste full code
  - Backspace navigation
  - Auto-focus on first digit
  - Resend OTP with 60-second timer
- Functions:
  - `handleOTPSubmit()` - Verifies entered OTP
  - `handleResendOTP()` - Requests new OTP
  - `startResendTimer()` - 60-second cooldown timer

## API Endpoints

### POST `/api/auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "userPassword123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "OTP sent to your email. Please verify to complete login.",
  "tempToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "email": "user@example.com",
  "requiresOTP": true
}
```

**Error Response (401):**
```json
{
  "message": "Invalid credentials"
}
```

### POST `/api/auth/verify-otp`

**Request:**
```json
{
  "tempToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "otp": "123456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-id",
    "fullName": "John Doe",
    "email": "user@example.com",
    "accountNumber": "DE12345",
    "accountBalance": 5000,
    "role": "user",
    "accountStatus": "active"
  }
}
```

**Error Response (401):**
```json
{
  "message": "Invalid OTP. Please try again.",
  "attemptsRemaining": 3
}
```

### POST `/api/auth/resend-otp`

**Request:**
```json
{
  "tempToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "New OTP sent to your email"
}
```

## User Experience

### Login Screen
1. User enters email and password
2. **Sign In** button submits form
3. Backend validates credentials
4. OTP email is sent
5. User is redirected to verification page

### OTP Verification Screen
1. **Email Display**: Shows masked email address
2. **6 Digit Inputs**: User enters code from email
3. **Verify Code Button**: Submits OTP for verification
4. **Resend Code Option**: With 60-second cooldown
5. **Back to Login Link**: Returns to login page if needed

### Success
- Account status message displayed
- Dashboard loads automatically
- User is fully authenticated

### Error Handling
- **Invalid Credentials**: Clear error on login page
- **Invalid OTP**: Shows attempt count remaining
- **Expired OTP**: User prompted to request new code
- **Expired Session**: User redirected to login
- **Network Errors**: Descriptive error messages

## Testing

### Test Scenarios

#### Test 1: Valid Login Flow
1. Go to login.html
2. Enter valid email and password
3. Should see OTP verification page
4. Enter OTP from email
5. Should redirect to dashboard

#### Test 2: Invalid Credentials
1. Enter non-existent email
2. See "Invalid credentials" error
3. Try with wrong password
4. See "Invalid credentials" error

#### Test 3: OTP Verification
1. Complete login
2. Enter wrong OTP
3. See "Invalid OTP" with attempts remaining
4. After 5 failed attempts
5. See "Too many failed attempts" message

#### Test 4: Resend OTP
1. Complete login
2. Click "Resend Code"
3. Should see 60-second timer
4. After 60 seconds, button becomes available again

#### Test 5: OTP Expiry
1. Complete login
2. Wait 10+ minutes
3. Try to enter OTP
4. See "OTP has expired" message

### Demo Credentials

If using seed data:
```
Email: test@example.com
Password: Test1234!
```

Replace with actual test user emails from your database.

## Troubleshooting

### Issue: Emails Not Being Sent

**Check:**
1. EMAIL_USER and EMAIL_PASSWORD in .env are correct
2. Gmail app password (not regular password) is used
3. Less Secure Apps option enabled (if using Gmail)
4. Backend server is running without errors

**Solution:**
```bash
# Check backend logs
npm start

# Verify .env file
cat .env

# Test email service directly in Node.js
const emailService = require('./utils/emailService');
emailService.sendOTPEmail('test@example.com', '123456', 'Test User').then(console.log);
```

### Issue: "Invalid or expired temporary token"

**Cause:** Token expired (10 minute validity)

**Solution:**
1. User must log in again
2. OTP token is refreshed on new login

### Issue: CORS Errors

**Cause:** Frontend and backend on different ports

**Solution:**
Ensure CORS is enabled in `backend/server.js`:
```javascript
app.use(cors({
  origin: 'http://localhost:3000', // Adjust port as needed
  credentials: true
}));
```

### Issue: "We've sent a 6-digit code to your email" but email not received

**Check:**
1. Check spam/junk folder
2. Verify email address is correct
3. Check backend logs for errors
4. Confirm EMAIL_USER and EMAIL_PASSWORD are set

## Customization

### Change OTP Expiry Time

In `backend/routes/auth.js`, modify (line ~110):
```javascript
const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // Change 10 to desired minutes
```

### Change OTP Attempt Limit

In `backend/routes/auth.js`, modify (line ~173):
```javascript
if ((user.otpAttempts || 0) >= 5) { // Change 5 to desired limit
```

### Customize Email Template

Edit `backend/utils/emailService.js` to modify the HTML email template

### Customize OTP Input Page

Edit `verify-otp.html` to change:
- Colors (update #C89A3A and #041225)
- Fonts (modify Inter font imports)
- Messages and labels
- Input box styling

## Security Considerations

### Best Practices Implemented
✅ OTP expires after 10 minutes  
✅ Limited to 5 failed attempts  
✅ Temporary tokens for OTP flow  
✅ OTP never exposed in client code  
✅ Attempt counter prevents brute force  
✅ Email verification confirms delivery  

### Additional Recommendations

1. **Rate Limiting**: Implement global rate limiting on login endpoint
2. **Audit Logging**: Log all OTP requests and verification attempts
3. **Email Validation**: Validate email format on both frontend and backend
4. **HTTPS Only**: Always use HTTPS in production
5. **OTP Transmission**: Consider SMS for OTP as alternative/backup

## Production Deployment

Before deploying to production:

1. **Set Strong JWT Secret**
   ```bash
   export JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
   ```

2. **Use Environment Variables**
   - Never hardcode email credentials
   - Use secure vault (AWS Secrets Manager, HashiCorp Vault, etc.)

3. **Enable HTTPS**
   - Install SSL certificate
   - Redirect HTTP to HTTPS
   - Set secure cookie flags

4. **Configure Email Service**
   - Use SendGrid, Mailgun, or AWS SES for production emails
   - Implement email templates with MJML or similar

5. **Implement Monitoring**
   - Monitor OTP success/failure rates
   - Alert on unusual patterns
   - Track email delivery failures

6. **Set Up Backups**
   - Regular database backups
   - Store OTP audit logs securely

## Support

For issues or questions:

1. Check the **Troubleshooting** section above
2. Review backend logs: `npm start` output
3. Check browser console: F12 → Console tab
4. Verify .env configuration
5. Test API endpoints using curl or Postman

---

**Version:** 1.0  
**Last Updated:** March 18, 2026  
**Status:** Production Ready
