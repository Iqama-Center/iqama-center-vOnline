import pool from '../../../lib/db';
import jwt from 'jsonwebtoken';

// API to update enrollment states when course status changes
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!['admin', 'head'].includes(decoded.role)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { courseId, newCourseStatus } = req.body;

        if (!courseId || !newCourseStatus) {
            return res.status(400).json({ message: 'Course ID and new status are required' });
        }

        await pool.query('BEGIN');

        try {
            let updatedCount = 0;

            if (newCourseStatus === 'active') {
                // When course becomes active, move waiting_start enrollments to active
                const result = await pool.query(`
                    UPDATE enrollments 
                    SET status = 'active' 
                    WHERE course_id = $1 AND status = 'waiting_start'
                    RETURNING user_id
                `, [courseId]);

                updatedCount = result.rows.length;

                // Notify users that course is now active
                if (updatedCount > 0) {
                    const courseResult = await pool.query('SELECT name FROM courses WHERE id = $1', [courseId]);
                    const courseName = courseResult.rows[0]?.name;

                    for (const enrollment of result.rows) {
                        await pool.query(`
                            INSERT INTO notifications (user_id, type, message, created_at)
                            VALUES ($1, 'course_launched', $2, CURRENT_TIMESTAMP)
                        `, [
                            enrollment.user_id,
                            `بدأت دورة ${courseName}! يمكنك الآن الوصول إلى محتوى الدورة والمشاركة في الأنشطة.`
                        ]);
                    }
                }
            } else if (newCourseStatus === 'completed') {
                // When course is completed, move active enrollments to completed
                const result = await pool.query(`
                    UPDATE enrollments 
                    SET status = 'completed' 
                    WHERE course_id = $1 AND status = 'active'
                    RETURNING user_id
                `, [courseId]);

                updatedCount = result.rows.length;

                // Notify users that course is completed
                if (updatedCount > 0) {
                    const courseResult = await pool.query('SELECT name FROM courses WHERE id = $1', [courseId]);
                    const courseName = courseResult.rows[0]?.name;

                    for (const enrollment of result.rows) {
                        await pool.query(`
                            INSERT INTO notifications (user_id, type, message, created_at)
                            VALUES ($1, 'course_completed', $2, CURRENT_TIMESTAMP)
                        `, [
                            enrollment.user_id,
                            `تهانينا! لقد أكملت دورة ${courseName} بنجاح.`
                        ]);
                    }
                }
            }

            await pool.query('COMMIT');

            res.status(200).json({
                success: true,
                message: `تم تحديث حالة ${updatedCount} تسجيل`,
                updatedCount
            });

        } catch (error) {
            await pool.query('ROLLBACK');
            throw error;
        }

    } catch (err) {
        console.error('Update enrollment states error:', err);
        res.status(500).json({ message: 'خطأ في الخادم' });
    }
}