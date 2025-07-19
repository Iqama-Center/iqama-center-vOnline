import pool from '../../../lib/db';
import jwt from 'jsonwebtoken';



export default async function handler(req, res) {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const result = await pool.query(
            'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false',
            [userId]
        );

        const count = parseInt(result.rows[0].count, 10);
        res.status(200).json({ count });
    } catch (err) {
        console.error("Get unread count error:", err);
        res.status(500).json({ message: 'Error fetching unread count.' });
    }
}
