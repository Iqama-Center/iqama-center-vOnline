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

const CoursePage = ({ user, course, schedule, tasks: initialTasks, students, enrollment }) => {
    const [tasks, setTasks] = useState(initialTasks);
    const [activeDay, setActiveDay] = useState(schedule[0]?.id || null);

    // Handle task updates from child components (e.g., after submission)
    const handleTaskUpdate = (taskId, updatedData) => {
        setTasks(prevTasks => prevTasks.map(t => t.id === taskId ? { ...t, ...updatedData } : t));
    };

    // Handle grade changes from the gradebook
    const handleGradeChange = async (taskId, studentId, grade) => {
        // Note: This API endpoint needs to be adapted to handle grading for a specific student
        const response = await fetch(`/api/submissions/grade`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ taskId, studentId, grade, feedback: 'تم التقييم' })
        });
        if (response.ok) {
            console.log('Grade updated successfully');
            // Optionally, update local state to reflect the change immediately
        }
    };

    const renderContentForDay = (dayId) => {
        const dayTasks = tasks.filter(t => t.schedule_id === dayId);
        
        if (user.role === 'teacher') {
            // Teacher's view: their own tasks + gradebook for students
            const teacherTasks = dayTasks.filter(t => t.assigned_to === user.id);
            const studentTasks = dayTasks.filter(t => t.assigned_to !== user.id);

            return (
                <div>
                    <div className="tasks-list">
                        <h4 className="section-title">مهامك الخاصة</h4>
                        {teacherTasks.length > 0 ? (
                            <div className="tasks-grid">
                                {teacherTasks.map(task => <TaskItem key={task.id} task={task} onUpdate={handleTaskUpdate} />)}
                            </div>
                        ) : <p>لا توجد مهام خاصة بك لهذا اليوم.</p>}
                    </div>
                    <DailyGradebook 
                        students={students}
                        dailyTasks={studentTasks}
                        onGradeChange={handleGradeChange}
                    />
                </div>
            );
        } else {
            // Student's view: their assigned tasks
            const studentTasks = dayTasks.filter(t => t.assigned_to === user.id);
            return (
                <div className="tasks-list">
                     <h4 className="section-title">مهامك اليومية</h4>
                    {studentTasks.length > 0 ? (
                        <div className="tasks-grid">
                            {studentTasks.map(task => <TaskItem key={task.id} task={task} onUpdate={handleTaskUpdate} />)}
                        </div>
                    ) : <p>لا توجد مهام لك لهذا اليوم.</p>}
                </div>
            );
        }
    };

    return (
        <Layout user={user}>
            <div className="course-page-container">
                <header className="course-header">
                    <h1>{course.name}</h1>
                    <p>{course.description}</p>
                    <div className="course-meta-info">
                        <span><strong>المدرس:</strong> {course.teacher_name}</span>
                        <span><strong>الحالة:</strong> {enrollment.status_arabic}</span>
                    </div>
                </header>

                <nav className="course-schedule-nav">
                    {schedule.map(day => (
                        <button 
                            key={day.id}
                            className={`schedule-day-btn ${activeDay === day.id ? 'active' : ''}`}
                            onClick={() => setActiveDay(day.id)}
                        >
                            {day.title}
                        </button>
                    ))}
                </nav>

                <main className="course-content-area">
                    {activeDay ? renderContentForDay(activeDay) : <p>الرجاء اختيار يوم لعرض محتواه.</p>}
                </main>
            </div>
        </Layout>
    );
};

export const getServerSideProps = withAuth(async (context) => {
    const { id } = context.params;
    const { user } = context;
    let client;

    try {
        client = await pool.connect();

        // Fetch main course details along with teacher's name
        const courseRes = await client.query(`
            SELECT c.*, u.full_name as teacher_name 
            FROM courses c
            LEFT JOIN users u ON c.teacher_id = u.id
            WHERE c.id = $1
        `, [id]);

        if (courseRes.rows.length === 0) {
            return { notFound: true };
        }
        const course = courseRes.rows[0];

        // Check user enrollment and get its status
        const enrollmentRes = await client.query(`
            SELECT *,
                   CASE status
                       WHEN 'active' THEN 'نشط'
                       WHEN 'completed' THEN 'مكتمل'
                       WHEN 'pending_payment' THEN 'في انتظار الدفع'
                       ELSE 'غير محدد'
                   END as status_arabic
            FROM enrollments 
            WHERE user_id = $1 AND course_id = $2
        `, [user.id, id]);

        // For now, let's assume user must be enrolled to see the page
        if (enrollmentRes.rows.length === 0) {
            return { redirect: { destination: '/courses', permanent: false } };
        }
        const enrollment = enrollmentRes.rows[0];

        // Fetch the course schedule
        const scheduleRes = await client.query(
            'SELECT * FROM course_schedule WHERE course_id = $1 ORDER BY day_number',
            [id]
        );

        // Fetch all tasks for the course
        const tasksRes = await client.query(
            'SELECT * FROM tasks WHERE course_id = $1',
            [id]
        );

        // Fetch all students if the user is a teacher
        let students = [];
        if (user.role === 'teacher') {
            const studentsRes = await client.query(`
                SELECT u.id, u.full_name 
                FROM users u
                JOIN enrollments e ON u.id = e.user_id
                WHERE e.course_id = $1 AND e.status = 'active'
            `, [id]);
            students = studentsRes.rows;
        }

        return {
            props: {
                user: safeSerialize(user),
                course: safeSerialize(course),
                schedule: safeSerialize(scheduleRes.rows),
                tasks: safeSerialize(tasksRes.rows),
                students: safeSerialize(students),
                enrollment: safeSerialize(enrollment),
            },
        };
    } catch (error) {
        console.error(`Error fetching course page data for course ${id}:`, error);
        return { props: { error: 'Failed to load course data.' } };
    } finally {
        if (client) client.release();
    }
});

export default CoursePage;
