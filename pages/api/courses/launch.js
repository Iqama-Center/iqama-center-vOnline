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
        if (!['admin', 'head'].includes(decoded.role)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { course_id } = req.body;

        if (!course_id) {
            return res.status(400).json({ message: 'Course ID is required' });
        }

        await pool.query('BEGIN');

        try {
            // Check if course exists and is published but not launched
            const courseCheck = await pool.query(
                'SELECT id, name, is_published, is_launched FROM courses WHERE id = $1',
                [course_id]
            );

            if (courseCheck.rows.length === 0) {
                return res.status(404).json({ message: 'Course not found' });
            }

            const course = courseCheck.rows[0];

            if (!course.is_published) {
                return res.status(400).json({ message: 'Course must be published before launching' });
            }

            if (course.is_launched) {
                return res.status(400).json({ message: 'Course is already launched' });
            }

            // Launch the course
            await pool.query(
                'UPDATE courses SET is_launched = true, launch_date = CURRENT_TIMESTAMP WHERE id = $1',
                [course_id]
            );

            // Get all enrolled users for notifications
            const enrolledUsers = await pool.query(`
                SELECT u.id, u.full_name, u.email 
                FROM users u 
                JOIN enrollments e ON u.id = e.user_id 
                WHERE e.course_id = $1 AND e.status = 'active'
            `, [course_id]);

            // Create notifications for all participants
            for (const user of enrolledUsers.rows) {
                await pool.query(`
                    INSERT INTO notifications (user_id, type, title, message, related_id)
                    VALUES ($1, 'course_launched', $2, $3, $4)
                `, [
                    user.id,
                    'تم إطلاق الدورة',
                    `تم إطلاق دورة "${course.name}" وهي الآن متاحة. يمكنك الآن الوصول إلى محتوى الدورة والمشاركة في الأنشطة.`,
                    course_id
                ]);
            }

            await pool.query('COMMIT');

            res.status(200).json({
                success: true,
                message: 'Course launched successfully',
                course_name: course.name,
                participants_notified: enrolledUsers.rows.length
            });

        } catch (error) {
            await pool.query('ROLLBACK');
            throw error;
        }

    } catch (err) {
        console.error('Course launch error:', err);
        errorHandler(err, res);
    }
}