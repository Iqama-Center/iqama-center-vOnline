import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import { withAuth } from '../../lib/withAuth';

const WorkerSchedulePage = ({ user }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState('week'); // 'week', 'month'
    const [scheduleData, setScheduleData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showEventModal, setShowEventModal] = useState(false);

    useEffect(() => {
        loadSchedule();
    }, [currentDate, viewMode, loadSchedule]);

    const loadSchedule = useCallback(async () => {
        try {
            // Try to load real schedule data from API
            try {
                const response = await fetch('/api/worker/schedule');
                if (response.ok) {
                    const data = await response.json();
                    setScheduleData(data);
                } else {
                    setScheduleData([]);
                }
            } catch (error) {
                console.error('Failed to load schedule:', error);
                setScheduleData([]);
            }
        } catch (error) {
            console.error('Error loading schedule:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const generateMockSchedule = () => {
        const events = [];
        const today = new Date();
        
        // Generate events for the current week
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - today.getDay() + i);
            
            // Add some random events
            if (Math.random() > 0.3) {
                events.push({
                    id: `event-${i}-1`,
                    title: 'اجتماع الفريق الصباحي',
                    start_time: '09:00',
                    end_time: '09:30',
                    date: date.toISOString().split('T')[0],
                    type: 'meeting',
                    location: 'قاعة الاجتماعات',
                    description: 'اجتماع يومي لمناقشة خطة العمل',
                    status: 'scheduled'
                });
            }
            
            if (Math.random() > 0.4) {
                events.push({
                    id: `event-${i}-2`,
                    title: 'مراجعة البيانات',
                    start_time: '10:00',
                    end_time: '12:00',
                    date: date.toISOString().split('T')[0],
                    type: 'work',
                    location: 'مكتب البيانات',
                    description: 'مراجعة وتدقيق بيانات الطلاب الجدد',
                    status: 'scheduled'
                });
            }
            
            if (Math.random() > 0.6) {
                events.push({
                    id: `event-${i}-3`,
                    title: 'تدريب على النظام الجديد',
                    start_time: '14:00',
                    end_time: '16:00',
                    date: date.toISOString().split('T')[0],
                    type: 'training',
                    location: 'معمل الحاسوب',
                    description: 'تدريب على استخدام النظام الجديد لإدارة البيانات',
                    status: 'scheduled'
                });
            }
        }
        
        return events;
    };

    const getWeekDays = () => {
        const week = [];
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
        
        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            week.push(day);
        }
        
        return week;
    };

    const getEventsForDate = (date) => {
        const dateStr = date.toISOString().split('T')[0];
        return scheduleData.filter(event => event.date === dateStr);
    };

    const getEventTypeColor = (type) => {
        const colors = {
            'meeting': '#007bff',
            'work': '#28a745',
            'training': '#ffc107',
            'break': '#6c757d',
            'personal': '#17a2b8'
        };
        return colors[type] || '#6c757d';
    };

    const getEventTypeIcon = (type) => {
        const icons = {
            'meeting': 'fas fa-users',
            'work': 'fas fa-briefcase',
            'training': 'fas fa-graduation-cap',
            'break': 'fas fa-coffee',
            'personal': 'fas fa-user'
        };
        return icons[type] || 'fas fa-calendar';
    };

    const getEventTypeText = (type) => {
        const types = {
            'meeting': 'اجتماع',
            'work': 'عمل',
            'training': 'تدريب',
            'break': 'استراحة',
            'personal': 'شخصي'
        };
        return types[type] || type;
    };

    const navigateWeek = (direction) => {
        const newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() + (direction * 7));
        setCurrentDate(newDate);
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    const formatTime = (timeStr) => {
        const [hours, minutes] = timeStr.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'م' : 'ص';
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    const getDayName = (date) => {
        const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        return days[date.getDay()];
    };

    const isToday = (date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    return (
        <Layout user={user}>
            <style jsx>{`
                .schedule-container {
                    padding: 20px;
                }
                .page-header {
                    background: linear-gradient(135deg, #17a2b8 0%, #007bff 100%);
                    color: white;
                    padding: 30px;
                    border-radius: 12px;
                    margin-bottom: 30px;
                }
                .page-header h1 {
                    margin: 0 0 10px 0;
                    font-size: 2rem;
                }
                .schedule-controls {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                    gap: 15px;
                }
                .date-navigation {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }
                .nav-btn {
                    background: #007bff;
                    color: white;
                    border: none;
                    padding: 8px 12px;
                    border-radius: 5px;
                    cursor: pointer;
                    transition: background-color 0.3s ease;
                }
                .nav-btn:hover {
                    background: #0056b3;
                }
                .current-period {
                    font-size: 1.2rem;
                    font-weight: bold;
                    color: #333;
                }
                .view-controls {
                    display: flex;
                    gap: 10px;
                }
                .view-btn {
                    padding: 8px 15px;
                    border: 1px solid #007bff;
                    background: white;
                    color: #007bff;
                    border-radius: 5px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                .view-btn.active {
                    background: #007bff;
                    color: white;
                }
                .view-btn:hover {
                    background: #007bff;
                    color: white;
                }
                .schedule-grid {
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    overflow: hidden;
                }
                .week-header {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    background: #f8f9fa;
                    border-bottom: 1px solid #dee2e6;
                }
                .day-header {
                    padding: 15px 10px;
                    text-align: center;
                    font-weight: bold;
                    color: #495057;
                    border-left: 1px solid #dee2e6;
                }
                .day-header:last-child {
                    border-left: none;
                }
                .day-header.today {
                    background: #007bff;
                    color: white;
                }
                .week-body {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    min-height: 500px;
                }
                .day-column {
                    border-left: 1px solid #dee2e6;
                    padding: 10px;
                    min-height: 500px;
                }
                .day-column:last-child {
                    border-left: none;
                }
                .day-column.today {
                    background: #f8f9ff;
                }
                .event-item {
                    background: white;
                    border-radius: 6px;
                    padding: 8px;
                    margin-bottom: 8px;
                    border-left: 4px solid #007bff;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    cursor: pointer;
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }
                .event-item:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 2px 6px rgba(0,0,0,0.15);
                }
                .event-time {
                    font-size: 0.8rem;
                    color: #666;
                    margin-bottom: 4px;
                }
                .event-title {
                    font-weight: bold;
                    color: #333;
                    font-size: 0.9rem;
                    margin-bottom: 2px;
                }
                .event-location {
                    font-size: 0.8rem;
                    color: #888;
                }
                .event-type-badge {
                    display: inline-block;
                    padding: 2px 6px;
                    border-radius: 10px;
                    font-size: 0.7rem;
                    color: white;
                    margin-top: 4px;
                }
                .stats-bar {
                    display: flex;
                    gap: 20px;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                }
                .stat-item {
                    background: white;
                    padding: 15px 20px;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    text-align: center;
                    min-width: 120px;
                }
                .stat-number {
                    font-size: 1.5rem;
                    font-weight: bold;
                    color: #17a2b8;
                }
                .stat-label {
                    font-size: 0.9rem;
                    color: #666;
                    margin-top: 5px;
                }
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                }
                .modal-content {
                    background: white;
                    padding: 30px;
                    border-radius: 8px;
                    width: 90%;
                    max-width: 500px;
                }
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 1px solid #eee;
                }
                .modal-title {
                    font-size: 1.3rem;
                    font-weight: bold;
                    color: #333;
                    margin: 0;
                }
                .close-btn {
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: #666;
                }
                .event-details {
                    display: grid;
                    gap: 15px;
                }
                .detail-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .detail-icon {
                    width: 20px;
                    color: #666;
                }
                .loading {
                    text-align: center;
                    padding: 40px;
                    color: #666;
                }
                .empty-day {
                    text-align: center;
                    color: #999;
                    font-style: italic;
                    padding: 20px;
                }
                @media (max-width: 768px) {
                    .schedule-controls {
                        flex-direction: column;
                        align-items: stretch;
                    }
                    .week-header,
                    .week-body {
                        grid-template-columns: 1fr;
                    }
                    .day-column {
                        border-left: none;
                        border-top: 1px solid #dee2e6;
                        min-height: auto;
                    }
                    .day-header {
                        border-left: none;
                        border-bottom: 1px solid #dee2e6;
                    }
                }
            `}</style>

            <div className="schedule-container">
                <div className="page-header">
                    <h1><i className="fas fa-calendar-alt fa-fw"></i> جدولي</h1>
                    <p>عرض ومتابعة جدول العمل والمواعيد</p>
                </div>

                {/* Statistics */}
                <div className="stats-bar">
                    <div className="stat-item">
                        <div className="stat-number">{scheduleData.length}</div>
                        <div className="stat-label">إجمالي المواعيد</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-number">{scheduleData.filter(e => e.type === 'meeting').length}</div>
                        <div className="stat-label">الاجتماعات</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-number">{scheduleData.filter(e => e.type === 'work').length}</div>
                        <div className="stat-label">مهام العمل</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-number">{scheduleData.filter(e => e.type === 'training').length}</div>
                        <div className="stat-label">التدريبات</div>
                    </div>
                </div>

                {/* Schedule Controls */}
                <div className="schedule-controls">
                    <div className="date-navigation">
                        <button className="nav-btn" onClick={() => navigateWeek(-1)}>
                            <i className="fas fa-chevron-right"></i>
                        </button>
                        <div className="current-period">
                            {getWeekDays()[0].toLocaleDateString('ar-EG')} - {getWeekDays()[6].toLocaleDateString('ar-EG')}
                        </div>
                        <button className="nav-btn" onClick={() => navigateWeek(1)}>
                            <i className="fas fa-chevron-left"></i>
                        </button>
                        <button className="nav-btn" onClick={goToToday}>
                            اليوم
                        </button>
                    </div>
                    <div className="view-controls">
                        <button 
                            className={`view-btn ${viewMode === 'week' ? 'active' : ''}`}
                            onClick={() => setViewMode('week')}
                        >
                            أسبوعي
                        </button>
                        <button 
                            className={`view-btn ${viewMode === 'month' ? 'active' : ''}`}
                            onClick={() => setViewMode('month')}
                        >
                            شهري
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="loading">
                        <i className="fas fa-spinner fa-spin fa-2x"></i>
                        <p>جاري تحميل الجدول...</p>
                    </div>
                ) : (
                    <div className="schedule-grid">
                        {/* Week Header */}
                        <div className="week-header">
                            {getWeekDays().map((day, index) => (
                                <div 
                                    key={index} 
                                    className={`day-header ${isToday(day) ? 'today' : ''}`}
                                >
                                    <div>{getDayName(day)}</div>
                                    <div style={{ fontSize: '0.9rem', marginTop: '5px' }}>
                                        {day.getDate()}/{day.getMonth() + 1}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Week Body */}
                        <div className="week-body">
                            {getWeekDays().map((day, index) => {
                                const dayEvents = getEventsForDate(day);
                                return (
                                    <div 
                                        key={index} 
                                        className={`day-column ${isToday(day) ? 'today' : ''}`}
                                    >
                                        {dayEvents.length === 0 ? (
                                            <div className="empty-day">لا توجد مواعيد</div>
                                        ) : (
                                            dayEvents.map(event => (
                                                <div 
                                                    key={event.id} 
                                                    className="event-item"
                                                    style={{ borderLeftColor: getEventTypeColor(event.type) }}
                                                    onClick={() => {
                                                        setSelectedEvent(event);
                                                        setShowEventModal(true);
                                                    }}
                                                >
                                                    <div className="event-time">
                                                        {formatTime(event.start_time)} - {formatTime(event.end_time)}
                                                    </div>
                                                    <div className="event-title">{event.title}</div>
                                                    <div className="event-location">
                                                        <i className="fas fa-map-marker-alt"></i> {event.location}
                                                    </div>
                                                    <div 
                                                        className="event-type-badge"
                                                        style={{ backgroundColor: getEventTypeColor(event.type) }}
                                                    >
                                                        <i className={getEventTypeIcon(event.type)}></i> {getEventTypeText(event.type)}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Event Details Modal */}
                {showEventModal && selectedEvent && (
                    <div className="modal-overlay" onClick={() => setShowEventModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3 className="modal-title">{selectedEvent.title}</h3>
                                <button 
                                    className="close-btn"
                                    onClick={() => setShowEventModal(false)}
                                >
                                    ×
                                </button>
                            </div>

                            <div className="event-details">
                                <div className="detail-item">
                                    <i className="fas fa-calendar detail-icon"></i>
                                    <span>{new Date(selectedEvent.date).toLocaleDateString('ar-EG')}</span>
                                </div>
                                <div className="detail-item">
                                    <i className="fas fa-clock detail-icon"></i>
                                    <span>{formatTime(selectedEvent.start_time)} - {formatTime(selectedEvent.end_time)}</span>
                                </div>
                                <div className="detail-item">
                                    <i className="fas fa-map-marker-alt detail-icon"></i>
                                    <span>{selectedEvent.location}</span>
                                </div>
                                <div className="detail-item">
                                    <i className={`${getEventTypeIcon(selectedEvent.type)} detail-icon`}></i>
                                    <span>{getEventTypeText(selectedEvent.type)}</span>
                                </div>
                                {selectedEvent.description && (
                                    <div className="detail-item">
                                        <i className="fas fa-info-circle detail-icon"></i>
                                        <span>{selectedEvent.description}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export const getServerSideProps = withAuth(async (context) => {
    const { user } = context;
    
    if (user.role !== 'worker') {
        return {
            redirect: {
                destination: '/dashboard',
                permanent: false,
            },
        };
    }

    return {
        props: {
            user: JSON.parse(JSON.stringify(user))
        }
    };
}, { roles: ['worker'] });

export default WorkerSchedulePage;