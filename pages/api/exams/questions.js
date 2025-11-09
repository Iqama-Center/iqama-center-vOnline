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
            // Get exam questions
            const { examId } = req.query;

            if (examId) {
                // Get questions for specific exam
                const questions = await pool.query(`
                    SELECT ceq.*, e.title as exam_title
                    FROM exam_questions ceq
                    JOIN exams e ON ceq.exam_id = e.id
                    WHERE ceq.exam_id = $1
                    ORDER BY ceq.question_order ASC`,
                    [examId]
                );

                res.status(200).json(questions.rows);
            } else {
                // Get all questions
                const questions = await pool.query(`
                    SELECT ceq.*, e.title as exam_title, c.name as course_name
                    FROM exam_questions ceq
                    JOIN exams e ON ceq.exam_id = e.id
                    JOIN courses c ON e.course_id = c.id
                    ORDER BY ceq.created_at DESC`
                );

                res.status(200).json(questions.rows);
            }

        } else if (req.method === 'POST') {
            // Create new exam question
            const {
                examId,
                questionText,
                questionType,
                options,
                correctAnswer,
                points,
                questionOrder
            } = req.body;

            if (!examId || !questionText || !questionType) {
                return res.status(400).json({ 
                    message: 'Missing required fields',
                    received: { examId, questionText, questionType, correctAnswer }
                });
            }

            // Debug log
            console.log('Creating question with data:', {
                examId, questionText, questionType, options, correctAnswer, points, questionOrder
            });

            // Verify exam access
            const examCheck = await pool.query(`
                SELECT e.id FROM exams e
                JOIN courses c ON e.course_id = c.id
                WHERE e.id = $1 AND (c.created_by = $2 OR $3 = 'admin')`,
                [examId, decoded.id, decoded.role]
            );

            if (examCheck.rows.length === 0) {
                return res.status(403).json({ message: 'No access to this exam' });
            }

            const newQuestion = await pool.query(`
                INSERT INTO exam_questions (
                    exam_id, question_text, question_type, options,
                    correct_answer, points, question_order
                ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
                [
                    examId,
                    questionText,
                    questionType,
                    JSON.stringify(options || []),
                    correctAnswer,
                    points || 1,
                    questionOrder || 1
                ]
            );

            res.status(201).json({
                message: 'تم إنشاء السؤال بنجاح',
                question: newQuestion.rows[0]
            });

        } else if (req.method === 'PUT') {
            // Update exam question
            const { id, ...updateData } = req.body;

            if (!id) {
                return res.status(400).json({ message: 'Question ID is required' });
            }

            const updatedQuestion = await pool.query(`
                UPDATE exam_questions 
                SET question_text = $1, question_type = $2, options = $3,
                    correct_answer = $4, points = $5, question_order = $6
                WHERE id = $7 RETURNING *`,
                [
                    updateData.questionText,
                    updateData.questionType,
                    JSON.stringify(updateData.options || []),
                    updateData.correctAnswer,
                    updateData.points,
                    updateData.questionOrder,
                    id
                ]
            );

            if (updatedQuestion.rows.length === 0) {
                return res.status(404).json({ message: 'Question not found' });
            }

            res.status(200).json({
                message: 'تم تحديث السؤال بنجاح',
                question: updatedQuestion.rows[0]
            });

        } else if (req.method === 'DELETE') {
            // Delete exam question
            const { id } = req.query;

            if (!id) {
                return res.status(400).json({ message: 'Question ID is required' });
            }

            const deletedQuestion = await pool.query(
                'DELETE FROM exam_questions WHERE id = $1 RETURNING *',
                [id]
            );

            if (deletedQuestion.rows.length === 0) {
                return res.status(404).json({ message: 'Question not found' });
            }

            res.status(200).json({ message: 'تم حذف السؤال بنجاح' });

        } else {
            res.status(405).json({ message: 'Method Not Allowed' });
        }

    } catch (err) {
        console.error('Exam questions error:', err);
        errorHandler(err, res);
    }
}