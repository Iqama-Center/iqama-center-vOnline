import pool from '../../../lib/db';
import jwt from 'jsonwebtoken';
import errorHandler from '../../../lib/errorHandler';

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
    const { cron_secret } = req.body;
    if (cron_secret === process.env.CRON_SECRET) {
        isAuthorized = true;
        // Set a default admin role for cron calls
        decoded = { id: 1, role: 'admin' };
    }
    
    if (!isAuthorized) {
        return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
        
        const { course_id: courseId, user_id: userId, evaluateAll } = req.body;

        if (!courseId) {
            return res.status(400).json({ message: 'Course ID is required' });
        }

        await pool.query('BEGIN');

        let evaluationResults = [];

        if (evaluateAll) {
            // Evaluate all enrolled users in the course
            if (!['admin', 'head', 'teacher'].includes(decoded.role)) {
                return res.status(403).json({ message: 'Not authorized to evaluate all users' });
            }

            const enrolledUsers = await pool.query(`
                SELECT DISTINCT e.user_id, u.full_name 
                FROM enrollments e 
                JOIN users u ON e.user_id = u.id 
                WHERE e.course_id = $1 AND e.status = 'active'
            `, [courseId]);

            for (const user of enrolledUsers.rows) {
                const performance = await calculateUserPerformance(user.user_id, courseId);
                await updateUserPerformanceRecord(user.user_id, courseId, performance);
                evaluationResults.push({
                    userId: user.user_id,
                    userName: user.full_name,
                    performance
                });
            }
        } else {
            // Evaluate specific user
            if (!userId) {
                return res.status(400).json({ message: 'User ID is required' });
            }

            // Check authorization - users can evaluate themselves, supervisors can evaluate their subordinates
            if (decoded.id !== userId && !['admin', 'head', 'teacher'].includes(decoded.role)) {
                return res.status(403).json({ message: 'Not authorized to evaluate this user' });
            }

            const performance = await calculateUserPerformance(userId, courseId);
            await updateUserPerformanceRecord(userId, courseId, performance);
            
            evaluationResults.push({
                userId,
                performance
            });
        }

        await pool.query('COMMIT');

        res.status(200).json({
            success: true,
            message: 'Performance evaluation completed',
            results: evaluationResults,
            evaluatedCount: evaluationResults.length
        });

    } catch (err) {
        await pool.query('ROLLBACK');
        console.error('Performance evaluation error:', err);
        errorHandler(err, res);
    }
}

