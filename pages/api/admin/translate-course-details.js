import pool from '../../../lib/db';
import jwt from 'jsonwebtoken';

const translations = {
  // Categories
  'Religious Education': 'تعليم ديني',
  'Languages': 'لغات',
  'Islamic Studies': 'علوم شرعية',
  'Quran Studies': 'دراسات قرآنية',
  'Arabic Language': 'اللغة العربية',
  'Islamic Law': 'الفقه الإسلامي',
  'Hadith Studies': 'علوم الحديث',
  'Islamic History': 'التاريخ الإسلامي',
  'General': 'عام',
  
  // Levels
  'Beginner': 'مبتدئ',
  'Intermediate': 'متوسط',
  'Advanced': 'متقدم',
  'Beginner to Advanced': 'مبتدئ إلى متقدم',
  'All Levels': 'جميع المستويات',
  
  // Currency
  'USD': 'دولار أمريكي',
  'SAR': 'ريال سعودي',
  'EGP': 'جنيه مصري',
  'EUR': 'يورو',
  
  // Gender
  'male': 'ذكور',
  'female': 'إناث',
  'both': 'مختلط',
  
  // Target roles
  'student': 'طالب',
  'teacher': 'معلم',
  'worker': 'عامل',
  'parent': 'ولي أمر',
  'students': 'طلاب',
  'teachers': 'معلمين',
  'workers': 'عمال',
  'parents': 'أولياء أمور'
};

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
      // Check courses with English content
      const result = await pool.query(`
        SELECT id, name, details 
        FROM courses 
        WHERE details::text ~ '[A-Za-z]' 
        ORDER BY id
        LIMIT 20
      `);

      return res.status(200).json({
        message: `تم العثور على ${result.rows.length} دورة تحتوي على محتوى إنجليزي`,
        courses: result.rows
      });

    } else if (action === 'translate') {
      // Translate course details
      const result = await pool.query(`
        SELECT id, name, details 
        FROM courses 
        WHERE details::text ~ '[A-Za-z]' 
        ORDER BY id
      `);

      let translatedCount = 0;
      const translationLog = [];

      for (const course of result.rows) {
        let updatedDetails = { ...course.details };
        let hasChanges = false;
        const courseLog = {
          id: course.id,
          name: course.name,
          changes: []
        };

        // Translate each field
        for (const [key, value] of Object.entries(updatedDetails)) {
          if (typeof value === 'string' && translations[value]) {
            updatedDetails[key] = translations[value];
            hasChanges = true;
            courseLog.changes.push({
              field: key,
              from: value,
              to: translations[value]
            });
          }
        }

        // Update the database if there are changes
        if (hasChanges) {
          await pool.query(
            'UPDATE courses SET details = $1 WHERE id = $2',
            [JSON.stringify(updatedDetails), course.id]
          );
          translatedCount++;
          translationLog.push(courseLog);
        }
      }

      return res.status(200).json({
        message: `تم ترجمة ${translatedCount} دورة بنجاح`,
        translatedCount,
        translationLog
      });

    } else {
      return res.status(400).json({ message: 'إجراء غير صحيح' });
    }

  } catch (err) {
    console.error('Translation error:', err);
    return res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
}