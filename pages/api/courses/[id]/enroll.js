import pool from '../../../../lib/db';
import jwt from 'jsonwebtoken';



export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { id: courseId } = req.query;
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const courseResult = await pool.query('SELECT details FROM courses WHERE id = $1', [courseId]);
        if (courseResult.rows.length === 0) return res.status(404).json({ message: "الدورة غير موجودة." });

        const course = courseResult.rows[0];
        const prerequisites = course.details?.prerequisites || [];

        if (prerequisites.length > 0) {
            const completedCoursesQuery = `SELECT course_id FROM enrollments WHERE user_id = $1 AND status = 'completed'`;
            const completedResult = await pool.query(completedCoursesQuery, [userId]);
            const completedCourseIds = completedResult.rows.map(r => r.course_id);
            const hasMetPrerequisites = prerequisites.every(prereqId => completedCourseIds.includes(prereqId));
            if (!hasMetPrerequisites) {
                return res.status(403).json({ message: "لم تكمل المتطلبات السابقة لهذه الدورة." });
            }
        }

        // Get user details for financial configuration
        const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
        const userRole = userResult.rows[0]?.role;

        // Determine financial requirements based on participant config and user role
        let financialConfig = null;
        let enrollmentStatus = 'pending_payment';
        
        // Parse participant config to find matching level for user role
        if (course.participant_config) {
            const participantConfig = typeof course.participant_config === 'string' 
                ? JSON.parse(course.participant_config) 
                : course.participant_config;
            
            // Find the level that matches user's role
            for (const [levelKey, config] of Object.entries(participantConfig)) {
                if (config.roles && config.roles.includes(userRole)) {
                    financialConfig = config.financial;
                    break;
                }
            }
        }

        // Determine enrollment status based on financial config and user role
        if (financialConfig && financialConfig.type !== 'none') {
            if (financialConfig.type === 'pay') {
                enrollmentStatus = 'pending_payment';
            } else if (financialConfig.type === 'receive') {
                enrollmentStatus = 'active'; // No payment required, they receive money
            }
        } else {
            // Workers get pending_approval for training courses
            if (decoded.role === 'worker') {
                const isWorkerTraining = course.details?.target_roles?.includes('worker') || 
                                       course.details?.course_type === 'training' ||
                                       course.details?.is_worker_development === true;
                
                if (isWorkerTraining) {
                    enrollmentStatus = 'pending_approval';
                }
            } else {
                // Fallback to course-level pricing
                const cost = course.course_fee || 0;
                if (cost > 0) {
                    enrollmentStatus = 'pending_payment';
                } else {
                    enrollmentStatus = 'active'; // Free course
                }
            }
        }

        // Validate inputs before insertion
        const parsedUserId = parseInt(userId);
        const parsedCourseId = parseInt(courseId);
        if (isNaN(parsedUserId) || parsedUserId <= 0) {
            throw new Error(`Invalid user ID: ${userId}`);
        }
                if (isNaN(parsedCourseId) || parsedCourseId <= 0) {
                    throw new Error(`Invalid course ID: ${courseId}`);
                }
                
                const { preferred_days, preferred_start_time } = req.body;
        
                const enrollment = await pool.query(
            `INSERT INTO enrollments (user_id, course_id, status, preferred_days, preferred_start_time) 
             VALUES ($1, $2, $3, $4, $5) 
             ON CONFLICT (user_id, course_id) DO UPDATE SET status = EXCLUDED.status, preferred_days = EXCLUDED.preferred_days, preferred_start_time = EXCLUDED.preferred_start_time
             RETURNING *`, 
            [parsedUserId, parsedCourseId, enrollmentStatus, preferred_days, preferred_start_time]
        );
        
        // Create payment record if user needs to pay
        if (enrollmentStatus === 'pending_payment') {
            let amount, currency;
            
            if (financialConfig && financialConfig.type === 'pay') {
                // Use participant-level financial config
                amount = parseFloat(financialConfig.amount);
                currency = financialConfig.currency || 'EGP';
            } else {
                // Fallback to course-level pricing
                const courseDetails = await pool.query('SELECT course_fee, details FROM courses WHERE id = $1', [courseId]);
                amount = courseDetails.rows[0].course_fee || 0;
                currency = courseDetails.rows[0].details?.currency || 'EGP';
            }
            
            await pool.query(`INSERT INTO payments (enrollment_id, amount, currency, due_date, status) VALUES ($1, $2, $3, NOW() + INTERVAL '7 day', 'due')`, [enrollment.rows[0].id, amount, currency]);
        }

        // Create reward record if user receives payment
        if (financialConfig && financialConfig.type === 'receive') {
            const amount = parseFloat(financialConfig.amount);
            const currency = financialConfig.currency || 'EGP';
            
            // Create a positive payment record (reward/salary)
            await pool.query(
                `INSERT INTO payments (enrollment_id, amount, currency, due_date, status, notes) 
                 VALUES ($1, $2, $3, NOW() + INTERVAL '7 day', 'paid', $4)`,
                [
                    enrollment.rows[0].id,
                    amount,
                    currency,
                    `مكافأة المشاركة في الدورة (${userRole}) - REWARD`
                ]
            );
        }
        
        // In a real app, you would also trigger a notification here.
        
        // Determine success message based on enrollment status and financial configuration
        let successMessage;
        if (enrollmentStatus === 'pending_approval') {
            successMessage = 'تم التقديم بنجاح، بانتظار موافقة الإدارة.';
        } else if (enrollmentStatus === 'pending_payment') {
            if (financialConfig && financialConfig.type === 'pay') {
                successMessage = `تم التقديم بنجاح، يرجى دفع رسوم ${financialConfig.amount} ${financialConfig.currency} خلال 7 أيام.`;
            } else {
                successMessage = 'تم التقديم بنجاح، بانتظار سداد الرسوم.';
            }
        } else if (financialConfig && financialConfig.type === 'receive') {
            successMessage = `تم التقديم بنجاح! ستحصل على مكافأة قدرها ${financialConfig.amount} ${financialConfig.currency}.`;
        } else {
            successMessage = 'تم التقديم بنجاح في الدورة.';
        }
        
        res.status(201).json({ 
            message: successMessage,
            financialInfo: financialConfig ? {
                type: financialConfig.type,
                amount: financialConfig.amount,
                currency: financialConfig.currency,
                timing: financialConfig.timing
            } : null
        });
    } catch (err) {
        if (err.code === '23505') { return res.status(409).json({ message: 'أنت مسجل بالفعل في هذه الدورة.' }); }
        console.error("Enrollment error:", err);
        res.status(500).json({ message: "خطأ أثناء التقديم." });
    }
}