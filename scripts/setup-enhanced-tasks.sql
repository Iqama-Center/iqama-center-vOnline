-- Enhanced Task Management System Database Setup
-- Run this script to add the new columns and features for the enhanced task system

-- Add new columns to tasks table for enhanced functionality
DO $$ 
BEGIN
    -- Add task_category column to distinguish between daily and fixed tasks
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'task_category') THEN
        ALTER TABLE tasks ADD COLUMN task_category VARCHAR(20) DEFAULT 'daily' CHECK (task_category IN ('daily', 'fixed'));
    END IF;
    
    -- Add expires_in_hours for daily tasks
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'expires_in_hours') THEN
        ALTER TABLE tasks ADD COLUMN expires_in_hours INTEGER DEFAULT 24;
    END IF;
    
    -- Add auto_grade_reduction for daily tasks
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'auto_grade_reduction') THEN
        ALTER TABLE tasks ADD COLUMN auto_grade_reduction INTEGER DEFAULT 10 CHECK (auto_grade_reduction >= 0 AND auto_grade_reduction <= 100);
    END IF;
    
    -- Add custom_deadline for fixed tasks
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'custom_deadline') THEN
        ALTER TABLE tasks ADD COLUMN custom_deadline TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add priority_level for tasks
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'priority_level') THEN
        ALTER TABLE tasks ADD COLUMN priority_level VARCHAR(10) DEFAULT 'medium' CHECK (priority_level IN ('low', 'medium', 'high'));
    END IF;
    
    -- Add activated_at timestamp for when daily tasks become active
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'activated_at') THEN
        ALTER TABLE tasks ADD COLUMN activated_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add expired_at timestamp for when daily tasks expire
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'expired_at') THEN
        ALTER TABLE tasks ADD COLUMN expired_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add score column for task grading
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'score') THEN
        ALTER TABLE tasks ADD COLUMN score NUMERIC(5,2);
    END IF;
END $$;

-- Add new columns to course_task_templates table for enhanced functionality
DO $$ 
BEGIN
    -- Add task_category column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'course_task_templates' AND column_name = 'task_category') THEN
        ALTER TABLE course_task_templates ADD COLUMN task_category VARCHAR(20) DEFAULT 'daily' CHECK (task_category IN ('daily', 'fixed'));
    END IF;
    
    -- Add expires_in_hours for daily task templates
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'course_task_templates' AND column_name = 'expires_in_hours') THEN
        ALTER TABLE course_task_templates ADD COLUMN expires_in_hours INTEGER DEFAULT 24;
    END IF;
    
    -- Add auto_grade_reduction for daily task templates
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'course_task_templates' AND column_name = 'auto_grade_reduction') THEN
        ALTER TABLE course_task_templates ADD COLUMN auto_grade_reduction INTEGER DEFAULT 10 CHECK (auto_grade_reduction >= 0 AND auto_grade_reduction <= 100);
    END IF;
    
    -- Add custom_deadline_days for fixed task templates
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'course_task_templates' AND column_name = 'custom_deadline_days') THEN
        ALTER TABLE course_task_templates ADD COLUMN custom_deadline_days INTEGER DEFAULT 3;
    END IF;
    
    -- Add priority_level for task templates
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'course_task_templates' AND column_name = 'priority_level') THEN
        ALTER TABLE course_task_templates ADD COLUMN priority_level VARCHAR(10) DEFAULT 'medium' CHECK (priority_level IN ('low', 'medium', 'high'));
    END IF;
END $$;

