import pool from '../../../../lib/db';
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
        if (userResult.rows.length === 0 || !['teacher', 'admin', 'head'].includes(userResult.rows[0].role)) {
            return res.status(403).json({ message: 'غير مصرح لك بعرض هذه البيانات' });
        }

        const { id: courseId } = req.query;

        // Get enrolled students
        const studentsResult = await pool.query(`
            SELECT 
                u.id,
                u.full_name,
                u.email,
                u.phone,
                e.created_at as enrollment_date,
                e.status as enrollment_status,
                e.id as enrollment_id
            FROM users u
            JOIN enrollments e ON u.id = e.user_id
            WHERE e.course_id = $1 
            AND u.role = 'student'
            AND e.status IN ('active', 'pending_payment')
            ORDER BY u.full_name ASC
        `, [courseId]);

        res.status(200).json({
            success: true,
            students: studentsResult.rows
        });

    } catch (err) {
        console.error('Get course students error:', err);
        res.status(500).json({ message: 'حدث خطأ في الخادم' });
    }
}