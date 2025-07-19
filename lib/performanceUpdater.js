import pool from './db.js';

// Real-time performance updater - called whenever a task is submitted or graded
export async function updateUserPerformanceRealTime(userId, courseId, triggerEvent = 'task_completion') {
    try {
        console.log(`🔄 Updating performance for user ${userId} in course ${courseId} (${triggerEvent})`);

        // Calculate current performance using the database function
        const performanceResult = await pool.query(
            'SELECT calculate_user_performance($1, $2) as performance_data',
            [userId, courseId]
        );

        const performanceData = performanceResult.rows[0].performance_data;

        if (performanceData.error) {
            console.error('❌ Performance calculation error:', performanceData.error);
            return { success: false, error: performanceData.error };
        }

        // Update performance evaluation record
        await pool.query(`
            INSERT INTO performance_evaluations (
                user_id, course_id, level_number, task_completion_score,
                quality_score, timeliness_score, overall_score, performance_data
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (user_id, course_id, evaluation_date) 
            DO UPDATE SET 
                task_completion_score = EXCLUDED.task_completion_score,
                quality_score = EXCLUDED.quality_score,
                timeliness_score = EXCLUDED.timeliness_score,
                overall_score = EXCLUDED.overall_score,
                performance_data = EXCLUDED.performance_data,
                updated_at = CURRENT_TIMESTAMP
        `, [
            userId,
            courseId,
            performanceData.level_number,
            performanceData.task_completion_rate || 0,
            performanceData.average_grade || 0,
            performanceData.on_time_completion_rate || 0,
            performanceData.overall_score || 0,
            JSON.stringify(performanceData)
        ]);

        // Update enrollment grade
        await pool.query(`
            UPDATE enrollments 
            SET grade = $1 
            WHERE user_id = $2 AND course_id = $3
        `, [JSON.stringify(performanceData), userId, courseId]);

        // Create performance update notification if significant change
        if (triggerEvent === 'grading' && performanceData.overall_score) {
            const scoreLevel = getPerformanceLevel(performanceData.overall_score);
            await pool.query(`
                INSERT INTO notifications (user_id, type, message, related_id, created_at)
                VALUES ($1, 'performance_updated', $2, $3, CURRENT_TIMESTAMP)
            `, [
                userId,
                `تم تحديث تقييم أدائك: ${scoreLevel} (${Math.round(performanceData.overall_score)}/100)`,
                courseId
            ]);
        }

        console.log(`✅ Performance updated successfully for user ${userId} - Score: ${Math.round(performanceData.overall_score || 0)}/100`);

        return {
            success: true,
            performance: performanceData,
            trigger: triggerEvent,
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        console.error('❌ Real-time performance update error:', error);
        return { success: false, error: error.message };
    }
}

// Update performance for all users in a course (when teacher grades multiple submissions)
export async function updateCoursePerformanceRealTime(courseId, triggerEvent = 'bulk_grading') {
    try {
        console.log(`🔄 Updating performance for all users in course ${courseId} (${triggerEvent})`);

        // Get all active enrollments in the course
        const enrollments = await pool.query(`
            SELECT DISTINCT e.user_id 
            FROM enrollments e 
            WHERE e.course_id = $1 AND e.status = 'active'
        `, [courseId]);

        let successCount = 0;
        let errorCount = 0;

        // Update performance for each user
        for (const enrollment of enrollments.rows) {
            const result = await updateUserPerformanceRealTime(enrollment.user_id, courseId, triggerEvent);
            if (result.success) {
                successCount++;
            } else {
                errorCount++;
            }
        }

        console.log(`✅ Course performance update complete: ${successCount} success, ${errorCount} errors`);

        return {
            success: true,
            usersUpdated: successCount,
            errors: errorCount,
            totalUsers: enrollments.rows.length
        };

    } catch (error) {
        console.error('❌ Course performance update error:', error);
        return { success: false, error: error.message };
    }
}

// Get performance level description
function getPerformanceLevel(score) {
    if (score >= 90) return 'ممتاز';
    if (score >= 80) return 'جيد جداً';
    if (score >= 70) return 'جيد';
    if (score >= 60) return 'مقبول';
    return 'يحتاج تحسين';
}

// Update performance when exam is completed
export async function updatePerformanceAfterExam(userId, courseId, examScore) {
    try {
        // Update performance
        const result = await updateUserPerformanceRealTime(userId, courseId, 'exam_completion');
        
        if (result.success) {
            // Create specific exam performance notification
            const scoreLevel = getPerformanceLevel(examScore);
            await pool.query(`
                INSERT INTO notifications (user_id, type, message, related_id, created_at)
                VALUES ($1, 'exam_completed', $2, $3, CURRENT_TIMESTAMP)
            `, [
                userId,
                `تم إكمال الامتحان - النتيجة: ${scoreLevel} (${examScore}/100)`,
                courseId
            ]);
        }

        return result;
    } catch (error) {
        console.error('❌ Exam performance update error:', error);
        return { success: false, error: error.message };
    }
}

// Update performance when daily tasks are completed
export async function updatePerformanceAfterDailyTask(userId, courseId, taskType) {
    try {
        const result = await updateUserPerformanceRealTime(userId, courseId, 'daily_task_completion');
        
        if (result.success) {
            // Create task-specific notification for Islamic tasks
            let message = 'تم إكمال مهمة يومية';
            
            switch (taskType) {
                case 'quran_memorization':
                    message = 'تم إكمال حفظ القرآن اليومي - بارك الله فيك';
                    break;
                case 'quran_recitation':
                    message = 'تم إكمال التسميع اليومي - أحسنت';
                    break;
                case 'daily_adhkar':
                    message = 'تم إكمال الأوراد اليومية - تقبل الله منك';
                    break;
                case 'spiritual_lesson':
                    message = 'تم إكمال الدرس التزكوي - زادك الله علماً';
                    break;
                default:
                    message = 'تم إكمال المهمة اليومية';
            }

            await pool.query(`
                INSERT INTO notifications (user_id, type, message, related_id, created_at)
                VALUES ($1, 'daily_task_completed', $2, $3, CURRENT_TIMESTAMP)
            `, [userId, message, courseId]);
        }

        return result;
    } catch (error) {
        console.error('❌ Daily task performance update error:', error);
        return { success: false, error: error.message };
    }
}