-- Update task_type enum to include new task types
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_type') THEN
        -- Drop the existing enum and recreate with new values
        ALTER TYPE task_type RENAME TO task_type_old;
        
        CREATE TYPE task_type AS ENUM (
            'daily_reading', 'daily_quiz', 'daily_evaluation', 'daily_monitoring', 'attendance_record', 'daily_wird',
            'homework', 'exam', 'preparation', 'weekly_report', 'weekly_evaluation', 'lesson_preparation', 
            'grading', 'performance_review', 'communication_followup', 'project', 'custom_daily', 'custom_fixed'
        );
        
        -- Update the column to use the new enum
        ALTER TABLE tasks ALTER COLUMN task_type TYPE task_type USING task_type::text::task_type;
        ALTER TABLE course_task_templates ALTER COLUMN template_type TYPE task_type USING template_type::text::task_type;
        
        -- Drop the old enum
        DROP TYPE task_type_old;
    ELSE
        -- Create the enum if it doesn't exist
        CREATE TYPE task_type AS ENUM (
            'daily_reading', 'daily_quiz', 'daily_evaluation', 'daily_monitoring', 'attendance_record', 'daily_wird',
            'homework', 'exam', 'preparation', 'weekly_report', 'weekly_evaluation', 'lesson_preparation', 
            'grading', 'performance_review', 'communication_followup', 'project', 'custom_daily', 'custom_fixed'
        );
    END IF;
END $$;

-- Create indexes for better performance on new columns
CREATE INDEX IF NOT EXISTS idx_tasks_task_category ON tasks(task_category);
CREATE INDEX IF NOT EXISTS idx_tasks_priority_level ON tasks(priority_level);
CREATE INDEX IF NOT EXISTS idx_tasks_activated_at ON tasks(activated_at);
CREATE INDEX IF NOT EXISTS idx_tasks_expired_at ON tasks(expired_at);
CREATE INDEX IF NOT EXISTS idx_tasks_custom_deadline ON tasks(custom_deadline);

-- Create a function to automatically activate daily tasks when a course day starts
CREATE OR REPLACE FUNCTION auto_activate_daily_tasks()
RETURNS TRIGGER AS $$
BEGIN
    -- When a course_schedule entry is updated to mark tasks as released
    IF NEW.tasks_released = true AND OLD.tasks_released = false THEN
        -- Activate all daily tasks for this schedule
        UPDATE tasks 
        SET is_active = true, status = 'active', activated_at = CURRENT_TIMESTAMP
        WHERE schedule_id = NEW.id 
        AND task_category = 'daily' 
        AND status = 'scheduled';
        
        -- Create notifications for activated tasks
        INSERT INTO notifications (user_id, type, message, related_id, created_at)
        SELECT 
            t.assigned_to,
            'daily_task_activated',
            'مهمة يومية متاحة الآن: ' || t.title || ' - تنتهي خلال ' || t.expires_in_hours || ' ساعة',
            t.id,
            CURRENT_TIMESTAMP
        FROM tasks t
        WHERE t.schedule_id = NEW.id 
        AND t.task_category = 'daily' 
        AND t.status = 'active'
        AND t.activated_at = CURRENT_TIMESTAMP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-activation of daily tasks
DROP TRIGGER IF EXISTS trigger_auto_activate_daily_tasks ON course_schedule;
CREATE TRIGGER trigger_auto_activate_daily_tasks
    AFTER UPDATE ON course_schedule
    FOR EACH ROW
    EXECUTE FUNCTION auto_activate_daily_tasks();

