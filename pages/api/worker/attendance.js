
import pool from '../../../lib/db';
import { withAuth } from '../../../lib/withAuth';

const handleWorkerAttendance = async (req, res) => {
    const { user } = req;

    if (user.role !== 'worker') {
        return res.status(403).json({ message: 'Access denied. Only workers can manage their attendance.' });
    }

    // --- GET Request: Fetch monthly attendance ---
    if (req.method === 'GET') {
        try {
            const { month } = req.query; // Expects month in 'YYYY-MM' format
            if (!month || !/\d{4}-\d{2}/.test(month)) {
                return res.status(400).json({ message: 'Valid month parameter is required (YYYY-MM).' });
            }

            const attendanceRecords = await pool.query(
                `SELECT * FROM worker_attendance 
                 WHERE worker_id = $1 AND TO_CHAR(date, 'YYYY-MM') = $2 
                 ORDER BY date ASC`,
                [user.id, month]
            );

            return res.status(200).json(attendanceRecords.rows);
        } catch (error) {
            console.error('Error fetching worker attendance:', error);
            return res.status(500).json({ message: 'Internal server error while fetching attendance.' });
        }
    }

    // --- POST Request: Handle Check-in / Check-out ---
    if (req.method === 'POST') {
        try {
            const { action } = req.body; // 'check_in' or 'check_out'
            const today = new Date().toISOString().split('T')[0];

            const existingRecordResult = await pool.query(
                'SELECT * FROM worker_attendance WHERE worker_id = $1 AND date = $2',
                [user.id, today]
            );
            const existingRecord = existingRecordResult.rows[0];

            if (action === 'check_in') {
                if (existingRecord) {
                    return res.status(400).json({ message: 'You have already checked in today.' });
                }

                const now = new Date();
                const status = now.getHours() > 9 ? 'late' : 'present'; // Example: late if after 9 AM

                const newRecordResult = await pool.query(
                    `INSERT INTO worker_attendance (worker_id, date, check_in_time, status, location)
                     VALUES ($1, $2, $3, $4, $5)
                     RETURNING *`,
                    [user.id, today, now, status, 'المكتب الرئيسي'] // Location can be dynamic in the future
                );
                
                return res.status(201).json(newRecordResult.rows[0]);

            } else if (action === 'check_out') {
                if (!existingRecord || !existingRecord.check_in_time) {
                    return res.status(400).json({ message: 'You must check in before checking out.' });
                }
                if (existingRecord.check_out_time) {
                    return res.status(400).json({ message: 'You have already checked out today.' });
                }

                const now = new Date();
                const checkInTime = new Date(existingRecord.check_in_time);
                const totalHours = ((now - checkInTime) / (1000 * 60 * 60)).toFixed(2);

                const updatedRecordResult = await pool.query(
                    `UPDATE worker_attendance 
                     SET check_out_time = $1, total_hours = $2, updated_at = NOW()
                     WHERE id = $3
                     RETURNING *`,
                    [now, totalHours, existingRecord.id]
                );

                return res.status(200).json(updatedRecordResult.rows[0]);

            } else {
                return res.status(400).json({ message: 'Invalid action specified.' });
            }

        } catch (error) {
            console.error('Error processing worker attendance:', error);
            return res.status(500).json({ message: 'Internal server error while processing attendance.' });
        }
    }

    // Handle other methods
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
};

export default withAuth(handleWorkerAttendance, { roles: ['worker'] });
