import React from 'react';
import Layout from '../../../components/Layout';
import { withAuth } from '../../../lib/withAuth';
import pool from '../../../lib/db';

const TeacherCoursePage = ({ user, course, students, tasks, submissions }) => {
    if (!course) {
        return (
            <Layout user={user}>
                <p>الدورة غير موجودة.</p>
            </Layout>
        );
    }

    return (
        <Layout user={user}>
            <h1><i className="fas fa-book-reader fa-fw"></i> دفتر درجات دورة: {course.name}</h1>
            <p>قم بمراجعة تقديمات الطلاب وتسجيل الدرجات.</p>

            <div className="gradebook-container">
                <table className="gradebook-table">
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
                                <td className="student-name">{student.full_name}</td>
                                {tasks.map(task => {
                                    const submission = submissions.find(s => s.user_id === student.id && s.task_id === task.id);
                                    return (
                                        <td key={task.id} className="grade-cell" onClick={() => submission && openGradingModal(submission.submission_id)}>
                                            {submission ? (
                                                submission.status === 'graded' ? (
                                                    <span className="status-graded">{submission.grade}</span>
                                                ) : submission.status === 'submitted' ? (
                                                    <span className="status-submitted"><i className="fas fa-exclamation-circle"></i> يحتاج تصحيح</span>
                                                ) : (
                                                    <span className="status-pending">لم يقدم</span>
                                                )
                                            ) : (
                                                <span className="status-pending">-</span>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Grading Modal */}
            <div id="gradingModal" className="modal" style={{ display: 'none' }}>
                <div className="modal-content" style={{ maxWidth: '700px' }}>
                    <span className="close-button" onClick={closeGradingModal}>×</span>
                    <h2 id="gradingModalTitle">تصحيح المهمة</h2>
                    <div id="grading-message" style={{ display: 'none', padding: '10px', marginBottom: '10px', borderRadius: '5px' }}></div>
                    
                    <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '5px', marginBottom: '15px' }}>
                        <h4>محتوى تقديم الطالب:</h4>
                        <pre id="submissionContent" style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', maxHeight: '200px', overflowY: 'auto' }}></pre>
                    </div>

                    <form id="gradingForm">
                        <input type="hidden" id="submissionIdInput" />
                        <div className="form-group">
                            <label htmlFor="gradeInput">الدرجة</label>
                            <input type="number" id="gradeInput" name="grade" step="0.5" className="form-control" required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="feedbackInput">ملاحظات (Feedback)</label>
                            <textarea id="feedbackInput" name="feedback" rows="4" className="form-control"></textarea>
                        </div>
                        <button type="submit" className="btn-save">حفظ الدرجة</button>
                    </form>
                </div>
            </div>

            <style jsx>{`
                .gradebook-container { overflow-x: auto; background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
                .gradebook-table { width: 100%; min-width: 800px; border-collapse: collapse; }
                .gradebook-table th, .gradebook-table td { padding: 12px; border: 1px solid #ddd; text-align: center; }
                .gradebook-table th { background-color: #f7f9fc; position: sticky; top: 0; }
                .student-name { text-align: right; font-weight: bold; }
                .grade-cell { cursor: pointer; }
                .grade-cell:hover { background-color: #eaf5ff; }
                .status-submitted { color: #f39c12; }
                .status-graded { color: #27ae60; font-weight: bold; }
                .status-pending { color: #95a5a6; }
                .modal { display: flex; justify-content: center; align-items: center; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.7); }
                .modal-content { background-color: #fefefe; margin: 15% auto; padding: 20px; border: 1px solid #888; border-radius: 8px; width: 80%; max-width: 500px; }
                .close-button { color: #aaa; float: right; font-size: 28px; font-weight: bold; }
                .close-button:hover, .close-button:focus { color: black; text-decoration: none; cursor: pointer; }
            `}</style>

            <script dangerouslySetInnerHTML={{ __html: `
                const gradingModal = document.getElementById('gradingModal');

                async function openGradingModal(submissionId) {
                    const response = await fetch('/api/submissions/' + submissionId);
                    if (!response.ok) { alert('فشل جلب بيانات التقديم.'); return; }
                    const data = await response.json();

                    document.getElementById('gradingModalTitle').innerText = 'تصحيح مهمة "' + data.title + '" للطالب ' + data.full_name;
                    document.getElementById('submissionContent').innerText = data.content || 'لا يوجد محتوى نصي.';
                    document.getElementById('submissionIdInput').value = submissionId;
                    document.getElementById('gradeInput').value = data.grade || '';
                    document.getElementById('feedbackInput').value = data.feedback || '';

                    gradingModal.style.display = 'block';
                }

                function closeGradingModal() {
                    gradingModal.style.display = 'none';
                }

                document.getElementById('gradingForm').addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const form = e.target;
                    const submissionId = document.getElementById('submissionIdInput').value;
                    const data = {
                        grade: form.grade.value,
                        feedback: form.feedback.value
                    };

                    const response = await fetch('/api/submissions/' + submissionId + '/grade', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });
                    const result = await response.json();
                    const messageBox = document.getElementById('grading-message');
                    if (response.ok) {
                        messageBox.className = 'message success';
                        messageBox.textContent = 'تم تسجيل الدرجة بنجاح.';
                        setTimeout(() => location.reload(), 1000);
                    } else {
                        messageBox.className = 'message error';
                        messageBox.textContent = result.message;
                    }
                    messageBox.style.display = 'block';
                });
            ` }} />
        </Layout>
    );
};

export const getServerSideProps = withAuth(async (context) => {
    const { user, query } = context;
    const courseId = query.id;

    // Only teachers can access this page
    if (user.role !== 'teacher') {
        return { redirect: { destination: '/dashboard', permanent: false } };
    }

    let course = null;
    let students = [];
    let tasks = [];
    let submissions = [];

    try {
        // Fetch course details
        const courseResult = await pool.query('SELECT * FROM courses WHERE id = $1', [courseId]);
        if (courseResult.rows.length > 0) {
            course = courseResult.rows[0];

            // Fetch students enrolled in this course
            const studentsResult = await pool.query(
                `SELECT u.id, u.full_name FROM users u JOIN enrollments e ON u.id = e.user_id WHERE e.course_id = $1`,
                [courseId]
            );
            students = studentsResult.rows;

            // Fetch tasks for this course
            const tasksResult = await pool.query(
                `SELECT t.id, t.title FROM tasks t JOIN course_schedule cs ON t.schedule_id = cs.id WHERE cs.course_id = $1 ORDER BY t.due_date`,
                [courseId]
            );
            tasks = tasksResult.rows;

            // Fetch all submissions for these tasks and students
            const submissionResult = await pool.query(
                `SELECT s.id as submission_id, s.task_id, s.user_id, s.status, s.grade, s.feedback, s.content, t.title, u.full_name
                 FROM submissions s
                 JOIN tasks t ON s.task_id = t.id
                 JOIN users u ON s.user_id = u.id
                 JOIN course_schedule cs ON t.schedule_id = cs.id
                 WHERE cs.course_id = $1`,
                [courseId]
            );
            submissions = submissionResult.rows;

        }
    } catch (err) {
        console.error("Error fetching teacher course data:", err);
    }

    return {
        props: {
            user: JSON.parse(JSON.stringify(user)),
            course: course ? JSON.parse(JSON.stringify(course)) : null,
            students: JSON.parse(JSON.stringify(students)),
            tasks: JSON.parse(JSON.stringify(tasks)),
            submissions: JSON.parse(JSON.stringify(submissions)),
        },
    };
}, { roles: ['teacher'] });

export default TeacherCoursePage;
