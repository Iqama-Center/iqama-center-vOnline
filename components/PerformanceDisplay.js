import React from 'react';

const PerformanceDisplay = ({ performanceData }) => {
    if (!performanceData) {
        return <p>لا توجد بيانات أداء متاحة حاليًا.</p>;
    }

    const { overall_score = 0, weekly_score = 0, completion_rate = 0 } = performanceData;

    const getScoreColor = (score) => {
        if (score >= 90) return '#28a745'; // Green
        if (score >= 75) return '#17a2b8'; // Blue
        if (score >= 60) return '#ffc107'; // Yellow
        return '#dc3545'; // Red
    };

    return (
        <div className="performance-container">
            <style jsx>{`
                .performance-container {
                    background: #fff;
                    border-radius: 12px;
                    padding: 25px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.08);
                }
                .performance-header h3 {
                    margin: 0 0 20px 0;
                    color: #333;
                    font-size: 1.5rem;
                    text-align: center;
                }
                .performance-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 25px;
                }
                .metric-card {
                    background: #f8f9fa;
                    border-radius: 10px;
                    padding: 20px;
                    text-align: center;
                    border-bottom: 4px solid;
                }
                .metric-value {
                    font-size: 2.5rem;
                    font-weight: bold;
                    margin-bottom: 10px;
                }
                .metric-label {
                    font-size: 1rem;
                    color: #666;
                }
                .progress-bar-container {
                    background: #e9ecef;
                    border-radius: 20px;
                    height: 10px;
                    overflow: hidden;
                    margin-top: 15px;
                }
                .progress-bar {
                    height: 100%;
                    border-radius: 20px;
                    transition: width 0.5s ease-in-out;
                }
            `}</style>

            <div className="performance-header">
                <h3><i className="fas fa-chart-line"></i> ملخص الأداء</h3>
            </div>

            <div className="performance-grid">
                <div className="metric-card" style={{ borderBottomColor: getScoreColor(overall_score) }}>
                    <div className="metric-value" style={{ color: getScoreColor(overall_score) }}>
                        {overall_score.toFixed(1)}%
                    </div>
                    <div className="metric-label">التقييم العام للدورة</div>
                </div>

                <div className="metric-card" style={{ borderBottomColor: getScoreColor(weekly_score) }}>
                    <div className="metric-value" style={{ color: getScoreColor(weekly_score) }}>
                        {weekly_score.toFixed(1)}%
                    </div>
                    <div className="metric-label">أداء آخر 7 أيام</div>
                </div>

                <div className="metric-card" style={{ borderBottomColor: getScoreColor(completion_rate) }}>
                    <div className="metric-value" style={{ color: getScoreColor(completion_rate) }}>
                        {completion_rate.toFixed(1)}%
                    </div>
                    <div className="metric-label">معدل إتمام المهام</div>
                    <div className="progress-bar-container">
                        <div 
                            className="progress-bar"
                            style={{ width: `${completion_rate}%`, backgroundColor: getScoreColor(completion_rate) }}
                        ></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PerformanceDisplay;
