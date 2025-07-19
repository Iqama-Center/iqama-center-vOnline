import pool from '../lib/db';

class NotificationService {
    // Create notification for specific users
    static async createNotification(userIds, type, message, link = null) {
        try {
            const notifications = [];
            for (const userId of userIds) {
                const result = await pool.query(
                    `INSERT INTO notifications (user_id, type, message, link, created_at) 
                     VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP) RETURNING *`,
                    [userId, type, message, link]
                );
                notifications.push(result.rows[0]);
            }
            return notifications;
        } catch (err) {
            console.error('Error creating notification:', err);
            throw err;
        }
    }

    // Create task notifications
    static async createTaskNotification(userIds, taskTitle, dueDate, taskId) {
        const message = `مهمة جديدة: ${taskTitle} - المطلوب تسليمها في ${new Date(dueDate).toLocaleDateString('ar-EG')}`;
        const link = `/dashboard/tasks/${taskId}`;
        return this.createNotification(userIds, 'new_task', message, link);
    }

    // Create payment reminder notifications
    static async createPaymentReminder(userIds, amount, currency, dueDate) {
        const message = `تذكير دفع: مطلوب دفع ${amount} ${currency} قبل ${new Date(dueDate).toLocaleDateString('ar-EG')}`;
        const link = '/finance';
        return this.createNotification(userIds, 'payment_reminder', message, link);
    }

    // Create meeting reminder notifications
    static async createMeetingReminder(userIds, courseName, meetingTime, reminderType = '2hours') {
        const timeText = reminderType === '2hours' ? 'خلال ساعتين' : 'خلال 10 دقائق';
        const message = `تذكير لقاء: لقاء ${courseName} سيبدأ ${timeText}`;
        const link = '/dashboard/current-courses';
        return this.createNotification(userIds, 'meeting_reminder', message, link);
    }

    // Create course announcement notifications
    static async createCourseAnnouncement(userIds, courseName, courseId) {
        const message = `دورة جديدة متاحة: ${courseName}`;
        const link = `/courses/${courseId}`;
        return this.createNotification(userIds, 'announcement', message, link);
    }

    // Get unread count for a user
    static async getUnreadCount(userId) {
        try {
            const result = await pool.query(
                `SELECT COUNT(*) as count 
                 FROM notifications 
                 WHERE user_id = $1 AND is_read = false`,
                [userId]
            );
            return parseInt(result.rows[0].count);
        } catch (err) {
            console.error('Error getting unread count:', err);
            throw err;
        }
    }

    // Mark notification as read
    static async markAsRead(notificationId, userId) {
        try {
            const result = await pool.query(
                `UPDATE notifications 
                 SET is_read = true 
                 WHERE id = $1 AND user_id = $2 
                 RETURNING *`,
                [notificationId, userId]
            );
            return result.rows[0];
        } catch (err) {
            console.error('Error marking notification as read:', err);
            throw err;
        }
    }
}

export default NotificationService;

// Legacy function for backward compatibility
export async function createNotification(db, userId, type, message, link = null) {
    return NotificationService.createNotification([userId], type, message, link);
}