-- Create a function to check and expire daily tasks
CREATE OR REPLACE FUNCTION expire_overdue_daily_tasks()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER := 0;
BEGIN
    -- Update expired daily tasks and apply grade reduction
    WITH expired_tasks AS (
        UPDATE tasks 
        SET 
            status = 'expired', 
            expired_at = CURRENT_TIMESTAMP,
            score = CASE 
                WHEN score IS NULL THEN 0 
                ELSE GREATEST(0, score - (score * auto_grade_reduction / 100))
            END
        WHERE task_category = 'daily' 
        AND status = 'active' 
        AND activated_at + INTERVAL '1 hour' * expires_in_hours < CURRENT_TIMESTAMP
        RETURNING id, assigned_to, title, auto_grade_reduction
    )
    SELECT COUNT(*) INTO expired_count FROM expired_tasks;
    
    -- Create notifications for expired tasks
    INSERT INTO notifications (user_id, type, message, related_id, created_at)
    SELECT 
        t.assigned_to,
        'daily_task_expired',
        'انتهت صلاحية المهمة: ' || t.title || ' - تم خصم ' || t.auto_grade_reduction || '% من الدرجة',
        t.id,
        CURRENT_TIMESTAMP
    FROM tasks t
    WHERE t.status = 'expired' 
    AND t.expired_at = CURRENT_TIMESTAMP;
    
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- Create a view for task dashboard
CREATE OR REPLACE VIEW task_dashboard AS
SELECT 
    t.id,
    t.title,
    t.description,
    t.task_type,
    t.task_category,
    t.status,
    t.priority_level,
    t.max_score,
    t.score,
    t.due_date,
    t.custom_deadline,
    t.activated_at,
    t.expired_at,
    t.expires_in_hours,
    t.auto_grade_reduction,
    t.assigned_to,
    u.full_name as assigned_to_name,
    u.role as assigned_to_role,
    c.name as course_name,
    cs.title as schedule_title,
    cs.scheduled_date,
    CASE 
        WHEN t.task_category = 'daily' AND t.status = 'active' THEN
            EXTRACT(EPOCH FROM (t.activated_at + INTERVAL '1 hour' * t.expires_in_hours - CURRENT_TIMESTAMP)) / 3600
        WHEN t.task_category = 'fixed' THEN
            EXTRACT(EPOCH FROM (COALESCE(t.custom_deadline, t.due_date) - CURRENT_TIMESTAMP)) / 3600
        ELSE NULL
    END as hours_remaining
FROM tasks t
JOIN users u ON t.assigned_to = u.id
JOIN courses c ON t.course_id = c.id
LEFT JOIN course_schedule cs ON t.schedule_id = cs.id
ORDER BY 
    CASE t.priority_level 
        WHEN 'high' THEN 1 
        WHEN 'medium' THEN 2 
        WHEN 'low' THEN 3 
    END,
    t.due_date ASC;

COMMENT ON VIEW task_dashboard IS 'Comprehensive view of all tasks with calculated time remaining and priority sorting';

-- Insert some sample task templates for testing
INSERT INTO course_task_templates (
    course_id, level_number, template_type, title, description,
    duration_hours, max_score, instructions, target_role, is_daily,
    task_category, expires_in_hours, auto_grade_reduction
) VALUES 
(1, 3, 'daily_reading', 'قراءة مادة اليوم {day}', 'قراءة المادة المطلوبة لـ {meeting_title}', 24, 10, 'يجب إكمال القراءة خلال 24 ساعة من بداية اليوم الدراسي', 'student', true, 'daily', 24, 10),
(1, 3, 'homework', 'واجب منزلي - اليوم {day}', 'واجب منزلي شامل لمادة {meeting_title}', 72, 50, 'يجب تسليم الواجب قبل الموعد المحدد', 'student', false, 'fixed', NULL, NULL),
(1, 2, 'daily_evaluation', 'تقييم طلاب اليوم {day}', 'تقييم أداء الطلاب في {meeting_title}', 24, 0, 'يجب إكمال تقييم جميع الطلاب خلال 24 ساعة من انتهاء الحصة', 'teacher', true, 'daily', 24, 0)
ON CONFLICT (course_id, level_number, template_type, target_role) DO NOTHING;

PRINT 'Enhanced task management system setup completed successfully!';
PRINT 'New features added:';
PRINT '- Daily tasks with 24-hour expiry and automatic grade reduction';
PRINT '- Fixed tasks with custom deadlines and priority levels';
PRINT '- Automatic task activation when course days start';
PRINT '- Task dashboard view for comprehensive monitoring';
PRINT '- Enhanced notification system for task lifecycle events';