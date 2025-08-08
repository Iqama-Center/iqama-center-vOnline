import pool from '../../../lib/db';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        // Get active courses with enrollment counts
        const result = await pool.query(`
            SELECT 
                c.*,
                COUNT(e.id) as current_enrollment,
                CASE 
                    WHEN COUNT(e.id) >= c.max_enrollment THEN 'full'
                    WHEN COUNT(e.id) >= c.min_enrollment THEN 'available'
                    ELSE 'waiting'
                END as availability_status
            FROM courses c
            LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = 'active'
            WHERE (c.status = 'active' OR (c.status = 'published' AND c.is_published = true)) AND c.teacher_id IS NOT NULL
            GROUP BY c.id
            ORDER BY c.created_at DESC
        `);

        const courses = result.rows.map(course => ({
            ...course,
            details: course.details || {},
            current_enrollment: parseInt(course.current_enrollment) || 0
        }));

        res.status(200).json(courses);
    } catch (err) {
        console.error('Get public courses error:', err);
        res.status(500).json({ message: 'خطأ في تحميل الدورات' });
    }
}