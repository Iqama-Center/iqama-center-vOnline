

import pool from '../../../../lib/db';
import { withAuth } from '../../../../lib/withAuth';

async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { id } = req.query;
    const { status } = req.body; // expecting 'paid' or 'rejected'

    if (!['paid', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status provided.' });
    }

    try {
        const client = await pool.connect();
        
        // Update payment status
        const updateQuery = `
            UPDATE payments 
            SET status = $1, confirmed_by = $2, paid_at = CASE WHEN $1 = 'paid' THEN NOW() ELSE paid_at END
            WHERE id = $3 RETURNING enrollment_id, status;
        `;
        const paymentResult = await client.query(updateQuery, [status, req.user.id, id]);

        if (paymentResult.rows.length === 0) {
            client.release();
            return res.status(404).json({ message: 'Payment not found.' });
        }

        const { enrollment_id, status: newStatus } = paymentResult.rows[0];

        // If payment is confirmed, update the enrollment status to 'active'
        if (newStatus === 'paid') {
            await client.query(
                'UPDATE enrollments SET status = \'active\' WHERE id = $1 AND status = \'pending_payment\'',
                [enrollment_id]
            );
        }

        // TODO: Add notification logic here to inform the user about the payment confirmation/rejection

        client.release();
        res.status(200).json({ message: `Payment status updated to ${newStatus}` });

    } catch (error) {
        console.error('Error confirming payment:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export default withAuth(handler, { roles: ['finance', 'admin'] });
