import React, { useState } from 'react';
import Layout from '../../../../components/Layout';
import { withAuth } from '../../../../lib/withAuth';
import pool from '../../../../lib/db';
import { serializeDbRow, serializeDbRows, safeProps } from '../../../../lib/serializer';
import ExamQuestionManager from '../../../../components/ExamQuestionManager';

// مكون لإدارة يوم دراسي واحد
const DayScheduler = ({ day, onSave, onCreateExam }) => {
    const [details, setDetails] = useState(day);
    const [showExamBuilder, setShowExamBuilder] = useState(false);

    const handleSave = () => {
        onSave(details);
    };

    const handleExamContentChange = (examData) => {
        setDetails({
            ...details,
            exam_content: examData
        });
    };

    return (
        <div style={{
            background: 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
            padding: '30px',
            borderRadius: '15px',
            boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
            border: '2px solid #e9ecef',
            marginBottom: '25px',
            transition: 'all 0.3s ease'
        }}>
            <h4 style={{
                color: 'white',
                margin: '0 0 20px 0',
                fontSize: '1.3em',
                fontFamily: 'Tajawal, Arial, sans-serif',
                fontWeight: '700',
                padding: '15px',
                background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                borderRadius: '10px',
                textAlign: 'center',
                boxShadow: '0 4px 15px rgba(0, 123, 255, 0.3)'
            }}>🗓️ اليوم {details.day_number} - {details.title}</h4>
            
            <div style={{
                marginBottom: '20px',
                background: '#f8f9fa',
                padding: '15px',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
            }}>
                <label style={{
                    display: 'block',
                    fontWeight: '600',
                    marginBottom: '8px',
                    color: '#495057',
                    fontFamily: 'Tajawal, Arial, sans-serif',
                    fontSize: '0.95rem'
                }}>عنوان اليوم الدراسي</label>
                <input 
                    type="text" 
                    value={details.title} 
                    onChange={e => setDetails({...details, title: e.target.value})}
                    style={{
                        width: '100%',
                        padding: '12px 15px',
                        border: '2px solid #dee2e6',
                        borderRadius: '6px',
                        fontFamily: 'Tajawal, Arial, sans-serif',
                        fontSize: '0.9rem',
                        transition: 'all 0.2s ease',
                        backgroundColor: 'white'
                    }}
                    onFocus={(e) => {
                        e.target.style.borderColor = '#007bff';
                        e.target.style.boxShadow = '0 0 0 0.2rem rgba(0, 123, 255, 0.25)';
                    }}
                    onBlur={(e) => {
                        e.target.style.borderColor = '#dee2e6';
                        e.target.style.boxShadow = 'none';
                    }}
                />
            </div>
            
            <div style={{
                marginBottom: '20px',
                background: '#f8f9fa',
                padding: '15px',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
            }}>
                <label style={{
                    display: 'block',
                    fontWeight: '600',
                    marginBottom: '8px',
                    color: '#495057',
                    fontFamily: 'Tajawal, Arial, sans-serif',
                    fontSize: '0.95rem'
                }}>🔗 رابط اللقاء (Zoom/Meet)</label>
                <input 
                    type="text" 
                    value={details.meeting_link || ''} 
                    onChange={e => setDetails({...details, meeting_link: e.target.value})}
                    style={{
                        width: '100%',
                        padding: '12px 15px',
                        border: '2px solid #dee2e6',
                        borderRadius: '6px',
                        fontFamily: 'Tajawal, Arial, sans-serif',
                        fontSize: '0.9rem',
                        transition: 'all 0.2s ease',
                        backgroundColor: 'white'
                    }}
                    onFocus={(e) => {
                        e.target.style.borderColor = '#007bff';
                        e.target.style.boxShadow = '0 0 0 0.2rem rgba(0, 123, 255, 0.25)';
                    }}
                    onBlur={(e) => {
                        e.target.style.borderColor = '#dee2e6';
                        e.target.style.boxShadow = 'none';
                    }}
                />
            </div>
            
            <div style={{
                marginBottom: '20px',
                background: '#f8f9fa',
                padding: '15px',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
            }}>
                <label style={{
                    display: 'block',
                    fontWeight: '600',
                    marginBottom: '8px',
                    color: '#495057',
                    fontFamily: 'Tajawal, Arial, sans-serif',
                    fontSize: '0.95rem'
                }}>📂 رابط المحتوى (PDF/Video)</label>
                <input 
                    type="text" 
                    value={details.content_url || ''} 
                    onChange={e => setDetails({...details, content_url: e.target.value})}
                    style={{
                        width: '100%',
                        padding: '12px 15px',
                        border: '2px solid #dee2e6',
                        borderRadius: '6px',
                        fontFamily: 'Tajawal, Arial, sans-serif',
                        fontSize: '0.9rem',
                        transition: 'all 0.2s ease',
                        backgroundColor: 'white'
                    }}
                    onFocus={(e) => {
                        e.target.style.borderColor = '#007bff';
                        e.target.style.boxShadow = '0 0 0 0.2rem rgba(0, 123, 255, 0.25)';
                    }}
                    onBlur={(e) => {
                        e.target.style.borderColor = '#dee2e6';
                        e.target.style.boxShadow = 'none';
                    }}
                />
            </div>
            

            <div style={{
                background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)',
                padding: '20px',
                borderRadius: '12px',
                margin: '20px 0',
                border: '2px solid #e1f5fe',
                boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
            }}>
                <h5 style={{
                    margin: '0 0 15px 0',
                    color: '#1976d2',
                    fontFamily: 'Tajawal, Arial, sans-serif',
                    fontWeight: '600',
                    fontSize: '1.1rem',
                    padding: '10px 15px',
                    background: 'rgba(25, 118, 210, 0.1)',
                    borderRadius: '8px',
                    borderLeft: '4px solid #1976d2'
                }}>📝 تكاليف درجة 3 (الطلاب)</h5>
                <div style={{
                    marginBottom: '20px',
                    background: '#f8f9fa',
                    padding: '15px',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef'
                }}>
                    <label style={{
                        display: 'block',
                        fontWeight: '600',
                        marginBottom: '8px',
                        color: '#495057',
                        fontFamily: 'Tajawal, Arial, sans-serif',
                        fontSize: '0.95rem'
                    }}>عنوان الامتحان</label>
                    <input 
                        type="text" 
                        value={details.exam_content?.title || ''} 
                        onChange={e => handleExamContentChange({...details.exam_content, title: e.target.value})}
                        placeholder="امتحان اليوم الدراسي"
                        style={{
                            width: '100%',
                            padding: '12px 15px',
                            border: '2px solid #dee2e6',
                            borderRadius: '6px',
                            fontFamily: 'Tajawal, Arial, sans-serif',
                            fontSize: '0.9rem',
                            transition: 'all 0.2s ease',
                            backgroundColor: 'white'
                        }}
                        onFocus={(e) => {
                            e.target.style.borderColor = '#007bff';
                            e.target.style.boxShadow = '0 0 0 0.2rem rgba(0, 123, 255, 0.25)';
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = '#dee2e6';
                            e.target.style.boxShadow = 'none';
                        }}
                    />
                </div>
                
                <div style={{
                    marginBottom: '20px',
                    background: '#f8f9fa',
                    padding: '15px',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef'
                }}>
                    <label style={{
                        display: 'block',
                        fontWeight: '600',
                        marginBottom: '8px',
                        color: '#495057',
                        fontFamily: 'Tajawal, Arial, sans-serif',
                        fontSize: '0.95rem'
                    }}>وصف الامتحان</label>
                    <textarea 
                        value={details.exam_content?.description || ''} 
                        onChange={e => handleExamContentChange({...details.exam_content, description: e.target.value})}
                        rows="2"
                        placeholder="وصف مختصر للامتحان"
                        style={{
                            width: '100%',
                            padding: '12px 15px',
                            border: '2px solid #dee2e6',
                            borderRadius: '6px',
                            fontFamily: 'Tajawal, Arial, sans-serif',
                            fontSize: '0.9rem',
                            transition: 'all 0.2s ease',
                            backgroundColor: 'white',
                            minHeight: '80px',
                            resize: 'vertical',
                            lineHeight: '1.5'
                        }}
                        onFocus={(e) => {
                            e.target.style.borderColor = '#007bff';
                            e.target.style.boxShadow = '0 0 0 0.2rem rgba(0, 123, 255, 0.25)';
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = '#dee2e6';
                            e.target.style.boxShadow = 'none';
                        }}
                    />
                </div>

                <div style={{
                    marginBottom: '20px',
                    background: '#f8f9fa',
                    padding: '15px',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef'
                }}>
                    <label style={{
                        display: 'block',
                        fontWeight: '600',
                        marginBottom: '8px',
                        color: '#495057',
                        fontFamily: 'Tajawal, Arial, sans-serif',
                        fontSize: '0.95rem'
                    }}>مدة الامتحان (بالدقائق)</label>
                    <input 
                        type="number" 
                        value={details.exam_content?.time_limit || 60} 
                        onChange={e => handleExamContentChange({...details.exam_content, time_limit: parseInt(e.target.value)})}
                        min="5"
                        max="180"
                        style={{
                            width: '100%',
                            padding: '12px 15px',
                            border: '2px solid #dee2e6',
                            borderRadius: '6px',
                            fontFamily: 'Tajawal, Arial, sans-serif',
                            fontSize: '0.9rem',
                            transition: 'all 0.2s ease',
                            backgroundColor: 'white'
                        }}
                        onFocus={(e) => {
                            e.target.style.borderColor = '#007bff';
                            e.target.style.boxShadow = '0 0 0 0.2rem rgba(0, 123, 255, 0.25)';
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = '#dee2e6';
                            e.target.style.boxShadow = 'none';
                        }}
                    />
                </div>

                <button 
                    type="button" 
                    onClick={() => setShowExamBuilder(!showExamBuilder)}
                    style={{
                        backgroundColor: showExamBuilder ? '#dc3545' : '#17a2b8',
                        color: 'white',
                        border: 'none',
                        padding: '12px 20px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        fontFamily: 'Tajawal, Arial, sans-serif',
                        transition: 'all 0.2s ease',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        whiteSpace: 'nowrap',
                        marginBottom: '15px',
                        width: '100%',
                        justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.backgroundColor = showExamBuilder ? '#c82333' : '#138496';
                        e.target.style.transform = 'translateY(-1px)';
                        e.target.style.boxShadow = showExamBuilder ? '0 3px 10px rgba(220, 53, 69, 0.3)' : '0 3px 10px rgba(23, 162, 184, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.backgroundColor = showExamBuilder ? '#dc3545' : '#17a2b8';
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = 'none';
                    }}
                >
                    {showExamBuilder ? '🔼 إخفاء بناء الامتحان' : '🔽 بناء الامتحان (اختيارات وصح وخطأ)'}
                </button>

                {showExamBuilder && (
                    <ExamBuilder 
                        examContent={details.exam_content} 
                        onChange={handleExamContentChange}
                        courseId={details.course_id || course?.id}
                        dayNumber={details.day_number}
                    />
                )}
            </div>


            <div className="assignments-section">
                <h5>📋 تكاليف إضافية</h5>
                
                {/* تكاليف درجة 3 - قائمة مهام */}
                <div style={{
                    background: 'linear-gradient(135deg, #e8f5e8 0%, #f3e5f5 100%)',
                    padding: '20px',
                    borderRadius: '12px',
                    margin: '20px 0',
                    border: '2px solid #4caf50',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
                }}>
                    <h5 style={{
                        margin: '0 0 15px 0',
                        color: '#388e3c',
                        fontFamily: 'Tajawal, Arial, sans-serif',
                        fontWeight: '600',
                        fontSize: '1.1rem',
                        padding: '10px 15px',
                        background: 'rgba(56, 142, 60, 0.1)',
                        borderRadius: '8px',
                        borderLeft: '4px solid #388e3c'
                    }}>🎓 تكاليف درجة 3 (الطلاب) - مهام إضافية</h5>
                    <div style={{
                        marginBottom: '20px',
                        background: '#f8f9fa',
                        padding: '15px',
                        borderRadius: '8px',
                        border: '1px solid #e9ecef'
                    }}>
                        <div className="checklist-container">
                            {(details.assignments?.level_3_checklist || []).map((item, index) => (
                                <div key={index} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '12px 15px',
                                    margin: '8px 0',
                                    backgroundColor: '#ffffff',
                                    border: '2px solid #e9ecef',
                                    borderRadius: '10px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = '#4caf50';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.15)';
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = '#e9ecef';
                                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={item.completed || false}
                                        style={{
                                            width: '18px',
                                            height: '18px',
                                            accentColor: '#4caf50',
                                            cursor: 'pointer'
                                        }}
                                        onChange={e => {
                                            const updatedList = [...(details.assignments?.level_3_checklist || [])];
                                            updatedList[index] = {...item, completed: e.target.checked};
                                            setDetails({
                                                ...details,
                                                assignments: {...details.assignments, level_3_checklist: updatedList}
                                            });
                                        }}
                                    />
                                    <input
                                        type="text"
                                        value={item.text}
                                        style={{
                                            flex: 1,
                                            padding: '10px 12px',
                                            border: '1px solid #ddd',
                                            borderRadius: '6px',
                                            fontSize: '14px',
                                            transition: 'border-color 0.3s ease',
                                            outline: 'none'
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = '#4caf50';
                                            e.target.style.boxShadow = '0 0 0 2px rgba(76, 175, 80, 0.1)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = '#ddd';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                        onChange={e => {
                                            const updatedList = [...(details.assignments?.level_3_checklist || [])];
                                            updatedList[index] = {...item, text: e.target.value};
                                            setDetails({
                                                ...details,
                                                assignments: {...details.assignments, level_3_checklist: updatedList}
                                            });
                                        }}
                                        placeholder="أدخل مهمة للطلاب (مثل: مراجعة المحتوى، حل التمارين، حضور اللقاء)..."
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            const updatedList = (details.assignments?.level_3_checklist || []).filter((_, i) => i !== index);
                                            setDetails({
                                                ...details,
                                                assignments: {...details.assignments, level_3_checklist: updatedList}
                                            });
                                        }}
                                        style={{
                                            backgroundColor: '#dc3545',
                                            color: 'white',
                                            border: 'none',
                                            padding: '8px 12px',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease',
                                            marginLeft: '10px'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.backgroundColor = '#c82333';
                                            e.target.style.transform = 'scale(1.1)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.backgroundColor = '#dc3545';
                                            e.target.style.transform = 'scale(1)';
                                        }}
                                    >
                                        ❌
                                    </button>
                                </div>
                            ))}
                            <button 
                                type="button" 
                                onClick={() => {
                                    const currentList = details.assignments?.level_3_checklist || [];
                                    const newList = [...currentList, {text: '', completed: false}];
                                    setDetails({
                                        ...details,
                                        assignments: {...details.assignments, level_3_checklist: newList}
                                    });
                                }}
                                style={{
                                    backgroundColor: '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    padding: '12px 20px',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 3px 8px rgba(40, 167, 69, 0.3)',
                                    marginTop: '10px'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = '#218838';
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = '0 5px 12px rgba(40, 167, 69, 0.4)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = '#28a745';
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = '0 3px 8px rgba(40, 167, 69, 0.3)';
                                }}
                            >
                                ➕ إضافة مهمة جديدة
                            </button>
                        </div>
                    </div>
                </div>

                {/* تكاليف درجة 2 - قائمة مهام */}
                <div style={{
                    background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)',
                    padding: '20px',
                    borderRadius: '12px',
                    margin: '20px 0',
                    border: '2px solid #2196f3',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
                }}>
                    <h5 style={{
                        margin: '0 0 15px 0',
                        color: '#1976d2',
                        fontFamily: 'Tajawal, Arial, sans-serif',
                        fontWeight: '600',
                        fontSize: '1.1rem',
                        padding: '10px 15px',
                        background: 'rgba(25, 118, 210, 0.1)',
                        borderRadius: '8px',
                        borderLeft: '4px solid #1976d2'
                    }}>👨‍🏫 تكاليف درجة 2 (المعلمين/المدربين)</h5>
                    <div style={{
                        marginBottom: '20px',
                        background: '#f8f9fa',
                        padding: '15px',
                        borderRadius: '8px',
                        border: '1px solid #e9ecef'
                    }}>
                        <div className="checklist-container">
                            {(details.assignments?.level_2_checklist || []).map((item, index) => (
                                <div key={index} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '12px 15px',
                                    margin: '8px 0',
                                    backgroundColor: '#ffffff',
                                    border: '2px solid #e9ecef',
                                    borderRadius: '10px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = '#2196f3';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(33, 150, 243, 0.15)';
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = '#e9ecef';
                                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={item.completed || false}
                                        style={{
                                            width: '18px',
                                            height: '18px',
                                            accentColor: '#2196f3',
                                            cursor: 'pointer'
                                        }}
                                        onChange={e => {
                                            const updatedList = [...(details.assignments?.level_2_checklist || [])];
                                            updatedList[index] = {...item, completed: e.target.checked};
                                            setDetails({
                                                ...details,
                                                assignments: {...details.assignments, level_2_checklist: updatedList}
                                            });
                                        }}
                                    />
                                    <input
                                        type="text"
                                        value={item.text}
                                        style={{
                                            flex: 1,
                                            padding: '10px 12px',
                                            border: '1px solid #ddd',
                                            borderRadius: '6px',
                                            fontSize: '14px',
                                            transition: 'border-color 0.3s ease',
                                            outline: 'none'
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = '#2196f3';
                                            e.target.style.boxShadow = '0 0 0 2px rgba(33, 150, 243, 0.1)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = '#ddd';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                        onChange={e => {
                                            const updatedList = [...(details.assignments?.level_2_checklist || [])];
                                            updatedList[index] = {...item, text: e.target.value};
                                            setDetails({
                                                ...details,
                                                assignments: {...details.assignments, level_2_checklist: updatedList}
                                            });
                                        }}
                                        placeholder="أدخل مهمة للمعلمين/المدربين (مثل: تحضير المحتوى، إعداد الأسئلة، متابعة الطلاب)..."
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            const updatedList = (details.assignments?.level_2_checklist || []).filter((_, i) => i !== index);
                                            setDetails({
                                                ...details,
                                                assignments: {...details.assignments, level_2_checklist: updatedList}
                                            });
                                        }}
                                        style={{
                                            backgroundColor: '#dc3545',
                                            color: 'white',
                                            border: 'none',
                                            padding: '8px 12px',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease',
                                            marginLeft: '10px'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.backgroundColor = '#c82333';
                                            e.target.style.transform = 'scale(1.1)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.backgroundColor = '#dc3545';
                                            e.target.style.transform = 'scale(1)';
                                        }}
                                    >
                                        ❌
                                    </button>
                                </div>
                            ))}
                            <button 
                                type="button" 
                                onClick={() => {
                                    const currentList = details.assignments?.level_2_checklist || [];
                                    const newList = [...currentList, {text: '', completed: false}];
                                    setDetails({
                                        ...details,
                                        assignments: {...details.assignments, level_2_checklist: newList}
                                    });
                                }}
                                style={{
                                    backgroundColor: '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    padding: '12px 20px',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 3px 8px rgba(40, 167, 69, 0.3)',
                                    marginTop: '10px'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = '#218838';
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = '0 5px 12px rgba(40, 167, 69, 0.4)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = '#28a745';
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = '0 3px 8px rgba(40, 167, 69, 0.3)';
                                }}
                            >
                                ➕ إضافة مهمة جديدة
                            </button>
                        </div>
                    </div>
                </div>
                
                <div style={{
                    background: 'linear-gradient(135deg, #fce4ec 0%, #f3e5f5 100%)',
                    padding: '20px',
                    borderRadius: '12px',
                    margin: '20px 0',
                    border: '2px solid #e91e63',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
                }}>
                    <h5 style={{
                        margin: '0 0 15px 0',
                        color: '#c2185b',
                        fontFamily: 'Tajawal, Arial, sans-serif',
                        fontWeight: '600',
                        fontSize: '1.1rem',
                        padding: '10px 15px',
                        background: 'rgba(194, 24, 91, 0.1)',
                        borderRadius: '8px',
                        borderLeft: '4px solid #c2185b'
                    }}>🎯 تكاليف درجة 1 (المشرفين)</h5>
                    <div style={{
                        marginBottom: '20px',
                        background: '#f8f9fa',
                        padding: '15px',
                        borderRadius: '8px',
                        border: '1px solid #e9ecef'
                    }}>
                        <div className="checklist-container">
                            {(details.assignments?.level_1_checklist || []).map((item, index) => (
                                <div key={index} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '12px 15px',
                                    margin: '8px 0',
                                    backgroundColor: '#ffffff',
                                    border: '2px solid #e9ecef',
                                    borderRadius: '10px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = '#e91e63';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(233, 30, 99, 0.15)';
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = '#e9ecef';
                                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={item.completed || false}
                                        style={{
                                            width: '18px',
                                            height: '18px',
                                            accentColor: '#e91e63',
                                            cursor: 'pointer'
                                        }}
                                        onChange={e => {
                                            const updatedList = [...(details.assignments?.level_1_checklist || [])];
                                            updatedList[index] = {...item, completed: e.target.checked};
                                            setDetails({
                                                ...details,
                                                assignments: {...details.assignments, level_1_checklist: updatedList}
                                            });
                                        }}
                                    />
                                    <input
                                        type="text"
                                        value={item.text}
                                        style={{
                                            flex: 1,
                                            padding: '10px 12px',
                                            border: '1px solid #ddd',
                                            borderRadius: '6px',
                                            fontSize: '14px',
                                            transition: 'border-color 0.3s ease',
                                            outline: 'none'
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = '#e91e63';
                                            e.target.style.boxShadow = '0 0 0 2px rgba(233, 30, 99, 0.1)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = '#ddd';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                        onChange={e => {
                                            const updatedList = [...(details.assignments?.level_1_checklist || [])];
                                            updatedList[index] = {...item, text: e.target.value};
                                            setDetails({
                                                ...details,
                                                assignments: {...details.assignments, level_1_checklist: updatedList}
                                            });
                                        }}
                                        placeholder="أدخل مهمة للمشرفين (مثل: مراجعة التقارير، تقييم الأداء، متابعة النتائج)..."
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            const updatedList = (details.assignments?.level_1_checklist || []).filter((_, i) => i !== index);
                                            setDetails({
                                                ...details,
                                                assignments: {...details.assignments, level_1_checklist: updatedList}
                                            });
                                        }}
                                        style={{
                                            backgroundColor: '#dc3545',
                                            color: 'white',
                                            border: 'none',
                                            padding: '8px 12px',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease',
                                            marginLeft: '10px'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.backgroundColor = '#c82333';
                                            e.target.style.transform = 'scale(1.1)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.backgroundColor = '#dc3545';
                                            e.target.style.transform = 'scale(1)';
                                        }}
                                    >
                                        ❌
                                    </button>
                                </div>
                            ))}
                            <button 
                                type="button" 
                                onClick={() => {
                                    const currentList = details.assignments?.level_1_checklist || [];
                                    const newList = [...currentList, {text: '', completed: false}];
                                    setDetails({
                                        ...details,
                                        assignments: {...details.assignments, level_1_checklist: newList}
                                    });
                                }}
                                style={{
                                    backgroundColor: '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    padding: '12px 20px',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 3px 8px rgba(40, 167, 69, 0.3)',
                                    marginTop: '10px'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = '#218838';
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = '0 5px 12px rgba(40, 167, 69, 0.4)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = '#28a745';
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = '0 3px 8px rgba(40, 167, 69, 0.3)';
                                }}
                            >
                                ➕ إضافة مهمة جديدة
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <button 
                onClick={handleSave}
                style={{
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    fontFamily: 'Tajawal, Arial, sans-serif',
                    transition: 'all 0.2s ease',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                    width: '100%',
                    justifyContent: 'center',
                    marginTop: '15px'
                }}
                onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#218838';
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 3px 10px rgba(40, 167, 69, 0.3)';
                }}
                onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#28a745';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                }}
            >
                💾 حفظ اليوم {details.day_number}
            </button>
        </div>
    );
};

