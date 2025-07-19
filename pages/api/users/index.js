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
        
        // Authorization check - only allow admin and head roles to fetch all users
        if (!['admin', 'head'].includes(decoded.role)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Get query parameters for filtering
        const { role, limit = 100 } = req.query;

        let query = `SELECT id, full_name, email, phone, role, details, created_at 
                     FROM users`;
        let params = [];

        // Add role filter if specified
        if (role) {
            query += ` WHERE role = $1`;
            params.push(role);
        }

        query += ` ORDER BY full_name ASC LIMIT $${params.length + 1}`;
        params.push(parseInt(limit));

        const usersResult = await pool.query(query, params);

        console.log(`Fetched ${usersResult.rows.length} users from database`);
        
        res.status(200).json(usersResult.rows);

    } catch (err) {
        console.error("Fetch users error:", err);
        
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token' });
        }
        
        res.status(500).json({ message: 'خطأ في الخادم.' });
    }
}