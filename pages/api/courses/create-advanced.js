import pool from '../../../lib/db';
import jwt from 'jsonwebtoken';
import errorHandler from '../../../lib/errorHandler';

async function generateCourseSchedule(client, courseId, startDate, durationDays, daysPerWeek) {
    const start = new Date(startDate);
    const daysOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu']; // Default working days
    
    let currentDate = new Date(start);
    let dayNumber = 1;
    let daysAdded = 0;
    
    while (dayNumber <= durationDays) {
        const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
        
        // Only add working days (Sunday to Thursday in Middle East)
        if (dayOfWeek >= 0 && dayOfWeek <= 4 && daysAdded < daysPerWeek) {
            await client.query(`
                INSERT INTO course_schedule (
                    course_id, day_number, title, scheduled_date, 
                    meeting_start_time, meeting_end_time
                ) VALUES ($1, $2, $3, $4, $5, $6)
            `, [
                courseId,
                dayNumber,
                `اليوم ${dayNumber} - ${currentDate.toLocaleDateString('ar-SA')}`,
                currentDate.toISOString().split('T')[0],
                '09:00:00', // Default start time
                '11:00:00'  // Default end time (2 hours)
            ]);
            
            dayNumber++;
            daysAdded++;
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
        
        // Reset weekly counter
        if (dayOfWeek === 4) { // Thursday
            daysAdded = 0;
        }
    }
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'الطريقة غير مسموحة' });
    }

    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'غير مصرح بالدخول' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!['admin', 'head'].includes(decoded.role)) {
            return res.status(403).json({ message: 'غير مخول' });
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

        if (!name || !description) {
            return res.status(400).json({ message: 'اسم الدورة ووصفها مطلوبان' });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Create the course
            const courseResult = await client.query(`
                INSERT INTO courses (
                    name, description, content_outline, duration_days, start_date, 
                    days_per_week, hours_per_day, created_by, details, 
                    participant_config, auto_launch_settings, status
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'draft') 
                RETURNING *`,
                [
                    name, description, content_outline, duration_days, start_date,
                    days_per_week, hours_per_day, decoded.id, 
                    JSON.stringify(details || {}),
                    JSON.stringify(participant_config || {}),
                    JSON.stringify(auto_launch_settings || {})
                ]
            );

            const courseId = courseResult.rows[0].id;

            // Create participant level configurations and enroll pre-selected users
            if (participant_config) {
                for (const [levelKey, config] of Object.entries(participant_config)) {
                    const levelNumber = parseInt(levelKey.split('_')[1]);
                    await client.query(`
                        INSERT INTO course_participant_levels (
                            course_id, level_number, level_name, target_roles, 
                            min_count, max_count, optimal_count
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                        [
                            courseId, levelNumber, config.name, config.roles,
                            config.min, config.max, config.optimal
                        ]
                    );

                    // Enroll pre-selected users for this level
                    if (config.preselected_users && config.preselected_users.enabled && config.preselected_users.users && config.preselected_users.users.length > 0) {
                        for (const userId of config.preselected_users.users) {
                            // Enroll the user and create payment record if applicable
                            await client.query(`
                                INSERT INTO enrollments (user_id, course_id, status, level_number, enrolled_at)
                                VALUES ($1, $2, 'active', $3, NOW())
                                ON CONFLICT (user_id, course_id) DO NOTHING;
                            `, [parseInt(userId), courseId, levelNumber]);

                            if (config.financial && config.financial.type === 'receive' && config.financial.amount > 0) {
                                await client.query(`
                                    INSERT INTO payments (enrollment_id, amount, currency, status, due_date, description)
                                    SELECT e.id, $1, $2, 'pending_payout', NOW(), $3
                                    FROM enrollments e
                                    WHERE e.user_id = $4 AND e.course_id = $5;
                                `, [-Math.abs(config.financial.amount), config.financial.currency || 'SAR', `مكافأة دورة: ${name}`, parseInt(userId), courseId]);
                            }
                        }
                    }
                }
            }

            // Generate course schedule if start_date is provided
            if (start_date && duration_days) {
                await generateCourseSchedule(client, courseId, start_date, duration_days, days_per_week);
            }

            await client.query('COMMIT');

            res.status(201).json({ 
                message: 'تم إنشاء الدورة بنجاح', 
                id: courseId 
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (err) {
        console.error("Advanced course creation error:", err);
        errorHandler(err, res);
    }
}