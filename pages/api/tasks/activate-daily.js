// API endpoint to activate daily tasks for a course schedule
import { activateDailyTasks } from '../../../lib/enhancedTaskGenerator';
import jwt from 'jsonwebtoken';
import errorHandler from '../../../lib/errorHandler';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'الطريقة غير مسموحة' });
    }

    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'غير مصرح بالدخول' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!['admin', 'head', 'teacher'].includes(decoded.role)) {
            return res.status(403).json({ message: 'غير مخول' });
        }

        const { courseId, scheduleId } = req.body;

        if (!courseId || !scheduleId) {
            return res.status(400).json({ message: 'معرف الدورة ومعرف الجدولة مطلوبان' });
        }

        const activatedCount = await activateDailyTasks(courseId, scheduleId);

        res.status(200).json({ 
            message: `تم تفعيل ${activatedCount} مهمة يومية بنجاح`,
            activatedCount
        });

    } catch (err) {
        console.error("Daily tasks activation error:", err);
        errorHandler(err, res);
    }
}