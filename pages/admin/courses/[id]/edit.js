import React, { useState } from 'react';
import Layout from '../../../../components/Layout';
import CourseForm from '../../../../components/CourseForm';
import ExamQuestionManager from '../../../../components/ExamQuestionManager';
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';
import pool from '../../../../lib/db';

const EditCoursePage = ({ user, course, exams }) => {
    const [activeTab, setActiveTab] = useState('course');
    const [currentExam, setCurrentExam] = useState(null);
    const [showCreateExam, setShowCreateExam] = useState(false);
    const [examForm, setExamForm] = useState({
        title: '',
        description: '',
        timeLimit: 60,
        dayNumber: 1,
        maxAttempts: 1,
        passingScore: 60
    });

    const handleCreateExam = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/exams/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    courseId: course.id,
                    ...examForm
                })
            });

            if (response.ok) {
                const result = await response.json();
                alert('تم إنشاء الامتحان بنجاح');
                setCurrentExam(result.exam);
                setActiveTab('questions');
                setShowCreateExam(false);
                // Refresh page to show new exam
                window.location.reload();
            } else {
                const error = await response.json();
                alert('خطأ في إنشاء الامتحان: ' + (error.message || 'خطأ غير معروف'));
            }
        } catch (error) {
            console.error('Exam creation error:', error);
            alert('حدث خطأ في الاتصال بالخادم: ' + (error.message || 'خطأ غير معروف'));
        }
    };

    return (
        <Layout user={user}>
            <style jsx>{`
                .tabs {
                    display: flex;
                    border-bottom: 2px solid #ddd;
                    margin-bottom: 20px;
                }
                .tab {
                    padding: 10px 20px;
                    cursor: pointer;
                    border: none;
                    background: none;
                    font-size: 16px;
                    border-bottom: 3px solid transparent;
                }
                .tab.active {
                    border-bottom-color: #007bff;
                    color: #007bff;
                    font-weight: bold;
                }
                .tab:hover {
                    background: #f8f9fa;
                }
                .exam-list {
                    display: grid;
                    gap: 15px;
                    margin-bottom: 20px;
                }
                .exam-card {
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    padding: 15px;
                    background: white;
                }
                .exam-card h4 {
                    margin: 0 0 10px 0;
                    color: #333;
                }
                .exam-meta {
                    font-size: 14px;
                    color: #666;
                    margin-bottom: 10px;
                }
                .exam-actions {
                    display: flex;
                    gap: 10px;
                }
                .btn {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    text-decoration: none;
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                }
                .btn-primary { background: #007bff; color: white; }
                .btn-success { background: #28a745; color: white; }
                .btn-secondary { background: #6c757d; color: white; }
                .create-exam-form {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                }
                .form-group {
                    margin-bottom: 15px;
                }
                .form-control {
                    width: 100%;
                    padding: 8px 12px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                }
                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                }
            `}</style>

            <h1><i className="fas fa-edit fa-fw"></i> تعديل الدورة: {course.name}</h1>
            
            <div className="tabs">
                <button 
                    className={`tab ${activeTab === 'course' ? 'active' : ''}`}
                    onClick={() => setActiveTab('course')}
                >
                    <i className="fas fa-book"></i> تفاصيل الدورة
                </button>
                <button 
                    className={`tab ${activeTab === 'exams' ? 'active' : ''}`}
                    onClick={() => setActiveTab('exams')}
                >
                    <i className="fas fa-clipboard-check"></i> الاختبارات ({exams?.length || 0})
                </button>
                {currentExam && (
                    <button 
                        className={`tab ${activeTab === 'questions' ? 'active' : ''}`}
                        onClick={() => setActiveTab('questions')}
                    >
                        <i className="fas fa-question-circle"></i> أسئلة الامتحان
                    </button>
                )}
            </div>

            {activeTab === 'course' && (
                <CourseForm course={course} />
            )}

            {activeTab === 'exams' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2>اختبارات الدورة</h2>
                        <button 
                            onClick={() => setShowCreateExam(!showCreateExam)}
                            className="btn btn-primary"
                        >
                            <i className="fas fa-plus"></i> إنشاء اختبار جديد
                        </button>
                    </div>

                    {showCreateExam && (
                        <div className="create-exam-form">
                            <h3>إنشاء اختبار جديد</h3>
                            <form onSubmit={handleCreateExam}>
                                <div className="form-group">
                                    <label>عنوان الاختبار:</label>
                                    <input
                                        type="text"
                                        value={examForm.title}
                                        onChange={(e) => setExamForm({...examForm, title: e.target.value})}
                                        className="form-control"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>وصف الاختبار:</label>
                                    <textarea
                                        value={examForm.description}
                                        onChange={(e) => setExamForm({...examForm, description: e.target.value})}
                                        className="form-control"
                                        rows="3"
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>مدة الاختبار (بالدقائق):</label>
                                        <input
                                            type="number"
                                            value={examForm.timeLimit}
                                            onChange={(e) => setExamForm({...examForm, timeLimit: parseInt(e.target.value)})}
                                            className="form-control"
                                            min="5"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>عدد المحاولات المسموحة:</label>
                                        <input
                                            type="number"
                                            value={examForm.maxAttempts}
                                            onChange={(e) => setExamForm({...examForm, maxAttempts: parseInt(e.target.value)})}
                                            className="form-control"
                                            min="1"
                                        />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>رقم اليوم:</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={examForm.dayNumber}
                                            onChange={(e) => setExamForm({...examForm, dayNumber: parseInt(e.target.value)})}
                                            className="form-control"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>درجة النجاح (%):</label>
                                    <input
                                        type="number"
                                        value={examForm.passingScore}
                                        onChange={(e) => setExamForm({...examForm, passingScore: parseInt(e.target.value)})}
                                        className="form-control"
                                        min="0"
                                        max="100"
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button type="submit" className="btn btn-success">
                                        إنشاء الاختبار
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => setShowCreateExam(false)}
                                        className="btn btn-secondary"
                                    >
                                        إلغاء
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="exam-list">
                        {exams && exams.length > 0 ? (
                            exams.map(exam => (
                                <div key={exam.id} className="exam-card">
                                    <h4>{exam.title}</h4>
                                    <div className="exam-meta">
                                        <p><strong>المدة:</strong> {exam.time_limit} دقيقة</p>
                                        <p><strong>رقم اليوم:</strong> {exam.day_number}</p>
                                        <p><strong>درجة النجاح:</strong> {exam.passing_score}%</p>
                                        <p><strong>عدد المحاولات:</strong> {exam.max_attempts}</p>
                                    </div>
                                    <div className="exam-actions">
                                        <button 
                                            onClick={() => {
                                                setCurrentExam(exam);
                                                setActiveTab('questions');
                                            }}
                                            className="btn btn-primary"
                                        >
                                            <i className="fas fa-question-circle"></i> إدارة الأسئلة
                                        </button>
                                        <a href={`/exams/${exam.id}`} className="btn btn-secondary" target="_blank">
                                            <i className="fas fa-eye"></i> معاينة الاختبار
                                        </a>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                                <i className="fas fa-clipboard-check" style={{ fontSize: '48px', marginBottom: '20px' }}></i>
                                <h3>لا توجد اختبارات</h3>
                                <p>لم يتم إنشاء أي اختبارات لهذه الدورة بعد</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'questions' && currentExam && (
                <div>
                    <h2>أسئلة الاختبار: {currentExam.title}</h2>
                    <ExamQuestionManager examId={currentExam.id} />
                </div>
            )}
        </Layout>
    );
};

export async function getServerSideProps(context) {
    const { req, params } = context;
    const { id } = params;
    const cookies = parse(req.headers.cookie || '');
    const token = cookies.token;

    if (!token) {
        return { redirect: { destination: '/login', permanent: false } };
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!['admin', 'head'].includes(decoded.role)) {
            return { props: { error: 'غير مصرح لك.' } };
        }
        const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.id]);
        const courseResult = await pool.query('SELECT * FROM courses WHERE id = $1', [id]);
        
        // Get exams for this course
        let examsResult = { rows: [] };
        try {
            examsResult = await pool.query('SELECT * FROM exams WHERE course_id = $1 ORDER BY day_number', [id]);
        } catch (error) {
            console.log('Exams query failed in edit page:', error.message);
        }

        return {
            props: {
                user: JSON.parse(JSON.stringify(userResult.rows[0])),
                course: JSON.parse(JSON.stringify(courseResult.rows[0])),
                exams: JSON.parse(JSON.stringify(examsResult.rows))
            }
        };
    } catch (err) {
        return { redirect: { destination: '/login', permanent: false } };
    }
}

export default EditCoursePage;
