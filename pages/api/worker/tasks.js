import pool from '../../../lib/db';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Only allow workers to access this endpoint
        if (decoded.role !== 'worker') {
            return res.status(403).json({ message: 'Access denied' });
        }

        if (req.method === 'GET') {
            try {
                // Try to get real data from worker_tasks table
                const result = await pool.query(`
                    SELECT 
                        wt.*,
                        u.full_name as supervisor_name
                    FROM worker_tasks wt
                    LEFT JOIN users u ON wt.assigned_by = u.id
                    WHERE wt.assigned_to = $1
                    ORDER BY 
                        CASE wt.priority 
                            WHEN 'urgent' THEN 1
                            WHEN 'high' THEN 2
                            WHEN 'medium' THEN 3
                            WHEN 'low' THEN 4
                        END,
                        wt.due_date ASC
                `, [decoded.id]);

                res.status(200).json(result.rows);
            } catch (dbError) {
                console.log('Worker tasks table not found, returning empty array:', dbError.message);
                
                // Return empty array if table doesn't exist
                res.status(200).json([]);
            }
        } else {
            res.setHeader('Allow', ['GET']);
            res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    } catch (err) {
        console.error('Worker tasks API error:', err);
        res.status(500).json({ message: 'خطأ في الخادم' });
    }
}