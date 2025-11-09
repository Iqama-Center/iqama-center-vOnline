import pool from '../../../lib/db';
import jwt from 'jsonwebtoken';
import errorHandler from '../../../lib/errorHandler';
import NotificationService from '../../../services/notificationService';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    const client = await pool.connect();
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!['admin', 'head'].includes(decoded.role)) {
            client.release();
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { course_id } = req.body;

        if (!course_id) {
            client.release();
            return res.status(400).json({ message: 'Course ID is required' });
        }

        const result = await client.query(
            'SELECT check_auto_launch_conditions($1) as should_launch',
            [course_id]
        );

        const shouldLaunch = result.rows[0].should_launch;

        if (shouldLaunch) {
            await client.query('BEGIN');

            try {
                await client.query(
                    'UPDATE courses SET is_launched = true, launched_at = CURRENT_TIMESTAMP WHERE id = $1',
                    [course_id]
                );

                const courseResult = await client.query(
                    'SELECT name, start_date FROM courses WHERE id = $1',
                    [course_id]
                );
                const course = courseResult.rows[0];

                const enrolledUsersResult = await client.query(`
                    SELECT u.id FROM users u 
                    JOIN enrollments e ON u.id = e.user_id 
                    WHERE e.course_id = $1 AND e.status = 'active'
                `, [course_id]);
                
                const userIds = enrolledUsersResult.rows.map(row => row.id);

                if (userIds.length > 0) {
                    await NotificationService.createNotification({
                        userIds,
                        type: 'course_auto_launched',
                        title: 'تم إطلاق الدورة تلقائياً',
                        message: `تم إطلاق دورة "${course.name}" تلقائياً بسبب اكتمال العدد المطلوب. ستبدأ الدورة في ${new Date(course.start_date).toLocaleDateString('ar-SA')}.`,
                        relatedId: course_id,
                        client
                    });
                }

                await client.query('COMMIT');

                res.status(200).json({
                    success: true,
                    message: 'Course auto-launched successfully',
                    course_name: course.name,
                    participants_notified: userIds.length
                });

            } catch (error) {
                await client.query('ROLLBACK');
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
    } finally {
        client.release();
    }
}
