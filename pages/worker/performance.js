
import React from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { withAuth } from '../../lib/withAuth';
import { getPerformanceData } from '../api/worker/performance'; // Adjust path as needed

const WorkerPerformancePage = ({ user, performanceData, evaluations, currentPeriod }) => {
    const router = useRouter();

    const handlePeriodChange = (e) => {
        const newPeriod = e.target.value;
        router.push(`/worker/performance?period=${newPeriod}`);
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
        if (!performanceData || !performanceData.tasks_completed || performanceData.tasks_completed === 0) return 0;
        return Math.round((performanceData.tasks_on_time / performanceData.tasks_completed) * 100);
    };

    return (
        <Layout user={user}>
            <style jsx>{`
                /* Styles remain the same */
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
                .empty-state {
                    text-align: center;
                    padding: 40px;
                    color: #666;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
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

                {performanceData ? (
                    <>
                        {/* Performance Summary */}
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
                                    {performanceData.last_evaluation_date ? 
                                        `آخر تقييم: ${new Date(performanceData.last_evaluation_date).toLocaleDateString('ar-EG')}`
                                        : 'لا يوجد تقييمات بعد'
                                    }
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
                                <div className="stat-number">{performanceData.tasks_completed || 0}</div>
                                <div className="stat-label">المهام المكتملة</div>
                            </div>
                            <div className="stat-box">
                                <div className="stat-number">{(performanceData.average_task_rating || 0).toFixed(1)}</div>
                                <div className="stat-label">متوسط تقييم المهام</div>
                            </div>
                            <div className="stat-box">
                                <div className="stat-number">{(performanceData.punctuality_rating || 0).toFixed(1)}</div>
                                <div className="stat-label">الالتزام بالمواعيد</div>
                            </div>
                            <div className="stat-box">
                                <div className="stat-number">{(performanceData.teamwork_rating || 0).toFixed(1)}</div>
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
                                        <div className="rating-value" style={{ color: getRatingColor(rating.value || 0) }}>
                                            <i className={`fas ${rating.icon}`}></i> {(rating.value || 0).toFixed(1)}
                                        </div>
                                        <div className="rating-bar">
                                            <div 
                                                className="rating-fill"
                                                style={{ 
                                                    width: `${((rating.value || 0) / 5) * 100}%`,
                                                    backgroundColor: getRatingColor(rating.value || 0)
                                                }}
                                            ></div>
                                        </div>
                                        <div className="rating-name">{rating.name}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                     <div className="empty-state">
                        <i className="fas fa-chart-bar fa-3x" style={{ color: '#ddd', marginBottom: '15px' }}></i>
                        <h2>لا توجد بيانات أداء لعرضها</h2>
                        <p>لم يتم تسجيل أي تقييمات أو مهام حتى الآن.</p>
                    </div>
                )}

                {/* Evaluations History */}
                <div className="evaluations-section">
                    <div className="section-header">
                        <h2 className="section-title">سجل التقييمات</h2>
                        <select 
                            className="period-selector"
                            value={currentPeriod}
                            onChange={handlePeriodChange}
                        >
                            <option value="current_year">السنة الحالية</option>
                            <option value="last_year">السنة الماضية</option>
                            <option value="all_time">جميع الفترات</option>
                        </select>
                    </div>

                    {evaluations.length === 0 ? (
                        <div className="empty-state">
                            <i className="fas fa-file-alt fa-3x" style={{ color: '#ddd', marginBottom: '15px' }}></i>
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
                                            <i className="fas fa-user"></i> {evaluation.evaluator_name} - {evaluation.evaluator_position || 'مشرف'}
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
            </div>
        </Layout>
    );
};

export const getServerSideProps = withAuth(async (context) => {
    const { user } = context;
    const { period = 'current_year' } = context.query;
    
    if (user.role !== 'worker') {
        return {
            redirect: {
                destination: '/dashboard',
                permanent: false,
            },
        };
    }

    try {
        const { summary, evaluations } = await getPerformanceData(user.id, period);

        return {
            props: {
                user: JSON.parse(JSON.stringify(user)),
                performanceData: summary,
                evaluations,
                currentPeriod: period
            }
        };
    } catch (error) {
        console.error("Error in getServerSideProps for worker performance:", error);
        return {
            props: {
                user: JSON.parse(JSON.stringify(user)),
                performanceData: null,
                evaluations: [],
                currentPeriod: period,
                error: 'Failed to load performance data.'
            }
        };
    }
}, { roles: ['worker'] });

export default WorkerPerformancePage;
