import { withAuth } from '../../../lib/withAuth';
import pool from '../../../lib/db';
import errorHandler from '../../../lib/errorHandler';

/**
 * API endpoint to fetch available courses for a user.
 * This logic is now encapsulated in the `get_available_courses_for_user` database function.
 */
async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { user } = req;

    try {
        const result = await pool.query(
            'SELECT * FROM get_available_courses_for_user($1, $2)',
            [user.id, user.role]
        );
        
        const availableCourses = result.rows;

        res.status(200).json({
            success: true,
            courses: availableCourses,
            count: availableCourses.length,
        });

    } catch (error) {
        console.error('Error fetching available courses:', error);
        // Use the centralized error handler
        errorHandler(error, res, 'حدث خطأ في تحميل الدورات المتاحة');
    }
}

export default withAuth(handler);
