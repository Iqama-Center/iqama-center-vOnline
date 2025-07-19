import React, { useState, useEffect, useCallback } from 'react';
import { ChartBarIcon, UserGroupIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const CourseProgressDashboard = ({ courseId, userRole = 'student' }) => {
    const [progressData, setProgressData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedLevel, setSelectedLevel] = useState('all');

    const fetchCourseProgress = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/courses/${courseId}/progress`);
            const data = await response.json();
            
            if (data.success) {
                setProgressData(data);
            } else {
                setError(data.message || 'Failed to fetch progress data');
            }
        } catch (err) {
            setError('Error fetching course progress');
            console.error('Error fetching course progress:', err);
        } finally {
            setLoading(false);
        }
    }, [courseId]);

    useEffect(() => {
        if (courseId) {
            fetchCourseProgress();
        }
    }, [courseId, fetchCourseProgress]);

    const triggerEvaluation = async () => {
        try {
            const response = await fetch('/api/courses/evaluate-performance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    courseId,
                    evaluateAll: ['admin', 'head', 'teacher'].includes(userRole)
                })
            });

            const result = await response.json();
            if (result.success) {
                // Refresh progress data
                fetchCourseProgress();
                alert('تم تحديث التقييمات بنجاح');
            } else {
                alert('خطأ في تحديث التقييمات: ' + result.message);
            }
        } catch (error) {
            console.error('Error triggering evaluation:', error);
            alert('خطأ في تحديث التقييمات');
        }
    };

    if (loading) {
        return (
            <div className="course-progress-dashboard loading">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>جاري تحميل بيانات التقدم...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="course-progress-dashboard error">
                <div className="error-message">
                    <p>❌ {error}</p>
                    <button onClick={fetchCourseProgress} className="retry-btn">
                        إعادة المحاولة
                    </button>
                </div>
            </div>
        );
    }

    if (!progressData) {
        return (
            <div className="course-progress-dashboard no-data">
                <p>لا توجد بيانات متاحة</p>
            </div>
        );
    }

    const { course, progress, levelStats, dailyProgress, recentActivity } = progressData;

    return (
        <div className="course-progress-dashboard">
            {/* Course Header */}
            <div className="dashboard-header">
                <div className="course-info">
                    <h2>{course.name}</h2>
                    <div className="course-status">
                        <span className={`status-badge ${course.status}`}>
                            {course.status === 'active' ? 'نشط' : 
                             course.status === 'published' ? 'منشور' : 
                             course.status === 'draft' ? 'مسودة' : course.status}
                        </span>
                        {course.is_launched && (
                            <span className="launched-badge">تم الإطلاق</span>
                        )}
                    </div>
                </div>
                
                <div className="course-stats">
                    <div className="stat-item">
                        <UserGroupIcon className="stat-icon" />
                        <span>{course.active_enrolled} مشارك نشط</span>
                    </div>
                    <div className="stat-item">
                        <ClockIcon className="stat-icon" />
                        <span>اليوم {progress.current_day} من {progress.total_days}</span>
                    </div>
                </div>

                {['admin', 'head', 'teacher'].includes(userRole) && (
                    <button onClick={triggerEvaluation} className="evaluate-btn">
                        🔄 تحديث التقييمات
                    </button>
                )}
            </div>

            {/* Overall Progress */}
            <div className="overall-progress-section">
                <h3><ChartBarIcon className="section-icon" /> التقدم العام</h3>
                
                <div className="progress-cards">
                    <div className="progress-card">
                        <h4>تقدم الدورة</h4>
                        <div className="progress-circle">
                            <div className="circle-progress" style={{
                                background: `conic-gradient(#4CAF50 ${progress.day_progress * 3.6}deg, #e0e0e0 0deg)`
                            }}>
                                <span className="progress-text">{progress.day_progress}%</span>
                            </div>
                        </div>
                        <p>{progress.days_remaining} يوم متبقي</p>
                    </div>

                    <div className="progress-card">
                        <h4>إنجاز المهام</h4>
                        <div className="progress-circle">
                            <div className="circle-progress" style={{
                                background: `conic-gradient(#2196F3 ${progress.completion_rate * 3.6}deg, #e0e0e0 0deg)`
                            }}>
                                <span className="progress-text">{progress.completion_rate}%</span>
                            </div>
                        </div>
                        <p>{progress.completed_tasks} من {progress.total_tasks} مهمة</p>
                    </div>

                    <div className="progress-card">
                        <h4>متوسط الدرجات</h4>
                        <div className="progress-circle">
                            <div className="circle-progress" style={{
                                background: `conic-gradient(#FF9800 ${progress.average_grade * 3.6}deg, #e0e0e0 0deg)`
                            }}>
                                <span className="progress-text">{progress.average_grade}</span>
                            </div>
                        </div>
                        <p>من 100</p>
                    </div>
                </div>
            </div>

            {/* Level Statistics */}
            <div className="level-statistics-section">
                <h3><UserGroupIcon className="section-icon" /> إحصائيات الدرجات الثلاث</h3>
                
                <div className="level-filter">
                    <button 
                        className={selectedLevel === 'all' ? 'active' : ''}
                        onClick={() => setSelectedLevel('all')}
                    >
                        جميع الدرجات
                    </button>
                    {Object.keys(levelStats).map(levelKey => (
                        <button 
                            key={levelKey}
                            className={selectedLevel === levelKey ? 'active' : ''}
                            onClick={() => setSelectedLevel(levelKey)}
                        >
                            {levelStats[levelKey].name}
                        </button>
                    ))}
                </div>

                <div className="level-stats-grid">
                    {Object.entries(levelStats)
                        .filter(([levelKey]) => selectedLevel === 'all' || selectedLevel === levelKey)
                        .map(([levelKey, stats]) => (
                        <div key={levelKey} className="level-stat-card">
                            <div className="level-header">
                                <h4>
                                    {levelKey === 'level_1' && '🎯'} 
                                    {levelKey === 'level_2' && '👨‍🏫'} 
                                    {levelKey === 'level_3' && '🎓'} 
                                    {stats.name}
                                </h4>
                                <span className="user-count">{stats.user_count} مشارك</span>
                            </div>
                            
                            <div className="stat-metrics">
                                <div className="metric">
                                    <span className="metric-label">إكمال المهام</span>
                                    <div className="metric-bar">
                                        <div 
                                            className="metric-fill" 
                                            style={{ width: `${stats.task_completion}%` }}
                                        ></div>
                                    </div>
                                    <span className="metric-value">{stats.task_completion}%</span>
                                </div>

                                <div className="metric">
                                    <span className="metric-label">جودة الأداء</span>
                                    <div className="metric-bar">
                                        <div 
                                            className="metric-fill quality" 
                                            style={{ width: `${stats.quality_score}%` }}
                                        ></div>
                                    </div>
                                    <span className="metric-value">{stats.quality_score}/100</span>
                                </div>

                                <div className="metric">
                                    <span className="metric-label">الالتزام بالمواعيد</span>
                                    <div className="metric-bar">
                                        <div 
                                            className="metric-fill timeliness" 
                                            style={{ width: `${stats.timeliness}%` }}
                                        ></div>
                                    </div>
                                    <span className="metric-value">{stats.timeliness}%</span>
                                </div>

                                <div className="metric overall">
                                    <span className="metric-label">التقييم العام</span>
                                    <span className="metric-value large">{stats.overall_score}/100</span>
                                </div>
                            </div>

                            {stats.users && stats.users.length > 0 && (
                                <div className="level-users">
                                    <h5>المشاركون:</h5>
                                    <div className="users-list">
                                        {stats.users.map(user => (
                                            <span key={user.user_id} className="user-tag">
                                                {user.full_name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Daily Progress */}
            <div className="daily-progress-section">
                <h3><CheckCircleIcon className="section-icon" /> التقدم اليومي</h3>
                
                <div className="daily-progress-timeline">
                    {dailyProgress.map(day => (
                        <div 
                            key={day.day_number} 
                            className={`day-item ${day.day_number <= progress.current_day ? 'current-or-past' : 'future'}`}
                        >
                            <div className="day-number">
                                {day.day_number}
                            </div>
                            <div className="day-content">
                                <h4>{day.title}</h4>
                                <div className="day-status">
                                    {day.tasks_released ? (
                                        <span className="status-released">✅ تم إطلاق المهام</span>
                                    ) : (
                                        <span className="status-pending">⏳ في الانتظار</span>
                                    )}
                                </div>
                                <div className="day-progress">
                                    <span>{day.completed_tasks} من {day.total_tasks} مهمة مكتملة</span>
                                    <div className="progress-bar-small">
                                        <div 
                                            className="progress-fill-small" 
                                            style={{ width: `${day.completion_rate}%` }}
                                        ></div>
                                    </div>
                                    <span>{day.completion_rate}%</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Activity */}
            <div className="recent-activity-section">
                <h3>النشاط الأخير</h3>
                
                <div className="activity-list">
                    {recentActivity.length > 0 ? (
                        recentActivity.map((activity, index) => (
                            <div key={index} className="activity-item">
                                <div className="activity-icon">
                                    {activity.type === 'task_submission' ? '📝' : '🚀'}
                                </div>
                                <div className="activity-content">
                                    <p>
                                        <strong>{activity.user_name}</strong> - {activity.title}
                                        {activity.grade && (
                                            <span className="activity-grade"> (الدرجة: {activity.grade})</span>
                                        )}
                                    </p>
                                    <span className="activity-time">
                                        {new Date(activity.time).toLocaleString('ar-SA')}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="no-activity">لا يوجد نشاط حديث</p>
                    )}
                </div>
            </div>

            <style jsx>{`
                .course-progress-dashboard {
                    padding: 20px;
                    max-width: 1200px;
                    margin: 0 auto;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    direction: rtl;
                }

                .dashboard-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                    padding: 20px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 15px;
                    color: white;
                }

                .course-info h2 {
                    margin: 0 0 10px 0;
                    font-size: 24px;
                }

                .course-status {
                    display: flex;
                    gap: 10px;
                }

                .status-badge, .launched-badge {
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: bold;
                }

                .status-badge.active {
                    background: #4CAF50;
                    color: white;
                }

                .launched-badge {
                    background: #FF9800;
                    color: white;
                }

                .course-stats {
                    display: flex;
                    gap: 20px;
                }

                .stat-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .stat-icon {
                    width: 20px;
                    height: 20px;
                }

                .evaluate-btn {
                    background: #4CAF50;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: bold;
                }

                .evaluate-btn:hover {
                    background: #45a049;
                }

                .overall-progress-section, .level-statistics-section, 
                .daily-progress-section, .recent-activity-section {
                    margin-bottom: 30px;
                    background: white;
                    border-radius: 15px;
                    padding: 25px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }

                .section-icon {
                    width: 24px;
                    height: 24px;
                    margin-left: 10px;
                }

                .progress-cards {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin-top: 20px;
                }

                .progress-card {
                    text-align: center;
                    padding: 20px;
                    border: 2px solid #f0f0f0;
                    border-radius: 12px;
                }

                .progress-circle {
                    width: 100px;
                    height: 100px;
                    margin: 15px auto;
                    position: relative;
                }

                .circle-progress {
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                }

                .progress-text {
                    font-weight: bold;
                    font-size: 18px;
                    color: #333;
                }

                .level-filter {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                }

                .level-filter button {
                    padding: 8px 16px;
                    border: 2px solid #ddd;
                    background: white;
                    border-radius: 20px;
                    cursor: pointer;
                    transition: all 0.3s;
                }

                .level-filter button.active {
                    background: #2196F3;
                    color: white;
                    border-color: #2196F3;
                }

                .level-stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 20px;
                }

                .level-stat-card {
                    border: 2px solid #f0f0f0;
                    border-radius: 12px;
                    padding: 20px;
                }

                .level-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                }

                .user-count {
                    background: #e3f2fd;
                    color: #1976d2;
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 12px;
                }

                .metric {
                    margin-bottom: 15px;
                }

                .metric-label {
                    display: block;
                    margin-bottom: 5px;
                    font-size: 14px;
                    color: #666;
                }

                .metric-bar {
                    width: 100%;
                    height: 8px;
                    background: #f0f0f0;
                    border-radius: 4px;
                    overflow: hidden;
                    margin-bottom: 5px;
                }

                .metric-fill {
                    height: 100%;
                    background: #2196F3;
                    transition: width 0.3s ease;
                }

                .metric-fill.quality {
                    background: #4CAF50;
                }

                .metric-fill.timeliness {
                    background: #FF9800;
                }

                .metric-value {
                    font-weight: bold;
                    color: #333;
                }

                .metric-value.large {
                    font-size: 18px;
                    color: #2196F3;
                }

                .metric.overall {
                    text-align: center;
                    padding-top: 10px;
                    border-top: 1px solid #eee;
                }

                .users-list {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 5px;
                    margin-top: 10px;
                }

                .user-tag {
                    background: #f5f5f5;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 12px;
                    color: #666;
                }

                .daily-progress-timeline {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }

                .day-item {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    padding: 15px;
                    border-radius: 10px;
                    border: 2px solid #f0f0f0;
                }

                .day-item.current-or-past {
                    background: #f8f9fa;
                    border-color: #2196F3;
                }

                .day-number {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: #2196F3;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    flex-shrink: 0;
                }

                .day-content {
                    flex: 1;
                }

                .day-content h4 {
                    margin: 0 0 5px 0;
                }

                .day-status {
                    margin-bottom: 10px;
                }

                .status-released {
                    color: #4CAF50;
                    font-weight: bold;
                }

                .status-pending {
                    color: #FF9800;
                    font-weight: bold;
                }

                .day-progress {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .progress-bar-small {
                    flex: 1;
                    height: 6px;
                    background: #f0f0f0;
                    border-radius: 3px;
                    overflow: hidden;
                }

                .progress-fill-small {
                    height: 100%;
                    background: #4CAF50;
                    transition: width 0.3s ease;
                }

                .activity-list {
                    max-height: 400px;
                    overflow-y: auto;
                }

                .activity-item {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    padding: 15px;
                    border-bottom: 1px solid #f0f0f0;
                }

                .activity-item:last-child {
                    border-bottom: none;
                }

                .activity-icon {
                    font-size: 24px;
                    flex-shrink: 0;
                }

                .activity-content {
                    flex: 1;
                }

                .activity-content p {
                    margin: 0 0 5px 0;
                }

                .activity-grade {
                    color: #4CAF50;
                    font-weight: bold;
                }

                .activity-time {
                    font-size: 12px;
                    color: #666;
                }

                .loading-spinner, .error-message, .no-data {
                    text-align: center;
                    padding: 40px;
                }

                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #2196F3;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 20px;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .retry-btn {
                    background: #2196F3;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    margin-top: 10px;
                }

                .retry-btn:hover {
                    background: #1976D2;
                }

                @media (max-width: 768px) {
                    .dashboard-header {
                        flex-direction: column;
                        gap: 15px;
                        text-align: center;
                    }

                    .course-stats {
                        flex-direction: column;
                        gap: 10px;
                    }

                    .progress-cards {
                        grid-template-columns: 1fr;
                    }

                    .level-stats-grid {
                        grid-template-columns: 1fr;
                    }

                    .day-item {
                        flex-direction: column;
                        text-align: center;
                    }

                    .day-progress {
                        flex-direction: column;
                        gap: 5px;
                    }
                }
            `}</style>
        </div>
    );
};

export default CourseProgressDashboard;