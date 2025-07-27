import { withAuth } from '../../../lib/withAuth';
import pool from '../../../lib/db';
import { getDashboardStats } from '../../../lib/queryOptimizer';

/**
 * API endpoint for dynamic dashboard data
 * Fetches real-time, user-specific data that changes frequently
 */
async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { user } = req;
    const { role } = req.query;

    try {
        let dynamicData = {};

        switch (role) {
            case 'admin':
                dynamicData = await getAdminDynamicData(user.id);
                break;
            case 'finance':
                dynamicData = await getFinanceDynamicData(user.id);
                break;
            case 'head':
                dynamicData = await getHeadDynamicData(user.id);
                break;
            case 'teacher':
                dynamicData = await getTeacherDynamicData(user.id);
                break;
            case 'student':
                dynamicData = await getStudentDynamicData(user.id);
                break;
            case 'parent':
                dynamicData = await getParentDynamicData(user.id);
                break;
            case 'worker':
                dynamicData = await getWorkerDynamicData(user.id);
                break;
            default:
                dynamicData = await getDefaultDynamicData(user.id);
        }

        res.status(200).json({
            success: true,
            ...dynamicData,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error fetching dynamic dashboard data:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في تحميل البيانات الديناميكية',
            stats: {},
            timestamp: new Date().toISOString()
        });
    }
}

async function getAdminDynamicData(userId) {
    try {
        // Get real-time admin statistics
        const stats = await getDashboardStats('admin', userId);

        // Get recent users (last 24 hours)
        const recentUsersRes = await pool.query(`
            SELECT id, full_name, email, role, created_at, details
            FROM users 
            WHERE created_at >= NOW() - INTERVAL '24 hours'
            ORDER BY created_at DESC 
            LIMIT 5;
        `);

        // Get pending edit requests
        const pendingRequestsRes = await pool.query(`
            SELECT r.id, r.field_name, r.old_value, r.new_value, r.requested_at, u.full_name
            FROM user_edit_requests r
            JOIN users u ON r.user_id = u.id
            WHERE r.status = 'pending'
            ORDER BY r.requested_at DESC
            LIMIT 10;
        `);

        // Get recent enrollments
        const recentEnrollmentsRes = await pool.query(`
            SELECT e.id, e.created_at, u.full_name, c.name as course_name, e.status
            FROM enrollments e
            JOIN users u ON e.user_id = u.id
            JOIN courses c ON e.course_id = c.id
            WHERE e.created_at >= NOW() - INTERVAL '24 hours'
            ORDER BY e.created_at DESC
            LIMIT 10;
        `);

        return {
            stats,
            recentUsers: JSON.parse(JSON.stringify(recentUsersRes.rows)),
            pendingRequests: JSON.parse(JSON.stringify(pendingRequestsRes.rows)),
            recentEnrollments: JSON.parse(JSON.stringify(recentEnrollmentsRes.rows))
        };
    } catch (err) {
        console.error('Error in getAdminDynamicData:', err);
        return { stats: {}, recentUsers: [], pendingRequests: [], recentEnrollments: [] };
    }
}

async function getFinanceDynamicData(userId) {
    try {
        const stats = await getDashboardStats('finance', userId);

        // Get pending payments
        const pendingPaymentsRes = await pool.query(`
            SELECT p.id, p.amount, p.due_date, p.status, u.full_name, c.name as course_name
            FROM payments p
            JOIN enrollments e ON p.enrollment_id = e.id
            JOIN users u ON e.user_id = u.id
            JOIN courses c ON e.course_id = c.id
            WHERE p.status IN ('pending', 'late')
            ORDER BY p.due_date ASC
            LIMIT 20;
        `);

        // Get recent transactions
        const recentTransactionsRes = await pool.query(`
            SELECT p.id, p.amount, p.status, p.created_at, u.full_name
            FROM payments p
            JOIN enrollments e ON p.enrollment_id = e.id
            JOIN users u ON e.user_id = u.id
            WHERE p.created_at >= NOW() - INTERVAL '7 days'
            ORDER BY p.created_at DESC
            LIMIT 15;
        `);

        return {
            stats,
            pendingPayments: JSON.parse(JSON.stringify(pendingPaymentsRes.rows)),
            recentTransactions: JSON.parse(JSON.stringify(recentTransactionsRes.rows))
        };
    } catch (err) {
        console.error('Error in getFinanceDynamicData:', err);
        return { stats: {}, pendingPayments: [], recentTransactions: [] };
    }
}

