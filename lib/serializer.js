// Ultra-safe serialization utility for Next.js getServerSideProps

export function safeSerialize(obj, depth = 0) {
    // Prevent infinite recursion
    if (depth > 10) {
        return '[Max Depth Reached]';
    }

    // Handle null and undefined
    if (obj === null) return null;
    if (obj === undefined) return null;

    // Handle primitives
    if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
        return obj;
    }

    // Handle Date objects
    if (obj instanceof Date) {
        return obj.toISOString();
    }

    // Handle BigInt
    if (typeof obj === 'bigint') {
        return obj.toString();
    }

    // Handle functions (should not be serialized)
    if (typeof obj === 'function') {
        return '[Function]';
    }

    // Handle symbols
    if (typeof obj === 'symbol') {
        return obj.toString();
    }

    // Handle Arrays
    if (Array.isArray(obj)) {
        try {
            return obj.map(item => safeSerialize(item, depth + 1));
        } catch (e) {
            console.warn('Array serialization error:', e);
            return [];
        }
    }

    // Handle Objects
    if (typeof obj === 'object') {
        // Handle special objects that might cause issues
        if (obj.constructor && obj.constructor.name !== 'Object') {
            // For non-plain objects, try to extract safe properties
            const safeObj = {};
            try {
                Object.keys(obj).forEach(key => {
                    if (typeof obj[key] !== 'function') {
                        safeObj[key] = safeSerialize(obj[key], depth + 1);
                    }
                });
                return safeObj;
            } catch (e) {
                return '[Complex Object]';
            }
        }

        // Handle plain objects
        const serialized = {};
        try {
            Object.keys(obj).forEach(key => {
                // Skip functions and symbols
                if (typeof obj[key] === 'function' || typeof obj[key] === 'symbol') {
                    return;
                }
                
                // Skip non-enumerable properties
                if (!obj.propertyIsEnumerable(key)) {
                    return;
                }

                serialized[key] = safeSerialize(obj[key], depth + 1);
            });
            return serialized;
        } catch (e) {
            console.warn('Serialization error for object:', e);
            return '[Serialization Error]';
        }
    }

    // Fallback for unknown types
    return String(obj);
}

// Specific serializers for database objects
export function serializeDbRow(row) {
    if (!row) return null;
    
    const serialized = {};
    
    Object.keys(row).forEach(key => {
        const value = row[key];
        
        if (value === null || value === undefined) {
            serialized[key] = null;
        } else if (value instanceof Date) {
            // Handle different date fields appropriately
            if (key.includes('date') && !key.includes('time')) {
                serialized[key] = value.toISOString().split('T')[0];
            } else {
                serialized[key] = value.toISOString();
            }
        } else if (typeof value === 'bigint') {
            serialized[key] = value.toString();
        } else if (typeof value === 'object') {
            // Handle JSON columns
            try {
                if (typeof value === 'string') {
                    serialized[key] = JSON.parse(value);
                } else {
                    serialized[key] = safeSerialize(value);
                }
            } catch (e) {
                serialized[key] = value;
            }
        } else {
            serialized[key] = value;
        }
    });
    
    return serialized;
}

// Serialize array of database rows
export function serializeDbRows(rows) {
    if (!Array.isArray(rows)) return [];
    return rows.map(row => serializeDbRow(row));
}

// Test if an object is serializable
export function testSerialization(obj) {
    try {
        JSON.stringify(obj);
        return true;
    } catch (e) {
        console.error('Serialization test failed:', e);
        return false;
    }
}

// Safe props wrapper for getServerSideProps
export function safeProps(props) {
    const serialized = safeSerialize(props);
    
    // Test serialization
    if (!testSerialization(serialized)) {
        console.error('Props still not serializable after processing');
        return {
            error: 'Serialization failed',
            timestamp: new Date().toISOString()
        };
    }
    
    return serialized;
}