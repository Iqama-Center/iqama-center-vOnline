// Task generation utilities for course creation
import pool from './db';

export async function generateTasksForCourse(courseId, courseData, enrollments) {
    const client = await pool.connect();
    let tasksGenerated = 0;

    try {
        await client.query('BEGIN');

        // Get course schedule
        const scheduleResult = await client.query(`
            SELECT id, day_number, scheduled_date, meeting_start_time, meeting_end_time
            FROM course_schedule
            WHERE course_id = $1
            ORDER BY day_number
        `, [courseId]);

        const scheduleMap = {};
        scheduleResult.rows.forEach(schedule => {
            scheduleMap[schedule.day_number] = schedule;
        });

        // Generate tasks for each enrolled user
        for (const enrollment of enrollments) {
            const userTasks = await generateTasksForUser(
                client, 
                courseId, 
                enrollment, 
                scheduleMap, 
                courseData
            );
            tasksGenerated += userTasks;
        }

        // Create task templates for future reference
        await createTaskTemplates(client, courseId, courseData.participant_config);

        await client.query('COMMIT');
        return tasksGenerated;

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

async function generateTasksForUser(client, courseId, enrollment, scheduleMap, courseData) {
    let tasksCreated = 0;
    const userId = enrollment.user_id;
    const userRole = enrollment.role;

    // Define task templates based on user role
    const taskTemplates = getTaskTemplatesForRole(userRole);

    for (const [dayNumber, schedule] of Object.entries(scheduleMap)) {
        const dayNum = parseInt(dayNumber);
        const weekNumber = Math.ceil(dayNum / 7);

        // Generate daily tasks for each day
        for (const template of taskTemplates.daily) {
            const dueDate = calculateDueDate(schedule.scheduled_date, template.duration);
            
            await client.query(`
                INSERT INTO tasks (
                    course_id, schedule_id, task_type, title, description, 
                    due_date, assigned_to, level_number, is_active, 
                    max_score, instructions, created_by, status
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, $9, $10, $11, 'scheduled')`,
                [
                    courseId,
                    schedule.id,
                    template.type,
                    template.title.replace('{day}', dayNum),
                    template.description.replace('{day}', dayNum),
                    dueDate,
                    userId,
                    enrollment.level_number,
                    template.maxScore,
                    template.instructions,
                    1 // System generated
                ]
            );
            tasksCreated++;

            // Create notification for scheduled task
            await client.query(`
                INSERT INTO notifications (user_id, type, message, related_id, created_at)
                VALUES ($1, 'task_scheduled', $2, $3, CURRENT_TIMESTAMP)
            `, [
                userId,
                `مهمة مجدولة: ${template.title.replace('{day}', dayNum)} - اليوم ${dayNum}`,
                courseId
            ]);
        }

        // Generate weekly tasks (only on specific days)
        if (dayNum % 7 === 0 || dayNum === 1) { // End of week or start
            for (const template of taskTemplates.weekly) {
                const dueDate = calculateDueDate(schedule.scheduled_date, template.duration);
                
                await client.query(`
                    INSERT INTO tasks (
                        course_id, schedule_id, task_type, title, description, 
                        due_date, assigned_to, level_number, is_active, 
                        max_score, instructions, created_by, status
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, $9, $10, $11, 'scheduled')`,
                    [
                        courseId,
                        schedule.id,
                        template.type,
                        template.title.replace('{week}', weekNumber).replace('{day}', dayNum),
                        template.description.replace('{week}', weekNumber).replace('{day}', dayNum),
                        dueDate,
                        userId,
                        enrollment.level_number,
                        template.maxScore,
                        template.instructions,
                        1 // System generated
                    ]
                );
                tasksCreated++;

                // Create notification for scheduled task
                await client.query(`
                    INSERT INTO notifications (user_id, type, message, related_id, created_at)
                    VALUES ($1, 'task_scheduled', $2, $3, CURRENT_TIMESTAMP)
                `, [
                    userId,
                    `مهمة مجدولة: ${template.title.replace('{week}', weekNumber)} - الأسبوع ${weekNumber}`,
                    courseId
                ]);
            }
        }
    }

    return tasksCreated;
}

export function getTaskTemplatesForRole(userRole) {
    const templates = {
        daily: [],
        weekly: []
    };

    switch (userRole) {
        case 'student':
            templates.daily = [
                {
                    type: 'daily_reading',
                    title: 'قراءة اليوم {day}',
                    description: 'قراءة المادة المطلوبة لليوم {day}',
                    duration: 24, // hours
                    maxScore: 10,
                    instructions: 'يجب إكمال القراءة خلال 24 ساعة من بداية اليوم الدراسي'
                },
                {
                    type: 'daily_quiz',
                    title: 'اختبار اليوم {day}',
                    description: 'اختبار قصير على مادة اليوم {day}',
                    duration: 24,
                    maxScore: 20,
                    instructions: 'يجب إكمال الاختبار خلال 24 ساعة من إتاحته'
                }
            ];
            templates.weekly = [
                {
                    type: 'homework',
                    title: 'واجب الأسبوع {week}',
                    description: 'واجب منزلي شامل للأسبوع {week}',
                    duration: 72, // 3 days
                    maxScore: 50,
                    instructions: 'يجب تسليم الواجب خلال 3 أيام من تاريخ الإصدار'
                },
                {
                    type: 'exam',
                    title: 'امتحان الأسبوع {week}',
                    description: 'امتحان شامل للأسبوع {week}',
                    duration: 168, // 1 week
                    maxScore: 100,
                    instructions: 'يجب إكمال الامتحان خلال أسبوع من تاريخ الإصدار'
                }
            ];
            break;

        case 'teacher':
            templates.daily = [
                {
                    type: 'daily_evaluation',
                    title: 'تقييم طلاب اليوم {day}',
                    description: 'تقييم أداء الطلاب في اليوم {day}',
                    duration: 24,
                    maxScore: 0,
                    instructions: 'يجب إكمال تقييم جميع الطلاب خلال 24 ساعة من انتهاء الحصة'
                },
                {
                    type: 'preparation',
                    title: 'تحضير مادة اليوم {day}',
                    description: 'تحضير وإعداد مادة اليوم التالي',
                    duration: 24,
                    maxScore: 0,
                    instructions: 'يجب إكمال التحضير قبل بداية اليوم التالي'
                }
            ];
            templates.weekly = [
                {
                    type: 'weekly_report',
                    title: 'تقرير الأسبوع {week}',
                    description: 'تقرير شامل عن أداء الطلاب والتقدم الأسبوعي',
                    duration: 72,
                    maxScore: 0,
                    instructions: 'يجب تسليم التقرير خلال 3 أيام من نهاية الأسبوع'
                }
            ];
            break;

        case 'supervisor':
        case 'admin':
        case 'head':
            templates.daily = [
                {
                    type: 'daily_monitoring',
                    title: 'مراقبة سير الدورة - اليوم {day}',
                    description: 'مراجعة ومراقبة سير الدورة في اليوم {day}',
                    duration: 24,
                    maxScore: 0,
                    instructions: 'مراجعة يومية لضمان سير الدورة بشكل صحيح'
                }
            ];
            templates.weekly = [
                {
                    type: 'weekly_evaluation',
                    title: 'تقييم أسبوعي - الأسبوع {week}',
                    description: 'تقييم شامل لأداء المعلمين والطلاب',
                    duration: 168,
                    maxScore: 0,
                    instructions: 'تقييم شامل يجب إكماله خلال أسبوع'
                }
            ];
            break;
    }

    return templates;
}

export function calculateDueDate(scheduledDate, durationHours) {
    const baseDate = new Date(scheduledDate);
    const dueDate = new Date(baseDate.getTime() + durationHours * 60 * 60 * 1000);
    return dueDate;
}

async function createTaskTemplates(client, courseId, participantConfig) {
    // Create task templates for future task generation
    for (const [levelKey, config] of Object.entries(participantConfig)) {
        const levelNumber = parseInt(levelKey.split('_')[1]);
        
        for (const role of config.roles) {
            const templates = getTaskTemplatesForRole(role);
            
            // Create daily task templates
            for (const template of templates.daily) {
                await client.query(`
                    INSERT INTO course_task_templates (
                        course_id, level_number, template_type, task_type, title, description,
                        duration_hours, max_score, instructions, target_role, is_daily
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
                    ON CONFLICT (course_id, level_number, title) DO UPDATE SET
                        template_type = EXCLUDED.template_type,
                        task_type = EXCLUDED.task_type,
                        description = EXCLUDED.description,
                        duration_hours = EXCLUDED.duration_hours,
                        max_score = EXCLUDED.max_score,
                        instructions = EXCLUDED.instructions,
                        target_role = EXCLUDED.target_role,
                        is_daily = EXCLUDED.is_daily`,
                    [
                        courseId, levelNumber, template.type, template.task_type || 'reading', template.title,
                        template.description, template.duration, template.maxScore,
                        template.instructions, role
                    ]
                );
            }
            
            // Create weekly task templates
            for (const template of templates.weekly) {
                await client.query(`
                    INSERT INTO course_task_templates (
                        course_id, level_number, template_type, task_type, title, description,
                        duration_hours, max_score, instructions, target_role, is_daily
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false)
                    ON CONFLICT (course_id, level_number, title) DO UPDATE SET
                        template_type = EXCLUDED.template_type,
                        task_type = EXCLUDED.task_type,
                        description = EXCLUDED.description,
                        duration_hours = EXCLUDED.duration_hours,
                        max_score = EXCLUDED.max_score,
                        instructions = EXCLUDED.instructions,
                        target_role = EXCLUDED.target_role,
                        is_daily = EXCLUDED.is_daily`,
                    [
                        courseId, levelNumber, template.type, template.task_type || 'reading', template.title,
                        template.description, template.duration, template.maxScore,
                        template.instructions, role
                    ]
                );
            }
        }
    }
}