import pool from '../../../lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { email = 'i1@yahoo.com', password = '123' } = req.body;

    try {
        console.log('Testing login with:', { email, password });

        // Check if user exists
        const userResult = await pool.query(
            'SELECT id, full_name, email, password_hash, role FROM users WHERE email = $1',
            [email]
        );

        if (userResult.rows.length === 0) {
            // Create test user if doesn't exist
            console.log('User not found, creating test user...');
            const hashedPassword = await bcrypt.hash(password, 10);
            
            const createResult = await pool.query(
                `INSERT INTO users (full_name, email, password_hash, role, account_status, created_at)
                 VALUES ($1, $2, $3, $4, $5, NOW())
                 RETURNING id, full_name, email, role`,
                ['Test User', email, hashedPassword, 'student', 'active']
            );

            const newUser = createResult.rows[0];
            
            // Generate token for new user
            const token = jwt.sign(
                { id: newUser.id, role: newUser.role }, 
                process.env.JWT_SECRET || 'fallback-secret', 
                { expiresIn: '1d' }
            );

            const cookie = serialize('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24,
                path: '/',
            });

            res.setHeader('Set-Cookie', cookie);
            return res.status(200).json({ 
                success: true,
                message: 'Test user created and logged in',
                user: newUser,
                redirectTo: '/dashboard' 
            });
        }

        // User exists, verify password
        const user = userResult.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            // Update password to match the test password
            console.log('Password mismatch, updating password...');
            const hashedPassword = await bcrypt.hash(password, 10);
            await pool.query(
                'UPDATE users SET password_hash = $1 WHERE id = $2',
                [hashedPassword, user.id]
            );
        }

        // Generate token
        const token = jwt.sign(
            { id: user.id, role: user.role }, 
            process.env.JWT_SECRET || 'fallback-secret', 
            { expiresIn: '1d' }
        );

        const cookie = serialize('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24,
            path: '/',
        });

        res.setHeader('Set-Cookie', cookie);
        res.status(200).json({ 
            success: true,
            message: 'Login successful',
            user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role },
            redirectTo: '/dashboard' 
        });

    } catch (error) {
        console.error('Test login error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Test login failed',
            error: error.message 
        });
    }
}