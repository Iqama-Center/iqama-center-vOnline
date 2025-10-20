// Enhanced Task Generation System for Course Creation
// Supports both daily tasks (24-hour expiry) and fixed tasks (custom deadlines)
import pool from './db';

export async function generateEnhancedTasksForCourse(courseId, courseData, enrollments, taskConfig = {}, existingClient = null) {
    const client = existingClient || await pool.connect();
    let tasksGenerated = 0;
    const shouldManageTransaction = !existingClient;

    try {
        if (shouldManageTransaction) {
            await client.query('BEGIN');
        }

        // Get course schedule
        const scheduleResult = await client.query(`
            SELECT id, day_number, scheduled_date, meeting_start_time, meeting_end_time, title
            FROM course_schedule
            WHERE course_id = $1
            ORDER BY day_number
        `, [courseId]);

        const scheduleMap = {};
        scheduleResult.rows.forEach(schedule => {
            scheduleMap[schedule.day_number] = schedule;
        });

        // Generate tasks for each enrolled user based on their level
        for (const enrollment of enrollments) {
            const userTasks = await generateTasksForUserEnhanced(
                client, 
                courseId, 
                enrollment, 
                scheduleMap, 
                courseData,
                taskConfig
            );
            tasksGenerated += userTasks;
        }

        // Create enhanced task templates for future reference
        await createEnhancedTaskTemplates(client, courseId, courseData.participant_config, taskConfig);

        if (shouldManageTransaction) {
            await client.query('COMMIT');
        }
        return tasksGenerated;

    } catch (error) {
        if (shouldManageTransaction) {
            await client.query('ROLLBACK');
        }
        throw error;
    } finally {
        if (shouldManageTransaction) {
            client.release();
        }
    }
}

async function generateTasksForUserEnhanced(client, courseId, enrollment, scheduleMap, courseData, taskConfig) {
    let tasksCreated = 0;
    const userId = enrollment.user_id;
    const userRole = enrollment.role;
    const levelNumber = enrollment.level_number;

    // Get task templates for this user's level and role
    const taskTemplates = getEnhancedTaskTemplatesForRole(userRole, levelNumber, taskConfig);

    for (const [dayNumber, schedule] of Object.entries(scheduleMap)) {
        const dayNum = parseInt(dayNumber);
        const scheduleDate = new Date(schedule.scheduled_date);

        // Generate daily tasks (expire after 24 hours)
        for (const template of taskTemplates.daily) {
            const dueDate = new Date(scheduleDate.getTime() + 24 * 60 * 60 * 1000); // 24 hours from schedule date
            
            await client.query(`
                INSERT INTO tasks (
                    course_id, schedule_id, task_type, title, description, 
                    due_date, assigned_to, level_number, is_active, 
                    max_score, instructions, created_by, status, task_category,
                    expires_in_hours, auto_grade_reduction
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, $9, $10, $11, 'scheduled', $12, $13, $14)`,
                [
                    courseId,
                    schedule.id,
                    template.type,
                    template.title.replace('{day}', dayNum).replace('{meeting_title}', schedule.title || `اليوم ${dayNum}`),
                    template.description.replace('{day}', dayNum).replace('{meeting_title}', schedule.title || `اليوم ${dayNum}`),
                    dueDate,
                    userId,
                    levelNumber,
                    template.maxScore,
                    template.instructions,
                    1, // System generated
                    'daily', // task_category
                    24, // expires_in_hours
                    template.gradeReduction || 10 // auto_grade_reduction percentage
                ]
            );
            tasksCreated++;

            // Create notification for scheduled daily task
            await client.query(`
                INSERT INTO notifications (user_id, type, message, related_id, created_at)
                VALUES ($1, 'daily_task_scheduled', $2, $3, CURRENT_TIMESTAMP)
            `, [
                userId,
                `مهمة يومية مجدولة: ${template.title.replace('{day}', dayNum)} - تنتهي خلال 24 ساعة`,
                courseId
            ]);
        }

        // Generate fixed tasks with custom deadlines
        for (const template of taskTemplates.fixed) {
            let dueDate;
            
            // Calculate due date based on template configuration
            if (template.dueAfterDays) {
                dueDate = new Date(scheduleDate.getTime() + template.dueAfterDays * 24 * 60 * 60 * 1000);
            } else if (template.dueBeforeNextMeeting && scheduleMap[dayNum + 1]) {
                dueDate = new Date(scheduleMap[dayNum + 1].scheduled_date);
            } else {
                // Default: due in 3 days
                dueDate = new Date(scheduleDate.getTime() + 3 * 24 * 60 * 60 * 1000);
            }
            
            await client.query(`
                INSERT INTO tasks (
                    course_id, schedule_id, task_type, title, description, 
                    due_date, assigned_to, level_number, is_active, 
                    max_score, instructions, created_by, status, task_category,
                    custom_deadline, priority_level
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, $9, $10, $11, 'scheduled', $12, $13, $14)`,
                [
                    courseId,
                    schedule.id,
                    template.type,
                    template.title.replace('{day}', dayNum).replace('{meeting_title}', schedule.title || `اليوم ${dayNum}`),
                    template.description.replace('{day}', dayNum).replace('{meeting_title}', schedule.title || `اليوم ${dayNum}`),
                    dueDate,
                    userId,
                    levelNumber,
                    template.maxScore,
                    template.instructions,
                    1, // System generated
                    'fixed', // task_category
                    dueDate, // custom_deadline
                    template.priority || 'medium' // priority_level
                ]
            );
            tasksCreated++;

            // Create notification for scheduled fixed task
            await client.query(`
                INSERT INTO notifications (user_id, type, message, related_id, created_at)
                VALUES ($1, 'fixed_task_scheduled', $2, $3, CURRENT_TIMESTAMP)
            `, [
                userId,
                `مهمة مجدولة: ${template.title.replace('{day}', dayNum)} - موعد التسليم: ${dueDate.toLocaleDateString('ar-EG')}`,
                courseId
            ]);
        }
    }

    return tasksCreated;
}

