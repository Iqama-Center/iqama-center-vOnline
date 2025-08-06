import pool from '../../../lib/db';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!['admin', 'head'].includes(decoded.role)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        console.log('🔍 Fetching degree enrollment metrics...');
        
        // Get درجة enrollment metrics
        const degreeMetrics = await pool.query(`
            WITH degree_classification AS (
                SELECT 
                    u.id,
                    u.role,
                    CASE 
                        WHEN u.role IN ('admin', 'head') THEN 1
                        WHEN u.role IN ('teacher', 'worker') THEN 2
                        ELSE 3
                    END as degree_level
                FROM users u
                WHERE (u.account_status = 'active' OR u.account_status IS NULL)
            ),
            course_degree_stats AS (
                SELECT 
                    c.id as course_id,
                    c.name as course_name,
                    c.status as course_status,
                    c.is_published,
                    COUNT(CASE WHEN dc.degree_level = 1 THEN 1 END) as degree_1_enrolled,
                    COUNT(CASE WHEN dc.degree_level = 2 THEN 1 END) as degree_2_enrolled,
                    COUNT(CASE WHEN dc.degree_level = 3 THEN 1 END) as degree_3_enrolled,
                    COUNT(e.id) as total_enrolled,
                    -- Check if course is visible to degree 3
                    CASE 
                        WHEN COUNT(CASE WHEN dc.degree_level = 1 THEN 1 END) > 0 
                         AND COUNT(CASE WHEN dc.degree_level = 2 THEN 1 END) > 0 
                        THEN true 
                        ELSE false 
                    END as visible_to_degree_3
                FROM courses c
                LEFT JOIN enrollments e ON c.id = e.course_id 
                    AND e.status IN ('active', 'pending_approval', 'waiting_start')
                LEFT JOIN degree_classification dc ON e.user_id = dc.id
                WHERE c.status IN ('active', 'published', 'draft') -- Show all courses, not just published
                GROUP BY c.id, c.name, c.status, c.is_published
            )
            SELECT 
                course_id,
                course_name,
                course_status,
                degree_1_enrolled,
                degree_2_enrolled,
                degree_3_enrolled,
                total_enrolled,
                visible_to_degree_3,
                CASE 
                    WHEN degree_1_enrolled = 0 AND degree_2_enrolled = 0 THEN 'waiting_for_staff'
                    WHEN degree_1_enrolled = 0 THEN 'waiting_for_supervisors'
                    WHEN degree_2_enrolled = 0 THEN 'waiting_for_teachers'
                    ELSE 'ready_for_students'
                END as enrollment_stage
            FROM course_degree_stats
            ORDER BY course_name
        `);

        // Get overall degree statistics
        const overallStats = await pool.query(`
            WITH degree_classification AS (
                SELECT 
                    u.id,
                    u.role,
                    CASE 
                        WHEN u.role IN ('admin', 'head') THEN 1
                        WHEN u.role IN ('teacher', 'worker') THEN 2
                        ELSE 3
                    END as degree_level
                FROM users u
                WHERE u.account_status = 'active' OR u.account_status IS NULL
            )
            SELECT 
                COUNT(CASE WHEN dc.degree_level = 1 THEN 1 END) as total_degree_1_users,
                COUNT(CASE WHEN dc.degree_level = 2 THEN 1 END) as total_degree_2_users,
                COUNT(CASE WHEN dc.degree_level = 3 THEN 1 END) as total_degree_3_users,
                (SELECT COUNT(*) FROM courses WHERE is_published = true) as total_published_courses,
                (SELECT COUNT(*) FROM courses c 
                 WHERE c.is_published = true 
                 AND EXISTS (
                     SELECT 1 FROM enrollments e1 
                     JOIN users u1 ON e1.user_id = u1.id 
                     WHERE e1.course_id = c.id 
                     AND u1.role IN ('admin', 'head')
                     AND e1.status IN ('active', 'pending_approval', 'waiting_start')
                 )
                 AND EXISTS (
                     SELECT 1 FROM enrollments e2 
                     JOIN users u2 ON e2.user_id = u2.id 
                     WHERE e2.course_id = c.id 
                     AND u2.role IN ('teacher', 'worker')
                     AND e2.status IN ('active', 'pending_approval', 'waiting_start')
                 )
                ) as courses_visible_to_degree_3,
                (SELECT COUNT(DISTINCT e.user_id) 
                 FROM enrollments e 
                 JOIN users u ON e.user_id = u.id 
                 WHERE e.status IN ('active', 'pending_approval', 'waiting_start')
                 AND u.role IN ('admin', 'head')
                ) as active_degree_1_enrollments,
                (SELECT COUNT(DISTINCT e.user_id) 
                 FROM enrollments e 
                 JOIN users u ON e.user_id = u.id 
                 WHERE e.status IN ('active', 'pending_approval', 'waiting_start')
                 AND u.role IN ('teacher', 'worker')
                ) as active_degree_2_enrollments,
                (SELECT COUNT(DISTINCT e.user_id) 
                 FROM enrollments e 
                 JOIN users u ON e.user_id = u.id 
                 WHERE e.status IN ('active', 'pending_approval', 'waiting_start')
                 AND u.role NOT IN ('admin', 'head', 'teacher', 'worker')
                ) as active_degree_3_enrollments
            FROM degree_classification dc
        `);

        // Get enrollment trends by degree over time
        const enrollmentTrends = await pool.query(`
            WITH degree_classification AS (
                SELECT 
                    u.id,
                    u.role,
                    CASE 
                        WHEN u.role IN ('admin', 'head') THEN 1
                        WHEN u.role IN ('teacher', 'worker') THEN 2
                        ELSE 3
                    END as degree_level
                FROM users u
                WHERE u.account_status = 'active' OR u.account_status IS NULL
            )
            SELECT 
                DATE_TRUNC('week', e.created_at) as week_start,
                dc.degree_level,
                COUNT(*) as enrollments_count
            FROM enrollments e
            JOIN degree_classification dc ON e.user_id = dc.id
            WHERE e.created_at >= NOW() - INTERVAL '8 weeks'
            AND e.status IN ('active', 'pending_approval', 'waiting_start')
            GROUP BY DATE_TRUNC('week', e.created_at), dc.degree_level
            ORDER BY week_start DESC, dc.degree_level
        `);

        console.log('📊 Degree metrics results:', {
            courseMetrics: degreeMetrics.rows.length,
            overallStats: overallStats.rows[0],
            enrollmentTrends: enrollmentTrends.rows.length
        });

        res.status(200).json({
            success: true,
            data: {
                courseMetrics: degreeMetrics.rows,
                overallStats: overallStats.rows[0] || {},
                enrollmentTrends: enrollmentTrends.rows
            }
        });

    } catch (err) {
        console.error('Degree enrollment metrics error:', err);
        res.status(500).json({ 
            success: false,
            message: 'حدث خطأ في تحميل إحصائيات التسجيل بالدرجات' 
        });
    }
}