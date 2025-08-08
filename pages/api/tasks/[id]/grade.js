import pool from '../../../../lib/db';
import jwt from 'jsonwebtoken';
import errorHandler from '../../../../lib/errorHandler';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Only teachers or admins can grade tasks
        if (!['teacher', 'admin', 'head'].includes(decoded.role)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { id: taskId } = req.query;
        const { grade, feedback } = req.body;

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Update the task with the grade and feedback
            const updateResult = await client.query(`
                UPDATE tasks
                SET 
                    grade = $1,
                    feedback = $2,
                    status = 'graded'
                WHERE id = $3
                RETURNING *
            `, [grade, feedback, taskId]);

            if (updateResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ message: 'Task not found' });
            }

            await client.query('COMMIT');

            res.status(200).json({ 
                message: 'تم تسجيل الدرجة بنجاح.', 
                task: updateResult.rows[0]
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (err) {
        console.error("Task grading error:", err);
        errorHandler(err, res);
    }
}
