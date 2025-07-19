import pool from '../../../../lib/db';
import jwt from 'jsonwebtoken';
import errorHandler from '../../../../lib/errorHandler';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { id: courseId } = req.query;

        if (!courseId) {
            return res.status(400).json({ message: 'Course ID is required' });
        }

        // Check if user has access to this course
        const accessCheck = await pool.query(`
            SELECT 1 FROM enrollments e 
            WHERE e.course_id = $1 AND e.user_id = $2
            UNION
            SELECT 1 FROM courses c 
            WHERE c.id = $1 AND c.created_by = $2
        `, [courseId, decoded.id]);

        if (accessCheck.rows.length === 0 && !['admin', 'head'].includes(decoded.role)) {
            return res.status(403).json({ message: 'Not authorized to view this course progress' });
        }

        // Get course details
        const courseResult = await pool.query(`
            SELECT c.*, 
                   COUNT(DISTINCT e.id) as total_enrolled,
                   COUNT(DISTINCT CASE WHEN e.status = 'active' THEN e.id END) as active_enrolled
            FROM courses c 
            LEFT JOIN enrollments e ON c.id = e.course_id 
            WHERE c.id = $1 
            GROUP BY c.id
        `, [courseId]);

        if (courseResult.rows.length === 0) {
            return res.status(404).json({ message: 'Course not found' });
        }

        const course = courseResult.rows[0];

        // Calculate overall course progress
        const progressData = await calculateCourseProgress(courseId, course);

        // Get level-specific statistics
        const levelStats = await getLevelStatistics(courseId);

        // Get daily progress
        const dailyProgress = await getDailyProgress(courseId);

        // Get recent activity
        const recentActivity = await getRecentActivity(courseId);

        res.status(200).json({
            success: true,
            course: {
                id: course.id,
                name: course.name,
                status: course.status,
                is_launched: course.is_launched,
                start_date: course.start_date,
                duration_days: course.duration_days,
                total_enrolled: course.total_enrolled,
                active_enrolled: course.active_enrolled
            },
            progress: progressData,
            levelStats,
            dailyProgress,
            recentActivity
        });

    } catch (err) {
        console.error('Course progress error:', err);
        errorHandler(err, res);
    }
}

async function calculateCourseProgress(courseId, course) {
    try {
        // Calculate days elapsed
        const startDate = new Date(course.start_date);
        const currentDate = new Date();
        const daysElapsed = Math.max(0, Math.floor((currentDate - startDate) / (24 * 60 * 60 * 1000)));
        const currentDay = Math.min(daysElapsed + 1, course.duration_days);

        // Get total tasks and completed tasks
        const taskStats = await pool.query(`
            SELECT 
                COUNT(*) as total_tasks,
                COUNT(CASE WHEN s.status IN ('submitted', 'graded') THEN 1 END) as completed_tasks,
                COUNT(CASE WHEN t.is_active = true THEN 1 END) as active_tasks,
                AVG(CASE WHEN s.grade IS NOT NULL THEN s.grade ELSE NULL END) as avg_grade
            FROM tasks t 
            LEFT JOIN submissions s ON t.id = s.task_id 
            WHERE t.course_id = $1
        `, [courseId]);

        const stats = taskStats.rows[0];

        // Calculate completion percentage
        const overallProgress = stats.total_tasks > 0 ? 
            (stats.completed_tasks / stats.total_tasks * 100) : 0;

        // Calculate day progress
        const dayProgress = course.duration_days > 0 ? 
            (currentDay / course.duration_days * 100) : 0;

        return {
            overall: Math.round(overallProgress),
            day_progress: Math.round(dayProgress),
            current_day: currentDay,
            total_days: course.duration_days,
            days_remaining: Math.max(0, course.duration_days - currentDay),
            total_tasks: parseInt(stats.total_tasks),
            completed_tasks: parseInt(stats.completed_tasks),
            active_tasks: parseInt(stats.active_tasks),
            average_grade: parseFloat(stats.avg_grade || 0).toFixed(1),
            completion_rate: Math.round(overallProgress)
        };
    } catch (error) {
        console.error('Error calculating course progress:', error);
        return {
            overall: 0,
            day_progress: 0,
            current_day: 0,
            total_days: course.duration_days || 0,
            days_remaining: course.duration_days || 0,
            total_tasks: 0,
            completed_tasks: 0,
            active_tasks: 0,
            average_grade: 0,
            completion_rate: 0
        };
    }
}

