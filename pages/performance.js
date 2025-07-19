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

export const getServerSideProps = withAuth(async (context) => {
    const { user } = context;
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
    return {
        props: {
            user,
            performance: JSON.parse(JSON.stringify(performance)),
        },
    };
});

export default PerformancePage;
