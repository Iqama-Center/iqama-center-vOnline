import React from 'react';
import { withAuth } from '../lib/withAuth';
import pool from '../lib/db';
import { getDashboardStats } from '../lib/queryOptimizer';
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

export const getServerSideProps = withAuth(async (context) => {
    const { user } = context;
    let props = { user };

    if (['finance', 'admin', 'head'].includes(user.role)) {
        props.stats = await getDashboardStats(user.role, user.id);
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
});

export default DashboardPage;