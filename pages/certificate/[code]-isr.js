import React from 'react';
import PublicLayout from '../../components/PublicLayout';
import { createSuccessResponse, createErrorResponse } from '../../lib/isrUtils';
import { 
    ENHANCED_REVALIDATION, 
    fetchCertificateData, 
    createISRPerformanceMonitor,
    generateSmartFallbacks 
} from '../../lib/enhancedISRUtils';
import pool from '../../lib/db';

/**
 * Enhanced Certificate Verification Page with Dynamic ISR
 * Implements ISR for certificate verification with dynamic paths
 */
const CertificateVerificationISR = ({ certificate, error, lastUpdated, metadata }) => {
    if (error) {
        return (
            <PublicLayout title="خطأ في التحقق - مركز إقامة الكتاب">
                <div className="error-container">
                    <div className="error-content">
                        <h1>خطأ في التحقق من الشهادة</h1>
                        <p>{error}</p>
                        <div className="error-actions">
                            <button onClick={() => window.history.back()} className="btn btn-secondary">
                                العودة
                            </button>
                            <a href="/" className="btn btn-primary">
                                الصفحة الرئيسية
                            </a>
                        </div>
                    </div>
                </div>
                
                <style jsx>{`
                    .error-container {
                        min-height: 60vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 2rem;
                    }
                    .error-content {
                        text-align: center;
                        max-width: 500px;
                    }
                    .error-content h1 {
                        color: #dc3545;
                        margin-bottom: 1rem;
                    }
                    .error-content p {
                        color: #6c757d;
                        margin-bottom: 2rem;
                        font-size: 1.1rem;
                    }
                    .error-actions {
                        display: flex;
                        gap: 1rem;
                        justify-content: center;
                    }
                    .btn {
                        padding: 0.75rem 1.5rem;
                        border: none;
                        border-radius: 6px;
                        text-decoration: none;
                        font-weight: 500;
                        cursor: pointer;
                        transition: all 0.3s ease;
                    }
                    .btn-primary {
                        background: #007bff;
                        color: white;
                    }
                    .btn-primary:hover {
                        background: #0056b3;
                    }
                    .btn-secondary {
                        background: #6c757d;
                        color: white;
                    }
                    .btn-secondary:hover {
                        background: #545b62;
                    }
                `}</style>
            </PublicLayout>
        );
    }

    return (
        <PublicLayout title={`شهادة ${certificate.student_name} - مركز إقامة الكتاب`}>
            <div className="certificate-page">
                <div className="certificate-container">
                    {/* Certificate Header */}
                    <div className="certificate-header">
                        <div className="logo">
                            <h1>مركز إقامة الكتاب</h1>
                            <p>للتعليم والتدريب الإسلامي</p>
                        </div>
                        <div className="certificate-badge">
                            <span>شهادة معتمدة</span>
                        </div>
                    </div>

                    {/* Certificate Content */}
                    <div className="certificate-content">
                        <h2 className="certificate-title">شهادة إتمام دورة</h2>
                        
                        <div className="certificate-text">
                            <p>تشهد إدارة مركز إقامة الكتاب بأن</p>
                            <h3 className="student-name">{certificate.student_name}</h3>
                            <p>قد أتم/أتمت بنجاح متطلبات دورة</p>
                            <h3 className="course-name">{certificate.course_name}</h3>
                            
                            {certificate.course_description && (
                                <p className="course-description">{certificate.course_description}</p>
                            )}
                            
                            <div className="certificate-details">
                                <div className="detail-row">
                                    <span>تاريخ الإصدار:</span>
                                    <span>{new Date(certificate.issue_date).toLocaleDateString('ar-EG', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}</span>
                                </div>
                                
                                {certificate.duration_days > 0 && (
                                    <div className="detail-row">
                                        <span>مدة الدورة:</span>
                                        <span>{certificate.duration_days} يوم</span>
                                    </div>
                                )}
                                
                                <div className="detail-row">
                                    <span>التقدير:</span>
                                    <span className="grade">{certificate.grade}</span>
                                </div>
                                
                                {certificate.teacher_name && (
                                    <div className="detail-row">
                                        <span>المعلم:</span>
                                        <span>{certificate.teacher_name}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Certificate Footer */}
                        <div className="certificate-footer">
                            <div className="signature-section">
                                <div className="signature">
                                    <div className="signature-line"></div>
                                    <p>مدير المركز</p>
                                </div>
                                <div className="seal">
                                    <div className="seal-circle">
                                        <span>ختم المركز</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="verification-info">
                                <p><strong>رمز التحقق:</strong> {certificate.certificate_code}</p>
                                <p><small>يمكن التحقق من صحة هذه الشهادة عبر موقعنا الإلكتروني</small></p>
                                {lastUpdated && (
                                    <p><small>تم التحقق: {new Date(lastUpdated).toLocaleString('ar-EG')}</small></p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Print Button */}
                <div className="actions">
                    <button onClick={() => window.print()} className="btn btn-primary">
                        طباعة الشهادة
                    </button>
                    <button onClick={() => window.history.back()} className="btn btn-secondary">
                        العودة
                    </button>
                </div>

                {/* Debug Information (development only) */}
                {process.env.NODE_ENV === 'development' && metadata && (
                    <div className="debug-section">
                        <h3>معلومات التطوير</h3>
                        <pre>{JSON.stringify(metadata, null, 2)}</pre>
                    </div>
                )}
            </div>

            <style jsx>{`
                .certificate-page {
                    min-height: 100vh;
                    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                    padding: 2rem 1rem;
                    font-family: 'Tajawal', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .certificate-container {
                    max-width: 800px;
                    margin: 0 auto;
                    background: white;
                    border: 10px solid #0056b3;
                    border-radius: 15px;
                    padding: 3rem;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                    position: relative;
                    overflow: hidden;
                }

                .certificate-container::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="2" fill="%23f8f9fa" opacity="0.3"/></svg>') repeat;
                    pointer-events: none;
                }

                .certificate-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                    position: relative;
                    z-index: 1;
                }

                .logo h1 {
                    color: #0056b3;
                    font-size: 2rem;
                    margin: 0;
                    font-weight: 700;
                }

                .logo p {
                    color: #6c757d;
                    margin: 0;
                    font-size: 1rem;
                }

                .certificate-badge {
                    background: linear-gradient(45deg, #28a745, #20c997);
                    color: white;
                    padding: 0.5rem 1rem;
                    border-radius: 20px;
                    font-size: 0.9rem;
                    font-weight: 600;
                }

                .certificate-content {
                    text-align: center;
                    position: relative;
                    z-index: 1;
                }

                .certificate-title {
                    color: #0056b3;
                    font-size: 2.5rem;
                    margin-bottom: 2rem;
                    font-weight: 700;
                    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
                }

                .certificate-text p {
                    font-size: 1.3rem;
                    color: #495057;
                    margin: 1rem 0;
                    line-height: 1.6;
                }

                .student-name, .course-name {
                    color: #0056b3;
                    font-size: 2rem;
                    font-weight: 700;
                    margin: 1.5rem 0;
                    text-decoration: underline;
                    text-decoration-color: #28a745;
                    text-underline-offset: 8px;
                }

                .course-description {
                    font-style: italic;
                    color: #6c757d;
                    font-size: 1.1rem !important;
                    margin: 1rem 0 2rem 0 !important;
                }

                .certificate-details {
                    background: #f8f9fa;
                    border-radius: 10px;
                    padding: 1.5rem;
                    margin: 2rem 0;
                    border: 2px solid #e9ecef;
                }

                .detail-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin: 0.75rem 0;
                    font-size: 1.1rem;
                }

                .detail-row span:first-child {
                    font-weight: 600;
                    color: #495057;
                }

                .detail-row span:last-child {
                    color: #0056b3;
                    font-weight: 500;
                }

                .grade {
                    background: linear-gradient(45deg, #28a745, #20c997);
                    color: white;
                    padding: 0.25rem 0.75rem;
                    border-radius: 15px;
                    font-weight: 700;
                }

                .certificate-footer {
                    margin-top: 3rem;
                }

                .signature-section {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                }

                .signature {
                    text-align: center;
                }

                .signature-line {
                    width: 200px;
                    height: 2px;
                    background: #0056b3;
                    margin: 0 auto 0.5rem auto;
                }

                .signature p {
                    color: #495057;
                    font-weight: 600;
                    margin: 0;
                }

                .seal {
                    text-align: center;
                }

                .seal-circle {
                    width: 80px;
                    height: 80px;
                    border: 3px solid #0056b3;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto;
                    background: linear-gradient(45deg, #f8f9fa, #e9ecef);
                }

                .seal-circle span {
                    font-size: 0.7rem;
                    color: #0056b3;
                    font-weight: 600;
                    text-align: center;
                    line-height: 1.2;
                }

                .verification-info {
                    text-align: center;
                    padding: 1rem;
                    background: #e9ecef;
                    border-radius: 8px;
                    color: #495057;
                }

                .verification-info p {
                    margin: 0.25rem 0;
                }

                .actions {
                    text-align: center;
                    margin: 2rem 0;
                }

                .btn {
                    padding: 0.75rem 2rem;
                    margin: 0 0.5rem;
                    border: none;
                    border-radius: 6px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-decoration: none;
                    display: inline-block;
                }

                .btn-primary {
                    background: #007bff;
                    color: white;
                }

                .btn-primary:hover {
                    background: #0056b3;
                    transform: translateY(-2px);
                }

                .btn-secondary {
                    background: #6c757d;
                    color: white;
                }

                .btn-secondary:hover {
                    background: #545b62;
                    transform: translateY(-2px);
                }

                .debug-section {
                    max-width: 800px;
                    margin: 2rem auto;
                    padding: 1rem;
                    background: #f8f9fa;
                    border-radius: 8px;
                    border: 1px solid #dee2e6;
                }

                .debug-section h3 {
                    margin-top: 0;
                    color: #495057;
                }

                .debug-section pre {
                    background: white;
                    padding: 1rem;
                    border-radius: 4px;
                    overflow-x: auto;
                    font-size: 0.8rem;
                }

                @media print {
                    .actions, .debug-section {
                        display: none;
                    }
                    
                    .certificate-page {
                        background: white;
                        padding: 0;
                    }
                    
                    .certificate-container {
                        box-shadow: none;
                        border: 5px solid #0056b3;
                        margin: 0;
                        max-width: none;
                    }
                }

                @media (max-width: 768px) {
                    .certificate-container {
                        padding: 1.5rem;
                        border-width: 5px;
                    }
                    
                    .certificate-title {
                        font-size: 2rem;
                    }
                    
                    .student-name, .course-name {
                        font-size: 1.5rem;
                    }
                    
                    .certificate-header {
                        flex-direction: column;
                        gap: 1rem;
                        text-align: center;
                    }
                    
                    .signature-section {
                        flex-direction: column;
                        gap: 2rem;
                    }
                    
                    .detail-row {
                        flex-direction: column;
                        gap: 0.25rem;
                        text-align: center;
                    }
                }
            `}</style>
        </PublicLayout>
    );
};

/**
 * Generate static paths for certificates
 * Pre-generates paths for recent certificates
 */
export async function getStaticPaths() {
    try {
        // Get recent certificate codes for pre-generation
        const result = await pool.query(`
            SELECT certificate_code 
            FROM certificates 
            ORDER BY created_at DESC 
            LIMIT 50
        `);
        
        const paths = result.rows.map(cert => ({
            params: { code: cert.certificate_code }
        }));

        return {
            paths,
            fallback: 'blocking' // Generate pages on-demand for other certificates
        };
    } catch (error) {
        console.error('Error generating certificate static paths:', error);
        return {
            paths: [],
            fallback: 'blocking'
        };
    }
}

/**
 * Static Site Generation with ISR for Certificate Verification
 * Implements dynamic ISR for certificate pages
 */
export async function getStaticProps({ params }) {
    const monitor = createISRPerformanceMonitor('certificate-verification');
    
    try {
        const { code } = params;
        
        if (!code) {
            return createErrorResponse(
                generateSmartFallbacks('certificate'),
                ENHANCED_REVALIDATION.ERROR_RECOVERY
            );
        }

        const certificate = await fetchCertificateData(code);
        
        if (!certificate) {
            return createErrorResponse({
                certificate: null,
                error: 'الشهادة غير موجودة أو الرمز غير صحيح'
            }, ENHANCED_REVALIDATION.ERROR_RECOVERY);
        }

        const duration = monitor.logPerformance({
            certificateCode: code,
            studentName: certificate.student_name
        });

        return createSuccessResponse({
            certificate,
            metadata: {
                pageType: 'certificate_verification',
                cacheStrategy: 'Dynamic ISR',
                certificateCode: code,
                generationTime: duration,
                generatedAt: new Date().toISOString()
            }
        }, ENHANCED_REVALIDATION.REALTIME);

    } catch (error) {
        console.error('Error in getStaticProps for certificate:', error);
        
        monitor.logPerformance({ error: error.message });
        
        return createErrorResponse({
            certificate: null,
            error: 'حدث خطأ أثناء محاولة التحقق من الشهادة'
        }, ENHANCED_REVALIDATION.ERROR_RECOVERY);
    }
}

export default CertificateVerificationISR;