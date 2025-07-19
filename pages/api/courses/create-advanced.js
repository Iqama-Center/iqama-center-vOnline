import pool from '../../../lib/db';
import jwt from 'jsonwebtoken';
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

        // Begin transaction
        await pool.query('BEGIN');

        try {
            // Create the course
            const courseResult = await pool.query(`
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
                    await pool.query(`
                        INSERT INTO course_participant_levels (
                            course_id, level_number, level_name, target_roles, 
                            min_count, max_count, optimal_count
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                        [
                            courseId, levelNumber, config.name, config.roles,
                            config.min, config.max, config.optimal
                        ]
                    );
                }
            }

            // Create initial schedule days based on duration
            if (duration_days && duration_days > 0) {
                for (let day = 1; day <= duration_days; day++) {
                    await pool.query(`
                        INSERT INTO course_schedule (
                            course_id, day_number, title, content_url, meeting_link
                        ) VALUES ($1, $2, $3, $4, $5)`,
                        [courseId, day, `اليوم الدراسي ${day}`, '', '']
                    );
                }
            }

            // Create task templates if provided
            if (req.body.taskTemplates) {
                for (const [levelKey, templates] of Object.entries(req.body.taskTemplates)) {
                    const levelNumber = parseInt(levelKey.split('_')[1]);
                    
                    for (const template of templates) {
                        if (template.type && template.title) {
                            await pool.query(`
                                INSERT INTO course_task_templates (
                                    course_id, level_number, task_type, title, 
                                    description, default_instructions, max_score
                                ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                                [
                                    courseId, levelNumber, template.type, template.title,
                                    template.description || '', template.instructions || '', 
                                    template.maxScore || 100
                                ]
                            );
                        }
                    }
                }
            }

            await pool.query('COMMIT');

            const course = courseResult.rows[0];
            
            // Safe serialization for API response
            const safeResponse = {
                id: courseResult.rows[0].id, // Use the ID from the database result
                name: courseResult.rows[0].name,
                description: courseResult.rows[0].description,
                created_at: courseResult.rows[0].created_at ? courseResult.rows[0].created_at.toISOString() : null,
                start_date: courseResult.rows[0].start_date ? courseResult.rows[0].start_date.toISOString().split('T')[0] : null,
                duration_days: courseResult.rows[0].duration_days,
                days_per_week: courseResult.rows[0].days_per_week,
                hours_per_day: courseResult.rows[0].hours_per_day,
                status: courseResult.rows[0].status,
                message: 'تم إنشاء الدورة بنجاح'
            };
            
            console.log('Course created with ID:', safeResponse.id); // Debug log
            res.status(201).json(safeResponse);

        } catch (error) {
            await pool.query('ROLLBACK');
            throw error;
        }

    } catch (err) {
        console.error("Advanced course creation error:", err);
        errorHandler(err, res);
    }
}