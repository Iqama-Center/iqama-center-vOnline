import React, { useState, useEffect } from 'react';

const CourseVisibilityIndicator = ({ course, userLevel }) => {
    const [enrollmentStatus, setEnrollmentStatus] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userLevel === 3) {
            // For degree 3 users, check why course might not be visible
            checkCourseEnrollmentStatus();
        } else {
            setLoading(false);
        }
    }, [course.id, userLevel]);

    const checkCourseEnrollmentStatus = async () => {
        try {
            const response = await fetch(`/api/courses/${course.id}/enrollment-status`);
            if (response.ok) {
                const data = await response.json();
                setEnrollmentStatus(data);
            }
        } catch (error) {
            console.error('Error checking enrollment status:', error);
        } finally {
            setLoading(false);
        }
    };

    // Don't show indicator for degree 1 and 2 users (they see all courses)
    if (userLevel !== 3) {
        return null;
    }

    if (loading) {
        return (
            <div className="visibility-indicator loading">
                <i className="fas fa-spinner fa-spin"></i> جاري التحقق...
            </div>
        );
    }

    if (!enrollmentStatus) {
        return null;
    }

    const { hasDegree1, hasDegree2, isVisible } = enrollmentStatus;

    if (isVisible) {
        return (
            <div className="visibility-indicator visible">
                <i className="fas fa-check-circle"></i>
                <span>متاحة للتسجيل - تم تأكيد المشرفين والمعلمين</span>
            </div>
        );
    }

    return (
        <div className="visibility-indicator hidden">
            <i className="fas fa-info-circle"></i>
            <div className="visibility-details">
                <p><strong>هذه الدورة غير متاحة للتسجيل حالياً</strong></p>
                <div className="requirements-status">
                    <div className={`requirement ${hasDegree1 ? 'met' : 'unmet'}`}>
                        {hasDegree1 ? '✅' : '❌'} درجة 1 (المشرفين): {hasDegree1 ? 'تم التسجيل' : 'في انتظار التسجيل'}
                    </div>
                    <div className={`requirement ${hasDegree2 ? 'met' : 'unmet'}`}>
                        {hasDegree2 ? '✅' : '❌'} درجة 2 (المعلمين): {hasDegree2 ? 'تم التسجيل' : 'في انتظار التسجيل'}
                    </div>
                </div>
                <p className="explanation">
                    <i className="fas fa-lightbulb"></i>
                    ستصبح الدورة متاحة للتسجيل بمجرد انضمام أشخاص من درجة 1 ودرجة 2
                </p>
            </div>

            <style jsx>{`
                .visibility-indicator {
                    margin: 15px 0;
                    padding: 15px;
                    border-radius: 8px;
                    font-size: 0.9rem;
                }
                
                .visibility-indicator.loading {
                    background: #f8f9fa;
                    color: #6c757d;
                    text-align: center;
                }
                
                .visibility-indicator.visible {
                    background: #d4edda;
                    color: #155724;
                    border: 1px solid #c3e6cb;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                
                .visibility-indicator.hidden {
                    background: #fff3cd;
                    color: #856404;
                    border: 1px solid #ffeaa7;
                }
                
                .visibility-details p {
                    margin: 0 0 10px 0;
                }
                
                .requirements-status {
                    margin: 10px 0;
                }
                
                .requirement {
                    padding: 5px 0;
                    font-size: 0.85rem;
                }
                
                .requirement.met {
                    color: #155724;
                }
                
                .requirement.unmet {
                    color: #721c24;
                }
                
                .explanation {
                    margin-top: 10px;
                    font-size: 0.8rem;
                    font-style: italic;
                    opacity: 0.8;
                }
                
                .explanation i {
                    margin-left: 5px;
                }
                
                @media (max-width: 768px) {
                    .visibility-indicator {
                        font-size: 0.8rem;
                        padding: 12px;
                    }
                }
            `}</style>
        </div>
    );
};

export default CourseVisibilityIndicator;