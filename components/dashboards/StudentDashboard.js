import React, { useState } from 'react';
import Link from 'next/link';
import DailyCommitments from '../DailyCommitments';

const StudentDashboard = ({ user, tasks, courses, commitments: initialCommitments }) => {
    const [commitments, setCommitments] = useState(initialCommitments || {});

    const commitmentItems = {
        prayers: 'الصلوات الخمس في وقتها',
        athkar_morning: 'أذكار الصباح',
        athkar_evening: 'أذكار المساء',
        quran_wird: 'الورد القرآني'
    };

    const handleCommitmentChange = async (e) => {
        const { name, checked } = e.target;
        const oldCommitments = commitments;
        
        // Optimistic UI update
        setCommitments(prev => ({ ...prev, [name]: checked }));

        try {
            await fetch('/api/commitments/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ commitment: name, status: checked })
            });
        } catch (err) {
            // Revert on error
            setCommitments(oldCommitments);
            alert('حدث خطأ، يرجى المحاولة مرة أخرى.');
        }
    };

    return (
        <div>
            <h1><i className="fas fa-graduation-cap fa-fw"></i> مرحبا بك أيها الطالب، {user.full_name}</h1>
            <p>نظرة شاملة على مهامك ودوراتك والتزاماتك اليومية</p>
            <hr />

            {/* إحصائيات سريعة */}
            <div className="stats-grid">
                <div className="stat-card clickable" onClick={() => window.location.href = '/student/tasks'}>
                    <div className="stat-icon">
                        <i className="fas fa-tasks"></i>
                    </div>
                    <div className="stat-content">
                        <h3>المهام العاجلة</h3>
                        <p className="stat-number">{tasks ? tasks.length : '0'}</p>
                        <small><i className="fas fa-arrow-left"></i> انقر للعرض</small>
                    </div>
                </div>
                <div className="stat-card clickable" onClick={() => window.location.href = '/courses'}>
                    <div className="stat-icon">
                        <i className="fas fa-book"></i>
                    </div>
                    <div className="stat-content">
                        <h3>دوراتي الحالية</h3>
                        <p className="stat-number">{courses ? courses.length : '0'}</p>
                        <small><i className="fas fa-arrow-left"></i> انقر للعرض</small>
                    </div>
                </div>
                <div className="stat-card clickable" onClick={() => window.location.href = '/performance'}>
                    <div className="stat-icon">
                        <i className="fas fa-chart-line"></i>
                    </div>
                    <div className="stat-content">
                        <h3>الأداء</h3>
                        <p className="stat-number">85%</p>
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
            </div>

            {/* الالتزامات اليومية */}
            <div className="dashboard-section commitment-section">
                <DailyCommitments user={user} initialCommitments={commitments} />
            </div>

            {/* الأقسام التفصيلية */}
            <div className="dashboard-sections">
                {/* المهام العاجلة */}
                <div className="dashboard-section">
                    <div className="section-header">
                        <h3><i className="fas fa-tasks"></i> المهام العاجلة</h3>
                        <Link href="/student/tasks" className="view-all-link">
                            عرض الكل <i className="fas fa-arrow-left"></i>
                        </Link>
                    </div>
                    <div className="tasks-list">
                        {tasks && tasks.length > 0 ? (
                            tasks.slice(0, 5).map(task => (
                                <div key={task.id} className="task-item">
                                    <div className="task-icon">
                                        <i className="fas fa-clipboard-check"></i>
                                    </div>
                                    <div className="task-info">
                                        <strong>{task.title}</strong>
                                        <div className="task-details">
                                            <span className="task-type">{task.type || 'مهمة'}</span>
                                            <span className="task-date">المستحق: {new Date(task.due_date).toLocaleDateString('ar-SA')}</span>
                                        </div>
                                    </div>
                                    <div className="task-actions">
                                        <Link href={`/courses/submit/${task.id}`} className="btn-small">
                                            إنجاز
                                        </Link>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="no-data">لا توجد مهام عاجلة. أحسنت!</p>
                        )}
                    </div>
                </div>

                {/* الدورات الحالية */}
                <div className="dashboard-section">
                    <div className="section-header">
                        <h3><i className="fas fa-book"></i> دوراتي الحالية</h3>
                        <Link href="/courses" className="view-all-link">
                            عرض الكل <i className="fas fa-arrow-left"></i>
                        </Link>
                    </div>
                    <div className="courses-list">
                        {courses && courses.length > 0 ? (
                            courses.map(course => (
                                <div key={course.id} className="course-item">
                                    <div className="course-icon">
                                        <i className="fas fa-graduation-cap"></i>
                                    </div>
                                    <div className="course-info">
                                        <strong>{course.name}</strong>
                                        <div className="course-details">
                                            <span className="course-status">{getStatusText(course.status)}</span>
                                        </div>
                                    </div>
                                    <div className="course-actions">
                                        <Link href={`/courses/${course.id}`} className="btn-small">
                                            دخول
                                        </Link>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="no-data">أنت غير مسجل في أي دورات حالياً</p>
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
                
                .commitment-section {
                    background: white;
                    border-radius: 12px;
                    padding: 25px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.08);
                    margin: 20px 0;
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
                
                .task-item, .course-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 15px;
                    padding: 15px 0;
                    border-bottom: 1px solid #f0f0f0;
                }
                
                .task-item:last-child, .course-item:last-child {
                    border-bottom: none;
                }
                
                .task-icon, .course-icon {
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
                
                .task-info, .course-info {
                    flex: 1;
                }
                
                .task-info strong, .course-info strong {
                    display: block;
                    color: #333;
                    margin-bottom: 5px;
                }
                
                .task-details, .course-details {
                    display: flex;
                    gap: 15px;
                    font-size: 0.85rem;
                    margin-bottom: 8px;
                }
                
                .task-type, .course-status {
                    background: #e3f2fd;
                    color: #1976d2;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 0.75rem;
                }
                
                .task-date {
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
                    .task-details, .course-details {
                        flex-direction: column;
                        gap: 5px;
                    }
                }
            `}</style>
        </div>
    );

    // Helper function for status text
    function getStatusText(status) {
        const statuses = {
            'active': 'نشط',
            'pending': 'في الانتظار',
            'pending_payment': 'في انتظار الدفع',
            'completed': 'مكتمل',
            'waiting_start': 'في انتظار البدء'
        };
        return statuses[status] || status;
    }
};

export default StudentDashboard;
