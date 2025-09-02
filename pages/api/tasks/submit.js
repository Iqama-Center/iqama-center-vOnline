import pool from '../../../lib/db';
import jwt from 'jsonwebtoken';
import errorHandler from '../../../lib/errorHandler';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const { taskId, submission_content, submission_type = 'text' } = req.body;

        if (!taskId) {
            return res.status(400).json({ message: 'Task ID is required' });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Verify task exists and is assigned to user
            const taskResult = await client.query(`
                SELECT t.*, c.name as course_name
                FROM tasks t
                JOIN courses c ON t.course_id = c.id
                WHERE t.id = $1 AND t.assigned_to = $2 AND t.is_active = true
            `, [taskId, userId]);

            if (taskResult.rows.length === 0) {
                return res.status(404).json({ message: 'Task not found or not assigned to you' });
            }

            const task = taskResult.rows[0];

            // Check if task is still within deadline
            const now = new Date();
            const dueDate = new Date(task.due_date);
            const isOverdue = now > dueDate;

            // Check if already submitted
            const existingSubmission = await client.query(`
                SELECT id, status FROM task_submissions WHERE task_id = $1 AND user_id = $2
            `, [taskId, userId]);

            let submissionId;
            let isNewSubmission = existingSubmission.rows.length === 0;

            if (isNewSubmission) {
                // Create new submission
                const submissionResult = await client.query(`
                    INSERT INTO task_submissions (
                        task_id, user_id, course_id, submission_content, 
                        submission_type, status, submitted_at, is_late
                    ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, $7)
                    RETURNING id
                `, [
                    taskId, userId, task.course_id, submission_content,
                    submission_type, 'submitted', isOverdue
                ]);
                submissionId = submissionResult.rows[0].id;
            } else {
                // Update existing submission
                submissionId = existingSubmission.rows[0].id;
                await client.query(`
                    UPDATE task_submissions 
                    SET submission_content = $1, submission_type = $2, 
                        status = 'submitted', submitted_at = CURRENT_TIMESTAMP,
                        is_late = $3
                    WHERE id = $4
                `, [submission_content, submission_type, isOverdue, submissionId]);
            }

            // Mark task as completed
            await client.query(`
                UPDATE tasks SET status = 'completed' WHERE id = $1
            `, [taskId]);

            // Calculate score based on task type and timing
            let score = task.max_score;
            let scoreReduction = 0;

            if (isOverdue) {
                // Apply late penalty
                const latePenalty = calculateLatePenalty(task.task_type);
                scoreReduction = (score * latePenalty) / 100;
                score = Math.max(0, score - scoreReduction);
            }

            // Update submission with calculated score
            await client.query(`
                UPDATE task_submissions 
                SET score = $1, score_reduction = $2
                WHERE id = $3
            `, [score, scoreReduction, submissionId]);

            // Update user's course performance
            await updateUserPerformance(client, userId, task.course_id, task.task_type, score, task.max_score);

            // Create completion notification
            await client.query(`
                INSERT INTO notifications (user_id, type, message, related_id, created_at)
                VALUES ($1, 'task_completed', $2, $3, CURRENT_TIMESTAMP)
            `, [
                userId,
                `تم تسليم المهمة: ${task.title}${isOverdue ? ' (متأخر)' : ''}`,
                taskId
            ]);

            // Notify teacher/supervisor if applicable
            if (['homework', 'exam', 'weekly_report'].includes(task.task_type)) {
                await notifyInstructors(client, task, userId, isOverdue);
            }

            await client.query('COMMIT');

            res.status(200).json({
                success: true,
                message: isOverdue ? 'تم تسليم المهمة متأخراً' : 'تم تسليم المهمة بنجاح',
                submissionId,
                score,
                scoreReduction,
                isLate: isOverdue
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (err) {
        console.error('Task submission error:', err);
        errorHandler(err, res);
    }
}

// Helper methods
function calculateLatePenalty(taskType) {
        switch (taskType) {
            case 'daily_reading':
            case 'daily_quiz':
                return 50; // 50% penalty for late daily tasks
            case 'homework':
                return 20; // 20% penalty for late homework
            case 'exam':
                return 30; // 30% penalty for late exams
            default:
                return 10; // 10% default penalty
        }
    }


async function updateUserPerformance(client, userId, courseId, taskType, score, maxScore) {
        // Update enrollment grade
        await client.query(`
            UPDATE enrollments 
            SET grade = COALESCE(grade, '{}')::jsonb || 
                jsonb_build_object(
                    'total_score', 
                    COALESCE((grade->>'total_score')::numeric, 0) + $1,
                    'max_possible_score',
                    COALESCE((grade->>'max_possible_score')::numeric, 0) + $2,
                    'tasks_completed',
                    COALESCE((grade->>'tasks_completed')::numeric, 0) + 1,
                    'last_updated',
                    CURRENT_TIMESTAMP::text
                )
            WHERE user_id = $3 AND course_id = $4
        `, [score, maxScore, userId, courseId]);

        // Record performance entry
        await client.query(`
            INSERT INTO user_performance (
                user_id, course_id, metric_type, metric_value, recorded_at
            ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
        `, [userId, courseId, `${taskType}_completion`, score]);
    }


async function notifyInstructors(client, task, studentId, isOverdue) {
        // Get course instructors
        const instructors = await client.query(`
            SELECT DISTINCT e.user_id
            FROM enrollments e
            JOIN users u ON e.user_id = u.id
            WHERE e.course_id = $1 
            AND u.role IN ('teacher', 'supervisor', 'admin', 'head')
            AND e.status = 'active'
        `, [task.course_id]);

        const studentResult = await client.query(`
            SELECT name FROM users WHERE id = $1
        `, [studentId]);

        const studentName = studentResult.rows[0]?.name || 'طالب';

        for (const instructor of instructors.rows) {
            await client.query(`
                INSERT INTO notifications (user_id, type, message, related_id, created_at)
                VALUES ($1, 'student_submission', $2, $3, CURRENT_TIMESTAMP)
            `, [
                instructor.user_id,
                `قام ${studentName} بتسليم: ${task.title}${isOverdue ? ' (متأخر)' : ''}`,
                task.id
            ]);
        }
    }


// Ensure task_submissions table exists
async function ensureTaskSubmissionsTable() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS task_submissions (
                id SERIAL PRIMARY KEY,
                task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
                submission_content TEXT,
                submission_type VARCHAR(50) DEFAULT 'text',
                status VARCHAR(50) DEFAULT 'submitted',
                score NUMERIC(5,2),
                score_reduction NUMERIC(5,2) DEFAULT 0,
                is_late BOOLEAN DEFAULT false,
                submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                graded_at TIMESTAMP WITH TIME ZONE,
                graded_by INTEGER REFERENCES users(id),
                feedback TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_task_submissions_task_user ON task_submissions(task_id, user_id)
        `);

        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_task_submissions_course ON task_submissions(course_id)
        `);

        console.log('Task submissions table ensured');
    } catch (error) {
        console.error('Error ensuring task submissions table:', error);
    }
}

// Initialize table on module load
ensureTaskSubmissionsTable();