import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { withAuth } from '../lib/withAuth';
import pool from '../lib/db';
import { safeSerialize, createSuccessResponse, createErrorResponse, REVALIDATION_TIMES } from '../lib/isrUtils';

/**
 * Enhanced Courses Page with ISR Implementation
 * 
 * This page demonstrates a hybrid approach:
 * - Static generation for public course data (ISR)
 * - Server-side rendering for user-specific data
 * - Client-side filtering and search functionality
 * 
 * Key improvements:
 * - Uses getStaticProps with revalidate for ISR
 * - Comprehensive error handling
 * - Performance optimizations
 * - Clean and scalable structure
 * - Real-time search and filtering
 */
const CoursesISR = ({ 
    courses, 
    categories, 
    stats, 
    lastUpdated, 
    metadata,
    user 
}) => {
    // Client-side state for filtering and search
    const [filteredCourses, setFilteredCourses] = useState(courses);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [sortBy, setSortBy] = useState('newest');

    // Filter and search functionality
    useEffect(() => {
        let filtered = [...courses];

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(course =>
                course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (course.teacher_name && course.teacher_name.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        // Apply category filter
        if (selectedCategory) {
            filtered = filtered.filter(course =>
                course.details?.category === selectedCategory
            );
        }

        // Apply status filter
        if (selectedStatus) {
            filtered = filtered.filter(course => course.status === selectedStatus);
        }

        // Apply sorting
        switch (sortBy) {
            case 'newest':
                filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                break;
            case 'oldest':
                filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                break;
            case 'popular':
                filtered.sort((a, b) => b.student_count - a.student_count);
                break;
            case 'name':
                filtered.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
                break;
            case 'price_low':
                filtered.sort((a, b) => a.course_fee - b.course_fee);
                break;
            case 'price_high':
                filtered.sort((a, b) => b.course_fee - a.course_fee);
                break;
            default:
                break;
        }

        setFilteredCourses(filtered);
    }, [courses, searchTerm, selectedCategory, selectedStatus, sortBy]);

    return (
        <Layout user={user}>
            <div className="courses-container">
                {/* Header Section */}
                <header className="courses-header">
                    <h1>الدورات المتاحة</h1>
                    <p>اكتشف مجموعة متنوعة من الدورات التعليمية والتدريبية</p>
                    
                    {/* Statistics */}
                    <div className="stats-summary">
                        <div className="stat-item">
                            <span className="stat-number">{stats.totalCourses}</span>
                            <span className="stat-label">إجمالي الدورات</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">{stats.activeCourses}</span>
                            <span className="stat-label">دورة نشطة</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">{stats.totalStudents}</span>
                            <span className="stat-label">طالب مسجل</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">{stats.completedEnrollments}</span>
                            <span className="stat-label">تم إكمالها</span>
                        </div>
                    </div>
                </header>

                {/* Filters and Search */}
                <section className="filters-section">
                    <div className="search-bar">
                        <input
                            type="text"
                            placeholder="البحث في الدورات..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>

                    <div className="filters-row">
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="filter-select"
                        >
                            <option value="">جميع الفئات</option>
                            {categories.map(category => (
                                <option key={category.name} value={category.name}>
                                    {category.name} ({category.count})
                                </option>
                            ))}
                        </select>

                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="filter-select"
                        >
                            <option value="">جميع الحالات</option>
                            <option value="active">نشط</option>
                            <option value="published">منشور</option>
                        </select>

                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="filter-select"
                        >
                            <option value="newest">الأحدث</option>
                            <option value="oldest">الأقدم</option>
                            <option value="popular">الأكثر شعبية</option>
                            <option value="name">الاسم</option>
                            <option value="price_low">السعر (الأقل)</option>
                            <option value="price_high">السعر (الأعلى)</option>
                        </select>
                    </div>

                    <div className="results-info">
                        <span>عرض {filteredCourses.length} من {courses.length} دورة</span>
                        <small>آخر تحديث: {new Date(lastUpdated).toLocaleString('ar-EG')}</small>
                    </div>
                </section>

                {/* Courses Grid */}
                <section className="courses-grid">
                    {filteredCourses.length > 0 ? (
                        filteredCourses.map(course => (
                            <div key={course.id} className="course-card">
                                <div className="course-header">
                                    <h3>{course.name}</h3>
                                    <div className="course-badges">
                                        <span className={`status-badge ${course.status}`}>
                                            {course.status === 'active' ? 'نشط' : 'منشور'}
                                        </span>
                                        {course.is_full && (
                                            <span className="status-badge full">مكتمل</span>
                                        )}
                                    </div>
                                </div>

                                <div className="course-content">
                                    <p className="course-description">{course.description}</p>
                                    
                                    <div className="course-details">
                                        <div className="detail-row">
                                            <span className="detail-label">المعلم:</span>
                                            <span className="detail-value">{course.teacher_name || 'غير محدد'}</span>
                                        </div>
                                        
                                        {course.course_fee > 0 && (
                                            <div className="detail-row">
                                                <span className="detail-label">الرسوم:</span>
                                                <span className="detail-value">{course.course_fee} جنيه</span>
                                            </div>
                                        )}
                                        
                                        {course.duration_days > 0 && (
                                            <div className="detail-row">
                                                <span className="detail-label">المدة:</span>
                                                <span className="detail-value">{course.duration_days} يوم</span>
                                            </div>
                                        )}
                                        
                                        <div className="detail-row">
                                            <span className="detail-label">المسجلين:</span>
                                            <span className="detail-value">
                                                {course.student_count}
                                                {course.max_participants > 0 && ` / ${course.max_participants}`}
                                            </span>
                                        </div>

                                        {course.enrollment_percentage > 0 && (
                                            <div className="enrollment-progress">
                                                <div className="progress-bar">
                                                    <div 
                                                        className="progress-fill"
                                                        style={{ width: `${Math.min(course.enrollment_percentage, 100)}%` }}
                                                    ></div>
                                                </div>
                                                <span className="progress-text">{course.enrollment_percentage}% مكتمل</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="course-footer">
                                    <div className="course-meta">
                                        <small>
                                            تم الإنشاء: {new Date(course.created_at).toLocaleDateString('ar-EG')}
                                        </small>
                                        {course.details?.category && (
                                            <small className="category-tag">
                                                {course.details.category}
                                            </small>
                                        )}
                                    </div>
                                    
                                    <div className="course-actions">
                                        <button 
                                            className="btn btn-primary"
                                            disabled={course.is_full}
                                            onClick={() => {
                                                // Handle enrollment
                                                window.location.href = `/courses/${course.id}`;
                                            }}
                                        >
                                            {course.is_full ? 'مكتمل' : 'عرض التفاصيل'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="no-courses">
                            <h3>لا توجد دورات تطابق البحث</h3>
                            <p>جرب تغيير معايير البحث أو الفلترة</p>
                            <button 
                                className="btn btn-secondary"
                                onClick={() => {
                                    setSearchTerm('');
                                    setSelectedCategory('');
                                    setSelectedStatus('');
                                    setSortBy('newest');
                                }}
                            >
                                إعادة تعيين الفلاتر
                            </button>
                        </div>
                    )}
                </section>

                {/* Debug Information (development only) */}
                {process.env.NODE_ENV === 'development' && metadata && (
                    <section className="debug-section">
                        <h3>معلومات التطوير</h3>
                        <details>
                            <summary>عرض البيانات التقنية</summary>
                            <pre>{JSON.stringify(metadata, null, 2)}</pre>
                        </details>
                    </section>
                )}
            </div>

            <style jsx>{`
                .courses-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 20px;
                    font-family: 'Tajawal', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .courses-header {
                    text-align: center;
                    margin-bottom: 40px;
                    padding: 40px 20px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border-radius: 12px;
                }

                .courses-header h1 {
                    font-size: 2.5rem;
                    margin-bottom: 10px;
                    font-weight: 700;
                }

                .courses-header p {
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

                .filters-section {
                    background: white;
                    padding: 30px;
                    border-radius: 12px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    margin-bottom: 30px;
                    border: 1px solid #e1e5e9;
                }

                .search-bar {
                    margin-bottom: 20px;
                }

                .search-input {
                    width: 100%;
                    padding: 12px 20px;
                    border: 2px solid #e1e5e9;
                    border-radius: 8px;
                    font-size: 1rem;
                    transition: border-color 0.3s ease;
                }

                .search-input:focus {
                    outline: none;
                    border-color: #667eea;
                }

                .filters-row {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    margin-bottom: 20px;
                }

                .filter-select {
                    padding: 10px 15px;
                    border: 2px solid #e1e5e9;
                    border-radius: 8px;
                    font-size: 0.9rem;
                    background: white;
                    cursor: pointer;
                    transition: border-color 0.3s ease;
                }

                .filter-select:focus {
                    outline: none;
                    border-color: #667eea;
                }

                .results-info {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    color: #6c757d;
                    font-size: 0.9rem;
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

                .course-badges {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                }

                .status-badge {
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 0.7rem;
                    font-weight: 500;
                    text-align: center;
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

                .status-badge.full {
                    background: #f8d7da;
                    color: #721c24;
                }

                .course-content {
                    padding: 20px;
                }

                .course-description {
                    color: #6c757d;
                    line-height: 1.6;
                    margin-bottom: 20px;
                }

                .course-details {
                    margin-bottom: 20px;
                }

                .detail-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                    font-size: 0.9rem;
                }

                .detail-label {
                    font-weight: 600;
                    color: #495057;
                }

                .detail-value {
                    color: #6c757d;
                }

                .enrollment-progress {
                    margin-top: 15px;
                }

                .progress-bar {
                    width: 100%;
                    height: 8px;
                    background: #e9ecef;
                    border-radius: 4px;
                    overflow: hidden;
                    margin-bottom: 5px;
                }

                .progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #28a745, #20c997);
                    transition: width 0.3s ease;
                }

                .progress-text {
                    font-size: 0.8rem;
                    color: #6c757d;
                }

                .course-footer {
                    padding: 0 20px 20px;
                }

                .course-meta {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                    font-size: 0.8rem;
                    color: #6c757d;
                }

                .category-tag {
                    background: #f8f9fa;
                    padding: 2px 8px;
                    border-radius: 12px;
                    color: #495057;
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

                .no-courses p {
                    margin-bottom: 20px;
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
                    margin-top: 10px;
                }

                @media (max-width: 768px) {
                    .courses-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .stats-summary {
                        gap: 20px;
                    }
                    
                    .courses-header h1 {
                        font-size: 2rem;
                    }
                    
                    .filters-row {
                        grid-template-columns: 1fr;
                    }
                    
                    .results-info {
                        flex-direction: column;
                        gap: 10px;
                        text-align: center;
                    }
                    
                    .course-meta {
                        flex-direction: column;
                        gap: 5px;
                        text-align: center;
                    }
                }
            `}</style>
        </Layout>
    );
};

/**
 * Enhanced Static Site Generation with ISR
 * Comprehensive implementation with error handling and performance optimization
 */
export async function getStaticProps() {
    try {
        // Execute multiple queries in parallel for optimal performance
        const [coursesResult, categoriesResult, statsResult] = await Promise.allSettled([
            // Enhanced courses query with comprehensive data
            pool.query(`
                SELECT 
                    c.id,
                    c.name,
                    c.description,
                    c.details,
                    c.status,
                    c.created_at,
                    c.course_fee,
                    c.duration_days,
                    c.max_participants,
                    c.start_date,
                    c.end_date,
                    c.is_published,
                    COUNT(e.id) as student_count,
                    u.full_name as teacher_name,
                    u.id as teacher_id
                FROM courses c
                LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = 'active'
                LEFT JOIN users u ON c.teacher_id = u.id
                WHERE c.status IN ('active', 'published')
                GROUP BY c.id, c.name, c.description, c.details, c.status, c.created_at,
                         c.course_fee, c.duration_days, c.max_participants, c.start_date,
                         c.end_date, c.is_published, u.full_name, u.id
                ORDER BY c.created_at DESC, student_count DESC
                LIMIT 100
            `),
            
            // Categories with enhanced data
            pool.query(`
                SELECT 
                    COALESCE(details->>'category', 'عام') as name,
                    COUNT(*) as count,
                    AVG(course_fee) as avg_fee
                FROM courses 
                WHERE status IN ('active', 'published')
                GROUP BY details->>'category'
                ORDER BY count DESC
                LIMIT 20
            `),
            
            // Comprehensive statistics
            pool.query(`
                SELECT 
                    (SELECT COUNT(*) FROM courses WHERE status IN ('active', 'published')) as total_courses,
                    (SELECT COUNT(*) FROM courses WHERE status = 'active') as active_courses,
                    (SELECT COUNT(DISTINCT user_id) FROM enrollments WHERE status = 'active') as total_students,
                    (SELECT COUNT(*) FROM enrollments WHERE status = 'completed') as completed_enrollments,
                    (SELECT COUNT(*) FROM users WHERE role = 'teacher' AND account_status = 'active') as total_teachers,
                    (SELECT AVG(course_fee) FROM courses WHERE status IN ('active', 'published') AND course_fee > 0) as avg_course_fee
            `)
        ]);

        // Process courses with enhanced data transformation
        let courses = [];
        if (coursesResult.status === 'fulfilled') {
            courses = coursesResult.value.rows.map(course => {
                const studentCount = parseInt(course.student_count || 0);
                const maxParticipants = parseInt(course.max_participants || 0);
                
                return {
                    ...course,
                    details: typeof course.details === 'object' ? course.details : {},
                    student_count: studentCount,
                    course_fee: parseFloat(course.course_fee || 0),
                    duration_days: parseInt(course.duration_days || 0),
                    max_participants: maxParticipants,
                    created_at: course.created_at ? new Date(course.created_at).toISOString() : null,
                    start_date: course.start_date ? new Date(course.start_date).toISOString() : null,
                    end_date: course.end_date ? new Date(course.end_date).toISOString() : null,
                    is_full: maxParticipants > 0 && studentCount >= maxParticipants,
                    enrollment_percentage: maxParticipants > 0 
                        ? Math.round((studentCount / maxParticipants) * 100) 
                        : 0
                };
            });
        }

        // Process categories
        let categories = [];
        if (categoriesResult.status === 'fulfilled') {
            categories = categoriesResult.value.rows.map(cat => ({
                name: cat.name || 'عام',
                count: parseInt(cat.count || 0),
                avgFee: parseFloat(cat.avg_fee || 0)
            }));
        }

        // Process statistics
        let stats = {
            totalCourses: 0,
            activeCourses: 0,
            totalStudents: 0,
            completedEnrollments: 0,
            totalTeachers: 0,
            avgCourseFee: 0
        };

        if (statsResult.status === 'fulfilled') {
            const statsRow = statsResult.value.rows[0] || {};
            stats = {
                totalCourses: parseInt(statsRow.total_courses || 0),
                activeCourses: parseInt(statsRow.active_courses || 0),
                totalStudents: parseInt(statsRow.total_students || 0),
                completedEnrollments: parseInt(statsRow.completed_enrollments || 0),
                totalTeachers: parseInt(statsRow.total_teachers || 0),
                avgCourseFee: parseFloat(statsRow.avg_course_fee || 0)
            };
        }

        return createSuccessResponse({
            courses: safeSerialize(courses),
            categories: safeSerialize(categories),
            stats: safeSerialize(stats),
            metadata: {
                totalFetched: courses.length,
                queriesExecuted: 3,
                coursesSuccess: coursesResult.status === 'fulfilled',
                categoriesSuccess: categoriesResult.status === 'fulfilled',
                statsSuccess: statsResult.status === 'fulfilled',
                cacheStrategy: 'ISR',
                generatedAt: new Date().toISOString()
            }
        }, REVALIDATION_TIMES.FREQUENT);

    } catch (error) {
        console.error('Critical error in getStaticProps for courses:', error);
        
        return createErrorResponse({
            courses: [],
            categories: [],
            stats: {
                totalCourses: 0,
                activeCourses: 0,
                totalStudents: 0,
                completedEnrollments: 0,
                totalTeachers: 0,
                avgCourseFee: 0
            },
            metadata: {
                error: error.message,
                generatedAt: new Date().toISOString()
            }
        }, REVALIDATION_TIMES.ERROR);
    }
}

/**
 * Server-side rendering for user-specific data
 * Combines static props with user authentication
 */
export const getServerSideProps = withAuth(async (context) => {
    try {
        // Get static props first
        const staticProps = await getStaticProps();
        
        // Add any user-specific data here if needed
        // For example: user's enrolled courses, recommendations, etc.
        
        return {
            props: {
                ...staticProps.props,
                // User data is automatically added by withAuth
            }
        };
    } catch (error) {
        console.error('Error in getServerSideProps for courses:', error);
        
        // Fallback to static props only
        const staticProps = await getStaticProps();
        return staticProps;
    }
});

export default CoursesISR;