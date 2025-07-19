import pool from '../../../lib/db';
import jwt from 'jsonwebtoken';
import errorHandler from '../../../lib/errorHandler';

export default async function handler(req, res) {
    if (req.method !== 'PUT') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const { courseId, dayNumber, meetingLink, meetingStartTime } = req.body;

        if (!courseId || !dayNumber || !meetingLink) {
            return res.status(400).json({ message: 'Course ID, day number, and meeting link are required' });
        }

        // Check if user has permission to update meeting links
        // Level 2 (teachers) and Level 3 (some workers) can update during active course
        const userPermission = await pool.query(`
            SELECT 
                c.id,
                c.status,
                c.is_launched,
                e.user_id,
                u.role,
                cpl.level_number
            FROM courses c
            LEFT JOIN enrollments e ON c.id = e.course_id AND e.user_id = $1
            LEFT JOIN users u ON e.user_id = u.id
            LEFT JOIN course_participant_levels cpl ON c.id = cpl.course_id AND u.role = ANY(cpl.target_roles)
            WHERE c.id = $2
        `, [decoded.id, courseId]);

        if (userPermission.rows.length === 0) {
            return res.status(403).json({ message: 'Not authorized to update meeting links for this course' });
        }

        const courseData = userPermission.rows[0];
        
        // Check permissions based on requirements: "يمكن لعامل درجة ٢و3 أن يغيروه حتى أثناء الدورة شغالة"
        const canUpdate = 
            ['admin', 'head'].includes(decoded.role) || // Admins can always update
            (courseData.level_number === 2) || // Level 2 (teachers/managers)
            (courseData.level_number === 3 && ['teacher', 'worker'].includes(courseData.role)); // Level 3 with specific roles

        if (!canUpdate) {
            return res.status(403).json({ 
                message: 'غير مصرح لك بتعديل رابط اللقاء. يمكن لعاملي درجة ٢ و ٣ فقط تعديل الرابط أثناء الدورة النشطة.' 
            });
        }

        // Update the meeting link for the specific day
        const updateResult = await pool.query(`
            UPDATE course_schedule 
            SET 
                meeting_link = $1,
                meeting_start_time = $2,
                updated_at = CURRENT_TIMESTAMP
            WHERE course_id = $3 AND day_number = $4
            RETURNING id, title
        `, [meetingLink, meetingStartTime, courseId, dayNumber]);

        if (updateResult.rows.length === 0) {
            return res.status(404).json({ message: 'Course day not found' });
        }

        const updatedDay = updateResult.rows[0];

        // Log the change for audit purposes
        await pool.query(`
            INSERT INTO course_schedule_changes (
                course_id, day_number, changed_by, change_type, 
                old_value, new_value, change_timestamp
            ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
        `, [
            courseId, dayNumber, decoded.id, 'meeting_link_update',
            'previous_link', meetingLink
        ]);

        // Notify all course participants about the meeting link change
        const participants = await pool.query(`
            SELECT DISTINCT e.user_id, u.full_name
            FROM enrollments e 
            JOIN users u ON e.user_id = u.id
            WHERE e.course_id = $1 AND e.status = 'active'
        `, [courseId]);

        // Create notifications for all participants
        for (const participant of participants.rows) {
            await pool.query(`
                INSERT INTO notifications (user_id, type, message, related_id, created_at)
                VALUES ($1, 'meeting_link_updated', $2, $3, CURRENT_TIMESTAMP)
            `, [
                participant.user_id,
                `تم تحديث رابط اللقاء لليوم ${dayNumber} - ${updatedDay.title}`,
                courseId
            ]);
        }

        res.status(200).json({
            success: true,
            message: 'تم تحديث رابط اللقاء بنجاح',
            updatedDay: {
                dayNumber,
                title: updatedDay.title,
                meetingLink,
                meetingStartTime
            },
            participantsNotified: participants.rows.length
        });

    } catch (err) {
        console.error('Meeting link update error:', err);
        errorHandler(err, res);
    }
}