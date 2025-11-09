import pool from '../../../../lib/db';
import { pusher } from '../../../../lib/pusher';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { id } = req.query; // Request ID
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Ensure only admins can approve requests
        const adminUserResult = await pool.query('SELECT role FROM users WHERE id = $1', [decoded.id]);
        if (adminUserResult.rows.length === 0 || adminUserResult.rows[0].role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: Only admins can approve requests.' });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Get the request details
            const requestResult = await client.query(
                'SELECT * FROM user_edit_requests WHERE id = $1 FOR UPDATE',
                [id]
            );

            if (requestResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ message: 'Request not found.' });
            }

            const request = requestResult.rows[0];

            if (request.status !== 'pending') {
                await client.query('ROLLBACK');
                return res.status(400).json({ message: 'Request is not pending.' });
            }

            const allowedFields = ['full_name', 'email', 'phone', 'details'];
            if (!allowedFields.includes(request.field_name)) {
                await client.query('ROLLBACK');
                return res.status(400).json({ message: `Field '${request.field_name}' cannot be updated.` });
            }

            // Update the user's profile
            await client.query(
                `UPDATE users SET ${request.field_name} = $1 WHERE id = $2`,
                [request.new_value, request.user_id]
            );

            // Update the request status
            await client.query(
                'UPDATE user_edit_requests SET status = $1, reviewed_at = NOW(), reviewed_by = $2 WHERE id = $3',
                ['approved', decoded.id, id]
            );

            // Notify the user whose request was approved
            const userNotificationMessage = `تمت الموافقة على طلب تعديل بياناتك لحقل ${request.field_name}.`;
            await client.query(
                `INSERT INTO notifications (user_id, type, message, link) VALUES ($1, 'message', $2, '/profile')`,
                [request.user_id, userNotificationMessage]
            );
            try {
                if (process.env.PUSHER_KEY && process.env.PUSHER_SECRET) {
                    await pusher.trigger(`private-user-${request.user_id}`, 'new-notification', {
                        message: userNotificationMessage,
                        link: '/profile'
                    });
                }
            } catch (pusherError) {
                console.warn('Pusher notification failed:', pusherError.message);
                // Continue execution even if Pusher fails
            }

            await client.query('COMMIT');
            res.status(200).json({ message: 'Request approved successfully.' });

        } catch (e) {
            await client.query('ROLLBACK');
            console.error("Approve Request Error:", e);
            res.status(500).json({ message: 'Error approving request.' });
        } finally {
            client.release();
        }

    } catch (err) {
        console.error("Approve Request API Error:", err);
        if (err instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ message: 'Invalid token.' });
        }
        res.status(500).json({ message: 'Server error.' });
    }
}