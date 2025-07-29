import React, { useState } from 'react';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { withAuth } from '../../lib/withAuth';
import pool from '../../lib/db';
import { safeSerialize, createSuccessResponse, createErrorResponse, REVALIDATION_TIMES } from '../../lib/isrUtils';

const TeacherCoursesPage = ({ user, courses, stats }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Filter courses based on search and status
    const filteredCourses = courses.filter(course => {
        const matchesSearch = course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            course.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || course.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (course) => {
        if (course.is_launched) {
            return <span className="status-badge active">نشطة</span>;
        } else if (course.is_published) {
            return <span className="status-badge published">منشورة</span>;
        } else {
            return <span className="status-badge draft">مسودة</span>;
        }
    };

    const getStatusColor = (course) => {
        if (course.is_launched) return '#28a745';
        if (course.is_published) return '#17a2b8';
        return '#6c757d';
    };

    return (
        <Layout user={user}>
            <style jsx>{`
                .courses-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .page-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 30px;
                    border-radius: 10px;
                    margin-bottom: 30px;
                    text-align: center;
                }
                .page-header h1 {
                    margin: 0 0 10px 0;
                    font-size: 2.5rem;
                }
                .page-header p {
                    margin: 0;
                    opacity: 0.9;
                    font-size: 1.1rem;
                }
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }
                .stat-card {
                    background: white;
                    padding: 20px;
                    border-radius: 10px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    text-align: center;
                    border-left: 4px solid #17a2b8;
                }
                .stat-card .number {
                    font-size: 2rem;
                    font-weight: bold;
                    color: #17a2b8;
                    margin-bottom: 5px;
                }
                .stat-card .label {
                    color: #666;
                    font-size: 0.9rem;
                }
                .filters-section {
                    background: white;
                    padding: 20px;
                    border-radius: 10px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    margin-bottom: 30px;
                }
                .filters-row {
                    display: flex;
                    gap: 20px;
                    align-items: center;
                    flex-wrap: wrap;
                }
                .search-box {
                    flex: 1;
                    min-width: 250px;
                }
                .search-box input {
                    width: 100%;
                    padding: 12px;
                    border: 2px solid #e9ecef;
                    border-radius: 8px;
                    font-size: 1rem;
                    transition: border-color 0.3s ease;
                }
                .search-box input:focus {
                    outline: none;
                    border-color: #17a2b8;
                }
                .filter-select {
                    padding: 12px;
                    border: 2px solid #e9ecef;
                    border-radius: 8px;
                    font-size: 1rem;
                    background: white;
                    cursor: pointer;
                }
                .courses-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
                    gap: 25px;
                }
                .course-card {
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    overflow: hidden;
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                    border-top: 4px solid #17a2b8;
                }
                .course-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
                }
                .course-header {
                    padding: 20px;
                    border-bottom: 1px solid #f0f0f0;
                }
                .course-title {
                    font-size: 1.3rem;
                    font-weight: bold;
                    margin: 0 0 10px 0;
                    color: #333;
                    line-height: 1.4;
                }
                .course-description {
                    color: #666;
                    font-size: 0.95rem;
                    line-height: 1.5;
                    margin-bottom: 15px;
                }
                .course-meta {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                }
                .status-badge {
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    font-weight: bold;
                    text-transform: uppercase;
                }
                .status-badge.active {
                    background: #d4edda;
                    color: #155724;
                }
                .status-badge.published {
                    background: #d1ecf1;
                    color: #0c5460;
                }
                .status-badge.draft {
                    background: #f8d7da;
                    color: #721c24;
                }
                .course-stats {
                    display: flex;
                    gap: 15px;
                    font-size: 0.9rem;
                    color: #666;
                }
                .course-stats span {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                .course-body {
                    padding: 20px;
                }
                .course-details {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                    margin-bottom: 20px;
                }
                .detail-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 0.9rem;
                    color: #555;
                }
                .detail-item i {
                    color: #17a2b8;
                    width: 16px;
                }
                .course-actions {
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                }
                .btn {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 6px;
                    text-decoration: none;
                    font-size: 0.9rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                }
                .btn-primary {
                    background: #17a2b8;
                    color: white;
                }
                .btn-primary:hover {
                    background: #138496;
                    color: white;
                }
                .btn-secondary {
                    background: #6c757d;
                    color: white;
                }
                .btn-secondary:hover {
                    background: #545b62;
                    color: white;
                }
                .btn-success {
                    background: #28a745;
                    color: white;
                }
                .btn-success:hover {
                    background: #218838;
                    color: white;
                }
                .no-courses {
                    text-align: center;
                    padding: 60px 20px;
                    color: #666;
                }
                .no-courses i {
                    font-size: 4rem;
                    color: #ddd;
                    margin-bottom: 20px;
                }
                .no-courses h3 {
                    margin-bottom: 10px;
                    color: #333;
                }
                .create-course-btn {
                    background: #28a745;
                    color: white;
                    padding: 12px 24px;
                    border-radius: 8px;
                    text-decoration: none;
                    font-weight: bold;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    margin-top: 20px;
                    transition: background 0.3s ease;
                }
                .create-course-btn:hover {
                    background: #218838;
                    color: white;
                }
                @media (max-width: 768px) {
                    .courses-grid {
                        grid-template-columns: 1fr;
                    }
                    .filters-row {
                        flex-direction: column;
                        align-items: stretch;
                    }
                    .search-box {
                        min-width: auto;
                    }
                    .course-details {
                        grid-template-columns: 1fr;
                    }
                    .course-actions {
                        justify-content: center;
                    }
                }
            `}</style>

            <div className="courses-container">
                <div className="page-header">
                    <h1><i className="fas fa-chalkboard-teacher"></i> دوراتي التدريبية</h1>
                    <p>إدارة ومتابعة جميع الدورات التي تقوم بتدريسها</p>
                </div>

                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="number">{stats.total_courses}</div>
                        <div className="label">إجمالي الدورات</div>
                    </div>
                    <div className="stat-card">
                        <div className="number">{stats.active_courses}</div>
                        <div className="label">الدورات النشطة</div>
                    </div>
                    <div className="stat-card">
                        <div className="number">{stats.total_students}</div>
                        <div className="label">إجمالي الطلاب</div>
                    </div>
                    <div className="stat-card">
                        <div className="number">{stats.completed_students}</div>
                        <div className="label">الطلاب المتخرجون</div>
                    </div>
                </div>

                <div className="filters-section">
                    <div className="filters-row">
                        <div className="search-box">
                            <input
                                type="text"
                                placeholder="البحث في الدورات..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select
                            className="filter-select"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">جميع الحالات</option>
                            <option value="draft">مسودة</option>
                            <option value="published">منشورة</option>
                            <option value="active">نشطة</option>
                        </select>
                        <Link href="/admin/courses/new" className="create-course-btn">
                            <i className="fas fa-plus"></i>
                            إنشاء دورة جديدة
                        </Link>
                    </div>
                </div>

                {filteredCourses.length > 0 ? (
                    <div className="courses-grid">
                        {filteredCourses.map(course => (
                            <div key={course.id} className="course-card">
                                <div className="course-header">
                                    <h3 className="course-title">{course.name}</h3>
                                    <p className="course-description">
                                        {course.description || 'لا يوجد وصف متاح'}
                                    </p>
                                    <div className="course-meta">
                                        {getStatusBadge(course)}
                                        <div className="course-stats">
                                            <span>
                                                <i className="fas fa-users"></i>
                                                {course.student_count || 0} طالب
                                            </span>
                                            <span>
                                                <i className="fas fa-clock"></i>
                                                {course.duration_days || 0} يوم
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="course-body">
                                    <div className="course-details">
                                        <div className="detail-item">
                                            <i className="fas fa-calendar-alt"></i>
                                            <span>
                                                {course.start_date 
                                                    ? new Date(course.start_date).toLocaleDateString('ar-SA')
                                                    : 'لم يحدد بعد'
                                                }
                                            </span>
                                        </div>
                                        <div className="detail-item">
                                            <i className="fas fa-money-bill-wave"></i>
                                            <span>{course.course_fee || 0} ريال</span>
                                        </div>
                                        <div className="detail-item">
                                            <i className="fas fa-user-clock"></i>
                                            <span>{course.pending_count || 0} في الانتظار</span>
                                        </div>
                                        <div className="detail-item">
                                            <i className="fas fa-chart-line"></i>
                                            <span>
                                                {course.student_count > 0 
                                                    ? Math.round((course.student_count / (course.max_participants || 20)) * 100)
                                                    : 0
                                                }% ممتلئة
                                            </span>
                                        </div>
                                    </div>

                                    <div className="course-actions">
                                        <Link href={`/teacher/course/${course.id}`} className="btn btn-primary">
                                            <i className="fas fa-cog"></i>
                                            إدارة الدورة
                                        </Link>
                                        
                                        {course.is_launched && (
                                            <Link href={`/courses/${course.id}/messages`} className="btn btn-secondary">
                                                <i className="fas fa-comments"></i>
                                                الرسائل
                                            </Link>
                                        )}
                                        
                                        {!course.is_published && (
                                            <Link href={`/admin/courses/${course.id}/edit`} className="btn btn-secondary">
                                                <i className="fas fa-edit"></i>
                                                تعديل
                                            </Link>
                                        )}
                                        
                                        {course.is_published && !course.is_launched && (
                                            <button className="btn btn-success">
                                                <i className="fas fa-rocket"></i>
                                                إطلاق الدورة
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="no-courses">
                        <i className="fas fa-chalkboard-teacher"></i>
                        <h3>لا توجد دورات</h3>
                        <p>
                            {searchTerm || statusFilter !== 'all' 
                                ? 'لا توجد دورات تطابق معايير البحث المحددة'
                                : 'لم تقم بإنشاء أي دورات بعد'
                            }
                        </p>
                        {!searchTerm && statusFilter === 'all' && (
                            <Link href="/admin/courses/new" className="create-course-btn">
                                <i className="fas fa-plus"></i>
                                إنشاء دورتك الأولى
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export const getServerSideProps = withAuth(async (context) => {
    const { user } = context;
    
    try {
        // Get teacher's courses with comprehensive data
        const coursesResult = await pool.query(`
            SELECT 
                c.*,
                (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id AND e.status = 'active') as student_count,
                (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id AND e.status IN ('pending_payment', 'pending_approval')) as pending_count,
                (SELECT AVG(rating) FROM course_ratings cr WHERE cr.course_id = c.id) as average_rating,
                (SELECT COUNT(*) FROM course_ratings cr WHERE cr.course_id = c.id) as rating_count,
                (SELECT COUNT(*) FROM course_messages cm WHERE cm.course_id = c.id) as message_count,
                (SELECT COUNT(*) FROM exams ex WHERE ex.course_id = c.id) as exam_count
            FROM courses c
            WHERE (c.teacher_id = $1 OR c.created_by = $1)
            ORDER BY c.created_at DESC
        `, [user.id]);

        // Get teacher statistics
        const statsResult = await pool.query(`
            SELECT 
                COUNT(*) as total_courses,
                COUNT(CASE WHEN c.is_launched = true THEN 1 END) as active_courses,
                COUNT(CASE WHEN c.is_published = true AND c.is_launched = false THEN 1 END) as published_courses,
                COUNT(CASE WHEN c.is_published = false THEN 1 END) as draft_courses,
                COALESCE(SUM((SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id AND e.status = 'active')), 0) as total_students,
                COALESCE(SUM((SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id AND e.status = 'completed')), 0) as completed_students,
                COALESCE(AVG((SELECT AVG(rating) FROM course_ratings cr WHERE cr.course_id = c.id)), 0) as average_rating
            FROM courses c
            WHERE (c.teacher_id = $1 OR c.created_by = $1)
        `, [user.id]);

        const courses = safeSerialize(coursesResult.rows);
        const stats = statsResult.rows[0] || {
            total_courses: 0,
            active_courses: 0,
            published_courses: 0,
            draft_courses: 0,
            total_students: 0,
            completed_students: 0,
            average_rating: 0
        };

        return createSuccessResponse({
            user,
            courses,
            stats: safeSerialize(stats)
        }, REVALIDATION_TIMES.FREQUENT);

    } catch (error) {
        console.error('Error fetching teacher courses:', error);
        
        return createErrorResponse({
            user,
            courses: [],
            stats: {
                total_courses: 0,
                active_courses: 0,
                published_courses: 0,
                draft_courses: 0,
                total_students: 0,
                completed_students: 0,
                average_rating: 0
            }
        });
    }
}, { roles: ['teacher'] });

export default TeacherCoursesPage;