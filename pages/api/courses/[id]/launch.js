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
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Step 1: Update course status to launched
            await client.query(
                'UPDATE courses SET is_launched = TRUE, status = $1, launched_at = CURRENT_TIMESTAMP WHERE id = $2',
                ['active', id]
            );

            // Step 2: Update all waiting_start enrollments to active
            await client.query(`
                UPDATE enrollments 
                SET status = 'active' 
                WHERE course_id = $1 AND status = 'waiting_start'
            `, [id]);

            // Step 3: Generate all tasks for the course using the new task generation system
            const taskGenerationResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/courses/generate-tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': req.headers.cookie || ''
                },
                body: JSON.stringify({ courseId: id })
            });

            if (!taskGenerationResponse.ok) {
                console.warn('Task generation failed, but continuing with launch');
            } else {
                const taskResult = await taskGenerationResponse.json();
                console.log(`Generated ${taskResult.tasksCreated} tasks for course ${id}`);
            }

            // Step 4: Get all enrolled users for notifications
            const enrolledUsers = await client.query(`
                SELECT DISTINCT e.user_id
                FROM enrollments e 
                WHERE e.course_id = $1 AND e.status = 'active'`,
                [id]
            );

            // Step 5: Create launch notifications for all participants
            for (const user of enrolledUsers.rows) {
                await client.query(`
                    INSERT INTO notifications (user_id, type, message, related_id)
                    VALUES ($1, 'course_launched', 'تم بدء انطلاق الدورة وهي الآن نشطة. يمكنك الآن الوصول إلى محتوى الأيام الدراسية والمشاركة في الأنشطة.', $2)`,
                    [user.user_id, id]
                );
            }

            await client.query('COMMIT');

            res.status(200).json({ 
                message: 'تم بدء انطلاق الدورة بنجاح',
                course_id: id,
                participants_notified: enrolledUsers.rows.length
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (err) {
        console.error("Course launch error:", err);
        errorHandler(err, res);
    }
}
