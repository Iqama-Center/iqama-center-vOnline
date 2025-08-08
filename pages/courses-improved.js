import React from 'react';
import Layout from '../components/Layout';

/**
 * Simplified Courses Page - Build-Safe Version
 * This version uses only static data to ensure fast build times
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
 * Static Site Generation with immediate return
 * No database connections, no complex logic - just static data
 */
export async function getStaticProps() {
    console.log('Building courses-improved with static data');
    
    return {
        props: {
            publicCourses: [
                {
                    id: 1,
                    name: "دورة تعليم القرآن الكريم",
                    description: "دورة شاملة لتعليم القرآن الكريم والتجويد",
                    details: { category: "تعليم ديني" },
                    enrolled_count: 25,
                    course_fee: 300,
                    duration_days: 30,
                    teacher_name: "الأستاذ محمد أحمد"
                },
                {
                    id: 2,
                    name: "دورة اللغة العربية",
                    description: "تعلم اللغة العربية من الأساسيات",
                    details: { category: "لغات" },
                    enrolled_count: 18,
                    course_fee: 250,
                    duration_days: 45,
                    teacher_name: "الأستاذة فاطمة علي"
                }
            ],
            courseStats: {
                totalCourses: 25,
                totalStudents: 150,
                activeCourses: 20
            },
            lastUpdated: new Date().toISOString()
        },
        revalidate: 300
    };
}

export default ImprovedCoursesPage;