export function getEnhancedTaskTemplatesForRole(userRole, levelNumber, taskConfig = {}) {
    const templates = {
        daily: [],
        fixed: []
    };

    // Get custom templates from taskConfig if provided
    const levelKey = `level_${levelNumber}`;
    const customTemplates = taskConfig[levelKey] || [];

    // Add custom templates
    customTemplates.forEach(template => {
        if (template.category === 'daily') {
            templates.daily.push({
                type: template.type || 'custom_daily',
                title: template.title,
                description: template.description,
                maxScore: template.maxScore || 10,
                instructions: template.instructions,
                gradeReduction: template.gradeReduction || 10
            });
        } else if (template.category === 'fixed') {
            templates.fixed.push({
                type: template.type || 'custom_fixed',
                title: template.title,
                description: template.description,
                maxScore: template.maxScore || 50,
                instructions: template.instructions,
                dueAfterDays: template.dueAfterDays || 3,
                priority: template.priority || 'medium'
            });
        }
    });

    // Add default templates based on role
    switch (userRole) {
        case 'student':
            // Daily tasks for students
            templates.daily.push(
                {
                    type: 'reading',
                    title: 'قراءة مادة اليوم {day}',
                    description: 'قراءة المادة المطلوبة لـ {meeting_title}',
                    maxScore: 10,
                    instructions: 'يجب إكمال القراءة خلال 24 ساعة من بداية اليوم الدراسي. سيتم خصم 10% من الدرجة في حالة التأخير.',
                    gradeReduction: 10
                },
                {
                    type: 'exam',
                    title: 'اختبار يومي - اليوم {day}',
                    description: 'اختبار قصير على مادة {meeting_title}',
                    maxScore: 20,
                    instructions: 'يجب إكمال الاختبار خلال 24 ساعة من إتاحته. لا يمكن إعادة المحاولة.',
                    gradeReduction: 15
                }
            );

            // Fixed tasks for students
            templates.fixed.push(
                {
                    type: 'homework',
                    title: 'واجب منزلي - اليوم {day}',
                    description: 'واجب منزلي شامل لمادة {meeting_title}',
                    maxScore: 50,
                    instructions: 'يجب تسليم الواجب قبل الموعد المحدد. يمكن رفع ملفات أو كتابة النص مباشرة.',
                    dueAfterDays: 3,
                    priority: 'high'
                },
                {
                    type: 'homework',
                    title: 'مشروع تطبيقي - اليوم {day}',
                    description: 'مشروع تطبيقي لتطبيق ما تم تعلمه في {meeting_title}',
                    maxScore: 100,
                    instructions: 'مشروع فردي يجب تسليمه قبل نهاية الأسبوع.',
                    dueAfterDays: 7,
                    priority: 'high'
                }
            );
            break;

        case 'teacher':
            // Daily tasks for teachers
            templates.daily.push(
                {
                    type: 'daily_evaluation',
                    title: 'تقييم طلاب اليوم {day}',
                    description: 'تقييم أداء الطلاب في {meeting_title}',
                    maxScore: 0,
                    instructions: 'يجب إكمال تقييم جميع الطلاب خلال 24 ساعة من انتهاء الحصة.',
                    gradeReduction: 0
                },
                {
                    type: 'attendance_record',
                    title: 'تسجيل حضور اليوم {day}',
                    description: 'تسجيل حضور وغياب الطلاب في {meeting_title}',
                    maxScore: 0,
                    instructions: 'يجب تسجيل الحضور خلال 24 ساعة من بداية الحصة.',
                    gradeReduction: 0
                }
            );

            // Fixed tasks for teachers
            templates.fixed.push(
                {
                    type: 'lesson_preparation',
                    title: 'تحضير درس اليوم {day}',
                    description: 'تحضير وإعداد مادة {meeting_title}',
                    maxScore: 0,
                    instructions: 'يجب إكمال التحضير قبل بداية الحصة بيوم واحد على الأقل.',
                    dueBeforeNextMeeting: true,
                    priority: 'high'
                },
                {
                    type: 'grading',
                    title: 'تصحيح واجبات اليوم {day}',
                    description: 'تصحيح وتقييم واجبات الطلاب',
                    maxScore: 0,
                    instructions: 'يجب إكمال التصحيح خلال 3 أيام من تاريخ التسليم.',
                    dueAfterDays: 3,
                    priority: 'medium'
                }
            );
            break;

        case 'supervisor':
        case 'admin':
        case 'head':
            // Daily tasks for supervisors
            templates.daily.push(
                {
                    type: 'daily_monitoring',
                    title: 'مراقبة سير الدورة - اليوم {day}',
                    description: 'مراجعة ومراقبة سير الدورة في {meeting_title}',
                    maxScore: 0,
                    instructions: 'مراجعة يومية لضمان سير الدورة بشكل صحيح.',
                    gradeReduction: 0
                }
            );

            // Fixed tasks for supervisors
            templates.fixed.push(
                {
                    type: 'performance_review',
                    title: 'مراجعة الأداء - اليوم {day}',
                    description: 'مراجعة أداء المعلمين والطلاب في {meeting_title}',
                    maxScore: 0,
                    instructions: 'مراجعة شاملة يجب إكمالها خلال أسبوع.',
                    dueAfterDays: 7,
                    priority: 'medium'
                },
                {
                    type: 'communication_followup',
                    title: 'متابعة التواصل - اليوم {day}',
                    description: 'متابعة التواصل مع الغائبين والمتأخرين',
                    maxScore: 0,
                    instructions: 'يجب التواصل مع الطلاب الغائبين خلال 24 ساعة.',
                    dueAfterDays: 1,
                    priority: 'high'
                }
            );
            break;
    }

    return templates;
}

