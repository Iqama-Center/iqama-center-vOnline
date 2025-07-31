import React from 'react';
import LandingPage from '../components/LandingPage';
import pool from '../lib/db';

/**
 * Home page component with optimized loading
 */
export default function HomePage({ siteStats, featuredCourses, lastUpdated, isDevelopmentMode }) {
    return (
        <LandingPage 
            siteStats={siteStats}
            featuredCourses={featuredCourses}
            lastUpdated={lastUpdated}
            isDevelopmentMode={isDevelopmentMode}
        />
    );
}

/**
 * Static Site Generation with optimized loading
 */
export async function getStaticProps() {
    // Fast loading in development mode
    if (process.env.NODE_ENV === 'development') {
        console.log('🚀 Development mode: Using fast fallback data');
        return {
            props: {
                siteStats: {
                    totalCourses: 25,
                    totalStudents: 150,
                    totalTeachers: 12,
                    completedCourses: 45
                },
                featuredCourses: [
                    {
                        id: 1,
                        name: "دورة تعليم القرآن الكريم",
                        description: "دورة شاملة لتعليم القرآن الكريم والتجويد مع أفضل المعلمين",
                        details: { category: "تعليم ديني", level: "مبتدئ إلى متقدم" },
                        enrolled_count: 25,
                        course_fee: 300,
                        duration_days: 30,
                        teacher_name: "الأستاذ محمد أحمد",
                        created_at: new Date().toISOString()
                    },
                    {
                        id: 2,
                        name: "دورة اللغة العربية",
                        description: "تعلم اللغة العربية من الأساسيات حتى الإتقان",
                        details: { category: "لغات", level: "مبتدئ" },
                        enrolled_count: 18,
                        course_fee: 250,
                        duration_days: 45,
                        teacher_name: "الأستاذة فاطمة علي",
                        created_at: new Date().toISOString()
                    },
                    {
                        id: 3,
                        name: "دورة الفقه الإسلامي",
                        description: "دراسة أحكام الفقه الإسلامي وتطبيقاتها العملية",
                        details: { category: "علوم شرعية", level: "متوسط" },
                        enrolled_count: 22,
                        course_fee: 400,
                        duration_days: 60,
                        teacher_name: "الشيخ عبد الرحمن محمد",
                        created_at: new Date().toISOString()
                    }
                ],
                lastUpdated: new Date().toISOString(),
                isDevelopmentMode: true
            },
            revalidate: 1
        };
    }

    // Production: Optimized database query
    try {
        console.log('🏭 Production mode: Running optimized database query');
        
        const result = await pool.query(`
            WITH stats AS (
                SELECT 
                    (SELECT COUNT(*) FROM courses WHERE is_published = true) as total_courses,
                    (SELECT COUNT(DISTINCT user_id) FROM enrollments WHERE status = 'active') as total_students,
                    (SELECT COUNT(*) FROM users WHERE role = 'teacher' AND account_status = 'active') as total_teachers,
                    (SELECT COUNT(*) FROM enrollments WHERE status = 'completed') as completed_courses
            ),
            featured AS (
                SELECT 
                    c.id, c.name, c.description, c.details, c.created_at,
                    c.course_fee, c.duration_days,
                    COUNT(e.id) as enrolled_count,
                    u.full_name as teacher_name
                FROM courses c
                LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = 'active'
                LEFT JOIN users u ON c.teacher_id = u.id
                WHERE c.status IN ('active', 'published')
                GROUP BY c.id, c.name, c.description, c.details, c.created_at, c.course_fee, c.duration_days, u.full_name
                ORDER BY enrolled_count DESC, c.created_at DESC
                LIMIT 6
            )
            SELECT 
                (SELECT row_to_json(stats) FROM stats) as site_stats,
                (SELECT json_agg(featured) FROM featured) as featured_courses
        `);

        const data = result.rows[0];
        const siteStats = data.site_stats || {
            total_courses: 0,
            total_students: 0,
            total_teachers: 0,
            completed_courses: 0
        };
        
        const featuredCourses = (data.featured_courses || []).map(course => ({
            ...course,
            details: typeof course.details === 'object' ? course.details : {},
            enrolled_count: parseInt(course.enrolled_count || 0),
            course_fee: parseFloat(course.course_fee || 0),
            duration_days: parseInt(course.duration_days || 0),
            created_at: course.created_at ? new Date(course.created_at).toISOString() : null
        }));

        return {
            props: {
                siteStats: {
                    totalCourses: parseInt(siteStats.total_courses || 0),
                    totalStudents: parseInt(siteStats.total_students || 0),
                    totalTeachers: parseInt(siteStats.total_teachers || 0),
                    completedCourses: parseInt(siteStats.completed_courses || 0)
                },
                featuredCourses: JSON.parse(JSON.stringify(featuredCourses)),
                lastUpdated: new Date().toISOString(),
                isDevelopmentMode: false
            },
            revalidate: 300
        };

    } catch (error) {
        console.error('❌ Error in getStaticProps for home page:', error);
        
        return {
            props: {
                siteStats: {
                    totalCourses: 0,
                    totalStudents: 0,
                    totalTeachers: 0,
                    completedCourses: 0
                },
                featuredCourses: [],
                lastUpdated: new Date().toISOString(),
                hasError: true,
                errorMessage: error.message
            },
            revalidate: 60
        };
    }
}