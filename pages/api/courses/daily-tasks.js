import pool from '../../../lib/db';
import jwt from 'jsonwebtoken';
import errorHandler from '../../../lib/errorHandler';

export default async function handler(req, res) {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (req.method === 'GET') {
            // Get daily tasks for a user
            const { courseId, userId, dayNumber } = req.query;
            
            // Users can view their own tasks, supervisors can view subordinates' tasks
            if (userId && userId != decoded.id && !['admin', 'head', 'teacher'].includes(decoded.role)) {
                return res.status(403).json({ message: 'Not authorized to view these tasks' });
            }

            const targetUserId = userId || decoded.id;
            
            let query = `
                SELECT 
                    t.*,
                    s.status as submission_status,
                    s.submitted_at,
                    s.grade,
                    s.feedback,
                    cs.title as day_title,
                    cs.day_number,
                    cs.scheduled_date
                FROM tasks t 
                JOIN course_schedule cs ON t.schedule_id = cs.id 
                LEFT JOIN submissions s ON t.id = s.task_id AND s.user_id = $1
                WHERE t.assigned_to = $1
            `;
            
            const params = [targetUserId];
            
            if (courseId) {
                query += ` AND t.course_id = $${params.length + 1}`;
                params.push(courseId);
            }
            
            if (dayNumber) {
                query += ` AND cs.day_number = $${params.length + 1}`;
                params.push(dayNumber);
            }
            
            query += ` ORDER BY cs.day_number, t.id`;

            const tasks = await pool.query(query, params);

            // Group tasks by day
            const tasksByDay = {};
            tasks.rows.forEach(task => {
                const dayKey = task.day_number;
                if (!tasksByDay[dayKey]) {
                    tasksByDay[dayKey] = {
                        day_number: task.day_number,
                        day_title: task.day_title,
                        scheduled_date: task.scheduled_date,
                        tasks: []
                    };
                }
                
                tasksByDay[dayKey].tasks.push({
                    id: task.id,
                    type: task.task_type,
                    title: task.title,
                    description: task.description,
                    instructions: task.instructions,
                    due_date: task.due_date,
                    max_score: task.max_score,
                    level_number: task.level_number,
                    is_active: task.is_active,
                    released_at: task.released_at,
                    submission: {
                        status: task.submission_status,
                        submitted_at: task.submitted_at,
                        grade: task.grade,
                        feedback: task.feedback
                    }
                });
            });

            res.status(200).json({
                success: true,
                tasksByDay: Object.values(tasksByDay),
                totalTasks: tasks.rows.length
            });

        } else if (req.method === 'POST') {
            // Create a new task (for teachers/admins)
            if (!['admin', 'head', 'teacher'].includes(decoded.role)) {
                return res.status(403).json({ message: 'Not authorized to create tasks' });
            }

            const { 
                courseId, 
                scheduleId, 
                taskType, 
                title, 
                description, 
                instructions,
                dueDate,
                maxScore,
                assignedUsers,
                levelNumber
            } = req.body;

            if (!courseId || !scheduleId || !taskType || !title) {
                return res.status(400).json({ message: 'Missing required fields' });
            }

            // Check if user has permission to create tasks for this course
            const courseCheck = await pool.query(`
                SELECT id FROM courses 
                WHERE id = $1 AND (created_by = $2 OR $3 = ANY(ARRAY['admin', 'head']))
            `, [courseId, decoded.id, decoded.role]);

            if (courseCheck.rows.length === 0) {
                return res.status(403).json({ message: 'Not authorized to create tasks for this course' });
            }

            await pool.query('BEGIN');

            try {
                const createdTasks = [];

                // If specific users are assigned, create tasks for them
                if (assignedUsers && assignedUsers.length > 0) {
                    for (const userId of assignedUsers) {
                        const result = await pool.query(`
                            INSERT INTO tasks (
                                schedule_id, task_type, title, description, due_date,
                                assigned_to, level_number, course_id, max_score, 
                                instructions, created_by, is_active
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                            RETURNING id
                        `, [
                            scheduleId, taskType, title, description, dueDate,
                            userId, levelNumber, courseId, maxScore || 100,
                            instructions, decoded.id, true
                        ]);

                        createdTasks.push(result.rows[0].id);

                        // Create notification
                        await pool.query(`
                            INSERT INTO notifications (user_id, type, message, related_id)
                            VALUES ($1, 'new_task', $2, $3)
                        `, [userId, `مهمة جديدة: ${title}`, courseId]);
                    }
                } else if (levelNumber) {
                    // Create tasks for all users in the specified level
                    const levelUsers = await pool.query(`
                        SELECT DISTINCT e.user_id 
                        FROM enrollments e 
                        JOIN users u ON e.user_id = u.id 
                        JOIN course_participant_levels cpl ON cpl.course_id = e.course_id 
                        WHERE e.course_id = $1 AND e.status = 'active' 
                        AND u.role = ANY(cpl.target_roles) 
                        AND cpl.level_number = $2
                    `, [courseId, levelNumber]);

                    for (const user of levelUsers.rows) {
                        const result = await pool.query(`
                            INSERT INTO tasks (
                                schedule_id, task_type, title, description, due_date,
                                assigned_to, level_number, course_id, max_score, 
                                instructions, created_by, is_active
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                            RETURNING id
                        `, [
                            scheduleId, taskType, title, description, dueDate,
                            user.user_id, levelNumber, courseId, maxScore || 100,
                            instructions, decoded.id, true
                        ]);

                        createdTasks.push(result.rows[0].id);

                        // Create notification
                        await pool.query(`
                            INSERT INTO notifications (user_id, type, message, related_id)
                            VALUES ($1, 'new_task', $2, $3)
                        `, [user.user_id, `مهمة جديدة: ${title}`, courseId]);
                    }
                }

                await pool.query('COMMIT');

                res.status(201).json({
                    success: true,
                    message: 'Tasks created successfully',
                    createdTasks: createdTasks.length,
                    taskIds: createdTasks
                });

            } catch (error) {
                await pool.query('ROLLBACK');
                throw error;
            }

        } else {
            res.status(405).json({ message: 'Method Not Allowed' });
        }

    } catch (err) {
        console.error('Daily tasks error:', err);
        errorHandler(err, res);
    }
}