import pool from '../../../lib/db';
import { withAuth } from '../../../lib/withAuth';
import errorHandler from '../../../lib/errorHandler';
import NotificationService from '../../../services/notificationService';

// This endpoint is being refactored to align with the unified data model.
// It now maps the old request body structure to the new, standardized one.

export default withAuth(async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { user } = req;
    if (!['admin', 'head', 'teacher'].includes(user.role)) {
        return res.status(403).json({ message: 'غير مصرح لك بإنشاء الدورات' });
    }

    const client = await pool.connect();
    try {
        const {
            name, description, tableOfContents, duration, startDate, weekDays, dailyHours,
            grade1, grade2, grade3, // Old participant structure
            autoLaunchOptions, schedule, ratingSettings // New names for clarity
        } = req.body;

        if (!name || !description || !duration || !startDate) {
            return res.status(400).json({ message: 'البيانات الأساسية مطلوبة' });
        }

        // --- Data Mapping Layer ---
        // 1. Map old participant structure to the new 'participant_config' format
        const participant_config = {};
        const gradeMap = { grade1, grade2, grade3 };
        for (const [key, grade] of Object.entries(gradeMap)) {
            if (grade && grade.categories?.some(c => c.selected && c.count > 0)) {
                const levelNum = key.replace('grade', '');
                participant_config[`level_${levelNum}`] = {
                    name: grade.title,
                    roles: grade.categories.filter(c => c.selected).map(c => c.name), // This is a simplification
                    min: grade.categories.reduce((sum, c) => sum + (c.selected ? c.count : 0), 0),
                    max: grade.categories.reduce((sum, c) => sum + (c.selected ? c.count : 0), 0) * 2, // Example logic
                    optimal: grade.categories.reduce((sum, c) => sum + (c.selected ? c.count : 0), 0)
                };
            }
        }

        if (Object.keys(participant_config).length === 0) {
            return res.status(400).json({ message: 'يجب تحديد أدوار المشاركين في الدورة' });
        }

        // 2. Map other fields to correct schema names
        const courseData = {
            name,
            description,
            content_outline: tableOfContents,
            duration_days: parseInt(duration),
            start_date: startDate,
            days_per_week: parseInt(weekDays) || null,
            hours_per_day: parseFloat(dailyHours) || null,
            details: { autoLaunchOptions, ratingSystem: { grade1, grade2, grade3 } }, // Keep original for reference
            participant_config,
            auto_launch_settings: autoLaunchOptions
        };

        // --- Unified Logic Start ---
        await client.query('BEGIN');

        const courseResult = await client.query(`
            INSERT INTO courses (name, description, content_outline, duration_days, start_date, days_per_week, hours_per_day, created_by, details, participant_config, auto_launch_settings, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'draft') RETURNING id`, [
                courseData.name, courseData.description, courseData.content_outline, courseData.duration_days, courseData.start_date,
                courseData.days_per_week, courseData.hours_per_day, user.id, courseData.details, 
                courseData.participant_config, courseData.auto_launch_settings
            ]
        );
        const courseId = courseResult.rows[0].id;

        // Bulk insert participant levels
        for (const [levelKey, config] of Object.entries(participant_config)) {
            const levelNumber = parseInt(levelKey.split('_')[1]);
            await client.query(`
                INSERT INTO course_participant_levels (course_id, level_number, level_name, target_roles, min_count, max_count, optimal_count)
                VALUES ($1, $2, $3, $4, $5, $6, $7)`, [
                    courseId, levelNumber, config.name, config.roles, config.min, config.max, config.optimal
                ]
            );
        }

        // Bulk insert schedule
        if (schedule && Array.isArray(schedule) && schedule.length > 0) {
            const scheduleValues = schedule.map(day => [
                courseId,
                day.dayNumber,
                day.title,
                (day.contentLinks && day.contentLinks[0]) || null,
                day.meetingLink,
                day.meetingStartTime || null,
                JSON.stringify(day.tasks || {}),
                JSON.stringify(day.examQuestions || {})
            ]);
            await client.query(`
                INSERT INTO course_schedule (course_id, day_number, title, content_url, meeting_link, meeting_start_time, assignments, exam_content)
                SELECT * FROM unnest($1::integer[], $2::integer[], $3::varchar[], $4::varchar[], $5::varchar[], $6::time[], $7::jsonb[], $8::jsonb[])
            `, [ 
                scheduleValues.map(v => v[0]), scheduleValues.map(v => v[1]), scheduleValues.map(v => v[2]), 
                scheduleValues.map(v => v[3]), scheduleValues.map(v => v[4]), scheduleValues.map(v => v[5]), 
                scheduleValues.map(v => v[6]), scheduleValues.map(v => v[7])
            ]);
        }

        // Insert rating settings
        if (ratingSettings) {
            await client.query(`
                INSERT INTO course_rating_settings (course_id, attendance_weight, participation_weight, task_completion_weight, exam_weight, teaching_quality_weight, auto_calculate)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
                courseId, ratingSettings.attendance, ratingSettings.participation, ratingSettings.tasks, 
                ratingSettings.exams, ratingSettings.quality, ratingSettings.auto_calculate ?? true
            ]);
        }

        await client.query('COMMIT');

        res.status(201).json({ message: 'تم إنشاء الدورة بنجاح', courseId });

    } catch (error) {
        await client.query('ROLLBACK').catch(console.error);
        console.error('Course creation error:', error);
        errorHandler(error, res);
    }
    finally {
        client.release();
    }
});
