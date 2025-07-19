import React, { useState } from 'react';
import Head from 'next/head';
import { withAuth } from '../../lib/withAuth';
import Layout from '../../components/Layout';
import pool from '../../lib/db';

const TeacherTasksPage = ({ user, courses, tasks }) => {
    const [activeTab, setActiveTab] = useState('create');
    const [taskForm, setTaskForm] = useState({
        title: '',
        description: '',
        course_id: '',
        type: 'homework',
        due_date: '',
        max_score: 100,
        instructions: ''
    });
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);

    const taskTypes = {
        homework: 'واجب منزلي',
        exam: 'امتحان',
        reading: 'قراءة',
        daily_wird: 'ورد يومي',
        review: 'مراجعة'
    };

    const handleTaskSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsError(false);

        try {
            const response = await fetch('/api/tasks/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskForm)
            });

            const result = await response.json();
            setMessage(result.message);
            setIsError(!response.ok);

            if (response.ok) {
                setTaskForm({
                    title: '',
                    description: '',
                    course_id: '',
                    type: 'homework',
                    due_date: '',
                    max_score: 100,
                    instructions: ''
                });
                // Refresh the page to show new task
                setTimeout(() => window.location.reload(), 1500);
            }
        } catch (err) {
            setMessage('حدث خطأ في الاتصال بالخادم');
            setIsError(true);
            // Scroll to top to show error message
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setTaskForm(prev => ({ ...prev, [name]: value }));
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getTaskStatusColor = (dueDate) => {
        const now = new Date();
        const due = new Date(dueDate);
        const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) return '#dc3545'; // Red for overdue
        if (diffDays <= 2) return '#ffc107'; // Yellow for due soon
        return '#28a745'; // Green for plenty of time
    };

    return (
        <Layout user={user}>
            <Head>
                <title>إدارة المهام - مركز إقامة الكتاب</title>
            </Head>

            <div className="tasks-container">
                <h1>إدارة المهام والواجبات</h1>

                {message && (
                    <div className={`message ${isError ? 'error' : 'success'}`}>
                        {message}
                    </div>
                )}

                {/* Tabs */}
                <div className="tabs">
                    <button
                        className={`tab ${activeTab === 'create' ? 'active' : ''}`}
                        onClick={() => setActiveTab('create')}
                    >
                        <i className="fas fa-plus"></i> إنشاء مهمة جديدة
                    </button>
                    <button
                        className={`tab ${activeTab === 'manage' ? 'active' : ''}`}
                        onClick={() => setActiveTab('manage')}
                    >
                        <i className="fas fa-tasks"></i> إدارة المهام
                    </button>
                    <button
                        className={`tab ${activeTab === 'submissions' ? 'active' : ''}`}
                        onClick={() => setActiveTab('submissions')}
                    >
                        <i className="fas fa-file-alt"></i> تقديمات الطلاب
                    </button>
                </div>

                {/* Tab Content */}
                <div className="tab-content">
                    {activeTab === 'create' && (
                        <div className="create-task">
                            <h2>إنشاء مهمة جديدة</h2>
                            <form onSubmit={handleTaskSubmit} className="task-form">
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label htmlFor="title">عنوان المهمة *</label>
                                        <input
                                            type="text"
                                            id="title"
                                            name="title"
                                            value={taskForm.title}
                                            onChange={handleChange}
                                            required
                                            placeholder="مثال: حفظ سورة الفاتحة"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="course_id">الدورة *</label>
                                        <select
                                            id="course_id"
                                            name="course_id"
                                            value={taskForm.course_id}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="">اختر الدورة</option>
                                            {courses.map(course => (
                                                <option key={course.id} value={course.id}>
                                                    {course.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="type">نوع المهمة *</label>
                                        <select
                                            id="type"
                                            name="type"
                                            value={taskForm.type}
                                            onChange={handleChange}
                                            required
                                        >
                                            {Object.entries(taskTypes).map(([key, value]) => (
                                                <option key={key} value={key}>{value}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="due_date">تاريخ التسليم *</label>
                                        <input
                                            type="datetime-local"
                                            id="due_date"
                                            name="due_date"
                                            value={taskForm.due_date}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="max_score">الدرجة الكاملة</label>
                                        <input
                                            type="number"
                                            id="max_score"
                                            name="max_score"
                                            value={taskForm.max_score}
                                            onChange={handleChange}
                                            min="1"
                                            max="1000"
                                        />
                                    </div>

                                    <div className="form-group full-width">
                                        <label htmlFor="description">وصف المهمة *</label>
                                        <textarea
                                            id="description"
                                            name="description"
                                            value={taskForm.description}
                                            onChange={handleChange}
                                            rows="4"
                                            required
                                            placeholder="اكتب وصفاً مفصلاً للمهمة..."
                                        ></textarea>
                                    </div>

                                    <div className="form-group full-width">
                                        <label htmlFor="instructions">تعليمات إضافية</label>
                                        <textarea
                                            id="instructions"
                                            name="instructions"
                                            value={taskForm.instructions}
                                            onChange={handleChange}
                                            rows="3"
                                            placeholder="أي تعليمات إضافية للطلاب..."
                                        ></textarea>
                                    </div>
                                </div>

                                <button type="submit" className="btn btn-primary">
                                    <i className="fas fa-save"></i> إنشاء المهمة
                                </button>
                            </form>
                        </div>
                    )}

                    {activeTab === 'manage' && (
                        <div className="manage-tasks">
                            <h2>المهام المُنشأة</h2>
                            {tasks.length > 0 ? (
                                <div className="tasks-grid">
                                    {tasks.map(task => (
                                        <div key={task.id} className="task-card">
                                            <div className="task-header">
                                                <h3>{task.title}</h3>
                                                <span 
                                                    className="task-type"
                                                    style={{ backgroundColor: getTaskStatusColor(task.due_date) }}
                                                >
                                                    {taskTypes[task.type]}
                                                </span>
                                            </div>
                                            <p className="task-description">{task.description}</p>
                                            <div className="task-meta">
                                                <div className="meta-item">
                                                    <i className="fas fa-book"></i>
                                                    <span>{task.course_name}</span>
                                                </div>
                                                <div className="meta-item">
                                                    <i className="fas fa-calendar"></i>
                                                    <span>التسليم: {formatDate(task.due_date)}</span>
                                                </div>
                                                <div className="meta-item">
                                                    <i className="fas fa-users"></i>
                                                    <span>{task.submission_count || 0} تقديم</span>
                                                </div>
                                                <div className="meta-item">
                                                    <i className="fas fa-star"></i>
                                                    <span>{task.max_score} درجة</span>
                                                </div>
                                            </div>
                                            <div className="task-actions">
                                                <button className="btn btn-outline btn-sm">
                                                    <i className="fas fa-edit"></i> تعديل
                                                </button>
                                                <button className="btn btn-primary btn-sm">
                                                    <i className="fas fa-eye"></i> عرض التقديمات
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <i className="fas fa-tasks"></i>
                                    <h3>لا توجد مهام</h3>
                                    <p>لم تقم بإنشاء أي مهام بعد</p>
                                    <button 
                                        className="btn btn-primary"
                                        onClick={() => setActiveTab('create')}
                                    >
                                        إنشاء مهمة جديدة
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'submissions' && (
                        <div className="submissions">
                            <h2>تقديمات الطلاب</h2>
                            <div className="submissions-filters">
                                <select className="filter-select">
                                    <option value="">جميع المهام</option>
                                    {tasks.map(task => (
                                        <option key={task.id} value={task.id}>{task.title}</option>
                                    ))}
                                </select>
                                <select className="filter-select">
                                    <option value="">جميع الحالات</option>
                                    <option value="pending">في الانتظار</option>
                                    <option value="submitted">مُقدم</option>
                                    <option value="graded">مُقيم</option>
                                    <option value="late">متأخر</option>
                                </select>
                            </div>
                            <div className="submissions-list">
                                <p className="text-center">سيتم عرض تقديمات الطلاب هنا</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .tasks-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 2rem;
                }

                .message {
                    padding: 1rem;
                    border-radius: 5px;
                    margin-bottom: 2rem;
                    text-align: center;
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

                .tabs {
                    display: flex;
                    background: white;
                    border-radius: 10px 10px 0 0;
                    overflow: hidden;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    margin-bottom: 0;
                }

                .tab {
                    flex: 1;
                    padding: 1rem 2rem;
                    border: none;
                    background: #f8f9fa;
                    cursor: pointer;
                    transition: all 0.3s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                }

                .tab:hover {
                    background: #e9ecef;
                }

                .tab.active {
                    background: #0056b3;
                    color: white;
                }

                .tab-content {
                    background: white;
                    padding: 2rem;
                    border-radius: 0 0 10px 10px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                }

                .task-form {
                    max-width: 800px;
                }

                .form-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                }

                .form-group {
                    margin-bottom: 1rem;
                }

                .full-width {
                    grid-column: 1 / -1;
                }

                .form-group label {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-weight: 500;
                    color: #333;
                }

                .form-group input,
                .form-group select,
                .form-group textarea {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    font-size: 1rem;
                }

                .form-group textarea {
                    resize: vertical;
                }

                .tasks-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                    gap: 1.5rem;
                }

                .task-card {
                    background: #f8f9fa;
                    border-radius: 10px;
                    padding: 1.5rem;
                    border: 1px solid #e9ecef;
                    transition: transform 0.3s, box-shadow 0.3s;
                }

                .task-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                }

                .task-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 1rem;
                }

                .task-header h3 {
                    margin: 0;
                    color: #0056b3;
                    flex: 1;
                }

                .task-type {
                    color: white;
                    padding: 0.25rem 0.75rem;
                    border-radius: 15px;
                    font-size: 0.8rem;
                    font-weight: 500;
                }

                .task-description {
                    color: #666;
                    margin-bottom: 1rem;
                    line-height: 1.5;
                }

                .task-meta {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 0.5rem;
                    margin-bottom: 1rem;
                    font-size: 0.9rem;
                }

                .meta-item {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: #666;
                }

                .meta-item i {
                    color: #0056b3;
                    width: 16px;
                }

                .task-actions {
                    display: flex;
                    gap: 0.5rem;
                }

                .btn {
                    padding: 0.5rem 1rem;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    text-decoration: none;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-weight: 500;
                    transition: all 0.3s;
                    font-size: 0.9rem;
                }

                .btn-sm {
                    padding: 0.375rem 0.75rem;
                    font-size: 0.8rem;
                }

                .btn-primary {
                    background: #0056b3;
                    color: white;
                }

                .btn-primary:hover {
                    background: #004494;
                }

                .btn-outline {
                    background: transparent;
                    color: #0056b3;
                    border: 1px solid #0056b3;
                }

                .btn-outline:hover {
                    background: #0056b3;
                    color: white;
                }

                .empty-state {
                    text-align: center;
                    padding: 3rem;
                    color: #666;
                }

                .empty-state i {
                    font-size: 4rem;
                    color: #ddd;
                    margin-bottom: 1rem;
                }

                .empty-state h3 {
                    margin-bottom: 0.5rem;
                    color: #333;
                }

                .empty-state p {
                    margin-bottom: 2rem;
                }

                .submissions-filters {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 2rem;
                }

                .filter-select {
                    padding: 0.5rem;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    background: white;
                }

                .text-center {
                    text-align: center;
                    color: #666;
                    padding: 2rem;
                }

                @media (max-width: 768px) {
                    .form-grid {
                        grid-template-columns: 1fr;
                    }

                    .tabs {
                        flex-direction: column;
                    }

                    .tasks-grid {
                        grid-template-columns: 1fr;
                    }

                    .task-meta {
                        grid-template-columns: 1fr;
                    }

                    .task-actions {
                        flex-direction: column;
                    }

                    .submissions-filters {
                        flex-direction: column;
                    }
                }
            `}</style>
        </Layout>
    );
};

export const getServerSideProps = withAuth(async (context) => {
    const { user } = context;

    if (user.role !== 'teacher') {
        return {
            redirect: {
                destination: '/dashboard',
                permanent: false
            }
        };
    }

    try {
        // Get teacher's courses
        const coursesResult = await pool.query(
            'SELECT id, name FROM courses WHERE created_by = $1 AND status = $2',
            [user.id, 'active']
        );

        // Get teacher's tasks with submission counts
        const tasksResult = await pool.query(`
            SELECT 
                t.*,
                c.name as course_name,
                COUNT(ts.id) as submission_count
            FROM tasks t
            LEFT JOIN courses c ON c.created_by = t.created_by
            LEFT JOIN task_submissions ts ON t.id = ts.task_id
            WHERE t.created_by = $1
            GROUP BY t.id, c.name
            ORDER BY t.created_at DESC
        `, [user.id]);

        return {
            props: {
                user,
                courses: JSON.parse(JSON.stringify(coursesResult.rows)),
                tasks: JSON.parse(JSON.stringify(tasksResult.rows))
            }
        };
    } catch (err) {
        console.error('Error fetching teacher tasks data:', err);
        return {
            props: {
                user,
                courses: [],
                tasks: []
            }
        };
    }
});

export default TeacherTasksPage;