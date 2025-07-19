import pool from '../../../../lib/db';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Only allow admins and heads to approve enrollments
        if (!['admin', 'head'].includes(decoded.role)) {
            return res.status(403).json({ message: 'غير مصرح لك بالموافقة على التسجيلات' });
        }

        const { enrollmentId, action } = req.body; // action: 'approve' or 'reject'

        if (!enrollmentId || !action) {
            return res.status(400).json({ message: 'معرف التسجيل والإجراء مطلوبان' });
        }

        // Get enrollment details
        const enrollmentResult = await pool.query(`
            SELECT e.*, c.name as course_name, u.full_name as user_name, u.email
            FROM enrollments e
            JOIN courses c ON e.course_id = c.id
            JOIN users u ON e.user_id = u.id
            WHERE e.id = $1 AND e.status = 'pending_approval'
        `, [enrollmentId]);

        if (enrollmentResult.rows.length === 0) {
            return res.status(404).json({ message: 'التسجيل غير موجود أو تمت معالجته بالفعل' });
        }

        const enrollment = enrollmentResult.rows[0];
        let newStatus, message;

        if (action === 'approve') {
            // Check if course is already active to determine new status
            const courseResult = await pool.query('SELECT status FROM courses WHERE id = $1', [enrollment.course_id]);
            const courseStatus = courseResult.rows[0]?.status;
            
            newStatus = courseStatus === 'active' ? 'active' : 'waiting_start';
            message = `تمت الموافقة على تسجيل ${enrollment.user_name} في دورة ${enrollment.course_name}`;
        } else if (action === 'reject') {
            // Instead of setting to cancelled, we delete the enrollment
            await pool.query('DELETE FROM enrollments WHERE id = $1', [enrollmentId]);
            
            // Create notification for the user
            await pool.query(`
                INSERT INTO notifications (user_id, type, message, created_at)
                VALUES ($1, 'course_enrollment', $2, CURRENT_TIMESTAMP)
            `, [
                enrollment.user_id,
                `تم رفض تسجيلك في دورة ${enrollment.course_name}. يمكنك التقديم مرة أخرى لاحقاً.`
            ]);

            return res.status(200).json({ 
                message: `تم رفض تسجيل ${enrollment.user_name} في دورة ${enrollment.course_name}`,
                enrollment: {
                    id: enrollmentId,
                    status: 'deleted',
                    user_name: enrollment.user_name,
                    course_name: enrollment.course_name
                }
            });
        } else {
            return res.status(400).json({ message: 'إجراء غير صحيح' });
        }

        // Update enrollment status
        await pool.query(`
            UPDATE enrollments 
            SET status = $1 
            WHERE id = $2
        `, [newStatus, enrollmentId]);

        // Create notification for the user
        await pool.query(`
            INSERT INTO notifications (user_id, type, message, created_at)
            VALUES ($1, 'course_enrollment', $2, CURRENT_TIMESTAMP)
        `, [
            enrollment.user_id,
            action === 'approve' 
                ? `تمت الموافقة على تسجيلك في دورة ${enrollment.course_name}`
                : `تم رفض تسجيلك في دورة ${enrollment.course_name}`
        ]);

        res.status(200).json({ 
            message: message,
            enrollment: {
                id: enrollmentId,
                status: newStatus,
                user_name: enrollment.user_name,
                course_name: enrollment.course_name
            }
        });

    } catch (err) {
        console.error('Enrollment approval error:', err);
        res.status(500).json({ message: 'خطأ في الخادم' });
    }
}