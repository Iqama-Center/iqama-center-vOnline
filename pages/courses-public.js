import React from 'react';
import Link from 'next/link';
import PublicLayout from '../components/PublicLayout';
import pool from '../lib/db';

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
                                    <span className={`status-badge ${course.status}`}>
                                        {course.status === 'active' ? 'متاحة للتسجيل' : 'قريباً'}
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
                                    )}
                                </div>
                                
                                <div className="course-footer">
                                    <div className="course-meta">
                                        <small>
                                            تم الإنشاء: {new Date(course.created_at).toLocaleDateString('ar-EG')}
                                        </small>
                                        {course.student_count > 0 && (
                                            <small>
                                                عدد المسجلين: {course.student_count}
                                            </small>
                                        )}
                                    </div>
                                    
                                    <div className="course-actions">
                                        <Link 
                                            href="/login" 
                                            className="btn btn-primary"
                                            title="سجل دخولك للتقديم"
                                        >
                                            سجل للتقديم
                                        </Link>
                                        <button 
                                            className="btn btn-secondary"
                                            onClick={() => {
                                                // Show course details modal or navigate to details page
                                                alert('تفاصيل أكثر عن الدورة ستكون متاحة قريباً');
                                            }}
                                        >
                                            تفاصيل أكثر
                                        </button>
                                    </div>
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
    // Fast fallback for development mode
    if (process.env.NODE_ENV === 'development') {
        const { getFastFallbackData } = await import('../lib/fastFallbacks');
        return {
            props: getFastFallbackData('courses'),
            revalidate: 1
        };
    }

    try {
        // Execute parallel queries for optimal performance using Promise.allSettled
        const [coursesResult, statsResult, categoriesResult] = await Promise.allSettled([
            // Enhanced courses query with comprehensive data
            pool.query(`
                SELECT 
                    c.id, 
                    c.name, 
                    c.description, 
                    c.details, 
                    c.status, 
                    c.created_at,
                    c.updated_at,
                    c.is_published,
                    c.course_fee,
                    c.duration_days,
                    c.max_participants,
                    c.start_date,
                    c.end_date,
                    COUNT(e.id) as student_count,
                    u.full_name as teacher_name,
                    u.id as teacher_id
                FROM courses c
                LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = 'active'
                LEFT JOIN users u ON c.teacher_id = u.id
                WHERE (c.status = 'active' OR (c.status = 'published' AND c.is_published = true))
                GROUP BY c.id, c.name, c.description, c.details, c.status, c.created_at, c.updated_at,
                         c.is_published, c.course_fee, c.duration_days, c.max_participants, 
                         c.start_date, c.end_date, u.full_name, u.id
                ORDER BY c.created_at DESC, student_count DESC
                LIMIT 100
            `),
            
            // Comprehensive statistics query
            pool.query(`
                SELECT 
                    (SELECT COUNT(*) FROM courses WHERE is_published = true AND is_published = true) as total_courses,
                    (SELECT COUNT(DISTINCT user_id) FROM enrollments WHERE status = 'active') as total_students,
                    (SELECT COUNT(*) FROM courses WHERE is_published = true AND is_launched = true) as active_courses,
                    (SELECT COUNT(*) FROM enrollments WHERE status = 'completed') as completed_enrollments,
                    (SELECT AVG(course_fee) FROM courses WHERE status = 'published' AND is_published = true AND course_fee > 0) as avg_fee
            `),
            
            // Course categories for enhanced filtering
            pool.query(`
                SELECT DISTINCT 
                    COALESCE(details->>'category', 'عام') as category,
                    COUNT(*) as course_count,
                    AVG(course_fee) as avg_category_fee
                FROM courses 
                WHERE (status = 'active' OR (status = 'published' AND is_published = true))
                GROUP BY details->>'category'
                ORDER BY course_count DESC
                LIMIT 20
            `)
        ]);

        // Process courses data with enhanced error handling and data transformation
        let courses = [];
        if (coursesResult.status === 'fulfilled') {
            courses = coursesResult.value.rows.map(course => {
                const studentCount = parseInt(course.student_count || 0);
                const maxParticipants = parseInt(course.max_participants || 0);
                
                return {
                    ...course,
                    // Safe JSON parsing for details
                    details: (() => {
                        try {
                            return typeof course.details === 'object' ? course.details : {};
                        } catch {
                            return {};
                        }
                    })(),
                    // Type-safe numeric conversions
                    student_count: studentCount,
                    course_fee: parseFloat(course.course_fee || 0),
                    duration_days: parseInt(course.duration_days || 0),
                    max_participants: maxParticipants,
                    // Safe date handling
                    created_at: course.created_at ? new Date(course.created_at).toISOString() : null,
                    updated_at: course.updated_at ? new Date(course.updated_at).toISOString() : null,
                    start_date: course.start_date ? new Date(course.start_date).toISOString() : null,
                    end_date: course.end_date ? new Date(course.end_date).toISOString() : null,
                    // Computed fields for enhanced UX
                    is_full: maxParticipants > 0 && studentCount >= maxParticipants,
                    enrollment_percentage: maxParticipants > 0 
                        ? Math.round((studentCount / maxParticipants) * 100) 
                        : 0,
                    is_available: maxParticipants === 0 || studentCount < maxParticipants
                };
            });
        } else {
            console.error('Failed to fetch courses:', coursesResult.reason);
        }

        // Process statistics with comprehensive error handling
        let stats = {
            totalCourses: 0,
            totalStudents: 0,
            activeCourses: 0,
            completedEnrollments: 0,
            avgCourseFee: 0
        };

        if (statsResult.status === 'fulfilled') {
            const statsRow = statsResult.value.rows[0] || {};
            stats = {
                totalCourses: parseInt(statsRow.total_courses || 0),
                totalStudents: parseInt(statsRow.total_students || 0),
                activeCourses: parseInt(statsRow.active_courses || 0),
                completedEnrollments: parseInt(statsRow.completed_enrollments || 0),
                avgCourseFee: parseFloat(statsRow.avg_fee || 0)
            };
        } else {
            console.error('Failed to fetch statistics:', statsResult.reason);
        }

        // Process categories with enhanced data
        let categories = [];
        if (categoriesResult.status === 'fulfilled') {
            categories = categoriesResult.value.rows.map(cat => ({
                name: cat.category || 'عام',
                count: parseInt(cat.course_count || 0),
                avgFee: parseFloat(cat.avg_category_fee || 0)
            }));
        } else {
            console.error('Failed to fetch categories:', categoriesResult.reason);
        }

        return {
            props: {
                // Safe serialization using JSON.parse(JSON.stringify())
                courses: JSON.parse(JSON.stringify(courses)),
                stats: JSON.parse(JSON.stringify(stats)),
                categories: JSON.parse(JSON.stringify(categories)),
                lastUpdated: new Date().toISOString(),
                // Enhanced metadata for monitoring and debugging
                metadata: {
                    totalFetched: courses.length,
                    queriesExecuted: 3,
                    coursesSuccess: coursesResult.status === 'fulfilled',
                    statsSuccess: statsResult.status === 'fulfilled',
                    categoriesSuccess: categoriesResult.status === 'fulfilled',
                    hasErrors: [coursesResult, statsResult, categoriesResult].some(r => r.status === 'rejected'),
                    cacheStrategy: 'ISR',
                    revalidationTime: 600,
                    generatedAt: new Date().toISOString()
                }
            },
            // Revalidate every 10 minutes (600 seconds) for public content
            // This balances data freshness with performance
            revalidate: 600
        };

    } catch (error) {
        console.error('Critical error in getStaticProps for public courses:', error);
        
        // Import utilities for error response
        const { createErrorResponse, REVALIDATION_TIMES } = await import('../lib/isrUtils');
        
        // Return comprehensive error fallback
        return createErrorResponse({
            courses: [],
            stats: {
                totalCourses: 0,
                totalStudents: 0,
                activeCourses: 0,
                completedEnrollments: 0,
                avgFee: 0
            },
            categories: [],
            metadata: {
                totalPages: 0,
                hasMoreCourses: false,
                categoriesCount: 0,
                dataFreshness: 'error'
            }
        }, REVALIDATION_TIMES.ERROR);
    }
}

export default PublicCoursesPage;