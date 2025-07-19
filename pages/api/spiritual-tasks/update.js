import pool from '../../../lib/db';
import jwt from 'jsonwebtoken';
import errorHandler from '../../../lib/errorHandler';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { taskType, completed, notes } = req.body;

        if (!taskType || typeof completed !== 'boolean') {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const validTasks = [
            'fajr_prayer', 'dhuhr_prayer', 'asr_prayer', 'maghrib_prayer', 'isha_prayer',
            'athkar_morning', 'athkar_evening', 'quran_wird', 'quran_recitation',
            'islamic_lesson', 'dhikr_session', 'dua_memorization'
        ];

        if (!validTasks.includes(taskType)) {
            return res.status(400).json({ message: 'Invalid task type' });
        }

        // Get or create today's spiritual tasks record
        const today = new Date().toISOString().split('T')[0];
        
        const existingRecord = await pool.query(
            `SELECT * FROM daily_spiritual_tasks 
             WHERE user_id = $1 AND task_date = $2`,
            [decoded.id, today]
        );

        let currentTasks = {};
        if (existingRecord.rows.length > 0) {
            currentTasks = existingRecord.rows[0].tasks || {};
        }

        // Update the specific task
        currentTasks[taskType] = {
            completed,
            completed_at: completed ? new Date().toISOString() : null,
            notes: notes || ''
        };

        if (existingRecord.rows.length > 0) {
            // Update existing record
            await pool.query(
                `UPDATE daily_spiritual_tasks 
                 SET tasks = $1
                 WHERE user_id = $2 AND task_date = $3`,
                [JSON.stringify(currentTasks), decoded.id, today]
            );
        } else {
            // Create new record
            await pool.query(
                `INSERT INTO daily_spiritual_tasks (user_id, task_date, tasks)
                 VALUES ($1, $2, $3)`,
                [decoded.id, today, JSON.stringify(currentTasks)]
            );
        }

        // Calculate completion percentage for today
        const completedCount = Object.values(currentTasks).filter(task => task.completed).length;
        const totalTasks = Object.keys(currentTasks).length;
        const completionPercentage = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

        // Check if user completed all daily tasks
        if (completionPercentage === 100 && totalTasks >= 5) {
            // Award points or create achievement notification
            await pool.query(
                `INSERT INTO user_achievements (user_id, achievement_type, achievement_date, points)
                 VALUES ($1, 'daily_tasks_complete', CURRENT_DATE, 10)
                 ON CONFLICT (user_id, achievement_type, achievement_date) DO NOTHING`,
                [decoded.id]
            );
        }

        res.status(200).json({
            message: 'تم تحديث المهمة الروحية بنجاح',
            completionPercentage,
            currentTasks
        });

    } catch (err) {
        console.error('Spiritual task update error:', err);
        errorHandler(err, res);
    }
}