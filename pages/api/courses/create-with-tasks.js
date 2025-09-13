import pool from '../../../lib/db';
import jwt from 'jsonwebtoken';
import errorHandler from '../../../lib/errorHandler';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'الطريقة غير مسموحة' });
    }

    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'غير مصرح بالدخول - يجب تسجيل الدخول أولاً' });

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!['admin', 'head'].includes(decoded.role)) {
            return res.status(403).json({ message: 'غير مخول - يجب أن تكون مدير أو رئيس قسم' });
        }
    } catch (jwtError) {
        console.error('JWT verification error:', jwtError.message);
        return res.status(401).json({ message: 'رمز المصادقة غير صالح' });
    }

    try {
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
            auto_launch_settings,
            courseSchedule,
            generatedTasks,
            taskGenerationEnabled,
            enhancedTaskConfig
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

            // Create participant level configurations
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
                            // Validate inputs before insertion
                            const parsedUserId = parseInt(userId);
                            if (isNaN(parsedUserId) || parsedUserId <= 0) {
                                throw new Error(`Invalid user ID: ${userId}`);
                            }
                            if (!courseId || courseId <= 0) {
                                throw new Error(`Invalid course ID: ${courseId}`);
                            }
                            if (!levelNumber || levelNumber <= 0) {
                                throw new Error(`Invalid level number: ${levelNumber}`);
                            }
                            
                            await client.query(`
                                INSERT INTO enrollments (user_id, course_id, status, level_number, enrolled_at)
                                VALUES ($1, $2, 'active', $3, NOW())
                                ON CONFLICT (user_id, course_id) DO NOTHING;
                            `, [parsedUserId, courseId, levelNumber]);

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

            // Generate course schedule
            let scheduleCreated = 0;
            if (courseSchedule && courseSchedule.length > 0) {
                for (const scheduleDay of courseSchedule) {
                    await client.query(`
                        INSERT INTO course_schedule (
                            course_id, day_number, title, scheduled_date, 
                            meeting_start_time, meeting_end_time, tasks_released
                        ) VALUES ($1, $2, $3, $4, $5, $6, false)`,
                        [
                            courseId,
                            scheduleDay.day_number,
                            scheduleDay.title,
                            scheduleDay.scheduled_date,
                            scheduleDay.meeting_start_time || '09:00:00',
                            scheduleDay.meeting_end_time || '11:00:00'
                        ]
                    );
                    scheduleCreated++;
                }
            }

            // Generate tasks if enabled
            let tasksGenerated = 0;
            if (taskGenerationEnabled) {
                // Get all enrollments for task assignment
                const enrollments = await client.query(`
                    SELECT e.user_id, e.level_number, u.role, u.full_name
                    FROM enrollments e
                    JOIN users u ON e.user_id = u.id
                    WHERE e.course_id = $1 AND e.status = 'active'
                `, [courseId]);

                if (enrollments.rows.length > 0) {
                    // Use the enhanced task generator utility
                    const enhancedTaskGenerator = await import('../../../lib/enhancedTaskGenerator.js');
                    tasksGenerated = await enhancedTaskGenerator.generateEnhancedTasksForCourse(
                        courseId, 
                        courseResult.rows[0], 
                        enrollments.rows,
                        enhancedTaskConfig || {},
                        client // Pass the existing client to avoid nested transactions
                    );
                } else {
                    // If no enrollments yet, still create task templates for future use
                    const enhancedTaskGenerator = await import('../../../lib/enhancedTaskGenerator.js');
                    await enhancedTaskGenerator.generateEnhancedTasksForCourse(
                        courseId, 
                        courseResult.rows[0], 
                        [], // Empty enrollments
                        enhancedTaskConfig || {},
                        client // Pass the existing client to avoid nested transactions
                    );
                }
            }

            await client.query('COMMIT');

            res.status(201).json({ 
                message: 'تم إنشاء الدورة والمهام بنجاح', 
                id: courseId, // Add this for CourseForm compatibility
                courseId: courseId,
                scheduleCreated: scheduleCreated,
                tasksGenerated: tasksGenerated
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (err) {
        console.error("Course creation with tasks error:", err);
        console.error("Error stack:", err.stack);
        console.error("Error details:", {
            message: err.message,
            code: err.code,
            detail: err.detail
        });
        
        // Return more detailed error for debugging
        res.status(500).json({ 
            message: 'خطأ في إنشاء الدورة: ' + err.message,
            error: process.env.NODE_ENV === 'development' ? err.stack : 'Internal server error'
        });
    }
}

// Helper functions moved to lib/taskGenerator.js