import pool from '../../lib/db';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  try {
    // Test database connection
    const timeResult = await pool.query('SELECT NOW() as current_time');
    
    // Check users table
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    let userCount = 0;
    let users = [];
    let sqlCommands = [];
    
    if (tableCheck.rows[0].exists) {
      const countResult = await pool.query('SELECT COUNT(*) as count FROM users');
      userCount = parseInt(countResult.rows[0].count);
      
      if (userCount > 0) {
        const usersResult = await pool.query('SELECT id, full_name, email, role FROM users LIMIT 5');
        users = usersResult.rows;
      } else {
        // Generate SQL commands to create test users
        const adminHash = await bcrypt.hash('admin123', 10);
        const testHash = await bcrypt.hash('test123', 10);
        
        sqlCommands = [
          `INSERT INTO users (full_name, email, phone, password_hash, role, details) VALUES ('Admin User', 'admin@iqama-center.com', '+966123456789', '${adminHash}', 'admin', '{}');`,
          `INSERT INTO users (full_name, email, phone, password_hash, role, details) VALUES ('Test Student', 'test@example.com', '+966987654321', '${testHash}', 'student', '{}');`
        ];
      }
    }
    
    res.status(200).json({
      success: true,
      database_connected: true,
      current_time: timeResult.rows[0].current_time,
      users_table_exists: tableCheck.rows[0].exists,
      user_count: userCount,
      sample_users: users,
      sql_commands: sqlCommands,
      login_credentials: userCount === 0 ? [
        { email: 'admin@iqama-center.com', password: 'admin123', role: 'admin' },
        { email: 'test@example.com', password: 'test123', role: 'student' }
      ] : [],
      message: userCount === 0 ? 'Database is empty - no users found. This explains the login issue.' : `Database has ${userCount} users`
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      database_connected: false,
      message: 'Failed to connect to database'
    });
  }
}