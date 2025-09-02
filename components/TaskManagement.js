import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const TaskManagement = ({ userRole, userId, courseId = null }) => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [submissionContent, setSubmissionContent] = useState({});
    const [submitting, setSubmitting] = useState({});
    const router = useRouter();

    useEffect(() => {
        if (userId) {
            fetchTasks();
        }
    }, [filter, courseId, userId]);

    const fetchTasks = async () => {
        if (!userId) return;
        
        try {
            setLoading(true);
            const url = courseId 
                ? `/api/tasks?courseId=${courseId}&filter=${filter}`
                : `/api/tasks?filter=${filter}`;
            
            const response = await fetch(url);
            
            if (response.ok) {
                const data = await response.json();
                setTasks(data.tasks || []);
            } else {
                // Silently handle API errors to prevent breaking the UI
                console.warn('Failed to fetch tasks:', response.status);
                setTasks([]);
            }
        } catch (error) {
            // Silently handle network errors
            console.warn('Error fetching tasks:', error.message);
            setTasks([]);
        } finally {
            setLoading(false);
        }
    };

    const submitTask = async (taskId) => {
        if (!submissionContent[taskId]?.trim()) {
            alert('يرجى إدخال محتوى التسليم');
            return;
        }

        try {
            setSubmitting(prev => ({ ...prev, [taskId]: true }));
            
            const response = await fetch('/api/tasks/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    taskId,
                    submission_content: submissionContent[taskId],
                    submission_type: 'text'
                }),
            });

            const data = await response.json();
            
            if (response.ok) {
                alert(data.message);
                setSubmissionContent(prev => ({ ...prev, [taskId]: '' }));
                fetchTasks(); // Refresh tasks
            } else {
                alert(data.message || 'حدث خطأ في التسليم');
            }
        } catch (error) {
            console.error('Error submitting task:', error);
            alert('حدث خطأ في التسليم');
        } finally {
            setSubmitting(prev => ({ ...prev, [taskId]: false }));
        }
    };

    const getTaskStatusColor = (task) => {
        const now = new Date();
        const dueDate = new Date(task.due_date);
        
        if (task.status === 'completed') return 'bg-green-100 border-green-500';
        if (task.status === 'expired' || task.status === 'overdue') return 'bg-red-100 border-red-500';
        if (now > dueDate) return 'bg-orange-100 border-orange-500';
        if (!task.is_active) return 'bg-gray-100 border-gray-500';
        
        // Check if it's a daily task and close to expiry
        if (['daily_reading', 'daily_quiz'].includes(task.task_type)) {
            const hoursLeft = (dueDate - now) / (1000 * 60 * 60);
            if (hoursLeft <= 6) return 'bg-yellow-100 border-yellow-500';
        }
        
        return 'bg-blue-100 border-blue-500';
    };

    const getTaskTypeLabel = (taskType) => {
        const labels = {
            'daily_reading': 'قراءة يومية',
            'daily_quiz': 'اختبار يومي',
            'daily_evaluation': 'تقييم يومي',
            'daily_monitoring': 'مراقبة يومية',
            'homework': 'واجب منزلي',
            'exam': 'امتحان',
            'preparation': 'تحضير',
            'weekly_report': 'تقرير أسبوعي',
            'weekly_evaluation': 'تقييم أسبوعي'
        };
        return labels[taskType] || taskType;
    };

    const getTimeRemaining = (dueDate) => {
        const now = new Date();
        const due = new Date(dueDate);
        const diff = due - now;
        
        if (diff <= 0) return 'منتهي الصلاحية';
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours < 24) {
            return `${hours} ساعة و ${minutes} دقيقة`;
        } else {
            const days = Math.floor(hours / 24);
            return `${days} يوم`;
        }
    };

    const filteredTasks = tasks.filter(task => {
        switch (filter) {
            case 'active':
                return task.is_active && task.status !== 'completed';
            case 'completed':
                return task.status === 'completed';
            case 'overdue':
                return ['expired', 'overdue'].includes(task.status) || 
                       (task.is_active && new Date() > new Date(task.due_date));
            case 'daily':
                return ['daily_reading', 'daily_quiz', 'daily_evaluation', 'daily_monitoring'].includes(task.task_type);
            case 'fixed':
                return ['homework', 'exam', 'weekly_report', 'weekly_evaluation', 'preparation'].includes(task.task_type);
            default:
                return true;
        }
    });

    if (loading) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">إدارة المهام</h2>
                
                {/* Filter buttons */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {[
                        { key: 'all', label: 'جميع المهام' },
                        { key: 'active', label: 'المهام النشطة' },
                        { key: 'completed', label: 'المهام المكتملة' },
                        { key: 'overdue', label: 'المهام المتأخرة' },
                        { key: 'daily', label: 'المهام اليومية' },
                        { key: 'fixed', label: 'المهام الثابتة' }
                    ].map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setFilter(key)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                filter === key
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tasks grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredTasks.map(task => (
                    <div
                        key={task.id}
                        className={`border-2 rounded-lg p-4 ${getTaskStatusColor(task)}`}
                    >
                        <div className="flex justify-between items-start mb-3">
                            <h3 className="font-semibold text-gray-800 text-sm">{task.title}</h3>
                            <span className="text-xs bg-white px-2 py-1 rounded-full">
                                {getTaskTypeLabel(task.task_type)}
                            </span>
                        </div>

                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {task.description}
                        </p>

                        <div className="space-y-2 text-xs text-gray-500">
                            <div>
                                <strong>الموعد النهائي:</strong> {new Date(task.due_date).toLocaleString('ar-SA')}
                            </div>
                            <div>
                                <strong>الوقت المتبقي:</strong> {getTimeRemaining(task.due_date)}
                            </div>
                            <div>
                                <strong>النقاط:</strong> {task.max_score}
                            </div>
                            {task.instructions && (
                                <div>
                                    <strong>التعليمات:</strong> {task.instructions}
                                </div>
                            )}
                        </div>

                        {/* Task submission for students */}
                        {userRole === 'student' && task.is_active && task.status !== 'completed' && (
                            <div className="mt-4 space-y-2">
                                <textarea
                                    value={submissionContent[task.id] || ''}
                                    onChange={(e) => setSubmissionContent(prev => ({
                                        ...prev,
                                        [task.id]: e.target.value
                                    }))}
                                    placeholder="اكتب تسليم المهمة هنا..."
                                    className="w-full p-2 border rounded-md text-sm"
                                    rows="3"
                                />
                                <button
                                    onClick={() => submitTask(task.id)}
                                    disabled={submitting[task.id]}
                                    className="w-full bg-blue-500 text-white py-2 px-4 rounded-md text-sm hover:bg-blue-600 disabled:opacity-50"
                                >
                                    {submitting[task.id] ? 'جاري التسليم...' : 'تسليم المهمة'}
                                </button>
                            </div>
                        )}

                        {/* Task status for completed tasks */}
                        {task.status === 'completed' && (
                            <div className="mt-4 p-2 bg-green-50 border border-green-200 rounded-md">
                                <p className="text-green-700 text-sm font-medium">✓ تم إكمال المهمة</p>
                            </div>
                        )}

                        {/* Task status for overdue tasks */}
                        {(['expired', 'overdue'].includes(task.status) || 
                          (task.is_active && new Date() > new Date(task.due_date))) && (
                            <div className="mt-4 p-2 bg-red-50 border border-red-200 rounded-md">
                                <p className="text-red-700 text-sm font-medium">⚠ مهمة متأخرة</p>
                            </div>
                        )}

                        {/* Inactive task status */}
                        {!task.is_active && task.status !== 'completed' && (
                            <div className="mt-4 p-2 bg-gray-50 border border-gray-200 rounded-md">
                                <p className="text-gray-700 text-sm font-medium">⏳ في انتظار التفعيل</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {filteredTasks.length === 0 && (
                <div className="text-center py-8">
                    <p className="text-gray-500">لا توجد مهام متاحة حالياً</p>
                </div>
            )}
        </div>
    );
};

export default TaskManagement;