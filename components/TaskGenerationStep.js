import React, { useState, useEffect } from 'react';

const TaskGenerationStep = ({ course, onTaskConfigChange, taskConfig = {}, compact = false }) => {
    const [enableTaskGeneration, setEnableTaskGeneration] = useState(!!taskConfig.enabled);
    const [selectedLevels, setSelectedLevels] = useState({});
    const [customTasks, setCustomTasks] = useState({});

    useEffect(() => {
        // Initialize task config for each participant level
        if (course.participant_config) {
            const initialConfig = {};
            const initialLevels = {};
            const initialTasks = {};
            
            Object.entries(course.participant_config).forEach(([levelKey, config]) => {
                initialLevels[levelKey] = false;
                initialTasks[levelKey] = [];
            });
            
            // If taskConfig has data, initialize from it
            const initLevels = taskConfig.levels && Object.keys(taskConfig.levels).length ? taskConfig.levels : initialLevels;
            const initTasks = taskConfig.customTasks && Object.keys(taskConfig.customTasks).length ? taskConfig.customTasks : initialTasks;
            setSelectedLevels(initLevels);
            setCustomTasks(initTasks);
        }
    }, [course.participant_config]);

    const handleEnableTaskGeneration = (enabled) => {
        setEnableTaskGeneration(enabled);
        onTaskConfigChange({
            enabled,
            levels: selectedLevels,
            customTasks: customTasks
        });
    };

    const handleLevelToggle = (levelKey, enabled) => {
        const newSelectedLevels = { ...selectedLevels, [levelKey]: enabled };
        setSelectedLevels(newSelectedLevels);
        
        onTaskConfigChange({
            enabled: enableTaskGeneration,
            levels: newSelectedLevels,
            customTasks: customTasks
        });
    };

    const addCustomTask = (levelKey, taskType) => {
        const newTask = {
            id: Date.now(),
            type: `custom_${taskType}`,
            category: taskType,
            title: '',
            description: '',
            instructions: '',
            maxScore: taskType === 'daily' ? 10 : 50,
            gradeReduction: taskType === 'daily' ? 10 : 0,
            dueAfterDays: taskType === 'fixed' ? 3 : 0,
            priority: 'medium'
        };

        const newCustomTasks = {
            ...customTasks,
            [levelKey]: [...(customTasks[levelKey] || []), newTask]
        };
        
        setCustomTasks(newCustomTasks);
        onTaskConfigChange({
            enabled: enableTaskGeneration,
            levels: selectedLevels,
            customTasks: newCustomTasks
        });
    };

    const updateCustomTask = (levelKey, taskId, field, value) => {
        const newCustomTasks = {
            ...customTasks,
            [levelKey]: customTasks[levelKey].map(task => 
                task.id === taskId ? { ...task, [field]: value } : task
            )
        };
        
        setCustomTasks(newCustomTasks);
        onTaskConfigChange({
            enabled: enableTaskGeneration,
            levels: selectedLevels,
            customTasks: newCustomTasks
        });
    };

    const removeCustomTask = (levelKey, taskId) => {
        const newCustomTasks = {
            ...customTasks,
            [levelKey]: customTasks[levelKey].filter(task => task.id !== taskId)
        };
        
        setCustomTasks(newCustomTasks);
        onTaskConfigChange({
            enabled: enableTaskGeneration,
            levels: selectedLevels,
            customTasks: newCustomTasks
        });
    };

    const getDefaultTasksForLevel = (levelConfig) => {
        const roles = levelConfig.roles || [];
        const defaultTasks = [];

        if (roles.includes('student')) {
            defaultTasks.push(
                { type: 'daily_reading', category: 'daily', title: 'قراءة مادة اليوم', description: 'قراءة المادة المطلوبة' },
                { type: 'daily_quiz', category: 'daily', title: 'اختبار يومي', description: 'اختبار قصير على المادة' },
                { type: 'homework', category: 'fixed', title: 'واجب منزلي', description: 'واجب منزلي شامل' },
                { type: 'project', category: 'fixed', title: 'مشروع تطبيقي', description: 'مشروع لتطبيق المفاهيم' }
            );
        }

        if (roles.includes('teacher')) {
            defaultTasks.push(
                { type: 'daily_evaluation', category: 'daily', title: 'تقييم الطلاب', description: 'تقييم أداء الطلاب اليومي' },
                { type: 'attendance_record', category: 'daily', title: 'تسجيل الحضور', description: 'تسجيل حضور وغياب الطلاب' },
                { type: 'lesson_preparation', category: 'fixed', title: 'تحضير الدرس', description: 'تحضير وإعداد المادة' },
                { type: 'grading', category: 'fixed', title: 'تصحيح الواجبات', description: 'تصحيح وتقييم الواجبات' }
            );
        }

        if (roles.includes('admin') || roles.includes('head') || roles.includes('supervisor')) {
            defaultTasks.push(
                { type: 'daily_monitoring', category: 'daily', title: 'مراقبة سير الدورة', description: 'مراجعة ومراقبة سير الدورة' },
                { type: 'performance_review', category: 'fixed', title: 'مراجعة الأداء', description: 'مراجعة أداء المعلمين والطلاب' },
                { type: 'communication_followup', category: 'fixed', title: 'متابعة التواصل', description: 'متابعة التواصل مع الغائبين' }
            );
        }

        return defaultTasks;
    };

    // Compact mode: render a concise UI (checkbox + per-level toggles)
    if (compact) {
        return (
            <div className="task-generation-compact" style={{ padding: '12px 0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={enableTaskGeneration} onChange={(e) => handleEnableTaskGeneration(e.target.checked)} />
                    🚀 تفعيل إنشاء المهام التلقائية
                </label>
                {enableTaskGeneration && course.participant_config && (
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                        {Object.entries(course.participant_config).map(([levelKey, cfg]) => (
                            <label key={levelKey} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input type="checkbox" checked={selectedLevels[levelKey] || false} onChange={(e) => handleLevelToggle(levelKey, e.target.checked)} />
                                <span style={{ fontSize: '0.95rem' }}>{cfg.name}</span>
                            </label>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="task-generation-step">
            <style jsx>{`
                .task-generation-step {
                    padding: 0;
                }
                
                .step-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    margin: 0;
                    padding: 25px 30px;
                    font-size: 1.4rem;
                    font-weight: 600;
                    text-align: center;
                    border-radius: 0;
                }
                
                .step-content {
                    padding: 30px;
                    background: #fafbfc;
                }
                
                .enable-section {
                    background: white;
                    padding: 25px;
                    border-radius: 16px;
                    margin-bottom: 25px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
                    border: 2px solid #e2e8f0;
                }
                
                .level-section {
                    background: white;
                    padding: 25px;
                    border-radius: 16px;
                    margin-bottom: 25px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
                    border: 2px solid #e2e8f0;
                }
                
                .level-header {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    margin-bottom: 20px;
                    padding: 15px;
                    background: linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%);
                    border-radius: 12px;
                    border: 2px solid #3b82f6;
                }
                
                .task-type-section {
                    margin-bottom: 20px;
                }
                
                .task-type-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 15px;
                    padding: 10px 15px;
                    background: #f8fafc;
                    border-radius: 8px;
                    border-left: 4px solid #3b82f6;
                }
                
                .default-tasks {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 15px;
                    margin-bottom: 15px;
                }
                
                .task-card {
                    background: #f8fafc;
                    padding: 15px;
                    border-radius: 8px;
                    border: 1px solid #e2e8f0;
                }
                
                .custom-task-form {
                    background: #ffffff;
                    padding: 20px;
                    border-radius: 8px;
                    border: 2px dashed #cbd5e0;
                    margin-top: 15px;
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
                    font-weight: 600;
                    color: #374151;
                    font-size: 0.9rem;
                }
                
                .form-group input,
                .form-group textarea,
                .form-group select {
                    padding: 8px 12px;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    font-size: 0.9rem;
                }
                
                .btn {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 500;
                    font-size: 0.9rem;
                }
                
                .btn-primary {
                    background: #3b82f6;
                    color: white;
                }
                
                .btn-success {
                    background: #10b981;
                    color: white;
                }
                
                .btn-danger {
                    background: #ef4444;
                    color: white;
                }
                
                .btn-secondary {
                    background: #6b7280;
                    color: white;
                }
                
                .checkbox-large {
                    width: 20px;
                    height: 20px;
                    cursor: pointer;
                    accent-color: #3b82f6;
                }
                
                .info-box {
                    background: #eff6ff;
                    border: 1px solid #bfdbfe;
                    border-radius: 8px;
                    padding: 15px;
                    margin-bottom: 20px;
                }
                
                .warning-box {
                    background: #fef3c7;
                    border: 1px solid #fbbf24;
                    border-radius: 8px;
                    padding: 15px;
                    margin-bottom: 20px;
                }
            `}</style>

            <h3 className="step-header">📋 إعداد المهام التلقائية</h3>
            
            <div className="step-content">
                <div className="info-box">
                    <h4 style={{ margin: '0 0 10px 0', color: '#1e40af' }}>ℹ️ حول نظام المهام التلقائية</h4>
                    <p style={{ margin: 0, lineHeight: '1.6', color: '#374151' }}>
                        سيتم إنشاء مهام تلقائية مرتبطة بجدول الدورة. هناك نوعان من المهام:
                        <br />
                        <strong>• المهام اليومية:</strong> تنتهي صلاحيتها خلال 24 ساعة وتؤثر على درجة الطالب
                        <br />
                        <strong>• المهام الثابتة:</strong> لها مواعيد تسليم محددة يمكن تخصيصها
                    </p>
                </div>

                <div className="enable-section">
                    <label style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '15px', 
                        cursor: 'pointer',
                        fontSize: '1.2rem',
                        fontWeight: '600',
                        color: '#1e293b'
                    }}>
                        <input
                            type="checkbox"
                            checked={enableTaskGeneration}
                            onChange={(e) => handleEnableTaskGeneration(e.target.checked)}
                            className="checkbox-large"
                        />
                        🚀 تفعيل إنشاء المهام التلقائية
                    </label>
                    <p style={{ 
                        margin: '10px 0 0 35px', 
                        color: '#64748b', 
                        fontSize: '0.95rem' 
                    }}>
                        عند التفعيل، سيتم إنشاء مهام تلقائية لكل مشارك حسب دوره ومستواه
                    </p>
                </div>

                {enableTaskGeneration && course.participant_config && (
                    <>
                        <div className="warning-box">
                            <p style={{ margin: 0, color: '#92400e' }}>
                                ⚠️ <strong>تنبيه:</strong> سيتم إنشاء المهام لجميع المستويات المفعلة أدناه. 
                                يمكنك إضافة مهام مخصصة بالإضافة للمهام الافتراضية.
                            </p>
                        </div>

                        {Object.entries(course.participant_config).map(([levelKey, config]) => (
                            <div key={levelKey} className="level-section">
                                <div className="level-header">
                                    <input
                                        type="checkbox"
                                        checked={selectedLevels[levelKey] || false}
                                        onChange={(e) => handleLevelToggle(levelKey, e.target.checked)}
                                        className="checkbox-large"
                                    />
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b' }}>
                                            {config.name} - المستوى {levelKey.split('_')[1]}
                                        </h4>
                                        <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', color: '#64748b' }}>
                                            الأدوار: {config.roles.join(', ')}
                                        </p>
                                    </div>
                                </div>

                                {selectedLevels[levelKey] && (
                                    <>
                                        {/* Default Tasks */}
                                        <div className="task-type-section">
                                            <div className="task-type-header">
                                                <h5 style={{ margin: 0, color: '#374151' }}>
                                                    📝 المهام الافتراضية
                                                </h5>
                                            </div>
                                            
                                            <div className="default-tasks">
                                                {getDefaultTasksForLevel(config).map((task, index) => (
                                                    <div key={index} className="task-card">
                                                        <div style={{ 
                                                            display: 'flex', 
                                                            alignItems: 'center', 
                                                            gap: '8px', 
                                                            marginBottom: '8px' 
                                                        }}>
                                                            <span style={{ 
                                                                background: task.category === 'daily' ? '#fef3c7' : '#dbeafe',
                                                                color: task.category === 'daily' ? '#92400e' : '#1e40af',
                                                                padding: '2px 8px',
                                                                borderRadius: '12px',
                                                                fontSize: '0.75rem',
                                                                fontWeight: '600'
                                                            }}>
                                                                {task.category === 'daily' ? 'يومية' : 'ثابتة'}
                                                            </span>
                                                            <strong style={{ fontSize: '0.9rem' }}>{task.title}</strong>
                                                        </div>
                                                        <p style={{ 
                                                            margin: 0, 
                                                            fontSize: '0.8rem', 
                                                            color: '#6b7280' 
                                                        }}>
                                                            {task.description}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Custom Tasks */}
                                        <div className="task-type-section">
                                            <div className="task-type-header">
                                                <h5 style={{ margin: 0, color: '#374151' }}>
                                                    ⚙️ المهام المخصصة
                                                </h5>
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <button
                                                        type="button"
                                                        className="btn btn-primary"
                                                        onClick={() => addCustomTask(levelKey, 'daily')}
                                                    >
                                                        + مهمة يومية
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-success"
                                                        onClick={() => addCustomTask(levelKey, 'fixed')}
                                                    >
                                                        + مهمة ثابتة
                                                    </button>
                                                </div>
                                            </div>

                                            {customTasks[levelKey] && customTasks[levelKey].map((task) => (
                                                <div key={task.id} className="custom-task-form">
                                                    <div style={{ 
                                                        display: 'flex', 
                                                        justifyContent: 'space-between', 
                                                        alignItems: 'center', 
                                                        marginBottom: '15px' 
                                                    }}>
                                                        <span style={{ 
                                                            background: task.category === 'daily' ? '#fef3c7' : '#dbeafe',
                                                            color: task.category === 'daily' ? '#92400e' : '#1e40af',
                                                            padding: '4px 12px',
                                                            borderRadius: '12px',
                                                            fontSize: '0.8rem',
                                                            fontWeight: '600'
                                                        }}>
                                                            {task.category === 'daily' ? 'مهمة يومية' : 'مهمة ثابتة'}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            className="btn btn-danger"
                                                            onClick={() => removeCustomTask(levelKey, task.id)}
                                                        >
                                                            حذف
                                                        </button>
                                                    </div>

                                                    <div className="form-row">
                                                        <div className="form-group">
                                                            <label>عنوان المهمة</label>
                                                            <input
                                                                type="text"
                                                                value={task.title}
                                                                onChange={(e) => updateCustomTask(levelKey, task.id, 'title', e.target.value)}
                                                                placeholder="أدخل عنوان المهمة"
                                                            />
                                                        </div>
                                                        <div className="form-group">
                                                            <label>الدرجة القصوى</label>
                                                            <input
                                                                type="number"
                                                                value={task.maxScore}
                                                                onChange={(e) => updateCustomTask(levelKey, task.id, 'maxScore', parseInt(e.target.value))}
                                                                min="0"
                                                                max="100"
                                                            />
                                                        </div>
                                                        {task.category === 'daily' && (
                                                            <div className="form-group">
                                                                <label>نسبة خصم التأخير (%)</label>
                                                                <input
                                                                    type="number"
                                                                    value={task.gradeReduction}
                                                                    onChange={(e) => updateCustomTask(levelKey, task.id, 'gradeReduction', parseInt(e.target.value))}
                                                                    min="0"
                                                                    max="100"
                                                                />
                                                            </div>
                                                        )}
                                                        {task.category === 'fixed' && (
                                                            <>
                                                                <div className="form-group">
                                                                    <label>موعد التسليم (أيام)</label>
                                                                    <input
                                                                        type="number"
                                                                        value={task.dueAfterDays}
                                                                        onChange={(e) => updateCustomTask(levelKey, task.id, 'dueAfterDays', parseInt(e.target.value))}
                                                                        min="1"
                                                                        max="30"
                                                                    />
                                                                </div>
                                                                <div className="form-group">
                                                                    <label>الأولوية</label>
                                                                    <select
                                                                        value={task.priority}
                                                                        onChange={(e) => updateCustomTask(levelKey, task.id, 'priority', e.target.value)}
                                                                    >
                                                                        <option value="low">منخفضة</option>
                                                                        <option value="medium">متوسطة</option>
                                                                        <option value="high">عالية</option>
                                                                    </select>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>

                                                    <div className="form-row">
                                                        <div className="form-group">
                                                            <label>وصف المهمة</label>
                                                            <textarea
                                                                value={task.description}
                                                                onChange={(e) => updateCustomTask(levelKey, task.id, 'description', e.target.value)}
                                                                placeholder="أدخل وصف المهمة"
                                                                rows="2"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="form-row">
                                                        <div className="form-group">
                                                            <label>تعليمات المهمة</label>
                                                            <textarea
                                                                value={task.instructions}
                                                                onChange={(e) => updateCustomTask(levelKey, task.id, 'instructions', e.target.value)}
                                                                placeholder="أدخل تعليمات تنفيذ المهمة"
                                                                rows="2"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </>
                )}
            </div>
        </div>
    );
};

export default TaskGenerationStep;