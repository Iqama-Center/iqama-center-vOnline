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

        // Determine enrollment status based on user role and course context
        let enrollmentStatus = 'pending_payment';
        
        // Workers get pending_approval unless they're joining as students
        if (decoded.role === 'worker') {
            // Check if this is a worker development/training course
            const isWorkerTraining = course.details?.target_roles?.includes('worker') || 
                                   course.details?.course_type === 'training' ||
                                   course.details?.is_worker_development === true;
            
            if (isWorkerTraining) {
                enrollmentStatus = 'pending_approval';
            }
            // If worker joins a regular student course, use pending_payment
        }

        const enrollment = await pool.query(`INSERT INTO enrollments (user_id, course_id, status) VALUES ($1, $2, $3) RETURNING *`, [userId, courseId, enrollmentStatus]);
        
        // Only create payment record for pending_payment enrollments
        if (enrollmentStatus === 'pending_payment') {
            const cost = course.details?.cost || 300;
            const currency = course.details?.currency || 'EGP';
            await pool.query(`INSERT INTO payments (enrollment_id, amount, currency, due_date, status) VALUES ($1, $2, $3, NOW() + INTERVAL '7 day', 'due')`, [enrollment.rows[0].id, cost, currency]);
        }
        
        // In a real app, you would also trigger a notification here.
        
        const successMessage = enrollmentStatus === 'pending_approval' 
            ? 'تم التقديم بنجاح، بانتظار موافقة الإدارة.' 
            : 'تم التقديم بنجاح، بانتظار سداد الرسوم.';
        
        res.status(201).json({ message: successMessage });
    } catch (err) {
        if (err.code === '23505') { return res.status(409).json({ message: 'أنت مسجل بالفعل في هذه الدورة.' }); }
        console.error("Enrollment error:", err);
        res.status(500).json({ message: "خطأ أثناء التقديم." });
    }
}
