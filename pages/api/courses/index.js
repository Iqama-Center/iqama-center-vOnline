import pool from '../../../lib/db';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!['admin', 'head'].includes(decoded.role)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { name, description, details } = req.body;
        const newCourse = await pool.query(
            'INSERT INTO courses (name, description, created_by, details) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, description, decoded.id, details]
        );
        res.status(201).json(newCourse.rows[0]);

    } catch (err) {
        console.error("Create course error:", err);
        res.status(500).json({ message: "خطأ في إنشاء الدورة." });
    }
}
