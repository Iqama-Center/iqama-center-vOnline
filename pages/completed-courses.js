import React from 'react';
import Layout from '../components/Layout';
import { withAuth } from '../lib/withAuth';
import pool from '../lib/db';
import Link from 'next/link';

const CompletedCoursesPage = ({ user, completedCourses }) => {
    return (
        <Layout user={user}>
            <h1><i className="fas fa-graduation-cap fa-fw"></i> الدورات المكتملة والشهادات</h1>
            <p>هنا يمكنك عرض الدورات التي أكملتها بنجاح وتنزيل شهاداتك.</p>

            <div className="courses-list">
                {completedCourses.length > 0 ? completedCourses.map(course => (
                    <div key={course.enrollment_id} className="course-card">
                        <div className="course-details">
                            <h3>{course.course_name}</h3>
                            <p>تاريخ الإكمال: {new Date(course.issue_date).toLocaleDateString('ar-EG')}</p>
                            <p>الدرجة النهائية: {course.grade}</p>
                        </div>
                        <div className="course-actions">
                            <Link href={`/certificate/${course.certificate_code}`} legacyBehavior>
                                <a className="btn-primary" target="_blank">عرض الشهادة</a>
                            </Link>
                        </div>
                    </div>
                )) : (
                    <p>لم تكمل أي دورات بعد.</p>
                )}
            </div>
        </Layout>
    );
};

export const getServerSideProps = withAuth(async (context) => {
    const { user } = context;
    const coursesRes = await pool.query(`
        SELECT 
            c.name as course_name,
            cert.id as certificate_id,
            cert.issue_date,
            cert.certificate_code,
            cert.grade,
            e.id as enrollment_id
        FROM certificates cert
        JOIN enrollments e ON cert.enrollment_id = e.id
        JOIN courses c ON e.course_id = c.id
        WHERE e.user_id = $1 AND e.status = 'completed'
        ORDER BY cert.issue_date DESC;
    `, [user.id]);

    return {
        props: {
            user,
            completedCourses: JSON.parse(JSON.stringify(coursesRes.rows))
        }
    };
});

export default CompletedCoursesPage;