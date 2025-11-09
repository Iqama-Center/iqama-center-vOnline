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

const PerformancePage = ({ user, performance, publicPerformanceStats, courseAverages, benchmarks, trends, lastUpdated }) => {
    const timelineData = {
        labels: (performance.timeline || []).map(d => d.title),
        datasets: [{
            label: 'الدرجة',
            data: (performance.timeline || []).map(d => d.grade),
            borderColor: 'rgba(54, 162, 235, 1)',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            fill: true,
            tension: 0.1
        }]
    };

    const coursePerformanceData = {
        labels: (performance.course_performance || []).map(c => c.name),
        datasets: [{
            label: 'متوسط الدرجة',
            data: (performance.course_performance || []).map(c => c.course_avg),
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

export const getServerSideProps = withAuth(async (context) => {
    const { user } = context;
    try {
        const result = await pool.query(
            `SELECT get_user_performance_dashboard($1) as dashboard_data;`,
            [user.id]
        );
        const data = result.rows[0].dashboard_data || {};

        // The frontend expects some specific formatting for benchmarks, let's do it here
        const formattedBenchmarks = {
            avgCompletionRate: parseFloat(data.benchmarks?.avg_completion_rate || 0),
            totalCourses: parseInt(data.benchmarks?.total_courses || 0),
            totalParticipants: parseInt(data.benchmarks?.total_participants || 0),
            avgCompletionDays: parseFloat(data.benchmarks?.avg_completion_days || 0)
        };

        return {
            props: {
                user,
                performance: data.performance || { average_grade: 0, graded_tasks: 0, timeline: [], course_performance: [] },
                publicPerformanceStats: data.publicStats || {},
                courseAverages: data.courseAverages || [],
                benchmarks: formattedBenchmarks,
                trends: data.trends || [],
                lastUpdated: new Date().toISOString()
            },
        };
    } catch (error) {
        console.error('Performance page error:', error);
        // Return empty props on error to prevent page crash
        return {
            props: {
                user,
                performance: { average_grade: 0, graded_tasks: 0, timeline: [], course_performance: [] },
                publicPerformanceStats: {},
                courseAverages: [],
                benchmarks: { avgCompletionRate: 0, totalCourses: 0, totalParticipants: 0, avgCompletionDays: 0 },
                trends: [],
                lastUpdated: new Date().toISOString()
            }
        };
    }
});

export default PerformancePage;