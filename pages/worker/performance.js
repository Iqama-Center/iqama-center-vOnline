import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import { withAuth } from '../../lib/withAuth';

const WorkerPerformancePage = ({ user }) => {
    const [performanceData, setPerformanceData] = useState(null);
    const [evaluations, setEvaluations] = useState([]);
    const [currentPeriod, setCurrentPeriod] = useState('current_year');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPerformanceData();
    }, [currentPeriod, loadPerformanceData]);

    const loadPerformanceData = useCallback(async () => {
        try {
            // Try to load real performance data from API
            try {
                const response = await fetch(`/api/worker/performance?period=${currentPeriod}`);
                if (response.ok) {
                    const data = await response.json();
                    setPerformanceData(data.summary || null);
                    setEvaluations(data.evaluations || []);
                } else {
                    setPerformanceData(null);
                    setEvaluations([]);
                }
            } catch (error) {
                console.error('Failed to load performance data:', error);
                setPerformanceData(null);
                setEvaluations([]);
            }
        } catch (error) {
            console.error('Error loading performance data:', error);
        } finally {
            setLoading(false);
        }
    }, [currentPeriod]);

    const generateMockPerformanceData = () => {
        return {
            summary: {
                overall_rating: 4.2,
                punctuality_rating: 4.5,
                quality_rating: 4.0,
                communication_rating: 4.3,
                teamwork_rating: 4.1,
                initiative_rating: 3.9,
                total_evaluations: 6,
                improvement_trend: 'positive', // 'positive', 'negative', 'stable'
                last_evaluation_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                tasks_completed: 45,
                tasks_on_time: 42,
                average_task_rating: 4.1
            },
            evaluations: [
                {
                    id: 1,
                    period_start: '2024-01-01',
                    period_end: '2024-03-31',
                    overall_rating: 4.2,
                    evaluator_name: 'أحمد محمد',
                    evaluator_position: 'مدير القسم',
                    strengths: 'التزام بالمواعيد، جودة العمل، التعاون مع الفريق',
                    areas_for_improvement: 'تطوير مهارات التواصل، المبادرة في حل المشاكل',
                    goals_next_period: 'حضور دورة تدريبية في التواصل، قيادة مشروع صغير',
                    status: 'finalized',
                    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
                },
                {
                    id: 2,
                    period_start: '2023-10-01',
                    period_end: '2023-12-31',
                    overall_rating: 3.8,
                    evaluator_name: 'فاطمة علي',
                    evaluator_position: 'مشرف العمليات',
                    strengths: 'دقة في العمل، استجابة سريعة للطلبات',
                    areas_for_improvement: 'إدارة الوقت، العمل تحت الضغط',
                    goals_next_period: 'تحسين إدارة الوقت، تطوير مهارات التعامل مع الضغط',
                    status: 'finalized',
                    created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString()
                }
            ]
        };
    };

    const getRatingColor = (rating) => {
        if (rating >= 4.5) return '#28a745'; // Excellent - Green
        if (rating >= 4.0) return '#20c997'; // Very Good - Teal
        if (rating >= 3.5) return '#ffc107'; // Good - Yellow
        if (rating >= 3.0) return '#fd7e14'; // Fair - Orange
        return '#dc3545'; // Needs Improvement - Red
    };

    const getRatingText = (rating) => {
        if (rating >= 4.5) return 'ممتاز';
        if (rating >= 4.0) return 'جيد جداً';
        if (rating >= 3.5) return 'جيد';
        if (rating >= 3.0) return 'مقبول';
        return 'يحتاج تحسين';
    };

    const getTrendIcon = (trend) => {
        switch (trend) {
            case 'positive': return { icon: 'fa-arrow-up', color: '#28a745' };
            case 'negative': return { icon: 'fa-arrow-down', color: '#dc3545' };
            default: return { icon: 'fa-minus', color: '#6c757d' };
        }
    };

    const getCompletionPercentage = () => {
        if (!performanceData) return 0;
        return Math.round((performanceData.tasks_on_time / performanceData.tasks_completed) * 100);
    };

    return (
        <Layout user={user}>
            <style jsx>{`
                .performance-container {
                    padding: 20px;
                }
                .page-header {
                    background: linear-gradient(135deg, #6f42c1 0%, #e83e8c 100%);
                    color: white;
                    padding: 30px;
                    border-radius: 12px;
                    margin-bottom: 30px;
                }
                .page-header h1 {
                    margin: 0 0 10px 0;
                    font-size: 2rem;
                }
                .performance-summary {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }
                .summary-card {
                    background: white;
                    padding: 25px;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    text-align: center;
                    position: relative;
                    overflow: hidden;
                }
                .summary-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: linear-gradient(90deg, #6f42c1, #e83e8c);
                }
                .rating-circle {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 15px;
                    font-size: 1.5rem;
                    font-weight: bold;
                    color: white;
                }
                .rating-label {
                    font-size: 1.1rem;
                    font-weight: bold;
                    color: #333;
                    margin-bottom: 5px;
                }
                .rating-description {
                    font-size: 0.9rem;
                    color: #666;
                }
                .detailed-ratings {
                    background: white;
                    padding: 25px;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    margin-bottom: 30px;
                }
                .ratings-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin-top: 20px;
                }
                .rating-item {
                    text-align: center;
                    padding: 15px;
                    border-radius: 8px;
                    background: #f8f9fa;
                }
                .rating-bar {
                    width: 100%;
                    height: 8px;
                    background: #e9ecef;
                    border-radius: 4px;
                    overflow: hidden;
                    margin: 10px 0;
                }
                .rating-fill {
                    height: 100%;
                    transition: width 0.3s ease;
                }
                .rating-value {
                    font-size: 1.2rem;
                    font-weight: bold;
                    margin-bottom: 5px;
                }
                .rating-name {
                    font-size: 0.9rem;
                    color: #666;
                }
                .evaluations-section {
                    background: white;
                    padding: 25px;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    margin-bottom: 30px;
                }
                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 2px solid #f0f0f0;
                }
                .section-title {
                    font-size: 1.3rem;
                    font-weight: bold;
                    color: #333;
                    margin: 0;
                }
                .period-selector {
                    padding: 8px 15px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    background: white;
                    cursor: pointer;
                }
                .evaluation-card {
                    border: 1px solid #e9ecef;
                    border-radius: 8px;
                    padding: 20px;
                    margin-bottom: 20px;
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }
                .evaluation-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                }
                .evaluation-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 15px;
                }
                .evaluation-period {
                    font-weight: bold;
                    color: #333;
                    font-size: 1.1rem;
                }
                .evaluation-rating {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .overall-rating {
                    font-size: 1.5rem;
                    font-weight: bold;
                    padding: 5px 10px;
                    border-radius: 20px;
                    color: white;
                }
                .evaluator-info {
                    color: #666;
                    font-size: 0.9rem;
                    margin-bottom: 15px;
                }
                .evaluation-details {
                    display: grid;
                    gap: 15px;
                }
                .detail-section {
                    padding: 15px;
                    background: #f8f9fa;
                    border-radius: 6px;
                }
                .detail-title {
                    font-weight: bold;
                    color: #495057;
                    margin-bottom: 8px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .detail-content {
                    color: #666;
                    line-height: 1.5;
                }
                .stats-overview {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 15px;
                    margin-bottom: 30px;
                }
                .stat-box {
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    text-align: center;
                }
                .stat-number {
                    font-size: 1.8rem;
                    font-weight: bold;
                    color: #6f42c1;
                    margin-bottom: 5px;
                }
                .stat-label {
                    font-size: 0.9rem;
                    color: #666;
                }
                .trend-indicator {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 5px;
                    margin-top: 10px;
                    font-size: 0.9rem;
                }
                .loading {
                    text-align: center;
                    padding: 40px;
                    color: #666;
                }
                .empty-state {
                    text-align: center;
                    padding: 40px;
                    color: #666;
                }
                @media (max-width: 768px) {
                    .section-header {
                        flex-direction: column;
                        gap: 15px;
                        align-items: stretch;
                    }
                    .evaluation-header {
                        flex-direction: column;
                        gap: 10px;
                    }
                    .performance-summary {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>

            <div className="performance-container">
                <div className="page-header">
                    <h1><i className="fas fa-chart-bar fa-fw"></i> تقييم الأداء</h1>
                    <p>متابعة وتحليل الأداء الوظيفي والتطوير المهني</p>
                </div>

                {loading ? (
                    <div className="loading">
                        <i className="fas fa-spinner fa-spin fa-2x"></i>
                        <p>جاري تحميل بيانات الأداء...</p>
                    </div>
                ) : (
                    <>
                        {/* Performance Summary */}
                        {performanceData && (
                            <>
                                <div className="performance-summary">
                                    <div className="summary-card">
                                        <div 
                                            className="rating-circle"
                                            style={{ backgroundColor: getRatingColor(performanceData.overall_rating) }}
                                        >
                                            {performanceData.overall_rating.toFixed(1)}
                                        </div>
                                        <div className="rating-label">التقييم العام</div>
                                        <div className="rating-description">
                                            {getRatingText(performanceData.overall_rating)}
                                        </div>
                                        <div className="trend-indicator">
                                            <i 
                                                className={`fas ${getTrendIcon(performanceData.improvement_trend).icon}`}
                                                style={{ color: getTrendIcon(performanceData.improvement_trend).color }}
                                            ></i>
                                            <span>اتجاه التحسن</span>
                                        </div>
                                    </div>

                                    <div className="summary-card">
                                        <div 
                                            className="rating-circle"
                                            style={{ backgroundColor: '#17a2b8' }}
                                        >
                                            {performanceData.total_evaluations}
                                        </div>
                                        <div className="rating-label">عدد التقييمات</div>
                                        <div className="rating-description">
                                            آخر تقييم: {new Date(performanceData.last_evaluation_date).toLocaleDateString('ar-EG')}
                                        </div>
                                    </div>

                                    <div className="summary-card">
                                        <div 
                                            className="rating-circle"
                                            style={{ backgroundColor: '#28a745' }}
                                        >
                                            {getCompletionPercentage()}%
                                        </div>
                                        <div className="rating-label">معدل الإنجاز في الوقت</div>
                                        <div className="rating-description">
                                            {performanceData.tasks_on_time} من {performanceData.tasks_completed} مهمة
                                        </div>
                                    </div>
                                </div>

                                {/* Stats Overview */}
                                <div className="stats-overview">
                                    <div className="stat-box">
                                        <div className="stat-number">{performanceData.tasks_completed}</div>
                                        <div className="stat-label">المهام المكتملة</div>
                                    </div>
                                    <div className="stat-box">
                                        <div className="stat-number">{performanceData.average_task_rating.toFixed(1)}</div>
                                        <div className="stat-label">متوسط تقييم المهام</div>
                                    </div>
                                    <div className="stat-box">
                                        <div className="stat-number">{performanceData.punctuality_rating.toFixed(1)}</div>
                                        <div className="stat-label">الالتزام بالمواعيد</div>
                                    </div>
                                    <div className="stat-box">
                                        <div className="stat-number">{performanceData.teamwork_rating.toFixed(1)}</div>
                                        <div className="stat-label">العمل الجماعي</div>
                                    </div>
                                </div>

                                {/* Detailed Ratings */}
                                <div className="detailed-ratings">
                                    <h2 className="section-title">تفصيل التقييمات</h2>
                                    <div className="ratings-grid">
                                        {[
                                            { name: 'الالتزام بالمواعيد', value: performanceData.punctuality_rating, icon: 'fa-clock' },
                                            { name: 'جودة العمل', value: performanceData.quality_rating, icon: 'fa-star' },
                                            { name: 'التواصل', value: performanceData.communication_rating, icon: 'fa-comments' },
                                            { name: 'العمل الجماعي', value: performanceData.teamwork_rating, icon: 'fa-users' },
                                            { name: 'المبادرة', value: performanceData.initiative_rating, icon: 'fa-lightbulb' }
                                        ].map((rating, index) => (
                                            <div key={index} className="rating-item">
                                                <div className="rating-value" style={{ color: getRatingColor(rating.value) }}>
                                                    <i className={`fas ${rating.icon}`}></i> {rating.value.toFixed(1)}
                                                </div>
                                                <div className="rating-bar">
                                                    <div 
                                                        className="rating-fill"
                                                        style={{ 
                                                            width: `${(rating.value / 5) * 100}%`,
                                                            backgroundColor: getRatingColor(rating.value)
                                                        }}
                                                    ></div>
                                                </div>
                                                <div className="rating-name">{rating.name}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Evaluations History */}
                        <div className="evaluations-section">
                            <div className="section-header">
                                <h2 className="section-title">سجل التقييمات</h2>
                                <select 
                                    className="period-selector"
                                    value={currentPeriod}
                                    onChange={(e) => setCurrentPeriod(e.target.value)}
                                >
                                    <option value="current_year">السنة الحالية</option>
                                    <option value="last_year">السنة الماضية</option>
                                    <option value="all_time">جميع الفترات</option>
                                </select>
                            </div>

                            {evaluations.length === 0 ? (
                                <div className="empty-state">
                                    <i className="fas fa-chart-bar fa-3x" style={{ color: '#ddd', marginBottom: '15px' }}></i>
                                    <p>لا توجد تقييمات متاحة للفترة المحددة</p>
                                </div>
                            ) : (
                                evaluations.map(evaluation => (
                                    <div key={evaluation.id} className="evaluation-card">
                                        <div className="evaluation-header">
                                            <div>
                                                <div className="evaluation-period">
                                                    {new Date(evaluation.period_start).toLocaleDateString('ar-EG')} - {new Date(evaluation.period_end).toLocaleDateString('ar-EG')}
                                                </div>
                                                <div className="evaluator-info">
                                                    <i className="fas fa-user"></i> {evaluation.evaluator_name} - {evaluation.evaluator_position}
                                                </div>
                                            </div>
                                            <div className="evaluation-rating">
                                                <div 
                                                    className="overall-rating"
                                                    style={{ backgroundColor: getRatingColor(evaluation.overall_rating) }}
                                                >
                                                    {evaluation.overall_rating.toFixed(1)}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="evaluation-details">
                                            <div className="detail-section">
                                                <div className="detail-title">
                                                    <i className="fas fa-thumbs-up" style={{ color: '#28a745' }}></i>
                                                    نقاط القوة
                                                </div>
                                                <div className="detail-content">{evaluation.strengths}</div>
                                            </div>

                                            <div className="detail-section">
                                                <div className="detail-title">
                                                    <i className="fas fa-arrow-up" style={{ color: '#ffc107' }}></i>
                                                    مجالات التحسين
                                                </div>
                                                <div className="detail-content">{evaluation.areas_for_improvement}</div>
                                            </div>

                                            <div className="detail-section">
                                                <div className="detail-title">
                                                    <i className="fas fa-target" style={{ color: '#17a2b8' }}></i>
                                                    أهداف الفترة القادمة
                                                </div>
                                                <div className="detail-content">{evaluation.goals_next_period}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                )}
            </div>
        </Layout>
    );
};

export const getServerSideProps = withAuth(async (context) => {
    const { user } = context;
    
    if (user.role !== 'worker') {
        return {
            redirect: {
                destination: '/dashboard',
                permanent: false,
            },
        };
    }

    return {
        props: {
            user: JSON.parse(JSON.stringify(user))
        }
    };
}, { roles: ['worker'] });

export default WorkerPerformancePage;