import React from 'react';
import Link from 'next/link';
import TaskManagement from '../TaskManagement';

const TeacherDashboard = ({ user, courses, stats }) => {
    return (
        <div className="dashboard-content">
            <style jsx>{`
                .dashboard-content {
                    animation: fadeIn 0.5s ease-in-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
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
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                    text-align: center;
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                }
                .stat-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 8px 20px rgba(0,0,0,0.12);
                }
                .stat-card .icon {
                    font-size: 2.5rem;
                    color: #17a2b8;
                    margin-bottom: 15px;
                    line-height: 1;
                }
                .stat-card h3 {
                    font-size: 2.5rem;
                    margin: 0 0 10px 0;
                    color: #333;
                }
                .stat-card p {
                    font-size: 1rem;
                    color: #666;
                    margin: 0;
                }
                .quick-actions {
                    background: #fff;
                    padding: 25px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                    margin-bottom: 30px;
                }
                .quick-actions h2 {
                    border-bottom: 2px solid #17a2b8;
                    padding-bottom: 10px;
                    margin-bottom: 20px;
                }
                .action-buttons {
                    display: flex;
                    gap: 15px;
                    flex-wrap: wrap;
                }
                .action-btn {
                    background-color: #17a2b8;
                    color: white;
                    padding: 12px 20px;
                    border: none;
                    border-radius: 5px;
                    text-decoration: none;
                    font-size: 1rem;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    transition: background-color 0.3s ease;
                }
                .action-btn:hover {
                    background-color: #138496;
                }
                .tasks-section, .courses-section {
                    background: #fff;
                    padding: 25px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                    margin-bottom: 30px;
                }
                .courses-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 20px;
                    margin-top: 20px;
                }
                .course-card {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    border-left: 4px solid #17a2b8;
                    transition: transform 0.2s ease;
                }
                .course-card:hover {
                    transform: translateY(-2px);
                }
                .course-card h3 {
                    margin: 0 0 10px 0;
                    color: #333;
                }
                .course-card p {
                    color: #666;
                    margin: 5px 0;
                }
                .course-card a {
                    color: #17a2b8;
                    text-decoration: none;
                    font-weight: bold;
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    margin-top: 10px;
                }
                .course-card a:hover {
                    color: #138496;
                }
                .no-courses {
                    text-align: center;
                    color: #666;
                    font-style: italic;
                    padding: 40px;
                }
            `}</style>
            
            <h1><i className="fas fa-chalkboard-teacher fa-fw"></i> أهلاً بك أيها المعلم، {user.full_name}</h1>
            <p>مرحباً بك في لوحة تحكم المعلم. هنا يمكنك إدارة دوراتك ومتابعة طلابك.</p>
            
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="icon"><i className="fas fa-book-open"></i></div>
                    <h3>{courses ? courses.length : 0}</h3>
                    <p>الدورات المكلف بها</p>
                </div>
                <div className="stat-card">
                    <div className="icon"><i className="fas fa-user-graduate"></i></div>
                    <h3>{stats?.total_students || 0}</h3>
                    <p>إجمالي الطلاب</p>
                </div>
                <div className="stat-card">
                    <div className="icon"><i className="fas fa-tasks"></i></div>
                    <h3>{stats?.pending_tasks || 0}</h3>
                    <p>المهام المعلقة</p>
                </div>
                <div className="stat-card">
                    <div className="icon"><i className="fas fa-star"></i></div>
                    <h3>{stats?.average_rating || '4.5'}</h3>
                    <p>متوسط التقييم</p>
                </div>
            </div>

            <div className="quick-actions">
                <h2>إجراءات سريعة</h2>
                <div className="action-buttons">
                    <Link href="/teacher/tasks" className="action-btn">
                        <i className="fas fa-plus"></i> إنشاء مهمة جديدة
                    </Link>
                    <Link href="/teacher/gradebook" className="action-btn">
                        <i className="fas fa-clipboard-list"></i> دفتر الدرجات
                    </Link>
                    <Link href="/messages" className="action-btn">
                        <i className="fas fa-envelope"></i> الرسائل
                    </Link>
                </div>
            </div>

            {/* إدارة المهام المتقدمة */}
            <div className="tasks-section">
                <h2><i className="fas fa-tasks"></i> إدارة المهام</h2>
                <TaskManagement userRole="teacher" userId={user.id} />
            </div>

            <div className="courses-section">
                <h2><i className="fas fa-chalkboard-teacher"></i> الدورات المكلف بها</h2>
                {courses && courses.length > 0 ? (
                    <div className="courses-grid">
                        {courses.map(course => (
                            <div className="course-card" key={course.id}>
                                <h3>{course.name}</h3>
                                <p><i className="fas fa-users"></i> عدد الطلاب: {course.student_count || 0}</p>
                                <p><i className="fas fa-calendar"></i> حالة الدورة: {course.status || 'نشطة'}</p>
                                <Link href={`/teacher/course/${course.id}`}>
                                    <i className="fas fa-arrow-left"></i> إدارة الطلاب والدرجات
                                </Link>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="no-courses">
                        <i className="fas fa-book-open" style={{fontSize: '3rem', color: '#ddd', marginBottom: '15px'}}></i>
                        <p>أنت غير مكلف بأي دورات حالياً.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeacherDashboard;
