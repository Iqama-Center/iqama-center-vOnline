import React, { useState } from 'react';
import Layout from '../components/Layout';
import { withAuth } from '../lib/withAuth';
import pool from '../lib/db';
import { getFilteredCourses } from '../lib/queryOptimizer';
import CourseDetailsDisplay from '../components/CourseDetailsDisplay';
import CourseVisibilityIndicator from '../components/CourseVisibilityIndicator';

const CoursesPage = ({ user, courses: initialCourses, enrolledCourses: initialEnrolledCourses, userLevel }) => {
    const [courses, setCourses] = useState(initialCourses || []);
    const [enrolledCourses, setEnrolledCourses] = useState(initialEnrolledCourses || []);
    const [message, setMessage] = useState(null);

    // Add safety check for user
    if (!user) {
        return (
            <Layout user={null}>
                <div>جاري التحميل...</div>
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
                                        {course.details && typeof course.details === 'object' ? (() => {
                                            const { formatCourseDetailsForDisplay } = require('../lib/courseDetailsTranslator');
                                            const formattedDetails = formatCourseDetailsForDisplay(course.details);
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
                                            return formattedDetails.map(({ key, label, value }) => {
                                                const displayValue = Array.isArray(value)
                                                    ? value.join(', ')
                                                    : (typeof value === 'object' && value !== null)
                                                        ? JSON.stringify(value)
                                                        : String(value || '');
                                                const arabicLabel = arabicLabels[key] || key;
                                                return (
                                                    <div key={key} className="detail-item">
                                                        <span className="detail-label">{arabicLabel}:</span>
                                                        <span className="detail-value">{displayValue}</span>
                                                    </div>
                                                );
                                            });
                                        })() : (
                                            <span>{course.details || 'لا توجد تفاصيل إضافية'}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="course-status">
                                    <span className={`status-badge ${course.enrollment_status === 'pending_approval' ? 'approval' : course.enrollment_status === 'pending_payment' ? 'pending' : 'active'}`}>
                                        {course.enrollment_status === 'pending_approval' ? 'في انتظار الموافقة' : 
                                         course.enrollment_status === 'pending_payment' ? 'في انتظار الدفع' :
                                         course.enrollment_status === 'active' ? 'مسجل ونشط' : 
                                         course.enrollment_status === 'waiting_start' ? 'في انتظار البداية' : course.enrollment_status}
                                    </span>
                                </div>
                                <div className="enrollment-info">
                                    <small>تاريخ التسجيل: {new Date(course.enrollment_date).toLocaleDateString('ar-EG')}</small>
                                </div>
                                <div className="course-actions">
                                    {['pending_payment', 'pending_approval'].includes(course.enrollment_status) && (
                                        <button 
                                            onClick={() => handleUnenroll(course.id)}
                                            className="unenroll-btn secondary"
                                        >
                                            ❌ إلغاء التسجيل
                                        </button>
                                    )}
                                    {course.enrollment_status === 'pending_payment' && (
                                        <button 
                                            onClick={() => window.location.href = '/student-finance'}
                                            className="payment-btn primary"
                                        >
                                            💳 دفع المصاريف لتأكيد الحجز
                                        </button>
                                    )}
                                    {course.enrollment_status === 'active' && (
                                        <button 
                                            onClick={() => window.location.href = `/courses/${course.id}`}
                                            className="view-course-btn primary"
                                        >
                                            📚 عرض الدورة
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
            {/* Available Courses Section */}
            <h2 style={{ color: '#28a745', marginBottom: '20px' }}>
                <i className="fas fa-graduation-cap"></i> الدورات المتاحة للتسجيل
                {userLevel && (
                    <span style={{ fontSize: '0.7rem', color: '#6c757d', marginRight: '10px' }}>
                        (درجة {userLevel})
                    </span>
                )}
            </h2>
            
            {/* Show explanation for degree 3 users when no courses available */}
            {courses.length === 0 && userLevel === 3 ? (
                <div className="degree-3-explanation">
                    <div className="explanation-card">
                        <h3><i className="fas fa-info-circle"></i> لماذا لا أرى دورات متاحة؟</h3>
                        <p>كطالب (درجة 3)، تظهر لك الدورات فقط بعد:</p>
                        <ul>
                            <li><strong>🎯 درجة 1 (المشرفين):</strong> انضمام المشرفين أو رؤساء الأقسام</li>
                            <li><strong>👨‍🏫 درجة 2 (المعلمين):</strong> انضمام المعلمين أو المدربين</li>
                        </ul>
                        <p>هذا النظام يضمن وجود كادر مؤهل قبل فتح التسجيل للطلاب.</p>
                        <div className="contact-info">
                            <i className="fas fa-phone"></i>
                            للاستفسار، يرجى التواصل مع الإدارة
                        </div>
                    </div>
                </div>
            ) : courses.length === 0 ? (
                <div className="no-courses">
                    <i className="fas fa-info-circle"></i>
                    <p>لا توجد دورات متاحة للتسجيل في الوقت الحالي.</p>
                    <p>يرجى المراجعة لاحقاً أو التواصل مع الإدارة.</p>
                </div>
            ) : (
                <div id="courses-container" className="courses-container">
                    {courses.map(course => (
                        <div className="course-card" key={course.id} style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '5px' }}>
                            <h3>{course.name}</h3>
                            <p>{course.description}</p>
                            
                            {/* Show visibility indicator */}
                            <CourseVisibilityIndicator course={course} userLevel={userLevel} />
                            
                            <div className="course-details">
                                <strong>التفاصيل:</strong>
                                <div className="details-content">
                                    <CourseDetailsDisplay details={course.details} />
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
            )}

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
                .view-course-btn {
                    background-color: #007bff;
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
                .view-course-btn:hover {
                    background-color: #0056b3;
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
                
                /* Degree 3 Explanation Styles */
                .degree-3-explanation {
                    margin: 20px 0;
                }
                .explanation-card {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 25px;
                    border-radius: 12px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                }
                .explanation-card h3 {
                    margin: 0 0 15px 0;
                    font-size: 1.3rem;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .explanation-card ul {
                    margin: 15px 0;
                    padding-right: 20px;
                }
                .explanation-card li {
                    margin: 10px 0;
                    line-height: 1.6;
                }
                .contact-info {
                    background: rgba(255,255,255,0.1);
                    padding: 15px;
                    border-radius: 8px;
                    margin-top: 20px;
                    text-align: center;
                    font-weight: 500;
                }
                .contact-info i {
                    margin-left: 8px;
                }
                
                @media (max-width: 768px) {
                    .explanation-card {
                        padding: 20px;
                    }
                    .explanation-card h3 {
                        font-size: 1.1rem;
                    }
                }
            `}</style>
        </Layout>
    );
};

/**
 * Server-side rendering for user-specific courses data
 * Note: Using SSR only since this page requires authentication
 */
export const getServerSideProps = withAuth(async (context) => {
    const { user } = context;
    
    try {
        // Determine user's درجة level based on role
        let userLevel = 3; // Default to درجة 3 (students/recipients)
        if (['admin', 'head'].includes(user.role)) {
            userLevel = 1; // درجة 1 (supervisors)
        } else if (['teacher', 'worker'].includes(user.role)) {
            userLevel = 2; // درجة 2 (managers/teachers)
        }

        let coursesResult = [];

        if (userLevel === 3) {
            // For درجة 3 users (students), only show courses where درجة 1 and 2 have enrolled
            const result = await pool.query(`
                SELECT 
                    c.id, 
                    c.name, 
                    c.description, 
                    c.details, 
                    c.status, 
                    c.created_at,
                    c.is_published
                FROM courses c
                WHERE (c.status = 'active' OR (c.status = 'published' AND c.is_published = true))
                AND NOT EXISTS (
                    SELECT 1 FROM enrollments e2 
                    WHERE e2.course_id = c.id 
                    AND e2.user_id = $1 
                    AND e2.status IN ('pending_payment', 'pending_approval', 'active', 'waiting_start')
                )
                AND EXISTS (
                    -- Check if درجة 1 users (supervisors) have enrolled
                    SELECT 1 FROM enrollments e1 
                    JOIN users u1 ON e1.user_id = u1.id 
                    WHERE e1.course_id = c.id 
                    AND u1.role IN ('admin', 'head')
                    AND e1.status IN ('active', 'pending_approval', 'waiting_start')
                )
                AND EXISTS (
                    -- Check if درجة 2 users (teachers/managers) have enrolled
                    SELECT 1 FROM enrollments e2 
                    JOIN users u2 ON e2.user_id = u2.id 
                    WHERE e2.course_id = c.id 
                    AND u2.role IN ('teacher', 'worker')
                    AND e2.status IN ('active', 'pending_approval', 'waiting_start')
                )
                ORDER BY c.created_at DESC
                LIMIT 100
            `, [user.id]);
            coursesResult = result.rows;
        } else {
            // For درجة 1 and 2 users, show all published courses
            coursesResult = await getFilteredCourses(
                { status: 'active', limit: 100 }, 
                null // No user ID for static generation
            );
        }

        // Get course statistics
        const statsResult = await pool.query(`
            SELECT 
                COUNT(*) as total_courses,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active_courses,
                (SELECT COUNT(DISTINCT user_id) FROM enrollments WHERE status = 'active') as total_students
            FROM courses 
            WHERE status IN ('active', 'published')
        `);

        // Get course categories
        const categoriesResult = await pool.query(`
            SELECT DISTINCT 
                COALESCE(details->>'category', 'عام') as category,
                COUNT(*) as course_count
            FROM courses 
            WHERE status IN ('active', 'published')
            GROUP BY details->>'category'
            ORDER BY course_count DESC
            LIMIT 10
        `);

        // Get user-specific enrolled courses
        const enrolledCoursesResult = await pool.query(`
            SELECT c.id, c.name, c.description, c.details, c.status, c.created_at,
                   e.status as enrollment_status, e.id as enrollment_id, e.created_at as enrollment_date
            FROM courses c
            JOIN enrollments e ON c.id = e.course_id
            WHERE e.user_id = $1 
            AND e.status IN ('pending_payment', 'pending_approval', 'active', 'waiting_start')
            AND e.status != 'cancelled'
            ORDER BY e.created_at DESC
            LIMIT 20
        `, [user.id]);

        const stats = statsResult.rows[0] || {};
        const categories = categoriesResult.rows || [];

        return {
            props: {
                user: JSON.parse(JSON.stringify(user)),
                courses: JSON.parse(JSON.stringify(coursesResult)),
                stats: JSON.parse(JSON.stringify(stats)),
                categories: JSON.parse(JSON.stringify(categories)),
                enrolledCourses: JSON.parse(JSON.stringify(enrolledCoursesResult.rows)),
                userLevel: userLevel, // Include for debugging
                lastUpdated: new Date().toISOString()
            }
        };
    } catch (err) {
        console.error('Courses page error:', err);
        
        return {
            props: {
                user: JSON.parse(JSON.stringify(user)),
                courses: [],
                stats: { total_courses: 0, active_courses: 0, total_students: 0 },
                categories: [],
                enrolledCourses: [],
                userLevel: 3,
                lastUpdated: new Date().toISOString()
            }
        };
    }
});

export default CoursesPage;
