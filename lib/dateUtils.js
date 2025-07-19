// Utility functions for safe date and JSON serialization

export function serializeCourse(course) {
    if (!course) return null;
    
    // Create a clean object with only serializable properties
    const serialized = {};
    
    // Copy primitive values
    Object.keys(course).forEach(key => {
        const value = course[key];
        
        if (value === null || value === undefined) {
            serialized[key] = null;
        } else if (value instanceof Date) {
            // Handle Date objects
            if (key === 'start_date') {
                serialized[key] = value.toISOString().split('T')[0];
            } else {
                serialized[key] = value.toISOString();
            }
        } else if (typeof value === 'object') {
            // Handle JSON objects
            serialized[key] = parseJsonField(value, {});
        } else {
            // Handle primitives (string, number, boolean)
            serialized[key] = value;
        }
    });
    
    return serialized;
}

export function serializeScheduleItem(item) {
    if (!item) return null;
    
    // Create a clean object with only serializable properties
    const serialized = {};
    
    Object.keys(item).forEach(key => {
        const value = item[key];
        
        if (value === null || value === undefined) {
            serialized[key] = null;
        } else if (value instanceof Date) {
            // Handle Date objects
            if (key === 'scheduled_date') {
                serialized[key] = value.toISOString().split('T')[0];
            } else {
                serialized[key] = value.toISOString();
            }
        } else if (typeof value === 'object') {
            // Handle JSON objects
            serialized[key] = parseJsonField(value, {});
        } else {
            // Handle primitives
            serialized[key] = value;
        }
    });
    
    return serialized;
}

export function parseJsonField(field, defaultValue = {}) {
    if (field === null || field === undefined) {
        return defaultValue;
    }
    
    if (typeof field === 'string') {
        try {
            const parsed = JSON.parse(field);
            return cleanObject(parsed);
        } catch (e) {
            console.warn('Failed to parse JSON field:', e);
            return defaultValue;
        }
    }
    
    if (typeof field === 'object') {
        return cleanObject(field);
    }
    
    return field || defaultValue;
}

// Clean object to ensure it's serializable
function cleanObject(obj) {
    if (obj === null || obj === undefined) {
        return null;
    }
    
    if (Array.isArray(obj)) {
        return obj.map(item => cleanObject(item));
    }
    
    if (typeof obj === 'object') {
        const cleaned = {};
        Object.keys(obj).forEach(key => {
            const value = obj[key];
            if (value instanceof Date) {
                cleaned[key] = value.toISOString();
            } else if (typeof value === 'object') {
                cleaned[key] = cleanObject(value);
            } else {
                cleaned[key] = value;
            }
        });
        return cleaned;
    }
    
    return obj;
}

export function serializeUser(user) {
    if (!user) return null;
    
    return deepSerialize(user);
}

export function serializeEnrollment(enrollment) {
    if (!enrollment) return null;
    
    return deepSerialize(enrollment);
}

// Deep serialization function to handle any object
export function deepSerialize(obj) {
    if (obj === null || obj === undefined) {
        return null;
    }
    
    if (obj instanceof Date) {
        return obj.toISOString();
    }
    
    if (Array.isArray(obj)) {
        return obj.map(item => deepSerialize(item));
    }
    
    if (typeof obj === 'object') {
        const serialized = {};
        Object.keys(obj).forEach(key => {
            serialized[key] = deepSerialize(obj[key]);
        });
        return serialized;
    }
    
    // Primitives (string, number, boolean)
    return obj;
}