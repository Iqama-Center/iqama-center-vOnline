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
                setPendingEnrollments(prev => prev.filter(e => e.id !== enrollmentId));
            } else {
                setMessage({ text: result.message, isError: true });
            }
        } catch (error) {
            setMessage({ text: 'حدث خطأ في الاتصال بالخادم', isError: true });
        }
    };

    const handleFixStatus = async (enrollmentId) => {
        if (!window.confirm('هل أنت متأكد من أنك تريد تفعيل هذا التسجيل يدويًا؟ سيتم تغيير حالة الطالب إلى نشط.')) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/enrollments/${enrollmentId}/fix-status`, {
                method: 'POST'
            });

            const result = await response.json();
            
            if (response.ok) {
                setMessage({ text: result.message, isError: false });
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
                .enrollments-container { padding: 20px; }
                .page-header { background: linear-gradient(135deg, #6f42c1 0%, #007bff 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; }
                .page-header h1 { margin: 0 0 10px 0; font-size: 2rem; }
                .enrollments-list { display: grid; gap: 20px; }
                .enrollment-card { background: white; border-radius: 8px; padding: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-left: 4px solid #6f42c1; }
                .enrollment-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; }
                .user-info { flex: 1; }
                .user-name { font-size: 1.2rem; font-weight: bold; color: #333; }
                .enrollment-status { font-weight: bold; padding: 3px 8px; border-radius: 12px; font-size: 0.8rem; }
                .status-pending_approval { background: #fff3cd; color: #856404; }
                .status-pending_payment { background: #f8d7da; color: #721c24; }
                .action-buttons { display: flex; gap: 10px; justify-content: flex-end; }
                .btn { padding: 8px 16px; border: none; border-radius: 5px; cursor: pointer; font-size: 0.9rem; font-weight: bold; }
                .btn-approve { background: #28a745; color: white; }
                .btn-reject { background: #dc3545; color: white; }
                .btn-fix { background: #ffc107; color: #212529; }
                .message { padding: 15px; border-radius: 5px; margin-bottom: 20px; text-align: center; }
                .message.success { background: #d4edda; color: #155724; }
                .message.error { background: #f8d7da; color: #721c24; }
                .loading, .empty-state { text-align: center; padding: 60px 20px; color: #666; }
            `}</style>

            <div className="enrollments-container">
                <div className="page-header">
                    <h1><i className="fas fa-user-check fa-fw"></i> موافقات التسجيل</h1>
                    <p>مراجعة والموافقة على طلبات تسجيل العاملين في الدورات</p>
                </div>

                {message && <div className={`message ${message.isError ? 'error' : 'success'}`}>{message.text}</div>}

                {loading ? (
                    <div className="loading">جاري تحميل...</div>
                ) : pendingEnrollments.length === 0 ? (
                    <div className="empty-state">لا توجد طلبات معلقة</div>
                ) : (
                    <div className="enrollments-list">
                        {pendingEnrollments.map(enrollment => (
                            <div key={enrollment.id} className="enrollment-card">
                                <div className="enrollment-header">
                                    <div className="user-info">
                                        <div className="user-name">{enrollment.user_name}</div>
                                        <div><span className={`enrollment-status status-${enrollment.status}`}>{enrollment.status}</span></div>
                                    </div>
                                    <div>{new Date(enrollment.enrollment_date).toLocaleDateString('ar-EG')}</div>
                                </div>
                                <div className="course-info">{enrollment.course_name}</div>
                                <div className="action-buttons">
                                    {enrollment.status === 'pending_approval' && (
                                        <>
                                            <button className="btn btn-approve" onClick={() => handleApproval(enrollment.id, 'approve')}>موافقة</button>
                                            <button className="btn btn-reject" onClick={() => handleApproval(enrollment.id, 'reject')}>رفض</button>
                                        </>
                                    )}
                                    <button className="btn btn-fix" onClick={() => handleFixStatus(enrollment.id)}>تأكيد التسجيل يدويًا</button>
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
    if (!['admin', 'head'].includes(user.role)) {
        return { redirect: { destination: '/dashboard', permanent: false } };
    }
    return { props: { user } };
}, { roles: ['admin', 'head'] });

export default EnrollmentApprovalsPage;
