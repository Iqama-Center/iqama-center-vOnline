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
                const price = course.course_fee || 0;
                return price >= min && (max ? price <= max : true);
            });
        }

        // Availability filter
        if (filters.availability !== 'all') {
             filtered = filtered.filter(course => {
                if (filters.availability === 'available') {
                    return course.student_count < course.max_enrollment;
                }
                if (filters.availability === 'full') {
                    return course.student_count >= course.max_enrollment;
                }
                return true;
            });
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
                body: JSON.stringify({ courseId, levelNumber: selectedCourse.level_number })
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
                                <option value="all">الكل</option>
                                <option value="available">متاح للتسجيل</option>
                                <option value="full">مكتمل العدد</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Courses Grid */}
                <div className="courses-grid">
                    {filteredCourses.map(course => (
                        <div key={course.id} className="course-card-app">
                            <div className="card-header">
                                <h3>{course.name}</h3>
                                <span className={`status-badge ${
                                    course.student_count >= course.max_enrollment ? 'status-full' : 'status-available'
                                }`}>
                                    {course.student_count >= course.max_enrollment ? 'مكتمل' : 'متاح'}
                                </span>
                            </div>
                            <div className="card-body">
                                <p>{course.description}</p>
                                <div className="course-meta">
                                    <span><i className="fas fa-users"></i> {course.student_count} / {course.max_enrollment}</span>
                                    <span><i className="fas fa-money-bill-wave"></i> {course.course_fee} ريال</span>
                                    <span><i className="fas fa-calendar-alt"></i> يبدأ في: {new Date(course.start_date).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div className="card-footer">
                                <button 
                                    onClick={() => openApplicationModal(course)}
                                    disabled={course.student_count >= course.max_enrollment || course.is_enrolled}
                                    className="btn-apply"
                                >
                                    {course.is_enrolled ? 'مسجل بالفعل' : 'قدم الآن'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Application Modal */}
                {showModal && selectedCourse && (
                    <div className="modal-backdrop">
                        <div className="modal-content">
                            <h2>تأكيد التقديم</h2>
                            <p>أنت على وشك التقديم لدورة: <strong>{selectedCourse.name}</strong></p>
                            {selectedCourse.course_fee > 0 && (
                                <p className="payment-notice">
                                    هذه الدورة تتطلب رسومًا قدرها <strong>{selectedCourse.course_fee} ريال</strong>. 
                                    سيتم إنشاء فاتورة لك بعد تأكيد التقديم.
                                </p>
                            )}
                             {selectedCourse.level_number && (
                                <p>سيتم تسجيلك في المستوى: <strong>{selectedCourse.level_number}</strong></p>
                            )}
                            {applicationStatus && (
                                <div className={`alert alert-${applicationStatus.type}`}>
                                    {applicationStatus.message}
                                </div>
                            )}
                            <div className="modal-actions">
                                <button onClick={() => handleApply(selectedCourse.id)} className="btn-confirm">تأكيد التقديم</button>
                                <button onClick={() => setShowModal(false)} className="btn-cancel">إلغاء</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <style jsx>{`
                /* --- General Page Layout --- */
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

                /* --- Filters Section --- */
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

                /* --- Courses Grid & Cards --- */
                .courses-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                    gap: 30px;
                }

                /* CORRECTED: Renamed from .course-application-card */
                .course-card-app {
                    background: var(--white-color);
                    border: 1px solid #e9ecef;
                    border-radius: 15px;
                    box-shadow: var(--shadow-md);
                    transition: all 0.3s ease;
                    display: flex;
                    flex-direction: column;
                }
                .course-card-app:hover {
                    transform: translateY(-5px);
                    box-shadow: var(--shadow-xl);
                }

                /* CORRECTED: Renamed from .course-header */
                .card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    padding: 20px 25px;
                    border-bottom: 1px solid #e9ecef;
                }
                .card-header h3 {
                    color: var(--primary-color);
                    font-size: 1.3rem;
                    margin: 0;
                    flex: 1;
                }

                /* NEW: Styles for status badges */
                .status-badge {
                    padding: 5px 12px;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    color: #fff;
                    white-space: nowrap;
                }
                .status-available {
                    background-color: #28a745; /* Green */
                }
                .status-full {
                    background-color: #dc3545; /* Red */
                }

                /* NEW: Styles for card body */
                .card-body {
                    padding: 20px 25px;
                    flex-grow: 1; /* Makes body take available space */
                }
                .card-body p {
                    color: var(--gray-600);
                    line-height: 1.6;
                    margin-bottom: 20px;
                }

                /* NEW: Styles for course metadata */
                .course-meta {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 15px;
                    color: var(--gray-700);
                    font-size: 0.9rem;
                }
                .course-meta span {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }

                /* NEW: Styles for card footer */
                .card-footer {
                    padding: 20px 25px;
                    background-color: #f8f9fa;
                    border-top: 1px solid #e9ecef;
                    border-bottom-left-radius: 15px;
                    border-bottom-right-radius: 15px;
                }
                
                .btn-apply {
                    width: 100%;
                    padding: 12px;
                    text-align: center;
                    text-decoration: none;
                    border-radius: 8px;
                    font-weight: 600;
                    transition: all 0.3s ease;
                    border: none;
                    cursor: pointer;
                    background-color: var(--primary-color);
                    color: white;
                    font-size: 1rem;
                }
                .btn-apply:hover:not(:disabled) {
                    background-color: var(--primary-dark-color);
                }
                .btn-apply:disabled {
                    background-color: #ccc;
                    cursor: not-allowed;
                }

                /* --- Loading Spinner --- */
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

                /* --- Modal Styles (NEW & ESSENTIAL) --- */
                .modal-backdrop {
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
                    background: white;
                    padding: 30px;
                    border-radius: 15px;
                    width: 90%;
                    max-width: 500px;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.3);
                    text-align: center;
                }
                .modal-content h2 {
                    margin-top: 0;
                    color: var(--primary-color);
                }
                .payment-notice {
                    background: #e7f3ff;
                    padding: 15px;
                    border-radius: 8px;
                    margin-top: 15px;
                    border: 1px solid #b3d9ff;
                    font-size: 0.95rem;
                }
                .alert {
                    padding: 15px;
                    border-radius: 8px;
                    margin: 20px 0;
                    text-align: center;
                    font-weight: 500;
                }
                .alert-success {
                    background: #d4edda;
                    color: #155724;
                }
                .alert-error {
                    background: #f8d7da;
                    color: #721c24;
                }
                .modal-actions {
                    display: flex;
                    gap: 15px;
                    justify-content: center;
                    margin-top: 30px;
                }
                .modal-actions button {
                    padding: 12px 24px;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.3s ease;
                    font-size: 1rem;
                }
                .btn-confirm {
                    background-color: #28a745;
                    color: white;
                }
                .btn-confirm:hover {
                    background-color: #218838;
                }
                .btn-cancel {
                    background-color: #6c757d;
                    color: white;
                }
                .btn-cancel:hover {
                    background-color: #5a6268;
                }
            `}</style>
        </Layout>
    );
};

export async function getServerSideProps(context) {
    // This page fetches data on the client side, so we just pass the user.
    const { user } = context;
    return {
        props: { user }
    };
}

export default withAuth(CoursesApplicationPage);