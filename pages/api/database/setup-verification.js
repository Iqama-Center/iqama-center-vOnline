import pool from '../../../lib/db';
import errorHandler from '../../../lib/errorHandler';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // Add verification columns to users table
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'pending_verification'
    `);

    // Create verification tokens table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS verification_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('email', 'phone')),
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, type)
      )
    `);

    // Create indexes for faster token lookups
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON verification_tokens(token)
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_verification_tokens_user_type ON verification_tokens(user_id, type)
    `);

    // Update existing users to have email_verified = true (for backward compatibility)
    await pool.query(`
      UPDATE users SET email_verified = true WHERE email_verified IS NULL
    `);

    res.status(200).json({ 
      message: 'تم إعداد جداول التحقق بنجاح' 
    });
  } catch (err) {
    console.error('Database setup error:', err);
    errorHandler(err, res);
  }
}