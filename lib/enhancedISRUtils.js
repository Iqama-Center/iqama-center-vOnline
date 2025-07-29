/**
 * Enhanced ISR Utilities - Backward Compatibility Layer
 * Re-exports from consolidated isrUtils.js
 * 
 * @deprecated Use lib/isrUtils.js directly instead
 * @version 4.0.0 (Consolidated)
 */

// Re-export everything from the consolidated ISR utilities
export * from './isrUtils';

/**
 * Enhanced revalidation strategies based on content type and user interaction
 */
export const ENHANCED_REVALIDATION = {
    // Static content (rarely changes)
    STATIC_CONTENT: 86400, // 24 hours
    
    // Public pages (terms, privacy)
    PUBLIC_PAGES: 43200, // 12 hours
    
    // Course listings (moderate frequency)
    COURSE_LISTINGS: 900, // 15 minutes
    
    // Individual courses (frequent updates)
    COURSE_DETAILS: 300, // 5 minutes
    
    // User dashboards (very frequent)
    USER_DASHBOARDS: 180, // 3 minutes
    
    // Real-time data (certificates, payments)
    REALTIME: 60, // 1 minute
    
    // Error recovery
    ERROR_RECOVERY: 30, // 30 seconds
    
    // Development mode
    DEVELOPMENT: 1 // 1 second
};

/**
 * Dynamic ISR implementation for [id] pages
 * Generates static paths and handles dynamic content
 */
export async function createDynamicISR(options = {}) {
    const {
        tableName,
        idField = 'id',
        statusField = 'status',
        activeStatuses = ['active', 'published'],
        limit = 100,
        fallbackMode = 'blocking'
    } = options;

    return {
        async getStaticPaths() {
            try {
                const query = `
                    SELECT ${idField} 
                    FROM ${tableName} 
                    WHERE ${statusField} = ANY($1) 
                    ORDER BY created_at DESC 
                    LIMIT $2
                `;
                
                const result = await pool.query(query, [activeStatuses, limit]);
                
                const paths = result.rows.map(row => ({
                    params: { id: row[idField].toString() }
                }));

                return {
                    paths,
                    fallback: fallbackMode
                };
            } catch (error) {
                console.error(`Error generating static paths for ${tableName}:`, error);
                return {
                    paths: [],
                    fallback: fallbackMode
                };
            }
        }
    };
}

/**
 * Hybrid ISR+SSR for authenticated pages
 * Combines static generation for public data with server-side rendering for user data
 */
export function createHybridISR(publicDataQuery, revalidateTime = ENHANCED_REVALIDATION.COURSE_LISTINGS) {
    return async function getStaticProps() {
        try {
            // Generate public data statically
            const publicData = await publicDataQuery();
            
            return createSuccessResponse({
                ...publicData,
                isHybrid: true,
                requiresAuth: true
            }, revalidateTime);
            
        } catch (error) {
            console.error('Hybrid ISR error:', error);
            return createErrorResponse({
                isHybrid: true,
                requiresAuth: true
            }, ENHANCED_REVALIDATION.ERROR_RECOVERY);
        }
    };
}

/**
 * Advanced course data fetcher with comprehensive optimization
 */
export async function fetchOptimizedCourseData(options = {}) {
    const {
        includeEnrollments = true,
        includeTeacher = true,
        includeStats = true,
        limit = 50,
        offset = 0,
        status = ['active', 'published']
    } = options;

    const queries = [];
    
    // Main courses query
    const courseQuery = `
        SELECT 
            c.id,
            c.name,
            c.description,
            c.details,
            c.status,
            c.created_at,
            c.updated_at,
            c.course_fee,
            c.duration_days,
            c.max_participants,
            c.start_date,
            c.end_date,
            c.is_published,
            c.is_launched,
            ${includeEnrollments ? 'COUNT(DISTINCT e.id) as enrollment_count,' : ''}
            ${includeTeacher ? 'u.full_name as teacher_name, u.id as teacher_id,' : ''}
            CASE 
                WHEN c.max_participants > 0 AND COUNT(DISTINCT e.id) >= c.max_participants 
                THEN true 
                ELSE false 
            END as is_full
        FROM courses c
        ${includeEnrollments ? 'LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = \'active\'' : ''}
        ${includeTeacher ? 'LEFT JOIN users u ON c.teacher_id = u.id' : ''}
        WHERE c.status = ANY($1)
        GROUP BY c.id, c.name, c.description, c.details, c.status, c.created_at, c.updated_at,
                 c.course_fee, c.duration_days, c.max_participants, c.start_date, c.end_date,
                 c.is_published, c.is_launched${includeTeacher ? ', u.full_name, u.id' : ''}
        ORDER BY c.created_at DESC, enrollment_count DESC
        LIMIT $2 OFFSET $3
    `;
    
    queries.push(pool.query(courseQuery, [status, limit, offset]));
    
    // Statistics query
    if (includeStats) {
        const statsQuery = `
            SELECT 
                COUNT(*) as total_courses,
                COUNT(CASE WHEN is_launched = true THEN 1 END) as active_courses,
                AVG(course_fee) as avg_fee,
                SUM(CASE WHEN course_fee > 0 THEN 1 ELSE 0 END) as paid_courses
            FROM courses 
            WHERE status = ANY($1)
        `;
        queries.push(pool.query(statsQuery, [status]));
    }
    
    // Categories query
    const categoriesQuery = `
        SELECT 
            COALESCE(details->>'category', 'عام') as category,
            COUNT(*) as count,
            AVG(course_fee) as avg_fee
        FROM courses 
        WHERE status = ANY($1)
        GROUP BY details->>'category'
        ORDER BY count DESC
        LIMIT 20
    `;
    queries.push(pool.query(categoriesQuery, [status]));
    
    const results = await Promise.allSettled(queries);
    
    // Process results
    const courses = results[0].status === 'fulfilled' 
        ? results[0].value.rows.map(course => ({
            ...course,
            details: typeof course.details === 'object' ? course.details : {},
            enrollment_count: parseInt(course.enrollment_count || 0),
            course_fee: parseFloat(course.course_fee || 0),
            duration_days: parseInt(course.duration_days || 0),
            max_participants: parseInt(course.max_participants || 0),
            created_at: course.created_at ? new Date(course.created_at).toISOString() : null,
            updated_at: course.updated_at ? new Date(course.updated_at).toISOString() : null,
            start_date: course.start_date ? new Date(course.start_date).toISOString() : null,
            end_date: course.end_date ? new Date(course.end_date).toISOString() : null,
            enrollment_percentage: course.max_participants > 0 
                ? Math.round((course.enrollment_count / course.max_participants) * 100) 
                : 0
        }))
        : [];
    
    const stats = includeStats && results[1].status === 'fulfilled'
        ? {
            totalCourses: parseInt(results[1].value.rows[0]?.total_courses || 0),
            activeCourses: parseInt(results[1].value.rows[0]?.active_courses || 0),
            avgFee: parseFloat(results[1].value.rows[0]?.avg_fee || 0),
            paidCourses: parseInt(results[1].value.rows[0]?.paid_courses || 0)
        }
        : null;
    
    const categories = results[includeStats ? 2 : 1].status === 'fulfilled'
        ? results[includeStats ? 2 : 1].value.rows.map(cat => ({
            name: cat.category || 'عام',
            count: parseInt(cat.count || 0),
            avgFee: parseFloat(cat.avg_fee || 0)
        }))
        : [];
    
    return {
        courses: safeSerialize(courses),
        stats: safeSerialize(stats),
        categories: safeSerialize(categories),
        metadata: {
            totalFetched: courses.length,
            hasMore: courses.length === limit,
            queriesExecuted: queries.length,
            successfulQueries: results.filter(r => r.status === 'fulfilled').length
        }
    };
}

