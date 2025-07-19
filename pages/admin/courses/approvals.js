
import React, { useState } from 'react';
import Layout from '../../../components/Layout';
import { withAuth } from '../../../lib/withAuth';
import pool from '../../../lib/db';
import { useRouter } from 'next/router';

const CourseApprovalPage = ({ user, courses: initialCourses }) => {
    const [courses, setCourses] = useState(initialCourses);
    const router = useRouter();

    const handleApproval = async (courseId, newStatus) => {
        const action = newStatus === 'approved' ? 'الموافقة على' : 'رفض';
        if (!confirm(`هل أنت متأكد من ${action} هذه الدورة؟`)) return;

        try {
            const response = await fetch(`/api/courses/${courseId}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                setCourses(prev => prev.filter(c => c.id !== courseId));
                router.replace(router.asPath); // Refresh data
            } else {
                const result = await response.json();
                alert(`خطأ: ${result.message}`);
            }
        } catch (err) {
            alert('حدث خطأ في الاتصال بالخادم.');
        }
    };

    return (
        <Layout user={user}>
            <style jsx>{`
                .courses-list { display: flex; flex-direction: column; gap: 20px; }
                .course-card {
                    background: #fff;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .course-details h3 { margin: 0 0 10px 0; }
                .course-details p { margin: 0; color: #555; }
                .course-actions { display: flex; gap: 10px; }
            `}</style>
            <h1><i className="fas fa-check-double fa-fw"></i> الموافقة على الدورات</h1>
            <p>مراجعة الدورات المقترحة من قبل المعلمين والموافقة عليها أو رفضها.</p>

            <div className="courses-list">
                {courses.length > 0 ? courses.map(course => (
                    <div key={course.id} className="course-card">
                        <div className="course-details">
                            <h3>{course.name}</h3>
                            <p>مقدم من: {course.created_by_name}</p>
                            <p>الحالة الحالية: {course.status}</p>
                        </div>
                        <div className="course-actions">
                            <button onClick={() => handleApproval(course.id, 'approved')} className="btn-save">موافقة</button>
                            <button onClick={() => handleApproval(course.id, 'rejected')} className="btn-danger">رفض</button>
                        </div>
                    </div>
                )) : (
                    <p>لا توجد دورات حالياً بانتظار الموافقة.</p>
                )}
            </div>
        </Layout>
    );
};

export const getServerSideProps = withAuth(async (context) => {
    const coursesResult = await pool.query(`
        SELECT c.*, u.full_name as created_by_name
        FROM courses c
        JOIN users u ON c.created_by = u.id
        WHERE c.status = 'pending_approval'
        ORDER BY c.created_at ASC
    `);

    return {
        props: {
            user: context.user,
            courses: JSON.parse(JSON.stringify(coursesResult.rows))
        }
    };
}, { roles: ['head', 'admin'] });

export default CourseApprovalPage;
