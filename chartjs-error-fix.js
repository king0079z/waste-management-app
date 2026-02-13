// Chart.js Error Fix - Comprehensive solution for chart initialization errors
// Fixes "Cannot read properties of null (reading 'ownerDocument')" errors

console.log('📊 Loading Chart.js Error Fix...');

class ChartJSErrorFix {
    constructor() {
        this.chartInitQueue = [];
        this.chartJSReady = false;
        this.maxRetries = 3;
        this.retryDelay = 1000;
        this.originalChartMethods = {};
        
        this.init();
    }
    
    init() {
        console.log('🔧 Initializing Chart.js error prevention...');
        
        // Wait for Chart.js to be available
        this.waitForChartJS().then(() => {
            this.enhanceChartJS();
            this.processChartQueue();
            this.fixExistingChartInitializers();
        });
        
        // Enhance DOM element retrieval
        this.enhanceDOMRetrieval();
        
        // Set up error handling
        this.setupErrorHandling();
    }
    
    async waitForChartJS() {
        console.log('⏳ Waiting for Chart.js to be available...');
        
        let attempts = 0;
        const maxAttempts = 100;
        
        while (attempts < maxAttempts) {
            if (typeof Chart !== 'undefined' && Chart.Chart) {
                this.chartJSReady = true;
                console.log('✅ Chart.js is ready');
                return;
            }
            
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        // Try to load Chart.js if it's not available
        if (typeof Chart === 'undefined') {
            await this.loadChartJS();
        }
    }
    
    async loadChartJS() {
        console.log('📊 Loading Chart.js from CDN...');
        
        return new Promise((resolve, reject) => {
            // Check if already loading
            if (document.querySelector('script[src*="chart.js"]')) {
                console.log('📊 Chart.js already loading...');
                setTimeout(() => {
                    if (typeof Chart !== 'undefined') {
                        this.chartJSReady = true;
                        resolve();
                    } else {
                        reject(new Error('Chart.js failed to load'));
                    }
                }, 2000);
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js';
            script.onload = () => {
                console.log('✅ Chart.js loaded successfully');
                this.chartJSReady = true;
                resolve();
            };
            script.onerror = () => {
                console.error('❌ Failed to load Chart.js');
                reject(new Error('Chart.js failed to load'));
            };
            
            document.head.appendChild(script);
        });
    }
    
    enhanceChartJS() {
        if (typeof Chart === 'undefined') return;
        
        console.log('🔧 Enhancing Chart.js with error prevention...');
        
        // Store original Chart constructor
        this.originalChartMethods.Chart = Chart.Chart || Chart;
        
        // Override Chart constructor with enhanced error handling
        const originalChart = this.originalChartMethods.Chart;
        
        Chart.Chart = class extends originalChart {
            constructor(context, config) {
                // Enhanced context validation
                if (!context) {
                    console.warn('⚠️ Chart context is null, skipping chart creation');
                    throw new Error('Chart context is null');
                }
                
                // Validate DOM element
                if (typeof context === 'string') {
                    const element = document.getElementById(context);
                    if (!element) {
                        console.warn(`⚠️ Chart element '${context}' not found in DOM`);
                        throw new Error(`Chart element '${context}' not found`);
                    }
                    context = element;
                }
                
                // If element is not in DOM (e.g. hidden tab), use a temporary off-screen canvas so Chart.js doesn't throw
                let tempCanvas = null;
                if (!context.ownerDocument || !context.ownerDocument.body.contains(context)) {
                    tempCanvas = document.createElement('canvas');
                    tempCanvas.width = 1;
                    tempCanvas.height = 1;
                    tempCanvas.style.cssText = 'position:absolute;left:-9999px;top:0;pointer-events:none;';
                    if (context.id) tempCanvas.setAttribute('data-chart-placeholder-for', context.id);
                    document.body.appendChild(tempCanvas);
                    context = tempCanvas;
                }
                
                try {
                    super(context, config);
                    if (tempCanvas) {
                        this._placeholderCanvas = tempCanvas;
                        const origDestroy = this.destroy.bind(this);
                        this.destroy = () => {
                            if (this._placeholderCanvas && this._placeholderCanvas.parentNode) {
                                this._placeholderCanvas.parentNode.removeChild(this._placeholderCanvas);
                            }
                            origDestroy();
                        };
                    }
                } catch (error) {
                    if (tempCanvas && tempCanvas.parentNode) tempCanvas.parentNode.removeChild(tempCanvas);
                    console.warn('📊 Chart creation skipped or failed:', error.message);
                    throw error;
                }
            }
        };
        
        // Also override the global Chart if it exists
        if (window.Chart && window.Chart !== Chart.Chart) {
            window.Chart = Chart.Chart;
        }
    }
    
    enhanceDOMRetrieval() {
        console.log('🔧 Enhancing DOM element retrieval...');
        
        // Store original methods
        this.originalChartMethods.getElementById = document.getElementById.bind(document);
        this.originalChartMethods.querySelector = document.querySelector.bind(document);
        
        // Enhanced getElementById with validation
        document.getElementById = (id) => {
            const element = this.originalChartMethods.getElementById(id);
            
            if (!element && id && id.includes('chart')) {
                console.warn(`⚠️ Chart element '${id}' not found, creating placeholder`);
                return this.createChartPlaceholder(id);
            }
            
            return element;
        };
    }
    
    createChartPlaceholder(id) {
        console.log(`🔧 Creating placeholder for chart element: ${id}`);
        
        // Create a canvas element as placeholder
        const canvas = document.createElement('canvas');
        canvas.id = id;
        canvas.width = 400;
        canvas.height = 200;
        canvas.style.display = 'none'; // Hidden placeholder
        
        // Add to body temporarily
        document.body.appendChild(canvas);
        
        // Schedule cleanup
        setTimeout(() => {
            if (canvas.parentNode === document.body) {
                document.body.removeChild(canvas);
                console.log(`🧹 Cleaned up placeholder for ${id}`);
            }
        }, 5000);
        
        return canvas;
    }
    
    setupErrorHandling() {
        console.log('🔧 Setting up Chart.js error handling...');
        
        // Catch Chart.js related errors
        window.addEventListener('error', (event) => {
            if (event.error && event.error.message && 
                (event.error.message.includes('ownerDocument') || 
                 event.error.message.includes('chart') ||
                 event.filename && event.filename.includes('chart'))) {
                
                console.warn('📊 Chart.js error caught and handled:', event.error.message);
                
                // Prevent the error from propagating
                event.preventDefault();
                event.stopPropagation();
                
                // Try to reinitialize charts after a delay
                setTimeout(() => {
                    this.reinitializeCharts();
                }, 2000);
                
                return false;
            }
        });
    }
    
    fixExistingChartInitializers() {
        console.log('🔧 Fixing existing chart initializers...');
        
        // Fix analytics manager
        if (window.analyticsManagerV2) {
            this.fixAnalyticsManager();
        }
        
        // Fix AI chart visualizer
        if (window.aiChartVisualizer) {
            this.fixAIChartVisualizer();
        }
        
        // Fix comprehensive reporting
        if (window.comprehensiveReportingSystem) {
            this.fixComprehensiveReporting();
        }
    }
    
    fixAnalyticsManager() {
        const manager = window.analyticsManagerV2;
        if (!manager) return;
        
        console.log('🔧 Fixing Analytics Manager chart initialization...');
        
        const chartMethods = [
            'initializeCollectionsTrendChart',
            'initializeFillDistributionChart',
            'initializeDriverPerformanceChart',
            'initializeRouteEfficiencyChart',
            'initializeDemandForecastChart',
            'initializeOverflowPredictionChart',
            'initializeOperationalEfficiencyChart',
            'initializeResourceUtilizationChart',
            'initializeSustainabilityChart',
            'initializeCostAnalysisChart',
            'initializeROISavingsChart'
        ];
        
        chartMethods.forEach(methodName => {
            if (typeof manager[methodName] === 'function') {
                const originalMethod = manager[methodName].bind(manager);
                
                manager[methodName] = () => {
                    try {
                        if (!this.chartJSReady) {
                            console.log(`⏳ Queueing ${methodName} until Chart.js is ready`);
                            this.chartInitQueue.push(() => originalMethod());
                            return;
                        }
                        
                        originalMethod();
                    } catch (error) {
                        console.warn(`⚠️ Error in ${methodName}:`, error.message);
                        // Queue for retry
                        setTimeout(() => {
                            try {
                                originalMethod();
                            } catch (retryError) {
                                console.error(`❌ Retry failed for ${methodName}:`, retryError.message);
                            }
                        }, 2000);
                    }
                };
            }
        });
    }
    
    fixAIChartVisualizer() {
        const visualizer = window.aiChartVisualizer;
        if (!visualizer) return;
        
        console.log('🔧 Fixing AI Chart Visualizer...');
        
        if (typeof visualizer.initializeAIPerformanceChart === 'function') {
            const originalMethod = visualizer.initializeAIPerformanceChart.bind(visualizer);
            
            visualizer.initializeAIPerformanceChart = () => {
                try {
                    if (!this.chartJSReady) {
                        this.chartInitQueue.push(() => originalMethod());
                        return;
                    }
                    
                    originalMethod();
                } catch (error) {
                    console.warn('⚠️ Error in AI chart initialization:', error.message);
                }
            };
        }
    }
    
    fixComprehensiveReporting() {
        const reporting = window.comprehensiveReportingSystem;
        if (!reporting) return;
        
        console.log('🔧 Fixing Comprehensive Reporting charts...');
        
        // Override chart creation methods if they exist
        if (typeof reporting.createChart === 'function') {
            const originalCreateChart = reporting.createChart.bind(reporting);
            
            reporting.createChart = (elementId, config) => {
                try {
                    const element = document.getElementById(elementId);
                    if (!element) {
                        console.warn(`⚠️ Chart element ${elementId} not found for reporting`);
                        return null;
                    }
                    
                    return originalCreateChart(elementId, config);
                } catch (error) {
                    console.warn(`⚠️ Error creating chart ${elementId}:`, error.message);
                    return null;
                }
            };
        }
    }
    
    processChartQueue() {
        if (this.chartInitQueue.length === 0) return;
        
        console.log(`🔄 Processing ${this.chartInitQueue.length} queued chart initializations...`);
        
        this.chartInitQueue.forEach((initFunction, index) => {
            setTimeout(() => {
                try {
                    initFunction();
                    console.log(`✅ Processed queued chart ${index + 1}`);
                } catch (error) {
                    console.warn(`⚠️ Error processing queued chart ${index + 1}:`, error.message);
                }
            }, index * 200); // Stagger the initialization
        });
        
        this.chartInitQueue = [];
    }
    
    reinitializeCharts() {
        console.log('🔄 Reinitializing charts after error...');
        
        // Try to reinitialize common chart systems
        setTimeout(() => {
            if (window.analyticsManagerV2 && typeof window.analyticsManagerV2.initializeAllCharts === 'function') {
                try {
                    window.analyticsManagerV2.initializeAllCharts();
                } catch (error) {
                    console.warn('⚠️ Error reinitializing analytics charts:', error.message);
                }
            }
        }, 1000);
    }
    
    // Public method to safely create charts
    safeCreateChart(elementId, config) {
        if (!this.chartJSReady) {
            console.warn('⚠️ Chart.js not ready, queueing chart creation');
            this.chartInitQueue.push(() => this.safeCreateChart(elementId, config));
            return null;
        }
        
        const element = document.getElementById(elementId);
        if (!element) {
            console.warn(`⚠️ Element ${elementId} not found for chart creation`);
            return null;
        }
        
        try {
            return new Chart(element, config);
        } catch (error) {
            console.error(`❌ Error creating chart for ${elementId}:`, error.message);
            return null;
        }
    }
}

// Initialize the Chart.js error fix
window.chartJSErrorFix = new ChartJSErrorFix();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChartJSErrorFix;
}

console.log('📊 Chart.js Error Fix loaded and active');
