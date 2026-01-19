import pool from './db';

/**
 * Evaluates a student's task submission and applies a performance score change.
 * @param {object} task - The task object, must include due_date.
 * @param {object} submission - The submission object, must include submitted_at and user_id.
 * @param {number} submissionId - The ID of the submission.
 */
export async function evaluateTaskSubmission(task, submission, submissionId) {
    if (!task || !submission || !submissionId) {
        console.error('[PerformanceEvaluator] Missing required arguments.');
        return;
    }

    try {
        const isLate = new Date(submission.submitted_at) > new Date(task.due_date);
        const metricKey = isLate ? 'STUDENT_SUBMITS_LATE' : 'STUDENT_SUBMITS_ON_TIME';
        const notes = isLate 
            ? `Submission for task '${task.title}' was late.`
            : `Submission for task '${task.title}' was on time.`;

        // Use the database function to apply the change
        await pool.query(
            `SELECT apply_performance_change($1, $2, 'submission', $3, $4)`,
            [submission.user_id, metricKey, submissionId, notes]
        );

        console.log(`[PerformanceEvaluator] Applied performance change for user ${submission.user_id} for task ${task.id}. Metric: ${metricKey}`);

    } catch (error) {
        console.error(`[PerformanceEvaluator] Failed to evaluate task submission for user ${submission.user_id}, task ${task.id}:`, error);
    }
}

// You can add more evaluation functions here for other events, e.g.:
// export async function evaluateTeacherGrading(teacherId, assignmentId, gradingDate) { ... }
// export async function evaluateWorkerReport(workerId, reportId, submissionDate) { ... }
