import pool from '../../../../lib/db';
import { getSession } from 'next-auth/react';
import { notificationService } from '../../../../services/notificationService';
import { evaluateTaskSubmission } from '../../../../lib/performanceEvaluator';

const GRADING_TASK_DUE_DAYS = 3; // Teacher has 3 days to grade

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const session = await getSession({ req });
    if (!session || !session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id: taskId } = req.query;
    const { content } = req.body;
    const userId = session.user.id;

    if (!content || content.trim() === '') {
        return res.status(400).json({ message: 'لا يمكن أن يكون محتوى التقديم فارغًا.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Check for existing submission
        const existingSubmission = await client.query(
            'SELECT id FROM submissions WHERE task_id = $1 AND user_id = $2',
            [taskId, userId]
        );

        if (existingSubmission.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ message: 'لقد قمت بالفعل بتقديم هذه المهمة.' });
        }

        // 2. Get task details
        const taskRes = await client.query(
            `SELECT t.id, t.title, t.due_date, t.schedule_id, c.teacher_id 
             FROM tasks t
             JOIN course_schedule cs ON t.schedule_id = cs.id
             JOIN courses c ON cs.course_id = c.id
             WHERE t.id = $1`,
            [taskId]
        );

        if (taskRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'المهمة غير موجودة.' });
        }
        
        const task = taskRes.rows[0];
        const submittedAt = new Date();
        const isLate = task.due_date && new Date(task.due_date) < submittedAt;
        const submissionStatus = isLate ? 'late' : 'submitted';

        // 3. Insert the student's submission
        const submissionResult = await client.query(
            `INSERT INTO submissions (task_id, user_id, content, status, submitted_at)
             VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [taskId, userId, content, submissionStatus, submittedAt]
        );
        const submissionId = submissionResult.rows[0].id;

        // 4. Create notification for the teacher
        if (task.teacher_id) {
            const message = `قام الطالب ${session.user.name} بتقديم المهمة "${task.title}".`;
            const link = `/teacher/gradebook?submission_id=${submissionId}`;
            await notificationService.createNotification(client, task.teacher_id, 'new_submission', message, link);
        }

        // 5. NEW: Create a grading task for the teacher if it doesn't exist
        if (task.teacher_id) {
            const gradingTaskKey = `TEACHER_GRADES`;
            const existingGradingTask = await client.query(
                `SELECT id FROM tasks 
                 WHERE assigned_to = $1 
                   AND system_task_key = $2
                   AND related_entity_id = $3`,
                [task.teacher_id, gradingTaskKey, task.id]
            );

            if (existingGradingTask.rows.length === 0) {
                const gradingDueDate = new Date();
                gradingDueDate.setDate(gradingDueDate.getDate() + GRADING_TASK_DUE_DAYS);

                await client.query(
                    `INSERT INTO tasks (schedule_id, title, description, due_date, assigned_to, system_task_key, related_entity_id, task_type)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, 'grading')`,
                    [
                        task.schedule_id, // Associate with the same course schedule day
                        `تقييم واجب: "${task.title}"`,
                        `يرجى تقييم جميع الواجبات المقدمة للمهمة الأصلية.`,
                        gradingDueDate,
                        task.teacher_id,
                        gradingTaskKey,
                        task.id, // Link back to the original student task
                    ]
                );
            }
        }

        await client.query('COMMIT');
        
        // 6. Fire-and-forget performance evaluation after the main transaction is complete
        evaluateTaskSubmission(
            task, 
            { user_id: userId, submitted_at: submittedAt },
            submissionId
        ).catch(err => console.error("Performance evaluation failed:", err));

        res.status(201).json({ message: 'تم تقديم المهمة بنجاح!' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error submitting task:', error);
        res.status(500).json({ message: 'فشل تقديم المهمة.' });
    } finally {
        client.release();
    }
}