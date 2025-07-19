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
        const senderId = decoded.id;
        const { recipientId, content } = req.body;

        if (/(?:\d{7,})|http/i.test(content)) {
            return res.status(400).json({ message: "لا يمكن إرسال أرقام هواتف أو روابط في الرسائل." });
        }

        const result = await pool.query(
            `INSERT INTO messages (sender_id, recipient_id, content) VALUES ($1, $2, $3) RETURNING *`,
            [senderId, recipientId, content]
        );
        
        const newMessage = result.rows[0];

        // Trigger Pusher event to notify the recipient in real-time
        await pusher.trigger(`private-user-${recipientId}`, 'new-message', newMessage);

        res.status(201).json(newMessage);

    } catch (err) {
        console.error("Send message error:", err);
        res.status(500).json({ message: "خطأ في إرسال الرسالة." });
    }
}
