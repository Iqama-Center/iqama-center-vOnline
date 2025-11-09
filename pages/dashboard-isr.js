import React from 'react';
import PublicLayout from '../components/PublicLayout';
import pool from '../lib/db';
import { safeSerialize, createSuccessResponse, createErrorResponse, REVALIDATION_TIMES } from '../lib/isrUtils';

/**
 * Enhanced Dashboard with ISR Implementation
 * 
 * This dashboard demonstrates how to combine ISR with user authentication
 * for pages that have both static and dynamic content.
 * 
 * Key features:
 * - Static generation for public dashboard data
 * - Server-side rendering for user-specific content
 * - Hybrid approach for optimal performance
 */
const DashboardISR = ({ 
    publicStats = {}, 
    recentCourses = [], 
    systemAnnouncements = [], 
    lastUpdated,
    metadata = {}
}) => {
    // Only log in development to avoid server-side issues
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        console.log('DashboardISR props:', { publicStats, recentCourses, systemAnnouncements, lastUpdated, metadata });
    }
    
    // Ensure publicStats has default values
    const safeStats = {
        totalCourses: 0,
        totalStudents: 0,
        totalTeachers: 0,
        activeCourses: 0,
        ...publicStats
    };
    try {
        return (
            <PublicLayout title="لوحة التحكم العامة - مركز إقامة الكتاب">
                <div className="dashboard-container">
                <header className="dashboard-header">
                    <h1>لوحة التحكم</h1>
                    <p>مرحباً بك في نظام إدارة الدورات</p>
                    {lastUpdated && (
                        <small className="last-updated">
                            آخر تحديث: {typeof window !== 'undefined' ? new Date(lastUpdated).toLocaleString('ar-EG') : new Date(lastUpdated).toISOString()}
                        </small>
                    )}
                </header>

                {/* Public Statistics - Generated with ISR */}
                <section className="stats-section">
                    <h2>إحصائيات عامة</h2>
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-number">{safeStats.totalCourses}</div>
                            <div className="stat-label">إجمالي الدورات</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-number">{safeStats.totalStudents}</div>
                            <div className="stat-label">إجمالي الطلاب</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-number">{safeStats.totalTeachers}</div>
                            <div className="stat-label">إجمالي المعلمين</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-number">{safeStats.activeCourses}</div>
                            <div className="stat-label">الدورات النشطة</div>
                        </div>
                    </div>
                </section>

                {/* Recent Courses - Generated with ISR */}
                <section className="recent-courses-section">
                    <h2>أحدث الدورات</h2>
                    <div className="courses-grid">
                        {recentCourses && recentCourses.length > 0 ? recentCourses.map(course => (
                            <div key={course?.id} className="course-card">
                                <h3>{course?.name || 'دورة غير محددة'}</h3>
                                <p>{course?.description || 'لا يوجد وصف'}</p>
                                <div className="course-meta">
                                    <span>المعلم: {course?.teacher_name || 'غير محدد'}</span>
                                    <span>الطلاب: {course?.enrolled_count || course?.student_count || 0}</span>
                                </div>
                                <div className="course-status">
                                    <span className={`status-badge ${course?.status || 'unknown'}`}>
                                        {course?.status === 'active' ? 'نشط' : 'منشور'}
                                    </span>
                                </div>
                            </div>
                        )) : (
                            <div className="no-courses">
                                <p>لا توجد دورات حديثة</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* System Announcements - Generated with ISR */}
                <section className="announcements-section">
                    <h2>الإعلانات</h2>
                    <div className="announcements-list">
                        {systemAnnouncements && systemAnnouncements.length > 0 ? (
                            systemAnnouncements.map(announcement => (
                                <div key={announcement?.id} className="announcement-card">
                                    <h4>{announcement?.title || 'إعلان'}</h4>
                                    <p>{announcement?.message || announcement?.content || 'لا يوجد محتوى'}</p>
                                    <small>
                                        {announcement?.created_at ? (
                                            typeof window !== 'undefined' 
                                                ? new Date(announcement.created_at).toLocaleDateString('ar-EG')
                                                : new Date(announcement.created_at).toISOString().split('T')[0]
                                        ) : 'تاريخ غير محدد'}
                                    </small>
                                </div>
                            ))
                        ) : (
                            <p>لا توجد إعلانات حالياً</p>
                        )}
                    </div>
                </section>

                {/* Debug Information (only in development) */}
                {process.env.NODE_ENV === 'development' && metadata && (
                    <section className="debug-section">
                        <h3>معلومات التطوير</h3>
                        <pre>{JSON.stringify(metadata, null, 2)}</pre>
                    </section>
                )}
            </div>

            <style jsx>{`
                .dashboard-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 20px;
                }

                .dashboard-header {
                    text-align: center;
                    margin-bottom: 40px;
                    padding: 30px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border-radius: 12px;
                }

                .dashboard-header h1 {
                    margin: 0 0 10px 0;
                    font-size: 2.5rem;
                }

                .dashboard-header p {
                    margin: 0 0 10px 0;
                    font-size: 1.2rem;
                    opacity: 0.9;
                }

                .last-updated {
                    opacity: 0.7;
                    font-size: 0.9rem;
                }

                .stats-section, .recent-courses-section, .announcements-section {
                    margin-bottom: 40px;
                }

                .stats-section h2, .recent-courses-section h2, .announcements-section h2 {
                    margin-bottom: 20px;
                    color: #2c3e50;
                    font-size: 1.8rem;
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }

                .stat-card {
                    background: white;
                    padding: 30px 20px;
                    border-radius: 12px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    text-align: center;
                    border: 1px solid #e1e5e9;
                }

                .stat-number {
                    font-size: 2.5rem;
                    font-weight: 700;
                    color: #667eea;
                    margin-bottom: 10px;
                }

                .stat-label {
                    color: #6c757d;
                    font-size: 1rem;
                }

                .courses-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 20px;
                }

                .course-card {
                    background: white;
                    padding: 20px;
                    border-radius: 12px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    border: 1px solid #e1e5e9;
                }

                .course-card h3 {
                    margin: 0 0 10px 0;
                    color: #2c3e50;
                    font-size: 1.3rem;
                }

                .course-card p {
                    color: #6c757d;
                    margin-bottom: 15px;
                    line-height: 1.5;
                }

                .course-meta {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 10px;
                    font-size: 0.9rem;
                    color: #6c757d;
                }

                .course-status {
                    text-align: right;
                }

                .status-badge {
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 0.8rem;
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

                .announcements-list {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }

                .announcement-card {
                    background: white;
                    padding: 20px;
                    border-radius: 12px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    border: 1px solid #e1e5e9;
                }

                .announcement-card h4 {
                    margin: 0 0 10px 0;
                    color: #2c3e50;
                }

                .announcement-card p {
                    margin: 0 0 10px 0;
                    color: #6c757d;
                    line-height: 1.5;
                }

                .announcement-card small {
                    color: #adb5bd;
                }

                .debug-section {
                    margin-top: 40px;
                    padding: 20px;
                    background: #f8f9fa;
                    border-radius: 8px;
                    border: 1px solid #dee2e6;
                }

                .debug-section h3 {
                    margin-top: 0;
                    color: #495057;
                }

                .debug-section pre {
                    background: white;
                    padding: 15px;
                    border-radius: 4px;
                    overflow-x: auto;
                    font-size: 0.8rem;
                }

                @media (max-width: 768px) {
                    .stats-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                    
                    .courses-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .course-meta {
                        flex-direction: column;
                        gap: 5px;
                    }
                    
                    .dashboard-header h1 {
                        font-size: 2rem;
                    }
                }
            `}</style>
            </PublicLayout>
        );
    } catch (error) {
        console.error('Error rendering DashboardISR:', error);
        return (
            <PublicLayout title="لوحة التحكم العامة - مركز إقامة الكتاب">
                <div className="dashboard-container">
                    <header className="dashboard-header">
                        <h1>لوحة التحكم</h1>
                        <p>حدث خطأ في تحميل البيانات</p>
                    </header>
                    <section className="stats-section">
                        <h2>إحصائيات عامة</h2>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-number">0</div>
                                <div className="stat-label">إجمالي الدورات</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-number">0</div>
                                <div className="stat-label">إجمالي الطلاب</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-number">0</div>
                                <div className="stat-label">إجمالي المعلمين</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-number">0</div>
                                <div className="stat-label">الدورات النشطة</div>
                            </div>
                        </div>
                    </section>
                    <p>يرجى المحاولة مرة أخرى لاحقاً</p>
                </div>
            </PublicLayout>
        );
    }
};

