import pool from '../../../lib/db';
import jwt from 'jsonwebtoken';
import errorHandler from '../../../lib/errorHandler';
import { generateEnhancedTasksForCourse } from '../../../lib/enhancedTaskGenerator';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'الطريقة غير مسموحة' });
    }

    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'غير مصرح بالدخول' });

    const client = await pool.connect();
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!['admin', 'head'].includes(decoded.role)) {
            return res.status(403).json({ message: 'غير مخول' });
        }

        const { 
            name, description, content_outline, duration_days, start_date, 
            schedule_config, hours_per_day, details, participant_config, 
            auto_launch_settings, courseSchedule, taskGenerationEnabled, enhancedTaskConfig
        } = req.body;

        if (!name || !description) {
            return res.status(400).json({ message: 'اسم الدورة ووصفها مطلوبان' });
        }

        await client.query('BEGIN');

        const courseResult = await client.query(`
            INSERT INTO courses (name, description, content_outline, duration_days, start_date, days_per_week, hours_per_day, created_by, details, participant_config, auto_launch_settings, status, schedule_config)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'draft', $12) RETURNING *`, [
                name, description, content_outline, duration_days, start_date, schedule_config ? Object.keys(schedule_config).length : 0, 
                hours_per_day, decoded.id, JSON.stringify(details || {}), JSON.stringify(participant_config || {}), JSON.stringify(auto_launch_settings || {}),
                schedule_config
            ]
        );
        const newCourse = courseResult.rows[0];
        const courseId = newCourse.id;

        // Bulk insert participant levels and pre-enroll users
        if (participant_config) {
            for (const [levelKey, config] of Object.entries(participant_config)) {
                const levelNumber = parseInt(levelKey.split('_')[1]);
                if (!levelNumber) continue;

                await client.query(`
                    INSERT INTO course_participant_levels (course_id, level_number, level_name, target_roles, min_count, max_count, optimal_count)
                    VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (course_id, level_number) DO NOTHING`, [
                        courseId, levelNumber, config.name, config.roles, config.min, config.max, config.optimal
                    ]
                );

                const usersToEnroll = config.preselected_users?.users;
                if (usersToEnroll && usersToEnroll.length > 0) {
                    const enrollmentResult = await client.query(`
                        INSERT INTO enrollments (user_id, course_id, status, level_number) 
                        SELECT user_id, $2, 'active', $3 FROM unnest($1::int[]) AS user_id
                        ON CONFLICT (user_id, course_id) DO UPDATE SET status = 'active', level_number = $3
                        RETURNING id, user_id`, 
                        [usersToEnroll, courseId, levelNumber]
                    );

                    if (config.financial?.type === 'receive' && config.financial?.amount > 0) {
                        const payouts = enrollmentResult.rows.map(e => ({ enrollment_id: e.id, amount: Math.abs(config.financial.amount), currency: config.financial.currency || 'SAR', description: `مكافأة دورة: ${name}` }));
                        if (payouts.length > 0) {
                            await client.query(`
                                INSERT INTO payments (enrollment_id, amount, currency, status, due_date, description)
                                SELECT p.enrollment_id, p.amount, p.currency, 'pending_payout', NOW(), p.description
                                FROM json_to_recordset($1::json) AS p(enrollment_id INT, amount NUMERIC, currency VARCHAR, description TEXT)`, 
                                [JSON.stringify(payouts)]
                            );
                        }
                    }
                }
            }
        }

        // Bulk insert course schedule
        if (courseSchedule && courseSchedule.length > 0) {
            const scheduleValues = courseSchedule.map(day => [courseId, day.day_number, day.title, day.scheduled_date, day.meeting_start_time || '09:00', day.meeting_end_time || '11:00']);
            await client.query(`
                INSERT INTO course_schedule (course_id, day_number, title, scheduled_date, meeting_start_time, meeting_end_time)
                SELECT v.course_id, v.day_number, v.title, v.scheduled_date, v.meeting_start_time, v.meeting_end_time
                FROM unnest($1::integer[], $2::integer[], $3::varchar[], $4::date[], $5::time[], $6::time[]) AS v(course_id, day_number, title, scheduled_date, meeting_start_time, meeting_end_time)
                ON CONFLICT (course_id, day_number) DO NOTHING`, [
                    scheduleValues.map(v => v[0]), scheduleValues.map(v => v[1]), scheduleValues.map(v => v[2]),
                    scheduleValues.map(v => v[3]), scheduleValues.map(v => v[4]), scheduleValues.map(v => v[5])
                ]
            );
        }

        let tasksGenerated = 0;
        if (taskGenerationEnabled) {
            const enrollmentsResult = await client.query('SELECT user_id, level_number, role FROM enrollments JOIN users ON users.id = enrollments.user_id WHERE course_id = $1 AND status = \'active\'', [courseId]);
            tasksGenerated = await generateEnhancedTasksForCourse(client, courseId, newCourse, enrollmentsResult.rows, enhancedTaskConfig);
        }

        await client.query('COMMIT');

        res.status(201).json({ 
            message: 'تم إنشاء الدورة والمهام بنجاح', 
            id: courseId,
            tasksGenerated: tasksGenerated
        });

    } catch (err) {
        await client.query('ROLLBACK').catch(console.error);
        console.error("Course creation with tasks error:", err);
        errorHandler(err, res);
    } finally {
        client.release();
    }
}

