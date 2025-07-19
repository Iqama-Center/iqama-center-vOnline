import pool from '../../../lib/db';
import jwt from 'jsonwebtoken';
import errorHandler from '../../../lib/errorHandler';

export default async function handler(req, res) {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (req.method === 'GET') {
            // Get exam for taking
            const { examId } = req.query;

            const exam = await pool.query(
                `SELECT e.*, c.name as course_name
                 FROM exams e
                 JOIN courses c ON e.course_id = c.id
                 WHERE e.id = $1`,
                [examId]
            );

            if (exam.rows.length === 0) {
                return res.status(404).json({ message: 'Exam not found' });
            }

            const examData = exam.rows[0];

            // Check if user is enrolled
            const enrollment = await pool.query(
                `SELECT id FROM enrollments 
                 WHERE user_id = $1 AND course_id = $2 AND status = 'active'`,
                [decoded.id, examData.course_id]
            );

            if (enrollment.rows.length === 0) {
                return res.status(403).json({ message: 'Not enrolled in this course' });
            }

            // Check if exam is active
            if (!examData.is_active) {
                return res.status(400).json({ message: 'Exam is not active' });
            }

            // Check previous attempts
            const attempts = await pool.query(
                `SELECT COUNT(*) as count FROM exam_attempts 
                 WHERE exam_id = $1 AND user_id = $2`,
                [examId, decoded.id]
            );

            if (parseInt(attempts.rows[0].count) >= examData.max_attempts) {
                return res.status(400).json({ message: 'Maximum attempts reached' });
            }

            // Return exam questions (without correct answers)
            const questions = JSON.parse(examData.questions).map(q => ({
                id: q.id,
                question: q.question,
                type: q.type,
                options: q.options,
                points: q.points
            }));

            res.status(200).json({
                exam: {
                    id: examData.id,
                    title: examData.title,
                    description: examData.description,
                    time_limit: examData.time_limit,
                    questions
                },
                timeRemaining: examData.time_limit * 60 * 1000 // Convert minutes to milliseconds
            });

        } else if (req.method === 'POST') {
            // Submit exam answers
            const { examId, answers } = req.body;

            if (!examId || !answers) {
                return res.status(400).json({ message: 'Missing required fields' });
            }

            // Get exam details
            const exam = await pool.query(
                'SELECT * FROM exams WHERE id = $1',
                [examId]
            );

            if (exam.rows.length === 0) {
                return res.status(404).json({ message: 'Exam not found' });
            }

            const examData = exam.rows[0];
            const questions = JSON.parse(examData.questions);

            // Calculate score
            let totalPoints = 0;
            let earnedPoints = 0;
            const results = [];

            questions.forEach(question => {
                totalPoints += question.points || 1;
                const userAnswer = answers[question.id];
                const isCorrect = userAnswer === question.correctAnswer;
                
                if (isCorrect) {
                    earnedPoints += question.points || 1;
                }

                results.push({
                    questionId: question.id,
                    userAnswer,
                    correctAnswer: question.correctAnswer,
                    isCorrect,
                    points: isCorrect ? (question.points || 1) : 0
                });
            });

            const score = Math.round((earnedPoints / totalPoints) * 100);
            const passed = score >= (examData.passing_score || 60);

            // Save exam attempt
            await pool.query(
                `INSERT INTO exam_attempts (
                    exam_id, user_id, answers, score, total_points, 
                    earned_points, passed, completed_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)`,
                [
                    examId, decoded.id, JSON.stringify(answers), 
                    score, totalPoints, earnedPoints, passed
                ]
            );

            res.status(200).json({
                message: passed ? 'تهانينا! لقد نجحت في الامتحان' : 'للأسف لم تحقق الدرجة المطلوبة',
                score,
                totalPoints,
                earnedPoints,
                passed,
                results
            });

        } else {
            res.status(405).json({ message: 'Method Not Allowed' });
        }

    } catch (err) {
        console.error('Exam taking error:', err);
        errorHandler(err, res);
    }
}