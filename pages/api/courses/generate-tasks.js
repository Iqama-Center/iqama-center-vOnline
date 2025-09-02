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

        const { courseId } = req.body;
        
        if (!courseId) {
            return res.status(400).json({ message: 'Course ID is required' });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Get course details
            const courseResult = await client.query(`
                SELECT c.*, cs.id as schedule_id, cs.day_number, cs.scheduled_date, cs.meeting_start_time, cs.meeting_end_time
                FROM courses c
                LEFT JOIN course_schedule cs ON c.id = cs.course_id
                WHERE c.id = $1 AND c.is_launched = true
                ORDER BY cs.day_number
            `, [courseId]);

            if (courseResult.rows.length === 0) {
                throw new Error('Course not found or not launched');
            }

            const course = courseResult.rows[0];
            const schedules = courseResult.rows;

            // Get all enrollments for this course
            const enrollmentsResult = await client.query(`
                SELECT e.user_id, e.level_number, u.role, u.name
                FROM enrollments e
                JOIN users u ON e.user_id = u.id
                WHERE e.course_id = $1 AND e.status = 'active'
            `, [courseId]);

            const enrollments = enrollmentsResult.rows;

            // Generate tasks for each schedule day
            let totalTasksCreated = 0;

            for (const schedule of schedules) {
                if (!schedule.schedule_id) continue;

                // Generate tasks for each enrollment based on their role/level
                for (const enrollment of enrollments) {
                    const tasksCreated = await generateTasksForUserAndDay(
                        client, 
                        courseId, 
                        schedule, 
                        enrollment, 
                        course
                    );
                    totalTasksCreated += tasksCreated;
                }
            }

            await client.query('COMMIT');

            res.status(200).json({
                success: true,
                message: `Generated ${totalTasksCreated} tasks for course`,
                tasksCreated: totalTasksCreated
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (err) {
        console.error('Task generation error:', err);
        errorHandler(err, res);
    }
}

async function generateTasksForUserAndDay(client, courseId, schedule, enrollment, course) {
    let tasksCreated = 0;
    const userId = enrollment.user_id;
    const userRole = enrollment.role;
    const levelNumber = enrollment.level_number;

    // Define task templates based on user role and course day
    const taskTemplates = getTaskTemplatesForRole(userRole, schedule.day_number, course);

    for (const template of taskTemplates) {
        // Calculate due date based on task type
        const dueDate = calculateDueDate(schedule, template.type, course);

        // Create the task
        const taskResult = await client.query(`
            INSERT INTO tasks (
                schedule_id, task_type, title, description, due_date, 
                assigned_to, level_number, course_id, max_score, 
                instructions, is_active, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING id
        `, [
            schedule.id,
            template.type,
            template.title,
            template.description,
            dueDate,
            userId,
            levelNumber,
            courseId,
            template.maxScore,
            template.instructions,
            false, // Will be activated when meeting time passes
            1 // System generated
        ]);

        tasksCreated++;

        // Create notification for the user
        await client.query(`
            INSERT INTO notifications (user_id, type, message, related_id, created_at)
            VALUES ($1, 'task_scheduled', $2, $3, CURRENT_TIMESTAMP)
        `, [
            userId,
            `مهمة جديدة مجدولة: ${template.title} - اليوم ${schedule.day_number}`,
            courseId
        ]);
    }

    return tasksCreated;
}

function getTaskTemplatesForRole(userRole, dayNumber, course) {
    const templates = [];

    switch (userRole) {
        case 'student':
            // Daily reading task (expires in 24 hours)
            templates.push({
                type: 'daily_reading',
                title: `قراءة اليوم ${dayNumber}`,
                description: `قراءة المادة المطلوبة لليوم ${dayNumber} من الدورة`,
                maxScore: 10,
                instructions: 'يجب إكمال القراءة خلال 24 ساعة من بداية اليوم الدراسي'
            });

            // Daily quiz (expires in 24 hours)
            templates.push({
                type: 'daily_quiz',
                title: `اختبار اليوم ${dayNumber}`,
                description: `اختبار قصير على مادة اليوم ${dayNumber}`,
                maxScore: 20,
                instructions: 'يجب إكمال الاختبار خلال 24 ساعة من إتاحته'
            });

            // Homework (fixed deadline - 3 days)
            if (dayNumber % 3 === 0) { // Every 3 days
                templates.push({
                    type: 'homework',
                    title: `واجب الأسبوع ${Math.ceil(dayNumber / 7)}`,
                    description: `واجب منزلي شامل للأسبوع ${Math.ceil(dayNumber / 7)}`,
                    maxScore: 50,
                    instructions: 'يجب تسليم الواجب خلال 3 أيام من تاريخ الإصدار'
                });
            }

            // Major exam (fixed deadline - 1 week)
            if (dayNumber % 7 === 0) { // Every week
                templates.push({
                    type: 'exam',
                    title: `امتحان الأسبوع ${dayNumber / 7}`,
                    description: `امتحان شامل للأسبوع ${dayNumber / 7}`,
                    maxScore: 100,
                    instructions: 'يجب إكمال الامتحان خلال أسبوع من تاريخ الإصدار'
                });
            }
            break;

        case 'teacher':
            // Daily evaluation task
            templates.push({
                type: 'daily_evaluation',
                title: `تقييم طلاب اليوم ${dayNumber}`,
                description: `تقييم أداء الطلاب في اليوم ${dayNumber}`,
                maxScore: 0, // No score for teacher tasks
                instructions: 'يجب إكمال تقييم جميع الطلاب خلال 24 ساعة من انتهاء الحصة'
            });

            // Prepare next day material
            templates.push({
                type: 'preparation',
                title: `تحضير مادة اليوم ${dayNumber + 1}`,
                description: `تحضير وإعداد مادة اليوم التالي`,
                maxScore: 0,
                instructions: 'يجب إكمال التحضير قبل بداية اليوم التالي'
            });

            // Weekly report
            if (dayNumber % 7 === 0) {
                templates.push({
                    type: 'weekly_report',
                    title: `تقرير الأسبوع ${dayNumber / 7}`,
                    description: `تقرير شامل عن أداء الطلاب والتقدم الأسبوعي`,
                    maxScore: 0,
                    instructions: 'يجب تسليم التقرير خلال 3 أيام من نهاية الأسبوع'
                });
            }
            break;

        case 'supervisor':
        case 'admin':
        case 'head':
            // Daily monitoring
            templates.push({
                type: 'daily_monitoring',
                title: `مراقبة سير الدورة - اليوم ${dayNumber}`,
                description: `مراجعة ومراقبة سير الدورة في اليوم ${dayNumber}`,
                maxScore: 0,
                instructions: 'مراجعة يومية لضمان سير الدورة بشكل صحيح'
            });

            // Weekly evaluation
            if (dayNumber % 7 === 0) {
                templates.push({
                    type: 'weekly_evaluation',
                    title: `تقييم أسبوعي - الأسبوع ${dayNumber / 7}`,
                    description: `تقييم شامل لأداء المعلمين والطلاب`,
                    maxScore: 0,
                    instructions: 'تقييم شامل يجب إكماله خلال أسبوع'
                });
            }
            break;
    }

    return templates;
}

function calculateDueDate(schedule, taskType, course) {
    const baseDate = new Date(schedule.scheduled_date);
    
    // For daily tasks, set due date to end of the same day (24 hours)
    if (['daily_reading', 'daily_quiz', 'daily_evaluation', 'daily_monitoring'].includes(taskType)) {
        const dueDate = new Date(baseDate);
        dueDate.setHours(23, 59, 59, 999); // End of day
        return dueDate;
    }
    
    // For preparation tasks, due before next day starts
    if (taskType === 'preparation') {
        const dueDate = new Date(baseDate);
        dueDate.setDate(dueDate.getDate() + 1);
        dueDate.setHours(8, 0, 0, 0); // 8 AM next day
        return dueDate;
    }
    
    // For homework, 3 days deadline
    if (taskType === 'homework') {
        const dueDate = new Date(baseDate);
        dueDate.setDate(dueDate.getDate() + 3);
        dueDate.setHours(23, 59, 59, 999);
        return dueDate;
    }
    
    // For exams and reports, 1 week deadline
    if (['exam', 'weekly_report', 'weekly_evaluation'].includes(taskType)) {
        const dueDate = new Date(baseDate);
        dueDate.setDate(dueDate.getDate() + 7);
        dueDate.setHours(23, 59, 59, 999);
        return dueDate;
    }
    
    // Default: same day
    const dueDate = new Date(baseDate);
    dueDate.setHours(23, 59, 59, 999);
    return dueDate;
}