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
            filtered = filtered.filter(course => {
                if (selectedStatus === 'available') {
                    return course.student_count < course.max_enrollment;
                }
                if (selectedStatus === 'full') {
                    return course.student_count >= course.max_enrollment;
                }
                if (selectedStatus === 'active') {
                    return course.is_launched;
                }
                return true;
            });
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
                            <span className="stat-number">{stats.total_courses}</span>
                            <span className="stat-label">إجمالي الدورات</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">{stats.active_courses}</span>
                            <span className="stat-label">دورة نشطة</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">{stats.total_students}</span>
                            <span className="stat-label">طالب مسجل</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">{stats.completed_enrollments}</span>
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

                        <div className="filter-group">
                            <label htmlFor="status-filter">الحالة</label>
                            <select 
                                id="status-filter"
                                value={selectedStatus} 
                                onChange={(e) => setSelectedStatus(e.target.value)}
                            >
                                <option value="">كل الحالات</option>
                                <option value="available">متاح للتسجيل</option>
                                <option value="full">مكتمل</option>
                                <option value="active">نشط حالياً</option>
                            </select>
                        </div>
                        
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

                                <div className="course-card-footer">
                                    <span className="course-price">{course.course_fee > 0 ? `${course.course_fee} ريال` : 'مجاني'}</span>
                                    <a href={`/courses/${course.id}`} className="course-link">
                                        التفاصيل <i className="fas fa-arrow-left"></i>
                                    </a>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="no-courses-found">
                            <i className="fas fa-search-minus"></i>
                            <p>لم يتم العثور على دورات تطابق معايير البحث.</p>
                        </div>
                    )}
                </section>

                {/* Footer with metadata */}
                <footer className="courses-footer">
                    <p>
                        آخر تحديث للصفحة: {new Date(lastUpdated).toLocaleString('ar-EG')}
                    </p>
                    <p>
                        تم بناء هذه الصفحة باستخدام تقنية ISR (Incremental Static Regeneration) لتوفير أداء عالٍ.
                    </p>
                </footer>
            </div>
            <style jsx>{`
                .courses-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 20px;
                    font-family: 'Tajawal', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                /* --- Header & Stats Section --- */
                .courses-header {
                    text-align: center;
                    margin-bottom: 40px;
                    padding: 40px 20px;
                    background: linear-gradient(135deg, var(--primary-color, #667eea) 0%, var(--primary-dark-color, #764ba2) 100%);
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
                }
                .stat-label {
                    font-size: 0.9rem;
                    opacity: 0.8;
                }

                /* --- Filters Section --- */
                .filters-section {
                    background: white;
                    padding: 30px;
                    border-radius: 12px;
                    box-shadow: var(--shadow-md);
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
                    border-color: var(--primary-color, #667eea);
                }
                .filters-row {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    margin-bottom: 20px;
                }
                .filter-select, .filter-group select {
                    width: 100%;
                    padding: 10px 15px;
                    border: 2px solid #e1e5e9;
                    border-radius: 8px;
                    font-size: 0.9rem;
                    background: white;
                    cursor: pointer;
                    transition: border-color 0.3s ease;
                }
                .filter-select:focus, .filter-group select:focus {
                    outline: none;
                    border-color: var(--primary-color, #667eea);
                }
                .filter-group label {
                    display: block;
                    font-size: 0.8rem;
                    margin-bottom: 5px;
                    color: var(--gray-600);
                }
                .results-info {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    color: #6c757d;
                    font-size: 0.9rem;
                }

                /* --- Courses Grid & Cards --- */
                .courses-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                    gap: 30px;
                    margin-bottom: 40px;
                }
                .course-card {
                    background: white;
                    border-radius: 12px;
                    box-shadow: var(--shadow-md);
                    overflow: hidden;
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                    border: 1px solid #e1e5e9;
                    display: flex;
                    flex-direction: column;
                }
                .course-card:hover {
                    transform: translateY(-5px);
                    box-shadow: var(--shadow-xl);
                }
                .course-header {
                    padding: 20px;
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
                }
                .course-badges {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                    align-items: flex-end;
                }
                .status-badge {
                    padding: 4px 10px;
                    border-radius: 12px;
                    font-size: 0.75rem;
                    font-weight: 500;
                    white-space: nowrap;
                }
                .status-badge.active {
                    background: #d4edda; color: #155724;
                }
                .status-badge.published {
                    background: #cce7ff; color: #004085;
                }
                .status-badge.full {
                    background: #f8d7da; color: #721c24;
                }
                .course-content {
                    padding: 0 20px 20px;
                    flex-grow: 1;
                }
                .course-description {
                    color: #6c757d;
                    line-height: 1.6;
                    margin-bottom: 20px;
                    font-size: 0.95rem;
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
                    width: 100%; height: 8px; background: #e9ecef;
                    border-radius: 4px; overflow: hidden; margin-bottom: 5px;
                }
                .progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #28a745, #20c997);
                    transition: width 0.3s ease;
                }
                .progress-text {
                    font-size: 0.8rem; color: #6c757d;
                }

                /* CORRECTED: Renamed and improved footer styles */
                .course-card-footer {
                    padding: 15px 20px;
                    background: #f8f9fa;
                    border-top: 1px solid #e1e5e9;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                /* NEW: Styles for price and details link */
                .course-price {
                    font-size: 1.2rem;
                    font-weight: 700;
                    color: var(--primary-color, #667eea);
                }
                .course-link {
                    background: var(--primary-color, #667eea);
                    color: white;
                    padding: 8px 16px;
                    border-radius: 6px;
                    text-decoration: none;
                    font-weight: 500;
                    transition: background-color 0.3s ease;
                }
                .course-link:hover {
                    background: var(--primary-dark-color, #5a67d8);
                }
                .course-link i {
                    margin-right: 5px; /* In RTL, this is margin-left */
                }

                /* CORRECTED: Renamed no-courses to no-courses-found */
                .no-courses-found {
                    grid-column: 1 / -1;
                    text-align: center;
                    padding: 60px 20px;
                    color: #6c757d;
                    background: #f8f9fa;
                    border-radius: 12px;
                }
                .no-courses-found i {
                    font-size: 3rem;
                    margin-bottom: 15px;
                    color: #ced4da;
                }

                /* NEW: Styles for the page footer */
                .courses-footer {
                    text-align: center;
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 1px solid #e1e5e9;
                    color: #6c757d;
                    font-size: 0.9rem;
                }
                
                /* --- Responsive Design --- */
                @media (max-width: 768px) {
                    .courses-grid { grid-template-columns: 1fr; }
                    .stats-summary { gap: 20px; }
                    .courses-header h1 { font-size: 2rem; }
                    .filters-row { grid-template-columns: 1fr; }
                    .results-info { flex-direction: column; gap: 10px; text-align: center; }
                }
            `}</style>
        </Layout>
    );

};

