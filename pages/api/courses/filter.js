import pool from '../../../lib/db';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const token = req.cookies.token;
    let userId = null;
    let userDetails = {};

    // Get user details if authenticated
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.id]);
            if (userResult.rows.length > 0) {
                userId = decoded.id;
                userDetails = userResult.rows[0].details || {};
            }
        } catch (err) {
            // Continue without user context
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
            status = 'active'
        } = req.query;

        let query = `
            SELECT 
                c.*,
                COUNT(e.id) as current_enrollment,
                CASE 
                    WHEN COUNT(e.id) >= c.max_enrollment THEN 'full'
                    WHEN COUNT(e.id) >= c.min_enrollment THEN 'available'
                    ELSE 'waiting'
                END as availability_status,
                u.full_name as creator_name
            FROM courses c
            LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = 'active'
            LEFT JOIN users u ON c.created_by = u.id
            WHERE c.status = $1
        `;
        
        const params = [status];
        let paramCount = 1;

        // Filter by target roles
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

        query += `
            GROUP BY c.id, u.full_name
            ORDER BY 
                CASE 
                    WHEN COUNT(e.id) >= c.max_enrollment THEN 3
                    WHEN COUNT(e.id) >= c.min_enrollment THEN 1
                    ELSE 2
                END,
                c.created_at DESC
        `;

        const result = await pool.query(query, params);

        const courses = result.rows.map(course => {
            const courseData = {
                ...course,
                details: course.details || {},
                current_enrollment: parseInt(course.current_enrollment) || 0
            };

            // Add eligibility check if user is authenticated
            if (userId) {
                courseData.eligible = checkEligibility(courseData, userDetails);
                courseData.eligibility_reasons = getEligibilityReasons(courseData, userDetails);
            }

            return courseData;
        });

        res.status(200).json(courses);
    } catch (err) {
        console.error('Filter courses error:', err);
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