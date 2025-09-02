import pool from '../../../lib/db';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash('password123', 10);

        // Create test users
        const testUsers = [
            {
                full_name: 'Test Student',
                email: 'student@test.com',
                password_hash: hashedPassword,
                role: 'student',
                account_status: 'active'
            },
            {
                full_name: 'Test Teacher',
                email: 'teacher@test.com',
                password_hash: hashedPassword,
                role: 'teacher',
                account_status: 'active'
            },
            {
                full_name: 'Test Admin',
                email: 'admin@test.com',
                password_hash: hashedPassword,
                role: 'admin',
                account_status: 'active'
            }
        ];

        const createdUsers = [];

        for (const user of testUsers) {
            try {
                // Check if user already exists
                const existingUser = await pool.query(
                    'SELECT id FROM users WHERE email = $1',
                    [user.email]
                );

                if (existingUser.rows.length === 0) {
                    // Create new user
                    const result = await pool.query(
                        `INSERT INTO users (full_name, email, password_hash, role, account_status, created_at)
                         VALUES ($1, $2, $3, $4, $5, NOW())
                         RETURNING id, full_name, email, role`,
                        [user.full_name, user.email, user.password_hash, user.role, user.account_status]
                    );
                    createdUsers.push(result.rows[0]);
                } else {
                    // Update existing user password
                    await pool.query(
                        'UPDATE users SET password_hash = $1 WHERE email = $2',
                        [user.password_hash, user.email]
                    );
                    createdUsers.push({ email: user.email, status: 'updated' });
                }
            } catch (error) {
                console.error(`Error creating user ${user.email}:`, error);
            }
        }

        res.status(200).json({
            success: true,
            message: 'Test users created/updated successfully',
            users: createdUsers,
            credentials: {
                password: 'password123',
                accounts: [
                    'student@test.com (Student)',
                    'teacher@test.com (Teacher)',
                    'admin@test.com (Admin)'
                ]
            }
        });

    } catch (error) {
        console.error('Error creating test users:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create test users',
            error: error.message
        });
    }
}