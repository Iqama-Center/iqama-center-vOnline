import pool from '../../../lib/db';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    // Check if JWT_SECRET is available (build safety)
    if (!process.env.JWT_SECRET) {
        return res.status(500).json({ message: 'Server configuration error' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        // Get notifications directly from database
        const result = await pool.query(
            `SELECT id, type, title, message, link, is_read, created_at 
             FROM notifications 
             WHERE user_id = $1 
             ORDER BY created_at DESC 
             LIMIT $2`,
            [userId, 20]
        );

        res.status(200).json(result.rows);
    } catch (err) {
        // Log error in development only
        if (process.env.NODE_ENV === 'development') {
            console.error("Get notifications error:", err);
        }
        res.status(500).json({ message: 'Error fetching notifications.' });
    }
}

// Using getNotifications from queryOptimizer instead of local function
