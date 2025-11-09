import pool from './db';

/**
 * Internal Course Management Scheduler
 * Handles automated course operations without external dependencies
 */
class InternalScheduler {
    constructor() {
        this.isRunning = false;
        this.intervals = new Map();
        this.lastRun = new Map();
        this.startTime = null;
    }

    start() {
        if (this.isRunning) {
            console.log('📅 Scheduler already running');
            return { success: true, message: 'Already running' };
        }

        console.log('🚀 Starting Internal Course Scheduler...');
        
        try {
            // Daily task release (every hour)
            this.intervals.set('dailyTasks', setInterval(() => {
                this.releaseDailyTasks().catch(console.error);
            }, 60 * 60 * 1000));

            // Auto-launch check (every 30 minutes)
            this.intervals.set('autoLaunch', setInterval(() => {
                this.checkAutoLaunch().catch(console.error);
            }, 30 * 60 * 1000));

            // Performance evaluation (every 2 hours)
            this.intervals.set('performance', setInterval(() => {
                this.evaluatePerformance().catch(console.error);
            }, 2 * 60 * 60 * 1000));

            this.isRunning = true;
            this.startTime = Date.now();
            console.log('✅ Internal scheduler started successfully');
            
            return { 
                success: true, 
                message: 'Scheduler started',
                features: ['Daily task release', 'Auto-launch checking', 'Performance evaluation']
            };
        } catch (error) {
            console.error('❌ Failed to start scheduler:', error);
            return { success: false, error: error.message };
        }
    }

    stop() {
        console.log('🛑 Stopping Internal Scheduler...');
        
        this.intervals.forEach((interval, name) => {
            clearInterval(interval);
            console.log(`Stopped ${name} interval`);
        });
        
        this.intervals.clear();
        this.isRunning = false;
        this.startTime = null;
        
        console.log('✅ Scheduler stopped');
        return { success: true, message: 'Scheduler stopped' };
    }

    async releaseDailyTasks() {
        try {
            console.log('📝 Releasing daily tasks...');
            
            const result = await pool.query(`
                UPDATE tasks 
                SET is_active = true 
                WHERE is_active = false 
                AND due_date::date = CURRENT_DATE 
                AND task_type IN ('daily_wird', 'reading', 'homework')
            `);
            
            if (result.rowCount > 0) {
                console.log(`✅ Released ${result.rowCount} daily tasks`);
            }
            
            this.lastRun.set('dailyTasks', new Date());
        } catch (error) {
            console.error('❌ Daily task release error:', error);
        }
    }

    async evaluatePerformance() {
        try {
            console.log('📊 Evaluating student performance...');
            
            const activeEnrollments = await pool.query(`
                SELECT DISTINCT e.user_id, e.course_id
                FROM enrollments e
                JOIN courses c ON e.course_id = c.id
                WHERE e.status = 'active' AND c.is_launched = true
                LIMIT 50
            `);
            
            let evaluatedCount = 0;
            for (const enrollment of activeEnrollments.rows) {
                try {
                    const taskStats = await pool.query(`
                        SELECT 
                            COUNT(*) as total_tasks,
                            COUNT(CASE WHEN s.status = 'graded' THEN 1 END) as completed_tasks,
                            AVG(CASE WHEN s.status = 'graded' THEN s.score END) as avg_score
                        FROM tasks t
                        LEFT JOIN submissions s ON t.id = s.task_id
                        WHERE t.assigned_to = $1 AND t.course_id = $2
                    `, [enrollment.user_id, enrollment.course_id]);
                    
                    const stats = taskStats.rows[0];
                    const completionRate = stats.total_tasks > 0 ? (stats.completed_tasks / stats.total_tasks) * 100 : 0;
                    const avgScore = stats.avg_score || 0;
                    
                    await pool.query(`
                        UPDATE enrollments 
                        SET grade = $1
                        WHERE user_id = $2 AND course_id = $3
                    `, [
                        JSON.stringify({
                            completion_rate: completionRate,
                            average_score: avgScore,
                            last_evaluated: new Date().toISOString()
                        }),
                        enrollment.user_id,
                        enrollment.course_id
                    ]);
                    
                    evaluatedCount++;
                } catch (error) {
                    console.error(`Performance evaluation error for user ${enrollment.user_id}:`, error);
                }
            }
            
            console.log(`✅ Evaluated performance for ${evaluatedCount} enrollments`);
            this.lastRun.set('performance', new Date());
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

                        await pool.query('SELECT generate_daily_tasks_for_course($1)', [course.id]);

                        await pool.query(`
                            UPDATE enrollments 
                            SET status = 'active' 
                            WHERE course_id = $1 AND status = 'waiting_start'
                        `, [course.id]);

                        const enrolledUsers = await pool.query(`
                            SELECT u.id, u.full_name 
                            FROM users u 
                            JOIN enrollments e ON u.id = e.user_id 
                            WHERE e.course_id = $1 AND e.status = 'active'
                        `, [course.id]);

                        // Bulk insert notifications
                        if (enrolledUsers.rows.length > 0) {
                            const notificationValues = enrolledUsers.rows.map(user => 
                                `(${user.id}, 'course_auto_launched', 'تم إطلاق الدورة تلقائياً', 'تم إطلاق دورة "${course.name.replace(/'/g, "''")}" تلقائياً بسبب اكتمال الشروط المطلوبة.', ${course.id})`
                            ).join(',');

                            await pool.query(`
                                INSERT INTO notifications (user_id, type, title, message, related_id)
                                VALUES ${notificationValues}
                            `);
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

    getStatus() {
        return {
            isRunning: this.isRunning,
            activeIntervals: Array.from(this.intervals.keys()),
            lastRun: Object.fromEntries(this.lastRun),
            uptime: this.isRunning ? Date.now() - (this.startTime || Date.now()) : 0
        };
    }
}

// Create singleton instance
const scheduler = new InternalScheduler();
export default scheduler;