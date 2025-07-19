import pool from '../../../lib/db';
import jwt from 'jsonwebtoken';



export default async function handler(req, res) {
    const { id } = req.query;

    // Authentication and Authorization
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }
    } catch (err) {
        return res.status(401).json({ message: 'Invalid token' });
    }


    if (req.method === 'GET') {
        try {
            const userResult = await pool.query('SELECT id, full_name, email, phone, role, details FROM users WHERE id = $1', [id]);
            if (userResult.rows.length === 0) {
                return res.status(404).json({ message: 'المستخدم غير موجود.' });
            }
            res.json(userResult.rows[0]);
        } catch (err) {
            res.status(500).json({ message: 'خطأ في الخادم.' });
        }
    } else if (req.method === 'PUT') {
        const { full_name, email, phone, role, details } = req.body;
        try {
            await pool.query(
                'UPDATE users SET full_name = $1, email = $2, phone = $3, role = $4, details = $5 WHERE id = $6',
                [full_name, email, phone, role, details, id]
            );
            res.json({ message: 'تم تحديث بيانات المستخدم بنجاح.' });
        } catch (err) {
            if (err.code === '23505') {
                return res.status(400).json({ message: 'البريد الإلكتروني مستخدم بالفعل.' });
            }
            console.error("User update error:", err);
            res.status(500).json({ message: 'خطأ في الخادم.' });
        }
    } else {
        res.setHeader('Allow', ['GET', 'PUT']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
