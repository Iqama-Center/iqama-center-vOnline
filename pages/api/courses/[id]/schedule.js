
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
        if (!['admin', 'head'].includes(decoded.role)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { 
            course_id, day_number, title, content_url, meeting_link, scheduled_date,
            exam_content, assignments, level_specific_content 
        } = req.body;
        
        await pool.query(
            `INSERT INTO course_schedule (
                course_id, day_number, title, content_url, meeting_link, scheduled_date,
                exam_content, assignments, level_specific_content
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             ON CONFLICT (course_id, day_number) DO UPDATE SET
             title = EXCLUDED.title, 
             content_url = EXCLUDED.content_url, 
             meeting_link = EXCLUDED.meeting_link, 
             scheduled_date = EXCLUDED.scheduled_date,
             exam_content = EXCLUDED.exam_content,
             assignments = EXCLUDED.assignments,
             level_specific_content = EXCLUDED.level_specific_content`,
            [
                course_id, day_number, title, content_url, meeting_link, scheduled_date,
                JSON.stringify(exam_content || {}),
                JSON.stringify(assignments || {}),
                JSON.stringify(level_specific_content || {})
            ]
        );
        res.status(201).json({ message: 'تم حفظ اليوم الدراسي بنجاح.' });

    } catch (err) {
        console.error("Schedule update error:", err);
        res.status(500).json({ message: 'خطأ في حفظ اليوم الدراسي.' });
    }
}
