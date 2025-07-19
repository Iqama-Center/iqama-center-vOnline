import React from 'react';
import Layout from '../../../components/Layout';
import CourseMessages from '../../../components/CourseMessages';
import { withAuth } from '../../../lib/withAuth';
import pool from '../../../lib/db';
import { safeProps, serializeDbRow } from '../../../lib/serializer';

const CourseMessagesPage = ({ user, course }) => {
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
            `}</style>

            <a href={`/courses/${course.id}`} className="back-link">
                ← العودة إلى صفحة الدورة
            </a>

            <div className="page-header">
                <h1>💬 مساحة المشاركة - {course.name}</h1>
            </div>

            <div className="course-info">
                <p><strong>وصف الدورة:</strong> {course.description}</p>
                <p><strong>حالة الدورة:</strong> {course.status === 'active' ? 'نشطة' : 'غير نشطة'}</p>
            </div>

            <CourseMessages courseId={course.id} user={user} />
        </Layout>
    );
};

export const getServerSideProps = withAuth(async (context) => {
    const { id } = context.params;

    try {
        // Get course details
        const courseResult = await pool.query('SELECT * FROM courses WHERE id = $1', [id]);
        
        if (courseResult.rows.length === 0) {
            return { notFound: true };
        }

        const course = courseResult.rows[0];

        // Check if user is enrolled in this course
        const enrollment = await pool.query(
            'SELECT * FROM enrollments WHERE user_id = $1 AND course_id = $2 AND status = $3',
            [context.user.id, id, 'active']
        );

        if (enrollment.rows.length === 0 && !['admin', 'head'].includes(context.user.role)) {
            return {
                redirect: {
                    destination: `/courses/${id}`,
                    permanent: false,
                },
            };
        }

        return {
            props: safeProps({
                user: context.user,
                course: serializeDbRow(course)
            })
        };
    } catch (error) {
        console.error('Error fetching course:', error);
        return { notFound: true };
    }
});

export default CourseMessagesPage;