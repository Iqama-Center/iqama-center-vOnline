import scheduler from '../../../lib/internalScheduler';

let isSchedulerStarted = false;

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        if (!isSchedulerStarted) {
            // Start the scheduler
            scheduler.start();
            isSchedulerStarted = true;
            
            // console.log('🚀 Internal scheduler started via API');
            
            res.status(200).json({
                success: true,
                message: 'Internal scheduler started successfully',
                features: [
                    'Daily task release (every hour)',
                    'Performance evaluation (every 6 hours)', 
                    'Auto-launch checking (every 12 hours)'
                ]
            });
        } else {
            res.status(200).json({
                success: true,
                message: 'Scheduler is already running',
                status: 'running'
            });
        }
    } catch (error) {
        console.error('❌ Error starting scheduler:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to start scheduler',
            error: error.message
        });
    }
}

// Start scheduler immediately when this module loads (server-side)
if (typeof window === 'undefined' && !isSchedulerStarted) {
    try {
        scheduler.start();
        isSchedulerStarted = true;
        // console.log('🚀 Internal scheduler auto-started on server startup');
    } catch (error) {
        console.error('❌ Error auto-starting scheduler:', error);
    }
}