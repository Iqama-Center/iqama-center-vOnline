import pool from '../../lib/db';
import errorHandler from '../../lib/errorHandler';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'الطريقة غير مسموحة' });
    }

    const { name, email, subject, message, type } = req.body;

    // Basic validation
    if (!name || !email || !subject || !message || !type) {
        return res.status(400).json({ message: 'الرجاء ملء جميع الحقول المطلوبة.' });
    }

    try {
        // Store contact message in database
        await pool.query(
            `INSERT INTO contact_messages (name, email, subject, message, type, created_at) 
             VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
            [name, email, subject, message, type]
        );

        // Create notification for admin users
        const adminUsers = await pool.query(
            "SELECT id FROM users WHERE role = 'admin'"
        );

        for (const admin of adminUsers.rows) {
            await pool.query(
                `INSERT INTO notifications (user_id, type, message, created_at) 
                 VALUES ($1, 'message', $2, CURRENT_TIMESTAMP)`,
                [admin.id, `رسالة جديدة من ${name}: ${subject}`]
            );
        }

        res.status(200).json({ 
            message: 'تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.' 
        });

    } catch (err) {
        console.error('Contact form error:', err);
        errorHandler(err, res);
    }
}