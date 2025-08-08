import pool from './db';

/**
 * Optimized dashboard statistics queries for different user roles
 * This file provides role-specific dashboard data with proper error handling
 */

/**
 * Get dashboard statistics based on user role
 * @param {Object} user - User object with role and id
 * @returns {Object} Dashboard statistics
 */
export async function getDashboardStats(user) {
    if (!user || !user.role) {
            if (process.env.NODE_ENV === 'development') {
            console.log('[DEBUG] No user or role provided, returning empty stats');
        }
        return getEmptyStats();
    }

    if (process.env.NODE_ENV === 'development') {
        console.log(`[DEBUG] Getting dashboard stats for role: ${user.role}`);
    }

    try {
        let query = '';
        let params = [];

        switch (user.role) {
            case 'admin':
                query = `
                    SELECT 
                        -- User counts (ALL users)
                        (SELECT COUNT(*) FROM users) as total_users,
                        (SELECT COUNT(*) FROM users WHERE role = 'student' AND (account_status = 'active' OR account_status IS NULL)) as total_students,
                        (SELECT COUNT(*) FROM users WHERE role = 'teacher' AND (account_status = 'active' OR account_status IS NULL)) as total_teachers,
                        (SELECT COUNT(*) FROM users WHERE role = 'admin' AND (account_status = 'active' OR account_status IS NULL)) as total_admins,
                        (SELECT COUNT(*) FROM users WHERE role = 'parent' AND (account_status = 'active' OR account_status IS NULL)) as total_parents,
                        (SELECT COUNT(*) FROM users WHERE role = 'worker' AND (account_status = 'active' OR account_status IS NULL)) as total_workers,
                        (SELECT COUNT(*) FROM users WHERE role = 'finance' AND (account_status = 'active' OR account_status IS NULL)) as total_finance,
                        (SELECT COUNT(*) FROM users WHERE role = 'head' AND (account_status = 'active' OR account_status IS NULL)) as total_heads,
                        
                        -- Course counts (using proper status fields)
                        (SELECT COUNT(*) FROM courses) as total_courses,
                        (SELECT COUNT(*) FROM courses WHERE is_published = true AND is_launched = true) as active_courses,
                        (SELECT COUNT(*) FROM courses WHERE is_published = true) as published_courses,
                        (SELECT COUNT(*) FROM courses WHERE status = 'draft' OR is_published = false) as draft_courses,
                        
                        -- Enrollment counts
                        (SELECT COUNT(*) FROM enrollments WHERE status = 'active') as active_enrollments,
                        (SELECT COUNT(*) FROM enrollments WHERE status = 'completed') as completed_enrollments,
                        (SELECT COUNT(*) FROM enrollments WHERE status = 'pending_approval') as pending_enrollments,
                        (SELECT COUNT(*) FROM enrollments WHERE status = 'pending_payment') as payment_pending_enrollments,
                        
                        -- Unique active students (students with active enrollments)
                        (SELECT COUNT(DISTINCT e.user_id) 
                         FROM enrollments e 
                         JOIN users u ON e.user_id = u.id 
                         WHERE e.status = 'active' AND u.role = 'student') as unique_active_students,
                        
                        -- Payment counts (safe with table existence check)
                        (SELECT CASE 
                            WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments') 
                            THEN (SELECT COUNT(*) FROM payments WHERE status IN ('due', 'pending_review', 'late'))
                            ELSE 0 
                         END) as pending_payments,
                        
                        (SELECT CASE 
                            WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments') 
                            THEN (SELECT COUNT(*) FROM payments WHERE status = 'paid')
                            ELSE 0 
                         END) as completed_payments,
                        
                        -- Request counts (safe with table existence check)
                        (SELECT CASE 
                            WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_edit_requests') 
                            THEN (SELECT COUNT(*) FROM user_edit_requests WHERE status = 'pending')
                            ELSE 0 
                         END) as pending_requests,
                        
                        -- Monthly trends
                        (SELECT COUNT(*) FROM users WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_users_this_month,
                        (SELECT COUNT(*) FROM courses WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_courses_this_month,
                        (SELECT COUNT(*) FROM enrollments WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_enrollments_this_month
                `;
                break;

            case 'teacher':
                query = `
                    SELECT 
                        (SELECT COUNT(*) FROM courses WHERE teacher_id = $1 OR created_by = $1) as my_courses,
                        (SELECT COUNT(*) FROM enrollments e JOIN courses c ON e.course_id = c.id WHERE (c.teacher_id = $1 OR c.created_by = $1) AND e.status = 'active') as my_students,
                        (SELECT COUNT(*) FROM courses WHERE (teacher_id = $1 OR created_by = $1) AND status = 'active') as active_courses,
                        (SELECT COUNT(*) FROM enrollments e JOIN courses c ON e.course_id = c.id WHERE (c.teacher_id = $1 OR c.created_by = $1) AND e.status = 'completed') as completed_students
                `;
                params = [user.id];
                break;

            case 'student':
                query = `
                    SELECT 
                        (SELECT COUNT(*) FROM enrollments WHERE user_id = $1) as my_enrollments,
                        (SELECT COUNT(*) FROM enrollments WHERE user_id = $1 AND status = 'active') as active_enrollments,
                        (SELECT COUNT(*) FROM enrollments WHERE user_id = $1 AND status = 'completed') as completed_courses,
                        (SELECT COUNT(*) FROM enrollments WHERE user_id = $1 AND status = 'pending_approval') as pending_enrollments
                `;
                params = [user.id];
                break;

            case 'parent':
                query = `
                    SELECT 
                        (SELECT COUNT(*) FROM parent_child_relationships WHERE parent_id = $1) as my_children,
                        (SELECT COUNT(DISTINCT e.course_id) FROM enrollments e JOIN parent_child_relationships pcr ON e.user_id = pcr.child_id WHERE pcr.parent_id = $1 AND e.status = 'active') as children_courses,
                        (SELECT COUNT(*) FROM enrollments e JOIN parent_child_relationships pcr ON e.user_id = pcr.child_id WHERE pcr.parent_id = $1 AND e.status = 'completed') as children_completed
                `;
                params = [user.id];
                break;

            case 'finance':
                query = `
                    SELECT 
                        (SELECT COUNT(*) FROM payments WHERE status IN ('due', 'pending_review', 'late')) as pending_payments,
                        (SELECT COUNT(*) FROM payments WHERE status = 'paid') as completed_payments,
                        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'paid') as total_revenue,
                        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status IN ('due', 'pending_review', 'late')) as outstanding_amount
                `;
                break;

            case 'worker':
                query = `
                    SELECT 
                        (SELECT COUNT(*) FROM courses) as total_courses,
                        (SELECT COUNT(*) FROM users) as total_users,
                        (SELECT COUNT(*) FROM enrollments WHERE status = 'active') as active_enrollments
                `;
                break;

            case 'head':
                query = `
                    SELECT 
                        (SELECT COUNT(*) FROM courses) as total_courses,
                        (SELECT COUNT(*) FROM users) as total_users,
                        (SELECT COUNT(*) FROM enrollments WHERE status = 'active') as active_enrollments,
                        (SELECT COUNT(*) FROM users WHERE role = 'teacher') as total_teachers
                `;
                break;

            default:
                return getEmptyStats();
        }

        console.log(`[DEBUG] Executing query for ${user.role}:`, query.substring(0, 200) + '...');
        
        const result = await pool.query(query, params);
        console.log(`[DEBUG] Query result for ${user.role}:`, result.rows[0]);
        
        return result.rows[0] || getEmptyStats();

    } catch (error) {
        console.error(`[ERROR] Dashboard query failed for role ${user.role}:`, error.message);
        console.error('[ERROR] Full error:', error);
        
        // Return simple fallback for admin
        if (user.role === 'admin') {
            try {
                console.log('[FALLBACK] Using simple admin query...');
                const fallbackResult = await pool.query(`
                    SELECT 
                        (SELECT COUNT(*) FROM users) as total_users,
                        (SELECT COUNT(*) FROM courses) as total_courses,
                        (SELECT COUNT(*) FROM enrollments WHERE status = 'active') as active_enrollments,
                        (SELECT COUNT(*) FROM users WHERE role = 'student') as total_students,
                        (SELECT COUNT(*) FROM users WHERE role = 'teacher') as total_teachers,
                        (SELECT COUNT(*) FROM courses WHERE status = 'active') as active_courses,
                        0 as pending_payments,
                        0 as pending_requests
                `);
                console.log('[FALLBACK] Simple query result:', fallbackResult.rows[0]);
                return fallbackResult.rows[0] || getEmptyStats();
            } catch (fallbackError) {
                console.error('[FALLBACK ERROR]:', fallbackError.message);
                return getEmptyStats();
            }
        }
        
        return getEmptyStats();
    }
}

