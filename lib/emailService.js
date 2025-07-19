// Email verification service
import crypto from 'crypto';
import pool from './db';

// Generate verification token
export const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Store verification token in database
export const storeVerificationToken = async (userId, token, type = 'email') => {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  await pool.query(
    `INSERT INTO verification_tokens (user_id, token, type, expires_at) 
     VALUES ($1, $2, $3, $4) 
     ON CONFLICT (user_id, type) 
     DO UPDATE SET token = $2, expires_at = $4, created_at = CURRENT_TIMESTAMP`,
    [userId, token, type, expiresAt]
  );
  
  return token;
};

// Verify token
export const verifyToken = async (token, type = 'email') => {
  const result = await pool.query(
    `SELECT user_id, expires_at FROM verification_tokens 
     WHERE token = $1 AND type = $2 AND expires_at > CURRENT_TIMESTAMP`,
    [token, type]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return result.rows[0];
};

// Mark user as verified
export const markUserAsVerified = async (userId, type = 'email') => {
  if (type === 'email') {
    await pool.query(
      'UPDATE users SET email_verified = true WHERE id = $1',
      [userId]
    );
  } else if (type === 'phone') {
    await pool.query(
      'UPDATE users SET phone_verified = true WHERE id = $1',
      [userId]
    );
  }
  
  // Remove used token
  await pool.query(
    'DELETE FROM verification_tokens WHERE user_id = $1 AND type = $2',
    [userId, type]
  );
};

// Send verification email (using a simple approach - in production use SendGrid, AWS SES, etc.)
export const sendVerificationEmail = async (email, token, fullName) => {
  const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
  
  // For now, we'll log the verification URL (in production, send actual email)
  console.log(`
    📧 Email Verification for ${fullName}
    Email: ${email}
    Verification URL: ${verificationUrl}
    
    In production, this would be sent via email service.
  `);
  
  // TODO: Implement actual email sending
  // Example with nodemailer or SendGrid:
  /*
  const transporter = nodemailer.createTransporter({...});
  await transporter.sendMail({
    from: process.env.FROM_EMAIL,
    to: email,
    subject: 'تأكيد البريد الإلكتروني - مركز إقامة الكتاب',
    html: `
      <div dir="rtl">
        <h2>مرحباً ${fullName}</h2>
        <p>يرجى النقر على الرابط التالي لتأكيد بريدك الإلكتروني:</p>
        <a href="${verificationUrl}">تأكيد البريد الإلكتروني</a>
        <p>هذا الرابط صالح لمدة 24 ساعة.</p>
      </div>
    `
  });
  */
  
  return true;
};

// Generate SMS verification code (6 digits)
export const generateSMSCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send SMS verification (free option using console log for now)
export const sendSMSVerification = async (phone, code, fullName) => {
  // For development/testing - log the code
  console.log(`
    📱 SMS Verification for ${fullName}
    Phone: ${phone}
    Verification Code: ${code}
    
    In production, this would be sent via SMS service.
    Free options: Twilio (trial), AWS SNS (pay-per-use), or integration with local SMS providers.
  `);
  
  // TODO: Implement actual SMS sending
  // Free/cheap options:
  // 1. Twilio (free trial, then pay-per-SMS)
  // 2. AWS SNS (pay-per-SMS, very cheap)
  // 3. Local SMS providers in your region
  
  return true;
};