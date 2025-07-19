import React from 'react';
import Layout from '../../../components/Layout';
import { withAuth } from '../../../lib/withAuth';
import pool from '../../../lib/db';

const UserPerformancePage = ({ user, targetUser, performance }) => {
    if (!targetUser) {
        return (
            <Layout user={user}>
                <p>المستخدم غير موجود.</p>
            </Layout>
        );
    }

    return (
        <Layout user={user}>
            <h1><i className="fas fa-chart-line fa-fw"></i> تقارير أداء: {targetUser.full_name}</h1>
            <p>تابع تقدم {targetUser.full_name} الأكاديمي وتعرف على نقاط قوته.</p>
            <hr style={{ margin: '20px 0' }} />

            <div className="stats-grid">
                <div className="stat-card">
                    <i className="fas fa-star-half-alt"></i>
                    <h3>متوسط الدرجات العام</h3>
                    <p className="stat-number">{performance.average_grade ? parseFloat(performance.average_grade).toFixed(2) : 'N/A'}</p>
                </div>
                <div className="stat-card">
                    <i className="fas fa-tasks"></i>
                    <h3>المهام المكتملة</h3>
                    <p className="stat-number">{performance.graded_tasks}</p>
                </div>
            </div>

            {/* Charts will be added here later, similar to student performance page */}
            <p>سيتم إضافة الرسوم البيانية هنا لاحقاً.</p>

            <style jsx>{`
                .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
                .stat-card { background: #fff; padding: 25px; border-radius: 8px; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
                .stat-card i { font-size: 2.5rem; color: var(--primary-color); margin-bottom: 15px; }
                .stat-card h3 { color: #555; font-size: 1.1rem; }
                .stat-card .stat-number { font-size: 2rem; font-weight: bold; color: #333; margin-top: 5px; }
            `}</style>
        </Layout>
    );
};

export const getServerSideProps = withAuth(async (context) => {
    const { user, query } = context;
    const targetUserId = query.id;

    // Ensure only head or admin can view other user's performance
    if (user.role !== 'head' && user.role !== 'admin') {
        return { redirect: { destination: '/dashboard', permanent: false } };
    }

    let targetUser = null;
    let performance = {};

    try {
        const userResult = await pool.query('SELECT id, full_name, role FROM users WHERE id = $1', [targetUserId]);
        if (userResult.rows.length > 0) {
            targetUser = userResult.rows[0];

            // Fetch performance data (simplified for now, can be expanded)
            const gradedTasksResult = await pool.query(
                `SELECT COUNT(*) FROM submissions WHERE user_id = $1 AND status = 'graded'`,
                [targetUserId]
            );
            const averageGradeResult = await pool.query(
                `SELECT AVG(grade) FROM submissions WHERE user_id = $1 AND status = 'graded' AND grade IS NOT NULL`,
                [targetUserId]
            );

            performance = {
                graded_tasks: gradedTasksResult.rows[0].count,
                average_grade: averageGradeResult.rows[0].avg,
            };
        }
    } catch (err) {
        console.error("Error fetching user performance:", err);
    }

    return {
        props: {
            user: JSON.parse(JSON.stringify(user)),
            targetUser: targetUser ? JSON.parse(JSON.stringify(targetUser)) : null,
            performance: JSON.parse(JSON.stringify(performance)),
        },
    };
}, { roles: ['head', 'admin'] }); // Only head and admin can access this page

export default UserPerformancePage;
