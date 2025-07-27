import { withAuth } from '../../../lib/withAuth';
import pool from '../../../lib/db';

/**
 * API endpoint to fetch user's enrolled courses
 * Used by the improved courses page for client-side data fetching
 */
async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { user } = req;

    try {
        // Get courses user is enrolled in with enhanced error handling
        const enrolledCoursesResult = await pool.query(`
            SELECT 
                c.id, 
                c.name, 
                c.description, 
                c.details, 
                c.status, 
                c.created_at,
                e.status as enrollment_status, 
                e.id as enrollment_id, 
                e.created_at as enrollment_date,
                COUNT(e2.id) as student_count
            FROM courses c
            JOIN enrollments e ON c.id = e.course_id
            LEFT JOIN enrollments e2 ON c.id = e2.course_id AND e2.status = 'active'
            WHERE e.user_id = $1 
            AND e.status IN ('pending_payment', 'pending_approval', 'active', 'waiting_start')
            AND e.status != 'cancelled'
            GROUP BY c.id, c.name, c.description, c.details, c.status, c.created_at, 
                     e.status, e.id, e.created_at
            ORDER BY e.created_at DESC
            LIMIT 20
        `, [user.id]);

        res.status(200).json({
            success: true,
            courses: enrolledCoursesResult.rows,
            count: enrolledCoursesResult.rows.length
        });

    } catch (error) {
        console.error('Error fetching enrolled courses:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في تحميل الدورات المسجل بها',
            courses: []
        });
    }
}

export default withAuth(handler);