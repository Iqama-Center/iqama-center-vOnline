import pool from '../../../../lib/db';
import jwt from 'jsonwebtoken';
import errorHandler from '../../../../lib/errorHandler';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!['admin', 'finance'].includes(decoded.role)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { id: paymentId } = req.query;
        const { status: newStatus, rejectionReason } = req.body;

        if (!['paid', 'rejected'].includes(newStatus)) {
            return res.status(400).json({ message: 'Invalid status provided.' });
        }

        if (newStatus === 'rejected' && !rejectionReason) {
            return res.status(400).json({ message: 'Rejection reason is required when rejecting a payment.' });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Step 1: Update the payment status
            const paymentResult = await client.query(`
                UPDATE payments
                SET 
                    status = $1,
                    paid_at = CASE WHEN $1 = 'paid' THEN NOW() ELSE NULL END,
                    rejection_reason = CASE WHEN $1 = 'rejected' THEN $2 ELSE NULL END,
                    confirmed_by = $3
                WHERE id = $4 AND status = 'pending_review'
                RETURNING *
            `, [newStatus, rejectionReason, decoded.userId, paymentId]);

            if (paymentResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ message: 'Payment not found or not in a state to be confirmed/rejected' });
            }

            const confirmedPayment = paymentResult.rows[0];
            const enrollmentId = confirmedPayment.enrollment_id;

            // Step 2: If the payment was approved, update the enrollment status.
            if (newStatus === 'paid' && enrollmentId) {
                const courseResult = await client.query(
                    'SELECT c.is_launched FROM courses c JOIN enrollments e ON c.id = e.course_id WHERE e.id = $1',
                    [enrollmentId]
                );
                
                const isLaunched = courseResult.rows[0]?.is_launched;
                const newEnrollmentStatus = isLaunched ? 'active' : 'waiting_start';

                await client.query(
                    'UPDATE enrollments SET status = $1 WHERE id = $2 AND status IN (\'pending_payment\', \'pending_approval\')',
                    [newEnrollmentStatus, enrollmentId]
                );
            }

            // If rejected, the enrollment status remains 'pending_payment' for the user to re-upload.

            await client.query('COMMIT');

            res.status(200).json({ 
                message: `تم تحديث حالة الدفعة بنجاح إلى '${newStatus}'.`, 
                payment: confirmedPayment
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (err) {
        console.error("Payment confirmation error:", err);
        errorHandler(err, res);
    }
}