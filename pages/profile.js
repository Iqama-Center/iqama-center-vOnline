import React, { useState } from 'react';
import Image from 'next/image';
import Layout from '../components/Layout';
import { withAuth } from '../lib/withAuth';
import { useRouter } from 'next/router';
import pool from '../lib/db';
import { safeSerialize } from '../lib/isrUtils';
import PerformanceDisplay from '../components/PerformanceDisplay';

const EditRequestModal = ({ isOpen, onClose, fieldName, currentValue, onSubmit }) => {
    const [newValue, setNewValue] = useState(currentValue || '');
    const [message, setMessage] = useState({ text: '', type: '' });

    const fieldNamesArabic = {
        'full_name': 'الاسم الكامل',
        'email': 'البريد الإلكتروني', 
        'phone': 'رقم الهاتف',
        'details': 'التفاصيل الإضافية'
    };

    React.useEffect(() => {
        if (isOpen) {
            setNewValue(currentValue || '');
            setMessage({ text: '', type: '' });
        }
    }, [isOpen, currentValue]);

    if (!isOpen) return null;
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await onSubmit(fieldName, newValue);
        setMessage(result);
        if (result.type === 'success') {
            setTimeout(onClose, 1500);
        }
    };

    const isDetails = fieldName === 'details';
    const arabicFieldName = fieldNamesArabic[fieldName] || fieldName;

    return (
        <div className="modal" style={{ display: 'flex' }}>
            <div className="modal-content" style={{ maxWidth: '500px' }}>
                <span className="close-button" onClick={onClose}>×</span>
                <h3>طلب تعديل بيانات</h3>
                {message.text && <div className={`message ${message.type}`}>{message.text}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>تعديل {arabicFieldName}:</label>
                        <div style={{ marginBottom: '10px', padding: '8px', background: '#f8f9fa', borderRadius: '4px', fontSize: '14px' }}>
                            <strong>القيمة الحالية:</strong> {
                                typeof currentValue === 'object' && currentValue !== null 
                                    ? JSON.stringify(currentValue, null, 2)
                                    : (currentValue || 'غير محدد')
                            }
                        </div>
                        {isDetails ? (
                            <textarea 
                                value={newValue} 
                                onChange={(e) => setNewValue(e.target.value)}
                                rows={8}
                                style={{ textAlign: 'left', direction: 'ltr' }}
                                placeholder="أدخل التفاصيل الجديدة بصيغة JSON..."
                                required 
                            />
                        ) : (
                            <input 
                                type={fieldName === 'email' ? 'email' : 'text'}
                                value={newValue} 
                                onChange={(e) => setNewValue(e.target.value)}
                                style={{ textAlign: 'right', direction: 'rtl' }}
                                placeholder={`أدخل ${arabicFieldName} الجديد...`}
                                required 
                            />
                        )}
                    </div>
                    <button type="submit" className="btn-save">إرسال الطلب</button>
                </form>
            </div>
        </div>
    );
};

const UserDetailsDisplay = ({ details }) => {
    const arabicLabels = {
        country: 'الدولة',
        city: 'المدينة',
        date_of_birth: 'تاريخ الميلاد',
        gender: 'الجنس',
        education_level: 'المستوى التعليمي',
        specialization: 'التخصص',
        interests: 'الاهتمامات',
        preferred_language: 'اللغة المفضلة',
    };

    if (!details || Object.keys(details).length === 0) {
        return <p className="no-details">لا توجد تفاصيل إضافية.</p>;
    }

    return (
        <div className="details-display">
            {Object.entries(details).map(([key, value]) => (
                <div key={key} className="detail-item">
                    <span className="detail-label">{arabicLabels[key] || key}:</span>
                    <span className="detail-value">{value?.toString() || '-'}</span>
                </div>
            ))}
        </div>
    );
};

