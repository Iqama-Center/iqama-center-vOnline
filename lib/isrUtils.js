/**
 * Consolidated ISR (Incremental Static Regeneration) Utilities
 * Combines all ISR utilities into one optimized, comprehensive solution
 * 
 * Features:
 * - Standardized error handling and serialization
 * - Intelligent revalidation strategies
 * - Fast fallback data for development
 * - Security and performance optimization
 * - Backward compatibility with existing imports
 * 
 * @version 4.0.0 (Consolidated)
 */

import { safeSerialize as serializerSafeSerialize } from './serializer';

/**
 * Consolidated Revalidation Times
 * Intelligent strategy that adapts based on environment and content type
 */
export const REVALIDATION_TIMES = {
    // High-frequency updates (user-specific content)
    REALTIME: 30,
    
    // Medium-frequency updates (course data, enrollments)
    FREQUENT: 300, // 5 minutes
    
    // Low-frequency updates (public content, stats)
    STANDARD: 600, // 10 minutes
    
    // Very low-frequency updates (static content)
    SLOW: 3600, // 1 hour
    
    // Error recovery
    ERROR: 60 // 1 minute
};

/**
 * Enhanced revalidation strategies (backward compatibility)
 */
export const ENHANCED_REVALIDATION = {
    STATIC_CONTENT: 86400, // 24 hours
    PUBLIC_PAGES: 43200, // 12 hours
    COURSE_LISTINGS: 900, // 15 minutes
    COURSE_DETAILS: 300, // 5 minutes
    USER_DASHBOARDS: 180, // 3 minutes
    REALTIME: 60, // 1 minute
    ERROR_RECOVERY: 30, // 30 seconds
    DEVELOPMENT: process.env.NODE_ENV === 'development' ? 1 : 300
};

/**
 * Safe JSON serialization for Next.js props
 * Enhanced version that combines all serialization strategies
 */
export function safeSerialize(data) {
    try {
        // Use the most robust serializer available
        if (serializerSafeSerialize) {
            return serializerSafeSerialize(data);
        }
        
        // Fallback to basic serialization
        return JSON.parse(JSON.stringify(data, (key, value) => {
            // Handle dates
            if (value instanceof Date) {
                return value.toISOString();
            }
            // Handle undefined
            if (value === undefined) {
                return null;
            }
            // Handle BigInt
            if (typeof value === 'bigint') {
                return value.toString();
            }
            // Handle functions (should not be serialized)
            if (typeof value === 'function') {
                return '[Function]';
            }
            return value;
        }));
    } catch (error) {
        console.error('Serialization error:', error);
        return null;
    }
}

/**
 * Standard ISR success response
 * Ensures consistent structure and serialization
 */
export function createSuccessResponse(props, revalidateTime = REVALIDATION_TIMES.STANDARD) {
    return {
        props: {
            ...safeSerialize(props),
            lastUpdated: new Date().toISOString(),
            hasError: false
        },
        revalidate: revalidateTime
    };
}

/**
 * Standard ISR error response
 * Provides consistent fallback structure across pages
 */
export function createErrorResponse(fallbackProps = {}, revalidateTime = REVALIDATION_TIMES.ERROR) {
    return {
        props: {
            ...fallbackProps,
            lastUpdated: new Date().toISOString(),
            hasError: true
        },
        revalidate: revalidateTime
    };
}

/**
 * Database query wrapper with error handling for ISR
 * Provides consistent error handling and logging
 */
export async function executeISRQuery(queryPromise, fallbackValue = null) {
    try {
        const result = await queryPromise;
        return { success: true, data: result };
    } catch (error) {
        console.error('ISR Query Error:', error);
        return { success: false, data: fallbackValue, error };
    }
}

/**
 * Parallel query executor for ISR
 * Uses Promise.allSettled for better error handling
 */
export async function executeParallelQueries(queries) {
    const results = await Promise.allSettled(queries);
    
    return results.map((result, index) => {
        if (result.status === 'fulfilled') {
            return { success: true, data: result.value };
        } else {
            console.error(`Query ${index} failed:`, result.reason);
            return { success: false, data: null, error: result.reason };
        }
    });
}

/**
 * Cache-friendly data processor
 * Ensures data is properly formatted for caching
 */
export function processForCache(data) {
    if (!data) return null;
    
    // Convert arrays
    if (Array.isArray(data)) {
        return data.map(processForCache);
    }
    
    // Convert objects
    if (typeof data === 'object' && data !== null) {
        const processed = {};
        for (const [key, value] of Object.entries(data)) {
            // Convert numeric strings to numbers
            if (typeof value === 'string' && !isNaN(value) && !isNaN(parseFloat(value))) {
                processed[key] = parseFloat(value);
            }
            // Convert date strings to ISO format
            else if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
                try {
                    processed[key] = new Date(value).toISOString();
                } catch {
                    processed[key] = value;
                }
            }
            // Recursively process objects
            else if (typeof value === 'object' && value !== null) {
                processed[key] = processForCache(value);
            }
            else {
                processed[key] = value;
            }
        }
        return processed;
    }
    
    return data;
}

/**
 * ISR metadata generator
 * Creates consistent metadata for ISR pages
 */
export function generateISRMetadata(data, options = {}) {
    return {
        generatedAt: new Date().toISOString(),
        dataCount: Array.isArray(data) ? data.length : (data ? 1 : 0),
        cacheStrategy: options.revalidate ? 'ISR' : 'SSG',
        revalidateTime: options.revalidate || null,
        version: '4.0.0'
    };
}

/**
 * Get fast fallback data (backward compatibility with fastFallbacks.js)
 */
export function getFastFallbackData() {
    const FAST_SITE_STATS = {
        totalCourses: 25,
        totalStudents: 150,
        totalTeachers: 12,
        completedCourses: 45,
        activeCourses: 18,
        completedEnrollments: 45,
        avgCourseFee: 325
    };

    const FAST_FEATURED_COURSES = [
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
        }
    ];

    return {
        siteStats: FAST_SITE_STATS,
        featuredCourses: FAST_FEATURED_COURSES,
        lastUpdated: new Date().toISOString(),
        isFallback: true
    };
}