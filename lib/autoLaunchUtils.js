import pool from './db';
import NotificationService from '../services/notificationService';

/**
 * Creates notifications for all active participants of a course.
 * @param {pg.PoolClient} client - The database client for the transaction.
 * @param {number} courseId - The ID of the course.
 * @param {string} courseName - The name of the course.
 * @param {Date} startDate - The start date of the course.
 * @returns {Promise<number>} The number of participants notified.
 */
export async function createAutoLaunchNotifications(client, courseId, courseName, startDate) {
    const db = client || pool;
    const enrolledUsersResult = await db.query(`
        SELECT u.id FROM users u 
        JOIN enrollments e ON u.id = e.user_id 
        WHERE e.course_id = $1 AND e.status = 'active'
    `, [courseId]);

    const userIds = enrolledUsersResult.rows.map(row => row.id);

    if (userIds.length > 0) {
        await NotificationService.createNotification({
            userIds,
            type: 'course_auto_launched',
            title: 'تم إطلاق الدورة تلقائياً',
            message: `تم إطلاق دورة "${courseName}" تلقائياً بسبب اكتمال الشروط المطلوبة. ستبدأ الدورة في ${new Date(startDate).toLocaleDateString('ar-SA')}.`,
            relatedId: courseId,
            client: db
        });
    }

    return userIds.length;
}

/**
 * Updates a course to be in a launched state and activates enrollments and tasks.
 * @param {pg.PoolClient} client - The database client for the transaction.
 * @param {number} courseId - The ID of the course to launch.
 */
export async function updateCourseToLaunched(client, courseId) {
    const db = client || pool;
    
    await db.query(
        'UPDATE courses SET is_launched = true, status = $1, launched_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['active', courseId]
    );

    await db.query(`
        UPDATE enrollments SET status = 'active' 
        WHERE course_id = $1 AND status = 'waiting_start'
    `, [courseId]);

    await db.query('SELECT create_course_tasks_from_templates($1)', [courseId]);
}

/**
 * Initializes the daily progress records for a course for its entire duration.
 * @param {pg.PoolClient} client - The database client for the transaction.
 * @param {number} courseId - The ID of the course.
 */
export async function initializeDailyProgress(client, courseId) {
    const db = client || pool;
    const courseDetails = await db.query(
        'SELECT duration_days, start_date FROM courses WHERE id = $1',
        [courseId]
    );
    
    if (courseDetails.rows.length > 0) {
        const { duration_days, start_date } = courseDetails.rows[0];
        
        // Use generate_series to create all daily progress records in a single query
        await db.query(`
            INSERT INTO course_daily_progress (course_id, day_number, date)
            SELECT $1, day_number, (CAST($2 AS DATE) + (day_number - 1) * INTERVAL '1 day')
            FROM generate_series(1, $3) as day_number
            ON CONFLICT (course_id, day_number) DO NOTHING
        `, [courseId, start_date, duration_days]);
    }
}
