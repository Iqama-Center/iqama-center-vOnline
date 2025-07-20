// Database query optimization utilities
import pool from './db';

// Optimized user queries - only select needed fields
export const getUserById = async (id, fields = ['id', 'full_name', 'email', 'role']) => {
    const fieldList = fields.join(', ');
    const result = await pool.query(`SELECT ${fieldList} FROM users WHERE id = $1`, [id]);
    return result.rows[0];
};

export const getUserByEmailOrPhone = async (emailOrPhone, fields = ['id', 'full_name', 'email', 'phone', 'password_hash', 'role', 'account_status']) => {
    const fieldList = fields.join(', ');
    const result = await pool.query(`SELECT ${fieldList} FROM users WHERE email = $1 OR phone = $1`, [emailOrPhone]);
    return result.rows[0];
};

// Optimized course queries
export const getCourseById = async (id, includeSchedule = false) => {
    const courseResult = await pool.query(
        `SELECT id, name, description, status, is_published, created_by, details, 
                min_enrollment, max_enrollment, start_date, duration_days 
         FROM courses WHERE id = $1`, 
        [id]
    );
    
    if (!courseResult.rows[0]) return null;
    
    const course = courseResult.rows[0];
    
    if (includeSchedule) {
        const scheduleResult = await pool.query(
            `SELECT day_number, title, content_url, meeting_link, scheduled_date 
             FROM course_schedule WHERE course_id = $1 ORDER BY day_number`,
            [id]
        );
        course.schedule = scheduleResult.rows;
    }
    
    return course;
};

// Optimized dashboard stats - single query instead of multiple
export const getDashboardStats = async (userRole, userId = null) => {
    let query, params = [];
    
    switch (userRole) {
        case 'admin':
            query = `
                SELECT 
                    (SELECT COUNT(*) FROM users) as total_users,
                    (SELECT COUNT(*) FROM courses WHERE status = 'active' OR (status = 'published' AND is_published = true)) as total_courses,
                    (SELECT COUNT(*) FROM payments WHERE status = 'due') as pending_payments,
                    (SELECT COUNT(*) FROM user_edit_requests WHERE status = 'pending') as pending_requests
            `;
            break;
            
        case 'finance':
            query = `
                SELECT 
                    (SELECT COUNT(*) FROM payments WHERE status = 'pending_review') as pending_review_count,
                    (SELECT COUNT(*) FROM payments WHERE status = 'due') as due_count,
                    (SELECT COUNT(*) FROM payments WHERE status = 'late') as late_count,
                    (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'paid' AND paid_at >= NOW() - INTERVAL '30 days') as total_paid_this_month
            `;
            break;
            
        case 'head':
            query = `
                SELECT 
                    (SELECT COUNT(*) FROM users WHERE role = 'teacher' AND reports_to = $1) as teacher_count,
                    (SELECT COUNT(DISTINCT e.user_id) FROM enrollments e JOIN courses c ON e.course_id = c.id WHERE c.created_by IN (SELECT id FROM users WHERE reports_to = $1)) as student_count,
                    (SELECT COUNT(*) FROM courses WHERE status = 'published' AND is_published = true) as published_courses_count,
                    (SELECT COUNT(*) FROM courses WHERE status = 'active') as active_courses_count,
                    (SELECT COUNT(*) FROM courses WHERE status = 'draft') as draft_courses_count
            `;
            params = [userId];
            break;
            
        default:
            return {};
    }
    
    const result = await pool.query(query, params);
    return result.rows[0] || {};
};

