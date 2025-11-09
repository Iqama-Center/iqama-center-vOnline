import pool from '../../../lib/db';
import jwt from 'jsonwebtoken';
import errorHandler from '../../../lib/errorHandler';

export default async function handler(req, res) {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (!['admin', 'head', 'teacher'].includes(decoded.role)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (req.method === 'GET') {
            // Get all auto-fill templates
            const templates = await pool.query(`
                SELECT caft.*, c.name as course_name
                FROM course_auto_fill_templates caft
                LEFT JOIN courses c ON caft.course_id = c.id
                ORDER BY caft.created_at DESC
            `);

            res.status(200).json(templates.rows);

        } else if (req.method === 'POST') {
            // Create new auto-fill template
            const {
                courseId: course_id,
                meetingLinkTemplate: meeting_link_template,
                contentUrlTemplate: content_url_template,
                urlNumberingStart: url_numbering_start,
                urlNumberingEnd: url_numbering_end,
                defaultAssignments: default_assignments
            } = req.body;

            if (!course_id) {
                return res.status(400).json({ message: 'Course ID is required' });
            }

            const newTemplate = await pool.query(`
                INSERT INTO course_auto_fill_templates (
                    course_id, meeting_link_template, content_url_template,
                    url_numbering_start, url_numbering_end, default_assignments
                ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
                [
                    course_id,
                    meeting_link_template,
                    content_url_template,
                    url_numbering_start || 1,
                    url_numbering_end || 10,
                    JSON.stringify(default_assignments || {})
                ]
            );

            res.status(201).json({
                message: 'تم إنشاء قالب التعبئة التلقائية بنجاح',
                template: newTemplate.rows[0]
            });

        } else if (req.method === 'PUT') {
            // Update auto-fill template
            const { id, ...updateData } = req.body;

            if (!id) {
                return res.status(400).json({ message: 'Template ID is required' });
            }

            const {
                meetingLinkTemplate: meeting_link_template,
                contentUrlTemplate: content_url_template,
                urlNumberingStart: url_numbering_start,
                urlNumberingEnd: url_numbering_end,
                defaultAssignments: default_assignments
            } = updateData;

            const updatedTemplate = await pool.query(`
                UPDATE course_auto_fill_templates 
                SET meeting_link_template = $1, content_url_template = $2,
                    url_numbering_start = $3, url_numbering_end = $4,
                    default_assignments = $5
                WHERE id = $6 RETURNING *`,
                [
                    meeting_link_template,
                    content_url_template,
                    url_numbering_start,
                    url_numbering_end,
                    JSON.stringify(default_assignments || {}),
                    id
                ]
            );

            if (updatedTemplate.rows.length === 0) {
                return res.status(404).json({ message: 'Template not found' });
            }

            res.status(200).json({
                message: 'تم تحديث القالب بنجاح',
                template: updatedTemplate.rows[0]
            });

        } else if (req.method === 'DELETE') {
            // Delete auto-fill template
            const { id } = req.query;

            if (!id) {
                return res.status(400).json({ message: 'Template ID is required' });
            }

            const deletedTemplate = await pool.query(
                'DELETE FROM course_auto_fill_templates WHERE id = $1 RETURNING *',
                [id]
            );

            if (deletedTemplate.rows.length === 0) {
                return res.status(404).json({ message: 'Template not found' });
            }

            res.status(200).json({ message: 'تم حذف القالب بنجاح' });

        } else {
            res.status(405).json({ message: 'Method Not Allowed' });
        }

    } catch (err) {
        console.error('Auto-fill templates error:', err);
        errorHandler(err, res);
    }
}