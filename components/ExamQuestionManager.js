import React, { useState, useEffect, useCallback } from 'react';

const ExamQuestionManager = ({ examId, onQuestionsUpdated }) => {
    const [questions, setQuestions] = useState([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [showImportForm, setShowImportForm] = useState(false);
    const [jsonImport, setJsonImport] = useState('');
    const [editedQuestions, setEditedQuestions] = useState({});
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [formData, setFormData] = useState({
        questionText: '',
        questionType: 'multiple_choice',
        options: ['', '', '', ''],
        correctAnswer: '',
        points: 1,
        questionOrder: 1
    });

    useEffect(() => {
        if (examId) {
            fetchQuestions();
        }
    }, [examId, fetchQuestions]);

    const fetchQuestions = useCallback(async () => {
        try {
            const response = await fetch(`/api/exams/questions?examId=${examId}`);
            if (response.ok) {
                const data = await response.json();
                setQuestions(data);
            } else {
                console.error('Failed to fetch questions:', response.status);
                setMessage({ text: 'فشل في تحميل الأسئلة', type: 'error' });
            }
        } catch (error) {
            console.error('Error fetching questions:', error);
            setMessage({ text: 'خطأ في تحميل الأسئلة: ' + (error.message || 'خطأ غير معروف'), type: 'error' });
        }
    }, [examId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const url = editingQuestion 
                ? '/api/exams/questions'
                : '/api/exams/questions';
            
            const method = editingQuestion ? 'PUT' : 'POST';
            const body = editingQuestion 
                ? { id: editingQuestion.id, ...formData }
                : { examId, ...formData };

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const result = await response.json();
            
            if (response.ok) {
                setMessage({ text: result.message, type: 'success' });
                setShowCreateForm(false);
                setEditingQuestion(null);
                fetchQuestions();
                resetForm();
                if (onQuestionsUpdated) onQuestionsUpdated();
            } else {
                setMessage({ text: result.message, type: 'error' });
            }
        } catch (error) {
            console.error('Submit error:', error);
            setMessage({ text: 'حدث خطأ في الاتصال بالخادم: ' + (error.message || 'خطأ غير معروف'), type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (questionId) => {
        if (!window.confirm('هل أنت متأكد من حذف هذا السؤال؟')) return;

        try {
            const response = await fetch(`/api/exams/questions?id=${questionId}`, {
                method: 'DELETE'
            });

            const result = await response.json();
            
            if (response.ok) {
                setMessage({ text: result.message, type: 'success' });
                fetchQuestions();
                if (onQuestionsUpdated) onQuestionsUpdated();
            } else {
                setMessage({ text: result.message, type: 'error' });
            }
        } catch (error) {
            console.error('Delete error:', error);
            setMessage({ text: 'حدث خطأ في الاتصال بالخادم: ' + (error.message || 'خطأ غير معروف'), type: 'error' });
        }
    };

    const handleEdit = (question) => {
        setEditingQuestion(question);
        setFormData({
            questionText: question.question_text,
            questionType: question.question_type,
            options: JSON.parse(question.options || '["", "", "", ""]'),
            correctAnswer: question.correct_answer,
            points: question.points,
            questionOrder: question.question_order
        });
        setShowCreateForm(true);
    };

    const resetForm = () => {
        setFormData({
            questionText: '',
            questionType: 'multiple_choice',
            options: ['', '', '', ''],
            correctAnswer: '',
            points: 1,
            questionOrder: questions.length + 1
        });
    };

    const updateOption = (index, value) => {
        const newOptions = [...formData.options];
        newOptions[index] = value;
        setFormData({ ...formData, options: newOptions });
    };

    const handleImportQuestions = async () => {
        if (!jsonImport.trim()) {
            setMessage({ text: 'يرجى إدخال JSON صحيح', type: 'error' });
            return;
        }

        try {
            const parsedQuestions = JSON.parse(jsonImport);
            
            if (!Array.isArray(parsedQuestions)) {
                setMessage({ text: 'تنسيق JSON غير صحيح - يجب أن يكون مصفوفة من الأسئلة', type: 'error' });
                return;
            }

            setLoading(true);

            // Import each question
            let successCount = 0;
            let errorCount = 0;
            
            for (const question of parsedQuestions) {
                const questionData = {
                    examId,
                    questionText: question.question,
                    questionType: question.type,
                    options: question.options || [],
                    correctAnswer: question.correctAnswer,
                    points: question.points || 1,
                    questionOrder: question.id || 1
                };

                console.log('Importing question:', questionData); // Debug log

                try {
                    const response = await fetch('/api/exams/questions', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(questionData)
                    });

                    if (response.ok) {
                        successCount++;
                    } else {
                        const errorData = await response.json();
                        console.error('Failed to import question:', errorData);
                        errorCount++;
                    }
                } catch (error) {
                    console.error('Error importing question:', error);
                    errorCount++;
                }
            }

            if (successCount > 0) {
                setMessage({ 
                    text: `تم استيراد ${successCount} سؤال بنجاح${errorCount > 0 ? ` (فشل ${errorCount})` : ''}`, 
                    type: successCount === parsedQuestions.length ? 'success' : 'warning' 
                });
            } else {
                setMessage({ text: 'فشل في استيراد الأسئلة', type: 'error' });
            }
            setShowImportForm(false);
            setJsonImport('');
            fetchQuestions();
            if (onQuestionsUpdated) onQuestionsUpdated();

        } catch (error) {
            console.error('Import error:', error);
            setMessage({ text: 'خطأ في تنسيق JSON أو في الاستيراد: ' + (error.message || 'خطأ غير معروف'), type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleQuestionEdit = (questionId, field, value) => {
        setEditedQuestions(prev => ({
            ...prev,
            [questionId]: {
                ...prev[questionId],
                [field]: value
            }
        }));
        setHasUnsavedChanges(true);
    };

    const handleSaveAllChanges = async () => {
        if (Object.keys(editedQuestions).length === 0) {
            setMessage({ text: 'لا توجد تغييرات للحفظ', type: 'warning' });
            return;
        }

        setLoading(true);
        let successCount = 0;
        let errorCount = 0;

        try {
            for (const [questionId, changes] of Object.entries(editedQuestions)) {
                const originalQuestion = questions.find(q => q.id == questionId);
                if (!originalQuestion) continue;

                const updatedData = {
                    id: questionId,
                    questionText: changes.question_text || originalQuestion.question_text,
                    questionType: changes.question_type || originalQuestion.question_type,
                    options: changes.options ? JSON.parse(changes.options) : JSON.parse(originalQuestion.options || '[]'),
                    correctAnswer: changes.correct_answer || originalQuestion.correct_answer,
                    points: changes.points || originalQuestion.points,
                    questionOrder: changes.question_order || originalQuestion.question_order
                };

                try {
                    const response = await fetch('/api/exams/questions', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updatedData)
                    });

                    if (response.ok) {
                        successCount++;
                    } else {
                        errorCount++;
                        console.error('Failed to update question:', questionId);
                    }
                } catch (error) {
                    errorCount++;
                    console.error('Error updating question:', questionId, error);
                }
            }

            if (successCount > 0) {
                setMessage({ 
                    text: `تم حفظ ${successCount} سؤال بنجاح${errorCount > 0 ? ` (فشل ${errorCount})` : ''}`, 
                    type: successCount === Object.keys(editedQuestions).length ? 'success' : 'warning' 
                });
                setEditedQuestions({});
                setHasUnsavedChanges(false);
                fetchQuestions();
                if (onQuestionsUpdated) onQuestionsUpdated();
            } else {
                setMessage({ text: 'فشل في حفظ التغييرات', type: 'error' });
            }
        } catch (error) {
            console.error('Bulk save error:', error);
            setMessage({ text: 'حدث خطأ في حفظ التغييرات: ' + (error.message || 'خطأ غير معروف'), type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const downloadTemplate = () => {
        const template = [
            {
                "id": 1,
                "question": "ما هو عدد أركان الإسلام؟",
                "type": "multiple_choice",
                "options": ["ثلاثة أركان", "أربعة أركان", "خمسة أركان", "ستة أركان"],
                "correctAnswer": "خمسة أركان",
                "points": 2
            },
            {
                "id": 2,
                "question": "الصلاة هي الركن الثاني من أركان الإسلام",
                "type": "true_false",
                "options": ["صحيح", "خطأ"],
                "correctAnswer": "صحيح",
                "points": 1
            },
            {
                "id": 3,
                "question": "اذكر الركن الأول من أركان الإسلام",
                "type": "short_answer",
                "options": [],
                "correctAnswer": "الشهادتان",
                "points": 2
            }
        ];

        const dataStr = JSON.stringify(template, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'exam_questions_template.json';
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="exam-question-manager">
            <div className="questions-header">
                <h3>إدارة أسئلة الامتحان</h3>
                <div className="header-buttons">
                    <button 
                        onClick={() => {
                            setShowCreateForm(!showCreateForm);
                            setEditingQuestion(null);
                            resetForm();
                        }}
                        className="btn btn-primary"
                    >
                        <i className="fas fa-plus"></i> إضافة سؤال جديد
                    </button>
                    <button 
                        onClick={() => setShowImportForm(!showImportForm)}
                        className="btn btn-info"
                    >
                        <i className="fas fa-upload"></i> استيراد أسئلة من JSON
                    </button>
                    <button 
                        onClick={downloadTemplate}
                        className="btn btn-success"
                    >
                        <i className="fas fa-download"></i> تحميل قالب JSON
                    </button>
                    {hasUnsavedChanges && (
                        <button 
                            onClick={handleSaveAllChanges}
                            disabled={loading}
                            className="btn btn-warning"
                        >
                            <i className="fas fa-save"></i> حفظ جميع التغييرات ({Object.keys(editedQuestions).length})
                        </button>
                    )}
                </div>
            </div>

            {message && message.text && (
                <div className={`alert alert-${message.type}`}>
                    {message.text}
                    <button onClick={() => setMessage(null)} className="alert-close">×</button>
                </div>
            )}

            {showImportForm && (
                <div className="import-form">
                    <h4>استيراد أسئلة من JSON</h4>
                    <div className="form-group">
                        <label>الصق محتوى JSON هنا:</label>
                        <textarea
                            value={jsonImport}
                            onChange={(e) => setJsonImport(e.target.value)}
                            className="form-control json-textarea"
                            rows="10"
                            placeholder='[
  {
    "id": 1,
    "question": "ما هو عدد أركان الإسلام؟",
    "type": "multiple_choice",
    "options": ["ثلاثة أركان", "أربعة أركان", "خمسة أركان", "ستة أركان"],
    "correctAnswer": "خمسة أركان",
    "points": 2
  }
]'
                        />
                    </div>
                    <div className="import-actions">
                        <button 
                            onClick={handleImportQuestions}
                            disabled={loading}
                            className="btn btn-success"
                        >
                            {loading ? 'جاري الاستيراد...' : 'استيراد الأسئلة'}
                        </button>
                        <button 
                            onClick={() => {
                                setShowImportForm(false);
                                setJsonImport('');
                            }}
                            className="btn btn-secondary"
                        >
                            إلغاء
                        </button>
                    </div>
                </div>
            )}

            {showCreateForm && (
                <div className="question-form">
                    <h4>{editingQuestion ? 'تعديل السؤال' : 'إضافة سؤال جديد'}</h4>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>نص السؤال:</label>
                            <textarea
                                value={formData.questionText}
                                onChange={(e) => setFormData({...formData, questionText: e.target.value})}
                                required
                                className="form-control"
                                rows="3"
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>نوع السؤال:</label>
                                <select
                                    value={formData.questionType}
                                    onChange={(e) => setFormData({...formData, questionType: e.target.value})}
                                    className="form-control"
                                >
                                    <option value="multiple_choice">اختيار من متعدد</option>
                                    <option value="true_false">صح أو خطأ</option>
                                    <option value="short_answer">إجابة قصيرة</option>
                                    <option value="essay">مقال</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>النقاط:</label>
                                <input
                                    type="number"
                                    value={formData.points}
                                    onChange={(e) => setFormData({...formData, points: parseFloat(e.target.value)})}
                                    className="form-control"
                                    min="0.5"
                                    step="0.5"
                                />
                            </div>
                        </div>

                        {(formData.questionType === 'multiple_choice' || formData.questionType === 'true_false') && (
                            <div className="options-section">
                                <label>الخيارات:</label>
                                {formData.questionType === 'true_false' ? (
                                    <div className="true-false-options">
                                        <label>
                                            <input
                                                type="radio"
                                                name="correctAnswer"
                                                value="true"
                                                checked={formData.correctAnswer === 'true'}
                                                onChange={(e) => setFormData({...formData, correctAnswer: e.target.value})}
                                            />
                                            صحيح
                                        </label>
                                        <label>
                                            <input
                                                type="radio"
                                                name="correctAnswer"
                                                value="false"
                                                checked={formData.correctAnswer === 'false'}
                                                onChange={(e) => setFormData({...formData, correctAnswer: e.target.value})}
                                            />
                                            خطأ
                                        </label>
                                    </div>
                                ) : (
                                    formData.options.map((option, index) => (
                                        <div key={index} className="option-input">
                                            <input
                                                type="text"
                                                value={option}
                                                onChange={(e) => updateOption(index, e.target.value)}
                                                placeholder={`الخيار ${index + 1}`}
                                                className="form-control"
                                            />
                                            <label>
                                                <input
                                                    type="radio"
                                                    name="correctAnswer"
                                                    value={option}
                                                    checked={formData.correctAnswer === option}
                                                    onChange={(e) => setFormData({...formData, correctAnswer: e.target.value})}
                                                />
                                                الإجابة الصحيحة
                                            </label>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {(formData.questionType === 'short_answer' || formData.questionType === 'essay') && (
                            <div className="form-group">
                                <label>الإجابة النموذجية:</label>
                                <textarea
                                    value={formData.correctAnswer}
                                    onChange={(e) => setFormData({...formData, correctAnswer: e.target.value})}
                                    className="form-control"
                                    rows="2"
                                    placeholder="اختياري - للمراجعة"
                                />
                            </div>
                        )}

                        <div className="form-actions">
                            <button type="submit" disabled={loading} className="btn btn-success">
                                {loading ? 'جاري الحفظ...' : (editingQuestion ? 'تحديث السؤال' : 'إضافة السؤال')}
                            </button>
                            <button 
                                type="button" 
                                onClick={() => {
                                    setShowCreateForm(false);
                                    setEditingQuestion(null);
                                }}
                                className="btn btn-secondary"
                            >
                                إلغاء
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="questions-list">
                {questions.length === 0 ? (
                    <p>لا توجد أسئلة في هذا الامتحان</p>
                ) : (
                    questions.map((question, index) => (
                        <div key={question.id} className="question-card">
                            <div className="question-header">
                                <span className="question-number">السؤال {index + 1}</span>
                                <input
                                    type="number"
                                    value={editedQuestions[question.id]?.points || question.points}
                                    onChange={(e) => handleQuestionEdit(question.id, 'points', parseFloat(e.target.value))}
                                    className="points-input"
                                    min="0.5"
                                    step="0.5"
                                />
                                <span>نقطة</span>
                            </div>
                            <div className="question-content">
                                <textarea
                                    value={editedQuestions[question.id]?.question_text || question.question_text}
                                    onChange={(e) => handleQuestionEdit(question.id, 'question_text', e.target.value)}
                                    className="question-text-input"
                                    rows="2"
                                />
                                <p><small>النوع: {question.question_type}</small></p>
                                
                                {question.options && JSON.parse(question.options).length > 0 && (
                                    <div className="question-options">
                                        {JSON.parse(editedQuestions[question.id]?.options || question.options).map((option, idx) => {
                                            const currentCorrectAnswer = editedQuestions[question.id]?.correct_answer || question.correct_answer;
                                            return (
                                                <div key={idx} className="option-edit">
                                                    <input
                                                        type="text"
                                                        value={option}
                                                        onChange={(e) => {
                                                            const newOptions = [...JSON.parse(editedQuestions[question.id]?.options || question.options)];
                                                            newOptions[idx] = e.target.value;
                                                            handleQuestionEdit(question.id, 'options', JSON.stringify(newOptions));
                                                        }}
                                                        className="option-input-edit"
                                                    />
                                                    <label className="correct-answer-radio">
                                                        <input
                                                            type="radio"
                                                            name={`correct_${question.id}`}
                                                            checked={option === currentCorrectAnswer}
                                                            onChange={() => handleQuestionEdit(question.id, 'correct_answer', option)}
                                                        />
                                                        <span className={option === currentCorrectAnswer ? 'correct-mark' : ''}>
                                                            {option === currentCorrectAnswer ? '✅' : '⭕'}
                                                        </span>
                                                    </label>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                                
                                {(question.question_type === 'short_answer' || question.question_type === 'essay') && (
                                    <div className="correct-answer-input">
                                        <label>الإجابة الصحيحة:</label>
                                        <textarea
                                            value={editedQuestions[question.id]?.correct_answer || question.correct_answer || ''}
                                            onChange={(e) => handleQuestionEdit(question.id, 'correct_answer', e.target.value)}
                                            className="answer-input-edit"
                                            rows="2"
                                            placeholder="الإجابة النموذجية..."
                                        />
                                    </div>
                                )}
                                
                                {question.question_type === 'true_false' && (
                                    <div className="true-false-options">
                                        <label>
                                            <input
                                                type="radio"
                                                name={`tf_${question.id}`}
                                                checked={(editedQuestions[question.id]?.correct_answer || question.correct_answer) === 'صحيح'}
                                                onChange={() => handleQuestionEdit(question.id, 'correct_answer', 'صحيح')}
                                            />
                                            صحيح ✅
                                        </label>
                                        <label>
                                            <input
                                                type="radio"
                                                name={`tf_${question.id}`}
                                                checked={(editedQuestions[question.id]?.correct_answer || question.correct_answer) === 'خطأ'}
                                                onChange={() => handleQuestionEdit(question.id, 'correct_answer', 'خطأ')}
                                            />
                                            خطأ ✅
                                        </label>
                                    </div>
                                )}
                                
                                {!question.correct_answer && !editedQuestions[question.id]?.correct_answer && (
                                    <div style={{ color: 'red', fontSize: '12px', marginTop: '5px' }}>
                                        ⚠️ لم يتم تحديد الإجابة الصحيحة
                                    </div>
                                )}
                            </div>
                            <div className="question-actions">
                                <button onClick={() => handleEdit(question)} className="btn btn-sm btn-secondary">
                                    <i className="fas fa-edit"></i> تعديل متقدم
                                </button>
                                <button onClick={() => handleDelete(question.id)} className="btn btn-sm btn-danger">
                                    <i className="fas fa-trash"></i> حذف
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <style jsx>{`
                .exam-question-manager {
                    background: white;
                    border-radius: 8px;
                    padding: 20px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }

                .questions-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    padding-bottom: 10px;
                    border-bottom: 1px solid #eee;
                }

                .header-buttons {
                    display: flex;
                    gap: 10px;
                }

                .import-form {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 6px;
                    margin-bottom: 20px;
                    border: 2px solid #007bff;
                }

                .json-textarea {
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                    background: #fff;
                    border: 1px solid #ddd;
                }

                .import-actions {
                    display: flex;
                    gap: 10px;
                    margin-top: 15px;
                }

                .question-form {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 6px;
                    margin-bottom: 20px;
                }

                .form-group {
                    margin-bottom: 15px;
                }

                .form-row {
                    display: grid;
                    grid-template-columns: 2fr 1fr;
                    gap: 15px;
                }

                .form-control {
                    width: 100%;
                    padding: 8px 12px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 14px;
                }

                .options-section {
                    margin-bottom: 15px;
                }

                .option-input {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 10px;
                }

                .true-false-options {
                    display: flex;
                    gap: 20px;
                    margin-top: 10px;
                }

                .question-card {
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    padding: 15px;
                    margin-bottom: 15px;
                }

                .question-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                    font-weight: bold;
                }

                .question-options {
                    margin-top: 10px;
                }

                .option {
                    padding: 5px 10px;
                    margin: 5px 0;
                    background: #f8f9fa;
                    border-radius: 4px;
                    font-size: 14px;
                }

                .option.correct {
                    background: #d4edda;
                    color: #155724;
                    font-weight: bold;
                }

                .question-actions {
                    display: flex;
                    gap: 10px;
                    margin-top: 15px;
                }

                .btn {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                }

                .btn-sm {
                    padding: 5px 10px;
                    font-size: 12px;
                }

                .btn-primary { background: #007bff; color: white; }
                .btn-success { background: #28a745; color: white; }
                .btn-secondary { background: #6c757d; color: white; }
                .btn-danger { background: #dc3545; color: white; }
                .btn-info { background: #17a2b8; color: white; }
                .btn-warning { background: #ffc107; color: #212529; }
                .btn:disabled { opacity: 0.6; cursor: not-allowed; }

                .alert {
                    padding: 10px 15px;
                    border-radius: 4px;
                    margin-bottom: 15px;
                    position: relative;
                }

                .alert-success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
                .alert-error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
                .alert-warning { background: #fff3cd; color: #856404; border: 1px solid #ffeaa7; }

                .alert-close {
                    position: absolute;
                    top: 5px;
                    right: 10px;
                    background: none;
                    border: none;
                    font-size: 18px;
                    cursor: pointer;
                }

                .points-input {
                    width: 60px;
                    padding: 2px 5px;
                    border: 1px solid #ddd;
                    border-radius: 3px;
                    margin: 0 5px;
                }

                .question-text-input {
                    width: 100%;
                    padding: 8px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 14px;
                    margin-bottom: 10px;
                    resize: vertical;
                }

                .option-edit {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin: 5px 0;
                }

                .option-input-edit {
                    flex: 1;
                    padding: 5px 8px;
                    border: 1px solid #ddd;
                    border-radius: 3px;
                    font-size: 13px;
                }

                .correct-answer-radio {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    cursor: pointer;
                }

                .correct-mark {
                    color: #28a745;
                    font-weight: bold;
                }

                .true-false-options {
                    display: flex;
                    gap: 20px;
                    margin: 10px 0;
                }

                .true-false-options label {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    cursor: pointer;
                }

                .correct-answer-input {
                    margin-top: 10px;
                }

                .answer-input-edit {
                    width: 100%;
                    padding: 8px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 13px;
                    resize: vertical;
                }
            `}</style>
        </div>
    );
};

export default ExamQuestionManager;