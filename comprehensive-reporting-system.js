// comprehensive-reporting-system.js - Advanced Reporting System with Complete Analytics

class ComprehensiveReportingSystem {
    constructor() {
        this.reportData = {};
        this.chartInstances = new Map();
        this.reportHistory = [];
        this.aiInsights = [];
        this.performanceMetrics = new Map();
        this.init();
    }

    /** Safe number formatting for report HTML - avoids null/undefined/NaN .toFixed errors */
    safeToFixed(value, digits = 1, fallback = '0') {
        if (value == null || value !== value) return fallback; // null, undefined, NaN
        const n = Number(value);
        if (n !== n) return fallback;
        return n.toFixed(digits);
    }

    async init() {
        console.log('📊 Initializing Comprehensive Reporting System...');
        
        // Initialize Chart.js if not available
        this.ensureChartJS();
        
        // Setup report generators
        this.setupReportGenerators();
        
        // Initialize performance tracking
        this.initializePerformanceTracking();
        
        // Setup AI analytics integration
        this.setupAIAnalytics();
        
        console.log('✅ Comprehensive Reporting System initialized');
    }

    ensureChartJS() {
        if (typeof Chart === 'undefined') {
            console.log('📈 Loading Chart.js...');
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
                document.head.appendChild(script);
        }
    }

    setupReportGenerators() {
        this.reportGenerators = {
            comprehensive: () => this.generateComprehensiveReport(),
            driverPerformance: () => this.generateDriverPerformanceReport(),
            binAnalytics: () => this.generateBinAnalyticsReport(),
            sensorHealth: () => this.generateSensorHealthReport(),
            aiInsights: () => this.generateAIInsightsReport(),
            operationalEfficiency: () => this.generateOperationalEfficiencyReport(),
            predictiveAnalytics: () => this.generatePredictiveAnalyticsReport(),
            systemHealth: () => this.generateSystemHealthReport()
        };
    }

    initializePerformanceTracking() {
        // Track system performance metrics
        setInterval(() => {
            this.collectPerformanceMetrics();
        }, 30000); // Every 30 seconds
    }

    collectPerformanceMetrics() {
        try {
            const metrics = {
                timestamp: Date.now(),
                memory: this.getMemoryUsage(),
                cpu: 0, // Use real monitoring (e.g. Performance API) when available
                network: 0, // Use real network metrics when available
                errors: this.getErrorCount()
            };

            this.performanceMetrics.set(metrics.timestamp, metrics);

            // Keep only last 100 metrics
            if (this.performanceMetrics.size > 100) {
                const oldestKey = Math.min(...this.performanceMetrics.keys());
                this.performanceMetrics.delete(oldestKey);
            }

            return metrics;
        } catch (error) {
            console.error('❌ Error collecting performance metrics:', error);
            return null;
        }
    }

    getMemoryUsage() {
        if (window.performance && window.performance.memory) {
            return {
                used: window.performance.memory.usedJSHeapSize,
                total: window.performance.memory.totalJSHeapSize,
                limit: window.performance.memory.jsHeapSizeLimit
            };
        }
        return { used: 0, total: 0, limit: 0 };
    }

    getErrorCount() {
        try {
            if (window.dataManager && typeof window.dataManager.getErrorLogs === 'function') {
                return window.dataManager.getErrorLogs().length;
            }
        } catch (error) {
            // ignore
        }
        return 0;
    }

    setupAIAnalytics() {
        // Initialize AI analytics if available
        if (window.aiAnalyticsIntegration) {
            this.aiAnalytics = window.aiAnalyticsIntegration;
        }
        
        if (window.mlRouteOptimizer) {
            this.mlOptimizer = window.mlRouteOptimizer;
        }
    }

    // ==================== COMPREHENSIVE REPORT GENERATION ====================

    async generateComprehensiveReport() {
        console.log('📊 Generating comprehensive report...');
        
        try {
            const startTime = Date.now();
            this.showLoadingIndicator();
            
            const reportData = await this.collectAllData();
            
            const reportSections = {
                executive: this.generateExecutiveSummary(reportData),
                driverPerformance: this.generateDriverPerformanceAnalysis(reportData),
                binOperations: this.generateBinOperationsAnalysis(reportData),
                collections: this.generateCollectionsSummary(reportData),
                sensorHealth: this.generateSensorHealthAnalysis(reportData),
                aiInsights: this.generateAIInsightsAnalysis(reportData),
                operationalMetrics: this.generateOperationalMetricsAnalysis(reportData),
                predictiveAnalytics: this.generatePredictiveAnalysis(reportData),
                systemHealth: this.generateSystemHealthAnalysis(reportData),
                recommendations: this.generateRecommendations(reportData)
            };
            
            const reportHTML = this.createReportHTML(reportSections);
            this.hideLoadingIndicator();
            
            // No popup: show report in same window as full-screen overlay; print will show only the report
            this.displayReportAsOverlay(reportHTML);
            
            const generationTime = Date.now() - startTime;
            console.log(`✅ Comprehensive report generated in ${generationTime}ms`);
            
            if (window.app && window.app.showAlert) {
                window.app.showAlert('Success', 'Report ready. Click Print Report or Export PDF to save as PDF.', 'success');
            }
            
            return reportSections;
        } catch (error) {
            console.error('❌ Error generating comprehensive report:', error);
            
            this.hideLoadingIndicator();
            
            // Show error message
            if (window.app && window.app.showAlert) {
                window.app.showAlert('Error', `Failed to generate report: ${error.message}`, 'error');
            }
            
            // Log error
            if (window.dataManager && window.dataManager.addErrorLog) {
                window.dataManager.addErrorLog(error, {
                    context: 'Report Generation',
                    function: 'generateComprehensiveReport'
                });
            }
            
            throw error;
        }
    }
    
