import pool from '../../../../lib/db';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { id: courseId } = req.query;
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        // Check if user is enrolled in this course
        const enrollmentResult = await pool.query(
            'SELECT e.*, c.status as course_status, c.start_date FROM enrollments e JOIN courses c ON e.course_id = c.id WHERE e.user_id = $1 AND e.course_id = $2',
            [userId, courseId]
        );

        if (enrollmentResult.rows.length === 0) {
            return res.status(404).json({ message: 'أنت غير مسجل في هذه الدورة.' });
        }

        const enrollment = enrollmentResult.rows[0];

        // Check if user can unenroll (allow unenroll for pending statuses only)
        if (!['pending_payment', 'pending_approval'].includes(enrollment.status)) {
            return res.status(403).json({ 
                message: 'لا يمكن الانسحاب من الدورة بعد تأكيد التسجيل أو بدء الدورة.' 
            });
        }

        // Check if course has started (if start_date exists and is in the past)
        if (enrollment.start_date && new Date(enrollment.start_date) <= new Date()) {
            return res.status(403).json({ 
                message: 'لا يمكن الانسحاب من الدورة بعد بدايتها.' 
            });
        }

        // Check if course is already active (started)
        if (enrollment.course_status === 'active') {
            return res.status(403).json({ 
                message: 'لا يمكن الانسحاب من الدورة النشطة.' 
            });
        }

        // Check for any payments made
        const paymentResult = await pool.query(
            'SELECT * FROM payments WHERE enrollment_id = $1 AND status = $2',
            [enrollment.id, 'paid']
        );

        if (paymentResult.rows.length > 0) {
            return res.status(403).json({ 
                message: 'لا يمكن الانسحاب من الدورة بعد سداد الرسوم. يرجى التواصل مع الإدارة.' 
            });
        }

        // Update enrollment status instead of deleting
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // Delete any pending payments first
            await client.query(
                'DELETE FROM payments WHERE enrollment_id = $1 AND status = ANY($2)',
                [enrollment.id, ['due', 'pending_review']]
            );

            // Update enrollment status to cancelled instead of deleting
            await client.query(
                'UPDATE enrollments SET status = $1 WHERE id = $2',
                ['cancelled', enrollment.id]
            );

            await client.query('COMMIT');

            res.status(200).json({ 
                message: 'تم الانسحاب من الدورة بنجاح. يمكنك التقديم مرة أخرى لاحقاً.' 
            });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (err) {
        console.error("Unenrollment error:", err);
        res.status(500).json({ message: "خطأ أثناء الانسحاب من الدورة." });
    }
}