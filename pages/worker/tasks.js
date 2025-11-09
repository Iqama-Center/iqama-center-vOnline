
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { withAuth } from '../../lib/withAuth';
import pool from '../../lib/db';

const WorkerTasksPage = ({ user, initialTasks, initialFilters }) => {
    const router = useRouter();
    const [filteredTasks, setFilteredTasks] = useState(initialTasks);
    const [filters, setFilters] = useState(initialFilters);

    // Update URL when filters change
    useEffect(() => {
        const query = {};
        if (filters.status !== 'all') query.status = filters.status;
        if (filters.priority !== 'all') query.priority = filters.priority;
        if (filters.search) query.search = filters.search;

        router.push({
            pathname: '/worker/tasks',
            query: query,
        }, undefined, { shallow: true });
    }, [filters, router]);

    const updateTaskStatus = async (taskId, newStatus) => {
        try {
            const response = await fetch(`/api/worker/tasks/${taskId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                // Refresh the data from the server to ensure consistency
                router.replace(router.asPath);
            } else {
                const errorData = await response.json();
                console.error('Failed to update task:', errorData.message);
                // Optionally show an error to the user
            }
        } catch (error) {
            console.error('Error updating task:', error);
        }
    };

    const getPriorityColor = (priority) => {
        const colors = { 'urgent': '#dc3545', 'high': '#fd7e14', 'medium': '#ffc107', 'low': '#28a745' };
        return colors[priority] || '#6c757d';
    };

    const getStatusColor = (status) => {
        const colors = { 'pending': '#6c757d', 'in_progress': '#17a2b8', 'completed': '#28a745', 'overdue': '#dc3545' };
        return colors[status] || '#6c757d';
    };

    const getStatusText = (status) => {
        const statusTexts = { 'pending': 'معلقة', 'in_progress': 'قيد التنفيذ', 'completed': 'مكتملة', 'overdue': 'متأخرة' };
        return statusTexts[status] || status;
    };

    const getPriorityText = (priority) => {
        const priorityTexts = { 'urgent': 'عاجل', 'high': 'عالية', 'medium': 'متوسطة', 'low': 'منخفضة' };
        return priorityTexts[priority] || priority;
    };

    return (
        <Layout user={user}>
            <style jsx>{`
                /* Styles are unchanged */
                .tasks-container { padding: 20px; }
                .page-header { background: linear-gradient(135deg, #6f42c1 0%, #007bff 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; }
                .page-header h1 { margin: 0 0 10px 0; font-size: 2rem; }
                .filters-section { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 20px; }
                .filters-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; align-items: end; }
                .filter-group { display: flex; flex-direction: column; }
                .filter-group label { margin-bottom: 5px; font-weight: 500; color: #333; }
                .filter-group select, .filter-group input { padding: 8px 12px; border: 1px solid #ddd; border-radius: 5px; font-size: 1rem; }
                .tasks-grid { display: grid; gap: 20px; }
                .task-card { background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-left: 4px solid #6f42c1; transition: transform 0.2s ease, box-shadow 0.2s ease; }
                .task-card:hover { transform: translateY(-2px); box-shadow: 0 4px 15px rgba(0,0,0,0.15); }
                .task-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; }
                .task-title { font-size: 1.2rem; font-weight: bold; color: #333; margin: 0; }
                .task-badges { display: flex; gap: 8px; }
                .task-badge { padding: 4px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: bold; color: white; }
                .task-description { color: #666; line-height: 1.5; margin-bottom: 15px; }
                .task-meta { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-bottom: 15px; font-size: 0.9rem; color: #666; }
                .task-meta-item { display: flex; align-items: center; gap: 5px; }
                .task-actions { display: flex; gap: 10px; flex-wrap: wrap; }
                .btn { padding: 8px 15px; border: none; border-radius: 5px; cursor: pointer; font-size: 0.9rem; transition: background-color 0.3s ease; }
                .btn-primary { background: #007bff; color: white; }
                .btn-success { background: #28a745; color: white; }
                .btn-secondary { background: #6c757d; color: white; }
                .empty-state { text-align: center; padding: 60px 20px; color: #666; }
                .empty-state i { font-size: 4rem; color: #ddd; margin-bottom: 20px; }
                .stats-bar { display: flex; gap: 20px; margin-bottom: 20px; flex-wrap: wrap; }
                .stat-item { background: white; padding: 15px 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); text-align: center; flex-grow: 1; }
                .stat-number { font-size: 1.5rem; font-weight: bold; color: #6f42c1; }
                .stat-label { font-size: 0.9rem; color: #666; margin-top: 5px; }
            `}</style>

            <div className="tasks-container">
                <div className="page-header">
                    <h1><i className="fas fa-tasks fa-fw"></i> مهامي</h1>
                    <p>إدارة ومتابعة جميع المهام المكلف بها</p>
                </div>

                <div className="filters-section">
                    <div className="filters-grid">
                        <div className="filter-group">
                            <label>الحالة</label>
                            <select value={filters.status} onChange={(e) => setFilters(prev => ({...prev, status: e.target.value}))}>
                                <option value="all">جميع الحالات</option>
                                <option value="pending">معلقة</option>
                                <option value="in_progress">قيد التنفيذ</option>
                                <option value="completed">مكتملة</option>
                                <option value="overdue">متأخرة</option>
                            </select>
                        </div>
                        <div className="filter-group">
                            <label>الأولوية</label>
                            <select value={filters.priority} onChange={(e) => setFilters(prev => ({...prev, priority: e.target.value}))}>
                                <option value="all">جميع الأولويات</option>
                                <option value="urgent">عاجل</option>
                                <option value="high">عالية</option>
                                <option value="medium">متوسطة</option>
                                <option value="low">منخفضة</option>
                            </select>
                        </div>
                        <div className="filter-group">
                            <label>البحث</label>
                            <input type="text" placeholder="ابحث في المهام..." value={filters.search} onChange={(e) => setFilters(prev => ({...prev, search: e.target.value}))} />
                        </div>
                    </div>
                </div>

                {filteredTasks.length === 0 ? (
                    <div className="empty-state">
                        <i className="fas fa-clipboard-check"></i>
                        <h3>لا توجد مهام</h3>
                        <p>لا توجد مهام تطابق المعايير المحددة</p>
                    </div>
                ) : (
                    <div className="tasks-grid">
                        {filteredTasks.map(task => (
                            <div key={task.id} className="task-card" style={{ borderLeftColor: getPriorityColor(task.priority) }}>
                                <div className="task-header">
                                    <h3 className="task-title">{task.title}</h3>
                                    <div className="task-badges">
                                        <span className="task-badge" style={{ backgroundColor: getPriorityColor(task.priority) }}>{getPriorityText(task.priority)}</span>
                                        <span className="task-badge" style={{ backgroundColor: getStatusColor(task.status) }}>{getStatusText(task.status)}</span>
                                    </div>
                                </div>
                                <p className="task-description">{task.description}</p>
                                <div className="task-meta">
                                    <div className="task-meta-item"><i className="fas fa-calendar"></i><span>الاستحقاق: {new Date(task.due_date).toLocaleDateString('ar-EG')}</span></div>
                                    <div className="task-meta-item"><i className="fas fa-user"></i><span>المشرف: {task.supervisor_name || 'غير محدد'}</span></div>
                                    <div className="task-meta-item"><i className="fas fa-clock"></i><span>المدة المقدرة: {task.estimated_hours || '-'} ساعة</span></div>
                                    <div className="task-meta-item"><i className="fas fa-building"></i><span>القسم: {task.department || '-'}</span></div>
                                </div>
                                <div className="task-actions">
                                    {task.status === 'pending' && <button className="btn btn-primary" onClick={() => updateTaskStatus(task.id, 'in_progress')}><i className="fas fa-play"></i> بدء العمل</button>}
                                    {task.status === 'in_progress' && <button className="btn btn-success" onClick={() => updateTaskStatus(task.id, 'completed')}><i className="fas fa-check"></i> إنهاء المهمة</button>}
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
    const { status = 'all', priority = 'all', search = '' } = context.query;

    if (user.role !== 'worker') {
        return { redirect: { destination: '/dashboard', permanent: false } };
    }

    try {
        let query = `
            SELECT 
                wt.*,
                u.full_name as supervisor_name
            FROM worker_tasks wt
            LEFT JOIN users u ON wt.assigned_by = u.id
            WHERE wt.assigned_to = $1
        `;
        
        const params = [user.id];
        let paramIndex = 2;

        if (status && status !== 'all') {
            if (status === 'overdue') {
                query += ` AND wt.status != 'completed' AND wt.due_date < CURRENT_TIMESTAMP`;
            } else {
                query += ` AND wt.status = $${paramIndex++}`;
                params.push(status);
            }
        }

        if (priority && priority !== 'all') {
            query += ` AND wt.priority = $${paramIndex++}`;
            params.push(priority);
        }

        if (search) {
            const searchTerm = `%${search}%`;
            query += ` AND (wt.title ILIKE $${paramIndex} OR wt.description ILIKE $${paramIndex})`;
            params.push(searchTerm);
        }

        query += ` ORDER BY CASE wt.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 END, wt.due_date ASC `;

        const result = await pool.query(query, params);

        return {
            props: {
                user: JSON.parse(JSON.stringify(user)),
                initialTasks: JSON.parse(JSON.stringify(result.rows)),
                initialFilters: { status, priority, search },
            },
        };
    } catch (error) {
        console.error("Error in getServerSideProps for worker tasks:", error);
        return {
            props: {
                user: JSON.parse(JSON.stringify(user)),
                initialTasks: [],
                initialFilters: { status, priority, search },
                error: 'Failed to load tasks.'
            }
        };
    }
}, { roles: ['worker'] });

export default WorkerTasksPage;
