import React, { useState, useEffect } from 'react';

const TaskPreviewCreator = ({ 
    courseData, 
    onTasksChange, 
    enrollments = [],
    courseSchedule = [] 
}) => {
    const [tasks, setTasks] = useState([]);
    const [selectedTaskType, setSelectedTaskType] = useState('daily_reading');
    const [previewMode, setPreviewMode] = useState('list');
    const [customTasks, setCustomTasks] = useState([]);
    const [showCustomTaskForm, setShowCustomTaskForm] = useState(false);

    // Default task templates
    const taskTemplates = {
        // Student Daily Tasks
        daily_reading: {
            title: 'قراءة يومية - اليوم {day}',
            description: 'قراءة المادة المطلوبة لليوم {day}',
            type: 'daily',
            duration: 24,
            targetRole: 'student',
            maxScore: 10,
            penalty: 50,
            instructions: 'يجب إكمال القراءة خلال 24 ساعة من بداية اليوم الدراسي'
        },
        daily_quiz: {
            title: 'اختبار يومي - اليوم {day}',
            description: 'اختبار قصير على مادة اليوم {day}',
            type: 'daily',
            duration: 24,
            targetRole: 'student',
            maxScore: 20,
            penalty: 50,
            instructions: 'يجب إكمال الاختبار خلال 24 ساعة من إتاحته'
        },
        homework: {
            title: 'واجب الأسبوع {week}',
            description: 'واجب منزلي شامل للأسبوع {week}',
            type: 'fixed',
            duration: 72,
            targetRole: 'student',
            maxScore: 50,
            penalty: 20,
            instructions: 'يجب تسليم الواجب خلال 3 أيام من تاريخ الإصدار',
            frequency: 'weekly'
        },
        exam: {
            title: 'امتحان الأسبوع {week}',
            description: 'امتحان شامل للأسبوع {week}',
            type: 'fixed',
            duration: 168,
            targetRole: 'student',
            maxScore: 100,
            penalty: 30,
            instructions: 'يجب إكمال الامتحان خلال أسبوع من تاريخ الإصدار',
            frequency: 'weekly'
        },
        // Teacher Tasks
        daily_evaluation: {
            title: 'تقييم طلاب اليوم {day}',
            description: 'تقييم أداء الطلاب في اليوم {day}',
            type: 'daily',
            duration: 24,
            targetRole: 'teacher',
            maxScore: 0,
            penalty: 0,
            instructions: 'يجب إكمال تقييم جميع الطلاب خلال 24 ساعة من انتهاء الحصة'
        },
        preparation: {
            title: 'تحضير مادة اليوم {day}',
            description: 'تحضير وإعداد مادة اليوم {day}',
            type: 'daily',
            duration: 24,
            targetRole: 'teacher',
            maxScore: 0,
            penalty: 0,
            instructions: 'يجب إكمال التحضير قبل بداية اليوم التالي'
        },
        weekly_report: {
            title: 'تقرير الأسبوع {week}',
            description: 'تقرير شامل عن أداء الطلاب والتقدم الأسبوعي',
            type: 'fixed',
            duration: 72,
            targetRole: 'teacher',
            maxScore: 0,
            penalty: 10,
            instructions: 'يجب تسليم التقرير خلال 3 أيام من نهاية الأسبوع',
            frequency: 'weekly'
        },
        // Supervisor Tasks
        daily_monitoring: {
            title: 'مراقبة سير الدورة - اليوم {day}',
            description: 'مراجعة ومراقبة سير الدورة في اليوم {day}',
            type: 'daily',
            duration: 24,
            targetRole: 'supervisor',
            maxScore: 0,
            penalty: 0,
            instructions: 'مراجعة يومية لضمان سير الدورة بشكل صحيح'
        },
        weekly_evaluation: {
            title: 'تقييم أسبوعي - الأسبوع {week}',
            description: 'تقييم شامل لأداء المعلمين والطلاب',
            type: 'fixed',
            duration: 168,
            targetRole: 'supervisor',
            maxScore: 0,
            penalty: 10,
            instructions: 'تقييم شامل يجب إكماله خلال أسبوع',
            frequency: 'weekly'
        }
    };

    useEffect(() => {
        generateAutomaticTasks();
    }, [courseData, courseSchedule, enrollments]);

    const generateAutomaticTasks = () => {
        if (!courseData || !courseSchedule.length) return;

        const generatedTasks = [];
        const startDate = new Date(courseData.start_date);
        
        // Group enrollments by role
        const enrollmentsByRole = enrollments.reduce((acc, enrollment) => {
            const role = enrollment.role || 'student';
            if (!acc[role]) acc[role] = [];
            acc[role].push(enrollment);
            return acc;
        }, {});

        // Generate tasks for each day in the schedule
        courseSchedule.forEach((scheduleDay, index) => {
            const dayNumber = index + 1;
            const weekNumber = Math.ceil(dayNumber / 7);
            const scheduleDate = new Date(scheduleDay.scheduled_date);

            // Generate daily tasks for each role
            Object.keys(enrollmentsByRole).forEach(role => {
                const roleEnrollments = enrollmentsByRole[role];
                
                // Daily tasks
                Object.keys(taskTemplates).forEach(templateKey => {
                    const template = taskTemplates[templateKey];
                    
                    if (template.targetRole === role && template.type === 'daily') {
                        roleEnrollments.forEach(enrollment => {
                            generatedTasks.push({
                                id: `${templateKey}_${dayNumber}_${enrollment.user_id}`,
                                templateKey,
                                title: template.title.replace('{day}', dayNumber),
                                description: template.description.replace('{day}', dayNumber),
                                type: template.type,
                                taskType: templateKey,
                                duration: template.duration,
                                targetRole: role,
                                assignedTo: enrollment.user_id,
                                assignedToName: enrollment.name,
                                maxScore: template.maxScore,
                                penalty: template.penalty,
                                instructions: template.instructions,
                                scheduleDay: dayNumber,
                                scheduledDate: scheduleDate,
                                dueDate: new Date(scheduleDate.getTime() + template.duration * 60 * 60 * 1000),
                                isActive: false,
                                status: 'scheduled'
                            });
                        });
                    }
                });

                // Weekly/Fixed tasks
                if (dayNumber % 7 === 0) { // End of week
                    Object.keys(taskTemplates).forEach(templateKey => {
                        const template = taskTemplates[templateKey];
                        
                        if (template.targetRole === role && template.frequency === 'weekly') {
                            roleEnrollments.forEach(enrollment => {
                                generatedTasks.push({
                                    id: `${templateKey}_week${weekNumber}_${enrollment.user_id}`,
                                    templateKey,
                                    title: template.title.replace('{week}', weekNumber),
                                    description: template.description.replace('{week}', weekNumber),
                                    type: template.type,
                                    taskType: templateKey,
                                    duration: template.duration,
                                    targetRole: role,
                                    assignedTo: enrollment.user_id,
                                    assignedToName: enrollment.name,
                                    maxScore: template.maxScore,
                                    penalty: template.penalty,
                                    instructions: template.instructions,
                                    scheduleDay: dayNumber,
                                    scheduledDate: scheduleDate,
                                    dueDate: new Date(scheduleDate.getTime() + template.duration * 60 * 60 * 1000),
                                    isActive: false,
                                    status: 'scheduled'
                                });
                            });
                        }
                    });
                }
            });
        });

        const allTasks = [...generatedTasks, ...customTasks];
        setTasks(allTasks);
        onTasksChange && onTasksChange(allTasks);
    };

    const addCustomTask = (customTask) => {
        const newCustomTasks = [...customTasks, { ...customTask, id: `custom_${Date.now()}` }];
        setCustomTasks(newCustomTasks);
        setShowCustomTaskForm(false);
    };

    const removeTask = (taskId) => {
        const updatedTasks = tasks.filter(task => task.id !== taskId);
        setTasks(updatedTasks);
        onTasksChange && onTasksChange(updatedTasks);
    };

    const getTasksByRole = (role) => {
        return tasks.filter(task => task.targetRole === role);
    };

    const getTasksByType = (type) => {
        return tasks.filter(task => task.type === type);
    };

    const TaskCard = ({ task, showRemove = false }) => (
        <div className={`border rounded-lg p-4 ${
            task.type === 'daily' ? 'border-orange-200 bg-orange-50' : 'border-blue-200 bg-blue-50'
        }`}>
            <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-sm">{task.title}</h4>
                <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                        task.type === 'daily' ? 'bg-orange-200 text-orange-800' : 'bg-blue-200 text-blue-800'
                    }`}>
                        {task.type === 'daily' ? 'يومي' : 'ثابت'}
                    </span>
                    {showRemove && (
                        <button
                            onClick={() => removeTask(task.id)}
                            className="text-red-500 hover:text-red-700 text-xs"
                        >
                            حذف
                        </button>
                    )}
                </div>
            </div>
            
            <p className="text-gray-600 text-xs mb-2">{task.description}</p>
            
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                <div><strong>المكلف:</strong> {task.assignedToName}</div>
                <div><strong>الدور:</strong> {task.targetRole}</div>
                <div><strong>المدة:</strong> {task.duration} ساعة</div>
                <div><strong>النقاط:</strong> {task.maxScore}</div>
                <div><strong>اليوم:</strong> {task.scheduleDay}</div>
                <div><strong>الموعد النهائي:</strong> {task.dueDate.toLocaleDateString('ar-SA')}</div>
            </div>
            
            {task.penalty > 0 && (
                <div className="mt-2 text-xs text-red-600">
                    <strong>غرامة التأخير:</strong> {task.penalty}%
                </div>
            )}
            
            <div className="mt-2 text-xs text-gray-600">
                <strong>التعليمات:</strong> {task.instructions}
            </div>
        </div>
    );

    const CustomTaskForm = () => {
        const [formData, setFormData] = useState({
            title: '',
            description: '',
            type: 'daily',
            duration: 24,
            targetRole: 'student',
            maxScore: 10,
            penalty: 0,
            instructions: '',
            scheduleDay: 1
        });

        const handleSubmit = (e) => {
            e.preventDefault();
            const selectedEnrollment = enrollments.find(e => e.role === formData.targetRole);
            if (!selectedEnrollment) {
                alert('لا يوجد مستخدمين بهذا الدور');
                return;
            }

            const scheduleDate = courseSchedule[formData.scheduleDay - 1]?.scheduled_date;
            if (!scheduleDate) {
                alert('يوم غير صحيح في الجدول');
                return;
            }

            addCustomTask({
                ...formData,
                assignedTo: selectedEnrollment.user_id,
                assignedToName: selectedEnrollment.name,
                scheduledDate: new Date(scheduleDate),
                dueDate: new Date(new Date(scheduleDate).getTime() + formData.duration * 60 * 60 * 1000),
                isActive: false,
                status: 'scheduled'
            });
        };

        return (
            <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-gray-50">
                <h3 className="font-semibold">إضافة مهمة مخصصة</h3>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">العنوان</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                            className="w-full p-2 border rounded-md text-sm"
                            required
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium mb-1">النوع</label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({...formData, type: e.target.value})}
                            className="w-full p-2 border rounded-md text-sm"
                        >
                            <option value="daily">يومي (24 ساعة)</option>
                            <option value="fixed">ثابت (مدة مخصصة)</option>
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium mb-1">الدور المستهدف</label>
                        <select
                            value={formData.targetRole}
                            onChange={(e) => setFormData({...formData, targetRole: e.target.value})}
                            className="w-full p-2 border rounded-md text-sm"
                        >
                            <option value="student">طالب</option>
                            <option value="teacher">معلم</option>
                            <option value="supervisor">مشرف</option>
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium mb-1">المدة (ساعات)</label>
                        <input
                            type="number"
                            value={formData.duration}
                            onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
                            className="w-full p-2 border rounded-md text-sm"
                            min="1"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium mb-1">النقاط</label>
                        <input
                            type="number"
                            value={formData.maxScore}
                            onChange={(e) => setFormData({...formData, maxScore: parseInt(e.target.value)})}
                            className="w-full p-2 border rounded-md text-sm"
                            min="0"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium mb-1">غرامة التأخير (%)</label>
                        <input
                            type="number"
                            value={formData.penalty}
                            onChange={(e) => setFormData({...formData, penalty: parseInt(e.target.value)})}
                            className="w-full p-2 border rounded-md text-sm"
                            min="0"
                            max="100"
                        />
                    </div>
                </div>
                
                <div>
                    <label className="block text-sm font-medium mb-1">الوصف</label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="w-full p-2 border rounded-md text-sm"
                        rows="2"
                        required
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium mb-1">التعليمات</label>
                    <textarea
                        value={formData.instructions}
                        onChange={(e) => setFormData({...formData, instructions: e.target.value})}
                        className="w-full p-2 border rounded-md text-sm"
                        rows="2"
                    />
                </div>
                
                <div className="flex gap-2">
                    <button
                        type="submit"
                        className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-600"
                    >
                        إضافة المهمة
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowCustomTaskForm(false)}
                        className="bg-gray-500 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-600"
                    >
                        إلغاء
                    </button>
                </div>
            </form>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">معاينة وإدارة المهام</h3>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowCustomTaskForm(!showCustomTaskForm)}
                        className="bg-green-500 text-white px-4 py-2 rounded-md text-sm hover:bg-green-600"
                    >
                        إضافة مهمة مخصصة
                    </button>
                    <button
                        onClick={generateAutomaticTasks}
                        className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-600"
                    >
                        إعادة توليد المهام
                    </button>
                </div>
            </div>

            {showCustomTaskForm && <CustomTaskForm />}

            {/* Preview Mode Selector */}
            <div className="flex gap-2 mb-4">
                {[
                    { key: 'list', label: 'قائمة شاملة' },
                    { key: 'role', label: 'حسب الدور' },
                    { key: 'type', label: 'حسب النوع' },
                    { key: 'timeline', label: 'الجدول الزمني' }
                ].map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setPreviewMode(key)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            previewMode === key
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Task Statistics */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">{tasks.length}</div>
                    <div className="text-sm text-gray-600">إجمالي المهام</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-orange-600">{getTasksByType('daily').length}</div>
                    <div className="text-sm text-gray-600">مهام يومية</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">{getTasksByType('fixed').length}</div>
                    <div className="text-sm text-gray-600">مهام ثابتة</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-600">{customTasks.length}</div>
                    <div className="text-sm text-gray-600">مهام مخصصة</div>
                </div>
            </div>

            {/* Task Preview */}
            <div className="border rounded-lg p-4">
                {previewMode === 'list' && (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {tasks.map(task => (
                            <TaskCard key={task.id} task={task} showRemove={task.id.startsWith('custom_')} />
                        ))}
                    </div>
                )}

                {previewMode === 'role' && (
                    <div className="space-y-6">
                        {['student', 'teacher', 'supervisor'].map(role => (
                            <div key={role}>
                                <h4 className="font-semibold mb-3 text-lg">
                                    مهام {role === 'student' ? 'الطلاب' : role === 'teacher' ? 'المعلمين' : 'المشرفين'}
                                    <span className="text-sm text-gray-500 ml-2">({getTasksByRole(role).length} مهمة)</span>
                                </h4>
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {getTasksByRole(role).map(task => (
                                        <TaskCard key={task.id} task={task} showRemove={task.id.startsWith('custom_')} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {previewMode === 'type' && (
                    <div className="space-y-6">
                        <div>
                            <h4 className="font-semibold mb-3 text-lg">
                                المهام اليومية (تنتهي خلال 24 ساعة)
                                <span className="text-sm text-gray-500 ml-2">({getTasksByType('daily').length} مهمة)</span>
                            </h4>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {getTasksByType('daily').map(task => (
                                    <TaskCard key={task.id} task={task} showRemove={task.id.startsWith('custom_')} />
                                ))}
                            </div>
                        </div>
                        
                        <div>
                            <h4 className="font-semibold mb-3 text-lg">
                                المهام الثابتة (مواعيد نهائية محددة)
                                <span className="text-sm text-gray-500 ml-2">({getTasksByType('fixed').length} مهمة)</span>
                            </h4>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {getTasksByType('fixed').map(task => (
                                    <TaskCard key={task.id} task={task} showRemove={task.id.startsWith('custom_')} />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {previewMode === 'timeline' && (
                    <div className="space-y-4">
                        {courseSchedule.map((scheduleDay, index) => {
                            const dayNumber = index + 1;
                            const dayTasks = tasks.filter(task => task.scheduleDay === dayNumber);
                            
                            return (
                                <div key={dayNumber} className="border rounded-lg p-4">
                                    <h4 className="font-semibold mb-3">
                                        اليوم {dayNumber} - {new Date(scheduleDay.scheduled_date).toLocaleDateString('ar-SA')}
                                        <span className="text-sm text-gray-500 ml-2">({dayTasks.length} مهمة)</span>
                                    </h4>
                                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                                        {dayTasks.map(task => (
                                            <TaskCard key={task.id} task={task} showRemove={task.id.startsWith('custom_')} />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {tasks.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        لا توجد مهام متاحة. تأكد من إضافة جدول الدورة والمشاركين.
                    </div>
                )}
            </div>
        </div>
    );
};

export default TaskPreviewCreator;