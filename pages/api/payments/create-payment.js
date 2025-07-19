import pool from '../../../lib/db';
import jwt from 'jsonwebtoken';
import NotificationService from '../../../services/notificationService';
import errorHandler from '../../../lib/errorHandler';

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

        const { 
            enrollmentId, 
            amount, 
            currency, 
            dueDate, 
            paymentType, // 'full', 'deposit', 'installment'
            description 
        } = req.body;

        if (!enrollmentId || !amount || !currency || !dueDate) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Get enrollment details
        const enrollment = await pool.query(
            `SELECT e.*, u.full_name, u.email, c.name as course_name, c.details as course_details
             FROM enrollments e
             JOIN users u ON e.user_id = u.id
             JOIN courses c ON e.course_id = c.id
             WHERE e.id = $1`,
            [enrollmentId]
        );

        if (enrollment.rows.length === 0) {
            return res.status(404).json({ message: 'Enrollment not found' });
        }

        const enrollmentData = enrollment.rows[0];

        // Create payment record
        const newPayment = await pool.query(
            `INSERT INTO payments (
                enrollment_id, amount, currency, due_date, status, notes
            ) VALUES ($1, $2, $3, $4, 'due', $5) RETURNING *`,
            [enrollmentId, amount, currency, dueDate, description || `${paymentType} payment for ${enrollmentData.course_name}`]
        );

        // Create notification for the student
        await NotificationService.createPaymentReminder(
            [enrollmentData.user_id],
            amount,
            currency,
            dueDate
        );

        // If it's a deposit payment, update enrollment status
        if (paymentType === 'deposit') {
            await pool.query(
                `UPDATE enrollments SET status = 'pending_payment' WHERE id = $1`,
                [enrollmentId]
            );
        }

        res.status(201).json({
            message: 'تم إنشاء طلب الدفع بنجاح',
            payment: newPayment.rows[0]
        });

    } catch (err) {
        console.error('Create payment error:', err);
        errorHandler(err, res);
    }
}