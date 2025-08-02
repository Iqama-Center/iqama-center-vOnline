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
            // Check if course exists and is published
            const courseCheck = await pool.query(
                'SELECT id, name, status, is_published, is_launched FROM courses WHERE id = $1',
                [id]
            );

            if (courseCheck.rows.length === 0) {
                return res.status(404).json({ message: 'Course not found' });
            }

            const course = courseCheck.rows[0];

            if (course.is_launched) {
                return res.status(400).json({ message: 'Cannot unpublish a launched course' });
            }

            if (!course.is_published && course.status === 'draft') {
                return res.status(400).json({ message: 'Course is already unpublished' });
            }

            // Unpublish the course - set back to draft
            await pool.query(
                'UPDATE courses SET is_published = FALSE, status = $1 WHERE id = $2',
                ['draft', id]
            );

            // Remove any pending enrollments for this course
            await pool.query(
                'DELETE FROM enrollments WHERE course_id = $1 AND status = ANY($2)',
                [id, ['pending_payment', 'pending_approval']]
            );

            // Create notification for users who were enrolled
            const enrolledUsers = await pool.query(
                'SELECT DISTINCT user_id FROM enrollments WHERE course_id = $1',
                [id]
            );

            for (const user of enrolledUsers.rows) {
                await pool.query(`
                    INSERT INTO notifications (user_id, type, message, related_id)
                    VALUES ($1, 'announcement', $2, $3)
                `, [
                    user.user_id,
                    `تم إلغاء نشر دورة "${course.name}". إذا كنت مسجلاً بها، فقد تم إلغاء تسجيلك.`,
                    parseInt(id)
                ]);
            }

            await pool.query('COMMIT');

            res.status(200).json({ 
                message: 'تم إلغاء نشر الدورة بنجاح',
                course_id: id,
                course_name: course.name
            });

        } catch (error) {
            await pool.query('ROLLBACK');
            throw error;
        }

    } catch (err) {
        console.error("Course unpublish error:", err);
        errorHandler(err, res);
    }
}