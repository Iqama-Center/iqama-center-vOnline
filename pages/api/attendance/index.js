import pool from '../../../lib/db';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
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

        // Verify user has permission
        const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0 || !['teacher', 'admin', 'head', 'student', 'parent'].includes(userResult.rows[0].role)) {
            return res.status(403).json({ message: 'غير مصرح لك بعرض هذه البيانات' });
        }

        const { course_id, date, student_id } = req.query;

        let attendanceQuery = '';
        let queryParams = [];

        if (course_id && date) {
            // Get attendance for specific course and date
            attendanceQuery = `
                SELECT 
                    a.*,
                    u.full_name as student_name
                FROM attendance a
                JOIN users u ON a.user_id = u.id
                WHERE a.course_id = $1 AND a.date = $2
                ORDER BY u.full_name ASC
            `;
            queryParams = [course_id, date];
        } else if (student_id) {
            // Get attendance history for specific student
            attendanceQuery = `
                SELECT 
                    a.*,
                    c.name as course_name
                FROM attendance a
                JOIN courses c ON a.course_id = c.id
                WHERE a.user_id = $1
                ORDER BY a.date DESC
                LIMIT 50
            `;
            queryParams = [student_id];
        } else {
            return res.status(400).json({ message: 'معاملات غير صحيحة' });
        }

        const attendanceResult = await pool.query(attendanceQuery, queryParams);

        res.status(200).json({
            success: true,
            attendance: attendanceResult.rows
        });

    } catch (err) {
        console.error('Get attendance error:', err);
        res.status(500).json({ message: 'حدث خطأ في الخادم' });
    }
}