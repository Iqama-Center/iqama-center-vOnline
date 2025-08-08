import React, { useState, useEffect } from 'react';
import Layout from '../../../components/Layout';
import { withAuth } from '../../../lib/withAuth';
import pool from '../../../lib/db';
import { safeSerialize } from '../../../lib/isrUtils';

// This is a generic component to display a single task
const TaskItem = ({ task, onUpdate }) => {
    const [submissionContent, setSubmissionContent] = useState(task.submission_content || '');
    const [message, setMessage] = useState('');

    const handleSubmit = async () => {
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
    };

    return (
        <div className="task-item">
            <h4>{task.title}</h4>
            <p>{task.description}</p>
            {message && <div className="task-message">{message}</div>}
            {task.task_type === 'submission' && task.status === 'pending' && (
                <div>
                    <textarea 
                        value={submissionContent}
                        onChange={(e) => setSubmissionContent(e.target.value)}
                        placeholder="أدخل تقديمك هنا..."
                    />
                    <button onClick={handleSubmit}>تقديم</button>
                </div>
            )}
            {task.status !== 'pending' && (
                <div className="submission-display">
                    <strong>حالة التقديم:</strong> {task.status}
                    {task.submission_content && <pre>{task.submission_content}</pre>}
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
                        {dailyTasks.filter(t => t.task_type === 'grade_item').map(task => (
                            <th key={task.id}>{task.title}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {students.map(student => (
                        <tr key={student.id}>
                            <td>{student.full_name}</td>
                            {dailyTasks.filter(t => t.task_type === 'grade_item').map(task => (
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

const CourseDayView = ({ user, course, initialSchedule, initialTasks }) => {
    const [schedule, setSchedule] = useState(initialSchedule);
    const [tasks, setTasks] = useState(initialTasks);
    const [selectedDay, setSelectedDay] = useState(initialSchedule[0]?.id || null);

    const handleTaskUpdate = (taskId, updatedData) => {
        setTasks(prevTasks => prevTasks.map(t => t.id === taskId ? { ...t, ...updatedData } : t));
    };

    const handleGradeChange = async (taskId, studentId, grade) => {
        // In a real app, you would find the specific task for the student and update it.
        // This is a simplified example.
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
            const students = [/* you would fetch student data here */];

            return (
                <div>
                    <div className="tasks-list">
                        <h4>مهامك لهذا اليوم:</h4>
                        {teacherTasks.map(task => <TaskItem key={task.id} task={task} onUpdate={handleTaskUpdate} />)}
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
                    <h4>مهامك لهذا اليوم:</h4>
                    {userTasks.map(task => <TaskItem key={task.id} task={task} onUpdate={handleTaskUpdate} />)}
                </div>
            );
        }
    };

    return (
        <Layout user={user}>
            <h1>{course.name}</h1>
            <div className="day-selector">
                {schedule.map(day => (
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

        return {
            props: {
                user: safeSerialize(user),
                course: safeSerialize(courseResult.rows[0]),
                initialSchedule: safeSerialize(scheduleResult.rows),
                initialTasks: safeSerialize(tasksResult.rows),
            },
        };
    } catch (err) {
        console.error("Error fetching course page data:", err);
        return { notFound: true };
    }
}, { roles: ['admin', 'head', 'teacher', 'student'] });

export default CourseDayView;