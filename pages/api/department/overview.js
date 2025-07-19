import pool from '../../../lib/db';
import jwt from 'jsonwebtoken';
import errorHandler from '../../../lib/errorHandler';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (!['admin', 'head'].includes(decoded.role)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        let departmentCondition = '';
        let queryParams = [];

        if (decoded.role === 'head') {
            // Department heads see only their department
            departmentCondition = 'WHERE u.reports_to = $1 OR u.id = $1';
            queryParams = [decoded.id];
        }

        // Get department members
        const members = await pool.query(
            `SELECT 
                u.id, u.full_name, u.role, u.email, u.phone,
                u.created_at, u.details,
                COUNT(DISTINCT e.id) as active_enrollments,
                COUNT(DISTINCT t.id) as pending_tasks,
                COALESCE(AVG(s.grade), 0) as avg_performance
             FROM users u
             LEFT JOIN enrollments e ON u.id = e.user_id AND e.status = 'active'
             LEFT JOIN tasks t ON u.id = t.assigned_to AND t.status = 'pending'
             LEFT JOIN submissions s ON u.id = s.user_id AND s.status = 'graded'
             ${departmentCondition}
             GROUP BY u.id, u.full_name, u.role, u.email, u.phone, u.created_at, u.details
             ORDER BY u.role, u.full_name`,
            queryParams
        );

        // Get department statistics
        const stats = await pool.query(
            `SELECT 
                COUNT(*) as total_members,
                COUNT(CASE WHEN role = 'student' THEN 1 END) as students,
                COUNT(CASE WHEN role = 'teacher' THEN 1 END) as teachers,
                COUNT(CASE WHEN role = 'worker' THEN 1 END) as workers,
                COUNT(CASE WHEN role = 'parent' THEN 1 END) as parents
             FROM users u
             ${departmentCondition}`,
            queryParams
        );

        // Get pending tasks overview
        const pendingTasks = await pool.query(
            `SELECT 
                t.id, t.title, t.due_date, t.task_type,
                u.full_name as assigned_to_name,
                cs.title as lesson_title,
                c.name as course_name
             FROM tasks t
             JOIN users u ON t.assigned_to = u.id
             JOIN course_schedule cs ON t.schedule_id = cs.id
             JOIN courses c ON cs.course_id = c.id
             WHERE t.status = 'pending' 
             AND t.due_date > CURRENT_DATE
             ${departmentCondition ? 'AND ' + departmentCondition.replace('u.', 'u.') : ''}
             ORDER BY t.due_date ASC
             LIMIT 10`,
            queryParams
        );

        // Get recent activities
        const recentActivities = await pool.query(
            `SELECT 
                al.action, al.details, al.created_at,
                u.full_name as user_name,
                performer.full_name as performed_by_name
             FROM user_activity_log al
             JOIN users u ON al.user_id = u.id
             LEFT JOIN users performer ON al.performed_by = performer.id
             ${departmentCondition ? 'WHERE ' + departmentCondition.replace('u.', 'u.') : ''}
             ORDER BY al.created_at DESC
             LIMIT 20`,
            queryParams
        );

        // Get financial overview
        const financialOverview = await pool.query(
            `SELECT 
                COUNT(CASE WHEN p.status = 'due' THEN 1 END) as due_payments,
                COUNT(CASE WHEN p.status = 'late' THEN 1 END) as late_payments,
                SUM(CASE WHEN p.status = 'due' THEN p.amount ELSE 0 END) as total_due,
                SUM(CASE WHEN p.status = 'paid' THEN p.amount ELSE 0 END) as total_paid
             FROM payments p
             JOIN enrollments e ON p.enrollment_id = e.id
             JOIN users u ON e.user_id = u.id
             ${departmentCondition ? 'WHERE ' + departmentCondition.replace('u.', 'u.') : ''}`,
            queryParams
        );

        res.status(200).json({
            members: members.rows,
            statistics: stats.rows[0],
            pendingTasks: pendingTasks.rows,
            recentActivities: recentActivities.rows,
            financialOverview: financialOverview.rows[0]
        });

    } catch (err) {
        console.error('Department overview error:', err);
        errorHandler(err, res);
    }
}