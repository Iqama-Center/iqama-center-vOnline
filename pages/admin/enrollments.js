import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { withAuth } from '../../lib/withAuth';

const EnrollmentApprovalsPage = ({ user }) => {
    const [pendingEnrollments, setPendingEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        loadPendingEnrollments();
    }, []);

    const loadPendingEnrollments = async () => {
        try {
            const response = await fetch('/api/admin/enrollments');
            
            if (!response.ok) {
                throw new Error('Failed to fetch enrollments');
            }
            
            const data = await response.json();
            setPendingEnrollments(data.enrollments || []);
        } catch (error) {
            console.error('Error loading enrollments:', error);
            setMessage({ text: 'حدث خطأ في تحميل طلبات التسجيل', isError: true });
        } finally {
            setLoading(false);
        }
    };

    const handleApproval = async (enrollmentId, action) => {
        const actionText = action === 'approve' ? 'الموافقة على' : 'رفض';
        if (!window.confirm(`هل أنت متأكد من ${actionText} هذا التسجيل؟`)) {
            return;
        }

        try {
            const response = await fetch('/api/admin/enrollments/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enrollmentId, action })
            });

            const result = await response.json();
            
            if (response.ok) {
                setMessage({ text: result.message, isError: false });
                // Remove the processed enrollment from the list
                setPendingEnrollments(prev => prev.filter(e => e.id !== enrollmentId));
            } else {
                setMessage({ text: result.message, isError: true });
            }
        } catch (error) {
            setMessage({ text: 'حدث خطأ في الاتصال بالخادم', isError: true });
        }
    };

    return (
        <Layout user={user}>
            <style jsx>{`
                .enrollments-container {
                    padding: 20px;
                }
                .page-header {
                    background: linear-gradient(135deg, #6f42c1 0%, #007bff 100%);
                    color: white;
                    padding: 30px;
                    border-radius: 12px;
                    margin-bottom: 30px;
                }
                .page-header h1 {
                    margin: 0 0 10px 0;
                    font-size: 2rem;
                }
                .enrollments-list {
                    display: grid;
                    gap: 20px;
                }
                .enrollment-card {
                    background: white;
                    border-radius: 8px;
                    padding: 25px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    border-left: 4px solid #6f42c1;
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }
                .enrollment-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 15px rgba(0,0,0,0.15);
                }
                .enrollment-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 15px;
                }
                .user-info {
                    flex: 1;
                }
                .user-name {
                    font-size: 1.2rem;
                    font-weight: bold;
                    color: #333;
                    margin-bottom: 5px;
                }
                .user-email {
                    color: #666;
                    font-size: 0.9rem;
                    margin-bottom: 5px;
                }
                .user-role {
                    display: inline-block;
                    background: #e2e3f1;
                    color: #6f42c1;
                    padding: 3px 8px;
                    border-radius: 12px;
                    font-size: 0.8rem;
                    font-weight: bold;
                }
                .enrollment-date {
                    color: #888;
                    font-size: 0.85rem;
                    text-align: right;
                }
                .course-info {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 6px;
                    margin-bottom: 15px;
                }
                .course-name {
                    font-weight: bold;
                    color: #495057;
                    margin-bottom: 8px;
                }
                .specializations {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                    margin-top: 10px;
                }
                .specialization-tag {
                    background: #17a2b8;
                    color: white;
                    padding: 3px 8px;
                    border-radius: 10px;
                    font-size: 0.75rem;
                }
                .action-buttons {
                    display: flex;
                    gap: 10px;
                    justify-content: flex-end;
                }
                .btn {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 0.9rem;
                    font-weight: bold;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                .btn-approve {
                    background: #28a745;
                    color: white;
                }
                .btn-approve:hover {
                    background: #218838;
                    transform: translateY(-1px);
                }
                .btn-reject {
                    background: #dc3545;
                    color: white;
                }
                .btn-reject:hover {
                    background: #c82333;
                    transform: translateY(-1px);
                }
                .stats-bar {
                    display: flex;
                    gap: 20px;
                    margin-bottom: 30px;
                    flex-wrap: wrap;
                }
                .stat-card {
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    text-align: center;
                    min-width: 150px;
                }
                .stat-number {
                    font-size: 2rem;
                    font-weight: bold;
                    color: #6f42c1;
                    margin-bottom: 5px;
                }
                .stat-label {
                    color: #666;
                    font-size: 0.9rem;
                }
                .message {
                    padding: 15px;
                    border-radius: 5px;
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
                .loading {
                    text-align: center;
                    padding: 40px;
                    color: #666;
                }
                .empty-state {
                    text-align: center;
                    padding: 60px 20px;
                    color: #666;
                }
                .empty-state i {
                    font-size: 4rem;
                    color: #ddd;
                    margin-bottom: 20px;
                }
                @media (max-width: 768px) {
                    .enrollment-header {
                        flex-direction: column;
                        gap: 10px;
                    }
                    .action-buttons {
                        justify-content: center;
                    }
                    .stats-bar {
                        justify-content: center;
                    }
                }
            `}</style>

            <div className="enrollments-container">
                <div className="page-header">
                    <h1><i className="fas fa-user-check fa-fw"></i> موافقات التسجيل</h1>
                    <p>مراجعة والموافقة على طلبات تسجيل العاملين في الدورات</p>
                </div>

                {/* Statistics */}
                <div className="stats-bar">
                    <div className="stat-card">
                        <div className="stat-number">{pendingEnrollments.length}</div>
                        <div className="stat-label">طلبات معلقة</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-number">{pendingEnrollments.filter(e => e.user_role === 'worker').length}</div>
                        <div className="stat-label">طلبات العاملين</div>
                    </div>
                </div>

                {/* Message Display */}
                {message && (
                    <div className={`message ${message.isError ? 'error' : 'success'}`}>
                        {message.text}
                    </div>
                )}

                {/* Enrollments List */}
                {loading ? (
                    <div className="loading">
                        <i className="fas fa-spinner fa-spin fa-2x"></i>
                        <p>جاري تحميل طلبات التسجيل...</p>
                    </div>
                ) : pendingEnrollments.length === 0 ? (
                    <div className="empty-state">
                        <i className="fas fa-check-circle"></i>
                        <h3>لا توجد طلبات معلقة</h3>
                        <p>جميع طلبات التسجيل تمت معالجتها</p>
                    </div>
                ) : (
                    <div className="enrollments-list">
                        {pendingEnrollments.map(enrollment => (
                            <div key={enrollment.id} className="enrollment-card">
                                <div className="enrollment-header">
                                    <div className="user-info">
                                        <div className="user-name">{enrollment.user_name}</div>
                                        <div className="user-email">{enrollment.user_email}</div>
                                        <span className="user-role">
                                            {enrollment.user_role === 'worker' ? 'عامل' : enrollment.user_role}
                                        </span>
                                    </div>
                                    <div className="enrollment-date">
                                        {new Date(enrollment.enrollment_date).toLocaleDateString('ar-EG')}
                                    </div>
                                </div>

                                <div className="course-info">
                                    <div className="course-name">
                                        <i className="fas fa-graduation-cap"></i> {enrollment.course_name}
                                    </div>
                                    
                                    {enrollment.specializations && enrollment.specializations.length > 0 && (
                                        <div>
                                            <strong>التخصصات:</strong>
                                            <div className="specializations">
                                                {enrollment.specializations.map((spec, index) => (
                                                    <span key={index} className="specialization-tag">
                                                        {spec}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="action-buttons">
                                    <button 
                                        className="btn btn-approve"
                                        onClick={() => handleApproval(enrollment.id, 'approve')}
                                    >
                                        <i className="fas fa-check"></i> موافقة
                                    </button>
                                    <button 
                                        className="btn btn-reject"
                                        onClick={() => handleApproval(enrollment.id, 'reject')}
                                    >
                                        <i className="fas fa-times"></i> رفض
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export const getServerSideProps = withAuth(async (context) => {
    const { user } = context;
    
    // Only allow admins and heads to access this page
    if (!['admin', 'head'].includes(user.role)) {
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
}, { roles: ['admin', 'head'] });

export default EnrollmentApprovalsPage;