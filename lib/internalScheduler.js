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

    async checkAutoLaunch() {
        try {
            console.log('🚀 Checking auto-launch conditions...');
            
            const coursesToCheck = await pool.query(`
                SELECT id, name, start_date, auto_launch_settings
                FROM courses 
                WHERE is_published = true 
                AND is_launched = false 
                AND start_date >= CURRENT_DATE
                AND auto_launch_settings IS NOT NULL
            `);
            
            for (const course of coursesToCheck.rows) {
                const shouldLaunch = await this.evaluateAutoLaunchConditions(course);
                if (shouldLaunch) {
                    await this.launchCourse(course.id);
                }
            }
            
            this.lastRun.set('autoLaunch', new Date());
        } catch (error) {
            console.error('❌ Auto-launch check error:', error);
        }
    }

    async evaluateAutoLaunchConditions(course) {
        try {
            const settings = course.auto_launch_settings || {};
            const daysUntilStart = Math.ceil((new Date(course.start_date) - new Date()) / (1000 * 60 * 60 * 24));
            
            // Get current enrollment count
            const enrollmentResult = await pool.query(
                'SELECT COUNT(*) as count FROM enrollments WHERE course_id = $1 AND status = $2',
                [course.id, 'active']
            );
            const currentEnrollments = parseInt(enrollmentResult.rows[0].count);
            
            // Check various auto-launch conditions
            if (settings.auto_launch_on_max_capacity && daysUntilStart >= 1) {
                const maxCapacity = course.max_participants || 50;
                if (currentEnrollments >= maxCapacity) {
                    console.log(`🎯 Course ${course.name} reached max capacity (${currentEnrollments}/${maxCapacity})`);
                    return true;
                }
            }
            
            if (settings.auto_launch_on_date && daysUntilStart <= 1) {
                console.log(`📅 Course ${course.name} auto-launch date reached`);
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('❌ Auto-launch evaluation error:', error);
            return false;
        }
    }

    async launchCourse(courseId) {
        try {
            console.log(`🚀 Auto-launching course ${courseId}...`);
            
            await pool.query(`
                UPDATE courses 
                SET is_launched = true, launched_at = CURRENT_TIMESTAMP 
                WHERE id = $1
            `, [courseId]);
            
            // Create launch notification
            await pool.query(`
                INSERT INTO notifications (user_id, type, message, related_id, created_at)
                SELECT e.user_id, 'course_auto_launched', 
                       'تم إطلاق الدورة تلقائياً - ' || c.name, 
                       c.id, CURRENT_TIMESTAMP
                FROM enrollments e
                JOIN courses c ON e.course_id = c.id
                WHERE e.course_id = $1 AND e.status = 'active'
            `, [courseId]);
            
            console.log(`✅ Course ${courseId} launched successfully`);
        } catch (error) {
            console.error(`❌ Course launch error for ${courseId}:`, error);
        }
    }

    async evaluatePerformance() {
        try {
            console.log('📊 Evaluating student performance...');
            
            // This is a simplified version - you can expand based on your needs
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
                    // Simple performance calculation
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
                    
                    // Update enrollment with performance data
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