/**
 * Static Site Generation with ISR for Dashboard
 * Generates public dashboard data that doesn't require user authentication
 */
export async function getStaticProps() {
    try {
        // Execute multiple queries in parallel for better performance
        const [statsResult, coursesResult, announcementsResult] = await Promise.allSettled([
            // Public statistics
            pool.query(`
                SELECT 
                    (SELECT COUNT(*) FROM courses WHERE is_published = true) as total_courses,
                    (SELECT COUNT(DISTINCT user_id) FROM enrollments WHERE status = 'active') as total_students,
                    (SELECT COUNT(*) FROM users WHERE role = 'teacher' AND (account_status = 'active' OR account_status IS NULL)) as total_teachers,
                    (SELECT COUNT(*) FROM courses WHERE is_published = true AND is_launched = true) as active_courses
            `),
            
            // Recent courses
            pool.query(`
                SELECT 
                    c.id,
                    c.name,
                    c.description,
                    c.status,
                    c.created_at,
                    COUNT(e.id) as student_count,
                    u.full_name as teacher_name
                FROM courses c
                LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = 'active'
                LEFT JOIN users u ON c.teacher_id = u.id
                WHERE c.status IN ('active', 'published') AND c.teacher_id IS NOT NULL
                GROUP BY c.id, c.name, c.description, c.status, c.created_at, u.full_name
                ORDER BY c.created_at DESC
                LIMIT 6
            `),
            
            // System announcements (if you have an announcements table)
            pool.query(`
                SELECT 
                    id,
                    title,
                    content,
                    created_at
                FROM announcements 
                WHERE is_active = true 
                ORDER BY created_at DESC 
                LIMIT 5
            `).catch(() => ({ rows: [] })) // Fallback if announcements table doesn't exist
        ]);

        // Process statistics
        let publicStats = {
            totalCourses: 0,
            totalStudents: 0,
            totalTeachers: 0,
            activeCourses: 0
        };

        if (statsResult.status === 'fulfilled') {
            const stats = statsResult.value.rows[0] || {};
            publicStats = {
                totalCourses: parseInt(stats.total_courses || 0),
                totalStudents: parseInt(stats.total_students || 0),
                totalTeachers: parseInt(stats.total_teachers || 0),
                activeCourses: parseInt(stats.active_courses || 0)
            };
        }

        // Process recent courses
        let recentCourses = [];
        if (coursesResult.status === 'fulfilled') {
            recentCourses = coursesResult.value.rows.map(course => ({
                ...course,
                student_count: parseInt(course.student_count || 0),
                created_at: course.created_at ? new Date(course.created_at).toISOString() : null
            }));
        }

        // Process announcements
        let systemAnnouncements = [];
        if (announcementsResult.status === 'fulfilled') {
            systemAnnouncements = announcementsResult.value.rows.map(announcement => ({
                ...announcement,
                created_at: announcement.created_at ? new Date(announcement.created_at).toISOString() : null
            }));
        }

        return createSuccessResponse({
            publicStats: safeSerialize(publicStats),
            recentCourses: safeSerialize(recentCourses),
            systemAnnouncements: safeSerialize(systemAnnouncements),
            metadata: {
                queriesExecuted: 3,
                statsSuccess: statsResult.status === 'fulfilled',
                coursesSuccess: coursesResult.status === 'fulfilled',
                announcementsSuccess: announcementsResult.status === 'fulfilled',
                generatedAt: new Date().toISOString()
            }
        }, REVALIDATION_TIMES.FREQUENT);

    } catch (error) {
        console.error('Error in getStaticProps for dashboard:', error);
        
        return createErrorResponse({
            publicStats: {
                totalCourses: 0,
                totalStudents: 0,
                totalTeachers: 0,
                activeCourses: 0
            },
            recentCourses: [],
            systemAnnouncements: [],
            metadata: {
                error: error.message,
                generatedAt: new Date().toISOString()
            }
        }, REVALIDATION_TIMES.ERROR);
    }
}

