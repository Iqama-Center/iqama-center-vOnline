import pool from '../../../../lib/db';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { id } = req.query; // payment ID
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userRole = decoded.role;

    // Only finance or admin can reject payments
    if (userRole !== 'finance' && userRole !== 'admin') {
      return res.status(403).json({ message: 'غير مصرح لك برفض الدفعات.' });
    }

    // Revert status to 'due' and clear confirmation info
    const result = await pool.query(
      `UPDATE payments SET status = 'due', confirmed_by = NULL, paid_at = NULL, payment_proof_url = NULL WHERE id = $1 AND status = 'pending_review' RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'الدفع غير موجود أو لا يمكن رفضه.' });
    }

    res.status(200).json({ message: 'تم رفض الدفع بنجاح وإعادته للحالة المستحقة.', payment: result.rows[0] });
  } catch (err) {
    console.error("Reject Payment Error:", err);
    res.status(500).json({ message: 'حدث خطأ في الخادم.' });
  }
}