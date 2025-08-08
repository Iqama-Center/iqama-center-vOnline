import React, { useState } from 'react';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { withAuth } from '../../lib/withAuth';
import pool from '../../lib/db';
import { safeSerialize } from '../../lib/isrUtils';

const CourseCard = ({ course }) => {
    const getStatusBadge = (course) => {
        if (course.is_launched) {
            return <span className="status-badge active">نشطة</span>;
        } else if (course.is_published) {
            return <span className="status-badge published">منشورة</span>;
        } else {
            return <span className="status-badge draft">مسودة</span>;
        }
    };

    return (
        <div className="course-card">
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
                </div>
            </div>
        </div>
    );
};

const TeacherCoursesPage = ({ user, createdCourses, enrolledCourses, stats }) => {
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
                .section-header {
                    margin-top: 40px;
                    margin-bottom: 20px;
                    padding-bottom: 10px;
                    border-bottom: 2px solid #eee;
                }
                .section-header h2 {
                    font-size: 1.8rem;
                    color: #333;
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
            `}</style>

            <div className="courses-container">
                <div className="page-header">
                    <h1><i className="fas fa-chalkboard-teacher"></i> دوراتي</h1>
                    <p>إدارة ومتابعة جميع دوراتك</p>
                </div>

                <div className="section-header">
                    <h2>الدورات التي أنشأتها</h2>
                </div>
                {createdCourses.length > 0 ? (
                    <div className="courses-grid">
                        {createdCourses.map(course => (
                            <CourseCard key={course.id} course={course} />
                        ))}
                    </div>
                ) : (
                    <div className="no-courses">
                        <p>لم تقم بإنشاء أي دورات بعد.</p>
                    </div>
                )}

                <div className="section-header">
                    <h2>الدورات المسجل بها</h2>
                </div>
                {enrolledCourses.length > 0 ? (
                    <div className="courses-grid">
                        {enrolledCourses.map(course => (
                            <CourseCard key={course.id} course={course} />
                        ))}
                    </div>
                ) : (
                    <div className="no-courses">
                        <p>أنت غير مسجل في أي دورات حاليًا.</p>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export const getServerSideProps = withAuth(async (context) => {
    const { user } = context;
    
    try {
        // Get courses created by the user
        const createdCoursesResult = await pool.query(`
            SELECT c.*, (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id AND e.status = 'active') as student_count
            FROM courses c
            WHERE c.created_by = $1
            ORDER BY c.created_at DESC
        `, [user.id]);

        // Get courses the user is enrolled in (as level 1 or 2)
        const enrolledCoursesResult = await pool.query(`
            SELECT c.*, (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id AND e.status = 'active') as student_count
            FROM courses c
            JOIN enrollments e ON c.id = e.course_id
            WHERE e.user_id = $1 AND e.level_number IN (1, 2)
            ORDER BY c.created_at DESC
        `, [user.id]);

        return {
            props: {
                user,
                createdCourses: safeSerialize(createdCoursesResult.rows),
                enrolledCourses: safeSerialize(enrolledCoursesResult.rows),
                stats: {},
            }
        };

    } catch (error) {
        console.error('Error fetching teacher courses:', error);
        return {
            props: {
                user,
                createdCourses: [],
                enrolledCourses: [],
                stats: {},
            }
        };
    }
}, { roles: ['teacher', 'head', 'admin'] });

export default TeacherCoursesPage;
