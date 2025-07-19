import React from 'react';
import Link from 'next/link';

const HeadDashboard = ({ stats }) => {
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
                    color: #28a745;
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
                    border-bottom: 2px solid #28a745;
                    padding-bottom: 10px;
                    margin-bottom: 20px;
                }
                .action-buttons {
                    display: flex;
                    gap: 15px;
                    flex-wrap: wrap;
                }
                .action-btn {
                    background-color: #28a745;
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
                    background-color: #218838;
                }
            `}</style>
            <h1><i className="fas fa-sitemap fa-fw"></i> لوحة تحكم رئيس القسم</h1>
            <p>مرحباً بك. هنا يمكنك إدارة قسمك، ومتابعة المعلمين والطلاب، والموافقة على الدورات.</p>
            
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="icon"><i className="fas fa-chalkboard-teacher"></i></div>
                    <h3>{stats?.teacher_count || 0}</h3>
                    <p>المعلمون في قسمك</p>
                </div>
                <div className="stat-card">
                    <div className="icon"><i className="fas fa-user-graduate"></i></div>
                    <h3>{stats?.student_count || 0}</h3>
                    <p>الطلاب في قسمك</p>
                </div>
                <div className="stat-card">
                    <div className="icon"><i className="fas fa-tasks"></i></div>
                    <h3>{stats?.pending_courses_count || 0}</h3>
                    <p>دورات بانتظار الموافقة</p>
                </div>
                <div className="stat-card">
                    <div className="icon"><i className="fas fa-book-open"></i></div>
                    <h3>{stats?.active_courses_count || 0}</h3>
                    <p>الدورات النشطة حالياً</p>
                </div>
            </div>

            <div className="quick-actions">
                <h2>إجراءات سريعة</h2>
                <div className="action-buttons">
                    <Link href="/admin/courses/approvals" className="action-btn">
                        <i className="fas fa-check-double"></i> الموافقة على الدورات
                    </Link>
                    <Link href="/admin/users?role=teacher" className="action-btn">
                        <i className="fas fa-users"></i> إدارة المعلمين
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default HeadDashboard;