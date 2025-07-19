import { generateSMSCode, storeVerificationToken, sendSMSVerification } from '../../../lib/emailService';
import pool from '../../../lib/db';
import errorHandler from '../../../lib/errorHandler';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { userId } = req.body;

  try {
    // If no userId provided, try to find the most recent unverified user
    let targetUserId = userId;
    
    if (!targetUserId) {
      const recentUser = await pool.query(
        `SELECT id, full_name, phone FROM users 
         WHERE phone_verified = false AND account_status = 'pending_verification'
         ORDER BY id DESC LIMIT 1`
      );
      
      if (recentUser.rows.length === 0) {
        return res.status(404).json({ message: 'لم يتم العثور على حساب يحتاج تأكيد الهاتف' });
      }
      
      targetUserId = recentUser.rows[0].id;
    }

    // Get user info
    const user = await pool.query(
      'SELECT full_name, phone, phone_verified FROM users WHERE id = $1',
      [targetUserId]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    if (user.rows[0].phone_verified) {
      return res.status(400).json({ message: 'رقم الهاتف مؤكد بالفعل' });
    }

    // Check if user has requested SMS recently (rate limiting)
    const recentSMS = await pool.query(
      `SELECT created_at FROM verification_tokens 
       WHERE user_id = $1 AND type = 'phone' 
       AND created_at > NOW() - INTERVAL '1 minute'`,
      [targetUserId]
    );

    if (recentSMS.rows.length > 0) {
      return res.status(429).json({ 
        message: 'يرجى الانتظار دقيقة واحدة قبل طلب رمز جديد' 
      });
    }

    // Generate and send new SMS code
    const smsCode = generateSMSCode();
    await storeVerificationToken(targetUserId, smsCode, 'phone');
    await sendSMSVerification(user.rows[0].phone, smsCode, user.rows[0].full_name);

    res.status(200).json({ 
      message: 'تم إرسال رمز تحقق جديد إلى هاتفك' 
    });
  } catch (err) {
    errorHandler(err, res);
  }
}