import pool from '../../../../lib/db';
import { getSession } from 'next-auth/react';
import { notificationService } from '../../../../services/notificationService';

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

        const existingSubmission = await client.query(
            'SELECT id FROM submissions WHERE task_id = $1 AND user_id = $2',
            [taskId, userId]
        );

        if (existingSubmission.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ message: 'لقد قمت بالفعل بتقديم هذه المهمة.' });
        }

        const taskRes = await client.query(
            `SELECT t.due_date, c.teacher_id, t.title 
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
        const isLate = task.due_date && new Date(task.due_date) < new Date();
        const submissionStatus = isLate ? 'late' : 'submitted';

        const submissionResult = await client.query(
            `INSERT INTO submissions (task_id, user_id, content, status, submitted_at)
             VALUES ($1, $2, $3, $4, NOW()) RETURNING id`,
            [taskId, userId, content, submissionStatus]
        );
        const submissionId = submissionResult.rows[0].id;

        if (task.teacher_id) {
            const message = `قام الطالب ${session.user.name} بتقديم المهمة "${task.title}".`;
            const link = `/teacher/gradebook?submission_id=${submissionId}`;
            await notificationService.createNotification(client, task.teacher_id, 'new_submission', message, link);
        }

        await client.query('COMMIT');
        res.status(201).json({ message: 'تم تقديم المهمة بنجاح!' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error submitting task:', error);
        res.status(500).json({ message: 'فشل تقديم المهمة.' });
    } finally {
        client.release();
    }
}