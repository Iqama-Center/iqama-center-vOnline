#!/usr/bin/env node

/**
 * Setup script for the Automated Task System
 * This script ensures all required database tables and functions are created
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function setupTaskSystem() {
    const client = await pool.connect();
    
    try {
        console.log('🚀 Setting up Automated Task System...');
        
        await client.query('BEGIN');

        // 1. Ensure task_type enum exists
        console.log('📝 Creating task_type enum...');
        await client.query(`
            DO $$ BEGIN
                CREATE TYPE task_type AS ENUM (
                    'daily_reading', 'daily_quiz', 'daily_evaluation', 'daily_monitoring',
                    'homework', 'exam', 'preparation', 'weekly_report', 'weekly_evaluation'
                );
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        // 2. Update tasks table structure
        console.log('🗄️ Updating tasks table...');
        await client.query(`
            ALTER TABLE tasks 
            ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending',
            ADD COLUMN IF NOT EXISTS assigned_to_user_id INTEGER REFERENCES users(id),
            ADD COLUMN IF NOT EXISTS source_template_id INTEGER
        `);

        // 3. Create task_submissions table
        console.log('📋 Creating task_submissions table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS task_submissions (
                id SERIAL PRIMARY KEY,
                task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
                submission_content TEXT,
                submission_type VARCHAR(50) DEFAULT 'text',
                status VARCHAR(50) DEFAULT 'submitted',
                score NUMERIC(5,2),
                score_reduction NUMERIC(5,2) DEFAULT 0,
                is_late BOOLEAN DEFAULT false,
                submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                graded_at TIMESTAMP WITH TIME ZONE,
                graded_by INTEGER REFERENCES users(id),
                feedback TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 4. Create task_penalties table
        console.log('⚠️ Creating task_penalties table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS task_penalties (
                id SERIAL PRIMARY KEY,
                task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
                penalty_percentage NUMERIC(5,2) NOT NULL,
                penalty_reason TEXT NOT NULL,
                applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 5. Create user_performance table if not exists
        console.log('📊 Creating user_performance table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS user_performance (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
                metric_type VARCHAR(100) NOT NULL,
                metric_value NUMERIC(10,2) NOT NULL,
                recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 6. Create indexes for performance
        console.log('🔍 Creating performance indexes...');
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_task_submissions_task_user ON task_submissions(task_id, user_id);
            CREATE INDEX IF NOT EXISTS idx_task_submissions_course ON task_submissions(course_id);
            CREATE INDEX IF NOT EXISTS idx_task_penalties_task_id ON task_penalties(task_id);
            CREATE INDEX IF NOT EXISTS idx_task_penalties_user_course ON task_penalties(user_id, course_id);
            CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
            CREATE INDEX IF NOT EXISTS idx_tasks_course_active ON tasks(course_id, is_active);
            CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
            CREATE INDEX IF NOT EXISTS idx_user_performance_user_course ON user_performance(user_id, course_id);
        `);

        // 7. Update course_schedule table
        console.log('📅 Updating course_schedule table...');
        await client.query(`
            ALTER TABLE course_schedule 
            ADD COLUMN IF NOT EXISTS tasks_released BOOLEAN DEFAULT false
        `);

        // 8. Create task generation function
        console.log('⚙️ Creating task generation function...');
        await client.query(`
            CREATE OR REPLACE FUNCTION get_task_statistics(p_course_id INTEGER)
            RETURNS TABLE(
                total_tasks BIGINT,
                active_tasks BIGINT,
                completed_tasks BIGINT,
                overdue_tasks BIGINT,
                avg_completion_rate NUMERIC
            ) AS $$
            BEGIN
                RETURN QUERY
                SELECT 
                    COUNT(*) as total_tasks,
                    COUNT(*) FILTER (WHERE t.is_active = true) as active_tasks,
                    COUNT(*) FILTER (WHERE t.status = 'completed') as completed_tasks,
                    COUNT(*) FILTER (WHERE t.status IN ('expired', 'overdue') OR 
                        (t.is_active = true AND t.due_date < CURRENT_TIMESTAMP)) as overdue_tasks,
                    CASE 
                        WHEN COUNT(*) > 0 THEN 
                            (COUNT(*) FILTER (WHERE t.status = 'completed')::NUMERIC / COUNT(*)::NUMERIC) * 100
                        ELSE 0 
                    END as avg_completion_rate
                FROM tasks t
                WHERE t.course_id = p_course_id;
            END;
            $$ LANGUAGE plpgsql;
        `);

        // 9. Create notification cleanup function
        console.log('🧹 Creating notification cleanup function...');
        await client.query(`
            CREATE OR REPLACE FUNCTION cleanup_old_notifications()
            RETURNS INTEGER AS $$
            DECLARE
                deleted_count INTEGER;
            BEGIN
                DELETE FROM notifications 
                WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '30 days'
                AND type IN ('task_released', 'deadline_reminder', 'task_completed');
                
                GET DIAGNOSTICS deleted_count = ROW_COUNT;
                RETURN deleted_count;
            END;
            $$ LANGUAGE plpgsql;
        `);

        // 10. Insert sample task types configuration
        console.log('📝 Creating task configuration...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS task_type_config (
                id SERIAL PRIMARY KEY,
                task_type VARCHAR(50) NOT NULL UNIQUE,
                display_name VARCHAR(100) NOT NULL,
                description TEXT,
                default_duration_hours INTEGER,
                penalty_percentage NUMERIC(5,2),
                is_daily BOOLEAN DEFAULT false,
                target_roles TEXT[] DEFAULT '{}',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await client.query(`
            INSERT INTO task_type_config (task_type, display_name, description, default_duration_hours, penalty_percentage, is_daily, target_roles)
            VALUES 
                ('daily_reading', 'قراءة يومية', 'مهمة قراءة يومية للطلاب', 24, 50, true, '{"student"}'),
                ('daily_quiz', 'اختبار يومي', 'اختبار قصير يومي', 24, 50, true, '{"student"}'),
                ('daily_evaluation', 'تقييم يومي', 'تقييم أداء الطلاب اليومي', 24, 0, true, '{"teacher"}'),
                ('daily_monitoring', 'مراقبة يومية', 'مراقبة سير الدورة اليومي', 24, 0, true, '{"supervisor", "admin", "head"}'),
                ('homework', 'واجب منزلي', 'واجب منزلي للطلاب', 72, 20, false, '{"student"}'),
                ('exam', 'امتحان', 'امتحان للطلاب', 168, 30, false, '{"student"}'),
                ('preparation', 'تحضير', 'تحضير المادة التعليمية', 24, 0, false, '{"teacher"}'),
                ('weekly_report', 'تقرير أسبوعي', 'تقرير أسبوعي شامل', 72, 10, false, '{"teacher"}'),
                ('weekly_evaluation', 'تقييم أسبوعي', 'تقييم أسبوعي شامل', 168, 10, false, '{"supervisor", "admin", "head"}')
            ON CONFLICT (task_type) DO NOTHING
        `);

        await client.query('COMMIT');
        
        console.log('✅ Automated Task System setup completed successfully!');
        console.log('\n📋 Summary:');
        console.log('   ✓ Task types enum created');
        console.log('   ✓ Tasks table updated');
        console.log('   ✓ Task submissions table created');
        console.log('   ✓ Task penalties table created');
        console.log('   ✓ User performance table created');
        console.log('   ✓ Performance indexes created');
        console.log('   ✓ Course schedule updated');
        console.log('   ✓ Helper functions created');
        console.log('   ✓ Task configuration added');
        console.log('\n🚀 System is ready for automated task generation!');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error setting up task system:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run setup if called directly
if (require.main === module) {
    setupTaskSystem()
        .then(() => {
            console.log('\n🎉 Setup completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Setup failed:', error);
            process.exit(1);
        });
}

module.exports = { setupTaskSystem };