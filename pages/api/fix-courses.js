import pool from '../../lib/db';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        console.log('=== FIXING COURSES VISIBILITY ===');
        
        // 1. Check current courses
        const allCourses = await pool.query('SELECT id, name, status, is_published FROM courses');
        console.log('Current courses:', allCourses.rows);
        
        if (allCourses.rows.length === 0) {
            // Create a test course if none exist
            const testCourse = await pool.query(`
                INSERT INTO courses (name, description, status, is_published, created_by)
                VALUES ('دورة تجريبية', 'هذه دورة تجريبية للاختبار', 'published', true, 1)
                RETURNING *
            `);
            console.log('Created test course:', testCourse.rows[0]);
            
            res.status(200).json({
                success: true,
                message: 'Created test course',
                course: testCourse.rows[0]
            });
        } else {
            // Fix existing courses - make them published and visible
            const fixedCourses = await pool.query(`
                UPDATE courses 
                SET status = 'published', is_published = true 
                WHERE status = 'draft' OR is_published = false
                RETURNING *
            `);
            
            console.log('Fixed courses:', fixedCourses.rows);
            
            res.status(200).json({
                success: true,
                message: `Fixed ${fixedCourses.rows.length} courses`,
                fixed_courses: fixedCourses.rows,
                all_courses: allCourses.rows
            });
        }
        
    } catch (error) {
        console.error('Fix courses error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}