import pool from '../../../lib/db';
import jwt from 'jsonwebtoken';
import errorHandler from '../../../lib/errorHandler';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    // Allow both authenticated admin calls and internal cron calls
    const token = req.cookies.token;
    let isAuthorized = false;
    
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            isAuthorized = ['admin', 'head'].includes(decoded.role);
        } catch (err) {
            // Continue to check for internal call
        }
    }
    
    // Check for internal cron call with secret
    const { cron_secret } = req.body;
    if (cron_secret === process.env.CRON_SECRET) {
        isAuthorized = true;
    }
    
    if (!isAuthorized) {
        return res.status(403).json({ message: 'Not authorized' });
    }

    try {
        await pool.query('BEGIN');

        // Get all published courses that are not yet launched
        const candidateCourses = await pool.query(`
            SELECT c.id, c.name, c.start_date, c.auto_launch_settings
            FROM courses c 
            WHERE c.is_published = true 
            AND c.is_launched = false 
            AND c.status = 'published'
            AND c.start_date >= CURRENT_DATE
        `);

        let launchedCourses = [];

        for (const course of candidateCourses.rows) {
            // Check auto launch conditions using the database function
            const shouldLaunchResult = await pool.query(
                'SELECT check_auto_launch_conditions($1) as should_launch',
                [course.id]
            );

            const shouldLaunch = shouldLaunchResult.rows[0].should_launch;

            if (shouldLaunch) {
                // Auto launch the course
                await pool.query(
                    'UPDATE courses SET is_launched = true, status = $1, launched_at = CURRENT_TIMESTAMP WHERE id = $2',
                    ['active', course.id]
                );

                // Update enrollments to active
                await pool.query(`
                    UPDATE enrollments 
                    SET status = 'active' 
                    WHERE course_id = $1 AND status = 'waiting_start'
                `, [course.id]);

                // Create tasks from templates
                await pool.query('SELECT create_course_tasks_from_templates($1)', [course.id]);

                // Initialize daily progress tracking
                const courseDetails = await pool.query(
                    'SELECT duration_days, start_date FROM courses WHERE id = $1',
                    [course.id]
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
                        `, [course.id, day, dayDate.toISOString().split('T')[0]]);
                    }
                }

                // Get enrolled users for notifications
                const enrolledUsers = await pool.query(`
                    SELECT u.id, u.full_name, u.email 
                    FROM users u 
                    JOIN enrollments e ON u.id = e.user_id 
                    WHERE e.course_id = $1 AND e.status = 'active'
                `, [course.id]);

                // Create notifications for all participants
                for (const user of enrolledUsers.rows) {
                    await pool.query(`
                        INSERT INTO notifications (user_id, type, title, message, related_id)
                        VALUES ($1, 'course_auto_launched', $2, $3, $4)
                    `, [
                        user.id,
                        'تم إطلاق الدورة تلقائياً',
                        `تم إطلاق دورة "${course.name}" تلقائياً بسبب اكتمال الشروط المطلوبة. ستبدأ الدورة في ${new Date(course.start_date).toLocaleDateString('ar-SA')}.`,
                        course.id
                    ]);
                }

                // Log the auto launch
                await pool.query(`
                    INSERT INTO course_auto_launch_log (course_id, launch_reason, participants_count)
                    VALUES ($1, $2, $3)
                `, [course.id, 'Auto-launch conditions met', enrolledUsers.rows.length]);

                launchedCourses.push({
                    id: course.id,
                    name: course.name,
                    participants: enrolledUsers.rows.length
                });

                console.log(`Auto-launched course: ${course.name} with ${enrolledUsers.rows.length} participants`);
            }
        }

        await pool.query('COMMIT');

        res.status(200).json({
            success: true,
            message: `Auto-launch check completed`,
            candidateCourses: candidateCourses.rows.length,
            launchedCourses: launchedCourses.length,
            launched: launchedCourses
        });

    } catch (err) {
        await pool.query('ROLLBACK');
        console.error('Auto-launch check error:', err);
        errorHandler(err, res);
    }
}