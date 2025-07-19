import React, { useState, useEffect } from 'react';

const SchedulerMonitor = () => {
    const [schedulerStatus, setSchedulerStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lastCheck, setLastCheck] = useState(null);

    useEffect(() => {
        checkSchedulerStatus();
        // Check status every 5 minutes
        const interval = setInterval(checkSchedulerStatus, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const checkSchedulerStatus = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/scheduler/status');
            const data = await response.json();
            setSchedulerStatus(data);
            setLastCheck(new Date());
        } catch (error) {
            console.error('Error checking scheduler status:', error);
            setSchedulerStatus({ success: false, error: error.message });
        } finally {
            setLoading(false);
        }
    };

    const restartScheduler = async () => {
        try {
            const response = await fetch('/api/scheduler/start', { method: 'POST' });
            const data = await response.json();
            if (data.success) {
                alert('✅ تم إعادة تشغيل المجدول بنجاح');
                checkSchedulerStatus();
            }
        } catch (error) {
            alert('❌ فشل في إعادة تشغيل المجدول: ' + error.message);
        }
    };

    if (loading && !schedulerStatus) {
        return (
            <div className="scheduler-monitor loading">
                <div className="loading-spinner">جاري فحص حالة المجدول...</div>
            </div>
        );
    }

    return (
        <div className="scheduler-monitor">
            <div className="monitor-header">
                <h3>🤖 مراقب النظام التلقائي</h3>
                <div className="status-indicator">
                    <span className={`status-dot ${schedulerStatus?.success ? 'active' : 'inactive'}`}></span>
                    <span className="status-text">
                        {schedulerStatus?.success ? 'يعمل بشكل طبيعي' : 'غير نشط'}
                    </span>
                </div>
            </div>

            {schedulerStatus?.success ? (
                <div className="scheduler-details">
                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon">📅</div>
                            <h4>إطلاق المهام اليومية</h4>
                            <p>كل ساعة - يطلق المهام بعد انتهاء أوقات اللقاءات</p>
                        </div>
                        
                        <div className="feature-card">
                            <div className="feature-icon">📊</div>
                            <h4>تقييم الأداء</h4>
                            <p>كل 6 ساعات - يحدث تقييمات الطلاب والمعلمين</p>
                        </div>
                        
                        <div className="feature-card">
                            <div className="feature-icon">🚀</div>
                            <h4>فحص الإطلاق التلقائي</h4>
                            <p>كل 12 ساعة - يطلق الدورات عند اكتمال الشروط</p>
                        </div>
                    </div>

                    <div className="scheduler-info">
                        <div className="info-row">
                            <span className="info-label">حالة النظام:</span>
                            <span className="info-value success">✅ يعمل بشكل طبيعي</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">التوافق مع الاستضافة:</span>
                            <span className="info-value">🌐 يعمل على أي منصة استضافة</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">الاعتمادات الخارجية:</span>
                            <span className="info-value">❌ لا يحتاج خدمات خارجية</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">آخر فحص:</span>
                            <span className="info-value">
                                {lastCheck ? lastCheck.toLocaleString('ar-SA') : 'غير محدد'}
                            </span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="scheduler-error">
                    <div className="error-message">
                        <h4>⚠️ المجدول غير نشط</h4>
                        <p>النظام التلقائي لإدارة الدورات غير يعمل حالياً</p>
                        {schedulerStatus?.error && (
                            <p className="error-details">خطأ: {schedulerStatus.error}</p>
                        )}
                    </div>
                </div>
            )}

            <div className="monitor-actions">
                <button onClick={checkSchedulerStatus} className="check-btn">
                    🔄 فحص الحالة
                </button>
                <button onClick={restartScheduler} className="restart-btn">
                    🚀 إعادة تشغيل
                </button>
            </div>

            <style jsx>{`
                .scheduler-monitor {
                    background: white;
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    margin: 20px 0;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    direction: rtl;
                }

                .monitor-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 2px solid #f0f0f0;
                }

                .monitor-header h3 {
                    margin: 0;
                    color: #333;
                    font-size: 20px;
                }

                .status-indicator {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .status-dot {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    animation: pulse 2s infinite;
                }

                .status-dot.active {
                    background: #4CAF50;
                }

                .status-dot.inactive {
                    background: #f44336;
                }

                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }

                .status-text {
                    font-weight: bold;
                    color: #333;
                }

                .features-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 15px;
                    margin-bottom: 20px;
                }

                .feature-card {
                    background: #f8f9fa;
                    border: 2px solid #e9ecef;
                    border-radius: 8px;
                    padding: 15px;
                    text-align: center;
                }

                .feature-icon {
                    font-size: 32px;
                    margin-bottom: 10px;
                }

                .feature-card h4 {
                    margin: 10px 0 5px 0;
                    color: #333;
                    font-size: 16px;
                }

                .feature-card p {
                    margin: 0;
                    color: #666;
                    font-size: 14px;
                    line-height: 1.4;
                }

                .scheduler-info {
                    background: #f8f9fa;
                    border-radius: 8px;
                    padding: 15px;
                    margin-bottom: 20px;
                }

                .info-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 0;
                    border-bottom: 1px solid #e9ecef;
                }

                .info-row:last-child {
                    border-bottom: none;
                }

                .info-label {
                    font-weight: bold;
                    color: #495057;
                }

                .info-value {
                    color: #333;
                }

                .info-value.success {
                    color: #28a745;
                    font-weight: bold;
                }

                .scheduler-error {
                    background: #fff3cd;
                    border: 2px solid #ffeaa7;
                    border-radius: 8px;
                    padding: 20px;
                    margin-bottom: 20px;
                    text-align: center;
                }

                .error-message h4 {
                    margin: 0 0 10px 0;
                    color: #856404;
                }

                .error-message p {
                    margin: 5px 0;
                    color: #856404;
                }

                .error-details {
                    font-size: 12px;
                    background: #f8d7da;
                    padding: 8px;
                    border-radius: 4px;
                    margin-top: 10px;
                }

                .monitor-actions {
                    display: flex;
                    gap: 10px;
                    justify-content: center;
                }

                .check-btn, .restart-btn {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: bold;
                    font-size: 14px;
                    transition: all 0.3s ease;
                }

                .check-btn {
                    background: #17a2b8;
                    color: white;
                }

                .check-btn:hover {
                    background: #138496;
                }

                .restart-btn {
                    background: #28a745;
                    color: white;
                }

                .restart-btn:hover {
                    background: #218838;
                }

                .loading-spinner {
                    text-align: center;
                    padding: 40px;
                    color: #666;
                }

                @media (max-width: 768px) {
                    .monitor-header {
                        flex-direction: column;
                        gap: 10px;
                        text-align: center;
                    }

                    .features-grid {
                        grid-template-columns: 1fr;
                    }

                    .info-row {
                        flex-direction: column;
                        gap: 5px;
                        text-align: center;
                    }

                    .monitor-actions {
                        flex-direction: column;
                    }
                }
            `}</style>
        </div>
    );
};

export default SchedulerMonitor;