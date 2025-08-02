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

        const { course_id } = req.body;

        if (!course_id) {
            return res.status(400).json({ message: 'Course ID is required' });
        }

        await pool.query('BEGIN');

        try {
            // Get course details
            const courseResult = await pool.query(
                'SELECT * FROM courses WHERE id = $1',
                [course_id]
            );

            if (courseResult.rows.length === 0) {
                return res.status(404).json({ message: 'Course not found' });
            }

            const course = courseResult.rows[0];

            if (course.is_published) {
                return res.status(400).json({ message: 'Course is already published' });
            }

            // Update course to published
            await pool.query(
                'UPDATE courses SET is_published = true, status = $1 WHERE id = $2',
                ['published', course_id]
            );

            // Get participant levels for this course
            const levels = await pool.query(
                'SELECT * FROM course_participant_levels WHERE course_id = $1 ORDER BY level_number',
                [course_id]
            );

            // Notify users based on the 3-level system
            // Level 2 (Managers/Teachers) get notified first
            const level2 = levels.rows.find(l => l.level_number === 2);
            if (level2) {
                const level2Users = await pool.query(
                    'SELECT id, full_name FROM users WHERE role = ANY($1)',
                    [level2.target_roles]
                );

                for (const user of level2Users.rows) {
                    await pool.query(`
                        INSERT INTO notifications (user_id, type, title, message, related_id)
                        VALUES ($1, 'course_published', $2, $3, $4)
                    `, [
                        user.id,
                        'دورة جديدة متاحة للانضمام',
                        `تم نشر دورة جديدة "${course.name}". يمكنك الآن مراجعتها والانضمام إليها إذا كانت مناسبة لجدولك.`,
                        course_id
                    ]);
                }
            }

            await pool.query('COMMIT');

            res.status(200).json({
                success: true,
                message: 'Course published successfully',
                course_name: course.name
            });

        } catch (error) {
            await pool.query('ROLLBACK');
            throw error;
        }

    } catch (err) {
        console.error('Course publish error:', err);
        errorHandler(err, res);
    }
}