import pool from '../../../lib/db';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';



export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).end();
    }
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });
    try {
        const parentDecoded = jwt.verify(token, process.env.JWT_SECRET);
        if (parentDecoded.role !== 'parent') {
            return res.status(403).json({ message: 'Not authorized' });
        }
        const { childId } = req.body;
        const relationshipCheck = await pool.query(
            'SELECT 1 FROM parent_child_relationships WHERE parent_id = $1 AND child_id = $2',
            [parentDecoded.id, childId]
        );
        if (relationshipCheck.rows.length === 0) {
            return res.status(403).json({ message: 'Child not found for this parent.' });
        }
        const childResult = await pool.query('SELECT id, role FROM users WHERE id = $1', [childId]);
        const child = childResult.rows[0];
        const viewToken = jwt.sign(
            { id: child.id, role: child.role, is_view_token: true, parent_id: parentDecoded.id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        res.status(200).json({ viewToken });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
}
