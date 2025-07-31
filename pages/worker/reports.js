import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { withAuth } from '../../lib/withAuth';

const WorkerReportsPage = ({ user }) => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newReport, setNewReport] = useState({
        report_type: 'daily',
        title: '',
        content: '',
        report_date: new Date().toISOString().split('T')[0],
        period_start: '',
        period_end: '',
        tags: '',
        priority: 'normal'
    });

    useEffect(() => {
        loadReports();
    }, []);

    const loadReports = async () => {
        try {
            // Try to load real reports data from API
            try {
                const response = await fetch('/api/worker/reports');
                if (response.ok) {
                    const data = await response.json();
                    setReports(data);
                } else {
                    setReports([]);
                }
            } catch (error) {
                console.error('Failed to load reports:', error);
                setReports([]);
            }
        } catch (error) {
            console.error('Error loading reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const createReport = async () => {
        try {
            // Mock creation - replace with actual API call
            const report = {
                id: Date.now(),
                ...newReport,
                status: 'draft',
                created_at: new Date().toISOString()
            };
            setReports(prev => [report, ...prev]);
            setShowCreateModal(false);
            setNewReport({
                report_type: 'daily',
                title: '',
                content: '',
                report_date: new Date().toISOString().split('T')[0],
                period_start: '',
                period_end: '',
                tags: '',
                priority: 'normal'
            });
        } catch (error) {
            console.error('Error creating report:', error);
        }
    };

    const getReportTypeText = (type) => {
        const types = {
            'daily': 'يومي',
            'weekly': 'أسبوعي',
            'monthly': 'شهري',
            'project': 'مشروع',
            'incident': 'حادثة'
        };
        return types[type] || type;
    };

    const getStatusText = (status) => {
        const statuses = {
            'draft': 'مسودة',
            'submitted': 'مرسل',
            'reviewed': 'تمت المراجعة',
            'approved': 'معتمد'
        };
        return statuses[status] || status;
    };

    const getStatusColor = (status) => {
        const colors = {
            'draft': '#6c757d',
            'submitted': '#17a2b8',
            'reviewed': '#ffc107',
            'approved': '#28a745'
        };
        return colors[status] || '#6c757d';
    };

    const getPriorityColor = (priority) => {
        const colors = {
            'low': '#28a745',
            'normal': '#17a2b8',
            'high': '#dc3545'
        };
        return colors[priority] || '#17a2b8';
    };

    const generateDailyReportTemplate = () => {
        const today = new Date().toLocaleDateString('ar-EG');
        return `تقرير العمل اليومي - ${today}

## المهام المنجزة:
- 

## التحديات المواجهة:
- 

## الإنجازات:
- 

## خطة الغد:
- 

## ملاحظات إضافية:
- `;
    };

    const generateWeeklyReportTemplate = () => {
        const today = new Date();
        const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
        const weekEnd = new Date(today.setDate(today.getDate() - today.getDay() + 6));
        
        return `تقرير العمل الأسبوعي
الفترة: ${weekStart.toLocaleDateString('ar-EG')} - ${weekEnd.toLocaleDateString('ar-EG')}

## ملخص الأسبوع:
- 

## المهام المكتملة:
- 

## المشاريع الجارية:
- 

## الإحصائيات:
- عدد المهام المكتملة: 
- ساعات العمل: 
- معدل الإنجاز: 

## التحديات والحلول:
- 

## خطة الأسبوع القادم:
- `;
    };

    return (
        <Layout user={user}>
            <style jsx>{`
                .reports-container {
                    padding: 20px;
                }
                .page-header {
                    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                    color: white;
                    padding: 30px;
                    border-radius: 12px;
                    margin-bottom: 30px;
                }
                .page-header h1 {
                    margin: 0 0 10px 0;
                    font-size: 2rem;
                }
                .actions-bar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                    gap: 15px;
                }
                .btn {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 1rem;
                    transition: all 0.3s ease;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    text-decoration: none;
                }
                .btn-primary {
                    background: #007bff;
                    color: white;
                }
                .btn-primary:hover {
                    background: #0056b3;
                    transform: translateY(-2px);
                }
                .btn-success {
                    background: #28a745;
                    color: white;
                }
                .btn-success:hover {
                    background: #218838;
                }
                .reports-grid {
                    display: grid;
                    gap: 20px;
                }
                .report-card {
                    background: white;
                    border-radius: 8px;
                    padding: 25px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    border-left: 4px solid #28a745;
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }
                .report-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 15px rgba(0,0,0,0.15);
                }
                .report-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 15px;
                }
                .report-title {
                    font-size: 1.3rem;
                    font-weight: bold;
                    color: #333;
                    margin: 0;
                }
                .report-badges {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                }
                .report-badge {
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 0.75rem;
                    font-weight: bold;
                    color: white;
                }
                .report-content {
                    color: #666;
                    line-height: 1.6;
                    margin-bottom: 15px;
                    max-height: 100px;
                    overflow: hidden;
                    position: relative;
                }
                .report-content::after {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 20px;
                    background: linear-gradient(transparent, white);
                }
                .report-meta {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 0.9rem;
                    color: #666;
                    margin-bottom: 15px;
                }
                .report-actions {
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                }
                .btn-sm {
                    padding: 6px 12px;
                    font-size: 0.875rem;
                }
                .btn-outline {
                    background: transparent;
                    border: 1px solid #007bff;
                    color: #007bff;
                }
                .btn-outline:hover {
                    background: #007bff;
                    color: white;
                }
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                }
                .modal-content {
                    background: white;
                    padding: 30px;
                    border-radius: 8px;
                    width: 90%;
                    max-width: 600px;
                    max-height: 90vh;
                    overflow-y: auto;
                }
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 1px solid #eee;
                }
                .modal-title {
                    font-size: 1.5rem;
                    font-weight: bold;
                    color: #333;
                    margin: 0;
                }
                .close-btn {
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: #666;
                }
                .form-group {
                    margin-bottom: 20px;
                }
                .form-group label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: 500;
                    color: #333;
                }
                .form-group input,
                .form-group select,
                .form-group textarea {
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    font-size: 1rem;
                    font-family: inherit;
                }
                .form-group textarea {
                    min-height: 200px;
                    resize: vertical;
                }
                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                }
                .template-buttons {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 15px;
                    flex-wrap: wrap;
                }
                .btn-template {
                    background: #f8f9fa;
                    border: 1px solid #dee2e6;
                    color: #495057;
                    padding: 8px 15px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 0.875rem;
                }
                .btn-template:hover {
                    background: #e9ecef;
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
                .loading {
                    text-align: center;
                    padding: 40px;
                    color: #666;
                }
                @media (max-width: 768px) {
                    .actions-bar {
                        flex-direction: column;
                        align-items: stretch;
                    }
                    .report-header {
                        flex-direction: column;
                        gap: 10px;
                    }
                    .form-row {
                        grid-template-columns: 1fr;
                    }
                    .modal-content {
                        margin: 20px;
                        width: calc(100% - 40px);
                    }
                }
            `}</style>

            <div className="reports-container">
                <div className="page-header">
                    <h1><i className="fas fa-file-alt fa-fw"></i> التقارير</h1>
                    <p>إنشاء ومتابعة التقارير اليومية والأسبوعية والشهرية</p>
                </div>

                <div className="actions-bar">
                    <div>
                        <h2>تقاريري ({reports.length})</h2>
                    </div>
                    <button 
                        className="btn btn-primary"
                        onClick={() => setShowCreateModal(true)}
                    >
                        <i className="fas fa-plus"></i> إنشاء تقرير جديد
                    </button>
                </div>

                {loading ? (
                    <div className="loading">
                        <i className="fas fa-spinner fa-spin fa-2x"></i>
                        <p>جاري تحميل التقارير...</p>
                    </div>
                ) : reports.length === 0 ? (
                    <div className="empty-state">
                        <i className="fas fa-file-alt"></i>
                        <h3>لا توجد تقارير</h3>
                        <p>ابدأ بإنشاء تقريرك الأول</p>
                        <button 
                            className="btn btn-primary"
                            onClick={() => setShowCreateModal(true)}
                        >
                            <i className="fas fa-plus"></i> إنشاء تقرير
                        </button>
                    </div>
                ) : (
                    <div className="reports-grid">
                        {reports.map(report => (
                            <div key={report.id} className="report-card">
                                <div className="report-header">
                                    <h3 className="report-title">{report.title}</h3>
                                    <div className="report-badges">
                                        <span 
                                            className="report-badge" 
                                            style={{ backgroundColor: '#17a2b8' }}
                                        >
                                            {getReportTypeText(report.report_type)}
                                        </span>
                                        <span 
                                            className="report-badge" 
                                            style={{ backgroundColor: getStatusColor(report.status) }}
                                        >
                                            {getStatusText(report.status)}
                                        </span>
                                        {report.priority !== 'normal' && (
                                            <span 
                                                className="report-badge" 
                                                style={{ backgroundColor: getPriorityColor(report.priority) }}
                                            >
                                                {report.priority === 'high' ? 'عالي' : 'منخفض'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="report-content">
                                    {report.content}
                                </div>
                                
                                <div className="report-meta">
                                    <span>
                                        <i className="fas fa-calendar"></i>
                                        {new Date(report.report_date).toLocaleDateString('ar-EG')}
                                    </span>
                                    <span>
                                        <i className="fas fa-clock"></i>
                                        {new Date(report.created_at).toLocaleDateString('ar-EG')}
                                    </span>
                                </div>

                                <div className="report-actions">
                                    <button className="btn btn-outline btn-sm">
                                        <i className="fas fa-eye"></i> عرض
                                    </button>
                                    {report.status === 'draft' && (
                                        <>
                                            <button className="btn btn-primary btn-sm">
                                                <i className="fas fa-edit"></i> تعديل
                                            </button>
                                            <button className="btn btn-success btn-sm">
                                                <i className="fas fa-paper-plane"></i> إرسال
                                            </button>
                                        </>
                                    )}
                                    <button className="btn btn-outline btn-sm">
                                        <i className="fas fa-download"></i> تحميل
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Create Report Modal */}
                {showCreateModal && (
                    <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2 className="modal-title">إنشاء تقرير جديد</h2>
                                <button 
                                    className="close-btn"
                                    onClick={() => setShowCreateModal(false)}
                                >
                                    ×
                                </button>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>نوع التقرير</label>
                                    <select 
                                        value={newReport.report_type}
                                        onChange={(e) => setNewReport(prev => ({...prev, report_type: e.target.value}))}
                                    >
                                        <option value="daily">تقرير يومي</option>
                                        <option value="weekly">تقرير أسبوعي</option>
                                        <option value="monthly">تقرير شهري</option>
                                        <option value="project">تقرير مشروع</option>
                                        <option value="incident">تقرير حادثة</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>الأولوية</label>
                                    <select 
                                        value={newReport.priority}
                                        onChange={(e) => setNewReport(prev => ({...prev, priority: e.target.value}))}
                                    >
                                        <option value="low">منخفضة</option>
                                        <option value="normal">عادية</option>
                                        <option value="high">عالية</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>عنوان التقرير</label>
                                <input 
                                    type="text"
                                    value={newReport.title}
                                    onChange={(e) => setNewReport(prev => ({...prev, title: e.target.value}))}
                                    placeholder="أدخل عنوان التقرير"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>تاريخ التقرير</label>
                                    <input 
                                        type="date"
                                        value={newReport.report_date}
                                        onChange={(e) => setNewReport(prev => ({...prev, report_date: e.target.value}))}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>الكلمات المفتاحية</label>
                                    <input 
                                        type="text"
                                        value={newReport.tags}
                                        onChange={(e) => setNewReport(prev => ({...prev, tags: e.target.value}))}
                                        placeholder="مفصولة بفاصلة"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>محتوى التقرير</label>
                                <div className="template-buttons">
                                    <button 
                                        type="button"
                                        className="btn-template"
                                        onClick={() => setNewReport(prev => ({...prev, content: generateDailyReportTemplate()}))}
                                    >
                                        قالب يومي
                                    </button>
                                    <button 
                                        type="button"
                                        className="btn-template"
                                        onClick={() => setNewReport(prev => ({...prev, content: generateWeeklyReportTemplate()}))}
                                    >
                                        قالب أسبوعي
                                    </button>
                                </div>
                                <textarea 
                                    value={newReport.content}
                                    onChange={(e) => setNewReport(prev => ({...prev, content: e.target.value}))}
                                    placeholder="اكتب محتوى التقرير هنا..."
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button 
                                    className="btn btn-outline"
                                    onClick={() => setShowCreateModal(false)}
                                >
                                    إلغاء
                                </button>
                                <button 
                                    className="btn btn-success"
                                    onClick={createReport}
                                >
                                    <i className="fas fa-save"></i> حفظ التقرير
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export const getServerSideProps = withAuth(async (context) => {
    const { user } = context;
    
    if (user.role !== 'worker') {
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
}, { roles: ['worker'] });

export default WorkerReportsPage;