async function createEnhancedTaskTemplates(client, courseId, participantConfig, taskConfig) {
    // Create enhanced task templates for future reference
    for (const [levelKey, config] of Object.entries(participantConfig)) {
        const levelNumber = parseInt(levelKey.split('_')[1]);
        
        for (const role of config.roles) {
            const templates = getEnhancedTaskTemplatesForRole(role, levelNumber, taskConfig);
            
            // Create daily task templates
            for (const template of templates.daily) {
                await client.query(`
                    INSERT INTO course_task_templates (
                        course_id, level_number, task_type, title, description,
                        duration_hours, max_score, instructions, target_role, is_daily,
                        task_category, expires_in_hours, auto_grade_reduction
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                    ON CONFLICT (course_id, level_number, title) DO UPDATE SET
                        task_type = EXCLUDED.task_type,
                        description = EXCLUDED.description,
                        duration_hours = EXCLUDED.duration_hours,
                        max_score = EXCLUDED.max_score,
                        instructions = EXCLUDED.instructions,
                        target_role = EXCLUDED.target_role,
                        task_category = EXCLUDED.task_category,
                        expires_in_hours = EXCLUDED.expires_in_hours,
                        auto_grade_reduction = EXCLUDED.auto_grade_reduction`,
                    [
                        courseId, levelNumber, template.type, template.title,
                        template.description, 24, template.maxScore,
                        template.instructions, role, true, 'daily', 24, template.gradeReduction || 10
                    ]
                );
            }
            
            // Create fixed task templates
            for (const template of templates.fixed) {
                await client.query(`
                    INSERT INTO course_task_templates (
                        course_id, level_number, task_type, title, description,
                        duration_hours, max_score, instructions, target_role, is_daily,
                        task_category, custom_deadline_days, priority_level
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                    ON CONFLICT (course_id, level_number, title) DO UPDATE SET
                        task_type = EXCLUDED.task_type,
                        description = EXCLUDED.description,
                        duration_hours = EXCLUDED.duration_hours,
                        max_score = EXCLUDED.max_score,
                        instructions = EXCLUDED.instructions,
                        target_role = EXCLUDED.target_role,
                        task_category = EXCLUDED.task_category,
                        custom_deadline_days = EXCLUDED.custom_deadline_days,
                        priority_level = EXCLUDED.priority_level`,
                    [
                        courseId, levelNumber, template.type, template.title,
                        template.description, (template.dueAfterDays || 3) * 24, template.maxScore,
                        template.instructions, role, false, 'fixed', template.dueAfterDays || 3, template.priority || 'medium'
                    ]
                );
            }
        }
    }
}

