/**
 * ISR (Incremental Static Regeneration) Utilities
 * Senior-level utilities for implementing ISR across the application
 * 
 * Features:
 * - Standardized error handling
 * - Performance optimization
 * - Data serialization safety
 * - Revalidation strategies
 */

/**
 * Safe JSON serialization for Next.js props
 * Handles dates, undefined values, and circular references
 */
export function safeSerialize(data) {
    try {
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
            return value;
        }));
    } catch (error) {
        console.error('Serialization error:', error);
        return null;
    }
}

/**
 * Standard ISR error response
 * Provides consistent fallback structure across pages
 */
export function createErrorResponse(fallbackProps = {}, revalidateTime = 60) {
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
 * Standard ISR success response
 * Ensures consistent structure and serialization
 */
export function createSuccessResponse(props, revalidateTime = 300) {
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
 * Revalidation time constants
 * Centralized configuration for different content types
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
        version: '1.0.0'
    };
}