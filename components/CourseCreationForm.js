import React, { useState } from 'react';
import TaskPreviewCreator from './TaskPreviewCreator';
import { CalendarIcon, ClockIcon, UserGroupIcon, CurrencyDollarIcon, DocumentTextIcon, AcademicCapIcon } from '@heroicons/react/24/outline';

const CourseCreationForm = ({ onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        content_outline: '', // Fixed: was tableOfContents
        duration_days: 7, // Fixed: was duration
        start_date: '', // Fixed: was startDate
        days_per_week: 5, // Fixed: was weekDays
        hours_per_day: 2.0, // Fixed: was dailyHours
        
        // Add details jsonb structure
        details: {
            cost: 0,
            currency: 'EGP',
            max_seats: 15,
            teachers: [],
            target_roles: [],
            prerequisites: []
        },
        
        // Fixed: Match database participant_config structure
        participant_config: {
            level_1: { 
                name: 'مشرف', 
                roles: ['admin', 'head'], 
                min: 1, 
                max: 2, 
                optimal: 1 
            },
            level_2: { 
                name: 'معلم/مدرب', 
                roles: ['teacher'], 
                min: 1, 
                max: 3, 
                optimal: 2 
            },
            level_3: { 
                name: 'طالب', 
                roles: ['student', 'worker'], 
                min: 5, 
                max: 20, 
                optimal: 12 
            }
        },

        // Fixed: Match database auto_launch_settings structure
        auto_launch_settings: {
            auto_launch_on_max_capacity: false,
            auto_launch_on_optimal_capacity: false,
            auto_launch_on_min_capacity: false
        },

        // Auto-fill settings (will be handled separately, not stored in courses table)
        autoFill: {
            meetingLink: '',
            contentLinkPattern: '',
            startNumber: 1,
            endNumber: 10,
            defaultTasks: {
                level_1: '', // تكاليف المشرفين
                level_2: '', // تكاليف المعلمين
                level_3: ''  // تكاليف الطلاب
            }
        },

        // Task management
        taskTemplates: {
            level_1: [],
            level_2: [],
            level_3: []
        }
    });

    const [currentStep, setCurrentStep] = useState(1);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [generatedTasks, setGeneratedTasks] = useState([]);
    const [courseSchedule, setCourseSchedule] = useState([]);
    const [enrollments, setEnrollments] = useState([]);

    // Task template management functions
    const updateTaskTemplate = (levelKey, index, field, value) => {
        setFormData(prev => ({
            ...prev,
            taskTemplates: {
                ...prev.taskTemplates,
                [levelKey]: prev.taskTemplates[levelKey].map((task, i) => 
                    i === index ? { ...task, [field]: value } : task
                )
            }
        }));
    };

    const addTaskTemplate = (levelKey) => {
        const newTask = {
            type: '',
            title: '',
            description: '',
            instructions: '',
            maxScore: 100
        };
        
        setFormData(prev => ({
            ...prev,
            taskTemplates: {
                ...prev.taskTemplates,
                [levelKey]: [...(prev.taskTemplates[levelKey] || []), newTask]
            }
        }));
    };

    const removeTaskTemplate = (levelKey, index) => {
        setFormData(prev => ({
            ...prev,
            taskTemplates: {
                ...prev.taskTemplates,
                [levelKey]: prev.taskTemplates[levelKey].filter((_, i) => i !== index)
            }
        }));
    };

    const handleInputChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value
        }));
    };

    const handleDetailsChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            details: {
                ...prev.details,
                [name]: type === 'number' ? (value === '' ? 0 : Number(value)) : value
            }
        }));
    };

    const handleParticipantConfigChange = (level, field, value) => {
        setFormData(prev => ({
            ...prev,
            participant_config: {
                ...prev.participant_config,
                [level]: {
                    ...prev.participant_config[level],
                    [field]: field === 'roles' ? value : (typeof value === 'string' && !isNaN(value) ? Number(value) : value)
                }
            }
        }));
    };

    const handleAutoLaunchChange = (option) => {
        setFormData(prev => ({
            ...prev,
            auto_launch_settings: {
                ...prev.auto_launch_settings,
                [option]: !prev.auto_launch_settings[option]
            }
        }));
    };

    const handleAutoFillChange = (field, value) => {
        if (field.includes('.')) {
            const [parent, child] = field.split('.');
            setFormData(prev => ({
                ...prev,
                autoFill: {
                    ...prev.autoFill,
                    [parent]: {
                        ...prev.autoFill[parent],
                        [child]: value
                    }
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                autoFill: {
                    ...prev.autoFill,
                    [field]: value
                }
            }));
        }
    };

    const validateStep = (step) => {
        switch (step) {
            case 1:
                return formData.name && formData.description && formData.duration_days && formData.start_date;
            case 2:
                return Object.values(formData.participant_config).some(level => 
                    level.min > 0 && level.max >= level.min && level.optimal >= level.min && level.optimal <= level.max
                );
            case 3:
                return true; // Auto-fill is optional
            default:
                return true;
        }
    };

    const nextStep = () => {
        if (validateStep(currentStep)) {
            // Generate course schedule when moving to task preview step
            if (currentStep === 3) {
                generateCourseSchedule();
                generateSampleEnrollments();
            }
            setCurrentStep(prev => Math.min(prev + 1, 5));
            setMessage({ text: '', type: '' });
        } else {
            setMessage({ text: 'يرجى ملء جميع الحقول المطلوبة', type: 'error' });
        }
    };

    const generateCourseSchedule = () => {
        if (!formData.start_date || !formData.duration_days) return;

        const schedule = [];
        const startDate = new Date(formData.start_date);
        let currentDate = new Date(startDate);
        let dayNumber = 1;
        let daysAdded = 0;

        while (dayNumber <= formData.duration_days) {
            const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
            
            // Only add working days (Sunday to Thursday in Middle East)
            if (dayOfWeek >= 0 && dayOfWeek <= 4 && daysAdded < formData.days_per_week) {
                schedule.push({
                    id: dayNumber,
                    day_number: dayNumber,
                    title: `اليوم ${dayNumber} - ${currentDate.toLocaleDateString('ar-SA')}`,
                    scheduled_date: currentDate.toISOString().split('T')[0],
                    meeting_start_time: '09:00:00',
                    meeting_end_time: '11:00:00'
                });
                
                dayNumber++;
                daysAdded++;
            }
            
            currentDate.setDate(currentDate.getDate() + 1);
            
            // Reset weekly counter
            if (dayOfWeek === 4) { // Thursday
                daysAdded = 0;
            }
        }

        setCourseSchedule(schedule);
    };

    const generateSampleEnrollments = () => {
        const sampleEnrollments = [];
        
        // Generate sample enrollments based on participant config
        Object.entries(formData.participant_config).forEach(([levelKey, config]) => {
            const levelNumber = parseInt(levelKey.split('_')[1]);
            
            // Add sample users for each role
            config.roles.forEach((role, roleIndex) => {
                for (let i = 0; i < Math.min(config.optimal, 3); i++) {
                    sampleEnrollments.push({
                        user_id: `${levelNumber}_${roleIndex}_${i}`,
                        name: `${getRoleName(role)} ${i + 1}`,
                        role: role,
                        level_number: levelNumber
                    });
                }
            });
        });

        setEnrollments(sampleEnrollments);
    };

    const getRoleName = (role) => {
        const roleNames = {
            admin: 'مدير',
            head: 'رئيس قسم',
            teacher: 'معلم',
            student: 'طالب',
            parent: 'ولي أمر',
            worker: 'عامل',
            supervisor: 'مشرف'
        };
        return roleNames[role] || role;
    };

    const prevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
        setMessage({ text: '', type: '' });
    };

    const handleTasksChange = (tasks) => {
        setGeneratedTasks(tasks);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (validateStep(currentStep)) {
            try {
                // Include generated tasks in the submission
                const submissionData = {
                    ...formData,
                    generatedTasks,
                    courseSchedule
                };
                await onSubmit(submissionData);
                setMessage({ text: 'تم إنشاء الدورة بنجاح!', type: 'success' });
            } catch (error) {
                setMessage({ text: 'حدث خطأ في إنشاء الدورة', type: 'error' });
            }
        }
    };

    const renderStep1 = () => (
        <div className="step-content">
            <h3><i className="fas fa-info-circle"></i> معلومات الدورة الأساسية</h3>
            
            <div className="form-group">
                <label>اسم الدورة *</label>
                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="أدخل اسم الدورة"
                    required
                />
            </div>

            <div className="form-group">
                <label>الوصف السريع *</label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="وصف مختصر للدورة"
                    rows="3"
                    required
                />
            </div>

            <div className="form-group">
                <label>جدول المحتويات</label>
                <textarea
                    name="content_outline"
                    value={formData.content_outline}
                    onChange={handleInputChange}
                    placeholder="قائمة بمحتويات الدورة"
                    rows="5"
                />
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label>مدة الدورة (بالأيام) *</label>
                    <input
                        type="number"
                        name="duration_days"
                        value={formData.duration_days}
                        onChange={handleInputChange}
                        min="1"
                        required
                    />
                </div>

                <div className="form-group">
                    <label>تاريخ بدء الدورة *</label>
                    <input
                        type="date"
                        name="start_date"
                        value={formData.start_date}
                        onChange={handleInputChange}
                        required
                    />
                </div>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label>عدد أيام الدورة في الأسبوع</label>
                    <select
                        name="days_per_week"
                        value={formData.days_per_week}
                        onChange={handleInputChange}
                    >
                        <option value="1">يوم واحد</option>
                        <option value="2">يومان</option>
                        <option value="3">ثلاثة أيام</option>
                        <option value="4">أربعة أيام</option>
                        <option value="5">خمسة أيام</option>
                        <option value="6">ستة أيام</option>
                        <option value="7">سبعة أيام</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>مدة اليوم (بالساعات)</label>
                    <input
                        type="number"
                        name="hours_per_day"
                        value={formData.hours_per_day}
                        onChange={handleInputChange}
                        min="0.5"
                        step="0.5"
                        placeholder="مثال: 2.5"
                    />
                </div>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="step-content">
            <h3><i className="fas fa-users"></i> نظام التقييمات والأدوار</h3>
            <p className="step-description">حدد الأدوار المختلفة والعدد المطلوب من كل دور</p>

            {Object.entries(formData.participant_config).map(([levelKey, level]) => (
                <div key={levelKey} className="grade-section">
                    <h4>
                        {levelKey === 'level_1' && '🎯 درجة 1 - المشرف'}
                        {levelKey === 'level_2' && '👨‍🏫 درجة 2 - المسؤول'}
                        {levelKey === 'level_3' && '🎓 درجة 3 - المتلقي'}
                    </h4>
                    <div className="participant-config-grid">
                        <div className="form-group">
                            <label>اسم الدرجة</label>
                            <input 
                                type="text" 
                                value={level.name} 
                                onChange={(e) => handleParticipantConfigChange(levelKey, 'name', e.target.value)}
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>الأدوار المستهدفة</label>
                            <select 
                                multiple 
                                value={level.roles} 
                                onChange={(e) => handleParticipantConfigChange(levelKey, 'roles', Array.from(e.target.selectedOptions, option => option.value))}
                                style={{ height: '80px' }}
                            >
                                <option value="admin">مدير</option>
                                <option value="head">رئيس قسم</option>
                                <option value="teacher">معلم</option>
                                <option value="student">طالب</option>
                                <option value="parent">ولي أمر</option>
                                <option value="worker">عامل</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>الحد الأدنى</label>
                            <input 
                                type="number" 
                                value={level.min} 
                                onChange={(e) => handleParticipantConfigChange(levelKey, 'min', e.target.value)}
                                min="0"
                            />
                        </div>

                        <div className="form-group">
                            <label>الحد الأقصى</label>
                            <input 
                                type="number" 
                                value={level.max} 
                                onChange={(e) => handleParticipantConfigChange(levelKey, 'max', e.target.value)}
                                min="1"
                            />
                        </div>

                        <div className="form-group">
                            <label>العدد المثالي</label>
                            <input 
                                type="number" 
                                value={level.optimal} 
                                onChange={(e) => handleParticipantConfigChange(levelKey, 'optimal', e.target.value)}
                                min="1"
                            />
                        </div>
                    </div>
                </div>
            ))}

            <div className="auto-launch-section">
                <h4><i className="fas fa-rocket"></i> خيارات الإطلاق التلقائي</h4>
                <div className="auto-launch-options">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={formData.auto_launch_settings.auto_launch_on_max_capacity}
                            onChange={() => handleAutoLaunchChange('auto_launch_on_max_capacity')}
                        />
                        <span>انطلاق تلقائي عند اكتمال العدد الأقصى قبل تاريخ بدء الدورة</span>
                    </label>
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={formData.auto_launch_settings.auto_launch_on_optimal_capacity}
                            onChange={() => handleAutoLaunchChange('auto_launch_on_optimal_capacity')}
                        />
                        <span>انطلاق تلقائي عند بلوغ العدد المثالي قبل بدء الدورة بيوم واحد</span>
                    </label>
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={formData.auto_launch_settings.auto_launch_on_min_capacity}
                            onChange={() => handleAutoLaunchChange('auto_launch_on_min_capacity')}
                        />
                        <span>انطلاق تلقائي عند بلوغ الحد الأدنى قبل بدء الدورة بيوم واحد</span>
                    </label>
                </div>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="step-content">
            <h3><i className="fas fa-magic"></i> الملء التلقائي (اختياري)</h3>
            <p className="step-description">يمكنك تعيين قيم افتراضية لتسريع عملية جدولة الدورة</p>

            <div className="form-group">
                <label>رابط اللقاء الثابت</label>
                <input
                    type="url"
                    value={formData.autoFill.meetingLink}
                    onChange={(e) => handleAutoFillChange('meetingLink', e.target.value)}
                    placeholder="https://zoom.us/j/123456789"
                />
            </div>

            <div className="form-group">
                <label>نمط رابط المحتوى (استخدم ** للأرقام المتغيرة)</label>
                <input
                    type="text"
                    value={formData.autoFill.contentLinkPattern}
                    onChange={(e) => handleAutoFillChange('contentLinkPattern', e.target.value)}
                    placeholder="https://example.com/lesson-**.pdf"
                />
                <small>مثال: https://example.com/lesson-**.pdf سيصبح lesson-01.pdf, lesson-02.pdf</small>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label>رقم البداية</label>
                    <input
                        type="number"
                        value={formData.autoFill.startNumber}
                        onChange={(e) => handleAutoFillChange('startNumber', parseInt(e.target.value) || 1)}
                        min="1"
                    />
                </div>
                <div className="form-group">
                    <label>رقم النهاية</label>
                    <input
                        type="number"
                        value={formData.autoFill.endNumber}
                        onChange={(e) => handleAutoFillChange('endNumber', parseInt(e.target.value) || 10)}
                        min="1"
                    />
                </div>
            </div>

            <div className="task-templates-section">
                <h4>قوالب التكاليف المفصلة لكل درجة</h4>
                
                {Object.entries(formData.participant_config).map(([levelKey, config]) => (
                    <div key={levelKey} className="level-task-templates">
                        <h5>
                            {levelKey === 'level_1' && '🎯 درجة 1 - المشرف'}
                            {levelKey === 'level_2' && '👨‍🏫 درجة 2 - المسؤول'}
                            {levelKey === 'level_3' && '🎓 درجة 3 - المتلقي'}
                            ({config.name})
                        </h5>
                        
                        <div className="task-template-list">
                            {(formData.taskTemplates[levelKey] || []).map((task, index) => (
                                <div key={index} className="task-template-item">
                                    <div className="task-template-header">
                                        <select
                                            value={task.type}
                                            onChange={(e) => updateTaskTemplate(levelKey, index, 'type', e.target.value)}
                                            className="task-type-select"
                                        >
                                            <option value="">اختر نوع التكليف</option>
                                            {levelKey === 'level_3' && (
                                                <>
                                                    <option value="exam">امتحان يومي</option>
                                                    <option value="homework">واجب منزلي</option>
                                                    <option value="reading">قراءة</option>
                                                    <option value="daily_wird">ورد يومي</option>
                                                </>
                                            )}
                                            {levelKey === 'level_2' && (
                                                <>
                                                    <option value="review">تقييم الطلاب</option>
                                                    <option value="grading">تصحيح الواجبات</option>
                                                    <option value="attendance">تسجيل الحضور</option>
                                                </>
                                            )}
                                            {levelKey === 'level_1' && (
                                                <>
                                                    <option value="review">مراجعة التقارير</option>
                                                    <option value="supervision">متابعة الأداء</option>
                                                    <option value="communication">التواصل مع الغائبين</option>
                                                </>
                                            )}
                                        </select>
                                        
                                        <input
                                            type="text"
                                            placeholder="عنوان التكليف"
                                            value={task.title}
                                            onChange={(e) => updateTaskTemplate(levelKey, index, 'title', e.target.value)}
                                            className="task-title-input"
                                        />
                                        
                                        <input
                                            type="number"
                                            placeholder="الدرجة"
                                            value={task.maxScore}
                                            onChange={(e) => updateTaskTemplate(levelKey, index, 'maxScore', parseInt(e.target.value) || 100)}
                                            className="task-score-input"
                                            min="1"
                                            max="100"
                                        />
                                        
                                        <button
                                            type="button"
                                            onClick={() => removeTaskTemplate(levelKey, index)}
                                            className="remove-task-btn"
                                            title="حذف التكليف"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                    
                                    <textarea
                                        placeholder="وصف التكليف"
                                        value={task.description}
                                        onChange={(e) => updateTaskTemplate(levelKey, index, 'description', e.target.value)}
                                        className="task-description-textarea"
                                        rows="2"
                                    />
                                    
                                    <textarea
                                        placeholder="تعليمات التنفيذ"
                                        value={task.instructions}
                                        onChange={(e) => updateTaskTemplate(levelKey, index, 'instructions', e.target.value)}
                                        className="task-instructions-textarea"
                                        rows="2"
                                    />
                                </div>
                            ))}
                            
                            <button
                                type="button"
                                onClick={() => addTaskTemplate(levelKey)}
                                className="add-task-template-btn"
                            >
                                ➕ إضافة تكليف جديد
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Legacy simple task input for backward compatibility */}
            <div className="default-tasks-section">
                <h4>التكاليف الافتراضية البسيطة (اختياري)</h4>
                
                <div className="form-group">
                    <label>تكاليف المتلقين (درجة 3) - الطلاب</label>
                    <textarea
                        value={formData.autoFill.defaultTasks.level_3}
                        onChange={(e) => handleAutoFillChange('defaultTasks.level_3', e.target.value)}
                        placeholder="امتحان اليوم، مراجعة المحتوى..."
                        rows="2"
                    />
                </div>

                <div className="form-group">
                    <label>تكاليف المسؤولين (درجة 2) - المعلمين</label>
                    <textarea
                        value={formData.autoFill.defaultTasks.level_2}
                        onChange={(e) => handleAutoFillChange('defaultTasks.level_2', e.target.value)}
                        placeholder="إعداد المحتوى، متابعة الطلاب..."
                        rows="2"
                    />
                </div>

                <div className="form-group">
                    <label>تكاليف المشرفين (درجة 1)</label>
                    <textarea
                        value={formData.autoFill.defaultTasks.level_1}
                        onChange={(e) => handleAutoFillChange('defaultTasks.level_1', e.target.value)}
                        placeholder="مراجعة التقارير، تقييم الأداء..."
                        rows="2"
                    />
                </div>
            </div>
        </div>
    );

    const renderStep4 = () => (
        <div className="step-content">
            <h3><i className="fas fa-check-circle"></i> مراجعة وتأكيد</h3>
            <div className="summary">
                <div className="summary-section">
                    <h4>معلومات الدورة</h4>
                    <p><strong>الاسم:</strong> {formData.name}</p>
                    <p><strong>المدة:</strong> {formData.duration_days} أيام</p>
                    <p><strong>تاريخ البدء:</strong> {formData.start_date}</p>
                </div>

                <div className="summary-section">
                    <h4>الأدوار المحددة</h4>
                    {Object.entries(formData.participant_config).map(([levelKey, level]) => (
                        <div key={levelKey}>
                            <strong>{level.name}:</strong>
                            <ul>
                                <li>الأدوار: {level.roles.join(', ')}</li>
                                <li>الحد الأدنى: {level.min}</li>
                                <li>الحد الأقصى: {level.max}</li>
                                <li>العدد المثالي: {level.optimal}</li>
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderStep4Tasks = () => (
        <div className="step-content">
            <h3><i className="fas fa-tasks"></i> معاينة وإدارة المهام</h3>
            <p className="step-description">معاينة المهام التي سيتم إنشاؤها تلقائياً للدورة</p>
            
            <TaskPreviewCreator
                courseData={formData}
                onTasksChange={handleTasksChange}
                enrollments={enrollments}
                courseSchedule={courseSchedule}
            />
        </div>
    );

    const renderStep5 = () => (
        <div className="step-content">
            <h3><i className="fas fa-check-circle"></i> مراجعة وتأكيد</h3>
            <div className="summary">
                <div className="summary-section">
                    <h4>معلومات الدورة</h4>
                    <p><strong>الاسم:</strong> {formData.name}</p>
                    <p><strong>المدة:</strong> {formData.duration_days} أيام</p>
                    <p><strong>تاريخ البدء:</strong> {formData.start_date}</p>
                    <p><strong>أيام الأسبوع:</strong> {formData.days_per_week}</p>
                    <p><strong>ساعات اليوم:</strong> {formData.hours_per_day}</p>
                </div>

                <div className="summary-section">
                    <h4>الأدوار المحددة</h4>
                    {Object.entries(formData.participant_config).map(([levelKey, level]) => (
                        <div key={levelKey}>
                            <strong>{level.name}:</strong>
                            <ul>
                                <li>الأدوار: {level.roles.join(', ')}</li>
                                <li>الحد الأدنى: {level.min}</li>
                                <li>الحد الأقصى: {level.max}</li>
                                <li>العدد المثالي: {level.optimal}</li>
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="summary-section">
                    <h4>إحصائيات المهام</h4>
                    <p><strong>إجمالي المهام:</strong> {generatedTasks.length}</p>
                    <p><strong>المهام اليومية:</strong> {generatedTasks.filter(t => t.type === 'daily').length}</p>
                    <p><strong>المهام الثابتة:</strong> {generatedTasks.filter(t => t.type === 'fixed').length}</p>
                    <p><strong>مهام الطلاب:</strong> {generatedTasks.filter(t => t.targetRole === 'student').length}</p>
                    <p><strong>مهام المعلمين:</strong> {generatedTasks.filter(t => t.targetRole === 'teacher').length}</p>
                    <p><strong>مهام المشرفين:</strong> {generatedTasks.filter(t => t.targetRole === 'supervisor').length}</p>
                </div>

                <div className="summary-section">
                    <h4>الجدول الزمني</h4>
                    <p><strong>عدد أيام الدورة:</strong> {courseSchedule.length}</p>
                    <p><strong>تاريخ البداية:</strong> {courseSchedule[0]?.scheduled_date}</p>
                    <p><strong>تاريخ النهاية:</strong> {courseSchedule[courseSchedule.length - 1]?.scheduled_date}</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">إنشاء دورة جديدة</h2>
            
            {/* Step Navigation */}
            <div className="mb-8">
                <div className="flex justify-between items-center">
                    {[
                        { step: 1, title: 'المعلومات الأساسية', icon: '📝' },
                        { step: 2, title: 'الأدوار والمشاركين', icon: '👥' },
                        { step: 3, title: 'الملء التلقائي', icon: '⚙️' },
                        { step: 4, title: 'معاينة المهام', icon: '📋' },
                        { step: 5, title: 'المراجعة والتأكيد', icon: '✅' }
                    ].map(({ step, title, icon }) => (
                        <div key={step} className={`flex flex-col items-center ${
                            currentStep >= step ? 'text-blue-600' : 'text-gray-400'
                        }`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                                currentStep >= step ? 'bg-blue-100 border-2 border-blue-600' : 'bg-gray-100 border-2 border-gray-300'
                            }`}>
                                {currentStep > step ? '✓' : icon}
                            </div>
                            <span className="text-xs mt-2 text-center">{title}</span>
                        </div>
                    ))}
                </div>
                <div className="mt-4 bg-gray-200 rounded-full h-2">
                    <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(currentStep / 5) * 100}%` }}
                    ></div>
                </div>
            </div>

            {/* Display Messages */}
            {message.text && (
                <div className={`mb-4 p-4 rounded-lg ${
                    message.type === 'error' ? 'bg-red-100 text-red-700 border border-red-300' : 
                    'bg-green-100 text-green-700 border border-green-300'
                }`}>
                    {message.text}
                </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6" dir="rtl">
                {/* Render current step */}
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}
                {currentStep === 4 && renderStep4Tasks()}
                {currentStep === 5 && renderStep5()}

                {/* Navigation buttons */}
                <div className="flex justify-between pt-6 border-t">
                    <button
                        type="button"
                        onClick={prevStep}
                        disabled={currentStep === 1}
                        className={`px-6 py-2 rounded-md ${
                            currentStep === 1 
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                                : 'bg-gray-500 text-white hover:bg-gray-600'
                        }`}
                    >
                        السابق
                    </button>
                    
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-6 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                        >
                            إلغاء
                        </button>
                        
                        {currentStep < 5 ? (
                            <button
                                type="button"
                                onClick={nextStep}
                                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                التالي
                            </button>
                        ) : (
                            <button
                                type="submit"
                                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                            >
                                إنشاء الدورة
                            </button>
                        )}
                    </div>
                </div>
            </form>
        </div>
    );
};

export default CourseCreationForm;