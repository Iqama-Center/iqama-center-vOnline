import { withAuth } from '../../../lib/withAuth';
import pool from '../../../lib/db';

/**
 * API endpoint to fetch available courses for a user
 * Excludes courses the user is already enrolled in
 */
async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { user } = req;

    try {
        // Get courses user can enroll in
        const result = await pool.query(`
            SELECT 
                c.id, 
                c.name, 
                c.description, 
                c.details, 
                c.status, 
                c.created_at,
                c.is_published,
                COUNT(e.id) as student_count
            FROM courses c
            LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = 'active'
            WHERE (c.status = 'active' OR (c.status = 'published' AND c.is_published = true))
            AND c.teacher_id IS NOT NULL
            AND NOT EXISTS (
                SELECT 1 FROM enrollments e2 
                WHERE e2.course_id = c.id 
                AND e2.user_id = $1 
                AND e2.status IN ('pending_payment', 'pending_approval', 'active', 'waiting_start')
            )
            GROUP BY c.id, c.name, c.description, c.details, c.status, c.created_at, c.is_published
            ORDER BY c.created_at DESC
            LIMIT 50
        `, [user.id]);
        
        const availableCourses = result.rows;

        res.status(200).json({
            success: true,
            courses: availableCourses,
            count: availableCourses.length
        });

    } catch (error) {
        console.error('Error fetching available courses:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في تحميل الدورات المتاحة',
            courses: []
        });
    }
}

export default withAuth(handler);