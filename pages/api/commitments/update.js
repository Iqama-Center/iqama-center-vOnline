import pool from '../../../lib/db';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    const { commitment, status } = req.body;

    if (!commitment || typeof status === 'undefined') {
      return res.status(400).json({ message: 'الرجاء توفير اسم الالتزام وحالته.' });
    }

    // Fetch current commitments for the day
    const result = await pool.query(
      `SELECT commitments FROM daily_commitments WHERE user_id = $1 AND commitment_date = CURRENT_DATE`,
      [userId]
    );

    let currentCommitments = {};
    if (result.rows.length > 0) {
      currentCommitments = result.rows[0].commitments;
    }

    // Update the specific commitment
    currentCommitments[commitment] = status;

    // Upsert (insert or update) the daily commitments
    await pool.query(
      `INSERT INTO daily_commitments (user_id, commitment_date, commitments)
       VALUES ($1, CURRENT_DATE, $2)
       ON CONFLICT (user_id, commitment_date) DO UPDATE SET commitments = $2`,
      [userId, currentCommitments]
    );

    res.status(200).json({ message: 'تم تحديث الالتزام بنجاح.' });
  } catch (err) {
    console.error("Update Commitment Error:", err);
    res.status(500).json({ message: 'حدث خطأ في الخادم.' });
  }
}
