import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { withAuth } from '../../lib/withAuth';
import pool from '../../lib/db';
import { useRouter } from 'next/router';

const CourseDetailPage = ({ user, course, schedule, tasks, exams, supervisor, messages: initialMessages }) => {
    const router = useRouter();
    const [messages, setMessages] = useState(initialMessages || []);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);

    if (router.isFallback) {
        return <div>جاري التحميل...</div>;
    }

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/courses/${course.id}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: newMessage })
            });

            if (response.ok) {
                const messageData = await response.json();
                setMessages([messageData, ...messages]);
                setNewMessage('');
            }
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleContactSupervisor = () => {
        router.push(`/messages?contact=${supervisor.id}`);
    };

    return (
        <Layout user={user}>
            <style jsx>{`
                .course-header {
                    background: #007bff;
                    color: white;
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                }
                .course-header h1 { margin: 0; }
                .course-content { display: grid; grid-template-columns: 1fr 300px; gap: 20px; }
                .schedule-list { display: flex; flex-direction: column; gap: 15px; }
                .schedule-item {
                    background: #fff;
                    padding: 15px;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                }
                .schedule-item h3 { margin: 0 0 10px 0; }
                .task-list { list-style: none; padding: 0; margin: 10px 0 0 0; }
                .task-item { background: #f9f9f9; padding: 10px; border-radius: 5px; margin-top: 8px; }
                .sidebar-widget { background: #fff; padding: 15px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); margin-bottom: 20px; }
                .exam-link { 
                    display: inline-block; 
                    background: #28a745; 
                    color: white; 
                    padding: 8px 15px; 
                    border-radius: 5px; 
                    text-decoration: none; 
                    margin-top: 10px;
                }
                .exam-link:hover { background: #218838; color: white; }
                .supervisor-info { 
                    display: flex; 
                    align-items: center; 
                    gap: 10px; 
                    margin-bottom: 15px; 
                    padding: 10px; 
                    background: #f8f9fa; 
                    border-radius: 5px; 
                }
                .supervisor-avatar { 
                    width: 50px; 
                    height: 50px; 
                    border-radius: 50%; 
                    background: #007bff; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    color: white; 
                    font-weight: bold; 
                }
                .contact-btn { 
                    background: #007bff; 
                    color: white; 
                    border: none; 
                    padding: 5px 10px; 
                    border-radius: 3px; 
                    cursor: pointer; 
                    font-size: 12px; 
                }
                .contact-btn:hover { background: #0056b3; }
                .messages-section { 
                    background: #fff; 
                    border-radius: 8px; 
                    padding: 20px; 
                    box-shadow: 0 2px 8px rgba(0,0,0,0.08); 
                    margin-top: 20px; 
                }
                .message-form { 
                    display: flex; 
                    gap: 10px; 
                    margin-bottom: 20px; 
                }
                .message-input { 
                    flex: 1; 
                    padding: 10px; 
                    border: 1px solid #ddd; 
                    border-radius: 5px; 
                    resize: vertical; 
                }
                .send-btn { 
                    background: #007bff; 
                    color: white; 
                    border: none; 
                    padding: 10px 20px; 
                    border-radius: 5px; 
                    cursor: pointer; 
                }
                .send-btn:disabled { background: #6c757d; cursor: not-allowed; }
                .message-item { 
                    background: #f8f9fa; 
                    padding: 15px; 
                    border-radius: 5px; 
                    margin-bottom: 10px; 
                    border-left: 4px solid #007bff; 
                }
                .message-author { 
                    font-weight: bold; 
                    color: #007bff; 
                    margin-bottom: 5px; 
                }
                .message-time { 
                    font-size: 12px; 
                    color: #6c757d; 
                    margin-top: 5px; 
                }
                .active-course-features {
                    margin-top: 15px;
                    padding: 15px;
                    background: rgba(255,255,255,0.1);
                    border-radius: 8px;
                }
                .meeting-link-btn {
                    display: inline-block;
                    background: #28a745;
                    color: white;
                    padding: 10px 20px;
                    border-radius: 5px;
                    text-decoration: none;
                    font-weight: bold;
                    margin-bottom: 10px;
                }
                .meeting-link-btn:hover {
                    background: #218838;
                    color: white;
                }
                .first-day-content {
                    margin-top: 15px;
                }
                .first-day-content h4 {
                    margin: 0 0 10px 0;
                    color: white;
                }
                .content-preview {
                    background: rgba(255,255,255,0.9);
                    color: #333;
                    padding: 10px;
                    border-radius: 5px;
                }
                .rating-section {
                    background: #fff;
                    border-radius: 8px;
                    padding: 20px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                    margin-top: 20px;
                }
                .rating-info {
                    display: grid;
                    gap: 15px;
                }
                .rating-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .rating-value {
                    font-weight: bold;
                    color: #28a745;
                }
                .progress-bar {
                    width: 100%;
                    height: 20px;
                    background: #e9ecef;
                    border-radius: 10px;
                    overflow: hidden;
                }
                .progress-fill {
                    height: 100%;
                    transition: width 0.3s ease;
                }
            `}</style>

            <div className="course-header">
                <h1>{course.name}</h1>
                <p>{course.description}</p>
                
                {/* Active Course Features */}
                {course.status === 'active' && (
                    <div className="active-course-features">
                        {course.details?.meeting_link && (
                            <div className="meeting-link-section">
                                <a href={course.details?.meeting_link} target="_blank" rel="noopener noreferrer" className="meeting-link-btn">
                                    <i className="fas fa-video"></i> دخول الاجتماع
                                </a>
                            </div>
                        )}
                        
                        {course.details?.first_day_content && (
                            <div className="first-day-content">
                                <h4>محتوى اليوم الأول:</h4>
                                <div className="content-preview">
                                    {course.details?.first_day_content}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="course-content">
                <div className="main-column">
                    <h2><i className="fas fa-calendar-alt fa-fw"></i> جدول الدورة</h2>
                    <div className="schedule-list">
                        {schedule.map(day => (
                            <div key={day.id} className="schedule-item">
                                <h3>{day.title} (اليوم {day.day_number})</h3>
                                {day.content_url && <a href={day.content_url} target="_blank" rel="noopener noreferrer">عرض المحتوى</a>}
                                {day.meeting_link && <a href={day.meeting_link} target="_blank" rel="noopener noreferrer" style={{ marginRight: '10px' }}>رابط اللقاء</a>}
                                
                                <ul className="task-list">
                                    {tasks.filter(t => t.schedule_id === day.id).map(task => (
                                        <li key={task.id} className="task-item">
                                            <strong>{task.title}</strong> ({task.task_type})
                                            <p>{task.description}</p>
                                            <small>تاريخ الاستحقاق: {new Date(task.due_date).toLocaleString('ar-EG')}</small>
                                        </li>
                                    ))}
                                </ul>
                                
                                {/* Show exams for this day */}
                                {exams && exams.filter(exam => exam.day_number === day.day_number).map(exam => (
                                    <div key={exam.id} style={{ marginTop: '10px' }}>
                                        <a href={`/exams/${exam.id}`} className="exam-link">
                                            <i className="fas fa-clipboard-check"></i> {exam.title}
                                        </a>
                                        <small style={{ display: 'block', marginTop: '5px', color: '#666' }}>
                                            مدة الامتحان: {exam.time_limit} دقيقة
                                        </small>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="sidebar-column">
                    {/* Supervisor Information */}
                    <div className="sidebar-widget">
                        <h3><i className="fas fa-user-tie fa-fw"></i> المشرف</h3>
                        <div className="supervisor-info">
                            <div className="supervisor-avatar">
                                {supervisor?.full_name?.charAt(0) || 'م'}
                            </div>
                            <div>
                                <div><strong>{supervisor?.full_name || course.created_by_name}</strong></div>
                                <div style={{ fontSize: '12px', color: '#666' }}>
                                    {supervisor?.role === 'teacher' ? 'معلم' : 
                                     supervisor?.role === 'head' ? 'رئيس قسم' : 
                                     supervisor?.role === 'admin' ? 'مدير' : 'مشرف'}
                                </div>
                                <button onClick={handleContactSupervisor} className="contact-btn">
                                    <i className="fas fa-envelope"></i> تواصل
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Course Details */}
                    <div className="sidebar-widget">
                        <h3><i className="fas fa-info-circle fa-fw"></i> تفاصيل الدورة</h3>
                        <p><strong>حالة الدورة:</strong> 
                            <span style={{ 
                                color: course.status === 'active' ? '#28a745' : 
                                       course.status === 'published' ? '#007bff' : '#6c757d',
                                marginRight: '5px'
                            }}>
                                {course.status === 'active' ? 'نشطة' : 
                                 course.status === 'published' ? 'متاحة للانضمام فيها' : 'مسودة'}
                            </span>
                        </p>
                        {course.start_date && (
                            <p><strong>تاريخ البداية:</strong> {new Date(course.start_date).toLocaleDateString('ar-EG')}</p>
                        )}
                        {course.end_date && (
                            <p><strong>تاريخ النهاية:</strong> {new Date(course.end_date).toLocaleDateString('ar-EG')}</p>
                        )}
                    </div>

                    {/* Available Exams */}
                    <div className="sidebar-widget">
                        <h3><i className="fas fa-clipboard-check fa-fw"></i> الاختبارات المتاحة</h3>
                        {exams && exams.length > 0 ? (
                            exams.map(exam => (
                                <div key={exam.id} style={{ marginBottom: '10px' }}>
                                    <a href={`/exams/${exam.id}`} className="exam-link">
                                        <i className="fas fa-clipboard-check"></i> {exam.title}
                                    </a>
                                    <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                                        مدة الامتحان: {exam.time_limit} دقيقة
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ padding: '10px', textAlign: 'center', color: '#666' }}>
                                <p>لا توجد اختبارات متاحة حالياً</p>
                                <small>سيتم عرض الاختبارات هنا عند إنشائها</small>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Course Messages/Sharing Section */}
            <div className="messages-section">
                <h2><i className="fas fa-comments fa-fw"></i> {course.status === 'active' ? 'المساحة المشتركة للكلام' : 'مساحة المشاركة والتواصل'}</h2>
                
                <form onSubmit={handleSendMessage} className="message-form">
                    <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={course.status === 'active' ? 'شارك في النقاش المباشر...' : 'شارك أفكارك أو اطرح سؤالاً...'}
                        className="message-input"
                        rows="3"
                        disabled={loading}
                    />
                    <button type="submit" disabled={loading || !newMessage.trim()} className="send-btn">
                        {loading ? 'جاري الإرسال...' : (course.status === 'active' ? 'مشاركة' : 'إرسال')}
                    </button>
                </form>

                <div className="messages-list">
                    {messages.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                            لا توجد رسائل بعد. كن أول من يشارك!
                        </p>
                    ) : (
                        messages.map(message => (
                            <div key={message.id} className="message-item">
                                <div className="message-author">
                                    {message.author_name}
                                    <span style={{ 
                                        fontSize: '12px', 
                                        fontWeight: 'normal', 
                                        color: '#666',
                                        marginRight: '10px'
                                    }}>
                                        ({message.author_role === 'teacher' ? 'معلم' : 
                                          message.author_role === 'student' ? 'طالب' : 
                                          message.author_role === 'admin' ? 'مدير' : message.author_role})
                                    </span>
                                </div>
                                <div>{message.message}</div>
                                <div className="message-time">
                                    {new Date(message.created_at).toLocaleString('ar-EG')}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Rating System - Only for Active Courses */}
            {course.status === 'active' && (
                <div className="rating-section">
                    <h2><i className="fas fa-star fa-fw"></i> احتساب التقييمات</h2>
                    <div className="rating-info">
                        <div className="rating-item">
                            <span>التقييم الحالي:</span>
                            <span className="rating-value">{course.details?.current_rating || 'غير محدد'}</span>
                        </div>
                        <div className="rating-item">
                            <span>عدد المقيمين:</span>
                            <span className="rating-value">{course.details?.rating_count || 0}</span>
                        </div>
                        <div className="rating-progress">
                            <div className="progress-bar">
                                <div 
                                    className="progress-fill" 
                                    style={{ 
                                        width: `${((course.details?.current_rating || 0) / 5) * 100}%`,
                                        backgroundColor: '#28a745'
                                    }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export const getServerSideProps = withAuth(async (context) => {
    const { id } = context.params;

    try {
        // Get course with creator info
        const courseRes = await pool.query(
            'SELECT c.*, u.full_name as created_by_name FROM courses c JOIN users u ON c.created_by = u.id WHERE c.id = $1', 
            [id]
        );
        if (courseRes.rows.length === 0) {
            return { notFound: true };
        }

        // Get course schedule
        const scheduleRes = await pool.query(
            'SELECT * FROM course_schedule WHERE course_id = $1 ORDER BY day_number', 
            [id]
        );

        // Get tasks
        const tasksRes = await pool.query(
            'SELECT t.* FROM tasks t JOIN course_schedule cs ON t.schedule_id = cs.id WHERE cs.course_id = $1', 
            [id]
        );

        // Get exams for this course
        let examsRes = { rows: [] };
        try {
            examsRes = await pool.query(
                'SELECT * FROM exams WHERE course_id = $1 ORDER BY day_number', 
                [id]
            );
            console.log(`Found ${examsRes.rows.length} exams for course ${id}:`, examsRes.rows);
        } catch (error) {
            console.log('Exams query failed:', error.message);
            // Try alternative query if exams table doesn't exist
            try {
                examsRes = await pool.query(
                    'SELECT * FROM exams WHERE course_id = $1 ORDER BY day_number', 
                    [id]
                );
                console.log(`Found ${examsRes.rows.length} exams for course ${id}:`, examsRes.rows);
            } catch (altError) {
                console.log('Alternative exams query also failed:', altError.message);
            }
        }

        // Get supervisor/creator details
        const supervisorRes = await pool.query(
            'SELECT id, full_name, role, email FROM users WHERE id = $1', 
            [courseRes.rows[0].created_by]
        );

        // Get course messages
        let messagesRes = { rows: [] };
        try {
            messagesRes = await pool.query(`
                SELECT 
                    cm.*,
                    u.full_name as author_name,
                    u.role as author_role
                FROM course_messages cm
                JOIN users u ON cm.user_id = u.id
                WHERE cm.course_id = $1 AND cm.parent_message_id IS NULL
                ORDER BY cm.created_at DESC
                LIMIT 20`,
                [id]
            );
        } catch (error) {
            console.log('Messages query failed:', error.message);
        }

        return {
            props: {
                user: context.user,
                course: JSON.parse(JSON.stringify(courseRes.rows[0])),
                schedule: JSON.parse(JSON.stringify(scheduleRes.rows)),
                tasks: JSON.parse(JSON.stringify(tasksRes.rows)),
                exams: JSON.parse(JSON.stringify(examsRes.rows)),
                supervisor: supervisorRes.rows.length > 0 ? JSON.parse(JSON.stringify(supervisorRes.rows[0])) : null,
                messages: JSON.parse(JSON.stringify(messagesRes.rows)),
            },
        };
    } catch (error) {
        console.error('Error fetching course data:', error);
        return { notFound: true };
    }
});

export default CourseDetailPage;