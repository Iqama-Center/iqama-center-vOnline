import pool from '../../../../lib/db';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Only allow admins and heads to view enrollments
        if (!['admin', 'head'].includes(decoded.role)) {
            return res.status(403).json({ message: 'غير مصرح لك بعرض التسجيلات' });
        }

        // Fetch pending enrollments from database
        const result = await pool.query(`
            SELECT 
                e.id,
                e.user_id,
                e.course_id,
                e.status,
                CURRENT_TIMESTAMP as enrollment_date,
                u.full_name as user_name,
                u.email as user_email,
                u.role as user_role,
                c.name as course_name,
                c.description as course_description
            FROM enrollments e
            JOIN users u ON e.user_id = u.id
            JOIN courses c ON e.course_id = c.id
            WHERE e.status = 'pending_approval'
            ORDER BY e.id DESC
        `);

        const enrollments = result.rows.map(enrollment => ({
            id: enrollment.id,
            user_id: enrollment.user_id,
            course_id: enrollment.course_id,
            user_name: enrollment.user_name,
            user_email: enrollment.user_email,
            user_role: enrollment.user_role,
            specializations: [], // Remove specializations since column doesn't exist
            course_name: enrollment.course_name,
            course_description: enrollment.course_description,
            enrollment_date: enrollment.enrollment_date,
            status: enrollment.status
        }));

        res.status(200).json({ 
            enrollments,
            total: enrollments.length 
        });

    } catch (err) {
        console.error('Error fetching enrollments:', err);
        res.status(500).json({ message: 'خطأ في الخادم' });
    }
}