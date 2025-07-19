import pool from '../../../lib/db';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        // Get user from token
        const cookies = parse(req.headers.cookie || '');
        const token = cookies.token;
        
        if (!token) {
            return res.status(401).json({ message: 'غير مصرح' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        // Verify user is admin
        const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0 || userResult.rows[0].role !== 'admin') {
            return res.status(403).json({ message: 'غير مصرح لك بإرسال رسائل جماعية' });
        }

        const { recipients, message, subject } = req.body;

        // Validate inputs
        if (!recipients || !message || !subject) {
            return res.status(400).json({ message: 'جميع الحقول مطلوبة' });
        }

        let recipientIds = [];

        // Handle different recipient types
        if (recipients === 'all_heads') {
            const headsResult = await pool.query('SELECT id FROM users WHERE role = \'head\'');
            recipientIds = headsResult.rows.map(row => row.id);
        } else if (recipients === 'all_workers') {
            const workersResult = await pool.query('SELECT id FROM users WHERE role IN (\'worker\', \'teacher\')');
            recipientIds = workersResult.rows.map(row => row.id);
        } else if (recipients === 'all_users') {
            const usersResult = await pool.query('SELECT id FROM users WHERE role != \'admin\'');
            recipientIds = usersResult.rows.map(row => row.id);
        } else if (Array.isArray(recipients)) {
            recipientIds = recipients;
        } else {
            return res.status(400).json({ message: 'نوع المستقبلين غير صحيح' });
        }

        if (recipientIds.length === 0) {
            return res.status(400).json({ message: 'لا يوجد مستقبلين للرسالة' });
        }

        // Send message to all recipients
        for (const recipientId of recipientIds) {
            await pool.query(`
                INSERT INTO messages (sender_id, recipient_id, content)
                VALUES ($1, $2, $3)
            `, [userId, recipientId, `${subject}: ${message}`]);

            // Create notification
            await pool.query(`
                INSERT INTO notifications (user_id, type, message, link)
                VALUES ($1, 'message', $2, $3)
            `, [
                recipientId,
                `رسالة جديدة: ${subject}`,
                '/messages'
            ]);
        }

        res.status(200).json({ 
            message: `تم إرسال الرسالة بنجاح إلى ${recipientIds.length} مستخدم`,
            sent_count: recipientIds.length
        });

    } catch (err) {
        console.error('Send message error:', err);
        res.status(500).json({ message: 'حدث خطأ في الخادم' });
    }
}