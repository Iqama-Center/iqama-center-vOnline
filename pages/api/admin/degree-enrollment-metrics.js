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
        
        // Get degree enrollment metrics
        const degreeMetrics = await pool.query(`
            WITH course_degree_stats AS (
                SELECT 
                    c.id as course_id,
                    c.name as course_name,
                    c.status as course_status,
                    c.is_published,
                    COUNT(CASE WHEN e.level_number = 1 THEN 1 END) as degree_1_enrolled,
                    COUNT(CASE WHEN e.level_number = 2 THEN 1 END) as degree_2_enrolled,
                    COUNT(CASE WHEN e.level_number = 3 THEN 1 END) as degree_3_enrolled,
                    COUNT(e.id) as total_enrolled,
                    -- Visibility is determined by the presence of active enrollments in levels 1 and 2 AND the course being published
                    CASE 
                        WHEN c.is_published = true
                         AND (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id AND level_number = 1 AND status = 'active') > 0
                         AND (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id AND level_number = 2 AND status = 'active') > 0
                        THEN true
                        ELSE false
                    END as visible_to_degree_3
                FROM courses c
                LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = 'active'
                WHERE c.status IN ('active', 'published', 'draft')
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
                    WHEN is_published = false THEN 'pending_publication'
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
            SELECT 
                (SELECT COUNT(DISTINCT user_id) FROM enrollments WHERE level_number = 1 AND status = 'active') as active_degree_1_enrollments,
                (SELECT COUNT(DISTINCT user_id) FROM enrollments WHERE level_number = 2 AND status = 'active') as active_degree_2_enrollments,
                (SELECT COUNT(DISTINCT user_id) FROM enrollments WHERE level_number = 3 AND status = 'active') as active_degree_3_enrollments,
                (SELECT COUNT(*) FROM courses WHERE is_published = true) as total_published_courses,
                (SELECT COUNT(*) FROM courses c 
                 WHERE c.is_published = true 
                 AND (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id AND level_number = 1 AND status = 'active') > 0
                 AND (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id AND level_number = 2 AND status = 'active') > 0
                ) as courses_visible_to_degree_3
        `);

        // Get enrollment trends by degree over time
        const enrollmentTrends = await pool.query(`
            SELECT 
                DATE_TRUNC('week', e.created_at) as week_start,
                e.level_number,
                COUNT(*) as enrollments_count
            FROM enrollments e
            WHERE e.created_at >= NOW() - INTERVAL '8 weeks'
            AND e.status = 'active'
            AND e.level_number IS NOT NULL
            GROUP BY DATE_TRUNC('week', e.created_at), e.level_number
            ORDER BY week_start DESC, e.level_number
        `);

        // console.log('📊 Degree metrics results:', {
        //     courseMetrics: degreeMetrics.rows.length,
        //     overallStats: overallStats.rows[0],
        //     enrollmentTrends: enrollmentTrends.rows.length
        // });

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