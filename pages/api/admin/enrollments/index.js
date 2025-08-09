
import { pool } from '../../../../lib/db';
import { withAuth } from '../../../../lib/withAuth';

const handler = async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { rows: enrollments } = await pool.query(`
            SELECT 
                e.id, 
                e.status, 
                e.enrollment_date,
                u.full_name as user_name,
                c.course_name
            FROM enrollments e
            JOIN users u ON e.user_id = u.id
            JOIN courses c ON e.course_id = c.id
            WHERE e.status IN ('pending_approval', 'pending_payment')
            ORDER BY e.enrollment_date DESC
        `);

        return res.status(200).json({ enrollments });
    } catch (error) {
        console.error('Error fetching pending enrollments:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

export default withAuth(handler, { roles: ['admin', 'head', 'finance'] });
