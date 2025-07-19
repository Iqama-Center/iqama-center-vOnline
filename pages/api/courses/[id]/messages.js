import pool from '../../../../lib/db';
import jwt from 'jsonwebtoken';
import errorHandler from '../../../../lib/errorHandler';

export default async function handler(req, res) {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { id } = req.query;

        // Check if user is enrolled in this course
        const enrollment = await pool.query(
            'SELECT * FROM enrollments WHERE user_id = $1 AND course_id = $2 AND status = $3',
            [decoded.id, id, 'active']
        );

        if (enrollment.rows.length === 0) {
            return res.status(403).json({ message: 'You are not enrolled in this course' });
        }

        if (req.method === 'GET') {
            // Get course messages
            const messages = await pool.query(`
                SELECT 
                    cm.*,
                    u.full_name as author_name,
                    u.role as author_role,
                    (SELECT COUNT(*) FROM course_messages WHERE parent_message_id = cm.id) as reply_count
                FROM course_messages cm
                JOIN users u ON cm.user_id = u.id
                WHERE cm.course_id = $1 AND cm.parent_message_id IS NULL
                ORDER BY cm.created_at DESC
                LIMIT 50`,
                [id]
            );

            res.status(200).json(messages.rows);

        } else if (req.method === 'POST') {
            // Create new message
            const { message, message_type, parent_message_id } = req.body;

            if (!message || message.trim().length === 0) {
                return res.status(400).json({ message: 'Message content is required' });
            }

            const newMessage = await pool.query(`
                INSERT INTO course_messages (course_id, user_id, message, message_type, parent_message_id)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *`,
                [id, decoded.id, message.trim(), message_type || 'general', parent_message_id || null]
            );

            // Get author info
            const messageWithAuthor = await pool.query(`
                SELECT 
                    cm.*,
                    u.full_name as author_name,
                    u.role as author_role
                FROM course_messages cm
                JOIN users u ON cm.user_id = u.id
                WHERE cm.id = $1`,
                [newMessage.rows[0].id]
            );

            // Notify other course participants (except the sender)
            const participants = await pool.query(`
                SELECT DISTINCT e.user_id 
                FROM enrollments e 
                WHERE e.course_id = $1 AND e.status = 'active' AND e.user_id != $2`,
                [id, decoded.id]
            );

            for (const participant of participants.rows) {
                await pool.query(`
                    INSERT INTO notifications (user_id, type, message, related_id)
                    VALUES ($1, $2, $3, $4)`,
                    [
                        participant.user_id,
                        'course_message',
                        `رسالة جديدة من ${messageWithAuthor.rows[0].author_name}`,
                        id
                    ]
                );
            }

            res.status(201).json(messageWithAuthor.rows[0]);

        } else {
            res.status(405).json({ message: 'Method Not Allowed' });
        }

    } catch (err) {
        console.error("Course messages error:", err);
        errorHandler(err, res);
    }
}