/**
 * Get user by ID with error handling
 * @param {number} userId - User ID to fetch
 * @returns {Object|null} User object or null if not found
 */
export async function getUserById(userId) {
    try {
        if (!userId) {
            console.log('[DEBUG] No userId provided to getUserById');
            return null;
        }

        console.log(`[DEBUG] Fetching user with ID: ${userId}`);
        
        const result = await pool.query(
            'SELECT id, full_name, email, phone, role, details, account_status, created_at FROM users WHERE id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            console.log(`[DEBUG] No user found with ID: ${userId}`);
            return null;
        }

        const user = result.rows[0];
        console.log(`[DEBUG] User found: ${user.full_name} (${user.role})`);
        
        return {
            ...user,
            details: user.details || {}
        };
    } catch (error) {
        console.error(`[ERROR] Failed to fetch user ${userId}:`, error.message);
        return null;
    }
}

/**
 * Get filtered courses with advanced filtering options
 * @param {Object} filters - Filter criteria
 * @param {number} userId - User ID for personalized results
 * @returns {Array} Array of filtered courses
 */
export async function getFilteredCourses(filters = {}, userId = null) {
    try {
        console.log(`[DEBUG] Getting filtered courses with filters:`, filters);
        
        let whereConditions = ['c.is_published = true'];
        let queryParams = [];
        let paramIndex = 1;

        // Add filters
        if (filters.role) {
            whereConditions.push(`c.details->>'target_role' = $${paramIndex}`);
            queryParams.push(filters.role);
            paramIndex++;
        }

        if (filters.gender && filters.gender !== 'both') {
            whereConditions.push(`(c.details->>'gender' = $${paramIndex} OR c.details->>'gender' = 'both' OR c.details->>'gender' IS NULL)`);
            queryParams.push(filters.gender);
            paramIndex++;
        }

        if (filters.age_min) {
            whereConditions.push(`(c.details->>'max_age')::int >= $${paramIndex} OR c.details->>'max_age' IS NULL`);
            queryParams.push(parseInt(filters.age_min));
            paramIndex++;
        }

        if (filters.age_max) {
            whereConditions.push(`(c.details->>'min_age')::int <= $${paramIndex} OR c.details->>'min_age' IS NULL`);
            queryParams.push(parseInt(filters.age_max));
            paramIndex++;
        }

        if (filters.country) {
            whereConditions.push(`c.details->>'target_country' = $${paramIndex} OR c.details->>'target_country' IS NULL`);
            queryParams.push(filters.country);
            paramIndex++;
        }

        if (filters.price_min) {
            whereConditions.push(`c.course_fee >= $${paramIndex}`);
            queryParams.push(parseFloat(filters.price_min));
            paramIndex++;
        }

        if (filters.price_max) {
            whereConditions.push(`c.course_fee <= $${paramIndex}`);
            queryParams.push(parseFloat(filters.price_max));
            paramIndex++;
        }

        if (filters.status) {
            whereConditions.push(`c.status = $${paramIndex}`);
            queryParams.push(filters.status);
            paramIndex++;
        }

        const query = `
            SELECT 
                c.id,
                c.name,
                c.description,
                c.details,
                c.course_fee,
                c.duration_days,
                c.status,
                c.created_at,
                u.full_name as teacher_name,
                COUNT(e.id) as current_enrollment,
                CASE 
                    WHEN COUNT(e.id) >= (c.details->>'max_students')::int THEN 'full'
                    WHEN c.status = 'active' THEN 'available'
                    ELSE 'unavailable'
                END as availability_status
            FROM courses c
            LEFT JOIN users u ON c.teacher_id = u.id
            LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = 'active'
            WHERE ${whereConditions.join(' AND ')}
            GROUP BY c.id, c.name, c.description, c.details, c.course_fee, c.duration_days, c.status, c.created_at, u.full_name
            ORDER BY c.created_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        queryParams.push(filters.limit || 50, filters.offset || 0);

        console.log(`[DEBUG] Executing filtered courses query with ${queryParams.length} parameters`);
        const result = await pool.query(query, queryParams);
        
        console.log(`[DEBUG] Found ${result.rows.length} filtered courses`);
        return result.rows;
        
    } catch (error) {
        console.error(`[ERROR] Failed to get filtered courses:`, error.message);
        return [];
    }
}

/**
 * Get notifications for a user with pagination
 * @param {number} userId - User ID to fetch notifications for
 * @param {number} limit - Maximum number of notifications to return
 * @returns {Array} Array of user notifications
 */
export async function getNotifications(userId, limit = 20) {
    try {
        if (!userId) {
            console.log('[DEBUG] No userId provided to getNotifications');
            return [];
        }

        console.log(`[DEBUG] Fetching notifications for user ${userId}, limit: ${limit}`);
        
        const query = `
            SELECT 
                id,
                title,
                message,
                type,
                is_read,
                created_at,
                data
            FROM notifications 
            WHERE user_id = $1 
            ORDER BY created_at DESC 
            LIMIT $2
        `;
        
        const result = await pool.query(query, [userId, limit]);
        
        console.log(`[DEBUG] Found ${result.rows.length} notifications for user ${userId}`);
        
        return result.rows.map(notification => ({
            ...notification,
            data: notification.data || {},
            created_at: notification.created_at.toISOString()
        }));
        
    } catch (error) {
        console.error(`[ERROR] Failed to fetch notifications for user ${userId}:`, error.message);
        return [];
    }
}

/**
 * Get empty stats object for fallback
 * @returns {Object} Empty statistics object
 */
function getEmptyStats() {
    return {
        total_users: 0,
        total_students: 0,
        total_teachers: 0,
        total_admins: 0,
        total_parents: 0,
        total_workers: 0,
        total_finance: 0,
        total_heads: 0,
        total_courses: 0,
        active_courses: 0,
        published_courses: 0,
        draft_courses: 0,
        active_enrollments: 0,
        completed_enrollments: 0,
        pending_enrollments: 0,
        payment_pending_enrollments: 0,
        unique_active_students: 0,
        pending_payments: 0,
        completed_payments: 0,
        pending_requests: 0,
        new_users_this_month: 0,
        new_courses_this_month: 0,
        new_enrollments_this_month: 0,
        my_courses: 0,
        my_students: 0,
        my_enrollments: 0,
        my_children: 0,
        children_courses: 0,
        children_completed: 0,
        total_revenue: 0,
        outstanding_amount: 0
    };
}