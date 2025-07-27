// Script to fix all dashboard statistics queries across the codebase
const fs = require('fs');
const path = require('path');

// Files that contain dashboard statistics queries
const filesToFix = [
    'pages/dashboard.js',
    'pages/dashboard-isr.js', 
    'pages/index.js',
    'pages/index-optimized.js',
    'pages/courses.js',
    'pages/courses-public.js',
    'pages/courses-isr.js',
    'pages/performance.js'
];

// Function to fix user count queries
function fixUserCountQueries(content) {
    // Fix simple user counts to include account_status filter
    content = content.replace(
        /COUNT\(\*\) FROM users(?!\s+WHERE)/g,
        "COUNT(*) FROM users WHERE account_status = 'active' OR account_status IS NULL"
    );
    
    // Fix role-based user counts
    content = content.replace(
        /COUNT\(\*\) FROM users WHERE role = '([^']+)'/g,
        "COUNT(*) FROM users WHERE role = '$1' AND (account_status = 'active' OR account_status IS NULL)"
    );
    
    return content;
}

// Function to fix course count queries
function fixCourseCountQueries(content) {
    // Fix active courses query
    content = content.replace(
        /COUNT\(\*\) FROM courses WHERE status = 'active'/g,
        "COUNT(*) FROM courses WHERE is_published = true AND is_launched = true"
    );
    
    // Fix published courses query
    content = content.replace(
        /COUNT\(\*\) FROM courses WHERE status = 'published'/g,
        "COUNT(*) FROM courses WHERE is_published = true"
    );
    
    // Fix course status queries to use proper fields
    content = content.replace(
        /courses WHERE status IN \('active', 'published'\)/g,
        "courses WHERE is_published = true"
    );
    
    return content;
}

// Function to fix enrollment queries
function fixEnrollmentQueries(content) {
    // Enrollment queries are mostly correct, but ensure consistency
    content = content.replace(
        /enrollments WHERE status = 'active'/g,
        "enrollments WHERE status = 'active'"
    );
    
    return content;
}

// Process each file
filesToFix.forEach(filePath => {
    if (fs.existsSync(filePath)) {
        console.log(`Processing: ${filePath}`);
        
        let content = fs.readFileSync(filePath, 'utf8');
        const originalContent = content;
        
        // Apply fixes
        content = fixUserCountQueries(content);
        content = fixCourseCountQueries(content);
        content = fixEnrollmentQueries(content);
        
        // Write back if changed
        if (content !== originalContent) {
            fs.writeFileSync(filePath, content);
            console.log(`✅ Fixed: ${filePath}`);
        } else {
            console.log(`⏭️  No changes needed: ${filePath}`);
        }
    } else {
        console.log(`❌ File not found: ${filePath}`);
    }
});

console.log('\n🎯 Dashboard statistics fixes completed!');
console.log('\nNext steps:');
console.log('1. Run the SQL script: fix_dashboard_stats.sql in Neon.tech');
console.log('2. Test the dashboard to verify statistics are now accurate');
console.log('3. Clear any cached data if using ISR or caching');