// Optimized notifications with pagination
export const getNotifications = async (userId, limit = 20, offset = 0, unreadOnly = false) => {
    let query = `
        SELECT id, type, title, message, related_id, is_read, created_at 
        FROM notifications 
        WHERE user_id = $1
    `;
    const params = [userId];
    
    if (unreadOnly) {
        query += ` AND is_read = false`;
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    return result.rows;
};

// Optimized course filtering with better performance
export const getFilteredCourses = async (filters = {}, userId = null) => {
    const { 
        role, 
        gender, 
        age_min, 
        age_max, 
        country, 
        price_min, 
        price_max,
        status = 'active', 
        limit = 50, 
        offset = 0 
    } = filters;
    
    let query = `
        SELECT 
            c.id, c.name, c.description, c.status, c.details,
            c.min_enrollment, c.max_enrollment, c.created_at,
            u.full_name as creator_name,
            COUNT(e.id) as current_enrollment,
            CASE 
                WHEN COUNT(e.id) >= c.max_enrollment THEN 'full'
                WHEN COUNT(e.id) >= c.min_enrollment THEN 'available'
                ELSE 'waiting'
            END as availability_status
        FROM courses c
        LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = 'active'
        LEFT JOIN users u ON c.created_by = u.id
        WHERE c.status = $1
    `;
    
    const params = [status];
    let paramCount = 1;
    
    // Add role filter if specified
    if (role) {
        paramCount++;
        query += ` AND (c.details->>'target_roles' IS NULL OR c.details->>'target_roles' LIKE $${paramCount})`;
        params.push(`%"${role}"%`);
    }

    // Filter by gender
    if (gender) {
        paramCount++;
        query += ` AND (c.details->>'gender' IS NULL OR c.details->>'gender' = 'both' OR c.details->>'gender' = $${paramCount})`;
        params.push(gender);
    }

    // Filter by age range
    if (age_min) {
        paramCount++;
        query += ` AND (c.details->>'max_age' IS NULL OR CAST(c.details->>'max_age' AS INTEGER) >= $${paramCount})`;
        params.push(age_min);
    }

    if (age_max) {
        paramCount++;
        query += ` AND (c.details->>'min_age' IS NULL OR CAST(c.details->>'min_age' AS INTEGER) <= $${paramCount})`;
        params.push(age_max);
    }

    // Filter by country/region
    if (country) {
        paramCount++;
        query += ` AND (c.details->>'target_countries' IS NULL OR c.details->>'target_countries' LIKE $${paramCount})`;
        params.push(`%"${country}"%`);
    }

    // Filter by price range
    if (price_min) {
        paramCount++;
        query += ` AND (c.details->>'price' IS NULL OR CAST(c.details->>'price' AS DECIMAL) >= $${paramCount})`;
        params.push(price_min);
    }

    if (price_max) {
        paramCount++;
        query += ` AND (c.details->>'price' IS NULL OR CAST(c.details->>'price' AS DECIMAL) <= $${paramCount})`;
        params.push(price_max);
    }
    
    // Exclude courses user is already enrolled in
    if (userId) {
        paramCount++;
        query += ` AND NOT EXISTS (SELECT 1 FROM enrollments WHERE course_id = c.id AND user_id = $${paramCount})`;
        params.push(userId);
    }

    // Only show published or active courses
    query += ` AND (c.is_published = true OR c.status = 'active' OR (c.status = 'published' AND c.is_published = true))`;
    
    query += `
        GROUP BY c.id, u.full_name
        ORDER BY 
            CASE 
                WHEN COUNT(e.id) >= c.max_enrollment THEN 3
                WHEN COUNT(e.id) >= c.min_enrollment THEN 1
                ELSE 2
            END,
            c.created_at DESC
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    return result.rows;
};

// Batch user loading for efficiency
export const getUsersByIds = async (userIds, fields = ['id', 'full_name', 'email', 'role']) => {
    if (!userIds.length) return [];
    
    const fieldList = fields.join(', ');
    const placeholders = userIds.map((_, i) => `$${i + 1}`).join(', ');
    
    const result = await pool.query(
        `SELECT ${fieldList} FROM users WHERE id IN (${placeholders})`,
        userIds
    );
    
    return result.rows;
};