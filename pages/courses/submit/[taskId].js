
import React, { useState } from 'react';
import Layout from '../../../components/Layout';
import { withAuth } from '../../../lib/withAuth';
import pool from '../../../lib/db';
import { useRouter } from 'next/router';

const SubmitTaskPage = ({ user, task }) => {
    const [content, setContent] = useState('');
    const [message, setMessage] = useState(null);
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`/api/tasks/${task.id}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content })
            });
            const result = await response.json();
            setMessage({ text: result.message, type: response.ok ? 'success' : 'error' });
            if (response.ok) {
                setTimeout(() => router.push(`/courses/${task.course_id}`), 1500);
            }
        } catch (err) {
            setMessage({ text: 'حدث خطأ في الاتصال بالخادم.', type: 'error' });
        }
    };

    return (
        <Layout user={user}>
            <h1>تقديم المهمة: {task.title}</h1>
            <p>{task.description}</p>
            <hr />
            {message && <div className={`message ${message.type}`}>{message.text}</div>}
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="submissionContent">محتوى التقديم</label>
                    <textarea 
                        id="submissionContent"
                        rows="10"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        required
                    ></textarea>
                </div>
                <button type="submit" className="btn-save">إرسال</button>
            </form>
        </Layout>
    );
};

export const getServerSideProps = withAuth(async (context) => {
    const { taskId } = context.params;
    const taskRes = await pool.query('SELECT t.*, cs.course_id FROM tasks t JOIN course_schedule cs ON t.schedule_id = cs.id WHERE t.id = $1', [taskId]);

    if (taskRes.rows.length === 0) {
        return { notFound: true };
    }

    return {
        props: {
            user: context.user,
            task: JSON.parse(JSON.stringify(taskRes.rows[0]))
        }
    };
});

export default SubmitTaskPage;
