import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { withAuth } from '../lib/withAuth';
import pool from '../lib/db';
import { getFilteredCourses } from '../lib/queryOptimizer';

/**
 * Improved Courses Page with ISR and Client-side Hydration
 * This page combines static generation for public data with client-side fetching for user-specific data
 * Uses ISR for optimal performance while maintaining personalization
 */
const ImprovedCoursesPage = ({ 
    user, 
    publicCourses, 
    courseStats, 
    lastUpdated 
}) => {
    // Client-side state for user-specific data
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [availableCourses, setAvailableCourses] = useState(publicCourses || []);
    const [message, setMessage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch user-specific data on client-side
    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const fetchUserSpecificData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch enrolled courses
                const enrolledResponse = await fetch('/api/courses/enrolled');
                if (!enrolledResponse.ok) {
                    throw new Error('Failed to fetch enrolled courses');
                }
                const enrolledData = await enrolledResponse.json();
                setEnrolledCourses(enrolledData.courses || []);

                // Fetch available courses (excluding enrolled ones)
                const availableResponse = await fetch('/api/courses/available');
                if (!availableResponse.ok) {
                    throw new Error('Failed to fetch available courses');
                }
                const availableData = await availableResponse.json();
                setAvailableCourses(availableData.courses || publicCourses);

            } catch (err) {
                console.error('Error fetching user-specific data:', err);
                setError('حدث خطأ في تحميل البيانات. يرجى المحاولة مرة أخرى.');
                // Fallback to public courses
                setAvailableCourses(publicCourses);
            } finally {
                setLoading(false);
            }
        };

        fetchUserSpecificData();
    }, [user, publicCourses]);

    // Handle enrollment with optimistic updates
    const handleEnroll = async (courseId) => {
        if (!window.confirm('هل أنت متأكد من رغبتك في التقديم لهذه الدورة؟')) {
            return;
        }

        try {
            // Optimistic update
            const courseToEnroll = availableCourses.find(c => c.id === courseId);
            if (courseToEnroll) {
                setAvailableCourses(prev => prev.filter(c => c.id !== courseId));
                setEnrolledCourses(prev => [...prev, {
                    ...courseToEnroll,
                    enrollment_status: 'pending_approval',
                    enrollment_date: new Date().toISOString()
                }]);
            }

            const response = await fetch(`/api/courses/${courseId}/enroll`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();
            
            if (!response.ok) {
                // Revert optimistic update on error
                if (courseToEnroll) {
                    setAvailableCourses(prev => [...prev, courseToEnroll]);
                    setEnrolledCourses(prev => prev.filter(c => c.id !== courseId));
                }
                throw new Error(result.message || 'فشل في التسجيل');
            }

            setMessage({ text: result.message, isError: false });
            
            // Auto-hide success message after 3 seconds
            setTimeout(() => setMessage(null), 3000);

        } catch (err) {
            console.error('Enrollment error:', err);
            setMessage({ text: err.message || 'حدث خطأ في الاتصال بالخادم.', isError: true });
        }
    };

    // Handle unenrollment
    const handleUnenroll = async (courseId) => {
        if (!window.confirm('هل أنت متأكد من رغبتك في الانسحاب من هذه الدورة؟ يمكنك التقديم مرة أخرى لاحقاً.')) {
            return;
        }

        try {
            const response = await fetch(`/api/courses/${courseId}/unenroll`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || 'فشل في إلغاء التسجيل');
            }

            // Update state
            const unenrolledCourse = enrolledCourses.find(c => c.id === courseId);
            setEnrolledCourses(prev => prev.filter(c => c.id !== courseId));
            
            if (unenrolledCourse) {
                setAvailableCourses(prev => [...prev, {
                    ...unenrolledCourse,
                    enrollment_status: undefined,
                    enrollment_date: undefined
                }]);
            }

            setMessage({ text: result.message, isError: false });
            setTimeout(() => setMessage(null), 3000);

        } catch (err) {
            console.error('Unenrollment error:', err);
            setMessage({ text: err.message || 'حدث خطأ في الاتصال بالخادم.', isError: true });
        }
    };

    // Render course card component
    const renderCourseCard = (course, isEnrolled = false) => (
        <div key={course.id} className={`course-card ${isEnrolled ? 'enrolled-course' : ''}`}>
            <div className="course-header">
                <h3>{course.name}</h3>
                <span className={`status-badge ${isEnrolled ? course.enrollment_status : course.status}`}>
                    {isEnrolled ? getEnrollmentStatusText(course.enrollment_status) : getStatusText(course.status)}
                </span>
            </div>
            
            <div className="course-content">
                <p className="course-description">{course.description}</p>
                
                {course.details && typeof course.details === 'object' && (
                    <CourseDetails details={course.details} />
                )}
            </div>
            
            <div className="course-footer">
                <div className="course-meta">
                    <small>
                        {isEnrolled ? 
                            `تاريخ التسجيل: ${new Date(course.enrollment_date).toLocaleDateString('ar-EG')}` :
                            `تم الإنشاء: ${new Date(course.created_at).toLocaleDateString('ar-EG')}`
                        }
                    </small>
                    {course.student_count > 0 && (
                        <small>عدد المسجلين: {course.student_count}</small>
                    )}
                </div>
                
                <div className="course-actions">
                    {isEnrolled ? (
                        <EnrolledCourseActions 
                            course={course} 
                            onUnenroll={handleUnenroll}
                        />
                    ) : (
                        <button 
                            onClick={() => handleEnroll(course.id)}
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? 'جاري التحميل...' : 'التقديم الآن'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    // Helper functions
    const getEnrollmentStatusText = (status) => {
        const statusMap = {
            'pending_approval': 'في انتظار الموافقة',
            'pending_payment': 'في انتظار الدفع',
            'active': 'مسجل ونشط',
            'waiting_start': 'في انتظار البداية'
        };
        return statusMap[status] || status;
    };

    const getStatusText = (status) => {
        const statusMap = {
            'active': 'متاحة للتسجيل',
            'published': 'منشورة',
            'draft': 'مسودة'
        };
        return statusMap[status] || status;
    };

    if (!user) {
        return (
            <Layout user={null}>
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>جاري التحميل...</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout user={user}>
            <div className="courses-page">
                <header className="page-header">
                    <h1>الدورات المتاحة للتسجيل</h1>
                    <p>تصفح الدورات المتاحة وتقدم للدورة التي تناسبك.</p>
                    
                    {courseStats && (
                        <div className="stats-summary">
                            <div className="stat-item">
                                <span className="stat-number">{courseStats.totalCourses}</span>
                                <span className="stat-label">دورة متاحة</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">{courseStats.totalStudents}</span>
                                <span className="stat-label">طالب مسجل</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">{courseStats.activeCourses}</span>
                                <span className="stat-label">دورة نشطة</span>
                            </div>
                        </div>
                    )}
                </header>

                {error && (
                    <div className="error-message">
                        <i className="fas fa-exclamation-triangle"></i>
                        <span>{error}</span>
                        <button onClick={() => window.location.reload()}>إعادة المحاولة</button>
                    </div>
                )}

                {/* Enrolled Courses Section */}
                {enrolledCourses.length > 0 && (
                    <section className="enrolled-courses-section">
                        <h2>
                            <i className="fas fa-clock"></i> 
                            الدورات المسجل بها ({enrolledCourses.length})
                        </h2>
                        <div className="courses-grid">
                            {enrolledCourses.map(course => renderCourseCard(course, true))}
                        </div>
                    </section>
                )}

                {/* Available Courses Section */}
                <section className="available-courses-section">
                    <h2>
                        <i className="fas fa-graduation-cap"></i> 
                        الدورات المتاحة ({availableCourses.length})
                    </h2>
                    
                    {loading ? (
                        <div className="loading-grid">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="course-card-skeleton"></div>
                            ))}
                        </div>
                    ) : availableCourses.length > 0 ? (
                        <div className="courses-grid">
                            {availableCourses.map(course => renderCourseCard(course, false))}
                        </div>
                    ) : (
                        <div className="no-courses">
                            <i className="fas fa-graduation-cap"></i>
                            <h3>لا توجد دورات متاحة حالياً</h3>
                            <p>تابعنا للحصول على آخر التحديثات حول الدورات الجديدة</p>
                        </div>
                    )}
                </section>

                {/* Message Display */}
                {message && (
                    <MessageOverlay 
                        message={message} 
                        onClose={() => setMessage(null)} 
                    />
                )}

                <footer className="page-footer">
                    <small>آخر تحديث: {new Date(lastUpdated).toLocaleString('ar-EG')}</small>
                </footer>
            </div>

            <CoursesPageStyles />
        </Layout>
    );
};

