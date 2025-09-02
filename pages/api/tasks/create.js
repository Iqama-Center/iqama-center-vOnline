import pool from '../../../lib/db';
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    if (req.method === 'GET') {
        return handleGetTasks(req, res);
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        // Get user from token
        const cookies = parse(req.headers.cookie || '');
        const token = cookies.token;
        
        if (!token) {
            return res.status(401).json({ message: 'غير مصرح' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        // Verify user is a teacher
        const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0 || userResult.rows[0].role !== 'teacher') {
            return res.status(403).json({ message: 'غير مصرح لك بإنشاء المهام' });
        }

        const {
            title,
            description,
            course_id,
            type,
            due_date,
            max_score,
            instructions
        } = req.body;

        // Validate required fields
        if (!title || !description || !course_id || !type || !due_date) {
            return res.status(400).json({ message: 'جميع الحقول المطلوبة يجب ملؤها' });
        }

        // Verify the teacher owns the course
        const courseResult = await pool.query(
            'SELECT id FROM courses WHERE id = $1 AND created_by = $2',
            [course_id, userId]
        );

        if (courseResult.rows.length === 0) {
            return res.status(403).json({ message: 'غير مصرح لك بإنشاء مهام في هذه الدورة' });
        }

        // Create the task
        const taskResult = await pool.query(`
            INSERT INTO tasks (
                title, description, course_id, type, due_date, 
                max_score, instructions, created_by, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
            RETURNING id
        `, [title, description, course_id, type, due_date, max_score || 100, instructions, userId]);

        const taskId = taskResult.rows[0].id;

        // Get all students enrolled in the course
        const studentsResult = await pool.query(`
            SELECT e.user_id 
            FROM enrollments e 
            WHERE e.course_id = $1 AND e.status = 'active'
        `, [course_id]);

        // Create notifications for all enrolled students
        for (const student of studentsResult.rows) {
            await pool.query(`
                INSERT INTO notifications (user_id, type, message, link, created_at)
                VALUES ($1, 'new_task', $2, $3, CURRENT_TIMESTAMP)
            `, [
                student.user_id,
                `مهمة جديدة: ${title}`,
                `/tasks/${taskId}`
            ]);
        }

        res.status(201).json({ 
            message: 'تم إنشاء المهمة بنجاح',
            taskId: taskId
        });
    } catch (err) {
        console.error('Task creation error:', err);
        res.status(500).json({ message: 'حدث خطأ في الخادم' });
    }
}

async function handleGetTasks(req, res) {
    const { parse } = require('cookie');
    
    try {
        // Get user from token
        const cookies = parse(req.headers.cookie || '');
        const token = cookies.token;
        
        if (!token) {
            return res.status(401).json({ message: 'غير مصرح' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        const userRole = decoded.role;

        const { courseId, filter = 'all' } = req.query;

        let query = `
            SELECT 
                t.*,
                c.name as course_name,
                cs.day_number,
                cs.scheduled_date,
                ts.status as submission_status,
                ts.score as submission_score,
                ts.submitted_at,
                ts.is_late
            FROM tasks t
            JOIN courses c ON t.course_id = c.id
            LEFT JOIN course_schedule cs ON t.schedule_id = cs.id
            LEFT JOIN task_submissions ts ON t.id = ts.task_id AND ts.user_id = $1
            WHERE 1=1
        `;
        
        const params = [userId];
        let paramIndex = 2;

        // Filter by course if specified
        if (courseId) {
            query += ` AND t.course_id = $${paramIndex}`;
            params.push(courseId);
            paramIndex++;
        }

        // Filter by user role and assignment
        if (['student'].includes(userRole)) {
            query += ` AND t.assigned_to = $${paramIndex}`;
            params.push(userId);
            paramIndex++;
        } else if (['teacher', 'supervisor', 'admin', 'head'].includes(userRole)) {
            // For instructors, show tasks they created or are responsible for
            query += ` AND (t.created_by = $${paramIndex} OR EXISTS (
                SELECT 1 FROM enrollments e 
                WHERE e.course_id = t.course_id 
                AND e.user_id = $${paramIndex} 
                AND e.status = 'active'
            ))`;
            params.push(userId);
            paramIndex++;
        }

        query += ` ORDER BY t.due_date ASC, t.created_at DESC`;

        const result = await pool.query(query, params);
        
        res.status(200).json({
            success: true,
            tasks: result.rows
        });

    } catch (err) {
        console.error('Get tasks error:', err);
        res.status(500).json({ message: 'حدث خطأ في الخادم' });
    }
}