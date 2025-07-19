import pool from '../../../lib/db';
import { withAuth } from '../../../lib/withAuth';

export default withAuth(async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { user } = req;

    try {
        const {
            courseId,
            userId,
            userGrade,
            dailyRatings,
            overallRating,
            evaluationData
        } = req.body;

        // التحقق من البيانات المطلوبة
        if (!courseId || !userId || !userGrade) {
            return res.status(400).json({ message: 'البيانات المطلوبة غير مكتملة' });
        }

        // التحقق من صلاحية المستخدم لتحديث التقييم
        if (user.id !== userId && !['admin', 'head', 'teacher'].includes(user.role)) {
            return res.status(403).json({ message: 'غير مصرح لك بتحديث هذا التقييم' });
        }

        // التحقق من وجود الدورة والمستخدم
        const courseCheck = await pool.query(
            'SELECT id, name, status FROM courses WHERE id = $1',
            [courseId]
        );

        if (courseCheck.rows.length === 0) {
            return res.status(404).json({ message: 'الدورة غير موجودة' });
        }

        const course = courseCheck.rows[0];

        // التحقق من تسجيل المستخدم في الدورة
        const enrollmentCheck = await pool.query(
            'SELECT id, status FROM enrollments WHERE course_id = $1 AND user_id = $2',
            [courseId, userId]
        );

        if (enrollmentCheck.rows.length === 0) {
            return res.status(403).json({ message: 'المستخدم غير مسجل في هذه الدورة' });
        }

        await pool.query('BEGIN');

        // تحديث أو إدراج التقييم
        const existingRating = await pool.query(
            'SELECT id FROM course_ratings WHERE course_id = $1 AND user_id = $2',
            [courseId, userId]
        );

        if (existingRating.rows.length > 0) {
            // تحديث التقييم الموجود
            await pool.query(`
                UPDATE course_ratings 
                SET 
                    daily_ratings = $1,
                    overall_rating = $2,
                    evaluation_data = $3,
                    last_updated = NOW()
                WHERE course_id = $4 AND user_id = $5
            `, [
                JSON.stringify(dailyRatings),
                overallRating,
                JSON.stringify(evaluationData),
                courseId,
                userId
            ]);
        } else {
            // إدراج تقييم جديد
            await pool.query(`
                INSERT INTO course_ratings (
                    course_id,
                    user_id,
                    grade_level,
                    grade_title,
                    category_name,
                    daily_ratings,
                    overall_rating,
                    evaluation_data,
                    created_at,
                    last_updated
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
            `, [
                courseId,
                userId,
                userGrade.level,
                userGrade.title,
                userGrade.category,
                JSON.stringify(dailyRatings),
                overallRating,
                JSON.stringify(evaluationData)
            ]);
        }

        // تحديث إحصائيات الدورة
        await updateCourseStatistics(courseId);

        // إرسال إشعار للمشرفين إذا كان التقييم منخفض
        if (overallRating < 60) {
            await notifyLowPerformance(courseId, userId, overallRating, course.name);
        }

        await pool.query('COMMIT');

        res.status(200).json({
            message: 'تم تحديث التقييم بنجاح',
            rating: {
                courseId,
                userId,
                overallRating,
                lastUpdated: new Date().toISOString()
            }
        });

    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Rating update error:', error);
        res.status(500).json({ 
            message: 'حدث خطأ في تحديث التقييم',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// دالة تحديث إحصائيات الدورة
async function updateCourseStatistics(courseId) {
    try {
        // حساب متوسط التقييمات
        const avgResult = await pool.query(`
            SELECT 
                AVG(overall_rating) as avg_rating,
                COUNT(*) as total_ratings,
                COUNT(CASE WHEN overall_rating >= 80 THEN 1 END) as excellent_count,
                COUNT(CASE WHEN overall_rating >= 60 AND overall_rating < 80 THEN 1 END) as good_count,
                COUNT(CASE WHEN overall_rating < 60 THEN 1 END) as poor_count
            FROM course_ratings 
            WHERE course_id = $1
        `, [courseId]);

        const stats = avgResult.rows[0];

        // تحديث إحصائيات الدورة
        await pool.query(`
            UPDATE courses 
            SET details = COALESCE(details, '{}') || $1
            WHERE id = $2
        `, [
            JSON.stringify({
                statistics: {
                    averageRating: Math.round(parseFloat(stats.avg_rating) || 0),
                    totalRatings: parseInt(stats.total_ratings) || 0,
                    excellentCount: parseInt(stats.excellent_count) || 0,
                    goodCount: parseInt(stats.good_count) || 0,
                    poorCount: parseInt(stats.poor_count) || 0,
                    lastUpdated: new Date().toISOString()
                }
            }),
            courseId
        ]);

    } catch (error) {
        console.error('Statistics update error:', error);
    }
}

// دالة إرسال إشعار للأداء المنخفض
async function notifyLowPerformance(courseId, userId, rating, courseName) {
    try {
        // الحصول على معلومات المستخدم
        const userResult = await pool.query(
            'SELECT full_name, email FROM users WHERE id = $1',
            [userId]
        );

        if (userResult.rows.length === 0) return;

        const user = userResult.rows[0];

        // الحصول على المشرفين والمعلمين في الدورة
        const supervisorsResult = await pool.query(`
            SELECT DISTINCT u.id, u.full_name, u.email
            FROM users u
            JOIN enrollments e ON u.id = e.user_id
            JOIN course_roles cr ON e.course_id = cr.course_id
            WHERE e.course_id = $1 
            AND (cr.grade_level = 'grade3' OR u.role IN ('admin', 'head', 'teacher'))
        `, [courseId]);

        // إرسال إشعارات للمشرفين
        for (const supervisor of supervisorsResult.rows) {
            await pool.query(`
                INSERT INTO notifications (
                    user_id,
                    title,
                    message,
                    type,
                    link,
                    created_at
                ) VALUES ($1, $2, $3, $4, $5, NOW())
            `, [
                supervisor.id,
                'تنبيه: أداء منخفض في الدورة',
                `المتدرب ${user.full_name} حصل على تقييم منخفض (${rating}%) في دورة ${courseName}. يرجى المتابعة والتدخل إذا لزم الأمر.`,
                'low_performance_alert',
                `/courses/${courseId}/ratings`
            ]);
        }

    } catch (error) {
        console.error('Low performance notification error:', error);
    }
}

// API للحصول على تقييمات الدورة
export async function getCourseRatings(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { courseId } = req.query;

        if (!courseId) {
            return res.status(400).json({ message: 'معرف الدورة مطلوب' });
        }

        // الحصول على جميع التقييمات للدورة
        const ratingsResult = await pool.query(`
            SELECT 
                cr.*,
                u.full_name,
                u.email,
                u.role
            FROM course_ratings cr
            JOIN users u ON cr.user_id = u.id
            WHERE cr.course_id = $1
            ORDER BY cr.overall_rating DESC, cr.last_updated DESC
        `, [courseId]);

        // الحصول على إحصائيات الدورة
        const statsResult = await pool.query(`
            SELECT 
                AVG(overall_rating) as avg_rating,
                COUNT(*) as total_participants,
                COUNT(CASE WHEN overall_rating >= 90 THEN 1 END) as excellent,
                COUNT(CASE WHEN overall_rating >= 80 AND overall_rating < 90 THEN 1 END) as very_good,
                COUNT(CASE WHEN overall_rating >= 70 AND overall_rating < 80 THEN 1 END) as good,
                COUNT(CASE WHEN overall_rating >= 60 AND overall_rating < 70 THEN 1 END) as acceptable,
                COUNT(CASE WHEN overall_rating < 60 THEN 1 END) as poor
            FROM course_ratings 
            WHERE course_id = $1
        `, [courseId]);

        const stats = statsResult.rows[0];

        // تجميع التقييمات اليومية
        const dailyStatsResult = await pool.query(`
            SELECT 
                day_number,
                AVG(rating) as avg_rating,
                COUNT(*) as participant_count
            FROM (
                SELECT 
                    (jsonb_each_text(daily_ratings)).key::integer as day_number,
                    (jsonb_each_text(daily_ratings)).value::integer as rating
                FROM course_ratings 
                WHERE course_id = $1
            ) daily_data
            GROUP BY day_number
            ORDER BY day_number
        `, [courseId]);

        res.status(200).json({
            ratings: ratingsResult.rows,
            statistics: {
                averageRating: Math.round(parseFloat(stats.avg_rating) || 0),
                totalParticipants: parseInt(stats.total_participants) || 0,
                distribution: {
                    excellent: parseInt(stats.excellent) || 0,
                    veryGood: parseInt(stats.very_good) || 0,
                    good: parseInt(stats.good) || 0,
                    acceptable: parseInt(stats.acceptable) || 0,
                    poor: parseInt(stats.poor) || 0
                }
            },
            dailyStats: dailyStatsResult.rows
        });

    } catch (error) {
        console.error('Get ratings error:', error);
        res.status(500).json({ 
            message: 'حدث خطأ في جلب التقييمات',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}