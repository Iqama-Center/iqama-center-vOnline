import pool from '../../../lib/db';
import jwt from 'jsonwebtoken';
import errorHandler from '../../../lib/errorHandler';
import { createAutoLaunchNotifications, updateCourseToLaunched, initializeDailyProgress } from '../../../lib/autoLaunchUtils';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    let isAuthorized = false;
    if (req.cookies.token) {
        try {
            const decoded = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
            isAuthorized = ['admin', 'head'].includes(decoded.role);
        } catch (err) { /* Ignore token errors, check for cron secret next */ }
    }
    
    if (req.body.cron_secret === process.env.CRON_SECRET) {
        isAuthorized = true;
    }
    
    if (!isAuthorized) {
        return res.status(403).json({ message: 'Not authorized' });
    }

    const client = await pool.connect();
    try {
        // Get all published courses that are not yet launched and are due to start
        const candidateCourses = await client.query(`
            SELECT c.id, c.name, c.start_date, c.auto_launch_settings
            FROM courses c 
            WHERE c.is_published = true 
            AND c.is_launched = false 
            AND c.start_date >= CURRENT_DATE
        `);

        let launchedCourses = [];

        for (const course of candidateCourses.rows) {
            const shouldLaunchResult = await client.query(
                'SELECT check_auto_launch_conditions($1) as should_launch',
                [course.id]
            );

            if (shouldLaunchResult.rows[0].should_launch) {
                // Launch this course within a dedicated transaction
                try {
                    await client.query('BEGIN');
                    
                    await updateCourseToLaunched(client, course.id);
                    await initializeDailyProgress(client, course.id);
                    const participantsCount = await createAutoLaunchNotifications(client, course.id, course.name, course.start_date);

                    await client.query(`
                        INSERT INTO course_auto_launch_log (course_id, launch_reason, enrollment_counts)
                        VALUES ($1, $2, $3)
                    `, [course.id, 'Auto-launch conditions met', { participants: participantsCount }]);

                    await client.query('COMMIT');

                    launchedCourses.push({
                        id: course.id,
                        name: course.name,
                        participants: participantsCount
                    });

                    // console.log(`Auto-launched course: ${course.name} with ${participantsCount} participants`);
                } catch (launchError) {
                    await client.query('ROLLBACK');
                    console.error(`Failed to launch course ${course.name} (ID: ${course.id}). Error:`, launchError);
                    // Continue to the next course
                }
            }
        }

        res.status(200).json({
            success: true,
            message: `Auto-launch check completed`,
            candidateCourses: candidateCourses.rows.length,
            launchedCourses: launchedCourses.length,
            launched: launchedCourses
        });

    } catch (err) {
        console.error('Auto-launch check error:', err);
        errorHandler(err, res);
    } finally {
        client.release();
    }
}
