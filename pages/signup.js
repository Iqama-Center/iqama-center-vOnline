import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { countries, validatePhoneNumber } from '../lib/countryData';
import { validateEmail } from '../lib/validation';

// Helper to convert object keys to snake_case
const toSnakeCase = (obj) => {
  if (typeof obj !== 'object' || obj === null) return obj;
  return Object.keys(obj).reduce((acc, key) => {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    acc[snakeKey] = obj[key];
    return acc;
  }, {});
};

export default function SignupPage() {
  const [formData, setFormData] = useState({
    role: 'student',
    fullName: '',
    email: '',
    countryCode: '+966',
    phone: '',
    password: '',
    confirmPassword: '',
    gender: 'male',
    birthDate: '',
    nationality: '',
    country: '',
    preferredLanguage: 'ar',
    languages: '',
    parentContactOptional: '',
    workerSpecializations: [],
    agreeTerms: false
  });
  
  const workerSpecializations = [
    'معلم', 'مدرب', 'مشرف حلقة', 'مسؤول بيانات الطلاب', 'مسؤول بيانات العاملين',
    'مصمم تسويقي', 'مصمم كتاب علمي', 'منتج علمي', 'باحث علمي', 'مدير مالي',
    'مدير اقتصادي', 'دعم المكتبة', 'خدمة عملاء', 'مبرمج', 'رئيس قسم', 'إدارة عليا'
  ];

  const getNationalityFromCountry = (countryName) => {
    const nationalityMap = {
      'السعودية': 'سعودي',
      'مصر': 'مصري',
      'الإمارات': 'إماراتي',
      'الكويت': 'كويتي',
      'قطر': 'قطري',
      'البحرين': 'بحريني',
      'عمان': 'عماني',
      'الأردن': 'أردني',
      'لبنان': 'لبناني',
      'سوريا': 'سوري',
      'العراق': 'عراقي',
      'فلسطين': 'فلسطيني',
      'المغرب': 'مغربي',
      'الجزائر': 'جزائري',
      'تونس': 'تونسي',
      'ليبيا': 'ليبي',
      'السودان': 'سوداني',
      'اليمن': 'يمني',
      'الصومال': 'صومالي',
      'جيبوتي': 'جيبوتي',
      'موريتانيا': 'موريتاني',
      'الولايات المتحدة': 'أمريكي',
      'كندا': 'كندي',
      'المملكة المتحدة': 'بريطاني',
      'فرنسا': 'فرنسي',
      'ألمانيا': 'ألماني',
      'إيطاليا': 'إيطالي',
      'إسبانيا': 'إسباني',
      'هولندا': 'هولندي',
      'بلجيكا': 'بلجيكي',
      'سويسرا': 'سويسري',
      'النمسا': 'نمساوي',
      'السويد': 'سويدي',
      'النرويج': 'نرويجي',
      'الدنمارك': 'دنماركي',
      'فنلندا': 'فنلندي',
      'بولندا': 'بولندي',
      'التشيك': 'تشيكي',
      'المجر': 'مجري',
      'رومانيا': 'روماني',
      'بلغاريا': 'بلغاري',
      'اليونان': 'يوناني',
      'تركيا': 'تركي',
      'روسيا': 'روسي',
      'أوكرانيا': 'أوكراني',
      'الصين': 'صيني',
      'اليابان': 'ياباني',
      'كوريا الجنوبية': 'كوري',
      'الهند': 'هندي',
      'باكستان': 'باكستاني',
      'بنغلاديش': 'بنغلاديشي',
      'سريلانكا': 'سريلانكي',
      'تايلاند': 'تايلاندي',
      'فيتنام': 'فيتنامي',
      'الفلبين': 'فلبيني',
      'ماليزيا': 'ماليزي',
      'سنغافورة': 'سنغافوري',
      'إندونيسيا': 'إندونيسي',
      'أستراليا': 'أسترالي',
      'نيوزيلندا': 'نيوزيلندي',
      'جنوب أفريقيا': 'جنوب أفريقي',
      'نيجيريا': 'نيجيري',
      'كينيا': 'كيني',
      'إثيوبيا': 'إثيوبي',
      'غانا': 'غاني',
      'البرازيل': 'برازيلي',
      'الأرجنتين': 'أرجنتيني',
      'تشيلي': 'تشيلي',
      'كولومبيا': 'كولومبي',
      'المكسيك': 'مكسيكي',
      'إيران': 'إيراني',
      'أفغانستان': 'أفغاني',
      'إسرائيل': 'إسرائيلي'
    };
    return nationalityMap[countryName] || countryName + 'ي';
  };

  const nationalities = countries.map(country => ({
    code: country.code,
    name: getNationalityFromCountry(country.name),
    originalCountry: country.name
  }));
  const [message, setMessage] = useState(null);
  const [isError, setIsError] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detectedCountry, setDetectedCountry] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const detectCountry = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        
        if (data.country_code) {
          const foundCountry = countries.find(c => c.code === data.country_code.toUpperCase());
          if (foundCountry) {
            setDetectedCountry(foundCountry);
            const nationality = getNationalityFromCountry(foundCountry.name);
            setFormData(prev => ({
              ...prev,
              countryCode: foundCountry.dialCode,
              country: foundCountry.name,
              nationality: nationality
            }));
          }
        }
      } catch (error) {
        console.log('Could not detect country, using default');
      }
    };

    detectCountry();
  }, []);

  const handleFieldBlur = (e) => {
    const { name, value } = e.target;
    
    if (name === 'confirmPassword' && value) {
      const passwordError = value !== formData.password ? 'كلمات المرور غير متطابقة' : null;
      setFieldErrors(prev => ({ ...prev, confirmPassword: passwordError }));
    }
    
    if (name === 'password' && formData.confirmPassword) {
      const passwordError = formData.confirmPassword !== value ? 'كلمات المرور غير متطابقة' : null;
      setFieldErrors(prev => ({ ...prev, confirmPassword: passwordError }));
    }
    
    if (name === 'email' && value) {
      const emailError = validateEmail(value);
      setFieldErrors(prev => ({ ...prev, email: emailError }));
    }
    
    if (name === 'phone' && value) {
      const selectedCountry = countries.find(c => c.dialCode === formData.countryCode);
      const phoneError = validatePhoneNumber(value, selectedCountry?.code || 'SA');
      setFieldErrors(prev => ({ ...prev, phone: phoneError }));
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: null }));
    }
    
    if (type === 'checkbox' && name === 'workerSpecializations') {
      setFormData((prev) => ({
        ...prev,
        workerSpecializations: checked
          ? [...prev.workerSpecializations, value]
          : prev.workerSpecializations.filter(spec => spec !== value)
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const isParentContactRequired = () => {
    if (formData.role === 'student' && formData.birthDate) {
      const age = calculateAge(formData.birthDate);
      return age < 10;
    }
    return false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setIsError(false);
    setFieldErrors({});
    setIsSubmitting(true);

    // --- Start Validation ---
    const emailError = validateEmail(formData.email);
    if (emailError) {
      setMessage(emailError);
      setIsError(true);
      setIsSubmitting(false);
      return;
    }

    const selectedCountry = countries.find(c => c.dialCode === formData.countryCode);
    const phoneError = validatePhoneNumber(formData.phone, selectedCountry?.code || 'SA');
    if (phoneError) {
      setMessage(phoneError);
      setIsError(true);
      setIsSubmitting(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage('كلمات المرور غير متطابقة');
      setIsError(true);
      setIsSubmitting(false);
      return;
    }

    if (!formData.agreeTerms) {
      setMessage('يجب الموافقة على الشروط والأحكام');
      setIsError(true);
      setIsSubmitting(false);
      return;
    }

    if (isParentContactRequired() && !formData.parentContactOptional.trim()) {
      setMessage('بريد ولي الأمر مطلوب للطلاب تحت سن 10 سنوات');
      setIsError(true);
      setIsSubmitting(false);
      return;
    }

    if (formData.parentContactOptional.trim()) {
      const parentEmailError = validateEmail(formData.parentContactOptional.trim());
      if (parentEmailError) {
        setMessage('بريد ولي الأمر غير صحيح: ' + parentEmailError);
        setIsError(true);
        setIsSubmitting(false);
        return;
      }
    }
    // --- End Validation ---

    // Destructure and prepare data for API, converting to snake_case
    const { 
        fullName, 
        email, 
        countryCode, 
        phone, 
        password, 
        role, 
        confirmPassword, // Exclude from details
        agreeTerms,      // Exclude from details
        ...detailsInCamel 
    } = formData;

    const fullPhoneNumber = countryCode + phone;

    // Convert language list to array
    if (detailsInCamel.languages) {
        detailsInCamel.languages = detailsInCamel.languages.split(',').map(s => s.trim());
    }

    const data = {
        full_name: fullName,
        email,
        phone: fullPhoneNumber,
        password,
        role,
        details: toSnakeCase(detailsInCamel)
    };

    try {
      const response = await fetch('/api/auth/register-simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      setMessage(result.message);
      
      if (response.ok) {
        setIsError(false);
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setIsError(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      
    } catch (err) {
      console.error('Registration error:', err);
      setMessage(`خطأ في التسجيل: ${err.message || 'لا يمكن الاتصال بالخادم'}`);
      setIsError(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>إنشاء حساب جديد</title>
      </Head>
      <div className="form-page-container">
        <div className="form-container">
          <h2>إنشاء حساب جديد</h2>
          {message && (
            <div className={`message ${isError ? 'error' : 'success'}`}>
              {message}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group full-width">
                <label htmlFor="role">أنا أسجل كـ:</label>
                <select id="role" name="role" value={formData.role} onChange={handleChange} required>
                  <option value="student">طالب</option>
                  <option value="parent">ولي أمر</option>
                  <option value="worker">عامل/موظف</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="fullName">الاسم رباعي *</label>
                <input type="text" id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="الاسم الأول الثاني الثالث الرابع" required />
              </div>
              
              <div className="form-group">
                <label htmlFor="gender">الجنس *</label>
                <select id="gender" name="gender" value={formData.gender} onChange={handleChange} required>
                  <option value="male">ذكر</option>
                  <option value="female">أنثى</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="birthDate">تاريخ الميلاد *</label>
                <input type="date" id="birthDate" name="birthDate" value={formData.birthDate} onChange={handleChange} required />
              </div>
              
              <div className="form-group">
                <label htmlFor="phone">رقم الهاتف *</label>
                <div className={`phone-input-container ${fieldErrors.phone ? 'error' : ''}`}>
                  <select name="countryCode" value={formData.countryCode} onChange={handleChange} className="country-code-select" title="اختر رمز الدولة">
                    {countries.map(country => (
                      <option key={country.code} value={country.dialCode}>{country.flag} {country.dialCode}</option>
                    ))}
                  </select>
                  <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} onBlur={handleFieldBlur} placeholder="xxxxxxxxx" pattern="[0-9]{7,15}" title="رقم الهاتف بدون رمز الدولة" className="phone-number-input" required />
                </div>
                {detectedCountry && (
                  <div className="detected-country-info">
                    <small>تم اكتشاف موقعك: {detectedCountry.flag} {detectedCountry.name}</small>
                  </div>
                )}
                {fieldErrors.phone && (
                  <div className="field-error">{fieldErrors.phone}</div>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="email">البريد الإلكتروني *</label>
                <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} onBlur={handleFieldBlur} placeholder="example@gmail.com" pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$" title="يرجى إدخال بريد إلكتروني صحيح" className={fieldErrors.email ? 'error' : ''} required />
                {fieldErrors.email && (
                  <div className="field-error">{fieldErrors.email}</div>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="password">كلمة السر *</label>
                <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} onBlur={handleFieldBlur} placeholder="أدخل كلمة السر" required />
              </div>
              
              <div className="form-group">
                <label htmlFor="confirmPassword">تأكيد كلمة السر *</label>
                <input type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} onBlur={handleFieldBlur} placeholder="أعد كتابة كلمة السر" className={fieldErrors.confirmPassword ? 'error' : ''} required />
                {fieldErrors.confirmPassword && (
                  <div className="field-error">{fieldErrors.confirmPassword}</div>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="nationality">الجنسية *</label>
                <select id="nationality" name="nationality" value={formData.nationality} onChange={handleChange} required>
                  <option value="">اختر الجنسية</option>
                  {nationalities.map((nat) => (
                    <option key={`nationality-${nat.code}`} value={nat.name}>{nat.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="country">دولة الإقامة *</label>
                <select id="country" name="country" value={formData.country} onChange={handleChange} required>
                  <option value="">اختر دولة الإقامة</option>
                  {countries.map((country) => (
                    <option key={`residence-${country.code}`} value={country.name}>{country.flag} {country.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="preferredLanguage">اللغة المفضلة *</label>
                <select id="preferredLanguage" name="preferredLanguage" value={formData.preferredLanguage} onChange={handleChange} required>
                  <option value="ar">عربي</option>
                  <option value="en">English</option>
                </select>
              </div>
              
              {formData.role !== 'student' && (
                <div className="form-group full-width">
                  <label htmlFor="languages">اللغات التي تتقنها (افصل بينها بفاصلة)</label>
                  <input type="text" id="languages" name="languages" value={formData.languages} onChange={handleChange} placeholder="العربية, الإنجليزية, الفرنسية" />
                </div>
              )}
              
              {formData.role === 'student' && (
                <div className="form-group full-width">
                  <label htmlFor="parentContactOptional">
                    بريد ولي الأمر {isParentContactRequired() ? '(مطلوب)' : '(اختياري)'}
                  </label>
                  <input type="email" id="parentContactOptional" name="parentContactOptional" value={formData.parentContactOptional} onChange={handleChange} placeholder={isParentContactRequired() ? "بريد ولي الأمر" : "بريد ولي الأمر (اختياري)"} title="يرجى إدخال بريد إلكتروني" required={isParentContactRequired()} />
                </div>
              )}

              {formData.role === 'parent' && (
                <div className="form-group full-width">
                  <div className="info-box">
                    <i className="fas fa-info-circle"></i>
                    <p>يمكنك إضافة حسابات للأطفال بعد التسجيل من خلال لوحة التحكم الخاصة بك.</p>
                  </div>
                </div>
              )}

              {formData.role === 'worker' && (
                <div className="form-group full-width">
                  <label>التخصصات المفضلة (اختياري - يمكن تغييرها لاحقاً)</label>
                  <div className="info-text">
                    <small>هذه فقط كرغبات لكن لن يتم اعتماد شيء إلا بعد اكتمال التدريب وتأكيد المدرب على التخصص الأنسب.</small>
                  </div>
                  <div className="specializations-grid">
                    {workerSpecializations.map(spec => (
                      <label key={spec} className="checkbox-label">
                        <input type="checkbox" name="workerSpecializations" value={spec} checked={formData.workerSpecializations.includes(spec)} onChange={handleChange} />
                        <span>{spec}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="form-group full-width">
                <div className="checkbox-group">
                  <input type="checkbox" id="agreeTerms" name="agreeTerms" checked={formData.agreeTerms} onChange={(e) => setFormData(prev => ({...prev, agreeTerms: e.target.checked}))} required />
                  <label htmlFor="agreeTerms">
                    أوافق على <a href="/terms" target="_blank">الشروط والأحكام</a> و
                    <a href="/privacy" target="_blank">سياسة الخصوصية</a> *
                  </label>
                </div>
              </div>
            </div>
            
            <button type="submit" className="submit-btn" disabled={isSubmitting || Object.values(fieldErrors).some(error => error)}>
              {isSubmitting ? (
                <>
                  <span className="spinner-small"></span>
                  جاري إنشاء الحساب...
                </>
              ) : (
                'إنشاء الحساب'
              )}
            </button>
          </form>
           <p className="form-link">
            لديك حساب بالفعل؟ <Link href="/login">تسجيل الدخول</Link>
          </p>
          <p className="form-link">
            <Link href="/">العودة للصفحة الرئيسية</Link>
          </p>
        </div>
      </div>
      <style jsx>{`
        /* Styles remain the same */
        .form-page-container {
          font-family: 'Tajawal', sans-serif;
          background-color: #f4f4f4;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          padding: 20px 0;
        }
        .form-container {
          background: white;
          padding: 40px;
          width: 100%;
          max-width: 600px;
          border-radius: 8px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }
        h2 {
          text-align: center;
          margin-bottom: 30px;
          color: #0056b3;
        }
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }
        .form-group {
          margin-bottom: 15px;
        }
        .full-width {
          grid-column: 1 / -1;
        }
        label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
        }
        input,
        select,
        textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 5px;
          font-size: 1rem;
        }
        button {
          width: 100%;
          padding: 15px;
          font-size: 1.1rem;
          cursor: pointer;
          border: none;
          border-radius: 5px;
          background-color: #28a745;
          color: white;
        }
        .message {
          text-align: center;
          padding: 10px;
          margin-bottom: 15px;
          border-radius: 5px;
        }
        .message.error {
          color: #721c24;
          background-color: #f8d7da;
          border: 1px solid #f5c6cb;
        }
        .message.success {
          color: #155724;
          background-color: #d4edda;
          border: 1px solid #c3e6cb;
        }
        .form-link {
          text-align: center;
          margin-top: 20px;
        }
        
        .info-box {
          background: #e3f2fd;
          border: 1px solid #2196f3;
          border-radius: 5px;
          padding: 15px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .info-box i {
          color: #2196f3;
          font-size: 1.2rem;
        }
        
        .info-box p {
          margin: 0;
          color: #1976d2;
        }
        
        .info-text {
          margin-bottom: 10px;
        }
        
        .info-text small {
          color: #666;
          font-style: italic;
        }
        
        .specializations-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 10px;
          margin-top: 10px;
        }
        
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 5px;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        .checkbox-label:hover {
          background-color: #f8f9fa;
        }
        
        .checkbox-label input[type="checkbox"] {
          width: auto;
          margin: 0;
        }
        
        .checkbox-label span {
          font-size: 0.9rem;
        }
        
        .checkbox-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .checkbox-group input[type="checkbox"] {
          width: auto;
          margin: 0;
          flex-shrink: 0;
        }
        
        .checkbox-group label {
          margin: 0;
          cursor: pointer;
          line-height: 1.4;
        }
        
        .field-error {
          color: #dc3545;
          font-size: 0.875rem;
          margin-top: 0.25rem;
        }
        
        input.error,
        select.error,
        textarea.error {
          border-color: #dc3545;
        }
        
        .spinner-small {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid #ffffff;
          border-radius: 50%;
          border-top-color: transparent;
          animation: spin 1s ease-in-out infinite;
          margin-right: 8px;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .phone-input-container {
          display: flex;
        }
        
        .country-code-select {
          border-left: 1px solid #ccc;
          border-radius: 0 5px 5px 0;
        }
        
        .phone-number-input {
          border-radius: 5px 0 0 5px;
        }
        
        .detected-country-info {
          margin-top: 5px;
          color: #28a745;
          font-size: 0.875rem;
        }

        @media (max-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}