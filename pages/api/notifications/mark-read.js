import pool from '../../../lib/db';
import jwt from 'jsonwebtoken';



export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        await pool.query(
            'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
            [userId]
        );

        res.status(200).json({ message: 'Notifications marked as read.' });
    } catch (err) {
        console.error("Mark read error:", err);
        res.status(500).json({ message: 'Error marking notifications as read.' });
    }
}
