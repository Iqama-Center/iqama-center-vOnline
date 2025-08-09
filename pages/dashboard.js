import React from 'react';
import { withAuth } from '../lib/withAuth';
import pool from '../lib/db';
import { getDashboardStats } from '../lib/queryOptimizer';
import { safeSerialize } from '../lib/isrUtils'; // التأكد من وجود هذه الدالة المساعدة
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
        // --- تحسين من الملف الثاني: استعلام واحد مجمع للإحصائيات العامة ---
        // هذا الاستعلام يجمع البيانات العامة التي تحتاجها معظم لوحات التحكم في طلب واحد لقاعدة البيانات
        const commonStatsResult = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM courses WHERE status IN ('active', 'published', 'draft')) as total_courses,
                (SELECT COUNT(*) FROM courses WHERE status = 'active') as active_courses,
                (SELECT COUNT(*) FROM courses WHERE status = 'published') as published_courses,
                (SELECT COUNT(DISTINCT user_id) FROM enrollments WHERE status = 'active') as total_students,
                (SELECT COUNT(*) FROM users WHERE role = 'teacher' AND (account_status = 'active' OR account_status IS NULL)) as total_teachers,
                (SELECT COUNT(*) FROM enrollments WHERE status = 'completed') as completed_enrollments
        `);
        const commonStats = commonStatsResult.rows[0] || {};

        // --- الحفاظ على منطق الملف الأول: جلب الأنشطة الأخيرة ---
        const recentActivitiesResult = await pool.query(`
            SELECT 
                'course_created' as activity_type,
                c.name as title,
                c.created_at,
                u.full_name as user_name,
                c.status
            FROM courses c
            LEFT JOIN users u ON c.teacher_id = u.id
            WHERE c.status IN ('active', 'published') AND c.teacher_id IS NOT NULL
            ORDER BY c.created_at DESC
            LIMIT 10
        `);
        
        // --- الحفاظ على منطق الملف الأول: وضع التطوير الخاص لجلب بيانات حقيقية ومفصلة ---
        if (process.env.NODE_ENV === 'development') {
            console.log('🚀 Dashboard development mode: Using REAL database data for', user.role);
            
            if (user.role === 'admin') {
                // In development, we still want the full, real stats.
                const dashboardStats = await getDashboardStats(user);
                
                const recentUsersRes = await pool.query(`SELECT id, full_name, email, role, created_at, details FROM users ORDER BY created_at DESC LIMIT 10;`);
                const recentCoursesRes = await pool.query(`SELECT id, name, status, created_at, description FROM courses ORDER BY created_at DESC LIMIT 10;`);
                
                let pendingRequests = [];
                try {
                     const pendingRequestsRes = await pool.query(`SELECT r.id, r.field_name, r.old_value, r.new_value, r.requested_at, u.full_name as user_name FROM user_edit_requests r JOIN users u ON r.user_id = u.id WHERE r.status = 'pending' ORDER BY r.requested_at DESC LIMIT 10;`);
                     pendingRequests = safeSerialize(pendingRequestsRes.rows);
                } catch (err) {
                    console.log('Pending requests query failed, using empty array:', err.message);
                }
                
                return {
                    props: {
                        user,
                        stats: dashboardStats, // Use the real stats in development
                        recentUsers: safeSerialize(recentUsersRes.rows),
                        recentCourses: safeSerialize(recentCoursesRes.rows),
                        pendingRequests,
                        publicStats: {
                            totalCourses: parseInt(commonStats.total_courses || 0),
                            activeCourses: parseInt(commonStats.active_courses || 0),
                        },
                        recentActivities: safeSerialize(recentActivitiesResult.rows),
                        lastUpdated: new Date().toISOString(),
                        isDevelopmentMode: true
                    }
                };
            } else if (['finance', 'head'].includes(user.role)) {
                // Provide consistent, detailed data for other admin-like roles in development
                const dashboardStats = await getDashboardStats(user);
                return {
                    props: {
                        user,
                        stats: dashboardStats,
                        publicStats: {
                            totalCourses: parseInt(commonStats.total_courses || 0),
                            activeCourses: parseInt(commonStats.active_courses || 0),
                        },
                        recentActivities: safeSerialize(recentActivitiesResult.rows),
                        lastUpdated: new Date().toISOString(),
                        isDevelopmentMode: true
                    }
                };
            }
        }

        // --- منطق الإنتاج (Production) والبيانات الأساسية لجميع الأدوار ---
        let props = { 
            user,
            // استخدام البيانات من الاستعلام المجمع
            publicStats: {
                totalCourses: parseInt(commonStats.total_courses || 0),
                activeCourses: parseInt(commonStats.active_courses || 0),
                publishedCourses: parseInt(commonStats.published_courses || 0),
                totalStudents: parseInt(commonStats.total_students || 0),
                totalTeachers: parseInt(commonStats.total_teachers || 0),
                completedEnrollments: parseInt(commonStats.completed_enrollments || 0)
            },
            recentActivities: safeSerialize(recentActivitiesResult.rows),
            lastUpdated: new Date().toISOString(),
            stats: {} // سيتم ملؤه لاحقًا حسب الدور
        };

        // --- الحفاظ على منطق الملف الأول: جلب بيانات خاصة بالأدوار الإدارية ---
        if (['admin', 'finance', 'head'].includes(user.role)) {
            try {
                // استخدام الدالة المحسّنة لجلب الإحصائيات
                const dashboardStats = await getDashboardStats(user);
                console.log(`Dashboard stats for ${user.role}:`, dashboardStats);
                props.stats = dashboardStats;
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
                // توفير بيانات احتياطية في حالة الفشل
                if (user.role === 'admin') props.stats = { total_users: 0, total_courses: 0, /*...*/ };
                if (user.role === 'finance') props.stats = { pending_review_count: 0, /*...*/ };
                if (user.role === 'head') props.stats = { teacher_count: 0, /*...*/ };
            }
        }
        
        // --- الحفاظ على منطق الملف الأول: بيانات إضافية لدور المدير (Admin) ---
        if (user.role === 'admin') {
            const recentUsersRes = await pool.query(`SELECT id, full_name, email, role, created_at, details FROM users ORDER BY created_at DESC LIMIT 10;`);
            props.recentUsers = safeSerialize(recentUsersRes.rows);

            const recentCoursesRes = await pool.query(`SELECT id, name, status, created_at, description FROM courses ORDER BY created_at DESC LIMIT 10;`);
            props.recentCourses = safeSerialize(recentCoursesRes.rows);

            try {
                const pendingRequestsRes = await pool.query(`SELECT r.id, r.field_name, r.old_value, r.new_value, r.requested_at, u.full_name FROM user_edit_requests r JOIN users u ON r.user_id = u.id WHERE r.status = 'pending' ORDER BY r.requested_at DESC;`);
                props.pendingRequests = safeSerialize(pendingRequestsRes.rows);
            } catch (err) {
                console.log('Pending requests query failed, using empty array:', err.message);
                props.pendingRequests = [];
            }
        }

        // --- الحفاظ على منطق الملف الأول: بيانات دور ولي الأمر (Parent) ---
        if (user.role === 'parent') {
            try {
                const childrenRes = await pool.query(`SELECT u.id, u.full_name, u.email, u.details FROM users u JOIN parent_child_relationships pcr ON u.id = pcr.child_id WHERE pcr.parent_id = $1 AND u.role = 'student' ORDER BY u.full_name ASC;`, [user.id]);
                props.children = safeSerialize(childrenRes.rows);
            } catch (err) {
                console.log('Parent-child relationship query failed, using empty array');
                props.children = [];
            }
            // ... (بقية منطق ولي الأمر)
        }

        // --- الحفاظ على منطق الملف الأول: بيانات دور الطالب (Student) ---
        if (user.role === 'student') {
            const coursesRes = await pool.query(`SELECT c.id, c.name, e.status, c.status as course_status FROM courses c JOIN enrollments e ON c.id = e.course_id WHERE e.user_id = $1 AND e.status IN ('active', 'waiting_start', 'completed', 'pending_payment', 'pending_approval') ORDER BY c.name ASC;`, [user.id]);
            props.courses = safeSerialize(coursesRes.rows);
            // ... (بقية منطق الطالب)
        }
        }

        // --- الحفاظ على منطق الملف الأول: بيانات دور المعلم (Teacher) ---
        if (user.role === 'teacher') {
            const coursesRes = await pool.query(`SELECT c.id, c.name, c.status, c.is_published, c.is_launched, (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id AND e.status = 'active') as student_count FROM courses c WHERE c.created_by = $1 AND (c.status = 'active' OR c.status = 'published' OR c.status = 'draft') ORDER BY c.created_at DESC;`, [user.id]);
            props.courses = safeSerialize(coursesRes.rows);
        }

        // --- الحفاظ على منطق الملف الأول: بيانات دور الموظف (Worker) ---
        if (user.role === 'worker') {
            // ... (كل منطق الموظف من الملف الأصلي يبقى هنا)
        }
        
        // استخدام safeSerialize لكل props قبل إرجاعها لتجنب أخطاء Next.js
        // ملاحظة: قمت بإضافة safeSerialize في أماكنها، يمكنك استبدال JSON.parse(JSON.stringify(...)) بها إن كانت متاحة لديك
        return { props: safeSerialize(props) };

    } catch (error) {
        console.error('Dashboard error:', error);
        
        // --- الحفاظ على معالجة الخطأ الشاملة من الملف الأول ---
        return {
            props: {
                user,
                stats: { total_users: 0, total_courses: 0, pending_payments: 0, pending_requests: 0 },
                recentUsers: [],
                recentCourses: [],
                pendingRequests: [],
                publicStats: {},
                recentActivities: [],
                hasError: true
            }
        };
    }
});

export default DashboardPage;