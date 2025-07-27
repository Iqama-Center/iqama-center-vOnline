import pool from '../../../lib/db';
import { withAuth } from '../../../lib/withAuth';

export default withAuth(async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { user } = req;
    
    // التحقق من صلاحيات إنشاء الدورات
    if (!['admin', 'head', 'teacher'].includes(user.role)) {
        return res.status(403).json({ message: 'غير مصرح لك بإنشاء الدورات' });
    }

    try {
        const {
            name,
            description,
            tableOfContents,
            duration,
            startDate,
            weekDays,
            dailyHours,
            grade1,
            grade2,
            grade3,
            autoLaunchOptions,
            autoFill,
            schedule
        } = req.body;

        // التحقق من البيانات المطلوبة
        if (!name || !description || !duration || !startDate) {
            return res.status(400).json({ message: 'البيانات الأساسية مطلوبة' });
        }

        // التحقق من وجود أدوار محددة
        const hasSelectedRoles = [grade1, grade2, grade3].some(grade => 
            grade && grade.categories && grade.categories.some(cat => cat.selected && cat.count > 0)
        );

        if (!hasSelectedRoles) {
            return res.status(400).json({ message: 'يجب تحديد أدوار المشاركين في الدورة' });
        }

        await pool.query('BEGIN');

        // إنشاء الدورة الأساسية
        const courseResult = await pool.query(`
            INSERT INTO courses (
                name, 
                description, 
                table_of_contents,
                duration, 
                start_date, 
                week_days,
                daily_hours,
                status, 
                created_by, 
                created_at,
                details
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), $10) 
            RETURNING id
        `, [
            name,
            description,
            tableOfContents,
            parseInt(duration),
            startDate,
            parseInt(weekDays) || null,
            parseFloat(dailyHours) || null,
            'draft',
            user.id,
            JSON.stringify({
                autoLaunchOptions,
                autoFill,
                ratingSystem: {
                    grade1,
                    grade2,
                    grade3
                }
            })
        ]);

        const courseId = courseResult.rows[0].id;

        // إنشاء أدوار الدورة والمتطلبات
        for (const [gradeKey, grade] of Object.entries({ grade1, grade2, grade3 })) {
            if (grade && grade.categories) {
                for (const category of grade.categories) {
                    if (category.selected && category.count > 0) {
                        await pool.query(`
                            INSERT INTO course_roles (
                                course_id,
                                grade_level,
                                grade_title,
                                category_name,
                                required_count,
                                current_count,
                                created_at
                            ) VALUES ($1, $2, $3, $4, $5, 0, NOW())
                        `, [
                            courseId,
                            gradeKey,
                            grade.title,
                            category.name,
                            category.count
                        ]);
                    }
                }
            }
        }

        // إنشاء الجدولة اليومية إذا تم توفيرها
        if (schedule && Array.isArray(schedule)) {
            for (const day of schedule) {
                await pool.query(`
                    INSERT INTO course_schedule (
                        course_id,
                        day_number,
                        title,
                        content_links,
                        meeting_link,
                        meeting_start_time,
                        tasks,
                        exam_questions,
                        is_completed,
                        created_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
                `, [
                    courseId,
                    day.dayNumber,
                    day.title,
                    JSON.stringify(day.contentLinks || []),
                    day.meetingLink,
                    day.meetingStartTime,
                    JSON.stringify(day.tasks || {}),
                    day.examQuestions,
                    day.isCompleted || false
                ]);
            }
        }

        // إنشاء إعدادات التقييم
        await pool.query(`
            INSERT INTO course_rating_settings (
                course_id,
                attendance_weight,
                participation_weight,
                task_completion_weight,
                exam_weight,
                teaching_quality_weight,
                auto_calculate,
                created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        `, [
            courseId,
            20, // وزن الحضور
            20, // وزن المشاركة
            30, // وزن إنجاز المهام
            30, // وزن الامتحان
            20, // وزن جودة التدريس
            true // حساب تلقائي
        ]);

        await pool.query('COMMIT');

        // إرسال إشعارات للمستخدمين المؤهلين
        await notifyEligibleUsers(courseId, { grade1, grade2, grade3 });

        res.status(201).json({
            message: 'تم إنشاء الدورة بنجاح',
            courseId,
            course: {
                id: courseId,
                name,
                description,
                duration,
                startDate,
                status: 'draft'
            }
        });

    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Course creation error:', error);
        res.status(500).json({ 
            message: 'حدث خطأ في إنشاء الدورة',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// دالة إرسال الإشعارات للمستخدمين المؤهلين
async function notifyEligibleUsers(courseId, grades) {
    try {
        // الحصول على معلومات الدورة
        const courseResult = await pool.query(
            'SELECT name, description FROM courses WHERE id = $1',
            [courseId]
        );
        
        if (courseResult.rows.length === 0) return;
        
        const course = courseResult.rows[0];

        // تحديد المستخدمين المؤهلين لكل درجة
        const eligibleUsers = [];

        for (const [gradeKey, grade] of Object.entries(grades)) {
            if (grade && grade.categories) {
                for (const category of grade.categories) {
                    if (category.selected && category.count > 0) {
                        // تحديد الأدوار المطابقة لكل فئة
                        const roles = getCategoryRoles(category.name);
                        
                        if (roles.length > 0) {
                            const usersResult = await pool.query(`
                                SELECT id, full_name, email, role 
                                FROM users 
                                WHERE role = ANY($1) 
                                AND id NOT IN (
                                    SELECT user_id 
                                    FROM enrollments 
                                    WHERE course_id = $2
                                )
                                LIMIT $3
                            `, [roles, courseId, category.count * 2]); // ضعف العدد للاحتياط

                            eligibleUsers.push(...usersResult.rows.map(user => ({
                                ...user,
                                gradeLevel: gradeKey,
                                gradeTitle: grade.title,
                                categoryName: category.name
                            })));
                        }
                    }
                }
            }
        }

        // إرسال الإشعارات
        for (const user of eligibleUsers) {
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
                user.id,
                'دورة جديدة متاحة',
                `تم إتاحة دورة جديدة: ${course.name}. يمكنك التقديم عليها كـ ${user.gradeTitle} - ${user.categoryName}`,
                'course_available',
                `/courses/${courseId}`
            ]);
        }

    } catch (error) {
        console.error('Notification error:', error);
        // لا نرمي خطأ هنا لأن إنشاء الدورة نجح
    }
}

// دالة تحديد الأدوار المطابقة لكل فئة
function getCategoryRoles(categoryName) {
    const categoryMappings = {
        'طالب': ['student'],
        'عامل': ['worker'],
        'معلم': ['teacher'],
        'مدرب': ['teacher'],
        'رئيس قسم': ['head'],
        'مشرف': ['admin'],
        'رئيس قسم عليا': ['head'],
        'إدارة عليا': ['admin']
    };
    
    return categoryMappings[categoryName] || [];
}

// Tables already exist in schema.sql - removed duplicate creation to prevent conflicts
// If you need to modify table structure, use proper database migrations instead