// Number Formatting Utilities for World-Class UI

/**
 * Format a number to a specific number of decimal places
 * @param {number} value - The number to format
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {number} - Formatted number
 */
function formatNumber(value, decimals = 1) {
    if (value === null || value === undefined || isNaN(value)) {
        return 0;
    }
    return parseFloat(value.toFixed(decimals));
}

/**
 * Format a percentage value (rounds to 1 decimal place)
 * @param {number} value - The percentage value
 * @returns {string} - Formatted percentage string (e.g., "92.5%")
 */
function formatPercentage(value) {
    if (value === null || value === undefined || isNaN(value)) {
        return "0%";
    }
    return `${formatNumber(value, 1)}%`;
}

/**
 * Format a large number with commas
 * @param {number} value - The number to format
 * @param {number} decimals - Number of decimal places (default: 0)
 * @returns {string} - Formatted number string (e.g., "1,234.5")
 */
function formatLargeNumber(value, decimals = 0) {
    if (value === null || value === undefined || isNaN(value)) {
        return "0";
    }
    const rounded = formatNumber(value, decimals);
    return rounded.toLocaleString('en-US', { 
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals 
    });
}

/**
 * Format weight in kg
 * @param {number} value - Weight value in kg
 * @returns {string} - Formatted weight string (e.g., "2,847kg")
 */
function formatWeight(value) {
    return `${formatLargeNumber(value, 0)}kg`;
}

/**
 * Format time duration
 * @param {number} minutes - Duration in minutes
 * @returns {string} - Formatted time string (e.g., "14.2min")
 */
function formatTime(minutes) {
    if (minutes === null || minutes === undefined || isNaN(minutes)) {
        return "0min";
    }
    return `${formatNumber(minutes, 1)}min`;
}

/**
 * Format rating
 * @param {number} value - Rating value
 * @param {number} max - Maximum rating (default: 5)
 * @returns {string} - Formatted rating string (e.g., "4.7/5")
 */
function formatRating(value, max = 5) {
    if (value === null || value === undefined || isNaN(value)) {
        return `0/${max}`;
    }
    return `${formatNumber(value, 1)}/${max}`;
}

/**
 * Format currency
 * @param {number} value - Currency value
 * @param {string} symbol - Currency symbol (default: "$")
 * @returns {string} - Formatted currency string (e.g., "$1,234.50")
 */
function formatCurrency(value, symbol = "$") {
    return `${symbol}${formatLargeNumber(value, 2)}`;
}

/**
 * Safe update element text content
 * @param {string} elementId - The element ID
 * @param {string} value - The value to set
 */
function updateElementText(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
}

/**
 * Update percentage display
 * @param {string} elementId - The element ID
 * @param {number} value - The percentage value
 */
function updatePercentageDisplay(elementId, value) {
    updateElementText(elementId, formatPercentage(value));
}

/**
 * Apply number formatting to all stat values on page load
 */
let isFormatting = false;  // Prevent multiple simultaneous runs
let formatDebounceTimer = null;

function applyNumberFormattingToPage() {
    // Prevent infinite loop - only allow one formatting run at a time
    if (isFormatting) {
        return;
    }
    
    isFormatting = true;
    
    // Find all elements with stat-value class
    const elements = document.querySelectorAll('.stat-value, .ai-metric-value, .driver-stat-value, .metric-value, [id*="Efficiency"], [id*="efficiency"], [id*="Accuracy"], [id*="accuracy"]');
    
    let formattedCount = 0;
    
    elements.forEach(element => {
        const text = element.textContent.trim();
        
        // Skip if empty
        if (!text) return;
        
        // Skip placeholder text
        if (text === 'Estimating...' || text === 'Computing...' || text === 'Loading...') return;
        
        // Check if it's a percentage with too many decimals
        if (text.includes('%')) {
            const numValue = parseFloat(text.replace('%', ''));
            // Format if it has more than 1 decimal place OR the string is long
            if (!isNaN(numValue) && (text.length > 6 || (text.split('.')[1] && text.split('.')[1].replace('%', '').length > 1))) {
                const formatted = formatPercentage(numValue);
                element.textContent = formatted;
                formattedCount++;
            }
        }
        // Check if it's a decimal number with too many places
        else if (text.includes('.')) {
            const numValue = parseFloat(text);
            if (!isNaN(numValue)) {
                const decimalPart = text.split('.')[1];
                const decimalPlaces = decimalPart ? decimalPart.length : 0;
                if (decimalPlaces > 2) {
                    const formatted = formatNumber(numValue, 1);
                    element.textContent = formatted;
                    formattedCount++;
                }
            }
        }
    });
}

// Auto-apply formatting on page load
if (typeof window !== 'undefined') {
    console.log('📊 Number formatter loaded!');
    
    // Apply immediately
    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', applyNumberFormattingToPage);
    } else {
        applyNumberFormattingToPage();
    }
    
    // Also apply after page fully loads
    window.addEventListener('load', () => {
        applyNumberFormattingToPage();
        
        // Apply a few more times to catch dynamically loaded content (reduced frequency)
        setTimeout(applyNumberFormattingToPage, 1000);
        setTimeout(applyNumberFormattingToPage, 3000);
    });
    
    // Watch for changes (if MutationObserver available) with HEAVY debouncing
    if (typeof MutationObserver !== 'undefined') {
        let mutationDebounceTimer = null;
        
        const observer = new MutationObserver((mutations) => {
            // Ignore mutations while formatting to prevent infinite loop
            if (isFormatting) {
                return;
            }
            
            // Heavy debouncing - only format once every 2 seconds max
            if (mutationDebounceTimer) {
                clearTimeout(mutationDebounceTimer);
            }
            
            mutationDebounceTimer = setTimeout(() => {
                // Check if it's a meaningful change (not just formatting changes)
                let shouldFormat = false;
                mutations.forEach(mutation => {
                    // Only format on node additions, not text changes (which we cause)
                    if (mutation.addedNodes.length > 0) {
                        mutation.addedNodes.forEach(node => {
                            // Only format if real content was added (not just text nodes from our formatting)
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                shouldFormat = true;
                            }
                        });
                    }
                });
                
                if (shouldFormat) {
                    applyNumberFormattingToPage();
                }
            }, 2000);  // 2 second debounce
        });
        
        // Start observing after page load
        window.addEventListener('load', () => {
            observer.observe(document.body, {
                childList: true,
                subtree: true,
                characterData: false  // Don't watch text changes (prevents infinite loop)
            });
        });
    }
}
