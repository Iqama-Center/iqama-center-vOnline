import React, { useState, useEffect } from 'react';

const AutoFillTemplates = ({ courseId, onTemplateApplied }) => {
    const [templates, setTemplates] = useState([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [formData, setFormData] = useState({
        courseId: courseId,
        meetingLinkTemplate: '',
        contentUrlTemplate: '',
        urlNumberingStart: 1,
        urlNumberingEnd: 10,
        defaultAssignments: {}
    });

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const response = await fetch('/api/courses/auto-fill-templates');
            if (response.ok) {
                const data = await response.json();
                setTemplates(data);
            }
        } catch (error) {
            console.error('Error fetching templates:', error);
        }
    };

    const handleCreateTemplate = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/courses/auto-fill-templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await response.json();
            
            if (response.ok) {
                setMessage({ text: result.message, type: 'success' });
                setShowCreateForm(false);
                fetchTemplates();
                setFormData({
                    courseId: courseId,
                    meetingLinkTemplate: '',
                    contentUrlTemplate: '',
                    urlNumberingStart: 1,
                    urlNumberingEnd: 10,
                    defaultAssignments: {}
                });
            } else {
                setMessage({ text: result.message, type: 'error' });
            }
        } catch (error) {
            setMessage({ text: 'حدث خطأ في الاتصال بالخادم', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleApplyTemplate = async (templateId) => {
        if (!window.confirm('هل أنت متأكد من تطبيق هذا القالب؟ سيتم توليد المحتوى تلقائياً.')) {
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`/api/courses/${courseId}/generate-content`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ templateId })
            });

            const result = await response.json();
            
            if (response.ok) {
                setMessage({ text: result.message, type: 'success' });
                if (onTemplateApplied) {
                    onTemplateApplied(result.generatedContent);
                }
            } else {
                setMessage({ text: result.message, type: 'error' });
            }
        } catch (error) {
            setMessage({ text: 'حدث خطأ في الاتصال بالخادم', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auto-fill-templates">
            <div className="templates-header">
                <h3>قوالب التعبئة التلقائية</h3>
                <button 
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="btn btn-primary"
                >
                    <i className="fas fa-plus"></i> إنشاء قالب جديد
                </button>
            </div>

            {message && (
                <div className={`alert alert-${message.type}`}>
                    {message.text}
                    <button onClick={() => setMessage(null)} className="alert-close">×</button>
                </div>
            )}

            {showCreateForm && (
                <div className="create-template-form">
                    <h4>إنشاء قالب جديد</h4>
                    <form onSubmit={handleCreateTemplate}>
                        <div className="form-group">
                            <label>قالب رابط الاجتماع:</label>
                            <input
                                type="text"
                                value={formData.meetingLinkTemplate}
                                onChange={(e) => setFormData({...formData, meetingLinkTemplate: e.target.value})}
                                placeholder="https://zoom.us/j/meeting-{n}"
                                className="form-control"
                            />
                            <small>استخدم {'{n}'} للترقيم التلقائي</small>
                        </div>

                        <div className="form-group">
                            <label>قالب رابط المحتوى:</label>
                            <input
                                type="text"
                                value={formData.contentUrlTemplate}
                                onChange={(e) => setFormData({...formData, contentUrlTemplate: e.target.value})}
                                placeholder="https://drive.google.com/lesson-{n}"
                                className="form-control"
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>بداية الترقيم:</label>
                                <input
                                    type="number"
                                    value={formData.urlNumberingStart}
                                    onChange={(e) => setFormData({...formData, urlNumberingStart: parseInt(e.target.value)})}
                                    className="form-control"
                                    min="1"
                                />
                            </div>
                            <div className="form-group">
                                <label>نهاية الترقيم:</label>
                                <input
                                    type="number"
                                    value={formData.urlNumberingEnd}
                                    onChange={(e) => setFormData({...formData, urlNumberingEnd: parseInt(e.target.value)})}
                                    className="form-control"
                                    min="1"
                                />
                            </div>
                        </div>

                        <div className="form-actions">
                            <button type="submit" disabled={loading} className="btn btn-success">
                                {loading ? 'جاري الحفظ...' : 'حفظ القالب'}
                            </button>
                            <button 
                                type="button" 
                                onClick={() => setShowCreateForm(false)}
                                className="btn btn-secondary"
                            >
                                إلغاء
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="templates-list">
                {templates.length === 0 ? (
                    <p>لا توجد قوالب متاحة</p>
                ) : (
                    templates.map(template => (
                        <div key={template.id} className="template-card">
                            <div className="template-info">
                                <h5>قالب للدورة: {template.course_name || 'غير محدد'}</h5>
                                {template.meeting_link_template && (
                                    <p><strong>قالب الاجتماع:</strong> {template.meeting_link_template}</p>
                                )}
                                {template.content_url_template && (
                                    <p><strong>قالب المحتوى:</strong> {template.content_url_template}</p>
                                )}
                                <p><strong>الترقيم:</strong> من {template.url_numbering_start} إلى {template.url_numbering_end}</p>
                            </div>
                            <div className="template-actions">
                                <button 
                                    onClick={() => handleApplyTemplate(template.id)}
                                    disabled={loading}
                                    className="btn btn-primary"
                                >
                                    <i className="fas fa-magic"></i> تطبيق القالب
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <style jsx>{`
                .auto-fill-templates {
                    background: white;
                    border-radius: 8px;
                    padding: 20px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    margin-bottom: 20px;
                }

                .templates-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    padding-bottom: 10px;
                    border-bottom: 1px solid #eee;
                }

                .create-template-form {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 6px;
                    margin-bottom: 20px;
                }

                .form-group {
                    margin-bottom: 15px;
                }

                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                }

                .form-control {
                    width: 100%;
                    padding: 8px 12px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 14px;
                }

                .form-actions {
                    display: flex;
                    gap: 10px;
                    margin-top: 20px;
                }

                .template-card {
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    padding: 15px;
                    margin-bottom: 10px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .template-info h5 {
                    margin: 0 0 10px 0;
                    color: #333;
                }

                .template-info p {
                    margin: 5px 0;
                    font-size: 14px;
                    color: #666;
                }

                .btn {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    text-decoration: none;
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                }

                .btn-primary { background: #007bff; color: white; }
                .btn-success { background: #28a745; color: white; }
                .btn-secondary { background: #6c757d; color: white; }
                .btn:disabled { opacity: 0.6; cursor: not-allowed; }

                .alert {
                    padding: 10px 15px;
                    border-radius: 4px;
                    margin-bottom: 15px;
                    position: relative;
                }

                .alert-success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
                .alert-error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }

                .alert-close {
                    position: absolute;
                    top: 5px;
                    right: 10px;
                    background: none;
                    border: none;
                    font-size: 18px;
                    cursor: pointer;
                }
            `}</style>
        </div>
    );
};

export default AutoFillTemplates;