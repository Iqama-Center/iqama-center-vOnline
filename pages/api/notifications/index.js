import pool from '../../../lib/db';
import jwt from 'jsonwebtoken';
import { getNotifications } from '../../../lib/queryOptimizer';



export default async function handler(req, res) {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const notifications = await getNotifications(userId, 20);

        res.status(200).json(notifications);
    } catch (err) {
        console.error("Get notifications error:", err);
        res.status(500).json({ message: 'Error fetching notifications.' });
    }
}
