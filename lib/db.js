import { Pool } from 'pg';

// Enhanced database configuration with better timeout and retry settings
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false,
  } : false,
  // Enhanced connection pool settings for Neon.tech auto-activation
  max: 20,                    // Maximum number of clients in the pool
  min: 2,                     // Minimum number of clients in the pool
  idleTimeoutMillis: 30000,   // Close idle clients after 30 seconds
  connectionTimeoutMillis: 60000, // Increased to 60s for Neon.tech auto-activation
  acquireTimeoutMillis: 90000,    // Wait up to 90 seconds for a connection
  createTimeoutMillis: 60000,     // Wait up to 60 seconds when creating a connection
  destroyTimeoutMillis: 5000,     // Wait up to 5 seconds when destroying a connection
  reapIntervalMillis: 1000,       // Check for idle clients every second
  createRetryIntervalMillis: 200, // Retry creating connection every 200ms
  // Query timeout
  query_timeout: 30000,           // 30 second query timeout
  // Keep alive settings
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
};

// Create pool instance
let pool;

if (typeof window === 'undefined') {
  // Server-side only
  const globalForDb = globalThis;
  
  if (!globalForDb.pool) {
    globalForDb.pool = new Pool(dbConfig);
    
    // Enhanced error handling
    globalForDb.pool.on('error', (err, client) => {
      console.error('Database pool error:', err);
      console.error('Client info:', client ? 'Client exists' : 'No client');
      
      // Log specific error types
      if (err.code === 'ECONNRESET') {
        console.error('Connection reset - will retry automatically');
      } else if (err.code === 'ENOTFOUND') {
        console.error('DNS resolution failed - check database URL');
      } else if (err.code === 'ETIMEDOUT') {
        console.error('Connection timeout - database may be slow or unreachable');
      }
    });
    
    globalForDb.pool.on('connect', (client) => {
      console.log('Database connected successfully');
      
      // Set query timeout on new connections
      client.query('SET statement_timeout = 30000'); // 30 second timeout
    });
    
    globalForDb.pool.on('acquire', (client) => {
      console.log('Database client acquired from pool');
    });
    
    globalForDb.pool.on('release', (err, client) => {
      if (err) {
        console.error('Error releasing client:', err);
      } else {
        console.log('Database client released back to pool');
      }
    });
    
    globalForDb.pool.on('remove', (client) => {
      console.log('Database client removed from pool');
    });
  }
  
  pool = globalForDb.pool;
} else {
  // Client-side fallback (should not be used)
  pool = null;
}

// Enhanced query function with retry logic
async function queryWithRetry(text, params, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Database query attempt ${attempt}/${maxRetries}`);
      
      const client = await pool.connect();
      try {
        const result = await client.query(text, params);
        console.log(`Query successful on attempt ${attempt}`);
        return result;
      } finally {
        client.release();
      }
    } catch (error) {
      lastError = error;
      console.error(`Query attempt ${attempt} failed:`, error.message);
      
      // Handle Neon.tech specific errors
      if (error.code === 'ENOTFOUND' && attempt < maxRetries) {
        // For Neon.tech auto-activation, ENOTFOUND might be temporary
        console.log('Database may be auto-activating, will retry...');
      } else if (error.code === '42P01') {
        // Table doesn't exist - don't retry
        console.error('Non-retryable error (table not found), stopping attempts');
        break;
      }
      
      // Wait before retrying (longer delays for Neon.tech auto-activation)
      if (attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 5000; // 10s, 20s, 40s for auto-activation
        console.log(`Waiting ${waitTime}ms for database auto-activation before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw lastError;
}

// Enhanced pool with retry functionality
const enhancedPool = {
  query: queryWithRetry,
  connect: () => pool.connect(),
  end: () => pool.end(),
  
  // Health check function
  async healthCheck() {
    try {
      const result = await this.query('SELECT NOW() as current_time, version() as db_version');
      return {
        healthy: true,
        timestamp: result.rows[0].current_time,
        version: result.rows[0].db_version
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }
};

export default enhancedPool;