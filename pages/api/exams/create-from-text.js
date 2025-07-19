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
        
        if (!['admin', 'head', 'teacher'].includes(decoded.role)) {
            return res.status(403).json({ message: 'Not authorized to create exams' });
        }

        const { 
            courseId, 
            dayNumber, 
            examTitle, 
            examDescription,
            textContent, 
            timeLimit, 
            passingScore,
            questions // Pre-created questions from UI
        } = req.body;

        if (!courseId || !dayNumber || !examTitle) {
            return res.status(400).json({ message: 'Course ID, day number, and exam title are required' });
        }

        // Check if user has permission to create exams for this course
        const courseCheck = await pool.query(`
            SELECT id FROM courses 
            WHERE id = $1 AND (created_by = $2 OR $3 = ANY(ARRAY['admin', 'head']))
        `, [courseId, decoded.id, decoded.role]);

        if (courseCheck.rows.length === 0) {
            return res.status(403).json({ message: 'Not authorized to create exams for this course' });
        }

        await pool.query('BEGIN');

        try {
            // Create the exam
            const examResult = await pool.query(`
                INSERT INTO exams (
                    course_id, day_number, title, description, 
                    time_limit, passing_score, is_active
                ) VALUES ($1, $2, $3, $4, $5, $6, true)
                RETURNING id
            `, [courseId, dayNumber, examTitle, examDescription, timeLimit || 30, passingScore || 60]);

            const examId = examResult.rows[0].id;

            // Process and create questions
            let createdQuestions = [];

            if (questions && questions.length > 0) {
                // Use pre-created questions from UI
                for (const question of questions) {
                    const questionResult = await pool.query(`
                        INSERT INTO exam_questions (
                            exam_id, question_text, question_type, 
                            options, correct_answer, points, explanation
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                        RETURNING id
                    `, [
                        examId,
                        question.question,
                        question.type,
                        JSON.stringify(question.options),
                        JSON.stringify(question.correctAnswer),
                        question.points || 1,
                        question.explanation || ''
                    ]);

                    createdQuestions.push({
                        id: questionResult.rows[0].id,
                        text: question.question,
                        type: question.type,
                        points: question.points || 1
                    });
                }
            } else if (textContent) {
                // Generate questions from text content
                const generatedQuestions = generateQuestionsFromText(textContent);
                
                for (const question of generatedQuestions) {
                    const questionResult = await pool.query(`
                        INSERT INTO exam_questions (
                            exam_id, question_text, question_type, 
                            options, correct_answer, points
                        ) VALUES ($1, $2, $3, $4, $5, $6)
                        RETURNING id
                    `, [
                        examId,
                        question.text,
                        question.type,
                        JSON.stringify(question.options),
                        JSON.stringify(question.correctAnswer),
                        question.points
                    ]);

                    createdQuestions.push({
                        id: questionResult.rows[0].id,
                        text: question.text,
                        type: question.type,
                        points: question.points
                    });
                }
            }

            // Update the exam with the questions JSON for backward compatibility
            await pool.query(`
                UPDATE exams 
                SET questions = $1 
                WHERE id = $2
            `, [JSON.stringify(createdQuestions), examId]);

            // Create exam task for all Level 3 participants (students)
            const level3Users = await pool.query(`
                SELECT DISTINCT e.user_id 
                FROM enrollments e 
                JOIN users u ON e.user_id = u.id 
                JOIN course_participant_levels cpl ON cpl.course_id = e.course_id 
                WHERE e.course_id = $1 AND e.status = 'active' 
                AND u.role = ANY(cpl.target_roles) 
                AND cpl.level_number = 3
            `, [courseId]);

            // Get the schedule day for this exam
            const scheduleDay = await pool.query(`
                SELECT id FROM course_schedule 
                WHERE course_id = $1 AND day_number = $2
            `, [courseId, dayNumber]);

            if (scheduleDay.rows.length > 0) {
                const scheduleId = scheduleDay.rows[0].id;

                // Create exam tasks for all Level 3 users
                for (const user of level3Users.rows) {
                    await pool.query(`
                        INSERT INTO tasks (
                            schedule_id, task_type, title, description, 
                            assigned_to, level_number, course_id, max_score, 
                            instructions, created_by, is_active
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false)
                    `, [
                        scheduleId,
                        'exam',
                        examTitle,
                        examDescription,
                        user.user_id,
                        3,
                        courseId,
                        createdQuestions.reduce((sum, q) => sum + q.points, 0),
                        `امتحان يومي - المدة: ${timeLimit} دقيقة - درجة النجاح: ${passingScore}%`,
                        decoded.id,
                        false // Will be activated when day arrives
                    ]);

                    // Create notification
                    await pool.query(`
                        INSERT INTO notifications (user_id, type, message, related_id)
                        VALUES ($1, 'exam_created', $2, $3)
                    `, [
                        user.user_id,
                        `تم إنشاء امتحان جديد: ${examTitle} لليوم ${dayNumber}`,
                        courseId
                    ]);
                }
            }

            await pool.query('COMMIT');

            res.status(201).json({
                success: true,
                message: 'تم إنشاء الامتحان بنجاح',
                exam: {
                    id: examId,
                    title: examTitle,
                    description: examDescription,
                    questionsCount: createdQuestions.length,
                    totalPoints: createdQuestions.reduce((sum, q) => sum + q.points, 0),
                    timeLimit,
                    passingScore
                },
                questions: createdQuestions,
                tasksCreated: level3Users.rows.length
            });

        } catch (error) {
            await pool.query('ROLLBACK');
            throw error;
        }

    } catch (err) {
        console.error('Exam creation error:', err);
        errorHandler(err, res);
    }
}

