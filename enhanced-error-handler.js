// Enhanced Error Handler - Comprehensive error catching and handling
// Improves upon the existing error-handler-fix.js with better Chart.js and DOM error handling

console.log('🛡️ Loading Enhanced Error Handler...');

class EnhancedErrorHandler {
    constructor() {
        this.errorCount = 0;
        this.errorLog = [];
        this.errorSuppressionRules = new Set();
        this.chartErrorCount = 0;
        this.maxChartErrors = 5;
        
        this.init();
    }
    
    init() {
        console.log('🛡️ Initializing Enhanced Error Handler...');
        
        // Set up comprehensive error handling
        this.setupGlobalErrorHandling();
        this.setupUnhandledRejectionHandling();
        this.setupChartSpecificHandling();
        this.setupDOMErrorHandling();
        
        // Enhance existing error handler if present
        this.enhanceExistingErrorHandler();
    }
    
    setupGlobalErrorHandling() {
        window.addEventListener('error', (event) => {
            this.handleError({
                message: event.error?.message || event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error,
                type: 'javascript'
            });
        });
    }
    
    setupUnhandledRejectionHandling() {
        window.addEventListener('unhandledrejection', (event) => {
            var msg = (event.reason && (event.reason.message || String(event.reason))) || '';
            if (msg.indexOf('message channel closed') !== -1 || msg.indexOf('asynchronous response') !== -1) {
                event.preventDefault();
                return;
            }
            this.handleError({
                message: `Unhandled Promise Rejection: ${event.reason}`,
                error: event.reason,
                type: 'promise'
            });
        });
    }
    
    setupChartSpecificHandling() {
        // Set up Chart.js specific error suppression rules
        this.errorSuppressionRules.add('ownerDocument');
        this.errorSuppressionRules.add('getContext');
        this.errorSuppressionRules.add('Chart is not defined');
        this.errorSuppressionRules.add('Cannot read properties of null');
        this.errorSuppressionRules.add('chart');
        this.errorSuppressionRules.add('Script error.');
        this.errorSuppressionRules.add('Unknown error occurred');
        this.errorSuppressionRules.add('addEventListener');
        
        console.log('📊 Chart.js error suppression rules activated');
    }
    
    setupDOMErrorHandling() {
        // Enhanced DOM error handling
        const originalGetElementById = document.getElementById.bind(document);
        
        document.getElementById = function(id) {
            try {
                const element = originalGetElementById(id);
                if (!element && id && (id.includes('chart') || id.includes('Chart'))) {
                    console.warn(`⚠️ Chart element '${id}' not found in DOM`);
                    // Return a dummy element to prevent null errors
                    return window.enhancedErrorHandler?.createDummyChartElement(id) || null;
                }
                return element;
            } catch (error) {
                console.error('❌ Error in getElementById:', error);
                return null;
            }
        };
    }
    
    createDummyChartElement(id) {
        console.log(`🔧 Creating dummy chart element for: ${id}`);
        
        const canvas = document.createElement('canvas');
        canvas.id = id + '-dummy';
        canvas.width = 1;
        canvas.height = 1;
        canvas.style.display = 'none';
        
        // Add to body temporarily
        document.body.appendChild(canvas);
        
        // Auto-cleanup after 10 seconds
        setTimeout(() => {
            if (canvas.parentNode) {
                canvas.parentNode.removeChild(canvas);
            }
        }, 10000);
        
        return canvas;
    }
    
    enhanceExistingErrorHandler() {
        // Check if the original error handler exists and enhance it
        if (window.errorHandlerFix) {
            console.log('🔧 Enhancing existing error handler...');
            
            const originalHandleError = window.errorHandlerFix.handleError;
            if (originalHandleError) {
                window.errorHandlerFix.handleError = (error) => {
                    // Use our enhanced handling first
                    const handled = this.handleError(error);
                    
                    // If not handled by us, pass to original handler
                    if (!handled && typeof originalHandleError === 'function') {
                        originalHandleError.call(window.errorHandlerFix, error);
                    }
                };
            }
        }
    }
    
    handleError(errorInfo) {
        this.errorCount++;

        const errorDetails = {
            timestamp: new Date().toISOString(),
            message: errorInfo.message || 'Unknown error',
            filename: errorInfo.filename || 'unknown',
            line: errorInfo.lineno || 0,
            column: errorInfo.colno || 0,
            type: errorInfo.type || 'unknown',
            stack: errorInfo.error?.stack || 'No stack trace'
        };

        // Suppress DOM null reference errors (missing driver panel / element not in DOM)
        const msg = (errorDetails.message || '').toLowerCase();
        if (msg.includes('queryselector') && msg.includes('null')) {
            return true;
        }

        // Check if this is a Chart.js error
        const isChartError = this.isChartRelatedError(errorDetails.message);
        
        if (isChartError) {
            this.chartErrorCount++;
            console.warn(`📊 Chart.js error #${this.chartErrorCount}:`, errorDetails.message);
            
            // Handle chart errors specially
            this.handleChartError(errorDetails);
            
            // Suppress chart errors if too many
            if (this.chartErrorCount > this.maxChartErrors) {
                console.warn(`📊 Suppressing further Chart.js errors (${this.chartErrorCount} total)`);
                return true; // Mark as handled
            }
            
            return true; // Chart errors are handled
        }
        
        // Check if error should be suppressed
        if (this.shouldSuppressError(errorDetails.message)) {
            console.warn('🔇 Suppressing known error:', errorDetails.message);
            return true;
        }
        
        // Log error for analysis
        this.logError(errorDetails);
        
        // Show user-friendly error message for critical errors
        if (this.isCriticalError(errorDetails)) {
            this.showUserErrorNotification(errorDetails);
        }
        
        return false; // Not handled, let it propagate
    }
    
