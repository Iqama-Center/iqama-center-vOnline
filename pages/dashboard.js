import React from 'react';
import { withAuth } from '../lib/withAuth';
import pool from '../lib/db';
import { getDashboardStats } from '../lib/queryOptimizer';
import { safeSerialize } from '../lib/isrUtils';
import Layout from '../components/Layout';
import AdminDashboard from '../components/dashboards/AdminDashboard';
import FinanceDashboard from '../components/dashboards/FinanceDashboard';
import HeadDashboard from '../components/dashboards/HeadDashboard';
import TeacherDashboard from '../components/dashboards/TeacherDashboard';
import StudentDashboard from '../components/dashboards/StudentDashboard';
import ParentDashboard from '../components/dashboards/ParentDashboard';
import WorkerDashboard from '../components/dashboards/WorkerDashboard';
import DefaultDashboard from '../components/dashboards/DefaultDashboard';

const DashboardPage = (props) => {
    const { user } = props;

    const renderDashboard = () => {
        switch (user.role) {
            case 'admin':
                return <AdminDashboard {...props} />;
            case 'finance':
                return <FinanceDashboard {...props} />;
            case 'head':
                return <HeadDashboard {...props} />;
            case 'teacher':
                return <TeacherDashboard {...props} />;
            case 'student':
                return <StudentDashboard {...props} />;
            case 'parent':
                return <ParentDashboard {...props} />;
            case 'worker':
                return <WorkerDashboard {...props} />;
            default:
                return <DefaultDashboard {...props} />;
        }
    };

    return (
        <Layout user={user}>
            {renderDashboard()}
        </Layout>
    );
};

/**
 * Server-side rendering for user-specific dashboard data
 * Note: Using SSR only since this page requires authentication
 */
