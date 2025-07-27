import React from 'react';
import Link from 'next/link';

const AdminDashboard = ({ user, stats, recentUsers, recentCourses, pendingRequests }) => {

    return (
        <div>
            <h1><i className="fas fa-tachometer-alt fa-fw"></i> لوحة تحكم الإدارة</h1>
            <p>نظرة شاملة على النظام والأنشطة الحديثة</p>
            <hr />
            
            {/* إحصائيات سريعة */}
            <div className="stats-grid">
                <div className="stat-card clickable" onClick={() => window.location.href = '/admin/users'}>
                    <div className="stat-icon">
                        <i className="fas fa-users"></i>
                    </div>
                    <div className="stat-content">
                        <h3>إجمالي المستخدمين</h3>
                        <p className="stat-number">{stats ? stats.total_users : '...'}</p>
                        <small><i className="fas fa-arrow-left"></i> انقر للعرض</small>
                    </div>
                </div>
                <div className="stat-card clickable" onClick={() => window.location.href = '/admin/courses/manage'}>
                    <div className="stat-icon">
                        <i className="fas fa-graduation-cap"></i>
                    </div>
                    <div className="stat-content">
                        <h3>إجمالي الدورات</h3>
                        <p className="stat-number">{stats ? stats.total_courses : '...'}</p>
                        <small><i className="fas fa-arrow-left"></i> انقر للعرض</small>
                    </div>
                </div>
                <div className="stat-card clickable" onClick={() => window.location.href = '/finance'}>
                    <div className="stat-icon">
                        <i className="fas fa-money-bill-wave"></i>
                    </div>
                    <div className="stat-content">
                        <h3>دفعات مستحقة</h3>
                        <p className="stat-number">{stats ? stats.pending_payments : '...'}</p>
                        <small><i className="fas fa-arrow-left"></i> انقر للعرض</small>
                    </div>
                </div>
                <div className="stat-card clickable" onClick={() => window.location.href = '/admin/requests'}>
                    <div className="stat-icon">
                        <i className="fas fa-user-edit"></i>
                    </div>
                    <div className="stat-content">
                        <h3>طلبات التعديل</h3>
                        <p className="stat-number">{stats ? stats.pending_requests : '...'}</p>
                        <small><i className="fas fa-arrow-left"></i> انقر للعرض</small>
                    </div>
                </div>
            </div>

            {/* الأقسام التفصيلية */}
            <div className="dashboard-sections">
                {/* المستخدمون الجدد */}
                <div className="dashboard-section">
                    <div className="section-header">
                        <h3><i className="fas fa-user-plus"></i> المستخدمون الجدد</h3>
                        <Link href="/admin/users" className="view-all-link">
                            عرض الكل <i className="fas fa-arrow-left"></i>
                        </Link>
                    </div>
                    <div className="users-list">
                        {recentUsers && recentUsers.length > 0 ? (
                            recentUsers.slice(0, 5).map(user => (
                                <div key={user.id} className="user-item">
                                    <div className="user-avatar">
                                        <i className="fas fa-user"></i>
                                    </div>
                                    <div className="user-info">
                                        <strong>{user.full_name}</strong>
                                        <div className="user-details">
                                            <span className="user-role">{getRoleText(user.role)}</span>
                                            <span className="user-date">{new Date(user.created_at).toLocaleDateString('ar-SA')}</span>
                                        </div>
                                    </div>
                                    <div className="user-actions">
                                        <Link href="/admin/users" className="btn-small">
                                            عرض
                                        </Link>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="no-data">لا توجد مستخدمون جدد</p>
                        )}
                    </div>
                </div>

                {/* الدورات الحديثة */}
                <div className="dashboard-section">
                    <div className="section-header">
                        <h3><i className="fas fa-book"></i> الدورات الحديثة</h3>
                        <Link href="/admin/courses/manage" className="view-all-link">
                            عرض الكل <i className="fas fa-arrow-left"></i>
                        </Link>
                    </div>
                    <div className="courses-list">
                        {recentCourses && recentCourses.length > 0 ? (
                            recentCourses.slice(0, 5).map(course => (
                                <div key={course.id} className="course-item">
                                    <div className="course-icon">
                                        <i className="fas fa-graduation-cap"></i>
                                    </div>
                                    <div className="course-info">
                                        <strong>{course.name}</strong>
                                        <div className="course-details">
                                            <span className="course-status">{getStatusText(course.status)}</span>
                                            <span className="course-date">{new Date(course.created_at).toLocaleDateString('ar-SA')}</span>
                                        </div>
                                    </div>
                                    <div className="course-actions">
                                        <Link href={`/admin/courses/${course.id}/schedule`} className="btn-small">
                                            جدولة
                                        </Link>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="no-data">لا توجد دورات حديثة</p>
                        )}
                    </div>
                </div>
            </div>

            {/* دوال مساعدة */}
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
                
                .user-item, .course-item {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    padding: 15px 0;
                    border-bottom: 1px solid #f0f0f0;
                }
                
                .user-item:last-child, .course-item:last-child {
                    border-bottom: none;
                }
                
                .user-avatar, .course-icon {
                    width: 45px;
                    height: 45px;
                    border-radius: 50%;
                    background: #f8f9fa;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--primary-color);
                    font-size: 1.2rem;
                }
                
                .user-info, .course-info {
                    flex: 1;
                }
                
                .user-info strong, .course-info strong {
                    display: block;
                    color: #333;
                    margin-bottom: 5px;
                }
                
                .user-details, .course-details {
                    display: flex;
                    gap: 15px;
                    font-size: 0.85rem;
                }
                
                .user-role, .course-status {
                    background: #e3f2fd;
                    color: #1976d2;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 0.75rem;
                }
                
                .user-date, .course-date {
                    color: #666;
                }
                
                .btn-small {
                    background: var(--primary-color);
                    color: white;
                    padding: 6px 12px;
                    border-radius: 6px;
                    text-decoration: none;
                    font-size: 0.8rem;
                    transition: background 0.2s;
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
                    .user-details, .course-details {
                        flex-direction: column;
                        gap: 5px;
                    }
                }
            `}</style>

        </div>
    );

    // دوال مساعدة
    function getRoleText(role) {
        const roles = {
            'admin': 'مدير',
            'teacher': 'معلم',
            'student': 'طالب',
            'parent': 'ولي أمر',
            'head': 'رئيس قسم',
            'finance': 'مالية',
            'worker': 'عامل'
        };
        return roles[role] || role;
    }

    function getStatusText(status) {
        const statuses = {
            'active': 'نشط',
            'pending': 'في الانتظار',
            'completed': 'مكتمل',
            'waiting_start': 'في انتظار البدء'
        };
        return statuses[status] || status;
    }
};

export default AdminDashboard;
