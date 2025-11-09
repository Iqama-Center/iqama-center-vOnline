import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { withAuth } from '../../lib/withAuth';
import Layout from '../../components/Layout';
import pool from '../../lib/db';
import { safeSerialize } from '../../lib/serializer';

const StudentTasksPage = ({ user, tasks }) => {
    const [activeTab, setActiveTab] = useState('pending');
    const [submissionForm, setSubmissionForm] = useState({
        taskId: null,
        content: '',
        notes: '' // This field is not in the submissions table, it will be ignored for now.
    });
    const [showSubmissionModal, setShowSubmissionModal] = useState(false);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);

    const taskTypes = {
        homework: 'واجب منزلي',
        exam: 'امتحان',
        reading: 'قراءة',
        daily_wird: 'ورد يومي',
        review: 'مراجعة'
    };

    const filterTasks = (status) => {
        return tasks.filter(task => {
            if (status === 'pending') {
                return !task.submission_id && new Date(task.due_date) > new Date();
            }
            if (status === 'submitted') {
                return task.submission_id && task.score === null;
            }
            if (status === 'graded') {
                return task.submission_id && task.score !== null;
            }
            if (status === 'overdue') {
                return !task.submission_id && new Date(task.due_date) < new Date();
            }
            return true;
        });
    };

    const handleSubmissionSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsError(false);

        if (!submissionForm.taskId) return;

        try {
            // The API path should be dynamic based on the task ID.
            const response = await fetch(`/api/tasks/${submissionForm.taskId}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: submissionForm.content,
                })
            });

            const result = await response.json();
            setMessage(result.message);
            setIsError(!response.ok);

            if (response.ok) {
                setShowSubmissionModal(false);
                setSubmissionForm({ taskId: null, content: '', notes: '' });
                setTimeout(() => window.location.reload(), 1500);
            }
        } catch (err) {
            setMessage('حدث خطأ في الاتصال بالخادم');
            setIsError(true);
        }
    };

    const openSubmissionModal = (taskId) => {
        setSubmissionForm({ ...submissionForm, taskId });
        setShowSubmissionModal(true);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'غير محدد';
        return new Date(dateString).toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getTaskStatusColor = (task) => {
        if (task.submission_id && task.score !== null) return '#28a745'; // Graded
        if (task.submission_id) return '#17a2b8'; // Submitted
        if (task.due_date && new Date(task.due_date) < new Date()) return '#dc3545'; // Overdue
        
        const now = new Date();
        const due = new Date(task.due_date);
        const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 1) return '#ffc107'; // Due soon
        return '#6c757d'; // Pending
    };

    const getTaskStatus = (task) => {
        if (task.submission_id && task.score !== null) return 'مُقيم';
        if (task.submission_id) return 'مُقدم';
        if (task.due_date && new Date(task.due_date) < new Date()) return 'متأخر';
        return 'في الانتظار';
    };

    const pendingTasks = filterTasks('pending');
    const submittedTasks = filterTasks('submitted');
    const gradedTasks = filterTasks('graded');
    const overdueTasks = filterTasks('overdue');

    return (
        <Layout user={user}>
            <Head>
                <title>مهامي - مركز إقامة الكتاب</title>
            </Head>

            <div className="tasks-container">
                <h1>مهامي والواجبات</h1>

                {message && (
                    <div className={`message ${isError ? 'error' : 'success'}`}>
                        {message}
                    </div>
                )}

                <div className="stats-grid">
                    <div className="stat-card pending">
                        <div className="stat-icon"><i className="fas fa-clock"></i></div>
                        <div className="stat-info">
                            <h3>{pendingTasks.length}</h3>
                            <p>مهام في الانتظار</p>
                        </div>
                    </div>
                    <div className="stat-card submitted">
                        <div className="stat-icon"><i className="fas fa-paper-plane"></i></div>
                        <div className="stat-info">
                            <h3>{submittedTasks.length}</h3>
                            <p>مهام مُقدمة</p>
                        </div>
                    </div>
                    <div className="stat-card graded">
                        <div className="stat-icon"><i className="fas fa-check-circle"></i></div>
                        <div className="stat-info">
                            <h3>{gradedTasks.length}</h3>
                            <p>مهام مُقيمة</p>
                        </div>
                    </div>
                    <div className="stat-card overdue">
                        <div className="stat-icon"><i className="fas fa-exclamation-triangle"></i></div>
                        <div className="stat-info">
                            <h3>{overdueTasks.length}</h3>
                            <p>مهام متأخرة</p>
                        </div>
                    </div>
                </div>

                <div className="tabs">
                    <button className={`tab ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}><i className="fas fa-clock"></i> في الانتظار ({pendingTasks.length})</button>
                    <button className={`tab ${activeTab === 'submitted' ? 'active' : ''}`} onClick={() => setActiveTab('submitted')}><i className="fas fa-paper-plane"></i> مُقدمة ({submittedTasks.length})</button>
                    <button className={`tab ${activeTab === 'graded' ? 'active' : ''}`} onClick={() => setActiveTab('graded')}><i className="fas fa-check-circle"></i> مُقيمة ({gradedTasks.length})</button>
                    <button className={`tab ${activeTab === 'overdue' ? 'active' : ''}`} onClick={() => setActiveTab('overdue')}><i className="fas fa-exclamation-triangle"></i> متأخرة ({overdueTasks.length})</button>
                </div>

                <div className="tab-content">
                    <div className="tasks-grid">
                        {filterTasks(activeTab).map(task => (
                            <div key={task.id} className="task-card">
                                <div className="task-header">
                                    <h3>{task.title}</h3>
                                    <span className="task-status" style={{ backgroundColor: getTaskStatusColor(task) }}>{getTaskStatus(task)}</span>
                                </div>
                                <div className="task-type"><i className="fas fa-tag"></i>{taskTypes[task.task_type] || task.task_type}</div>
                                <p className="task-description">{task.description}</p>
                                <div className="task-meta">
                                    <div className="meta-item"><i className="fas fa-book"></i><span>{task.course_name}</span></div>
                                    <div className="meta-item"><i className="fas fa-calendar"></i><span>التسليم: {formatDate(task.due_date)}</span></div>
                                    <div className="meta-item"><i className="fas fa-star"></i><span>{task.max_score} درجة</span></div>
                                    {task.score !== null && (
                                        <div className="meta-item score"><i className="fas fa-trophy"></i><span>درجتك: {task.score}/{task.max_score}</span></div>
                                    )}
                                </div>
                                {task.instructions && (
                                    <div className="task-instructions"><strong>تعليمات إضافية:</strong><p>{task.instructions}</p></div>
                                )}
                                <div className="task-actions">
                                    {!task.submission_id && task.due_date && new Date(task.due_date) > new Date() && (
                                        <button className="btn btn-primary" onClick={() => openSubmissionModal(task.id)}><i className="fas fa-upload"></i> تقديم المهمة</button>
                                    )}
                                    {task.submission_id && (
                                        <Link href={`/student/submission/${task.submission_id}`} passHref><a className="btn btn-outline"><i className="fas fa-eye"></i> عرض التقديم</a></Link>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    {filterTasks(activeTab).length === 0 && (
                        <div className="empty-state"><i className="fas fa-tasks"></i><h3>لا توجد مهام</h3><p>{`لا توجد مهام في حالة '${activeTab}'`}</p></div>
                    )}
                </div>
            </div>

            {showSubmissionModal && (
                <div className="modal">
                    <div className="modal-content">
                        <div className="modal-header"><h3>تقديم المهمة</h3><button className="close-btn" onClick={() => setShowSubmissionModal(false)}><i className="fas fa-times"></i></button></div>
                        <form onSubmit={handleSubmissionSubmit}>
                            <div className="form-group"><label htmlFor="content">محتوى التقديم *</label><textarea id="content" value={submissionForm.content} onChange={(e) => setSubmissionForm({...submissionForm, content: e.target.value})} rows="8" required placeholder="اكتب إجابتك أو حلك للمهمة هنا..."></textarea></div>
                            <div className="modal-actions"><button type="button" className="btn btn-outline" onClick={() => setShowSubmissionModal(false)}>إلغاء</button><button type="submit" className="btn btn-primary"><i className="fas fa-paper-plane"></i> تقديم المهمة</button></div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
                /* Styles remain the same, but can be reviewed for consistency if needed */
                .tasks-container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
                .message { padding: 1rem; border-radius: 5px; margin-bottom: 2rem; text-align: center; }
                .message.success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
                .message.error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
                .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
                .stat-card { background: white; padding: 1.5rem; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 1rem; }
                .stat-icon { width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: white; }
                .stat-card.pending .stat-icon { background: #6c757d; }
                .stat-card.submitted .stat-icon { background: #17a2b8; }
                .stat-card.graded .stat-icon { background: #28a745; }
                .stat-card.overdue .stat-icon { background: #dc3545; }
                .stat-info h3 { margin: 0 0 0.5rem 0; font-size: 2rem; color: #333; }
                .stat-info p { margin: 0; color: #666; font-size: 0.9rem; }
                .tabs { display: flex; background: white; border-radius: 10px 10px 0 0; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 0; }
                .tab { flex: 1; padding: 1rem; border: none; background: #f8f9fa; cursor: pointer; transition: all 0.3s; display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-size: 0.9rem; }
                .tab:hover { background: #e9ecef; }
                .tab.active { background: #0056b3; color: white; }
                .tab-content { background: white; padding: 2rem; border-radius: 0 0 10px 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
                .tasks-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 1.5rem; }
                .task-card { background: #f8f9fa; border-radius: 10px; padding: 1.5rem; border: 1px solid #e9ecef; transition: transform 0.3s, box-shadow 0.3s; }
                .task-card:hover { transform: translateY(-2px); box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
                .task-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; }
                .task-header h3 { margin: 0; color: #0056b3; flex: 1; }
                .task-status { color: white; padding: 0.25rem 0.75rem; border-radius: 15px; font-size: 0.8rem; font-weight: 500; }
                .task-type { display: flex; align-items: center; gap: 0.5rem; color: #666; font-size: 0.9rem; margin-bottom: 1rem; }
                .task-description { color: #666; margin-bottom: 1rem; line-height: 1.5; }
                .task-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 1rem; font-size: 0.9rem; }
                .meta-item { display: flex; align-items: center; gap: 0.5rem; color: #666; }
                .meta-item.score { color: #28a745; font-weight: 500; }
                .meta-item i { color: #0056b3; width: 16px; }
                .task-instructions { background: #e3f2fd; padding: 1rem; border-radius: 5px; margin-bottom: 1rem; border-left: 4px solid #2196f3; }
                .task-instructions strong { color: #1976d2; }
                .task-instructions p { margin: 0.5rem 0 0 0; color: #333; }
                .task-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 1rem; }
                .btn { padding: 0.5rem 1rem; border: none; border-radius: 5px; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 0.5rem; font-weight: 500; transition: all 0.3s; font-size: 0.9rem; }
                .btn-primary { background: #0056b3; color: white; }
                .btn-primary:hover { background: #004494; }
                .btn-outline { background: transparent; color: #0056b3; border: 1px solid #0056b3; }
                .btn-outline:hover { background: #0056b3; color: white; }
                .empty-state { text-align: center; padding: 3rem; color: #666; }
                .empty-state i { font-size: 4rem; color: #ddd; margin-bottom: 1rem; }
                .empty-state h3 { margin-bottom: 0.5rem; color: #333; }
                .modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
                .modal-content { background: white; border-radius: 10px; width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto; }
                .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; border-bottom: 1px solid #e9ecef; }
                .modal-header h3 { margin: 0; color: #0056b3; }
                .close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #666; }
                .modal form { padding: 1.5rem; }
                .form-group { margin-bottom: 1.5rem; }
                .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
                .form-group textarea { width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 5px; font-size: 1rem; resize: vertical; }
                .modal-actions { display: flex; gap: 1rem; justify-content: flex-end; padding: 1.5rem; border-top: 1px solid #e9ecef; }
            `}</style>
        </Layout>
    );
};

export const getServerSideProps = withAuth(async (context) => {
    const { user } = context;

    if (user.role !== 'student') {
        return { redirect: { destination: '/dashboard', permanent: false } };
    }

    try {
        const tasksResult = await pool.query(`
            SELECT 
                t.*,
                c.name as course_name,
                s.id as submission_id,
                s.content as submission_content,
                s.grade as score, -- Aliasing grade to score for frontend compatibility
                s.feedback,
                s.submitted_at
            FROM tasks t
            JOIN course_schedule cs ON t.schedule_id = cs.id
            JOIN courses c ON cs.course_id = c.id
            JOIN enrollments e ON c.id = e.course_id
            LEFT JOIN submissions s ON t.id = s.task_id AND s.user_id = $1
            WHERE e.user_id = $1 AND e.status = 'active'
            ORDER BY t.due_date ASC
        `, [user.id]);

        return {
            props: {
                user,
                tasks: safeSerialize(tasksResult.rows)
            }
        };
    } catch (err) {
        console.error('Error fetching student tasks:', err);
        return {
            props: {
                user,
                tasks: []
            }
        };
    }
});

export default StudentTasksPage;