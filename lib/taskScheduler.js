import pool from './db';
import cron from 'node-cron';

const TZ = 'Africa/Cairo';

class TaskScheduler {
    constructor() {
        this.started = false;
    }

    start() {
        if (this.started) return;

        // Every 5 minutes: Release tasks when meeting time passes
        cron.schedule('*/5 * * * *', async () => {
            try {
                await this.releaseScheduledTasks();
            } catch (error) {
                console.error('Error releasing scheduled tasks:', error);
            }
        }, { timezone: TZ });

        // Every hour: Check for expired daily tasks and apply penalties
        cron.schedule('0 * * * *', async () => {
            try {
                await this.processDailyTaskExpiry();
            } catch (error) {
                console.error('Error processing daily task expiry:', error);
            }
        }, { timezone: TZ });

        // Every 6 hours: Send deadline reminders
        cron.schedule('0 */6 * * *', async () => {
            try {
                await this.sendDeadlineReminders();
            } catch (error) {
                console.error('Error sending deadline reminders:', error);
            }
        }, { timezone: TZ });

        // Daily at midnight: Process overdue fixed tasks
        cron.schedule('0 0 * * *', async () => {
            try {
                await this.processOverdueFixedTasks();
            } catch (error) {
                console.error('Error processing overdue fixed tasks:', error);
            }
        }, { timezone: TZ });

        this.started = true;
        console.log('TaskScheduler started with comprehensive task management');
    }

