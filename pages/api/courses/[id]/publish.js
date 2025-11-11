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

            // Create notifications based on participant configuration hierarchy
            // According to cReq.md: Level 2 (teachers/trainers) get notified first
            let allTargetRoles = [];
            let level2Roles = ['teacher']; // Default level 2 roles
            let level1Roles = ['admin', 'head']; // Default level 1 roles
            
            if (participantLevels.rows.length > 0) {
                const level1Config = participantLevels.rows.find(level => level.level_number === 1);
                const level2Config = participantLevels.rows.find(level => level.level_number === 2);
                
                if (level1Config && level1Config.target_roles) {
                    level1Roles = level1Config.target_roles;
                }
                if (level2Config && level2Config.target_roles) {
                    level2Roles = level2Config.target_roles;
                }
            } else if (course.participant_config) {
                // Use participant_config from course if available
                try {
                    const config = typeof course.participant_config === 'string' ? 
                        JSON.parse(course.participant_config) : course.participant_config;
                    
                    if (config.level_1 && config.level_1.roles) {
                        level1Roles = config.level_1.roles;
                    }
                    if (config.level_2 && config.level_2.roles) {
                        level2Roles = config.level_2.roles;
                    }
                } catch (parseError) {
                    console.log('Error parsing participant_config, using default roles');
                }
            }

            // Combine all target roles for initial notification
            allTargetRoles = [...new Set([...level1Roles, ...level2Roles])];

            // Create notifications for target users (only if notifications table exists)
            try {
                const targetUsers = await pool.query(
                    'SELECT id, role, full_name FROM users WHERE role = ANY($1)',
                    [allTargetRoles]
                );

                for (const user of targetUsers.rows) {
                    try {
                        let message = '';
                        
                        // Different messages based on user role and level
                        if (level2Roles.includes(user.role)) {
                            // Level 2 users (teachers/trainers) - they need to join first
                            message = `تم نشر دورة جديدة "${course.name}" وهي متاحة للانضمام. يرجى مراجعة التفاصيل واختيار الأوقات المناسبة لك. انضمامك مطلوب لتفعيل الدورة للطلاب.`;
                        } else if (level1Roles.includes(user.role)) {
                            // Level 1 users (supervisors) - they can approve and launch
                            message = `تم نشر دورة جديدة "${course.name}". يمكنك مراجعة التفاصيل والموافقة على انضمام المشاركين أو بدء انطلاق الدورة عند اكتمال العدد المطلوب.`;
                        } else {
                            // Default message
                            message = `تم نشر دورة جديدة "${course.name}" وهي متاحة للانضمام.`;
                        }

                        await pool.query(`
                            INSERT INTO notifications (user_id, type, message, related_id)
                            VALUES ($1, $2, $3, $4)`,
                            [
                                user.id,
                                'course_published',
                                message,
                                parseInt(id)
                            ]
                        );
                    } catch (notificationError) {
                        console.log('Failed to create notification for user:', user.id, notificationError.message);
                        // Continue with other users even if one fails
                    }
                }

                console.log(`Course published: ${course.name}, notified ${targetUsers.rows.length} users`);
                
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