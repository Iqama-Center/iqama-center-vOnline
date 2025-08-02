import React from 'react';

// Arabic labels for course detail fields
const arabicLabels = {
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
  
  // Additional common fields
  'description': 'الوصف',
  'instructor': 'المدرب',
  'teacher': 'المعلم',
  'teachers': 'المعلمون',
  'location': 'المكان'
};

// Arabic values for common field values
const arabicValues = {
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

const CourseDetailsDisplay = ({ details, className = '' }) => {
  if (!details || typeof details !== 'object') {
    return <span>لا توجد تفاصيل إضافية</span>;
  }

  const formatValue = (key, value) => {
    // Skip empty values
    if (value === null || value === undefined || value === '') {
      return null;
    }

    // Handle arrays
    if (Array.isArray(value)) {
      return value.map(v => arabicValues[v?.toLowerCase()] || v).join('، ');
    }

    // Handle booleans
    if (typeof value === 'boolean') {
      return value ? 'نعم' : 'لا';
    }

    // Handle numbers with special formatting
    if (typeof value === 'number') {
      if (key === 'cost' || key === 'price' || key === 'fee') {
        const currency = details.currency || 'ريال';
        const arabicCurrency = arabicValues[currency] || currency;
        return `${value} ${arabicCurrency}`;
      }
      return value.toString();
    }

    // Handle strings
    if (typeof value === 'string') {
      return arabicValues[value.toLowerCase()] || value;
    }

    // Handle objects
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  };

  const getArabicLabel = (key) => {
    return arabicLabels[key] || key;
  };

  const detailItems = Object.entries(details)
    .filter(([key, value]) => {
      // Skip internal/technical fields
      if (['id', 'created_at', 'updated_at', 'internal_notes'].includes(key)) {
        return false;
      }
      // Skip empty values
      return value !== null && value !== undefined && value !== '';
    })
    .map(([key, value]) => {
      const formattedValue = formatValue(key, value);
      if (formattedValue === null) return null;

      return (
        <div key={key} className="detail-item">
          <span className="detail-label">{getArabicLabel(key)}:</span>
          <span className="detail-value">{formattedValue}</span>
        </div>
      );
    })
    .filter(Boolean);

  if (detailItems.length === 0) {
    return <span>لا توجد تفاصيل إضافية</span>;
  }

  return (
    <div className={`course-details-display ${className}`}>
      {detailItems}
    </div>
  );
};

export default CourseDetailsDisplay;