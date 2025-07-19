import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { withAuth } from '../lib/withAuth';
import { useRouter } from 'next/router';

const CoursesApplicationPage = ({ user }) => {
    const [courses, setCourses] = useState([]);
    const [filteredCourses, setFilteredCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        role: user.role,
        priceRange: 'all',
        availability: 'all',
        search: ''
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
            const queryParams = new URLSearchParams({
                role: user.role
            });
            
            const response = await fetch(`/api/courses/filter?${queryParams}`);
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

        // Search filter
        if (filters.search) {
            filtered = filtered.filter(course => 
                course.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                course.description?.toLowerCase().includes(filters.search.toLowerCase())
            );
        }

        // Price filter
        if (filters.priceRange !== 'all') {
            const [min, max] = filters.priceRange.split('-').map(Number);
            filtered = filtered.filter(course => {
                const price = course.details?.price || 0;
                return price >= min && (max ? price <= max : true);
            });
        }

        // Availability filter
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
            }
        } catch (err) {
            setApplicationStatus({ type: 'error', message: 'حدث خطأ في الاتصال' });
        }
    };

    const openApplicationModal = (course) => {
        setSelectedCourse(course);
        setShowModal(true);
        setApplicationStatus(null);
    };

    if (loading) {
        return (
            <Layout user={user}>
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>جاري تحميل الدورات...</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout user={user}>
            <div className="courses-application-page">
                <div className="page-header">
                    <h1>التقديم للدورات</h1>
                    <p>اختر الدورة المناسبة لك وابدأ رحلتك التعليمية</p>
                </div>

                {/* Filters Section */}
                <div className="filters-section">
                    <div className="filters-grid">
                        <div className="filter-group">
                            <label>البحث</label>
                            <input
                                type="text"
                                placeholder="ابحث عن دورة..."
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                            />
                        </div>
                        
                        <div className="filter-group">
                            <label>نطاق الأسعار</label>
                            <select 
                                value={filters.priceRange} 
                                onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                            >
                                <option value="all">جميع الأسعار</option>
                                <option value="0-100">أقل من 100 ريال</option>
                                <option value="100-300">100 - 300 ريال</option>
                                <option value="300-500">300 - 500 ريال</option>
                                <option value="500">أكثر من 500 ريال</option>
                            </select>
                        </div>
                        
                        <div className="filter-group">
                            <label>حالة التوفر</label>
                            <select 
                                value={filters.availability} 
                                onChange={(e) => handleFilterChange('availability', e.target.value)}
                            >
                                <option value="all">جميع الدورات</option>
                                <option value="available">متاح</option>
                                <option value="waiting">في انتظار المزيد</option>
                                <option value="full">مكتمل العدد</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Application Status */}
                {applicationStatus && (
                    <div className={`status-message ${applicationStatus.type}`}>
                        {applicationStatus.message}
                    </div>
                )}

                {/* Courses Grid */}
                <div className="courses-grid">
                    {filteredCourses.length === 0 ? (
                        <div className="no-courses">
                            <h3>لا توجد دورات متاحة</h3>
                            <p>جرب تغيير معايير البحث أو تحقق لاحقاً</p>
                        </div>
                    ) : (
                        filteredCourses.map(course => (
                            <div key={course.id} className="course-application-card">
                                <div className="course-header">
                                    <h3>{course.name}</h3>
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
                                        <span className="price">
                                            {course.details?.price || 0} {course.details?.currency || 'ريال'}
                                        </span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="label">المسجلين:</span>
                                        <span>{course.current_enrollment}/{course.max_enrollment}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="label">المنشئ:</span>
                                        <span>{course.creator_name}</span>
                                    </div>
                                </div>

                                {/* Eligibility Check */}
                                {course.eligible === false && (
                                    <div className="eligibility-warning">
                                        <h4>غير مؤهل للتسجيل:</h4>
                                        <ul>
                                            {course.eligibility_reasons?.map((reason, index) => (
                                                <li key={index}>{reason}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div className="course-actions">
                                    <button 
                                        className="btn btn-primary"
                                        onClick={() => openApplicationModal(course)}
                                        disabled={course.availability_status === 'full' || course.eligible === false}
                                    >
                                        {course.availability_status === 'full' ? 'مكتمل العدد' : 
                                         course.eligible === false ? 'غير مؤهل' : 'التقديم للدورة'}
                                    </button>
                                    <button 
                                        className="btn btn-outline"
                                        onClick={() => router.push(`/courses/${course.id}`)}
                                    >
                                        عرض التفاصيل
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Application Modal */}
                {showModal && selectedCourse && (
                    <div className="modal">
                        <div className="modal-content">
                            <span className="close-button" onClick={() => setShowModal(false)}>×</span>
                            <h3>تأكيد التقديم للدورة</h3>
                            <div className="course-summary">
                                <h4>{selectedCourse.name}</h4>
                                <p>{selectedCourse.description}</p>
                                <div className="summary-details">
                                    <div className="detail-item">
                                        <strong>المدة:</strong> {selectedCourse.details?.duration_weeks || 8} أسابيع
                                    </div>
                                    <div className="detail-item">
                                        <strong>الرسوم:</strong> {selectedCourse.details?.price || 0} {selectedCourse.details?.currency || 'ريال'}
                                    </div>
                                    {selectedCourse.details?.price > 0 && (
                                        <div className="payment-info">
                                            <p><strong>ملاحظة:</strong> سيتم إنشاء فاتورة دفع بعد التسجيل. يجب دفع الرسوم خلال 7 أيام لتأكيد التسجيل.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {applicationStatus && (
                                <div className={`status-message ${applicationStatus.type}`}>
                                    {applicationStatus.message}
                                </div>
                            )}
                            
                            <div className="modal-actions">
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
                .courses-application-page {
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

                .filters-section {
                    background: var(--white-color);
                    padding: 30px;
                    border-radius: 15px;
                    box-shadow: var(--shadow-md);
                    margin-bottom: 30px;
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

                .filter-group input,
                .filter-group select {
                    width: 100%;
                    padding: 12px;
                    border: 2px solid #e1e5e9;
                    border-radius: 8px;
                    font-size: 1rem;
                    transition: border-color 0.3s ease;
                }

                .filter-group input:focus,
                .filter-group select:focus {
                    outline: none;
                    border-color: var(--primary-color);
                }

                .status-message {
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    text-align: center;
                    font-weight: 500;
                }

                .status-message.success {
                    background: #d4edda;
                    color: #155724;
                    border: 1px solid #c3e6cb;
                }

                .status-message.error {
                    background: #f8d7da;
                    color: #721c24;
                    border: 1px solid #f5c6cb;
                }

                .courses-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
                    gap: 30px;
                }

                .course-application-card {
                    background: var(--white-color);
                    border: 1px solid #e9ecef;
                    border-radius: 15px;
                    padding: 30px;
                    box-shadow: var(--shadow-md);
                    transition: all 0.3s ease;
                }

                .course-application-card:hover {
                    transform: translateY(-5px);
                    box-shadow: var(--shadow-xl);
                }

                .course-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 15px;
                }

                .course-header h3 {
                    color: var(--primary-color);
                    font-size: 1.4rem;
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
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                }

                .detail-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 10px;
                }

                .detail-row:last-child {
                    margin-bottom: 0;
                }

                .detail-row .label {
                    font-weight: 600;
                    color: var(--gray-700);
                }

                .price {
                    color: var(--primary-color);
                    font-weight: 600;
                    font-size: 1.1rem;
                }

                .eligibility-warning {
                    background: #fff3cd;
                    border: 1px solid #ffeaa7;
                    border-radius: 8px;
                    padding: 15px;
                    margin-bottom: 20px;
                }

                .eligibility-warning h4 {
                    color: #856404;
                    margin-bottom: 10px;
                    font-size: 1rem;
                }

                .eligibility-warning ul {
                    margin: 0;
                    padding-right: 20px;
                }

                .eligibility-warning li {
                    color: #856404;
                    margin-bottom: 5px;
                }

                .course-actions {
                    display: flex;
                    gap: 10px;
                }

                .course-actions .btn {
                    flex: 1;
                    padding: 12px;
                    text-align: center;
                    text-decoration: none;
                    border-radius: 8px;
                    font-weight: 500;
                    transition: all 0.3s ease;
                    border: none;
                    cursor: pointer;
                }

                .no-courses {
                    grid-column: 1 / -1;
                    text-align: center;
                    padding: 60px 20px;
                    color: var(--gray-600);
                }

                .loading-container {
                    text-align: center;
                    padding: 60px 20px;
                }

                .loading-spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid var(--primary-color);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 20px;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .course-summary {
                    margin-bottom: 20px;
                }

                .summary-details {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 8px;
                    margin-top: 15px;
                }

                .detail-item {
                    margin-bottom: 10px;
                }

                .payment-info {
                    background: #e7f3ff;
                    padding: 15px;
                    border-radius: 8px;
                    margin-top: 15px;
                    border: 1px solid #b3d9ff;
                }

                .modal-actions {
                    display: flex;
                    gap: 15px;
                    justify-content: flex-end;
                }

                .modal-actions .btn {
                    padding: 12px 24px;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 500;
                    transition: all 0.3s ease;
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

export default CoursesApplicationPage;