const ProfilePage = ({ user, performanceData }) => {
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [passwordMessage, setPasswordMessage] = useState({ text: '', type: '' });
    const [avatarMessage, setAvatarMessage] = useState({ text: '', type: '' });
    const [passwordErrors, setPasswordErrors] = useState({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editField, setEditField] = useState({ name: '', value: '' });
    const router = useRouter();

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData({ ...passwordData, [name]: value });
        
        if (passwordErrors[name]) {
            setPasswordErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handlePasswordBlur = (e) => {
        const { name, value } = e.target;
        
        if (name === 'confirmPassword' && value) {
            const passwordError = value !== passwordData.newPassword ? 'كلمات المرور غير متطابقة' : null;
            setPasswordErrors(prev => ({ ...prev, confirmPassword: passwordError }));
        }
        
        if (name === 'newPassword' && passwordData.confirmPassword) {
            const passwordError = passwordData.confirmPassword !== value ? 'كلمات المرور غير متطابقة' : null;
            setPasswordErrors(prev => ({ ...prev, confirmPassword: passwordError }));
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setPasswordErrors({});
        
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordMessage({ text: 'كلمتا المرور الجديدتان غير متطابقتين.', type: 'error' });
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        try {
            const response = await fetch('/api/profile/update-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword })
            });
            const result = await response.json();
            setPasswordMessage({ text: result.message, type: response.ok ? 'success' : 'error' });
            if (!response.ok) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
            if(response.ok) e.target.reset();
        } catch (err) {
            setPasswordMessage({ text: 'حدث خطأ في الاتصال بالخادم.', type: 'error' });
        }
    };
    
    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('avatar', file);
        try {
            const response = await fetch('/api/profile/upload-avatar', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            setAvatarMessage({ text: result.message, type: response.ok ? 'success' : 'error' });
            if (!response.ok) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
            if(response.ok) router.replace(router.asPath);
        } catch (err) {
            setAvatarMessage({ text: 'حدث خطأ في الاتصال.', type: 'error' });
        }
    };

    const openEditModal = (fieldName, currentValue) => {
        let value = currentValue;
        if (fieldName === 'details' && typeof currentValue === 'object') {
            value = JSON.stringify(currentValue, null, 2);
        }
        setEditField({ name: fieldName, value });
        setIsModalOpen(true);
    };

    const handleRequestSubmit = async (fieldName, newValue) => {
        try {
            const response = await fetch('/api/profile/request-change', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ field_name: fieldName, new_value: newValue })
            });
            const result = await response.json();
            return { text: result.message, type: response.ok ? 'success' : 'error' };
        } catch (err) {
            return { text: 'حدث خطأ في الاتصال.', type: 'error' };
        }
    };

    return (
        <Layout user={user}>
            <style jsx>{`
                .profile-grid { display: grid; grid-template-columns: 1fr; gap: 30px; }
                @media (min-width: 992px) {
                    .profile-grid { grid-template-columns: 300px 1fr; }
                    .main-content { grid-column: 2 / 3; }
                    .sidebar { grid-column: 1 / 2; grid-row: 1 / 3; }
                }
                .profile-card { background: #fff; border-radius: 8px; padding: 25px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); position: relative; }
                .profile-card h3 { color: var(--primary-color); border-bottom: 2px solid var(--primary-color); padding-bottom: 10px; margin-bottom: 20px; font-size: 1.3rem; }
                .info-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f0f0f0; }
                .info-row:last-child { border-bottom: none; }
                .info-row strong { color: #555; }
                .info-row span { color: #333; }
                .edit-btn { background: #f7f7f7; border: 1px solid #ddd; border-radius: 50%; width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center; margin-left: 8px; color: #007bff; cursor: pointer; }
                .avatar-card { text-align: center; }
                .avatar-placeholder { width: 120px; height: 120px; border-radius: 50%; background: #eee; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 3.5rem; color: #bbb; }
                .avatar-placeholder img { width:100%;height:100%;border-radius:50%;object-fit:cover; }
                .btn-upload { background: var(--primary-color); color: white; padding: 10px 18px; border-radius: 5px; cursor: pointer; display: inline-block; }
                .btn-upload input[type="file"] { display: none; }
                .message { text-align: center; padding: 10px; margin-top: 15px; border-radius: 5px; }
                .message.error { color: #721c24; background-color: #f8d7da; }
                .message.success { color: #155724; background-color: #d4edda; }
                .modal { display: flex; justify-content: center; align-items: center; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.7); }
                .modal-content { background-color: #fefefe; padding: 20px; border-radius: 8px; width: 80%; max-width: 500px; }
                .close-button { color: #aaa; float: right; font-size: 28px; font-weight: bold; cursor: pointer; }
                .details-display { margin-top: 10px; padding: 15px; background: #f8f9fa; border-radius: 5px; border: 1px solid #e9ecef; }
                .detail-item { display: flex; margin-bottom: 8px; padding: 5px 0; border-bottom: 1px solid #e9ecef; }
                .detail-item:last-child { border-bottom: none; margin-bottom: 0; }
                .detail-label { font-weight: bold; min-width: 120px; color: #495057; margin-left: 10px; }
                .detail-value { flex: 1; color: #212529; }
                .no-details { color: #6c757d; font-style: italic; }
                .form-group { margin-bottom: 15px; }
                .form-group label { display: block; margin-bottom: 5px; font-weight: bold; }
                .form-group input, .form-group textarea { width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; }
                .btn-save { background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; }
            `}</style>
            <h1><i className="fas fa-user-cog fa-fw"></i> الملف الشخصي</h1>
            <p>هنا يمكنك عرض بياناتك وتعديل معلومات حسابك.</p>
            <hr style={{ margin: '20px 0' }} />

            <div className="profile-grid">
                <div className="sidebar">
                    <div className="profile-card avatar-card">
                        <h3><i className="fas fa-user-circle fa-fw"></i> الصورة الشخصية</h3>
                        <div className="avatar-placeholder">
                            {user.avatar_url ? <Image src={user.avatar_url} alt="Avatar" width={120} height={120} /> : <i className="fas fa-user"></i>}
                        </div>
                        <label className="btn-upload">
                            <i className="fas fa-upload"></i> تغيير الصورة
                            <input type="file" accept="image/*" onChange={handleAvatarUpload} />
                        </label>
                        {avatarMessage.text && <div className={`message ${avatarMessage.type}`}>{avatarMessage.text}</div>}
                    </div>
                </div>

                <div className="main-content">
                    <div className="profile-card">
                        <h3><i className="fas fa-id-card fa-fw"></i> معلومات أساسية</h3>
                        <div className="info-row">
                            <strong>الاسم الكامل</strong>
                            <span>{user.full_name} <button className="edit-btn" onClick={() => openEditModal('full_name', user.full_name)}>✏️</button></span>
                        </div>
                        <div className="info-row">
                            <strong>البريد الإلكتروني</strong>
                            <span>{user.email} <button className="edit-btn" onClick={() => openEditModal('email', user.email)}>✏️</button></span>
                        </div>
                        <div className="info-row">
                            <strong>رقم الهاتف</strong>
                            <span>{user.phone} <button className="edit-btn" onClick={() => openEditModal('phone', user.phone)}>✏️</button></span>
                        </div>
                        <div className="info-row">
                            <strong>الدور</strong>
                            <span>{user.role}</span>
                        </div>
                    </div>

                    <div className="profile-card">
                        <h3><i className="fas fa-info-circle fa-fw"></i> تفاصيل إضافية</h3>
                        <UserDetailsDisplay details={user.details} />
                        <button className="edit-btn" style={{position: 'absolute', top: '25px', left: '25px'}} onClick={() => openEditModal('details', user.details)}>✏️</button>
                    </div>

                    {performanceData && performanceData.length > 0 && (
                        <div className="profile-card">
                           <h3><i className="fas fa-chart-pie fa-fw"></i> ملخص الأداء</h3>
                           {performanceData.map(p => (
                               <div key={p.course_id}>
                                   <h4>أداؤك في دورة: {p.course_name}</h4>
                                   <PerformanceDisplay performanceData={p} />
                               </div>
                           ))}
                        </div>
                    )}

                    <div className="profile-card">
                        <h3><i className="fas fa-key fa-fw"></i> تغيير كلمة المرور</h3>
                        {passwordMessage.text && <div className={`message ${passwordMessage.type}`}>{passwordMessage.text}</div>}
                        <form onSubmit={handlePasswordSubmit}>
                           <div className="form-group">
                                <label htmlFor="currentPassword">كلمة المرور الحالية</label>
                                <input type="password" id="currentPassword" name="currentPassword" onChange={handlePasswordChange} required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="newPassword">كلمة المرور الجديدة</label>
                                <input type="password" id="newPassword" name="newPassword" onChange={handlePasswordChange} onBlur={handlePasswordBlur} required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="confirmPassword">تأكيد كلمة المرور الجديدة</label>
                                <input type="password" id="confirmPassword" name="confirmPassword" onChange={handlePasswordChange} onBlur={handlePasswordBlur} required />
                                {passwordErrors.confirmPassword && <span style={{color: 'red', fontSize: '12px'}}>{passwordErrors.confirmPassword}</span>}
                            </div>
                            <button type="submit" className="btn-save">حفظ كلمة المرور</button>
                        </form>
                    </div>
                </div>
            </div>
            
            <EditRequestModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                fieldName={editField.name}
                currentValue={editField.value}
                onSubmit={handleRequestSubmit}
            />
        </Layout>
    );
};

export default ProfilePage;

export const getServerSideProps = withAuth(async (context) => {
    const { user } = context;
    let performanceData = []; // Always return an array

    try {
        if (user.role === 'student') {
            const enrollmentsRes = await pool.query(
                `SELECT course_id, c.name as course_name 
                 FROM enrollments e
                 JOIN courses c ON e.course_id = c.id
                 WHERE e.user_id = $1 AND e.status = 'active'`,
                [user.id]
            );

            if (enrollmentsRes.rows.length > 0) {
                performanceData = await Promise.all(
                    enrollmentsRes.rows.map(async (enrollment) => {
                        const performanceResult = await pool.query(
                            'SELECT calculate_user_performance($1, $2) as performance_data',
                            [user.id, enrollment.course_id]
                        );
                        const perfData = performanceResult.rows[0]?.performance_data || {};
                        return {
                            course_id: enrollment.course_id,
                            course_name: enrollment.course_name,
                            ...perfData,
                        };
                    })
                );
            }
        }
    } catch (error) {
        console.error('Error fetching profile performance data:', error);
        // Set performanceData to empty array on error, but don't crash the page
        performanceData = [];
    }

    return {
        props: {
            user: user,
            performanceData: safeSerialize(performanceData),
        },
    };
});
