-- This script enhances the performance calculation function to provide more detailed metrics.
-- It calculates overall, weekly performance, and task completion rate.
-- Execute this script on your database ONCE to update the function.

CREATE OR REPLACE FUNCTION calculate_user_performance(p_user_id INTEGER, p_course_id INTEGER)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    overall_avg NUMERIC;
    weekly_avg NUMERIC;
    completion_rate NUMERIC;
BEGIN
    -- Calculate Overall Average Grade for the course
    SELECT COALESCE(AVG(grade), 0)
    INTO overall_avg
    FROM tasks
    WHERE assigned_to_user_id = p_user_id
      AND course_id = p_course_id
      AND status = 'graded';

    -- Calculate Average Grade for the last 7 days
    SELECT COALESCE(AVG(grade), 0)
    INTO weekly_avg
    FROM tasks
    WHERE assigned_to_user_id = p_user_id
      AND course_id = p_course_id
      AND status = 'graded'
      AND submitted_at >= NOW() - INTERVAL '7 days';

    -- Calculate Task Completion Rate
    SELECT 
        CASE 
            WHEN COUNT(*) > 0 THEN (COUNT(CASE WHEN status IN ('graded', 'submitted') THEN 1 END)::FLOAT / COUNT(*)) * 100
            ELSE 0 
        END
    INTO completion_rate
    FROM tasks
    WHERE assigned_to_user_id = p_user_id
      AND course_id = p_course_id;

    result := jsonb_build_object(
        'overall_score', overall_avg,
        'weekly_score', weekly_avg,
        'completion_rate', completion_rate
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_user_performance(INTEGER, INTEGER) IS 'Calculates detailed performance metrics for a user in a course, including overall score, weekly score, and completion rate.';

PRINT 'Function calculate_user_performance has been updated successfully. Please execute it on your database.';
