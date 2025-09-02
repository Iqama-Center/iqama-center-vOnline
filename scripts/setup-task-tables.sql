-- Setup script for task management tables
-- Run this script to ensure all required tables exist

-- Ensure course_task_templates table exists
CREATE TABLE IF NOT EXISTS course_task_templates (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    level_number INTEGER NOT NULL,
    template_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration_hours INTEGER NOT NULL DEFAULT 24,
    max_score NUMERIC(5,2) DEFAULT 0,
    instructions TEXT,
    target_role VARCHAR(50) NOT NULL,
    is_daily BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, level_number, template_type, target_role)
);

-- Ensure course_participant_levels table exists
CREATE TABLE IF NOT EXISTS course_participant_levels (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    level_number INTEGER NOT NULL,
    level_name VARCHAR(100) NOT NULL,
    target_roles TEXT[] NOT NULL,
    min_count INTEGER DEFAULT 1,
    max_count INTEGER DEFAULT 10,
    optimal_count INTEGER DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, level_number)
);

-- Add missing columns to tasks table if they don't exist
DO $$ 
BEGIN
    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'status') THEN
        ALTER TABLE tasks ADD COLUMN status VARCHAR(50) DEFAULT 'pending';
    END IF;
    
    -- Add level_number column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'level_number') THEN
        ALTER TABLE tasks ADD COLUMN level_number INTEGER;
    END IF;
    
    -- Add created_by column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'created_by') THEN
        ALTER TABLE tasks ADD COLUMN created_by INTEGER REFERENCES users(id);
    END IF;
    
    -- Add course_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'course_id') THEN
        ALTER TABLE tasks ADD COLUMN course_id INTEGER REFERENCES courses(id);
    END IF;
END $$;

-- Add missing columns to course_schedule table if they don't exist
DO $$ 
BEGIN
    -- Add tasks_released column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'course_schedule' AND column_name = 'tasks_released') THEN
        ALTER TABLE course_schedule ADD COLUMN tasks_released BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_course_id ON tasks(course_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_schedule_id ON tasks(schedule_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_course_task_templates_course_id ON course_task_templates(course_id);
CREATE INDEX IF NOT EXISTS idx_course_participant_levels_course_id ON course_participant_levels(course_id);

-- Create task_type enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_type') THEN
        CREATE TYPE task_type AS ENUM (
            'daily_reading', 'daily_quiz', 'daily_evaluation', 'daily_monitoring',
            'homework', 'exam', 'preparation', 'weekly_report', 'weekly_evaluation'
        );
    END IF;
END $$;

-- Update tasks table to use task_type enum if column exists but not as enum
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'task_type' AND data_type != 'USER-DEFINED') THEN
        ALTER TABLE tasks ALTER COLUMN task_type TYPE task_type USING task_type::task_type;
    END IF;
END $$;