import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import pool from '../../lib/db';
import { withAuth } from '../../lib/withAuth';
import { useRouter } from 'next/router';

const EditUserModal = ({ user, isOpen, onClose, onSave, onPromote }) => {
    const [formData, setFormData] = useState(user);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [promoteRole, setPromoteRole] = useState('student');
    const [newFieldKey, setNewFieldKey] = useState('');
    const [newFieldValue, setNewFieldValue] = useState('');

    useEffect(() => {
        setFormData(user || {});
    }, [user]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDetailsChange = (e) => {
        setFormData(prev => ({ ...prev, details: e.target.value }));
    };

    const handleDetailFieldChange = (key, value) => {
        setFormData(prev => ({
            ...prev,
            details: {
                ...prev.details,
                [key]: value
            }
        }));
    };

    // Function to translate common English field names to Arabic
    const translateFieldName = (key) => {
        const translations = {
            'name': 'الاسم',
            'age': 'العمر',
            'address': 'العنوان',
            'city': 'المدينة',
            'country': 'البلد',
            'gender': 'الجنس',
            'birth_date': 'تاريخ الميلاد',
            'nationality': 'الجنسية',
            'education': 'التعليم',
            'experience': 'الخبرة',
            'skills': 'المهارات',
            'notes': 'ملاحظات',
            'status': 'الحالة',
            'department': 'القسم',
            'position': 'المنصب',
            'salary': 'الراتب',
            'start_date': 'تاريخ البداية',
            'end_date': 'تاريخ النهاية',
            'phone_number': 'رقم الهاتف',
            'emergency_contact': 'جهة الاتصال الطارئة',
            'medical_info': 'المعلومات الطبية',
            'allergies': 'الحساسية',
            'blood_type': 'فصيلة الدم',
            'id_number': 'رقم الهوية',
            'passport_number': 'رقم جواز السفر',
            'visa_status': 'حالة التأشيرة',
            'marital_status': 'الحالة الاجتماعية',
            'children_count': 'عدد الأطفال',
            'language': 'اللغة',
            'languages': 'اللغات',
            'othercountryname': 'اسم البلد الآخر',
            'fatherperspective': 'رؤية الأب',
            'motherperspective': 'رؤية الأم',
            'preferredlanguage': 'اللغة المفضلة',
            'registration_date': 'تاريخ التسجيل',
            'father_perspective': 'رؤية الأب',
            'mother_perspective': 'رؤية الأم',
            'registration_status': 'حالة التسجيل',
            'parentcontactoptional': 'جهة اتصال ولي الأمر (اختياري)',
            'workerspecializations': 'تخصصات العامل',
            'parent_contact_optional': 'جهة اتصال ولي الأمر (اختياري)',
            'religion': 'الديانة',
            'specialization': 'التخصص',
            'grade': 'الدرجة',
            'class': 'الفصل',
            'level': 'المستوى',
            'course': 'المقرر',
            'subject': 'المادة',
            'teacher': 'المعلم',
            'student': 'الطالب',
            'parent': 'ولي الأمر',
            'guardian': 'الوصي',
            'relationship': 'صلة القرابة',
            'occupation': 'المهنة',
            'company': 'الشركة',
            'work_address': 'عنوان العمل',
            'work_phone': 'هاتف العمل',
            'email_address': 'عنوان البريد الإلكتروني',
            'social_media': 'وسائل التواصل الاجتماعي',
            'facebook': 'فيسبوك',
            'twitter': 'تويتر',
            'instagram': 'إنستغرام',
            'linkedin': 'لينكد إن',
            'whatsapp': 'واتساب',
            'telegram': 'تليغرام',
            'created_at': 'تاريخ الإنشاء',
            'updated_at': 'تاريخ التحديث',
            'last_login': 'آخر تسجيل دخول',
            'is_active': 'نشط',
            'is_verified': 'مُتحقق منه',
            'permissions': 'الصلاحيات',
            'role_description': 'وصف الدور',
            'comments': 'التعليقات',
            'rating': 'التقييم',
            'score': 'النتيجة',
            'attendance': 'الحضور',
            'absence': 'الغياب',
            'late': 'التأخير',
            'early_leave': 'المغادرة المبكرة',
            'vacation_days': 'أيام الإجازة',
            'sick_days': 'أيام المرض',
            'overtime': 'العمل الإضافي',
            'bonus': 'المكافأة',
            'deduction': 'الخصم',
            'total_salary': 'إجمالي الراتب',
            'net_salary': 'صافي الراتب',
            'bank_account': 'الحساب البنكي',
            'bank_name': 'اسم البنك',
            'iban': 'رقم الآيبان',
            'swift_code': 'رمز السويفت',
            // Additional translations based on common field names
            'optional': 'اختياري',
            'اختياري': 'اختياري',
            'required': 'مطلوب',
            'مطلوب': 'مطلوب',
            'field': 'حقل',
            'value': 'قيمة',
            'type': 'نوع',
            'description': 'وصف',
            'title': 'عنوان',
            'content': 'محتوى',
            'date': 'تاريخ',
            'time': 'وقت',
            'location': 'موقع',
            'price': 'سعر',
            'quantity': 'كمية',
            'total': 'إجمالي',
            'subtotal': 'المجموع الفرعي',
            'tax': 'ضريبة',
            'discount': 'خصم',
            'code': 'رمز',
            'id': 'معرف',
            'number': 'رقم',
            'reference': 'مرجع',
            'category': 'فئة',
            'subcategory': 'فئة فرعية',
            'priority': 'أولوية',
            'urgency': 'إلحاح',
            'deadline': 'موعد نهائي',
            'duration': 'مدة',
            'frequency': 'تكرار',
            'interval': 'فترة',
            'schedule': 'جدول',
            'calendar': 'تقويم',
            'event': 'حدث',
            'meeting': 'اجتماع',
            'appointment': 'موعد',
            'task': 'مهمة',
            'project': 'مشروع',
            'goal': 'هدف',
            'objective': 'غرض',
            'target': 'هدف',
            'result': 'نتيجة',
            'outcome': 'محصلة',
            'achievement': 'إنجاز',
            'progress': 'تقدم',
            'completion': 'إكمال',
            'percentage': 'نسبة مئوية',
            'ratio': 'نسبة',
            'rate': 'معدل',
            'average': 'متوسط',
            'minimum': 'حد أدنى',
            'maximum': 'حد أقصى',
            'limit': 'حد',
            'threshold': 'عتبة',
            'range': 'نطاق',
            'scope': 'نطاق',
            'area': 'منطقة',
            'region': 'إقليم',
            'zone': 'منطقة',
            'sector': 'قطاع',
            'division': 'قسم',
            'unit': 'وحدة',
            'group': 'مجموعة',
            'team': 'فريق',
            'member': 'عضو',
            'participant': 'مشارك',
            'attendee': 'حاضر',
            'guest': 'ضيف',
            'visitor': 'زائر',
            'client': 'عميل',
            'customer': 'زبون',
            'supplier': 'مورد',
            'vendor': 'بائع',
            'partner': 'شريك',
            'contact': 'جهة اتصال',
            'representative': 'ممثل',
            'agent': 'وكيل',
            'manager': 'مدير',
            'supervisor': 'مشرف',
            'coordinator': 'منسق',
            'administrator': 'مدير',
            'operator': 'مشغل',
            'technician': 'فني',
            'specialist': 'أخصائي',
            'expert': 'خبير',
            'consultant': 'استشاري',
            'advisor': 'مستشار',
            'assistant': 'مساعد',
            'secretary': 'سكرتير',
            'clerk': 'كاتب',
            'officer': 'موظف',
            'executive': 'تنفيذي',
            'director': 'مدير',
            'president': 'رئيس',
            'chairman': 'رئيس مجلس الإدارة',
            'ceo': 'الرئيس التنفيذي',
            'cto': 'المدير التقني',
            'cfo': 'المدير المالي',
            'hr': 'الموارد البشرية',
            'it': 'تكنولوجيا المعلومات',
            'finance': 'مالية',
            'accounting': 'محاسبة',
            'marketing': 'تسويق',
            'sales': 'مبيعات',
            'support': 'دعم',
            'service': 'خدمة',
            'maintenance': 'صيانة',
            'security': 'أمن',
            'quality': 'جودة',
            'training': 'تدريب',
            'development': 'تطوير',
            'research': 'بحث',
            'analysis': 'تحليل',
            'report': 'تقرير',
            'document': 'وثيقة',
            'file': 'ملف',
            'folder': 'مجلد',
            'archive': 'أرشيف',
            'backup': 'نسخة احتياطية',
            'version': 'إصدار',
            'revision': 'مراجعة',
            'update': 'تحديث',
            'upgrade': 'ترقية',
            'installation': 'تثبيت',
            'configuration': 'تكوين',
            'setting': 'إعداد',
            'option': 'خيار',
            'preference': 'تفضيل',
            'choice': 'اختيار',
            'selection': 'تحديد',
            'filter': 'مرشح',
            'search': 'بحث',
            'query': 'استعلام',
            'keyword': 'كلمة مفتاحية',
            'tag': 'علامة',
            'label': 'تسمية',
            'mark': 'علامة',
            'flag': 'علم',
            'indicator': 'مؤشر',
            'signal': 'إشارة',
            'alert': 'تنبيه',
            'warning': 'تحذير',
            'error': 'خطأ',
            'exception': 'استثناء',
            'issue': 'مشكلة',
            'problem': 'مشكلة',
            'bug': 'خطأ برمجي',
            'defect': 'عيب',
            'fault': 'خلل',
            'failure': 'فشل',
            'success': 'نجاح',
            'complete': 'مكتمل',
            'incomplete': 'غير مكتمل',
            'pending': 'معلق',
            'approved': 'موافق عليه',
            'rejected': 'مرفوض',
            'cancelled': 'ملغى',
            'deleted': 'محذوف',
            'archived': 'مؤرشف',
            'active': 'نشط',
            'inactive': 'غير نشط',
            'enabled': 'مفعل',
            'disabled': 'معطل',
            'visible': 'مرئي',
            'hidden': 'مخفي',
            'public': 'عام',
            'private': 'خاص',
            'confidential': 'سري',
            'restricted': 'مقيد',
            'open': 'مفتوح',
            'closed': 'مغلق',
            'locked': 'مقفل',
            'unlocked': 'مفتوح',
            'available': 'متاح',
            'unavailable': 'غير متاح',
            'online': 'متصل',
            'offline': 'غير متصل',
            'connected': 'متصل',
            'disconnected': 'منقطع',
            'synchronized': 'متزامن',
            'unsynchronized': 'غير متزامن'
        };
        
        return translations[key.toLowerCase()] || key;
    };

    const addNewField = () => {
        if (newFieldKey.trim() && newFieldValue.trim()) {
            setFormData(prev => ({
                ...prev,
                details: {
                    ...prev.details,
                    [newFieldKey]: newFieldValue
                }
            }));
            setNewFieldKey('');
            setNewFieldValue('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        let details;
        try {
            details = formData.details || {};
        } catch (error) {
            setMessage({ text: 'JSON في حقل التفاصيل غير صالح.', type: 'error' });
            return;
        }
        const result = await onSave({ ...formData, details });
        setMessage(result);
    };
    
    const handlePromote = async () => {
        // if (!confirm(`هل أنت متأكد من ترقية هذا المستخدم إلى دور "${promoteRole}"؟`)) return;
        const result = await onPromote(user.id, promoteRole);
        setMessage(result);
    };

    return (
        <div className="modal-overlay" style={{ display: 'block' }}>
            <div className="modal-content-enhanced">
                <span className="close-button" onClick={onClose}>×</span>
                <h2>تعديل بيانات المستخدم</h2>
                {message.text && <div className={`message ${message.type}`}>{message.text}</div>}
                <form onSubmit={handleSubmit}>
                    <input type="hidden" name="id" value={formData?.id || ''} />
                    <div className="form-group">
                        <label>الاسم الكامل</label>
                        <input type="text" name="full_name" value={formData?.full_name || ''} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>البريد الإلكتروني</label>
                        <input type="email" name="email" value={formData?.email || ''} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>رقم الهاتف</label>
                        <input type="tel" name="phone" value={formData?.phone || ''} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>الدور</label>
                        <select name="role" value={formData?.role || ''} onChange={handleChange} required>
                            <option value="student">طالب</option>
                            <option value="parent">ولي أمر</option>
                            <option value="teacher">معلم</option>
                            <option value="worker">موظف</option>
                            <option value="head">رئيس قسم</option>
                            <option value="finance">مالية</option>
                            <option value="admin">مدير</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>تفاصيل إضافية (JSON)</label>
                        <div className="details-editor">
                            {formData.details && typeof formData.details === 'object' ? (
                                Object.entries(formData.details).map(([key, value]) => {
                                    const displayValue = Array.isArray(value) 
                                        ? value.join(', ') 
                                        : (typeof value === 'object' && value !== null)
                                            ? JSON.stringify(value)
                                            : String(value || '');
                                    
                                    return (
                                        <div key={key} className="detail-field">
                                            <label>{translateFieldName(key)}:</label>
                                            <input 
                                                type="text" 
                                                value={displayValue} 
                                                onChange={(e) => handleDetailFieldChange(key, e.target.value)}
                                            />
                                        </div>
                                    );
                                })
                            ) : null}
                        </div>
                        <div className="add-field">
                            <input 
                                type="text" 
                                placeholder="اسم الحقل الجديد"
                                value={newFieldKey}
                                onChange={(e) => setNewFieldKey(e.target.value)}
                            />
                            <input 
                                type="text" 
                                placeholder="قيمة الحقل"
                                value={newFieldValue}
                                onChange={(e) => setNewFieldValue(e.target.value)}
                            />
                            <button type="button" onClick={addNewField}>إضافة حقل</button>
                        </div>
                    </div>
                    <hr style={{ margin: '20px 0' }} />
                    <button type="submit" className="btn-save">حفظ التعديلات</button>
                </form>
                <h4><i className="fas fa-level-up-alt"></i> ترقية المستخدم</h4>
                <div className="form-group">
                    <label>ترقية إلى دور جديد:</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <select className="form-control" style={{ flexGrow: 1 }} value={promoteRole} onChange={e => setPromoteRole(e.target.value)}>
                            <option value="student">طالب</option>
                            <option value="parent">ولي أمر</option>
                            <option value="teacher">معلم</option>
                            <option value="worker">موظف</option>
                            <option value="head">رئيس قسم</option>
                            <option value="finance">مالية</option>
                            <option value="admin">مدير</option>
                        </select>
                        <button type="button" onClick={handlePromote} className="btn btn-warning">ترقية الآن</button>
                    </div>
                </div>
            </div>
        </div>
    );
};


const AdminUsersPage = ({ user, users }) => {
    const [filteredUsers, setFilteredUsers] = useState(users);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        const filtered = users.filter(u => {
            return u.full_name.toLowerCase().includes(lowercasedFilter) || u.email.toLowerCase().includes(lowercasedFilter);
        });
        setFilteredUsers(filtered);
    }, [searchTerm, users]);

    const openEditModal = (userToEdit) => {
        setSelectedUser(userToEdit);
        setIsModalOpen(true);
    };

    const closeEditModal = () => {
        setSelectedUser(null);
        setIsModalOpen(false);
    };

    const handleSaveUser = async (userData) => {
        try {
            const response = await fetch(`/api/users/${userData.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            const result = await response.json();
            if (response.ok) {
                router.replace(router.asPath); // Refresh data
                setTimeout(closeEditModal, 1500);
                return { text: result.message, type: 'success' };
            } else {
                return { text: result.message, type: 'error' };
            }
        } catch (err) {
            return { text: 'خطأ في الاتصال أو صيغة JSON غير صحيحة.', type: 'error' };
        }
    };
    
    const handlePromoteUser = async (userId, newRole) => {
        try {
            const response = await fetch(`/api/users/${userId}/promote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newRole })
            });
            const result = await response.json();
            if (response.ok) {
                router.replace(router.asPath); // Refresh data
                return { text: result.message, type: 'success' };
            } else {
                return { text: result.message, type: 'error' };
            }
        } catch (err) {
            return { text: 'حدث خطأ في الاتصال.', type: 'error' };
        }
    };

    return (
        <Layout user={user}>
            <style jsx global>{`
                .table-container { 
                    background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
                    padding: 25px; 
                    border-radius: 16px; 
                    box-shadow: 0 8px 25px rgba(0,0,0,0.1);
                    border: 1px solid #e9ecef;
                }
                .table-controls { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
                .search-box { 
                    width: 300px; 
                    padding: 12px 16px; 
                    border: 2px solid #e9ecef; 
                    border-radius: 10px; 
                    font-size: 1rem;
                    transition: all 0.3s ease;
                    background: #ffffff;
                    box-sizing: border-box;
                }
                .search-box:focus {
                    outline: none;
                    border-color: #3498db;
                    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
                    transform: translateY(-1px);
                }
                .search-box:hover {
                    border-color: #bdc3c7;
                }
                .users-table { width: 100%; border-collapse: collapse; }
                .users-table th, .users-table td { padding: 12px; border-bottom: 1px solid #eee; text-align: right; }
                .users-table th { background-color: #f7f9fc; font-weight: 600; }
                .action-btn { margin: 0 5px; cursor: pointer; border: none; background: none; font-size: 1rem; }
                .edit-btn { color: #3498db; }
                .modal-overlay { 
                    display: flex !important; 
                    justify-content: center; 
                    align-items: center; 
                    position: fixed; 
                    z-index: 1000; 
                    left: 0; 
                    top: 0; 
                    width: 100%; 
                    height: 100%; 
                    overflow: auto; 
                    background-color: rgba(0,0,0,0.7); 
                    backdrop-filter: blur(3px);
                }
                .modal-content-enhanced { 
                    background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%) !important;
                    margin: 2% auto; 
                    padding: 30px !important; 
                    border: none !important;
                    border-radius: 16px !important; 
                    width: 90%; 
                    max-width: 650px !important; 
                    box-shadow: 0 20px 60px rgba(0,0,0,0.15) !important;
                    max-height: 90vh;
                    overflow-y: auto;
                    direction: rtl;
                }
                .modal-content-enhanced h2 {
                    color: #2c3e50 !important;
                    margin-bottom: 25px !important;
                    font-size: 1.8rem !important;
                    text-align: center !important;
                    border-bottom: 3px solid #3498db !important;
                    padding-bottom: 15px !important;
                }
                .modal-content-enhanced h4 {
                    color: #e67e22 !important;
                    margin: 25px 0 15px 0 !important;
                    font-size: 1.3rem !important;
                    display: flex !important;
                    align-items: center !important;
                    gap: 10px !important;
                }
                .close-button { 
                    color: #95a5a6; 
                    float: left; 
                    font-size: 32px; 
                    font-weight: bold; 
                    cursor: pointer; 
                    transition: color 0.3s ease;
                    line-height: 1;
                }
                .close-button:hover {
                    color: #e74c3c;
                    transform: scale(1.1);
                }
                .message.success { 
                    color: #155724; 
                    background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
                    padding: 15px; 
                    border-radius: 10px; 
                    margin-bottom: 20px; 
                    border-left: 4px solid #28a745;
                    box-shadow: 0 4px 12px rgba(40, 167, 69, 0.15);
                }
                .message.error { 
                    color: #721c24; 
                    background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
                    padding: 15px; 
                    border-radius: 10px; 
                    margin-bottom: 20px; 
                    border-left: 4px solid #dc3545;
                    box-shadow: 0 4px 12px rgba(220, 53, 69, 0.15);
                }
                .modal-content-enhanced .form-group { 
                    margin-bottom: 20px !important; 
                    position: relative;
                }
                .modal-content-enhanced .form-group label { 
                    display: block !important; 
                    margin-bottom: 8px !important; 
                    font-weight: 600 !important; 
                    color: #2c3e50 !important;
                    font-size: 1rem !important;
                }
                .modal-content-enhanced .form-group input, 
                .modal-content-enhanced .form-group select { 
                    width: 100% !important; 
                    padding: 12px 16px !important; 
                    border: 2px solid #e9ecef !important; 
                    border-radius: 10px !important; 
                    font-size: 1rem !important;
                    transition: all 0.3s ease !important;
                    background: #ffffff !important;
                    box-sizing: border-box !important;
                }
                .modal-content-enhanced .form-group input:focus, 
                .modal-content-enhanced .form-group select:focus {
                    outline: none !important;
                    border-color: #3498db !important;
                    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1) !important;
                    transform: translateY(-1px) !important;
                }
                .modal-content-enhanced .form-group input:hover, 
                .modal-content-enhanced .form-group select:hover {
                    border-color: #bdc3c7 !important;
                }
                .details-editor { 
                    margin-bottom: 20px; 
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 12px;
                    border: 1px solid #e9ecef;
                }
                .detail-field { 
                    display: flex; 
                    align-items: center; 
                    margin-bottom: 15px; 
                    gap: 15px;
                }
                .detail-field label { 
                    min-width: 120px; 
                    margin-bottom: 0;
                    font-weight: 500;
                    color: #495057;
                }
                .detail-field input { 
                    flex: 1; 
                    margin-bottom: 0;
                    padding: 12px 16px; 
                    border: 2px solid #e9ecef; 
                    border-radius: 10px; 
                    font-size: 1rem;
                    transition: all 0.3s ease;
                    background: #ffffff;
                    box-sizing: border-box;
                }
                .detail-field input:focus {
                    outline: none;
                    border-color: #3498db;
                    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
                    transform: translateY(-1px);
                }
                .detail-field input:hover {
                    border-color: #bdc3c7;
                }
                .add-field { 
                    display: flex; 
                    gap: 12px; 
                    margin-top: 15px; 
                    padding-top: 15px;
                    border-top: 1px solid #dee2e6;
                }
                .add-field input { 
                    flex: 1; 
                    padding: 12px 16px; 
                    border: 2px solid #e9ecef; 
                    border-radius: 10px; 
                    font-size: 1rem;
                    transition: all 0.3s ease;
                    background: #ffffff;
                    box-sizing: border-box;
                }
                .add-field input:focus {
                    outline: none;
                    border-color: #3498db;
                    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
                    transform: translateY(-1px);
                }
                .add-field input:hover {
                    border-color: #bdc3c7;
                }
                .add-field button {
                    background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
                    color: white;
                    border: none;
                    padding: 12px 20px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.3s ease;
                    white-space: nowrap;
                }
                .add-field button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(23, 162, 184, 0.3);
                }
                .modal-content-enhanced .btn-save { 
                    background: linear-gradient(135deg, #28a745 0%, #20c997 100%) !important;
                    color: white !important; 
                    padding: 15px 30px !important; 
                    border: none !important; 
                    border-radius: 10px !important; 
                    cursor: pointer !important; 
                    font-size: 1.1rem !important;
                    font-weight: 600 !important;
                    width: 100% !important;
                    transition: all 0.3s ease !important;
                    box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3) !important;
                }
                .modal-content-enhanced .btn-save:hover {
                    transform: translateY(-2px) !important;
                    box-shadow: 0 8px 25px rgba(40, 167, 69, 0.4) !important;
                }
                .btn { 
                    padding: 12px 20px; 
                    border: none; 
                    border-radius: 8px; 
                    cursor: pointer; 
                    font-weight: 600;
                    transition: all 0.3s ease;
                }
                .btn-warning { 
                    background: linear-gradient(135deg, #ffc107 0%, #fd7e14 100%);
                    color: #212529; 
                    box-shadow: 0 4px 15px rgba(255, 193, 7, 0.3);
                }
                .btn-warning:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(255, 193, 7, 0.4);
                }
                .modal-content-enhanced .form-control { 
                    padding: 12px 16px !important; 
                    border: 2px solid #e9ecef !important; 
                    border-radius: 10px !important; 
                    transition: all 0.3s ease !important;
                    background: #ffffff !important;
                }
                .modal-content-enhanced .form-control:focus {
                    outline: none !important;
                    border-color: #3498db !important;
                    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1) !important;
                }
                hr {
                    border: none;
                    height: 2px;
                    background: linear-gradient(90deg, transparent, #3498db, transparent);
                    margin: 30px 0;
                }
                .table-responsive-wrapper { overflow-x: auto; }
            `}</style>
            <h1><i className="fas fa-users-cog fa-fw"></i> إدارة المستخدمين</h1>
            <div className="table-container">
                <div className="table-controls">
                    <input 
                        type="text" 
                        className="search-box" 
                        placeholder="🔍 ابحث بالاسم أو البريد الإلكتروني..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="table-responsive-wrapper">
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th>الاسم الكامل</th>
                                <th>البريد الإلكتروني</th>
                            <th>الهاتف</th>
                            <th>الدور</th>
                            <th>تاريخ التسجيل</th>
                            <th>إجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(u => (
                            <tr key={u.id}>
                                <td>{u.full_name}</td>
                                <td>{u.email}</td>
                                <td>{u.phone}</td>
                                <td>{u.role}</td>
                                <td>-</td>
                                <td>
                                    <button className="action-btn edit-btn" onClick={() => openEditModal(u)} title="تعديل">
                                        <i className="fas fa-edit"></i>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
            </div>
            <EditUserModal 
                user={selectedUser}
                isOpen={isModalOpen}
                onClose={closeEditModal}
                onSave={handleSaveUser}
                onPromote={handlePromoteUser}
            />
        </Layout>
    );
};

export default AdminUsersPage;


export const getServerSideProps = withAuth(async (context) => {
    const { user } = context;
    const usersResult = await pool.query('SELECT id, full_name, email, phone, role, details FROM users ORDER BY created_at DESC LIMIT 100');

    return {
        props: {
            user: JSON.parse(JSON.stringify(user)),
            users: usersResult.rows.map(u => JSON.parse(JSON.stringify({ ...u, details: u.details || {} })))
        }
    };
}, { roles: ['admin'] });