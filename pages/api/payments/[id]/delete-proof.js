import fs from 'fs';
import path from 'path';
import pool from '../../../../lib/db';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    if (req.method !== 'DELETE') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { id } = req.query; // payment ID
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        // Get payment details first to check ownership and get file path
        const paymentResult = await pool.query(
            `SELECT p.*, p.payment_proof_url 
             FROM payments p
             JOIN enrollments e ON p.enrollment_id = e.id
             WHERE p.id = $1 AND e.user_id = $2`,
            [id, userId]
        );

        if (paymentResult.rows.length === 0) {
            return res.status(404).json({ message: 'الدفع غير موجود أو غير مصرح لك بتعديله.' });
        }

        const payment = paymentResult.rows[0];

        // Check if payment is in a state where proof can be deleted
        if (payment.status === 'paid') {
            return res.status(400).json({ message: 'لا يمكن حذف إيصال دفع مؤكد.' });
        }

        // Delete the file from filesystem if it exists
        if (payment.payment_proof_url) {
            const filename = payment.payment_proof_url.replace('/uploads/', '');
            const filePath = path.join(process.cwd(), 'public', 'uploads', filename);
            
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log(`Deleted file: ${filePath}`);
                }
            } catch (fileError) {
                console.error('Error deleting file:', fileError);
                // Continue with database update even if file deletion fails
            }
        }

        // Update payment to remove proof URL and reset status to 'due'
        const updateResult = await pool.query(
            `UPDATE payments 
             SET payment_proof_url = NULL, status = 'due'
             WHERE id = $1 
             RETURNING *`,
            [id]
        );

        if (updateResult.rows.length === 0) {
            return res.status(500).json({ message: 'فشل في تحديث بيانات الدفع.' });
        }

        res.status(200).json({
            message: 'تم حذف إيصال الدفع بنجاح. يمكنك الآن رفع إيصال جديد.',
            payment: updateResult.rows[0]
        });

    } catch (err) {
        console.error("Delete Proof API Error:", err);
        if (err instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ message: 'Invalid token.' });
        }
        return res.status(500).json({ message: 'حدث خطأ في الخادم.' });
    }
}