import React from 'react';
import Layout from '../components/Layout';
import { withAuth } from '../lib/withAuth';

import pool from '../lib/db';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);


const PerformancePage = ({ user, performance }) => {
    const timelineData = {
        labels: performance.timeline.map(d => d.title),
        datasets: [{
            label: 'الدرجة',
            data: performance.timeline.map(d => d.grade),
            borderColor: 'rgba(54, 162, 235, 1)',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            fill: true,
            tension: 0.1
        }]
    };

    const coursePerformanceData = {
        labels: performance.course_performance.map(c => c.name),
        datasets: [{
            label: 'م��وسط الدرجة',
            data: performance.course_performance.map(c => c.course_avg),
            backgroundColor: [
                'rgba(255, 99, 132, 0.5)',
                'rgba(54, 162, 235, 0.5)',
                'rgba(255, 206, 86, 0.5)',
                'rgba(75, 192, 192, 0.5)',
            ]
        }]
    };

    return (
        <Layout user={user}>
            <h1><i className="fas fa-chart-line fa-fw"></i> تقارير الأداء</h1>
            <p>تابع تقدمك الأكاديمي وتعرف على نقاط قوتك.</p>
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
            <div className="chart-container">
                <h3>الأداء عبر الزمن (آخر 10 مهام)</h3>
                <Line data={timelineData} options={{ scales: { y: { beginAtZero: true, max: 100 } } }} />
            </div>
            <div className="chart-container">
                <h3>متوسط الأداء حسب الدورة</h3>
                <Bar data={coursePerformanceData} options={{ scales: { y: { beginAtZero: true, max: 100 } } }} />
            </div>
        </Layout>
    );
};

/**
 * Server-side rendering for user-specific performance data
 * Note: Using SSR only since this page requires authentication
 */
export const getServerSideProps = withAuth(async (context) => {
    const { user } = context;
    
    try {
        // Get public performance statistics and benchmarks
        const publicStatsResult = await pool.query(`
            SELECT 
                AVG(grade) as avg_grade_all_users,
                COUNT(*) as total_submissions,
                COUNT(DISTINCT user_id) as active_users,
                MAX(grade) as highest_grade,
                MIN(grade) as lowest_grade
            FROM submissions 
            WHERE status = 'graded' AND grade IS NOT NULL
        `);

        // Get course performance averages
        const courseAvgResult = await pool.query(`
            SELECT 
                c.name,
                AVG(s.grade) as course_avg,
                COUNT(s.id) as submission_count
            FROM submissions s
            JOIN tasks t ON s.task_id = t.id
            JOIN course_schedule cs ON t.schedule_id = cs.id
            JOIN courses c ON cs.course_id = c.id
            WHERE s.status = 'graded' AND s.grade IS NOT NULL
            GROUP BY c.id, c.name
            ORDER BY course_avg DESC
            LIMIT 10
        `);

        // Get public performance benchmarks directly in SSR
        const benchmarksResult = await pool.query(`
            SELECT 
                AVG(CASE WHEN e.status = 'completed' THEN 100 ELSE 0 END) as avg_completion_rate,
                COUNT(DISTINCT c.id) as total_courses,
                COUNT(DISTINCT e.user_id) as total_participants,
                AVG(CASE WHEN e.status = 'completed' THEN 
                    EXTRACT(EPOCH FROM (e.updated_at - e.created_at)) / 86400 
                    ELSE NULL END) as avg_completion_days
            FROM courses c
            LEFT JOIN enrollments e ON c.id = e.course_id
            WHERE c.status IN ('active', 'published')
            AND c.created_at >= CURRENT_DATE - INTERVAL '12 months'
        `);

        // Get performance trends
        const trendsResult = await pool.query(`
            SELECT 
                DATE_TRUNC('month', e.created_at) as month,
                COUNT(*) as enrollments,
                COUNT(CASE WHEN e.status = 'completed' THEN 1 END) as completions,
                ROUND(COUNT(CASE WHEN e.status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 2) as completion_rate
            FROM enrollments e
            WHERE e.created_at >= CURRENT_DATE - INTERVAL '12 months'
            GROUP BY DATE_TRUNC('month', e.created_at)
            ORDER BY month DESC
            LIMIT 12
        `);
    // استعلام لجلب متوسط الدرجات وعدد المهام المصححة
    const statsQuery = `
        SELECT 
            AVG(grade) as average_grade, 
            COUNT(*) as graded_tasks 
        FROM submissions 
        WHERE user_id = $1 AND status = 'graded'`;
    const statsResult = await pool.query(statsQuery, [user.id]);
    // استعلام لجلب آخر 10 مهام مع درجاتها
    const timelineQuery = `
        SELECT t.title, s.grade 
        FROM submissions s 
        JOIN tasks t ON s.task_id = t.id 
        WHERE s.user_id = $1 AND s.status = 'graded' 
        ORDER BY s.submitted_at DESC 
        LIMIT 10`;
    const timelineResult = await pool.query(timelineQuery, [user.id]);
    // استعلام لجلب متوسط أداء الطالب في كل دورة
    const coursePerfQuery = `
        SELECT c.name, AVG(s.grade) as course_avg
        FROM submissions s
        JOIN tasks t ON s.task_id = t.id
        JOIN course_schedule cs ON t.schedule_id = cs.id
        JOIN courses c ON cs.course_id = c.id
        WHERE s.user_id = $1 AND s.status = 'graded'
        GROUP BY c.name`;
    const coursePerfResult = await pool.query(coursePerfQuery, [user.id]);
    const performance = {
        average_grade: statsResult.rows[0].average_grade || 0,
        graded_tasks: statsResult.rows[0].graded_tasks || 0,
        timeline: timelineResult.rows.reverse(),
        course_performance: coursePerfResult.rows,
    };
    const publicStats = publicStatsResult.rows[0] || {};
    const courseAverages = courseAvgResult.rows || [];
    const benchmarks = benchmarksResult.rows[0] || {};
    const trends = trendsResult.rows || [];

    return {
        props: {
            user,
            publicPerformanceStats: JSON.parse(JSON.stringify(publicStats)),
            courseAverages: JSON.parse(JSON.stringify(courseAverages)),
            benchmarks: {
                avgCompletionRate: parseFloat(benchmarks.avg_completion_rate || 0),
                totalCourses: parseInt(benchmarks.total_courses || 0),
                totalParticipants: parseInt(benchmarks.total_participants || 0),
                avgCompletionDays: parseFloat(benchmarks.avg_completion_days || 0)
            },
            trends: JSON.parse(JSON.stringify(trends)),
            performance: JSON.parse(JSON.stringify(performance)),
            lastUpdated: new Date().toISOString()
        },
    };
    } catch (error) {
        console.error('Performance page error:', error);
        
        return {
            props: {
                user,
                publicPerformanceStats: {},
                courseAverages: [],
                benchmarks: {
                    avgCompletionRate: 0,
                    totalCourses: 0,
                    totalParticipants: 0,
                    avgCompletionDays: 0
                },
                trends: [],
                performance: {
                    average_grade: 0,
                    graded_tasks: 0,
                    timeline: [],
                    course_performance: []
                },
                lastUpdated: new Date().toISOString()
            }
        };
    }
});

export default PerformancePage;
