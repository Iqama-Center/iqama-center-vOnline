import React, { useState, useEffect, useCallback } from 'react';

const CourseScheduling = ({ courseId, onScheduleUpdate }) => {
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (courseId) {
            fetchSchedule();
        }
    }, [courseId, fetchSchedule]);

    const fetchSchedule = useCallback(async () => {
        try {
            const response = await fetch(`/api/courses/schedule?course_id=${courseId}`);
            if (response.ok) {
                const data = await response.json();
                setSchedule(data);
            }
        } catch (error) {
            console.error('Error fetching schedule:', error);
        } finally {
            setLoading(false);
        }
    }, [courseId]);

    const updateScheduleDay = (dayIndex, field, value) => {
        const updatedSchedule = [...schedule];
        updatedSchedule[dayIndex] = {
            ...updatedSchedule[dayIndex],
            [field]: value
        };
        setSchedule(updatedSchedule);
    };

    const saveSchedule = async () => {
        setSaving(true);
        try {
            const response = await fetch(`/api/courses/schedule?course_id=${courseId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    schedule_data: schedule
                })
            });

            if (response.ok) {
                alert('تم حفظ جدولة الدورة بنجاح');
                if (onScheduleUpdate) {
                    onScheduleUpdate(schedule);
                }
            } else {
                alert('حدث خطأ في حفظ الجدولة');
            }
        } catch (error) {
            console.error('Error saving schedule:', error);
            alert('حدث خطأ في حفظ الجدولة');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="loading">جاري تحميل الجدولة...</div>;
    }

    return (
        <div className="course-scheduling">
            <style jsx>{`
                .course-scheduling {
                    background: white;
                    padding: 25px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                }
                .schedule-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 25px;
                    padding-bottom: 15px;
                    border-bottom: 2px solid #f0f0f0;
                }
                .schedule-day {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 15px;
                    border-left: 4px solid #007bff;
                }
                .day-header {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    margin-bottom: 15px;
                }
                .day-number {
                    background: #007bff;
                    color: white;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                }
                .form-group {
                    margin-bottom: 15px;
                }
                .form-group label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: bold;
                    color: #333;
                }
                .form-group input, .form-group textarea {
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 14px;
                }
                .form-group textarea {
                    min-height: 80px;
                    resize: vertical;
                }
                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                }
                .save-btn {
                    background: #28a745;
                    color: white;
                    padding: 12px 25px;
                    border: none;
                    border-radius: 5px;
                    font-size: 16px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .save-btn:hover {
                    background: #218838;
                }
                .save-btn:disabled {
                    background: #6c757d;
                    cursor: not-allowed;
                }
                .loading {
                    text-align: center;
                    padding: 40px;
                    color: #666;
                }
                @media (max-width: 768px) {
                    .form-row {
                        grid-template-columns: 1fr;
                    }
                    .schedule-header {
                        flex-direction: column;
                        gap: 15px;
                    }
                }
            `}</style>

            <div className="schedule-header">
                <h2><i className="fas fa-calendar-alt"></i> جدولة الدورة</h2>
                <button 
                    className="save-btn" 
                    onClick={saveSchedule}
                    disabled={saving}
                >
                    <i className="fas fa-save"></i>
                    {saving ? 'جاري الحفظ...' : 'حفظ الجدولة'}
                </button>
            </div>

            {schedule.map((day, index) => (
                <div key={day.day_number || index} className="schedule-day">
                    <div className="day-header">
                        <div className="day-number">{day.day_number}</div>
                        <div className="form-group" style={{flex: 1, marginBottom: 0}}>
                            <label>عنوان اليوم</label>
                            <input
                                type="text"
                                value={day.title || ''}
                                onChange={(e) => updateScheduleDay(index, 'title', e.target.value)}
                                placeholder={`اليوم الدراسي ${day.day_number}`}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label><i className="fas fa-link"></i> رابط المحتوى (PDF/Video)</label>
                            <input
                                type="url"
                                value={day.content_url || ''}
                                onChange={(e) => updateScheduleDay(index, 'content_url', e.target.value)}
                                placeholder="https://example.com/content"
                            />
                        </div>
                        <div className="form-group">
                            <label><i className="fas fa-video"></i> رابط اللقاء</label>
                            <input
                                type="url"
                                value={day.meeting_link || ''}
                                onChange={(e) => updateScheduleDay(index, 'meeting_link', e.target.value)}
                                placeholder="https://zoom.us/j/..."
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label><i className="fas fa-tasks"></i> التكاليف والمهام</label>
                        <textarea
                            value={day.assignments?.description || ''}
                            onChange={(e) => updateScheduleDay(index, 'assignments', {
                                ...day.assignments,
                                description: e.target.value
                            })}
                            placeholder="اكتب التكاليف والمهام لهذا اليوم..."
                        />
                    </div>
                </div>
            ))}

            {schedule.length === 0 && (
                <div className="loading">
                    <i className="fas fa-calendar-times" style={{fontSize: '3rem', color: '#ddd', marginBottom: '15px'}}></i>
                    <p>لا توجد أيام مجدولة لهذه الدورة بعد.</p>
                </div>
            )}
        </div>
    );
};

export default CourseScheduling;