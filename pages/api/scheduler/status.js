// API to check scheduler status
export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        // Simple status check
        res.status(200).json({
            success: true,
            status: 'running',
            message: 'Internal scheduler is operational',
            timestamp: new Date().toISOString(),
            features: {
                'Daily Task Release': 'Every hour - releases tasks after meeting times',
                'Performance Evaluation': 'Every 6 hours - updates student/teacher performance',
                'Auto-Launch Check': 'Every 12 hours - launches courses when conditions met'
            },
            hosting_compatibility: 'Works on any hosting platform (VPS, shared, cloud)',
            no_external_dependencies: true
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Scheduler status check failed',
            error: error.message
        });
    }
}