import pool from '../../../lib/db';
import jwt from 'jsonwebtoken';
import errorHandler from '../../../lib/errorHandler';

export default async function handler(req, res) {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!['admin', 'head', 'teacher'].includes(decoded.role)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { course_id } = req.query;

        if (!course_id) {
            return res.status(400).json({ message: 'Course ID is required' });
        }

        if (req.method === 'GET') {
            // Get course schedule
            const schedule = await pool.query(
                'SELECT * FROM course_schedule WHERE course_id = $1 ORDER BY day_number',
                [course_id]
            );

            res.status(200).json(schedule.rows);

        } else if (req.method === 'POST') {
            // Update course schedule
            const { schedule_data } = req.body;

            if (!schedule_data || !Array.isArray(schedule_data)) {
                return res.status(400).json({ message: 'Invalid schedule data' });
            }

            await pool.query('BEGIN');

            try {
                // Delete existing schedule
                await pool.query('DELETE FROM course_schedule WHERE course_id = $1', [course_id]);

                // Insert new schedule
                for (const day of schedule_data) {
                    await pool.query(`
                        INSERT INTO course_schedule (
                            course_id, day_number, title, content_url, meeting_link, assignments
                        ) VALUES ($1, $2, $3, $4, $5, $6)
                    `, [
                        course_id,
                        day.day_number,
                        day.title || `اليوم الدراسي ${day.day_number}`,
                        day.content_url || '',
                        day.meeting_link || '',
                        JSON.stringify(day.assignments || {})
                    ]);
                }

                await pool.query('COMMIT');

                res.status(200).json({
                    success: true,
                    message: 'Course schedule updated successfully'
                });

            } catch (error) {
                await pool.query('ROLLBACK');
                throw error;
            }

        } else {
            res.status(405).json({ message: 'Method Not Allowed' });
        }

    } catch (err) {
        console.error('Course schedule error:', err);
        errorHandler(err, res);
    }
}