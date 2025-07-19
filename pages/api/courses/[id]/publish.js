import pool from '../../../../lib/db';
import jwt from 'jsonwebtoken';
import errorHandler from '../../../../lib/errorHandler';

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

        const { id } = req.query;

        // Begin transaction
        await pool.query('BEGIN');

        try {
            // Update course status to published
            await pool.query(
                'UPDATE courses SET is_published = TRUE, status = $1 WHERE id = $2',
                ['published', id]
            );

            // Get course details and participant configuration
            const courseResult = await pool.query('SELECT * FROM courses WHERE id = $1', [id]);
            if (courseResult.rows.length === 0) {
                throw new Error('Course not found');
            }
            
            const course = courseResult.rows[0];
            
            // Try to get participant levels, but don't fail if table doesn't exist
            let participantLevels = { rows: [] };
            try {
                participantLevels = await pool.query(
                    'SELECT * FROM course_participant_levels WHERE course_id = $1 ORDER BY level_number',
                    [id]
                );
            } catch (levelError) {
                console.log('course_participant_levels table not found, using participant_config from course');
            }

            // Create notifications for level 2 participants (teachers/trainers)
            let targetRoles = ['teacher']; // Default roles
            
            if (participantLevels.rows.length > 0) {
                const level2Config = participantLevels.rows.find(level => level.level_number === 2);
                if (level2Config && level2Config.target_roles) {
                    targetRoles = level2Config.target_roles;
                }
            } else if (course.participant_config) {
                // Use participant_config from course if available
                try {
                    const config = typeof course.participant_config === 'string' ? 
                        JSON.parse(course.participant_config) : course.participant_config;
                    if (config.level_2 && config.level_2.roles) {
                        targetRoles = config.level_2.roles;
                    }
                } catch (parseError) {
                    console.log('Error parsing participant_config, using default roles');
                }
            }

            // Create notifications for target users (only if notifications table exists)
            try {
                const targetUsers = await pool.query(
                    'SELECT id FROM users WHERE role = ANY($1)',
                    [targetRoles]
                );

                for (const user of targetUsers.rows) {
                    try {
                        await pool.query(`
                            INSERT INTO notifications (user_id, type, message, related_id)
                            VALUES ($1, $2, $3, $4)`,
                            [
                                user.id,
                                'announcement',
                                `تم نشر دورة جديدة "${course.name}" وهي متاحة للانضمام. يرجى مراجعة التفاصيل واختيار الأوقات المناسبة.`,
                                parseInt(id)
                            ]
                        );
                    } catch (notificationError) {
                        console.log('Failed to create notification for user:', user.id, notificationError.message);
                        // Continue with other users even if one fails
                    }
                }
            } catch (userQueryError) {
                console.log('Failed to query users or create notifications:', userQueryError.message);
                // Don't fail the entire publish process if notifications fail
            }

            await pool.query('COMMIT');

            res.status(200).json({ 
                message: 'تم نشر الدورة بنجاح',
                course_id: id 
            });

        } catch (error) {
            await pool.query('ROLLBACK');
            throw error;
        }

    } catch (err) {
        console.error("Course publish error:", err);
        errorHandler(err, res);
    }
}