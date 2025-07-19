import pool from '../../../lib/db';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        // Add subject column to messages table if it doesn't exist
        await pool.query(`
            ALTER TABLE messages 
            ADD COLUMN IF NOT EXISTS subject VARCHAR(255);
        `);

        // Create parent_child_relationships table if it doesn't exist
        await pool.query(`
            CREATE TABLE IF NOT EXISTS parent_child_relationships (
                id SERIAL PRIMARY KEY,
                parent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                child_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                relationship_type VARCHAR(50) DEFAULT 'parent_child',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(parent_id, child_id)
            );
        `);

        // Update any existing parent-child relationships from details JSON
        await pool.query(`
            INSERT INTO parent_child_relationships (parent_id, child_id)
            SELECT 
                (details->>'parent_id')::INTEGER as parent_id,
                id as child_id
            FROM users 
            WHERE details->>'parent_id' IS NOT NULL 
            AND (details->>'parent_id')::INTEGER > 0
            ON CONFLICT (parent_id, child_id) DO NOTHING;
        `);

        res.status(200).json({ 
            message: 'Database schema updated successfully',
            updates: [
                'Added subject column to messages table',
                'Created parent_child_relationships table',
                'Migrated parent-child relationships'
            ]
        });

    } catch (err) {
        console.error('Database setup error:', err);
        res.status(500).json({ 
            message: 'Database setup failed', 
            error: err.message 
        });
    }
}