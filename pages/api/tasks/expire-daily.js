// API endpoint to check and expire daily tasks (should be called by a cron job)
import { expireDailyTasks } from '../../../lib/enhancedTaskGenerator';
import jwt from 'jsonwebtoken';
import errorHandler from '../../../lib/errorHandler';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'الطريقة غير مسموحة' });
    }

    // This endpoint can be called by system cron jobs or admin users
    const token = req.cookies.token;
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (!['admin', 'head'].includes(decoded.role)) {
                return res.status(403).json({ message: 'غير مخول' });
            }
        } catch (err) {
            return res.status(401).json({ message: 'رمز غير صحيح' });
        }
    } else {
        // Allow system calls with a special header
        const systemKey = req.headers['x-system-key'];
        if (systemKey !== process.env.SYSTEM_CRON_KEY) {
            return res.status(401).json({ message: 'غير مصرح بالدخول' });
        }
    }

    try {
        const expiredCount = await expireDailyTasks();

        res.status(200).json({ 
            message: `تم انتهاء صلاحية ${expiredCount} مهمة يومية`,
            expiredCount
        });

    } catch (err) {
        console.error("Daily tasks expiration error:", err);
        errorHandler(err, res);
    }
}