// Sub-components for better organization
const CourseDetails = ({ details }) => (
    <div className="course-details">
        <h4>تفاصيل الدورة:</h4>
        <div className="details-grid">
            {Object.entries(details).map(([key, value]) => {
                const arabicLabels = {
                    'duration': 'المدة',
                    'level': 'المستوى',
                    'instructor': 'المدرب',
                    'location': 'المكان',
                    'schedule': 'الجدول',
                    'requirements': 'المتطلبات',
                    'objectives': 'الأهداف',
                    'price': 'السعر',
                    'capacity': 'السعة',
                    'start_date': 'تاريخ البداية',
                    'category': 'الفئة'
                };
                
                const displayValue = Array.isArray(value) 
                    ? value.join(', ') 
                    : String(value || '');
                
                if (!displayValue) return null;
                
                return (
                    <div key={key} className="detail-item">
                        <span className="detail-label">
                            {arabicLabels[key] || key}:
                        </span>
                        <span className="detail-value">{displayValue}</span>
                    </div>
                );
            })}
        </div>
    </div>
);

const EnrolledCourseActions = ({ course, onUnenroll }) => (
    <>
        {['pending_payment', 'pending_approval'].includes(course.enrollment_status) && (
            <button 
                onClick={() => onUnenroll(course.id)}
                className="btn btn-secondary"
            >
                ❌ إلغاء التسجيل
            </button>
        )}
        {course.enrollment_status === 'pending_payment' && (
            <button 
                onClick={() => window.location.href = '/student-finance'}
                className="btn btn-success"
            >
                💳 دفع المصاريف
            </button>
        )}
        {course.enrollment_status === 'active' && (
            <button 
                onClick={() => window.location.href = `/courses/${course.id}`}
                className="btn btn-primary"
            >
                📚 عرض الدورة
            </button>
        )}
    </>
);

