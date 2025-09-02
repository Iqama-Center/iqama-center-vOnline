import React, { useState, useEffect } from 'react';

const TaskNotificationSystem = ({ userId, userRole }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchNotifications();
        // Set up polling for new notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [userId]);

    const fetchNotifications = async () => {
        try {
            const response = await fetch('/api/notifications');
            if (response.ok) {
                const data = await response.json();
                setNotifications(data.notifications || []);
                setUnreadCount(data.unreadCount || 0);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            const response = await fetch('/api/notifications/mark-read', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ notificationId }),
            });

            if (response.ok) {
                setNotifications(prev => 
                    prev.map(notif => 
                        notif.id === notificationId 
                            ? { ...notif, read: true }
                            : notif
                    )
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/notifications/mark-read', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ markAll: true }),
            });

            if (response.ok) {
                setNotifications(prev => 
                    prev.map(notif => ({ ...notif, read: true }))
                );
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        } finally {
            setLoading(false);
        }
    };

    const getNotificationIcon = (type) => {
        const icons = {
            'task_released': '📋',
            'task_completed': '✅',
            'task_expired': '⏰',
            'task_overdue': '⚠️',
            'deadline_reminder': '⏰',
            'penalty_applied': '❌',
            'student_submission': '📝',
            'new_task': '📋',
            'task_scheduled': '📅'
        };
        return icons[type] || '📢';
    };

    const getNotificationColor = (type) => {
        const colors = {
            'task_released': 'bg-blue-100 border-blue-300',
            'task_completed': 'bg-green-100 border-green-300',
            'task_expired': 'bg-red-100 border-red-300',
            'task_overdue': 'bg-red-100 border-red-300',
            'deadline_reminder': 'bg-yellow-100 border-yellow-300',
            'penalty_applied': 'bg-red-100 border-red-300',
            'student_submission': 'bg-purple-100 border-purple-300',
            'new_task': 'bg-blue-100 border-blue-300',
            'task_scheduled': 'bg-gray-100 border-gray-300'
        };
        return colors[type] || 'bg-gray-100 border-gray-300';
    };

    const formatTimeAgo = (dateString) => {
        const now = new Date();
        const date = new Date(dateString);
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));

        if (diffInMinutes < 1) return 'الآن';
        if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`;
        
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `منذ ${diffInHours} ساعة`;
        
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `منذ ${diffInDays} يوم`;
        
        return date.toLocaleDateString('ar-SA');
    };

    const taskNotifications = notifications.filter(notif => 
        ['task_released', 'task_completed', 'task_expired', 'task_overdue', 
         'deadline_reminder', 'penalty_applied', 'student_submission', 
         'new_task', 'task_scheduled'].includes(notif.type)
    );

    return (
        <div className="notification-system">
            {/* Notification Bell */}
            <div className="notification-bell" onClick={() => setShowNotifications(!showNotifications)}>
                <div className="bell-icon">
                    🔔
                    {unreadCount > 0 && (
                        <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                    )}
                </div>
            </div>

            {/* Notification Dropdown */}
            {showNotifications && (
                <div className="notification-dropdown">
                    <div className="notification-header">
                        <h3>إشعارات المهام</h3>
                        {unreadCount > 0 && (
                            <button 
                                onClick={markAllAsRead}
                                disabled={loading}
                                className="mark-all-read-btn"
                            >
                                {loading ? 'جاري...' : 'تحديد الكل كمقروء'}
                            </button>
                        )}
                    </div>

                    <div className="notifications-list">
                        {taskNotifications.length > 0 ? (
                            taskNotifications.slice(0, 10).map(notification => (
                                <div 
                                    key={notification.id}
                                    className={`notification-item ${!notification.read ? 'unread' : ''} ${getNotificationColor(notification.type)}`}
                                    onClick={() => !notification.read && markAsRead(notification.id)}
                                >
                                    <div className="notification-icon">
                                        {getNotificationIcon(notification.type)}
                                    </div>
                                    <div className="notification-content">
                                        <p className="notification-message">{notification.message}</p>
                                        <span className="notification-time">
                                            {formatTimeAgo(notification.created_at)}
                                        </span>
                                    </div>
                                    {!notification.read && (
                                        <div className="unread-indicator"></div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="no-notifications">
                                <p>لا توجد إشعارات مهام</p>
                            </div>
                        )}
                    </div>

                    {taskNotifications.length > 10 && (
                        <div className="notification-footer">
                            <button 
                                onClick={() => window.location.href = '/notifications'}
                                className="view-all-btn"
                            >
                                عرض جميع الإشعارات
                            </button>
                        </div>
                    )}
                </div>
            )}

            <style jsx>{`
                .notification-system {
                    position: relative;
                    display: inline-block;
                }

                .notification-bell {
                    cursor: pointer;
                    padding: 8px;
                    border-radius: 50%;
                    transition: background-color 0.2s;
                }

                .notification-bell:hover {
                    background-color: rgba(0, 0, 0, 0.1);
                }

                .bell-icon {
                    position: relative;
                    font-size: 1.5rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .notification-badge {
                    position: absolute;
                    top: -8px;
                    right: -8px;
                    background: #ff4757;
                    color: white;
                    border-radius: 50%;
                    min-width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.7rem;
                    font-weight: bold;
                }

                .notification-dropdown {
                    position: absolute;
                    top: 100%;
                    right: 0;
                    width: 350px;
                    max-height: 500px;
                    background: white;
                    border: 1px solid #e1e5e9;
                    border-radius: 8px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                    z-index: 1000;
                    overflow: hidden;
                }

                .notification-header {
                    padding: 15px;
                    border-bottom: 1px solid #e1e5e9;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: #f8f9fa;
                }

                .notification-header h3 {
                    margin: 0;
                    font-size: 1rem;
                    color: #333;
                }

                .mark-all-read-btn {
                    background: #007bff;
                    color: white;
                    border: none;
                    padding: 5px 10px;
                    border-radius: 4px;
                    font-size: 0.8rem;
                    cursor: pointer;
                    transition: background-color 0.2s;
                }

                .mark-all-read-btn:hover:not(:disabled) {
                    background: #0056b3;
                }

                .mark-all-read-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .notifications-list {
                    max-height: 400px;
                    overflow-y: auto;
                }

                .notification-item {
                    display: flex;
                    align-items: flex-start;
                    padding: 12px 15px;
                    border-bottom: 1px solid #f0f0f0;
                    cursor: pointer;
                    transition: background-color 0.2s;
                    border-left: 3px solid transparent;
                }

                .notification-item:hover {
                    background-color: rgba(0, 0, 0, 0.02);
                }

                .notification-item.unread {
                    background-color: rgba(0, 123, 255, 0.05);
                    border-left-color: #007bff;
                }

                .notification-icon {
                    font-size: 1.2rem;
                    margin-left: 10px;
                    flex-shrink: 0;
                }

                .notification-content {
                    flex: 1;
                    min-width: 0;
                }

                .notification-message {
                    margin: 0 0 5px 0;
                    font-size: 0.9rem;
                    color: #333;
                    line-height: 1.4;
                }

                .notification-time {
                    font-size: 0.75rem;
                    color: #666;
                }

                .unread-indicator {
                    width: 8px;
                    height: 8px;
                    background: #007bff;
                    border-radius: 50%;
                    flex-shrink: 0;
                    margin-right: 8px;
                    margin-top: 6px;
                }

                .no-notifications {
                    padding: 40px 20px;
                    text-align: center;
                    color: #666;
                }

                .notification-footer {
                    padding: 10px 15px;
                    border-top: 1px solid #e1e5e9;
                    background: #f8f9fa;
                    text-align: center;
                }

                .view-all-btn {
                    background: none;
                    border: none;
                    color: #007bff;
                    cursor: pointer;
                    font-size: 0.9rem;
                    text-decoration: underline;
                }

                .view-all-btn:hover {
                    color: #0056b3;
                }

                @media (max-width: 768px) {
                    .notification-dropdown {
                        width: 300px;
                        right: -100px;
                    }
                }
            `}</style>
        </div>
    );
};

export default TaskNotificationSystem;