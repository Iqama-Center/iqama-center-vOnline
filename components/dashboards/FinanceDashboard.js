import React from 'react';
import Link from 'next/link';

const FinanceDashboard = ({ stats }) => {
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
                    color: #007bff;
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
                }
                .quick-actions h2 {
                    border-bottom: 2px solid #007bff;
                    padding-bottom: 10px;
                    margin-bottom: 20px;
                }
                .action-buttons {
                    display: flex;
                    gap: 15px;
                    flex-wrap: wrap;
                }
                .action-btn {
                    background-color: #007bff;
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
                    background-color: #0056b3;
                }
            `}</style>
            <h1><i className="fas fa-wallet fa-fw"></i> لوحة التحكم المالية</h1>
            <p>مرحباً بك في قسم المالية. هنا يمكنك إدارة ومتابعة كل المعاملات المالية للمركز.</p>
            
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="icon"><i className="fas fa-receipt"></i></div>
                    <h3>{stats?.pending_review_count || 0}</h3>
                    <p>مدفوعات قيد المراجعة</p>
                </div>
                <div className="stat-card">
                    <div className="icon"><i className="fas fa-file-invoice-dollar"></i></div>
                    <h3>{stats?.due_count || 0}</h3>
                    <p>مدفوعات مستحقة</p>
                </div>
                <div className="stat-card">
                    <div className="icon"><i className="fas fa-hourglass-end"></i></div>
                    <h3>{stats?.late_count || 0}</h3>
                    <p>مدفوعات متأخرة</p>
                </div>
                <div className="stat-card">
                    <div className="icon"><i className="fas fa-check-circle"></i></div>
                    <h3>{stats?.total_paid_this_month || '0.00'}</h3>
                    <p>إجمالي المدفوعات (آخر 30 يوم)</p>
                </div>
            </div>

            <div className="quick-actions">
                <h2>إجراءات سريعة</h2>
                <div className="action-buttons">
                    <Link href="/finance" className="action-btn">
                        <i className="fas fa-tasks"></i> مراجعة وتأكيد المدفوعات
                    </Link>
                    <Link href="/finance" className="action-btn">
                        <i className="fas fa-chart-line"></i> عرض التقارير المالية
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default FinanceDashboard;