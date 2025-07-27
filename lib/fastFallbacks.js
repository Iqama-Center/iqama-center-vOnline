/**
 * Fast Fallback Data for Development and Error Recovery
 * Provides instant loading with realistic sample data
 */

export const FAST_SITE_STATS = {
    totalCourses: 25,
    totalStudents: 150,
    totalTeachers: 12,
    completedCourses: 45,
    activeCourses: 18,
    completedEnrollments: 45,
    avgCourseFee: 325
};

export const FAST_FEATURED_COURSES = [
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
        status: "active",
        enrolled_count: 25,
        course_fee: 300,
        duration_days: 30,
        max_participants: 30,
        teacher_name: "الأستاذ محمد أحمد",
        teacher_id: 1,
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        is_full: false,
        enrollment_percentage: 83,
        is_available: true
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
        status: "active",
        enrolled_count: 18,
        course_fee: 250,
        duration_days: 45,
        max_participants: 25,
        teacher_name: "الأستاذة فاطمة علي",
        teacher_id: 2,
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        is_full: false,
        enrollment_percentage: 72,
        is_available: true
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
        status: "active",
        enrolled_count: 22,
        course_fee: 400,
        duration_days: 60,
        max_participants: 25,
        teacher_name: "الشيخ عبد الرحمن محمد",
        teacher_id: 3,
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        is_full: false,
        enrollment_percentage: 88,
        is_available: true
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
        status: "active",
        enrolled_count: 15,
        course_fee: 500,
        duration_days: 90,
        max_participants: 20,
        teacher_name: "القارئ أحمد حسن",
        teacher_id: 4,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        is_full: false,
        enrollment_percentage: 75,
        is_available: true
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
        status: "active",
        enrolled_count: 30,
        course_fee: 200,
        duration_days: 30,
        max_participants: 30,
        teacher_name: "المهندس خالد أحمد",
        teacher_id: 5,
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        is_full: true,
        enrollment_percentage: 100,
        is_available: false
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
        status: "published",
        enrolled_count: 20,
        course_fee: 350,
        duration_days: 45,
        max_participants: 25,
        teacher_name: "الأستاذ عمر سالم",
        teacher_id: 6,
        created_at: new Date().toISOString(),
        is_full: false,
        enrollment_percentage: 80,
        is_available: true
    }
];

export const FAST_CATEGORIES = [
    { name: "تعليم ديني", count: 8, avgFee: 375 },
    { name: "لغات", count: 5, avgFee: 275 },
    { name: "علوم شرعية", count: 4, avgFee: 425 },
    { name: "تقنية", count: 3, avgFee: 225 },
    { name: "إدارة", count: 3, avgFee: 325 },
    { name: "عام", count: 2, avgFee: 200 }
];

export const FAST_PERFORMANCE_STATS = {
    avg_grade_all_users: 85.5,
    total_submissions: 1250,
    active_users: 150,
    highest_grade: 100,
    lowest_grade: 45
};

export const FAST_COURSE_AVERAGES = [
    { name: "دورة تعليم القرآن الكريم", course_avg: 92.5, submission_count: 125 },
    { name: "دورة التجويد المتقدم", course_avg: 89.3, submission_count: 98 },
    { name: "دورة الفقه الإسلامي", course_avg: 87.8, submission_count: 110 },
    { name: "دورة اللغة العربية", course_avg: 85.2, submission_count: 95 },
    { name: "دورة إدارة الأعمال", course_avg: 83.7, submission_count: 88 },
    { name: "دورة الحاسوب للمبتدئين", course_avg: 81.4, submission_count: 120 }
];

/**
 * Get fast fallback data for development mode
 */
export function getFastFallbackData(type = 'homepage') {
    const baseData = {
        lastUpdated: new Date().toISOString(),
        isDevelopmentMode: process.env.NODE_ENV === 'development',
        metadata: {
            cacheStrategy: 'Fast Fallback',
            generatedAt: new Date().toISOString(),
            dataSource: 'static'
        }
    };

    switch (type) {
        case 'homepage':
            return {
                ...baseData,
                siteStats: FAST_SITE_STATS,
                featuredCourses: FAST_FEATURED_COURSES.slice(0, 6)
            };

        case 'courses':
            return {
                ...baseData,
                courses: FAST_FEATURED_COURSES,
                stats: FAST_SITE_STATS,
                categories: FAST_CATEGORIES
            };

        case 'performance':
            return {
                ...baseData,
                publicPerformanceStats: FAST_PERFORMANCE_STATS,
                courseAverages: FAST_COURSE_AVERAGES
            };

        case 'dashboard':
            return {
                ...baseData,
                publicStats: FAST_SITE_STATS,
                recentActivities: [
                    {
                        activity_type: 'course_created',
                        title: 'دورة جديدة: تعليم القرآن الكريم',
                        created_at: new Date().toISOString(),
                        user_name: 'الأستاذ محمد أحمد'
                    },
                    {
                        activity_type: 'course_created',
                        title: 'دورة جديدة: اللغة العربية',
                        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                        user_name: 'الأستاذة فاطمة علي'
                    }
                ]
            };

        default:
            return baseData;
    }
}

/**
 * Check if we should use fast fallback data
 */
export function shouldUseFastFallback() {
    return process.env.NODE_ENV === 'development' || process.env.USE_FAST_FALLBACK === 'true';
}