async function getLevelStatistics(courseId) {
    try {
        const levelStats = {};

        // Get participant levels for this course
        const levels = await pool.query(`
            SELECT level_number, level_name, target_roles 
            FROM course_participant_levels 
            WHERE course_id = $1 
            ORDER BY level_number
        `, [courseId]);

        for (const level of levels.rows) {
            // Get users in this level
            const levelUsers = await pool.query(`
                SELECT DISTINCT e.user_id, u.full_name 
                FROM enrollments e 
                JOIN users u ON e.user_id = u.id 
                JOIN course_participant_levels cpl ON cpl.course_id = e.course_id 
                WHERE e.course_id = $1 AND e.status = 'active' 
                AND u.role = ANY($2)
            `, [courseId, level.target_roles]);

            // Calculate performance for this level
            const levelPerformance = await pool.query(`
                SELECT 
                    AVG(pe.task_completion_score) as avg_task_completion,
                    AVG(pe.quality_score) as avg_quality,
                    AVG(pe.timeliness_score) as avg_timeliness,
                    AVG(pe.overall_score) as avg_overall
                FROM performance_evaluations pe 
                WHERE pe.course_id = $1 AND pe.level_number = $2
            `, [courseId, level.level_number]);

            const perf = levelPerformance.rows[0];

            levelStats[`level_${level.level_number}`] = {
                name: level.level_name,
                level_number: level.level_number,
                user_count: levelUsers.rows.length,
                users: levelUsers.rows,
                task_completion: parseFloat(perf.avg_task_completion || 0).toFixed(1),
                quality_score: parseFloat(perf.avg_quality || 0).toFixed(1),
                timeliness: parseFloat(perf.avg_timeliness || 0).toFixed(1),
                overall_score: parseFloat(perf.avg_overall || 0).toFixed(1)
            };
        }

        return levelStats;
    } catch (error) {
        console.error('Error getting level statistics:', error);
        return {};
    }
}

async function getDailyProgress(courseId) {
    try {
        const dailyProgress = await pool.query(`
            SELECT 
                cs.day_number,
                cs.title,
                cs.scheduled_date,
                cs.tasks_released,
                cdp.content_released,
                cdp.meeting_completed,
                COUNT(t.id) as total_tasks,
                COUNT(CASE WHEN s.status IN ('submitted', 'graded') THEN 1 END) as completed_tasks
            FROM course_schedule cs 
            LEFT JOIN course_daily_progress cdp ON cs.course_id = cdp.course_id AND cs.day_number = cdp.day_number
            LEFT JOIN tasks t ON cs.id = t.schedule_id 
            LEFT JOIN submissions s ON t.id = s.task_id 
            WHERE cs.course_id = $1 
            GROUP BY cs.day_number, cs.title, cs.scheduled_date, cs.tasks_released, cdp.content_released, cdp.meeting_completed
            ORDER BY cs.day_number
        `, [courseId]);

        return dailyProgress.rows.map(day => ({
            day_number: day.day_number,
            title: day.title,
            scheduled_date: day.scheduled_date,
            tasks_released: day.tasks_released,
            content_released: day.content_released,
            meeting_completed: day.meeting_completed,
            total_tasks: parseInt(day.total_tasks),
            completed_tasks: parseInt(day.completed_tasks),
            completion_rate: day.total_tasks > 0 ? 
                Math.round(day.completed_tasks / day.total_tasks * 100) : 0
        }));
    } catch (error) {
        console.error('Error getting daily progress:', error);
        return [];
    }
}

async function getRecentActivity(courseId) {
    try {
        const recentActivity = await pool.query(`
            SELECT 
                'task_submission' as type,
                u.full_name as user_name,
                t.title as activity_title,
                s.submitted_at as activity_time,
                s.grade
            FROM submissions s 
            JOIN tasks t ON s.task_id = t.id 
            JOIN users u ON s.user_id = u.id 
            WHERE t.course_id = $1 AND s.submitted_at IS NOT NULL
            
            UNION ALL
            
            SELECT 
                'task_released' as type,
                'النظام' as user_name,
                'تم إطلاق مهام اليوم ' || cs.day_number as activity_title,
                t.released_at as activity_time,
                NULL as grade
            FROM tasks t 
            JOIN course_schedule cs ON t.schedule_id = cs.id 
            WHERE t.course_id = $1 AND t.released_at IS NOT NULL
            
            ORDER BY activity_time DESC 
            LIMIT 20
        `, [courseId]);

        return recentActivity.rows.map(activity => ({
            type: activity.type,
            user_name: activity.user_name,
            title: activity.activity_title,
            time: activity.activity_time,
            grade: activity.grade
        }));
    } catch (error) {
        console.error('Error getting recent activity:', error);
        return [];
    }
}