// Original function (disabled during build)
async function getStaticPropsOriginal() {
    try {
        // Execute multiple queries in parallel for better performance
        const [statsResult, coursesResult, announcementsResult] = await Promise.allSettled([
            // Public statistics
            pool.query(`
                SELECT 
                    (SELECT COUNT(*) FROM courses WHERE is_published = true) as total_courses,
                    (SELECT COUNT(DISTINCT user_id) FROM enrollments WHERE status = 'active') as total_students,
                    (SELECT COUNT(*) FROM users WHERE role = 'teacher' AND (account_status = 'active' OR account_status IS NULL)) as total_teachers,
                    (SELECT COUNT(*) FROM courses WHERE is_published = true AND is_launched = true) as active_courses
            `),
            
            // Recent courses
            pool.query(`
                SELECT 
                    c.id,
                    c.name,
                    c.description,
                    c.status,
                    c.created_at,
                    COUNT(e.id) as student_count,
                    u.full_name as teacher_name
                FROM courses c
                LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = 'active'
                LEFT JOIN users u ON c.teacher_id = u.id
                WHERE c.status IN ('active', 'published') AND c.teacher_id IS NOT NULL
                GROUP BY c.id, c.name, c.description, c.status, c.created_at, u.full_name
                ORDER BY c.created_at DESC
                LIMIT 6
            `),
            
            // System announcements (if you have an announcements table)
            pool.query(`
                SELECT 
                    id,
                    title,
                    content,
                    created_at
                FROM announcements 
                WHERE is_active = true 
                ORDER BY created_at DESC 
                LIMIT 5
            `).catch(() => ({ rows: [] })) // Fallback if announcements table doesn't exist
        ]);

        // Process statistics
        let publicStats = {
            totalCourses: 0,
            totalStudents: 0,
            totalTeachers: 0,
            activeCourses: 0
        };

        if (statsResult.status === 'fulfilled') {
            const stats = statsResult.value.rows[0] || {};
            publicStats = {
                totalCourses: parseInt(stats.total_courses || 0),
                totalStudents: parseInt(stats.total_students || 0),
                totalTeachers: parseInt(stats.total_teachers || 0),
                activeCourses: parseInt(stats.active_courses || 0)
            };
        }

        // Process recent courses
        let recentCourses = [];
        if (coursesResult.status === 'fulfilled') {
            recentCourses = coursesResult.value.rows.map(course => ({
                ...course,
                student_count: parseInt(course.student_count || 0),
                created_at: course.created_at ? new Date(course.created_at).toISOString() : null
            }));
        }

        // Process announcements
        let systemAnnouncements = [];
        if (announcementsResult.status === 'fulfilled') {
            systemAnnouncements = announcementsResult.value.rows.map(announcement => ({
                ...announcement,
                created_at: announcement.created_at ? new Date(announcement.created_at).toISOString() : null
            }));
        }

        return createSuccessResponse({
            publicStats: safeSerialize(publicStats),
            recentCourses: safeSerialize(recentCourses),
            systemAnnouncements: safeSerialize(systemAnnouncements),
            metadata: {
                queriesExecuted: 3,
                statsSuccess: statsResult.status === 'fulfilled',
                coursesSuccess: coursesResult.status === 'fulfilled',
                announcementsSuccess: announcementsResult.status === 'fulfilled',
                generatedAt: new Date().toISOString()
            }
        }, REVALIDATION_TIMES.FREQUENT);

    } catch (error) {
        console.error('Error in getStaticProps for dashboard:', error);
        
        return createErrorResponse({
            publicStats: {
                totalCourses: 0,
                totalStudents: 0,
                totalTeachers: 0,
                activeCourses: 0
            },
            recentCourses: [],
            systemAnnouncements: [],
            metadata: {
                error: error.message,
                generatedAt: new Date().toISOString()
            }
        }, REVALIDATION_TIMES.ERROR);
    }
}

// Note: This page uses ISR only (getStaticProps) for public access
// For authenticated features, use dashboard.js instead

export default DashboardISR;