// Function to generate questions from text content
function generateQuestionsFromText(textContent) {
    const questions = [];
    
    // Split text into sentences
    const sentences = textContent.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    sentences.forEach((sentence, index) => {
        const trimmedSentence = sentence.trim();
        
        if (trimmedSentence.length > 15) {
            // Create true/false question
            questions.push({
                text: `هل العبارة التالية صحيحة؟\n"${trimmedSentence}"`,
                type: 'true_false',
                options: ['صحيح', 'خطأ'],
                correctAnswer: 0, // Default to true, can be edited
                points: 1
            });

            // Create multiple choice question if sentence is long enough
            if (trimmedSentence.length > 40) {
                const words = trimmedSentence.split(' ').filter(w => w.length > 3);
                if (words.length > 3) {
                    const keyWordIndex = Math.floor(words.length / 2);
                    const keyWord = words[keyWordIndex];
                    const questionText = trimmedSentence.replace(keyWord, '____');
                    
                    // Generate distractors (wrong options)
                    const distractors = generateDistractors(keyWord);
                    
                    questions.push({
                        text: `أكمل الجملة التالية:\n"${questionText}"`,
                        type: 'multiple_choice',
                        options: [keyWord, ...distractors].slice(0, 4),
                        correctAnswer: 0,
                        points: 2
                    });
                }
            }
        }
    });

    // Limit to reasonable number of questions
    return questions.slice(0, 20);
}

// Function to generate distractor options for multiple choice questions
function generateDistractors(correctWord) {
    const commonDistractors = [
        'الأول', 'الثاني', 'الثالث', 'الأخير', 'الأفضل', 'الأسوأ',
        'الكبير', 'الصغير', 'الجديد', 'القديم', 'الصحيح', 'الخاطئ',
        'المهم', 'البسيط', 'المعقد', 'السهل', 'الصعب', 'الواضح',
        'الغامض', 'المفيد', 'الضار', 'الجميل', 'القبيح', 'الطويل',
        'القصير', 'العريض', 'الضيق', 'السريع', 'البطيء'
    ];

    // Filter out the correct word and return 3 random distractors
    const availableDistractors = commonDistractors.filter(d => d !== correctWord);
    const shuffled = availableDistractors.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
}