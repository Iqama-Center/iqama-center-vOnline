import pool from '../../lib/db';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    const tests = [];
    
    try {
        // Test 1: Database Connection
        tests.push({ name: 'Database Connection', status: 'testing' });
        try {
            const dbResult = await pool.query('SELECT NOW() as current_time');
            tests[tests.length - 1] = {
                name: 'Database Connection',
                status: 'success',
                result: `Connected at ${dbResult.rows[0].current_time}`
            };
        } catch (error) {
            tests[tests.length - 1] = {
                name: 'Database Connection',
                status: 'error',
                error: error.message
            };
        }

        // Test 2: JWT Secret
        tests.push({ name: 'JWT Secret', status: 'testing' });
        if (process.env.JWT_SECRET) {
            tests[tests.length - 1] = {
                name: 'JWT Secret',
                status: 'success',
                result: 'JWT_SECRET is configured'
            };
        } else {
            tests[tests.length - 1] = {
                name: 'JWT Secret',
                status: 'error',
                error: 'JWT_SECRET is not set in environment variables'
            };
        }

        // Test 3: Users Table
        tests.push({ name: 'Users Table', status: 'testing' });
        try {
            const userCount = await pool.query('SELECT COUNT(*) FROM users');
            tests[tests.length - 1] = {
                name: 'Users Table',
                status: 'success',
                result: `Found ${userCount.rows[0].count} users in database`
            };
        } catch (error) {
            tests[tests.length - 1] = {
                name: 'Users Table',
                status: 'error',
                error: error.message
            };
        }

        // Test 4: Test Users
        tests.push({ name: 'Test Users', status: 'testing' });
        try {
            const testUsers = await pool.query(
                "SELECT full_name, email, role FROM users WHERE email LIKE '%@test.com'"
            );
            tests[tests.length - 1] = {
                name: 'Test Users',
                status: 'success',
                result: `Found ${testUsers.rows.length} test users`,
                users: testUsers.rows
            };
        } catch (error) {
            tests[tests.length - 1] = {
                name: 'Test Users',
                status: 'error',
                error: error.message
            };
        }

        // Test 5: JWT Token Generation
        tests.push({ name: 'JWT Token Generation', status: 'testing' });
        try {
            if (process.env.JWT_SECRET) {
                const testToken = jwt.sign({ id: 1, role: 'student' }, process.env.JWT_SECRET, { expiresIn: '1d' });
                const decoded = jwt.verify(testToken, process.env.JWT_SECRET);
                tests[tests.length - 1] = {
                    name: 'JWT Token Generation',
                    status: 'success',
                    result: 'JWT token generation and verification working'
                };
            } else {
                tests[tests.length - 1] = {
                    name: 'JWT Token Generation',
                    status: 'error',
                    error: 'Cannot test JWT without JWT_SECRET'
                };
            }
        } catch (error) {
            tests[tests.length - 1] = {
                name: 'JWT Token Generation',
                status: 'error',
                error: error.message
            };
        }

        // Summary
        const successCount = tests.filter(t => t.status === 'success').length;
        const errorCount = tests.filter(t => t.status === 'error').length;

        res.status(200).json({
            summary: {
                total: tests.length,
                success: successCount,
                errors: errorCount,
                ready: errorCount === 0
            },
            tests,
            recommendations: getRecommendations(tests)
        });

    } catch (error) {
        res.status(500).json({
            error: 'Test system failed',
            message: error.message
        });
    }
}

function getRecommendations(tests) {
    const recommendations = [];
    
    const dbTest = tests.find(t => t.name === 'Database Connection');
    if (dbTest && dbTest.status === 'error') {
        recommendations.push('🔧 Start your PostgreSQL database or check DATABASE_URL in .env.local');
    }
    
    const jwtTest = tests.find(t => t.name === 'JWT Secret');
    if (jwtTest && jwtTest.status === 'error') {
        recommendations.push('🔑 Add JWT_SECRET to your .env.local file');
    }
    
    const usersTest = tests.find(t => t.name === 'Users Table');
    if (usersTest && usersTest.status === 'error') {
        recommendations.push('📊 Run database migrations to create the users table');
    }
    
    const testUsersTest = tests.find(t => t.name === 'Test Users');
    if (testUsersTest && testUsersTest.status === 'success' && testUsersTest.users && testUsersTest.users.length === 0) {
        recommendations.push('👤 Create test users by calling POST /api/auth/create-test-user');
    }
    
    if (recommendations.length === 0) {
        recommendations.push('✅ All tests passed! Login system should work properly.');
        recommendations.push('🔐 Try logging in with: student@test.com / password123');
    }
    
    return recommendations;
}