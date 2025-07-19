import pool from '../../../lib/db';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!['admin', 'head'].includes(decoded.role)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        console.log('=== FIXING PUBLISHING SYSTEM ===');
        
        await pool.query('BEGIN');

        try {
            // 1. Fix courses that are published but is_published is false
            const fixPublished = await pool.query(`
                UPDATE courses 
                SET is_published = true 
                WHERE status = 'published' AND is_published = false
                RETURNING id, name
            `);

            // 2. Fix courses that are is_published = true but status is draft
            const fixDraft = await pool.query(`
                UPDATE courses 
                SET status = 'published' 
                WHERE is_published = true AND status = 'draft'
                RETURNING id, name
            `);

            // 3. Ensure consistency: if status = 'active', set is_published = true
            const fixActive = await pool.query(`
                UPDATE courses 
                SET is_published = true 
                WHERE status = 'active' AND is_published = false
                RETURNING id, name
            `);

            await pool.query('COMMIT');

            res.status(200).json({
                success: true,
                message: 'تم إصلاح نظام النشر بنجاح',
                fixes: {
                    published_courses_fixed: fixPublished.rows,
                    draft_courses_fixed: fixDraft.rows,
                    active_courses_fixed: fixActive.rows
                },
                summary: `تم إصلاح ${fixPublished.rows.length + fixDraft.rows.length + fixActive.rows.length} دورة`
            });

        } catch (error) {
            await pool.query('ROLLBACK');
            throw error;
        }

    } catch (err) {
        console.error('Fix publishing system error:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
}