import React, { useState } from 'react';
import Link from 'next/link';

const WorkerDashboard = ({ user, stats, assignedTasks, recentNotifications, workSchedule, enrolledCourses, courses }) => {
    const [activeTab, setActiveTab] = useState('overview');

    const getSpecializationIcon = (specialization) => {
        const icons = {
            'معلم': 'fas fa-chalkboard-teacher',
            'مدرب': 'fas fa-dumbbell',
            'مشرف حلقة': 'fas fa-users',
            'مسؤول بيانات الطلاب': 'fas fa-user-graduate',
            'مسؤول بيانات العاملين': 'fas fa-id-card',
            'مصمم تسويقي': 'fas fa-palette',
            'مصمم كتاب علمي': 'fas fa-book',
            'منتج علمي': 'fas fa-flask',
            'باحث علمي': 'fas fa-search',
            'مدير مالي': 'fas fa-calculator',
            'مدير اقتصادي': 'fas fa-chart-line',
            'دعم المكتبة': 'fas fa-book-reader',
            'خدمة عملاء': 'fas fa-headset',
            'مبرمج': 'fas fa-code',
            'رئيس قسم': 'fas fa-sitemap',
            'إدارة عليا': 'fas fa-crown'
        };
        return icons[specialization] || 'fas fa-briefcase';
    };

    const getTaskPriorityColor = (priority) => {
        const colors = {
            'high': '#dc3545',
            'medium': '#ffc107',
            'low': '#28a745'
        };
        return colors[priority] || '#6c757d';
    };

    const getTaskStatusColor = (status) => {
        const colors = {
            'pending': '#ffc107',
            'in_progress': '#17a2b8',
            'completed': '#28a745',
            'overdue': '#dc3545'
        };
        return colors[status] || '#6c757d';
    };

    return (
        <div className="worker-dashboard">
            <style jsx>{`
                .worker-dashboard {
                    animation: fadeIn 0.5s ease-in-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .dashboard-header {
                    background: linear-gradient(135deg, #6f42c1 0%, #007bff 100%);
                    color: white;
                    padding: 30px;
                    border-radius: 12px;
                    margin-bottom: 30px;
                    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
                }
                .dashboard-header h1 {
                    margin: 0 0 10px 0;
                    font-size: 2.2rem;
                }
                .dashboard-header p {
                    margin: 5px 0;
                    opacity: 0.9;
                }
                .specializations {
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                    margin-top: 15px;
                }
                .specialization-badge {
                    background: rgba(255,255,255,0.2);
                    padding: 5px 12px;
                    border-radius: 20px;
                    font-size: 0.85rem;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                .dashboard-tabs {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 30px;
                    border-bottom: 2px solid #f0f0f0;
                }
                .tab-button {
                    background: none;
                    border: none;
                    padding: 12px 20px;
                    cursor: pointer;
                    border-bottom: 3px solid transparent;
                    transition: all 0.3s ease;
                    font-size: 1rem;
                    color: #666;
                }
                .tab-button.active {
                    color: #6f42c1;
                    border-bottom-color: #6f42c1;
                    font-weight: bold;
                }
                .tab-button:hover {
                    color: #6f42c1;
                }
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }
                .stat-card {
                    background: #fff;
                    padding: 25px;
                    border-radius: 12px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.08);
                    text-align: center;
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                    border-left: 4px solid #6f42c1;
                }
                .stat-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
                }
                .stat-card .icon {
                    font-size: 2.5rem;
                    color: #6f42c1;
                    margin-bottom: 15px;
                }
                .stat-card h3 {
                    font-size: 2rem;
                    margin: 0 0 10px 0;
                    color: #333;
                }
                .stat-card p {
                    color: #666;
                    margin: 0;
                }
                .content-grid {
                    display: grid;
                    grid-template-columns: 2fr 1fr;
                    gap: 30px;
                }
                .main-content, .sidebar-content {
                    background: #fff;
                    padding: 25px;
                    border-radius: 12px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.08);
                }
                .section-title {
                    color: #333;
                    margin-bottom: 20px;
                    padding-bottom: 10px;
                    border-bottom: 2px solid #6f42c1;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .task-list {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }
                .task-item {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    border-left: 4px solid #6f42c1;
                    transition: all 0.3s ease;
                }
                .task-item:hover {
                    background: #e9ecef;
                    transform: translateX(5px);
                }
                .task-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 10px;
                }
                .task-title {
                    font-weight: bold;
                    color: #333;
                    margin: 0;
                }
                .task-badges {
                    display: flex;
                    gap: 8px;
                }
                .task-badge {
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 0.75rem;
                    font-weight: bold;
                    color: white;
                }
                .task-description {
                    color: #666;
                    margin: 10px 0;
                    line-height: 1.5;
                }
                .task-meta {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 0.85rem;
                    color: #888;
                }
                .notification-item {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 10px;
                    border-left: 3px solid #17a2b8;
                }
                .notification-item.unread {
                    background: #e3f2fd;
                    border-left-color: #2196f3;
                }
                .notification-title {
                    font-weight: bold;
                    color: #333;
                    margin-bottom: 5px;
                }
                .notification-time {
                    font-size: 0.8rem;
                    color: #888;
                }
                .schedule-item {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 10px;
                    border-left: 3px solid #28a745;
                }
                .schedule-time {
                    font-weight: bold;
                    color: #28a745;
                }
                .schedule-title {
                    color: #333;
                    margin: 5px 0;
                }
                .schedule-location {
                    font-size: 0.85rem;
                    color: #666;
                }
                .quick-actions {
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                    margin-top: 20px;
                }
                .action-btn {
                    background: #6f42c1;
                    color: white;
                    padding: 10px 15px;
                    border: none;
                    border-radius: 6px;
                    text-decoration: none;
                    font-size: 0.9rem;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    transition: background 0.3s ease;
                }
                .action-btn:hover {
                    background: #5a32a3;
                    color: white;
                }
                .empty-state {
                    text-align: center;
                    color: #666;
                    padding: 40px;
                    font-style: italic;
                }
                .courses-list {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }
                .course-item {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    border-left: 4px solid #6f42c1;
                    transition: all 0.3s ease;
                }
                .course-item:hover {
                    background: #e9ecef;
                    transform: translateX(5px);
                }
                .course-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 10px;
                }
                .course-title {
                    font-weight: bold;
                    color: #333;
                    margin: 0;
                    font-size: 1.1rem;
                }
                .course-badges {
                    display: flex;
                    gap: 8px;
                }
                .course-badge {
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 0.75rem;
                    font-weight: bold;
                }
                .course-description {
                    color: #666;
                    margin: 10px 0;
                    line-height: 1.5;
                }
                .course-meta {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 0.85rem;
                    color: #888;
                    margin-bottom: 15px;
                }
                .course-actions {
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                }
                @media (max-width: 768px) {
                    .content-grid {
                        grid-template-columns: 1fr;
                    }
                    .dashboard-tabs {
                        overflow-x: auto;
                        white-space: nowrap;
                    }
                }
            `}</style>

            <div className="dashboard-header">
                <h1><i className="fas fa-briefcase fa-fw"></i> مرحباً، {user.full_name}</h1>
                <p>لوحة تحكم العامل - مركز الإقامة</p>
                <p>البريد الإلكتروني: {user.email}</p>
                {user.details?.workerSpecializations && user.details?.workerSpecializations.length > 0 && (
                    <div className="specializations">
                        {user.details?.workerSpecializations.map((spec, index) => (
                            <div key={index} className="specialization-badge">
                                <i className={getSpecializationIcon(spec)}></i>
                                {spec}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="dashboard-tabs">
                <button 
                    className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    <i className="fas fa-tachometer-alt"></i> نظرة عامة
                </button>
                <button 
                    className={`tab-button ${activeTab === 'tasks' ? 'active' : ''}`}
                    onClick={() => setActiveTab('tasks')}
                >
                    <i className="fas fa-tasks"></i> المهام
                </button>
                <button 
                    className={`tab-button ${activeTab === 'schedule' ? 'active' : ''}`}
                    onClick={() => setActiveTab('schedule')}
                >
                    <i className="fas fa-calendar"></i> الجدول
                </button>
                <button 
                    className={`tab-button ${activeTab === 'courses' ? 'active' : ''}`}
                    onClick={() => setActiveTab('courses')}
                >
                    <i className="fas fa-graduation-cap"></i> دوراتي
                </button>
                <button 
                    className={`tab-button ${activeTab === 'performance' ? 'active' : ''}`}
                    onClick={() => setActiveTab('performance')}
                >
                    <i className="fas fa-chart-bar"></i> الأداء
                </button>
            </div>

            {activeTab === 'overview' && (
                <>
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="icon"><i className="fas fa-tasks"></i></div>
                            <h3>{stats?.pending_tasks || 0}</h3>
                            <p>المهام المعلقة</p>
                        </div>
                        <div className="stat-card">
                            <div className="icon"><i className="fas fa-check-circle"></i></div>
                            <h3>{stats?.completed_tasks || 0}</h3>
                            <p>المهام المكتملة</p>
                        </div>
                        <div className="stat-card">
                            <div className="icon"><i className="fas fa-clock"></i></div>
                            <h3>{stats?.hours_this_week || 0}</h3>
                            <p>ساعات العمل هذا الأسبوع</p>
                        </div>
                        <div className="stat-card">
                            <div className="icon"><i className="fas fa-star"></i></div>
                            <h3>{stats?.performance_rating || 'N/A'}</h3>
                            <p>تقييم الأداء</p>
                        </div>
                    </div>

                    <div className="content-grid">
                        <div className="main-content">
                            <h2 className="section-title">
                                <i className="fas fa-clipboard-list"></i>
                                المهام الحديثة
                            </h2>
                            {assignedTasks && assignedTasks.length > 0 ? (
                                <div className="task-list">
                                    {assignedTasks.slice(0, 5).map(task => (
                                        <div key={task.id} className="task-item">
                                            <div className="task-header">
                                                <h4 className="task-title">{task.title}</h4>
                                                <div className="task-badges">
                                                    <span 
                                                        className="task-badge" 
                                                        style={{ backgroundColor: getTaskPriorityColor(task.priority) }}
                                                    >
                                                        {task.priority === 'high' ? 'عالية' : 
                                                         task.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                                                    </span>
                                                    <span 
                                                        className="task-badge" 
                                                        style={{ backgroundColor: getTaskStatusColor(task.status) }}
                                                    >
                                                        {task.status === 'pending' ? 'معلقة' :
                                                         task.status === 'in_progress' ? 'قيد التنفيذ' :
                                                         task.status === 'completed' ? 'مكتملة' : 'متأخرة'}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="task-description">{task.description}</p>
                                            <div className="task-meta">
                                                <span>تاريخ الاستحقاق: {new Date(task.due_date).toLocaleDateString('ar-EG')}</span>
                                                <span>المشرف: {task.supervisor_name}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <i className="fas fa-clipboard-check fa-3x" style={{ color: '#ddd', marginBottom: '15px' }}></i>
                                    <p>لا توجد مهام حالياً</p>
                                </div>
                            )}
                            
                            <div className="quick-actions">
                                <Link href="/worker/tasks" className="action-btn">
                                    <i className="fas fa-list"></i> عرض جميع المهام
                                </Link>
                                <Link href="/worker/reports" className="action-btn">
                                    <i className="fas fa-file-alt"></i> تقرير يومي
                                </Link>
                            </div>
                        </div>

                        <div className="sidebar-content">
                            <h3 className="section-title">
                                <i className="fas fa-bell"></i>
                                الإشعارات
                            </h3>
                            {recentNotifications && recentNotifications.length > 0 ? (
                                recentNotifications.slice(0, 5).map(notification => (
                                    <div key={notification.id} className={`notification-item ${!notification.read ? 'unread' : ''}`}>
                                        <div className="notification-title">{notification.title}</div>
                                        <p>{notification.message}</p>
                                        <div className="notification-time">
                                            {new Date(notification.created_at).toLocaleDateString('ar-EG')}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="empty-state">
                                    <p>لا توجد إشعارات جديدة</p>
                                </div>
                            )}

                            <h3 className="section-title" style={{ marginTop: '30px' }}>
                                <i className="fas fa-calendar-day"></i>
                                جدول اليوم
                            </h3>
                            {workSchedule && workSchedule.length > 0 ? (
                                workSchedule.map(item => (
                                    <div key={item.id} className="schedule-item">
                                        <div className="schedule-time">{item.time}</div>
                                        <div className="schedule-title">{item.title}</div>
                                        <div className="schedule-location">{item.location}</div>
                                    </div>
                                ))
                            ) : (
                                <div className="empty-state">
                                    <p>لا توجد مواعيد اليوم</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {activeTab === 'tasks' && (
                <div className="main-content">
                    <h2 className="section-title">
                        <i className="fas fa-tasks"></i>
                        جميع المهام المكلف بها
                    </h2>
                    {assignedTasks && assignedTasks.length > 0 ? (
                        <div className="task-list">
                            {assignedTasks.map(task => (
                                <div key={task.id} className="task-item">
                                    <div className="task-header">
                                        <h4 className="task-title">{task.title}</h4>
                                        <div className="task-badges">
                                            <span 
                                                className="task-badge" 
                                                style={{ backgroundColor: getTaskPriorityColor(task.priority) }}
                                            >
                                                {task.priority === 'high' ? 'عالية' : 
                                                 task.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                                            </span>
                                            <span 
                                                className="task-badge" 
                                                style={{ backgroundColor: getTaskStatusColor(task.status) }}
                                            >
                                                {task.status === 'pending' ? 'معلقة' :
                                                 task.status === 'in_progress' ? 'قيد التنفيذ' :
                                                 task.status === 'completed' ? 'مكتملة' : 'متأخرة'}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="task-description">{task.description}</p>
                                    <div className="task-meta">
                                        <span>تاريخ الاستحقاق: {new Date(task.due_date).toLocaleDateString('ar-EG')}</span>
                                        <span>المشرف: {task.supervisor_name}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <i className="fas fa-clipboard-check fa-3x" style={{ color: '#ddd', marginBottom: '15px' }}></i>
                            <p>لا توجد مهام مكلف بها حالياً</p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'schedule' && (
                <div className="main-content">
                    <h2 className="section-title">
                        <i className="fas fa-calendar-alt"></i>
                        جدول العمل الأسبوعي
                    </h2>
                    <div className="empty-state">
                        <i className="fas fa-calendar fa-3x" style={{ color: '#ddd', marginBottom: '15px' }}></i>
                        <p>سيتم إضافة جدول العمل الأسبوعي قريباً</p>
                    </div>
                </div>
            )}

            {activeTab === 'courses' && (
                <div className="main-content">
                    <h2 className="section-title">
                        <i className="fas fa-graduation-cap"></i>
                        دوراتي المسجل بها
                    </h2>
                    {enrolledCourses && enrolledCourses.length > 0 ? (
                        <div className="courses-list">
                            {enrolledCourses.map(course => (
                                <div key={course.id} className="course-item">
                                    <div className="course-header">
                                        <h4 className="course-title">{course.name}</h4>
                                        <div className="course-badges">
                                            <span 
                                                className="course-badge" 
                                                style={{ 
                                                    backgroundColor: course.enrollment_status === 'pending_approval' ? '#6f42c1' : 
                                                                   course.enrollment_status === 'pending_payment' ? '#ffc107' : '#28a745',
                                                    color: 'white'
                                                }}
                                            >
                                                {course.enrollment_status === 'pending_approval' ? 'في انتظار الموافقة' :
                                                 course.enrollment_status === 'pending_payment' ? 'في انتظار الدفع' : 'نشطة'}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="course-description">{course.description}</p>
                                    <div className="course-meta">
                                        <span>تاريخ التسجيل: {new Date(course.enrollment_date).toLocaleDateString('ar-EG')}</span>
                                        {course.start_date && (
                                            <span>تاريخ البداية: {new Date(course.start_date).toLocaleDateString('ar-EG')}</span>
                                        )}
                                    </div>
                                    <div className="course-actions">
                                        <Link href={`/courses/${course.id}`} className="action-btn">
                                            <i className="fas fa-eye"></i> عرض التفاصيل
                                        </Link>
                                        {(course.enrollment_status === 'pending_approval' || course.enrollment_status === 'pending_payment') && (
                                            <Link href="/courses" className="action-btn" style={{ background: '#dc3545' }}>
                                                <i className="fas fa-times"></i> إلغاء التسجيل
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <i className="fas fa-graduation-cap fa-3x" style={{ color: '#ddd', marginBottom: '15px' }}></i>
                            <p>لم تسجل في أي دورات بعد</p>
                            <Link href="/courses" className="action-btn">
                                <i className="fas fa-plus"></i> تصفح الدورات المتاحة
                            </Link>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'performance' && (
                <div className="main-content">
                    <h2 className="section-title">
                        <i className="fas fa-chart-bar"></i>
                        تقييم الأداء والإحصائيات
                    </h2>
                    <div className="empty-state">
                        <i className="fas fa-chart-line fa-3x" style={{ color: '#ddd', marginBottom: '15px' }}></i>
                        <p>سيتم إضافة تقارير الأداء والإحصائيات قريباً</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkerDashboard;