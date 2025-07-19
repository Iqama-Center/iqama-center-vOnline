// Quick database connection test script
// Run with: node test-db-connection.js

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function testDatabaseConnection() {
    console.log('Testing database connection...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
    
    if (!process.env.DATABASE_URL) {
        console.error('ERROR: DATABASE_URL not found in environment variables');
        return;
    }

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false,
        },
        connectionTimeoutMillis: 10000,
    });

    try {
        console.log('Attempting to connect...');
        const client = await pool.connect();
        console.log('SUCCESS: Database connection established');
        
        // Test a simple query
        const result = await client.query('SELECT NOW() as current_time');
        console.log('Database time:', result.rows[0].current_time);
        
        client.release();
        await pool.end();
        
        console.log('Connection test completed successfully');
        
    } catch (error) {
        console.error('FAILED: Database connection error');
        console.error('Error type:', error.code);
        console.error('Error message:', error.message);
        
        if (error.code === 'ENOTFOUND') {
            console.error('\nTROUBLESHOOTING:');
            console.error('1. Check if your internet connection is working');
            console.error('2. Verify Neon.tech database is active (not suspended)');
            console.error('3. Get a fresh connection string from Neon.tech dashboard');
            console.error('4. Check if your firewall is blocking the connection');
        }
        
        await pool.end();
    }
}

testDatabaseConnection();