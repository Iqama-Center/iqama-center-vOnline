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

    const client = await pool.connect();
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!['admin', 'head'].includes(decoded.role)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { 
            templateId, name, description, startDate,
            level1_users, level2_users, level3_users, pricing_override 
        } = req.body;

        if (!templateId || !name || !startDate) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        await client.query('BEGIN');

        const templateResult = await client.query('SELECT * FROM course_templates WHERE id = $1', [templateId]);
        if (templateResult.rows.length === 0) {
            throw new Error('Template not found');
        }
        const templateData = templateResult.rows[0];

        const courseDetails = {
            template_id: templateId,
            start_date: startDate,
            level_1_users: level1_users || [],
            level_2_users: level2_users || [],
            level_3_users: level3_users || [],
            pricing: pricing_override || templateData.pricing
        };

        const courseResult = await client.query(
            `INSERT INTO courses (name, description, created_by, template_id, status, min_enrollment, max_enrollment, details) 
             VALUES ($1, $2, $3, $4, 'pending_approval', $5, $6, $7) RETURNING id`,
            [name, description || templateData.description, decoded.id, templateId, templateData.min_capacity, templateData.max_capacity, courseDetails]
        );
        const courseId = courseResult.rows[0].id;

        // Bulk insert course schedule
        const dailyTemplate = templateData.daily_content_template || [];
        if (templateData.duration_days > 0) {
            await client.query(`
                INSERT INTO course_schedule (course_id, day_number, title, scheduled_date, content_url)
                SELECT $1, day_number, 
                       COALESCE((json_array_elements($2::jsonb) ->> (day_number - 1)) ->> 'title', 'اليوم ' || day_number::text),
                       (CAST($3 AS DATE) + (day_number - 1) * INTERVAL '1 day'),
                       (json_array_elements($2::jsonb) ->> (day_number - 1)) ->> 'content_url'
                FROM generate_series(1, $4) as day_number
            `, [courseId, JSON.stringify(dailyTemplate), startDate, templateData.duration_days]);
        }

        // Pre-enroll users in bulk
        const allUsers = [...(level1_users || []), ...(level2_users || []), ...(level3_users || [])];
        if (allUsers.length > 0) {
            await client.query(
                `INSERT INTO enrollments (user_id, course_id, status)
                 SELECT user_id, $2, 'pending_payment' FROM unnest($1::int[]) AS user_id
                 ON CONFLICT (user_id, course_id) DO NOTHING`,
                [allUsers, courseId]
            );

            await NotificationService.createCourseAnnouncement({ userIds: allUsers, courseName: name, courseId, client });
        }

        // Notify admins
        const adminUsersResult = await client.query("SELECT id FROM users WHERE role = 'admin'");
        const adminIds = adminUsersResult.rows.map(u => u.id);
        if (adminIds.length > 0) {
            await NotificationService.createNotification({
                userIds: adminIds,
                type: 'announcement',
                title: 'دورة جديدة تحتاج لموافقة',
                message: `دورة جديدة تحتاج موافقة: ${name}`,
                link: `/admin/courses/${courseId}/approve`,
                client
            });
        }

        await client.query('COMMIT');

        res.status(201).json({
            message: 'تم إنشاء الدورة بنجاح وهي في انتظار الموافقة',
            courseId: courseId
        });

    } catch (err) {
        await client.query('ROLLBACK').catch(console.error);
        console.error('Create course from template error:', err);
        errorHandler(err, res);
    } finally {
        client.release();
    }
}
