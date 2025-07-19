import pool from '../../../../lib/db';
import jwt from 'jsonwebtoken';



export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { id } = req.query;
        const { newRole } = req.body;

        const allowedRoles = ['student', 'parent', 'teacher', 'worker', 'head', 'finance', 'admin'];
        if (!newRole || !allowedRoles.includes(newRole)) {
            return res.status(400).json({ message: 'Invalid role specified.' });
        }

        const result = await pool.query(
            'UPDATE users SET role = $1 WHERE id = $2 RETURNING id',
            [newRole, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.status(200).json({ message: `User promoted to ${newRole} successfully.` });

    } catch (err) {
        console.error("Promote user error:", err);
        res.status(500).json({ message: 'Error promoting user.' });
    }
}
