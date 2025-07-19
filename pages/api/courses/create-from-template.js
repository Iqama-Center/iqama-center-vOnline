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
        
        if (!['admin', 'head'].includes(decoded.role)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { 
            templateId, 
            name, 
            description, 
            startDate,
            level1_users, // Managers/Supervisors
            level2_users, // Teachers/Trainers  
            level3_users, // Students/Trainees
            pricing_override 
        } = req.body;

        if (!templateId || !name || !startDate) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Get template details
        const template = await pool.query(
            'SELECT * FROM course_templates WHERE id = $1',
            [templateId]
        );

        if (template.rows.length === 0) {
            return res.status(404).json({ message: 'Template not found' });
        }

        const templateData = template.rows[0];

        // Create the course
        const courseDetails = {
            template_id: templateId,
            start_date: startDate,
            level1_users: level1_users || [],
            level2_users: level2_users || [],
            level3_users: level3_users || [],
            pricing: pricing_override || templateData.pricing,
            status: 'pending_approval'
        };

        const newCourse = await pool.query(
            `INSERT INTO courses (
                name, description, created_by, template_id, status,
                min_enrollment, max_enrollment, current_enrollment, details
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [
                name, 
                description || templateData.description,
                decoded.id,
                templateId,
                'pending_approval',
                templateData.min_capacity,
                templateData.max_capacity,
                0,
                courseDetails
            ]
        );

        const courseId = newCourse.rows[0].id;

        // Create course schedule based on template
        const dailyTemplate = JSON.parse(templateData.daily_content_template || '[]');
        const startDateObj = new Date(startDate);

        for (let day = 0; day < templateData.duration_days; day++) {
            const scheduleDate = new Date(startDateObj);
            scheduleDate.setDate(scheduleDate.getDate() + day);

            const dayTemplate = dailyTemplate[day] || { title: `اليوم ${day + 1}`, content: '' };

            await pool.query(
                `INSERT INTO course_schedule (
                    course_id, day_number, title, scheduled_date, content_url
                ) VALUES ($1, $2, $3, $4, $5)`,
                [
                    courseId,
                    day + 1,
                    dayTemplate.title,
                    scheduleDate.toISOString().split('T')[0],
                    dayTemplate.content_url || null
                ]
            );
        }

        // Pre-enroll selected users
        const allUsers = [
            ...(level1_users || []),
            ...(level2_users || []),
            ...(level3_users || [])
        ];

        for (const userId of allUsers) {
            await pool.query(
                `INSERT INTO enrollments (user_id, course_id, status)
                 VALUES ($1, $2, 'pending_payment')`,
                [userId, courseId]
            );
        }

        // Create notifications for enrolled users
        if (allUsers.length > 0) {
            await NotificationService.createCourseAnnouncement(
                allUsers, 
                name, 
                courseId
            );
        }

        // Notify admins about new course creation
        const adminUsers = await pool.query(
            "SELECT id FROM users WHERE role = 'admin'"
        );

        if (adminUsers.rows.length > 0) {
            await NotificationService.createNotification(
                adminUsers.rows.map(u => u.id),
                'announcement',
                `دورة جديدة تحتاج موافقة: ${name}`,
                `/admin/courses/${courseId}/approve`
            );
        }

        res.status(201).json({
            message: 'تم إنشاء الدورة بنجاح وهي في انتظار الموافقة',
            course: newCourse.rows[0]
        });

    } catch (err) {
        console.error('Create course from template error:', err);
        errorHandler(err, res);
    }
}