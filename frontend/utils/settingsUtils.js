/**
 * Shared utility functions for Settings modules to ensure consistency and DRY code.
 */

/**
 * Ensures a value is returned as a string. Handles null, undefined, and objects gracefully.
 */
export function asString(value) {
    if (value === null || value === undefined) return '';
    return String(value);
}

/**
 * Normalizes boolean values from various formats (boolean, string 'true'/'false').
 */
export function normalizeBoolean(value, fallback = false) {
    if (value === true || value === false) return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    return fallback;
}

/**
 * Extracts a user-friendly error message from a standard Axios interface error object.
 */
export function getApiErrorMessage(error) {
    const detail = error?.response?.data?.detail;
    if (detail) return String(detail);
    
    const data = error?.response?.data;
    if (data && typeof data === 'object') {
        const firstKey = Object.keys(data)[0];
        const firstVal = data?.[firstKey];
        if (firstVal) return Array.isArray(firstVal) ? String(firstVal?.[0]) : String(firstVal);
    }
    
    return String(error?.message || 'Something went wrong');
}

/**
 * Generates a URL-safe slug for keys/IDs based on a human-readable name.
 */
export function slugifyKey(name) {
    const base = asString(name)
        .trim()
        .toLowerCase()
        .replace(/['"]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .replace(/_+/g, '_');

    if (!base) return '';
    if (/^\d/.test(base)) return `field_${base}`;
    return base;
}
