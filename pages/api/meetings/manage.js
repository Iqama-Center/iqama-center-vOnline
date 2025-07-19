import pool from '../../../lib/db';
import jwt from 'jsonwebtoken';
import NotificationService from '../../../services/notificationService';
import errorHandler from '../../../lib/errorHandler';

export default async function handler(req, res) {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (!['teacher', 'admin', 'head'].includes(decoded.role)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (req.method === 'POST') {
            // Create or update meeting link
            const { scheduleId, meetingLink, meetingPassword, instructions } = req.body;

            if (!scheduleId || !meetingLink) {
                return res.status(400).json({ message: 'Missing required fields' });
            }

            // Update course schedule with meeting details
            await pool.query(
                `UPDATE course_schedule 
                 SET meeting_link = $1, meeting_password = $2, meeting_instructions = $3
                 WHERE id = $4`,
                [meetingLink, meetingPassword || null, instructions || null, scheduleId]
            );

            // Get course and enrolled students
            const courseInfo = await pool.query(
                `SELECT cs.*, c.name as course_name, c.id as course_id
                 FROM course_schedule cs
                 JOIN courses c ON cs.course_id = c.id
                 WHERE cs.id = $1`,
                [scheduleId]
            );

            if (courseInfo.rows.length > 0) {
                const course = courseInfo.rows[0];
                
                // Get enrolled students
                const students = await pool.query(
                    `SELECT user_id FROM enrollments 
                     WHERE course_id = $1 AND status = 'active'`,
                    [course.course_id]
                );

                // Notify students about meeting link
                if (students.rows.length > 0) {
                    await NotificationService.createNotification(
                        students.rows.map(s => s.user_id),
                        'meeting_reminder',
                        `تم إضافة رابط اللقاء لدرس: ${course.title} في دورة ${course.course_name}`,
                        `/courses/${course.course_id}/schedule`
                    );
                }
            }

            res.status(200).json({ message: 'تم حفظ بيانات اللقاء بنجاح' });

        } else if (req.method === 'GET') {
            // Get meeting details
            const { scheduleId } = req.query;

            const meeting = await pool.query(
                `SELECT cs.*, c.name as course_name
                 FROM course_schedule cs
                 JOIN courses c ON cs.course_id = c.id
                 WHERE cs.id = $1`,
                [scheduleId]
            );

            if (meeting.rows.length === 0) {
                return res.status(404).json({ message: 'Meeting not found' });
            }

            res.status(200).json(meeting.rows[0]);

        } else {
            res.status(405).json({ message: 'Method Not Allowed' });
        }

    } catch (err) {
        console.error('Meeting management error:', err);
        errorHandler(err, res);
    }
}