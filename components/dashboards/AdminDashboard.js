import React from 'react';
import Link from 'next/link';

// Helper functions moved outside component to avoid re-creation on each render
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

const AdminDashboard = ({ user, stats, recentUsers, recentCourses, pendingRequests }) => {
    const [degreeMetrics, setDegreeMetrics] = React.useState(null);
    const [loadingMetrics, setLoadingMetrics] = React.useState(true);

    // Fetch degree enrollment metrics
    React.useEffect(() => {
        const fetchDegreeMetrics = async () => {
            try {
                const response = await fetch('/api/admin/degree-enrollment-metrics');
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        setDegreeMetrics(data.data);
                    } else {
                        console.error('Degree metrics API returned error:', data.message);
                    }
                } else {
                    console.error('Failed to fetch degree metrics:', response.status);
                }
            } catch (error) {
                console.error('Error fetching degree metrics:', error);
            } finally {
                setLoadingMetrics(false);
            }
        };

        fetchDegreeMetrics();
    }, []);

    // Debug logging to check what data is being received
    React.useEffect(() => {
        console.log('=== AdminDashboard Debug Info ===');
        console.log('Stats object:', stats);
        console.log('Total users from stats:', stats?.total_users);
        console.log('Total courses from stats:', stats?.total_courses);
        console.log('Active enrollments from stats:', stats?.active_enrollments);
        console.log('Recent users count:', recentUsers?.length);
        console.log('Recent courses count:', recentCourses?.length);
        console.log('================================');
    }, [stats, recentUsers, recentCourses]);

    // Handle navigation with proper error handling
    const handleNavigation = (url) => {
        try {
            window.location.href = url;
        } catch (error) {
            console.error('Navigation error:', error);
        }
    };

    // Validate and format statistics with debug info
    const getStatValue = (value, label) => {
        if (value === null || value === undefined) {
            console.warn(`${label} is null/undefined`);
            return '0';
        }
        if (typeof value === 'string') {
            console.warn(`${label} is a string: "${value}"`);
            // Try to convert string to number
            const parsed = parseInt(value, 10);
            return isNaN(parsed) ? '0' : parsed.toString();
        }
        if (typeof value === 'number') {
            return value.toString();
        }
        console.warn(`${label} has unexpected type:`, typeof value, value);
        return '0';
    };

    return (
        <div>
            <h1><i className="fas fa-tachometer-alt fa-fw"></i> لوحة تحكم الإدارة</h1>
            <p>نظرة شاملة على النظام والأنشطة الحديثة</p>
            <hr />
            
            {/* إحصائيات سريعة */}
            <div className="stats-grid">
                <div className="stat-card clickable" onClick={() => handleNavigation('/admin/users')}>
                    <div className="stat-icon">
                        <i className="fas fa-users"></i>
                    </div>
                    <div className="stat-content">
                        <h3>إجمالي المستخدمين</h3>
                        <p className="stat-number">{getStatValue(stats?.total_users, 'total_users')}</p>
                        <small>
                            <div>طلاب نشطين: {getStatValue(stats?.unique_active_students || stats?.total_students || stats?.activeStudents, 'active_students')}</div>
                            <div>معلمين: {getStatValue(stats?.total_teachers || stats?.teacherCount, 'total_teachers')}</div>
                            <div>مديرين: {getStatValue(stats?.total_admins || stats?.adminCount, 'admins')}</div>
                            <i className="fas fa-arrow-left"></i> انقر للعرض
                        </small>
                    </div>
                </div>
                <div className="stat-card clickable" onClick={() => handleNavigation('/admin/courses/manage')}>
                    <div className="stat-icon">
                        <i className="fas fa-graduation-cap"></i>
                    </div>
                    <div className="stat-content">
                        <h3>إجمالي الدورات</h3>
                        <p className="stat-number">{getStatValue(stats?.total_courses, 'total_courses')}</p>
                        <small>
                            <div>نشطة: {getStatValue(stats?.active_courses || stats?.activeCourses, 'active_courses')}</div>
                            <div>منشورة: {getStatValue(stats?.published_courses || stats?.publishedCourses, 'published_courses')}</div>
                            <div>مسودات: {getStatValue(stats?.draft_courses || stats?.draftCourses, 'draft_courses')}</div>
                            <i className="fas fa-arrow-left"></i> انقر للعرض
                        </small>
                    </div>
                </div>
                <div className="stat-card clickable" onClick={() => handleNavigation('/admin/enrollments')}>
                    <div className="stat-icon">
                        <i className="fas fa-user-graduate"></i>
                    </div>
                    <div className="stat-content">
                        <h3>التسجيلات النشطة</h3>
                        <p className="stat-number">{getStatValue(stats?.active_enrollments, 'active_enrollments')}</p>
                        <small>
                            <div>مكتملة: {getStatValue(stats?.completed_enrollments, 'completed_enrollments')}</div>
                            <div>معلقة الموافقة: {getStatValue(stats?.pending_enrollments, 'pending_enrollments')}</div>
                            <div>معلقة الدفع: {getStatValue(stats?.payment_pending_enrollments, 'payment_pending_enrollments')}</div>
                            <i className="fas fa-arrow-left"></i> انقر للعرض
                        </small>
                    </div>
                </div>
                <div className="stat-card clickable" onClick={() => handleNavigation('/finance')}>
                    <div className="stat-icon">
                        <i className="fas fa-money-bill-wave"></i>
                    </div>
                    <div className="stat-content">
                        <h3>المدفوعات المستحقة</h3>
                        <p className="stat-number">{getStatValue(stats?.pending_payments, 'pending_payments')}</p>
                        <small>
                            <div>مكتملة: {getStatValue(stats?.completed_payments, 'completed_payments')}</div>
                            <div>إجمالي الإيرادات: {stats?.total_revenue || '0'} ر.س</div>
                            <div>المبالغ المستحقة: {stats?.outstanding_amount || '0'} ر.س</div>
                            <i className="fas fa-arrow-left"></i> انقر للعرض
                        </small>
                    </div>
                </div>
                <div className="stat-card clickable" onClick={() => handleNavigation('/admin/requests')}>
                    <div className="stat-icon">
                        <i className="fas fa-user-edit"></i>
                    </div>
                    <div className="stat-content">
                        <h3>طلبات التعديل المعلقة</h3>
                        <p className="stat-number">{stats?.pending_requests || '0'}</p>
                        <small><i className="fas fa-arrow-left"></i> انقر للعرض</small>
                    </div>
                </div>
            </div>

            {/* Debug Info */}
            {process.env.NODE_ENV === 'development' && (
                <div style={{ background: '#fff3cd', padding: '15px', margin: '20px 0', borderRadius: '8px' }}>
                    <h4>🔧 Debug Info</h4>
                    <p>Loading Metrics: {loadingMetrics.toString()}</p>
                    <p>Degree Metrics: {degreeMetrics ? 'Loaded' : 'Not Loaded'}</p>
                    <p>Stats: {JSON.stringify(stats)}</p>
                </div>
            )}

            {/* Degree Enrollment Metrics */}
            {!loadingMetrics && degreeMetrics && (
                <div className="degree-metrics-section">
                    <h2><i className="fas fa-layer-group"></i> إحصائيات التسجيل بنظام الدرجات</h2>
                    
                    {/* Overall Degree Stats */}
                    <div className="degree-stats-grid">
                        <div className="degree-stat-card degree-1">
                            <div className="degree-icon">🎯</div>
                            <div className="degree-content">
                                <h3>{degreeMetrics.overallStats.total_degree_1_users || 0}</h3>
                                <p>درجة 1 - المشرفين</p>
                                <small>{degreeMetrics.overallStats.active_degree_1_enrollments || 0} تسجيل نشط</small>
                            </div>
                        </div>
                        <div className="degree-stat-card degree-2">
                            <div className="degree-icon">👨‍🏫</div>
                            <div className="degree-content">
                                <h3>{degreeMetrics.overallStats.total_degree_2_users || 0}</h3>
                                <p>درجة 2 - المعلمين</p>
                                <small>{degreeMetrics.overallStats.active_degree_2_enrollments || 0} تسجيل نشط</small>
                            </div>
                        </div>
                        <div className="degree-stat-card degree-3">
                            <div className="degree-icon">🎓</div>
                            <div className="degree-content">
                                <h3>{degreeMetrics.overallStats.total_degree_3_users || 0}</h3>
                                <p>درجة 3 - الطلاب</p>
                                <small>{degreeMetrics.overallStats.active_degree_3_enrollments || 0} تسجيل نشط</small>
                            </div>
                        </div>
                        <div className="degree-stat-card visibility">
                            <div className="degree-icon">👁️</div>
                            <div className="degree-content">
                                <h3>{degreeMetrics.overallStats.courses_visible_to_degree_3 || 0}</h3>
                                <p>دورات مرئية للطلاب</p>
                                <small>من أصل {degreeMetrics.overallStats.total_published_courses || 0} دورة منشورة</small>
                            </div>
                        </div>
                    </div>

                    {/* Course Enrollment Status Table */}
                    <div className="course-enrollment-table">
                        <h3>حالة التسجيل في الدورات</h3>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>اسم الدورة</th>
                                        <th>درجة 1</th>
                                        <th>درجة 2</th>
                                        <th>درجة 3</th>
                                        <th>الحالة</th>
                                        <th>مرئية للطلاب</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {degreeMetrics.courseMetrics.map(course => (
                                        <tr key={course.course_id}>
                                            <td>{course.course_name}</td>
                                            <td>
                                                <span className={`enrollment-count ${course.degree_1_enrolled > 0 ? 'has-enrollment' : 'no-enrollment'}`}>
                                                    {course.degree_1_enrolled}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`enrollment-count ${course.degree_2_enrolled > 0 ? 'has-enrollment' : 'no-enrollment'}`}>
                                                    {course.degree_2_enrolled}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`enrollment-count ${course.degree_3_enrolled > 0 ? 'has-enrollment' : 'no-enrollment'}`}>
                                                    {course.degree_3_enrolled}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`enrollment-stage ${course.enrollment_stage}`}>
                                                    {course.enrollment_stage === 'pending_publication' && '📝 في انتظار النشر'}
                                                    {course.enrollment_stage === 'waiting_for_staff' && '⏳ في انتظار الكادر'}
                                                    {course.enrollment_stage === 'waiting_for_supervisors' && '🎯 في انتظار المشرفين'}
                                                    {course.enrollment_stage === 'waiting_for_teachers' && '👨‍🏫 في انتظار المعلمين'}
                                                    {course.enrollment_stage === 'ready_for_students' && '✅ جاهزة للطلاب'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`visibility-status ${course.visible_to_degree_3 ? 'visible' : 'hidden'}`}>
                                                    {course.visible_to_degree_3 ? '👁️ مرئية' : '🚫 مخفية'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* إحصائيات تفصيلية شاملة */}
            <div className="detailed-stats">
                <div className="stats-section">
                    <h3><i className="fas fa-chart-bar"></i> تفصيل المستخدمين حسب الدور</h3>
                    <div className="stats-row">
                        <div className="stat-item">
                            <span className="stat-label">الطلاب (إجمالي):</span>
                            <span className="stat-value">{stats?.total_students || '0'}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">الطلاب النشطين:</span>
                            <span className="stat-value">{stats?.unique_active_students || '0'}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">المعلمين:</span>
                            <span className="stat-value">{stats?.total_teachers || '0'}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">أولياء الأمور:</span>
                            <span className="stat-value">{stats?.total_parents || '0'}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">العمال:</span>
                            <span className="stat-value">{stats?.total_workers || '0'}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">الماليين:</span>
                            <span className="stat-value">{stats?.total_finance || '0'}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">الرؤساء:</span>
                            <span className="stat-value">{stats?.total_heads || '0'}</span>
                        </div>
                    </div>
                </div>
                
                <div className="stats-section">
                    <h3><i className="fas fa-calendar-alt"></i> إحصائيات هذا الشهر</h3>
                    <div className="stats-row">
                        <div className="stat-item">
                            <span className="stat-label">مستخدمين جدد:</span>
                            <span className="stat-value">{stats?.new_users_this_month || '0'}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">دورات جديدة:</span>
                            <span className="stat-value">{stats?.new_courses_this_month || '0'}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">تسجيلات جديدة:</span>
                            <span className="stat-value">{stats?.new_enrollments_this_month || '0'}</span>
                        </div>
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

            <style jsx>{`
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 20px;
                    margin: 20px 0;
                }
                
                /* Degree Metrics Styles */
                .degree-metrics-section {
                    background: white;
                    border-radius: 12px;
                    padding: 25px;
                    margin: 30px 0;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.08);
                }
                .degree-metrics-section h2 {
                    color: #2c3e50;
                    margin-bottom: 20px;
                    font-size: 1.5rem;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .degree-stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    margin-bottom: 25px;
                }
                .degree-stat-card {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 10px;
                    padding: 20px;
                    color: white;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }
                .degree-stat-card.degree-1 {
                    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
                }
                .degree-stat-card.degree-2 {
                    background: linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%);
                }
                .degree-stat-card.degree-3 {
                    background: linear-gradient(135deg, #45b7d1 0%, #96c93d 100%);
                }
                .degree-stat-card.visibility {
                    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                }
                .degree-icon {
                    font-size: 2rem;
                    opacity: 0.9;
                }
                .degree-content h3 {
                    font-size: 1.8rem;
                    margin: 0;
                    font-weight: bold;
                }
                .degree-content p {
                    margin: 5px 0;
                    font-size: 0.9rem;
                    opacity: 0.9;
                }
                .degree-content small {
                    font-size: 0.75rem;
                    opacity: 0.8;
                }
                
                /* Course Enrollment Table */
                .course-enrollment-table {
                    margin-top: 25px;
                }
                .course-enrollment-table h3 {
                    color: #2c3e50;
                    margin-bottom: 15px;
                }
                .table-container {
                    overflow-x: auto;
                    border-radius: 8px;
                    border: 1px solid #e1e8ed;
                }
                .course-enrollment-table table {
                    width: 100%;
                    border-collapse: collapse;
                    background: white;
                }
                .course-enrollment-table th,
                .course-enrollment-table td {
                    padding: 12px 15px;
                    text-align: right;
                    border-bottom: 1px solid #e1e8ed;
                }
                .course-enrollment-table th {
                    background: #f8f9fa;
                    font-weight: 600;
                    color: #2c3e50;
                }
                .enrollment-count {
                    display: inline-block;
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 0.85rem;
                    font-weight: 600;
                }
                .enrollment-count.has-enrollment {
                    background: #d4edda;
                    color: #155724;
                }
                .enrollment-count.no-enrollment {
                    background: #f8d7da;
                    color: #721c24;
                }
                .enrollment-stage {
                    display: inline-block;
                    padding: 6px 12px;
                    border-radius: 15px;
                    font-size: 0.8rem;
                    font-weight: 500;
                }
                .enrollment-stage.pending_publication {
                    background: #e2e8f0;
                    color: #475569;
                }
                .enrollment-stage.waiting_for_staff {
                    background: #fff3cd;
                    color: #856404;
                }
                .enrollment-stage.waiting_for_supervisors {
                    background: #f8d7da;
                    color: #721c24;
                }
                .enrollment-stage.waiting_for_teachers {
                    background: #d1ecf1;
                    color: #0c5460;
                }
                .enrollment-stage.ready_for_students {
                    background: #d4edda;
                    color: #155724;
                }
                .visibility-status {
                    display: inline-block;
                    padding: 6px 12px;
                    border-radius: 15px;
                    font-size: 0.8rem;
                    font-weight: 500;
                }
                .visibility-status.visible {
                    background: #d4edda;
                    color: #155724;
                }
                .visibility-status.hidden {
                    background: #f8d7da;
                    color: #721c24;
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
                    font-size: 0.75rem;
                    line-height: 1.4;
                }
                
                .detailed-stats {
                    margin: 30px 0;
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                }
                
                .stats-section {
                    background: white;
                    padding: 20px;
                    border-radius: 12px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.08);
                }
                
                .stats-section h3 {
                    margin: 0 0 15px 0;
                    color: var(--primary-color);
                    font-size: 1.1rem;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                
                .stats-row {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 15px;
                }
                
                .stat-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: #f8f9fa;
                    padding: 10px 15px;
                    border-radius: 8px;
                    min-width: 150px;
                    flex: 1;
                }
                
                .stat-label {
                    color: #666;
                    font-size: 0.9rem;
                }
                
                .stat-value {
                    font-weight: bold;
                    color: var(--primary-color);
                    font-size: 1.1rem;
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
                    .detailed-stats {
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
};

export default AdminDashboard;