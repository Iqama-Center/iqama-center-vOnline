import pool from '../../../lib/db';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    const { id } = req.query;
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ message: 'Not authenticated' });
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        return res.status(401).json({ message: 'Invalid token' });
    }

    const userRole = decoded.role;

    if (req.method === 'PUT') {
        if (userRole !== 'admin' && userRole !== 'head') {
            return res.status(403).json({ message: 'غير مصرح لك بتعديل الدورات.' });
        }
        
                const { 
                    name, 
                    description, 
                    content_outline,
                    duration_days,
                    start_date,
                    days_per_week,
                    hours_per_day,
                    details: originalDetails,
                    participant_config,
                    auto_launch_settings,
                    course_fee,
                    max_enrollment
                } = req.body;
        
                if (!name || name.trim() === '') {
                    return res.status(400).json({ message: 'اسم الدورة مطلوب.' });
                }
        
                // Prioritize top-level fields, but fall back to details object for backward compatibility
                const final_course_fee = course_fee ?? originalDetails?.cost;
                const final_max_enrollment = max_enrollment ?? originalDetails?.max_seats;
        
                // Sanitize details object by removing fields that are now top-level columns
                const details = { ...originalDetails };
                delete details.cost;
                delete details.max_seats;
                
                const client = await pool.connect();
                try {
                    await client.query('BEGIN');
        
                    const result = await client.query(`
                        UPDATE courses SET 
                            name = $1, 
                            description = $2, 
                            content_outline = $3,
                            duration_days = $4,
                            start_date = $5,
                            days_per_week = $6,
                            hours_per_day = $7,
                            details = $8,
                            participant_config = $9,
                            auto_launch_settings = $10,
                            course_fee = $12,
                            max_enrollment = $13
                        WHERE id = $11 
                        RETURNING *`, 
                        [
                            name, 
                            description, 
                            content_outline,
                            duration_days,
                            start_date,
                            days_per_week,
                            hours_per_day,
                            details || {},
                            participant_config || {},
                            auto_launch_settings || {},
                            id,
                            final_course_fee,
                            final_max_enrollment
                        ]
                    );            
            if (result.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ message: 'الدورة غير موجودة.' });
            }

            // Enroll pre-selected users and create payment records if applicable
            if (participant_config) {
                for (const [levelKey, config] of Object.entries(participant_config)) {
                    if (config.preselected_users && config.preselected_users.enabled && config.preselected_users.users) {
                        const levelNumber = parseInt(levelKey.split('_')[1]);
                        for (const userId of config.preselected_users.users) {
                            // Validate inputs before insertion
                            const parsedUserId = parseInt(userId);
                            if (isNaN(parsedUserId) || parsedUserId <= 0) {
                                throw new Error(`Invalid user ID: ${userId}`);
                            }
                            if (!id || id <= 0) {
                                throw new Error(`Invalid course ID: ${id}`);
                            }
                            if (!levelNumber || levelNumber <= 0) {
                                throw new Error(`Invalid level number: ${levelNumber}`);
                            }
                            
                            await client.query(`
                                INSERT INTO enrollments (user_id, course_id, status, level_number, enrolled_at)
                                VALUES ($1, $2, 'active', $3, NOW())
                                ON CONFLICT (user_id, course_id) DO NOTHING;
                            `, [parsedUserId, id, levelNumber]);

                            if (config.financial && config.financial.type === 'receive' && config.financial.amount > 0) {
                                await client.query(`
                                    INSERT INTO payments (enrollment_id, amount, currency, status, due_date, description)
                                    SELECT e.id, $1, $2, 'pending_payout', NOW(), $3
                                    FROM enrollments e
                                    WHERE e.user_id = $4 AND e.course_id = $5;
                                `, [-Math.abs(config.financial.amount), config.financial.currency || 'SAR', `مكافأة دورة: ${name}`, parseInt(userId), id]);
                            }
                        }
                    }
                }
            }

            await client.query('COMMIT');
            
            res.status(200).json({ 
                message: 'تم تحديث الدورة بنجاح.', 
                id: parseInt(id) 
            });
        } catch (err) {
            await client.query('ROLLBACK');
            console.error("Update Course Error:", err);
            res.status(500).json({ message: 'حدث خطأ في الخادم.' });
        } finally {
            client.release();
        }
    } else {
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
