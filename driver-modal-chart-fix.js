// Driver Modal Chart Fix - Fixes timing issues with chart creation in driver details modal
console.log('📊 Loading Driver Modal Chart Fix...');

class DriverModalChartFix {
    constructor() {
        this.pendingCharts = new Set();
        this.modalObserver = null;
        this.retryAttempts = new Map();
        this.maxRetries = 3;
        
        this.init();
    }
    
    init() {
        console.log('🔧 Initializing Driver Modal Chart Fix...');
        
        // Override the existing createDriverPerformanceTrendChart function
        this.fixDriverPerformanceTrendChart();
        
        // Set up modal visibility monitoring
        this.setupModalObserver();
        
        // Enhance modal show function
        this.enhanceModalShowFunction();
        
        console.log('✅ Driver Modal Chart Fix initialized');
    }
    
    fixDriverPerformanceTrendChart() {
        // Store original function if it exists
        const originalFunction = window.createDriverPerformanceTrendChart;
        
        // Override with TRIPLE delay method for guaranteed DOM attachment
        window.createDriverPerformanceTrendChart = (driverId) => {
            console.log(`📊 Creating driver performance trend chart for: ${driverId}`);
            
            // Use longer timeout to GUARANTEE DOM attachment
            setTimeout(() => {
                const modal = document.getElementById('driverDetailsModal');
                const canvas = document.getElementById('driverPerformanceTrendChart');
                
                // Strict validation
                if (!modal || !canvas) {
                    console.log('ℹ️ Chart elements not ready, skipping');
                    return;
                }
                
                // TRIPLE check canvas is in DOM
                if (!canvas.isConnected || !document.body.contains(canvas) || !canvas.parentElement) {
                    console.log('ℹ️ Canvas not fully attached to DOM yet, skipping chart');
                    return;
                }
                
                // Verify modal is visible
                if (!modal.offsetParent) {
                    console.log('ℹ️ Modal not visible, skipping chart');
                    return;
                }
                
                // Create chart with all checks passed
                this.createDriverPerformanceTrendChartSafe(driverId);
                
            }, 800);  // Longer delay ensures reliable DOM attachment
        };
        
        console.log('✅ Enhanced createDriverPerformanceTrendChart function');
    }
    
