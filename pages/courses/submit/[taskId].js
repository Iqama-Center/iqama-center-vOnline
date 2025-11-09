import React, { useState } from 'react';
import Layout from '../../../components/Layout';
import { withAuth } from '../../../lib/withAuth';
import pool from '../../../lib/db';
import { useRouter } from 'next/router';
import Link from 'next/link';

const SubmitTaskPage = ({ user, task, submission }) => {
    const [content, setContent] = useState(submission?.content || '');
    const [currentSubmission, setCurrentSubmission] = useState(submission);
    const [message, setMessage] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const isGraded = !!currentSubmission?.graded_at;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isGraded) return;
        setIsSubmitting(true);
        setMessage(null);

        try {
            const response = await fetch(`/api/tasks/${task.id}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content })
            });
            const result = await response.json();
            
            if (response.ok) {
                setMessage({ text: result.message, type: 'success' });
                setCurrentSubmission(prev => ({
                    ...prev,
                    content: content,
                    submitted_at: result.submitted_at,
                }));
                setTimeout(() => {
                    router.push(`/courses/${task.course_id}`);
                }, 2000);
            } else {
                setMessage({ text: result.message || 'حدث خطأ ما.', type: 'error' });
            }
        } catch (err) {
            console.error(err);
            setMessage({ text: 'حدث خطأ في الاتصال بالخادم.', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Layout user={user}>
            <div className="page-container">
                <div className="breadcrumb">
                    <Link href={`/courses/${task.course_id}`}>
                        <a>العودة إلى الدورة</a>
                    </Link>
                </div>
                <h1 className="page-title">تقديم المهمة: {task.title}</h1>
                <p className="task-description">{task.description}</p>
                
                {isGraded && (
                    <div className="message notice">
                        تم تصحيح هذه المهمة ولا يمكن تعديل التقديم.
                    </div>
                )}

                {currentSubmission?.submitted_at && !isGraded && (
                    <div className="message info">
                        آخر تقديم كان في: {new Date(currentSubmission.submitted_at).toLocaleString('ar-EG')}
                    </div>
                )}

                {message && <div className={`message ${message.type}`}>{message.text}</div>}

                <form onSubmit={handleSubmit} className="submission-form">
                    <div className="form-group">
                        <label htmlFor="submissionContent">محتوى التقديم</label>
                        <textarea 
                            id="submissionContent"
                            rows="15"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            required
                            disabled={isGraded || isSubmitting}
                            placeholder="اكتب إجابتك هنا..."
                        ></textarea>
                    </div>
                    <button type="submit" className="btn-save" disabled={isGraded || isSubmitting}>
                        {isSubmitting ? 'جارٍ الإرسال...' : (currentSubmission ? 'تحديث التقديم' : 'إرسال')}
                    </button>
                </form>
            </div>
            <style jsx>{`
                .page-container {
                    max-width: 800px;
                    margin: 2rem auto;
                    padding: 2rem;
                    background-color: #fff;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                }
                .breadcrumb a {
                    color: #0070f3;
                    text-decoration: none;
                    font-weight: 500;
                    margin-bottom: 1rem;
                    display: inline-block;
                }
                .breadcrumb a:hover {
                    text-decoration: underline;
                }
                .page-title {
                    font-size: 2rem;
                    color: #333;
                    margin-bottom: 0.5rem;
                }
                .task-description {
                    font-size: 1.1rem;
                    color: #555;
                    margin-bottom: 1.5rem;
                    line-height: 1.6;
                }
                .submission-form {
                    margin-top: 1.5rem;
                }
                .form-group {
                    margin-bottom: 1.5rem;
                }
                .form-group label {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-weight: 600;
                    color: #444;
                }
                textarea {
                    width: 100%;
                    padding: 12px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    font-size: 1rem;
                    line-height: 1.5;
                    transition: border-color 0.2s;
                }
                textarea:focus {
                    outline: none;
                    border-color: #0070f3;
                    box-shadow: 0 0 0 3px rgba(0, 112, 243, 0.1);
                }
                textarea:disabled {
                    background-color: #f8f8f8;
                    cursor: not-allowed;
                }
                .btn-save {
                    display: inline-block;
                    padding: 12px 24px;
                    background-color: #0070f3;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background-color 0.2s;
                }
                .btn-save:hover:not(:disabled) {
                    background-color: #005bb5;
                }
                .btn-save:disabled {
                    background-color: #ccc;
                    cursor: not-allowed;
                }
                .message {
                    padding: 1rem;
                    margin-bottom: 1rem;
                    border-radius: 6px;
                    font-weight: 500;
                }
                .message.success {
                    background-color: #d4edda;
                    color: #155724;
                    border: 1px solid #c3e6cb;
                }
                .message.error {
                    background-color: #f8d7da;
                    color: #721c24;
                    border: 1px solid #f5c6cb;
                }
                .message.info {
                    background-color: #e2e3e5;
                    color: #383d41;
                    border: 1px solid #d6d8db;
                }
                .message.notice {
                    background-color: #fff3cd;
                    color: #856404;
                    border: 1px solid #ffeeba;
                }
            `}</style>
        </Layout>
    );
};

export const getServerSideProps = withAuth(async (context) => {
    const { taskId } = context.params;
    const { id: userId } = context.user;

    const taskQuery = `
        SELECT
            t.id,
            t.title,
            t.description,
            cs.course_id
        FROM tasks t
        JOIN course_schedule cs ON t.schedule_id = cs.id
        WHERE t.id = $1
    `;
    const taskRes = await pool.query(taskQuery, [taskId]);

    if (taskRes.rows.length === 0) {
        return { notFound: true };
    }
    const task = taskRes.rows[0];

    // التحقق من أن المستخدم مسجل في الدورة
    const enrollmentCheck = await pool.query(
        'SELECT id FROM enrollments WHERE course_id = $1 AND user_id = $2 AND status = \'active\'',
        [task.course_id, userId]
    );

    if (enrollmentCheck.rows.length === 0) {
        return {
            redirect: {
                destination: `/courses/${task.course_id}`,
                permanent: false,
            },
        };
    }

    const submissionQuery = `
        SELECT content, submitted_at, graded_at
        FROM submissions
        WHERE task_id = $1 AND user_id = $2
    `;
    const submissionRes = await pool.query(submissionQuery, [taskId, userId]);

    return {
        props: {
            user: context.user,
            task: JSON.parse(JSON.stringify(task)),
            submission: submissionRes.rows.length > 0 ? JSON.parse(JSON.stringify(submissionRes.rows[0])) : null,
        }
    };
});

export default SubmitTaskPage;