export const getServerSideProps = withAuth(async (context) => {
    const { user } = context;
    
    try {
        // Get public dashboard statistics directly in SSR
        const publicStatsResult = await pool.query(`
            SELECT 
                COUNT(*) as total_courses,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active_courses,
                COUNT(CASE WHEN status = 'published' THEN 1 END) as published_courses,
                (SELECT COUNT(DISTINCT user_id) FROM enrollments WHERE status = 'active') as total_students,
                (SELECT COUNT(*) FROM users WHERE role = 'teacher' AND (account_status = 'active' OR account_status IS NULL) AND account_status = 'active') as total_teachers,
                (SELECT COUNT(*) FROM enrollments WHERE status = 'completed') as completed_enrollments
            FROM courses 
            WHERE status IN ('active', 'published', 'draft')
        `);

        // Get recent public activities
        const recentActivitiesResult = await pool.query(`
            SELECT 
                'course_created' as activity_type,
                c.name as title,
                c.created_at,
                u.full_name as user_name,
                c.status
            FROM courses c
            LEFT JOIN users u ON c.teacher_id = u.id
            WHERE c.status IN ('active', 'published')
            ORDER BY c.created_at DESC
            LIMIT 10
        `);

        // Get real data even in development mode to ensure accuracy
        if (process.env.NODE_ENV === 'development') {
            console.log('🚀 Dashboard development mode: Using REAL database data for', user.role);
            
            let roleSpecificStats = {};
            
            // Add role-specific stats for development - GET REAL DATA
            if (user.role === 'admin') {
                // Get actual user count from database (ALL users, not just active)
                const actualUserCount = await pool.query('SELECT COUNT(*) as count FROM users');
                const actualCourseCount = await pool.query('SELECT COUNT(*) as count FROM courses');
                const actualEnrollmentCount = await pool.query('SELECT COUNT(*) as count FROM enrollments WHERE status = \'active\'');
                
                // Get detailed user counts by role
                const actualStudentCount = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = \'student\' AND (account_status = \'active\' OR account_status IS NULL)');
                const actualTeacherCount = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = \'teacher\' AND (account_status = \'active\' OR account_status IS NULL)');
                const actualAdminCount = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = \'admin\' AND (account_status = \'active\' OR account_status IS NULL)');
                
                // Get detailed course counts by status
                const actualActiveCourses = await pool.query('SELECT COUNT(*) as count FROM courses WHERE is_published = true AND is_launched = true');
                const actualPublishedCourses = await pool.query('SELECT COUNT(*) as count FROM courses WHERE is_published = true');
                const actualDraftCourses = await pool.query('SELECT COUNT(*) as count FROM courses WHERE status = \'draft\' OR is_published = false');
                
                // Get detailed enrollment counts
                const actualCompletedEnrollments = await pool.query('SELECT COUNT(*) as count FROM enrollments WHERE status = \'completed\'');
                const actualPendingEnrollments = await pool.query('SELECT COUNT(*) as count FROM enrollments WHERE status = \'pending_approval\'');
                const actualPaymentPendingEnrollments = await pool.query('SELECT COUNT(*) as count FROM enrollments WHERE status = \'pending_payment\'');
                
                // Get actual payment and request counts with error handling
                let actualPendingPayments, actualPendingRequests, actualCompletedPayments, actualTotalRevenue, actualOutstandingAmount;
                
                try {
                    actualPendingPayments = await pool.query('SELECT COUNT(*) as count FROM payments WHERE status IN (\'due\', \'pending_review\', \'late\')');
                } catch (err) {
                    console.log('Payments table may not exist, using 0 for pending payments');
                    actualPendingPayments = { rows: [{ count: 0 }] };
                }
                
                try {
                    actualPendingRequests = await pool.query('SELECT COUNT(*) as count FROM user_edit_requests WHERE status = \'pending\'');
                } catch (err) {
                    console.log('User edit requests table may not exist, using 0');
                    actualPendingRequests = { rows: [{ count: 0 }] };
                }
                
                try {
                    actualCompletedPayments = await pool.query('SELECT COUNT(*) as count FROM payments WHERE status = \'paid\'');
                    actualTotalRevenue = await pool.query('SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = \'paid\'');
                    actualOutstandingAmount = await pool.query('SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status IN (\'due\', \'pending_review\', \'late\')');
                } catch (err) {
                    console.log('Payment calculations failed, using defaults');
                    actualCompletedPayments = { rows: [{ count: 0 }] };
                    actualTotalRevenue = { rows: [{ total: 0 }] };
                    actualOutstandingAmount = { rows: [{ total: 0 }] };
                }
                
                roleSpecificStats = {
                    total_users: parseInt(actualUserCount.rows[0].count),
                    total_courses: parseInt(actualCourseCount.rows[0].count),
                    active_enrollments: parseInt(actualEnrollmentCount.rows[0].count),
                    pending_payments: parseInt(actualPendingPayments.rows[0].count),
                    pending_requests: parseInt(actualPendingRequests.rows[0].count),
                    completed_payments: parseInt(actualCompletedPayments.rows[0].count),
                    total_revenue: parseFloat(actualTotalRevenue.rows[0].total),
                    outstanding_amount: parseFloat(actualOutstandingAmount.rows[0].total),
                    // Detailed user counts
                    total_students: parseInt(actualStudentCount.rows[0].count),
                    total_teachers: parseInt(actualTeacherCount.rows[0].count),
                    total_admins: parseInt(actualAdminCount.rows[0].count),
                    unique_active_students: parseInt(actualStudentCount.rows[0].count), // Same as total_students for now
                    // Detailed course counts
                    active_courses: parseInt(actualActiveCourses.rows[0].count),
                    published_courses: parseInt(actualPublishedCourses.rows[0].count),
                    draft_courses: parseInt(actualDraftCourses.rows[0].count),
                    // Detailed enrollment counts
                    completed_enrollments: parseInt(actualCompletedEnrollments.rows[0].count),
                    pending_enrollments: parseInt(actualPendingEnrollments.rows[0].count),
                    payment_pending_enrollments: parseInt(actualPaymentPendingEnrollments.rows[0].count)
                };
                
                // Get real recent users from database
                const recentUsersRes = await pool.query(`
                    SELECT id, full_name, email, role, created_at, details
                    FROM users 
                    ORDER BY created_at DESC 
                    LIMIT 10;
                `);
                const recentUsers = JSON.parse(JSON.stringify(recentUsersRes.rows));
                
                // Get real recent courses from database
                const recentCoursesRes = await pool.query(`
                    SELECT id, name, status, created_at, description
                    FROM courses 
                    ORDER BY created_at DESC 
                    LIMIT 10;
                `);
                const recentCourses = JSON.parse(JSON.stringify(recentCoursesRes.rows));
                
                // Get real pending requests from database
                let pendingRequests = [];
                try {
                    const pendingRequestsRes = await pool.query(`
                        SELECT r.id, r.field_name, r.old_value, r.new_value, r.requested_at, u.full_name as user_name
                        FROM user_edit_requests r
                        JOIN users u ON r.user_id = u.id
                        WHERE r.status = 'pending'
                        ORDER BY r.requested_at DESC
                        LIMIT 10;
                    `);
                    pendingRequests = JSON.parse(JSON.stringify(pendingRequestsRes.rows));
                } catch (err) {
                    console.log('Pending requests query failed, using empty array:', err.message);
                    pendingRequests = [];
                }
                
                const publicStats = publicStatsResult.rows[0] || {};
                const recentActivities = recentActivitiesResult.rows || [];

                return {
                    props: {
                        user,
                        stats: roleSpecificStats,
                        recentUsers,
                        recentCourses,
                        pendingRequests,
                        publicStats: {
                            totalCourses: parseInt(publicStats.total_courses || 0),
                            activeCourses: parseInt(publicStats.active_courses || 0),
                            publishedCourses: parseInt(publicStats.published_courses || 0),
                            totalStudents: parseInt(publicStats.total_students || 0),
                            totalTeachers: parseInt(publicStats.total_teachers || 0),
                            completedEnrollments: parseInt(publicStats.completed_enrollments || 0)
                        },
                        recentActivities: JSON.parse(JSON.stringify(recentActivities)),
                        lastUpdated: new Date().toISOString(),
                        isDevelopmentMode: true
                    }
                };
            } else if (user.role === 'finance') {
                // Get actual finance statistics with error handling
                try {
                    const pendingReviewCount = await pool.query('SELECT COUNT(*) as count FROM payments WHERE status = \'pending_review\'');
                    const dueCount = await pool.query('SELECT COUNT(*) as count FROM payments WHERE status = \'due\'');
                    const lateCount = await pool.query('SELECT COUNT(*) as count FROM payments WHERE status = \'late\'');
                    const totalPaidThisMonth = await pool.query('SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = \'paid\' AND paid_at >= CURRENT_DATE - INTERVAL \'30 days\'');
                    
                    roleSpecificStats = {
                        pending_review_count: parseInt(pendingReviewCount.rows[0].count),
                        due_count: parseInt(dueCount.rows[0].count),
                        late_count: parseInt(lateCount.rows[0].count),
                        total_paid_this_month: parseFloat(totalPaidThisMonth.rows[0].total)
                    };
                } catch (err) {
                    console.log('Finance statistics failed, using defaults:', err.message);
                    roleSpecificStats = {
                        pending_review_count: 0,
                        due_count: 0,
                        late_count: 0,
                        total_paid_this_month: 0
                    };
                }
            } else if (user.role === 'head') {
                // Get actual head statistics
                try {
                    const teacherCount = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = \'teacher\' AND (account_status = \'active\' OR account_status IS NULL)');
                    const studentCount = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = \'student\' AND (account_status = \'active\' OR account_status IS NULL)');
                    const publishedCoursesCount = await pool.query('SELECT COUNT(*) as count FROM courses WHERE is_published = true');
                    const activeCoursesCount = await pool.query('SELECT COUNT(*) as count FROM courses WHERE is_published = true AND is_launched = true');
                    const draftCoursesCount = await pool.query('SELECT COUNT(*) as count FROM courses WHERE status = \'draft\' OR is_published = false');
                    
                    roleSpecificStats = {
                        teacher_count: parseInt(teacherCount.rows[0].count),
                        student_count: parseInt(studentCount.rows[0].count),
                        published_courses_count: parseInt(publishedCoursesCount.rows[0].count),
                        active_courses_count: parseInt(activeCoursesCount.rows[0].count),
                        draft_courses_count: parseInt(draftCoursesCount.rows[0].count)
                    };
                } catch (err) {
                    console.log('Head statistics failed, using defaults:', err.message);
                    roleSpecificStats = {
                        teacher_count: 0,
                        student_count: 0,
                        published_courses_count: 0,
                        active_courses_count: 0,
                        draft_courses_count: 0
                    };
                }
            }
            
            // For other roles (finance, head, etc.)
            const publicStats = publicStatsResult.rows[0] || {};
            const recentActivities = recentActivitiesResult.rows || [];

            return {
                props: {
                    user,
                    stats: roleSpecificStats,
                    publicStats: {
                        totalCourses: parseInt(publicStats.total_courses || 0),
                        activeCourses: parseInt(publicStats.active_courses || 0),
                        publishedCourses: parseInt(publicStats.published_courses || 0),
                        totalStudents: parseInt(publicStats.total_students || 0),
                        totalTeachers: parseInt(publicStats.total_teachers || 0),
                        completedEnrollments: parseInt(publicStats.completed_enrollments || 0)
                    },
                    recentActivities: JSON.parse(JSON.stringify(recentActivities)),
                    lastUpdated: new Date().toISOString(),
                    isDevelopmentMode: true
                }
            };
        }

        // Get public dashboard statistics for production
        const statsResult = await getDashboardStats(null);
        
        const publicStats = publicStatsResult.rows[0] || {};
        const recentActivities = recentActivitiesResult.rows || [];

        let props = { 
            user,
            publicStats: {
                totalCourses: parseInt(publicStats.total_courses || 0),
                activeCourses: parseInt(publicStats.active_courses || 0),
                publishedCourses: parseInt(publicStats.published_courses || 0),
                totalStudents: parseInt(publicStats.total_students || 0),
                totalTeachers: parseInt(publicStats.total_teachers || 0),
                completedEnrollments: parseInt(publicStats.completed_enrollments || 0)
            },
            recentActivities: JSON.parse(JSON.stringify(recentActivities)),
            lastUpdated: new Date().toISOString()
        };

    if (['finance', 'admin', 'head'].includes(user.role)) {
        try {
            const dashboardStats = await getDashboardStats(user);
            console.log(`Dashboard stats for ${user.role}:`, dashboardStats);
            props.stats = dashboardStats;
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            // Provide fallback stats based on role
            if (user.role === 'admin') {
                props.stats = {
                    total_users: 0, // This will show ALL users count
                    total_courses: 0,
                    active_enrollments: 0,
                    pending_payments: 0,
                    pending_requests: 0,
                    completed_payments: 0,
                    total_revenue: 0,
                    outstanding_amount: 0
                };
            } else if (user.role === 'finance') {
                props.stats = {
                    pending_review_count: 0,
                    due_count: 0,
                    late_count: 0,
                    total_paid_this_month: 0
                };
            } else if (user.role === 'head') {
                props.stats = {
                    teacher_count: 0,
                    student_count: 0,
                    published_courses_count: 0,
                    active_courses_count: 0,
                    draft_courses_count: 0
                };
            }
        }
    }

    if (user.role === 'admin') {

        // Get recent users
        const recentUsersRes = await pool.query(`
            SELECT id, full_name, email, role, created_at, details
            FROM users 
            ORDER BY created_at DESC 
            LIMIT 10;
        `);
        props.recentUsers = JSON.parse(JSON.stringify(recentUsersRes.rows));

        // Get recent courses
        const recentCoursesRes = await pool.query(`
            SELECT id, name, status, created_at, description
            FROM courses 
            ORDER BY created_at DESC 
            LIMIT 10;
        `);
        props.recentCourses = JSON.parse(JSON.stringify(recentCoursesRes.rows));

        // Get pending edit requests
        try {
            const pendingRequestsRes = await pool.query(`
                SELECT r.id, r.field_name, r.old_value, r.new_value, r.requested_at, u.full_name
                FROM user_edit_requests r
                JOIN users u ON r.user_id = u.id
                WHERE r.status = 'pending'
                ORDER BY r.requested_at DESC;
            `);
            props.pendingRequests = JSON.parse(JSON.stringify(pendingRequestsRes.rows));
        } catch (err) {
            console.log('Pending requests query failed, using empty array:', err.message);
            props.pendingRequests = [];
        }
    }

    if (user.role === 'head') {
    }

    if (user.role === 'parent') {
        // Get children using parent_child_relationships table
        try {
            const childrenRes = await pool.query(`
                SELECT u.id, u.full_name, u.email, u.details
                FROM users u
                JOIN parent_child_relationships pcr ON u.id = pcr.child_id
                WHERE pcr.parent_id = $1 AND u.role = 'student'
                ORDER BY u.full_name ASC;
            `, [user.id]);
            props.children = JSON.parse(JSON.stringify(childrenRes.rows));
        } catch (err) {
            console.log('Parent-child relationship query failed, trying fallback method');
            try {
                // Fallback to details field method
                const childrenRes = await pool.query(`
                    SELECT u.id, u.full_name, u.email, u.details
                    FROM users u
                    WHERE u.id IN (SELECT child_id FROM parent_child_relationships WHERE parent_id = $1) AND u.role = 'student'
                    ORDER BY u.full_name ASC;
                `, [user.id.toString()]);
                props.children = JSON.parse(JSON.stringify(childrenRes.rows));
            } catch (fallbackErr) {
                console.log('Both parent-child relationship methods failed, using empty array');
                props.children = [];
            }
        }

        // Get available courses for parent (same as courses page logic)
        try {
            const coursesResult = await pool.query(`
                SELECT c.* FROM courses c
                WHERE (c.status = 'active' OR (c.status = 'published' AND c.is_published = true))
                AND NOT EXISTS (
                    SELECT 1 FROM enrollments e WHERE e.course_id = c.id AND e.user_id = $1
                )
                ORDER BY c.created_at DESC
                LIMIT 6
            `, [user.id]);
            props.availableCourses = JSON.parse(JSON.stringify(coursesResult.rows));
        } catch (err) {
            console.log('Available courses query failed, using empty array:', err.message);
            props.availableCourses = [];
        }
    }

    if (user.role === 'student') {
        // Get student's tasks and courses - simplified query to avoid column issues
        let tasksRes = { rows: [] };
        try {
            tasksRes = await pool.query(`
                SELECT t.id, t.title, t.due_date, t.task_type as type
                FROM tasks t
                WHERE t.due_date >= CURRENT_DATE
                ORDER BY t.due_date ASC
                LIMIT 5;
            `);
        } catch (err) {
            console.log('Tasks query failed, using empty array:', err.message);
        }

        let coursesRes = { rows: [] };
        try {
            coursesRes = await pool.query(`
                SELECT c.id, c.name, e.status, c.status as course_status,
                       (SELECT COUNT(*) FROM enrollments e2 WHERE e2.course_id = c.id AND e2.status = 'active') as student_count
                FROM courses c
                JOIN enrollments e ON c.id = e.course_id
                WHERE e.user_id = $1 AND e.status IN ('active', 'waiting_start', 'completed', 'pending_payment', 'pending_approval')
                ORDER BY c.name ASC;
            `, [user.id]);
        } catch (err) {
            console.log('Courses query failed, using empty array:', err.message);
        }

        let commitmentsRes = { rows: [] };
        let commitments = {};
        try {
            commitmentsRes = await pool.query(`
                SELECT commitments
                FROM daily_commitments
                WHERE user_id = $1 AND commitment_date = CURRENT_DATE;
            `, [user.id]);
            
            if (commitmentsRes.rows.length > 0) {
                commitments = commitmentsRes.rows[0].commitments || {};
            }
        } catch (err) {
            console.log('Commitments query failed, using empty array:', err.message);
            commitments = {};
        }

        props.tasks = JSON.parse(JSON.stringify(tasksRes.rows));
        props.courses = JSON.parse(JSON.stringify(coursesRes.rows));
        props.commitments = commitments;
    }

    if (user.role === 'teacher') {
        const coursesRes = await pool.query(`
            SELECT c.id, c.name, c.status, c.is_published, c.is_launched,
                   (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id AND e.status = 'active') as student_count,
                   (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id AND e.status IN ('pending_payment', 'pending_approval')) as pending_count
            FROM courses c
            WHERE c.created_by = $1 
            AND (c.status = 'active' OR c.status = 'published' OR c.status = 'draft')
            ORDER BY c.created_at DESC;
        `, [user.id]);
        props.courses = JSON.parse(JSON.stringify(coursesRes.rows));
    }

    if (user.role === 'worker') {
        // Get worker's enrolled courses (same structure as students)
        try {
            const workerCoursesResult = await pool.query(`
                SELECT c.id, c.name, e.status, c.*, e.status as enrollment_status, e.created_at as enrollment_date
                FROM courses c
                JOIN enrollments e ON c.id = e.course_id
                WHERE e.user_id = $1 
                AND e.status IN ('pending_payment', 'pending_approval', 'waiting_start', 'active')
                ORDER BY e.created_at DESC
            `, [user.id]);
            props.enrolledCourses = JSON.parse(JSON.stringify(workerCoursesResult.rows));
            // Also provide courses prop for consistency with student dashboard
            props.courses = JSON.parse(JSON.stringify(workerCoursesResult.rows));
        } catch (err) {
            console.log('Worker courses query failed, using empty array:', err.message);
            props.enrolledCourses = [];
            props.courses = [];
        }

        // Get real worker statistics from database
        let workerStats = {
            pending_tasks: 0,
            completed_tasks: 0,
            hours_this_week: 0,
            performance_rating: 0
        };
        
        try {
            // Try to get real worker tasks data
            const pendingTasksRes = await pool.query(`
                SELECT COUNT(*) as count FROM worker_tasks 
                WHERE assigned_to = $1 AND status = 'pending'
            `, [user.id]);
            
            const completedTasksRes = await pool.query(`
                SELECT COUNT(*) as count FROM worker_tasks 
                WHERE assigned_to = $1 AND status = 'completed'
            `, [user.id]);
            
            workerStats.pending_tasks = parseInt(pendingTasksRes.rows[0].count);
            workerStats.completed_tasks = parseInt(completedTasksRes.rows[0].count);
        } catch (err) {
            console.log('Worker tasks table not found, using defaults:', err.message);
        }
        
        props.stats = workerStats;

        // Get real assigned tasks from database
        let assignedTasks = [];
        try {
            const tasksRes = await pool.query(`
                SELECT wt.*, u.full_name as supervisor_name
                FROM worker_tasks wt
                LEFT JOIN users u ON wt.supervisor_id = u.id
                WHERE wt.assigned_to = $1 
                AND wt.status IN ('pending', 'in_progress')
                ORDER BY wt.due_date ASC
                LIMIT 10
            `, [user.id]);
            assignedTasks = JSON.parse(JSON.stringify(tasksRes.rows));
        } catch (err) {
            console.log('Worker tasks query failed, using empty array:', err.message);
        }
        props.assignedTasks = assignedTasks;

        // Get real notifications from database
        let recentNotifications = [];
        try {
            const notificationsRes = await pool.query(`
                SELECT id, title, message, created_at, read
                FROM notifications
                WHERE user_id = $1
                ORDER BY created_at DESC
                LIMIT 10
            `, [user.id]);
            recentNotifications = JSON.parse(JSON.stringify(notificationsRes.rows));
        } catch (err) {
            console.log('Notifications query failed, using empty array:', err.message);
        }
        props.recentNotifications = recentNotifications;

        // Get real work schedule from database
        let workSchedule = [];
        try {
            const scheduleRes = await pool.query(`
                SELECT id, time, title, location, date
                FROM worker_schedule
                WHERE worker_id = $1 AND date = CURRENT_DATE
                ORDER BY time ASC
            `, [user.id]);
            workSchedule = JSON.parse(JSON.stringify(scheduleRes.rows));
        } catch (err) {
            console.log('Worker schedule query failed, using empty array:', err.message);
        }
        props.workSchedule = workSchedule;
    }

    return { props };
    } catch (error) {
        console.error('Dashboard error:', error);
        
        // Fallback with basic user data
        return {
            props: {
                user,
                stats: {
                    total_users: 0,
                    total_courses: 0,
                    pending_payments: 0,
                    pending_requests: 0
                },
                recentUsers: [],
                recentCourses: [],
                pendingRequests: [],
                hasError: true
            }
        };
    }
});

export default DashboardPage;