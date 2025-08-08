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

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Step 1: Update the payment status to 'paid'
            const paymentResult = await client.query(`
                UPDATE payments
                SET 
                    status = 'paid',
                    paid_at = NOW()
                WHERE id = $1 AND status != 'paid'
                RETURNING *
            `, [paymentId]);

            if (paymentResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ message: 'Payment not found or already confirmed' });
            }

            const confirmedPayment = paymentResult.rows[0];
            const enrollmentId = confirmedPayment.enrollment_id;

            // Step 2: If the payment is linked to an enrollment, update the enrollment status from any pending state.
            if (enrollmentId) {
                const courseResult = await client.query(
                    'SELECT c.is_launched FROM courses c JOIN enrollments e ON c.id = e.course_id WHERE e.id = $1',
                    [enrollmentId]
                );
                
                const isLaunched = courseResult.rows[0]?.is_launched;
                const newEnrollmentStatus = isLaunched ? 'active' : 'waiting_start';

                // This now updates the enrollment regardless of the previous pending state.
                await client.query(
                    'UPDATE enrollments SET status = $1 WHERE id = $2 AND status IN (\'pending_payment\', \'pending_approval\')',
                    [newEnrollmentStatus, enrollmentId]
                );
            }

            await client.query('COMMIT');

            res.status(200).json({ 
                message: 'تم تأكيد الدفعة وتحديث حالة التسجيل بنجاح.', 
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