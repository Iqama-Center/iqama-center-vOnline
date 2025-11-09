import React, { useState } from 'react';
import Layout from '../../components/Layout';
import { withAuth } from '../../lib/withAuth';
import styles from '../../styles/TeacherGradebook.module.css';
import pool from '../../lib/db';
import { safeSerialize } from '../../lib/serializer';

const GradingModal = ({ show, onClose, submission, onSubmit }) => {
    const [grade, setGrade] = useState(submission?.grade || '');
    const [feedback, setFeedback] = useState(submission?.feedback || '');
    const [message, setMessage] = useState(null);

    React.useEffect(() => {
        if (show) {
            setGrade(submission?.grade || '');
            setFeedback(submission?.feedback || '');
            setMessage(null);
        }
    }, [show, submission]);

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
                window.location.reload(); // Easiest way to show updated data
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
            <h1><i className="fas fa-book-reader fa-fw"></i> دفتر درجات دورة: {course.name}</h1>
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
                                                ) : submission.status === 'submitted' || submission.status === 'late' ? (
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
    const { query, user } = context;
    const { id: courseId } = query;

    if (!courseId) {
        return { notFound: true };
    }

    if (user.role !== 'teacher' && user.role !== 'admin' && user.role !== 'head') {
        return { redirect: { destination: '/dashboard', permanent: false } };
    }

    try {
        const result = await pool.query(
            'SELECT get_course_gradebook($1) as gradebook_data;',
            [courseId]
        );
        
        const data = result.rows[0]?.gradebook_data;

        if (!data || !data.course) {
            return { notFound: true };
        }

        // Security check: ensure the user is the teacher for this course
        if (user.role === 'teacher' && data.course.teacher_id !== user.id) {
            return { redirect: { destination: '/teacher/my-courses', permanent: false } };
        }

        return {
            props: {
                user,
                course: safeSerialize(data.course),
                tasks: safeSerialize(data.tasks || []),
                students: safeSerialize(data.students || []),
                submissions: safeSerialize(data.submissions || []),
            },
        };
    } catch (error) {
        console.error('Error fetching gradebook data:', error);
        return { notFound: true };
    }
});

export default TeacherGradebookPage;