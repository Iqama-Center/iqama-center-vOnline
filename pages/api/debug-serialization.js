import pool from '../../lib/db';
import { testSerialization, safeSerialize } from '../../lib/serializer';

export default async function handler(req, res) {
    try {
        // Test a simple course query
        const courseResult = await pool.query(`
            SELECT c.*, u.full_name as created_by_name 
            FROM courses c 
            LEFT JOIN users u ON c.created_by = u.id 
            LIMIT 1
        `);

        if (courseResult.rows.length === 0) {
            return res.json({ message: 'No courses found' });
        }

        const course = courseResult.rows[0];
        
        // Test original object
        const originalSerializable = testSerialization(course);
        
        // Test safe serialized version
        const safeCourse = safeSerialize(course);
        const safeSerializable = testSerialization(safeCourse);
        
        res.json({
            original_serializable: originalSerializable,
            safe_serializable: safeSerializable,
            original_keys: Object.keys(course),
            safe_keys: Object.keys(safeCourse),
            problematic_fields: Object.keys(course).filter(key => {
                try {
                    JSON.stringify(course[key]);
                    return false;
                } catch (e) {
                    return true;
                }
            })
        });
        
    } catch (error) {
        res.status(500).json({ 
            error: error.message,
            stack: error.stack 
        });
    }
}