/**
 * getStaticProps: Fetches data at build time and re-generates it periodically.
 */
export const getStaticProps = withAuth(async (context) => {
    console.log('Fetching data for courses-isr page...');
    let client;
    const { user } = context; // Get user from context

    try {
        client = await pool.connect();

        // Fetch public courses with teacher name and student count
        const coursesQuery = `
            SELECT 
                c.id, c.name, c.description, c.course_fee, c.max_enrollment, c.is_launched,
                c.created_at, c.details,
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

        // Fetch distinct categories from course details
        const categoriesQuery = `
            SELECT DISTINCT(details->>'category') as category 
            FROM courses 
            WHERE details->>'category' IS NOT NULL AND is_public = true;
        `;
        const categoriesRes = await client.query(categoriesQuery);

        // Fetch statistics
        const statsQuery = `
            SELECT
                (SELECT COUNT(*)::int FROM courses WHERE is_public = true AND is_published = true) as total_courses,
                (SELECT COUNT(*)::int FROM users WHERE role = 'student') as total_students,
                (SELECT COUNT(*)::int FROM users WHERE role = 'teacher') as total_teachers,
                (SELECT COUNT(*)::int FROM courses WHERE is_launched = true AND is_public = true AND is_published = true) as active_courses,
                (SELECT COUNT(*)::int FROM enrollments WHERE status = 'completed') as completed_enrollments;
        `;
        const statsRes = await client.query(statsQuery);

        return createSuccessResponse({
            courses: coursesRes.rows,
            categories: categoriesRes.rows.map(r => r.category),
            stats: statsRes.rows[0],
            user: user, // Pass user to the component
        });

    } catch (error) {
        console.error('ISR Error in courses-isr:', error);
        return createErrorResponse(error);

    } finally {
        if (client) client.release();
        console.log('Finished fetching data for courses-isr.');
    }
});

// Wrap the component with withAuth to get user info
// export default withAuth(CoursesISR); // Remove this line

export default CoursesISR;