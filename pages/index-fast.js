import React from 'react';
import LandingPage from '../components/LandingPage';

/**
 * Fast Loading Home Page - DEPRECATED
 * This version should not be used as it contains hardcoded data
 * Use pages/index.js instead for real database data
 */
export default function HomePage({ siteStats, featuredCourses, lastUpdated }) {
    return (
        <LandingPage 
            siteStats={siteStats}
            featuredCourses={featuredCourses}
            lastUpdated={lastUpdated}
        />
    );
}

/**
 * Static Site Generation with Instant Loading
 * No database queries - uses static data for maximum speed
 */
export async function getStaticProps() {
    // Static data for instant loading
    const siteStats = {
        totalCourses: 25,
        totalStudents: 150,
        totalTeachers: 12,
        completedCourses: 45
    };

    const featuredCourses = [
        {
            id: 1,
            name: "دورة تعليم القرآن الكريم",
            description: "دورة شاملة لتعليم القرآن الكريم والتجويد مع أفضل المعلمين المختصين",
            details: { 
                category: "تعليم ديني",
                level: "مبتدئ إلى متقدم",
                duration: "30 يوم",
                schedule: "يومياً من 8-10 صباحاً"
            },
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
            details: { 
                category: "لغات",
                level: "مبتدئ",
                duration: "45 يوم",
                schedule: "3 مرات أسبوعياً"
            },
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
            details: { 
                category: "علوم شرعية",
                level: "متوسط",
                duration: "60 يوم",
                schedule: "مرتين أسبوعياً"
            },
            enrolled_count: 22,
            course_fee: 400,
            duration_days: 60,
            teacher_name: "الشيخ عبد الرحمن محمد",
            created_at: new Date().toISOString()
        },
        {
            id: 4,
            name: "دورة التجويد المتقدم",
            description: "إتقان أحكام التجويد والقراءات القرآنية",
            details: { 
                category: "تعليم ديني",
                level: "متقدم",
                duration: "90 يوم",
                schedule: "يومياً من 6-7 مساءً"
            },
            enrolled_count: 15,
            course_fee: 500,
            duration_days: 90,
            teacher_name: "القارئ أحمد حسن",
            created_at: new Date().toISOString()
        },
        {
            id: 5,
            name: "دورة الحاسوب للمبتدئين",
            description: "تعلم أساسيات الحاسوب والبرامج المكتبية",
            details: { 
                category: "تقنية",
                level: "مبتدئ",
                duration: "30 يوم",
                schedule: "مرتين أسبوعياً"
            },
            enrolled_count: 30,
            course_fee: 200,
            duration_days: 30,
            teacher_name: "المهندس خالد أحمد",
            created_at: new Date().toISOString()
        },
        {
            id: 6,
            name: "دورة إدارة الأعمال",
            description: "أساسيات إدارة الأعمال والمشاريع الصغيرة",
            details: { 
                category: "إدارة",
                level: "متوسط",
                duration: "45 يوم",
                schedule: "3 مرات أسبوعياً"
            },
            enrolled_count: 20,
            course_fee: 350,
            duration_days: 45,
            teacher_name: "الأستاذ عمر سالم",
            created_at: new Date().toISOString()
        }
    ];

    return {
        props: {
            siteStats,
            featuredCourses,
            lastUpdated: new Date().toISOString(),
            isStaticData: true
        },
        // Revalidate every hour for static data
        revalidate: 3600
    };
}