const MessageOverlay = ({ message, onClose }) => (
    <div className={`message-overlay ${message.isError ? 'error' : 'success'}`}>
        <div className="message-content">
            <i className={`fas ${message.isError ? 'fa-exclamation-circle' : 'fa-check-circle'}`}></i>
            <p>{message.text}</p>
            <button onClick={onClose}>إغلاق</button>
        </div>
    </div>
);

const CoursesPageStyles = () => (
    <style jsx>{`
        .courses-page {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            font-family: 'Tajawal', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .page-header {
            text-align: center;
            margin-bottom: 40px;
            padding: 40px 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 12px;
        }

        .page-header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            font-weight: 700;
        }

        .page-header p {
            font-size: 1.2rem;
            margin-bottom: 30px;
            opacity: 0.9;
        }

        .stats-summary {
            display: flex;
            justify-content: center;
            gap: 40px;
            flex-wrap: wrap;
        }

        .stat-item {
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .stat-number {
            font-size: 2rem;
            font-weight: 700;
            display: block;
        }

        .stat-label {
            font-size: 0.9rem;
            opacity: 0.8;
        }

        .enrolled-courses-section,
        .available-courses-section {
            margin-bottom: 40px;
        }

        .enrolled-courses-section h2,
        .available-courses-section h2 {
            color: #2c3e50;
            margin-bottom: 20px;
            font-size: 1.5rem;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .enrolled-courses-section h2 {
            color: #dc3545;
        }

        .courses-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 30px;
        }

        .course-card {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            border: 1px solid #e1e5e9;
        }

        .course-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        .enrolled-course {
            border-left: 4px solid #dc3545;
            background: #fff5f5;
        }

        .course-header {
            padding: 20px 20px 0;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 15px;
        }

        .course-header h3 {
            margin: 0;
            font-size: 1.3rem;
            font-weight: 600;
            color: #2c3e50;
            flex: 1;
        }

        .status-badge {
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 500;
            white-space: nowrap;
        }

        .status-badge.active {
            background: #d4edda;
            color: #155724;
        }

        .status-badge.pending_approval {
            background: #e2e3f1;
            color: #6f42c1;
        }

        .status-badge.pending_payment {
            background: #fff3cd;
            color: #856404;
        }

        .course-content {
            padding: 20px;
        }

        .course-description {
            color: #6c757d;
            line-height: 1.6;
            margin-bottom: 20px;
        }

        .course-details h4 {
            margin: 0 0 15px 0;
            font-size: 1rem;
            color: #495057;
            font-weight: 600;
        }

        .details-grid {
            display: grid;
            gap: 8px;
        }

        .detail-item {
            display: flex;
            gap: 10px;
            font-size: 0.9rem;
        }

        .detail-label {
            font-weight: 600;
            color: #495057;
            min-width: 80px;
        }

        .detail-value {
            color: #6c757d;
            flex: 1;
        }

        .course-footer {
            padding: 0 20px 20px;
        }

        .course-meta {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
            font-size: 0.8rem;
            color: #6c757d;
        }

        .course-actions {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }

        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            font-size: 0.9rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            flex: 1;
            min-width: 120px;
        }

        .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        .btn-primary {
            background: #007bff;
            color: white;
        }

        .btn-primary:hover:not(:disabled) {
            background: #0056b3;
        }

        .btn-secondary {
            background: #6c757d;
            color: white;
        }

        .btn-secondary:hover:not(:disabled) {
            background: #545b62;
        }

        .btn-success {
            background: #28a745;
            color: white;
        }

        .btn-success:hover:not(:disabled) {
            background: #218838;
        }

        .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 400px;
            color: #6c757d;
        }

        .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #007bff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .loading-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 30px;
        }

        .course-card-skeleton {
            height: 300px;
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: loading 1.5s infinite;
            border-radius: 12px;
        }

        @keyframes loading {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }

        .error-message {
            background: #f8d7da;
            color: #721c24;
            padding: 15px 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .error-message button {
            background: #dc3545;
            color: white;
            border: none;
            padding: 5px 15px;
            border-radius: 4px;
            cursor: pointer;
            margin-right: auto;
        }

        .no-courses {
            text-align: center;
            padding: 60px 20px;
            color: #6c757d;
        }

        .no-courses i {
            font-size: 4rem;
            margin-bottom: 20px;
            color: #dee2e6;
        }

        .no-courses h3 {
            margin-bottom: 10px;
            color: #495057;
        }

        .message-overlay {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1001;
            max-width: 400px;
        }

        .message-content {
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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
            border-radius: 4px;
            cursor: pointer;
            margin-left: auto;
        }

        .page-footer {
            text-align: center;
            padding: 20px;
            border-top: 1px solid #e1e5e9;
            color: #6c757d;
            margin-top: 40px;
        }

        @media (max-width: 768px) {
            .courses-grid {
                grid-template-columns: 1fr;
            }
            
            .stats-summary {
                gap: 20px;
            }
            
            .page-header h1 {
                font-size: 2rem;
            }
            
            .course-actions {
                flex-direction: column;
            }

            .message-overlay {
                left: 20px;
                right: 20px;
                max-width: none;
            }
        }
    `}</style>
);

