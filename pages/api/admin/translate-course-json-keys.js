import pool from '../../../lib/db';
import jwt from 'jsonwebtoken';

// Translation mapping for JSON keys from English to Arabic
const keyTranslations = {
  // Financial fields
  'cost': 'التكلفة',
  'price': 'السعر',
  'currency': 'العملة',
  'fee': 'الرسوم',
  'payment_method': 'طريقة_الدفع',
  
  // Capacity fields
  'max_seats': 'الحد_الأقصى_للمقاعد',
  'min_seats': 'الحد_الأدنى_للمقاعد',
  'capacity': 'السعة',
  'enrollment_limit': 'حد_التسجيل',
  
  // Course details
  'category': 'الفئة',
  'level': 'المستوى',
  'duration': 'المدة',
  'duration_weeks': 'مدة_بالأسابيع',
  'duration_days': 'مدة_بالأيام',
  'duration_hours': 'مدة_بالساعات',
  
  // Target audience
  'target_roles': 'الأدوار_المستهدفة',
  'target_audience': 'الجمهور_المستهدف',
  'gender': 'الجنس',
  'age_group': 'الفئة_العمرية',
  'min_age': 'الحد_الأدنى_للعمر',
  'max_age': 'الحد_الأقصى_للعمر',
  
  // Course type and format
  'course_type': 'نوع_الدورة',
  'format': 'التنسيق',
  'delivery_method': 'طريقة_التقديم',
  'language': 'اللغة',
  
  // Requirements
  'prerequisites': 'المتطلبات_المسبقة',
  'requirements': 'المتطلبات',
  'materials_needed': 'المواد_المطلوبة',
  
  // Schedule and timing
  'schedule': 'الجدول',
  'meeting_time': 'وقت_الاجتماع',
  'timezone': 'المنطقة_الزمنية',
  'days_per_week': 'أيام_في_الأسبوع',
  'hours_per_day': 'ساعات_في_اليوم',
  
  // Links and resources
  'meeting_link': 'رابط_الاجتماع',
  'content_url': 'رابط_المحتوى',
  'resource_links': 'روابط_المصادر',
  'first_day_content': 'محتوى_اليوم_الأول',
  
  // Instructor details
  'instructor': 'المدرب',
  'teacher': 'المعلم',
  'instructor_bio': 'نبذة_عن_المدرب',
  'teacher_experience': 'خبرة_المعلم',
  
  // Certification
  'certificate': 'الشهادة',
  'certification_type': 'نوع_الشهادة',
  'certificate_requirements': 'متطلبات_الشهادة',
  
  // Additional fields
  'description': 'الوصف',
  'objectives': 'الأهداف',
  'outcomes': 'النتائج',
  'assessment_method': 'طريقة_التقييم',
  'difficulty': 'الصعوبة',
  'tags': 'العلامات',
  'keywords': 'الكلمات_المفتاحية'
};

function translateJsonKeys(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(translateJsonKeys);
  }
  
  const translatedObj = {};
  for (const [key, value] of Object.entries(obj)) {
    const translatedKey = keyTranslations[key] || key;
    translatedObj[translatedKey] = translateJsonKeys(value);
  }
  
  return translatedObj;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'الطريقة غير مسموحة' });
  }

  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: 'غير مصرح بالدخول' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!['admin'].includes(decoded.role)) {
      return res.status(403).json({ message: 'غير مخول' });
    }

    const { action } = req.body;

    if (action === 'check') {
      // Check courses with English JSON keys
      const result = await pool.query(`
        SELECT id, name, details 
        FROM courses 
        WHERE details IS NOT NULL 
        ORDER BY id
        LIMIT 50
      `);

      const coursesWithEnglishKeys = result.rows.filter(course => {
        if (!course.details || typeof course.details !== 'object') return false;
        
        const keys = Object.keys(course.details);
        return keys.some(key => /^[a-zA-Z_]+$/.test(key) && keyTranslations[key]);
      });

      return res.status(200).json({
        message: `تم العثور على ${coursesWithEnglishKeys.length} دورة تحتوي على مفاتيح JSON إنجليزية`,
        totalCourses: result.rows.length,
        coursesWithEnglishKeys: coursesWithEnglishKeys.length,
        courses: coursesWithEnglishKeys.slice(0, 10) // Show first 10 for preview
      });

    } else if (action === 'translate') {
      // Translate JSON keys for all courses
      const result = await pool.query(`
        SELECT id, name, details 
        FROM courses 
        WHERE details IS NOT NULL 
        ORDER BY id
      `);

      let translatedCount = 0;
      const translationLog = [];

      for (const course of result.rows) {
        if (!course.details || typeof course.details !== 'object') continue;
        
        const originalKeys = Object.keys(course.details);
        const hasEnglishKeys = originalKeys.some(key => 
          /^[a-zA-Z_]+$/.test(key) && keyTranslations[key]
        );
        
        if (hasEnglishKeys) {
          const translatedDetails = translateJsonKeys(course.details);
          
          await pool.query(
            'UPDATE courses SET details = $1 WHERE id = $2',
            [JSON.stringify(translatedDetails), course.id]
          );
          
          translatedCount++;
          translationLog.push({
            id: course.id,
            name: course.name,
            originalKeys: originalKeys.filter(key => keyTranslations[key]),
            translatedKeys: originalKeys.filter(key => keyTranslations[key]).map(key => keyTranslations[key])
          });
        }
      }

      return res.status(200).json({
        message: `تم ترجمة مفاتيح JSON في ${translatedCount} دورة بنجاح`,
        translatedCount,
        translationLog: translationLog.slice(0, 20) // Show first 20 for review
      });

    } else if (action === 'preview') {
      // Preview what the translation would look like
      const { courseId } = req.body;
      
      const result = await pool.query(
        'SELECT id, name, details FROM courses WHERE id = $1',
        [courseId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'الدورة غير موجودة' });
      }
      
      const course = result.rows[0];
      const originalDetails = course.details;
      const translatedDetails = translateJsonKeys(course.details);
      
      return res.status(200).json({
        courseId: course.id,
        courseName: course.name,
        original: originalDetails,
        translated: translatedDetails,
        keyMappings: Object.keys(originalDetails || {})
          .filter(key => keyTranslations[key])
          .reduce((acc, key) => {
            acc[key] = keyTranslations[key];
            return acc;
          }, {})
      });

    } else {
      return res.status(400).json({ message: 'إجراء غير صحيح' });
    }

  } catch (err) {
    console.error('Translation error:', err);
    return res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
}