import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import { withAuth } from '../../lib/withAuth';
import { useRouter } from 'next/router';

const CourseApplicationPage = ({ user }) => {
    const [courses, setCourses] = useState([]);
    const [filteredCourses, setFilteredCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        role: user.role,
        priceRange: 'all',
        availability: 'all'
    });
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [applicationStatus, setApplicationStatus] = useState(null);
    const router = useRouter();

    useEffect(() => {
        loadCourses();
    }, [loadCourses]);

    useEffect(() => {
        applyFilters();
    }, [courses, filters, applyFilters]);

    const loadCourses = useCallback(async () => {
        try {
            const response = await fetch('/api/courses/filter?' + new URLSearchParams({
                role: user.role,
                status: 'active'
            }));
            
            if (response.ok) {
                const data = await response.json();
                setCourses(data);
            }
        } catch (err) {
            console.error('Failed to load courses:', err);
        } finally {
            setLoading(false);
        }
    }, [user.role]);

    const applyFilters = useCallback(() => {
        let filtered = [...courses];

        if (filters.priceRange !== 'all') {
            const [min, max] = filters.priceRange.split('-').map(Number);
            filtered = filtered.filter(course => {
                const price = course.details?.price || 0;
                return price >= min && (max ? price <= max : true);
            });
        }

        if (filters.availability !== 'all') {
            filtered = filtered.filter(course => course.availability_status === filters.availability);
        }

        setFilteredCourses(filtered);
    }, [courses, filters]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleApply = async (courseId) => {
        try {
            const response = await fetch('/api/courses/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courseId })
            });

            const result = await response.json();
            
            if (response.ok) {
                setApplicationStatus({ type: 'success', message: result.message });
                setShowModal(false);
                // Refresh courses to update enrollment count
                loadCourses();
            } else {
                setApplicationStatus({ type: 'error', message: result.message });
                // Scroll to top to show error message
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch (err) {
            setApplicationStatus({ type: 'error', message: 'حدث خطأ في الاتصال' });
            // Scroll to top to show error message
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const openApplicationModal = (course) => {
        setSelectedCourse(course);
        setShowModal(true);
        setApplicationStatus(null);
    };

    const getPriceDisplay = (course) => {
        const details = course.details || {};
        if (!details.price || details.price === 0) return 'مجاني';
        
        const currency = details.currency === 'USD' ? 'دولار' : 
                        details.currency === 'EGP' ? 'جنيه' : 'ريال';
        return `${details.price} ${currency}`;
    };

    const getEligibilityStatus = (course) => {
        if (!course.eligible) {
            return {
                canApply: false,
                reasons: course.eligibility_reasons || ['غير مؤهل للتسجيل']
            };
        }
        
        if (course.availability_status === 'full') {
            return {
                canApply: false,
                reasons: ['الدورة مكتملة العدد']
            };
        }

        return { canApply: true, reasons: [] };
    };

    if (loading) {
        return (
            <Layout user={user}>
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>جاري تحميل الدورات المتاحة...</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout user={user}>
            <div className="course-application-page">
                <div className="page-header">
                    <h1>التقديم لدورة جديدة</h1>
                    <p>اختر الدورة المناسبة لك من الدورات المتاحة أدناه</p>
                </div>

                {applicationStatus && (
                    <div className={`alert ${applicationStatus.type}`}>
                        {applicationStatus.message}
                    </div>
                )}

                {/* Filters */}
                <div className="filters-section">
                    <h3>تصفية النتائج</h3>
                    <div className="filters-grid">
                        <div className="filter-group">
                            <label>نطاق الأسعار:</label>
                            <select 
                                value={filters.priceRange} 
                                onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                            >
                                <option value="all">جميع الأسعار</option>
                                <option value="0-0">مجاني</option>
                                <option value="1-200">1 - 200 ريال</option>
                                <option value="201-500">201 - 500 ريال</option>
                                <option value="501-">أكثر من 500 ريال</option>
                            </select>
                        </div>
                        
                        <div className="filter-group">
                            <label>حالة التوفر:</label>
                            <select 
                                value={filters.availability} 
                                onChange={(e) => handleFilterChange('availability', e.target.value)}
                            >
                                <option value="all">جميع الدورات</option>
                                <option value="available">متاح للتسجيل</option>
                                <option value="waiting">في انتظار المزيد</option>
                                <option value="full">مكتمل العدد</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Courses Grid */}
                <div className="courses-section">
                    <h3>الدورات المتاحة ({filteredCourses.length})</h3>
                    
                    {filteredCourses.length === 0 ? (
                        <div className="no-courses">
                            <p>لا توجد دورات متاحة تطابق المعايير المحددة</p>
                        </div>
                    ) : (
                        <div className="courses-grid">
                            {filteredCourses.map(course => {
                                const eligibility = getEligibilityStatus(course);
                                
                                return (
                                    <div key={course.id} className="course-card">
                                        <div className="course-header">
                                            <h4>{course.name}</h4>
                                            <span className={`availability-badge ${course.availability_status}`}>
                                                {course.availability_status === 'full' ? 'مكتمل العدد' :
                                                 course.availability_status === 'available' ? 'متاح' : 'في انتظار المزيد'}
                                            </span>
                                        </div>
                                        
                                        <p className="course-description">{course.description}</p>
                                        
                                        <div className="course-details">
                                            <div className="detail-row">
                                                <span className="label">المدة:</span>
                                                <span>{course.details?.duration_weeks || 8} أسابيع</span>
                                            </div>
                                            <div className="detail-row">
                                                <span className="label">الرسوم:</span>
                                                <span>{getPriceDisplay(course)}</span>
                                            </div>
                                            <div className="detail-row">
                                                <span className="label">المسجلين:</span>
                                                <span>{course.current_enrollment}/{course.max_enrollment}</span>
                                            </div>
                                            {course.details?.target_age && (
                                                <div className="detail-row">
                                                    <span className="label">العمر المستهدف:</span>
                                                    <span>{course.details?.target_age}</span>
                                                </div>
                                            )}
                                        </div>

                                        {!eligibility.canApply && (
                                            <div className="eligibility-issues">
                                                <h5>أسباب عدم الأهلية:</h5>
                                                <ul>
                                                    {eligibility.reasons.map((reason, index) => (
                                                        <li key={index}>{reason}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        <div className="course-actions">
                                            <button 
                                                className={`btn ${eligibility.canApply ? 'btn-primary' : 'btn-disabled'}`}
                                                onClick={() => eligibility.canApply && openApplicationModal(course)}
                                                disabled={!eligibility.canApply}
                                            >
                                                {eligibility.canApply ? 'التقديم للدورة' : 'غير متاح'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Application Modal */}
                {showModal && selectedCourse && (
                    <div className="modal">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h3>تأكيد التقديم للدورة</h3>
                                <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
                            </div>
                            
                            <div className="modal-body">
                                <h4>{selectedCourse.name}</h4>
                                <p>{selectedCourse.description}</p>
                                
                                <div className="application-details">
                                    <h5>تفاصيل التسجيل:</h5>
                                    <ul>
                                        <li>الرسوم: {getPriceDisplay(selectedCourse)}</li>
                                        <li>المدة: {selectedCourse.details?.duration_weeks || 8} أسابيع</li>
                                        {selectedCourse.details?.price > 0 && (
                                            <li>مطلوب دفع جدية الاشتراك خلال 7 أيام</li>
                                        )}
                                        <li>سيتم إشعارك بموعد بداية الدورة</li>
                                    </ul>
                                </div>

                                {applicationStatus && (
                                    <div className={`alert ${applicationStatus.type}`}>
                                        {applicationStatus.message}
                                    </div>
                                )}
                            </div>
                            
                            <div className="modal-footer">
                                <button 
                                    className="btn btn-primary"
                                    onClick={() => handleApply(selectedCourse.id)}
                                >
                                    تأكيد التقديم
                                </button>
                                <button 
                                    className="btn btn-secondary"
                                    onClick={() => setShowModal(false)}
                                >
                                    إلغاء
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                .course-application-page {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 20px;
                }

                .page-header {
                    text-align: center;
                    margin-bottom: 40px;
                }

                .page-header h1 {
                    color: var(--primary-color);
                    font-size: 2.5rem;
                    margin-bottom: 10px;
                }

                .page-header p {
                    color: var(--gray-600);
                    font-size: 1.1rem;
                }

                .alert {
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                }

                .alert.success {
                    background: #d4edda;
                    color: #155724;
                    border: 1px solid #c3e6cb;
                }

                .alert.error {
                    background: #f8d7da;
                    color: #721c24;
                    border: 1px solid #f5c6cb;
                }

                .filters-section {
                    background: var(--white-color);
                    padding: 25px;
                    border-radius: 12px;
                    box-shadow: var(--shadow-md);
                    margin-bottom: 30px;
                }

                .filters-section h3 {
                    color: var(--primary-color);
                    margin-bottom: 20px;
                }

                .filters-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 20px;
                }

                .filter-group label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 600;
                    color: var(--gray-700);
                }

                .filter-group select {
                    width: 100%;
                    padding: 10px;
                    border: 2px solid #e1e5e9;
                    border-radius: 8px;
                    font-size: 1rem;
                }

                .courses-section h3 {
                    color: var(--primary-color);
                    margin-bottom: 25px;
                    font-size: 1.8rem;
                }

                .courses-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
                    gap: 25px;
                }

                .course-card {
                    background: var(--white-color);
                    border: 1px solid #e9ecef;
                    border-radius: 15px;
                    padding: 25px;
                    box-shadow: var(--shadow-md);
                    transition: all 0.3s ease;
                }

                .course-card:hover {
                    transform: translateY(-3px);
                    box-shadow: var(--shadow-lg);
                }

                .course-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 15px;
                }

                .course-header h4 {
                    color: var(--primary-color);
                    font-size: 1.3rem;
                    margin: 0;
                    flex: 1;
                }

                .course-description {
                    color: var(--gray-600);
                    line-height: 1.6;
                    margin-bottom: 20px;
                }

                .course-details {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                }

                .detail-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                }

                .detail-row:last-child {
                    margin-bottom: 0;
                }

                .detail-row .label {
                    font-weight: 600;
                    color: var(--gray-700);
                }

                .eligibility-issues {
                    background: #fff3cd;
                    border: 1px solid #ffeaa7;
                    border-radius: 8px;
                    padding: 15px;
                    margin-bottom: 20px;
                }

                .eligibility-issues h5 {
                    color: #856404;
                    margin-bottom: 10px;
                }

                .eligibility-issues ul {
                    margin: 0;
                    padding-right: 20px;
                }

                .eligibility-issues li {
                    color: #856404;
                    margin-bottom: 5px;
                }

                .course-actions {
                    text-align: center;
                }

                .btn-disabled {
                    background: var(--gray-400);
                    cursor: not-allowed;
                }

                .btn-disabled:hover {
                    transform: none;
                    box-shadow: none;
                }

                .no-courses {
                    text-align: center;
                    padding: 60px 20px;
                    color: var(--gray-600);
                }

                .loading-container {
                    text-align: center;
                    padding: 60px 20px;
                }

                .loading-spinner {
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid var(--primary-color);
                    border-radius: 50%;
                    width: 50px;
                    height: 50px;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 20px;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.6);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }

                .modal-content {
                    background: var(--white-color);
                    border-radius: 15px;
                    max-width: 500px;
                    width: 90%;
                    max-height: 80vh;
                    overflow-y: auto;
                }

                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 25px 25px 0;
                    border-bottom: 1px solid #eee;
                    margin-bottom: 20px;
                }

                .modal-header h3 {
                    color: var(--primary-color);
                    margin: 0;
                }

                .close-btn {
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: var(--gray-600);
                }

                .modal-body {
                    padding: 0 25px;
                }

                .modal-body h4 {
                    color: var(--primary-color);
                    margin-bottom: 10px;
                }

                .application-details {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                }

                .application-details h5 {
                    color: var(--primary-color);
                    margin-bottom: 15px;
                }

                .application-details ul {
                    margin: 0;
                    padding-right: 20px;
                }

                .application-details li {
                    margin-bottom: 8px;
                    line-height: 1.5;
                }

                .modal-footer {
                    padding: 20px 25px 25px;
                    display: flex;
                    gap: 15px;
                    justify-content: flex-end;
                }

                @media (max-width: 768px) {
                    .courses-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .filters-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .modal-footer {
                        flex-direction: column;
                    }
                }
            `}</style>
        </Layout>
    );
};

export const getServerSideProps = withAuth(async (context) => {
    return {
        props: {
            user: JSON.parse(JSON.stringify(context.user))
        }
    };
});

export default CourseApplicationPage;