async function getTeacherDynamicData(userId) {
    try {
        // Get teacher's courses with real-time enrollment counts
        const coursesRes = await pool.query(`
            SELECT c.id, c.name, c.status, c.is_published, c.is_launched,
                   COUNT(CASE WHEN e.status = 'active' THEN 1 END) as active_students,
                   COUNT(CASE WHEN e.status IN ('pending_payment', 'pending_approval') THEN 1 END) as pending_students,
                   COUNT(CASE WHEN e.created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as new_enrollments_today
            FROM courses c
            LEFT JOIN enrollments e ON c.id = e.course_id
            WHERE c.created_by = $1 
            AND c.status IN ('active', 'published', 'draft')
            GROUP BY c.id, c.name, c.status, c.is_published, c.is_launched
            ORDER BY c.created_at DESC;
        `, [userId]);

        // Get recent messages in teacher's courses
        const recentMessagesRes = await pool.query(`
            SELECT cm.id, cm.message, cm.created_at, u.full_name, c.name as course_name
            FROM course_messages cm
            JOIN users u ON cm.user_id = u.id
            JOIN courses c ON cm.course_id = c.id
            WHERE c.created_by = $1 
            AND cm.created_at >= NOW() - INTERVAL '24 hours'
            ORDER BY cm.created_at DESC
            LIMIT 10;
        `, [userId]);

        return {
            courses: JSON.parse(JSON.stringify(coursesRes.rows)),
            recentMessages: JSON.parse(JSON.stringify(recentMessagesRes.rows))
        };
    } catch (err) {
        console.error('Error in getTeacherDynamicData:', err);
        return { courses: [], recentMessages: [] };
    }
}

async function getStudentDynamicData(userId) {
    try {
        // Get student's upcoming tasks
        const tasksRes = await pool.query(`
            SELECT t.id, t.title, t.due_date, t.task_type, c.name as course_name
            FROM tasks t
            JOIN course_schedule cs ON t.schedule_id = cs.id
            JOIN courses c ON cs.course_id = c.id
            JOIN enrollments e ON c.id = e.course_id
            WHERE e.user_id = $1 AND e.status = 'active'
            AND t.due_date >= CURRENT_DATE
            ORDER BY t.due_date ASC
            LIMIT 10;
        `, [userId]);

        // Get today's commitments
        const commitmentsRes = await pool.query(`
            SELECT commitments
            FROM daily_commitments
            WHERE user_id = $1 AND commitment_date = CURRENT_DATE;
        `, [userId]);

        const commitments = commitmentsRes.rows.length > 0 ? 
            commitmentsRes.rows[0].commitments || {} : {};

        // Get recent course updates
        const courseUpdatesRes = await pool.query(`
            SELECT c.id, c.name, cm.message, cm.created_at, u.full_name as author
            FROM course_messages cm
            JOIN courses c ON cm.course_id = c.id
            JOIN users u ON cm.user_id = u.id
            JOIN enrollments e ON c.id = e.course_id
            WHERE e.user_id = $1 AND e.status = 'active'
            AND cm.created_at >= NOW() - INTERVAL '7 days'
            ORDER BY cm.created_at DESC
            LIMIT 5;
        `, [userId]);

        return {
            tasks: JSON.parse(JSON.stringify(tasksRes.rows)),
            commitments,
            courseUpdates: JSON.parse(JSON.stringify(courseUpdatesRes.rows))
        };
    } catch (err) {
        console.error('Error in getStudentDynamicData:', err);
        return { tasks: [], commitments: {}, courseUpdates: [] };
    }
}

async function getParentDynamicData(userId) {
    try {
        // Get children's recent activities
        const childrenActivitiesRes = await pool.query(`
            SELECT u.id, u.full_name, c.name as course_name, e.status, e.created_at
            FROM users u
            JOIN parent_child_relationships pcr ON u.id = pcr.child_id
            JOIN enrollments e ON u.id = e.user_id
            JOIN courses c ON e.course_id = c.id
            WHERE pcr.parent_id = $1
            AND e.created_at >= NOW() - INTERVAL '30 days'
            ORDER BY e.created_at DESC
            LIMIT 10;
        `, [userId]);

        return {
            childrenActivities: JSON.parse(JSON.stringify(childrenActivitiesRes.rows))
        };
    } catch (err) {
        console.error('Error in getParentDynamicData:', err);
        return { childrenActivities: [] };
    }
}

async function getWorkerDynamicData(userId) {
    try {
        // Mock worker data since worker tables don't exist yet
        return {
            stats: {
                pending_tasks: Math.floor(Math.random() * 10) + 1,
                completed_today: Math.floor(Math.random() * 5),
                hours_today: Math.floor(Math.random() * 8) + 1
            },
            recentTasks: [
                {
                    id: 1,
                    title: 'مراجعة بيانات الطلاب الجدد',
                    status: 'pending',
                    priority: 'high',
                    due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
                }
            ]
        };
    } catch (err) {
        console.error('Error in getWorkerDynamicData:', err);
        return { stats: {}, recentTasks: [] };
    }
}

async function getHeadDynamicData(userId) {
    try {
        const stats = await getDashboardStats('head', userId);
        return { stats };
    } catch (err) {
        console.error('Error in getHeadDynamicData:', err);
        return { stats: {} };
    }
}

async function getDefaultDynamicData(userId) {
    return {
        stats: {},
        message: 'مرحباً بك في النظام'
    };
}

export default withAuth(handler);