import pool from '../../../lib/db';
import { withAuth } from '../../../lib/withAuth';

async function handler(req, res) {
    const { id: contactId } = req.query;
    const userId = req.user.id;

    if (req.method === 'GET') {
        try {
            const messages = await pool.query(`
                SELECT * FROM messages
                WHERE (sender_id = $1 AND recipient_id = $2) OR (sender_id = $2 AND recipient_id = $1)
                ORDER BY sent_at ASC
            `, [userId, contactId]);

            // Mark messages as read
            await pool.query('UPDATE messages SET read_at = NOW() WHERE recipient_id = $1 AND sender_id = $2 AND read_at IS NULL', [userId, contactId]);

            res.status(200).json({ messages: messages.rows });
        } catch (error) {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    } else if (req.method === 'POST') {
        const { content } = req.body;
        try {
            const result = await pool.query(`
                INSERT INTO messages (sender_id, recipient_id, content)
                VALUES ($1, $2, $3)
                RETURNING *
            `, [userId, contactId, content]);
            res.status(201).json(result.rows[0]);
        } catch (error) {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

export default withAuth(handler);
