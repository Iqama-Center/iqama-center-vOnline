const pool = require('./db');

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
        console.log('[DEBUG] No user or role provided, returning empty stats');
        return getEmptyStats();
    }

    console.log(`[DEBUG] Getting dashboard stats for role: ${user.role}`);

    try {
        let query = '';
        let params = [];

        switch (user.role) {
            case 'admin':
                query = `
                    SELECT 
                        -- User counts (active users only)
                        (SELECT COUNT(*) FROM users WHERE account_status = 'active' OR account_status IS NULL) as total_users,
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