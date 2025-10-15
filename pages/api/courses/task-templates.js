import pool from '../../../lib/db';
import jwt from 'jsonwebtoken';
import errorHandler from '../../../lib/errorHandler';

export default async function handler(req, res) {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (req.method === 'GET') {
            // Get task templates for a course
            const { courseId } = req.query;
            
            if (!courseId) {
                return res.status(400).json({ message: 'Course ID is required' });
            }

            // Check if user has access to this course
            const accessCheck = await pool.query(`
                SELECT 1 FROM courses c 
                WHERE c.id = $1 AND (c.created_by = $2 OR $3 = ANY(ARRAY['admin', 'head']))
                UNION
                SELECT 1 FROM enrollments e 
                WHERE e.course_id = $1 AND e.user_id = $2
            `, [courseId, decoded.id, decoded.role]);

            if (accessCheck.rows.length === 0) {
                return res.status(403).json({ message: 'Not authorized to view this course templates' });
            }

            const templates = await pool.query(`
                SELECT * FROM course_task_templates 
                WHERE course_id = $1 
                ORDER BY level_number, id
            `, [courseId]);

            // Group templates by level
            const groupedTemplates = {
                level_1: [],
                level_2: [],
                level_3: []
            };

            templates.rows.forEach(template => {
                const levelKey = `level_${template.level_number}`;
                if (groupedTemplates[levelKey]) {
                    groupedTemplates[levelKey].push({
                        id: template.id,
                        type: template.task_type,
                        title: template.title,
                        description: template.description,
                        instructions: template.default_instructions,
                        maxScore: template.max_score
                    });
                }
            });

            res.status(200).json({
                success: true,
                templates: groupedTemplates
            });

        } else if (req.method === 'POST') {
            // Create or update task templates for a course
            if (!['admin', 'head', 'teacher'].includes(decoded.role)) {
                return res.status(403).json({ message: 'Not authorized to create task templates' });
            }

            const { courseId, templates } = req.body;

            if (!courseId || !templates) {
                return res.status(400).json({ message: 'Course ID and templates are required' });
            }

            // Check if user owns the course or is admin/head
            const courseCheck = await pool.query(`
                SELECT id FROM courses 
                WHERE id = $1 AND (created_by = $2 OR $3 = ANY(ARRAY['admin', 'head']))
            `, [courseId, decoded.id, decoded.role]);

            if (courseCheck.rows.length === 0) {
                return res.status(403).json({ message: 'Not authorized to modify this course' });
            }

            await pool.query('BEGIN');

            try {
                // Delete existing templates for this course
                await pool.query('DELETE FROM course_task_templates WHERE course_id = $1', [courseId]);

                // Insert new templates
                for (const [levelKey, levelTemplates] of Object.entries(templates)) {
                    const levelNumber = parseInt(levelKey.split('_')[1]);
                    
                    for (const template of levelTemplates) {
                        if (template.type && template.title) {
                            await pool.query(`
                                INSERT INTO course_task_templates (
                                    course_id, level_number, template_type, title, 
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

                await pool.query('COMMIT');

                res.status(200).json({
                    success: true,
                    message: 'Task templates updated successfully'
                });

            } catch (error) {
                await pool.query('ROLLBACK');
                throw error;
            }

        } else if (req.method === 'DELETE') {
            // Delete specific template
            if (!['admin', 'head', 'teacher'].includes(decoded.role)) {
                return res.status(403).json({ message: 'Not authorized to delete task templates' });
            }

            const { templateId } = req.query;

            if (!templateId) {
                return res.status(400).json({ message: 'Template ID is required' });
            }

            // Check if user owns the course containing this template
            const templateCheck = await pool.query(`
                SELECT ctt.id, c.created_by 
                FROM course_task_templates ctt 
                JOIN courses c ON ctt.course_id = c.id 
                WHERE ctt.id = $1
            `, [templateId]);

            if (templateCheck.rows.length === 0) {
                return res.status(404).json({ message: 'Template not found' });
            }

            const template = templateCheck.rows[0];
            if (template.created_by !== decoded.id && !['admin', 'head'].includes(decoded.role)) {
                return res.status(403).json({ message: 'Not authorized to delete this template' });
            }

            await pool.query('DELETE FROM course_task_templates WHERE id = $1', [templateId]);

            res.status(200).json({
                success: true,
                message: 'Template deleted successfully'
            });

        } else {
            res.status(405).json({ message: 'Method Not Allowed' });
        }

    } catch (err) {
        console.error('Task templates error:', err);
        errorHandler(err, res);
    }
}