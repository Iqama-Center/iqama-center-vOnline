import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import useUserStore from '../stores/userStore';
import TaskGenerationStep from './TaskGenerationStep';
import { getTeachersFromUsers } from '../lib/userUtils';

const CourseForm = ({ course: initialCourse, allUsers = [] }) => {
    const [currentStep, setCurrentStep] = useState(1);
    
    const {
        users,
        loading,
        error,
        fetchUsers
    } = useUserStore();

    const [course, setCourse] = useState({
        name: '',
        description: '',
        content_outline: '',
        duration_days: 30,
        start_date: '',
        days_per_week: 2,
        hours_per_day: 3.0,
        course_fee: 300,
        max_enrollment: 15,
        details: {
            currency: 'EGP',
            teachers: [],
            target_roles: [],
            prerequisites: []
        },
        participant_config: {
            level_1: { name: 'مشرف', roles: ['admin', 'head'], min: 1, max: 2, optimal: 1 },
            level_2: { name: 'معلم/مدرب', roles: ['teacher'], min: 1, max: 3, optimal: 2 },
            level_3: { name: 'طالب', roles: ['student'], min: 5, max: 20, optimal: 12 }
        },
        auto_launch_settings: {
            auto_launch_on_max_capacity: false,
            auto_launch_on_optimal_capacity: false,
            auto_launch_on_min_capacity: false
        },
        task_generation_config: {
            enabled: false,
            levels: {},
            customTasks: {}
        }
    });

    const router = useRouter();
    
    const teacherUsers = getTeachersFromUsers(allUsers);
    
    const availableUsers = (allUsers && allUsers.length > 0) ? allUsers :
                          (users && users.length > 0) ? users :
                          (teacherUsers && teacherUsers.length > 0) ? teacherUsers : [];

    useEffect(() => {
        fetchUsers().catch((error) => {
            console.error('Failed to load users in CourseForm:', error);
        });
    }, [fetchUsers]);

    useEffect(() => {
        if (initialCourse) {
            const parseJsonField = (field, defaultValue) => {
                if (typeof field === 'string') {
                    try {
                        return JSON.parse(field);
                    } catch (e) {
                        return defaultValue;
                    }
                }
                return field || defaultValue;
            };

            const details = parseJsonField(initialCourse.details, {});

            setCourse({
                ...initialCourse,
                name: initialCourse.name || '',
                description: initialCourse.description || '',
                duration_days: initialCourse.duration_days || 7,
                start_date: initialCourse.start_date ? new Date(initialCourse.start_date).toISOString().split('T')[0] : '',
                days_per_week: initialCourse.days_per_week || 5,
                hours_per_day: initialCourse.hours_per_day || 2.0,
                content_outline: initialCourse.content_outline || '',
                course_fee: initialCourse.course_fee ?? details.cost ?? 0,
                max_enrollment: initialCourse.max_enrollment ?? details.max_seats ?? 15,
                details: {
                    ...details,
                    currency: details.currency || 'EGP',
                    teachers: details.teachers || [],
                    target_roles: details.target_roles || [],
                    prerequisites: details.prerequisites || []
                },
                participant_config: parseJsonField(initialCourse.participant_config, {
                    level_1: { name: 'مشرف', roles: ['admin', 'head'], min: 1, max: 2, optimal: 1 },
                    level_2: { name: 'معلم/مدرب', roles: ['teacher'], min: 1, max: 3, optimal: 2 },
                    level_3: { name: 'طالب', roles: ['student'], min: 5, max: 20, optimal: 12 }
                }),
                auto_launch_settings: parseJsonField(initialCourse.auto_launch_settings, {
                    auto_launch_on_max_capacity: false,
                    auto_launch_on_optimal_capacity: false,
                    auto_launch_on_min_capacity: false
                }),
                task_generation_config: parseJsonField(initialCourse.task_generation_config, {
                    enabled: false,
                    levels: {},
                    customTasks: {}
                })
            });
        }
    }, [initialCourse]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        const parsedValue = type === 'number' ? parseFloat(value) || 0 : value;
        setCourse(prev => ({ ...prev, [name]: parsedValue }));
    };

    const handleDetailsChange = (e) => {
        const { name, value, type } = e.target;
        setCourse(prev => ({
            ...prev,
            details: {
                ...prev.details,
                [name]: type === 'number' ? parseInt(value, 10) : value
            }
        }));
    };

    const handleTeachersChange = (e) => {
        const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
        setCourse(prev => ({
            ...prev,
            details: { ...prev.details, teachers: selectedOptions }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const useTaskGeneration = course.task_generation_config?.enabled;
        const url = initialCourse 
            ? `/api/courses/${initialCourse.id}` 
            : (useTaskGeneration ? '/api/courses/create-with-tasks' : '/api/courses/create-advanced');
        const method = initialCourse ? 'PUT' : 'POST';

        const { task_generation_config, ...restOfCourse } = course;
        const requestBody = {
            ...restOfCourse,
            task_generation_enabled: useTaskGeneration,
            enhanced_task_config: useTaskGeneration ? task_generation_config.customTasks : {}
        };

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            const result = await response.json();
            if (response.ok) {
                const successMessage = useTaskGeneration 
                    ? `✅ تم حفظ الدورة وإنشاء ${result.tasksGenerated || 0} مهمة بنجاح!`
                    : '✅ تم حفظ الدورة بنجاح!';
                alert(successMessage);
                
                if (result.id) {
                    router.push(`/admin/courses/${result.id}/schedule`);
                } else {
                    router.push('/admin/courses/manage');
                }
            } else {
                alert('⚠️ خطأ: ' + result.message);
            }
        } catch (err) {
            alert('🚫 خطأ في الاتصال بالخادم.');
        }
    };

    const handleParticipantConfigChange = (level, field, value) => {
        setCourse(prev => ({
            ...prev,
            participant_config: {
                ...prev.participant_config,
                [level]: {
                    ...prev.participant_config[level],
                    [field]: value
                }
            }
        }));
    };

    const handleAutoLaunchChange = (setting, value) => {
        setCourse(prev => ({
            ...prev,
            auto_launch_settings: {
                ...prev.auto_launch_settings,
                [setting]: value
            }
        }));
    };

    const handleTaskConfigChange = (taskConfig) => {
        setCourse(prev => ({
            ...prev,
            task_generation_config: taskConfig
        }));
    };

    const nextStep = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        if (currentStep === 1) {
            const requiredFields = [
                { field: course.name, name: 'اسم الدورة' },
                { field: course.description, name: 'وصف الدورة السريع' },
                { field: course.content_outline, name: 'جدول محتويات الدورة' },
                { field: course.duration_days, name: 'مدة الدورة (بالأيام)' },
                { field: course.start_date, name: 'تاريخ بدء الدورة' },
                { field: course.days_per_week, name: 'عدد أيام الدورة في الأسبوع' },
                { field: course.hours_per_day, name: 'مدة اليوم (بالساعات)' },
            ];
            
            const missingFields = requiredFields.filter(item => !item.field || item.field === '' || item.field === 0);
            
            if (missingFields.length > 0) {
                const missingFieldNames = missingFields.map(item => item.name).join(', ');
                alert(`يرجى ملء الحقول المطلوبة التالية:\n${missingFieldNames}`);
                return;
            }
        }
        
        setCurrentStep(prev => Math.min(prev + 1, 4));
    };
    
    const prevStep = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const renderStep1 = () => (
        <div className="step-content">
            <h3 style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', margin: 0, padding: '25px 30px', fontSize: '1.4rem', fontWeight: 600, textAlign: 'center', borderRadius: 0 }}>📋 المعلومات الأساسية للدورة</h3>
            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '25px', padding: '30px', background: '#fafbfc' }}>
                <div className="form-group full-width" style={{ gridColumn: '1 / -1' }}>
                    <label htmlFor="name" style={{ marginBottom: '15px', fontWeight: 700, color: '#1e293b', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '12px', fontFamily: 'Tajawal, Cairo, sans-serif' }}>🏷️ اسم الدورة</label>
                    <input type="text" id="name" name="name" value={course.name} onChange={handleChange} required style={{ padding: '12px 16px', border: '2px solid #0ea5e9', borderRadius: '8px', fontSize: '1.1rem', fontFamily: 'Tajawal, Cairo, sans-serif', background: 'linear-gradient(135deg, #e0f2fe 0%, #ffffff 100%)', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)', width: '100%', boxSizing: 'border-box', fontWeight: 500, color: '#0c4a6e' }} />
                </div>
                <div className="form-group full-width" style={{ gridColumn: '1 / -1' }}>
                    <label htmlFor="description" style={{ marginBottom: '15px', fontWeight: 700, color: '#1e293b', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '12px', fontFamily: 'Tajawal, Cairo, sans-serif' }}>📝 وصف الدورة السريع</label>
                    <textarea id="description" name="description" value={course.description} onChange={handleChange} onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); } }} rows="3" required style={{ padding: '12px 16px', border: '2px solid #38bdf8', borderRadius: '8px', fontSize: '1.2rem', fontFamily: 'Tajawal, Cairo, sans-serif', background: 'linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%)', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)', width: '100%', boxSizing: 'border-box', minHeight: '80px', lineHeight: '1.6', fontWeight: 400, resize: 'vertical' }} />
                </div>
                <div className="form-group full-width" style={{ gridColumn: '1 / -1' }}>
                    <label htmlFor="content_outline" style={{ marginBottom: '15px', fontWeight: 700, color: '#1e293b', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '12px', fontFamily: 'Tajawal, Cairo, sans-serif' }}>📚 جدول محتويات الدورة</label>
                    <textarea id="content_outline" name="content_outline" value={course.content_outline} onChange={handleChange} onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); } }} rows="5" placeholder="اكتب محتويات الدورة بالتفصيل..." required style={{ padding: '12px 16px', border: '2px solid #eab308', borderRadius: '8px', fontSize: '1.2rem', fontFamily: 'Tajawal, Cairo, sans-serif', background: 'linear-gradient(135deg, #fefce8 0%, #ffffff 100%)', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)', width: '100%', boxSizing: 'border-box', minHeight: '120px', lineHeight: '1.6', fontWeight: 400, resize: 'vertical' }} />
                </div>
                <div className="form-group">
                    <label htmlFor="duration_days" style={{ marginBottom: '15px', fontWeight: 700, color: '#1e293b', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '12px', fontFamily: 'Tajawal, Cairo, sans-serif' }}>📅 مدة الدورة (بالأيام)</label>
                    <input type="number" id="duration_days" name="duration_days" value={course.duration_days} onChange={handleChange} min="1" max="365" required style={{ padding: '12px 16px', border: '2px solid #22c55e', borderRadius: '8px', fontSize: '1.1rem', fontFamily: 'Tajawal, Cairo, sans-serif', background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)', width: '100%', boxSizing: 'border-box', fontWeight: 500, color: '#15803d', textAlign: 'center' }} />
                </div>
                <div className="form-group">
                    <label htmlFor="start_date" style={{ marginBottom: '15px', fontWeight: 700, color: '#1e293b', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '12px', fontFamily: 'Tajawal, Cairo, sans-serif' }}>🗓️ تاريخ بدء الدورة</label>
                    <input type="date" id="start_date" name="start_date" value={course.start_date} onChange={handleChange} required style={{ padding: '12px 16px', border: '2px solid #a855f7', borderRadius: '8px', fontSize: '1.2rem', fontFamily: 'Tajawal, Cairo, sans-serif', background: 'linear-gradient(135deg, #faf5ff 0%, #ffffff 100%)', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)', width: '100%', boxSizing: 'border-box', fontWeight: 500, color: '#7c3aed' }} />
                </div>
                <div className="form-group">
                    <label htmlFor="days_per_week" style={{ marginBottom: '15px', fontWeight: 700, color: '#1e293b', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '12px', fontFamily: 'Tajawal, Cairo, sans-serif' }}>📆 عدد أيام الدورة في الأسبوع</label>
                    <select id="days_per_week" name="days_per_week" value={course.days_per_week} onChange={handleChange} required style={{ padding: '12px 16px', border: '2px solid #22c55e', borderRadius: '8px', fontSize: '1.2rem', fontFamily: 'Tajawal, Cairo, sans-serif', background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)', width: '100%', boxSizing: 'border-box', fontWeight: 500, color: '#15803d', textAlign: 'center', cursor: 'pointer' }}>
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
                    <label htmlFor="hours_per_day" style={{ marginBottom: '15px', fontWeight: 700, color: '#1e293b', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '12px', fontFamily: 'Tajawal, Cairo, sans-serif' }}>⏰ مدة اليوم (بالساعات)</label>
                    <input type="number" id="hours_per_day" name="hours_per_day" value={course.hours_per_day} onChange={handleChange} step="0.5" min="0.5" max="12" required style={{ padding: '12px 16px', border: '2px solid #22c55e', borderRadius: '8px', fontSize: '1.1rem', fontFamily: 'Tajawal, Cairo, sans-serif', background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)', width: '100%', boxSizing: 'border-box', fontWeight: 500, color: '#15803d', textAlign: 'center' }} />
                </div>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="step-content">
            <h3 style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', margin: 0, padding: '25px 30px', fontSize: '1.4rem', fontWeight: 600, textAlign: 'center', borderRadius: 0 }}>👥 تكوين المشاركين حسب الدرجات</h3>
            <div style={{ padding: '30px', background: '#fafbfc' }}>
                <p style={{ color: '#64748b', fontSize: '1.1rem', textAlign: 'center', marginBottom: '30px', fontFamily: 'Tajawal, Cairo, sans-serif', lineHeight: '1.6' }}>حدد الأصناف والأعداد المطلوبة لكل درجة من درجات المشاركين</p>
                {Object.entries(course.participant_config).map(([level, config]) => (
                    <div key={level} style={{ background: 'white', padding: '25px', borderRadius: '16px', marginBottom: '25px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)', border: '2px solid #e2e8f0' }}>
                        <h4 style={{ margin: '0 0 20px 0', color: '#1e293b', fontSize: '1.3rem', fontWeight: 700, fontFamily: 'Tajawal, Cairo, sans-serif', textAlign: 'center', padding: '15px', background: level === 'level_1' ? 'linear-gradient(135deg, #fef3c7 0%, #ffffff 100%)' : level === 'level_2' ? 'linear-gradient(135deg, #dbeafe 0%, #ffffff 100%)' : 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)', borderRadius: '12px', border: level === 'level_1' ? '2px solid #f59e0b' : level === 'level_2' ? '2px solid #3b82f6' : '2px solid #10b981' }}>
                            {level === 'level_1' && '🎯 درجة 1 - المشرف'}
                            {level === 'level_2' && '👨‍🏫 درجة 2 - المسؤول'}
                            {level === 'level_3' && '🎓 درجة 3 - المتلقي'}
                        </h4>
                        <div className="form-grid">
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <label style={{ marginBottom: '12px', fontWeight: 700, color: '#1e293b', fontSize: '1rem', fontFamily: 'Tajawal, Cairo, sans-serif' }}>📝 اسم الدرجة</label>
                            <input type="text" value={config.name} onChange={(e) => handleParticipantConfigChange(level, 'name', e.target.value)} style={{ padding: '14px 18px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '1rem', fontFamily: 'Tajawal, Cairo, sans-serif', background: '#ffffff', transition: 'all 0.3s ease', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <label style={{ marginBottom: '12px', fontWeight: 700, color: '#1e293b', fontSize: '1rem', fontFamily: 'Tajawal, Cairo, sans-serif' }}>🎯 الأدوار المستهدفة</label>
                            <div style={{ padding: '14px 18px', border: '2px solid #e2e8f0', borderRadius: '10px', background: '#ffffff', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {[ 
                                    { value: 'admin', label: '👨‍💼 مدير' },
                                    { value: 'head', label: '👨‍💻 رئيس قسم' },
                                    { value: 'teacher', label: '👨‍🏫 معلم' },
                                    { value: 'student', label: '🎓 طالب' },
                                    { value: 'parent', label: '👨‍👩‍👧‍👦 ولي أمر' },
                                    { value: 'worker', label: '👷‍♂️ عامل' }
                                ].map(role => (
                                    <label key={role.value} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '6px 8px', borderRadius: '6px', transition: 'all 0.2s ease', fontSize: '0.95rem', fontFamily: 'Tajawal, Cairo, sans-serif', backgroundColor: config.roles.includes(role.value) ? '#f0f9ff' : 'transparent', border: config.roles.includes(role.value) ? '1px solid #3b82f6' : '1px solid transparent' }}>
                                        <input type="checkbox" checked={config.roles.includes(role.value)} onChange={(e) => { const newRoles = e.target.checked ? [...config.roles, role.value] : config.roles.filter(r => r !== role.value); handleParticipantConfigChange(level, 'roles', newRoles); }} style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#3b82f6' }} />
                                        <span>{role.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <label style={{ fontWeight: 700, color: '#1e293b', fontSize: '1rem', fontFamily: 'Tajawal, Cairo, sans-serif', minWidth: '80px' }}>📊 الحد الأدنى</label>
                            <input type="number" value={config.min} onChange={(e) => handleParticipantConfigChange(level, 'min', parseInt(e.target.value))} min="0" style={{ padding: '8px 12px', border: '2px solid #10b981', borderRadius: '8px', fontSize: '1rem', fontFamily: 'Tajawal, Cairo, sans-serif', background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)', transition: 'all 0.3s ease', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)', textAlign: 'center', fontWeight: 600, color: '#15803d', width: '80px' }} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <label style={{ fontWeight: 700, color: '#1e293b', fontSize: '1rem', fontFamily: 'Tajawal, Cairo, sans-serif', minWidth: '80px' }}>📈 الحد الأقصى</label>
                            <input type="number" value={config.max} onChange={(e) => handleParticipantConfigChange(level, 'max', parseInt(e.target.value))} min="1" style={{ padding: '8px 12px', border: '2px solid #ef4444', borderRadius: '8px', fontSize: '1rem', fontFamily: 'Tajawal, Cairo, sans-serif', background: 'linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)', transition: 'all 0.3s ease', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)', textAlign: 'center', fontWeight: 600, color: '#dc2626', width: '80px' }} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <label style={{ fontWeight: 700, color: '#1e293b', fontSize: '1rem', fontFamily: 'Tajawal, Cairo, sans-serif', minWidth: '80px' }}>⭐ العدد المثالي</label>
                            <input type="number" value={config.optimal} onChange={(e) => handleParticipantConfigChange(level, 'optimal', parseInt(e.target.value))} min="1" style={{ padding: '8px 12px', border: '2px solid #3b82f6', borderRadius: '8px', fontSize: '1rem', fontFamily: 'Tajawal, Cairo, sans-serif', background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)', transition: 'all 0.3s ease', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)', textAlign: 'center', fontWeight: 600, color: '#2563eb', width: '80px' }} />
                        </div>
                        </div>
                        <div style={{ marginTop: '20px' }}>
                            <h5 style={{ margin: '0 0 15px 0', color: '#1e293b', fontSize: '1.1rem', fontWeight: 600, fontFamily: 'Tajawal, Cairo, sans-serif', display: 'flex', alignItems: 'center', gap: '8px' }}>💰 المالية لكل درجة</h5>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151', fontSize: '0.9rem', fontFamily: 'Tajawal, Cairo, sans-serif' }}>نوع المعاملة المالية</label>
                                    <select value={config.financial?.type || 'none'} onChange={(e) => handleParticipantConfigChange(level, 'financial', { ...config.financial, type: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '0.95rem', fontFamily: 'Tajawal, Cairo, sans-serif', background: '#ffffff' }}>
                                        <option value="none">لا توجد معاملة مالية</option>
                                        <option value="pay">دفع مصاريف</option>
                                        <option value="receive">استلام مكافأة</option>
                                    </select>
                                </div>
                                {config.financial?.type && config.financial.type !== 'none' && (
                                    <>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151', fontSize: '0.9rem', fontFamily: 'Tajawal, Cairo, sans-serif' }}>المبلغ</label>
                                            <input type="number" min="0" step="0.01" value={config.financial?.amount || ''} onChange={(e) => handleParticipantConfigChange(level, 'financial', { ...config.financial, amount: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '0.95rem', fontFamily: 'Tajawal, Cairo, sans-serif' }} placeholder="أدخل المبلغ" />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151', fontSize: '0.9rem', fontFamily: 'Tajawal, Cairo, sans-serif' }}>العملة</label>
                                            <select value={config.financial?.currency || 'EGP'} onChange={(e) => handleParticipantConfigChange(level, 'financial', { ...config.financial, currency: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '0.95rem', fontFamily: 'Tajawal, Cairo, sans-serif', background: '#ffffff' }}>
                                                <option value="EGP">جنيه مصري (EGP)</option>
                                                <option value="SAR">ريال سعودي (SAR)</option>
                                                <option value="USD">دولار أمريكي (USD)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151', fontSize: '0.9rem', fontFamily: 'Tajawal, Cairo, sans-serif' }}>توقيت الدفع/الاستلام</label>
                                            <select value={config.financial?.timing || 'before_start'} onChange={(e) => handleParticipantConfigChange(level, 'financial', { ...config.financial, timing: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '0.95rem', fontFamily: 'Tajawal, Cairo, sans-serif', background: '#ffffff' }}>
                                                <option value="before_start">قبل بدء الدورة</option>
                                                <option value="monthly_start">في بداية كل شهر</option>
                                                <option value="monthly_end">في نهاية كل شهر</option>
                                                <option value="after_completion">بعد انتهاء الدورة</option>
                                            </select>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                        <div style={{ marginTop: '20px' }}>
                            <h5 style={{ margin: '0 0 15px 0', color: '#1e293b', fontSize: '1.1rem', fontWeight: 600, fontFamily: 'Tajawal, Cairo, sans-serif', display: 'flex', alignItems: 'center', gap: '8px' }}>👥 إضافة مستخدمين لكل درجة مسبقا (اختياري)</h5>
                            <div style={{ border: '2px dashed #cbd5e0', borderRadius: '12px', padding: '15px', background: '#f8fafc' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                                    <input type="checkbox" id={`enable-preselect-${level}`} checked={config.preselected_users?.enabled || false} onChange={(e) => handleParticipantConfigChange(level, 'preselected_users', { ...config.preselected_users, enabled: e.target.checked, users: config.preselected_users?.users || [] })} style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#3b82f6' }} />
                                    <label htmlFor={`enable-preselect-${level}`} style={{ fontWeight: 600, color: '#374151', fontSize: '0.95rem', fontFamily: 'Tajawal, Cairo, sans-serif', cursor: 'pointer' }}>تفعيل إضافة مستخدمين مسبقا لهذه الدرجة</label>
                                </div>
                                {config.preselected_users?.enabled && (
                                    <div>
                                        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '10px', fontFamily: 'Tajawal, Cairo, sans-serif' }}>سيتم إرسال إشعار للمستخدمين المحددين عند نشر الدورة</p>
                                        <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#ffffff', padding: '10px' }}>
                                            {availableUsers.filter(user => config.roles.includes(user.role)).length === 0 ? (
                                                <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '0.9rem', fontFamily: 'Tajawal, Cairo, sans-serif' }}>لا توجد مستخدمين متاحين للأدوار المحددة</div>
                                            ) : (
                                                availableUsers.filter(user => config.roles.includes(user.role)).map(user => (
                                                <label key={user.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', fontFamily: 'Tajawal, Cairo, sans-serif', backgroundColor: (config.preselected_users?.users || []).includes(user.id.toString()) ? '#f0f9ff' : 'transparent', border: (config.preselected_users?.users || []).includes(user.id.toString()) ? '1px solid #3b82f6' : '1px solid transparent' }}>
                                                    <input type="checkbox" checked={(config.preselected_users?.users || []).includes(user.id.toString())} onChange={(e) => { const currentUsers = config.preselected_users?.users || []; const userId = user.id.toString(); const newUsers = e.target.checked ? [...currentUsers, userId] : currentUsers.filter(id => id !== userId); handleParticipantConfigChange(level, 'preselected_users', { ...config.preselected_users, users: newUsers }); }} style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#3b82f6' }} />
                                                    <span>{user.full_name}</span>
                                                    <span style={{ fontSize: '0.8rem', color: '#64748b', marginRight: 'auto' }}>({user.role})</span>
                                                </label>
                                               ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="step-content">
            <h3 style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', margin: 0, padding: '25px 30px', fontSize: '1.4rem', fontWeight: 600, textAlign: 'center', borderRadius: 0 }}>🚀 إعدادات النشر والانطلاق</h3>
            <div style={{ padding: '30px', background: '#fafbfc' }}>
            <div style={{ background: 'white', padding: '25px', borderRadius: '16px', marginTop: '25px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)', border: '2px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 20px 0', color: '#1e293b', fontSize: '1.2rem', fontWeight: 700, fontFamily: 'Tajawal, Cairo, sans-serif', textAlign: 'center', padding: '15px', background: 'linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%)', borderRadius: '12px', border: '2px solid #3b82f6' }}>⚙️ إعدادات الانطلاق التلقائي</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[ 
                        { key: 'auto_launch_on_max_capacity', icon: '🎯', title: 'انطلاق تلقائي عند اكتمال العدد الأقصى', description: 'تنطلق الدورة تلقائياً عند وصول التسجيلات للعدد الأقصى قبل تاريخ البدء', color: '#ef4444' },
                        { key: 'auto_launch_on_optimal_capacity', icon: '⭐', title: 'انطلاق تلقائي عند بلوغ العدد المثالي', description: 'تنطلق الدورة تلقائياً عند وصول التسجيلات للعدد المثالي قبل البدء بيوم واحد', color: '#3b82f6' },
                        { key: 'auto_launch_on_min_capacity', icon: '📊', title: 'انطلاق تلقائي عند بلوغ الحد الأدنى', description: 'تنطلق الدورة تلقائياً عند وصول التسجيلات للحد الأدنى قبل البدء بيوم واحد', color: '#10b981' }
                    ].map(setting => (
                        <label key={setting.key} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', padding: '16px', borderRadius: '12px', transition: 'all 0.3s ease', border: course.auto_launch_settings[setting.key] ? `2px solid ${setting.color}` : '2px solid #e2e8f0', backgroundColor: course.auto_launch_settings[setting.key] ? `${setting.color}10` : '#ffffff', boxShadow: course.auto_launch_settings[setting.key] ? `0 4px 12px ${setting.color}20` : '0 2px 4px rgba(0, 0, 0, 0.02)' }}>
                            <input type="checkbox" checked={course.auto_launch_settings[setting.key] || false} onChange={(e) => { e.stopPropagation(); handleAutoLaunchChange(setting.key, e.target.checked); }} style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: setting.color, marginTop: '2px' }} />
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                    <span style={{ fontSize: '1.2rem' }}>{setting.icon}</span>
                                    <span style={{ fontWeight: 600, fontSize: '1rem', color: '#1e293b', fontFamily: 'Tajawal, Cairo, sans-serif' }}>{setting.title}</span>
                                </div>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b', lineHeight: '1.4', fontFamily: 'Tajawal, Cairo, sans-serif' }}>{setting.description}</p>
                            </div>
                        </label>
                    ))}
                </div>
            </div>
            </div>
        </div>
    );

    const renderStep4 = () => (
        <TaskGenerationStep course={course} onTaskConfigChange={handleTaskConfigChange} taskConfig={course.task_generation_config} />
    );

    return (
        <div className="course-form-container">
            <style jsx>{`
                .course-form-container { background: #fff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); overflow: hidden; }
                .step-content { padding: 0; }
                .step-content h3 { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; margin: 0; padding: 25px 30px; font-size: 1.4rem; font-weight: 600; text-align: center; border-radius: 0; }
                .modern-form { background: #fff; padding: 30px; border-radius: 12px; box-shadow: var(--shadow-lg); }
                .step-indicator { display: flex; justify-content: center; margin-bottom: 30px; }
                .step { padding: 10px 20px; margin: 0 5px; border-radius: 20px; background: #f8f9fa; color: #6c757d; }
                .step.active { background: var(--primary-color); color: white; }
                .step.completed { background: var(--success-color); color: white; }
                .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 25px; padding: 30px; background: #fafbfc; }
                .full-width { grid-column: 1 / -1; }
                .form-group { display: flex; flex-direction: column; position: relative; }
                .form-group label { margin-bottom: 15px !important; font-weight: 700 !important; color: #1e293b !important; font-size: 1.3rem !important; display: flex !important; align-items: center !important; gap: 12px !important; font-family: 'Tajawal', 'Cairo', sans-serif !important; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important; padding: 8px 0 !important; }
                .form-group input, .form-group textarea, .form-group select { padding: 18px 24px !important; border: 3px solid #e2e8f0 !important; border-radius: 16px !important; font-size: 1.2rem !important; font-family: 'Tajawal', 'Cairo', sans-serif !important; background: #ffffff !important; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05) !important; width: 100% !important; box-sizing: border-box !important; }
                .form-group input:focus, .form-group textarea:focus, .form-group select:focus { outline: none !important; border-color: #667eea !important; box-shadow: 0 0 0 6px rgba(102, 126, 234, 0.15), 0 8px 25px rgba(0, 0, 0, 0.1) !important; transform: translateY(-2px) scale(1.02) !important; background: #ffffff !important; }
                .form-group input:hover:not(:focus), .form-group textarea:hover:not(:focus), .form-group select:hover:not(:focus) { border-color: #cbd5e0; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.04); }
                .form-group textarea { resize: vertical !important; min-height: 120px !important; line-height: 1.8 !important; font-weight: 500 !important; }
                .form-group input[type="number"] { text-align: center !important; font-weight: 700 !important; font-size: 1.3rem !important; }
                .form-group select { cursor: pointer; background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e"); background-position: left 12px center; background-repeat: no-repeat; background-size: 16px; padding-left: 40px; }
                .form-group input::placeholder, .form-group textarea::placeholder { color: #9ca3af; font-style: italic; }
                .form-group input[name="name"] { font-size: 1.4rem !important; font-weight: 700 !important; background: linear-gradient(135deg, #e0f2fe 0%, #ffffff 100%) !important; border-color: #0ea5e9 !important; color: #0c4a6e !important; }
                .form-group textarea[name="description"] { background: linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%) !important; border-color: #38bdf8 !important; min-height: 100px !important; }
                .form-group textarea[name="content_outline"] { background: linear-gradient(135deg, #fefce8 0%, #ffffff 100%) !important; border-color: #eab308 !important; min-height: 140px !important; font-weight: 500 !important; }
                .form-group input[name="duration_days"], .form-group select[name="days_per_week"], .form-group input[name="hours_per_day"] { background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%) !important; border-color: #22c55e !important; font-weight: 700 !important; color: #15803d !important; text-align: center !important; }
                .form-group input[name="start_date"] { background: linear-gradient(135deg, #faf5ff 0%, #ffffff 100%) !important; border-color: #a855f7 !important; font-weight: 600 !important; color: #7c3aed !important; }
                .form-group input[name="cost"], .form-group select[name="currency"], .form-group input[name="max_seats"] { background: linear-gradient(135deg, #fef7cd 0%, #ffffff 100%) !important; border-color: #f59e0b !important; font-weight: 600 !important; color: #d97706 !important; }
                @media (max-width: 768px) { .form-grid { grid-template-columns: 1fr; gap: 20px; padding: 20px; } .form-group label { font-size: 1rem; } .form-group input, .form-group textarea, .form-group select { padding: 14px 16px; font-size: 1rem; } }
                .participant-level-config { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
                .participant-level-config h4 { margin-top: 0; color: var(--primary-color); }
                .auto-launch-settings { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 20px; }
                .checkbox-group label { flex-direction: row; align-items: center; cursor: pointer; }
                .checkbox-group input { width: auto; margin-right: 10px; cursor: pointer; }
                .step-description { color: #6c757d; margin-bottom: 20px; }
                .navigation-buttons { display: flex; justify-content: space-between; margin-top: 30px; }
                .btn { padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; font-weight: 500; }
                .btn-primary { background: var(--primary-color); color: white; }
                .btn-secondary { background: #6c757d; color: white; }
                .btn-success { background: var(--success-color); color: white; }
                .btn:hover { transform: translateY(-2px); }
                .btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
            `}</style>
            <div className="step-indicator">
                <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>1. المعلومات الأساسية</div>
                <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>2. تكوين المشاركين</div>
                <div className={`step ${currentStep >= 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}>3. إعدادات النشر</div>
                <div className={`step ${currentStep >= 4 ? 'active' : ''}`}>4. إعداد المهام</div>
            </div>
            <form onSubmit={handleSubmit} onKeyDown={(e) => { if (e.key === 'Enter' && e.target.type !== 'submit') { e.preventDefault(); e.stopPropagation(); } }} onMouseOver={(e) => e.stopPropagation()} onFocus={(e) => e.stopPropagation()}>
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}
                {currentStep === 4 && renderStep4()}
                <div className="navigation-buttons">
                    <button type="button" className="btn btn-secondary" onClick={(e) => { e.preventDefault(); e.stopPropagation(); prevStep(e); }} onMouseEnter={(e) => e.stopPropagation()} disabled={currentStep === 1}>→ السابق</button>
                    {currentStep < 4 ? (
                        <button type="button" className="btn btn-primary" onClick={(e) => { e.preventDefault(); e.stopPropagation(); nextStep(e); }} onMouseEnter={(e) => e.stopPropagation()}>التالي ←</button>
                    ) : (
                        <button type="submit" className="btn btn-success" onMouseEnter={(e) => e.stopPropagation()} onMouseLeave={(e) => e.stopPropagation()} onFocus={(e) => e.stopPropagation()} onClick={(e) => { console.log('Submit button clicked'); e.stopPropagation(); }}>
                            {initialCourse ? '💾 تحديث الدورة والانتقال للجدولة' : '➕ إنشاء الدورة والانتقال للجدولة'}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default CourseForm;