// Function to activate daily tasks when a course day starts
export async function activateDailyTasks(courseId, scheduleId) {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        // Activate daily tasks for the current schedule
        const result = await client.query(`
            UPDATE tasks 
            SET is_active = true, status = 'active', activated_at = CURRENT_TIMESTAMP
            WHERE course_id = $1 AND schedule_id = $2 AND task_category = 'daily' AND status = 'scheduled'
            RETURNING id, assigned_to, title
        `, [courseId, scheduleId]);

        // Send notifications for activated tasks
        for (const task of result.rows) {
            await client.query(`
                INSERT INTO notifications (user_id, type, message, related_id, created_at)
                VALUES ($1, 'daily_task_activated', $2, $3, CURRENT_TIMESTAMP)
            `, [
                task.assigned_to,
                `مهمة يومية متاحة الآن: ${task.title} - تنتهي خلال 24 ساعة`,
                task.id
            ]);
        }

        await client.query('COMMIT');
        return result.rows.length;

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

// Function to check and expire daily tasks
export async function expireDailyTasks() {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        // Find and expire daily tasks that are past their 24-hour limit
        const expiredTasks = await client.query(`
            UPDATE tasks 
            SET status = 'expired', expired_at = CURRENT_TIMESTAMP,
                score = CASE 
                    WHEN score IS NULL THEN 0 
                    ELSE GREATEST(0, score - (score * auto_grade_reduction / 100))
                END
            WHERE task_category = 'daily' 
            AND status = 'active' 
            AND activated_at + INTERVAL '24 hours' < CURRENT_TIMESTAMP
            RETURNING id, assigned_to, title, auto_grade_reduction
        `);

        // Send notifications for expired tasks
        for (const task of expiredTasks.rows) {
            await client.query(`
                INSERT INTO notifications (user_id, type, message, related_id, created_at)
                VALUES ($1, 'daily_task_expired', $2, $3, CURRENT_TIMESTAMP)
            `, [
                task.assigned_to,
                `انتهت صلاحية المهمة: ${task.title} - تم خصم ${task.auto_grade_reduction}% من الدرجة`,
                task.id
            ]);
        }

        await client.query('COMMIT');
        return expiredTasks.rows.length;

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}