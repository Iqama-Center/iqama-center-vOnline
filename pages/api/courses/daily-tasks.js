import pool from '../../../lib/db';
import { withAuth } from '../../../lib/withAuth';
import errorHandler from '../../../lib/errorHandler';
import NotificationService from '../../../services/notificationService';

export default withAuth(async (req, res) => {
    const { user } = req;

    try {
        if (req.method === 'GET') {
            await handleGet(req, res, user);
        } else if (req.method === 'POST') {
            await handlePost(req, res, user);
        } else {
            res.status(405).json({ message: 'Method Not Allowed' });
        }
    } catch (err) {
        console.error('Daily tasks API error:', err);
        errorHandler(err, res);
    }
});

async function handleGet(req, res, user) {
    const { courseId, userId, dayNumber } = req.query;

    if (userId && userId !== user.id && !['admin', 'head', 'teacher'].includes(user.role)) {
        return res.status(403).json({ message: 'Not authorized to view these tasks' });
    }
    const targetUserId = userId || user.id;

    // This single query now fetches and aggregates tasks by day directly in the database.
    const query = `
        SELECT
            cs.day_number,
            cs.title as day_title,
            cs.scheduled_date,
            JSON_AGG(
                JSON_BUILD_OBJECT(
                    'id', t.id,
                    'type', t.task_type,
                    'title', t.title,
                    'description', t.description,
                    'instructions', t.instructions,
                    'due_date', t.due_date,
                    'max_score', t.max_score,
                    'is_active', t.is_active,
                    'submission', JSON_BUILD_OBJECT(
                        'status', s.status,
                        'submitted_at', s.submitted_at,
                        'grade', s.grade,
                        'feedback', s.feedback
                    )
                ) ORDER BY t.id
            ) as tasks
        FROM course_schedule cs
        JOIN tasks t ON cs.id = t.schedule_id
        LEFT JOIN submissions s ON t.id = s.task_id AND s.user_id = $1
        WHERE t.assigned_to = $1
          AND ($2::INT IS NULL OR t.course_id = $2)
          AND ($3::INT IS NULL OR cs.day_number = $3)
        GROUP BY cs.day_number, cs.title, cs.scheduled_date
        ORDER BY cs.day_number;
    `;

    const { rows } = await pool.query(query, [targetUserId, courseId || null, dayNumber || null]);

    res.status(200).json({
        success: true,
        tasksByDay: rows,
        totalDays: rows.length
    });
}

async function handlePost(req, res, user) {
    if (!['admin', 'head', 'teacher'].includes(user.role)) {
        return res.status(403).json({ message: 'Not authorized to create tasks' });
    }

    const { courseId, scheduleId, taskType, title, assignedUsers, levelNumber, ...taskData } = req.body;
    if (!courseId || !scheduleId || !taskType || !title) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const courseCheck = await client.query('SELECT id FROM courses WHERE id = $1', [courseId]);
        if (courseCheck.rows.length === 0) throw new Error('Course not found');

        let targetUserIds = [];
        if (assignedUsers && assignedUsers.length > 0) {
            targetUserIds = assignedUsers;
        } else if (levelNumber) {
            const levelUsersResult = await client.query(
                'SELECT user_id FROM enrollments WHERE course_id = $1 AND level_number = $2 AND status = \'active\'',
                [courseId, levelNumber]
            );
            targetUserIds = levelUsersResult.rows.map(r => r.user_id);
        }

        if (targetUserIds.length === 0) {
            return res.status(400).json({ message: 'No users found to assign tasks to.' });
        }

        // Bulk insert tasks
        const taskValues = targetUserIds.map(userId => [scheduleId, taskType, title, taskData.description, taskData.dueDate, userId, levelNumber, courseId, taskData.maxScore || 100, taskData.instructions, user.id, true]);
        const taskResult = await client.query(`
            INSERT INTO tasks (schedule_id, task_type, title, description, due_date, assigned_to, level_number, course_id, max_score, instructions, created_by, is_active)
            SELECT v.* FROM unnest($1::integer[], $2::task_type[], $3::varchar[], $4::text[], $5::timestamptz[], $6::integer[], $7::integer[], $8::integer[], $9::numeric[], $10::text[], $11::integer[], $12::boolean[]) AS v
            RETURNING id
        `, [
            taskValues.map(t => t[0]), taskValues.map(t => t[1]), taskValues.map(t => t[2]), taskValues.map(t => t[3]), 
            taskValues.map(t => t[4]), taskValues.map(t => t[5]), taskValues.map(t => t[6]), taskValues.map(t => t[7]), 
            taskValues.map(t => t[8]), taskValues.map(t => t[9]), taskValues.map(t => t[10]), taskValues.map(t => t[11])
        ]);

        // Bulk create notifications
        await NotificationService.createNotification({
            userIds: targetUserIds,
            type: 'new_task',
            title: 'مهمة جديدة',
            message: `مهمة جديدة: ${title}`,
            relatedId: courseId,
            client
        });

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            message: 'Tasks created successfully',
            createdTasks: taskResult.rows.length,
            taskIds: taskResult.rows.map(r => r.id)
        });

    } catch (error) {
        await client.query('ROLLBACK').catch(console.error);
        throw error; // Let the centralized error handler catch it
    } finally {
        client.release();
    }
}
