import React, { useState } from 'react';

const IslamicTaskTypes = ({ onTaskCreate, courseId, dayNumber }) => {
    const [selectedTaskType, setSelectedTaskType] = useState('');
    const [taskData, setTaskData] = useState({
        title: '',
        description: '',
        instructions: '',
        maxScore: 100,
        dueDate: '',
        specificRequirements: {}
    });

    // Islamic education specific task types
    const islamicTaskTypes = {
        quran_memorization: {
            name: 'حفظ القرآن',
            description: 'واجب الحصة كحفظ السورة',
            icon: '📖',
            defaultRequirements: {
                surahName: '',
                versesFrom: 1,
                versesTo: 10,
                recitationStyle: 'حفص عن عاصم',
                memorizationLevel: 'حفظ كامل'
            }
        },
        quran_recitation: {
            name: 'تسميع القرآن',
            description: 'الواجب اليومي كالتسميع',
            icon: '🎵',
            defaultRequirements: {
                recitationType: 'تسميع شفهي',
                surahName: '',
                versesCount: 10,
                tajweedRules: true,
                recordingRequired: false
            }
        },
        spiritual_lesson: {
            name: 'درس تزكوي',
            description: 'سماع درس تزكوي',
            icon: '🌟',
            defaultRequirements: {
                lessonTopic: '',
                lessonDuration: 30,
                reflectionRequired: true,
                notesRequired: true,
                discussionPoints: []
            }
        },
        daily_adhkar: {
            name: 'الأوراد اليومية',
            description: 'إتمام أوراد',
            icon: '🤲',
            defaultRequirements: {
                adhkarType: 'أذكار الصباح والمساء',
                repetitionCount: 100,
                specificAdhkar: [],
                timeOfDay: 'صباح ومساء',
                verificationMethod: 'تأكيد ذاتي'
            }
        },
        islamic_studies: {
            name: 'دراسات إسلامية',
            description: 'دراسة موضوع إسلامي',
            icon: '📚',
            defaultRequirements: {
                studyTopic: '',
                referenceBooks: [],
                summaryRequired: true,
                questionsToAnswer: [],
                researchDepth: 'متوسط'
            }
        },
        hadith_study: {
            name: 'دراسة الحديث',
            description: 'حفظ ودراسة الأحاديث',
            icon: '📜',
            defaultRequirements: {
                hadithText: '',
                hadithSource: '',
                memorizationRequired: true,
                explanationRequired: true,
                practicalApplication: ''
            }
        },
        prayer_practice: {
            name: 'ممارسة الصلاة',
            description: 'تطبيق أحكام الصلاة',
            icon: '🕌',
            defaultRequirements: {
                prayerType: 'الصلوات الخمس',
                focusAspect: 'الخشوع',
                practiceElement: 'التلاوة',
                reflectionRequired: true,
                improvementGoals: []
            }
        },
        islamic_character: {
            name: 'الأخلاق الإسلامية',
            description: 'تطبيق خلق إسلامي',
            icon: '💎',
            defaultRequirements: {
                characterTrait: '',
                dailyPractice: '',
                selfEvaluation: true,
                practicalExamples: [],
                improvementPlan: ''
            }
        }
    };

    const handleTaskTypeChange = (taskType) => {
        setSelectedTaskType(taskType);
        const taskInfo = islamicTaskTypes[taskType];
        setTaskData(prev => ({
            ...prev,
            title: taskInfo.name,
            description: taskInfo.description,
            specificRequirements: { ...taskInfo.defaultRequirements }
        }));
    };

    const updateSpecificRequirement = (key, value) => {
        setTaskData(prev => ({
            ...prev,
            specificRequirements: {
                ...prev.specificRequirements,
                [key]: value
            }
        }));
    };

    const handleCreateTask = () => {
        if (!selectedTaskType || !taskData.title) {
            alert('يرجى اختيار نوع المهمة وإدخال العنوان');
            return;
        }

        const completeTaskData = {
            ...taskData,
            type: selectedTaskType,
            courseId,
            dayNumber,
            isIslamicTask: true,
            createdAt: new Date().toISOString()
        };

        onTaskCreate(completeTaskData);
    };

    const renderSpecificRequirements = () => {
        if (!selectedTaskType) return null;

        const requirements = taskData.specificRequirements;
        const taskType = islamicTaskTypes[selectedTaskType];

        switch (selectedTaskType) {
            case 'quran_memorization':
                return (
                    <div className="specific-requirements">
                        <h4>متطلبات حفظ القرآن</h4>
                        <div className="form-row">
                            <div className="form-group">
                                <label>اسم السورة</label>
                                <input
                                    type="text"
                                    value={requirements.surahName}
                                    onChange={(e) => updateSpecificRequirement('surahName', e.target.value)}
                                    placeholder="البقرة، آل عمران..."
                                />
                            </div>
                            <div className="form-group">
                                <label>من الآية</label>
                                <input
                                    type="number"
                                    value={requirements.versesFrom}
                                    onChange={(e) => updateSpecificRequirement('versesFrom', parseInt(e.target.value))}
                                    min="1"
                                />
                            </div>
                            <div className="form-group">
                                <label>إلى الآية</label>
                                <input
                                    type="number"
                                    value={requirements.versesTo}
                                    onChange={(e) => updateSpecificRequirement('versesTo', parseInt(e.target.value))}
                                    min="1"
                                />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>رواية القراءة</label>
                                <select
                                    value={requirements.recitationStyle}
                                    onChange={(e) => updateSpecificRequirement('recitationStyle', e.target.value)}
                                >
                                    <option value="حفص عن عاصم">حفص عن عاصم</option>
                                    <option value="ورش عن نافع">ورش عن نافع</option>
                                    <option value="قالون عن نافع">قالون عن نافع</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>مستوى الحفظ</label>
                                <select
                                    value={requirements.memorizationLevel}
                                    onChange={(e) => updateSpecificRequirement('memorizationLevel', e.target.value)}
                                >
                                    <option value="حفظ كامل">حفظ كامل</option>
                                    <option value="حفظ مع مراجعة">حفظ مع مراجعة</option>
                                    <option value="حفظ تقريبي">حفظ تقريبي</option>
                                </select>
                            </div>
                        </div>
                    </div>
                );

            case 'quran_recitation':
                return (
                    <div className="specific-requirements">
                        <h4>متطلبات التسميع</h4>
                        <div className="form-row">
                            <div className="form-group">
                                <label>نوع التسميع</label>
                                <select
                                    value={requirements.recitationType}
                                    onChange={(e) => updateSpecificRequirement('recitationType', e.target.value)}
                                >
                                    <option value="تسميع شفهي">تسميع شفهي</option>
                                    <option value="تسجيل صوتي">تسجيل صوتي</option>
                                    <option value="تسميع مباشر">تسميع مباشر</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>عدد الآيات</label>
                                <input
                                    type="number"
                                    value={requirements.versesCount}
                                    onChange={(e) => updateSpecificRequirement('versesCount', parseInt(e.target.value))}
                                    min="1"
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={requirements.tajweedRules}
                                    onChange={(e) => updateSpecificRequirement('tajweedRules', e.target.checked)}
                                />
                                تطبيق أحكام التجويد
                            </label>
                        </div>
                        <div className="form-group">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={requirements.recordingRequired}
                                    onChange={(e) => updateSpecificRequirement('recordingRequired', e.target.checked)}
                                />
                                مطلوب تسجيل صوتي
                            </label>
                        </div>
                    </div>
                );

            case 'spiritual_lesson':
                return (
                    <div className="specific-requirements">
                        <h4>متطلبات الدرس التزكوي</h4>
                        <div className="form-group">
                            <label>موضوع الدرس</label>
                            <input
                                type="text"
                                value={requirements.lessonTopic}
                                onChange={(e) => updateSpecificRequirement('lessonTopic', e.target.value)}
                                placeholder="التوبة، الصبر، الشكر..."
                            />
                        </div>
                        <div className="form-group">
                            <label>مدة الدرس (دقيقة)</label>
                            <input
                                type="number"
                                value={requirements.lessonDuration}
                                onChange={(e) => updateSpecificRequirement('lessonDuration', parseInt(e.target.value))}
                                min="5"
                                max="120"
                            />
                        </div>
                        <div className="form-group">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={requirements.reflectionRequired}
                                    onChange={(e) => updateSpecificRequirement('reflectionRequired', e.target.checked)}
                                />
                                مطلوب تأمل وتفكر
                            </label>
                        </div>
                        <div className="form-group">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={requirements.notesRequired}
                                    onChange={(e) => updateSpecificRequirement('notesRequired', e.target.checked)}
                                />
                                مطلوب كتابة ملاحظات
                            </label>
                        </div>
                    </div>
                );

            case 'daily_adhkar':
                return (
                    <div className="specific-requirements">
                        <h4>متطلبات الأوراد اليومية</h4>
                        <div className="form-row">
                            <div className="form-group">
                                <label>نوع الأذكار</label>
                                <select
                                    value={requirements.adhkarType}
                                    onChange={(e) => updateSpecificRequirement('adhkarType', e.target.value)}
                                >
                                    <option value="أذكار الصباح والمساء">أذكار الصباح والمساء</option>
                                    <option value="أذكار بعد الصلاة">أذكار بعد الصلاة</option>
                                    <option value="أذكار النوم">أذكار النوم</option>
                                    <option value="الاستغفار">الاستغفار</option>
                                    <option value="التسبيح">التسبيح</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>عدد التكرار</label>
                                <input
                                    type="number"
                                    value={requirements.repetitionCount}
                                    onChange={(e) => updateSpecificRequirement('repetitionCount', parseInt(e.target.value))}
                                    min="1"
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>وقت الأداء</label>
                            <select
                                value={requirements.timeOfDay}
                                onChange={(e) => updateSpecificRequirement('timeOfDay', e.target.value)}
                            >
                                <option value="صباح ومساء">صباح ومساء</option>
                                <option value="بعد الفجر">بعد الفجر</option>
                                <option value="بعد المغرب">بعد المغرب</option>
                                <option value="قبل النوم">قبل النوم</option>
                                <option value="أي وقت">أي وقت</option>
                            </select>
                        </div>
                    </div>
                );

            case 'islamic_character':
                return (
                    <div className="specific-requirements">
                        <h4>متطلبات الأخلاق الإسلامية</h4>
                        <div className="form-group">
                            <label>الخلق المطلوب تطبيقه</label>
                            <input
                                type="text"
                                value={requirements.characterTrait}
                                onChange={(e) => updateSpecificRequirement('characterTrait', e.target.value)}
                                placeholder="الصدق، الأمانة، الصبر، الحلم..."
                            />
                        </div>
                        <div className="form-group">
                            <label>الممارسة اليومية</label>
                            <textarea
                                value={requirements.dailyPractice}
                                onChange={(e) => updateSpecificRequirement('dailyPractice', e.target.value)}
                                placeholder="كيف ستطبق هذا الخلق في حياتك اليومية؟"
                                rows="3"
                            />
                        </div>
                        <div className="form-group">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={requirements.selfEvaluation}
                                    onChange={(e) => updateSpecificRequirement('selfEvaluation', e.target.checked)}
                                />
                                مطلوب تقييم ذاتي يومي
                            </label>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="islamic-task-types">
            <div className="task-types-header">
                <h3>أنواع المهام الإسلامية المتخصصة</h3>
                <p>اختر نوع المهمة المناسب للتعليم الإسلامي</p>
            </div>

            <div className="task-types-grid">
                {Object.entries(islamicTaskTypes).map(([key, taskType]) => (
                    <div
                        key={key}
                        className={`task-type-card ${selectedTaskType === key ? 'selected' : ''}`}
                        onClick={() => handleTaskTypeChange(key)}
                    >
                        <div className="task-type-icon">{taskType.icon}</div>
                        <h4>{taskType.name}</h4>
                        <p>{taskType.description}</p>
                    </div>
                ))}
            </div>

            {selectedTaskType && (
                <div className="task-configuration">
                    <h3>تكوين المهمة: {islamicTaskTypes[selectedTaskType].name}</h3>
                    
                    <div className="basic-info">
                        <div className="form-row">
                            <div className="form-group">
                                <label>عنوان المهمة</label>
                                <input
                                    type="text"
                                    value={taskData.title}
                                    onChange={(e) => setTaskData(prev => ({ ...prev, title: e.target.value }))}
                                />
                            </div>
                            <div className="form-group">
                                <label>الدرجة القصوى</label>
                                <input
                                    type="number"
                                    value={taskData.maxScore}
                                    onChange={(e) => setTaskData(prev => ({ ...prev, maxScore: parseInt(e.target.value) }))}
                                    min="1"
                                    max="100"
                                />
                            </div>
                        </div>
                        
                        <div className="form-group">
                            <label>وصف المهمة</label>
                            <textarea
                                value={taskData.description}
                                onChange={(e) => setTaskData(prev => ({ ...prev, description: e.target.value }))}
                                rows="3"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>تعليمات التنفيذ</label>
                            <textarea
                                value={taskData.instructions}
                                onChange={(e) => setTaskData(prev => ({ ...prev, instructions: e.target.value }))}
                                placeholder="تعليمات مفصلة للطالب حول كيفية أداء المهمة..."
                                rows="4"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>تاريخ التسليم</label>
                            <input
                                type="datetime-local"
                                value={taskData.dueDate}
                                onChange={(e) => setTaskData(prev => ({ ...prev, dueDate: e.target.value }))}
                            />
                        </div>
                    </div>

                    {renderSpecificRequirements()}

                    <div className="task-actions">
                        <button onClick={handleCreateTask} className="create-task-btn">
                            إنشاء المهمة الإسلامية
                        </button>
                        <button onClick={() => setSelectedTaskType('')} className="cancel-btn">
                            إلغاء
                        </button>
                    </div>
                </div>
            )}

            <style jsx>{`
                .islamic-task-types {
                    padding: 20px;
                    max-width: 1000px;
                    margin: 0 auto;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    direction: rtl;
                }

                .task-types-header {
                    text-align: center;
                    margin-bottom: 30px;
                    padding: 20px;
                    background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
                    border-radius: 10px;
                    color: white;
                }

                .task-types-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }

                .task-type-card {
                    padding: 20px;
                    border: 2px solid #e0e0e0;
                    border-radius: 10px;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    background: white;
                }

                .task-type-card:hover {
                    border-color: #4CAF50;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                    transform: translateY(-2px);
                }

                .task-type-card.selected {
                    border-color: #4CAF50;
                    background: #f8fff8;
                    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
                }

                .task-type-icon {
                    font-size: 48px;
                    margin-bottom: 15px;
                }

                .task-type-card h4 {
                    margin: 10px 0;
                    color: #333;
                    font-size: 18px;
                }

                .task-type-card p {
                    color: #666;
                    font-size: 14px;
                    margin: 0;
                }

                .task-configuration {
                    background: white;
                    border-radius: 10px;
                    padding: 25px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }

                .basic-info,
                .specific-requirements {
                    margin-bottom: 25px;
                    padding: 20px;
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    background: #fafafa;
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
                    color: #333;
                }

                .form-group input,
                .form-group select,
                .form-group textarea {
                    padding: 8px 12px;
                    border: 2px solid #ddd;
                    border-radius: 5px;
                    font-size: 14px;
                }

                .form-group input:focus,
                .form-group select:focus,
                .form-group textarea:focus {
                    border-color: #4CAF50;
                    outline: none;
                }

                .form-group label input[type="checkbox"] {
                    margin-left: 8px;
                    width: auto;
                }

                .task-actions {
                    display: flex;
                    gap: 15px;
                    justify-content: center;
                    margin-top: 25px;
                }

                .create-task-btn {
                    background: #4CAF50;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-weight: bold;
                    font-size: 16px;
                }

                .create-task-btn:hover {
                    background: #45a049;
                }

                .cancel-btn {
                    background: #f44336;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-weight: bold;
                }

                .cancel-btn:hover {
                    background: #da190b;
                }

                @media (max-width: 768px) {
                    .task-types-grid {
                        grid-template-columns: 1fr;
                    }

                    .form-row {
                        grid-template-columns: 1fr;
                    }

                    .task-actions {
                        flex-direction: column;
                    }
                }
            `}</style>
        </div>
    );
};

export default IslamicTaskTypes;