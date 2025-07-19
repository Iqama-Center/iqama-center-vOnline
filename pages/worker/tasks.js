import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import { withAuth } from '../../lib/withAuth';

const WorkerTasksPage = ({ user }) => {
    const [tasks, setTasks] = useState([]);
    const [filteredTasks, setFilteredTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: 'all',
        priority: 'all',
        search: ''
    });
    const [selectedTask, setSelectedTask] = useState(null);
    const [showTaskModal, setShowTaskModal] = useState(false);

    useEffect(() => {
        loadTasks();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [tasks, filters, applyFilters]);

    const loadTasks = async () => {
        try {
            const response = await fetch('/api/worker/tasks');
            if (response.ok) {
                const data = await response.json();
                setTasks(data);
            }
        } catch (error) {
            console.error('Error loading tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = useCallback(() => {
        let filtered = tasks;

        if (filters.status !== 'all') {
            filtered = filtered.filter(task => task.status === filters.status);
        }

        if (filters.priority !== 'all') {
            filtered = filtered.filter(task => task.priority === filters.priority);
        }

        if (filters.search) {
            filtered = filtered.filter(task => 
                task.title.toLowerCase().includes(filters.search.toLowerCase()) ||
                task.description.toLowerCase().includes(filters.search.toLowerCase())
            );
        }

        setFilteredTasks(filtered);
    }, [tasks, filters]);

    const updateTaskStatus = async (taskId, newStatus) => {
        try {
            const response = await fetch(`/api/worker/tasks/${taskId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                setTasks(prev => prev.map(task => 
                    task.id === taskId ? { ...task, status: newStatus } : task
                ));
            }
        } catch (error) {
            console.error('Error updating task:', error);
        }
    };

    const getPriorityColor = (priority) => {
        const colors = {
            'urgent': '#dc3545',
            'high': '#fd7e14',
            'medium': '#ffc107',
            'low': '#28a745'
        };
        return colors[priority] || '#6c757d';
    };

    const getStatusColor = (status) => {
        const colors = {
            'pending': '#ffc107',
            'in_progress': '#17a2b8',
            'completed': '#28a745',
            'waiting_start': '#ffc107',
            'overdue': '#dc3545'
        };
        return colors[status] || '#6c757d';
    };

    const getStatusText = (status) => {
        const statusTexts = {
            'pending': 'معلقة',
            'in_progress': 'قيد التنفيذ',
            'completed': 'مكتملة',
            'waiting_start': 'في انتظار البدء',
            'overdue': 'متأخرة'
        };
        return statusTexts[status] || status;
    };

    const getPriorityText = (priority) => {
        const priorityTexts = {
            'urgent': 'عاجل',
            'high': 'عالية',
            'medium': 'متوسطة',
            'low': 'منخفضة'
        };
        return priorityTexts[priority] || priority;
    };

    return (
        <Layout user={user}>
            <style jsx>{`
                .tasks-container {
                    padding: 20px;
                }
                .page-header {
                    background: linear-gradient(135deg, #6f42c1 0%, #007bff 100%);
                    color: white;
                    padding: 30px;
                    border-radius: 12px;
                    margin-bottom: 30px;
                }
                .page-header h1 {
                    margin: 0 0 10px 0;
                    font-size: 2rem;
                }
                .filters-section {
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    margin-bottom: 20px;
                }
                .filters-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    align-items: end;
                }
                .filter-group {
                    display: flex;
                    flex-direction: column;
                }
                .filter-group label {
                    margin-bottom: 5px;
                    font-weight: 500;
                    color: #333;
                }
                .filter-group select,
                .filter-group input {
                    padding: 8px 12px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    font-size: 1rem;
                }
                .tasks-grid {
                    display: grid;
                    gap: 20px;
                }
                .task-card {
                    background: white;
                    border-radius: 8px;
                    padding: 20px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    border-left: 4px solid #6f42c1;
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }
                .task-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 15px rgba(0,0,0,0.15);
                }
                .task-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 15px;
                }
                .task-title {
                    font-size: 1.2rem;
                    font-weight: bold;
                    color: #333;
                    margin: 0;
                }
                .task-badges {
                    display: flex;
                    gap: 8px;
                }
                .task-badge {
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 0.75rem;
                    font-weight: bold;
                    color: white;
                }
                .task-description {
                    color: #666;
                    line-height: 1.5;
                    margin-bottom: 15px;
                }
                .task-meta {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 10px;
                    margin-bottom: 15px;
                    font-size: 0.9rem;
                    color: #666;
                }
                .task-meta-item {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                .task-actions {
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                }
                .btn {
                    padding: 8px 15px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 0.9rem;
                    transition: background-color 0.3s ease;
                }
                .btn-primary {
                    background: #007bff;
                    color: white;
                }
                .btn-primary:hover {
                    background: #0056b3;
                }
                .btn-success {
                    background: #28a745;
                    color: white;
                }
                .btn-success:hover {
                    background: #218838;
                }
                .btn-warning {
                    background: #ffc107;
                    color: #212529;
                }
                .btn-warning:hover {
                    background: #e0a800;
                }
                .btn-secondary {
                    background: #6c757d;
                    color: white;
                }
                .btn-secondary:hover {
                    background: #545b62;
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
                .stats-bar {
                    display: flex;
                    gap: 20px;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                }
                .stat-item {
                    background: white;
                    padding: 15px 20px;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    text-align: center;
                    min-width: 120px;
                }
                .stat-number {
                    font-size: 1.5rem;
                    font-weight: bold;
                    color: #6f42c1;
                }
                .stat-label {
                    font-size: 0.9rem;
                    color: #666;
                    margin-top: 5px;
                }
                @media (max-width: 768px) {
                    .filters-grid {
                        grid-template-columns: 1fr;
                    }
                    .task-header {
                        flex-direction: column;
                        gap: 10px;
                    }
                    .task-actions {
                        justify-content: center;
                    }
                }
            `}</style>

            <div className="tasks-container">
                <div className="page-header">
                    <h1><i className="fas fa-tasks fa-fw"></i> مهامي</h1>
                    <p>إدارة ومتابعة جميع المهام المكلف بها</p>
                </div>

                {/* Statistics Bar */}
                <div className="stats-bar">
                    <div className="stat-item">
                        <div className="stat-number">{tasks.filter(t => t.status === 'pending').length}</div>
                        <div className="stat-label">معلقة</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-number">{tasks.filter(t => t.status === 'in_progress').length}</div>
                        <div className="stat-label">قيد التنفيذ</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-number">{tasks.filter(t => t.status === 'completed').length}</div>
                        <div className="stat-label">مكتملة</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-number">{tasks.filter(t => new Date(t.due_date) < new Date() && t.status !== 'completed').length}</div>
                        <div className="stat-label">متأخرة</div>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="filters-section">
                    <div className="filters-grid">
                        <div className="filter-group">
                            <label>الحالة</label>
                            <select 
                                value={filters.status} 
                                onChange={(e) => setFilters(prev => ({...prev, status: e.target.value}))}
                            >
                                <option value="all">جميع الحالات</option>
                                <option value="pending">معلقة</option>
                                <option value="in_progress">قيد التنفيذ</option>
                                <option value="completed">مكتملة</option>
                                <option value="waiting_start">في انتظار البدء</option>
                                <option value="overdue">متأخرة</option>
                            </select>
                        </div>
                        <div className="filter-group">
                            <label>الأولوية</label>
                            <select 
                                value={filters.priority} 
                                onChange={(e) => setFilters(prev => ({...prev, priority: e.target.value}))}
                            >
                                <option value="all">جميع الأولويات</option>
                                <option value="urgent">عاجل</option>
                                <option value="high">عالية</option>
                                <option value="medium">متوسطة</option>
                                <option value="low">منخفضة</option>
                            </select>
                        </div>
                        <div className="filter-group">
                            <label>البحث</label>
                            <input 
                                type="text" 
                                placeholder="ابحث في المهام..."
                                value={filters.search}
                                onChange={(e) => setFilters(prev => ({...prev, search: e.target.value}))}
                            />
                        </div>
                    </div>
                </div>

                {/* Tasks List */}
                {loading ? (
                    <div className="loading">
                        <i className="fas fa-spinner fa-spin fa-2x"></i>
                        <p>جاري تحميل المهام...</p>
                    </div>
                ) : filteredTasks.length === 0 ? (
                    <div className="empty-state">
                        <i className="fas fa-clipboard-check"></i>
                        <h3>لا توجد مهام</h3>
                        <p>لا توجد مهام تطابق المعايير المحددة</p>
                    </div>
                ) : (
                    <div className="tasks-grid">
                        {filteredTasks.map(task => (
                            <div key={task.id} className="task-card">
                                <div className="task-header">
                                    <h3 className="task-title">{task.title}</h3>
                                    <div className="task-badges">
                                        <span 
                                            className="task-badge" 
                                            style={{ backgroundColor: getPriorityColor(task.priority) }}
                                        >
                                            {getPriorityText(task.priority)}
                                        </span>
                                        <span 
                                            className="task-badge" 
                                            style={{ backgroundColor: getStatusColor(task.status) }}
                                        >
                                            {getStatusText(task.status)}
                                        </span>
                                    </div>
                                </div>
                                
                                <p className="task-description">{task.description}</p>
                                
                                <div className="task-meta">
                                    <div className="task-meta-item">
                                        <i className="fas fa-calendar"></i>
                                        <span>الاستحقاق: {new Date(task.due_date).toLocaleDateString('ar-EG')}</span>
                                    </div>
                                    <div className="task-meta-item">
                                        <i className="fas fa-user"></i>
                                        <span>المشرف: {task.supervisor_name}</span>
                                    </div>
                                    <div className="task-meta-item">
                                        <i className="fas fa-clock"></i>
                                        <span>المدة المقدرة: {task.estimated_hours || 'غير محدد'} ساعة</span>
                                    </div>
                                    <div className="task-meta-item">
                                        <i className="fas fa-building"></i>
                                        <span>القسم: {task.department || 'غير محدد'}</span>
                                    </div>
                                </div>

                                <div className="task-actions">
                                    {task.status === 'pending' && (
                                        <button 
                                            className="btn btn-primary"
                                            onClick={() => updateTaskStatus(task.id, 'in_progress')}
                                        >
                                            <i className="fas fa-play"></i> بدء العمل
                                        </button>
                                    )}
                                    {task.status === 'in_progress' && (
                                        <button 
                                            className="btn btn-success"
                                            onClick={() => updateTaskStatus(task.id, 'completed')}
                                        >
                                            <i className="fas fa-check"></i> إنهاء المهمة
                                        </button>
                                    )}
                                    <button 
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            setSelectedTask(task);
                                            setShowTaskModal(true);
                                        }}
                                    >
                                        <i className="fas fa-eye"></i> عرض التفاصيل
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export const getServerSideProps = withAuth(async (context) => {
    const { user } = context;
    
    // Only allow workers to access this page
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

export default WorkerTasksPage;