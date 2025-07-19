import React, { useState } from 'react';
import Layout from '../components/Layout';
import { withAuth } from '../lib/withAuth';

import pool from '../lib/db';

const CoursesPage = ({ user, courses: initialCourses, enrolledCourses: initialEnrolledCourses }) => {
    const [courses, setCourses] = useState(initialCourses || []);
    const [enrolledCourses, setEnrolledCourses] = useState(initialEnrolledCourses || []);
    const [message, setMessage] = useState(null);

    // Add safety check for user
    if (!user) {
        return (
            <Layout user={null}>
                <div>Loading...</div>
            </Layout>
        );
    }

    const handleEnroll = async (courseId) => {
        if (!window.confirm('هل أنت متأكد من رغبتك في التقديم لهذه الدورة؟')) {
            return;
        }

        try {
            const response = await fetch(`/api/courses/${courseId}/enroll`, {
                method: 'POST'
            });
            const result = await response.json();
            setMessage({ text: result.message, isError: !response.ok });
            if (response.ok) {
                // Update the UI to reflect enrollment
                setCourses(prev => prev.filter(c => c.id !== courseId));
                // Refresh the page to show enrolled courses
                window.location.reload();
            }
        } catch (err) {
            setMessage({ text: 'حدث خطأ في الاتصال بالخادم.', isError: true });
        }
    };

    const handleUnenroll = async (courseId) => {
        if (!window.confirm('هل أنت متأكد من رغبتك في الانسحاب من هذه الدورة؟ يمكنك التقديم مرة أخرى لاحقاً.')) {
            return;
        }

        try {
            const response = await fetch(`/api/courses/${courseId}/unenroll`, {
                method: 'POST'
            });
            const result = await response.json();
            setMessage({ text: result.message, isError: !response.ok });
            if (response.ok) {
                // Update the UI to reflect unenrollment
                setEnrolledCourses(prev => prev.filter(c => c.id !== courseId));
                // Refresh the page to show available courses
                window.location.reload();
            }
        } catch (err) {
            setMessage({ text: 'حدث خطأ في الاتصال بالخادم.', isError: true });
        }
    };

    return (
        <Layout user={user}>
            <h1>الدورات المتاحة للتسجيل</h1>
            <p>تصفح الدورات المتاحة وتقدم للدورة التي تناسبك.</p>
            
            {/* Enrolled Courses Section */}
            {enrolledCourses.length > 0 && (
                <div style={{ marginBottom: '40px' }}>
                    <h2 style={{ color: '#dc3545', marginBottom: '20px' }}>
                        <i className="fas fa-clock"></i> الدورات المسجل بها (في انتظار المراجعة)
                    </h2>
                    <div className="enrolled-courses-container">
                        {enrolledCourses.map(course => (
                            <div className="course-card enrolled-course" key={course.id}>
                                <h3>{course.name}</h3>
                                <p>{course.description}</p>
                                <div className="course-details">
                                    <strong>التفاصيل:</strong>
                                    <div className="details-content">
                                        {course.details && typeof course.details === 'object' ? (
                                            Object.entries(course.details).map(([key, value]) => {
                                                const displayValue = Array.isArray(value) 
                                                    ? value.join(', ') 
                                                    : (typeof value === 'object' && value !== null)
                                                        ? JSON.stringify(value)
                                                        : String(value || '');
                                                
                                                // Arabic translation for common field names
                                                const arabicLabels = {
                                                    'name': 'الاسم',
                                                    'description': 'الوصف',
                                                    'duration': 'المدة',
                                                    'level': 'المستوى',
                                                    'instructor': 'المدرب',
                                                    'location': 'المكان',
                                                    'schedule': 'الجدول',
                                                    'requirements': 'المتطلبات',
                                                    'objectives': 'الأهداف',
                                                    'materials': 'المواد',
                                                    'price': 'السعر',
                                                    'capacity': 'السعة',
                                                    'start_date': 'تاريخ البداية',
                                                    'end_date': 'تاريخ النهاية',
                                                    'category': 'الفئة',
                                                    'type': 'النوع',
                                                    'cost': 'التكلفة',
                                                    'currency': 'العملة',
                                                    'teachers': 'المعلمون',
                                                    'instructors': 'المدربون',
                                                    'supervisor': 'المشرف',
                                                    'supervisors': 'المشرفون',
                                                    'trainer': 'المدرب',
                                                    'trainers': 'المدربون',
                                                    'facilitator': 'الميسر',
                                                    'facilitators': 'الميسرون',
                                                    'coordinator': 'المنسق',
                                                    'coordinators': 'المنسقون',
                                                    'assistant': 'المساعد',
                                                    'assistants': 'المساعدون',
                                                    'mentor': 'الموجه',
                                                    'mentors': 'الموجهون',
                                                    'guide': 'الدليل',
                                                    'guides': 'الأدلة',
                                                    'leader': 'القائد',
                                                    'leaders': 'القادة',
                                                    'manager': 'المدير',
                                                    'managers': 'المديرون',
                                                    'admin': 'المسؤول',
                                                    'admins': 'المسؤولون',
                                                    'organizer': 'المنظم',
                                                    'organizers': 'المنظمون',
                                                    'host': 'المضيف',
                                                    'hosts': 'المضيفون',
                                                    'speaker': 'المتحدث',
                                                    'speakers': 'المتحدثون',
                                                    'presenter': 'المقدم',
                                                    'presenters': 'المقدمون',
                                                    'expert': 'الخبير',
                                                    'experts': 'الخبراء',
                                                    'specialist': 'الأخصائي',
                                                    'specialists': 'الأخصائيون',
                                                    'consultant': 'الاستشاري',
                                                    'consultants': 'الاستشاريون',
                                                    'advisor': 'المستشار',
                                                    'advisors': 'المستشارون'
                                                };
                                                
                                                const arabicLabel = arabicLabels[key] || key;
                                                
                                                return (
                                                    <div key={key} className="detail-item">
                                                        <span className="detail-label">{arabicLabel}:</span>
                                                        <span className="detail-value">{displayValue}</span>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <span>{course.details || 'لا توجد تفاصيل إضافية'}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="course-status">
                                    <span className={`status-badge ${course.enrollment_status === 'pending_approval' ? 'approval' : 'pending'}`}>
                                        {course.enrollment_status === 'pending_approval' ? 'في انتظار الموافقة' : 'في انتظار الدفع'}
                                    </span>
                                </div>
                                <div className="enrollment-info">
                                    <small>تاريخ التسجيل: {new Date(course.enrollment_date).toLocaleDateString('ar-EG')}</small>
                                </div>
                                <div className="course-actions">
                                    <button 
                                        onClick={() => handleUnenroll(course.id)}
                                        className="unenroll-btn secondary"
                                    >
                                        ❌ إلغاء التسجيل
                                    </button>
                                    {course.enrollment_status === 'pending_payment' && (
                                        <button 
                                            onClick={() => window.location.href = '/student-finance'}
                                            className="payment-btn primary"
                                        >
                                            💳 دفع المصاريف لتأكيد الحجز
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {message && (
                <div style={{ color: message.isError ? 'red' : 'green', marginTop: '20px' }}>
                    {message.text}
                </div>
            )}
            <div id="courses-container" className="courses-container">
                {courses.map(course => (
                    <div className="course-card" key={course.id} style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '5px' }}>
                        <h3>{course.name}</h3>
                        <p>{course.description}</p>
                        <div className="course-details">
                            <strong>التفاصيل:</strong>
                            <div className="details-content">
                                {course.details && typeof course.details === 'object' ? (
                                    Object.entries(course.details).map(([key, value]) => {
                                        const displayValue = Array.isArray(value) 
                                            ? value.join(', ') 
                                            : (typeof value === 'object' && value !== null)
                                                ? JSON.stringify(value)
                                                : String(value || '');
                                        
                                        return (
                                            <div key={key} className="detail-item">
                                                <span className="detail-label">{key}:</span>
                                                <span className="detail-value">{displayValue}</span>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <span>{course.details || 'لا توجد تفاصيل إضافية'}</span>
                                )}
                            </div>
                        </div>
                        <div className="course-status">
                            <span className={`status-badge ${course.status}`}>
                                {course.status === 'active' ? 'نشطة' : 'متاحة للانضمام فيها'}
                            </span>
                        </div>
                        <button onClick={() => handleEnroll(course.id)}>التقديم الآن</button>
                    </div>
                ))}
            </div>

            {/* Message Display */}
            {message && (
                <div className={`message-overlay ${message.isError ? 'error' : 'success'}`}>
                    <div className="message-content">
                        <p>{message.text}</p>
                        <button onClick={() => setMessage(null)}>إغلاق</button>
                    </div>
                </div>
            )}

            <style jsx>{`
                .course-details {
                    margin: 10px 0;
                }
                .details-content {
                    margin-top: 5px;
                    padding: 10px;
                    background: #f8f9fa;
                    border-radius: 4px;
                }
                .detail-item {
                    display: flex;
                    margin-bottom: 5px;
                }
                .detail-label {
                    font-weight: bold;
                    margin-left: 10px;
                    min-width: 100px;
                }
                .detail-value {
                    flex: 1;
                }
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                }
                .modal-content {
                    background: white;
                    padding: 30px;
                    border-radius: 8px;
                    max-width: 500px;
                    width: 90%;
                    text-align: center;
                }
                .modal-actions {
                    margin-top: 20px;
                    display: flex;
                    gap: 10px;
                    justify-content: center;
                }
                .btn-confirm {
                    background: #28a745;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                }
                .btn-cancel {
                    background: #6c757d;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                }
                .message-overlay {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 1001;
                }
                .message-content {
                    padding: 15px 20px;
                    border-radius: 5px;
                    color: white;
                    max-width: 400px;
                }
                .message-overlay.success .message-content {
                    background: #28a745;
                }
                .message-overlay.error .message-content {
                    background: #dc3545;
                }
                .message-content button {
                    background: transparent;
                    border: 1px solid white;
                    color: white;
                    padding: 5px 10px;
                    border-radius: 3px;
                    cursor: pointer;
                    margin-top: 10px;
                }
                .course-status {
                    margin: 10px 0;
                }
                .status-badge {
                    display: inline-block;
                    padding: 5px 12px;
                    border-radius: 20px;
                    font-size: 0.85rem;
                    font-weight: 500;
                }
                .status-badge.active {
                    background: #d4edda;
                    color: #155724;
                }
                .status-badge.published {
                    background: #cce7ff;
                    color: #004085;
                }
                .status-badge.pending {
                    background: #fff3cd;
                    color: #856404;
                }
                .status-badge.approval {
                    background: #e2e3f1;
                    color: #6f42c1;
                }
                .enrolled-courses-container {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 20px;
                    margin-top: 20px;
                }
                .enrolled-course {
                    border-left: 4px solid #dc3545;
                    background: #fff5f5;
                }
                .enrollment-info {
                    margin: 10px 0;
                    color: #666;
                    font-style: italic;
                }
                .course-actions {
                    display: flex;
                    gap: 10px;
                    margin-top: 10px;
                    flex-wrap: wrap;
                }
                .payment-btn {
                    background-color: #28a745;
                    color: white;
                    padding: 10px 15px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 1rem;
                    font-family: 'Tajawal', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    font-weight: 500;
                    transition: background-color 0.3s ease;
                    flex: 1;
                    min-width: 150px;
                }
                .payment-btn:hover {
                    background-color: #218838;
                }
                .unenroll-btn {
                    background-color: #dc3545;
                    color: white;
                    padding: 10px 15px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 1rem;
                    font-family: 'Tajawal', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    font-weight: 500;
                    transition: background-color 0.3s ease;
                    flex: 1;
                    min-width: 150px;
                }
                .unenroll-btn:hover {
                    background-color: #c82333;
                }
            `}</style>
        </Layout>
    );
};

export const getServerSideProps = withAuth(async (context) => {
    const { user } = context;
    
    // Allow all authenticated users to access courses
    // No role restriction - anyone can view and enroll in courses

    try {
        // Get courses user can enroll in (not enrolled yet)
        const coursesResult = await pool.query(`
            SELECT c.* FROM courses c
            WHERE (c.status = 'active' OR (c.status = 'published' AND c.is_published = true))
            AND NOT EXISTS (
                SELECT 1 FROM enrollments e WHERE e.course_id = c.id AND e.user_id = $1
            )
            ORDER BY c.created_at DESC
        `, [user.id]);

        // Get courses user is enrolled in but can potentially withdraw from
        const enrolledCoursesResult = await pool.query(`
            SELECT c.*, e.status as enrollment_status, e.id as enrollment_id, c.created_at as enrollment_date
            FROM courses c
            JOIN enrollments e ON c.id = e.course_id
            WHERE e.user_id = $1 
            AND e.status IN ('pending_payment', 'pending_approval')
            AND (c.status = 'published' OR c.status = 'active')
            AND (c.start_date IS NULL OR c.start_date > CURRENT_DATE)
            ORDER BY c.created_at DESC
        `, [user.id]);

        return {
            props: {
                user: JSON.parse(JSON.stringify(user)),
                courses: JSON.parse(JSON.stringify(coursesResult.rows)),
                enrolledCourses: JSON.parse(JSON.stringify(enrolledCoursesResult.rows))
            }
        };
    } catch (err) {
        console.error('Courses page error:', err);
        return {
            props: {
                user: JSON.parse(JSON.stringify(user)),
                courses: [],
                enrolledCourses: []
            }
        };
    }
});

export default CoursesPage;
