import React from 'react';
import Link from 'next/link';

const DefaultDashboard = ({ user }) => {
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
                .welcome-section {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 40px;
                    border-radius: 12px;
                    text-align: center;
                    margin-bottom: 30px;
                    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
                }
                .welcome-section h1 {
                    margin: 0 0 15px 0;
                    font-size: 2.5rem;
                }
                .welcome-section p {
                    margin: 10px 0;
                    font-size: 1.1rem;
                    opacity: 0.9;
                }
                .role-badge {
                    background: rgba(255,255,255,0.2);
                    padding: 8px 20px;
                    border-radius: 25px;
                    display: inline-block;
                    margin-top: 15px;
                    font-weight: bold;
                }
                .info-section {
                    background: white;
                    padding: 30px;
                    border-radius: 12px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.08);
                    text-align: center;
                }
                .info-section h2 {
                    color: #333;
                    margin-bottom: 20px;
                }
                .info-section p {
                    color: #666;
                    line-height: 1.6;
                    margin-bottom: 25px;
                }
                .contact-btn {
                    background: #667eea;
                    color: white;
                    padding: 12px 25px;
                    border: none;
                    border-radius: 8px;
                    text-decoration: none;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    transition: background 0.3s ease;
                    font-size: 1rem;
                }
                .contact-btn:hover {
                    background: #5a67d8;
                }
            `}</style>
            
            <div className="welcome-section">
                <h1><i className="fas fa-user-circle fa-fw"></i> مرحباً بك، {user.full_name}</h1>
                <p>نحن سعداء لوجودك معنا في مركز الإقامة</p>
                <div className="role-badge">
                    دورك الحالي: {user.role}
                </div>
            </div>

            <div className="info-section">
                <h2><i className="fas fa-tools fa-fw"></i> لوحة التحكم قيد التطوير</h2>
                <p>
                    نعمل حالياً على تطوير لوحة تحكم مخصصة لدورك. 
                    ستتمكن قريباً من الوصول إلى جميع الأدوات والميزات المناسبة لاحتياجاتك.
                </p>
                <p>
                    في الوقت الحالي، يمكنك استخدام القائمة الجانبية للوصول إلى الصفحات المتاحة.
                </p>
                <Link href="/profile" className="contact-btn">
                    <i className="fas fa-user-edit"></i>
                    تحديث الملف الشخصي
                </Link>
            </div>
        </div>
    );
};

export default DefaultDashboard;