/**
 * Certificate verification with ISR optimization
 */
export async function fetchCertificateData(code) {
    try {
        const result = await pool.query(`
            SELECT 
                cert.issue_date, 
                cert.certificate_code, 
                cert.grade,
                cert.created_at,
                u.full_name as student_name,
                c.name as course_name,
                c.description as course_description,
                c.duration_days,
                t.full_name as teacher_name
            FROM certificates cert
            JOIN enrollments e ON cert.enrollment_id = e.id
            JOIN users u ON e.user_id = u.id
            JOIN courses c ON e.course_id = c.id
            LEFT JOIN users t ON c.teacher_id = t.id
            WHERE cert.certificate_code = $1
        `, [code]);

        if (result.rows.length === 0) {
            return null;
        }

        const certificate = result.rows[0];
        return {
            ...certificate,
            issue_date: certificate.issue_date ? new Date(certificate.issue_date).toISOString() : null,
            created_at: certificate.created_at ? new Date(certificate.created_at).toISOString() : null,
            duration_days: parseInt(certificate.duration_days || 0)
        };
    } catch (error) {
        console.error('Certificate fetch error:', error);
        throw error;
    }
}

/**
 * Performance monitoring for ISR pages
 */
export function createISRPerformanceMonitor(pageName) {
    return {
        startTime: Date.now(),
        
        logPerformance(metadata = {}) {
            const endTime = Date.now();
            const duration = endTime - this.startTime;
            
            console.log(`🚀 ISR Performance [${pageName}]:`, {
                duration: `${duration}ms`,
                timestamp: new Date().toISOString(),
                ...metadata
            });
            
            // Log warning for slow pages
            if (duration > 5000) {
                console.warn(`⚠️ Slow ISR generation for ${pageName}: ${duration}ms`);
            }
            
            return duration;
        }
    };
}

/**
 * Development mode optimization
 */
export function getDevModeRevalidation() {
    return process.env.NODE_ENV === 'development' 
        ? ENHANCED_REVALIDATION.DEVELOPMENT 
        : null;
}

/**
 * Smart fallback data generator
 */
export function generateSmartFallbacks(dataType) {
    const fallbacks = {
        courses: {
            courses: [],
            stats: { totalCourses: 0, activeCourses: 0, avgFee: 0, paidCourses: 0 },
            categories: [],
            metadata: { totalFetched: 0, hasMore: false }
        },
        
        dashboard: {
            publicStats: { totalCourses: 0, totalStudents: 0, totalTeachers: 0, activeCourses: 0 },
            recentCourses: [],
            systemAnnouncements: [],
            metadata: { queriesExecuted: 0 }
        },
        
        certificate: {
            certificate: null,
            error: 'الشهادة غير موجودة أو الرمز غير صحيح'
        }
    };
    
    return fallbacks[dataType] || {};
}

/**
 * ISR cache warming utility
 */
export async function warmISRCache(paths = []) {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    
    for (const path of paths) {
        try {
            const response = await fetch(`${baseUrl}${path}`, {
                headers: { 'Cache-Control': 'no-cache' }
            });
            
            if (response.ok) {
                console.log(`✅ Warmed cache for: ${path}`);
            } else {
                console.warn(`⚠️ Failed to warm cache for: ${path}`);
            }
        } catch (error) {
            console.error(`❌ Cache warming error for ${path}:`, error.message);
        }
    }
}