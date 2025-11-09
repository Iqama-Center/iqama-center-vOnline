import pool from '../../../lib/db';
import jwt from 'jsonwebtoken';
import errorHandler from '../../../lib/errorHandler';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { userIds, type, message, link } = req.body;

        // Validate required fields
        if (!userIds || !Array.isArray(userIds) || !type || !message) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Refactored to use a single bulk insert query for performance
        const result = await pool.query(
            `
            INSERT INTO notifications (user_id, type, message, link, created_at)
            SELECT user_id, $2, $3, $4, CURRENT_TIMESTAMP
            FROM unnest($1::int[]) as user_id
            RETURNING *
            `,
            [
                userIds,
                type,
                message,
                link || null
            ]
        );

        res.status(201).json({ 
            message: 'تم إرسال الإشعارات بنجاح',
            notifications: result.rows
        });

    } catch (err) {
        console.error('Create notification error:', err);
        errorHandler(err, res);
    }
}