async function calculateUserPerformance(userId, courseId) {
    try {
        // Use the database function to calculate performance
        const result = await pool.query(
            'SELECT calculate_user_performance($1, $2) as performance_data',
            [userId, courseId]
        );

        const performanceData = result.rows[0].performance_data;

        if (performanceData.error) {
            throw new Error(performanceData.error);
        }

        // Get additional metrics specific to user's level
        const levelSpecificMetrics = await calculateLevelSpecificMetrics(userId, courseId, performanceData.level_number);

        return {
            ...performanceData,
            ...levelSpecificMetrics,
            last_updated: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error calculating user performance:', error);
        throw error;
    }
}

async function calculateLevelSpecificMetrics(userId, courseId, levelNumber) {
    const metrics = {};

    try {
        if (levelNumber === 3) {
            // Level 3 (Students/Recipients) - Focus on learning outcomes
            const examResults = await pool.query(`
                SELECT 
                    COUNT(*) as total_exams,
                    AVG(s.grade) as avg_exam_score,
                    COUNT(CASE WHEN s.grade >= 60 THEN 1 END) as passed_exams
                FROM tasks t 
                JOIN submissions s ON t.id = s.task_id 
                WHERE t.assigned_to = $1 AND t.course_id = $2 
                AND t.task_type = 'exam' AND s.status = 'graded'
            `, [userId, courseId]);

            const homeworkResults = await pool.query(`
                SELECT 
                    COUNT(*) as total_homework,
                    AVG(s.grade) as avg_homework_score,
                    COUNT(CASE WHEN s.submitted_at <= t.due_date THEN 1 END) as on_time_submissions
                FROM tasks t 
                JOIN submissions s ON t.id = s.task_id 
                WHERE t.assigned_to = $1 AND t.course_id = $2 
                AND t.task_type = 'homework' AND s.status IN ('submitted', 'graded')
            `, [userId, courseId]);

            metrics.exam_performance = {
                total_exams: examResults.rows[0].total_exams || 0,
                avg_exam_score: parseFloat(examResults.rows[0].avg_exam_score || 0),
                passed_exams: examResults.rows[0].passed_exams || 0,
                pass_rate: examResults.rows[0].total_exams > 0 ? 
                    (examResults.rows[0].passed_exams / examResults.rows[0].total_exams * 100) : 0
            };

            metrics.homework_performance = {
                total_homework: homeworkResults.rows[0].total_homework || 0,
                avg_homework_score: parseFloat(homeworkResults.rows[0].avg_homework_score || 0),
                on_time_submissions: homeworkResults.rows[0].on_time_submissions || 0,
                punctuality_rate: homeworkResults.rows[0].total_homework > 0 ? 
                    (homeworkResults.rows[0].on_time_submissions / homeworkResults.rows[0].total_homework * 100) : 0
            };

        } else if (levelNumber === 2) {
            // Level 2 (Teachers/Managers) - Focus on teaching and management
            const evaluationTasks = await pool.query(`
                SELECT 
                    COUNT(*) as total_evaluations,
                    COUNT(CASE WHEN s.status = 'submitted' THEN 1 END) as completed_evaluations
                FROM tasks t 
                LEFT JOIN submissions s ON t.id = s.task_id 
                WHERE t.assigned_to = $1 AND t.course_id = $2 
                AND t.task_type IN ('review', 'evaluation')
            `, [userId, courseId]);

            metrics.evaluation_performance = {
                total_evaluations: evaluationTasks.rows[0].total_evaluations || 0,
                completed_evaluations: evaluationTasks.rows[0].completed_evaluations || 0,
                completion_rate: evaluationTasks.rows[0].total_evaluations > 0 ? 
                    (evaluationTasks.rows[0].completed_evaluations / evaluationTasks.rows[0].total_evaluations * 100) : 0
            };

        } else if (levelNumber === 1) {
            // Level 1 (Supervisors) - Focus on oversight and management
            const supervisionTasks = await pool.query(`
                SELECT 
                    COUNT(*) as total_supervision_tasks,
                    COUNT(CASE WHEN s.status = 'submitted' THEN 1 END) as completed_supervision
                FROM tasks t 
                LEFT JOIN submissions s ON t.id = s.task_id 
                WHERE t.assigned_to = $1 AND t.course_id = $2 
                AND t.task_type = 'review'
            `, [userId, courseId]);

            metrics.supervision_performance = {
                total_supervision_tasks: supervisionTasks.rows[0].total_supervision_tasks || 0,
                completed_supervision: supervisionTasks.rows[0].completed_supervision || 0,
                supervision_rate: supervisionTasks.rows[0].total_supervision_tasks > 0 ? 
                    (supervisionTasks.rows[0].completed_supervision / supervisionTasks.rows[0].total_supervision_tasks * 100) : 0
            };
        }

        return metrics;
    } catch (error) {
        console.error('Error calculating level-specific metrics:', error);
        return metrics;
    }
}

async function updateUserPerformanceRecord(userId, courseId, performanceData) {
    try {
        // Update or insert performance evaluation record
        await pool.query(`
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
            userId,
            courseId,
            performanceData.level_number,
            performanceData.completion_rate || 0,
            performanceData.average_grade || 0,
            performanceData.on_time_completion_rate || 0,
            performanceData.overall_score || 0,
            JSON.stringify(performanceData)
        ]);

        // Update enrollment grade
        await pool.query(`
            UPDATE enrollments 
            SET grade = $1 
            WHERE user_id = $2 AND course_id = $3
        `, [JSON.stringify(performanceData), userId, courseId]);

    } catch (error) {
        console.error('Error updating performance record:', error);
        throw error;
    }
}
