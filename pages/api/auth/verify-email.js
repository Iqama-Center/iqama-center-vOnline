import { verifyToken, markUserAsVerified } from '../../../lib/emailService';
import pool from '../../../lib/db';
import errorHandler from '../../../lib/errorHandler';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: 'رمز التحقق مطلوب' });
  }

  try {
    // Verify the token
    const verification = await verifyToken(token, 'email');
    
    if (!verification) {
      return res.status(400).json({ 
        message: 'رمز التحقق غير صحيح أو منتهي الصلاحية' 
      });
    }

    // Mark user as email verified
    await markUserAsVerified(verification.user_id, 'email');

    // Check if phone is also verified to update account status
    const user = await pool.query(
      'SELECT phone_verified FROM users WHERE id = $1',
      [verification.user_id]
    );

    if (user.rows[0].phone_verified) {
      // Both email and phone verified, activate account
      await pool.query(
        'UPDATE users SET account_status = $1 WHERE id = $2',
        ['pending_approval', verification.user_id]
      );
    }

    res.status(200).json({ 
      message: 'تم تأكيد البريد الإلكتروني بنجاح! يرجى تأكيد رقم الهاتف لإكمال التسجيل.' 
    });
  } catch (err) {
    errorHandler(err, res);
  }
}