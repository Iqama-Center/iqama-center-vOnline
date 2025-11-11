import React from 'react';
import Link from 'next/link';
import Layout from '../../../components/Layout';
import CourseMessages from '../../../components/CourseMessages';
import { withAuth } from '../../../lib/withAuth';
import pool from '../../../lib/db';
import { safeProps, serializeDbRow } from '../../../lib/serializer';

const CourseMessagesPage = ({ user, course, enrollmentStatus }) => {
    return (
        <Layout user={user}>
            <style jsx>{`
                .page-header {
                    margin-bottom: 20px;
                    border-bottom: 1px solid #eee;
                    padding-bottom: 15px;
                }
                .course-info {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                }
                .back-link {
                    display: inline-block;
                    margin-bottom: 15px;
                    color: var(--primary-color);
                    text-decoration: none;
                }
                .back-link:hover {
                    text-decoration: underline;
                }
                .status-highlight {
                    font-weight: bold;
                    color: #28a745;
                }
            `}</style>

            <a href={`/courses/${course.id}`} className="back-link">
                <i className="fas fa-arrow-right"></i> العودة إلى صفحة الدورة
            </a>

            <div className="page-header">
                <h1><i className="fas fa-comments"></i> ساحة النقاش - {course.name}</h1>
                <p>مكان لطرح الأسئلة ومشاركة الأفكار مع زملائك والمدرس.</p>
            </div>

            <div className="course-info">
                <p><strong>وصف الدورة:</strong> {course.description}</p>
                <p><strong>حالة التسجيل:</strong> <span className="status-highlight">{enrollmentStatus}</span></p>
            </div>

            <CourseMessages courseId={course.id} user={user} />
        </Layout>
    );
};

export const getServerSideProps = withAuth(async (context) => {
    const { id } = context.params;
    const { user } = context;
    let client;

    try {
        client = await pool.connect();
        
        // Get course details
        const courseResult = await client.query('SELECT * FROM courses WHERE id = $1', [id]);
        
        if (courseResult.rows.length === 0) {
            return { notFound: true };
        }
        const course = courseResult.rows[0];

        // Check user's enrollment status
        const enrollmentRes = await client.query(
            `SELECT status, 
                    CASE status
                        WHEN 'active' THEN 'نشط'
                        WHEN 'completed' THEN 'مكتمل'
                        WHEN 'pending_payment' THEN 'في انتظار الدفع'
                        ELSE 'غير مسجل'
                    END as status_arabic
             FROM enrollments 
             WHERE user_id = $1 AND course_id = $2`,
            [user.id, id]
        );

        const enrollment = enrollmentRes.rows[0];
        const enrollmentStatus = enrollment ? enrollment.status_arabic : 'غير مسجل';

        // Allow access only if enrolled, or if user is an admin/head
        if (!enrollment && !['admin', 'head', 'teacher'].includes(user.role)) {
            return {
                redirect: {
                    destination: `/courses/${id}`,
                    permanent: false,
                },
                props: {},
            };
        }

        return {
            props: safeProps({
                user,
                course: serializeDbRow(course),
                enrollmentStatus,
            })
        };
    } catch (error) {
        console.error('Error fetching course messages page:', error);
        return { notFound: true };
    } finally {
        if (client) client.release();
    }
});

export default CourseMessagesPage;