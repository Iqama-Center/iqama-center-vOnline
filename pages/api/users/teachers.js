import pool from '../../../lib/db';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    // Authentication check
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Authorization check - only allow admin, head, and teacher roles to fetch teachers
        if (!['admin', 'head', 'teacher'].includes(decoded.role)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Fetch all teachers from database
        const teachersResult = await pool.query(
            `SELECT id, full_name, email, phone, role, details, created_at 
             FROM users 
             WHERE role = 'teacher' 
             ORDER BY full_name ASC`
        );

        console.log(`Fetched ${teachersResult.rows.length} teachers from database`);
        
        res.status(200).json(teachersResult.rows);

    } catch (err) {
        console.error("Fetch teachers error:", err);
        
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token' });
        }
        
        res.status(500).json({ message: 'خطأ في الخادم.' });
    }
}