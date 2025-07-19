import pool from '../../../lib/db';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        // Add course_id column to tasks table if it doesn't exist
        await pool.query(`
            ALTER TABLE tasks 
            ADD COLUMN IF NOT EXISTS course_id INTEGER REFERENCES courses(id);
        `);

        // Update existing tasks to have course_id based on created_by
        await pool.query(`
            UPDATE tasks 
            SET course_id = (
                SELECT c.id 
                FROM courses c 
                WHERE c.created_by = tasks.created_by 
                LIMIT 1
            )
            WHERE course_id IS NULL;
        `);

        res.status(200).json({ 
            message: 'Tasks table updated successfully',
            updates: [
                'Added course_id column to tasks table',
                'Updated existing tasks with course_id'
            ]
        });

    } catch (err) {
        console.error('Tasks table fix error:', err);
        res.status(500).json({ 
            message: 'Tasks table fix failed', 
            error: err.message 
        });
    }
}