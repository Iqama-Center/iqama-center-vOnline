
import pool from '../../../../lib/db';
import { withAuth } from '../../../../lib/withAuth';

const handler = async (req, res) => {
    const { id } = req.query;
    const { user } = req;

    try {
        if (req.method === 'PATCH') {
            const { status, actual_hours, notes } = req.body;

            if (!status) {
                return res.status(400).json({ message: 'Status is a required field.' });
            }

            const result = await pool.query(`
                UPDATE worker_tasks 
                SET 
                    status = $1,
                    actual_hours = COALESCE($2, actual_hours),
                    notes = COALESCE($3, notes),
                    completion_date = CASE WHEN $1 = 'completed' THEN CURRENT_TIMESTAMP ELSE completion_date END,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $4 AND assigned_to = $5
                RETURNING *
            `, [status, actual_hours, notes, id, user.id]);

            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'Task not found or you do not have permission to edit it.' });
            }

            res.status(200).json({
                message: 'تم تحديث المهمة بنجاح',
                task: result.rows[0]
            });

        } else if (req.method === 'GET') {
            const result = await pool.query(`
                SELECT 
                    wt.*,
                    u.full_name as supervisor_name
                FROM worker_tasks wt
                LEFT JOIN users u ON wt.assigned_by = u.id
                WHERE wt.id = $1 AND wt.assigned_to = $2
            `, [id, user.id]);

            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'Task not found or you do not have permission to view it.' });
            }

            res.status(200).json(result.rows[0]);

        } else {
            res.setHeader('Allow', ['GET', 'PATCH']);
            res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    } catch (err) {
        console.error(`Worker task API error for task ID: ${id}:`, err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export default withAuth(handler, { roles: ['worker'] });
