import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import CourseScheduling from '../../../components/CourseScheduling';
import { withAuth } from '../../../lib/withAuth';

const CourseSchedulePage = ({ user }) => {
    const router = useRouter();
    const { id } = router.query;
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchCourse();
        }
    }, [id, fetchCourse]);

    const fetchCourse = useCallback(async () => {
        try {
            const response = await fetch(`/api/courses/${id}`);
            if (response.ok) {
                const data = await response.json();
                setCourse(data);
            } else {
                alert('خطأ في تحميل بيانات الدورة');
                router.push('/admin/courses/manage');
            }
        } catch (error) {
            console.error('Error fetching course:', error);
            alert('خطأ في تحميل بيانات الدورة');
            router.push('/admin/courses/manage');
        } finally {
            setLoading(false);
        }
    }, [id, router]);

    const handleScheduleUpdate = (schedule) => {
        console.log('Schedule updated:', schedule);
    };

    if (loading) {
        return (
            <Layout user={user}>
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem' }}></i>
                    <p>جاري تحميل بيانات الدورة...</p>
                </div>
            </Layout>
        );
    }

    if (!course) {
        return (
            <Layout user={user}>
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <h2>الدورة غير موجودة</h2>
                    <button onClick={() => router.push('/admin/courses/manage')}>
                        العودة إلى قائمة الدورات
                    </button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout user={user}>
            <div className="course-schedule-page">
                <style jsx>{`
                    .course-schedule-page {
                        max-width: 1200px;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    .page-header {
                        background: white;
                        padding: 25px;
                        border-radius: 8px;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                        margin-bottom: 30px;
                    }
                    .page-header h1 {
                        margin: 0 0 10px 0;
                        color: #333;
                    }
                    .course-info {
                        color: #666;
                        margin-bottom: 20px;
                    }
                    .back-btn {
                        background: #6c757d;
                        color: white;
                        padding: 10px 20px;
                        border: none;
                        border-radius: 5px;
                        text-decoration: none;
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                        cursor: pointer;
                    }
                    .back-btn:hover {
                        background: #5a6268;
                    }
                `}</style>

                <div className="page-header">
                    <h1><i className="fas fa-calendar-alt"></i> جدولة الدورة: {course.name}</h1>
                    <div className="course-info">
                        <p><strong>الوصف:</strong> {course.description}</p>
                        <p><strong>مدة الدورة:</strong> {course.duration_days} يوم</p>
                        <p><strong>أيام الأسبوع:</strong> {course.days_per_week} أيام</p>
                        <p><strong>ساعات اليوم:</strong> {course.hours_per_day} ساعة</p>
                    </div>
                    <button 
                        className="back-btn"
                        onClick={() => router.push('/admin/courses/manage')}
                    >
                        <i className="fas fa-arrow-right"></i>
                        العودة إلى قائمة الدورات
                    </button>
                </div>

                <CourseScheduling 
                    courseId={id} 
                    onScheduleUpdate={handleScheduleUpdate}
                />
            </div>
        </Layout>
    );
};

export default CourseSchedulePage;

export const getServerSideProps = withAuth(async (context) => {
    const { user } = context;
    
    return {
        props: {
            user: JSON.parse(JSON.stringify(user))
        }
    };
}, { roles: ['admin', 'head', 'teacher'] }); // Adjust roles as needed