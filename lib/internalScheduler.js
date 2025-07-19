import pool from './db.js';

// Internal scheduler that doesn't require external cron
class InternalScheduler {
    constructor() {
        this.intervals = [];
        this.isRunning = false;
    }

    start() {
        if (this.isRunning) {
            console.log('⚠️ Scheduler already running');
            return;
        }

        console.log('🚀 Starting internal scheduler...');
        this.isRunning = true;

        // Daily task release - every hour
        const taskReleaseInterval = setInterval(async () => {
            try {
                await this.releaseDailyTasks();
            } catch (error) {
                console.error('❌ Task release error:', error);
            }
        }, 60 * 60 * 1000); // 1 hour: 60 * 60 * 1000

        // Performance evaluation - every 6 hours
        const performanceInterval = setInterval(async () => {
            try {
                await this.evaluatePerformance();
            } catch (error) {
                console.error('❌ Performance evaluation error:', error);
            }
        }, 6 * 60 * 60 * 1000); // 6 hours: 6 * 60 * 60 * 1000

        // Auto-launch check - every 12 hours
        const autoLaunchInterval = setInterval(async () => {
            try {
                await this.checkAutoLaunch();
            } catch (error) {
                console.error('❌ Auto-launch check error:', error);
            }
        },  12 * 60 * 60 * 1000); // 12 hours: 12 * 60 * 60 * 1000

        this.intervals.push(taskReleaseInterval, performanceInterval, autoLaunchInterval);
        
        console.log('✅ Internal scheduler started successfully');
        console.log('📅 Task release: Every hour');
        console.log('📊 Performance evaluation: Every 6 hours');
        console.log('🚀 Auto-launch check: Every 12 hours');
    }

    stop() {
        this.intervals.forEach(interval => clearInterval(interval));
        this.intervals = [];
        this.isRunning = false;
        console.log('🛑 Internal scheduler stopped');
    }

    async releaseDailyTasks() {
        console.log('Checking daily task release...');
        
        try {
            // Check database health first
            const healthCheck = await pool.healthCheck();
            if (!healthCheck.healthy) {
                console.error('Database health check failed:', healthCheck.error);
                return;
            }
            
            console.log('Database is healthy, proceeding with task release...');
            
            // Get all active courses with timeout protection
            const activeCourses = await pool.query(`
                SELECT c.id, c.name, c.start_date, c.duration_days, c.hours_per_day
                FROM courses c 
                WHERE c.is_launched = true AND c.status = 'active'
            `);

            let totalTasksReleased = 0;

            for (const course of activeCourses.rows) {
                const currentDate = new Date();
                const startDate = new Date(course.start_date);
                const daysDiff = Math.floor((currentDate - startDate) / (24 * 60 * 60 * 1000));
                const currentDay = daysDiff + 1;

                if (currentDay > 0 && currentDay <= course.duration_days) {
                    const daySchedule = await pool.query(`
                        SELECT cs.*, cdp.tasks_released 
                        FROM course_schedule cs
                        LEFT JOIN course_daily_progress cdp ON cs.course_id = cdp.course_id AND cs.day_number = cdp.day_number
                        WHERE cs.course_id = $1 AND cs.day_number = $2
                    `, [course.id, currentDay]);

                    if (daySchedule.rows.length > 0) {
                        const schedule = daySchedule.rows[0];
                        
                        if (this.shouldReleaseTasks(course, schedule) && !schedule.tasks_released) {
                            const tasksReleased = await this.releaseDayTasks(course.id, currentDay, schedule.id);
                            totalTasksReleased += tasksReleased;
                        }
                    }
                }
            }

            if (totalTasksReleased > 0) {
                console.log(`Released ${totalTasksReleased} tasks across ${activeCourses.rows.length} courses`);
            } else {
                console.log('No tasks released - all courses up to date');
            }

        } catch (error) {
            console.error('Daily task release error:', error);
            
            // Log specific error details for debugging
            if (error.code === 'ECONNRESET') {
                console.error('Database connection was reset - will retry on next cycle');
            } else if (error.code === 'ETIMEDOUT') {
                console.error('Database query timed out - check database performance');
            } else if (error.code === 'ENOTFOUND') {
                console.error('Database server not found - check connection string');
            }
            
            // Don't crash the scheduler, just log and continue
            console.log('Scheduler will continue and retry on next cycle...');
        }
    }

    shouldReleaseTasks(course, schedule) {
        if (!schedule.meeting_start_time) return true;

        const currentTime = new Date();
        const [hours, minutes] = schedule.meeting_start_time.split(':');
        const meetingStart = new Date();
        meetingStart.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        const meetingEnd = new Date(meetingStart);
        meetingEnd.setHours(meetingEnd.getHours() + parseFloat(course.hours_per_day));

        return currentTime >= meetingEnd;
    }

    async releaseDayTasks(courseId, dayNumber, scheduleId) {
        try {
            const result = await pool.query(`
                UPDATE tasks 
                SET is_active = true, released_at = CURRENT_TIMESTAMP 
                WHERE schedule_id = $1 AND is_active = false
                RETURNING id, assigned_to, title
            `, [scheduleId]);

            if (result.rows.length > 0) {
                await pool.query(`
                    UPDATE course_daily_progress 
                    SET tasks_released = true 
                    WHERE course_id = $1 AND day_number = $2
                `, [courseId, dayNumber]);

                await pool.query(`
                    UPDATE course_schedule 
                    SET tasks_released = true 
                    WHERE id = $1
                `, [scheduleId]);

                // Create notifications
                const uniqueUsers = [...new Set(result.rows.map(task => task.assigned_to))];
                for (const userId of uniqueUsers) {
                    await pool.query(`
                        INSERT INTO notifications (user_id, type, message, related_id, created_at)
                        VALUES ($1, 'new_task', $2, $3, CURRENT_TIMESTAMP)
                    `, [userId, `مهام جديدة متاحة لليوم ${dayNumber}`, courseId]);
                }
            }

            return result.rows.length;
        } catch (error) {
            console.error('Error releasing day tasks:', error);
            return 0;
        }
    }

