import pool from '../../../lib/db';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    const { id } = req.query;
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ message: 'Not authenticated' });
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        return res.status(401).json({ message: 'Invalid token' });
    }

    const userRole = decoded.role;

    if (req.method === 'GET') {
        try {
            const courseResult = await pool.query('SELECT * FROM courses WHERE id = $1', [id]);
            if (courseResult.rows.length === 0) {
                return res.status(404).json({ message: 'الدورة غير موجودة.' });
            }
            const scheduleResult = await pool.query('SELECT * FROM course_schedule WHERE course_id = $1 ORDER BY day_number', [id]);
            const course = courseResult.rows[0];
            course.schedule = scheduleResult.rows;
            res.status(200).json(course);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'خطأ في الخادم.' });
        }
    } else if (req.method === 'PUT') {
        if (userRole !== 'admin' && userRole !== 'head') {
            return res.status(403).json({ message: 'غير مصرح لك بتعديل الدورات.' });
        }
        
        const { 
            name, 
            description, 
            content_outline,
            duration_days,
            start_date,
            days_per_week,
            hours_per_day,
            details,
            participant_config,
            auto_launch_settings
        } = req.body;

        if (!name || name.trim() === '') {
            return res.status(400).json({ message: 'اسم الدورة مطلوب.' });
        }
        
        try {
            const result = await pool.query(`
                UPDATE courses SET 
                    name = $1, 
                    description = $2, 
                    content_outline = $3,
                    duration_days = $4,
                    start_date = $5,
                    days_per_week = $6,
                    hours_per_day = $7,
                    details = $8,
                    participant_config = $9,
                    auto_launch_settings = $10
                WHERE id = $11 
                RETURNING *`,
                [
                    name, 
                    description, 
                    content_outline,
                    duration_days,
                    start_date,
                    days_per_week,
                    hours_per_day,
                    JSON.stringify(details || {}),
                    JSON.stringify(participant_config || {}),
                    JSON.stringify(auto_launch_settings || {}),
                    id
                ]
            );
            
            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'الدورة غير موجودة.' });
            }
            
            console.log('Course updated successfully:', id);
            res.status(200).json({ 
                message: 'تم تحديث الدورة بنجاح.', 
                course: result.rows[0],
                id: parseInt(id) // Ensure ID is returned for navigation
            });
        } catch (err) {
            console.error("Update Course Error:", err);
            res.status(500).json({ message: 'حدث خطأ في الخادم.' });
        }
    } else if (req.method === 'DELETE') {
        if (userRole !== 'admin' && userRole !== 'head') {
            return res.status(403).json({ message: 'غير مصرح لك بحذف الدورات.' });
        }
        try {
            const result = await pool.query('DELETE FROM courses WHERE id = $1 RETURNING *', [id]);
            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'الدورة غير موجودة.' });
            }
            res.status(200).json({ message: 'تم حذف الدورة بنجاح.' });
        } catch (err) {
            console.error("Delete Course Error:", err);
            res.status(500).json({ message: 'حدث خطأ في الخادم.' });
        }
    } else {
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
