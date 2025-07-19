import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const AddChildModal = ({ isOpen, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        birth_date: '',
        parent_notes: ''
    });
    const [message, setMessage] = useState({ text: '', type: '' });

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { fullName, email, phone, password, ...details } = formData;
        const data = { fullName, email, phone, password, details };

        const result = await onSubmit(data);
        setMessage(result);
        if (result.type === 'success') {
            setTimeout(() => {
                onClose();
                setMessage({ text: '', type: '' });
            }, 1500);
        }
    };

    return (
        <div className="modal" style={{ display: 'flex' }}>
            <div className="modal-content">
                <span className="close-button" onClick={onClose}>×</span>
                <h2>تسجيل بيانات ابن جديد</h2>
                {message.text && <div className={`message ${message.type}`}>{message.text}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group"><label>الاسم رباعي</label><input type="text" name="fullName" onChange={handleChange} required /></div>
                    <div className="form-group"><label>البريد الإلكتروني</label><input type="email" name="email" onChange={handleChange} required /></div>
                    <div className="form-group"><label>رقم الهاتف</label><input type="tel" name="phone" onChange={handleChange} required /></div>
                    <div className="form-group"><label>كلمة سر مؤقتة</label><input type="password" name="password" onChange={handleChange} required /></div>
                    <div className="form-group"><label>تاريخ الميلاد</label><input type="date" name="birth_date" onChange={handleChange} /></div>
                    <div className="form-group"><label>ملاحظاتك على الابن</label><textarea name="parent_notes" onChange={handleChange}></textarea></div>
                    <button type="submit">إضافة الابن</button>
                </form>
            </div>
        </div>
    );
};

