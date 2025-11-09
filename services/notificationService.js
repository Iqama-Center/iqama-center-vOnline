import pool from '../lib/db';

class NotificationService {

    /**
     * Creates one or more notifications in a single, efficient query.
     * Can be used as part of a larger database transaction if a client is provided.
     * @param {object} options - The notification options.
     * @param {number[]} options.userIds - An array of user IDs to notify.
     * @param {string} options.type - The notification type.
     * @param {string} options.message - The main notification message.
     * @param {string} [options.title] - The notification title.
     * @param {string} [options.link] - A URL link for the notification.
     * @param {number} [options.relatedId] - The ID of a related entity (e.g., course_id).
     * @param {pg.PoolClient} [options.client] - An optional database client for transactions.
     */
    static async createNotification({ userIds, type, title, message, link = null, relatedId = null, client = null }) {
        if (!userIds || userIds.length === 0) {
            return [];
        }

        const db = client || pool;

        try {
            // Use PostgreSQL's unnest to insert multiple notifications in one query
            const result = await db.query(`
                INSERT INTO notifications (user_id, type, title, message, link, related_id, created_at)
                SELECT user_id, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP
                FROM unnest($1::int[]) AS user_id
                RETURNING *`,
                [userIds, type, title, message, link, relatedId]
            );
            return result.rows;
        } catch (err) {
            console.error('Error creating bulk notifications:', err);
            throw err;
        }
    }

    static async createTaskNotification({ userIds, taskTitle, dueDate, taskId, client = null }) {
        const message = `مهمة جديدة: ${taskTitle} - المطلوب تسليمها في ${new Date(dueDate).toLocaleDateString('ar-EG')}`;
        const link = `/dashboard/tasks/${taskId}`;
        return this.createNotification({ userIds, type: 'new_task', title: 'مهمة جديدة', message, link, relatedId: taskId, client });
    }

    static async createPaymentReminder({ userIds, amount, currency, dueDate, client = null }) {
        const message = `تذكير دفع: مطلوب دفع ${amount} ${currency} قبل ${new Date(dueDate).toLocaleDateString('ar-EG')}`;
        const link = '/finance';
        return this.createNotification({ userIds, type: 'payment_reminder', title: 'تذكير بالدفع', message, link, client });
    }

    static async createMeetingReminder({ userIds, courseName, meetingTime, reminderType = '2hours', client = null }) {
        const timeText = reminderType === '2hours' ? 'خلال ساعتين' : 'خلال 10 دقائق';
        const message = `تذكير لقاء: لقاء ${courseName} سيبدأ ${timeText}`;
        const link = '/dashboard/current-courses';
        return this.createNotification({ userIds, type: 'meeting_reminder', title: 'تذكير بلقاء', message, link, client });
    }

    static async createCourseAnnouncement({ userIds, courseName, courseId, client = null }) {
        const message = `دورة جديدة متاحة: ${courseName}`;
        const link = `/courses/${courseId}`;
        return this.createNotification({ userIds, type: 'announcement', title: 'إعلان دورة جديدة', message, link, relatedId: courseId, client });
    }

    static async getUnreadCount(userId) {
        try {
            const result = await pool.query(
                `SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false`,
                [userId]
            );
            return parseInt(result.rows[0].count);
        } catch (err) {
            console.error('Error getting unread count:', err);
            throw err;
        }
    }

    static async markAsRead(notificationId, userId) {
        try {
            const result = await pool.query(
                `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *`,
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