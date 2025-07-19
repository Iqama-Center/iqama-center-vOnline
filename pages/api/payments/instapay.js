import pool from '../../../lib/db';
import jwt from 'jsonwebtoken';
import errorHandler from '../../../lib/errorHandler';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { paymentId, instaPayReference, amount } = req.body;

        if (!paymentId || !instaPayReference || !amount) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Get payment details
        const payment = await pool.query(
            `SELECT p.*, e.user_id, c.name as course_name
             FROM payments p
             JOIN enrollments e ON p.enrollment_id = e.id
             JOIN courses c ON e.course_id = c.id
             WHERE p.id = $1`,
            [paymentId]
        );

        if (payment.rows.length === 0) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        const paymentData = payment.rows[0];

        // Verify user owns this payment
        if (paymentData.user_id !== decoded.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // In a real implementation, you would verify the InstaPay transaction here
        // For now, we'll simulate the verification
        const isValidTransaction = await verifyInstaPayTransaction(instaPayReference, amount);

        if (isValidTransaction) {
            // Update payment status
            await pool.query(
                `UPDATE payments 
                 SET status = 'pending_review', paid_at = CURRENT_TIMESTAMP, 
                     payment_proof_url = $1
                 WHERE id = $2`,
                [`instapay:${instaPayReference}`, paymentId]
            );

            // Notify finance team
            const financeUsers = await pool.query(
                "SELECT id FROM users WHERE role = 'finance'"
            );

            if (financeUsers.rows.length > 0) {
                await NotificationService.createNotification(
                    financeUsers.rows.map(u => u.id),
                    'payment_reminder',
                    `دفعة InstaPay جديدة تحتاج مراجعة: ${paymentData.course_name}`,
                    `/admin/payments/${paymentId}`
                );
            }

            res.status(200).json({
                message: 'تم تسجيل الدفع بنجاح وهو قيد المراجعة',
                status: 'pending_review'
            });
        } else {
            res.status(400).json({
                message: 'فشل في التحقق من معاملة InstaPay'
            });
        }

    } catch (err) {
        console.error('InstaPay payment error:', err);
        errorHandler(err, res);
    }
}

// Simulate InstaPay verification (replace with actual API call)
async function verifyInstaPayTransaction(reference, amount) {
    // In a real implementation, you would call InstaPay API here
    // For simulation, we'll return true if reference looks valid
    return reference && reference.length > 10 && amount > 0;
}