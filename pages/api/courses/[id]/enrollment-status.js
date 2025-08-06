import pool from '../../../../lib/db';
import { withAuth } from '../../../../lib/withAuth';

async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { id: courseId } = req.query;
    const { user } = req;

    try {
        // Check enrollment status for درجة 1 and درجة 2 users
        const enrollmentCheck = await pool.query(`
            SELECT 
                EXISTS (
                    SELECT 1 FROM enrollments e1 
                    JOIN users u1 ON e1.user_id = u1.id 
                    WHERE e1.course_id = $1 
                    AND u1.role IN ('admin', 'head')
                    AND e1.status IN ('active', 'pending_approval', 'waiting_start')
                ) as has_degree_1,
                EXISTS (
                    SELECT 1 FROM enrollments e2 
                    JOIN users u2 ON e2.user_id = u2.id 
                    WHERE e2.course_id = $1 
                    AND u2.role IN ('teacher', 'worker')
                    AND e2.status IN ('active', 'pending_approval', 'waiting_start')
                ) as has_degree_2,
                (
                    EXISTS (
                        SELECT 1 FROM enrollments e1 
                        JOIN users u1 ON e1.user_id = u1.id 
                        WHERE e1.course_id = $1 
                        AND u1.role IN ('admin', 'head')
                        AND e1.status IN ('active', 'pending_approval', 'waiting_start')
                    ) AND EXISTS (
                        SELECT 1 FROM enrollments e2 
                        JOIN users u2 ON e2.user_id = u2.id 
                        WHERE e2.course_id = $1 
                        AND u2.role IN ('teacher', 'worker')
                        AND e2.status IN ('active', 'pending_approval', 'waiting_start')
                    )
                ) as is_visible_to_degree_3
        `, [courseId]);

        const status = enrollmentCheck.rows[0];

        // Get detailed enrollment counts
        const enrollmentCounts = await pool.query(`
            SELECT 
                u.role,
                CASE 
                    WHEN u.role IN ('admin', 'head') THEN 1
                    WHEN u.role IN ('teacher', 'worker') THEN 2
                    ELSE 3
                END as degree_level,
                COUNT(*) as count
            FROM enrollments e
            JOIN users u ON e.user_id = u.id
            WHERE e.course_id = $1 
            AND e.status IN ('active', 'pending_approval', 'waiting_start')
            GROUP BY u.role, degree_level
        `, [courseId]);

        // Organize counts by degree
        const degreeCounts = {
            degree_1: 0,
            degree_2: 0,
            degree_3: 0
        };

        enrollmentCounts.rows.forEach(row => {
            if (row.degree_level === 1) degreeCounts.degree_1 += parseInt(row.count);
            if (row.degree_level === 2) degreeCounts.degree_2 += parseInt(row.count);
            if (row.degree_level === 3) degreeCounts.degree_3 += parseInt(row.count);
        });

        res.status(200).json({
            success: true,
            hasDegree1: status.has_degree_1,
            hasDegree2: status.has_degree_2,
            isVisible: status.is_visible_to_degree_3,
            enrollmentCounts: degreeCounts,
            requirements: {
                degree1Required: !status.has_degree_1,
                degree2Required: !status.has_degree_2,
                readyForStudents: status.is_visible_to_degree_3
            }
        });

    } catch (error) {
        console.error('Error checking enrollment status:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في التحقق من حالة التسجيل'
        });
    }
}

export default withAuth(handler);