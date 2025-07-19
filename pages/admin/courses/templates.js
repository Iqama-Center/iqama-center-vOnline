import React, { useState, useEffect } from 'react';
import Layout from '../../../components/Layout';
import { withAuth } from '../../../lib/withAuth';

const CourseTemplatesPage = ({ user }) => {
    const [templates, setTemplates] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTemplate, setNewTemplate] = useState({
        name: '',
        description: '',
        duration_days: 30,
        target_roles: ['student'],
        min_capacity: 7,
        max_capacity: 15,
        optimal_capacity: 12,
        pricing: {
            egypt: 300,
            international: 60,
            currency: 'EGP'
        },
        daily_content_template: []
    });

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const response = await fetch('/api/courses/templates');
            if (response.ok) {
                const data = await response.json();
                setTemplates(data);
            }
        } catch (err) {
            console.error('Error fetching templates:', err);
        }
    };

    const handleCreateTemplate = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/courses/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newTemplate)
            });

            if (response.ok) {
                setShowCreateModal(false);
                fetchTemplates();
                setNewTemplate({
                    name: '',
                    description: '',
                    duration_days: 30,
                    target_roles: ['student'],
                    min_capacity: 7,
                    max_capacity: 15,
                    optimal_capacity: 12,
                    pricing: { egypt: 300, international: 60, currency: 'EGP' },
                    daily_content_template: []
                });
                alert('تم إنشاء القالب بنجاح!');
            } else {
                const result = await response.json();
                alert('خطأ: ' + result.message);
            }
        } catch (err) {
            alert('حدث خطأ في الاتصال بالخادم');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setNewTemplate(prev => ({
                ...prev,
                [parent]: { ...prev[parent], [child]: value }
            }));
        } else {
            setNewTemplate(prev => ({ ...prev, [name]: value }));
        }
    };

    return (
        <Layout user={user}>
            <div className="templates-page">
                <div className="page-header">
                    <h1><i className="fas fa-layer-group"></i> قوالب الدورات</h1>
                    <button 
                        className="btn btn-primary"
                        onClick={() => setShowCreateModal(true)}
                    >
                        <i className="fas fa-plus"></i> إنشاء قالب جديد
                    </button>
                </div>

                <div className="templates-grid">
                    {templates.map(template => (
                        <div key={template.id} className="template-card">
                            <div className="template-header">
                                <h3>{template.name}</h3>
                                <span className="duration-badge">{template.duration_days} يوم</span>
                            </div>
                            <p className="template-description">{template.description}</p>
                            <div className="template-details">
                                <div className="detail-item">
                                    <strong>الفئة المستهدفة:</strong> {JSON.parse(template.target_roles).join(', ')}
                                </div>
                                <div className="detail-item">
                                    <strong>السعة:</strong> {template.min_capacity} - {template.max_capacity} (الأمثل: {template.optimal_capacity})
                                </div>
                                <div className="detail-item">
                                    <strong>التسعير:</strong> 
                                    {JSON.parse(template.pricing).egypt} ج.م / {JSON.parse(template.pricing).international}$
                                </div>
                            </div>
                            <div className="template-actions">
                                <button className="btn btn-secondary">
                                    <i className="fas fa-edit"></i> تعديل
                                </button>
                                <button className="btn btn-success">
                                    <i className="fas fa-plus-circle"></i> إنشاء دورة
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Create Template Modal */}
                {showCreateModal && (
                    <div className="modal-overlay">
                        <div className="modal-content large">
                            <div className="modal-header">
                                <h2>إنشاء قالب دورة جديد</h2>
                                <button 
                                    className="close-btn"
                                    onClick={() => setShowCreateModal(false)}
                                >
                                    ×
                                </button>
                            </div>
                            <form onSubmit={handleCreateTemplate}>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>اسم القالب</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={newTemplate.name}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>مدة الدورة (بالأيام)</label>
                                        <input
                                            type="number"
                                            name="duration_days"
                                            value={newTemplate.duration_days}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group full-width">
                                        <label>وصف القالب</label>
                                        <textarea
                                            name="description"
                                            value={newTemplate.description}
                                            onChange={handleInputChange}
                                            rows="3"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>الحد الأدنى للطلاب</label>
                                        <input
                                            type="number"
                                            name="min_capacity"
                                            value={newTemplate.min_capacity}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>الحد الأقصى للطلاب</label>
                                        <input
                                            type="number"
                                            name="max_capacity"
                                            value={newTemplate.max_capacity}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>العدد الأمثل</label>
                                        <input
                                            type="number"
                                            name="optimal_capacity"
                                            value={newTemplate.optimal_capacity}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>السعر في مصر (ج.م)</label>
                                        <input
                                            type="number"
                                            name="pricing.egypt"
                                            value={newTemplate.pricing.egypt}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>السعر الدولي ($)</label>
                                        <input
                                            type="number"
                                            name="pricing.international"
                                            value={newTemplate.pricing.international}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>
                                <div className="modal-actions">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                                        إلغاء
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        إنشاء القالب
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                .templates-page {
                    padding: 2rem;
                }
                .page-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                }
                .templates-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
                    gap: 2rem;
                }
                .template-card {
                    background: white;
                    border-radius: 12px;
                    padding: 1.5rem;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    transition: transform 0.2s;
                }
                .template-card:hover {
                    transform: translateY(-4px);
                }
                .template-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                }
                .duration-badge {
                    background: #667eea;
                    color: white;
                    padding: 0.25rem 0.75rem;
                    border-radius: 20px;
                    font-size: 0.875rem;
                }
                .template-description {
                    color: #666;
                    margin-bottom: 1rem;
                }
                .template-details {
                    margin-bottom: 1.5rem;
                }
                .detail-item {
                    margin-bottom: 0.5rem;
                    font-size: 0.9rem;
                }
                .template-actions {
                    display: flex;
                    gap: 0.5rem;
                }
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }
                .modal-content.large {
                    background: white;
                    border-radius: 12px;
                    width: 90%;
                    max-width: 800px;
                    max-height: 90vh;
                    overflow-y: auto;
                }
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1.5rem;
                    border-bottom: 1px solid #eee;
                }
                .close-btn {
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                }
                .form-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                    padding: 1.5rem;
                }
                .form-group.full-width {
                    grid-column: 1 / -1;
                }
                .modal-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem;
                    padding: 1.5rem;
                    border-top: 1px solid #eee;
                }
                .btn {
                    padding: 0.5rem 1rem;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.9rem;
                    transition: all 0.2s;
                }
                .btn-primary {
                    background: #667eea;
                    color: white;
                }
                .btn-secondary {
                    background: #6c757d;
                    color: white;
                }
                .btn-success {
                    background: #28a745;
                    color: white;
                }
            `}</style>
        </Layout>
    );
};

export const getServerSideProps = withAuth(async (context) => {
    return {
        props: {
            user: context.user
        }
    };
}, { roles: ['admin', 'head'] });

export default CourseTemplatesPage;