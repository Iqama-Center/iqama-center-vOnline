
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { withAuth } from '../../lib/withAuth';
import pool from '../../lib/db';

const WorkerSchedulePage = ({ user, initialEvents, weekStartDate }) => {
    const router = useRouter();
    const [currentDate, setCurrentDate] = useState(new Date(weekStartDate));
    const [events, setEvents] = useState(initialEvents);
    const [showEventModal, setShowEventModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Helper to get the start of a given date
    const getStartOfDay = (date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d;
    };

    const getWeekDays = () => {
        const week = [];
        const startOfWeek = getStartOfDay(currentDate);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        
        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            week.push(day);
        }
        return week;
    };

    const getEventsForDate = (date) => {
        const dayStart = getStartOfDay(date).getTime();
        const dayEnd = dayStart + 24 * 60 * 60 * 1000;

        return events.filter(event => {
            const eventStart = new Date(event.start_time).getTime();
            return eventStart >= dayStart && eventStart < dayEnd;
        }).sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    };

    const navigateWeek = (direction) => {
        const newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() + (direction * 7));
        router.push(`/worker/schedule?date=${newDate.toISOString().split('T')[0]}`);
    };

    const goToToday = () => {
        router.push('/worker/schedule');
    };

    const formatTime = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    const getDayName = (date) => {
        return date.toLocaleDateString('ar-EG', { weekday: 'long' });
    };

    const isToday = (date) => {
        return getStartOfDay(date).getTime() === getStartOfDay(new Date()).getTime();
    };

    const getEventTypeColor = (type) => {
        const colors = {
            'meeting': '#007bff', 'work': '#28a745', 'training': '#ffc107', 
            'break': '#6c757d', 'personal': '#17a2b8'
        };
        return colors[type] || '#6c757d';
    };

    const getEventTypeIcon = (type) => {
        const icons = {
            'meeting': 'fas fa-users', 'work': 'fas fa-briefcase', 'training': 'fas fa-graduation-cap',
            'break': 'fas fa-coffee', 'personal': 'fas fa-user'
        };
        return icons[type] || 'fas fa-calendar';
    };

    const getEventTypeText = (type) => {
        const types = {
            'meeting': 'اجتماع', 'work': 'عمل', 'training': 'تدريب',
            'break': 'استراحة', 'personal': 'شخصي'
        };
        return types[type] || type;
    };

    return (
        <Layout user={user}>
            {/* Styles are unchanged from the original file */}
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
                .day-header:last-child { border-left: none; }
                .day-header.today { background: #007bff; color: white; }
                .week-body { display: grid; grid-template-columns: repeat(7, 1fr); min-height: 500px; }
                .day-column { border-left: 1px solid #dee2e6; padding: 10px; min-height: 500px; }
                .day-column:last-child { border-left: none; }
                .day-column.today { background: #f8f9ff; }
                .event-item { background: white; border-radius: 6px; padding: 8px; margin-bottom: 8px; border-left: 4px solid #007bff; box-shadow: 0 1px 3px rgba(0,0,0,0.1); cursor: pointer; transition: transform 0.2s ease, box-shadow 0.2s ease; }
                .event-item:hover { transform: translateY(-1px); box-shadow: 0 2px 6px rgba(0,0,0,0.15); }
                .event-time { font-size: 0.8rem; color: #666; margin-bottom: 4px; }
                .event-title { font-weight: bold; color: #333; font-size: 0.9rem; margin-bottom: 2px; }
                .event-location { font-size: 0.8rem; color: #888; }
                .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; }
                .modal-content { background: white; padding: 30px; border-radius: 8px; width: 90%; max-width: 500px; }
                .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #eee; }
                .modal-title { font-size: 1.3rem; font-weight: bold; color: #333; margin: 0; }
                .close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #666; }
                .event-details { display: grid; gap: 15px; }
                .detail-item { display: flex; align-items: center; gap: 10px; }
                .detail-icon { width: 20px; color: #666; }
                .empty-day { text-align: center; color: #999; font-style: italic; padding: 20px; }
            `}</style>

            <div className="schedule-container">
                <div className="page-header">
                    <h1><i className="fas fa-calendar-alt fa-fw"></i> جدولي</h1>
                    <p>عرض ومتابعة جدول العمل والمواعيد</p>
                </div>

                <div className="schedule-controls">
                    <div className="date-navigation">
                        <button className="nav-btn" onClick={() => navigateWeek(-1)}><i className="fas fa-chevron-right"></i></button>
                        <div className="current-period">
                            {getWeekDays()[0].toLocaleDateString('ar-EG', {day: 'numeric', month: 'long'})} - {getWeekDays()[6].toLocaleDateString('ar-EG', {day: 'numeric', month: 'long', year: 'numeric'})}
                        </div>
                        <button className="nav-btn" onClick={() => navigateWeek(1)}><i className="fas fa-chevron-left"></i></button>
                        <button className="nav-btn" onClick={goToToday}>اليوم</button>
                    </div>
                    <button className="nav-btn" style={{background: '#28a745'}} onClick={() => setShowCreateModal(true)}><i className="fas fa-plus"></i> إضافة موعد</button>
                </div>

                <div className="schedule-grid">
                    <div className="week-header">
                        {getWeekDays().map((day, index) => (
                            <div key={index} className={`day-header ${isToday(day) ? 'today' : ''}`}>
                                <div>{getDayName(day)}</div>
                                <div style={{ fontSize: '0.9rem', marginTop: '5px' }}>{day.getDate()}/{day.getMonth() + 1}</div>
                            </div>
                        ))}
                    </div>
                    <div className="week-body">
                        {getWeekDays().map((day, index) => {
                            const dayEvents = getEventsForDate(day);
                            return (
                                <div key={index} className={`day-column ${isToday(day) ? 'today' : ''}`}>
                                    {dayEvents.length === 0 ? (
                                        <div className="empty-day">لا توجد مواعيد</div>
                                    ) : (
                                        dayEvents.map(event => (
                                            <div key={event.id} className="event-item" style={{ borderLeftColor: getEventTypeColor(event.event_type) }} onClick={() => { setSelectedEvent(event); setShowEventModal(true); }}>
                                                <div className="event-time">{formatTime(event.start_time)} - {formatTime(event.end_time)}</div>
                                                <div className="event-title">{event.title}</div>
                                                {event.location && <div className="event-location"><i className="fas fa-map-marker-alt"></i> {event.location}</div>}
                                            </div>
                                        ))
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {showEventModal && selectedEvent && (
                     <div className="modal-overlay" onClick={() => setShowEventModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3 className="modal-title">{selectedEvent.title}</h3>
                                <button className="close-btn" onClick={() => setShowEventModal(false)}>
                                    ×
                                </button>
                            </div>
                            <div className="event-details">
                                <div className="detail-item"><i className={`${getEventTypeIcon(selectedEvent.event_type)} detail-icon`}></i><span>{getEventTypeText(selectedEvent.event_type)}</span></div>
                                <div className="detail-item"><i className="fas fa-calendar detail-icon"></i><span>{new Date(selectedEvent.start_time).toLocaleDateString('ar-EG')}</span></div>
                                <div className="detail-item"><i className="fas fa-clock detail-icon"></i><span>{formatTime(selectedEvent.start_time)} - {formatTime(selectedEvent.end_time)}</span></div>
                                {selectedEvent.location && <div className="detail-item"><i className="fas fa-map-marker-alt detail-icon"></i><span>{selectedEvent.location}</span></div>}
                                {selectedEvent.description && <div className="detail-item"><i className="fas fa-info-circle detail-icon"></i><span>{selectedEvent.description}</span></div>}
                            </div>
                        </div>
                    </div>
                )}

                {showCreateModal && <CreateEventModal onClose={() => setShowCreateModal(false)} onSave={() => router.replace(router.asPath)} />}
            </div>
        </Layout>
    );
};

// CreateEventModal Component
const CreateEventModal = ({ onClose, onSave }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [event, setEvent] = useState({
        title: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        start_time_str: '09:00',
        end_time_str: '10:00',
        event_type: 'work',
        location: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEvent(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        const start_time = new Date(`${event.date}T${event.start_time_str}`);
        const end_time = new Date(`${event.date}T${event.end_time_str}`);

        if (end_time <= start_time) {
            setError('وقت النهاية يجب أن يكون بعد وقت البداية');
            setIsSubmitting(false);
            return;
        }

        try {
            const response = await fetch('/api/worker/schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...event, start_time, end_time })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Failed to create event');
            }
            onSave(); // Reloads page data
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">إضافة موعد جديد</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>
                <form onSubmit={handleSubmit}>
                    {/* Form fields for the new event */}
                    <div className="form-group">
                        <label>العنوان</label>
                        <input type="text" name="title" value={event.title} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>التاريخ</label>
                        <input type="date" name="date" value={event.date} onChange={handleChange} required />
                    </div>
                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                        <div className="form-group">
                            <label>وقت البداية</label>
                            <input type="time" name="start_time_str" value={event.start_time_str} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>وقت النهاية</label>
                            <input type="time" name="end_time_str" value={event.end_time_str} onChange={handleChange} required />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>النوع</label>
                        <select name="event_type" value={event.event_type} onChange={handleChange}>
                            <option value="work">عمل</option>
                            <option value="meeting">اجتماع</option>
                            <option value="training">تدريب</option>
                            <option value="break">استراحة</option>
                            <option value="personal">شخصي</option>
                        </select>
                    </div>
                     <div className="form-group">
                        <label>الموقع (اختياري)</label>
                        <input type="text" name="location" value={event.location} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>الوصف (اختياري)</label>
                        <textarea name="description" value={event.description} onChange={handleChange}></textarea>
                    </div>
                    {error && <p style={{color: 'red'}}>{error}</p>}
                    <div style={{display: 'flex', justifyContent: 'flex-end', gap: '10px'}}>
                        <button type="button" className="btn btn-outline" onClick={onClose}>إلغاء</button>
                        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? 'جاري الحفظ...' : 'حفظ الموعد'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export const getServerSideProps = withAuth(async (context) => {
    const { user } = context;
    const { date } = context.query;

    if (user.role !== 'worker') {
        return { redirect: { destination: '/dashboard', permanent: false } };
    }

    try {
        const targetDate = date ? new Date(date) : new Date();
        const startOfWeek = new Date(targetDate);
        startOfWeek.setDate(targetDate.getDate() - targetDate.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);

        const eventsResult = await pool.query(
            `SELECT id, title, description, start_time, end_time, event_type, location, status 
             FROM worker_schedule_events 
             WHERE worker_id = $1 AND (start_time, end_time) OVERLAPS ($2, $3)
             ORDER BY start_time ASC`,
            [user.id, startOfWeek.toISOString(), endOfWeek.toISOString()]
        );

        return {
            props: {
                user: JSON.parse(JSON.stringify(user)),
                initialEvents: JSON.parse(JSON.stringify(eventsResult.rows)),
                weekStartDate: startOfWeek.toISOString(),
            },
        };
    } catch (error) {
        console.error("Error in getServerSideProps for worker schedule:", error);
        return {
            props: {
                user: JSON.parse(JSON.stringify(user)),
                initialEvents: [],
                weekStartDate: new Date().toISOString(),
                error: 'Failed to load schedule data.'
            }
        };
    }
}, { roles: ['worker'] });

export default WorkerSchedulePage;
