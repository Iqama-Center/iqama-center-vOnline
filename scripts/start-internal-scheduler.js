// Start internal scheduler (works on any hosting)
import scheduler from '../lib/internalScheduler';

console.log('🚀 Starting Course Management Internal Scheduler...');
console.log('📅 This will handle:');
console.log('   - Daily task release (every hour)');
console.log('   - Performance evaluation (every 6 hours)');
console.log('   - Auto-launch checking (every 12 hours)');
console.log('');

// Start the scheduler
scheduler.start();

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    scheduler.stop();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    scheduler.stop();
    process.exit(0);
});

// Keep the process running
console.log('✅ Internal scheduler is now running...');
console.log('💡 This works on ANY hosting platform (VPS, shared, cloud)');
console.log('🔄 Press Ctrl+C to stop');

// Optional: Add health check endpoint if running as part of web server
if (process.env.NODE_ENV === 'production') {
    console.log('🏥 Health check: Scheduler will restart automatically if main app restarts');
}