const ParentDashboard = ({ user, children, availableCourses }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [courses, setCourses] = useState(availableCourses || []);
    const [message, setMessage] = useState(null);
    const router = useRouter();

    const handleAddChild = async (data) => {
        try {
            const response = await fetch('/api/users/add-child', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (response.ok) {
                router.replace(router.asPath); // Refresh data
                return { text: result.message, type: 'success' };
            } else {
                return { text: result.message, type: 'error' };
            }
        } catch (err) {
            return { text: 'لا يمكن الاتصال بالخادم.', type: 'error' };
        }
    };

    const handleEnroll = async (courseId) => {
        if (!window.confirm('هل أنت متأكد من رغبتك في التقديم لهذه الدورة؟')) {
            return;
        }

        try {
            const response = await fetch(`/api/courses/${courseId}/enroll`, {
                method: 'POST'
            });
            const result = await response.json();
            setMessage({ text: result.message, isError: !response.ok });
            if (response.ok) {
                // Update the UI to reflect enrollment
                setCourses(prev => prev.filter(c => c.id !== courseId));
                // Auto-hide message after 3 seconds
                setTimeout(() => setMessage(null), 3000);
            }
        } catch (err) {
            setMessage({ text: 'حدث خطأ في الاتصال بالخادم.', isError: true });
        }
    };

    return (
        <div>
            <h1><i className="fas fa-home fa-fw"></i> مرحباً ولي الأمر، {user.full_name}</h1>
            <p>نظرة شاملة على أبنائك والدورات المتاحة</p>
            <hr />
            
            {/* Message Display */}
            {message && (
                <div className={`message-overlay ${message.isError ? 'error' : 'success'}`}>
                    <div className="message-content">
                        <p>{message.text}</p>
                        <button onClick={() => setMessage(null)}>إغلاق</button>
                    </div>
                </div>
            )}

            {/* إحصائيات سريعة */}
            <div className="stats-grid">
                <div className="stat-card clickable" onClick={() => window.location.href = '/courses'}>
                    <div className="stat-icon">
                        <i className="fas fa-graduation-cap"></i>
                    </div>
                    <div className="stat-content">
                        <h3>الدورات المتاحة</h3>
                        <p className="stat-number">{courses ? courses.length : '0'}</p>
                        <small><i className="fas fa-arrow-left"></i> انقر للعرض</small>
                    </div>
                </div>
                <div className="stat-card clickable" onClick={() => window.location.href = '/finance'}>
                    <div className="stat-icon">
                        <i className="fas fa-child"></i>
                    </div>
                    <div className="stat-content">
                        <h3>عدد الأبناء</h3>
                        <p className="stat-number">{children ? children.length : '0'}</p>
                        <small><i className="fas fa-arrow-left"></i> انقر للعرض</small>
                    </div>
                </div>
                <div className="stat-card clickable" onClick={() => window.location.href = '/messages'}>
                    <div className="stat-icon">
                        <i className="fas fa-envelope"></i>
                    </div>
                    <div className="stat-content">
                        <h3>الرسائل</h3>
                        <p className="stat-number">0</p>
                        <small><i className="fas fa-arrow-left"></i> انقر للعرض</small>
                    </div>
                </div>
                <div className="stat-card clickable" onClick={() => setIsModalOpen(true)}>
                    <div className="stat-icon">
                        <i className="fas fa-user-plus"></i>
                    </div>
                    <div className="stat-content">
                        <h3>إضافة ابن جديد</h3>
                        <p className="stat-number">+</p>
                        <small><i className="fas fa-arrow-left"></i> انقر للإضافة</small>
                    </div>
                </div>
            </div>

            {/* الأقسام التفصيلية */}
            <div className="dashboard-sections">
                {/* الدورات المتاحة */}
                <div className="dashboard-section">
                    <div className="section-header">
                        <h3><i className="fas fa-graduation-cap"></i> الدورات المتاحة لك</h3>
                        <Link href="/courses" className="view-all-link">
                            عرض الكل <i className="fas fa-arrow-left"></i>
                        </Link>
                    </div>
                    <div className="courses-list">
                        {courses && courses.length > 0 ? (
                            courses.slice(0, 4).map(course => (
                                <div key={course.id} className="course-item">
                                    <div className="course-icon">
                                        <i className="fas fa-book"></i>
                                    </div>
                                    <div className="course-info">
                                        <strong>{course.name}</strong>
                                        <div className="course-details">
                                            <span className="course-status">متاح</span>
                                            <span className="course-date">{new Date(course.created_at).toLocaleDateString('ar-SA')}</span>
                                        </div>
                                        <p className="course-description">{course.description}</p>
                                    </div>
                                    <div className="course-actions">
                                        <button onClick={() => handleEnroll(course.id)} className="btn-small">
                                            التقديم
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="no-data">لا توجد دورات متاحة حالياً</p>
                        )}
                    </div>
                </div>

                {/* متابعة الأبناء */}
                <div className="dashboard-section">
                    <div className="section-header">
                        <h3><i className="fas fa-child"></i> متابعة الأبناء</h3>
                        <button onClick={() => setIsModalOpen(true)} className="view-all-link" style={{background: 'none', border: 'none', cursor: 'pointer'}}>
                            إضافة ابن جديد <i className="fas fa-plus"></i>
                        </button>
                    </div>
                    <div className="children-list">
                        {children && children.length > 0 ? (
                            children.map(child => (
                                <div key={child.id} className="child-item">
                                    <div className="child-avatar">
                                        <i className="fas fa-user"></i>
                                    </div>
                                    <div className="child-info">
                                        <strong>{child.full_name}</strong>
                                        <div className="child-details">
                                            <span className="child-role">طالب</span>
                                            <span className="child-notes">{child.details?.parent_notes || 'لا توجد ملاحظات'}</span>
                                        </div>
                                    </div>
                                    <div className="child-actions">
                                        <Link href={`/parent/start-view-session?childId=${child.id}`} className="btn-small">
                                            عرض
                                        </Link>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="no-data">لم تقم بإضافة أي أبناء بعد</p>
                        )}
                    </div>
                </div>
            </div>
            <AddChildModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleAddChild}
            />

            <style jsx>{`
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 20px;
                    margin: 20px 0;
                }
                .stat-card {
                    background: white;
                    padding: 20px;
                    border-radius: 12px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.08);
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }
                .stat-icon {
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, var(--primary-color), #4a90e2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 1.5rem;
                }
                .stat-content h3 {
                    margin: 0 0 5px 0;
                    color: #333;
                    font-size: 1rem;
                }
                .stat-number {
                    font-size: 2rem;
                    font-weight: bold;
                    color: var(--primary-color);
                    margin: 5px 0;
                }
                .stat-card.clickable {
                    cursor: pointer;
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                .stat-card.clickable:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
                }
                .stat-card small {
                    color: #666;
                    font-size: 0.8rem;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                
                .dashboard-sections {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 30px;
                    margin-top: 30px;
                }
                
                .dashboard-section {
                    background: white;
                    border-radius: 12px;
                    padding: 25px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.08);
                }
                
                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 2px solid #f0f0f0;
                }
                
                .section-header h3 {
                    margin: 0;
                    color: var(--primary-color);
                    font-size: 1.2rem;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                
                .view-all-link {
                    color: var(--primary-color);
                    text-decoration: none;
                    font-size: 0.9rem;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    transition: color 0.2s;
                }
                
                .view-all-link:hover {
                    color: #004494;
                }
                
                .course-item, .child-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 15px;
                    padding: 15px 0;
                    border-bottom: 1px solid #f0f0f0;
                }
                
                .course-item:last-child, .child-item:last-child {
                    border-bottom: none;
                }
                
                .course-icon, .child-avatar {
                    width: 45px;
                    height: 45px;
                    border-radius: 50%;
                    background: #f8f9fa;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--primary-color);
                    font-size: 1.2rem;
                    flex-shrink: 0;
                }
                
                .course-info, .child-info {
                    flex: 1;
                }
                
                .course-info strong, .child-info strong {
                    display: block;
                    color: #333;
                    margin-bottom: 5px;
                }
                
                .course-details, .child-details {
                    display: flex;
                    gap: 15px;
                    font-size: 0.85rem;
                    margin-bottom: 8px;
                }
                
                .course-status, .child-role {
                    background: #e3f2fd;
                    color: #1976d2;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 0.75rem;
                }
                
                .course-date, .child-notes {
                    color: #666;
                }
                
                .course-description {
                    color: #666;
                    font-size: 0.9rem;
                    margin: 5px 0 0 0;
                    line-height: 1.4;
                }
                
                .btn-small {
                    background: var(--primary-color);
                    color: white;
                    padding: 6px 12px;
                    border-radius: 6px;
                    text-decoration: none;
                    font-size: 0.8rem;
                    transition: background 0.2s;
                    border: none;
                    cursor: pointer;
                }
                
                .btn-small:hover {
                    background: #004494;
                }
                
                .no-data {
                    text-align: center;
                    color: #666;
                    font-style: italic;
                    padding: 20px;
                }

                /* Modal Styles */
                .modal {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    position: fixed;
                    z-index: 1001;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0,0,0,0.5);
                }
                .modal-content {
                    background-color: #fefefe;
                    margin: 10% auto;
                    padding: 20px;
                    border-radius: 12px;
                    width: 80%;
                    max-width: 500px;
                    position: relative;
                    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
                }
                .close-button {
                    color: #aaa;
                    position: absolute;
                    left: 15px;
                    top: 10px;
                    font-size: 28px;
                    font-weight: bold;
                    cursor: pointer;
                }
                .message.success {
                    color: #155724;
                    background-color: #d4edda;
                    padding: 10px;
                    border-radius: 5px;
                    margin-bottom: 10px;
                    border: 1px solid #c3e6cb;
                }
                .message.error {
                    color: #721c24;
                    background-color: #f8d7da;
                    padding: 10px;
                    border-radius: 5px;
                    margin-bottom: 10px;
                    border: 1px solid #f5c6cb;
                }

                /* Message Overlay Styles */
                .message-overlay {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 1002;
                }
                .message-content {
                    padding: 15px 20px;
                    border-radius: 6px;
                    color: white;
                    max-width: 400px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                }
                .message-overlay.success .message-content {
                    background: #28a745;
                }
                .message-overlay.error .message-content {
                    background: #dc3545;
                }
                .message-content button {
                    background: transparent;
                    border: 1px solid white;
                    color: white;
                    padding: 8px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    margin-top: 10px;
                    transition: background 0.2s;
                }
                .message-content button:hover {
                    background: rgba(255,255,255,0.2);
                }
                
                @media (max-width: 768px) {
                    .stats-grid {
                        grid-template-columns: 1fr;
                    }
                    .dashboard-sections {
                        grid-template-columns: 1fr;
                    }
                    .stat-card {
                        flex-direction: column;
                        text-align: center;
                    }
                    .course-details, .child-details {
                        flex-direction: column;
                        gap: 5px;
                    }
                }
            `}</style>
        </div>
    );
};

export default ParentDashboard;
