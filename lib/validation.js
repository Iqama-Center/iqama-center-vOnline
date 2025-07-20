// Shared validation utilities
export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'live.com'];
    
    if (!emailRegex.test(email)) {
        return 'صيغة البريد الإلكتروني غير صحيحة';
    }
    
    const domain = email.split('@')[1];
    if (!commonDomains.includes(domain) && !domain.includes('.')) {
        return 'يرجى استخدام بريد إلكتروني من مزود خدمة معروف';
    }
    
    return null;
};

export const validatePhone = (phone) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const phoneRegex = /^(\+?966|0)?[5-9]\d{8}$/; // Saudi format
    const intlRegex = /^\+?[1-9]\d{7,14}$/; // International format
    
    if (!phoneRegex.test(cleanPhone) && !intlRegex.test(phone)) {
        return 'رقم الهاتف غير صحيح. يرجى استخدام صيغة صحيحة';
    }
    
    if (cleanPhone.length < 8 || cleanPhone.length > 15) {
        return 'رقم الهاتف يجب أن يكون بين 8 و 15 رقم';
    }
    
    return null;
};