import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import CourseCreationForm from '../../../components/CourseCreationForm';
import CourseScheduling from '../../../components/CourseScheduling';
import { withAuth } from '../../../lib/withAuth';

const AdvancedCourseCreation = ({ user }) => {
    const [currentStep, setCurrentStep] = useState('create'); // 'create', 'schedule', 'complete'
    const [courseData, setCourseData] = useState(null);
    const [message, setMessage] = useState({ text: '', type: '' });
    const router = useRouter();

    const handleCourseCreation = async (formData) => {
        try {
            const response = await fetch('/api/courses/create-with-rating-system', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (response.ok) {
                setCourseData({ ...formData, id: result.courseId });
                setCurrentStep('schedule');
                setMessage({ text: 'تم إنشاء الدورة بنجاح! الآن يمكنك جدولة الأيام', type: 'success' });
            } else {
                throw new Error(result.message || 'حدث خطأ في إنشاء الدورة');
            }
        } catch (error) {
            setMessage({ text: error.message, type: 'error' });
            throw error;
        }
    };

    const handleScheduleSave = async (scheduleData) => {
        try {
            const response = await fetch(`/api/courses/${courseData.id}/schedule`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(scheduleData)
            });

            const result = await response.json();

            if (response.ok) {
                setMessage({ text: 'تم حفظ الجدولة بنجاح!', type: 'success' });
            } else {
                throw new Error(result.message || 'حدث خطأ في حفظ الجدولة');
            }
        } catch (error) {
            setMessage({ text: error.message, type: 'error' });
            throw error;
        }
    };

    const handleSchedulePublish = async (scheduleData) => {
        try {
            const response = await fetch(`/api/courses/${courseData.id}/publish`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(scheduleData)
            });

            const result = await response.json();

            if (response.ok) {
                setCurrentStep('complete');
                setMessage({ text: 'تم نشر الدورة بنجاح! سيتم إشعار المستخدمين المؤهلين', type: 'success' });
            } else {
                throw new Error(result.message || 'حدث خطأ في نشر الدورة');
            }
        } catch (error) {
            setMessage({ text: error.message, type: 'error' });
            throw error;
        }
    };

    const handleSaveAsTemplate = async (templateData) => {
        try {
            const response = await fetch('/api/courses/templates', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(templateData)
            });

            const result = await response.json();

            if (response.ok) {
                setMessage({ text: 'تم حفظ القالب بنجاح!', type: 'success' });
            } else {
                throw new Error(result.message || 'حدث خطأ في حفظ القالب');
            }
        } catch (error) {
            setMessage({ text: error.message, type: 'error' });
            throw error;
        }
    };

    const handleCancel = () => {
        router.push('/admin/courses/manage');
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 'create':
                return (
                    <CourseCreationForm
                        onSubmit={handleCourseCreation}
                        onCancel={handleCancel}
                    />
                );
            
            case 'schedule':
                return (
                    <CourseScheduling
                        course={courseData}
                        onSave={handleScheduleSave}
                        onPublish={handleSchedulePublish}
                        onSaveAsTemplate={handleSaveAsTemplate}
                    />
                );
            
            case 'complete':
                return (
                    <div className="completion-screen">
                        <div className="success-icon">
                            <i className="fas fa-check-circle"></i>
                        </div>
                        <h2>تم إنشاء الدورة بنجاح!</h2>
                        <p>تم نشر الدورة &quot;{courseData?.name}&quot; وإرسال الإشعارات للمستخدمين المؤهلين</p>
                        
                        <div className="course-summary">
                            <h3>ملخص الدورة</h3>
                            <div className="summary-grid">
                                <div className="summary-item">
                                    <strong>اسم الدورة:</strong>
                                    <span>{courseData?.name}</span>
                                </div>
                                <div className="summary-item">
                                    <strong>المدة:</strong>
                                    <span>{courseData?.duration} أيام</span>
                                </div>
                                <div className="summary-item">
                                    <strong>تاريخ البدء:</strong>
                                    <span>{new Date(courseData?.startDate).toLocaleDateString('ar-SA')}</span>
                                </div>
                                <div className="summary-item">
                                    <strong>الحالة:</strong>
                                    <span className="status-published">منشورة</span>
                                </div>
                            </div>
                        </div>

                        <div className="action-buttons">
                            <button 
                                onClick={() => router.push(`/admin/courses/${courseData?.id}/manage`)}
                                className="btn-primary"
                            >
                                <i className="fas fa-cog"></i>
                                إدارة الدورة
                            </button>
                            <button 
                                onClick={() => router.push(`/admin/courses/${courseData?.id}/ratings`)}
                                className="btn-secondary"
                            >
                                <i className="fas fa-chart-line"></i>
                                عرض التقييمات
                            </button>
                            <button 
                                onClick={() => router.push('/admin/courses/manage')}
                                className="btn-outline"
                            >
                                <i className="fas fa-list"></i>
                                العودة للقائمة
                            </button>
                            <button 
                                onClick={() => {
                                    setCurrentStep('create');
                                    setCourseData(null);
                                    setMessage({ text: '', type: '' });
                                }}
                                className="btn-success"
                            >
                                <i className="fas fa-plus"></i>
                                إنشاء دورة جديدة
                            </button>
                        </div>
                    </div>
                );
            
            default:
                return null;
        }
    };

    return (
        <Layout user={user}>
            <div className="advanced-course-creation">
                <div className="page-header">
                    <h1>
                        <i className="fas fa-graduation-cap"></i>
                        إنشاء دورة متقدمة مع نظام التقييمات
                    </h1>
                    <div className="progress-indicator">
                        <div className={`progress-step ${currentStep === 'create' ? 'active' : currentStep !== 'create' ? 'completed' : ''}`}>
                            <div className="step-number">1</div>
                            <span>إنشاء الدورة</span>
                        </div>
                        <div className="progress-line"></div>
                        <div className={`progress-step ${currentStep === 'schedule' ? 'active' : currentStep === 'complete' ? 'completed' : ''}`}>
                            <div className="step-number">2</div>
                            <span>الجدولة</span>
                        </div>
                        <div className="progress-line"></div>
                        <div className={`progress-step ${currentStep === 'complete' ? 'active' : ''}`}>
                            <div className="step-number">3</div>
                            <span>النشر</span>
                        </div>
                    </div>
                </div>

                {message.text && (
                    <div className={`message ${message.type}`}>
                        <i className={`fas ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'}`}></i>
                        {message.text}
                    </div>
                )}

                <div className="step-content">
                    {renderStepContent()}
                </div>
            </div>

            <style jsx>{`
                .advanced-course-creation {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 20px;
                }

                .page-header {
                    text-align: center;
                    margin-bottom: 40px;
                    padding: 30px;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.08);
                }

                .page-header h1 {
                    margin-bottom: 30px;
                    color: var(--primary-color);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 15px;
                }

                .progress-indicator {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 20px;
                    max-width: 600px;
                    margin: 0 auto;
                }

                .progress-step {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 10px;
                    transition: all 0.3s;
                }

                .step-number {
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    background: #e0e0e0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-size: 1.2rem;
                    transition: all 0.3s;
                }

                .progress-step.active .step-number {
                    background: var(--primary-color);
                    color: white;
                    transform: scale(1.1);
                }

                .progress-step.completed .step-number {
                    background: #28a745;
                    color: white;
                }

                .progress-step span {
                    font-size: 0.9rem;
                    color: #666;
                    font-weight: 500;
                }

                .progress-step.active span {
                    color: var(--primary-color);
                    font-weight: 600;
                }

                .progress-line {
                    width: 80px;
                    height: 2px;
                    background: #e0e0e0;
                }

                .completion-screen {
                    text-align: center;
                    padding: 40px;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.08);
                }

                .success-icon {
                    font-size: 4rem;
                    color: #28a745;
                    margin-bottom: 20px;
                }

                .completion-screen h2 {
                    color: var(--primary-color);
                    margin-bottom: 15px;
                }

                .completion-screen p {
                    color: #666;
                    font-size: 1.1rem;
                    margin-bottom: 30px;
                }

                .course-summary {
                    background: #f8f9fa;
                    padding: 25px;
                    border-radius: 8px;
                    margin: 30px 0;
                }

                .course-summary h3 {
                    color: var(--primary-color);
                    margin-bottom: 20px;
                }

                .summary-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                }

                .summary-item {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                }

                .summary-item strong {
                    color: #333;
                    font-size: 0.9rem;
                }

                .summary-item span {
                    color: #666;
                    font-size: 1rem;
                }

                .status-published {
                    background: #28a745;
                    color: white;
                    padding: 4px 12px;
                    border-radius: 12px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    display: inline-block;
                }

                .action-buttons {
                    display: flex;
                    justify-content: center;
                    gap: 15px;
                    flex-wrap: wrap;
                    margin-top: 30px;
                }

                .btn-primary,
                .btn-secondary,
                .btn-outline,
                .btn-success {
                    padding: 12px 20px;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    text-decoration: none;
                }

                .btn-primary {
                    background: var(--primary-color);
                    color: white;
                }

                .btn-secondary {
                    background: #6c757d;
                    color: white;
                }

                .btn-outline {
                    background: transparent;
                    color: var(--primary-color);
                    border: 2px solid var(--primary-color);
                }

                .btn-success {
                    background: #28a745;
                    color: white;
                }

                .btn-primary:hover,
                .btn-secondary:hover,
                .btn-outline:hover,
                .btn-success:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                }

                .btn-outline:hover {
                    background: var(--primary-color);
                    color: white;
                }

                .message {
                    padding: 15px 20px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-weight: 500;
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

                .step-content {
                    margin-top: 20px;
                }

                @media (max-width: 768px) {
                    .progress-indicator {
                        flex-direction: column;
                        gap: 15px;
                    }
                    
                    .progress-line {
                        width: 2px;
                        height: 30px;
                    }
                    
                    .summary-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .action-buttons {
                        flex-direction: column;
                        align-items: center;
                    }
                    
                    .btn-primary,
                    .btn-secondary,
                    .btn-outline,
                    .btn-success {
                        width: 100%;
                        max-width: 250px;
                        justify-content: center;
                    }
                }
            `}</style>
        </Layout>
    );
};

export const getServerSideProps = withAuth(async (context) => {
    const { user } = context;

    // التحقق من صلاحيات إنشاء الدورات
    if (!['admin', 'head', 'teacher'].includes(user.role)) {
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
});

export default AdvancedCourseCreation;