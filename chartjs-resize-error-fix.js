// Chart.js Resize Error Fix - Additional fix for resize-related Chart.js errors
console.log('📊 Loading Chart.js Resize Error Fix...');

class ChartJSResizeErrorFix {
    constructor() {
        this.resizeObserver = null;
        this.pendingResizes = new Map();
        this.resizeTimeout = null;
        
        this.init();
    }
    
    init() {
        console.log('🔧 Initializing Chart.js resize error prevention...');
        
        // Wait for Chart.js to be available
        this.waitForChartJS().then(() => {
            this.fixChartResizeIssues();
            this.setupChartResizeProtection();
            this.enhanceExistingChartManagers();
        });
    }
    
    async waitForChartJS() {
        let attempts = 0;
        const maxAttempts = 50;
        
        while (attempts < maxAttempts && typeof Chart === 'undefined') {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (typeof Chart !== 'undefined') {
            console.log('✅ Chart.js found for resize error fix');
        }
    }
    
    fixChartResizeIssues() {
        if (typeof Chart === 'undefined') return;
        
        console.log('🔧 Applying Chart.js resize error fixes...');
        
        // Override Chart resize method with error handling
        if (Chart.Chart && Chart.Chart.prototype && Chart.Chart.prototype.resize) {
            const originalResize = Chart.Chart.prototype.resize;
            
            Chart.Chart.prototype.resize = function(width, height) {
                try {
                    const canvas = this.canvas;
                    if (!canvas || !canvas.ownerDocument || !canvas.parentNode || !document.body.contains(canvas)) {
                        return;
                    }
                    
                    // Check if canvas has valid dimensions
                    const rect = canvas.getBoundingClientRect();
                    if (rect.width === 0 || rect.height === 0) {
                        // Silently skip resize for hidden/zero-dimension canvases
                        return;
                    }
                    
                    // Proceed with original resize
                    return originalResize.call(this, width, height);
                    
                } catch (error) {
                    console.warn('📊 Chart resize error caught and handled:', error.message);
                    
                    // Try to destroy and recreate if canvas is invalid
                    if (error.message.includes('ownerDocument') || error.message.includes('null')) {
                        this.handleInvalidCanvas();
                    }
                }
            };
        }
        
        // Override Chart update method with similar protection
        if (Chart.Chart && Chart.Chart.prototype && Chart.Chart.prototype.update) {
            const originalUpdate = Chart.Chart.prototype.update;
            
            Chart.Chart.prototype.update = function(config) {
                try {
                    if (!this.canvas || !document.body.contains(this.canvas)) {
                        console.warn('⚠️ Chart canvas not attached during update, skipping');
                        return;
                    }
                    
                    return originalUpdate.call(this, config);
                } catch (error) {
                    console.warn('📊 Chart update error caught and handled:', error.message);
                }
            };
        }
    }
    
    setupChartResizeProtection() {
        console.log('🛡️ Setting up chart resize protection...');
        
        // Use ResizeObserver if available to detect element size changes
        if (typeof ResizeObserver !== 'undefined') {
            this.resizeObserver = new ResizeObserver((entries) => {
                for (const entry of entries) {
                    const element = entry.target;
                    if (element.tagName === 'CANVAS' && element.chart) {
                        this.handleSafeResize(element.chart);
                    }
                }
            });
        }
        
        // Listen for window resize events
        window.addEventListener('resize', () => {
            this.handleWindowResize();
        });
    }
    
    handleSafeResize(chart) {
        if (!chart || typeof chart.resize !== 'function') return;
        
        // Debounce resize calls
        const chartId = chart.id || 'unknown';
        
        if (this.pendingResizes.has(chartId)) {
            clearTimeout(this.pendingResizes.get(chartId));
        }
        
        this.pendingResizes.set(chartId, setTimeout(() => {
            try {
                const canvas = chart.canvas;
                if (canvas && canvas.ownerDocument && document.body.contains(canvas)) {
                    chart.resize();
                }
            } catch (error) {
                console.warn(`📊 Safe resize failed for chart ${chartId}:`, error && error.message ? error.message : String(error));
            } finally {
                this.pendingResizes.delete(chartId);
            }
        }, 250)); // 250ms debounce
    }
    
    handleWindowResize() {
        // Clear existing timeout
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
        
        // Debounce window resize handling
        this.resizeTimeout = setTimeout(() => {
            this.resizeAllValidCharts();
        }, 300);
    }
    
    resizeAllValidCharts() {
        console.log('🔄 Resizing all valid charts after window resize...');
        
        // Find all canvas elements that might be charts
        const canvases = document.querySelectorAll('canvas');
        let resizedCount = 0;
        
        canvases.forEach(canvas => {
            try {
                if (!canvas || !canvas.ownerDocument || !document.body.contains(canvas)) return;
                const chart = Chart.getChart && Chart.getChart(canvas);
                if (chart && canvas.parentNode) {
                    chart.resize();
                    resizedCount++;
                }
            } catch (error) {
                console.warn('📊 Error resizing chart:', error && error.message ? error.message : String(error));
            }
        });
        
        if (resizedCount > 0) {
            console.log(`✅ Resized ${resizedCount} valid charts`);
        }
    }
    
    enhanceExistingChartManagers() {
        console.log('🔧 Enhancing existing chart managers with resize protection...');
        
        // Enhance AI Chart Visualizer
        if (window.aiChartVisualizer) {
            this.enhanceAIChartVisualizer();
        }
        
        // Enhance Analytics Manager
        if (window.analyticsManagerV2) {
            this.enhanceAnalyticsManager();
        }
        
        // Enhance any other chart systems
        this.enhanceGlobalChartOperations();
    }
    
    enhanceAIChartVisualizer() {
        const visualizer = window.aiChartVisualizer;
        if (!visualizer || !visualizer.charts) return;
        
        console.log('🤖 Enhancing AI Chart Visualizer with resize protection...');
        
        // Override chart operations to include validation
        if (visualizer.charts && typeof visualizer.charts.forEach === 'function') {
            const originalForEach = visualizer.charts.forEach;
            
            // Wrap chart operations with error handling
            const safeChartOperation = (callback) => {
                return (chart, key) => {
                    try {
                        if (chart && chart.canvas && document.body.contains(chart.canvas)) {
                            callback(chart, key);
                        } else {
                            console.warn(`⚠️ Skipping operation on invalid chart: ${key}`);
                            // Remove invalid chart from collection
                            if (visualizer.charts && typeof visualizer.charts.delete === 'function') {
                                visualizer.charts.delete(key);
                            }
                        }
                    } catch (error) {
                        console.warn(`📊 Chart operation error for ${key}:`, error.message);
                    }
                };
            };
            
            // Apply safe operations to common methods
            if (typeof visualizer.refreshCharts === 'function') {
                const originalRefresh = visualizer.refreshCharts.bind(visualizer);
                visualizer.refreshCharts = () => {
                    console.log('🔄 Safe chart refresh triggered');
                    try {
                        originalRefresh();
                    } catch (error) {
                        console.warn('📊 Chart refresh error caught:', error.message);
                    }
                };
            }
        }
    }
    
    enhanceAnalyticsManager() {
        const manager = window.analyticsManagerV2;
        if (!manager || !manager.charts) return;
        
        console.log('📊 Enhancing Analytics Manager with resize protection...');
        
        // Wrap chart refresh operations
        if (typeof manager.refreshAllCharts === 'function') {
            const originalRefresh = manager.refreshAllCharts.bind(manager);
            
            manager.refreshAllCharts = () => {
                console.log('🔄 Safe analytics chart refresh triggered');
                try {
                    originalRefresh();
                } catch (error) {
                    console.warn('📊 Analytics chart refresh error caught:', error.message);
                }
            };
        }
        
        // Enhance individual chart creation methods
        const chartMethods = [
            'initializeCollectionsTrendChart',
            'initializeFillDistributionChart', 
            'initializeDriverPerformanceChart',
            'initializeRouteEfficiencyChart'
        ];
        
        chartMethods.forEach(methodName => {
            if (typeof manager[methodName] === 'function') {
                const originalMethod = manager[methodName].bind(manager);
                
                manager[methodName] = () => {
                    try {
                        // Add delay to ensure DOM is ready
                        setTimeout(() => {
                            originalMethod();
                        }, 100);
                    } catch (error) {
                        console.warn(`📊 ${methodName} error caught:`, error.message);
                    }
                };
            }
        });
    }
    
    enhanceGlobalChartOperations() {
        // Add global error handling for chart operations
        window.addEventListener('error', (event) => {
            if (event.error && event.error.message && 
                event.error.message.includes('ownerDocument') &&
                event.filename && event.filename.includes('chart')) {
                
                console.warn('📊 Global chart error intercepted and handled');
                event.preventDefault();
                
                // Try to clean up invalid charts
                this.cleanupInvalidCharts();
                
                return false;
            }
        });
    }
    
    cleanupInvalidCharts() {
        console.log('🧹 Cleaning up invalid charts...');
        
        const canvases = document.querySelectorAll('canvas');
        let cleanedCount = 0;
        
        canvases.forEach(canvas => {
            try {
                const chart = Chart.getChart && Chart.getChart(canvas);
                if (chart && (!canvas.parentNode || !document.body.contains(canvas))) {
                    // Chart exists but canvas is not in DOM
                    chart.destroy();
                    cleanedCount++;
                }
            } catch (error) {
                // Canvas or chart is in invalid state
                if (canvas.parentNode) {
                    canvas.parentNode.removeChild(canvas);
                    cleanedCount++;
                }
            }
        });
        
        if (cleanedCount > 0) {
            console.log(`✅ Cleaned up ${cleanedCount} invalid charts`);
        }
    }
    
    // Public API
    forceChartCleanup() {
        console.log('🔧 Force cleaning up all charts...');
        this.cleanupInvalidCharts();
    }
    
    getChartStatus() {
        const canvases = document.querySelectorAll('canvas');
        let validCharts = 0;
        let invalidCharts = 0;
        
        canvases.forEach(canvas => {
            try {
                const chart = Chart.getChart && Chart.getChart(canvas);
                if (chart && canvas.parentNode && document.body.contains(canvas)) {
                    validCharts++;
                } else {
                    invalidCharts++;
                }
            } catch (error) {
                invalidCharts++;
            }
        });
        
        return {
            validCharts,
            invalidCharts,
            totalCanvases: canvases.length,
            resizeObserverActive: !!this.resizeObserver
        };
    }
}

// Initialize the resize error fix
window.chartJSResizeErrorFix = new ChartJSResizeErrorFix();

// Add global debug function
window.debugChartResize = function() {
    const status = window.chartJSResizeErrorFix.getChartStatus();
    console.table(status);
    
    if (status.invalidCharts > 0) {
        console.warn(`⚠️ Found ${status.invalidCharts} invalid charts - cleaning up...`);
        window.chartJSResizeErrorFix.forceChartCleanup();
    }
    
    return status;
};

console.log('📊 Chart.js Resize Error Fix loaded and active');
console.log('🧪 Debug: Use debugChartResize() to check chart status and cleanup');
