// Shared auto-launch utilities
import pool from './db';

export async function createAutoLaunchNotifications(courseId, courseName, startDate) {
    // Get enrolled users for notifications
    const enrolledUsers = await pool.query(`
        SELECT u.id, u.full_name, u.email 
        FROM users u 
        JOIN enrollments e ON u.id = e.user_id 
        WHERE e.course_id = $1 AND e.status = 'active'
    `, [courseId]);

    // Create notifications for all participants
    for (const user of enrolledUsers.rows) {
        await pool.query(`
            INSERT INTO notifications (user_id, type, title, message, related_id)
            VALUES ($1, 'course_auto_launched', $2, $3, $4)
        `, [
            user.id,
            'تم إطلاق الدورة تلقائياً',
            `تم إطلاق دورة "${courseName}" تلقائياً بسبب اكتمال الشروط المطلوبة. ستبدأ الدورة في ${new Date(startDate).toLocaleDateString('ar-SA')}.`,
            courseId
        ]);
    }

    return enrolledUsers.rows.length;
}

export async function updateCourseToLaunched(courseId) {
    // Update course status to launched
    await pool.query(
        'UPDATE courses SET is_launched = true, status = $1, launched_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['active', courseId]
    );

    // Update enrollments to active
    await pool.query(`
        UPDATE enrollments 
        SET status = 'active' 
        WHERE course_id = $1 AND status = 'waiting_start'
    `, [courseId]);

    // Create tasks from templates
    await pool.query('SELECT create_course_tasks_from_templates($1)', [courseId]);
}

export async function initializeDailyProgress(courseId) {
    // Initialize daily progress tracking
    const courseDetails = await pool.query(
        'SELECT duration_days, start_date FROM courses WHERE id = $1',
        [courseId]
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
            `, [courseId, day, dayDate.toISOString().split('T')[0]]);
        }
    }
}