
import pool from '../../../lib/db';
import { withAuth } from '../../../lib/withAuth';

export const getPerformanceData = async (workerId, period) => {
    let dateFilter = '';
    const params = [workerId];

    if (period === 'current_year') {
        dateFilter = `AND EXTRACT(YEAR FROM wpe.period_end) = EXTRACT(YEAR FROM CURRENT_DATE)`;
    } else if (period === 'last_year') {
        dateFilter = `AND EXTRACT(YEAR FROM wpe.period_end) = EXTRACT(YEAR FROM CURRENT_DATE) - 1`;
    }

    const query = `
        WITH evaluations AS (
            SELECT 
                wpe.*, 
                u.full_name as evaluator_name,
                u.details->>'position' as evaluator_position
            FROM worker_performance_evaluations wpe
            LEFT JOIN users u ON wpe.evaluator_id = u.id
            WHERE wpe.worker_id = $1 ${dateFilter}
        ),
        tasks_summary AS (
            SELECT 
                COUNT(*) as tasks_completed,
                COUNT(CASE WHEN completion_date <= due_date THEN 1 END) as tasks_on_time,
                -- Using average quality rating from evaluations as a proxy for task rating
                (SELECT AVG(quality_rating) FROM evaluations) as average_task_rating
            FROM worker_tasks 
            WHERE assigned_to = $1
        ),
        evaluations_summary AS (
            SELECT
                AVG(overall_rating) as overall_rating,
                AVG(punctuality_rating) as punctuality_rating,
                AVG(quality_rating) as quality_rating,
                AVG(communication_rating) as communication_rating,
                AVG(teamwork_rating) as teamwork_rating,
                AVG(initiative_rating) as initiative_rating,
                COUNT(*) as total_evaluations
            FROM evaluations
        )
        SELECT 
            (SELECT row_to_json(evaluations_summary) FROM evaluations_summary) as summary,
            (SELECT json_agg(evaluations.* ORDER BY period_end DESC) FROM evaluations) as evaluations,
            (SELECT row_to_json(tasks_summary) FROM tasks_summary) as tasks
    `;

    const { rows } = await pool.query(query, params);
    
    if (rows.length === 0 || !rows[0].summary) {
        return { summary: null, evaluations: [] };
    }

    const { summary, evaluations, tasks } = rows[0];

    // Basic trend analysis
    let improvement_trend = 'stable';
    if (evaluations && evaluations.length >= 2) {
        const last_eval = evaluations[0].overall_rating;
        const second_last_eval = evaluations[1].overall_rating;
        if (last_eval > second_last_eval) {
            improvement_trend = 'positive';
        } else if (last_eval < second_last_eval) {
            improvement_trend = 'negative';
        }
    }
    
    const combinedSummary = {
        ...summary,
        ...tasks,
        last_evaluation_date: evaluations && evaluations.length > 0 ? evaluations[0].created_at : null,
        improvement_trend
    };

    return { summary: combinedSummary, evaluations: evaluations || [] };
};


const handleWorkerPerformance = async (req, res) => {
    const { user } = req;

    if (req.method === 'GET') {
        try {
            const { period } = req.query;
            const data = await getPerformanceData(user.id, period);
            res.status(200).json(data);
        } catch (error) {
            console.error('Error fetching worker performance:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
};

export default withAuth(handleWorkerPerformance, { roles: ['worker'] });
