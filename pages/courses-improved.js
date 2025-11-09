import React from 'react';
import Layout from '../components/Layout';
import pool from '../lib/db'; // Import the database pool
import { safeSerialize } from '../lib/isrUtils'; // To safely serialize dates

/**
 * Simplified Courses Page - Build-Safe Version
 * This version now uses static data fetched at build time
 */
const ImprovedCoursesPage = ({ 
    publicCourses = [], 
    courseStats = {}, 
    lastUpdated 
}) => {
    return (
        <Layout user={null}>
            <div style={{ padding: '20px', fontFamily: 'Tajawal, sans-serif' }}>
                <h1>الدورات المتاحة</h1>
                
                <div style={{ marginBottom: '20px' }}>
                    <h3>إحصائيات الدورات</h3>
                    <p>إجمالي الدورات: {courseStats.totalCourses || 0}</p>
                    <p>إجمالي الطلاب: {courseStats.totalStudents || 0}</p>
                    <p>الدورات النشطة: {courseStats.activeCourses || 0}</p>
                </div>

                <div>
                    <h3>الدورات المتاحة</h3>
                    {publicCourses.length > 0 ? (
                        <div style={{ display: 'grid', gap: '20px' }}>
                            {publicCourses.map(course => (
                                <div key={course.id} style={{ 
                                    border: '1px solid #ddd', 
                                    padding: '15px', 
                                    borderRadius: '8px' 
                                }}>
                                    <h4>{course.name}</h4>
                                    <p>{course.description}</p>
                                    <p>المدرس: {course.teacher_name}</p>
                                    <p>الرسوم: {course.course_fee} ريال</p>
                                    <p>المدة: {course.duration_days} يوم</p>
                                    <p>عدد المسجلين: {course.enrolled_count}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p>لا توجد دورات متاحة حالياً</p>
                    )}
                </div>

                <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
                    آخر تحديث: {lastUpdated}
                </div>
            </div>
        </Layout>
    );
};

/**
 * Static Site Generation with data from the database
 */
export async function getStaticProps() {
    console.log('Building courses-improved with data from database...');
    
    try {
        const client = await pool.connect();

        // Fetch public courses with teacher name and enrollment count
        const coursesRes = await client.query(`
            SELECT 
                c.id,
                c.name,
                c.description,
                c.course_fee,
                c.duration_days,
                u.full_name as teacher_name,
                COUNT(e.id) as enrolled_count
            FROM courses c
            LEFT JOIN users u ON c.teacher_id = u.id
            LEFT JOIN enrollments e ON c.id = e.course_id
            WHERE c.is_public = true AND c.is_published = true
            GROUP BY c.id, u.full_name
            ORDER BY c.created_at DESC;
        `);

        // Fetch overall stats
        const statsRes = await client.query(`
            SELECT
                (SELECT COUNT(*) FROM courses WHERE is_published = true) as active_courses,
                (SELECT COUNT(*) FROM courses) as total_courses,
                (SELECT COUNT(*) FROM users WHERE role = 'student') as total_students;
        `);
        
        client.release();

        const courseStats = {
            totalCourses: statsRes.rows[0].total_courses,
            totalStudents: statsRes.rows[0].total_students,
            activeCourses: statsRes.rows[0].active_courses,
        };

        return {
            props: {
                publicCourses: safeSerialize(coursesRes.rows),
                courseStats: safeSerialize(courseStats),
                lastUpdated: new Date().toISOString()
            },
            revalidate: 300 // Re-generate the page every 5 minutes
        };

    } catch (error) {
        console.error('Failed to get static props for courses-improved:', error);
        // Return empty data on error to prevent build failure
        return {
            props: {
                publicCourses: [],
                courseStats: {},
                lastUpdated: new Date().toISOString()
            },
            revalidate: 60 // Try again after a minute
        };
    }
}

export default ImprovedCoursesPage;