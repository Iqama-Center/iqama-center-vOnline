
import pool from '../../../lib/db';
import { withAuth } from '../../../lib/withAuth';

const handleWorkerReports = async (req, res) => {
    const { user } = req;

    if (user.role !== 'worker') {
        return res.status(403).json({ message: 'Access denied.' });
    }

    switch (req.method) {
        case 'GET':
            try {
                const reports = await pool.query(
                    'SELECT * FROM worker_reports WHERE worker_id = $1 ORDER BY report_date DESC, created_at DESC',
                    [user.id]
                );
                res.status(200).json(reports.rows);
            } catch (error) {
                console.error('Error fetching worker reports:', error);
                res.status(500).json({ message: 'Internal server error' });
            }
            break;

        case 'POST':
            try {
                const {
                    report_type, title, content, report_date, tags, priority
                } = req.body;

                if (!report_type || !title || !content || !report_date) {
                    return res.status(400).json({ message: 'Missing required fields.' });
                }

                const newReport = await pool.query(
                    `INSERT INTO worker_reports (worker_id, report_type, title, content, report_date, tags, priority, status)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft')
                     RETURNING *`,
                    [user.id, report_type, title, content, report_date, tags.split(',').map(t => t.trim()), priority]
                );

                res.status(201).json(newReport.rows[0]);
            } catch (error) {
                console.error('Error creating worker report:', error);
                res.status(500).json({ message: 'Internal server error' });
            }
            break;

        default:
            res.setHeader('Allow', ['GET', 'POST']);
            res.status(405).end(`Method ${req.method} Not Allowed`);
    }
};

export default withAuth(handleWorkerReports, { roles: ['worker'] });