    async evaluatePerformance() {
        console.log('📊 Running performance evaluation...');
        
        try {
            const enrollments = await pool.query(`
                SELECT DISTINCT e.course_id, e.user_id 
                FROM enrollments e 
                JOIN courses c ON e.course_id = c.id 
                WHERE e.status = 'active' AND c.is_launched = true
            `);

            let evaluatedCount = 0;

            for (const enrollment of enrollments.rows) {
                try {
                    const performanceResult = await pool.query(
                        'SELECT calculate_user_performance($1, $2) as performance_data',
                        [enrollment.user_id, enrollment.course_id]
                    );

                    const performanceData = performanceResult.rows[0].performance_data;

                    if (!performanceData.error) {
                        await pool.query(`
                            INSERT INTO performance_evaluations (
                                user_id, course_id, level_number, task_completion_score,
                                quality_score, timeliness_score, overall_score, performance_data
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                            ON CONFLICT (user_id, course_id, evaluation_date) 
                            DO UPDATE SET 
                                task_completion_score = EXCLUDED.task_completion_score,
                                quality_score = EXCLUDED.quality_score,
                                timeliness_score = EXCLUDED.timeliness_score,
                                overall_score = EXCLUDED.overall_score,
                                performance_data = EXCLUDED.performance_data,
                                updated_at = CURRENT_TIMESTAMP
                        `, [
                            enrollment.user_id,
                            enrollment.course_id,
                            performanceData.level_number,
                            performanceData.task_completion_rate || 0,
                            performanceData.average_grade || 0,
                            performanceData.on_time_completion_rate || 0,
                            performanceData.overall_score || 0,
                            JSON.stringify(performanceData)
                        ]);

                        await pool.query(`
                            UPDATE enrollments 
                            SET grade = $1 
                            WHERE user_id = $2 AND course_id = $3
                        `, [JSON.stringify(performanceData), enrollment.user_id, enrollment.course_id]);

                        evaluatedCount++;
                    }
                } catch (error) {
                    console.error(`Error evaluating user ${enrollment.user_id}:`, error);
                }
            }

            if (evaluatedCount > 0) {
                console.log(`✅ Performance evaluated for ${evaluatedCount} enrollments`);
            }

        } catch (error) {
            console.error('❌ Performance evaluation error:', error);
        }
    }

    async checkAutoLaunch() {
        console.log('🚀 Checking auto-launch conditions...');
        
        try {
            const candidateCourses = await pool.query(`
                SELECT c.id, c.name, c.start_date, c.auto_launch_settings
                FROM courses c 
                WHERE c.is_published = true 
                AND c.is_launched = false 
                AND c.status = 'published'
                AND c.start_date >= CURRENT_DATE
            `);

            let launchedCount = 0;

            for (const course of candidateCourses.rows) {
                const shouldLaunchResult = await pool.query(
                    'SELECT check_auto_launch_conditions($1) as should_launch',
                    [course.id]
                );

                if (shouldLaunchResult.rows[0].should_launch) {
                    await pool.query('BEGIN');

                    try {
                        await pool.query(
                            'UPDATE courses SET is_launched = true, status = $1, launched_at = CURRENT_TIMESTAMP WHERE id = $2',
                            ['active', course.id]
                        );

                        await pool.query(`
                            UPDATE enrollments 
                            SET status = 'active' 
                            WHERE course_id = $1 AND status = 'waiting_start'
                        `, [course.id]);

                        await pool.query('SELECT create_course_tasks_from_templates($1)', [course.id]);

                        const enrolledUsers = await pool.query(`
                            SELECT u.id, u.full_name 
                            FROM users u 
                            JOIN enrollments e ON u.id = e.user_id 
                            WHERE e.course_id = $1 AND e.status = 'active'
                        `, [course.id]);

                        for (const user of enrolledUsers.rows) {
                            await pool.query(`
                                INSERT INTO notifications (user_id, type, title, message, related_id)
                                VALUES ($1, 'course_auto_launched', $2, $3, $4)
                            `, [
                                user.id,
                                'تم إطلاق الدورة تلقائياً',
                                `تم إطلاق دورة "${course.name}" تلقائياً بسبب اكتمال الشروط المطلوبة.`,
                                course.id
                            ]);
                        }

                        await pool.query('COMMIT');
                        launchedCount++;
                        console.log(`✅ Auto-launched course: ${course.name}`);

                    } catch (error) {
                        await pool.query('ROLLBACK');
                        console.error(`❌ Error auto-launching course ${course.name}:`, error);
                    }
                }
            }

            if (launchedCount > 0) {
                console.log(`✅ Auto-launched ${launchedCount} courses`);
            }

        } catch (error) {
            console.error('❌ Auto-launch check error:', error);
        }
    }
}

// Export singleton instance
const scheduler = new InternalScheduler();
export default scheduler;