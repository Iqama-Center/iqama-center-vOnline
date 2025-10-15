-- Fix for course_task_templates table structure
-- This script will add the missing task_type column if it doesn't exist
-- and update the table structure to match the code expectations

-- First, let's check if the table exists and see its structure
-- Run this query first to see current columns:
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'course_task_templates' ORDER BY ordinal_position;

-- Option 1: Add task_type column if it doesn't exist
-- (Run this if you want to keep the code changes)
DO $$ 
BEGIN
    -- Check if task_type column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'course_task_templates' 
        AND column_name = 'task_type'
    ) THEN
        -- Add task_type column with the same enum type as tasks table
        ALTER TABLE course_task_templates 
        ADD COLUMN task_type task_type;
        
        -- Copy values from template_type to task_type if template_type exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'course_task_templates' 
            AND column_name = 'template_type'
        ) THEN
            -- Update task_type with values from template_type where possible
            UPDATE course_task_templates 
            SET task_type = CASE 
                WHEN template_type = 'reading' THEN 'reading'::task_type
                WHEN template_type = 'homework' THEN 'homework'::task_type
                WHEN template_type = 'exam' THEN 'exam'::task_type
                WHEN template_type = 'daily_wird' THEN 'daily_wird'::task_type
                WHEN template_type = 'review' THEN 'review'::task_type
                WHEN template_type = 'daily_monitoring' THEN 'daily_monitoring'::task_type
                WHEN template_type = 'performance_review' THEN 'performance_review'::task_type
                WHEN template_type = 'communication_followup' THEN 'communication_followup'::task_type
                WHEN template_type = 'daily_evaluation' THEN 'daily_evaluation'::task_type
                WHEN template_type = 'attendance_record' THEN 'attendance_record'::task_type
                WHEN template_type = 'lesson_preparation' THEN 'lesson_preparation'::task_type
                WHEN template_type = 'grading' THEN 'grading'::task_type
                WHEN template_type = 'custom_daily' THEN 'custom_daily'::task_type
                WHEN template_type = 'custom_fixed' THEN 'custom_fixed'::task_type
                WHEN template_type = 'submission' THEN 'submission'::task_type
                WHEN template_type = 'grade_item' THEN 'grade_item'::task_type
                WHEN template_type = 'evaluation' THEN 'evaluation'::task_type
                ELSE 'homework'::task_type -- default fallback
            END
            WHERE task_type IS NULL;
        END IF;
    END IF;
END $$;

-- Option 2: Alternative - Rename template_type to task_type
-- (Uncomment this section if you prefer to rename the column)
/*
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'course_task_templates' 
        AND column_name = 'template_type'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'course_task_templates' 
        AND column_name = 'task_type'
    ) THEN
        ALTER TABLE course_task_templates 
        RENAME COLUMN template_type TO task_type;
    END IF;
END $$;
*/

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'course_task_templates' 
ORDER BY ordinal_position;

-- Show current data to verify
SELECT id, course_id, level_number, task_type, template_type, title 
FROM course_task_templates 
LIMIT 5;