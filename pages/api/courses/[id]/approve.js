
import pool from '../../../../lib/db';
import { withAuth } from '../../../../lib/withAuth';

async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { id } = req.query;
    const { status } = req.body; // expecting 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status provided.' });
    }

    try {
        const query = `
            UPDATE courses 
            SET status = $1, approved_by = $2, approved_at = NOW()
            WHERE id = $3 RETURNING *;
        `;
        const result = await pool.query(query, [status, req.user.id, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Course not found or user does not have permission.' });
        }

        // TODO: Add notification logic here to inform the course creator of the approval/rejection

        res.status(200).json({ message: `Course ${status} successfully.`, course: result.rows[0] });

    } catch (error) {
        console.error('Error approving course:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export default withAuth(handler, { roles: ['head', 'admin'] });
