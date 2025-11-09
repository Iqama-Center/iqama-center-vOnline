import pool from '../../../lib/db';
import { withAuth } from '../../../lib/withAuth';

const handleWorkerSchedule = async (req, res) => {
    const { user } = req;

    if (user.role !== 'worker') {
        return res.status(403).json({ message: 'Access denied.' });
    }

    switch (req.method) {
        case 'GET':
            try {
                const { start, end } = req.query; // Expects ISO date strings

                if (!start || !end) {
                    return res.status(400).json({ message: 'Start and end query parameters are required.' });
                }

                const scheduleEvents = await pool.query(
                    `SELECT id, title, description, start_time, end_time, event_type, location, status 
                     FROM worker_schedule_events 
                     WHERE worker_id = $1 AND (start_time, end_time) OVERLAPS ($2::TIMESTAMPTZ, $3::TIMESTAMPTZ)
                     ORDER BY start_time ASC`,
                    [user.id, start, end]
                );

                res.status(200).json(scheduleEvents.rows);
            } catch (error) {
                console.error('Error fetching worker schedule:', error);
                res.status(500).json({ message: 'Internal server error' });
            }
            break;

        case 'POST':
            try {
                const {
                    title, description, start_time, end_time, event_type, location
                } = req.body;

                if (!title || !start_time || !end_time || !event_type) {
                    return res.status(400).json({ message: 'Missing required fields.' });
                }

                const newEvent = await pool.query(
                    `INSERT INTO worker_schedule_events (worker_id, title, description, start_time, end_time, event_type, location, status)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, 'scheduled')
                     RETURNING *`,
                    [user.id, title, description, start_time, end_time, event_type, location]
                );

                res.status(201).json(newEvent.rows[0]);
            } catch (error) {
                console.error('Error creating worker event:', error);
                res.status(500).json({ message: 'Internal server error' });
            }
            break;

        default:
            res.setHeader('Allow', ['GET', 'POST']);
            res.status(405).end(`Method ${req.method} Not Allowed`);
    }
};

export default withAuth(handleWorkerSchedule, { roles: ['worker'] });