import pool from '../../../lib/db';
import { withAuth } from '../../../lib/withAuth';

export default withAuth(async (req, res) => {
    const { user } = req;
    
    if (user.role !== 'teacher') {
        return res.status(403).json({ error: 'غير مصرح لك بالوصول' });
    }

    if (req.method === 'GET') {
        try {
            const { status, search, limit = 50, offset = 0 } = req.query;
            
            let whereClause = '(c.teacher_id = $1 OR c.created_by = $1)';
            let queryParams = [user.id];
            let paramIndex = 2;
            
            // Add status filter
            if (status && status !== 'all') {
                if (status === 'active') {
                    whereClause += ` AND c.is_launched = true`;
                } else if (status === 'published') {
                    whereClause += ` AND c.is_published = true AND c.is_launched = false`;
                } else if (status === 'draft') {
                    whereClause += ` AND c.is_published = false`;
                }
            }
            
            // Add search filter
            if (search) {
                whereClause += ` AND (c.name ILIKE $${paramIndex} OR c.description ILIKE $${paramIndex})`;
                queryParams.push(`%${search}%`);
                paramIndex++;
            }
            
            // Get courses with detailed information
            const coursesQuery = `
                SELECT 
                    c.*,
                    (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id AND e.status = 'active') as student_count,
                    (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id AND e.status IN ('pending_payment', 'pending_approval')) as pending_count,
                    (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id AND e.status = 'completed') as completed_count,
                    (SELECT AVG(rating) FROM course_ratings cr WHERE cr.course_id = c.id) as average_rating,
                    (SELECT COUNT(*) FROM course_ratings cr WHERE cr.course_id = c.id) as rating_count,
                    (SELECT COUNT(*) FROM course_messages cm WHERE cm.course_id = c.id) as message_count,
                    (SELECT COUNT(*) FROM exams ex WHERE ex.course_id = c.id) as exam_count,
                    (SELECT COUNT(*) FROM tasks t WHERE t.course_id = c.id) as task_count,
                    u.full_name as teacher_name
                FROM courses c
                LEFT JOIN users u ON c.teacher_id = u.id OR c.created_by = u.id
                WHERE ${whereClause}
                ORDER BY c.created_at DESC
                LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
            `;
            
            queryParams.push(parseInt(limit), parseInt(offset));
            
            const coursesResult = await pool.query(coursesQuery, queryParams);
            
            // Get total count for pagination
            const countQuery = `
                SELECT COUNT(*) as total
                FROM courses c
                WHERE ${whereClause}
            `;
            
            const countResult = await pool.query(countQuery, queryParams.slice(0, -2));
            const totalCourses = parseInt(countResult.rows[0].total);
            
            // Get teacher statistics
            const statsQuery = `
                SELECT 
                    COUNT(*) as total_courses,
                    COUNT(CASE WHEN c.is_launched = true THEN 1 END) as active_courses,
                    COUNT(CASE WHEN c.is_published = true AND c.is_launched = false THEN 1 END) as published_courses,
                    COUNT(CASE WHEN c.is_published = false THEN 1 END) as draft_courses,
                    COALESCE(SUM((SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id AND e.status = 'active')), 0) as total_students,
                    COALESCE(SUM((SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id AND e.status = 'completed')), 0) as completed_students,
                    COALESCE(AVG((SELECT AVG(rating) FROM course_ratings cr WHERE cr.course_id = c.id)), 0) as average_rating,
                    COALESCE(SUM((SELECT COUNT(*) FROM course_messages cm WHERE cm.course_id = c.id)), 0) as total_messages,
                    COALESCE(SUM((SELECT COUNT(*) FROM exams ex WHERE ex.course_id = c.id)), 0) as total_exams
                FROM courses c
                WHERE (c.teacher_id = $1 OR c.created_by = $1)
            `;
            
            const statsResult = await pool.query(statsQuery, [user.id]);
            const stats = statsResult.rows[0] || {};
            
            // Convert numeric strings to numbers
            Object.keys(stats).forEach(key => {
                if (stats[key] !== null && !isNaN(stats[key])) {
                    stats[key] = parseFloat(stats[key]);
                }
            });
            
            res.status(200).json({
                success: true,
                courses: coursesResult.rows,
                stats,
                pagination: {
                    total: totalCourses,
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    hasMore: (parseInt(offset) + parseInt(limit)) < totalCourses
                }
            });
            
        } catch (error) {
            console.error('Error fetching teacher courses:', error);
            res.status(500).json({ 
                error: 'حدث خطأ في جلب البيانات',
                details: error.message 
            });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).json({ error: 'Method not allowed' });
    }
});