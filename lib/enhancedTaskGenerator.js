import NotificationService from '../services/notificationService.js';

// Note: All functions now require an active 'client' to be passed for transactional integrity.

export async function generateEnhancedTasksForCourse(client, courseId, courseData, enrollments, taskConfig = {}) {
    const scheduleResult = await client.query(
        'SELECT id, day_number, scheduled_date, title FROM course_schedule WHERE course_id = $1 ORDER BY day_number',
        [courseId]
    );
    if (scheduleResult.rows.length === 0) return 0; // No schedule, no tasks.

    const scheduleMap = new Map(scheduleResult.rows.map(s => [s.day_number, s]));

    // 1. Generate all task data in memory
    let allTasks = [];
    for (const enrollment of enrollments) {
        const userTasks = getTasksForUser(enrollment, scheduleMap, courseId, courseData, taskConfig);
        allTasks.push(...userTasks);
    }

    if (allTasks.length === 0) return 0;

    // 2. Bulk insert all tasks in a single query
    const taskValues = allTasks.map(t => [ 
        t.course_id, t.schedule_id, t.task_type, t.title, t.description, t.due_date, 
        t.assigned_to, t.level_number, t.max_score, t.instructions, t.created_by, 
        t.task_category, t.expires_in_hours, t.auto_grade_reduction, t.custom_deadline, t.priority_level
    ]);

    const taskResult = await client.query(`
        INSERT INTO tasks (course_id, schedule_id, task_type, title, description, due_date, assigned_to, level_number, max_score, instructions, created_by, task_category, expires_in_hours, auto_grade_reduction, custom_deadline, priority_level, status, is_active)
        SELECT v.*, 'scheduled', false FROM unnest(
            $1::integer[], $2::integer[], $3::task_type[], $4::varchar[], $5::text[], $6::timestamptz[], 
            $7::integer[], $8::integer[], $9::numeric[], $10::text[], $11::integer[], $12::varchar[], 
            $13::integer[], $14::integer[], $15::timestamptz[], $16::varchar[]
        ) AS v(course_id, schedule_id, task_type, title, description, due_date, assigned_to, level_number, max_score, instructions, created_by, task_category, expires_in_hours, auto_grade_reduction, custom_deadline, priority_level)
        RETURNING id, assigned_to, title, task_category, due_date, custom_deadline
    `, [
        taskValues.map(t => t[0]), taskValues.map(t => t[1]), taskValues.map(t => t[2]), taskValues.map(t => t[3]), 
        taskValues.map(t => t[4]), taskValues.map(t => t[5]), taskValues.map(t => t[6]), taskValues.map(t => t[7]), 
        taskValues.map(t => t[8]), taskValues.map(t => t[9]), taskValues.map(t => t[10]), taskValues.map(t => t[11]), 
        taskValues.map(t => t[12]), taskValues.map(t => t[13]), taskValues.map(t => t[14]), taskValues.map(t => t[15])
    ]);

    // 3. Bulk create notifications
    const dailyNotifications = taskResult.rows.filter(t => t.task_category === 'daily').map(t => ({ userId: t.assigned_to, message: `مهمة يومية مجدولة: ${t.title}` }));
    const fixedNotifications = taskResult.rows.filter(t => t.task_category === 'fixed').map(t => ({ userId: t.assigned_to, message: `مهمة مجدولة: ${t.title} - موعد التسليم: ${new Date(t.custom_deadline).toLocaleDateString('ar-EG')}` }));

    if (dailyNotifications.length > 0) {
        await NotificationService.createNotification({ userIds: dailyNotifications.map(n => n.userId), type: 'daily_task_scheduled', title: 'مهمة يومية مجدولة', message: 'لديك مهام يومية جديدة في إحدى دوراتك', client });
    }
    if (fixedNotifications.length > 0) {
        await NotificationService.createNotification({ userIds: fixedNotifications.map(n => n.userId), type: 'fixed_task_scheduled', title: 'مهمة جديدة مجدولة', message: 'لديك مهام جديدة ذات موعد تسليم محدد', client });
    }

    // 4. Create task templates for future use
    await createEnhancedTaskTemplates(client, courseId, courseData.participant_config, taskConfig);

    return allTasks.length;
}

