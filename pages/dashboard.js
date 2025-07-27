import React from 'react';
import { withAuth } from '../lib/withAuth';
import pool from '../lib/db';
import { getDashboardStats } from '../lib/queryOptimizer';
import { safeSerialize, createSuccessResponse, createErrorResponse, REVALIDATION_TIMES } from '../lib/isrUtils';
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

        // Fast fallback for development mode with role-specific data
        if (process.env.NODE_ENV === 'development') {
            console.log('🚀 Dashboard development mode: Using fast fallback data for', user.role);
            
            let roleSpecificStats = {};
            
            // Add role-specific stats for development
            if (user.role === 'admin') {
                roleSpecificStats = {
                    total_users: 156,
                    total_courses: 25,
                    pending_payments: 8,
                    pending_requests: 3
                };
                
                // Also add sample data for admin-specific sections
                const recentUsers = [
                    { id: 1, full_name: 'أحمد محمد علي', email: 'ahmed@example.com', role: 'student', created_at: new Date().toISOString() },
                    { id: 2, full_name: 'فاطمة أحمد', email: 'fatima@example.com', role: 'teacher', created_at: new Date().toISOString() },
                    { id: 3, full_name: 'محمد حسن', email: 'mohamed@example.com', role: 'student', created_at: new Date().toISOString() }
                ];
                
                const recentCourses = [
                    { id: 1, name: 'دورة تعليم القرآن الكريم', status: 'active', created_at: new Date().toISOString() },
                    { id: 2, name: 'دورة اللغة العربية', status: 'published', created_at: new Date().toISOString() }
                ];
                
                const pendingRequests = [
                    { id: 1, user_name: 'علي أحمد', request_type: 'تعديل البيانات الشخصية', created_at: new Date().toISOString() },
                    { id: 2, user_name: 'سارة محمد', request_type: 'تغيير كلمة المرور', created_at: new Date().toISOString() },
                    { id: 3, user_name: 'خالد حسن', request_type: 'تحديث معلومات الاتصال', created_at: new Date().toISOString() }
                ];
                
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
                roleSpecificStats = {
                    pending_review_count: 5,
                    due_count: 12,
                    late_count: 3,
                    total_paid_this_month: 15750
                };
            } else if (user.role === 'head') {
                roleSpecificStats = {
                    teacher_count: 8,
                    student_count: 120,
                    published_courses_count: 18,
                    active_courses_count: 15,
                    draft_courses_count: 4
                };
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
            const dashboardStats = await getDashboardStats(user.role, user.id);
            console.log(`Dashboard stats for ${user.role}:`, dashboardStats);
            props.stats = dashboardStats;
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            // Provide fallback stats for admin
            if (user.role === 'admin') {
                props.stats = {
                    total_users: 0,
                    total_courses: 0,
                    pending_payments: 0,
                    pending_requests: 0
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

        // Worker statistics - using mock data for now since worker tables don't exist yet
        props.stats = {
            pending_tasks: Math.floor(Math.random() * 10) + 1,
            completed_tasks: Math.floor(Math.random() * 50) + 10,
            hours_this_week: Math.floor(Math.random() * 40) + 20,
            performance_rating: (Math.random() * 2 + 3).toFixed(1) // 3.0 to 5.0
        };

        // Mock assigned tasks
        props.assignedTasks = [
            {
                id: 1,
                title: 'مراجعة بيانات الطلاب الجدد',
                description: 'مراجعة وتدقيق بيانات الطلاب المسجلين حديثاً والتأكد من اكتمال المعلومات',
                priority: 'high',
                status: 'pending',
                due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
                supervisor_name: 'أحمد محمد'
            },
            {
                id: 2,
                title: 'إعداد تقرير أسبوعي',
                description: 'إعداد التقرير الأسبوعي لأنشطة القسم وإرساله للإدارة',
                priority: 'medium',
                status: 'in_progress',
                due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
                supervisor_name: 'فاطمة علي'
            },
            {
                id: 3,
                title: 'تحديث قاعدة البيانات',
                description: 'تحديث معلومات الدورات والمدربين في قاعدة البيانات',
                priority: 'low',
                status: 'pending',
                due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                supervisor_name: 'محمد سالم'
            }
        ];

        // Mock notifications
        props.recentNotifications = [
            {
                id: 1,
                title: 'مهمة جديدة',
                message: 'تم تكليفك بمهمة جديدة: مراجعة بيانات الطلاب',
                created_at: new Date().toISOString(),
                read: false
            },
            {
                id: 2,
                title: 'اجتماع القسم',
                message: 'اجتماع القسم الأسبوعي غداً الساعة 10 صباحاً',
                created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                read: true
            }
        ];

        // Mock work schedule
        props.workSchedule = [
            {
                id: 1,
                time: '09:00',
                title: 'اجتماع الفريق الصباحي',
                location: 'قاعة الاجتماعات'
            },
            {
                id: 2,
                time: '11:00',
                title: 'مراجعة البيانات',
                location: 'مكتب البيانات'
            },
            {
                id: 3,
                time: '14:00',
                title: 'تدريب على النظام الجديد',
                location: 'معمل الحاسوب'
            }
        ];
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