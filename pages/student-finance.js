import React, { useState } from 'react';
import Image from 'next/image';
import Layout from '../components/Layout';
import { withAuth } from '../lib/withAuth';
import pool from '../lib/db';

const StudentFinancePage = ({ user, userPayments }) => {
    const [payments, setPayments] = useState(userPayments);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [uploadingProof, setUploadingProof] = useState(false);

    const handleUploadProof = async (paymentId, file) => {
        if (!file) return;

        setUploadingProof(true);
        const formData = new FormData();
        formData.append('payment_proof', file);

        try {
            const response = await fetch(`/api/payments/${paymentId}/upload-proof`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                // Refresh payments
                window.location.reload();
            } else {
                const result = await response.json();
                alert(`خطأ: ${result.message}`);
            }
        } catch (err) {
            alert('حدث خطأ في رفع الملف.');
        } finally {
            setUploadingProof(false);
        }
    };

    const handleDeleteProof = async (paymentId) => {
        if (!confirm('هل أنت متأكد من حذف إيصال الدفع؟ ستحتاج لرفع إيصال جديد.')) {
            return;
        }

        try {
            const response = await fetch(`/api/payments/${paymentId}/delete-proof`, {
                method: 'DELETE'
            });

            if (response.ok) {
                // Refresh payments
                window.location.reload();
            } else {
                const result = await response.json();
                alert(`خطأ: ${result.message}`);
            }
        } catch (err) {
            alert('حدث خطأ في حذف الملف.');
        }
    };

    const getStatusText = (status) => {
        const statusMap = {
            'due': 'مستحقة',
            'pending_review': 'قيد المراجعة',
            'paid': 'مدفوعة',
            'late': 'متأخرة',
            'waived': 'معفاة'
        };
        return statusMap[status] || status;
    };

    const getStatusColor = (status) => {
        const colorMap = {
            'due': '#ffc107',
            'pending_review': '#17a2b8',
            'paid': '#28a745',
            'late': '#dc3545',
            'waived': '#6c757d'
        };
        return colorMap[status] || '#6c757d';
    };

    return (
        <Layout user={user}>
            <style jsx>{`
                .finance-container { max-width: 1000px; margin: 0 auto; }
                .payments-grid { display: grid; gap: 20px; margin-top: 20px; }
                .payment-card { 
                    background: #fff; 
                    padding: 20px; 
                    border-radius: 8px; 
                    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                    border-left: 4px solid #007bff;
                }
                .payment-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
                .payment-title { margin: 0; color: #333; }
                .status-badge { 
                    padding: 6px 12px; 
                    border-radius: 20px; 
                    color: white; 
                    font-size: 12px; 
                    font-weight: bold;
                }
                .payment-details { margin: 15px 0; }
                .detail-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
                .detail-label { font-weight: bold; color: #666; }
                .detail-value { color: #333; }
                .upload-section { 
                    margin-top: 20px; 
                    padding: 15px; 
                    background: #f8f9fa; 
                    border-radius: 6px;
                    border: 2px dashed #dee2e6;
                }
                .upload-btn { 
                    background: linear-gradient(135deg, #28a745, #20c997);
                    color: white; 
                    padding: 12px 24px; 
                    border: none; 
                    border-radius: 8px; 
                    cursor: pointer;
                    margin-top: 15px;
                    font-size: 16px;
                    font-weight: bold;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    min-width: 180px;
                }
                .upload-btn:hover:not(:disabled) { 
                    background: linear-gradient(135deg, #218838, #1ea080);
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px rgba(40, 167, 69, 0.4);
                }
                .upload-btn:disabled { 
                    background: #6c757d; 
                    cursor: not-allowed; 
                    transform: none;
                    box-shadow: none;
                }
                .file-input { margin: 10px 0; }
                .proof-image { max-width: 200px; border-radius: 8px; margin-top: 10px; }
                .amount-highlight { 
                    font-size: 24px; 
                    font-weight: bold; 
                    color: #28a745; 
                    text-align: center; 
                    margin: 15px 0;
                }
                .delete-proof-btn {
                    background: #dc3545;
                    color: white;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                    transition: all 0.3s ease;
                }
                .delete-proof-btn:hover {
                    background: #c82333;
                    transform: scale(1.05);
                }
            `}</style>
            
            <div className="finance-container">
                <h1><i className="fas fa-credit-card fa-fw"></i> المدفوعات والرسوم</h1>
                <p>إدارة مدفوعاتك ورفع إيصالات الدفع</p>

                {payments.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
                        <i className="fas fa-receipt fa-3x" style={{ marginBottom: '20px' }}></i>
                        <h3>لا توجد مدفوعات</h3>
                        <p>لم يتم العثور على أي مدفوعات مطلوبة حالياً</p>
                    </div>
                ) : (
                    <div className="payments-grid">
                        {payments.map(payment => (
                            <div key={payment.id} className="payment-card">
                                <div className="payment-header">
                                    <h3 className="payment-title">{payment.course_name}</h3>
                                    <span 
                                        className="status-badge" 
                                        style={{ backgroundColor: getStatusColor(payment.status) }}
                                    >
                                        {getStatusText(payment.status)}
                                    </span>
                                </div>

                                <div className="amount-highlight">
                                    {payment.amount} {payment.currency}
                                </div>

                                <div className="payment-details">
                                    <div className="detail-row">
                                        <span className="detail-label">تاريخ الاستحقاق:</span>
                                        <span className="detail-value">
                                            {new Date(payment.due_date).toLocaleDateString('ar-EG')}
                                        </span>
                                    </div>
                                    {payment.notes && (
                                        <div className="detail-row">
                                            <span className="detail-label">ملاحظات:</span>
                                            <span className="detail-value">{payment.notes}</span>
                                        </div>
                                    )}
                                </div>

                                {(payment.status === 'due' || (payment.status === 'pending_review' && !payment.payment_proof_url)) && (
                                    <div className="upload-section">
                                        <h4><i className="fas fa-upload"></i> رفع إيصال الدفع</h4>
                                        <p>يرجى رفع صورة واضحة لإيصال الدفع لمراجعته</p>
                                        
                                        {/* Hidden file input */}
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            id={`file-${payment.id}`}
                                            style={{ display: 'none' }}
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    handleUploadProof(payment.id, file);
                                                }
                                            }}
                                            disabled={uploadingProof}
                                        />
                                        
                                        {/* Custom upload button */}
                                        <button 
                                            className="upload-btn"
                                            onClick={() => {
                                                if (!uploadingProof) {
                                                    document.getElementById(`file-${payment.id}`).click();
                                                }
                                            }}
                                            disabled={uploadingProof}
                                        >
                                            {uploadingProof ? (
                                                <>
                                                    <i className="fas fa-spinner fa-spin"></i> جاري الرفع...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fas fa-upload"></i> رفع الإيصال
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}

                                {payment.payment_proof_url && (
                                    <div style={{ marginTop: '15px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                            <h4>إيصال الدفع المرفوع:</h4>
                                            {payment.status === 'pending_review' && (
                                                <button 
                                                    onClick={() => handleDeleteProof(payment.id)}
                                                    className="delete-proof-btn"
                                                    title="حذف الإيصال ورفع إيصال جديد"
                                                >
                                                    🗑️ حذف الإيصال
                                                </button>
                                            )}
                                        </div>
                                        <Image 
                                            src={payment.payment_proof_url} 
                                            alt="إيصال الدفع" 
                                            width={500}
                                            height={300}
                                            className="proof-image"
                                            style={{ objectFit: 'contain' }}
                                        />
                                        {payment.status === 'pending_review' && (
                                            <p style={{ color: '#17a2b8', fontSize: '14px', marginTop: '10px' }}>
                                                <i className="fas fa-info-circle"></i> الإيصال قيد المراجعة.
                                            </p>
                                        )}
                                    </div>
                                )}
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
    
    try {
        // Get user's payments
        const paymentsResult = await pool.query(`
            SELECT p.*, c.name as course_name
            FROM payments p
            JOIN enrollments e ON p.enrollment_id = e.id
            JOIN courses c ON e.course_id = c.id
            WHERE e.user_id = $1
            ORDER BY p.due_date ASC
        `, [user.id]);

        return {
            props: {
                user: JSON.parse(JSON.stringify(user)),
                userPayments: JSON.parse(JSON.stringify(paymentsResult.rows))
            }
        };
    } catch (error) {
        console.error('Student finance page error:', error);
        return {
            props: {
                user: JSON.parse(JSON.stringify(user)),
                userPayments: []
            }
        };
    }
});

export default StudentFinancePage;