import React from 'react';
import Link from 'next/link';
import PublicLayout from '../components/PublicLayout';
import pool from '../lib/db';
import { createSuccessResponse, createErrorResponse, REVALIDATION_TIMES } from '../lib/isrUtils';

/**
 * Public Courses Page with ISR
 * This page shows publicly available courses without requiring authentication
 * Uses Static Generation with Incremental Static Regeneration for optimal performance
 */
const PublicCoursesPage = ({ courses, stats, lastUpdated }) => {
    return (
        <PublicLayout>
            <div className="public-courses-container">
                <header className="page-header">
                    <h1>الدورات المتاحة</h1>
                    <p>اكتشف مجموعة متنوعة من الدورات التعليمية المتاحة للتسجيل</p>
                    <div className="stats-summary">
                        <div className="stat-item">
                            <span className="stat-number">{stats.totalCourses}</span>
                            <span className="stat-label">دورة متاحة</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">{stats.totalStudents}</span>
                            <span className="stat-label">طالب مسجل</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">{stats.activeCourses}</span>
                            <span className="stat-label">دورة نشطة</span>
                        </div>
                    </div>
                </header>

                <div className="courses-grid">
                    {courses.length > 0 ? (
                        courses.map(course => (
                            <div key={course.id} className="course-card">
                                <div className="course-header">
                                    <h3>{course.name}</h3>
                                    <span className={`status-badge ${course.student_count >= course.max_enrollment ? 'status-full' : 'status-available'}`}>
                                        {course.student_count >= course.max_enrollment ? 'مكتمل' : 'متاح للتسجيل'}
                                    </span>
                                </div>
                                
                                <div className="course-content">
                                    <p className="course-description">{course.description}</p>
                                    
                                    {course.details && typeof course.details === 'object' && (
                                        <div className="course-details">
                                            <h4>تفاصيل الدورة:</h4>
                                            <div className="details-grid">
                                                {Object.entries(course.details).map(([key, value]) => {
                                                    // Arabic translations for common fields
                                                    const arabicLabels = {
                                                        'duration_days': 'المدة بالأيام',
                                                        'level': 'المستوى',
                                                        'teacher_name': 'المدرس',
                                                        'location': 'المكان',
                                                        'days_per_week': 'أيام الأسبوع',
                                                        'hours_per_day': 'ساعات اليوم',
                                                        'requirements': 'المتطلبات',
                                                        'objectives': 'الأهداف',
                                                        'course_fee': 'الرسوم',
                                                        'max_enrollment': 'السعة القصوى',
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
                                    )}
                                </div>
                                
                                <div className="course-footer">
                                    <div className="course-meta">
                                        <span className="meta-item">
                                            <i className="fas fa-calendar-alt"></i>
                                            تاريخ النشر: {new Date(course.created_at).toLocaleDateString('ar-EG')}
                                        </span>
                                        {course.student_count > 0 && (
                                            <span className="meta-item">
                                                <i className="fas fa-users"></i>
                                                عدد المسجلين: {course.student_count}
                                            </span>
                                        )}
                                    </div>
                                    
                                    <Link href={`/courses/${course.id}`} className="btn-details">
                                        عرض التفاصيل
                                    </Link>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="no-courses">
                            <h3>لا توجد دورات متاحة حالياً</h3>
                            <p>تابعنا للحصول على آخر التحديثات حول الدورات الجديدة</p>
                        </div>
                    )}
                </div>
                
                <footer className="page-footer">
                    <small>آخر تحديث: {new Date(lastUpdated).toLocaleString('ar-EG')}</small>
                </footer>
            </div>

            <style jsx>{`
                .public-courses-container {
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

                .courses-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                    gap: 30px;
                    margin-bottom: 40px;
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

                .status-badge.published {
                    background: #cce7ff;
                    color: #004085;
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
                }

                .btn {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 6px;
                    font-size: 0.9rem;
                    font-weight: 500;
                    cursor: pointer;
                    text-decoration: none;
                    text-align: center;
                    transition: all 0.3s ease;
                    flex: 1;
                }

                .btn-primary {
                    background: #007bff;
                    color: white;
                }

                .btn-primary:hover {
                    background: #0056b3;
                }

                .btn-secondary {
                    background: #6c757d;
                    color: white;
                }

                .btn-secondary:hover {
                    background: #545b62;
                }

                .no-courses {
                    grid-column: 1 / -1;
                    text-align: center;
                    padding: 60px 20px;
                    color: #6c757d;
                }

                .no-courses h3 {
                    margin-bottom: 10px;
                    color: #495057;
                }

                .page-footer {
                    text-align: center;
                    padding: 20px;
                    border-top: 1px solid #e1e5e9;
                    color: #6c757d;
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
                }
            `}</style>
        </PublicLayout>
    );
};

/**
 * Enhanced Static Site Generation with ISR for Public Courses
 * Senior-level implementation with comprehensive error handling,
 * performance optimization, and data consistency
 */
export async function getStaticProps() {
    console.log('Fetching public course data for ISR...');
    let client;

    try {
        client = await pool.connect();

        // Fetch public, published courses with teacher name and student count
        const coursesQuery = `
            SELECT 
                c.id, c.name, c.description, c.details, c.created_at,
                c.course_fee, c.max_enrollment, c.start_date, c.duration_days,
                c.days_per_week, c.hours_per_day,
                COALESCE(u.full_name, 'غير محدد') as teacher_name,
                COUNT(e.id)::int as student_count
            FROM courses c
            LEFT JOIN users u ON c.teacher_id = u.id
            LEFT JOIN enrollments e ON c.id = e.course_id
            WHERE c.is_public = true AND c.is_published = true
            GROUP BY c.id, u.full_name
            ORDER BY c.created_at DESC;
        `;
        const coursesRes = await client.query(coursesQuery);

        // Fetch overall statistics
        const statsQuery = `
            SELECT
                (SELECT COUNT(*)::int FROM courses WHERE is_public = true AND is_published = true) as total_courses,
                (SELECT COUNT(*)::int FROM enrollments) as total_students,
                (SELECT COUNT(*)::int FROM courses WHERE is_launched = true) as active_courses;
        `;
        const statsRes = await client.query(statsQuery);

        return createSuccessResponse({
            courses: coursesRes.rows,
            stats: statsRes.rows[0],
        });

    } catch (error) {
        console.error('ISR Error in public-courses:', error);
        return createErrorResponse(error);

    } finally {
        if (client) client.release();
        console.log('Finished fetching public course data.');
    }
}

export default PublicCoursesPage;