import pool from '../../../lib/db';
import jwt from 'jsonwebtoken';
import { getNotifications } from '../../../lib/queryOptimizer';



export default async function handler(req, res) {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    // Check if JWT_SECRET is available (build safety)
    if (!process.env.JWT_SECRET) {
        return res.status(500).json({ message: 'Server configuration error' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const notifications = await getNotifications(userId, 20);

        res.status(200).json(notifications);
    } catch (err) {
        // Log error in development only
        if (process.env.NODE_ENV === 'development') {
            console.error("Get notifications error:", err);
        }
        res.status(500).json({ message: 'Error fetching notifications.' });
    }
}

// Using getNotifications from queryOptimizer instead of local function
