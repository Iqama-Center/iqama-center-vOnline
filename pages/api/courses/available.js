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
        // Determine user's درجة level based on role
        let userLevel = 3; // Default to درجة 3 (students/recipients)
        if (['admin', 'head'].includes(user.role)) {
            userLevel = 1; // درجة 1 (supervisors)
        } else if (['teacher', 'worker'].includes(user.role)) {
            userLevel = 2; // درجة 2 (managers/teachers)
        }

        let coursesQuery;
        let queryParams = [user.id];

        if (userLevel === 3) {
            // For درجة 3 users (students), only show courses where درجة 1 and 2 have enrolled
            coursesQuery = `
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
                AND NOT EXISTS (
                    SELECT 1 FROM enrollments e2 
                    WHERE e2.course_id = c.id 
                    AND e2.user_id = $1 
                    AND e2.status IN ('pending_payment', 'pending_approval', 'active', 'waiting_start')
                )
                AND EXISTS (
                    -- Check if درجة 1 users (supervisors) have enrolled
                    SELECT 1 FROM enrollments e1 
                    JOIN users u1 ON e1.user_id = u1.id 
                    WHERE e1.course_id = c.id 
                    AND u1.role IN ('admin', 'head')
                    AND e1.status IN ('active', 'pending_approval', 'waiting_start')
                )
                AND EXISTS (
                    -- Check if درجة 2 users (teachers/managers) have enrolled
                    SELECT 1 FROM enrollments e2 
                    JOIN users u2 ON e2.user_id = u2.id 
                    WHERE e2.course_id = c.id 
                    AND u2.role IN ('teacher', 'worker')
                    AND e2.status IN ('active', 'pending_approval', 'waiting_start')
                )
                GROUP BY c.id, c.name, c.description, c.details, c.status, c.created_at, c.is_published
                ORDER BY c.created_at DESC
                LIMIT 50
            `;
        } else {
            // For درجة 1 and 2 users, show all published courses
            coursesQuery = `
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
                AND NOT EXISTS (
                    SELECT 1 FROM enrollments e2 
                    WHERE e2.course_id = c.id 
                    AND e2.user_id = $1 
                    AND e2.status IN ('pending_payment', 'pending_approval', 'active', 'waiting_start')
                )
                GROUP BY c.id, c.name, c.description, c.details, c.status, c.created_at, c.is_published
                ORDER BY c.created_at DESC
                LIMIT 50
            `;
        }

        const result = await pool.query(coursesQuery, queryParams);
        const availableCourses = result.rows;

        res.status(200).json({
            success: true,
            courses: availableCourses,
            count: availableCourses.length,
            userLevel: userLevel // Include user level for debugging
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