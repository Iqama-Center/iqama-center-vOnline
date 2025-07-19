import { verifyToken, markUserAsVerified } from '../../../lib/emailService';
import pool from '../../../lib/db';
import errorHandler from '../../../lib/errorHandler';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ message: 'رمز التحقق مطلوب' });
  }

  if (code.length !== 6) {
    return res.status(400).json({ message: 'رمز التحقق يجب أن يكون 6 أرقام' });
  }

  try {
    // Verify the SMS code
    const verification = await verifyToken(code, 'phone');
    
    if (!verification) {
      return res.status(400).json({ 
        message: 'رمز التحقق غير صحيح أو منتهي الصلاحية' 
      });
    }

    // Mark user as phone verified
    await markUserAsVerified(verification.user_id, 'phone');

    // Check if email is also verified to update account status
    const user = await pool.query(
      'SELECT email_verified FROM users WHERE id = $1',
      [verification.user_id]
    );

    if (user.rows[0].email_verified) {
      // Both email and phone verified, move to pending approval
      await pool.query(
        'UPDATE users SET account_status = $1 WHERE id = $2',
        ['pending_approval', verification.user_id]
      );

      // Notify admins about completed verification
      const adminUsers = await pool.query(
        "SELECT id FROM users WHERE role = 'admin'"
      );

      const userInfo = await pool.query(
        'SELECT full_name, role FROM users WHERE id = $1',
        [verification.user_id]
      );

      for (const admin of adminUsers.rows) {
        await pool.query(
          `INSERT INTO notifications (user_id, type, message, link, created_at) 
           VALUES ($1, 'announcement', $2, $3, CURRENT_TIMESTAMP)`,
          [
            admin.id, 
            `تم التحقق من ${userInfo.rows[0].full_name} - جاهز للموافقة`,
            `/admin/users?pending=${verification.user_id}`
          ]
        );
      }
    }

    res.status(200).json({ 
      message: 'تم تأكيد رقم الهاتف بنجاح! تم إكمال التسجيل وسيتم مراجعة حسابك قريباً.' 
    });
  } catch (err) {
    errorHandler(err, res);
  }
}