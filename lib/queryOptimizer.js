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
                        (SELECT COUNT(*) FROM users WHERE role = 'student' AND account_status = 'active') as total_students,
                        (SELECT COUNT(*) FROM users WHERE role = 'teacher' AND account_status = 'active') as total_teachers,
                        (SELECT COUNT(*) FROM users WHERE role = 'admin' AND account_status = 'active') as total_admins,
                        (SELECT COUNT(*) FROM users WHERE role = 'parent' AND account_status = 'active') as total_parents,
                        (SELECT COUNT(*) FROM users WHERE role = 'worker' AND account_status = 'active') as total_workers,
                        (SELECT COUNT(*) FROM users WHERE role = 'finance' AND account_status = 'active') as total_finance,
                        (SELECT COUNT(*) FROM users WHERE role = 'head' AND account_status = 'active') as total_heads,
                        
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
                        
                        -- Payment counts
                        (SELECT COUNT(*) FROM payments WHERE status IN ('due', 'pending_review', 'late')) as pending_payments,
                        (SELECT COUNT(*) FROM payments WHERE status = 'paid') as completed_payments,
                        
                        -- Financial sums
                        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'paid') as total_revenue,
                        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status IN ('due', 'pending_review', 'late')) as outstanding_amount,
                        
                        -- Request counts
                        (SELECT COUNT(*) FROM user_edit_requests WHERE status = 'pending') as pending_requests,
                        
                        -- Monthly trends (using NOW() for broader compatibility)
                        (SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '30 days') as new_users_this_month,
                        (SELECT COUNT(*) FROM courses WHERE created_at >= NOW() - INTERVAL '30 days') as new_courses_this_month,
                        (SELECT COUNT(*) FROM enrollments WHERE created_at >= NOW() - INTERVAL '30 days') as new_enrollments_this_month
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
 * Get filtered courses based on criteria
 * @param {Object} filters - Filter criteria
 * @param {number} userId - User ID (optional)
 * @returns {Array} Array of filtered courses
 */
export async function getFilteredCourses(filters = {}, userId = null) {
    try {
        const {
            status = 'published',
            role,
            gender,
            age_min,
            age_max,
            country,
            price_min,
            price_max,
            limit = 50,
            offset = 0
        } = filters;

        let whereConditions = [];
        let queryParams = [];
        let paramCount = 0;

        // Base condition: only show published courses that are available for enrollment
        whereConditions.push(`(c.status = 'published' AND c.is_published = true)`);

        // Exclude courses the user is already enrolled in
        if (userId) {
            whereConditions.push(`c.id NOT IN (
                SELECT course_id FROM enrollments 
                WHERE user_id = $${++paramCount} 
                AND status IN ('active', 'pending_payment', 'pending_approval', 'waiting_start')
            )`);
            queryParams.push(userId);
        }

        // Role-based filtering (check participant_config)
        if (role) {
            whereConditions.push(`(c.participant_config->'roles' ? ${++paramCount})`);
            queryParams.push(role);
        }

        // Price filtering
        if (price_min) {
            whereConditions.push(`c.course_fee >= ${++paramCount}`);
            queryParams.push(price_min);
        }
        if (price_max) {
            whereConditions.push(`c.course_fee <= ${++paramCount}`);
            queryParams.push(price_max);
        }

        // Gender filtering
        if (gender && gender !== 'both') {
            whereConditions.push(`(c.details->>'gender' = $${++paramCount} OR c.details->>'gender' = 'both' OR c.details->>'gender' IS NULL)`);
            queryParams.push(gender);
        }

        // Age filtering
        if (age_min) {
            whereConditions.push(`(c.details->>'min_age')::integer <= $${++paramCount} OR c.details->>'min_age' IS NULL`);
            queryParams.push(age_min);
        }
        if (age_max) {
            whereConditions.push(`(c.details->>'max_age')::integer >= $${++paramCount} OR c.details->>'max_age' IS NULL`);
            queryParams.push(age_max);
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        const query = `
            SELECT 
                c.id,
                c.name,
                c.description,
                c.content_outline,
                c.duration_days,
                c.start_date,
                c.days_per_week,
                c.hours_per_day,
                c.status,
                c.is_published,
                c.is_launched,
                c.created_at,
                c.details,
                c.participant_config,
                COALESCE((
                    SELECT COUNT(*) 
                    FROM enrollments e 
                    WHERE e.course_id = c.id 
                    AND e.status IN ('active', 'waiting_start')
                ), 0) as current_enrollment,
                CASE 
                    WHEN c.max_enrollment <= (
                        SELECT COUNT(*) 
                        FROM enrollments e 
                        WHERE e.course_id = c.id 
                        AND e.status IN ('active', 'waiting_start')
                    ) THEN 'full'
                    WHEN c.start_date < CURRENT_DATE THEN 'started'
                    ELSE 'available'
                END as availability_status
            FROM courses c
            ${whereClause}
            ORDER BY c.created_at DESC
            LIMIT $${++paramCount} OFFSET $${++paramCount}
        `;

        queryParams.push(limit, offset);

        console.log('Executing getFilteredCourses query:', query);
        console.log('With parameters:', queryParams);

        const result = await pool.query(query, queryParams);
        return result.rows;

    } catch (error) {
        console.error('Error in getFilteredCourses:', error);
        throw error;
    }
}

/**
 * Get user by ID with specific fields
 * @param {number} userId - User ID
 * @param {Array} fields - Fields to select
 * @returns {Object} User object
 */
export async function getUserById(userId, fields = ['*']) {
    try {
        const fieldsList = fields.includes('*') ? '*' : fields.join(', ');
        const result = await pool.query(
            `SELECT ${fieldsList} FROM users WHERE id = $1`,
            [userId]
        );
        
        return result.rows[0] || null;
    } catch (error) {
        console.error('Error fetching user by ID:', error);
        throw error;
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