    async releaseScheduledTasks() {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Find tasks that should be released (meeting time has passed)
            const tasksToRelease = await client.query(`
                SELECT t.*, cs.meeting_start_time, cs.meeting_end_time, cs.scheduled_date, c.hours_per_day
                FROM tasks t
                JOIN course_schedule cs ON t.schedule_id = cs.id
                JOIN courses c ON t.course_id = c.id
                WHERE t.is_active = false 
                AND cs.scheduled_date = CURRENT_DATE
                AND (
                    cs.meeting_start_time IS NULL 
                    OR CURRENT_TIME >= (cs.meeting_end_time + INTERVAL '0 hours')
                )
            `);

            for (const task of tasksToRelease.rows) {
                // Activate the task
                await client.query(`
                    UPDATE tasks 
                    SET is_active = true, released_at = CURRENT_TIMESTAMP 
                    WHERE id = $1
                `, [task.id]);

                // Create notification
                await this.createTaskNotification(client, task, 'task_released');

                console.log(`Released task: ${task.title} for user ${task.assigned_to}`);
            }

            await client.query('COMMIT');
            return tasksToRelease.rows.length;

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async processDailyTaskExpiry() {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Find expired daily tasks that haven't been completed
            const expiredDailyTasks = await client.query(`
                SELECT t.*, ts.status as submission_status, e.user_id, c.name as course_name
                FROM tasks t
                LEFT JOIN task_submissions ts ON t.id = ts.task_id
                JOIN enrollments e ON t.assigned_to = e.user_id AND t.course_id = e.course_id
                JOIN courses c ON t.course_id = c.id
                WHERE t.task_type IN ('daily_reading', 'daily_quiz', 'daily_evaluation', 'daily_monitoring')
                AND t.is_active = true
                AND t.due_date < CURRENT_TIMESTAMP
                AND (ts.status IS NULL OR ts.status != 'completed')
                AND NOT EXISTS (
                    SELECT 1 FROM task_penalties tp WHERE tp.task_id = t.id
                )
            `);

            for (const task of expiredDailyTasks.rows) {
                // Apply grade penalty for students
                if (['daily_reading', 'daily_quiz'].includes(task.task_type)) {
                    await this.applyGradePenalty(client, task);
                }

                // Mark task as expired
                await client.query(`
                    UPDATE tasks 
                    SET status = 'expired'
                    WHERE id = $1
                `, [task.id]);

                // Create penalty notification
                await this.createTaskNotification(client, task, 'task_expired');

                console.log(`Processed expired daily task: ${task.title} for user ${task.assigned_to}`);
            }

            await client.query('COMMIT');
            return expiredDailyTasks.rows.length;

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async processOverdueFixedTasks() {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Find overdue fixed tasks
            const overdueTasks = await client.query(`
                SELECT t.*, ts.status as submission_status, e.user_id, c.name as course_name
                FROM tasks t
                LEFT JOIN task_submissions ts ON t.id = ts.task_id
                JOIN enrollments e ON t.assigned_to = e.user_id AND t.course_id = e.course_id
                JOIN courses c ON t.course_id = c.id
                WHERE t.task_type IN ('homework', 'exam', 'weekly_report', 'weekly_evaluation')
                AND t.is_active = true
                AND t.due_date < CURRENT_TIMESTAMP
                AND (ts.status IS NULL OR ts.status != 'completed')
                AND NOT EXISTS (
                    SELECT 1 FROM task_penalties tp WHERE tp.task_id = t.id
                )
            `);

            for (const task of overdueTasks.rows) {
                // Apply grade penalty
                await this.applyGradePenalty(client, task);

                // Mark task as overdue
                await client.query(`
                    UPDATE tasks 
                    SET status = 'overdue'
                    WHERE id = $1
                `, [task.id]);

                // Create overdue notification
                await this.createTaskNotification(client, task, 'task_overdue');

                console.log(`Processed overdue fixed task: ${task.title} for user ${task.assigned_to}`);
            }

            await client.query('COMMIT');
            return overdueTasks.rows.length;

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async sendDeadlineReminders() {
        const client = await pool.connect();
        try {
            // Find tasks due within 24 hours
            const upcomingTasks = await client.query(`
                SELECT t.*, u.name as user_name, c.name as course_name
                FROM tasks t
                JOIN users u ON t.assigned_to = u.id
                JOIN courses c ON t.course_id = c.id
                WHERE t.is_active = true
                AND t.due_date BETWEEN CURRENT_TIMESTAMP AND CURRENT_TIMESTAMP + INTERVAL '24 hours'
                AND NOT EXISTS (
                    SELECT 1 FROM notifications n 
                    WHERE n.user_id = t.assigned_to 
                    AND n.type = 'deadline_reminder' 
                    AND n.related_id = t.id
                    AND n.created_at > CURRENT_TIMESTAMP - INTERVAL '12 hours'
                )
            `);

            for (const task of upcomingTasks.rows) {
                await this.createTaskNotification(client, task, 'deadline_reminder');
                console.log(`Sent deadline reminder for task: ${task.title} to user ${task.assigned_to}`);
            }

            return upcomingTasks.rows.length;

        } catch (error) {
            throw error;
        } finally {
            client.release();
        }
    }

    async applyGradePenalty(client, task) {
        // Calculate penalty based on task type
        let penaltyPercentage = 0;
        let penaltyReason = '';

        switch (task.task_type) {
            case 'daily_reading':
            case 'daily_quiz':
                penaltyPercentage = 10; // 10% penalty for daily tasks
                penaltyReason = 'عدم إكمال المهمة اليومية في الوقت المحدد';
                break;
            case 'homework':
                penaltyPercentage = 15; // 15% penalty for homework
                penaltyReason = 'تأخير تسليم الواجب المنزلي';
                break;
            case 'exam':
                penaltyPercentage = 25; // 25% penalty for exams
                penaltyReason = 'عدم أداء الامتحان في الوقت المحدد';
                break;
            default:
                penaltyPercentage = 5; // Default 5% penalty
                penaltyReason = 'عدم إكمال المهمة في الوقت المحدد';
        }

        // Record the penalty
        await client.query(`
            INSERT INTO task_penalties (
                task_id, user_id, course_id, penalty_percentage, 
                penalty_reason, applied_at
            ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
        `, [task.id, task.assigned_to, task.course_id, penaltyPercentage, penaltyReason]);

        // Update user's course grade
        await client.query(`
            UPDATE enrollments 
            SET grade = COALESCE(grade, '{}')::jsonb || 
                jsonb_build_object('penalty_total', 
                    COALESCE((grade->>'penalty_total')::numeric, 0) + $1
                )
            WHERE user_id = $2 AND course_id = $3
        `, [penaltyPercentage, task.assigned_to, task.course_id]);

        console.log(`Applied ${penaltyPercentage}% penalty to user ${task.assigned_to} for task ${task.id}`);
    }

    async createTaskNotification(client, task, notificationType) {
        let message = '';
        let type = notificationType;

        switch (notificationType) {
            case 'task_released':
                message = `مهمة جديدة متاحة: ${task.title}`;
                break;
            case 'task_expired':
                message = `انتهت صلاحية المهمة: ${task.title} - تم خصم درجات`;
                type = 'penalty_applied';
                break;
            case 'task_overdue':
                message = `مهمة متأخرة: ${task.title} - تم خصم درجات`;
                type = 'penalty_applied';
                break;
            case 'deadline_reminder':
                message = `تذكير: موعد تسليم المهمة ${task.title} خلال 24 ساعة`;
                break;
            default:
                message = `إشعار متعلق بالمهمة: ${task.title}`;
        }

        await client.query(`
            INSERT INTO notifications (user_id, type, message, related_id, created_at)
            VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
        `, [task.assigned_to, type, message, task.id]);
    }

    stop() {
        // Note: node-cron doesn't provide a direct way to stop specific tasks
        // This would require keeping track of task references
        this.started = false;
        console.log('TaskScheduler stopped');
    }
}

// Create task_penalties table if it doesn't exist
async function ensureTaskPenaltiesTable() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS task_penalties (
                id SERIAL PRIMARY KEY,
                task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
                penalty_percentage NUMERIC(5,2) NOT NULL,
                penalty_reason TEXT NOT NULL,
                applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_task_penalties_task_id ON task_penalties(task_id)
        `);

        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_task_penalties_user_course ON task_penalties(user_id, course_id)
        `);

        console.log('Task penalties table ensured');
    } catch (error) {
        console.error('Error ensuring task penalties table:', error);
    }
}

// Initialize table on module load
ensureTaskPenaltiesTable();

const taskScheduler = new TaskScheduler();
export default taskScheduler;
export { TaskScheduler };