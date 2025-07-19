#!/usr/bin/env node

/**
 * Daily Task Scheduler - Automated system for releasing course tasks
 * This script should be run as a cron job every hour to check and release tasks
 * 
 * Cron setup: 0 * * * * /usr/bin/node /path/to/daily-task-scheduler.js
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

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

// HTTP request function
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        const curlCommand = `curl -X ${requestOptions.method} \
            -H "Content-Type: application/json" \
            -d '${JSON.stringify(options.body || {})}' \
            "${url}"`;

        exec(curlCommand, { timeout: 30000 }, (error, stdout, stderr) => {
            if (error) {
                reject(new Error(`Request failed: ${error.message}`));
                return;
            }

            try {
                const response = JSON.parse(stdout);
                resolve(response);
            } catch (parseError) {
                reject(new Error(`Failed to parse response: ${parseError.message}`));
            }
        });
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
        // Get all published but not launched courses
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
    let totalTasks = 3;

    // Task 1: Release daily tasks
    if (await releaseDailyTasks()) {
        successCount++;
    }

    // Task 2: Run performance evaluation (every 4 hours)
    const currentHour = new Date().getHours();
    if (currentHour % 4 === 0) {
        if (await runPerformanceEvaluation()) {
            successCount++;
        }
    } else {
        totalTasks--;
        log('Skipping performance evaluation (not scheduled for this hour)');
    }

    // Task 3: Check auto-launch conditions
    if (await checkAutoLaunch()) {
        successCount++;
    }

    const duration = Date.now() - startTime;
    log(`=== Daily Task Scheduler Completed ===`);
    log(`Success rate: ${successCount}/${totalTasks} tasks completed successfully`);
    log(`Total execution time: ${duration}ms`);

    // Exit with appropriate code
    process.exit(successCount === totalTasks ? 0 : 1);
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