import pool from '../../../lib/db';
import { pusher } from '../../../lib/pusher';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { field_name, new_value } = req.body;

        const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.id]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }
        const user = userResult.rows[0];

        if (!['email', 'phone', 'full_name'].includes(field_name)) {
            return res.status(400).json({ message: 'لا يمكن طلب تعديل هذا الحقل.' });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            await client.query(
                `INSERT INTO user_edit_requests (user_id, field_name, old_value, new_value) VALUES ($1, $2, $3, $4)`,
                [user.id, field_name, user[field_name], new_value]
            );
            
            const admins = await client.query("SELECT id FROM users WHERE role = 'admin'");
            const notificationMessage = `طلب تعديل بيانات من المستخدم ${user.full_name} في حقل: ${field_name}`;
            const notificationLink = '/admin/requests';

            for (const admin of admins.rows) {
                const notificationResult = await client.query(
                    `INSERT INTO notifications (user_id, type, message, link) VALUES ($1, 'announcement', $2, $3) RETURNING *`,
                    [admin.id, notificationMessage, notificationLink]
                );
                const newNotification = notificationResult.rows[0];
                // Trigger Pusher event for the admin (with error handling)
                try {
                    if (process.env.PUSHER_KEY && process.env.PUSHER_SECRET) {
                        await pusher.trigger(`private-user-${admin.id}`, 'new-notification', newNotification);
                    }
                } catch (pusherError) {
                    console.warn('Pusher notification failed:', pusherError.message);
                    // Continue execution even if Pusher fails
                }
            }

            await client.query('COMMIT');
            res.status(201).json({ message: 'تم إرسال طلب التعديل بنجاح.' });

        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }

    } catch (err) {
        console.error("Request change error:", err);
        res.status(500).json({ message: 'خطأ في إرسال الطلب.' });
    }
}
