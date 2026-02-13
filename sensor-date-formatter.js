// sensor-date-formatter.js - World-Class Date Formatting for Sensor Data
// Handles various date formats from Findy IoT platform

/**
 * Format sensor timestamp to human-readable format
 * @param {string|number|Date} dateInput - Date in any format
 * @returns {string} Formatted date string with HTML styling
 */
function formatSensorDate(dateInput) {
    if (!dateInput || dateInput === 'null' || dateInput === 'undefined' || dateInput === '') {
        return '<span style="color: #94a3b8; font-style: italic;">Never</span>';
    }
    
    try {
        let date;
        
        // Handle Date object
        if (dateInput instanceof Date) {
            date = dateInput;
        }
        // Handle number (Unix timestamp)
        else if (typeof dateInput === 'number') {
            // If timestamp is in seconds (10 digits), convert to milliseconds
            date = new Date(dateInput > 9999999999 ? dateInput : dateInput * 1000);
        }
        // Handle string
        else if (typeof dateInput === 'string') {
            // Try direct parsing first (works for ISO strings)
            date = new Date(dateInput);
            
            // If invalid, try parsing Unix timestamp
            if (isNaN(date.getTime())) {
                const timestamp = parseInt(dateInput);
                if (!isNaN(timestamp)) {
                    date = new Date(timestamp > 9999999999 ? timestamp : timestamp * 1000);
                }
            }
            
            // If still invalid, try removing extra characters
            if (isNaN(date.getTime())) {
                // Remove quotes, spaces, and try again
                const cleaned = dateInput.trim().replace(/['"]/g, '');
                date = new Date(cleaned);
            }
        }
        
        // Final validation
        if (!date || isNaN(date.getTime())) {
            console.warn('⚠️ Could not parse date:', dateInput);
            return '<span style="color: #f59e0b; font-style: italic;">Unknown</span>';
        }
        
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        
        // Handle future dates (timezone issues)
        if (diffMs < 0) {
            return '<span style="color: #34d399; font-weight: 600;"><i class="fas fa-check-circle"></i> Just now</span>';
        }
        
        // Format based on time difference
        if (diffMins < 1) {
            return '<span style="color: #34d399; font-weight: 600;"><i class="fas fa-check-circle"></i> Just now</span>';
        }
        
        if (diffMins < 60) {
            return `<span style="color: #34d399; font-weight: 600;">${diffMins}m ago</span>`;
        }
        
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) {
            const color = diffHours < 3 ? '#34d399' : diffHours < 12 ? '#60a5fa' : '#a78bfa';
            return `<span style="color: ${color}; font-weight: 600;">${diffHours}h ago</span>`;
        }
        
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 7) {
            const color = diffDays < 2 ? '#a78bfa' : '#f59e0b';
            return `<span style="color: ${color}; font-weight: 600;">${diffDays}d ago</span>`;
        }
        
        if (diffDays < 30) {
            const weeks = Math.floor(diffDays / 7);
            return `<span style="color: #f59e0b; font-weight: 600;">${weeks}w ago</span>`;
        }
        
        // For very old dates, show actual date
        const formatted = date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
        
        return `<span style="color: #ef4444;">${formatted}</span>`;
        
    } catch (error) {
        console.error('❌ Error formatting date:', error, dateInput);
        return '<span style="color: #ef4444; font-style: italic;"><i class="fas fa-exclamation-circle"></i> Error</span>';
    }
}

/**
 * Format sensor timestamp for admin panel (no HTML)
 * @param {string|number|Date} dateInput - Date in any format
 * @returns {string} Plain text formatted date
 */
function formatSensorDatePlain(dateInput) {
    if (!dateInput || dateInput === 'null' || dateInput === 'undefined' || dateInput === '') {
        return 'Never';
    }
    
    try {
        let date;
        
        if (dateInput instanceof Date) {
            date = dateInput;
        } else if (typeof dateInput === 'number') {
            date = new Date(dateInput > 9999999999 ? dateInput : dateInput * 1000);
        } else if (typeof dateInput === 'string') {
            date = new Date(dateInput);
            
            if (isNaN(date.getTime())) {
                const timestamp = parseInt(dateInput);
                if (!isNaN(timestamp)) {
                    date = new Date(timestamp > 9999999999 ? timestamp : timestamp * 1000);
                }
            }
        }
        
        if (!date || isNaN(date.getTime())) {
            return 'Unknown';
        }
        
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMs < 0 || diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 7) return `${diffDays}d ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
        
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
        
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Error';
    }
}

/**
 * Parse Findy API timestamp ("YYYY-MM-DD HH:mm:ss" = UTC, no Z).
 * @param {string} s - Raw timestamp
 * @returns {Date|null}
 */
function parseFindyTimestamp(s) {
    if (!s || typeof s !== 'string') return null;
    const trimmed = s.trim();
    if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}$/.test(trimmed)) {
        const date = new Date(trimmed + 'Z');
        return isNaN(date.getTime()) ? null : date;
    }
    const date = new Date(trimmed);
    return isNaN(date.getTime()) ? null : date;
}

/**
 * Validate and normalize timestamp
 * @param {any} timestamp - Input timestamp
 * @returns {string|null} ISO string or null
 */
function normalizeSensorTimestamp(timestamp) {
    if (!timestamp) return null;
    
    try {
        let date;
        
        if (timestamp instanceof Date) {
            date = timestamp;
        } else if (typeof timestamp === 'number') {
            date = new Date(timestamp > 9999999999 ? timestamp : timestamp * 1000);
        } else if (typeof timestamp === 'string') {
            date = parseFindyTimestamp(timestamp);
            if (!date) {
                date = new Date(timestamp);
                if (isNaN(date.getTime())) {
                    const ts = parseInt(timestamp);
                    if (!isNaN(ts)) {
                        date = new Date(ts > 9999999999 ? ts : ts * 1000);
                    }
                }
            }
        }
        
        if (date && !isNaN(date.getTime())) {
            return date.toISOString();
        }
        
        return null;
    } catch (error) {
        console.error('Error normalizing timestamp:', error);
        return null;
    }
}

console.log('✅ Sensor Date Formatter loaded');