/**
 * Static Generation with ISR for public course data
 * This provides the base course data that can be cached and shared across users
 */
export async function getStaticProps() {
    try {
        // Fetch public course data that can be cached
        const coursesResult = await pool.query(`
            SELECT 
                c.id, 
                c.name, 
                c.description, 
                c.details, 
                c.status, 
                c.created_at,
                c.is_published,
                COUNT(e.id) as student_count
            FROM courses c
            LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = 'active'
            WHERE (c.status = 'active' OR (c.status = 'published' AND c.is_published = true))
            GROUP BY c.id, c.name, c.description, c.details, c.status, c.created_at, c.is_published
            ORDER BY c.created_at DESC
            LIMIT 50
        `);

        // Fetch course statistics
        const statsQueries = await Promise.allSettled([
            pool.query('SELECT COUNT(*) as count FROM courses WHERE status IN (\'active\', \'published\')'),
            pool.query('SELECT COUNT(DISTINCT user_id) as count FROM enrollments WHERE status = \'active\''),
            pool.query('SELECT COUNT(*) as count FROM courses WHERE status = \'active\'')
        ]);

        const courseStats = {
            totalCourses: statsQueries[0].status === 'fulfilled' ? parseInt(statsQueries[0].value.rows[0]?.count || 0) : 0,
            totalStudents: statsQueries[1].status === 'fulfilled' ? parseInt(statsQueries[1].value.rows[0]?.count || 0) : 0,
            activeCourses: statsQueries[2].status === 'fulfilled' ? parseInt(statsQueries[2].value.rows[0]?.count || 0) : 0
        };

        return {
            props: {
                publicCourses: JSON.parse(JSON.stringify(coursesResult.rows)),
                courseStats,
                lastUpdated: new Date().toISOString()
            },
            // Revalidate every 5 minutes
            revalidate: 300
        };
    } catch (error) {
        console.error('Error in getStaticProps for courses:', error);
        
        return {
            props: {
                publicCourses: [],
                courseStats: {
                    totalCourses: 0,
                    totalStudents: 0,
                    activeCourses: 0
                },
                lastUpdated: new Date().toISOString()
            },
            revalidate: 60
        };
    }
}

/**
 * Server-side authentication wrapper
 * This ensures the user is authenticated before accessing the page
 */
export const getServerSideProps = withAuth(async (context) => {
    // Get static props data
    const staticProps = await getStaticProps();
    
    return {
        props: {
            user: context.user,
            ...staticProps.props
        }
    };
});

export default ImprovedCoursesPage;