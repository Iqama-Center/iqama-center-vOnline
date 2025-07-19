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

        // Check auto launch conditions using the database function
        const result = await pool.query(
            'SELECT check_auto_launch_conditions($1) as should_launch',
            [course_id]
        );

        const shouldLaunch = result.rows[0].should_launch;

        if (shouldLaunch) {
            // Auto launch the course
            await pool.query('BEGIN');

            try {
                // Update course status to launched
                await pool.query(
                    'UPDATE courses SET is_launched = true, launch_date = CURRENT_TIMESTAMP WHERE id = $1',
                    [course_id]
                );

                // Get course details for notifications
                const courseResult = await pool.query(
                    'SELECT name, start_date FROM courses WHERE id = $1',
                    [course_id]
                );

                const course = courseResult.rows[0];

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
                        VALUES ($1, 'course_auto_launched', $2, $3, $4)
                    `, [
                        user.id,
                        'تم إطلاق الدورة تلقائياً',
                        `تم إطلاق دورة "${course.name}" تلقائياً بسبب اكتمال العدد المطلوب. ستبدأ الدورة في ${new Date(course.start_date).toLocaleDateString('ar-SA')}.`,
                        course_id
                    ]);
                }

                await pool.query('COMMIT');

                res.status(200).json({
                    success: true,
                    message: 'Course auto-launched successfully',
                    course_name: course.name,
                    participants_notified: enrolledUsers.rows.length
                });

            } catch (error) {
                await pool.query('ROLLBACK');
                throw error;
            }

        } else {
            res.status(200).json({
                success: false,
                message: 'Auto launch conditions not met'
            });
        }

    } catch (err) {
        console.error('Auto launch check error:', err);
        errorHandler(err, res);
    }
}