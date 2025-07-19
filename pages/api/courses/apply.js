import pool from '../../../lib/db';
import jwt from 'jsonwebtoken';
import NotificationService from '../../../services/notificationService';
import errorHandler from '../../../lib/errorHandler';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { courseId } = req.body;

        if (!courseId) {
            return res.status(400).json({ message: 'Course ID is required' });
        }

        // Check if course exists and is available
        const courseResult = await pool.query(`
            SELECT c.*, COUNT(e.id) as current_enrollment
            FROM courses c
            LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = 'active'
            WHERE c.id = $1 AND c.status = 'active'
            GROUP BY c.id
        `, [courseId]);

        if (courseResult.rows.length === 0) {
            return res.status(404).json({ message: 'الدورة غير موجودة أو غير متاحة' });
        }

        const course = courseResult.rows[0];
        const currentEnrollment = parseInt(course.current_enrollment) || 0;

        // Check if course is full
        if (currentEnrollment >= course.max_enrollment) {
            return res.status(400).json({ message: 'الدورة مكتملة العدد' });
        }

        // Check if user is already enrolled
        const existingEnrollment = await pool.query(
            'SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2',
            [decoded.id, courseId]
        );

        if (existingEnrollment.rows.length > 0) {
            return res.status(400).json({ message: 'أنت مسجل بالفعل في هذه الدورة' });
        }

        // Get user details for eligibility check
        const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.id]);
        const user = userResult.rows[0];

        // Check user eligibility based on course requirements
        const courseDetails = course.details || {};
        const userDetails = user.details || {};

        // Age check
        if (courseDetails.min_age || courseDetails.max_age) {
            const birthDate = new Date(userDetails.birth_date);
            const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
            
            if (courseDetails.min_age && age < courseDetails.min_age) {
                return res.status(400).json({ message: `هذه الدورة للأعمار من ${courseDetails.min_age} سنة فما فوق` });
            }
            
            if (courseDetails.max_age && age > courseDetails.max_age) {
                return res.status(400).json({ message: `هذه الدورة للأعمار حتى ${courseDetails.max_age} سنة` });
            }
        }

        // Gender check
        if (courseDetails.gender && courseDetails.gender !== 'both' && userDetails.gender !== courseDetails.gender) {
            const genderText = courseDetails.gender === 'male' ? 'الذكور' : 'الإناث';
            return res.status(400).json({ message: `هذه الدورة مخصصة لـ${genderText} فقط` });
        }

        // Create enrollment
        const enrollment = await pool.query(
            'INSERT INTO enrollments (user_id, course_id, status) VALUES ($1, $2, $3) RETURNING *',
            [decoded.id, courseId, 'pending_payment']
        );

        // Create payment record if course has fees
        if (courseDetails.price && courseDetails.price > 0) {
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 7); // Payment due in 7 days

            await pool.query(
                `INSERT INTO payments (enrollment_id, amount, currency, due_date, status, notes) 
                 VALUES ($1, $2, $3, $4, 'due', $5)`,
                [
                    enrollment.rows[0].id,
                    courseDetails.price,
                    courseDetails.currency || 'SAR',
                    dueDate,
                    `رسوم التسجيل في دورة ${course.name}`
                ]
            );

            // Send payment notification
            await NotificationService.createPaymentReminder(
                [decoded.id],
                courseDetails.price,
                courseDetails.currency || 'SAR',
                dueDate
            );
        }

        // Update course enrollment count
        await pool.query(
            'UPDATE courses SET current_enrollment = current_enrollment + 1 WHERE id = $1',
            [courseId]
        );

        // Create notification for course supervisors
        const supervisors = await pool.query(
            "SELECT id FROM users WHERE role IN ('admin', 'head') OR reports_to IS NULL"
        );

        for (const supervisor of supervisors.rows) {
            await pool.query(
                `INSERT INTO notifications (user_id, type, message, link, created_at) 
                 VALUES ($1, 'announcement', $2, $3, CURRENT_TIMESTAMP)`,
                [
                    supervisor.id,
                    `تسجيل جديد: ${user.full_name} في دورة ${course.name}`,
                    `/admin/courses/${courseId}`
                ]
            );
        }

        res.status(201).json({
            message: courseDetails.price > 0 
                ? 'تم التسجيل بنجاح! يرجى دفع الرسوم خلال 7 أيام لتأكيد التسجيل'
                : 'تم التسجيل بنجاح في الدورة',
            enrollment: enrollment.rows[0]
        });

    } catch (err) {
        console.error('Course application error:', err);
        errorHandler(err, res);
    }
}