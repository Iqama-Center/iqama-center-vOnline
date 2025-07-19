import React, { useState } from 'react';

const CourseEnrollment = ({ course, user, onEnrollmentSuccess }) => {
    const [enrollmentData, setEnrollmentData] = useState({
        preferred_days: [],
        preferred_start_time: '09:00',
        supervisor_approval: false
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const daysOfWeek = [
        { value: 'sunday', label: 'الأحد' },
        { value: 'monday', label: 'الاثنين' },
        { value: 'tuesday', label: 'الثلاثاء' },
        { value: 'wednesday', label: 'الأربعاء' },
        { value: 'thursday', label: 'الخميس' },
        { value: 'friday', label: 'الجمعة' },
        { value: 'saturday', label: 'السبت' }
    ];

    const timeSlots = [
        '08:00', '09:00', '10:00', '11:00', '12:00', 
        '13:00', '14:00', '15:00', '16:00', '17:00', 
        '18:00', '19:00', '20:00', '21:00'
    ];

    const handleDayChange = (day, checked) => {
        if (checked) {
            setEnrollmentData(prev => ({
                ...prev,
                preferred_days: [...prev.preferred_days, day]
            }));
        } else {
            setEnrollmentData(prev => ({
                ...prev,
                preferred_days: prev.preferred_days.filter(d => d !== day)
            }));
        }
    };

    const handleEnroll = async (e) => {
        e.preventDefault();
        
        // Validate required fields for teachers/supervisors
        if (['teacher', 'head', 'admin'].includes(user.role)) {
            if (enrollmentData.preferred_days.length === 0) {
                setMessage('⚠️ يرجى اختيار أيام الأسبوع المناسبة');
                return;
            }
        }

        setLoading(true);
        setMessage('');

        try {
            const response = await fetch(`/api/courses/${course.id}/enroll`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(enrollmentData)
            });

            const result = await response.json();

            if (response.ok) {
                setMessage('✅ ' + result.message);
                if (onEnrollmentSuccess) {
                    onEnrollmentSuccess(result);
                }
            } else {
                setMessage('⚠️ ' + result.message);
            }
        } catch (err) {
            setMessage('🚫 خطأ في الاتصال بالخادم');
        }

        setLoading(false);
    };

    const getUserLevelInfo = () => {
        if (!course.participant_config) return null;

        const levels = course.participant_config;
        for (const [levelKey, config] of Object.entries(levels)) {
            if (config.roles && config.roles.includes(user.role)) {
                return {
                    level: levelKey,
                    name: config.name,
                    min: config.min,
                    max: config.max,
                    optimal: config.optimal
                };
            }
        }
        return null;
    };

    const userLevel = getUserLevelInfo();

    if (!userLevel) {
        return (
            <div className="enrollment-error">
                <style jsx>{`
                    .enrollment-error {
                        background: #f8d7da;
                        color: #721c24;
                        padding: 20px;
                        border-radius: 8px;
                        text-align: center;
                    }
                `}</style>
                <h3>غير مؤهل للانضمام</h3>
                <p>دورك الحالي ({user.role}) غير مؤهل للانضمام لهذه الدورة.</p>
            </div>
        );
    }

    return (
        <div className="course-enrollment">
            <style jsx>{`
                .course-enrollment {
                    background: #fff;
                    padding: 25px;
                    border-radius: 8px;
                    box-shadow: var(--shadow-md);
                    margin: 20px 0;
                }
                .enrollment-header {
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 1px solid #eee;
                }
                .level-info {
                    background: #e3f2fd;
                    padding: 15px;
                    border-radius: 6px;
                    margin-bottom: 20px;
                }
                .level-info h4 {
                    margin: 0 0 10px 0;
                    color: var(--primary-color);
                }
                .capacity-info {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 10px;
                    margin-top: 10px;
                }
                .capacity-item {
                    text-align: center;
                    padding: 8px;
                    background: #fff;
                    border-radius: 4px;
                }
                .capacity-label {
                    font-size: 0.8rem;
                    color: #6c757d;
                }
                .capacity-value {
                    font-weight: bold;
                    color: var(--primary-color);
                }
                .form-section {
                    margin-bottom: 20px;
                }
                .form-section h5 {
                    margin-bottom: 15px;
                    color: var(--secondary-color);
                }
                .days-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                    gap: 10px;
                    margin-bottom: 15px;
                }
                .day-checkbox {
                    display: flex;
                    align-items: center;
                    padding: 10px;
                    background: #f8f9fa;
                    border-radius: 5px;
                    cursor: pointer;
                    transition: background-color 0.2s;
                }
                .day-checkbox:hover {
                    background: #e9ecef;
                }
                .day-checkbox input {
                    margin-left: 8px;
                }
                .time-select {
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    font-family: var(--font-tajawal);
                }
                .approval-section {
                    background: #fff3cd;
                    padding: 15px;
                    border-radius: 6px;
                    margin-bottom: 20px;
                }
                .approval-checkbox {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .enrollment-actions {
                    display: flex;
                    gap: 10px;
                    align-items: center;
                }
                .btn {
                    padding: 12px 24px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 500;
                    font-family: var(--font-tajawal);
                }
                .btn-primary {
                    background: var(--primary-color);
                    color: white;
                }
                .btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                .message {
                    padding: 10px;
                    border-radius: 5px;
                    margin-top: 15px;
                    text-align: center;
                }
                .message.success {
                    background: #d4edda;
                    color: #155724;
                    border: 1px solid #c3e6cb;
                }
                .message.error {
                    background: #f8d7da;
                    color: #721c24;
                    border: 1px solid #f5c6cb;
                }
                .cost-info {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 6px;
                    margin-bottom: 20px;
                    text-align: center;
                }
                .cost-amount {
                    font-size: 1.5rem;
                    font-weight: bold;
                    color: var(--success-color);
                }
            `}</style>

            <div className="enrollment-header">
                <h3>🎯 الانضمام للدورة</h3>
                <p>املأ البيانات المطلوبة للانضمام للدورة</p>
            </div>

            <div className="level-info">
                <h4>مستواك في الدورة: {userLevel.name}</h4>
                <p>أنت مؤهل للانضمام كـ {userLevel.name} في هذه الدورة</p>
                
                <div className="capacity-info">
                    <div className="capacity-item">
                        <div className="capacity-label">الحد الأدنى</div>
                        <div className="capacity-value">{userLevel.min}</div>
                    </div>
                    <div className="capacity-item">
                        <div className="capacity-label">العدد المثالي</div>
                        <div className="capacity-value">{userLevel.optimal}</div>
                    </div>
                    <div className="capacity-item">
                        <div className="capacity-label">الحد الأقصى</div>
                        <div className="capacity-value">{userLevel.max}</div>
                    </div>
                </div>
            </div>

            {course.details?.cost > 0 && (
                <div className="cost-info">
                    <h4>💰 تكلفة الدورة</h4>
                    <div className="cost-amount">
                        {course.details?.cost} {course.details?.currency || 'EGP'}
                    </div>
                    <p>سيتم طلب الدفع بعد تأكيد التسجيل</p>
                </div>
            )}

            <form onSubmit={handleEnroll}>
                {(['teacher', 'head', 'admin'].includes(user.role)) && (
                    <div className="form-section">
                        <h5>📅 اختر أيام الأسبوع المناسبة لك</h5>
                        <div className="days-grid">
                            {daysOfWeek.map(day => (
                                <label key={day.value} className="day-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={enrollmentData.preferred_days.includes(day.value)}
                                        onChange={(e) => handleDayChange(day.value, e.target.checked)}
                                    />
                                    {day.label}
                                </label>
                            ))}
                        </div>
                        
                        <h5>⏰ اختر ساعة البداية المفضلة</h5>
                        <select
                            className="time-select"
                            value={enrollmentData.preferred_start_time}
                            onChange={(e) => setEnrollmentData(prev => ({
                                ...prev,
                                preferred_start_time: e.target.value
                            }))}
                        >
                            {timeSlots.map(time => (
                                <option key={time} value={time}>{time}</option>
                            ))}
                        </select>
                    </div>
                )}

                {user.role === 'student' && course.details?.cost === 0 && (
                    <div className="approval-section">
                        <h5>✅ موافقة المشرف</h5>
                        <label className="approval-checkbox">
                            <input
                                type="checkbox"
                                checked={enrollmentData.supervisor_approval}
                                onChange={(e) => setEnrollmentData(prev => ({
                                    ...prev,
                                    supervisor_approval: e.target.checked
                                }))}
                            />
                            أؤكد أن لدي موافقة المشرف/رئيس القسم للانضمام لهذه الدورة
                        </label>
                    </div>
                )}

                <div className="enrollment-actions">
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                    >
                        {loading ? '⏳ جاري التسجيل...' : '🎯 انضم للدورة'}
                    </button>
                </div>

                {message && (
                    <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
                        {message}
                    </div>
                )}
            </form>
        </div>
    );
};

export default CourseEnrollment;