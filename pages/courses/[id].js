import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { withAuth } from '../../lib/withAuth';
import pool from '../../lib/db';
import { safeSerialize } from '../../lib/isrUtils';

// Formatting helper for Arabic locale
const formatDateTimeAr = (value) => {
    if (!value) return '';
    const d = typeof value === 'string' ? new Date(value) : value;
    return d.toLocaleString('ar-EG', { hour12: false });
};

// Generic task item with improved UI
const TaskItem = ({ task, onUpdate }) => {
    const [submissionContent, setSubmissionContent] = useState(task.submission_content || '');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const response = await fetch(`/api/tasks/${task.id}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ submission_content: submissionContent })
            });
            const result = await response.json();
            if (response.ok) {
                setMessage('تم التقديم بنجاح!');
                onUpdate(task.id, { submission_content: submissionContent, status: 'submitted' });
            } else {
                setMessage(result.message || 'حدث خطأ ما.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const status = (task.status || '').toLowerCase();

    return (
        <div className="task-card">
            <div className="task-card__header">
                <h4 className="task-title">{task.title}</h4>
                {status && (
                    <span className={`badge ${
                        status === 'pending' ? 'badge-pending' :
                        status === 'submitted' ? 'badge-submitted' :
                        status === 'graded' ? 'badge-graded' : 'badge-default'
                    }`}>{task.status}</span>
                )}
            </div>

            {task.description && <p className="task-desc">{task.description}</p>}

            <div className="task-meta">
                {task.due_date && (
                    <div>
                        <span className="task-meta__label">موعد التسليم:</span>
                        <span>{formatDateTimeAr(task.due_date)}</span>
                    </div>
                )}
                {task.task_type && (
                    <div>
                        <span className="task-meta__label">النوع:</span>
                        <span>{task.task_type}</span>
                    </div>
                )}
            </div>

            {message && <div className="task-message success">{message}</div>}

            {task.task_type === 'submission' && status === 'pending' && (
                <div className="task-actions">
                    <textarea
                        className="task-input"
                        value={submissionContent}
                        onChange={(e) => setSubmissionContent(e.target.value)}
                        placeholder="أدخل تقديمك هنا..."
                        rows={4}
                    />
                    <button className="btn btn-primary" disabled={submitting || !submissionContent.trim()} onClick={handleSubmit}>
                        {submitting ? 'جارٍ الإرسال...' : 'تقديم'}
                    </button>
                </div>
            )}

            {status !== 'pending' && (
                <div className="submission-display">
                    <div className="task-meta__label">حالة التقديم:</div>
                    <div>{task.status}</div>
                    {task.submission_content && (
                        <pre className="submission-content">{task.submission_content}</pre>
                    )}
                </div>
            )}
        </div>
    );
};

// This component is the daily gradebook for the teacher
const DailyGradebook = ({ students, dailyTasks, onGradeChange }) => {
    return (
        <div className="gradebook-container">
            <h3>دفتر الدرجات اليومي</h3>
            <table className="gradebook-table">
                <thead>
                    <tr>
                        <th>اسم الطالب</th>
                        {dailyTasks.map(task => (
                            <th key={task.id}>{task.title}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {students.map(student => (
                        <tr key={student.id}>
                            <td>{student.full_name}</td>
                            {dailyTasks.map(task => (
                                <td key={task.id}>
                                    <input 
                                        type="number" 
                                        defaultValue={task.grade}
                                        onBlur={(e) => onGradeChange(task.id, student.id, e.target.value)}
                                        className="grade-input"
                                    />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const CoursePage = ({ user, course, initialSchedule, initialTasks, students }) => {
    const [tasks, setTasks] = useState(initialTasks);
    const [selectedDay, setSelectedDay] = useState(initialSchedule[0]?.id || null);

    const handleTaskUpdate = (taskId, updatedData) => {
        setTasks(prevTasks => prevTasks.map(t => t.id === taskId ? { ...t, ...updatedData } : t));
    };

    const handleGradeChange = async (taskId, studentId, grade) => {
        const response = await fetch(`/api/tasks/${taskId}/grade`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ grade, feedback: '' })
        });
        if (response.ok) {
            console.log('Grade updated successfully');
            // You might want to update the local state here as well
        }
    };

    const renderUserView = () => {
        const userTasks = tasks.filter(t => t.assigned_to_user_id === user.id && t.schedule_id === selectedDay);
        
        if (user.role === 'teacher') {
            const teacherTasks = userTasks.filter(t => t.level_number === 2);
            const studentGradeItems = tasks.filter(t => t.schedule_id === selectedDay && t.level_number === 3 && t.task_type === 'grade_item');

            return (
                <div>
                    <div className="tasks-list">
                        <div className="section-header">
                            <h4 className="section-title">مهامك لهذا اليوم</h4>
                            <span className="section-subtitle">عرض منظم حسب النوع والحالة</span>
                        </div>
                        {teacherTasks.length === 0 && (
                            <div className="empty-state">لا توجد مهام اليوم</div>
                        )}
                        <div className="tasks-grid">
                            {teacherTasks.map(task => <TaskItem key={task.id} task={task} onUpdate={handleTaskUpdate} />)}
                        </div>
                    </div>
                    <DailyGradebook 
                        students={students}
                        dailyTasks={studentGradeItems}
                        onGradeChange={handleGradeChange}
                    />
                </div>
            );
        } else {
            return (
                <div className="tasks-list">
                    <div className="section-header">
                        <h4 className="section-title">مهامك لهذا اليوم</h4>
                        <span className="section-subtitle">عرض منظم حسب النوع والحالة</span>
                    </div>
                    {userTasks.length === 0 && (
                        <div className="empty-state">لا توجد مهام اليوم</div>
                    )}
                    <div className="tasks-grid">
                        {userTasks.map(task => <TaskItem key={task.id} task={task} onUpdate={handleTaskUpdate} />)}
                    </div>
                </div>
            );
        }
    };

    return (
        <Layout user={user}>
            <h1>{course.name}</h1>
            <div className="day-selector">
                {initialSchedule.map(day => (
                    <button key={day.id} onClick={() => setSelectedDay(day.id)} className={selectedDay === day.id ? 'active' : ''}>
                        اليوم {day.day_number}
                    </button>
                ))}
            </div>
            <div className="day-content">
                {selectedDay && renderUserView()}
            </div>
        </Layout>
    );
};

export const getServerSideProps = withAuth(async (context) => {
    const { user, query } = context;
    const courseId = query.id;

    try {
        const courseResult = await pool.query('SELECT * FROM courses WHERE id = $1', [courseId]);
        if (courseResult.rows.length === 0) {
            return { notFound: true };
        }

        const scheduleResult = await pool.query('SELECT * FROM course_schedule WHERE course_id = $1 ORDER BY day_number', [courseId]);
        const tasksResult = await pool.query('SELECT * FROM tasks WHERE course_id = $1', [courseId]);
        
        // Fetch students for the gradebook
        const studentsResult = await pool.query('SELECT u.id, u.full_name FROM users u JOIN enrollments e ON u.id = e.user_id WHERE e.course_id = $1 AND e.level_number = 3', [courseId]);

        return {
            props: {
                user: safeSerialize(user),
                course: safeSerialize(courseResult.rows[0]),
                initialSchedule: safeSerialize(scheduleResult.rows),
                initialTasks: safeSerialize(tasksResult.rows),
                students: safeSerialize(studentsResult.rows),
            },
        };
    } catch (err) {
        console.error("Error fetching course page data:", err);
        return { notFound: true };
    }
}, { roles: ['admin', 'head', 'teacher', 'student'] });

export default CoursePage;
