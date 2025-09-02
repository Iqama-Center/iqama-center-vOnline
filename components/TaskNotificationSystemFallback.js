import React from 'react';

// Simple fallback component that won't break if APIs are not available
const TaskNotificationSystemFallback = ({ userId, userRole }) => {
    if (!userId) return null;

    return (
        <div className="notification-system-fallback">
            {/* Simple task notification bell */}
            <div className="task-bell" title="إشعارات المهام">
                <div className="bell-icon">
                    📋
                </div>
            </div>

            <style jsx>{`
                .notification-system-fallback {
                    position: relative;
                    display: inline-block;
                }

                .task-bell {
                    cursor: pointer;
                    padding: 8px;
                    border-radius: 50%;
                    transition: background-color 0.2s;
                }

                .task-bell:hover {
                    background-color: rgba(0, 0, 0, 0.1);
                }

                .bell-icon {
                    font-size: 1.5rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
            `}</style>
        </div>
    );
};

export default TaskNotificationSystemFallback;