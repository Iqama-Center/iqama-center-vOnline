import pool from '../../../lib/db';
import jwt from 'jsonwebtoken';
import NotificationService from '../../../services/notificationService';
import errorHandler from '../../../lib/errorHandler';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (!['teacher', 'admin', 'head'].includes(decoded.role)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { scheduleId, attendanceData } = req.body;
        // attendanceData format: [{ userId, status, lateMinutes, behaviorScore, participationScore, notes }]

        if (!scheduleId || !attendanceData || !Array.isArray(attendanceData)) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Get schedule details
        const schedule = await pool.query(
            `SELECT cs.*, c.name as course_name, c.id as course_id
             FROM course_schedule cs
             JOIN courses c ON cs.course_id = c.id
             WHERE cs.id = $1`,
            [scheduleId]
        );

        if (schedule.rows.length === 0) {
            return res.status(404).json({ message: 'Schedule not found' });
        }

        const scheduleData = schedule.rows[0];

        // Record attendance for each student
        for (const attendance of attendanceData) {
            const { userId, status, lateMinutes, behaviorScore, participationScore, notes } = attendance;

            // Insert or update attendance record
            await pool.query(
                `INSERT INTO attendance (
                    schedule_id, user_id, status, late_minutes, 
                    behavior_score, participation_score, notes, recorded_by, recorded_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
                ON CONFLICT (schedule_id, user_id) 
                DO UPDATE SET 
                    status = $3, late_minutes = $4, behavior_score = $5, 
                    participation_score = $6, notes = $7, recorded_by = $8, recorded_at = CURRENT_TIMESTAMP`,
                [
                    scheduleId, userId, status, lateMinutes || 0,
                    behaviorScore || null, participationScore || null, 
                    notes || '', decoded.id
                ]
            );

            // Create notifications for absent students
            if (status === 'absent') {
                await NotificationService.createNotification(
                    [userId],
                    'announcement',
                    `تم تسجيل غيابك عن درس: ${scheduleData.title}`,
                    `/courses/${scheduleData.course_id}`
                );

                // Notify parents if student is absent
                const parentRelation = await pool.query(
                    'SELECT parent_id FROM parent_child_relationships WHERE child_id = $1',
                    [userId]
                );

                if (parentRelation.rows.length > 0) {
                    await NotificationService.createNotification(
                        parentRelation.rows.map(p => p.parent_id),
                        'announcement',
                        `غياب ابنك/ابنتك عن درس: ${scheduleData.title} في ${scheduleData.course_name}`,
                        `/parent/child-performance/${userId}`
                    );
                }
            }

            // Notify about poor behavior if score is low
            if (behaviorScore && behaviorScore < 3) {
                const parentRelation = await pool.query(
                    'SELECT parent_id FROM parent_child_relationships WHERE child_id = $1',
                    [userId]
                );

                if (parentRelation.rows.length > 0) {
                    await NotificationService.createNotification(
                        parentRelation.rows.map(p => p.parent_id),
                        'announcement',
                        `ملاحظة سلوكية على ابنك/ابنتك في درس: ${scheduleData.title}`,
                        `/parent/child-performance/${userId}`
                    );
                }
            }
        }

        // Update schedule as completed
        await pool.query(
            'UPDATE course_schedule SET attendance_recorded = true WHERE id = $1',
            [scheduleId]
        );

        res.status(200).json({ 
            message: 'تم تسجيل الحضور بنجاح',
            recordedCount: attendanceData.length 
        });

    } catch (err) {
        console.error('Attendance recording error:', err);
        errorHandler(err, res);
    }
}