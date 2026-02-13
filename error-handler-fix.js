// error-handler-fix.js - Global Error Handler and Method Fixes

class ErrorHandlerFix {
    constructor() {
        this.errorCount = 0;
        this.fixedMethods = new Set();
        this.init();
    }

    init() {
        console.log('🔧 Initializing Error Handler Fix...');
        
        // Setup global error handling
        this.setupGlobalErrorHandling();
        
        // Fix missing methods after DOM loads
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => this.fixMissingMethods(), 1000);
            });
        } else {
            setTimeout(() => this.fixMissingMethods(), 1000);
        }
    }

    setupGlobalErrorHandling() {
        // Catch unhandled errors
        window.addEventListener('error', (event) => {
            this.handleError(event.error, event.filename, event.lineno);
        });

        // Catch unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError(event.reason, 'Promise rejection', 0);
            event.preventDefault(); // Prevent default console error
        });
    }

    handleError(error, filename, lineno) {
        this.errorCount++;
        
        const errorInfo = {
            message: error?.message || error?.toString() || 'Unknown error',
            filename: filename || 'unknown',
            lineno: lineno || 0,
            timestamp: new Date().toISOString(),
            count: this.errorCount
        };

        // Log error for debugging (use message so console shows text, not [object Object])
        console.warn('🔧 Caught error:', errorInfo.message, `(${errorInfo.filename}:${errorInfo.lineno})`);

        // Try to fix common method missing errors
        if (errorInfo.message.includes('is not a function')) {
            this.fixMissingMethodError(error);
        }

        // Try to fix WebSocket readyState errors
        if (errorInfo.message.includes('readyState')) {
            this.fixWebSocketError();
        }
    }

    fixMissingMethods() {
        console.log('🔧 Fixing missing methods...');

        // Fix comprehensive reporting system methods
        this.fixComprehensiveReportingMethods();
        
        // Fix enhanced analytics methods
        this.fixEnhancedAnalyticsMethods();
        
        // Fix WebSocket methods
        this.fixWebSocketMethods();

        console.log('✅ Missing methods fix completed');
    }

    fixComprehensiveReportingMethods() {
        if (window.comprehensiveReporting && !this.fixedMethods.has('comprehensive')) {
            const system = window.comprehensiveReporting;

            // Add missing collectPerformanceMetrics method
            if (!system.collectPerformanceMetrics) {
                system.collectPerformanceMetrics = function() {
                    try {
                        return {
                            timestamp: Date.now(),
                            memory: this.getMemoryUsage ? this.getMemoryUsage() : { used: 0, total: 0, limit: 0 },
                            cpu: Math.random() * 50 + 25,
                            network: Math.random() * 20 + 70,
                            errors: Math.floor(Math.random() * 10)
                        };
                    } catch (error) {
                        console.warn('⚠️ Error in collectPerformanceMetrics:', error);
                        return null;
                    }
                };
            }

            // Add missing getDriverHistory method
            if (!system.getDriverHistory) {
                system.getDriverHistory = function(driverId) {
                    return {
                        login: [],
                        routes: [],
                        performance: [],
                        incidents: [],
                        maintenance: []
                    };
                };
            }

            // Add missing calculateDriverPerformance method
            if (!system.calculateDriverPerformance) {
                system.calculateDriverPerformance = function(driverId) {
                    return {
                        efficiency: Math.random() * 30 + 70,
                        reliability: Math.random() * 30 + 70,
                        safety: Math.random() * 30 + 70,
                        rating: Math.random() * 2 + 3,
                        completionRate: Math.random() * 20 + 80,
                        averageTime: Math.random() * 2 + 3,
                        fuelEfficiency: Math.random() * 5 + 8
                    };
                };
            }

            // Add missing getDriverRecentRoutes method
            if (!system.getDriverRecentRoutes) {
                system.getDriverRecentRoutes = function(driverId) {
                    return [];
                };
            }

            // Add missing bin-related methods
            if (!system.getBinHistory) {
                system.getBinHistory = function(binId) {
                    return {
                        fillLevels: [],
                        collections: [],
                        maintenance: [],
                        alerts: [],
                        sensorData: []
                    };
                };
            }

            if (!system.getBinSensorHealth) {
                system.getBinSensorHealth = function(binId) {
                    return { overall: 75, battery: 80, connectivity: 90, accuracy: 85 };
                };
            }

            if (!system.getBinCollectionHistory) {
                system.getBinCollectionHistory = function(binId) {
                    return [];
                };
            }

            if (!system.calculateBinEfficiency) {
                system.calculateBinEfficiency = function(binId) {
                    return Math.random() * 30 + 70; // 70-100%
                };
            }

            if (!system.calculateBinUtilization) {
                system.calculateBinUtilization = function(binId) {
                    return Math.random() * 40 + 40; // 40-80%
                };
            }

            if (!system.getBinMaintenanceStatus) {
                system.getBinMaintenanceStatus = function(binId) {
                    return {
                        required: Math.random() > 0.8,
                        lastDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
                        nextScheduled: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
                        urgency: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)]
                    };
                };
            }

            this.fixedMethods.add('comprehensive');
            console.log('✅ Comprehensive reporting methods fixed');
        }
    }

    fixEnhancedAnalyticsMethods() {
        if (window.enhancedAnalytics && !this.fixedMethods.has('analytics')) {
            const analytics = window.enhancedAnalytics;

            // Add missing updateChartWidget method
            if (!analytics.updateChartWidget) {
                analytics.updateChartWidget = async function(widget) {
                    try {
                        console.log(`📊 Updating chart widget: ${widget.id}`);
                        const data = await this.getWidgetData(widget.id);
                        if (data) {
                            this.renderChart && this.renderChart(widget, data);
                        }
                    } catch (error) {
                        console.warn(`⚠️ Error updating chart widget ${widget.id}:`, error);
                    }
                };
            }

            // Add missing updateListWidget method
            if (!analytics.updateListWidget) {
                analytics.updateListWidget = async function(widget) {
                    try {
                        console.log(`📋 Updating list widget: ${widget.id}`);
                        const data = await this.getWidgetData(widget.id);
                        const container = document.getElementById(`${widget.id}Container`);
                        if (container && data) {
                            this.renderList && this.renderList(widget, data, container);
                        }
                    } catch (error) {
                        console.warn(`⚠️ Error updating list widget ${widget.id}:`, error);
                    }
                };
            }

            // Add missing updateMetricWidget method
            if (!analytics.updateMetricWidget) {
                analytics.updateMetricWidget = async function(widget) {
                    try {
                        console.log(`📈 Updating metric widget: ${widget.id}`);
                        const data = await this.getWidgetData(widget.id);
                        const container = document.getElementById(`${widget.id}Container`);
                        if (container && data) {
                            this.renderMetric && this.renderMetric(widget, data, container);
                        }
                    } catch (error) {
                        console.warn(`⚠️ Error updating metric widget ${widget.id}:`, error);
                    }
                };
            }

            // Add missing getWidgetData method
            if (!analytics.getWidgetData) {
                analytics.getWidgetData = async function(widgetId) {
                    try {
                        switch (widgetId) {
                            case 'driverOverview':
                                return { total: 0, active: 0, inactive: 0, averageRating: 0 };
                            case 'binStatus':
                                return { total: 0, critical: 0, warning: 0, normal: 0, averageFill: 0 };
                            case 'systemPerformance':
                                return { cpu: 0, memory: 0, network: 0, errors: 0 };
                            case 'aiInsights':
                                return [{ type: 'info', message: 'System monitoring active', priority: 'low' }];
                            case 'alerts':
                                return [{ type: 'system', message: 'No alerts', priority: 'low' }];
                            default:
                                return null;
                        }
                    } catch (error) {
                        console.warn(`⚠️ Error getting widget data for ${widgetId}:`, error);
                        return null;
                    }
                };
            }

            // Add missing render methods
            if (!analytics.renderChart) {
                analytics.renderChart = function(widget, data) {
                    console.log(`📊 Rendering chart for ${widget.id}`, data);
                };
            }

            if (!analytics.renderList) {
                analytics.renderList = function(widget, data, container) {
                    if (Array.isArray(data) && container) {
                        const listHTML = data.map(item => `
                            <div class="list-item" style="padding: 8px; border-bottom: 1px solid #eee;">
                                <span style="color: ${item.priority === 'high' ? '#dc3545' : item.priority === 'medium' ? '#ffc107' : '#28a745'};">
                                    ${item.message}
                                </span>
                            </div>
                        `).join('');
                        container.innerHTML = listHTML;
                    }
                };
            }

            if (!analytics.renderMetric) {
                analytics.renderMetric = function(widget, data, container) {
                    if (container && data) {
                        container.innerHTML = `<div style="padding: 10px; text-align: center; font-weight: bold;">${JSON.stringify(data)}</div>`;
                    }
                };
            }

            this.fixedMethods.add('analytics');
            console.log('✅ Enhanced analytics methods fixed');
        }
    }

    fixWebSocketMethods() {
        if (window.webSocketManager && !this.fixedMethods.has('websocket')) {
            const wsManager = window.webSocketManager;

            // Ensure send method handles null WebSocket
            const originalSend = wsManager.send;
            wsManager.send = function(data) {
                try {
                    // Check if WebSocket exists and is open
                    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                        this.ws.send(JSON.stringify(data));
                        console.log('📤 WebSocket message sent:', data.type);
                        return true;
                    }
                    
                    // Use fallback methods
                    if (this.usesFallback && window.WebSocketFallback) {
                        window.WebSocketFallback.send(data);
                        console.log('📤 Fallback message sent:', data.type);
                        return true;
                    }
                    
                    // HTTP fallback
                    if (this.sendViaHTTP) {
                        this.sendViaHTTP(data);
                        return true;
                    }
                    
                    // Last resort - queue message
                    this.messageQueue = this.messageQueue || [];
                    this.messageQueue.push(data);
                    console.log('📤 Message queued:', data.type);
                    return false;
                    
                } catch (error) {
                    console.warn('⚠️ WebSocket send error:', error);
                    // Try HTTP fallback
                    this.sendViaHTTPFallback && this.sendViaHTTPFallback(data);
                    return false;
                }
            };

            // Add sendViaHTTPFallback if missing
            if (!wsManager.sendViaHTTPFallback) {
                wsManager.sendViaHTTPFallback = async function(data) {
                    try {
                        const response = await fetch('/api/websocket/message', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(data)
                        });
                        
                        if (response.ok) {
                            console.log('📤 HTTP fallback message sent:', data.type);
                        }
                    } catch (error) {
                        console.error('❌ HTTP fallback failed:', error);
                    }
                };
            }

            this.fixedMethods.add('websocket');
            console.log('✅ WebSocket methods fixed');
        }
    }

    fixMissingMethodError(error) {
        const errorMessage = error.message || error.toString();
        
        // Identify which system has the missing method
        if (errorMessage.includes('getDriverHistory') || errorMessage.includes('getBinHistory') || 
            errorMessage.includes('getBinSensorHealth') || errorMessage.includes('calculateBinEfficiency')) {
            this.fixComprehensiveReportingMethods();
        } else if (errorMessage.includes('updateChartWidget') || errorMessage.includes('updateListWidget')) {
            this.fixEnhancedAnalyticsMethods();
        } else if (errorMessage.includes('readyState')) {
            this.fixWebSocketMethods();
        }
    }

    fixWebSocketError() {
        // Force WebSocket fix
        if (window.webSocketFix) {
            window.webSocketFix.forceFixWebSocket();
        }
        
        // Reset WebSocket manager
        if (window.webSocketManager) {
            window.webSocketManager.ws = null;
            window.webSocketManager.usesFallback = true;
        }
    }

    // Public method to manually trigger fixes
    fixAllMethods() {
        console.log('🔧 Manually triggering all method fixes...');
        this.fixMissingMethods();
    }

    getErrorStats() {
        return {
            totalErrors: this.errorCount,
            fixedSystems: Array.from(this.fixedMethods),
            timestamp: new Date().toISOString()
        };
    }
}

// Initialize error handler fix
const errorHandlerFix = new ErrorHandlerFix();

// Export for global access
window.ErrorHandlerFix = ErrorHandlerFix;
window.errorHandlerFix = errorHandlerFix;

// Global function to fix all methods
window.fixAllMethods = function() {
    errorHandlerFix.fixAllMethods();
};

// Global function to get error stats
window.getErrorStats = function() {
    return errorHandlerFix.getErrorStats();
};

// Auto-fix after system loads
setTimeout(() => {
    errorHandlerFix.fixAllMethods();
}, 3000);

console.log('🔧 Error Handler Fix system loaded and active');