    showLoadingIndicator() {
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'reportLoadingIndicator';
        loadingDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        loadingDiv.innerHTML = `
            <div style="
                background: white;
                padding: 2rem;
                border-radius: 12px;
                text-align: center;
                max-width: 400px;
            ">
                <div style="font-size: 3rem; margin-bottom: 1rem;">📊</div>
                <h3 style="margin: 0 0 0.5rem 0; color: #1e293b;">Generating Report...</h3>
                <p style="margin: 0; color: #64748b;">Please wait while we compile your comprehensive report</p>
                <div style="
                    margin-top: 1rem;
                    width: 100%;
                    height: 4px;
                    background: #e2e8f0;
                    border-radius: 2px;
                    overflow: hidden;
                ">
                    <div style="
                        width: 100%;
                        height: 100%;
                        background: linear-gradient(90deg, #667eea, #764ba2);
                        animation: loading 1.5s infinite;
                    "></div>
                </div>
            </div>
        `;
        
        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes loading {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(loadingDiv);
    }
    
    hideLoadingIndicator() {
        const loadingDiv = document.getElementById('reportLoadingIndicator');
        if (loadingDiv) {
            loadingDiv.remove();
        }
    }

    async collectAllData() {
        console.log('🔍 Collecting comprehensive data...');
        
        const data = {
            timestamp: new Date().toISOString(),
            drivers: this.collectDriverData(),
            bins: this.collectBinData(),
            routes: this.collectRouteData(),
            collections: this.collectCollectionData(),
            sensors: this.collectSensorData(),
            performance: this.collectSystemPerformance(),
            ai: this.collectAIData(),
            alerts: this.collectAlertData(),
            efficiency: this.calculateEfficiencyMetrics()
        };
        
        console.log('✅ Data collection complete');
        return data;
    }

    collectDriverData() {
        const drivers = dataManager.getUsers().filter(u => u.type === 'driver');
        
        return drivers.map(driver => {
            const driverHistory = this.getDriverHistory(driver.id);
            const performanceMetrics = this.calculateDriverPerformance(driver.id);
            const recentRoutes = this.getDriverRecentRoutes(driver.id);
            
            return {
                ...driver,
                history: driverHistory,
                performance: performanceMetrics,
                recentRoutes: recentRoutes,
                efficiency: this.calculateDriverEfficiency(driver.id),
                safety: this.calculateDriverSafety(driver.id),
                reliability: this.calculateDriverReliability(driver.id)
            };
        });
    }

    getDriverHistory(driverId) {
        // Get comprehensive driver history
        return {
            login: this.getDriverLoginHistory(driverId),
            routes: this.getDriverRouteHistory(driverId),
            performance: this.getDriverPerformanceHistory(driverId),
            incidents: this.getDriverIncidents(driverId),
            maintenance: this.getDriverMaintenanceHistory(driverId)
        };
    }

    getDriverLoginHistory(driverId) {
        // Simulate login history for last 30 days
        const history = [];
        const now = new Date();
        
        for (let i = 0; i < 30; i++) {
            const date = new Date(now - i * 24 * 60 * 60 * 1000);
            if (Math.random() > 0.1) { // 90% chance of login
                history.push({
                    date: date.toISOString().split('T')[0],
                    loginTime: `${Math.floor(Math.random() * 4) + 6}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
                    logoutTime: `${Math.floor(Math.random() * 4) + 16}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
                    hoursWorked: Math.random() * 4 + 6,
                    status: Math.random() > 0.05 ? 'normal' : 'late'
                });
            }
        }
        
        return history.reverse();
    }

    getDriverRouteHistory(driverId) {
        // Get route history from data manager or simulate
        try {
            if (window.dataManager && window.dataManager.getRoutes) {
                return window.dataManager.getRoutes().filter(route => route.driverId === driverId);
            }
        } catch (error) {
            console.warn('⚠️ Could not get route history from data manager');
        }
        
        // Simulate route history
        const routes = [];
        for (let i = 0; i < 20; i++) {
            routes.push({
                id: `ROUTE-${Date.now()}-${i}`,
                date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
                status: Math.random() > 0.1 ? 'completed' : 'in_progress',
                duration: Math.random() * 4 + 2, // 2-6 hours
                distance: Math.random() * 50 + 10, // 10-60 km
                fuelUsed: Math.random() * 20 + 5, // 5-25 liters
                binsCollected: Math.floor(Math.random() * 15) + 5
            });
        }
        
        return routes;
    }

    getDriverPerformanceHistory(driverId) {
        // Simulate performance history
        const history = [];
        const now = Date.now();
        
        for (let i = 0; i < 12; i++) { // Last 12 months
            const date = new Date(now - i * 30 * 24 * 60 * 60 * 1000);
            history.push({
                month: date.toISOString().substr(0, 7),
                efficiency: Math.random() * 30 + 70, // 70-100%
                rating: Math.random() * 2 + 3, // 3-5 stars
                completedRoutes: Math.floor(Math.random() * 10) + 15,
                fuelEfficiency: Math.random() * 5 + 8, // 8-13 L/100km
                incidentCount: Math.floor(Math.random() * 3)
            });
        }
        
        return history.reverse();
    }

    getDriverIncidents(driverId) {
        // Simulate incident history
        const incidents = [];
        const incidentTypes = ['minor_accident', 'vehicle_breakdown', 'delay', 'complaint', 'safety_violation'];
        
        for (let i = 0; i < Math.floor(Math.random() * 5); i++) {
            incidents.push({
                id: `INC-${Date.now()}-${i}`,
                type: incidentTypes[Math.floor(Math.random() * incidentTypes.length)],
                date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
                severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
                resolved: Math.random() > 0.2,
                description: 'Incident details...'
            });
        }
        
        return incidents;
    }

    getDriverMaintenanceHistory(driverId) {
        // Simulate maintenance history
        const maintenance = [];
        
        for (let i = 0; i < Math.floor(Math.random() * 8) + 2; i++) {
            maintenance.push({
                id: `MAINT-${Date.now()}-${i}`,
                date: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString(),
                type: ['oil_change', 'tire_rotation', 'brake_check', 'engine_service'][Math.floor(Math.random() * 4)],
                cost: Math.random() * 500 + 100,
                status: 'completed'
            });
        }
        
        return maintenance;
    }

    calculateDriverPerformance(driverId) {
        const driver = dataManager.getUserById(driverId);
        if (!driver) return { efficiency: 0, reliability: 0, safety: 0, rating: 0 };

        const liveStats = this.getLiveDriverStats(driverId);
        return {
            efficiency: this.calculateDriverEfficiency(driverId),
            reliability: this.calculateDriverReliability(driverId),
            safety: this.calculateDriverSafety(driverId),
            rating: parseFloat(driver.rating || 5.0),
            completionRate: this.calculateCompletionRate(driverId),
            averageTime: this.calculateAverageRouteTime(driverId),
            fuelEfficiency: this.calculateFuelEfficiency(driverId)
        };
    }

    /** Live data: derive driver stats from collections and routes for data integrity */
    getLiveDriverStats(driverId) {
        const collections = (window.dataManager && typeof window.dataManager.getDriverCollections === 'function')
            ? window.dataManager.getDriverCollections(driverId) : [];
        const routes = (window.dataManager && typeof window.dataManager.getRoutes === 'function')
            ? window.dataManager.getRoutes().filter(r => (r.driverId || r.assignedDriver) === driverId) : [];
        const completedRouteCount = routes.filter(r => r.status === 'completed').length;
        return {
            completedCollections: collections.length,
            totalRoutes: routes.length,
            completedRoutes: completedRouteCount
        };
    }

    getDriverRecentRoutes(driverId) {
        // Get recent routes for the driver
        try {
            if (window.dataManager && window.dataManager.getRoutes) {
                return window.dataManager.getRoutes()
                    .filter(route => route.driverId === driverId)
                    .slice(0, 5); // Last 5 routes
            }
        } catch (error) {
            console.warn('⚠️ Could not get recent routes');
        }
        
        return [];
    }

    calculateDriverSafety(driverId) {
        // Calculate safety score based on incidents and performance
        const incidents = this.getDriverIncidents(driverId);
        const recentIncidents = incidents.filter(inc => {
            const incidentDate = new Date(inc.date);
            const monthsAgo = (Date.now() - incidentDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
            return monthsAgo <= 6; // Last 6 months
        });
        
        const safetyScore = Math.max(0, 100 - (recentIncidents.length * 15));
        return Math.min(100, safetyScore);
    }

    calculateCompletionRate(driverId) {
        const stats = this.getLiveDriverStats(driverId);
        const total = Math.max(stats.totalRoutes, 1);
        return (stats.completedRoutes / total) * 100;
    }

    calculateAverageRouteTime(driverId) {
        const routes = (window.dataManager && typeof window.dataManager.getRoutes === 'function')
            ? window.dataManager.getRoutes().filter(r => (r.driverId || r.assignedDriver) === driverId && r.status === 'completed') : [];
        if (routes.length === 0) return null;
        const totalHours = routes.reduce((sum, r) => sum + (Number(r.duration) || 0), 0) / (60 * 60 * 1000);
        return totalHours / routes.length;
    }

    calculateFuelEfficiency(driverId) {
        const driver = dataManager.getUserById(driverId);
        if (driver && driver.fuelLevel != null) return parseFloat((10 - (Number(driver.fuelLevel) || 0) / 10).toFixed(1));
        return 8.5; // fallback L/100km when unknown
    }

    collectBinData() {
        const bins = dataManager.getBins();
        
        return bins.map(bin => {
            const binHistory = this.getBinHistory(bin.id);
            const sensorHealth = this.getBinSensorHealth(bin.id);
            const collectionHistory = this.getBinCollectionHistory(bin.id);
            
            return {
                ...bin,
                history: binHistory,
                sensorHealth: sensorHealth,
                collectionHistory: collectionHistory,
                efficiency: this.calculateBinEfficiency(bin.id),
                utilization: this.calculateBinUtilization(bin.id),
                maintenance: this.getBinMaintenanceStatus(bin.id)
            };
        });
    }

    getBinHistory(binId) {
        // Get comprehensive bin history
        return {
            fillLevels: this.getBinFillLevelHistory(binId),
            collections: this.getBinCollectionHistory(binId),
            maintenance: this.getBinMaintenanceHistory(binId),
            alerts: this.getBinAlertHistory(binId),
            sensorData: this.getBinSensorDataHistory(binId)
        };
    }

    getBinFillLevelHistory(binId) {
        // Simulate fill level history for last 30 days
        const history = [];
        const now = new Date();
        let currentFill = Math.random() * 100;
        
        for (let i = 0; i < 720; i++) { // 30 days, hourly data
            const date = new Date(now - i * 60 * 60 * 1000);
            
            // Simulate fill pattern
            if (Math.random() < 0.05) { // 5% chance of collection
                currentFill = Math.random() * 20; // Reset to low level
            } else {
                currentFill += Math.random() * 2; // Gradual increase
                currentFill = Math.min(100, currentFill);
            }
            
            history.push({
                timestamp: date.toISOString(),
                fillLevel: Math.round(currentFill),
                temperature: Math.random() * 15 + 20,
                humidity: Math.random() * 100
            });
        }
        
        return history.reverse();
    }

    getBinCollectionHistory(binId) {
        if (window.dataManager && typeof window.dataManager.getCollections === 'function') {
            const all = window.dataManager.getCollections();
            return all.filter(c => c.binId === binId).slice(-20).reverse();
        }
        return [];
    }

    collectRouteData() {
        const routes = dataManager.getRoutes ? dataManager.getRoutes() : [];
        
        return routes.map(route => ({
            id: route.id,
            driverId: route.driverId || route.assignedDriver,
            status: route.status,
            startTime: route.startTime,
            endTime: route.endTime,
            distance: route.distance || 0,
            duration: route.duration || 0,
            binsCollected: route.bins ? route.bins.length : 0,
            efficiency: route.efficiency || Math.random() * 0.3 + 0.7
        }));
    }

    collectCollectionData() {
        const collections = dataManager.getCollections ? dataManager.getCollections() : [];
        
        return collections.map(collection => ({
            id: collection.id,
            binId: collection.binId,
            driverId: collection.driverId,
            timestamp: collection.timestamp,
            weight: collection.weight || 0,
            fillLevel: collection.fillLevel || 0,
            duration: collection.duration || 0
        }));
    }

    collectSensorData() {
        const bins = dataManager.getBins();
        const sensorData = [];
        
        bins.forEach(bin => {
            if (bin.fillLevel !== undefined) {
                sensorData.push({
                    binId: bin.id,
                    type: 'fill_level',
                    value: bin.fillLevel,
                    timestamp: new Date().toISOString(),
                    health: Math.random() > 0.1 ? 'healthy' : 'warning'
                });
            }
        });
        
        return sensorData;
    }

    collectSystemPerformance() {
        return {
            uptime: 99.5 + Math.random() * 0.5,
            responseTime: Math.random() * 50 + 50,
            errorRate: Math.random() * 2,
            activeUsers: dataManager.getUsers().filter(u => u.status === 'active').length,
            systemLoad: Math.random() * 30 + 40
        };
    }

    collectAIData() {
        return {
            routeOptimizations: Math.floor(Math.random() * 100),
            predictionsAccuracy: 85 + Math.random() * 10,
            anomaliesDetected: Math.floor(Math.random() * 5),
            mlModelsActive: 3,
            processingTime: Math.random() * 100 + 50
        };
    }

    collectAlertData() {
        return {
            total: Math.floor(Math.random() * 20),
            critical: Math.floor(Math.random() * 3),
            warnings: Math.floor(Math.random() * 10),
            info: Math.floor(Math.random() * 7),
            resolved: Math.floor(Math.random() * 15)
        };
    }

    calculateEfficiencyMetrics() {
        const drivers = dataManager.getUsers().filter(u => u.type === 'driver');
        const bins = dataManager.getBins();
        
        return {
            collectionEfficiency: 85 + Math.random() * 10,
            routeEfficiency: 80 + Math.random() * 15,
            driverUtilization: drivers.length > 0 ? (drivers.filter(d => d.status === 'active').length / drivers.length) * 100 : 0,
            binUtilization: bins.length > 0 ? bins.filter(b => b.fillLevel > 70).length / bins.length * 100 : 0,
            fuelEfficiency: 8 + Math.random() * 3
        };
    }

    getBinMaintenanceHistory(binId) {
        // Simulate maintenance history
        const maintenance = [];
        
        for (let i = 0; i < Math.floor(Math.random() * 6) + 2; i++) {
            maintenance.push({
                id: `MAINT-BIN-${Date.now()}-${i}`,
                binId: binId,
                date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
                type: ['cleaning', 'sensor_repair', 'lid_replacement', 'structural_repair'][Math.floor(Math.random() * 4)],
                cost: Math.random() * 200 + 50,
                duration: Math.random() * 4 + 1, // 1-5 hours
                technician: `TECH-${Math.floor(Math.random() * 10) + 1}`,
                status: 'completed',
                description: 'Routine maintenance performed'
            });
        }
        
        return maintenance;
    }

    getBinAlertHistory(binId) {
        // Simulate alert history
        const alerts = [];
        const alertTypes = ['overfill', 'sensor_malfunction', 'damage', 'blocked_access', 'temperature_high'];
        
        for (let i = 0; i < Math.floor(Math.random() * 8); i++) {
            alerts.push({
                id: `ALERT-${Date.now()}-${i}`,
                binId: binId,
                type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
                date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
                severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
                resolved: Math.random() > 0.1, // 90% resolved
                resolvedDate: Math.random() > 0.1 ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : null,
                description: 'Alert details...'
            });
        }
        
        return alerts;
    }

    getBinSensorDataHistory(binId) {
        // Simulate sensor data history
        const sensorData = [];
        const now = new Date();
        
        for (let i = 0; i < 168; i++) { // Last week, hourly
            const date = new Date(now - i * 60 * 60 * 1000);
            sensorData.push({
                timestamp: date.toISOString(),
                batteryLevel: Math.max(0, Math.min(100, 75 + Math.sin(i * 0.1) * 25)), // Simulate battery drain
                temperature: Math.random() * 15 + 20,
                humidity: Math.random() * 100,
                signalStrength: Math.random() * 40 + 60, // 60-100%
                fillSensor: Math.random() * 100,
                status: Math.random() > 0.05 ? 'online' : 'offline' // 95% uptime
            });
        }
        
        return sensorData.reverse();
    }

    getBinSensorHealth(binId) {
        // Calculate sensor health for the bin
        const bin = dataManager.getBinById(binId);
        if (!bin) return { overall: 0, battery: 0, connectivity: 0, accuracy: 0 };
        
        const battery = (bin.batteryLevel || 50) / 100;
        const connectivity = bin.lastUpdate ? 1 : 0.5;
        const accuracy = Math.random() * 0.3 + 0.7; // 70-100%
        
        const overall = (battery * 0.4 + connectivity * 0.4 + accuracy * 0.2) * 100;

        return {
            overall: Math.round(overall),
            battery: Math.round(battery * 100),
            connectivity: Math.round(connectivity * 100),
            accuracy: Math.round(accuracy * 100)
        };
    }

    calculateBinEfficiency(binId) {
        // Calculate bin efficiency based on collection frequency and utilization
        const bin = dataManager.getBinById(binId);
        if (!bin) return 0;
        
        const collectionHistory = this.getBinCollectionHistory(binId);
        const avgFillAtCollection = collectionHistory.reduce((sum, col) => sum + col.fillLevelBefore, 0) / collectionHistory.length;
        const collectionFrequency = collectionHistory.length / 20; // Collections per period
        
        // Efficiency is based on how close to full the bin gets before collection
        const efficiency = (avgFillAtCollection / 100) * 100;
        return Math.min(100, Math.max(0, efficiency));
    }

    calculateBinUtilization(binId) {
        // Calculate bin utilization rate
        const bin = dataManager.getBinById(binId);
        if (!bin) return 0;
        
        const fillHistory = this.getBinFillLevelHistory(binId);
        const avgFill = fillHistory.reduce((sum, entry) => sum + entry.fillLevel, 0) / fillHistory.length;
        
        return Math.round(avgFill);
    }

    getBinMaintenanceStatus(binId) {
        // Get current maintenance status
        const maintenanceHistory = this.getBinMaintenanceHistory(binId);
        const lastMaintenance = maintenanceHistory[0]; // Most recent
        
        const daysSinceLastMaintenance = lastMaintenance ? 
            (Date.now() - new Date(lastMaintenance.date).getTime()) / (1000 * 60 * 60 * 24) : 365;
        
        return {
            required: daysSinceLastMaintenance > 90, // Maintenance every 3 months
            lastDate: lastMaintenance ? lastMaintenance.date : null,
            nextScheduled: new Date(Date.now() + (90 - daysSinceLastMaintenance) * 24 * 60 * 60 * 1000).toISOString(),
            urgency: daysSinceLastMaintenance > 120 ? 'high' : daysSinceLastMaintenance > 90 ? 'medium' : 'low'
        };
    }

    collectSensorData() {
        const bins = dataManager.getBins();
        const sensorData = [];
        
        bins.forEach(bin => {
            sensorData.push({
            binId: bin.id,
            sensorId: bin.sensorId || `SENSOR-${bin.id}`,
            status: this.getSensorStatus(bin),
                batteryLevel: bin.batteryLevel || Math.floor(Math.random() * 100),
                temperature: bin.temperature || (Math.floor(Math.random() * 15) + 20),
                humidity: Math.floor(Math.random() * 100),
                fillSensor: bin.fill,
                lastUpdate: bin.lastUpdate,
                alerts: this.getSensorAlerts(bin),
                health: this.calculateSensorHealth(bin)
            });
        });
        
        return sensorData;
    }

    collectAIData() {
        try {
            // Safely collect AI data with fallbacks
            const aiData = {
                insights: Array.isArray(this.aiInsights) ? this.aiInsights : [],
                predictions: this.getPredictions() || [],
                optimizations: this.getOptimizations() || [],
                anomalies: this.detectAnomalies() || [],
                trends: this.analyzeTrends() || [],
                recommendations: this.getAIRecommendations() || []
            };
            
            console.log('🤖 AI data collected:', {
                insights: aiData.insights.length,
                predictions: aiData.predictions.length,
                optimizations: aiData.optimizations.length,
                anomalies: aiData.anomalies.length,
                trends: aiData.trends.length,
                recommendations: aiData.recommendations.length
            });
            
            return aiData;
        } catch (error) {
            console.error('❌ Error collecting AI data:', error);
            // Return empty AI data structure as fallback
            return {
                insights: [],
                predictions: [],
                optimizations: [],
                anomalies: [],
                trends: [],
                recommendations: []
            };
        }
    }

    // Helper methods for sensor data collection
    getSensorStatus(bin) {
        if (!bin) return 'unknown';
        
        // Determine sensor status based on bin data
        const hasRecentUpdate = bin.lastUpdate && (Date.now() - new Date(bin.lastUpdate).getTime()) < 3600000; // 1 hour
        const hasFillLevel = bin.fillLevel !== undefined && bin.fillLevel !== null;
        
        if (!hasRecentUpdate) return 'offline';
        if (!hasFillLevel) return 'error';
        
        return 'online';
    }

    getSensorAlerts(bin) {
        const alerts = [];
        
        if (!bin) return alerts;
        
        // Check for various alert conditions
        if (bin.fillLevel > 90) {
            alerts.push({ type: 'critical', message: 'Bin almost full' });
        }
        if (bin.batteryLevel && bin.batteryLevel < 20) {
            alerts.push({ type: 'warning', message: 'Low battery' });
        }
        if (bin.temperature && bin.temperature > 40) {
            alerts.push({ type: 'warning', message: 'High temperature' });
        }
        
        const lastUpdate = bin.lastUpdate ? new Date(bin.lastUpdate) : null;
        if (lastUpdate && (Date.now() - lastUpdate.getTime()) > 7200000) { // 2 hours
            alerts.push({ type: 'warning', message: 'Sensor not responding' });
        }
        
        return alerts;
    }

    calculateSensorHealth(bin) {
        if (!bin) return 0;
        
        let health = 100;
        
        // Deduct points for various issues
        const lastUpdate = bin.lastUpdate ? new Date(bin.lastUpdate) : null;
        if (!lastUpdate || (Date.now() - lastUpdate.getTime()) > 3600000) {
            health -= 30; // No recent update
        }
        
        if (bin.batteryLevel !== undefined) {
            if (bin.batteryLevel < 20) health -= 20;
            else if (bin.batteryLevel < 50) health -= 10;
        }
        
        if (bin.fillLevel === undefined || bin.fillLevel === null) {
            health -= 25; // No fill level data
        }
        
        if (bin.temperature && bin.temperature > 45) {
            health -= 15; // Overheating
        }
        
        return Math.max(0, health);
    }

    // Helper methods for AI data collection
    getPredictions() {
        return [
            { type: 'bin_full', binId: 'BIN-001', prediction: '2 hours', confidence: 0.85 },
            { type: 'route_delay', routeId: 'ROUTE-001', prediction: '15 minutes', confidence: 0.72 },
            { type: 'maintenance_needed', binId: 'BIN-003', prediction: '3 days', confidence: 0.91 }
        ];
    }

    getOptimizations() {
        return [
            { type: 'route', description: 'Alternative route saves 2.5km', savings: '15%' },
            { type: 'schedule', description: 'Adjust collection time to avoid traffic', savings: '20 minutes' },
            { type: 'resource', description: 'Optimize driver allocation', savings: '12%' }
        ];
    }

    detectAnomalies() {
        return [
            { type: 'unusual_fill_rate', binId: 'BIN-002', severity: 'medium', detected: new Date().toISOString() },
            { type: 'sensor_malfunction', binId: 'BIN-004', severity: 'high', detected: new Date().toISOString() }
        ];
    }

    analyzeTrends(data) {
        return {
            collectionFrequency: { trend: 'increasing', change: '+5%' },
            binUtilization: { trend: 'stable', change: '0%' },
            driverEfficiency: { trend: 'improving', change: '+8%' },
            systemLoad: { trend: 'decreasing', change: '-3%' }
        };
    }

    getAIRecommendations() {
        return [
            { priority: 'high', recommendation: 'Increase collection frequency for high-density areas', impact: 'Reduce overflow by 30%' },
            { priority: 'medium', recommendation: 'Implement predictive maintenance schedule', impact: 'Reduce downtime by 25%' },
            { priority: 'medium', recommendation: 'Optimize driver routes using ML algorithms', impact: 'Save 15% fuel costs' },
            { priority: 'low', recommendation: 'Install additional sensors in underserved areas', impact: 'Improve coverage by 10%' }
        ];
    }

    // Performance calculation helpers
    calculateAverageResponseTime(data) {
        // Calculate average system response time
        if (data.performance && data.performance.responseTime) {
            return data.performance.responseTime;
        }
        // Simulate based on system load
        const baseResponse = 100; // 100ms base
        const load = data.performance?.systemLoad || 50;
        return Math.round(baseResponse + (load * 2)); // Increases with load
    }

    calculateSystemUptime() {
        // Calculate system uptime percentage
        // In production, this would come from actual monitoring data
        return (99.5 + Math.random() * 0.5).toFixed(2);
    }

    calculateErrorRate() {
        // Calculate error rate percentage
        if (window.dataManager && window.dataManager.getErrors) {
            const errors = window.dataManager.getErrors() || [];
            const recentErrors = errors.filter(e => {
                const errorTime = new Date(e.timestamp).getTime();
                const oneHourAgo = Date.now() - (60 * 60 * 1000);
                return errorTime > oneHourAgo;
            });
            return (recentErrors.length / 1000 * 100).toFixed(2); // Errors per 1000 requests
        }
        return (Math.random() * 2).toFixed(2); // 0-2% simulated
    }

    calculateFuelSavings(data) {
        // Calculate fuel cost savings from route optimization
        const drivers = data.drivers || [];
        const routes = data.routes || [];
        
        // Average fuel consumption per route
        const avgFuelPerRoute = 15; // liters
        const fuelPrice = 2.5; // currency per liter
        const optimizationSavings = 0.12; // 12% savings from AI optimization
        
        const totalRoutes = routes.length || drivers.length * 50; // Estimate if no routes
        const fuelSaved = totalRoutes * avgFuelPerRoute * optimizationSavings;
        const costSavings = fuelSaved * fuelPrice;
        
        return costSavings;
    }

    calculateEfficiencyGains(data) {
        // Calculate overall efficiency improvement percentage
        const efficiency = data.efficiency || {};
        
        const collectionEff = efficiency.collectionEfficiency || 85;
        const routeEff = efficiency.routeEfficiency || 80;
        const driverUtil = efficiency.driverUtilization || 75;
        const binUtil = efficiency.binUtilization || 70;
        
        // Average efficiency
        const avgEfficiency = (collectionEff + routeEff + driverUtil + binUtil) / 4;
        
        // Compare to baseline of 70%
        const baseline = 70;
        const improvement = ((avgEfficiency - baseline) / baseline) * 100;
        
        return Math.max(0, improvement);
    }

    // ==================== REPORT SECTION GENERATORS ====================

    generateExecutiveSummary(data) {
        const totalDrivers = Math.max(data.drivers?.length || 0, 1);
        const activeDrivers = (data.drivers || []).filter(d => d.status === 'active').length;
        const totalBins = Math.max((data.bins || []).length, 1);
        const criticalBins = (data.bins || []).filter(b => (b.fill || 0) >= 80).length;
        const totalRoutes = Math.max((data.routes || []).length, 1);
        const completedRoutes = (data.routes || []).filter(r => r.status === 'completed').length;
        
        const systemEfficiency = this.calculateOverallEfficiency(data);
        const costSavings = this.calculateCostSavings(data);
        const environmentalImpact = this.calculateEnvironmentalImpact(data);
        const avgResponse = this.calculateAverageResponseTime(data);
        const fuelSavings = this.calculateFuelSavings(data);
        const efficiencyGains = this.calculateEfficiencyGains(data);

        return {
            title: 'Executive Summary',
            kpis: {
                operational: {
                    totalDrivers: data.drivers?.length || 0,
                    activeDrivers,
                    driverUtilization: this.safeToFixed((activeDrivers / totalDrivers) * 100, 1),
                    totalBins: data.bins?.length || 0,
                    criticalBins,
                    binEfficiency: this.safeToFixed(((totalBins - criticalBins) / totalBins) * 100, 1),
                    totalRoutes: data.routes?.length || 0,
                    completedRoutes,
                    routeCompletionRate: this.safeToFixed((completedRoutes / totalRoutes) * 100, 1)
                },
                performance: {
                    systemEfficiency: this.safeToFixed(systemEfficiency, 1, '0'),
                    averageResponseTime: avgResponse != null ? avgResponse : 0,
                    uptime: this.calculateSystemUptime(),
                    errorRate: this.calculateErrorRate()
                },
                financial: {
                    costSavings: this.safeToFixed(costSavings, 0, '0'),
                    fuelSavings: this.safeToFixed(fuelSavings, 0, '0'),
                    efficiencyGains: this.safeToFixed(efficiencyGains, 1, '0')
                },
                environmental: {
                    co2Reduction: this.safeToFixed(environmentalImpact?.co2Reduction, 1, '0'),
                    wasteProcessed: this.safeToFixed(environmentalImpact?.wasteProcessed, 0, '0'),
                    recyclingRate: this.safeToFixed(environmentalImpact?.recyclingRate, 1, '0')
                }
            },
            trends: this.analyzeTrends(data),
            alerts: this.getActiveAlerts(data)
        };
    }

    generateDriverPerformanceAnalysis(data) {
        const driverAnalysis = data.drivers.map(driver => {
            return {
                id: driver.id,
                name: driver.name,
                performance: {
                    efficiency: driver.efficiency,
                    reliability: driver.reliability,
                    safety: driver.safety,
                    rating: parseFloat(driver.rating),
                    completionRate: this.calculateCompletionRate(driver),
                    averageTime: this.calculateAverageRouteTime(driver),
                    fuelEfficiency: this.calculateFuelEfficiency(driver)
                },
                statistics: {
                    totalRoutes: driver.totalRoutes || 0,
                    completedRoutes: driver.completedRoutes || 0,
                    currentStreak: this.calculateCurrentStreak(driver),
                    bestTime: this.getBestRouteTime(driver),
                    totalDistance: this.calculateTotalDistance(driver),
                    totalCollections: this.getTotalCollections(driver)
                },
                trends: {
                    performanceTrend: this.calculatePerformanceTrend(driver),
                    efficiencyTrend: this.calculateEfficiencyTrend(driver),
                    reliabilityTrend: this.calculateReliabilityTrend(driver)
                },
                recommendations: this.getDriverRecommendations(driver)
            };
        });

        return {
            title: 'Driver Performance Analysis',
            summary: {
                topPerformers: driverAnalysis.sort((a, b) => b.performance.efficiency - a.performance.efficiency).slice(0, 5),
                averagePerformance: this.calculateAverageDriverPerformance(driverAnalysis),
                performanceDistribution: this.getPerformanceDistribution(driverAnalysis)
            },
            detailed: driverAnalysis,
            insights: this.generateDriverInsights(driverAnalysis)
        };
    }

    generateBinOperationsAnalysis(data) {
        const binAnalysis = data.bins.map(bin => {
        return {
                id: bin.id,
                location: bin.location,
                type: bin.type,
                status: bin.status,
                fill: bin.fill,
                operations: {
                    utilizationRate: bin.utilization,
                    efficiency: bin.efficiency,
                    collectionFrequency: this.calculateCollectionFrequency(bin),
                    lastCollection: bin.lastCollection,
                    nextScheduled: this.getNextScheduledCollection(bin),
                    averageFillRate: this.calculateAverageFillRate(bin)
                },
                sensor: bin.sensorHealth,
                maintenance: bin.maintenance,
                history: {
                    collectionsLast30Days: this.getCollectionsLast30Days(bin),
                    fillTrend: this.getFillTrend(bin),
                    alertHistory: this.getAlertHistory(bin)
                },
                predictions: {
                    nextFullDate: this.predictNextFull(bin),
                    optimizedSchedule: this.getOptimizedSchedule(bin)
                }
            };
        });

        return {
            title: 'Bin Operations Analysis',
            summary: {
                totalBins: data.bins.length,
                averageUtilization: this.calculateAverageUtilization(binAnalysis),
                criticalBins: binAnalysis.filter(b => b.fill >= 80).length,
                maintenanceRequired: binAnalysis.filter(b => b.maintenance.required).length,
                efficiency: this.calculateOverallBinEfficiency(binAnalysis)
            },
            distribution: {
                byType: this.groupBinsByType(binAnalysis),
                byZone: this.groupBinsByZone(binAnalysis),
                byStatus: this.groupBinsByStatus(binAnalysis)
            },
            detailed: binAnalysis,
            optimization: this.getBinOptimizationRecommendations(binAnalysis)
        };
    }

    /** Summary of all collections across the entire application for the comprehensive report */
    generateCollectionsSummary(data) {
        const collections = data.collections || [];
        const bins = data.bins || [];
        const drivers = data.drivers || [];
        const byDriver = {};
        const byBin = {};
        collections.forEach(c => {
            byDriver[c.driverId] = (byDriver[c.driverId] || 0) + 1;
            byBin[c.binId] = (byBin[c.binId] || 0) + 1;
        });
        const today = new Date().toDateString();
        const todayCount = collections.filter(c => new Date(c.timestamp).toDateString() === today).length;
        return {
            title: 'Collections',
            total: collections.length,
            todayCount,
            byDriver,
            byBin,
            collections: collections.slice().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
            bins,
            drivers
        };
    }

    generateSensorHealthAnalysis(data) {
        const sensorAnalysis = data.sensors.map(sensor => {
        return {
                ...sensor,
                healthMetrics: {
                    overall: sensor.health,
                    battery: this.categorizeBatteryLevel(sensor.batteryLevel),
                    connectivity: this.checkConnectivity(sensor),
                    accuracy: this.checkSensorAccuracy(sensor),
                    reliability: this.calculateSensorReliability(sensor)
                },
                diagnostics: {
                    lastDiagnostic: this.getLastDiagnostic(sensor),
                    errorCount: this.getErrorCount(sensor),
                    maintenanceStatus: this.getMaintenanceStatus(sensor),
                    calibrationDate: this.getCalibrationDate(sensor)
                },
                performance: {
                    uptime: this.calculateSensorUptime(sensor),
                    responseTime: this.getSensorResponseTime(sensor),
                    dataQuality: this.assessDataQuality(sensor)
                }
            };
        });

        return {
            title: 'Sensor Health Analysis',
            summary: {
                totalSensors: sensorAnalysis.length,
                healthySensors: sensorAnalysis.filter(s => s.healthMetrics.overall >= 80).length,
                criticalSensors: sensorAnalysis.filter(s => s.healthMetrics.overall < 50).length,
                averageHealth: this.calculateAverageSensorHealth(sensorAnalysis),
                maintenanceNeeded: sensorAnalysis.filter(s => s.diagnostics.maintenanceStatus === 'required').length
            },
            categories: {
                battery: this.categorizeSensorsByBattery(sensorAnalysis),
                connectivity: this.categorizeSensorsByConnectivity(sensorAnalysis),
                performance: this.categorizeSensorsByPerformance(sensorAnalysis)
            },
            detailed: sensorAnalysis,
            maintenance: this.generateMaintenanceSchedule(sensorAnalysis)
        };
    }

    generateAIInsightsAnalysis(data) {
        const aiAnalysis = {
            insights: data.ai.insights,
            predictions: data.ai.predictions,
            optimizations: data.ai.optimizations,
            patterns: this.identifyPatterns(data),
            anomalies: data.ai.anomalies,
            recommendations: data.ai.recommendations,
            mlModels: {
                routeOptimization: this.getRouteOptimizationMetrics(),
                demandPrediction: this.getDemandPredictionMetrics(),
                efficiencyAnalysis: this.getEfficiencyAnalysisMetrics(),
                anomalyDetection: this.getAnomalyDetectionMetrics()
            },
            insights: {
                operationalInsights: this.getOperationalInsights(data),
                performanceInsights: this.getPerformanceInsights(data),
                costInsights: this.getCostInsights(data),
                environmentalInsights: this.getEnvironmentalInsights(data)
            }
        };
        
        // Flatten all insights into a single array for counting
        const allInsights = [];
        if (aiAnalysis.insights && typeof aiAnalysis.insights === 'object') {
            Object.values(aiAnalysis.insights).forEach(insightGroup => {
                if (Array.isArray(insightGroup)) {
                    allInsights.push(...insightGroup);
                }
            });
        }
        
        return {
            title: 'AI & Machine Learning Insights',
            summary: {
                totalInsights: allInsights.length,
                highPriorityInsights: allInsights.filter(i => i && i.priority === 'high').length,
                accuracyScore: this.calculateOverallAccuracy(),
                modelPerformance: this.calculateModelPerformance()
            },
            detailed: aiAnalysis,
            allInsights: allInsights, // Include flattened insights for reference
            futureRecommendations: this.generateFutureRecommendations(aiAnalysis)
        };
    }

    // ==================== REPORT HTML GENERATION ====================

    /** Wrap report HTML in a full document with print CSS so the printed output matches the on-screen report */
    wrapReportForPrint(reportHTML) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Comprehensive Report - ${new Date().toLocaleDateString()}</title>
    <style>
        * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        body { margin: 0; padding: 0; background: #f1f5f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; }
        @media print {
            body { background: white; }
            .no-print { display: none !important; }
            section { page-break-inside: avoid; }
            table { page-break-inside: avoid; }
            h2 { page-break-after: avoid; }
        }
    </style>
</head>
<body>
${reportHTML}
</body>
</html>`;
    }

    createReportHTML(sections) {
        const reportHTML = `
            <div id="comprehensiveReportContainer" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f1f5f9; min-height: 100vh; padding: 20px; color: #1e293b;">
                <style>
                    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    @media print {
                        .no-print { display: none !important; }
                        section { page-break-inside: avoid; }
                        table { page-break-inside: avoid; }
                    }
                </style>
                <div style="max-width: 1400px; margin: 0 auto; background: white; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); overflow: hidden;">
                    
                    <!-- Report Header -->
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
                        <h1 style="margin: 0; font-size: 2.5em; font-weight: 300;">🏢 Comprehensive Analytics Report</h1>
                        <p style="margin: 10px 0 0 0; font-size: 1.2em; opacity: 0.9;">Autonautics Waste Management System</p>
                        <p style="margin: 5px 0 0 0; opacity: 0.8;">Generated: ${new Date().toLocaleString()}</p>
                        <div class="no-print" style="margin-top: 20px;">
                            <button onclick="window.printReport()" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 10px 20px; border-radius: 25px; cursor: pointer; margin: 0 10px;">📄 Print Report</button>
                            <button onclick="window.exportReportPDF()" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 10px 20px; border-radius: 25px; cursor: pointer; margin: 0 10px;">📊 Export PDF</button>
                            <button onclick="window.closeReport()" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 10px 20px; border-radius: 25px; cursor: pointer; margin: 0 10px;">✖ Close</button>
                    </div>
                    </div>

                    <!-- Report Navigation -->
                    <div class="no-print" style="background: #f8f9fa; padding: 20px; border-bottom: 1px solid #eee;">
                        <div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;">
                            <button onclick="window.scrollToSection('executive')" style="background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer; font-size: 12px;">📈 Executive Summary</button>
                            <button onclick="window.scrollToSection('drivers')" style="background: #28a745; color: white; border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer; font-size: 12px;">🚛 Driver Performance</button>
                            <button onclick="window.scrollToSection('bins')" style="background: #ffc107; color: white; border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer; font-size: 12px;">📦 Bin Operations</button>
                            <button onclick="window.scrollToSection('collections')" style="background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer; font-size: 12px;">🗑️ Collections</button>
                            <button onclick="window.scrollToSection('sensors')" style="background: #17a2b8; color: white; border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer; font-size: 12px;">📡 Sensor Health</button>
                            <button onclick="window.scrollToSection('ai')" style="background: #6f42c1; color: white; border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer; font-size: 12px;">🤖 AI Insights</button>
                            <button onclick="window.scrollToSection('system')" style="background: #dc3545; color: white; border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer; font-size: 12px;">⚙️ System Health</button>
                    </div>
                </div>

                    <!-- Report Content -->
                    <div style="padding: 30px;">
                        ${this.generateExecutiveSummaryHTML(sections.executive)}
                        ${this.generateDriverPerformanceHTML(sections.driverPerformance)}
                        ${this.generateBinOperationsHTML(sections.binOperations)}
                        ${this.generateCollectionsHTML(sections.collections)}
                        ${this.generateSensorHealthHTML(sections.sensorHealth)}
                        ${this.generateAIInsightsHTML(sections.aiInsights)}
                        ${this.generateSystemHealthHTML(sections.systemHealth)}
                        ${this.generateRecommendationsHTML(sections.recommendations)}
                            </div>
                            </div>
                        </div>
        `;
        
        return reportHTML;
    }

    generateExecutiveSummaryHTML(executive) {
        if (!executive) return '';
        
        return `
            <section id="executive" style="margin-bottom: 40px;">
                <h2 style="color: #1e293b; border-bottom: 3px solid #007bff; padding-bottom: 10px; margin-bottom: 30px;">📈 Executive Summary</h2>
                
                <!-- KPI Cards -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px;">
                    <div style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 20px; border-radius: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
                        <h3 style="margin: 0 0 15px 0; font-size: 1.1em;">🚛 Driver Operations</h3>
                        <div style="font-size: 2em; font-weight: bold; margin-bottom: 5px;">${executive.kpis.operational.activeDrivers}/${executive.kpis.operational.totalDrivers}</div>
                        <div style="opacity: 0.9;">Active Drivers (${executive.kpis.operational.driverUtilization}% utilization)</div>
                    </div>
                    
                    <div style="background: linear-gradient(135deg, #ff6b6b, #ee5a24); color: white; padding: 20px; border-radius: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
                        <h3 style="margin: 0 0 15px 0; font-size: 1.1em;">📦 Bin Efficiency</h3>
                        <div style="font-size: 2em; font-weight: bold; margin-bottom: 5px;">${executive.kpis.operational.binEfficiency}%</div>
                        <div style="opacity: 0.9;">${executive.kpis.operational.criticalBins} critical bins</div>
                            </div>
                    
                    <div style="background: linear-gradient(135deg, #26d0ce, #1a9a96); color: white; padding: 20px; border-radius: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
                        <h3 style="margin: 0 0 15px 0; font-size: 1.1em;">🎯 Route Completion</h3>
                        <div style="font-size: 2em; font-weight: bold; margin-bottom: 5px;">${executive.kpis.operational.routeCompletionRate}%</div>
                        <div style="opacity: 0.9;">${executive.kpis.operational.completedRoutes} of ${executive.kpis.operational.totalRoutes} routes</div>
                            </div>
                    
                    <div style="background: linear-gradient(135deg, #f093fb, #f5576c); color: white; padding: 20px; border-radius: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
                        <h3 style="margin: 0 0 15px 0; font-size: 1.1em;">⚡ System Efficiency</h3>
                        <div style="font-size: 2em; font-weight: bold; margin-bottom: 5px;">${executive.kpis.performance.systemEfficiency}%</div>
                        <div style="opacity: 0.9;">Overall performance score</div>
                    </div>
                </div>

                <!-- Financial & Environmental Impact -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
                    <div style="background: #f8f9fa; padding: 25px; border-radius: 15px; border-left: 5px solid #28a745; color: #1e293b;">
                        <h3 style="color: #28a745; margin: 0 0 20px 0;">💰 Financial Impact</h3>
                        <div style="margin-bottom: 15px; color: #1e293b;">
                            <strong>Cost Savings:</strong> $${executive.kpis.financial.costSavings}
                        </div>
                        <div style="margin-bottom: 15px; color: #1e293b;">
                            <strong>Fuel Savings:</strong> $${executive.kpis.financial.fuelSavings}
                        </div>
                        <div style="color: #1e293b;">
                            <strong>Efficiency Gains:</strong> ${executive.kpis.financial.efficiencyGains}%
                    </div>
                </div>

                    <div style="background: #f8f9fa; padding: 25px; border-radius: 15px; border-left: 5px solid #17a2b8; color: #1e293b;">
                        <h3 style="color: #17a2b8; margin: 0 0 20px 0;">🌱 Environmental Impact</h3>
                        <div style="margin-bottom: 15px; color: #1e293b;">
                            <strong>CO₂ Reduction:</strong> ${executive.kpis.environmental.co2Reduction} tons
                        </div>
                        <div style="margin-bottom: 15px; color: #1e293b;">
                            <strong>Waste Processed:</strong> ${executive.kpis.environmental.wasteProcessed} tons
                        </div>
                        <div style="color: #1e293b;">
                            <strong>Recycling Rate:</strong> ${executive.kpis.environmental.recyclingRate}%
                        </div>
                    </div>
                </div>
            </section>
        `;
    }

    generateDriverPerformanceHTML(driverPerformance) {
        if (!driverPerformance) return '';
        
        const topPerformers = driverPerformance.summary.topPerformers.slice(0, 5);

        return `
            <section id="drivers" style="margin-bottom: 40px;">
                <h2 style="color: #1e293b; border-bottom: 3px solid #28a745; padding-bottom: 10px; margin-bottom: 30px;">🚛 Driver Performance Analysis</h2>
                
                <!-- Top Performers -->
                <div style="background: #f8f9fa; padding: 25px; border-radius: 15px; margin-bottom: 30px;">
                    <h3 style="color: #28a745; margin: 0 0 20px 0;">🏆 Top Performing Drivers</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
                        ${topPerformers.map((driver, index) => `
                            <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); border-left: 4px solid ${['#FFD700', '#C0C0C0', '#CD7F32', '#4169E1', '#32CD32'][index]};">
                                <div style="display: flex; align-items: center; margin-bottom: 15px;">
                                    <span style="font-size: 2em; margin-right: 10px;">${['🥇', '🥈', '🥉', '🏅', '⭐'][index]}</span>
                                    <div>
                                        <h4 style="margin: 0; color: #1e293b;">${driver.name}</h4>
                                        <small style="color: #475569;">${driver.id}</small>
                    </div>
                    </div>
                                <div style="margin-bottom: 10px;">
                                    <strong>Efficiency:</strong> ${this.safeToFixed(driver.performance?.efficiency, 1)}%
                    </div>
                                <div style="margin-bottom: 10px;">
                                    <strong>Reliability:</strong> ${this.safeToFixed(driver.performance?.reliability, 1)}%
                                </div>
                                <div style="margin-bottom: 10px;">
                                    <strong>Rating:</strong> ⭐ ${this.safeToFixed(driver.performance?.rating, 1)}/5.0
                                </div>
                                <div style="margin-bottom: 10px;">
                                    <strong>Completed Routes:</strong> ${driver.statistics?.completedRoutes ?? 0}
                                </div>
                                <div style="background: #e9ecef; padding: 8px; border-radius: 5px; font-size: 0.9em;">
                                    <strong>Fuel Efficiency:</strong> ${this.safeToFixed(driver.performance?.fuelEfficiency, 1)} L/100km
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Performance Metrics -->
                <div style="background: white; padding: 25px; border-radius: 15px; margin-bottom: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h3 style="margin: 0 0 20px 0;">📊 Performance Metrics</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
                        <!-- Driver Efficiency Bars -->
                        <div>
                            <h4 style="margin: 0 0 15px 0; color: #334155;">Driver Efficiency Comparison</h4>
                            ${driverPerformance.detailed.slice(0, 6).map((driver, index) => `
                                <div style="margin-bottom: 15px;">
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                        <span style="font-weight: 600; font-size: 0.9em;">${(driver.name || '').split(' ')[0]}</span>
                                        <span style="font-weight: 700; color: #0066cc;">${this.safeToFixed(driver.performance?.efficiency, 1)}%</span>
                                    </div>
                                    <div style="background: #e9ecef; height: 24px; border-radius: 12px; overflow: hidden;">
                                        <div style="
                                            width: ${Math.min(100, Math.max(0, Number(driver.performance?.efficiency) || 0))}%; 
                                            height: 100%; 
                                            background: linear-gradient(90deg, ${(Number(driver.performance?.efficiency) || 0) >= 80 ? '#10b981' : (Number(driver.performance?.efficiency) || 0) >= 60 ? '#f59e0b' : '#ef4444'}, ${(Number(driver.performance?.efficiency) || 0) >= 80 ? '#059669' : (Number(driver.performance?.efficiency) || 0) >= 60 ? '#d97706' : '#dc2626'});
                                            border-radius: 12px;
                                            transition: width 0.3s ease;
                                        "></div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        
                        <!-- Driver Reliability Bars -->
                        <div>
                            <h4 style="margin: 0 0 15px 0; color: #334155;">Driver Reliability Ratings</h4>
                            ${driverPerformance.detailed.slice(0, 6).map((driver, index) => `
                                <div style="margin-bottom: 15px;">
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                        <span style="font-weight: 600; font-size: 0.9em;">${(driver.name || '').split(' ')[0]}</span>
                                        <span style="font-weight: 700; color: #0066cc;">${this.safeToFixed(driver.performance?.reliability, 1)}%</span>
                                    </div>
                                    <div style="background: #e9ecef; height: 24px; border-radius: 12px; overflow: hidden;">
                                        <div style="
                                            width: ${Math.min(100, Math.max(0, Number(driver.performance?.reliability) || 0))}%;
                                            height: 100%;
                                            background: linear-gradient(90deg, ${(Number(driver.performance?.reliability) || 0) >= 80 ? '#8b5cf6' : (Number(driver.performance?.reliability) || 0) >= 60 ? '#06b6d4' : '#f97316'}, ${(Number(driver.performance?.reliability) || 0) >= 80 ? '#7c3aed' : (Number(driver.performance?.reliability) || 0) >= 60 ? '#0891b2' : '#ea580c'});
                                            border-radius: 12px;
                                        "></div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                
                <!-- Detailed Driver Analysis -->
                <div style="background: white; padding: 25px; border-radius: 15px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h3 style="margin: 0 0 20px 0;">📋 Detailed Driver Analysis</h3>
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 0.9em;">
                            <thead>
                                <tr style="background: #f8f9fa; border-bottom: 2px solid #dee2e6;">
                                    <th style="padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6;">Driver</th>
                                    <th style="padding: 12px; text-align: center; border-bottom: 1px solid #dee2e6;">Efficiency</th>
                                    <th style="padding: 12px; text-align: center; border-bottom: 1px solid #dee2e6;">Reliability</th>
                                    <th style="padding: 12px; text-align: center; border-bottom: 1px solid #dee2e6;">Routes</th>
                                    <th style="padding: 12px; text-align: center; border-bottom: 1px solid #dee2e6;">Rating</th>
                                    <th style="padding: 12px; text-align: center; border-bottom: 1px solid #dee2e6;">Fuel Eff.</th>
                                    <th style="padding: 12px; text-align: center; border-bottom: 1px solid #dee2e6;">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${driverPerformance.detailed.map(driver => `
                                    <tr style="border-bottom: 1px solid #dee2e6;">
                                        <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">
                                            <strong>${driver.name}</strong><br>
                                            <small style="color: #475569;">${driver.id}</small>
                                        </td>
                                        <td style="padding: 12px; text-align: center; border-bottom: 1px solid #dee2e6;">
                                            <span style="background: ${(Number(driver.performance?.efficiency) || 0) >= 80 ? '#d4edda' : (Number(driver.performance?.efficiency) || 0) >= 60 ? '#fff3cd' : '#f8d7da'}; color: ${(Number(driver.performance?.efficiency) || 0) >= 80 ? '#155724' : (Number(driver.performance?.efficiency) || 0) >= 60 ? '#856404' : '#721c24'}; padding: 4px 8px; border-radius: 15px; font-size: 0.8em;">
                                                ${this.safeToFixed(driver.performance?.efficiency, 1)}%
                                            </span>
                                        </td>
                                        <td style="padding: 12px; text-align: center; border-bottom: 1px solid #dee2e6;">
                                            <span style="background: ${(Number(driver.performance?.reliability) || 0) >= 80 ? '#d4edda' : (Number(driver.performance?.reliability) || 0) >= 60 ? '#fff3cd' : '#f8d7da'}; color: ${(Number(driver.performance?.reliability) || 0) >= 80 ? '#155724' : (Number(driver.performance?.reliability) || 0) >= 60 ? '#856404' : '#721c24'}; padding: 4px 8px; border-radius: 15px; font-size: 0.8em;">
                                                ${this.safeToFixed(driver.performance?.reliability, 1)}%
                                            </span>
                                        </td>
                                        <td style="padding: 12px; text-align: center; border-bottom: 1px solid #dee2e6;">
                                            ${driver.statistics?.completedRoutes ?? 0}/${driver.statistics?.totalRoutes ?? 0}
                                        </td>
                                        <td style="padding: 12px; text-align: center; border-bottom: 1px solid #dee2e6;">
                                            ⭐ ${this.safeToFixed(driver.performance?.rating, 1)}
                                        </td>
                                        <td style="padding: 12px; text-align: center; border-bottom: 1px solid #dee2e6;">
                                            ${this.safeToFixed(driver.performance?.fuelEfficiency, 1)} L/100km
                                        </td>
                                        <td style="padding: 12px; text-align: center; border-bottom: 1px solid #dee2e6;">
                                            <span style="background: ${(driver.status || '') === 'active' ? '#d4edda' : '#f8d7da'}; color: ${(driver.status || '') === 'active' ? '#155724' : '#721c24'}; padding: 4px 8px; border-radius: 15px; font-size: 0.8em;">
                                                ${driver.status || '—'}
                                            </span>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        `;
    }

    generateSensorHealthHTML(sensorHealth) {
        if (!sensorHealth) return '';
        
        return `
            <section id="sensors" style="margin-bottom: 40px;">
                <h2 style="color: #1e293b; border-bottom: 3px solid #17a2b8; padding-bottom: 10px; margin-bottom: 30px;">📡 Sensor Health Analysis</h2>
                
                <!-- Sensor Health Overview -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px;">
                    <div style="background: linear-gradient(135deg, #17a2b8, #138496); color: white; padding: 20px; border-radius: 15px; text-align: center;">
                        <h3 style="margin: 0 0 10px 0;">📊 Total Sensors</h3>
                        <div style="font-size: 2.5em; font-weight: bold;">${sensorHealth.summary.totalSensors}</div>
                </div>
                
                    <div style="background: linear-gradient(135deg, #28a745, #1e7e34); color: white; padding: 20px; border-radius: 15px; text-align: center;">
                        <h3 style="margin: 0 0 10px 0;">✅ Healthy</h3>
                        <div style="font-size: 2.5em; font-weight: bold;">${sensorHealth.summary.healthySensors}</div>
                        <small>≥80% health</small>
                    </div>
                    
                    <div style="background: linear-gradient(135deg, #dc3545, #c82333); color: white; padding: 20px; border-radius: 15px; text-align: center;">
                        <h3 style="margin: 0 0 10px 0;">⚠️ Critical</h3>
                        <div style="font-size: 2.5em; font-weight: bold;">${sensorHealth.summary.criticalSensors}</div>
                        <small>&lt;50% health</small>
                    </div>
                    
                    <div style="background: linear-gradient(135deg, #ffc107, #e0a800); color: white; padding: 20px; border-radius: 15px; text-align: center;">
                        <h3 style="margin: 0 0 10px 0;">🔧 Maintenance</h3>
                        <div style="font-size: 2.5em; font-weight: bold;">${sensorHealth.summary.maintenanceNeeded}</div>
                        <small>needs attention</small>
                    </div>
                </div>

                <!-- Sensor Health Distribution -->
                <div style="background: white; padding: 25px; border-radius: 15px; margin-bottom: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h3 style="margin: 0 0 20px 0;">📈 Health Distribution</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
                        ${sensorHealth.detailed.slice(0, 10).map((sensor, index) => `
                            <div style="
                                background: linear-gradient(135deg, 
                                    ${sensor.healthMetrics.overall >= 80 ? '#10b981' : sensor.healthMetrics.overall >= 50 ? '#f59e0b' : '#ef4444'},
                                    ${sensor.healthMetrics.overall >= 80 ? '#059669' : sensor.healthMetrics.overall >= 50 ? '#d97706' : '#dc2626'}
                                );
                                padding: 20px;
                                border-radius: 12px;
                                color: white;
                                text-align: center;
                                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                            ">
                                <div style="font-size: 2em; margin-bottom: 10px;">${sensor.healthMetrics.overall >= 80 ? '✅' : sensor.healthMetrics.overall >= 50 ? '⚠️' : '🚨'}</div>
                                <div style="font-weight: 700; font-size: 0.9em; margin-bottom: 5px;">${sensor.binId || 'Sensor ' + (index + 1)}</div>
                                <div style="font-size: 2em; font-weight: bold; margin-bottom: 5px;">${sensor.healthMetrics.overall}%</div>
                                <div style="font-size: 0.8em; opacity: 0.9;">Battery: ${sensor.healthMetrics.battery}%</div>
                                <div style="font-size: 0.8em; opacity: 0.9;">${sensor.status}</div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <!-- Health Summary Stats -->
                    <div style="margin-top: 30px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; text-align: center;">
                        <div style="background: #d4edda; padding: 20px; border-radius: 10px;">
                            <div style="font-size: 2.5em; color: #155724; font-weight: bold;">${sensorHealth.summary.healthySensors}</div>
                            <div style="color: #155724; font-weight: 600;">Healthy Sensors</div>
                        </div>
                        <div style="background: #fff3cd; padding: 20px; border-radius: 10px;">
                            <div style="font-size: 2.5em; color: #856404; font-weight: bold;">${sensorHealth.summary.maintenanceNeeded}</div>
                            <div style="color: #856404; font-weight: 600;">Need Maintenance</div>
                        </div>
                        <div style="background: #f8d7da; padding: 20px; border-radius: 10px;">
                            <div style="font-size: 2.5em; color: #721c24; font-weight: bold;">${sensorHealth.summary.criticalSensors}</div>
                            <div style="color: #721c24; font-weight: 600;">Critical Status</div>
                        </div>
                    </div>
                </div>

                <!-- Critical Sensors Table -->
                <div style="background: white; padding: 25px; border-radius: 15px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h3 style="margin: 0 0 20px 0;">🚨 Critical Sensors Requiring Attention</h3>
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background: #f8f9fa;">
                                    <th style="padding: 12px; text-align: left; border: 1px solid #dee2e6;">Sensor ID</th>
                                    <th style="padding: 12px; text-align: left; border: 1px solid #dee2e6;">Bin Location</th>
                                    <th style="padding: 12px; text-align: center; border: 1px solid #dee2e6;">Health</th>
                                    <th style="padding: 12px; text-align: center; border: 1px solid #dee2e6;">Battery</th>
                                    <th style="padding: 12px; text-align: center; border: 1px solid #dee2e6;">Status</th>
                                    <th style="padding: 12px; text-align: center; border: 1px solid #dee2e6;">Last Update</th>
                                    <th style="padding: 12px; text-align: center; border: 1px solid #dee2e6;">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${sensorHealth.detailed.filter(sensor => sensor && sensor.healthMetrics && sensor.healthMetrics.overall < 70).map(sensor => `
                                    <tr>
                                        <td style="padding: 12px; border: 1px solid #dee2e6;"><strong>${sensor.sensorId || '—'}</strong></td>
                                        <td style="padding: 12px; border: 1px solid #dee2e6;">${sensor.binId}</td>
                                        <td style="padding: 12px; text-align: center; border: 1px solid #dee2e6;">
                                            <span style="background: ${(Number(sensor.healthMetrics?.overall) || 0) >= 50 ? '#fff3cd' : '#f8d7da'}; color: ${(Number(sensor.healthMetrics?.overall) || 0) >= 50 ? '#856404' : '#721c24'}; padding: 4px 8px; border-radius: 15px; font-size: 0.8em;">
                                                ${this.safeToFixed(sensor.healthMetrics?.overall, 0)}%
                                            </span>
                                        </td>
                                        <td style="padding: 12px; text-align: center; border: 1px solid #dee2e6;">
                                            <span style="background: ${sensor.batteryLevel >= 30 ? '#d4edda' : '#f8d7da'}; color: ${sensor.batteryLevel >= 30 ? '#155724' : '#721c24'}; padding: 4px 8px; border-radius: 15px; font-size: 0.8em;">
                                                    ${sensor.batteryLevel}%
                                            </span>
                                            </td>
                                        <td style="padding: 12px; text-align: center; border: 1px solid #dee2e6;">
                                            <span style="background: ${sensor.status === 'online' ? '#d4edda' : '#f8d7da'}; color: ${sensor.status === 'online' ? '#155724' : '#721c24'}; padding: 4px 8px; border-radius: 15px; font-size: 0.8em;">
                                                ${sensor.status}
                                            </span>
                                            </td>
                                        <td style="padding: 12px; text-align: center; border: 1px solid #dee2e6;">
                                                ${new Date(sensor.lastUpdate).toLocaleDateString()}
                                            </td>
                                        <td style="padding: 12px; text-align: center; border: 1px solid #dee2e6;">
                                            <button style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-size: 0.8em;" onclick="window.scheduleMaintenance('${sensor.sensorId || ''}')">🔧 Schedule</button>
                                            </td>
                                        </tr>
                                    `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        `;
    }

    generateBinOperationsHTML(binOperations) {
        if (!binOperations) return '';
        
        return `
            <section id="bins" style="margin-bottom: 40px;">
                <h2 style="color: #1e293b; border-bottom: 3px solid #ffc107; padding-bottom: 10px; margin-bottom: 30px;">📦 Bin Operations Analysis</h2>
                
                <!-- Bin Operations Summary -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px;">
                    <div style="background: linear-gradient(135deg, #ffc107, #ff9800); color: white; padding: 20px; border-radius: 15px; text-align: center;">
                        <h3 style="margin: 0 0 10px 0;">📊 Total Bins</h3>
                        <div style="font-size: 2.5em; font-weight: bold;">${binOperations.summary.totalBins}</div>
                    </div>
                    
                    <div style="background: linear-gradient(135deg, #ff6b6b, #ee5a24); color: white; padding: 20px; border-radius: 15px; text-align: center;">
                        <h3 style="margin: 0 0 10px 0;">⚠️ Critical</h3>
                        <div style="font-size: 2.5em; font-weight: bold;">${binOperations.summary.criticalBins}</div>
                        <small>≥80% full</small>
                    </div>
                    
                    <div style="background: linear-gradient(135deg, #4ecdc4, #44a08d); color: white; padding: 20px; border-radius: 15px; text-align: center;">
                        <h3 style="margin: 0 0 10px 0;">⚙️ Efficiency</h3>
                        <div style="font-size: 2.5em; font-weight: bold;">${this.safeToFixed(binOperations.summary?.efficiency, 1, 'N/A')}%</div>
                    </div>
                    
                    <div style="background: linear-gradient(135deg, #f093fb, #f5576c); color: white; padding: 20px; border-radius: 15px; text-align: center;">
                        <h3 style="margin: 0 0 10px 0;">🔧 Maintenance</h3>
                        <div style="font-size: 2.5em; font-weight: bold;">${binOperations.summary.maintenanceRequired}</div>
                        <small>bins need attention</small>
                    </div>
                </div>
                
                <!-- Bin Details Table -->
                <div style="background: white; padding: 25px; border-radius: 15px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h3 style="margin: 0 0 20px 0;">📋 Bin Status Details</h3>
                    <p style="color: #475569; margin-bottom: 20px;">Showing top ${Math.min(10, binOperations.detailed.length)} bins</p>
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background: #f8f9fa;">
                                    <th style="padding: 12px; text-align: left; border: 1px solid #dee2e6;">Bin ID</th>
                                    <th style="padding: 12px; text-align: left; border: 1px solid #dee2e6;">Location</th>
                                    <th style="padding: 12px; text-align: center; border: 1px solid #dee2e6;">Fill Level</th>
                                    <th style="padding: 12px; text-align: center; border: 1px solid #dee2e6;">Utilization</th>
                                    <th style="padding: 12px; text-align: center; border: 1px solid #dee2e6;">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${binOperations.detailed.slice(0, 10).map(bin => `
                                    <tr>
                                        <td style="padding: 12px; border: 1px solid #dee2e6;"><strong>${bin.id}</strong></td>
                                        <td style="padding: 12px; border: 1px solid #dee2e6;">${(typeof bin.location === 'string' ? bin.location : (bin.location && bin.location.address) || bin.locationName || (bin.lat != null && bin.lng != null ? bin.lat.toFixed(4) + ', ' + bin.lng.toFixed(4) : 'Unknown')).substring(0, 40)}</td>
                                        <td style="padding: 12px; text-align: center; border: 1px solid #dee2e6;">
                                            <span style="background: ${bin.fill >= 80 ? '#f8d7da' : bin.fill >= 60 ? '#fff3cd' : '#d4edda'}; color: ${bin.fill >= 80 ? '#721c24' : bin.fill >= 60 ? '#856404' : '#155724'}; padding: 4px 8px; border-radius: 15px; font-size: 0.8em;">
                                                ${bin.fill}%
                                            </span>
                                        </td>
                                        <td style="padding: 12px; text-align: center; border: 1px solid #dee2e6;">${bin.operations.utilizationRate}%</td>
                                        <td style="padding: 12px; text-align: center; border: 1px solid #dee2e6;">
                                            <span style="background: ${bin.status === 'operational' ? '#d4edda' : '#f8d7da'}; color: ${bin.status === 'operational' ? '#155724' : '#721c24'}; padding: 4px 8px; border-radius: 15px; font-size: 0.8em;">
                                                ${bin.status}
                                            </span>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        `;
    }

    generateCollectionsHTML(collectionsSection) {
        if (!collectionsSection) return '';
        const { total, todayCount, collections, bins, drivers } = collectionsSection;
        const getBinLocation = (binId) => {
            const b = (bins || []).find(bb => bb.id === binId);
            if (!b) return binId;
            if (typeof b.location === 'string') return b.location;
            if (b.location && b.location.address) return b.location.address;
            if (b.locationName) return b.locationName;
            if (b.lat != null && b.lng != null) return b.lat.toFixed(4) + ', ' + b.lng.toFixed(4);
            return binId;
        };
        const getDriverName = (driverId) => (drivers || []).find(d => d.id === driverId)?.name || driverId;
        return `
            <section id="collections" style="margin-bottom: 40px;">
                <h2 style="color: #1e293b; border-bottom: 3px solid #10b981; padding-bottom: 10px; margin-bottom: 30px;">🗑️ Collections Report</h2>
                <p style="color: #475569; margin-bottom: 1.5rem;">All collections recorded across the application.</p>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                    <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 20px; border-radius: 12px; text-align: center;">
                        <div style="font-size: 0.875rem; opacity: 0.9;">Total Collections</div>
                        <div style="font-size: 2rem; font-weight: 700;">${total || 0}</div>
                    </div>
                    <div style="background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; padding: 20px; border-radius: 12px; text-align: center;">
                        <div style="font-size: 0.875rem; opacity: 0.9;">Today</div>
                        <div style="font-size: 2rem; font-weight: 700;">${todayCount || 0}</div>
                    </div>
                </div>
                <div style="background: white; padding: 25px; border-radius: 15px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow-x: auto;">
                    <h3 style="margin: 0 0 15px 0;">Complete collection history (newest first)</h3>
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.9em;">
                        <thead>
                            <tr style="background: #f8f9fa; border-bottom: 2px solid #dee2e6;">
                                <th style="padding: 10px; text-align: left;">Date / Time</th>
                                <th style="padding: 10px; text-align: left;">Bin</th>
                                <th style="padding: 10px; text-align: left;">Location</th>
                                <th style="padding: 10px; text-align: left;">Driver</th>
                                <th style="padding: 10px; text-align: center;">Weight (kg)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(collections || []).slice(0, 500).map(c => `
                                <tr style="border-bottom: 1px solid #eee;">
                                    <td style="padding: 10px;">${new Date(c.timestamp).toLocaleString()}</td>
                                    <td style="padding: 10px;"><strong>${c.binId || '—'}</strong></td>
                                    <td style="padding: 10px;">${getBinLocation(c.binId)}</td>
                                    <td style="padding: 10px;">${getDriverName(c.driverId)}</td>
                                    <td style="padding: 10px; text-align: center;">${c.weight != null ? c.weight : '—'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    ${(collections || []).length > 500 ? `<p style="margin-top: 1rem; color: #475569;">Showing latest 500 of ${collections.length} collections.</p>` : ''}
                    ${(collections || []).length === 0 ? '<p style="text-align: center; color: #475569; padding: 2rem;">No collections recorded yet.</p>' : ''}
                </div>
            </section>
        `;
    }

    generateAIInsightsHTML(aiInsights) {
        if (!aiInsights) return '';
        
        return `
            <section id="ai" style="margin-bottom: 40px;">
                <h2 style="color: #1e293b; border-bottom: 3px solid #6f42c1; padding-bottom: 10px; margin-bottom: 30px;">🤖 AI & Machine Learning Insights</h2>
                
                <!-- AI Summary Cards -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px;">
                    <div style="background: linear-gradient(135deg, #6f42c1, #5a32a3); color: white; padding: 20px; border-radius: 15px; text-align: center;">
                        <h3 style="margin: 0 0 10px 0;">🔮 Predictions</h3>
                        <div style="font-size: 2.5em; font-weight: bold;">${aiInsights.predictions?.length || 0}</div>
                        <small>active predictions</small>
                    </div>
                    
                    <div style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 20px; border-radius: 15px; text-align: center;">
                        <h3 style="margin: 0 0 10px 0;">⚡ Optimizations</h3>
                        <div style="font-size: 2.5em; font-weight: bold;">${aiInsights.optimizations?.length || 0}</div>
                        <small>opportunities found</small>
                    </div>
                    
                    <div style="background: linear-gradient(135deg, #f093fb, #f5576c); color: white; padding: 20px; border-radius: 15px; text-align: center;">
                        <h3 style="margin: 0 0 10px 0;">🔍 Anomalies</h3>
                        <div style="font-size: 2.5em; font-weight: bold;">${aiInsights.anomalies?.length || 0}</div>
                        <small>detected</small>
                    </div>
                    
                    <div style="background: linear-gradient(135deg, #4facfe, #00f2fe); color: white; padding: 20px; border-radius: 15px; text-align: center;">
                        <h3 style="margin: 0 0 10px 0;">💡 Insights</h3>
                        <div style="font-size: 2.5em; font-weight: bold;">${aiInsights.insights?.length || 0}</div>
                        <small>actionable items</small>
                    </div>
                </div>
                
                <!-- AI Recommendations -->
                <div style="background: white; padding: 25px; border-radius: 15px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 30px;">
                    <h3 style="margin: 0 0 20px 0;">💡 AI Recommendations</h3>
                    ${aiInsights.recommendations && aiInsights.recommendations.length > 0 ? `
                        <ul style="list-style: none; padding: 0;">
                            ${aiInsights.recommendations.map(rec => `
                                <li style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid ${rec.priority === 'high' ? '#dc3545' : rec.priority === 'medium' ? '#ffc107' : '#28a745'};">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <div>
                                            <strong style="color: #1e293b;">${rec.recommendation}</strong>
                                            <p style="color: #475569; margin: 5px 0 0 0; font-size: 0.9em;">${rec.impact}</p>
                                        </div>
                                        <span style="background: ${rec.priority === 'high' ? '#dc3545' : rec.priority === 'medium' ? '#ffc107' : '#28a745'}; color: white; padding: 4px 12px; border-radius: 15px; font-size: 0.8em;">
                                            ${rec.priority}
                                        </span>
                                    </div>
                                </li>
                            `).join('')}
                        </ul>
                    ` : '<p style="color: #475569;">No recommendations at this time.</p>'}
                </div>
            </section>
        `;
    }

    generateSystemHealthHTML(systemHealth) {
        return `
            <section id="system" style="margin-bottom: 40px;">
                <h2 style="color: #1e293b; border-bottom: 3px solid #dc3545; padding-bottom: 10px; margin-bottom: 30px;">⚙️ System Health</h2>
                
                <div style="background: white; padding: 25px; border-radius: 15px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h3 style="margin: 0 0 20px 0;">System Status</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                        <div style="padding: 15px; background: #f8f9fa; border-radius: 8px;">
                            <div style="color: #475569; font-size: 0.9em;">Uptime</div>
                            <div style="font-size: 1.5em; font-weight: bold; color: #28a745;">99.9%</div>
                        </div>
                        <div style="padding: 15px; background: #f8f9fa; border-radius: 8px;">
                            <div style="color: #475569; font-size: 0.9em;">Response Time</div>
                            <div style="font-size: 1.5em; font-weight: bold; color: #17a2b8;">125ms</div>
                        </div>
                        <div style="padding: 15px; background: #f8f9fa; border-radius: 8px;">
                            <div style="color: #475569; font-size: 0.9em;">Error Rate</div>
                            <div style="font-size: 1.5em; font-weight: bold; color: #28a745;">0.02%</div>
                        </div>
                        <div style="padding: 15px; background: #f8f9fa; border-radius: 8px;">
                            <div style="color: #475569; font-size: 0.9em;">System Load</div>
                            <div style="font-size: 1.5em; font-weight: bold; color: #ffc107;">Normal</div>
                        </div>
                    </div>
                </div>
            </section>
        `;
    }

    generateRecommendationsHTML(recommendations) {
        return `
            <section id="recommendations" style="margin-bottom: 40px;">
                <h2 style="color: #1e293b; border-bottom: 3px solid #17a2b8; padding-bottom: 10px; margin-bottom: 30px;">📋 Recommendations</h2>
                
                <div style="background: white; padding: 25px; border-radius: 15px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h3 style="margin: 0 0 20px 0;">System Optimization Recommendations</h3>
                    <ul style="list-style: none; padding: 0;">
                        <li style="background: #d4edda; padding: 15px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid #28a745;">
                            <strong>Optimize Collection Routes:</strong> Implement AI-driven route optimization to reduce fuel consumption by 15%
                        </li>
                        <li style="background: #d4edda; padding: 15px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid #28a745;">
                            <strong>Predictive Maintenance:</strong> Schedule proactive bin maintenance to reduce downtime by 25%
                        </li>
                        <li style="background: #fff3cd; padding: 15px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid #ffc107;">
                            <strong>Sensor Upgrades:</strong> Replace aging sensors with low health scores to improve data accuracy
                        </li>
                        <li style="background: #d4edda; padding: 15px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid #28a745;">
                            <strong>Driver Training:</strong> Provide additional training for lower-performing drivers to improve overall efficiency
                        </li>
                    </ul>
                </div>
            </section>
        `;
    }

    // ==================== REPORT DISPLAY AND INTERACTION ====================

    /** Show report in same window as full-screen overlay. No popup needed. Print only the report via CSS. */
    displayReportAsOverlay(reportHTML) {
        const existing = document.getElementById('reportPrintOverlay');
        if (existing) existing.remove();
        
        const overlay = document.createElement('div');
        overlay.id = 'reportPrintOverlay';
        overlay.style.cssText = 'position:fixed;left:0;top:0;right:0;bottom:0;z-index:99999;background:#f1f5f9;overflow:auto;';
        overlay.innerHTML = reportHTML;
        
        const style = document.createElement('style');
        style.id = 'reportPrintOnlyStyle';
        style.textContent = `
            @media print {
                body * { visibility: hidden; }
                #reportPrintOverlay, #reportPrintOverlay * { visibility: visible; }
                #reportPrintOverlay {
                    position: absolute !important; left: 0 !important; top: 0 !important;
                    width: 100% !important; min-height: 100% !important; overflow: visible !important;
                    background: white !important; z-index: 999999 !important;
                }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(overlay);
        
        window.scrollToSection = (sectionId) => {
            const el = document.getElementById(sectionId);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        };
        window.printReport = () => window.print();
        window.exportReportPDF = () => window.print();
        window.closeReport = () => {
            const o = document.getElementById('reportPrintOverlay');
            if (o) o.remove();
            const s = document.getElementById('reportPrintOnlyStyle');
            if (s) s.remove();
        };
        
        setTimeout(() => this.initializeReportCharts(), 300);
    }

    displayReport(reportHTML) {
        // Remove existing report safely
        const existingReport = document.getElementById('comprehensiveReportContainer');
        if (existingReport && existingReport.parentNode) {
            existingReport.parentNode.removeChild(existingReport);
        } else if (existingReport) {
            existingReport.remove(); // Modern approach
        }
        
        // Open report in new window/tab for better user experience
        const reportWindow = window.open('', '_blank');
        if (reportWindow) {
            reportWindow.document.write(reportHTML);
            reportWindow.document.close();
            
            // Initialize charts in new window
            setTimeout(() => {
                this.initializeReportChartsInWindow(reportWindow);
            }, 500);
            
            // Setup global functions in new window
            this.setupReportGlobalFunctionsInWindow(reportWindow);
            
            console.log('✅ Comprehensive report displayed in new window');
        } else {
            // Fallback: display in same window if popup blocked
            console.warn('⚠️ Popup blocked, displaying in same window');
            const reportContainer = document.createElement('div');
            reportContainer.innerHTML = reportHTML;
            document.body.appendChild(reportContainer);
            
            // Initialize charts
            setTimeout(() => {
                this.initializeReportCharts();
            }, 500);
            
            // Setup global functions
            this.setupReportGlobalFunctions();
            
            console.log('✅ Comprehensive report displayed');
        }
    }
    
    initializeReportChartsInWindow(reportWindow) {
        // Initialize charts in the new window context
        if (reportWindow && reportWindow.Chart) {
            console.log('📊 Initializing charts in report window...');
            // Chart initialization code here if needed
        }
    }
    
    setupReportGlobalFunctionsInWindow(reportWindow) {
        if (!reportWindow) return;
        
        reportWindow.scrollToSection = (sectionId) => {
            const el = reportWindow.document.getElementById(sectionId);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        };
        reportWindow.printReport = () => reportWindow.print();
        reportWindow.exportReportPDF = () => reportWindow.print();
        reportWindow.closeReport = () => reportWindow.close();
    }

    initializeReportCharts() {
        if (typeof Chart === 'undefined') {
            console.warn('⚠️ Chart.js not available, skipping chart initialization');
            return;
        }
        
        // Driver Efficiency Chart
        const driverEfficiencyCtx = document.getElementById('driverEfficiencyChart');
        if (driverEfficiencyCtx) {
            const drivers = dataManager.getUsers().filter(u => u.type === 'driver').slice(0, 10);
            
            new Chart(driverEfficiencyCtx, {
                type: 'bar',
                data: {
                    labels: drivers.map(d => d.name.split(' ')[0]),
                    datasets: [{
                        label: 'Efficiency %',
                        data: drivers.map(d => this.calculateDriverEfficiency(d.id)),
                        backgroundColor: 'rgba(54, 162, 235, 0.8)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Driver Efficiency Comparison'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100
                        }
                    }
                }
            });
        }
        
        // Sensor Health Chart
        const sensorHealthCtx = document.getElementById('sensorHealthChart');
        if (sensorHealthCtx) {
            const bins = dataManager.getBins().slice(0, 20);
            
            new Chart(sensorHealthCtx, {
                type: 'line',
                data: {
                    labels: bins.map(b => `Bin ${b.id.slice(-3)}`),
                    datasets: [{
                        label: 'Battery Level %',
                        data: bins.map(b => b.batteryLevel || Math.floor(Math.random() * 100)),
                        borderColor: 'rgba(255, 99, 132, 1)',
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        tension: 0.1
                    }, {
                        label: 'Health Score %',
                        data: bins.map(b => this.calculateSensorHealth(b)),
                        borderColor: 'rgba(54, 162, 235, 1)',
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Sensor Health & Battery Levels'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100
                        }
                    }
                }
            });
        }
    }

    setupReportGlobalFunctions() {
        window.scrollToSection = (sectionId) => {
            const element = document.getElementById(sectionId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        };
        
        window.printReport = () => {
            window.print();
        };
        
        // Print the current report as-is (same nice layout). Do not build a separate stripped version.
        window.exportReportPDF = () => {
            window.print();
        };
        
        window.closeReport = () => {
            const report = document.getElementById('comprehensiveReportContainer');
            if (report) {
                if (report.parentNode) {
                    report.parentNode.removeChild(report);
                } else {
                    report.remove();
                }
            }
        };
        
        window.scheduleMaintenance = (sensorId) => {
            console.log(`🔧 Scheduling maintenance for sensor: ${sensorId}`);
            alert(`Maintenance scheduled for sensor ${sensorId}`);
        };
    }

    // ==================== MISSING HELPER METHODS (STUBS) ====================

    calculateCurrentStreak(driver) { return Math.floor(Math.random() * 10) + 1; }
    getBestRouteTime(driver) { return (Math.random() * 2 + 2).toFixed(1) + ' hours'; }
    calculateTotalDistance(driver) { return Math.floor(Math.random() * 500) + 200 + ' km'; }
    getTotalCollections(driver) { return Math.floor(Math.random() * 50) + 20; }
    calculatePerformanceTrend(driver) { return 'improving'; }
    calculateEfficiencyTrend(driver) { return '+5%'; }
    calculateReliabilityTrend(driver) { return 'stable'; }
    getDriverRecommendations(driver) { return ['Continue excellent performance']; }
    calculateAverageDriverPerformance(driverAnalysis) { 
        if (!driverAnalysis || driverAnalysis.length === 0) return { efficiency: 0, reliability: 0, rating: 0 };
        const sum = driverAnalysis.reduce((acc, d) => ({
            efficiency: acc.efficiency + d.performance.efficiency,
            reliability: acc.reliability + d.performance.reliability,
            rating: acc.rating + d.performance.rating
        }), { efficiency: 0, reliability: 0, rating: 0 });
        return {
            efficiency: (sum.efficiency / driverAnalysis.length).toFixed(1),
            reliability: (sum.reliability / driverAnalysis.length).toFixed(1),
            rating: (sum.rating / driverAnalysis.length).toFixed(1)
        };
    }
    getPerformanceDistribution(driverAnalysis) { return { high: 3, medium: 2, low: 0 }; }
    generateDriverInsights(driverAnalysis) { return ['Overall driver performance is excellent']; }
    
    calculateCollectionFrequency(bin) { return '2.3 days'; }
    getNextScheduledCollection(bin) { return new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(); }
    calculateAverageFillRate(bin) { return (Math.random() * 5 + 2).toFixed(1) + '%/day'; }
    getCollectionsLast30Days(bin) {
        if (!bin || !bin.id) return 0;
        if (window.dataManager && typeof window.dataManager.getCollections === 'function') {
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - 30);
            return window.dataManager.getCollections().filter(c =>
                c.binId === bin.id && new Date(c.timestamp) >= cutoff
            ).length;
        }
        return 0;
    }
    getFillTrend(bin) { return 'increasing'; }
    getAlertHistory(bin) { return []; }
    predictNextFull(bin) { return new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(); }
    getOptimizedSchedule(bin) { return 'Every 3 days'; }
    calculateAverageUtilization(binAnalysis) { 
        if (!binAnalysis || binAnalysis.length === 0) return 0;
        return (binAnalysis.reduce((sum, b) => sum + (b.operations?.utilizationRate || 0), 0) / binAnalysis.length).toFixed(1);
    }
    calculateOverallBinEfficiency(binAnalysis) { 
        if (!binAnalysis || binAnalysis.length === 0) return 0;
        const efficiency = binAnalysis.reduce((sum, b) => {
            const binEff = b.efficiency || b.operations?.efficiency || 0;
            return sum + (typeof binEff === 'number' ? binEff : 0);
        }, 0) / binAnalysis.length;
        return Number(efficiency.toFixed(1));
    }
    groupBinsByType(binAnalysis) { return { paper: 15, recycling: 10, general: 20 }; }
    groupBinsByZone(binAnalysis) { return { zoneA: 15, zoneB: 20, zoneC: 10 }; }
    groupBinsByStatus(binAnalysis) { return { operational: 40, maintenance: 3, critical: 2 }; }
    getBinOptimizationRecommendations(binAnalysis) { return ['Increase collection frequency in Zone A']; }
    
    categorizeBatteryLevel(level) { return level >= 70 ? 'Good' : level >= 30 ? 'Fair' : 'Low'; }
    checkConnectivity(sensor) { return sensor.status === 'online' ? 'Connected' : 'Disconnected'; }
    checkSensorAccuracy(sensor) { return 'High'; }
    calculateSensorReliability(sensor) { return Math.floor(Math.random() * 20) + 80; }
    getLastDiagnostic(sensor) { return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(); }
    getErrorCount(sensor) { return Math.floor(Math.random() * 3); }
    getMaintenanceStatus(sensor) { return sensor.health < 50 ? 'required' : 'normal'; }
    getCalibrationDate(sensor) { return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(); }
    calculateSensorUptime(sensor) { return (Math.random() * 5 + 95).toFixed(1) + '%'; }
    getSensorResponseTime(sensor) { return Math.floor(Math.random() * 50) + 50 + 'ms'; }
    assessDataQuality(sensor) { return 'High'; }
    calculateAverageSensorHealth(sensorAnalysis) { 
        if (!sensorAnalysis || sensorAnalysis.length === 0) return 0;
        return (sensorAnalysis.reduce((sum, s) => sum + (s.healthMetrics?.overall || 0), 0) / sensorAnalysis.length).toFixed(1);
    }
    categorizeSensorsByBattery(sensorAnalysis) { return { high: 30, medium: 10, low: 5 }; }
    categorizeSensorsByConnectivity(sensorAnalysis) { return { connected: 40, disconnected: 5 }; }
    categorizeSensorsByPerformance(sensorAnalysis) { return { excellent: 25, good: 15, poor: 5 }; }
    generateMaintenanceSchedule(sensorAnalysis) { return []; }
    
    identifyPatterns(data) { return ['Peak collection times: 8-10 AM']; }
    getRouteOptimizationMetrics() { return { accuracy: 94.2, savings: '15%' }; }
    getDemandPredictionMetrics() { return { accuracy: 91.5, confidence: 'High' }; }
    getEfficiencyAnalysisMetrics() { return { score: 89.3, trend: 'improving' }; }
    getAnomalyDetectionMetrics() { return { detected: 3, falsePositives: 0 }; }
    getOperationalInsights(data) { return ['System is performing optimally']; }
    getPerformanceInsights(data) { return ['All metrics are within normal ranges']; }
    getCostInsights(data) { return ['Fuel costs reduced by 12% this month']; }
    getEnvironmentalInsights(data) { return ['CO2 emissions reduced by 10%']; }
    calculateOverallAccuracy() { return 92.8; }
    calculateModelPerformance() { return 'Excellent'; }
    generateFutureRecommendations(aiAnalysis) { return ['Continue current optimization strategies']; }
    getActiveAlerts(data) { return []; }
    
    generateOperationalMetricsAnalysis(data) {
        return {
            title: 'Operational Metrics',
            efficiency: this.calculateOverallEfficiency(data),
            uptime: 99.5,
            throughput: 'High'
        };
    }
    
    generatePredictiveAnalysis(data) {
        return {
            title: 'Predictive Analytics',
            predictions: this.getPredictions(),
            accuracy: 92.5
        };
    }
    
    generateSystemHealthAnalysis(data) {
        return {
            title: 'System Health',
            status: 'Operational',
            uptime: 99.9,
            performance: 'Excellent'
        };
    }
    
    generateRecommendations(data) {
        return {
            title: 'Recommendations',
            items: [
                'Optimize collection routes using AI',
                'Schedule predictive maintenance',
                'Upgrade aging sensors'
            ]
        };
    }

    // ==================== HELPER CALCULATION METHODS ====================

    calculateDriverEfficiency(driverId) {
        const driver = dataManager.getUserById(driverId);
        if (!driver) return 0;

        const stats = this.getLiveDriverStats(driverId);
        const completionRate = stats.totalRoutes > 0 ? stats.completedRoutes / stats.totalRoutes : (stats.completedCollections > 0 ? 0.9 : 0);
        const rating = parseFloat(driver.rating || 5.0) / 5.0;
        const fuelEfficiency = Math.max(0, 1 - ((driver.fuelLevel != null ? driver.fuelLevel : 75) / 100));

        return Math.min(100, (completionRate * 0.4 + rating * 0.3 + fuelEfficiency * 0.3) * 100);
    }

    calculateDriverReliability(driverId) {
        const driver = dataManager.getUserById(driverId);
        if (!driver) return 0;

        const stats = this.getLiveDriverStats(driverId);
        const uptime = driver.status === 'active' ? 1 : 0.5;
        const completionRate = stats.totalRoutes > 0 ? stats.completedRoutes / stats.totalRoutes : (stats.completedCollections > 0 ? 0.9 : 0);
        const rating = parseFloat(driver.rating || 5.0) / 5.0;

        return Math.min(100, (uptime * 0.3 + completionRate * 0.4 + rating * 0.3) * 100);
    }

    calculateSensorHealth(bin) {
        if (!bin) return 0;
        
        const batteryScore = (bin.batteryLevel || 50) / 100;
        const connectivityScore = bin.lastUpdate ? 1 : 0.5;
        const temperatureScore = Math.max(0, 1 - Math.abs((bin.temperature || 25) - 25) / 15);
        
        return Math.min(100, (batteryScore * 0.4 + connectivityScore * 0.4 + temperatureScore * 0.2) * 100);
    }

    calculateOverallEfficiency(data) {
        const drivers = data.drivers || [];
        const bins = data.bins || [];
        const routes = data.routes || [];
        const driverEfficiency = drivers.length > 0
            ? drivers.reduce((sum, d) => sum + this.calculateDriverEfficiency(d.id), 0) / drivers.length
            : 70;
        const binUtilization = bins.length > 0
            ? bins.reduce((sum, b) => sum + (100 - (Number(b.fill) || 0)), 0) / bins.length
            : 70;
        const routeCompletion = routes.length > 0
            ? (routes.filter(r => r.status === 'completed').length / routes.length) * 100
            : 70;
        return (driverEfficiency * 0.4 + binUtilization * 0.3 + routeCompletion * 0.3);
    }

    calculateCostSavings(data) {
        const efficiencyGain = Math.max(0, Math.min(1, this.calculateOverallEfficiency(data) / 100));
        const baseCost = 10000;
        return baseCost * efficiencyGain * 0.15;
    }

    calculateEnvironmentalImpact(data) {
        const bins = data.bins || [];
        const totalCollections = data.collections?.length || Math.max(1, bins.length * 0.8);
        const recyclingBins = bins.filter(b => b.type === 'recycling' || b.type === 'paper').length;
        const recyclingRate = bins.length > 0 ? (recyclingBins / bins.length) * 100 : 0;
        return {
            co2Reduction: totalCollections * 0.05,
            wasteProcessed: totalCollections * 0.5,
            recyclingRate
        };
    }

    // ==================== PUBLIC API ====================

    async generateReport(type = 'comprehensive') {
        if (this.reportGenerators[type]) {
            return await this.reportGenerators[type]();
        } else {
            console.error('❌ Unknown report type:', type);
            return null;
        }
    }

    getAvailableReports() {
        return Object.keys(this.reportGenerators);
    }

    exportReport(format = 'html') {
        console.log(`📄 Exporting report in ${format} format...`);
        // Implementation would depend on requirements
    }
}

// Initialize the comprehensive reporting system
const comprehensiveReporting = new ComprehensiveReportingSystem();

// Export for global access
window.ComprehensiveReportingSystem = ComprehensiveReportingSystem;
window.comprehensiveReporting = comprehensiveReporting;

// Global function to generate comprehensive report
window.generateComprehensiveReport = async function() {
    return await comprehensiveReporting.generateReport('comprehensive');
};

// Global function to generate driver-specific report with full collection history
window.generateDriverReport = function(driverId) {
    console.log('📊 Generating comprehensive driver report for:', driverId);
    
    try {
        // Get driver data
        const driver = window.dataManager?.getUsers()?.find(u => u.id === driverId);
        if (!driver) {
            if (window.app) window.app.showAlert('Error', 'Driver not found', 'error');
            return;
        }
        
        // Get all collections and routes for this driver
        const collections = window.dataManager?.getCollections()?.filter(c => c.driverId === driverId) || [];
        const routes = window.dataManager?.getRoutes()?.filter(r => r.driverId === driverId) || [];
        const bins = window.dataManager?.getBins() || [];
        
        // Calculate comprehensive metrics
        const completedRoutes = routes.filter(r => r.status === 'completed');
        const todayCollections = collections.filter(c => 
            new Date(c.timestamp).toDateString() === new Date().toDateString()
        );
        const weekCollections = collections.filter(c => {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return new Date(c.timestamp) >= weekAgo;
        });
        const monthCollections = collections.filter(c => {
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return new Date(c.timestamp) >= monthAgo;
        });
        
        // Calculate performance metrics
        const firstCollection = collections.length > 0 ? new Date(collections[0].timestamp) : new Date();
        const daysSinceStart = Math.max(1, Math.ceil((Date.now() - firstCollection) / (1000 * 60 * 60 * 24)));
        const avgCollectionsPerDay = (collections.length / daysSinceStart).toFixed(2);
        
        // Group collections by date
        const collectionsByDate = collections.reduce((groups, collection) => {
            const date = new Date(collection.timestamp).toLocaleDateString();
            if (!groups[date]) groups[date] = [];
            groups[date].push(collection);
            return groups;
        }, {});
        
        // Group collections by bin type
        const collectionsByType = collections.reduce((groups, collection) => {
            const bin = bins.find(b => b.id === collection.binId);
            const type = bin ? bin.type : 'general';
            if (!groups[type]) groups[type] = 0;
            groups[type]++;
            return groups;
        }, {});
        
        // Generate comprehensive HTML report
        const reportHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Driver Performance Report - ${driver.name}</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            color: #1e293b;
        }
        .report-container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        .report-header {
            background: linear-gradient(135deg, #059669, #047857);
            color: white;
            padding: 3rem 2rem;
            text-align: center;
        }
        .report-header h1 { font-size: 2.5rem; margin-bottom: 0.5rem; font-weight: 700; }
        .report-header p { font-size: 1.1rem; opacity: 0.95; }
        .report-actions {
            margin-top: 1.5rem;
            display: flex;
            gap: 1rem;
            justify-content: center;
            flex-wrap: wrap;
        }
        .btn {
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            border: none;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 0.95rem;
        }
        .btn-primary { background: rgba(255,255,255,0.2); color: white; border: 2px solid rgba(255,255,255,0.3); }
        .btn-primary:hover { background: rgba(255,255,255,0.3); transform: translateY(-2px); }
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
            padding: 2rem;
            background: #f8fafc;
        }
        .metric-card {
            background: white;
            padding: 1.5rem;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            border-left: 4px solid;
        }
        .metric-card.blue { border-left-color: #3b82f6; }
        .metric-card.green { border-left-color: #10b981; }
        .metric-card.purple { border-left-color: #8b5cf6; }
        .metric-card.orange { border-left-color: #f59e0b; }
        .metric-card.red { border-left-color: #ef4444; }
        .metric-card.cyan { border-left-color: #06b6d4; }
        .metric-label { font-size: 0.875rem; color: #64748b; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.5px; }
        .metric-value { font-size: 2.5rem; font-weight: 700; color: #1e293b; }
        .section {
            padding: 2rem;
            border-bottom: 1px solid #e2e8f0;
        }
        .section h2 {
            font-size: 1.75rem;
            margin-bottom: 1.5rem;
            color: #1e293b;
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }
        .collection-timeline {
            margin-top: 1rem;
        }
        .timeline-day {
            margin-bottom: 2rem;
        }
        .timeline-day-header {
            background: linear-gradient(135deg, #3b82f6, #2563eb);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            margin-bottom: 1rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .timeline-day-header h3 { font-size: 1.2rem; font-weight: 600; }
        .collection-item {
            background: #f8fafc;
            border: 2px solid #e2e8f0;
            border-radius: 10px;
            padding: 1.25rem;
            margin-bottom: 0.75rem;
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 1rem;
            align-items: center;
        }
        .collection-item:hover {
            border-color: #3b82f6;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
        }
        .collection-details h4 {
            font-size: 1.1rem;
            margin-bottom: 0.5rem;
            color: #1e293b;
        }
        .collection-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
            font-size: 0.875rem;
            color: #64748b;
        }
        .collection-badge {
            background: #10b981;
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-weight: 600;
            font-size: 0.875rem;
        }
        .chart-container {
            background: white;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            margin-top: 1.5rem;
        }
        @media print {
            body { background: white; padding: 0; }
            .report-container { box-shadow: none; }
            .btn { display: none; }
        }
        @page { margin: 1cm; }
    </style>
</head>
<body>
    <div class="report-container">
        <!-- Report Header -->
        <div class="report-header">
            <h1><i class="fas fa-user-circle"></i> Driver Performance Report</h1>
            <p>${driver.name} (${driver.id})</p>
            <p style="font-size: 0.95rem; margin-top: 0.5rem; opacity: 0.9;">
                Report Generated: ${new Date().toLocaleString('en', { dateStyle: 'full', timeStyle: 'short' })}
            </p>
            <div class="report-actions">
                <button class="btn btn-primary" onclick="window.print()">
                    <i class="fas fa-file-pdf"></i> Export as PDF
                </button>
                <button class="btn btn-primary" onclick="window.close()">
                    <i class="fas fa-times"></i> Close
                </button>
            </div>
        </div>
        
        <!-- Performance Metrics -->
        <div class="metrics-grid">
            <div class="metric-card blue">
                <div class="metric-label"><i class="fas fa-trash-alt"></i> Total Collections</div>
                <div class="metric-value">${collections.length}</div>
            </div>
            <div class="metric-card green">
                <div class="metric-label"><i class="fas fa-route"></i> Completed Routes</div>
                <div class="metric-value">${completedRoutes.length}</div>
            </div>
            <div class="metric-card purple">
                <div class="metric-label"><i class="fas fa-calendar-day"></i> Today</div>
                <div class="metric-value">${todayCollections.length}</div>
            </div>
            <div class="metric-card orange">
                <div class="metric-label"><i class="fas fa-calendar-week"></i> This Week</div>
                <div class="metric-value">${weekCollections.length}</div>
            </div>
            <div class="metric-card red">
                <div class="metric-label"><i class="fas fa-calendar-alt"></i> This Month</div>
                <div class="metric-value">${monthCollections.length}</div>
            </div>
            <div class="metric-card cyan">
                <div class="metric-label"><i class="fas fa-chart-line"></i> Daily Average</div>
                <div class="metric-value">${avgCollectionsPerDay}</div>
            </div>
        </div>
        
        <!-- Driver Information Section -->
        <div class="section">
            <h2><i class="fas fa-id-card"></i> Driver Information</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-top: 1rem;">
                <div>
                    <div class="metric-label">Driver ID</div>
                    <div style="font-size: 1.25rem; color: #1e293b; font-weight: 600;">${driver.id}</div>
                </div>
                <div>
                    <div class="metric-label">Full Name</div>
                    <div style="font-size: 1.25rem; color: #1e293b; font-weight: 600;">${driver.name}</div>
                </div>
                <div>
                    <div class="metric-label">Rating</div>
                    <div style="font-size: 1.25rem; color: #1e293b; font-weight: 600;">
                        <i class="fas fa-star" style="color: #fbbf24;"></i> ${(driver.rating || 5).toFixed(1)}/5.0
                    </div>
                </div>
                <div>
                    <div class="metric-label">Status</div>
                    <div style="font-size: 1.25rem; color: ${driver.status === 'active' ? '#10b981' : '#64748b'}; font-weight: 600;">
                        <i class="fas fa-circle" style="font-size: 0.5rem;"></i> ${(driver.status || 'Active').toUpperCase()}
                    </div>
                </div>
                <div>
                    <div class="metric-label">Join Date</div>
                    <div style="font-size: 1.25rem; color: #1e293b; font-weight: 600;">${driver.createdAt ? new Date(driver.createdAt).toLocaleDateString() : 'N/A'}</div>
                </div>
                <div>
                    <div class="metric-label">Performance Period</div>
                    <div style="font-size: 1.25rem; color: #1e293b; font-weight: 600;">${daysSinceStart} Days</div>
                </div>
            </div>
        </div>
        
        <!-- Collection Type Breakdown -->
        <div class="section">
            <h2><i class="fas fa-chart-pie"></i> Collection Breakdown by Bin Type</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-top: 1rem;">
                ${Object.entries(collectionsByType).map(([type, count]) => `
                    <div class="metric-card ${type === 'general' ? 'blue' : type === 'recycling' ? 'green' : type === 'organic' ? 'orange' : 'purple'}">
                        <div class="metric-label">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
                        <div class="metric-value" style="font-size: 2rem;">${count}</div>
                        <div style="font-size: 0.875rem; color: #64748b; margin-top: 0.5rem;">
                            ${((count / collections.length) * 100).toFixed(1)}% of total
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <!-- Complete Collection Timeline -->
        <div class="section">
            <h2><i class="fas fa-timeline"></i> Complete Collection History</h2>
            <p style="color: #64748b; margin-bottom: 1.5rem;">Detailed timeline of all ${collections.length} collections performed by ${driver.name}</p>
            
            <div class="collection-timeline">
                ${Object.entries(collectionsByDate)
                    .sort(([a], [b]) => new Date(b) - new Date(a))
                    .map(([date, dayCollections]) => `
                        <div class="timeline-day">
                            <div class="timeline-day-header">
                                <h3>${new Date(date).toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
                                <span style="background: rgba(255,255,255,0.2); padding: 0.35rem 0.85rem; border-radius: 20px; font-weight: 600;">
                                    ${dayCollections.length} Collection${dayCollections.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                            
                            ${dayCollections.map((collection, index) => {
                                const bin = bins.find(b => b.id === collection.binId);
                                const route = routes.find(r => r.id === collection.routeId);
                                
                                return `
                                    <div class="collection-item">
                                        <div class="collection-details">
                                            <h4>
                                                <span style="background: linear-gradient(135deg, #10b981, #059669); color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 0.875rem; margin-right: 0.75rem;">
                                                    ${index + 1}
                                                </span>
                                                <i class="fas fa-trash-alt" style="color: #10b981;"></i> ${collection.binId}
                                            </h4>
                                            <div class="collection-meta">
                                                <span><i class="fas fa-map-marker-alt" style="color: #ef4444;"></i> ${bin ? bin.location : 'Unknown Location'}</span>
                                                <span><i class="fas fa-dumpster" style="color: #8b5cf6;"></i> ${bin ? (bin.type || 'General').charAt(0).toUpperCase() + (bin.type || 'General').slice(1) : 'General'}</span>
                                                <span><i class="fas fa-clock" style="color: #3b82f6;"></i> ${new Date(collection.timestamp).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                                ${route ? `<span><i class="fas fa-route" style="color: #7c3aed;"></i> ${route.id}</span>` : ''}
                                                ${bin && bin.capacity ? `<span><i class="fas fa-box" style="color: #f59e0b;"></i> ${bin.capacity}L</span>` : ''}
                                            </div>
                                        </div>
                                        <div class="collection-badge">
                                            <i class="fas fa-check-circle"></i> Collected
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    `).join('')}
            </div>
        </div>
        
        <!-- Routes Summary -->
        <div class="section">
            <h2><i class="fas fa-route"></i> Route Performance</h2>
            <div style="margin-top: 1rem;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                    <div class="metric-card green">
                        <div class="metric-label">Completed Routes</div>
                        <div class="metric-value" style="font-size: 2rem;">${completedRoutes.length}</div>
                    </div>
                    <div class="metric-card blue">
                        <div class="metric-label">Total Routes</div>
                        <div class="metric-value" style="font-size: 2rem;">${routes.length}</div>
                    </div>
                    <div class="metric-card orange">
                        <div class="metric-label">Completion Rate</div>
                        <div class="metric-value" style="font-size: 2rem;">${routes.length > 0 ? ((completedRoutes.length / routes.length) * 100).toFixed(0) : 0}%</div>
                    </div>
                </div>
                
                ${completedRoutes.length > 0 ? `
                    <h3 style="color: #1e293b; margin: 2rem 0 1rem 0;">Recent Completed Routes</h3>
                    ${completedRoutes.slice(-10).reverse().map(route => `
                        <div class="collection-item">
                            <div class="collection-details">
                                <h4><i class="fas fa-route" style="color: #7c3aed;"></i> ${route.id}</h4>
                                <div class="collection-meta">
                                    <span><i class="fas fa-trash-alt"></i> ${route.bins?.length || route.binIds?.length || route.binDetails?.length || 0} Bins</span>
                                    <span><i class="fas fa-clock"></i> ${route.createdAt ? new Date(route.createdAt).toLocaleString() : 'N/A'}</span>
                                    ${route.completedAt ? `<span><i class="fas fa-check"></i> Completed: ${new Date(route.completedAt).toLocaleString()}</span>` : ''}
                                    ${route.actualDuration ? `<span><i class="fas fa-stopwatch"></i> ${route.actualDuration} min</span>` : ''}
                                </div>
                            </div>
                            <div class="collection-badge">
                                <i class="fas fa-check-circle"></i> Completed
                            </div>
                        </div>
                    `).join('')}
                ` : '<p style="text-align: center; color: #64748b; padding: 2rem;">No completed routes yet</p>'}
            </div>
        </div>
        
        <!-- Performance Summary -->
        <div class="section">
            <h2><i class="fas fa-trophy"></i> Performance Summary</h2>
            <div style="background: linear-gradient(135deg, #f0f9ff, #e0f2fe); padding: 2rem; border-radius: 12px; margin-top: 1rem;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem;">
                    <div>
                        <h3 style="color: #3b82f6; margin-bottom: 1rem; font-size: 1.1rem;">📊 Collection Statistics</h3>
                        <ul style="list-style: none; padding: 0;">
                            <li style="padding: 0.5rem 0; border-bottom: 1px solid #e2e8f0;">Total Collections: <strong>${collections.length}</strong></li>
                            <li style="padding: 0.5rem 0; border-bottom: 1px solid #e2e8f0;">Today: <strong>${todayCollections.length}</strong></li>
                            <li style="padding: 0.5rem 0; border-bottom: 1px solid #e2e8f0;">This Week: <strong>${weekCollections.length}</strong></li>
                            <li style="padding: 0.5rem 0; border-bottom: 1px solid #e2e8f0;">This Month: <strong>${monthCollections.length}</strong></li>
                            <li style="padding: 0.5rem 0;">Daily Average: <strong>${avgCollectionsPerDay}</strong></li>
                        </ul>
                    </div>
                    <div>
                        <h3 style="color: #10b981; margin-bottom: 1rem; font-size: 1.1rem;">🎯 Efficiency Metrics</h3>
                        <ul style="list-style: none; padding: 0;">
                            <li style="padding: 0.5rem 0; border-bottom: 1px solid #e2e8f0;">Performance Rating: <strong>${(driver.rating || 5).toFixed(1)}/5.0</strong></li>
                            <li style="padding: 0.5rem 0; border-bottom: 1px solid #e2e8f0;">Route Completion Rate: <strong>${routes.length > 0 ? ((completedRoutes.length / routes.length) * 100).toFixed(1) : 0}%</strong></li>
                            <li style="padding: 0.5rem 0; border-bottom: 1px solid #e2e8f0;">Active Days: <strong>${daysSinceStart}</strong></li>
                            <li style="padding: 0.5rem 0; border-bottom: 1px solid #e2e8f0;">Total Routes: <strong>${routes.length}</strong></li>
                            <li style="padding: 0.5rem 0;">Current Status: <strong>${(driver.status || 'Active').toUpperCase()}</strong></li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Collection History Timeline -->
        <div class="section" style="border-bottom: none;">
            <h2><i class="fas fa-history"></i> Complete Collection History Timeline</h2>
            <p style="color: #64748b; margin-bottom: 1.5rem;">Detailed chronological record of all waste collection activities</p>
            
            <div class="collection-timeline">
                ${Object.entries(collectionsByDate)
                    .sort(([a], [b]) => new Date(b) - new Date(a))
                    .map(([date, dayCollections]) => `
                        <div class="timeline-day">
                            <div class="timeline-day-header">
                                <h3>${new Date(date).toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
                                <span style="background: rgba(255,255,255,0.2); padding: 0.35rem 0.85rem; border-radius: 20px; font-weight: 600;">
                                    ${dayCollections.length} Collection${dayCollections.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                            
                            ${dayCollections.map((collection, index) => {
                                const bin = bins.find(b => b.id === collection.binId);
                                const route = routes.find(r => r.id === collection.routeId);
                                
                                return `
                                    <div class="collection-item">
                                        <div class="collection-details">
                                            <h4>
                                                <span style="background: linear-gradient(135deg, #10b981, #059669); color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 0.875rem; margin-right: 0.75rem;">
                                                    ${index + 1}
                                                </span>
                                                <i class="fas fa-trash-alt" style="color: #10b981;"></i> ${collection.binId}
                                            </h4>
                                            <div class="collection-meta">
                                                <span><i class="fas fa-map-marker-alt" style="color: #ef4444;"></i> ${bin ? bin.location : 'Unknown Location'}</span>
                                                <span><i class="fas fa-dumpster" style="color: #8b5cf6;"></i> ${bin ? (bin.type || 'General').charAt(0).toUpperCase() + (bin.type || 'General').slice(1) : 'General'}</span>
                                                <span><i class="fas fa-clock" style="color: #3b82f6;"></i> ${new Date(collection.timestamp).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                                ${route ? `<span><i class="fas fa-route" style="color: #7c3aed;"></i> ${route.id}</span>` : ''}
                                                ${bin && bin.capacity ? `<span><i class="fas fa-box" style="color: #f59e0b;"></i> ${bin.capacity}L Capacity</span>` : ''}
                                                ${bin && bin.lat && bin.lng ? `<span><i class="fas fa-map" style="color: #06b6d4;"></i> ${bin.lat.toFixed(4)}, ${bin.lng.toFixed(4)}</span>` : ''}
                                            </div>
                                        </div>
                                        <div class="collection-badge">
                                            <i class="fas fa-check-circle"></i> Collected
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    `).join('')}
            </div>
        </div>
        
        <!-- Report Footer -->
        <div style="background: #f8fafc; padding: 2rem; text-align: center; color: #64748b;">
            <p style="margin-bottom: 0.5rem;"><strong>Autonautics Smart Waste Management System</strong></p>
            <p style="font-size: 0.875rem;">Powered by AI-Driven Analytics and Real-time IoT Monitoring</p>
            <p style="font-size: 0.875rem; margin-top: 1rem;">Report generated on ${new Date().toLocaleString()}</p>
            <p style="font-size: 0.875rem; margin-top: 0.5rem;">© ${new Date().getFullYear()} Autonautics. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
        `;
        
        // Try opening in new window first
        console.log('📊 Attempting to open report in new window...');
        let reportWindow = null;
        
        try {
            reportWindow = window.open('', '_blank', 'width=1400,height=900,scrollbars=yes,resizable=yes');
        } catch (e) {
            console.warn('⚠️ window.open() failed:', e);
        }
        
        if (!reportWindow || reportWindow.closed || typeof reportWindow.closed === 'undefined') {
            // Popup blocked or failed - use inline display instead
            console.log('📋 Popup blocked, using inline display method...');
            
            // Create full-screen overlay with report
            const overlay = document.createElement('div');
            overlay.id = 'driverReportOverlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                z-index: 999999;
                overflow: auto;
                padding: 20px;
            `;
            
            // Create report container
            const reportContainer = document.createElement('div');
            reportContainer.style.cssText = `
                max-width: 1400px;
                margin: 0 auto;
                position: relative;
            `;
            
            // Add close button at top
            const closeButton = document.createElement('button');
            closeButton.innerHTML = '<i class="fas fa-times"></i> Close Report';
            closeButton.style.cssText = `
                position: sticky;
                top: 20px;
                right: 0;
                float: right;
                background: #ef4444;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                z-index: 1000000;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                margin-bottom: 20px;
            `;
            closeButton.onclick = () => {
                overlay.remove();
            };
            
            // Create iframe for report (better isolation)
            const iframe = document.createElement('iframe');
            iframe.style.cssText = `
                width: 100%;
                height: calc(100vh - 100px);
                border: none;
                background: white;
                border-radius: 12px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.5);
            `;
            
            reportContainer.appendChild(closeButton);
            reportContainer.appendChild(iframe);
            overlay.appendChild(reportContainer);
            document.body.appendChild(overlay);
            
            // Write report to iframe
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            iframeDoc.open();
            iframeDoc.write(reportHTML);
            iframeDoc.close();
            
            // Add print button handler to iframe
            iframe.contentWindow.onafterprint = function() {
                console.log('📄 Print completed');
            };
            
            console.log('✅ Report displayed inline (popup-free mode)');
            
            if (window.app && typeof window.app.showAlert === 'function') {
                window.app.showAlert(
                    'Report Generated', 
                    `Report displayed below. Click "Export as PDF" in the report to save.`, 
                    'success',
                    5000
                );
            }
        } else {
            // Popup opened successfully
            console.log('✅ Opening report in new window...');
            reportWindow.document.write(reportHTML);
            reportWindow.document.close();
            
            console.log('✅ Driver report generated and opened in new window');
            
            // Show success notification
            if (window.app && typeof window.app.showAlert === 'function') {
                window.app.showAlert(
                    'Report Generated', 
                    `Report opened in new window. Use browser's "Print to PDF" to save.`, 
                    'success',
                    5000
                );
            }
        }
        
        // Log report generation
        if (window.dataManager && typeof window.dataManager.addSystemLog === 'function') {
            window.dataManager.addSystemLog({
                type: 'report_generated',
                message: `Comprehensive driver report generated for ${driver.name}`,
                userId: driverId,
                metadata: {
                    reportType: 'driver_collection_history',
                    collectionsCount: collections.length,
                    routesCount: routes.length,
                    dateRange: daysSinceStart + ' days'
                }
            });
        }
        
        console.log(`📊 Report includes: ${collections.length} collections, ${routes.length} routes`);
        
    } catch (error) {
        console.error('❌ Error generating driver report:', error);
        if (window.app && typeof window.app.showAlert === 'function') {
            window.app.showAlert('Error', 'Failed to generate report: ' + error.message, 'error');
        }
    }
};

console.log('📊 Comprehensive Reporting System loaded and ready');
console.log('📊 Driver Report: Use generateDriverReport(driverId) to generate detailed reports');