import pool from '../../../lib/db';
import jwt from 'jsonwebtoken';
import errorHandler from '../../../lib/errorHandler';
import { createAutoLaunchNotifications, updateCourseToLaunched, initializeDailyProgress } from '../../../lib/autoLaunchUtils';

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
                // Auto launch the course using shared utilities
                await updateCourseToLaunched(course.id);
                await initializeDailyProgress(course.id);
                const participantsCount = await createAutoLaunchNotifications(course.id, course.name, course.start_date);

                // Log the auto launch
                await pool.query(`
                    INSERT INTO course_auto_launch_log (course_id, launch_reason, participants_count)
                    VALUES ($1, $2, $3)
                `, [course.id, 'Auto-launch conditions met', participantsCount]);

                launchedCourses.push({
                    id: course.id,
                    name: course.name,
                    participants: participantsCount
                });

                console.log(`Auto-launched course: ${course.name} with ${participantsCount} participants`);
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