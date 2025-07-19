import pool from '../../../lib/db';
import jwt from 'jsonwebtoken';
import { updateUserPerformanceRealTime, updateCoursePerformanceRealTime } from '../../../lib/performanceUpdater.js';
import errorHandler from '../../../lib/errorHandler';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const { userId, courseId, updateType, triggerEvent } = req.body;

        // Authorization check
        const canUpdate = 
            decoded.id === userId || // Users can update their own performance
            ['admin', 'head', 'teacher'].includes(decoded.role); // Or authorized roles

        if (!canUpdate) {
            return res.status(403).json({ message: 'Not authorized to update performance' });
        }

        let result;

        if (updateType === 'single_user' && userId && courseId) {
            // Update single user performance
            result = await updateUserPerformanceRealTime(userId, courseId, triggerEvent || 'manual_update');
            
        } else if (updateType === 'course_wide' && courseId) {
            // Update all users in course (teacher/admin only)
            if (!['admin', 'head', 'teacher'].includes(decoded.role)) {
                return res.status(403).json({ message: 'Not authorized for course-wide updates' });
            }
            
            result = await updateCoursePerformanceRealTime(courseId, triggerEvent || 'manual_bulk_update');
            
        } else {
            return res.status(400).json({ message: 'Invalid update parameters' });
        }

        if (result.success) {
            res.status(200).json({
                success: true,
                message: 'Performance updated successfully',
                data: result,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Performance update failed',
                error: result.error
            });
        }

    } catch (err) {
        console.error('Real-time performance update API error:', err);
        errorHandler(err, res);
    }
}