// Test script to verify financial configuration is working
// This script simulates the financial logic for different user roles

const testFinancialConfig = {
    level_1: { 
        name: 'مشرف', 
        roles: ['admin', 'head'], 
        financial: { type: 'receive', amount: 500, currency: 'EGP', timing: 'before_start' }
    },
    level_2: { 
        name: 'معلم/مدرب', 
        roles: ['teacher'], 
        financial: { type: 'receive', amount: 300, currency: 'EGP', timing: 'monthly_start' }
    },
    level_3: { 
        name: 'طالب', 
        roles: ['student'], 
        financial: { type: 'pay', amount: 200, currency: 'EGP', timing: 'before_start' }
    }
};

function getFinancialConfigForUser(userRole, participantConfig) {
    for (const [levelKey, config] of Object.entries(participantConfig)) {
        if (config.roles && config.roles.includes(userRole)) {
            return config.financial;
        }
    }
    return null;
}

// Test cases
const testUsers = [
    { role: 'admin', name: 'أحمد المدير' },
    { role: 'teacher', name: 'فاطمة المعلمة' },
    { role: 'student', name: 'محمد الطالب' },
    { role: 'parent', name: 'سارة ولي الأمر' }
];

console.log('🧪 Testing Financial Configuration System\n');

testUsers.forEach(user => {
    const financialConfig = getFinancialConfigForUser(user.role, testFinancialConfig);
    
    console.log(`👤 User: ${user.name} (${user.role})`);
    
    if (financialConfig) {
        if (financialConfig.type === 'pay') {
            console.log(`   💰 يجب دفع: ${financialConfig.amount} ${financialConfig.currency}`);
            console.log(`   📅 التوقيت: ${financialConfig.timing}`);
        } else if (financialConfig.type === 'receive') {
            console.log(`   💵 سيحصل على: ${financialConfig.amount} ${financialConfig.currency}`);
            console.log(`   📅 التوقيت: ${financialConfig.timing}`);
        } else {
            console.log(`   🆓 لا توجد معاملة مالية`);
        }
    } else {
        console.log(`   ❌ لم يتم العثور على تكوين مالي لهذا الدور`);
    }
    console.log('');
});

console.log('✅ Test completed successfully!');