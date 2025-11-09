#!/usr/bin/env node

/**
 * Daily Task Scheduler - Automated system for releasing course tasks
 * This script should be run as a cron job every hour to check and release tasks
 * 
 * Cron setup: 0 * * * * /usr/bin/node /path/to/daily-task-scheduler.js
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

// Configuration
const CONFIG = {
    API_BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    CRON_SECRET: process.env.CRON_SECRET || 'your-secure-cron-secret',
    LOG_FILE: path.join(__dirname, '../logs/task-scheduler.log'),
    MAX_RETRIES: 3,
    RETRY_DELAY: 5000 // 5 seconds
};

// Ensure logs directory exists
const logsDir = path.dirname(CONFIG.LOG_FILE);
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Logging function
function log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}\n`;
    
    console.log(logMessage.trim());
    
    try {
        fs.appendFileSync(CONFIG.LOG_FILE, logMessage);
    } catch (error) {
        console.error('Failed to write to log file:', error);
    }
}

// HTTP request function using native http/https module
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObject = new URL(url);
        const client = urlObject.protocol === 'https:' ? https : http;
        const body = JSON.stringify(options.body || {});

        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body),
                ...options.headers
            },
            timeout: 30000 // 30 seconds
        };

        const req = client.request(urlObject, requestOptions, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(new Error('Failed to parse JSON response.'));
                    }
                } else {
                    reject(new Error(`Request failed with status code ${res.statusCode}: ${data}`));
                }
            });
        });

        req.on('error', (e) => {
            reject(new Error(`Request error: ${e.message}`));
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timed out'));
        });

        req.write(body);
        req.end();
    });
}

// Retry mechanism
async function withRetry(operation, maxRetries = CONFIG.MAX_RETRIES) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            log(`Attempt ${attempt} failed: ${error.message}`, 'WARN');
            
            if (attempt === maxRetries) {
                throw error;
            }
            
            await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
        }
    }
}

// Main task release function
async function releaseDailyTasks() {
    log('Starting daily task release process...');
    
    try {
        const response = await withRetry(() => 
            makeRequest(`${CONFIG.API_BASE_URL}/api/courses/release-daily-tasks`, {
                body: {
                    cron_secret: CONFIG.CRON_SECRET
                }
            })
        );

        if (response.success) {
            log(`Task release completed successfully: ${response.coursesProcessed} courses processed, ${response.totalTasksReleased} tasks released`);
            return true;
        } else {
            log(`Task release failed: ${response.message || 'Unknown error'}`, 'ERROR');
            return false;
        }
    } catch (error) {
        log(`Task release error: ${error.message}`, 'ERROR');
        return false;
    }
}

// Performance evaluation function
async function runPerformanceEvaluation() {
    log('Starting performance evaluation process...');
    
    try {
        const response = await withRetry(() => 
            makeRequest(`${CONFIG.API_BASE_URL}/api/courses/evaluate-performance`, {
                body: {
                    cron_secret: CONFIG.CRON_SECRET,
                    evaluateAll: true
                }
            })
        );

        if (response.success) {
            log(`Performance evaluation completed: ${response.evaluatedCount} users evaluated`);
            return true;
        } else {
            log(`Performance evaluation failed: ${response.message || 'Unknown error'}`, 'ERROR');
            return false;
        }
    } catch (error) {
        log(`Performance evaluation error: ${error.message}`, 'ERROR');
        return false;
    }
}

// Auto-launch check function
async function checkAutoLaunch() {
    log('Checking auto-launch conditions...');
    
    try {
        const response = await withRetry(() => 
            makeRequest(`${CONFIG.API_BASE_URL}/api/courses/auto-launch-check`, {
                body: {
                    cron_secret: CONFIG.CRON_SECRET
                }
            })
        );

        if (response.success) {
            log(`Auto-launch check completed: ${response.message}`);
            return true;
        } else {
            log(`Auto-launch check failed: ${response.message || 'Unknown error'}`, 'ERROR');
            return false;
        }
    } catch (error) {
        log(`Auto-launch check error: ${error.message}`, 'ERROR');
        return false;
    }
}

// Main execution function
async function main() {
    const startTime = Date.now();
    log('=== Daily Task Scheduler Started ===');
    
    let successCount = 0;
    const tasksToRun = [];

    // Task 1: Release daily tasks
    tasksToRun.push(releaseDailyTasks());

    // Task 2: Run performance evaluation (every 4 hours)
    const currentHour = new Date().getHours();
    if (currentHour % 4 === 0) {
        tasksToRun.push(runPerformanceEvaluation());
    } else {
        log('Skipping performance evaluation (not scheduled for this hour)');
    }

    // Task 3: Check auto-launch conditions
    tasksToRun.push(checkAutoLaunch());

    const results = await Promise.allSettled(tasksToRun);
    results.forEach(result => {
        if (result.status === 'fulfilled' && result.value === true) {
            successCount++;
        }
    });

    const duration = Date.now() - startTime;
    log('=== Daily Task Scheduler Completed ===');
    log(`Success rate: ${successCount}/${tasksToRun.length} tasks completed successfully`);
    log(`Total execution time: ${duration}ms`);

    // Exit with appropriate code
    process.exit(successCount === tasksToRun.length ? 0 : 1);
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    log(`Uncaught exception: ${error.message}`, 'ERROR');
    log(error.stack, 'ERROR');
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    log(`Unhandled rejection at: ${promise}, reason: ${reason}`, 'ERROR');
    process.exit(1);
});

// Run the scheduler
if (require.main === module) {
    main().catch((error) => {
        log(`Fatal error: ${error.message}`, 'ERROR');
        process.exit(1);
    });
}

module.exports = {
    releaseDailyTasks,
    runPerformanceEvaluation,
    checkAutoLaunch,
    main
};
