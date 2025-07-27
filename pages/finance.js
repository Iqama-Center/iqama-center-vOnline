import React, { useState } from 'react';
import Image from 'next/image';
import Layout from '../components/Layout';
import { withAuth } from '../lib/withAuth';
import pool from '../lib/db';
import { useRouter } from 'next/router';
import { safeSerialize, createSuccessResponse, createErrorResponse, REVALIDATION_TIMES } from '../lib/isrUtils';

const PaymentConfirmationModal = ({ isOpen, onClose, payment, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div className="modal" style={{ display: 'flex' }}>
            <div className="modal-content">
                <span className="close-button" onClick={onClose}>×</span>
                <h2>تأكيد استلام دفعة</h2>
                <p>الرجاء مراجعة تفاصيل الدفعة وإيصال الدفع قبل التأكيد.</p>
                <div>
                    <p><strong>الطالب:</strong> {payment.full_name}</p>
                    <p><strong>الدورة:</strong> {payment.course_name}</p>
                    <p><strong>المبلغ:</strong> {payment.amount} {payment.currency}</p>
                    <p><strong>تاريخ الاستحقاق:</strong> {new Date(payment.due_date).toLocaleDateString('ar-EG')}</p>
                </div>
                {payment.payment_proof_url && (
                    <div className="payment-proof">
                        <h4>إيصال الدفع:</h4>
                        <a href={payment.payment_proof_url} target="_blank" rel="noopener noreferrer">
                            <Image src={payment.payment_proof_url} alt="إيصال الدفع" width={500} height={300} style={{ maxWidth: '100%', borderRadius: '8px', objectFit: 'contain' }} />
                        </a>
                    </div>
                )}
                <div className="modal-actions" style={{ marginTop: '25px', display: 'flex', justifyContent: 'center', gap: '15px', padding: '10px 0' }}>
                    <button 
                        onClick={() => onConfirm(payment.id, 'paid')} 
                        style={{
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            padding: '12px 24px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: '600',
                            transition: 'all 0.2s ease',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            textDecoration: 'none',
                            minWidth: '140px',
                            justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#218838';
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 4px 12px rgba(40, 167, 69, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = '#28a745';
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = 'none';
                        }}
                    >
                        <i className="fas fa-check"></i> تأكيد الدفعة
                    </button>
                    <button 
                        onClick={() => onConfirm(payment.id, 'rejected')} 
                        style={{
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            padding: '12px 24px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: '600',
                            transition: 'all 0.2s ease',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            textDecoration: 'none',
                            minWidth: '140px',
                            justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#c82333';
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 4px 12px rgba(220, 53, 69, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = '#dc3545';
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = 'none';
                        }}
                    >
                        <i className="fas fa-times"></i> رفض الدفعة
                    </button>
                </div>
            </div>
        </div>
    );
};

const FinancePage = ({ user, initialPayments }) => {
    const [payments, setPayments] = useState(initialPayments);
    const [filter, setFilter] = useState('pending_review');
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const router = useRouter();

    const handleConfirmPayment = async (paymentId, newStatus) => {
        try {
            const response = await fetch(`/api/payments/${paymentId}/confirm`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                router.replace(router.asPath); // Refresh data
                setIsModalOpen(false);
            } else {
                const result = await response.json();
                alert(`خطأ: ${result.message}`);
                // Scroll to top to show error message
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch (err) {
            alert('حدث خطأ في الاتصال بالخادم.');
            // Scroll to top to show error message
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const openModal = (payment) => {
        setSelectedPayment(payment);
        setIsModalOpen(true);
    };

    const filteredPayments = payments.filter(p => p.status === filter);

    return (
        <Layout user={user}>
            <style jsx>{`
                .table-container { background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
                .filters { margin-bottom: 20px; display: flex; gap: 10px; }
                .filter-btn { 
                    padding: 10px 15px; 
                    border: 1px solid #ccc; 
                    background: #f9f9f9; 
                    cursor: pointer; 
                    border-radius: 5px; 
                    font-family: 'Tajawal', Arial, sans-serif;
                    font-weight: 600;
                    font-size: 0.9rem;
                    white-space: nowrap;
                    transition: all 0.2s ease;
                }
                .filter-btn.active { 
                    background: #007bff; 
                    color: white; 
                    border-color: #007bff; 
                    font-weight: 700;
                    transform: translateY(-1px);
                    box-shadow: 0 2px 8px rgba(0, 123, 255, 0.3);
                }
                .filter-btn:hover {
                    background: #e9ecef;
                    border-color: #007bff;
                    transform: translateY(-1px);
                }
                .filter-btn.active:hover {
                    background: #0056b3;
                }
                .payments-table { width: 100%; border-collapse: collapse; }
                .payments-table th, .payments-table td { padding: 12px; border-bottom: 1px solid #eee; text-align: right; }
                .payments-table th { background-color: #f7f9fc; font-weight: 600; }
                .action-btn { cursor: pointer; color: #007bff; }
                .modal { display: flex; justify-content: center; align-items: center; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.7); }
                .modal-content { background-color: #fefefe; padding: 20px; border-radius: 8px; width: 80%; max-width: 500px; }
                .close-button { color: #aaa; float: right; font-size: 28px; font-weight: bold; cursor: pointer; }
                .modal-actions { margin-top: 20px; display: flex; justify-content: flex-end; gap: 10px; }
                .table-responsive-wrapper { overflow-x: auto; }
                
                /* Payment Action Buttons */
                .btn-confirm {
                    background-color: #28a745 !important;
                    color: white !important;
                    border: none !important;
                    padding: 12px 24px !important;
                    border-radius: 6px !important;
                    cursor: pointer !important;
                    font-size: 1rem !important;
                    font-weight: 600 !important;
                    transition: all 0.2s ease !important;
                    display: inline-flex !important;
                    align-items: center !important;
                    gap: 8px !important;
                    text-decoration: none !important;
                    min-width: 140px !important;
                    justify-content: center !important;
                }
                
                .btn-confirm:hover {
                    background-color: #218838 !important;
                    transform: translateY(-2px) !important;
                    box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4) !important;
                }
                
                .btn-confirm:active {
                    transform: translateY(0) !important;
                    box-shadow: 0 2px 6px rgba(40, 167, 69, 0.4) !important;
                }
                
                .btn-reject {
                    background-color: #dc3545 !important;
                    color: white !important;
                    border: none !important;
                    padding: 12px 24px !important;
                    border-radius: 6px !important;
                    cursor: pointer !important;
                    font-size: 1rem !important;
                    font-weight: 600 !important;
                    transition: all 0.2s ease !important;
                    display: inline-flex !important;
                    align-items: center !important;
                    gap: 8px !important;
                    text-decoration: none !important;
                    min-width: 140px !important;
                    justify-content: center !important;
                }
                
                .btn-reject:hover {
                    background-color: #c82333 !important;
                    transform: translateY(-2px) !important;
                    box-shadow: 0 4px 12px rgba(220, 53, 69, 0.4) !important;
                }
                
                .btn-reject:active {
                    transform: translateY(0) !important;
                    box-shadow: 0 2px 6px rgba(220, 53, 69, 0.4) !important;
                }
                
                /* Modal Actions Enhanced */
                .modal-actions {
                    margin-top: 25px !important;
                    display: flex !important;
                    justify-content: center !important;
                    gap: 15px !important;
                    padding: 10px 0 !important;
                }
                
                /* Mobile Responsive */
                @media (max-width: 768px) {
                    .modal-actions {
                        flex-direction: column !important;
                        gap: 12px !important;
                    }
                    
                    .btn-confirm,
                    .btn-reject {
                        width: 100% !important;
                        min-width: auto !important;
                    }
                }
            `}</style>
            <h1><i className="fas fa-file-invoice-dollar fa-fw"></i> إدارة المدفوعات</h1>
            
            <div className="table-container">
                <div className="filters">
                    <button onClick={() => setFilter('pending_review')} className={`filter-btn ${filter === 'pending_review' ? 'active' : ''}`}>قيد المراجعة</button>
                    <button onClick={() => setFilter('due')} className={`filter-btn ${filter === 'due' ? 'active' : ''}`}>مستحقة</button>
                    <button onClick={() => setFilter('late')} className={`filter-btn ${filter === 'late' ? 'active' : ''}`}>متأخرة</button>
                    <button onClick={() => setFilter('paid')} className={`filter-btn ${filter === 'paid' ? 'active' : ''}`}>مدفوعة</button>
                </div>

                <div className="table-responsive-wrapper">
                <table className="payments-table">
                    <thead>
                        <tr>
                            <th>الطالب</th>
                            <th>الدورة</th>
                            <th>المبلغ</th>
                            <th>تاريخ الاستحقاق</th>
                            <th>الحالة</th>
                            <th>إجراء</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPayments.map(p => (
                            <tr key={p.id}>
                                <td>{p.full_name}</td>
                                <td>{p.course_name}</td>
                                <td>{p.amount} {p.currency}</td>
                                <td>{new Date(p.due_date).toLocaleDateString('ar-EG')}</td>
                                <td>{p.status}</td>
                                <td>
                                    {p.status === 'pending_review' && (
                                        <button 
                                            onClick={() => openModal(p)}
                                            style={{
                                                backgroundColor: '#007bff',
                                                color: 'white',
                                                border: 'none',
                                                padding: '8px 16px',
                                                borderRadius: '5px',
                                                cursor: 'pointer',
                                                fontSize: '0.9rem',
                                                fontWeight: '600',
                                                fontFamily: 'Tajawal, Arial, sans-serif',
                                                transition: 'all 0.2s ease',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                textDecoration: 'none',
                                                whiteSpace: 'nowrap'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.target.style.backgroundColor = '#0056b3';
                                                e.target.style.transform = 'translateY(-1px)';
                                                e.target.style.boxShadow = '0 2px 8px rgba(0, 123, 255, 0.3)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.target.style.backgroundColor = '#007bff';
                                                e.target.style.transform = 'translateY(0)';
                                                e.target.style.boxShadow = 'none';
                                            }}
                                        >
                                            <i className="fas fa-eye"></i> مراجعة وتأكيد
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
            </div>

            <PaymentConfirmationModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                payment={selectedPayment}
                onConfirm={handleConfirmPayment}
            />
        </Layout>
    );
};

/**
 * Server-side rendering for user-specific finance data
 * Note: Using SSR only since this page requires authentication
 */
export const getServerSideProps = withAuth(async (context) => {
    try {
        // Get payment statistics
        const paymentStatsResult = await pool.query(`
            SELECT 
                COUNT(*) as total_payments,
                COUNT(CASE WHEN status = 'pending_review' THEN 1 END) as pending_review_count,
                COUNT(CASE WHEN status = 'due' THEN 1 END) as due_count,
                COUNT(CASE WHEN status = 'late' THEN 1 END) as late_count,
                COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count,
                SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as total_paid_amount,
                SUM(CASE WHEN status IN ('due', 'late') THEN amount ELSE 0 END) as total_outstanding
            FROM payments
        `).catch(() => ({ rows: [{}] })); // Graceful fallback if table doesn't exist

        // Get monthly payment trends
        const monthlyTrendsResult = await pool.query(`
            SELECT 
                DATE_TRUNC('month', due_date) as month,
                COUNT(*) as payment_count,
                SUM(amount) as total_amount,
                COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count
            FROM payments
            WHERE due_date >= CURRENT_DATE - INTERVAL '12 months'
            GROUP BY DATE_TRUNC('month', due_date)
            ORDER BY month DESC
            LIMIT 12
        `).catch(() => ({ rows: [] })); // Graceful fallback

        // Get detailed payment data for finance users
        const paymentsResult = await pool.query(`
            SELECT p.*, u.full_name, c.name as course_name
            FROM payments p
            JOIN enrollments e ON p.enrollment_id = e.id
            JOIN users u ON e.user_id = u.id
            JOIN courses c ON e.course_id = c.id
            ORDER BY p.due_date ASC
        `);

        const paymentStats = paymentStatsResult.rows[0] || {};
        const monthlyTrends = monthlyTrendsResult.rows || [];

        return {
            props: {
                user: JSON.parse(JSON.stringify(context.user)),
                initialPayments: JSON.parse(JSON.stringify(paymentsResult.rows)),
                paymentStats: {
                    totalPayments: parseInt(paymentStats.total_payments || 0),
                    pendingReviewCount: parseInt(paymentStats.pending_review_count || 0),
                    dueCount: parseInt(paymentStats.due_count || 0),
                    lateCount: parseInt(paymentStats.late_count || 0),
                    paidCount: parseInt(paymentStats.paid_count || 0),
                    totalPaidAmount: parseFloat(paymentStats.total_paid_amount || 0),
                    totalOutstanding: parseFloat(paymentStats.total_outstanding || 0)
                },
                monthlyTrends: JSON.parse(JSON.stringify(monthlyTrends)),
                lastUpdated: new Date().toISOString()
            }
        };
    } catch (error) {
        console.error('Finance page error:', error);
        
        return {
            props: {
                user: JSON.parse(JSON.stringify(context.user)),
                initialPayments: [],
                paymentStats: {
                    totalPayments: 0,
                    pendingReviewCount: 0,
                    dueCount: 0,
                    lateCount: 0,
                    paidCount: 0,
                    totalPaidAmount: 0,
                    totalOutstanding: 0
                },
                monthlyTrends: [],
                lastUpdated: new Date().toISOString()
            }
        };
    }
}, { roles: ['finance', 'admin'] });

export default FinancePage;