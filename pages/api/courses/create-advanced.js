import pool from '../../../lib/db';
import jwt from 'jsonwebtoken';
import errorHandler from '../../../lib/errorHandler';

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
                    days_per_week, hours_per_day, details: originalDetails, participant_config, auto_launch_settings,
                    course_fee, max_enrollment
                } = req.body;
        
                if (!name || !description) {
                    return res.status(400).json({ message: 'اسم الدورة ووصفها مطلوبان' });
                }
                
                // Prioritize top-level fields, but fall back to details object for backward compatibility
                const final_course_fee = course_fee ?? originalDetails?.cost;
                const final_max_enrollment = max_enrollment ?? originalDetails?.max_seats;
        
                // Sanitize details object by removing fields that are now top-level columns
                const details = { ...originalDetails };
                delete details.cost;
                delete details.max_seats;
        
        
                await client.query('BEGIN');
        
                const courseResult = await client.query(`
                    INSERT INTO courses (
                        name, description, content_outline, duration_days, start_date, 
                        days_per_week, hours_per_day, created_by, details, 
                        participant_config, auto_launch_settings, status, course_fee, max_enrollment
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'draft', $12, $13) 
                    RETURNING id`,[
                        name, description, content_outline, duration_days, start_date,
                        days_per_week, hours_per_day, decoded.id, 
                        details || {}, 
                        participant_config || {}, 
                        auto_launch_settings || {},
                        final_course_fee,
                        final_max_enrollment
                    ]
                );        const courseId = courseResult.rows[0].id;

        if (participant_config) {
            for (const [levelKey, config] of Object.entries(participant_config)) {
                const levelNumber = parseInt(levelKey.split('_')[1]);
                if (!levelNumber || !config.name || !config.roles) continue;

                await client.query(`
                    INSERT INTO course_participant_levels (
                        course_id, level_number, level_name, target_roles, 
                        min_count, max_count, optimal_count
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,[
                        courseId, levelNumber, config.name, config.roles,
                        config.min || 1, config.max || 10, config.optimal || 5
                    ]
                );

                const usersToEnroll = config.preselected_users?.users;
                if (usersToEnroll && usersToEnroll.length > 0) {
                    // Bulk insert enrollments
                    const enrollmentResult = await client.query(`
                        INSERT INTO enrollments (user_id, course_id, status, level_number, enrolled_at)
                        SELECT user_id, $2, 'active', $3, NOW()
                        FROM unnest($1::int[]) AS user_id
                        ON CONFLICT (user_id, course_id) DO UPDATE SET status = 'active', level_number = $3
                        RETURNING id, user_id
                    `, [usersToEnroll, courseId, levelNumber]);

                    // Bulk insert payments for users set to receive rewards
                    if (config.financial?.type === 'receive' && config.financial?.amount > 0) {
                        const payouts = enrollmentResult.rows.map(enrollment => ({
                            enrollment_id: enrollment.id,
                            amount: Math.abs(config.financial.amount), // Store as positive value
                            currency: config.financial.currency || 'SAR',
                            description: `مكافأة دورة: ${name}`
                        }));

                        if (payouts.length > 0) {
                            await client.query(`
                                INSERT INTO payments (enrollment_id, amount, currency, status, due_date, description)
                                SELECT p.enrollment_id, p.amount, p.currency, 'pending_payout', NOW(), p.description
                                FROM json_to_recordset($1::json) AS p(enrollment_id INT, amount NUMERIC, currency VARCHAR, description TEXT)
                            `, [JSON.stringify(payouts)]);
                        }
                    }
                }
            }
        }

        await client.query('COMMIT');
        res.status(201).json({ message: 'تم إنشاء الدورة بنجاح', id: courseId });

    } catch (err) {
        await client.query('ROLLBACK').catch(console.error);
        console.error("Advanced course creation error:", err);
        errorHandler(err, res);
    } finally {
        client.release();
    }
}