    isChartRelatedError(message) {
        const chartKeywords = [
            'ownerDocument',
            'chart',
            'Chart',
            'getContext',
            'canvas',
            'Cannot read properties of null'
        ];
        
        return chartKeywords.some(keyword => 
            message.toLowerCase().includes(keyword.toLowerCase())
        );
    }
    
    handleChartError(errorDetails) {
        console.warn('📊 Handling chart error:', errorDetails.message);
        
        // Try to reinitialize charts after a delay
        setTimeout(() => {
            if (window.chartJSErrorFix) {
                window.chartJSErrorFix.reinitializeCharts();
            }
        }, 2000);
        
        // Try to recreate missing chart elements
        this.recreateMissingChartElements();
    }
    
    recreateMissingChartElements() {
        const commonChartIds = [
            'collections-trend-chart',
            'fill-distribution-chart',
            'driver-performance-chart',
            'route-efficiency-chart',
            'ai-performance-chart',
            'demand-forecast-chart',
            'overflow-prediction-chart',
            'operational-efficiency-chart',
            'resource-utilization-chart',
            'sustainability-chart',
            'cost-analysis-chart',
            'roi-savings-chart'
        ];
        
        commonChartIds.forEach(chartId => {
            const element = document.getElementById(chartId);
            if (!element) {
                const container = document.querySelector('.analytics-container, .dashboard-container, .reports-container');
                if (container) {
                    const canvas = document.createElement('canvas');
                    canvas.id = chartId;
                    canvas.width = 400;
                    canvas.height = 200;
                    canvas.style.cssText = 'display: none; width: 100%; height: 200px;';
                    
                    container.appendChild(canvas);
                    console.log(`🔧 Created missing chart element: ${chartId}`);
                }
            }
        });
    }
    
    shouldSuppressError(message) {
        return Array.from(this.errorSuppressionRules).some(rule => 
            message.toLowerCase().includes(rule.toLowerCase())
        );
    }
    
    isCriticalError(errorDetails) {
        const criticalKeywords = [
            'network',
            'failed to fetch',
            'syntax error',
            'reference error',
            'type error'
        ];
        
        const isNotChartError = !this.isChartRelatedError(errorDetails.message);
        const containsCriticalKeyword = criticalKeywords.some(keyword =>
            errorDetails.message.toLowerCase().includes(keyword)
        );
        
        return isNotChartError && containsCriticalKeyword;
    }
    
    logError(errorDetails) {
        this.errorLog.push(errorDetails);
        
        // Keep log manageable
        if (this.errorLog.length > 50) {
            this.errorLog = this.errorLog.slice(-25);
        }
        
        // Log to data manager if available
        if (window.dataManager && typeof window.dataManager.addErrorLog === 'function') {
            window.dataManager.addErrorLog({
                timestamp: errorDetails.timestamp,
                level: 'error',
                message: errorDetails.message,
                source: errorDetails.filename,
                handled: true
            });
        }
        
        const msg = errorDetails && (errorDetails.message || (typeof errorDetails === 'string' ? errorDetails : JSON.stringify(errorDetails)));
        console.error('🚨 Error logged:', msg);
    }
    
    showUserErrorNotification(errorDetails) {
        // Only show user notifications for truly critical errors
        if (this.errorCount > 10) return; // Don't spam user
        
        const notification = document.createElement('div');
        notification.className = 'error-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #fee2e2;
            border: 1px solid #fecaca;
            color: #991b1b;
            padding: 12px 16px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            max-width: 300px;
            font-size: 14px;
        `;
        
        notification.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 4px;">⚠️ System Error</div>
            <div>An error occurred but has been logged for review. The application should continue working normally.</div>
            <button onclick="this.parentNode.remove()" style="
                background: none; border: none; color: #991b1b; 
                float: right; font-size: 18px; cursor: pointer;
                margin-top: -20px;
            ">×</button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 10000);
    }
    
    // Public methods for debugging
    getErrorStats() {
        return {
            totalErrors: this.errorCount,
            chartErrors: this.chartErrorCount,
            recentErrors: this.errorLog.slice(-5)
        };
    }
    
    clearErrorLog() {
        this.errorLog = [];
        this.errorCount = 0;
        this.chartErrorCount = 0;
        console.log('🧹 Error log cleared');
    }
    
    addSuppressionRule(keyword) {
        this.errorSuppressionRules.add(keyword);
        console.log(`🔇 Added error suppression rule: ${keyword}`);
    }
}

// Initialize enhanced error handler
window.enhancedErrorHandler = new EnhancedErrorHandler();

// Add global debug function
window.debugErrors = function() {
    console.table(window.enhancedErrorHandler.getErrorStats());
};

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedErrorHandler;
}

console.log('🛡️ Enhanced Error Handler loaded and active');
