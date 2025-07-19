import React, { useState, useEffect } from 'react';

const CourseRatingSystem = ({ course, user, onUpdateRating }) => {
    const [ratings, setRatings] = useState({
        daily: {},
        overall: {},
        participation: {},
        performance: {}
    });
    const [currentDay, setCurrentDay] = useState(1);
    const [evaluationData, setEvaluationData] = useState({});
    const [message, setMessage] = useState({ text: '', type: '' });

    // تحديد درجة المستخدم في الدورة
    const getUserGrade = () => {
        if (!course || !user) return null;
        
        // البحث في الأدوار المحددة للدورة
        for (const [gradeKey, grade] of Object.entries(course)) {
            if (gradeKey.startsWith('grade') && grade.categories) {
                for (const category of grade.categories) {
                    if (category.selected && isUserInCategory(user, category.name)) {
                        return {
                            level: gradeKey,
                            title: grade.title,
                            category: category.name
                        };
                    }
                }
            }
        }
        return null;
    };

    const isUserInCategory = (user, categoryName) => {
        const userRole = user.role;
        const categoryMappings = {
            'طالب': ['student'],
            'عامل': ['worker'],
            'معلم': ['teacher'],
            'مدرب': ['teacher', 'trainer'],
            'رئيس قسم': ['head'],
            'مشرف': ['supervisor', 'admin'],
            'رئيس قسم عليا': ['head', 'admin'],
            'إدارة عليا': ['admin']
        };
        
        return categoryMappings[categoryName]?.includes(userRole) || false;
    };

    const userGrade = getUserGrade();

    // حساب التقييمات اليومية
    const calculateDailyRating = (dayNumber) => {
        const dayData = evaluationData[dayNumber] || {};
        let totalScore = 0;
        let maxScore = 0;

        // تقييم الحضور
        if (dayData.attendance) {
            totalScore += 20;
        }
        maxScore += 20;

        // تقييم المشاركة
        if (dayData.participation) {
            totalScore += dayData.participation * 4; // 0-5 scale to 0-20
        }
        maxScore += 20;

        // تقييم الأداء في المهام
        if (dayData.taskCompletion) {
            totalScore += dayData.taskCompletion * 2; // 0-30 scale
        }
        maxScore += 30;

        // تقييم الامتحان (للطلاب فقط)
        if (userGrade?.level === 'grade1' && dayData.examScore !== undefined) {
            totalScore += dayData.examScore * 0.3; // 0-100 to 0-30
            maxScore += 30;
        }

        return maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    };

    // حساب التقييم الإجمالي
    const calculateOverallRating = () => {
        const completedDays = Object.keys(evaluationData).length;
        if (completedDays === 0) return 0;

        let totalRating = 0;
        for (let day = 1; day <= completedDays; day++) {
            totalRating += calculateDailyRating(day);
        }

        return Math.round(totalRating / completedDays);
    };

    // تحديث بيانات التقييم
    const updateEvaluationData = (dayNumber, field, value) => {
        setEvaluationData(prev => ({
            ...prev,
            [dayNumber]: {
                ...prev[dayNumber],
                [field]: value
            }
        }));
    };

    // حفظ التقييم
    const saveRating = async () => {
        try {
            const ratingData = {
                courseId: course.id,
                userId: user.id,
                userGrade: userGrade,
                dailyRatings: {},
                overallRating: calculateOverallRating(),
                evaluationData,
                lastUpdated: new Date().toISOString()
            };

            // حساب التقييمات اليومية
            for (let day = 1; day <= course.duration; day++) {
                ratingData.dailyRatings[day] = calculateDailyRating(day);
            }

            await onUpdateRating(ratingData);
            setMessage({ text: 'تم حفظ التقييم بنجاح!', type: 'success' });
        } catch (error) {
            setMessage({ text: 'حدث خطأ في حفظ التقييم', type: 'error' });
        }
    };

    // عرض نموذج التقييم حسب درجة المستخدم
    const renderEvaluationForm = () => {
        if (!userGrade) {
            return (
                <div className="no-access">
                    <i className="fas fa-exclamation-triangle"></i>
                    <p>لا يمكن تحديد دورك في هذه الدورة</p>
                </div>
            );
        }

        return (
            <div className="evaluation-form">
                <div className="user-info">
                    <h4>
                        <i className="fas fa-user"></i>
                        {userGrade.title} - {userGrade.category}
                    </h4>
                </div>

                <div className="day-selector">
                    <label>اختر اليوم للتقييم:</label>
                    <select
                        value={currentDay}
                        onChange={(e) => setCurrentDay(parseInt(e.target.value))}
                    >
                        {Array.from({ length: course.duration }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                                اليوم {i + 1}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="evaluation-sections">
                    {/* تقييم الحضور */}
                    <div className="evaluation-section">
                        <h5><i className="fas fa-check-circle"></i> الحضور</h5>
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={evaluationData[currentDay]?.attendance || false}
                                onChange={(e) => updateEvaluationData(currentDay, 'attendance', e.target.checked)}
                            />
                            <span>حضرت هذا اليوم</span>
                        </label>
                    </div>

                    {/* تقييم المشاركة */}
                    <div className="evaluation-section">
                        <h5><i className="fas fa-comments"></i> المشاركة</h5>
                        <div className="rating-scale">
                            {[1, 2, 3, 4, 5].map(score => (
                                <label key={score} className="rating-option">
                                    <input
                                        type="radio"
                                        name={`participation-${currentDay}`}
                                        value={score}
                                        checked={evaluationData[currentDay]?.participation === score}
                                        onChange={(e) => updateEvaluationData(currentDay, 'participation', parseInt(e.target.value))}
                                    />
                                    <span className="rating-star">
                                        <i className="fas fa-star"></i>
                                    </span>
                                    <span>{score}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* تقييم إنجاز المهام */}
                    <div className="evaluation-section">
                        <h5><i className="fas fa-tasks"></i> إنجاز المهام</h5>
                        <div className="task-completion">
                            <label>نسبة الإنجاز:</label>
                            <input
                                type="range"
                                min="0"
                                max="30"
                                value={evaluationData[currentDay]?.taskCompletion || 0}
                                onChange={(e) => updateEvaluationData(currentDay, 'taskCompletion', parseInt(e.target.value))}
                            />
                            <span>{evaluationData[currentDay]?.taskCompletion || 0}/30</span>
                        </div>
                    </div>

                    {/* تقييم الامتحان (للطلاب فقط) */}
                    {userGrade.level === 'grade1' && (
                        <div className="evaluation-section">
                            <h5><i className="fas fa-graduation-cap"></i> درجة الامتحان</h5>
                            <div className="exam-score">
                                <label>الدرجة من 100:</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={evaluationData[currentDay]?.examScore || ''}
                                    onChange={(e) => updateEvaluationData(currentDay, 'examScore', parseInt(e.target.value) || 0)}
                                    placeholder="أدخل الدرجة"
                                />
                            </div>
                        </div>
                    )}

                    {/* تقييمات إضافية للمعلمين والمشرفين */}
                    {(userGrade.level === 'grade2' || userGrade.level === 'grade3') && (
                        <div className="evaluation-section">
                            <h5><i className="fas fa-chalkboard-teacher"></i> تقييم الأداء التعليمي</h5>
                            <div className="teaching-evaluation">
                                <label>جودة التدريس:</label>
                                <select
                                    value={evaluationData[currentDay]?.teachingQuality || ''}
                                    onChange={(e) => updateEvaluationData(currentDay, 'teachingQuality', e.target.value)}
                                >
                                    <option value="">اختر التقييم</option>
                                    <option value="excellent">ممتاز</option>
                                    <option value="good">جيد</option>
                                    <option value="average">متوسط</option>
                                    <option value="needs_improvement">يحتاج تحسين</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* عرض التقييم اليومي */}
                <div className="daily-rating-display">
                    <h5>التقييم اليومي لليوم {currentDay}</h5>
                    <div className="rating-circle">
                        <span className="rating-value">{calculateDailyRating(currentDay)}%</span>
                    </div>
                </div>
            </div>
        );
    };

    // عرض الإحصائيات الإجمالية
    const renderOverallStats = () => {
        const overallRating = calculateOverallRating();
        const completedDays = Object.keys(evaluationData).length;
        const totalDays = course.duration;

        return (
            <div className="overall-stats">
                <h4><i className="fas fa-chart-line"></i> الإحصائيات الإجمالية</h4>
                
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon">
                            <i className="fas fa-percentage"></i>
                        </div>
                        <div className="stat-content">
                            <h5>التقييم الإجمالي</h5>
                            <span className="stat-value">{overallRating}%</span>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">
                            <i className="fas fa-calendar-check"></i>
                        </div>
                        <div className="stat-content">
                            <h5>الأيام المكتملة</h5>
                            <span className="stat-value">{completedDays}/{totalDays}</span>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">
                            <i className="fas fa-trophy"></i>
                        </div>
                        <div className="stat-content">
                            <h5>المستوى</h5>
                            <span className="stat-value">
                                {overallRating >= 90 ? 'ممتاز' : 
                                 overallRating >= 80 ? 'جيد جداً' :
                                 overallRating >= 70 ? 'جيد' :
                                 overallRating >= 60 ? 'مقبول' : 'ضعيف'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* رسم بياني للتقييمات اليومية */}
                <div className="daily-ratings-chart">
                    <h5>التقييمات اليومية</h5>
                    <div className="chart-container">
                        {Array.from({ length: totalDays }, (_, i) => {
                            const day = i + 1;
                            const rating = calculateDailyRating(day);
                            const isCompleted = evaluationData[day] !== undefined;
                            
                            return (
                                <div key={day} className="chart-bar">
                                    <div 
                                        className={`bar ${isCompleted ? 'completed' : 'pending'}`}
                                        style={{ height: `${rating}%` }}
                                        title={`اليوم ${day}: ${rating}%`}
                                    ></div>
                                    <span className="bar-label">{day}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="course-rating-system">
            <div className="rating-header">
                <h3><i className="fas fa-star"></i> نظام التقييمات - {course?.name}</h3>
            </div>

            {message.text && (
                <div className={`message ${message.type}`}>
                    {message.text}
                </div>
            )}

            <div className="rating-content">
                <div className="evaluation-panel">
                    {renderEvaluationForm()}
                </div>

                <div className="stats-panel">
                    {renderOverallStats()}
                </div>
            </div>

            <div className="rating-actions">
                <button onClick={saveRating} className="btn-save-rating">
                    <i className="fas fa-save"></i> حفظ التقييم
                </button>
            </div>

            <style jsx>{`
                .course-rating-system {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 20px;
                }

                .rating-header {
                    text-align: center;
                    margin-bottom: 30px;
                    padding: 20px;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.08);
                }

                .rating-content {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 30px;
                    margin-bottom: 30px;
                }

                .evaluation-panel,
                .stats-panel {
                    background: white;
                    padding: 25px;
                    border-radius: 12px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.08);
                }

                .user-info {
                    background: linear-gradient(135deg, var(--primary-color), #4a90e2);
                    color: white;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                }

                .day-selector {
                    margin-bottom: 25px;
                }

                .day-selector label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 600;
                }

                .day-selector select {
                    width: 100%;
                    padding: 10px;
                    border: 2px solid #e0e0e0;
                    border-radius: 8px;
                    font-size: 14px;
                }

                .evaluation-section {
                    margin-bottom: 25px;
                    padding: 15px;
                    background: #f8f9fa;
                    border-radius: 8px;
                }

                .evaluation-section h5 {
                    margin-bottom: 15px;
                    color: var(--primary-color);
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .checkbox-label {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    cursor: pointer;
                }

                .rating-scale {
                    display: flex;
                    gap: 15px;
                    justify-content: center;
                }

                .rating-option {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    cursor: pointer;
                    padding: 10px;
                    border-radius: 8px;
                    transition: all 0.3s;
                }

                .rating-option:hover {
                    background: #e3f2fd;
                }

                .rating-option input[type="radio"] {
                    display: none;
                }

                .rating-option input[type="radio"]:checked + .rating-star {
                    color: #ffc107;
                }

                .rating-star {
                    font-size: 1.5rem;
                    color: #ddd;
                    transition: color 0.3s;
                }

                .task-completion,
                .exam-score,
                .teaching-evaluation {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }

                .task-completion input[type="range"] {
                    flex: 1;
                }

                .exam-score input[type="number"],
                .teaching-evaluation select {
                    padding: 8px;
                    border: 2px solid #e0e0e0;
                    border-radius: 6px;
                }

                .daily-rating-display {
                    text-align: center;
                    margin-top: 25px;
                    padding: 20px;
                    background: linear-gradient(135deg, #28a745, #20c997);
                    color: white;
                    border-radius: 8px;
                }

                .rating-circle {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 15px auto;
                }

                .rating-value {
                    font-size: 1.5rem;
                    font-weight: bold;
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 15px;
                    margin-bottom: 25px;
                }

                .stat-card {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 8px;
                    text-align: center;
                }

                .stat-icon {
                    font-size: 2rem;
                    color: var(--primary-color);
                    margin-bottom: 10px;
                }

                .stat-content h5 {
                    margin-bottom: 5px;
                    color: #666;
                    font-size: 0.9rem;
                }

                .stat-value {
                    font-size: 1.5rem;
                    font-weight: bold;
                    color: var(--primary-color);
                }

                .daily-ratings-chart {
                    margin-top: 25px;
                }

                .chart-container {
                    display: flex;
                    align-items: end;
                    gap: 8px;
                    height: 150px;
                    padding: 20px 0;
                    border-bottom: 2px solid #e0e0e0;
                }

                .chart-bar {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    height: 100%;
                }

                .bar {
                    width: 100%;
                    min-height: 5px;
                    border-radius: 4px 4px 0 0;
                    transition: all 0.3s;
                    margin-bottom: 5px;
                }

                .bar.completed {
                    background: linear-gradient(to top, var(--primary-color), #4a90e2);
                }

                .bar.pending {
                    background: #e0e0e0;
                }

                .bar-label {
                    font-size: 0.8rem;
                    color: #666;
                }

                .rating-actions {
                    text-align: center;
                }

                .btn-save-rating {
                    background: #28a745;
                    color: white;
                    padding: 15px 30px;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin: 0 auto;
                }

                .btn-save-rating:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                }

                .no-access {
                    text-align: center;
                    padding: 40px;
                    color: #666;
                }

                .no-access i {
                    font-size: 3rem;
                    margin-bottom: 15px;
                    color: #ffc107;
                }

                .message {
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 20px;
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

                @media (max-width: 768px) {
                    .rating-content {
                        grid-template-columns: 1fr;
                    }
                    
                    .stats-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .rating-scale {
                        flex-wrap: wrap;
                    }
                    
                    .task-completion,
                    .exam-score,
                    .teaching-evaluation {
                        flex-direction: column;
                        align-items: stretch;
                    }
                }
            `}</style>
        </div>
    );
};

export default CourseRatingSystem;