import React, { useState } from 'react';
import Layout from '../../components/Layout';
import { withAuth } from '../../lib/withAuth';

import { useRouter } from 'next/router';
import pool from '../../lib/db';

const AdminRequestsPage = ({ user, requests: initialRequests }) => {
    const [requests, setRequests] = useState(initialRequests);
    const router = useRouter();

    // Arabic field names mapping
    const fieldNamesArabic = {
        'full_name': 'الاسم الكامل',
        'email': 'البريد الإلكتروني', 
        'phone': 'رقم الهاتف',
        'details': 'التفاصيل الإضافية'
    };

    const handleApprove = async (id) => {
        // if (!confirm('هل أنت متأكد من الموافقة على هذا الطلب؟')) return;
        const response = await fetch(`/api/requests/${id}/approve`, { method: 'POST' });
        if (response.ok) {
            console.warn('تمت الموافقة على الطلب.');
            router.replace(router.asPath);
        } else {
            const result = await response.json();
            console.warn(result.message || 'حدث خطأ.');
        }
    };

    const handleReject = async (id) => {
        // if (!confirm('هل أنت متأكد من رفض هذا الطلب؟')) return;
        try {
            const response = await fetch(`/api/requests/${id}/reject`, { method: 'POST' });
            if (response.ok) {
                console.warn('تم رفض الطلب بنجاح.');
                router.replace(router.asPath);
            } else {
                const result = await response.json();
                console.warn(result.error || 'حدث خطأ أثناء الرفض.');
            }
        } catch (err) {
            console.warn('حدث خطأ في الاتصال بالخادم.');
        }
    };

    return (
        <Layout user={user}>
            <style jsx>{`
                .requests-table {
                    width: 100%;
                    border-collapse: collapse;
                    background: #fff;
                    margin-top: 20px;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                    overflow: hidden;
                }
                .requests-table th, .requests-table td {
                    padding: 14px 10px;
                    border-bottom: 1px solid #eee;
                    text-align: center;
                    font-size: 1rem;
                }
                .requests-table th {
                    background-color: #f7f9fc;
                    font-weight: 700;
                    color: #333;
                    letter-spacing: 0.5px;
                }
                .requests-table tr:hover {
                    background: #f0f8ff;
                }
                .action-btn {
                    margin: 0 5px;
                    cursor: pointer;
                    border: none;
                    background: none;
                    font-size: 1.2rem;
                    padding: 6px 10px;
                    border-radius: 5px;
                    transition: background 0.2s, color 0.2s;
                }
                .approve-btn {
                    color: #27ae60;
                }
                .approve-btn:hover {
                    background: #eafaf1;
                    color: #219150;
                }
                .reject-btn {
                    color: #e74c3c;
                }
                .reject-btn:hover {
                    background: #fdeaea;
                    color: #c0392b;
                }
                .table-responsive-wrapper { overflow-x: auto; }
            `}</style>
            <h1><i class="fas fa-user-edit fa-fw"></i> طلبات تعديل البيانات</h1>
            <div class="table-responsive-wrapper">
            <table className="requests-table">
                <thead>
                    <tr>
                        <th>المستخدم</th>
                        <th>الحقل</th>
                        <th>القيمة القديمة</th>
                        <th>القيمة الجديدة</th>
                        <th>الحالة</th>
                        <th>إجراءات</th>
                    </tr>
                </thead>
                <tbody>
                    {requests.map((req) => (
                        <tr key={req.id}>
                            <td>{req.full_name}</td>
                            <td>{fieldNamesArabic[req.field_name] || req.field_name}</td>
                            <td style={{ maxWidth: '200px', wordWrap: 'break-word' }}>{req.old_value}</td>
                            <td style={{ maxWidth: '200px', wordWrap: 'break-word' }}>{req.new_value}</td>
                            <td>{req.status === 'pending' ? 'في الانتظار' : req.status === 'approved' ? 'موافق عليه' : 'مرفوض'}</td>
                            <td>
                                {req.status === 'pending' ? (
                                    <>
                                        <button className="action-btn approve-btn" onClick={() => handleApprove(req.id)} title="موافقة"><i className="fas fa-check"></i></button>
                                        <button className="action-btn reject-btn" onClick={() => handleReject(req.id)} title="رفض"><i className="fas fa-times"></i></button>
                                    </>
                                ) : (
                                    '-'
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            </div>
        </Layout>
    );
};

export const getServerSideProps = withAuth(async (context) => {
    const { user } = context;
    const requestsResult = await pool.query(`
        SELECT r.id, r.field_name, r.old_value, r.new_value, r.status, u.full_name
        FROM user_edit_requests r
        JOIN users u ON r.user_id = u.id
        WHERE r.status = 'pending' ORDER BY r.requested_at ASC
    `);

    return {
        props: {
            user: JSON.parse(JSON.stringify(user)),
            requests: requestsResult.rows.map(r => JSON.parse(JSON.stringify(r)))
        }
    };
}, { roles: ['admin'] });

export default AdminRequestsPage;