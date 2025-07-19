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
        if (!['admin', 'head'].includes(decoded.role)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { id } = req.query;

        // Begin transaction
        await pool.query('BEGIN');

        try {
            // Update course status to launched
            await pool.query(
                'UPDATE courses SET is_launched = TRUE, status = $1, launched_at = CURRENT_TIMESTAMP WHERE id = $2',
                ['active', id]
            );

            // Update all waiting_start enrollments to active
            await pool.query(`
                UPDATE enrollments 
                SET status = 'active' 
                WHERE course_id = $1 AND status = 'waiting_start'
            `, [id]);

            // Get all enrolled users for this course
            const enrolledUsers = await pool.query(`
                SELECT DISTINCT e.user_id, u.full_name, u.email 
                FROM enrollments e 
                JOIN users u ON e.user_id = u.id 
                WHERE e.course_id = $1 AND e.status = 'active'`,
                [id]
            );

            // Create launch notifications for all participants
            for (const user of enrolledUsers.rows) {
                await pool.query(`
                    INSERT INTO notifications (user_id, type, message, related_id)
                    VALUES ($1, $2, $3, $4)`,
                    [
                        user.user_id,
                        'course_launched',
                        `تم بدء انطلاق الدورة وهي الآن نشطة. يمكنك الآن الوصول إلى محتوى الأيام الدراسية والمشاركة في الأنشطة.`,
                        id
                    ]
                );
            }

            // Create course message space
            await pool.query(`
                INSERT INTO course_messages (course_id, user_id, message, message_type)
                VALUES ($1, $2, $3, $4)`,
                [
                    id,
                    decoded.id,
                    'مرحباً بكم في الدورة! هذه مساحة للتواصل والمشاركة بين جميع المشاركين.',
                    'announcement'
                ]
            );

            // Create tasks from templates for all enrolled participants
            await pool.query('SELECT create_course_tasks_from_templates($1)', [id]);

            // Initialize daily progress tracking
            const courseDetails = await pool.query(
                'SELECT duration_days, start_date FROM courses WHERE id = $1',
                [id]
            );
            
            if (courseDetails.rows.length > 0) {
                const { duration_days, start_date } = courseDetails.rows[0];
                
                for (let day = 1; day <= duration_days; day++) {
                    const dayDate = new Date(start_date);
                    dayDate.setDate(dayDate.getDate() + (day - 1));
                    
                    await pool.query(`
                        INSERT INTO course_daily_progress (course_id, day_number, date)
                        VALUES ($1, $2, $3)
                        ON CONFLICT (course_id, day_number) DO NOTHING
                    `, [id, day, dayDate.toISOString().split('T')[0]]);
                }
            }

            await pool.query('COMMIT');

            res.status(200).json({ 
                message: 'تم بدء انطلاق الدورة بنجاح',
                course_id: id,
                participants_notified: enrolledUsers.rows.length
            });

        } catch (error) {
            await pool.query('ROLLBACK');
            throw error;
        }

    } catch (err) {
        console.error("Course launch error:", err);
        errorHandler(err, res);
    }
}