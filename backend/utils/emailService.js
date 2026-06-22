const nodemailer = require('nodemailer');

// Create transporter - uses Gmail or your email service
// For production, use environment variables for credentials
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password'
  },
  // Fail fast instead of hanging. Some hosts (e.g. Render's free tier) block
  // outbound SMTP, which would otherwise stall the connection for ~minute. With
  // these caps a blocked/unreachable SMTP server errors out in a few seconds and
  // the caller can fall back to on-screen code entry.
  connectionTimeout: 8000,
  greetingTimeout: 8000,
  socketTimeout: 8000
});

// Generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP email
async function sendOTPEmail(userEmail, otp, userName) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@vanstrabank.com',
      to: userEmail,
      subject: 'Your Vanstra Bank Login OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #041225 0%, #0B2A3F 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Vanstra Bank</h1>
            <p style="margin: 5px 0 0 0; font-size: 14px;">Secure Login Verification</p>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1f2937; margin-top: 0;">Hi ${userName},</h2>
            
            <p style="color: #374151; line-height: 1.6;">
              You're attempting to log into your Vanstra Bank account. To complete your login, please use the verification code below:
            </p>
            
            <div style="background: white; border: 2px dashed #C89A3A; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <p style="color: #6B7280; font-size: 12px; margin: 0 0 10px 0;">VERIFICATION CODE</p>
              <p style="color: #C89A3A; font-size: 32px; font-weight: bold; letter-spacing: 2px; margin: 0; font-family: 'Courier New', monospace;">
                ${otp}
              </p>
            </div>
            
            <p style="color: #374151; line-height: 1.6;">
              <strong>Important:</strong>
            </p>
            <ul style="color: #374151; line-height: 1.8;">
              <li>This code will expire in 10 minutes</li>
              <li>Never share this code with anyone</li>
              <li>Vanstra Bank staff will never ask for your OTP</li>
              <li>If you didn't attempt to log in, please ignore this email</li>
            </ul>
            
            <p style="color: #6B7280; font-size: 12px; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
              This is an automated message. Please do not reply to this email. For support, visit our website or contact our help desk.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #6B7280; font-size: 11px;">
            <p>&copy; 2024 Vanstra Bank. All rights reserved.</p>
          </div>
        </div>
      `,
      text: `Your Vanstra Bank login verification code is: ${otp}. This code will expire in 10 minutes. Do not share this code with anyone.`
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ OTP email sent successfully to', userEmail);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Error sending OTP email:', error);
    return { success: false, error: error.message };
  }
}

// Send welcome email
async function sendWelcomeEmail(userEmail, userName) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@vanstrabank.com',
      to: userEmail,
      subject: 'Welcome to Vanstra Bank',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #041225 0%, #0B2A3F 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Vanstra Bank</h1>
            <p style="margin: 5px 0 0 0; font-size: 14px;">Welcome Aboard</p>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1f2937; margin-top: 0;">Welcome, ${userName}!</h2>
            
            <p style="color: #374151; line-height: 1.6;">
              Your Vanstra Bank account has been successfully created. You can now enjoy secure banking with advanced features and services.
            </p>
            
            <p style="color: #374151; line-height: 1.6;">
              <strong>Getting Started:</strong>
            </p>
            <ul style="color: #374151; line-height: 1.8;">
              <li>Complete your profile for enhanced features</li>
              <li>Set up your security preferences</li>
              <li>Enable two-factor authentication for added security</li>
              <li>Explore our mobile app for banking on the go</li>
            </ul>
            
            <p style="color: #374151; line-height: 1.6;">
              If you have any questions, our support team is here to help. Contact us anytime through the platform.
            </p>
          </div>
        </div>
      `,
      text: `Welcome to Vanstra Bank, ${userName}! Your account has been created successfully.`
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Welcome email sent successfully to', userEmail);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
}

// Send password reset email
async function sendPasswordResetEmail(userEmail, resetUrl, userName) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@vanstrabank.com',
      to: userEmail,
      subject: 'Reset Your Vanstra Bank Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #041225 0%, #0B2A3F 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Vanstra Bank</h1>
            <p style="margin: 5px 0 0 0; font-size: 14px;">Password Reset Request</p>
          </div>

          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1f2937; margin-top: 0;">Hi ${userName},</h2>

            <p style="color: #374151; line-height: 1.6;">
              We received a request to reset the password for your Vanstra Bank account. Click the button below to choose a new password:
            </p>

            <div style="text-align: center; margin: 28px 0;">
              <a href="${resetUrl}" style="display: inline-block; background: #C89A3A; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Reset Password
              </a>
            </div>

            <p style="color: #6B7280; font-size: 13px; line-height: 1.6;">
              Or copy and paste this link into your browser:<br>
              <a href="${resetUrl}" style="color: #C89A3A; word-break: break-all;">${resetUrl}</a>
            </p>

            <p style="color: #374151; line-height: 1.6;"><strong>Important:</strong></p>
            <ul style="color: #374151; line-height: 1.8;">
              <li>This link will expire in 30 minutes</li>
              <li>If you didn't request a password reset, you can safely ignore this email</li>
              <li>Your password will not change until you create a new one</li>
            </ul>

            <p style="color: #6B7280; font-size: 12px; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
              This is an automated message. Please do not reply to this email. For support, visit our website or contact our help desk.
            </p>
          </div>

          <div style="text-align: center; margin-top: 20px; color: #6B7280; font-size: 11px;">
            <p>&copy; 2024 Vanstra Bank. All rights reserved.</p>
          </div>
        </div>
      `,
      text: `Hi ${userName}, reset your Vanstra Bank password using this link (expires in 30 minutes): ${resetUrl} . If you didn't request this, ignore this email.`
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent successfully to', userEmail);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  generateOTP,
  sendOTPEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  transporter
};
