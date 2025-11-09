import React, { useState } from 'react';
import { safeSerialize } from '../lib/isrUtils';
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

    const handleEnroll = async (courseId, levelNumber) => {
        if (!window.confirm('هل أنت متأكد من رغبتك في التقديم لهذه الدورة؟')) {
            return;
        }

        try {
            const response = await fetch(`/api/courses/apply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courseId, levelNumber })
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
            
            {message && (
                <div className={`alert ${message.isError ? 'alert-danger' : 'alert-success'}`}>
                    {message.text}
                </div>
            )}

            {/* Enrolled Courses Section */}
            {enrolledCourses.length > 0 && (
                <div style={{ marginBottom: '40px' }}>
                    <h2 style={{ color: '#dc3545', marginBottom: '20px' }}>
                        <i className="fas fa-clock"></i> الدورات المسجل بها (في انتظار المراجعة)
                    </h2>
                    <div className="enrolled-courses-container">
                        {enrolledCourses.map(course => (
                            <div className="course-card enrolled-course" key={course.id}>
                                <div className="course-card-header">
                                    <h3>{course.name}</h3>
                                    <span className="enrollment-status">{course.enrollment_status_arabic}</span>
                                </div>
                                <p>{course.description}</p>
                                <CourseDetailsDisplay course={course} />
                                <div className="course-card-footer">
                                    <button 
                                        onClick={() => handleUnenroll(course.id)} 
                                        className="btn btn-danger"
                                    >
                                        <i className="fas fa-times-circle"></i> إلغاء التسجيل
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Available Courses Section */}
            <h2 style={{ color: '#007bff', marginBottom: '20px' }}>
                <i className="fas fa-chalkboard-teacher"></i> الدورات المتاحة للتقديم
            </h2>
            <div className="available-courses-container">
                {courses.length > 0 ? courses.map(course => (
                    <div className="course-card" key={course.id}>
                        <CourseVisibilityIndicator userLevel={userLevel} courseLevel={course.level_number} />
                        <div className="course-card-header">
                            <h3>{course.name}</h3>
                            <span className="course-level">المستوى: {course.level_number || 'غير محدد'}</span>
                        </div>
                        <p>{course.description}</p>
                        <CourseDetailsDisplay course={course} />
                        <div className="course-card-footer">
                            <button 
                                onClick={() => handleEnroll(course.id, course.level_number)} 
                                className="btn btn-primary"
                                disabled={userLevel < course.level_number}
                            >
                                <i className="fas fa-check-circle"></i> قدم الآن
                            </button>
                        </div>
                    </div>
                )) : (
                    <p>لا توجد دورات متاحة حاليًا تناسب مستواك أو تخصصك.</p>
                )}
            </div>
        </Layout>
    );
    <style jsx>{`
                /* --- General Layout & Typography --- */
                h1, h2 {
                    font-family: 'Tajawal', sans-serif;
                }
                h1 {
                    color: var(--primary-color);
                }
                p {
                    color: var(--gray-600);
                    line-height: 1.6;
                }

                /* --- Alerts --- */
                .alert {
                    padding: 15px;
                    margin-bottom: 20px;
                    border: 1px solid transparent;
                    border-radius: 8px;
                    font-weight: 500;
                }
                .alert-success {
                    color: #155724;
                    background-color: #d4edda;
                    border-color: #c3e6cb;
                }
                .alert-danger {
                    color: #721c24;
                    background-color: #f8d7da;
                    border-color: #f5c6cb;
                }

                /* --- Course Containers --- */
                .enrolled-courses-container,
                .available-courses-container {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
                    gap: 25px;
                }

                /* --- General Card Styles --- */
                .course-card {
                    background: var(--white-color);
                    border: 1px solid #e9ecef;
                    border-radius: 12px;
                    box-shadow: var(--shadow-md);
                    transition: all 0.3s ease;
                    display: flex;
                    flex-direction: column;
                    position: relative; /* For visibility indicator positioning */
                    overflow: hidden;
                }
                .course-card:hover {
                    transform: translateY(-5px);
                    box-shadow: var(--shadow-xl);
                }
                .course-card-header {
                    padding: 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    border-bottom: 1px solid #e9ecef;
                }
                .course-card-header h3 {
                    margin: 0;
                    color: var(--primary-dark-color);
                    font-size: 1.2rem;
                }
                .course-card > p { /* Target direct paragraph child for description */
                    padding: 0 20px;
                    flex-grow: 1;
                }
                .course-card-footer {
                    padding: 15px 20px;
                    background-color: #f8f9fa;
                    border-top: 1px solid #e9ecef;
                    margin-top: auto; /* Pushes footer to the bottom */
                }

                /* --- Card Variants & Badges --- */
                .enrolled-course {
                    border-left: 5px solid #dc3545;
                    background: #fff8f8;
                }
                .enrollment-status {
                    background-color: #fff3cd;
                    color: #856404;
                    padding: 5px 12px;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    white-space: nowrap;
                }
                .course-level {
                    background-color: #e9ecef;
                    color: #495057;
                    padding: 5px 12px;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    font-weight: 600;
                }
                
                /* --- Buttons --- */
                .btn {
                    width: 100%;
                    padding: 10px 15px;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 1rem;
                    font-weight: 600;
                    transition: all 0.3s ease;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }
                .btn:disabled {
                    background-color: #ced4da;
                    cursor: not-allowed;
                }
                .btn-primary {
                    background-color: var(--primary-color);
                    color: white;
                }
                .btn-primary:hover:not(:disabled) {
                    background-color: var(--primary-dark-color);
                }
                .btn-danger {
                    background-color: #dc3545;
                    color: white;
                }
                .btn-danger:hover {
                    background-color: #c82333;
                }
                
                /* --- Inherited styles from old CSS for CourseDetailsDisplay component --- */
                /* Assuming CourseDetailsDisplay creates these classes */
                .course-details {
                    margin: 15px 20px;
                }
                .details-content {
                    margin-top: 5px;
                    padding: 15px;
                    background: #f8f9fa;
                    border-radius: 8px;
                }
                .detail-item {
                    display: flex;
                    margin-bottom: 8px;
                    font-size: 0.9rem;
                }
                .detail-item:last-child {
                    margin-bottom: 0;
                }
                .detail-label {
                    font-weight: bold;
                    margin-left: 10px;
                    min-width: 100px;
                    color: var(--gray-700);
                }
                .detail-value {
                    flex: 1;
                    color: var(--gray-600);
                }
            `}</style>

};

export const getServerSideProps = withAuth(async (context) => {
    const { user } = context;
    let client;

    try {
        client = await pool.connect();

        // Get user's current level from their latest completed course
        const levelRes = await client.query(`
            SELECT MAX(e.level_number) as max_level
            FROM enrollments e
            WHERE e.user_id = $1 AND e.status = 'completed'
        `, [user.id]);
        const userLevel = levelRes.rows[0]?.max_level || 0;

        // Fetch available courses for the user using the database function
        const availableCoursesRes = await client.query(
            "SELECT * FROM get_available_courses_for_user($1, $2)",
            [user.id, user.role]
        );

        // Fetch courses the user is already enrolled in but not yet active
        const enrolledCoursesQuery = `
            SELECT 
                c.*, 
                e.status as enrollment_status,
                CASE e.status
                    WHEN 'pending_payment' THEN 'في انتظار الدفع'
                    WHEN 'waiting_start' THEN 'في انتظار بدء الدورة'
                    WHEN 'pending_approval' THEN 'في انتظار الموافقة'
                    ELSE 'غير معروف'
                END as enrollment_status_arabic
            FROM courses c
            JOIN enrollments e ON c.id = e.course_id
            WHERE e.user_id = $1 AND e.status IN ('pending_payment', 'waiting_start', 'pending_approval');
        `;
        const enrolledCoursesRes = await client.query(enrolledCoursesQuery, [user.id]);

        return {
            props: {
                user: safeSerialize(user),
                courses: safeSerialize(availableCoursesRes.rows),
                enrolledCourses: safeSerialize(enrolledCoursesRes.rows),
                userLevel,
            },
        };
    } catch (error) {
        console.error('Error in courses page getServerSideProps:', error);
        return {
            props: {
                user: safeSerialize(user),
                courses: [],
                enrolledCourses: [],
                userLevel: 0,
                error: 'Failed to load course data.'
            },
        };
    } finally {
        if (client) client.release();
    }
});

export default CoursesPage;
