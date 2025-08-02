// Course details translator for UI display
export const courseDetailsLabels = {
  // Financial fields
  'cost': 'التكلفة',
  'price': 'السعر',
  'currency': 'العملة',
  'fee': 'الرسوم',
  'payment_method': 'طريقة الدفع',
  
  // Capacity fields
  'max_seats': 'الحد الأقصى للمقاعد',
  'min_seats': 'الحد الأدنى للمقاعد',
  'capacity': 'السعة',
  'enrollment_limit': 'حد التسجيل',
  
  // Course details
  'category': 'الفئة',
  'level': 'المستوى',
  'duration': 'المدة',
  'duration_weeks': 'المدة بالأسابيع',
  'duration_days': 'المدة بالأيام',
  'duration_hours': 'المدة بالساعات',
  
  // Target audience
  'target_roles': 'الأدوار المستهدفة',
  'target_audience': 'الجمهور المستهدف',
  'gender': 'الجنس',
  'age_group': 'الفئة العمرية',
  'min_age': 'الحد الأدنى للعمر',
  'max_age': 'الحد الأقصى للعمر',
  
  // Course type and format
  'course_type': 'نوع الدورة',
  'format': 'التنسيق',
  'delivery_method': 'طريقة التقديم',
  'language': 'اللغة',
  
  // Requirements
  'prerequisites': 'المتطلبات المسبقة',
  'requirements': 'المتطلبات',
  'materials_needed': 'المواد المطلوبة',
  
  // Schedule and timing
  'schedule': 'الجدول',
  'meeting_time': 'وقت الاجتماع',
  'timezone': 'المنطقة الزمنية',
  'days_per_week': 'أيام في الأسبوع',
  'hours_per_day': 'ساعات في اليوم',
  
  // Links and resources
  'meeting_link': 'رابط الاجتماع',
  'content_url': 'رابط المحتوى',
  'resource_links': 'روابط المصادر',
  'first_day_content': 'محتوى اليوم الأول',
  
  // Instructor details
  'instructor': 'المدرب',
  'teacher': 'المعلم',
  'teachers': 'المعلمون',
  'instructor_bio': 'نبذة عن المدرب',
  'teacher_experience': 'خبرة المعلم',
  
  // Certification
  'certificate': 'الشهادة',
  'certification_type': 'نوع الشهادة',
  'certificate_requirements': 'متطلبات الشهادة',
  
  // Additional fields
  'description': 'الوصف',
  'objectives': 'الأهداف',
  'outcomes': 'النتائج',
  'assessment_method': 'طريقة التقييم',
  'difficulty': 'الصعوبة',
  'tags': 'العلامات',
  'keywords': 'الكلمات المفتاحية'
};

// Value translations for common values
export const courseDetailsValues = {
  // Currency
  'USD': 'دولار أمريكي',
  'SAR': 'ريال سعودي',
  'EGP': 'جنيه مصري',
  'EUR': 'يورو',
  
  // Gender
  'male': 'ذكور',
  'female': 'إناث',
  'both': 'مختلط',
  
  // Levels
  'beginner': 'مبتدئ',
  'intermediate': 'متوسط',
  'advanced': 'متقدم',
  'all': 'جميع المستويات',
  
  // Course types
  'online': 'عبر الإنترنت',
  'offline': 'حضوري',
  'hybrid': 'مختلط',
  
  // Target roles
  'student': 'طالب',
  'teacher': 'معلم',
  'worker': 'عامل',
  'parent': 'ولي أمر',
  'admin': 'مدير'
};

// Function to get Arabic label for a key
export function getArabicLabel(key) {
  return courseDetailsLabels[key] || key;
}

// Function to get Arabic value for a value
export function getArabicValue(value) {
  if (typeof value === 'string') {
    return courseDetailsValues[value.toLowerCase()] || value;
  }
  return value;
}

// Function to format course details for display
export function formatCourseDetailsForDisplay(details) {
  if (!details || typeof details !== 'object') {
    return [];
  }

  const formattedDetails = [];
  
  for (const [key, value] of Object.entries(details)) {
    // Skip internal/technical fields
    if (['id', 'created_at', 'updated_at', 'internal_notes'].includes(key)) {
      continue;
    }
    
    // Skip empty values
    if (value === null || value === undefined || value === '') {
      continue;
    }
    
    const arabicLabel = getArabicLabel(key);
    let displayValue = value;
    
    // Format different types of values
    if (Array.isArray(value)) {
      displayValue = value.map(v => getArabicValue(v)).join('، ');
    } else if (typeof value === 'boolean') {
      displayValue = value ? 'نعم' : 'لا';
    } else if (typeof value === 'number') {
      // Format currency
      if (key === 'cost' || key === 'price' || key === 'fee') {
        const currency = details.currency || 'ريال';
        const arabicCurrency = getArabicValue(currency);
        displayValue = `${value} ${arabicCurrency}`;
      } else {
        displayValue = value.toString();
      }
    } else {
      displayValue = getArabicValue(value);
    }
    
    formattedDetails.push({
      key,
      label: arabicLabel,
      value: displayValue,
      originalValue: value
    });
  }
  
  return formattedDetails;
}