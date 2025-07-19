import pool from '../../../../lib/db';
import jwt from 'jsonwebtoken';
import errorHandler from '../../../../lib/errorHandler';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { id } = req.query;
        const { message_id } = req.query;

        // Check if user is enrolled in this course
        const enrollment = await pool.query(
            'SELECT * FROM enrollments WHERE user_id = $1 AND course_id = $2 AND status = $3',
            [decoded.id, id, 'active']
        );

        if (enrollment.rows.length === 0) {
            return res.status(403).json({ message: 'You are not enrolled in this course' });
        }

        // Get replies for the message
        const replies = await pool.query(`
            SELECT 
                cm.*,
                u.full_name as author_name,
                u.role as author_role
            FROM course_messages cm
            JOIN users u ON cm.user_id = u.id
            WHERE cm.course_id = $1 AND cm.parent_message_id = $2
            ORDER BY cm.created_at ASC`,
            [id, message_id]
        );

        res.status(200).json(replies.rows);

    } catch (err) {
        console.error("Course message replies error:", err);
        errorHandler(err, res);
    }
}