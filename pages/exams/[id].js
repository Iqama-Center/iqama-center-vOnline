import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import { withAuth } from '../../lib/withAuth';
import pool from '../../lib/db';
import { useRouter } from 'next/router';

const ExamPage = ({ user, exam, course }) => {
    const router = useRouter();
    const [timeRemaining, setTimeRemaining] = useState(null);
    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (exam && exam.time_limit) {
            // Set timer based on time_limit (in minutes)
            const timeLimit = exam.time_limit * 60 * 1000; // Convert to milliseconds
            setTimeRemaining(timeLimit);
            
            const timer = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1000) {
                        clearInterval(timer);
                        handleSubmit(); // Auto-submit when time runs out
                        return 0;
                    }
                    return prev - 1000;
                });
            }, 1000);
            
            return () => clearInterval(timer);
        }
    }, [exam, handleSubmit]);

    const formatTime = (milliseconds) => {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleAnswerChange = (questionId, answer) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: answer
        }));
    };

    const handleSubmit = useCallback(async () => {
        if (submitted) return; // Prevent double submission
        if (!window.confirm('هل أنت متأكد من إرسال إجاباتك؟ لن تتمكن من التعديل بعد الإرسال.')) {
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`/api/exams/take`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    examId: exam.id,
                    answers
                })
            });

            const result = await response.json();
            if (response.ok) {
                setSubmitted(true);
                alert(`تم إرسال إجاباتك بنجاح! النتيجة: ${result.score}%`);
            } else {
                alert('حدث خطأ في إرسال الإجابات: ' + result.message);
            }
        } catch (error) {
            alert('حدث خطأ في الاتصال بالخادم');
        } finally {
            setLoading(false);
        }
    }, [exam, answers, submitted]);

    if (!exam) {
        return (
            <Layout user={user}>
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <h2>الامتحان غير موجود</h2>
                    <button onClick={() => router.back()}>العودة</button>
                </div>
            </Layout>
        );
    }

    // Check exam availability based on database schema

    if (!exam.is_active) {
        return (
            <Layout user={user}>
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <h2>الامتحان غير متاح حالياً</h2>
                    <p>الامتحان متاح للدورة</p>
                    <button onClick={() => router.back()}>العودة</button>
                </div>
            </Layout>
        );
    }

    // Check if user has exceeded max attempts
    // This logic is now handled on the server-side in the /api/exams/take endpoint
    /*
    if (attempts >= exam.max_attempts) {
        return (
            <Layout user={user}>
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <h2>تم استنفاد عدد المحاولات المسموحة</h2>
                    <p>عدد المحاولات المسموحة: {exam.max_attempts}</p>
                    <button onClick={() => router.back()}>العودة</button>
                </div>
            </Layout>
        );
    }
    */

    if (submitted) {
        return (
            <Layout user={user}>
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <h2>تم إرسال إجاباتك بنجاح</h2>
                    <p>شكراً لك على أداء الامتحان</p>
                    <button onClick={() => router.push(`/courses/${course?.id || ''}`)}>العودة للدورة</button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout user={user}>
            <style jsx>{`
                .exam-header {
                    background: #007bff;
                    color: white;
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .timer {
                    background: #dc3545;
                    padding: 10px 20px;
                    border-radius: 5px;
                    font-weight: bold;
                    font-size: 18px;
                }
                .question-card {
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                .question-title {
                    font-size: 18px;
                    font-weight: bold;
                    margin-bottom: 15px;
                    color: #333;
                }
                .option {
                    margin: 10px 0;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .option:hover {
                    background: #f8f9fa;
                }
                .option.selected {
                    background: #007bff;
                    color: white;
                    border-color: #007bff;
                }
                .submit-section {
                    text-align: center;
                    padding: 30px;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                .submit-btn {
                    background: #28a745;
                    color: white;
                    border: none;
                    padding: 15px 30px;
                    border-radius: 5px;
                    font-size: 16px;
                    cursor: pointer;
                }
                .submit-btn:disabled {
                    background: #6c757d;
                    cursor: not-allowed;
                }
                .answer-input {
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    font-size: 14px;
                }
            `}</style>

            <div className="exam-header">
                <div>
                    <h1>{exam.title}</h1>
                    <p>الدورة: {course?.name || 'غير محدد'}</p>
                </div>
                {timeRemaining !== null && (
                    <div className="timer">
                        الوقت المتبقي: {formatTime(timeRemaining)}
                    </div>
                )}
            </div>

            {exam.questions && exam.questions.map((question, index) => (
                <div key={question.id || index} className="question-card">
                    <div className="question-title">
                        السؤال {index + 1}: {question.question_text}
                    </div>
                    
                    {question.question_type === 'multiple_choice' && (
                        <div>
                            {question.options.map((option, optionIndex) => (
                                <div
                                    key={optionIndex}
                                    className={`option ${answers[question.id] === option ? 'selected' : ''}`}
                                    onClick={() => handleAnswerChange(question.id, option)}
                                >
                                    {option}
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {question.question_type === 'true_false' && (
                        <div>
                            <div
                                className={`option ${answers[question.id] === 'true' ? 'selected' : ''}`}
                                onClick={() => handleAnswerChange(question.id, 'true')}
                            >
                                صحيح
                            </div>
                            <div
                                className={`option ${answers[question.id] === 'false' ? 'selected' : ''}`}
                                onClick={() => handleAnswerChange(question.id, 'false')}
                            >
                                خطأ
                            </div>
                        </div>
                    )}
                    
                    {(question.question_type === 'short_answer' || question.question_type === 'essay') && (
                        <textarea
                            className="answer-input"
                            rows={question.question_type === 'essay' ? 6 : 3}
                            placeholder="اكتب إجابتك هنا..."
                            value={answers[question.id] || ''}
                            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        />
                    )}
                    
                    <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                        النقاط: {question.points || 1}
                    </div>
                </div>
            ))}

            <div className="submit-section">
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="submit-btn"
                >
                    {loading ? 'جاري الإرسال...' : 'إرسال الإجابات'}
                </button>
                <p style={{ marginTop: '15px', color: '#666' }}>
                    تأكد من مراجعة جميع إجاباتك قبل الإرسال
                </p>
            </div>
        </Layout>
    );
};

export const getServerSideProps = withAuth(async (context) => {
    const { id } = context.params;

    try {
        // Get exam details with questions
        const examRes = await pool.query(`
            SELECT e.*, 
                   (SELECT jsonb_agg(eq.*) FROM exam_questions eq WHERE eq.exam_id = e.id) as questions
            FROM exams e 
            WHERE e.id = $1
        `, [id]);
        if (examRes.rows.length === 0) {
            return { notFound: true };
        }

        const exam = examRes.rows[0];

        // Get course details
        const courseRes = await pool.query('SELECT id, name FROM courses WHERE id = $1', [exam.course_id]);
        
        // No need to parse questions anymore as they are aggregated in the query
        /*
        if (exam.questions) {
            try {
                // This is a JSONB field in the database, so it should already be an object.
                // No need to parse if the database driver handles it correctly.
                // exam.questions = JSON.parse(exam.questions);
            } catch (error) {
                console.error('Error parsing exam questions:', error);
                exam.questions = [];
            }
        }
        */

        return {
            props: {
                user: context.user,
                exam: JSON.parse(JSON.stringify(exam)),
                course: courseRes.rows.length > 0 ? JSON.parse(JSON.stringify(courseRes.rows[0])) : null,
            },
        };
    } catch (error) {
        console.error('Error fetching exam:', error);
        return { notFound: true };
    }
});

export default ExamPage;