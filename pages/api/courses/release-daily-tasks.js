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

        // Get all active courses that are launched
        const activeCourses = await pool.query(`
            SELECT c.id, c.name, c.start_date, c.duration_days, c.hours_per_day
            FROM courses c 
            WHERE c.is_launched = true AND c.status = 'active'
        `);

        let totalTasksReleased = 0;
        let coursesProcessed = 0;

        for (const course of activeCourses.rows) {
            const currentDate = new Date();
            const startDate = new Date(course.start_date);
            const daysDiff = Math.floor((currentDate - startDate) / (24 * 60 * 60 * 1000));
            const currentDay = daysDiff + 1;

            // Only process if we're within the course duration
            if (currentDay > 0 && currentDay <= course.duration_days) {
                // Check if this day exists in schedule and hasn't been processed
                const daySchedule = await pool.query(`
                    SELECT cs.*, cdp.tasks_released 
                    FROM course_schedule cs
                    LEFT JOIN course_daily_progress cdp ON cs.course_id = cdp.course_id AND cs.day_number = cdp.day_number
                    WHERE cs.course_id = $1 AND cs.day_number = $2
                `, [course.id, currentDay]);

                if (daySchedule.rows.length > 0) {
                    const schedule = daySchedule.rows[0];
                    
                    // Check if meeting time has passed and tasks haven't been released
                    const shouldRelease = await shouldReleaseTasks(course, schedule, currentDate);
                    
                    if (shouldRelease && !schedule.tasks_released) {
                        // Release tasks for this day
                        const tasksReleased = await releaseDayTasks(course.id, currentDay, schedule.id);
                        totalTasksReleased += tasksReleased;
                        coursesProcessed++;
                        
                        console.log(`Released ${tasksReleased} tasks for course ${course.name}, day ${currentDay}`);
                    }
                }
            }
        }

        await pool.query('COMMIT');

        res.status(200).json({
            success: true,
            message: `Daily task release completed`,
            coursesProcessed,
            totalTasksReleased,
            timestamp: new Date().toISOString()
        });

    } catch (err) {
        await pool.query('ROLLBACK');
        console.error('Daily task release error:', err);
        errorHandler(err, res);
    }
}

async function shouldReleaseTasks(course, schedule, currentDate) {
    // If no meeting time is set, release immediately
    if (!schedule.meeting_start_time) {
        return true;
    }

    // Calculate meeting end time
    const meetingStart = new Date();
    const [hours, minutes] = schedule.meeting_start_time.split(':');
    meetingStart.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    const meetingEnd = new Date(meetingStart);
    meetingEnd.setHours(meetingEnd.getHours() + parseFloat(course.hours_per_day));

    // Check if current time is past meeting end time
    const currentTime = new Date();
    const currentTimeOnly = new Date();
    currentTimeOnly.setHours(currentTime.getHours(), currentTime.getMinutes(), 0, 0);

    return currentTimeOnly >= meetingEnd;
}

async function releaseDayTasks(courseId, dayNumber, scheduleId) {
    try {
        // Activate tasks for this day
        const result = await pool.query(`
            UPDATE tasks 
            SET is_active = true, released_at = CURRENT_TIMESTAMP 
            WHERE schedule_id = $1 AND is_active = false
            RETURNING id, assigned_to, title
        `, [scheduleId]);

        const tasksReleased = result.rows.length;

        if (tasksReleased > 0) {
            // Mark tasks as released in course_daily_progress
            await pool.query(`
                UPDATE course_daily_progress 
                SET tasks_released = true 
                WHERE course_id = $1 AND day_number = $2
            `, [courseId, dayNumber]);

            // Mark tasks as released in course_schedule
            await pool.query(`
                UPDATE course_schedule 
                SET tasks_released = true 
                WHERE id = $1
            `, [scheduleId]);

            // Create notifications for users who received tasks
            const uniqueUsers = [...new Set(result.rows.map(task => task.assigned_to))];
            
            for (const userId of uniqueUsers) {
                const userTasks = result.rows.filter(task => task.assigned_to === userId);
                await pool.query(`
                    INSERT INTO notifications (user_id, type, message, related_id, created_at)
                    VALUES ($1, 'new_task', $2, $3, CURRENT_TIMESTAMP)
                `, [
                    userId,
                    `مهام جديدة متاحة لليوم ${dayNumber} (${userTasks.length} مهمة)`,
                    courseId
                ]);
            }

            // Create exam notifications if there are exam tasks
            const examTasks = result.rows.filter(task => 
                task.title.includes('امتحان') || task.title.includes('اختبار')
            );
            
            if (examTasks.length > 0) {
                const examUsers = [...new Set(examTasks.map(task => task.assigned_to))];
                for (const userId of examUsers) {
                    await pool.query(`
                        INSERT INTO notifications (user_id, type, message, related_id, created_at)
                        VALUES ($1, 'exam_available', $2, $3, CURRENT_TIMESTAMP)
                    `, [
                        userId,
                        `امتحان اليوم ${dayNumber} متاح الآن`,
                        courseId
                    ]);
                }
            }
        }

        return tasksReleased;
    } catch (error) {
        console.error('Error releasing day tasks:', error);
        throw error;
    }
}