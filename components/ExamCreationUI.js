import React, { useState } from 'react';

const ExamCreationUI = ({ onSave, onCancel, initialData = null }) => {
    const [examData, setExamData] = useState({
        title: initialData?.title || '',
        description: initialData?.description || '',
        timeLimit: initialData?.timeLimit || 30,
        passingScore: initialData?.passingScore || 60,
        questions: initialData?.questions || []
    });

    const [currentQuestion, setCurrentQuestion] = useState({
        type: 'multiple_choice', // multiple_choice, true_false
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        points: 1
    });

    const [textToConvert, setTextToConvert] = useState('');
    const [showPreview, setShowPreview] = useState(false);

    const addQuestion = () => {
        if (!currentQuestion.question.trim()) {
            alert('يرجى كتابة نص السؤال');
            return;
        }

        const newQuestion = {
            ...currentQuestion,
            id: Date.now(),
            options: currentQuestion.type === 'true_false' 
                ? ['صحيح', 'خطأ'] 
                : currentQuestion.options.filter(opt => opt.trim())
        };

        setExamData(prev => ({
            ...prev,
            questions: [...prev.questions, newQuestion]
        }));

        // Reset current question
        setCurrentQuestion({
            type: 'multiple_choice',
            question: '',
            options: ['', '', '', ''],
            correctAnswer: 0,
            points: 1
        });
    };

    const removeQuestion = (questionId) => {
        setExamData(prev => ({
            ...prev,
            questions: prev.questions.filter(q => q.id !== questionId)
        }));
    };

    const updateQuestion = (index, field, value) => {
        setExamData(prev => ({
            ...prev,
            questions: prev.questions.map((q, i) => 
                i === index ? { ...q, [field]: value } : q
            )
        }));
    };

    const convertTextToExam = () => {
        if (!textToConvert.trim()) {
            alert('يرجى كتابة النص المراد تحويله');
            return;
        }

        // Simple text-to-exam conversion
        const lines = textToConvert.split('\n').filter(line => line.trim());
        const convertedQuestions = [];

        lines.forEach((line, index) => {
            if (line.includes('؟') || line.includes('?')) {
                // This looks like a question
                const questionText = line.trim();
                
                // Try to detect if it's true/false
                if (line.includes('صحيح') || line.includes('خطأ') || 
                    line.includes('صح') || line.includes('غلط')) {
                    convertedQuestions.push({
                        id: Date.now() + index,
                        type: 'true_false',
                        question: questionText.replace(/صحيح|خطأ|صح|غلط/g, '').trim(),
                        options: ['صحيح', 'خطأ'],
                        correctAnswer: line.includes('صحيح') || line.includes('صح') ? 0 : 1,
                        points: 1
                    });
                } else {
                    // Multiple choice question
                    convertedQuestions.push({
                        id: Date.now() + index,
                        type: 'multiple_choice',
                        question: questionText,
                        options: ['الخيار الأول', 'الخيار الثاني', 'الخيار الثالث', 'الخيار الرابع'],
                        correctAnswer: 0,
                        points: 1
                    });
                }
            }
        });

        if (convertedQuestions.length > 0) {
            setExamData(prev => ({
                ...prev,
                questions: [...prev.questions, ...convertedQuestions]
            }));
            setTextToConvert('');
            alert(`تم تحويل ${convertedQuestions.length} سؤال بنجاح`);
        } else {
            alert('لم يتم العثور على أسئلة في النص المدخل');
        }
    };

    const handleSave = () => {
        if (!examData.title.trim()) {
            alert('يرجى كتابة عنوان الامتحان');
            return;
        }

        if (examData.questions.length === 0) {
            alert('يرجى إضافة سؤال واحد على الأقل');
            return;
        }

        onSave(examData);
    };

    return (
        <div className="exam-creation-ui">
            <div className="exam-header">
                <h3>إنشاء امتحان يومي</h3>
                <div className="header-actions">
                    <button onClick={() => setShowPreview(!showPreview)} className="preview-btn">
                        {showPreview ? 'إخفاء المعاينة' : 'معاينة الامتحان'}
                    </button>
                    <button onClick={handleSave} className="save-btn">حفظ الامتحان</button>
                    <button onClick={onCancel} className="cancel-btn">إلغاء</button>
                </div>
            </div>

            <div className="exam-content">
                {/* Basic Exam Info */}
                <div className="exam-info-section">
                    <h4>معلومات الامتحان</h4>
                    <div className="form-row">
                        <div className="form-group">
                            <label>عنوان الامتحان</label>
                            <input
                                type="text"
                                value={examData.title}
                                onChange={(e) => setExamData(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="امتحان اليوم الأول"
                            />
                        </div>
                        <div className="form-group">
                            <label>وقت الامتحان (دقيقة)</label>
                            <input
                                type="number"
                                value={examData.timeLimit}
                                onChange={(e) => setExamData(prev => ({ ...prev, timeLimit: parseInt(e.target.value) }))}
                                min="5"
                                max="180"
                            />
                        </div>
                        <div className="form-group">
                            <label>درجة النجاح (%)</label>
                            <input
                                type="number"
                                value={examData.passingScore}
                                onChange={(e) => setExamData(prev => ({ ...prev, passingScore: parseInt(e.target.value) }))}
                                min="0"
                                max="100"
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>وصف الامتحان</label>
                        <textarea
                            value={examData.description}
                            onChange={(e) => setExamData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="وصف مختصر للامتحان..."
                            rows="2"
                        />
                    </div>
                </div>

                {/* Text to Exam Converter */}
                <div className="text-converter-section">
                    <h4>تحويل النص إلى امتحان</h4>
                    <div className="converter-help">
                        <p>💡 اكتب الأسئلة في النص أدناه وسيتم تحويلها تلقائياً:</p>
                        <ul>
                            <li>للأسئلة صح/خطأ: اكتب السؤال واتبعه بـ &quot;صحيح&quot; أو &quot;خطأ&quot;</li>
                            <li>للأسئلة الاختيارية: اكتب السؤال منتهياً بعلامة استفهام</li>
                        </ul>
                    </div>
                    <textarea
                        value={textToConvert}
                        onChange={(e) => setTextToConvert(e.target.value)}
                        placeholder="مثال:
ما هو عدد سور القرآن الكريم؟
الصلاة واجبة على كل مسلم صحيح
عدد أركان الإسلام خمسة صحيح"
                        rows="4"
                        className="text-converter-input"
                    />
                    <button onClick={convertTextToExam} className="convert-btn">
                        🔄 تحويل النص إلى أسئلة
                    </button>
                </div>

                {/* Manual Question Creation */}
                <div className="question-creation-section">
                    <h4>إضافة سؤال يدوياً</h4>
                    <div className="question-form">
                        <div className="form-row">
                            <div className="form-group">
                                <label>نوع السؤال</label>
                                <select
                                    value={currentQuestion.type}
                                    onChange={(e) => setCurrentQuestion(prev => ({ 
                                        ...prev, 
                                        type: e.target.value,
                                        options: e.target.value === 'true_false' ? ['صحيح', 'خطأ'] : ['', '', '', ''],
                                        correctAnswer: 0
                                    }))}
                                >
                                    <option value="multiple_choice">اختيار من متعدد</option>
                                    <option value="true_false">صح أو خطأ</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>نقاط السؤال</label>
                                <input
                                    type="number"
                                    value={currentQuestion.points}
                                    onChange={(e) => setCurrentQuestion(prev => ({ ...prev, points: parseInt(e.target.value) || 1 }))}
                                    min="1"
                                    max="10"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>نص السؤال</label>
                            <textarea
                                value={currentQuestion.question}
                                onChange={(e) => setCurrentQuestion(prev => ({ ...prev, question: e.target.value }))}
                                placeholder="اكتب السؤال هنا..."
                                rows="2"
                            />
                        </div>

                        {currentQuestion.type === 'multiple_choice' && (
                            <div className="options-section">
                                <label>الخيارات</label>
                                {currentQuestion.options.map((option, index) => (
                                    <div key={index} className="option-input">
                                        <input
                                            type="radio"
                                            name="correctAnswer"
                                            checked={currentQuestion.correctAnswer === index}
                                            onChange={() => setCurrentQuestion(prev => ({ ...prev, correctAnswer: index }))}
                                        />
                                        <input
                                            type="text"
                                            value={option}
                                            onChange={(e) => {
                                                const newOptions = [...currentQuestion.options];
                                                newOptions[index] = e.target.value;
                                                setCurrentQuestion(prev => ({ ...prev, options: newOptions }));
                                            }}
                                            placeholder={`الخيار ${index + 1}`}
                                        />
                                        <span className="correct-indicator">
                                            {currentQuestion.correctAnswer === index ? '✅ الإجابة الصحيحة' : ''}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {currentQuestion.type === 'true_false' && (
                            <div className="true-false-section">
                                <label>الإجابة الصحيحة</label>
                                <div className="true-false-options">
                                    <label>
                                        <input
                                            type="radio"
                                            name="trueFalseAnswer"
                                            checked={currentQuestion.correctAnswer === 0}
                                            onChange={() => setCurrentQuestion(prev => ({ ...prev, correctAnswer: 0 }))}
                                        />
                                        صحيح
                                    </label>
                                    <label>
                                        <input
                                            type="radio"
                                            name="trueFalseAnswer"
                                            checked={currentQuestion.correctAnswer === 1}
                                            onChange={() => setCurrentQuestion(prev => ({ ...prev, correctAnswer: 1 }))}
                                        />
                                        خطأ
                                    </label>
                                </div>
                            </div>
                        )}

                        <button onClick={addQuestion} className="add-question-btn">
                            ➕ إضافة السؤال
                        </button>
                    </div>
                </div>

                {/* Questions List */}
                <div className="questions-list-section">
                    <h4>أسئلة الامتحان ({examData.questions.length})</h4>
                    {examData.questions.length === 0 ? (
                        <p className="no-questions">لم يتم إضافة أي أسئلة بعد</p>
                    ) : (
                        <div className="questions-list">
                            {examData.questions.map((question, index) => (
                                <div key={question.id} className="question-item">
                                    <div className="question-header">
                                        <span className="question-number">السؤال {index + 1}</span>
                                        <span className="question-type">
                                            {question.type === 'multiple_choice' ? 'اختيار من متعدد' : 'صح أو خطأ'}
                                        </span>
                                        <span className="question-points">{question.points} نقطة</span>
                                        <button 
                                            onClick={() => removeQuestion(question.id)}
                                            className="remove-question-btn"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                    <div className="question-content">
                                        <p className="question-text">{question.question}</p>
                                        <div className="question-options">
                                            {question.options.map((option, optIndex) => (
                                                <div 
                                                    key={optIndex} 
                                                    className={`option ${question.correctAnswer === optIndex ? 'correct' : ''}`}
                                                >
                                                    <span className="option-letter">
                                                        {String.fromCharCode(65 + optIndex)}.
                                                    </span>
                                                    <span className="option-text">{option}</span>
                                                    {question.correctAnswer === optIndex && (
                                                        <span className="correct-mark">✅</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Exam Preview */}
                {showPreview && examData.questions.length > 0 && (
                    <div className="exam-preview-section">
                        <h4>معاينة الامتحان</h4>
                        <div className="preview-exam">
                            <div className="preview-header">
                                <h3>{examData.title}</h3>
                                <p>{examData.description}</p>
                                <div className="exam-info">
                                    <span>الوقت المحدد: {examData.timeLimit} دقيقة</span>
                                    <span>درجة النجاح: {examData.passingScore}%</span>
                                    <span>عدد الأسئلة: {examData.questions.length}</span>
                                </div>
                            </div>
                            <div className="preview-questions">
                                {examData.questions.map((question, index) => (
                                    <div key={question.id} className="preview-question">
                                        <h4>السؤال {index + 1} ({question.points} نقطة)</h4>
                                        <p>{question.question}</p>
                                        <div className="preview-options">
                                            {question.options.map((option, optIndex) => (
                                                <label key={optIndex} className="preview-option">
                                                    <input 
                                                        type="radio" 
                                                        name={`preview_q_${question.id}`} 
                                                        disabled 
                                                    />
                                                    <span>{String.fromCharCode(65 + optIndex)}. {option}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                .exam-creation-ui {
                    max-width: 1000px;
                    margin: 0 auto;
                    padding: 20px;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    direction: rtl;
                }

                .exam-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                    padding: 20px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 15px;
                    color: white;
                }

                .exam-header h3 {
                    margin: 0;
                    font-size: 24px;
                }

                .header-actions {
                    display: flex;
                    gap: 10px;
                }

                .header-actions button {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: bold;
                    transition: all 0.3s;
                }

                .preview-btn {
                    background: #FF9800;
                    color: white;
                }

                .save-btn {
                    background: #4CAF50;
                    color: white;
                }

                .cancel-btn {
                    background: #f44336;
                    color: white;
                }

                .header-actions button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                }

                .exam-content > div {
                    background: white;
                    border-radius: 15px;
                    padding: 25px;
                    margin-bottom: 20px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }

                .exam-content h4 {
                    margin: 0 0 20px 0;
                    color: #333;
                    border-bottom: 2px solid #f0f0f0;
                    padding-bottom: 10px;
                }

                .form-row {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    margin-bottom: 15px;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                }

                .form-group label {
                    margin-bottom: 5px;
                    font-weight: bold;
                    color: #555;
                }

                .form-group input,
                .form-group select,
                .form-group textarea {
                    padding: 10px;
                    border: 2px solid #ddd;
                    border-radius: 8px;
                    font-size: 14px;
                    transition: border-color 0.3s;
                }

                .form-group input:focus,
                .form-group select:focus,
                .form-group textarea:focus {
                    outline: none;
                    border-color: #2196F3;
                }

                .converter-help {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 15px;
                }

                .converter-help p {
                    margin: 0 0 10px 0;
                    font-weight: bold;
                    color: #2196F3;
                }

                .converter-help ul {
                    margin: 0;
                    padding-right: 20px;
                }

                .converter-help li {
                    margin-bottom: 5px;
                    color: #666;
                }

                .text-converter-input {
                    width: 100%;
                    min-height: 100px;
                    margin-bottom: 15px;
                }

                .convert-btn,
                .add-question-btn {
                    background: #2196F3;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: bold;
                    transition: all 0.3s;
                }

                .convert-btn:hover,
                .add-question-btn:hover {
                    background: #1976D2;
                    transform: translateY(-2px);
                }

                .options-section {
                    margin-top: 15px;
                }

                .option-input {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 10px;
                }

                .option-input input[type="text"] {
                    flex: 1;
                }

                .correct-indicator {
                    color: #4CAF50;
                    font-weight: bold;
                    font-size: 12px;
                }

                .true-false-section {
                    margin-top: 15px;
                }

                .true-false-options {
                    display: flex;
                    gap: 20px;
                    margin-top: 10px;
                }

                .true-false-options label {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                }

                .questions-list {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }

                .question-item {
                    border: 2px solid #f0f0f0;
                    border-radius: 12px;
                    padding: 15px;
                    transition: all 0.3s;
                }

                .question-item:hover {
                    border-color: #2196F3;
                    box-shadow: 0 4px 8px rgba(33, 150, 243, 0.1);
                }

                .question-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                    padding-bottom: 10px;
                    border-bottom: 1px solid #f0f0f0;
                }

                .question-number {
                    font-weight: bold;
                    color: #2196F3;
                }

                .question-type {
                    background: #e3f2fd;
                    color: #1976d2;
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 12px;
                }

                .question-points {
                    background: #fff3e0;
                    color: #f57c00;
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 12px;
                }

                .remove-question-btn {
                    background: #ffebee;
                    color: #d32f2f;
                    border: none;
                    padding: 4px 8px;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.3s;
                }

                .remove-question-btn:hover {
                    background: #f44336;
                    color: white;
                }

                .question-text {
                    font-weight: bold;
                    margin-bottom: 10px;
                    color: #333;
                }

                .question-options {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                }

                .option {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 8px;
                    border-radius: 8px;
                    transition: all 0.3s;
                }

                .option.correct {
                    background: #e8f5e8;
                    border: 1px solid #4CAF50;
                }

                .option-letter {
                    font-weight: bold;
                    color: #666;
                }

                .correct-mark {
                    margin-right: auto;
                }

                .no-questions {
                    text-align: center;
                    color: #666;
                    font-style: italic;
                    padding: 40px;
                }

                .preview-exam {
                    border: 2px solid #2196F3;
                    border-radius: 12px;
                    padding: 20px;
                    background: #fafafa;
                }

                .preview-header {
                    text-align: center;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 2px solid #ddd;
                }

                .preview-header h3 {
                    margin: 0 0 10px 0;
                    color: #2196F3;
                }

                .exam-info {
                    display: flex;
                    justify-content: center;
                    gap: 20px;
                    margin-top: 15px;
                    flex-wrap: wrap;
                }

                .exam-info span {
                    background: #e3f2fd;
                    color: #1976d2;
                    padding: 5px 10px;
                    border-radius: 15px;
                    font-size: 12px;
                    font-weight: bold;
                }

                .preview-question {
                    margin-bottom: 25px;
                    padding: 15px;
                    background: white;
                    border-radius: 8px;
                    border: 1px solid #ddd;
                }

                .preview-question h4 {
                    margin: 0 0 10px 0;
                    color: #333;
                }

                .preview-options {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    margin-top: 15px;
                }

                .preview-option {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 8px;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: background 0.3s;
                }

                .preview-option:hover {
                    background: #f5f5f5;
                }

                @media (max-width: 768px) {
                    .exam-header {
                        flex-direction: column;
                        gap: 15px;
                        text-align: center;
                    }

                    .header-actions {
                        flex-wrap: wrap;
                        justify-content: center;
                    }

                    .form-row {
                        grid-template-columns: 1fr;
                    }

                    .option-input {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .true-false-options {
                        flex-direction: column;
                        gap: 10px;
                    }

                    .exam-info {
                        flex-direction: column;
                        gap: 10px;
                    }
                }
            `}</style>
        </div>
    );
};

export default ExamCreationUI;