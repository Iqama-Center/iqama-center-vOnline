import pool from '../../../lib/db';
import jwt from 'jsonwebtoken';
import { getFilteredCourses, getUserById } from '../../../lib/queryOptimizer';

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
            const user = await getUserById(decoded.id, ['id', 'details']);
            if (user) {
                userId = decoded.id;
                userDetails = user.details || {};
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

        const courses = await getFilteredCourses(filters, userId);

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