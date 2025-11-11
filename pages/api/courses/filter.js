import pool from '../../../lib/db';
import jwt from 'jsonwebtoken';
// Removed import of non-existent function

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const token = req.cookies.token;
    let userId = null;
    let userDetails = {};

    // Get user details if authenticated
    if (token && process.env.JWT_SECRET) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const userResult = await pool.query('SELECT id, details FROM users WHERE id = $1', [decoded.id]);
            if (userResult.rows.length > 0) {
                userId = decoded.id;
                userDetails = userResult.rows[0].details || {};
            }
        } catch (err) {
            // Continue without user context
            if (process.env.NODE_ENV === 'development') {
                // console.log('JWT verification failed:', err.message);
            }
        }
    }

    try {
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
        } = req.query;

        // Use optimized query function
        const filters = {
            role,
            gender,
            age_min,
            age_max,
            country,
            price_min,
            price_max,
            status,
            limit: parseInt(limit),
            offset: parseInt(offset)
        };

        const courses = await getFilteredCoursesQuery(filters, userId);

        // Add eligibility check if user is authenticated
        const processedCourses = courses.map(course => {
            const courseData = {
                ...course,
                details: course.details || {},
                current_enrollment: parseInt(course.current_enrollment) || 0
            };

            if (userId) {
                courseData.eligible = checkEligibility(courseData, userDetails);
                courseData.eligibility_reasons = getEligibilityReasons(courseData, userDetails);
            }

            return courseData;
        });

        res.status(200).json(processedCourses);
    } catch (err) {
        // Log error in development only
        if (process.env.NODE_ENV === 'development') {
            console.error('Filter courses error:', err);
        }
        res.status(500).json({ message: 'خطأ في تحميل الدورات' });
    }
}

function checkEligibility(course, userDetails) {
    const courseDetails = course.details || {};
    
    // Check age
    if (courseDetails.min_age || courseDetails.max_age) {
        if (!userDetails.birth_date) return false;
        
        const birthDate = new Date(userDetails.birth_date);
        const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        
        if (courseDetails.min_age && age < courseDetails.min_age) return false;
        if (courseDetails.max_age && age > courseDetails.max_age) return false;
    }
    
    // Check gender
    if (courseDetails.gender && courseDetails.gender !== 'both' && userDetails.gender !== courseDetails.gender) {
        return false;
    }
    
    // Check if course is full
    if (course.availability_status === 'full') return false;
    
    return true;
}

function getEligibilityReasons(course, userDetails) {
    const reasons = [];
    const courseDetails = course.details || {};
    
    if (courseDetails.min_age || courseDetails.max_age) {
        if (!userDetails.birth_date) {
            reasons.push('يرجى تحديث تاريخ الميلاد في ملفك الشخصي');
        } else {
            const birthDate = new Date(userDetails.birth_date);
            const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
            
            if (courseDetails.min_age && age < courseDetails.min_age) {
                reasons.push(`هذه الدورة للأعمار من ${courseDetails.min_age} سنة فما فوق`);
            }
            if (courseDetails.max_age && age > courseDetails.max_age) {
                reasons.push(`هذه الدورة للأعمار حتى ${courseDetails.max_age} سنة`);
            }
        }
    }
    
    if (courseDetails.gender && courseDetails.gender !== 'both' && userDetails.gender !== courseDetails.gender) {
        const genderText = courseDetails.gender === 'male' ? 'الذكور' : 'الإناث';
        reasons.push(`هذه الدورة مخصصة لـ${genderText} فقط`);
    }
    
    if (course.availability_status === 'full') {
        reasons.push('الدورة مكتملة العدد');
    }
    
    return reasons;
}

// Implement the filtered courses query directly
async function getFilteredCoursesQuery(filters, userId) {
    let whereConditions = ['c.is_published = true', 'c.teacher_id IS NOT NULL'];
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
                WHEN COUNT(e.id) >= c.max_enrollment THEN 'full'
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

    const result = await pool.query(query, queryParams);
    return result.rows;
}