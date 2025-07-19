import pool from '../../../lib/db';
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
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