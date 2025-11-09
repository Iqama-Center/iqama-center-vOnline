
import pool from '../../../lib/db';
import { withAuth } from '../../../lib/withAuth';

const handler = async (req, res) => {
    const { user } = req;

    if (req.method === 'GET') {
        try {
            const { status, priority, search } = req.query;

            let query = `
                SELECT 
                    wt.*,
                    u.full_name as supervisor_name
                FROM worker_tasks wt
                LEFT JOIN users u ON wt.assigned_by = u.id
                WHERE wt.assigned_to = $1
            `;
            
            const params = [user.id];
            let paramIndex = 2;

            if (status && status !== 'all') {
                if (status === 'overdue') {
                    query += ` AND wt.status != 'completed' AND wt.due_date < CURRENT_TIMESTAMP`;
                } else {
                    query += ` AND wt.status = $${paramIndex++}`;
                    params.push(status);
                }
            }

            if (priority && priority !== 'all') {
                query += ` AND wt.priority = $${paramIndex++}`;
                params.push(priority);
            }

            if (search) {
                query += ` AND (wt.title ILIKE $${paramIndex++} OR wt.description ILIKE $${paramIndex++})`;
                params.push(`%${search}%`);
                params.push(`%${search}%`);
            }

            query += `
                ORDER BY 
                    CASE wt.priority 
                        WHEN 'urgent' THEN 1
                        WHEN 'high' THEN 2
                        WHEN 'medium' THEN 3
                        WHEN 'low' THEN 4
                    END,
                    wt.due_date ASC
            `;

            const result = await pool.query(query, params);
            res.status(200).json(result.rows);

        } catch (dbError) {
            console.error('Error fetching worker tasks:', dbError);
            res.status(500).json({ message: 'Internal server error' });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
};

export default withAuth(handler, { roles: ['worker'] });
