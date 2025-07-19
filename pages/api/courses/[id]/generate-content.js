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
        
        if (!['admin', 'head', 'teacher'].includes(decoded.role)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { id: courseId } = req.query;
        const { templateId } = req.body;

        if (!templateId) {
            return res.status(400).json({ message: 'Template ID is required' });
        }

        // Verify course access
        const courseCheck = await pool.query(
            'SELECT id FROM courses WHERE id = $1 AND created_by = $2',
            [courseId, decoded.id]
        );

        if (courseCheck.rows.length === 0 && decoded.role !== 'admin') {
            return res.status(403).json({ message: 'No access to this course' });
        }

        // Get template
        const template = await pool.query(
            'SELECT * FROM course_auto_fill_templates WHERE id = $1',
            [templateId]
        );

        if (template.rows.length === 0) {
            return res.status(404).json({ message: 'Template not found' });
        }

        const templateData = template.rows[0];

        // Generate content using database function
        const generatedContent = await pool.query(
            'SELECT generate_course_content($1, $2) as content',
            [templateId, courseId]
        );

        const content = generatedContent.rows[0].content;

        // Log the auto-fill action
        await pool.query(`
            INSERT INTO course_auto_launch_log (
                course_id, launch_reason, enrollment_counts, launched_by
            ) VALUES ($1, $2, $3, $4)`,
            [
                courseId,
                'auto_fill_template_applied',
                JSON.stringify({ template_id: templateId }),
                `user_${decoded.id}`
            ]
        );

        // Update course with generated content
        await pool.query(`
            UPDATE courses 
            SET details = COALESCE(details, '{}') || $1
            WHERE id = $2`,
            [JSON.stringify({ auto_generated: content }), courseId]
        );

        res.status(200).json({
            message: 'تم توليد المحتوى بنجاح',
            generatedContent: content,
            appliedTemplate: templateData
        });

    } catch (err) {
        console.error('Generate content error:', err);
        errorHandler(err, res);
    }
}