function getTasksForUser(enrollment, scheduleMap, courseId, courseData, taskConfig) {
    const userTasks = [];
    const taskTemplates = getEnhancedTaskTemplatesForRole(enrollment.role, enrollment.level_number, taskConfig);

    for (const [dayNumber, schedule] of scheduleMap.entries()) {
        const scheduleDate = new Date(schedule.scheduled_date);

        taskTemplates.daily.forEach(template => {
            userTasks.push({
                course_id: courseId, schedule_id: schedule.id, task_type: template.type, 
                title: template.title.replace('{day}', dayNumber).replace('{meeting_title}', schedule.title), 
                description: template.description.replace('{day}', dayNumber).replace('{meeting_title}', schedule.title),
                due_date: new Date(scheduleDate.getTime() + 24 * 60 * 60 * 1000), 
                assigned_to: enrollment.user_id, level_number: enrollment.level_number, max_score: template.max_score, 
                instructions: template.instructions, created_by: 1, task_category: 'daily', 
                expires_in_hours: 24, auto_grade_reduction: template.auto_grade_reduction || 10, 
                custom_deadline: null, priority_level: 'medium'
            });
        });

        taskTemplates.fixed.forEach(template => {
            let dueDate;
            if (template.custom_deadline_days) dueDate = new Date(scheduleDate.getTime() + template.custom_deadline_days * 24 * 60 * 60 * 1000);
            else if (template.dueBeforeNextMeeting && scheduleMap.has(dayNumber + 1)) dueDate = new Date(scheduleMap.get(dayNumber + 1).scheduled_date);
            else dueDate = new Date(scheduleDate.getTime() + 3 * 24 * 60 * 60 * 1000); // Default

            userTasks.push({
                course_id: courseId, schedule_id: schedule.id, task_type: template.type, 
                title: template.title.replace('{day}', dayNumber).replace('{meeting_title}', schedule.title), 
                description: template.description.replace('{day}', dayNumber).replace('{meeting_title}', schedule.title),
                due_date: dueDate, assigned_to: enrollment.user_id, level_number: enrollment.level_number, 
                max_score: template.max_score, instructions: template.instructions, created_by: 1, 
                task_category: 'fixed', expires_in_hours: null, auto_grade_reduction: null, 
                custom_deadline: dueDate, priority_level: template.priority_level || 'medium'
            });
        });
    }
    return userTasks;
}

async function createEnhancedTaskTemplates(client, courseId, participantConfig, taskConfig) {
    // This function can also be optimized with bulk inserts if it becomes a bottleneck.
    for (const [levelKey, config] of Object.entries(participantConfig || {})) {
        const levelNumber = parseInt(levelKey.split('_')[1]);
        for (const role of config.roles || []) {
            const templates = getEnhancedTaskTemplatesForRole(role, levelNumber, taskConfig);
            for (const template of templates.daily.concat(templates.fixed)) {
                await client.query(`
                    INSERT INTO course_task_templates (course_id, level_number, task_type, title, description, max_score, instructions, target_role, is_daily, task_category, expires_in_hours, auto_grade_reduction, custom_deadline_days, priority_level)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                    ON CONFLICT (course_id, level_number, title) DO NOTHING`, [
                        courseId, levelNumber, template.type, template.title, template.description, template.maxScore, 
                        template.instructions, role, template.category === 'daily', template.category, 
                        template.category === 'daily' ? 24 : null, template.gradeReduction, 
                        template.category === 'fixed' ? template.dueAfterDays : null, template.priority
                    ]
                );
            }
        }
    }
}

function getEnhancedTaskTemplatesForRole(userRole, levelNumber, taskConfig = {}) {
    // Logic for getting templates remains the same, but could be enhanced in the future.
    const templates = { daily: [], fixed: [] };
    const levelKey = `level_${levelNumber}`;
    const customTemplates = taskConfig[levelKey] || [];

    customTemplates.forEach(t => {
        if (t.task_category === 'daily') templates.daily.push({ ...t, type: t.type || 'custom_daily' });
        else if (t.task_category === 'fixed') templates.fixed.push({ ...t, type: t.type || 'custom_fixed' });
    });

    // Default templates can be added here based on userRole

    return templates;
}

// Other utility functions like activateDailyTasks and expireDailyTasks should also be refactored
// to accept a client and not manage their own transactions if they are to be used within a larger workflow.
