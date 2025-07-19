// Safe array utilities to prevent Array.every() errors

export function safeEvery(array, callback) {
    if (!Array.isArray(array)) {
        console.warn('safeEvery: Input is not an array:', typeof array);
        return false;
    }
    
    if (array.length === 0) {
        console.warn('safeEvery: Array is empty');
        return true; // every() returns true for empty arrays
    }
    
    try {
        return array.every(callback);
    } catch (error) {
        console.error('safeEvery: Error in callback:', error);
        return false;
    }
}

export function safeMap(array, callback) {
    if (!Array.isArray(array)) {
        console.warn('safeMap: Input is not an array:', typeof array);
        return [];
    }
    
    try {
        return array.map(callback);
    } catch (error) {
        console.error('safeMap: Error in callback:', error);
        return [];
    }
}

export function safeFilter(array, callback) {
    if (!Array.isArray(array)) {
        console.warn('safeFilter: Input is not an array:', typeof array);
        return [];
    }
    
    try {
        return array.filter(callback);
    } catch (error) {
        console.error('safeFilter: Error in callback:', error);
        return [];
    }
}

export function safeForEach(array, callback) {
    if (!Array.isArray(array)) {
        console.warn('safeForEach: Input is not an array:', typeof array);
        return;
    }
    
    try {
        array.forEach(callback);
    } catch (error) {
        console.error('safeForEach: Error in callback:', error);
    }
}

// Safe number parsing
export function safeParseInt(value, defaultValue = 0) {
    const parsed = parseInt(value);
    return isNaN(parsed) ? defaultValue : parsed;
}

// Safe property access
export function safeGet(obj, path, defaultValue = null) {
    if (!obj || typeof obj !== 'object') {
        return defaultValue;
    }
    
    try {
        const keys = path.split('.');
        let current = obj;
        
        for (const key of keys) {
            if (current === null || current === undefined || !(key in current)) {
                return defaultValue;
            }
            current = current[key];
        }
        
        return current;
    } catch (error) {
        console.error('safeGet: Error accessing path:', path, error);
        return defaultValue;
    }
}