// مكون بناء الامتحان
const ExamBuilder = ({ examContent, onChange }) => {
    const [questions, setQuestions] = useState(examContent?.questions || []);
    const [jsonImport, setJsonImport] = useState('');

    const addQuestion = (type) => {
        const newQuestion = {
            id: Date.now(),
            type: type,
            question: '',
            options: type === 'multiple_choice' ? ['', '', '', ''] : [],
            correct_answer: '',
            points: 1
        };
        const updatedQuestions = [...questions, newQuestion];
        setQuestions(updatedQuestions);
        onChange({...examContent, questions: updatedQuestions});
    };

    const updateQuestion = (questionId, field, value) => {
        const updatedQuestions = questions.map(q => 
            q.id === questionId ? {...q, [field]: value} : q
        );
        setQuestions(updatedQuestions);
        onChange({...examContent, questions: updatedQuestions});
    };

    const removeQuestion = (questionId) => {
        const updatedQuestions = questions.filter(q => q.id !== questionId);
        setQuestions(updatedQuestions);
        onChange({...examContent, questions: updatedQuestions});
    };

    const importFromJson = () => {
        try {
            const parsedQuestions = JSON.parse(jsonImport);
            if (Array.isArray(parsedQuestions)) {
                const formattedQuestions = parsedQuestions.map((q, index) => ({
                    id: Date.now() + index,
                    type: q.type || 'multiple_choice',
                    question: q.question || '',
                    options: q.options || (q.type === 'multiple_choice' ? ['', '', '', ''] : []),
                    correct_answer: q.correct_answer || '',
                    points: q.points || 1
                }));
                setQuestions(formattedQuestions);
                onChange({...examContent, questions: formattedQuestions});
                setJsonImport('');
                alert('✅ تم استيراد الأسئلة بنجاح');
            } else {
                alert('❌ تنسيق JSON غير صحيح - يجب أن يكون مصفوفة من الأسئلة');
            }
        } catch (error) {
            alert('❌ خطأ في تنسيق JSON: ' + error.message);
        }
    };

    return (
        <div style={{
            background: 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)',
            padding: '25px',
            borderRadius: '15px',
            border: '2px solid #ffc107',
            marginTop: '20px',
            boxShadow: '0 4px 15px rgba(255, 193, 7, 0.2)'
        }}>
            <h4 style={{ color: '#856404', marginBottom: '20px', textAlign: 'center', fontFamily: 'Tajawal, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                🎯 بناء الامتحان
            </h4>

            <div style={{ marginBottom: '15px', display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                <button 
                    type="button" 
                    onClick={() => addQuestion('multiple_choice')}
                    style={{
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        padding: '8px 12px',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontFamily: 'Tajawal, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                    }}
                >
                    ➕ إضافة سؤال اختيارات متعددة
                </button>
                <button 
                    type="button" 
                    onClick={() => addQuestion('true_false')}
                    style={{
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        padding: '8px 12px',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontFamily: 'Tajawal, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                    }}
                >
                    ➕ إضافة سؤال صح وخطأ
                </button>
            </div>
            
            <div style={{ background: '#f0f8ff', padding: '15px', borderRadius: '8px', margin: '15px 0' }}>
                <h6 style={{ margin: '0 0 10px 0', color: '#0066cc', fontFamily: 'Tajawal, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>📥 استيراد أسئلة من JSON</h6>
                <textarea
                    value={jsonImport}
                    onChange={e => setJsonImport(e.target.value)}
                    placeholder='مثال: [{"type":"multiple_choice","question":"ما هو...؟","options":["خيار 1","خيار 2","خيار 3","خيار 4"],"correct_answer":"0","points":1}]'
                    rows="4"
                    style={{ 
                        width: '100%', 
                        marginBottom: '10px', 
                        fontFamily: 'Tajawal, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', 
                        fontSize: '16px',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                    }}
                />
                <button 
                    onClick={importFromJson} 
                    style={{ 
                        background: '#28a745', 
                        color: 'white', 
                        border: 'none', 
                        padding: '8px 15px', 
                        borderRadius: '5px', 
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontFamily: 'Tajawal, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                    }}
                >
                    📥 استيراد الأسئلة
                </button>
                <small style={{ display: 'block', marginTop: '5px', color: '#666', fontFamily: 'Tajawal, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                    تنسيق JSON: مصفوفة من الأسئلة مع الحقول: type, question, options, correct_answer, points
                </small>
            </div>

            {questions.map((question, index) => (
                <div key={question.id} style={{
                    border: '1px solid #ddd', 
                    padding: '15px', 
                    borderRadius: '5px', 
                    marginBottom: '15px',
                    backgroundColor: 'white'
                }}>
                    <div style={{
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        marginBottom: '10px'
                    }}>
                        <h6 style={{ margin: 0, color: '#007bff', fontFamily: 'Tajawal, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>السؤال {index + 1}</h6>
                        <button 
                            type="button" 
                            onClick={() => removeQuestion(question.id)}
                            style={{
                                background: '#dc3545', 
                                color: 'white', 
                                border: 'none', 
                                padding: '5px 8px', 
                                borderRadius: '3px', 
                                cursor: 'pointer'
                            }}
                        >
                            ❌
                        </button>
                    </div>
                    
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontFamily: 'Tajawal, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>نص السؤال</label>
                        <textarea 
                            value={question.question}
                            onChange={e => updateQuestion(question.id, 'question', e.target.value)}
                            rows="2"
                            style={{
                                width: '100%',
                                padding: '10px',
                                border: '1px solid #ccc',
                                borderRadius: '5px',
                                fontFamily: 'Tajawal, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                fontSize: '16px'
                            }}
                        />
                    </div>

                    {question.type === 'multiple_choice' && (
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontFamily: 'Tajawal, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>الخيارات</label>
                            {question.options.map((option, optionIndex) => (
                                <div key={optionIndex} style={{
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '10px', 
                                    marginBottom: '8px'
                                }}>
                                    <input 
                                        type="text"
                                        value={option}
                                        onChange={e => {
                                            const newOptions = [...question.options];
                                            newOptions[optionIndex] = e.target.value;
                                            updateQuestion(question.id, 'options', newOptions);
                                        }}
                                        placeholder={`الخيار ${optionIndex + 1}`}
                                        style={{
                                            flex: 1,
                                            padding: '8px',
                                            border: '1px solid #ccc',
                                            borderRadius: '4px',
                                            fontFamily: 'Tajawal, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                            fontSize: '16px'
                                        }}
                                    />
                                    <input 
                                        type="radio"
                                        name={`correct_${question.id}`}
                                        checked={question.correct_answer === optionIndex.toString()}
                                        onChange={() => updateQuestion(question.id, 'correct_answer', optionIndex.toString())}
                                    />
                                    <label style={{ fontFamily: 'Tajawal, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>صحيح</label>
                                </div>
                            ))}
                        </div>
                    )}

                    {question.type === 'true_false' && (
                        <div style={{ 
                            display: 'flex', 
                            gap: '20px', 
                            alignItems: 'center',
                            marginBottom: '15px'
                        }}>
                            <label style={{ fontWeight: 'bold', fontFamily: 'Tajawal, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>الإجابة الصحيحة</label>
                            <div>
                                <input 
                                    type="radio"
                                    name={`tf_${question.id}`}
                                    checked={question.correct_answer === 'true'}
                                    onChange={() => updateQuestion(question.id, 'correct_answer', 'true')}
                                />
                                <label style={{ marginLeft: '5px', fontFamily: 'Tajawal, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>صح</label>
                                
                                <input 
                                    type="radio"
                                    name={`tf_${question.id}`}
                                    checked={question.correct_answer === 'false'}
                                    onChange={() => updateQuestion(question.id, 'correct_answer', 'false')}
                                    style={{ marginLeft: '15px' }}
                                />
                                <label style={{ marginLeft: '5px', fontFamily: 'Tajawal, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>خطأ</label>
                            </div>
                        </div>
                    )}

                    <div>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontFamily: 'Tajawal, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>النقاط</label>
                        <input 
                            type="number"
                            value={question.points}
                            onChange={e => updateQuestion(question.id, 'points', parseFloat(e.target.value))}
                            min="0.5"
                            step="0.5"
                            style={{
                                width: '100px',
                                padding: '8px',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                fontFamily: 'Tajawal, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                fontSize: '16px'
                            }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
};

const CourseSchedulerPage = ({ user, course, schedule: initialSchedule }) => {
    const [schedule, setSchedule] = useState(initialSchedule);
    const [message, setMessage] = useState('');
    const [showAutoFill, setShowAutoFill] = useState(false);
    const [autoFillTemplate, setAutoFillTemplate] = useState({
        meeting_link_template: '',
        content_url_template: '',
        url_numbering_start: 1,
        url_numbering_end: schedule.length,
        default_exam_title: 'امتحان اليوم الدراسي **',
        default_exam_time: 60,
        default_costs_level_1: 'مراجعة التقارير اليومية وتقييم الأداء',
        default_costs_level_2: 'إعداد المحتوى وتقييم الطلاب',
        default_costs_level_3: 'حل الامتحان وأداء الواجبات'
    });

    const handleSaveDay = async (dayDetails) => {
        try {
            const response = await fetch(`/api/courses/${course.id}/schedule`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...dayDetails, course_id: course.id })
            });
            const result = await response.json();
            if (response.ok) {
                setMessage(`✅ ${result.message}`);
                // تحديث الحالة المحلية بعد الحفظ
                setSchedule(prev => prev.map(d => d.day_number === dayDetails.day_number ? dayDetails : d));
            } else {
                setMessage(`⚠️ ${result.message}`);
            }
        } catch (err) {
            setMessage('🚫 خطأ في الاتصال بالخادم.');
        }
    };

    const addDay = () => {
        const nextDayNumber = schedule.length + 1;
        setSchedule([...schedule, { day_number: nextDayNumber, title: `اليوم الدراسي ${nextDayNumber}` }]);
    };

    const handleAutoFill = () => {
        const updatedSchedule = schedule.map(day => {
            const dayNumber = day.day_number;
            const paddedNumber = dayNumber.toString().padStart(2, '0');
            
            // Convert template text to checklist format
            const level1Tasks = autoFillTemplate.default_costs_level_1 
                ? autoFillTemplate.default_costs_level_1.split('\n').filter(task => task.trim()).map(task => ({
                    text: task.trim(),
                    completed: false
                }))
                : [];
                
            const level2Tasks = autoFillTemplate.default_costs_level_2 
                ? autoFillTemplate.default_costs_level_2.split('\n').filter(task => task.trim()).map(task => ({
                    text: task.trim(),
                    completed: false
                }))
                : [];
                
            const level3Tasks = autoFillTemplate.default_costs_level_3 
                ? autoFillTemplate.default_costs_level_3.split('\n').filter(task => task.trim()).map(task => ({
                    text: task.trim(),
                    completed: false
                }))
                : [];
            
            return {
                ...day,
                meeting_link: autoFillTemplate.meeting_link_template,
                content_url: autoFillTemplate.content_url_template.replace(/\*\*/g, paddedNumber),
                assignments: {
                    ...day.assignments,
                    level_1_checklist: level1Tasks,
                    level_2_checklist: level2Tasks,
                    level_3_checklist: level3Tasks
                },
                exam_content: {
                    ...day.exam_content,
                    title: autoFillTemplate.default_exam_title.replace(/\*\*/g, dayNumber),
                    time_limit: autoFillTemplate.default_exam_time
                }
            };
        });
        
        setSchedule(updatedSchedule);
        setMessage('✅ تم تطبيق الملء التلقائي بنجاح وتم ملء جميع المربعات');
        setShowAutoFill(false);
    };

    const saveAsTemplate = async () => {
        try {
            const templateData = {
                name: `قالب ${course.name}`,
                description: course.description || 'قالب دورة محفوظ',
                duration_days: course.duration_days || 7,
                target_roles: course.participant_config ? 
                    Object.values(course.participant_config).flatMap(level => level.roles || []) : 
                    ['student'],
                min_capacity: course.participant_config?.level_3?.min || 7,
                max_capacity: course.participant_config?.level_3?.max || 15,
                optimal_capacity: course.participant_config?.level_3?.optimal || 12,
                pricing: {
                    cost: course.details?.cost || 0,
                    currency: course.details?.currency || 'EGP'
                },
                daily_content_template: schedule.map(day => ({
                    day_number: day.day_number,
                    title: day.title,
                    content_url: day.content_url,
                    meeting_link: day.meeting_link,
                    exam_content: day.exam_content,
                    assignments: day.assignments
                })),
                participant_config: course.participant_config || {},
                auto_fill_template: autoFillTemplate,
                launch_settings: course.auto_launch_settings || {}
            };

            const response = await fetch('/api/courses/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(templateData)
            });

            const result = await response.json();
            if (response.ok) {
                setMessage('✅ تم حفظ الدورة كقالب بنجاح');
            } else {
                console.error('Template save error:', result);
                setMessage(`⚠️ خطأ في حفظ القالب: ${result.message || 'خطأ غير معروف'}`);
            }
        } catch (err) {
            console.error('Template save error:', err);
            setMessage('🚫 خطأ في الاتصال بالخادم');
        }
    };

    const publishCourse = async () => {
        try {
            const response = await fetch(`/api/courses/${course.id}/publish`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const result = await response.json();
            if (response.ok) {
                setMessage('✅ تم نشر الدورة بنجاح');
            } else {
                console.error('Course publish error:', result);
                setMessage(`⚠️ خطأ في نشر الدورة: ${result.message || 'خطأ غير معروف'}`);
            }
        } catch (err) {
            console.error('Course publish error:', err);
            setMessage('🚫 خطأ في الاتصال بالخادم');
        }
    };

    const launchCourse = async () => {
        if (confirm('هل أنت متأكد من بدء انطلاق الدورة؟ لن يمكن التراجع عن هذا الإجراء.')) {
            try {
                const response = await fetch(`/api/courses/${course.id}/launch`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });

                if (response.ok) {
                    setMessage('✅ تم بدء انطلاق الدورة بنجاح');
                } else {
                    setMessage('⚠️ خطأ في بدء انطلاق الدورة');
                }
            } catch (err) {
                setMessage('🚫 خطأ في الاتصال بالخادم');
            }
        }
    };

    const saveAllChanges = async () => {
        if (confirm('هل تريد حفظ جميع التغييرات في كل الأيام؟')) {
            try {
                setMessage('⏳ جاري حفظ جميع التغييرات...');
                
                for (const day of schedule) {
                    const response = await fetch(`/api/courses/${course.id}/schedule`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...day, course_id: course.id })
                    });
                    
                    if (!response.ok) {
                        throw new Error(`فشل في حفظ اليوم ${day.day_number}`);
                    }
                }
                
                setMessage('✅ تم حفظ جميع التغييرات بنجاح في كل الأيام');
            } catch (err) {
                setMessage(`🚫 خطأ في حفظ التغييرات: ${err.message}`);
            }
        }
    };

    return (
        <Layout user={user}>
            <style jsx>{`
                .scheduler-header { margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 15px; }
                .scheduler-controls { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
                .scheduler-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(450px, 1fr)); gap: 25px; }
                .day-scheduler { 
                    background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%); 
                    padding: 30px; 
                    border-radius: 15px; 
                    box-shadow: 0 6px 20px rgba(0,0,0,0.1);
                    border: 2px solid #e9ecef; 
                    transition: all 0.3s ease;
                    margin-bottom: 25px;
                }
                .day-scheduler:hover { 
                    transform: translateY(-3px); 
                    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
                    border-color: #007bff;
                }
                .day-scheduler h4 { 
                    color: #007bff; 
                    margin-top: 0; 
                    font-size: 1.3em; 
                    font-family: 'Tajawal', Arial, sans-serif;
                    font-weight: 700;
                    padding: 15px;
                    background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
                    color: white;
                    border-radius: 10px;
                    margin-bottom: 20px;
                    text-align: center;
                    box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3);
                }
                .exam-section, .assignments-section { 
                    background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%); 
                    padding: 20px; 
                    border-radius: 12px; 
                    margin: 20px 0; 
                    border: 2px solid #e1f5fe;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
                }
                .exam-section h5, .assignments-section h5 { 
                    margin-top: 0; 
                    color: #1976d2;
                    font-family: 'Tajawal', Arial, sans-serif;
                    font-weight: 600;
                    font-size: 1.1rem;
                    padding: 10px 15px;
                    background: rgba(25, 118, 210, 0.1);
                    border-radius: 8px;
                    border-left: 4px solid #1976d2;
                }
                .form-group { 
                    margin-bottom: 20px; 
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 8px;
                    border: 1px solid #e9ecef;
                    transition: all 0.2s ease;
                }
                .form-group:hover {
                    background: #f1f3f4;
                    border-color: #dee2e6;
                }
                .form-group label { 
                    display: block; 
                    font-weight: 600; 
                    margin-bottom: 8px; 
                    color: #495057;
                    font-family: 'Tajawal', Arial, sans-serif;
                    font-size: 0.95rem;
                }
                .form-group input, .form-group textarea, .form-group select { 
                    width: 100%; 
                    padding: 12px 15px; 
                    border: 2px solid #dee2e6; 
                    border-radius: 6px;
                    font-family: 'Tajawal', Arial, sans-serif;
                    font-size: 0.9rem;
                    transition: all 0.2s ease;
                    background-color: white;
                }
                .form-group input:focus, .form-group textarea:focus, .form-group select:focus {
                    outline: none;
                    border-color: #007bff;
                    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
                    background-color: #fff;
                }
                .form-group textarea { 
                    min-height: 100px; 
                    resize: vertical; 
                    line-height: 1.5;
                }
                .btn-exam-builder { 
                    background: var(--info-color); color: white; border: none; padding: 8px 12px; 
                    border-radius: 5px; cursor: pointer; margin: 10px 0;
                }
                .btn-save-day { 
                    background: var(--success-color); color: white; border: none; padding: 12px 20px; 
                    border-radius: 5px; cursor: pointer; width: 100%; margin-top: 15px;
                }
                .exam-builder { background: #fff; padding: 15px; border-radius: 5px; margin-top: 10px; }
                .exam-controls { margin-bottom: 15px; }
                .exam-controls button { 
                    background: var(--primary-color); color: white; border: none; padding: 8px 12px; 
                    border-radius: 5px; cursor: pointer; margin-right: 10px;
                }
                .question-builder { border: 1px solid #ddd; padding: 15px; border-radius: 5px; margin-bottom: 15px; }
                .question-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
                .question-header h6 { margin: 0; color: var(--primary-color); }
                .question-header button { background: #dc3545; color: white; border: none; padding: 5px 8px; border-radius: 3px; cursor: pointer; }
                .option-input { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
                .option-input input[type="text"] { flex: 1; }
                .true-false-section { display: flex; gap: 20px; align-items: center; }
                .btn-add-day, .btn-control {
                    padding: 12px 20px; border: none; border-radius: 8px; cursor: pointer; 
                    font-weight: 500; margin: 5px;
                }
                .btn-add-day { background: var(--dark-color); color: white; width: 100%; margin-top: 20px; }
                .btn-primary { background: var(--primary-color); color: white; }
                .btn-success { background: var(--success-color); color: white; }
                .btn-warning { background: var(--warning-color); color: white; }
                .btn-info { background: var(--info-color); color: white; }
                .message-bar { padding: 10px; text-align: center; border-radius: 5px; margin-bottom: 15px; }
                .auto-fill-modal { 
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                    background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;
                }
                .auto-fill-content { 
                    background: white; padding: 30px; border-radius: 10px; max-width: 600px; width: 90%;
                    max-height: 80vh; overflow-y: auto;
                }
                .auto-fill-content h3 { margin-top: 0; color: var(--primary-color); }
                
                /* Checklist Styles */
                .checklist-container {
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    padding: 15px;
                    background-color: #fafafa;
                    margin-top: 10px;
                }
                
                .checklist-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 10px;
                    padding: 8px;
                    background-color: white;
                    border-radius: 5px;
                    border: 1px solid #e0e0e0;
                }
                
                .checklist-item input[type="checkbox"] {
                    width: 18px;
                    height: 18px;
                    cursor: pointer;
                }
                
                .checklist-item input[type="text"] {
                    flex: 1;
                    padding: 8px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 14px;
                }
                
                .checklist-item input[type="text"]:focus {
                    outline: none;
                    border-color: var(--primary-color);
                    box-shadow: 0 0 0 2px rgba(0, 86, 179, 0.1);
                }
                
                .remove-item-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    font-size: 16px;
                    padding: 4px;
                    border-radius: 3px;
                    transition: background-color 0.2s;
                }
                
                .remove-item-btn:hover {
                    background-color: #ffebee;
                }
                
                .add-item-btn {
                    background-color: var(--primary-color);
                    color: white;
                    border: none;
                    padding: 10px 15px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 14px;
                    margin-top: 10px;
                    transition: background-color 0.2s;
                }
                
                .add-item-btn:hover {
                    background-color: #004494;
                }
                
                .checklist-item input[type="checkbox"]:checked + input[type="text"] {
                    text-decoration: line-through;
                    opacity: 0.7;
                    background-color: #f5f5f5;
                }
                .modal-buttons { display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; }
            `}</style>
            
            <div className="scheduler-header">
                <h1>🗓️ جدولة دورة: {course.name}</h1>
                <p>هنا يمكنك تحديد محتوى ومهام كل يوم دراسي في الدورة.</p>
                {message && <div className="message-bar" style={{ background: message.includes('✅') ? '#d4edda' : '#f8d7da' }}>{message}</div>}
            </div>

            <div className="scheduler-controls" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
                <button 
                    onClick={() => setShowAutoFill(true)}
                    style={{
                        backgroundColor: '#17a2b8',
                        color: 'white',
                        border: 'none',
                        padding: '12px 20px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        fontFamily: 'Tajawal, Arial, sans-serif',
                        transition: 'all 0.2s ease',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#138496';
                        e.target.style.transform = 'translateY(-1px)';
                        e.target.style.boxShadow = '0 3px 10px rgba(23, 162, 184, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#17a2b8';
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = 'none';
                    }}
                >
                    🤖 الملء التلقائي
                </button>
                <button 
                    onClick={saveAllChanges}
                    style={{
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        padding: '12px 20px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        fontFamily: 'Tajawal, Arial, sans-serif',
                        transition: 'all 0.2s ease',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#218838';
                        e.target.style.transform = 'translateY(-1px)';
                        e.target.style.boxShadow = '0 3px 10px rgba(40, 167, 69, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#28a745';
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = 'none';
                    }}
                >
                    💾 حفظ جميع التغييرات
                </button>
                <button 
                    onClick={saveAsTemplate}
                    style={{
                        backgroundColor: '#ffc107',
                        color: '#212529',
                        border: 'none',
                        padding: '12px 20px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        fontFamily: 'Tajawal, Arial, sans-serif',
                        transition: 'all 0.2s ease',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#e0a800';
                        e.target.style.transform = 'translateY(-1px)';
                        e.target.style.boxShadow = '0 3px 10px rgba(255, 193, 7, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#ffc107';
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = 'none';
                    }}
                >
                    💾 حفظ كقالب
                </button>
                <button 
                    onClick={publishCourse}
                    style={{
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        fontWeight: '600',
                        fontFamily: 'Tajawal, Arial, sans-serif',
                        transition: 'all 0.2s ease',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        textDecoration: 'none',
                        whiteSpace: 'nowrap',
                        margin: '0 10px 10px 0'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#0056b3';
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 4px 12px rgba(0, 123, 255, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#007bff';
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = 'none';
                    }}
                >
                    📢 نشر الدورة
                </button>
                <button 
                    onClick={launchCourse}
                    style={{
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        fontWeight: '600',
                        fontFamily: 'Tajawal, Arial, sans-serif',
                        transition: 'all 0.2s ease',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        whiteSpace: 'nowrap',
                        margin: '0 10px 10px 0'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#218838';
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 4px 12px rgba(40, 167, 69, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#28a745';
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = 'none';
                    }}
                >
                    🚀 بدء انطلاق الدورة
                </button>
            </div>
            
            <div className="scheduler-grid">
                {schedule.map(day => (
                    <DayScheduler key={day.day_number} day={day} onSave={handleSaveDay} />
                ))}
            </div>

            <button 
                onClick={addDay}
                style={{
                    backgroundColor: '#6f42c1',
                    color: 'white',
                    border: 'none',
                    padding: '15px 30px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    fontFamily: 'Tajawal, Arial, sans-serif',
                    transition: 'all 0.2s ease',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    whiteSpace: 'nowrap',
                    margin: '20px auto',
                    boxShadow: '0 2px 8px rgba(111, 66, 193, 0.2)'
                }}
                onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#5a2d91';
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 15px rgba(111, 66, 193, 0.4)';
                }}
                onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#6f42c1';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 8px rgba(111, 66, 193, 0.2)';
                }}
            >
                ➕ إضافة يوم دراسي جديد
            </button>

            {showAutoFill && (
                <div className="auto-fill-modal">
                    <div className="auto-fill-content">
                        <h3>🤖 إعدادات الملء التلقائي</h3>
                        
                        <div className="form-group">
                            <label>🔗 رابط اللقاء الثابت</label>
                            <input 
                                type="text" 
                                value={autoFillTemplate.meeting_link_template}
                                onChange={e => setAutoFillTemplate({...autoFillTemplate, meeting_link_template: e.target.value})}
                                placeholder="https://zoom.us/j/123456789"
                            />
                        </div>

                        <div className="form-group">
                            <label>📂 رابط المحتوى (استخدم ** للترقيم التلقائي)</label>
                            <input 
                                type="text" 
                                value={autoFillTemplate.content_url_template}
                                onChange={e => setAutoFillTemplate({...autoFillTemplate, content_url_template: e.target.value})}
                                placeholder="https://example.com/lesson-**.pdf"
                            />
                        </div>

                        <div className="form-group">
                            <label>📝 عنوان الامتحان الافتراضي (استخدم ** لرقم اليوم)</label>
                            <input 
                                type="text" 
                                value={autoFillTemplate.default_exam_title}
                                onChange={e => setAutoFillTemplate({...autoFillTemplate, default_exam_title: e.target.value})}
                                placeholder="امتحان اليوم الدراسي **"
                            />
                        </div>

                        <div className="form-group">
                            <label>⏰ مدة الامتحان الافتراضية (بالدقائق)</label>
                            <input 
                                type="number" 
                                value={autoFillTemplate.default_exam_time}
                                onChange={e => setAutoFillTemplate({...autoFillTemplate, default_exam_time: parseInt(e.target.value)})}
                                min="5" max="180"
                            />
                        </div>

                        <h4>💼 التكاليف الافتراضية للدرجات الثلاثة</h4>
                        
                        <div className="form-group">
                            <label>🎯 تكاليف درجة 1 (المشرفين) - قائمة مهام</label>
                            <textarea 
                                value={autoFillTemplate.default_costs_level_1}
                                onChange={e => setAutoFillTemplate({...autoFillTemplate, default_costs_level_1: e.target.value})}
                                rows="3"
                                placeholder="أدخل المهام مفصولة بأسطر جديدة، مثال:
مراجعة التقارير
متابعة الأداء
تقييم النتائج"
                            />
                        </div>

                        <div className="form-group">
                            <label>👨‍🏫 تكاليف درجة 2 (المعلمين/المدربين) - قائمة مهام</label>
                            <textarea 
                                value={autoFillTemplate.default_costs_level_2}
                                onChange={e => setAutoFillTemplate({...autoFillTemplate, default_costs_level_2: e.target.value})}
                                rows="3"
                                placeholder="أدخل المهام مفصولة بأسطر جديدة، مثال:
تحضير المحتوى
إعداد الأسئلة
متابعة الطلاب"
                            />
                        </div>

                        <div className="form-group">
                            <label>🎓 تكاليف درجة 3 (الطلاب) - قائمة مهام</label>
                            <textarea 
                                value={autoFillTemplate.default_costs_level_3}
                                onChange={e => setAutoFillTemplate({...autoFillTemplate, default_costs_level_3: e.target.value})}
                                rows="3"
                                placeholder="أدخل المهام مفصولة بأسطر جديدة، مثال:
مراجعة المحتوى
حل التمارين
حضور اللقاء"
                            />
                        </div>

                        <div className="modal-buttons" style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '25px' }}>
                            <button 
                                onClick={handleAutoFill}
                                style={{
                                    backgroundColor: '#007bff',
                                    color: 'white',
                                    border: 'none',
                                    padding: '12px 24px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    fontFamily: 'Tajawal, Arial, sans-serif',
                                    transition: 'all 0.2s ease',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    whiteSpace: 'nowrap',
                                    minWidth: '160px',
                                    justifyContent: 'center'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = '#0056b3';
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = '0 4px 12px rgba(0, 123, 255, 0.4)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = '#007bff';
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = 'none';
                                }}
                            >
                                ✅ تطبيق الملء التلقائي
                            </button>
                            <button 
                                onClick={() => setShowAutoFill(false)}
                                style={{
                                    backgroundColor: '#6c757d',
                                    color: 'white',
                                    border: 'none',
                                    padding: '12px 24px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    fontFamily: 'Tajawal, Arial, sans-serif',
                                    transition: 'all 0.2s ease',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    whiteSpace: 'nowrap',
                                    minWidth: '120px',
                                    justifyContent: 'center'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = '#5a6268';
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = '0 4px 12px rgba(108, 117, 125, 0.4)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = '#6c757d';
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = 'none';
                                }}
                            >
                                ❌ إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export const getServerSideProps = withAuth(async (context) => {
    const { id } = context.params;
    
    console.log('Schedule page - received id:', id);
    
    // Validate that id is a valid number
    if (!id || id === 'undefined' || id === 'null' || isNaN(parseInt(id))) {
        console.error('Invalid course ID:', id);
        return { 
            redirect: {
                destination: '/admin/courses/manage',
                permanent: false,
            }
        };
    }
    
    const courseId = parseInt(id);
    const courseResult = await pool.query('SELECT * FROM courses WHERE id = $1', [courseId]);
    if (courseResult.rows.length === 0) return { notFound: true };

    const scheduleResult = await pool.query('SELECT * FROM course_schedule WHERE course_id = $1 ORDER BY day_number ASC', [courseId]);
    
    // Fix date serialization issues
    const course = courseResult.rows[0];
    const schedule = scheduleResult.rows;
    
    return {
        props: safeProps({
            user: context.user,
            course: serializeDbRow(course),
            schedule: serializeDbRows(schedule),
        })
    };
}, { roles: ['admin', 'head'] });

export default CourseSchedulerPage;