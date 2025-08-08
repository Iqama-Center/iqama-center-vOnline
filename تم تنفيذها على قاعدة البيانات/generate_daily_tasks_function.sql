-- This script creates a powerful database function to generate all necessary tasks for a course upon its launch.
-- This is the core of the new task generation logic.
-- Execute this script on your database ONCE.

CREATE OR REPLACE FUNCTION generate_daily_tasks_for_course(p_course_id INTEGER)
RETURNS void AS $$
DECLARE
    v_template RECORD;
    v_schedule_day RECORD;
    v_enrollment RECORD;
BEGIN
    -- Loop through each task template defined for this course
    FOR v_template IN
        SELECT id, level_number, template_type FROM course_task_templates WHERE course_id = p_course_id
    LOOP
        -- Loop through each day in the course schedule
        FOR v_schedule_day IN
            SELECT id FROM course_schedule WHERE course_id = p_course_id
        LOOP
            -- Find all users enrolled at the level matching the template
            FOR v_enrollment IN
                SELECT user_id FROM enrollments WHERE course_id = p_course_id AND level_number = v_template.level_number AND status = 'active'
            LOOP
                -- Create a specific task instance for this user, for this day, from this template
                INSERT INTO tasks (course_id, schedule_id, assigned_to_user_id, title, description, max_score, task_type, source_template_id, status, due_date)
                SELECT 
                    p_course_id,
                    v_schedule_day.id,
                    v_enrollment.user_id,
                    ctt.title,
                    ctt.description,
                    ctt.max_score,
                    ctt.template_type,
                    v_template.id,
                    'pending', -- Initial status
                    (SELECT cs.day_date FROM course_schedule cs WHERE cs.id = v_schedule_day.id) -- Set due_date based on schedule day
                FROM course_task_templates ctt
                WHERE ctt.id = v_template.id;
            END LOOP;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_daily_tasks_for_course(INTEGER) IS 'Generates all individual user tasks for a given course based on its templates, schedule, and enrollments. Intended to be called upon course launch.';

PRINT 'Function generate_daily_tasks_for_course created successfully. Please execute it on your database.';