    createDriverPerformanceTrendChartSafe(driverId) {
        console.log(`📊 Creating safe performance chart for driver: ${driverId}`);
        
        try {
            // Wait a bit longer for canvas to be fully attached
            const canvas = document.getElementById('driverPerformanceTrendChart');
            if (!canvas) {
                console.warn('⚠️ Canvas element not found');
                return;
            }
            
            // Canvas must be in DOM; allow creation even if inside scrollable area (offsetParent can be null)
            if (!canvas.isConnected || !document.body.contains(canvas) || !canvas.parentElement) {
                console.log('ℹ️ Canvas not fully attached, aborting chart creation');
                return;
            }
            
            const modal = document.getElementById('driverDetailsModal');
            const modalVisible = modal && 
                                modal.style.display !== 'none' &&
                                window.getComputedStyle(modal).display !== 'none';
            
            if (!modalVisible) {
                console.log('ℹ️ Modal not visible, aborting chart creation');
                return;
            }
            
            // Destroy existing chart if it exists
            if (window.driverPerformanceTrendChart && typeof window.driverPerformanceTrendChart.destroy === 'function') {
                window.driverPerformanceTrendChart.destroy();
                window.driverPerformanceTrendChart = null;
            }
            
            // Check if Chart.js is available
            if (typeof Chart === 'undefined') {
                console.warn('⚠️ Chart.js not available');
                this.showChartPlaceholder(canvas, 'Chart.js not loaded');
                return;
            }
            
            // Get canvas context
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                console.error('❌ Could not get canvas context');
                return;
            }
            
            // Get chart data (real only – no sample data)
            const chartData = this.getDriverPerformanceData(driverId);
            const hasAnyData = chartData.data && chartData.data.some(v => v > 0);
            
            // Create chart with enhanced error handling and dark theme styling
            window.driverPerformanceTrendChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: chartData.labels,
                    datasets: [{
                        label: 'Collections per Day',
                        data: chartData.data,
                        borderColor: '#00d4ff',
                        backgroundColor: 'rgba(0, 212, 255, 0.15)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#00d4ff',
                        pointBorderColor: '#0f172a',
                        pointBorderWidth: 2,
                        pointRadius: 6,
                        pointHoverRadius: 8,
                        pointHoverBorderWidth: 3,
                        pointHoverBackgroundColor: '#00d4ff',
                        pointHoverBorderColor: '#ffffff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false  // We have custom legend
                        },
                        ...(hasAnyData ? {} : {
                            afterDraw: function(chart) {
                                const ctx = chart.ctx;
                                const width = chart.width;
                                const height = chart.height;
                                ctx.save();
                                ctx.textAlign = 'center';
                                ctx.textBaseline = 'middle';
                                ctx.fillStyle = '#94a3b8';
                                ctx.font = '14px system-ui, sans-serif';
                                ctx.fillText('No collections in the last 7 days', width / 2, height / 2 - 10);
                                ctx.font = '12px system-ui, sans-serif';
                                ctx.fillText('Complete collections to see your trend', width / 2, height / 2 + 12);
                                ctx.restore();
                            }
                        }),
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            backgroundColor: 'rgba(15, 23, 42, 0.95)',
                            titleColor: '#00d4ff',
                            bodyColor: '#f1f5f9',
                            borderColor: 'rgba(0, 212, 255, 0.3)',
                            borderWidth: 1,
                            padding: 12,
                            displayColors: true,
                            callbacks: {
                                label: function(context) {
                                    return `Collections: ${context.parsed.y}`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                color: 'rgba(0, 212, 255, 0.08)',
                                borderColor: 'rgba(0, 212, 255, 0.2)'
                            },
                            ticks: {
                                color: '#94a3b8',
                                font: {
                                    size: 11
                                }
                            }
                        },
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(0, 212, 255, 0.08)',
                                borderColor: 'rgba(0, 212, 255, 0.2)'
                            },
                            ticks: {
                                stepSize: 1,
                                color: '#94a3b8',
                                font: {
                                    size: 11
                                },
                                callback: function(value) {
                                    return Math.round(value);
                                }
                            }
                        }
                    },
                    interaction: {
                        mode: 'nearest',
                        axis: 'x',
                        intersect: false
                    }
                }
            });
            
            // Force chart to size to container (fixes empty chart when section is in scrollable area)
            if (window.driverPerformanceTrendChart && typeof window.driverPerformanceTrendChart.resize === 'function') {
                window.driverPerformanceTrendChart.resize();
                setTimeout(() => {
                    if (window.driverPerformanceTrendChart && typeof window.driverPerformanceTrendChart.resize === 'function') {
                        window.driverPerformanceTrendChart.resize();
                    }
                }, 150);
            }
            
            console.log(`✅ Driver performance trend chart created successfully for ${driverId}`);
            
        } catch (error) {
            console.error('❌ Error creating driver performance chart:', error);
            // Try to find canvas element for placeholder
            try {
                const canvasEl = document.getElementById('driverPerformanceTrendChart');
                if (canvasEl && canvasEl.isConnected) {
                    this.showChartPlaceholder(canvasEl, 'Chart creation failed');
                }
            } catch (placeholderError) {
                // Silent fail for placeholder
            }
        }
    }
    
    getDriverPerformanceData(driverId) {
        console.log(`📊 Getting performance data for driver: ${driverId}`);
        
        // Get last 7 days of data
        const last7Days = [];
        
        let collections = [];
        if (window.dataManager && typeof window.dataManager.getCollections === 'function') {
            collections = window.dataManager.getCollections().filter(c => c.driverId === driverId);
            console.log(`📊 Found ${collections.length} total collections for driver ${driverId}`);
        }
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateString = date.toDateString();
            
            const dayCollections = collections.filter(c => 
                c && c.timestamp && new Date(c.timestamp).toDateString() === dateString
            ).length;
            
            last7Days.push({
                date: date.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' }),
                collections: dayCollections
            });
        }
        
        // World-class: no fake data – show real collections only; chart will display "No collections" when all zeros
        console.log('📊 Performance data (real only):', last7Days);
        
        return {
            labels: last7Days.map(d => d.date),
            data: last7Days.map(d => d.collections)
        };
    }
    
    showChartPlaceholder(canvas, message) {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set styles
        ctx.fillStyle = '#94a3b8';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Draw message
        ctx.fillText(message, canvas.width / 2, canvas.height / 2);
        
        console.log(`📊 Chart placeholder shown: ${message}`);
    }
    
    waitForModalVisibility(callback, maxWait = 3000) {
        const startTime = Date.now();
        const checkInterval = 100;
        
        const checkVisibility = () => {
            const modal = document.getElementById('driverDetailsModal');
            if (!modal) {
                console.error('❌ Modal not found during visibility check');
                return;
            }
            
            const isVisible = modal.style.display === 'block' && 
                             modal.offsetParent !== null &&
                             window.getComputedStyle(modal).display !== 'none';
            
            if (isVisible) {
                console.log('✅ Modal is now visible, proceeding with chart creation');
                setTimeout(callback, 200); // Small delay to ensure full rendering
                return;
            }
            
            // Check timeout
            if (Date.now() - startTime > maxWait) {
                console.warn('⚠️ Timeout waiting for modal visibility - chart creation abandoned');
                return; // Don't try if not visible
            }
            
            // Continue checking
            setTimeout(checkVisibility, checkInterval);
        };
        
        checkVisibility();
    }
    
    setupModalObserver() {
        if (typeof MutationObserver === 'undefined') {
            console.warn('⚠️ MutationObserver not available');
            return;
        }
        
        // Observe changes to the modal
        this.modalObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    const modal = mutation.target;
                    if (modal.id === 'driverDetailsModal' && modal.style.display === 'block') {
                        console.log('📊 Modal became visible, processing queued charts...');
                        this.processQueuedCharts();
                    }
                }
            });
        });
        
        const modal = document.getElementById('driverDetailsModal');
        if (modal) {
            this.modalObserver.observe(modal, {
                attributes: true,
                attributeFilter: ['style']
            });
        }
    }
    
    enhanceModalShowFunction() {
        // Enhance showDriverDetailsModal if it exists
        if (typeof window.showDriverDetailsModal === 'function') {
            const originalShowModal = window.showDriverDetailsModal;
            
            window.showDriverDetailsModal = function(driverId) {
                console.log(`🔧 Enhanced driver modal show for: ${driverId}`);
                
                // Call original function
                originalShowModal(driverId);
                
                // Wait a moment then ensure charts are created
                setTimeout(() => {
                    if (window.createDriverPerformanceTrendChart) {
                        window.createDriverPerformanceTrendChart(driverId);
                    }
                }, 600); // Wait for modal animation
            };
            
            console.log('✅ Enhanced showDriverDetailsModal function');
        }
    }
    
    queueChartCreation(functionName, ...args) {
        this.pendingCharts.add({ functionName, args });
        console.log(`📝 Queued chart creation: ${functionName}`);
    }
    
    processQueuedCharts() {
        if (this.pendingCharts.size === 0) return;
        
        console.log(`🔄 Processing ${this.pendingCharts.size} queued charts...`);
        
        this.pendingCharts.forEach(({ functionName, args }) => {
            setTimeout(() => {
                if (typeof window[functionName] === 'function') {
                    window[functionName](...args);
                }
            }, 300);
        });
        
        this.pendingCharts.clear();
    }
    
    // Public methods for debugging
    forceChartCreation(driverId) {
        console.log(`🔧 Force creating chart for driver: ${driverId}`);
        this.createDriverPerformanceTrendChartSafe(driverId);
    }
    
    getChartStatus() {
        const canvas = document.getElementById('driverPerformanceTrendChart');
        const modal = document.getElementById('driverDetailsModal');
        
        return {
            canvasExists: !!canvas,
            canvasConnected: canvas?.isConnected || false,
            modalExists: !!modal,
            modalVisible: modal?.style.display === 'block',
            chartInstance: !!window.driverPerformanceTrendChart,
            pendingCharts: this.pendingCharts.size,
            chartJSAvailable: typeof Chart !== 'undefined'
        };
    }
}

// Initialize the fix
window.driverModalChartFix = new DriverModalChartFix();

// Add global debug function
window.debugDriverChart = function(driverId = 'USR-003') {
    console.table(window.driverModalChartFix.getChartStatus());
    if (driverId) {
        window.driverModalChartFix.forceChartCreation(driverId);
    }
};

console.log('📊 Driver Modal Chart Fix loaded and active');
console.log('🧪 Debug: Use debugDriverChart() to test chart creation');
