const cron = require('node-cron');
const fetch = require('node-fetch');

// Run every hour to check for task releases
cron.schedule('0 * * * *', async () => {
    console.log('Running daily task release check...');
    
    try {
        const response = await fetch('http://localhost:3000/api/courses/release-daily-tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                cron_secret: process.env.CRON_SECRET || 'default_secret_change_in_production'
            })
        });

        const result = await response.json();
        
        if (result.success) {
            console.log(`✅ Task release completed: ${result.coursesProcessed} courses processed, ${result.totalTasksReleased} tasks released`);
        } else {
            console.log('❌ Task release failed:', result.message);
        }
    } catch (error) {
        console.error('❌ Error in daily task release cron:', error);
    }
});

// Run performance evaluation every 6 hours
cron.schedule('0 */6 * * *', async () => {
    console.log('Running performance evaluation...');
    
    try {
        // Get all active courses
        const coursesResponse = await fetch('http://localhost:3000/api/courses?status=active');
        const coursesData = await coursesResponse.json();
        
        if (coursesData.success && coursesData.courses) {
            for (const course of coursesData.courses) {
                try {
                    const evalResponse = await fetch('http://localhost:3000/api/courses/evaluate-performance', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            courseId: course.id,
                            evaluateAll: true,
                            cron_secret: process.env.CRON_SECRET || 'default_secret_change_in_production'
                        })
                    });

                    const evalResult = await evalResponse.json();
                    if (evalResult.success) {
                        console.log(`✅ Performance evaluated for course ${course.name}: ${evalResult.evaluatedCount} users`);
                    }
                } catch (error) {
                    console.error(`❌ Error evaluating course ${course.name}:`, error);
                }
            }
        }
    } catch (error) {
        console.error('❌ Error in performance evaluation cron:', error);
    }
});

// Auto-launch check - runs every day at 8 AM
cron.schedule('0 8 * * *', async () => {
    console.log('Running auto-launch check...');
    
    try {
        const response = await fetch('http://localhost:3000/api/courses/check-auto-launch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                cron_secret: process.env.CRON_SECRET || 'default_secret_change_in_production'
            })
        });

        const result = await response.json();
        console.log('Auto-launch check result:', result);
    } catch (error) {
        console.error('❌ Error in auto-launch check cron:', error);
    }
});

console.log('🚀 Course management cron jobs started');
console.log('📅 Daily task release: Every hour');
console.log('📊 Performance evaluation: Every 6 hours');
console.log('🚀 Auto-launch check: Daily at 8 AM');