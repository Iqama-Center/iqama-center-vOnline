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

        const { name, description, details, task_generation_config } = req.body;
        const newCourse = await pool.query(
            'INSERT INTO courses (name, description, created_by, details, task_generation_config) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, description, decoded.id, details, JSON.stringify(task_generation_config || {})]
        );
        res.status(201).json(newCourse.rows[0]);

    } catch (err) {
        console.error("Create course error:", err);
        res.status(500).json({ message: "خطأ في إنشاء الدورة." });
    }
}
