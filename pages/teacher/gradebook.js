
import React, { useState } from 'react';
import Layout from '../../components/Layout';
import { withAuth } from '../../lib/withAuth';

import styles from '../../styles/TeacherGradebook.module.css';
import pool from '../../lib/db';

const GradingModal = ({ show, onClose, submission, onSubmit }) => {
    const [grade, setGrade] = useState(submission?.grade || '');
    const [feedback, setFeedback] = useState(submission?.feedback || '');
    const [message, setMessage] = useState(null);

    if (!show || !submission) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await onSubmit(submission.submission_id, grade, feedback);
        setMessage(result);
        if (result.isSuccess) {
            setTimeout(onClose, 1000);
        }
    };

    return (
        <div className={styles.modal} style={{ display: 'flex' }}>
            <div className={styles.modalContent} style={{ maxWidth: '700px' }}>
                <span className={styles.closeButton} onClick={onClose}>×</span>
                <h2 id="gradingModalTitle">تصحيح مهمة &quot;{submission.title}&quot; للطالب {submission.full_name}</h2>
                {message && <div className={`${styles.message} ${message.isError ? styles.error : styles.success}`}>{message.text}</div>}
                
                <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '5px', marginBottom: '15px' }}>
                    <h4>محتوى تقديم الطالب:</h4>
                    <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', maxHeight: '200px', overflowY: 'auto' }}>{submission.content || 'لا يوجد محتوى نصي.'}</pre>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label htmlFor="gradeInput">الدرجة</label>
                        <input type="number" id="gradeInput" name="grade" step="0.5" className="form-control" value={grade} onChange={(e) => setGrade(e.target.value)} required />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="feedbackInput">ملاحظات (Feedback)</label>
                        <textarea id="feedbackInput" name="feedback" rows="4" className="form-control" value={feedback} onChange={(e) => setFeedback(e.target.value)}></textarea>
                    </div>
                    <button type="submit" className="btn-save">حفظ الدرجة</button>
                </form>
            </div>
        </div>
    );
};

const TeacherGradebookPage = ({ user, course, tasks, students, submissions }) => {
    const [showGradingModal, setShowGradingModal] = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState(null);

    const handleOpenGradingModal = (submissionData) => {
        setSelectedSubmission(submissionData);
        setShowGradingModal(true);
    };

    const handleGradeSubmission = async (submissionId, grade, feedback) => {
        try {
            const response = await fetch(`/api/submissions/${submissionId}/grade`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ grade, feedback })
            });
            const result = await response.json();
            if (response.ok) {
                // Optionally update local state or refetch data
                return { text: 'تم تسجيل الدرجة بنجاح.', isSuccess: true };
            } else {
                return { text: result.message, isError: true };
            }
        } catch (err) {
            return { text: 'حدث خطأ في الاتصال.', isError: true };
        }
    };

    return (
        <Layout user={user}>
            <h1><i class="fas fa-book-reader fa-fw"></i> دفتر درجات دورة: {course.name}</h1>
            <p>قم بمراجعة تقديمات الطلاب وتسجيل الدرجات.</p>

            <div className={`${styles.gradebookContainer} table-responsive-wrapper`}>
                <table className={styles.gradebookTable}>
                    <thead>
                        <tr>
                            <th>اسم الطالب</th>
                            {tasks.map(task => (
                                <th key={task.id}>{task.title}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {students.map(student => (
                            <tr key={student.id}>
                                <td className={styles.studentName}>{student.full_name}</td>
                                {tasks.map(task => {
                                    const submission = submissions.find(s => s.user_id === student.id && s.task_id === task.id);
                                    return (
                                        <td
                                            key={task.id}
                                            className={styles.gradeCell}
                                            onClick={() => submission && handleOpenGradingModal({ ...submission, title: task.title, full_name: student.full_name })}
                                        >
                                            {submission ? (
                                                submission.status === 'graded' ? (
                                                    <span className={styles.statusGraded}>{submission.grade}</span>
                                                ) : submission.status === 'submitted' ? (
                                                    <span className={styles.statusSubmitted}><i className="fas fa-exclamation-circle"></i> يحتاج تصحيح</span>
                                                ) : (
                                                    <span className={styles.statusPending}>لم يقدم</span>
                                                )
                                            ) : (
                                                <span className={styles.statusPending}>-</span>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <GradingModal
                show={showGradingModal}
                onClose={() => setShowGradingModal(false)}
                submission={selectedSubmission}
                onSubmit={handleGradeSubmission}
            />
        </Layout>
    );
};

export const getServerSideProps = withAuth(async (context) => {
    const { query } = context;
    const { id: courseId } = query; // Assuming course ID is passed as a query parameter
    const { user } = context;

    if (user.role !== 'teacher' && user.role !== 'admin') {
        return { redirect: { destination: '/dashboard', permanent: false } };
    }

    const courseResult = await pool.query('SELECT * FROM courses WHERE id = $1', [courseId]);
    if (courseResult.rows.length === 0) {
        return { notFound: true };
    }
    const course = courseResult.rows[0];

    const tasksResult = await pool.query(
        `SELECT t.id, t.title FROM tasks t
        JOIN course_schedule cs ON t.schedule_id = cs.id
        WHERE cs.course_id = $1 ORDER BY t.due_date ASC`,
        [courseId]
    );
    const tasks = tasksResult.rows;

    const studentsResult = await pool.query(
        `SELECT u.id, u.full_name FROM users u
        JOIN enrollments e ON u.id = e.user_id
        WHERE e.course_id = $1 AND u.role = 'student' ORDER BY u.full_name ASC`,
        [courseId]
    );
    const students = studentsResult.rows;

    const submissionsResult = await pool.query(
        `SELECT s.id as submission_id, s.user_id, s.task_id, s.content, s.status, s.grade, s.feedback
        FROM submissions s
        JOIN tasks t ON s.task_id = t.id
        JOIN course_schedule cs ON t.schedule_id = cs.id
        WHERE cs.course_id = $1`,
        [courseId]
    );
    const submissions = submissionsResult.rows;

    return {
        props: {
            user: JSON.parse(JSON.stringify(user)),
            course: JSON.parse(JSON.stringify(course)),
            tasks: JSON.parse(JSON.stringify(tasks)),
            students: JSON.parse(JSON.stringify(students)),
            submissions: JSON.parse(JSON.stringify(submissions)),
        },
    };
});

export default TeacherGradebookPage;
