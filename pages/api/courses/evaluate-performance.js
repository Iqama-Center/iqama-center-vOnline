import pool from '../../../lib/db';
import jwt from 'jsonwebtoken';
import errorHandler from '../../../lib/errorHandler';

/**
 * Evaluates overdue system-monitored tasks and applies performance penalties.
 * This function is designed to be called by a scheduler.
 * @param {object} client - The database client object.
 */
async function evaluateOverdueSystemTasks(client) {
    console.log('Evaluating overdue system tasks for performance impact...');
    
    // Find overdue, un-penalized system tasks that are not yet completed.
    // This targets tasks that have a system key, are past due, haven't been penalized,
    // and do not have a corresponding submission.
    const overdueTasksRes = await client.query(`
        SELECT 
            t.id, 
            t.assigned_to, 
            t.system_task_key,
            t.title
        FROM tasks t
        LEFT JOIN submissions s ON t.id = s.task_id AND t.assigned_to = s.user_id
        WHERE t.system_task_key IS NOT NULL
          AND t.due_date < NOW()
          AND t.performance_impact_applied = false
          AND s.id IS NULL; -- Ensures the task is not completed
    `);

    const overdueTasks = overdueTasksRes.rows;
    if (overdueTasks.length === 0) {
        console.log('No overdue system tasks to process.');
        return { processed: 0, errors: 0 };
    }

    console.log(`Found ${overdueTasks.length} overdue system tasks to process.`);

    let processedCount = 0;
    let errorCount = 0;
    for (const task of overdueTasks) {
        // We assume the metric key for lateness is the system_task_key + '_LATE'
        // e.g., 'TEACHER_GRADING' becomes 'TEACHER_GRADING_LATE'
        const metricKey = `${task.system_task_key}_LATE`;
        const notes = `Penalty for overdue task: '${task.title}' (ID: ${task.id})`;

        try {
            // Apply the performance change using the database function
            await client.query(
                `SELECT apply_performance_change($1, $2, 'task', $3, $4)`,
                [task.assigned_to, metricKey, task.id, notes]
            );

            // Mark the task as processed to prevent duplicate penalties
            await client.query(
                'UPDATE tasks SET performance_impact_applied = true WHERE id = $1',
                [task.id]
            );
            
            processedCount++;
            console.log(`Applied penalty for task ${task.id} to user ${task.assigned_to}.`);

        } catch (err) {
            errorCount++;
            console.error(`Failed to process overdue task ${task.id} for user ${task.assigned_to}:`, err);
            // We continue to the next task even if one fails
        }
    }

    return { processed: processedCount, errors: errorCount };
}


export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    // Allow both authenticated calls and internal cron calls
    const token = req.cookies.token;
    let isAuthorized = false;
    let decoded = null;
    
    if (token) {
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
            isAuthorized = true;
        } catch (err) {
            // Continue to check for internal call
        }
    }
    
    // Check for internal cron call with secret
    const { cron_secret, evaluateAll } = req.body;
    if (cron_secret === process.env.CRON_SECRET) {
        isAuthorized = true;
        // Set a default admin role for cron calls
        decoded = { id: 1, role: 'admin' };
    }
    
    if (!isAuthorized) {
        return res.status(401).json({ message: 'Not authenticated' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        let overdueResults = {};
        // When called by the cron job, first evaluate overdue tasks system-wide
        if (evaluateAll && cron_secret) {
            overdueResults = await evaluateOverdueSystemTasks(client);
        }
        
        const { course_id: courseId, user_id: userId } = req.body;

        if (!courseId && evaluateAll) {
             // This part of the original logic seems to require a courseId, 
             // which might not be ideal for a system-wide cron.
             // For now, we'll let it proceed, but this could be a point of failure if not handled.
        } else if (!courseId) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Course ID is required' });
        }

        let evaluationResults = [];

        if (evaluateAll) {
            // Original logic to evaluate all enrolled users in a course
            if (!['admin', 'head', 'teacher'].includes(decoded.role)) {
                await client.query('ROLLBACK');
                return res.status(403).json({ message: 'Not authorized to evaluate all users' });
            }
            
            if(courseId) { // Only run this if a courseId was provided
                const enrolledUsers = await client.query(`
                    SELECT DISTINCT e.user_id, u.full_name 
                    FROM enrollments e 
                    JOIN users u ON e.user_id = u.id 
                    WHERE e.course_id = $1 AND e.status = 'active'
                `, [courseId]);

                for (const user of enrolledUsers.rows) {
                    const performance = await calculateUserPerformance(client, user.user_id, courseId);
                    await updateUserPerformanceRecord(client, user.user_id, courseId, performance);
                    evaluationResults.push({
                        userId: user.user_id,
                        userName: user.full_name,
                        performance
                    });
                }
            }
        } else {
            // Evaluate specific user
            if (!userId) {
                await client.query('ROLLBACK');
                return res.status(400).json({ message: 'User ID is required' });
            }

            if (decoded.id !== userId && !['admin', 'head', 'teacher'].includes(decoded.role)) {
                await client.query('ROLLBACK');
                return res.status(403).json({ message: 'Not authorized to evaluate this user' });
            }

            const performance = await calculateUserPerformance(client, userId, courseId);
            await updateUserPerformanceRecord(client, userId, courseId, performance);
            
            evaluationResults.push({
                userId,
                performance
            });
        }

        await client.query('COMMIT');

        res.status(200).json({
            success: true,
            message: 'Performance evaluation completed',
            overdueTasks: overdueResults,
            courseEvaluations: {
                results: evaluationResults,
                evaluatedCount: evaluationResults.length
            }
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Performance evaluation error:', err);
        errorHandler(err, res);
    } finally {
        client.release();
    }
}

async function calculateUserPerformance(client, userId, courseId) {
    try {
        const result = await client.query(
            'SELECT calculate_user_performance($1, $2) as performance_data',
            [userId, courseId]
        );
        const performanceData = result.rows[0].performance_data;
        if (performanceData.error) throw new Error(performanceData.error);
        return { ...performanceData, last_updated: new Date().toISOString() };
    } catch (error) {
        console.error(`Error in calculateUserPerformance for user ${userId}, course ${courseId}:`, error);
        throw error;
    }
}

async function updateUserPerformanceRecord(client, userId, courseId, performanceData) {
    try {
        await client.query(`
            INSERT INTO performance_evaluations (
                user_id, course_id, level_number, task_completion_score,
                quality_score, timeliness_score, overall_score, performance_data
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (user_id, course_id, evaluation_date) 
            DO UPDATE SET 
                level_number = EXCLUDED.level_number,
                task_completion_score = EXCLUDED.task_completion_score,
                quality_score = EXCLUDED.quality_score,
                timeliness_score = EXCLUDED.timeliness_score,
                overall_score = EXCLUDED.overall_score,
                performance_data = EXCLUDED.performance_data,
                updated_at = CURRENT_TIMESTAMP
        `, [
            userId, courseId,
            performanceData.level_number,
            performanceData.task_completion_rate || 0,
            performanceData.average_grade || 0,
            performanceData.on_time_completion_rate || 0,
            performanceData.overall_score || 0,
            JSON.stringify(performanceData)
        ]);
    } catch (error) {
        console.error(`Error in updateUserPerformanceRecord for user ${userId}, course ${courseId}:`, error);
        throw error;
    }
}
