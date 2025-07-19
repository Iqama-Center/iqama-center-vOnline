import pool from '../../../lib/db';
import jwt from 'jsonwebtoken';
import errorHandler from '../../../lib/errorHandler';

export default async function handler(req, res) {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Only admin and head roles can access course templates
        if (!['admin', 'head'].includes(decoded.role)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (req.method === 'GET') {
            // Get all course templates
            const templates = await pool.query(`
                SELECT * FROM course_templates 
                ORDER BY created_at DESC
            `);
            
            res.status(200).json(templates.rows);
            
        } else if (req.method === 'POST') {
            // Create new course template
            const { 
                name, 
                description, 
                duration_days, 
                target_roles, 
                min_capacity, 
                max_capacity, 
                optimal_capacity,
                pricing,
                daily_content_template 
            } = req.body;

            if (!name || !description || !duration_days) {
                return res.status(400).json({ message: 'Missing required fields' });
            }

            const newTemplate = await pool.query(`
                INSERT INTO course_templates (
                    name, description, duration_days, target_roles, 
                    min_capacity, max_capacity, optimal_capacity, 
                    pricing, daily_content_template, created_by
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
                RETURNING *`,
                [
                    name, description, duration_days, 
                    JSON.stringify(target_roles || []), 
                    min_capacity || 7, max_capacity || 15, optimal_capacity || 12,
                    JSON.stringify(pricing || {}), 
                    JSON.stringify(daily_content_template || []),
                    decoded.id
                ]
            );

            res.status(201).json(newTemplate.rows[0]);
        } else {
            res.status(405).json({ message: 'Method Not Allowed' });
        }

    } catch (err) {
        console.error('Course templates error:', err);
        errorHandler(err, res);
    }
}