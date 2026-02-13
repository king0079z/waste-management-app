// analytics-worldclass-integration.js - World-Class Analytics Integration & Fix
// Consolidates all analytics functionality and ensures proper connectivity

(function() {
    'use strict';

    console.log('🌍 Initializing World-Class Analytics Integration...');

    // ============= ANALYTICS INTEGRATION MANAGER =============

    class WorldClassAnalyticsIntegration {
        constructor() {
            this.isInitialized = false;
            this.charts = {};
            this.realTimeUpdateInterval = null;
            this.chartInitDelay = 1000; // Delay to ensure DOM is ready
            
            // Ensure we have access to required dependencies
            this.waitForDependencies().then(() => {
                this.initialize();
            });
        }

        async waitForDependencies() {
            console.log('⏳ Waiting for dependencies...');
            
            const maxWait = 15000;
            const startTime = Date.now();
            
            while (Date.now() - startTime < maxWait) {
                if (window.Chart && window.dataManager && document.readyState !== 'loading') {
                    console.log('✅ All dependencies ready');
                    return true;
                }
                await new Promise(resolve => setTimeout(resolve, 200));
            }
            
            console.warn('⚠️ Some dependencies may not be ready, proceeding anyway');
            return false;
        }

        initialize() {
            if (this.isInitialized) {
                console.log('ℹ️ Analytics already initialized');
                return;
            }

            console.log('📊 Initializing World-Class Analytics System...');

            // Set up Chart.js defaults
            this.setupChartDefaults();

            // Set up analytics tab navigation
            this.setupTabNavigation();

            // Set up action buttons
            this.setupActionButtons();

            // Initialize metrics update system
            this.setupMetricsUpdates();

            // Start real-time monitoring
            this.startRealTimeMonitoring();

            // Set up WebSocket integration
            this.setupWebSocketIntegration();

            // When MongoDB sync completes, refresh analytics so metrics/charts stay in sync
            document.addEventListener('syncCompleted', () => {
                if (this.isInitialized) {
                    this.updateAllMetrics();
                    this.updateAllCharts();
                    if (typeof this.updateActivityFeed === 'function') this.updateActivityFeed();
                }
            });

            this.isInitialized = true;
            console.log('✅ World-Class Analytics Integration initialized');
        }

        setupChartDefaults() {
            if (!window.Chart) {
                console.warn('⚠️ Chart.js not available');
                return;
            }

            // World-class chart styling
            Chart.defaults.color = '#cbd5e1';
            Chart.defaults.borderColor = 'rgba(148, 163, 184, 0.1)';
            Chart.defaults.backgroundColor = 'rgba(59, 130, 246, 0.1)';
            Chart.defaults.font.family = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
            Chart.defaults.font.size = 13;
            Chart.defaults.plugins.legend.labels.usePointStyle = true;
            Chart.defaults.plugins.legend.labels.padding = 20;
            Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(15, 23, 42, 0.95)';
            Chart.defaults.plugins.tooltip.cornerRadius = 12;
            Chart.defaults.plugins.tooltip.padding = 12;
            Chart.defaults.plugins.tooltip.titleFont = { size: 14, weight: 'bold' };
            Chart.defaults.plugins.tooltip.bodyFont = { size: 13 };
            Chart.defaults.plugins.tooltip.borderColor = 'rgba(59, 130, 246, 0.3)';
            Chart.defaults.plugins.tooltip.borderWidth = 1;

            console.log('✅ Chart.js defaults configured');
        }

        setupTabNavigation() {
            const tabs = document.querySelectorAll('.analytics-tab');
            const contents = document.querySelectorAll('.analytics-content');

            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    const tabName = tab.dataset.tab;
                    
                    // Update active tab
                    tabs.forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');

                    // Update active content
                    contents.forEach(c => c.style.display = 'none');
                    const targetContent = document.getElementById(`${tabName}-content`);
                    if (targetContent) {
                        targetContent.style.display = 'block';
                    }

                    // Initialize tab-specific charts
                    setTimeout(() => {
                        this.initializeTabCharts(tabName);
                    }, 100);
                });
            });

            console.log('✅ Tab navigation configured');
        }

        setupActionButtons() {
            // Refresh Data Button - sync from MongoDB first then refresh
            window.refreshAnalytics = () => {
                console.log('🔄 Refreshing analytics data...');
                const doRefresh = () => {
                    this.updateAllMetrics();
                    this.updateAllCharts();
                    this.updateActivityFeed && this.updateActivityFeed();
                    this.showToast('Analytics data refreshed successfully', 'success');
                };
                if (typeof syncManager !== 'undefined' && syncManager.syncFromServer) {
                    syncManager.syncFromServer().then(doRefresh).catch(doRefresh);
                } else {
                    doRefresh();
                }
            };

            // Export Report Button: PDF if available, else CSV, else JSON
            window.exportAnalytics = () => {
                console.log('📥 Exporting analytics report...');
                const doPdf = (window.analyticsManager && typeof window.analyticsManager.generatePDFReport === 'function') || (window.analyticsManagerV2 && typeof window.analyticsManagerV2.generatePDFReport === 'function');
                const doCsv = (window.analyticsManager && typeof window.analyticsManager.exportToCSV === 'function') || (window.analyticsManagerV2 && typeof window.analyticsManagerV2.exportToCSV === 'function');
                if (doPdf) {
                    (window.analyticsManager && window.analyticsManager.generatePDFReport) ? window.analyticsManager.generatePDFReport() : window.analyticsManagerV2.generatePDFReport();
                    this.showToast('Generating PDF report…', 'info');
                } else if (doCsv) {
                    (window.analyticsManager && window.analyticsManager.exportToCSV) ? window.analyticsManager.exportToCSV() : window.analyticsManagerV2.exportToCSV();
                    this.showToast('Exporting CSV…', 'info');
                } else {
                    this.exportAnalyticsData();
                }
            };

            // Real-Time Mode Toggle
            let realTimeMode = true;
            window.toggleRealTimeAnalytics = () => {
                realTimeMode = !realTimeMode;
                const btn = document.querySelector('[onclick="toggleRealTimeAnalytics()"]');
                
                if (realTimeMode) {
                    this.startRealTimeMonitoring();
                    if (btn) {
                        btn.innerHTML = '<i class="fas fa-pause"></i> Pause Updates';
                        btn.className = 'btn btn-warning';
                    }
                    this.showToast('Real-time mode enabled', 'success');
                } else {
                    this.stopRealTimeMonitoring();
                    if (btn) {
                        btn.innerHTML = '<i class="fas fa-play"></i> Real-Time Mode';
                        btn.className = 'btn btn-info';
                    }
                    this.showToast('Real-time mode paused', 'info');
                }
            };

            console.log('✅ Action buttons configured');
        }

        setupMetricsUpdates() {
            // Update metrics immediately
            this.updateAllMetrics();

            // Update metrics every 5 seconds
            setInterval(() => {
                if (this.isInitialized) {
                    this.updateAllMetrics();
                }
            }, 5000);

            console.log('✅ Metrics update system configured');
        }

        updateAnalyticsDataSourceLabel() {
            this.updateAnalyticsConnectionUI();
        }

        updateAnalyticsConnectionUI() {
            const dsEl = document.getElementById('analyticsDataSource');
            const lastEl = document.getElementById('analyticsLastEventAgo');
            const reconnectBtn = document.getElementById('analyticsReconnectBtn');
            const liveRow = document.getElementById('analyticsLiveRow');
            const dotEl = liveRow && liveRow.querySelector ? liveRow.querySelector('.analytics-live-dot') : null;

            const syncEnabled = typeof syncManager !== 'undefined' && syncManager.syncEnabled === true;
            let wsStatus = '';
            let wsColor = '#64748b';
            const wsm = window.webSocketManager || window.wsManager;
            if (wsm) {
                const s = wsm.getStatus();
                if (s.connected) {
                    wsStatus = s.mode === 'websocket' ? 'Live' : 'Fallback';
                    wsColor = s.mode === 'websocket' ? '#10b981' : '#f59e0b';
                } else {
                    wsStatus = s.reconnectAttempts > 0 ? 'Reconnecting…' : 'Offline';
                    wsColor = s.reconnectAttempts > 0 ? '#f59e0b' : '#dc2626';
                }
                if (lastEl && s.lastLiveEventAt) {
                    const sec = Math.floor((Date.now() - s.lastLiveEventAt) / 1000);
                    lastEl.textContent = sec < 60 ? `Last update: ${sec}s ago` : sec < 3600 ? `Last update: ${Math.floor(sec / 60)}m ago` : `Last update: ${Math.floor(sec / 3600)}h ago`;
                } else if (lastEl) lastEl.textContent = '—';
                if (reconnectBtn) reconnectBtn.style.display = !s.connected ? 'inline-flex' : 'none';
                if (dotEl) dotEl.style.background = wsColor;
            }
            if (dsEl) {
                const dbPart = syncEnabled ? 'MongoDB' : 'local data';
                const rtPart = wsStatus ? ` • Real-time: ${wsStatus}` : '';
                dsEl.textContent = `• ${dbPart}${rtPart}`;
            }
            if (reconnectBtn && !reconnectBtn._analyticsBound) {
                reconnectBtn._analyticsBound = true;
                reconnectBtn.addEventListener('click', () => {
                    if (wsm && typeof wsm.reconnect === 'function') wsm.reconnect();
                    this.updateAnalyticsConnectionUI();
                });
            }
        }

        updateAllMetrics() {
            if (!window.dataManager) return;

            try {
                this.updateAnalyticsDataSourceLabel();
                const bins = dataManager.getBins();
                const drivers = dataManager.getUsers().filter(u => u.type === 'driver');
                const collections = dataManager.getCollections();
                const routes = dataManager.getRoutes();

                const avgResponseTime = this.calculateAvgResponseTime(collections);
                const systemEfficiency = this.calculateSystemEfficiency(bins, routes, drivers);
                const monthlyCollected = this.calculateMonthlyCollected(collections);
                const avgDriverRating = drivers.length > 0
                    ? drivers.reduce((sum, d) => sum + parseFloat(d.rating || 5), 0) / drivers.length
                    : 4.7;

                // Trends: compare to previous period
                const now = new Date();
                const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
                const lastMonthCollected = this.calculateMonthlyCollectedForPeriod(collections, lastMonthStart, lastMonthEnd);
                const lastMonthResponseTime = this.calculateAvgResponseTimeForPeriod(collections, lastMonthStart, lastMonthEnd);
                const RATING_BASELINE = 4.5;

                const monthlyTrendPct = lastMonthCollected > 0
                    ? ((monthlyCollected - lastMonthCollected) / lastMonthCollected) * 100
                    : (monthlyCollected > 0 ? 100 : 0);
                const responseTrendPct = lastMonthResponseTime != null && lastMonthResponseTime > 0
                    ? ((lastMonthResponseTime - avgResponseTime) / lastMonthResponseTime) * 100  // lower is better
                    : null;
                const ratingDelta = avgDriverRating - RATING_BASELINE;

                // Update System Health Metrics (analytics section – unique IDs)
                this.updateMetricValue('analyticsSystemEfficiency', `${systemEfficiency.toFixed(1)}%`);
                this.updateProgressBar('analyticsEfficiencyProgressBar', systemEfficiency);

                this.updateMetricValue('analyticsMonthlyCollected', `${(monthlyCollected / 1000).toFixed(1)}t`);
                this.updateTrendElement('analyticsTrendMonthly', monthlyTrendPct, 'pct', monthlyTrendPct >= 0);

                this.updateMetricValue('analyticsAvgResponseTime', `${avgResponseTime.toFixed(1)}min`);
                this.updateTrendElement('analyticsTrendResponse', responseTrendPct != null ? responseTrendPct : null, 'response', responseTrendPct != null && responseTrendPct > 0);

                this.updateMetricValue('analyticsAvgDriverRating', `${avgDriverRating.toFixed(1)}/5`);
                this.updateTrendElement('analyticsTrendRating', ratingDelta, 'rating', ratingDelta >= 0);

                this.updateDetailTables();
            } catch (error) {
                console.error('Error updating metrics:', error);
            }
        }

        /** Update trend badge: text and positive/negative/neutral styling */
        updateTrendElement(elementId, value, type, positive) {
            const el = document.getElementById(elementId);
            if (!el) return;
            let text = '—';
            if (type === 'pct' && value != null && !Number.isNaN(value)) {
                text = (value >= 0 ? '+' : '') + value.toFixed(1) + '%';
            } else if (type === 'response' && value != null && !Number.isNaN(value)) {
                text = (value >= 0 ? '+' : '') + value.toFixed(1) + '%';
            } else if (type === 'rating' && value != null && !Number.isNaN(value)) {
                text = (value >= 0 ? '+' : '') + value.toFixed(1);
            }
            el.className = 'metric-trend ' + (positive ? 'positive' : value != null && text !== '—' ? 'negative' : '');
            el.style.background = positive ? 'rgba(16, 185, 129, 0.15)' : (text !== '—' ? 'rgba(239, 68, 68, 0.15)' : 'transparent');
            el.style.border = positive ? '1px solid rgba(16, 185, 129, 0.3)' : (text !== '—' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid transparent');
            el.style.color = positive ? '#10b981' : (text !== '—' ? '#ef4444' : '#94a3b8');
            const iconClass = positive ? 'fas fa-arrow-up' : (text !== '—' ? 'fas fa-arrow-down' : 'fas fa-minus');
            el.innerHTML = '<i class="' + iconClass + '" style="margin-right: 0.25rem;"></i> ' + text;
        }

        calculateMonthlyCollectedForPeriod(collections, start, end) {
            const inRange = collections.filter(c => {
                const d = new Date(c.timestamp);
                return d >= start && d <= end;
            });
            return inRange.length * 15;
        }

        calculateAvgResponseTimeForPeriod(collections, start, end) {
            const completed = collections.filter(c => {
                if (c.status !== 'completed' || !c.completedAt) return false;
                const d = new Date(c.timestamp);
                return d >= start && d <= end;
            });
            if (completed.length === 0) return null;
            const total = completed.reduce((sum, c) => {
                const s = new Date(c.timestamp);
                const e = new Date(c.completedAt);
                return sum + (e - s) / 60000;
            }, 0);
            return total / completed.length;
        }

        calculateAvgResponseTime(collections) {
            if (collections.length === 0) return 14.2;
            
            // Calculate average time between collection creation and completion
            const completedCollections = collections.filter(c => c.status === 'completed' && c.completedAt);
            if (completedCollections.length === 0) return 14.2;

            const totalTime = completedCollections.reduce((sum, c) => {
                const start = new Date(c.timestamp);
                const end = new Date(c.completedAt);
                return sum + (end - start) / 60000; // Convert to minutes
            }, 0);

            return totalTime / completedCollections.length;
        }

        calculateSystemEfficiency(bins, routes, drivers) {
            // Calculate efficiency based on multiple factors
            const binEfficiency = bins.length > 0 
                ? (bins.filter(b => (b.fill || b.fillLevel || 0) < 80).length / bins.length) * 100 
                : 90;
            
            const routeEfficiency = routes.length > 0
                ? (routes.filter(r => r.status === 'completed').length / routes.length) * 100
                : 95;
            
            const driverEfficiency = drivers.length > 0
                ? (drivers.filter(d => d.status === 'active').length / drivers.length) * 100
                : 90;

            return (binEfficiency * 0.4 + routeEfficiency * 0.3 + driverEfficiency * 0.3);
        }

        calculateMonthlyCollected(collections) {
            const now = new Date();
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            
            const monthlyCollections = collections.filter(c => {
                const collectionDate = new Date(c.timestamp);
                return collectionDate >= firstDayOfMonth;
            });

            // Estimate weight: avg 15kg per collection
            return monthlyCollections.length * 15;
        }

        updateMetricValue(elementId, value) {
            const element = document.getElementById(elementId);
            if (element) {
                element.textContent = value;
            }
        }

        updateProgressBar(elementId, percentage) {
            const element = document.getElementById(elementId);
            if (element) {
                element.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
            }
        }

        initializeTabCharts(tabName) {
            console.log(`📊 Initializing charts for tab: ${tabName}`);

            // Destroy all existing charts from other analytics systems first
            this.destroyAllExistingCharts();

            // Small delay to ensure cleanup is complete
            setTimeout(() => {
                switch (tabName) {
                    case 'overview':
                        this.initializeOverviewCharts();
                        break;
                    case 'performance':
                        this.initializePerformanceCharts();
                        break;
                    case 'predictive':
                        this.initializePredictiveCharts();
                        break;
                    case 'operational':
                        this.initializeOperationalCharts();
                        break;
                    case 'environmental':
                        this.initializeEnvironmentalCharts();
                        break;
                    case 'financial':
                        this.initializeFinancialCharts();
                        break;
                    case 'drivers-detail':
                        this.updateDriverPerformanceTable();
                        this.initializeDriversDetailChart();
                        break;
                    case 'bins-detail':
                        this.updateBinPerformanceTable();
                        this.initializeBinsDetailChart();
                        break;
                    case 'sensors-detail':
                        this.updateSensorPerformanceTable();
                        this.updateSensorSummary();
                        break;
                }
            }, 50);
        }

        destroyAllExistingCharts() {
            // Destroy all Chart.js instances globally
            if (window.Chart) {
                // Method 1: Use Chart.getChart for each known canvas
                const canvasIds = [
                    'collections-trend-chart',
                    'fill-distribution-chart',
                    'driver-performance-chart',
                    'route-efficiency-chart',
                    'demand-forecast-chart',
                    'overflow-prediction-chart',
                    'operational-efficiency-chart',
                    'resource-utilization-chart',
                    'environmental-impact-chart',
                    'carbon-footprint-chart',
                    'cost-analysis-chart',
                    'roi-tracking-chart',
                    'drivers-detail-chart',
                    'bins-detail-chart'
                ];

                canvasIds.forEach(canvasId => {
                    const canvas = document.getElementById(canvasId);
                    if (canvas && window.Chart.getChart) {
                        const existingChart = window.Chart.getChart(canvas);
                        if (existingChart) {
                            try {
                                existingChart.destroy();
                            } catch (e) {
                                // Silent fail
                            }
                        }
                    }
                });

                // Method 2: Check other analytics managers
                if (window.analyticsManagerV2 && window.analyticsManagerV2.charts) {
                    Object.values(window.analyticsManagerV2.charts).forEach(chart => {
                        try {
                            if (chart && typeof chart.destroy === 'function') {
                                chart.destroy();
                            }
                        } catch (e) {
                            // Silent fail
                        }
                    });
                }

                if (window.enhancedAnalyticsManager && window.enhancedAnalyticsManager.charts) {
                    Object.values(window.enhancedAnalyticsManager.charts).forEach(chart => {
                        try {
                            if (chart && typeof chart.destroy === 'function') {
                                chart.destroy();
                            }
                        } catch (e) {
                            // Silent fail
                        }
                    });
                }
            }
        }

        initializeOverviewCharts() {
            // Collections Trend Chart
            this.initializeChart('collections-trend-chart', {
                type: 'line',
                data: this.getCollectionsTrendData(),
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: true, position: 'top' },
                        title: { display: false }
                    },
                    scales: {
                        y: { beginAtZero: true, grid: { color: 'rgba(148, 163, 184, 0.1)' } },
                        x: { grid: { display: false } }
                    }
                }
            });

            // Fill Distribution Chart
            this.initializeChart('fill-distribution-chart', {
                type: 'doughnut',
                data: this.getFillDistributionData(),
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: true, position: 'right' }
                    }
                }
            });
        }

        initializePerformanceCharts() {
            // Driver Performance Chart
            this.initializeChart('driver-performance-chart', {
                type: 'bar',
                data: this.getDriverPerformanceData(),
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: { beginAtZero: true, grid: { color: 'rgba(148, 163, 184, 0.1)' } },
                        x: { grid: { display: false } }
                    }
                }
            });

            // Route Efficiency Chart
            this.initializeChart('route-efficiency-chart', {
                type: 'line',
                data: this.getRouteEfficiencyData(),
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: true, position: 'top' }
                    },
                    scales: {
                        y: { beginAtZero: true, max: 100, grid: { color: 'rgba(148, 163, 184, 0.1)' } },
                        x: { grid: { display: false } }
                    }
                }
            });
        }

        initializePredictiveCharts() {
            // Demand Forecast Chart
            this.initializeChart('demand-forecast-chart', {
                type: 'line',
                data: this.getDemandForecastData(),
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: true, position: 'top' }
                    },
                    scales: {
                        y: { beginAtZero: true, grid: { color: 'rgba(148, 163, 184, 0.1)' } },
                        x: { grid: { display: false } }
                    }
                }
            });

            // Overflow Prediction Chart
            this.initializeChart('overflow-prediction-chart', {
                type: 'bar',
                data: this.getOverflowPredictionData(),
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: { beginAtZero: true, grid: { color: 'rgba(148, 163, 184, 0.1)' } },
                        x: { grid: { display: false } }
                    }
                }
            });
        }

        initializeOperationalCharts() {
            // Placeholder for operational charts
            console.log('📊 Operational charts initialized');
        }

        initializeEnvironmentalCharts() {
            // Placeholder for environmental charts
            console.log('📊 Environmental charts initialized');
        }

        initializeFinancialCharts() {
            // Placeholder for financial charts
            console.log('📊 Financial charts initialized');
        }

        updateDriverPerformanceTable() {
            const tbody = document.getElementById('analyticsDriverPerformanceBody');
            if (!tbody || !window.dataManager) return;
            const drivers = dataManager.getUsers().filter(u => u.type === 'driver');
            const collections = dataManager.getCollections();
            const routes = dataManager.getRoutes();
            const now = new Date();
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const completedCollections = collections.filter(c => c.status === 'completed' && c.completedAt);
            const driverRows = drivers.map(d => {
                const driverCols = collections.filter(c => c.driverId === d.id);
                const mtd = driverCols.filter(c => new Date(c.timestamp) >= firstDayOfMonth).length;
                const completed = completedCollections.filter(c => c.driverId === d.id);
                let avgResponse = '—';
                if (completed.length > 0) {
                    const totalMin = completed.reduce((sum, c) => {
                        const s = new Date(c.timestamp);
                        const e = new Date(c.completedAt);
                        return sum + (e - s) / 60000;
                    }, 0);
                    avgResponse = (totalMin / completed.length).toFixed(1);
                }
                const completedRoutes = routes.filter(r => r.driverId === d.id && r.status === 'completed').length;
                const statusClass = (d.status === 'active') ? 'status-ok' : 'status-warning';
                const rating = parseFloat(d.rating) != null && !Number.isNaN(parseFloat(d.rating)) ? parseFloat(d.rating).toFixed(1) : '—';
                return `<tr>
                    <td><strong>${(d.name || '—').replace(/</g, '&lt;')}</strong></td>
                    <td><span class="${statusClass}">${(d.status || '—')}</span></td>
                    <td>${rating}/5</td>
                    <td>${mtd}</td>
                    <td>${avgResponse}</td>
                    <td>${completedRoutes}</td>
                </tr>`;
            });
            tbody.innerHTML = driverRows.length ? driverRows.join('') : '<tr><td colspan="6" style="text-align:center;color:#94a3b8;">No driver data</td></tr>';
        }

        updateBinPerformanceTable() {
            const tbody = document.getElementById('analyticsBinPerformanceBody');
            if (!tbody || !window.dataManager) return;
            const bins = dataManager.getBins();
            const collections = dataManager.getCollections();
            const getLastCollection = (binId) => {
                const c = collections.filter(x => (x.binId || x.bin) === binId).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
                return c ? new Date(c.timestamp).toLocaleDateString() : '—';
            };
            const locStr = (b) => {
                if (typeof dataManager !== 'undefined' && dataManager.getBinLocationDisplay) return dataManager.getBinLocationDisplay(b) || '—';
                const loc = b.location;
                if (typeof loc === 'string') return loc;
                if (loc && typeof loc === 'object' && loc.address) return loc.address;
                if (b.locationName) return b.locationName;
                if (b.lat != null && b.lng != null) return b.lat.toFixed(4) + ', ' + b.lng.toFixed(4);
                return '—';
            };
            const rows = bins.map(b => {
                const fill = Math.round(b.fill ?? b.fillLevel ?? 0);
                const status = b.status || (fill >= 90 ? 'critical' : fill >= 70 ? 'warning' : 'normal');
                const statusClass = status === 'critical' ? 'status-critical' : status === 'warning' ? 'status-warning' : 'status-ok';
                const locationDisplay = String(locStr(b)).replace(/</g, '&lt;').substring(0, 30);
                return `<tr>
                    <td><strong>${(b.id || '—').replace(/</g, '&lt;')}</strong></td>
                    <td>${locationDisplay}</td>
                    <td>${fill}%</td>
                    <td><span class="${statusClass}">${status}</span></td>
                    <td>${(b.type || '—')}</td>
                    <td>${getLastCollection(b.id)}</td>
                </tr>`;
            });
            tbody.innerHTML = rows.length ? rows.join('') : '<tr><td colspan="6" style="text-align:center;color:#94a3b8;">No bin data</td></tr>';
        }

        updateDetailTables() {
            this.updateDriverPerformanceTable();
            this.updateBinPerformanceTable();
            this.updateSensorPerformanceTable();
            this.updateSensorSummary();
        }

        updateSensorPerformanceTable() {
            const tbody = document.getElementById('analyticsSensorPerformanceBody');
            if (!tbody || !window.dataManager) return;
            const bins = dataManager.getBins();
            const rows = bins.map(b => {
                const status = (b.sensorStatus || 'active').toLowerCase();
                const statusClass = status === 'active' ? 'status-ok' : status === 'warning' ? 'status-warning' : 'status-critical';
                const battery = b.batteryLevel != null ? Math.round(Number(b.batteryLevel)) : '—';
                const signal = b.signalStrength != null ? b.signalStrength + ' dBm' : '—';
                const temp = b.temperature != null ? b.temperature + '°C' : '—';
                const fill = (b.fill ?? b.fillLevel) != null ? Math.round(Number(b.fill ?? b.fillLevel)) + '%' : '—';
                return `<tr>
                    <td><strong>${(b.id || '—').replace(/</g, '&lt;')}</strong></td>
                    <td><span class="${statusClass}">${status}</span></td>
                    <td>${battery}${typeof battery === 'number' ? '%' : ''}</td>
                    <td>${signal}</td>
                    <td>${temp}</td>
                    <td>${fill}</td>
                </tr>`;
            });
            tbody.innerHTML = rows.length ? rows.join('') : '<tr><td colspan="6" style="text-align:center;color:#94a3b8;">No sensor data</td></tr>';
        }

        updateSensorSummary() {
            const el = document.getElementById('analyticsSensorSummary');
            if (!el || !window.dataManager) return;
            const bins = dataManager.getBins();
            const active = bins.filter(b => (b.sensorStatus || 'active').toLowerCase() === 'active').length;
            const lowBattery = bins.filter(b => (b.batteryLevel != null && Number(b.batteryLevel) < 30)).length;
            const weakSignal = bins.filter(b => (b.signalStrength != null && Number(b.signalStrength) < -80)).length;
            const total = bins.length;
            el.innerHTML = `
                <div class="glass-card" style="padding:1rem; border-radius:12px;"><div style="font-size:1.75rem;font-weight:700;color:#10b981;">${active}</div><div style="font-size:0.8rem;color:#94a3b8;">Active Sensors</div></div>
                <div class="glass-card" style="padding:1rem; border-radius:12px;"><div style="font-size:1.75rem;font-weight:700;color:#f59e0b;">${lowBattery}</div><div style="font-size:0.8rem;color:#94a3b8;">Low Battery</div></div>
                <div class="glass-card" style="padding:1rem; border-radius:12px;"><div style="font-size:1.75rem;font-weight:700;color:#3b82f6;">${weakSignal}</div><div style="font-size:0.8rem;color:#94a3b8;">Weak Signal</div></div>
                <div class="glass-card" style="padding:1rem; border-radius:12px;"><div style="font-size:1.75rem;font-weight:700;color:#cbd5e1;">${total}</div><div style="font-size:0.8rem;color:#94a3b8;">Total Bins</div></div>
            `;
        }

        initializeDriversDetailChart() {
            const data = this.getDriverPerformanceData();
            this.initializeChart('drivers-detail-chart', {
                type: 'bar',
                data: data,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { beginAtZero: true, grid: { color: 'rgba(148, 163, 184, 0.1)' } },
                        y: { grid: { display: false } }
                    }
                }
            });
        }

        initializeBinsDetailChart() {
            const data = this.getFillDistributionData();
            this.initializeChart('bins-detail-chart', {
                type: 'doughnut',
                data: data,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: true, position: 'right' } }
                }
            });
        }

        initializeChart(canvasId, config) {
            const canvas = document.getElementById(canvasId);
            if (!canvas) {
                console.warn(`⚠️ Canvas not found: ${canvasId}`);
                return null;
            }

            try {
                // CRITICAL: Destroy ALL existing charts on this canvas
                // Check Chart.js global registry
                if (window.Chart && window.Chart.getChart) {
                    const existingChart = window.Chart.getChart(canvas);
                    if (existingChart) {
                        console.log(`🔄 Destroying existing chart on canvas: ${canvasId}`);
                        existingChart.destroy();
                    }
                }

                // Also destroy from our own registry
                if (this.charts[canvasId]) {
                    this.charts[canvasId].destroy();
                    delete this.charts[canvasId];
                }

                // Clear canvas context to ensure clean slate
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }

                // Create new chart
                this.charts[canvasId] = new Chart(canvas, config);
                console.log(`✅ Chart initialized: ${canvasId}`);
                return this.charts[canvasId];
            } catch (error) {
                console.error(`❌ Error initializing chart ${canvasId}:`, error);
                // Try one more time with forced cleanup
                try {
                    // Get all Chart.js instances and destroy any using this canvas
                    if (window.Chart && window.Chart.instances) {
                        Object.values(window.Chart.instances).forEach(chart => {
                            if (chart.canvas && chart.canvas.id === canvasId) {
                                chart.destroy();
                            }
                        });
                    }
                    
                    // Retry chart creation
                    this.charts[canvasId] = new Chart(canvas, config);
                    console.log(`✅ Chart initialized on retry: ${canvasId}`);
                    return this.charts[canvasId];
                } catch (retryError) {
                    console.error(`❌ Chart retry also failed for ${canvasId}:`, retryError);
                    return null;
                }
            }
        }

        // ============= DATA GENERATION METHODS =============

        getCollectionsTrendData() {
            if (!window.dataManager) return this.getDefaultTrendData();

            const collections = dataManager.getCollections();
            const last30Days = [];
            const now = new Date();

            // Generate last 30 days
            for (let i = 29; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                date.setHours(0, 0, 0, 0);
                last30Days.push(date);
            }

            const dailyCounts = last30Days.map(day => {
                const dayStr = day.toDateString();
                return collections.filter(c => {
                    const cDate = new Date(c.timestamp);
                    return cDate.toDateString() === dayStr;
                }).length;
            });

            return {
                labels: last30Days.map(d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
                datasets: [{
                    label: 'Collections',
                    data: dailyCounts,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            };
        }

        getDefaultTrendData() {
            return {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                datasets: [{
                    label: 'Collections',
                    data: [45, 52, 48, 61],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            };
        }

        getFillDistributionData() {
            if (!window.dataManager) return this.getDefaultFillData();

            const bins = dataManager.getBins();
            const low = bins.filter(b => (b.fill || b.fillLevel || 0) < 40).length;
            const medium = bins.filter(b => {
                const fill = b.fill || b.fillLevel || 0;
                return fill >= 40 && fill < 70;
            }).length;
            const high = bins.filter(b => {
                const fill = b.fill || b.fillLevel || 0;
                return fill >= 70 && fill < 90;
            }).length;
            const critical = bins.filter(b => (b.fill || b.fillLevel || 0) >= 90).length;

            return {
                labels: ['Low (<40%)', 'Medium (40-70%)', 'High (70-90%)', 'Critical (>90%)'],
                datasets: [{
                    data: [low, medium, high, critical],
                    backgroundColor: [
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(251, 146, 60, 0.8)',
                        'rgba(239, 68, 68, 0.8)'
                    ],
                    borderColor: [
                        '#10b981',
                        '#f59e0b',
                        '#fb923c',
                        '#ef4444'
                    ],
                    borderWidth: 2
                }]
            };
        }

        getDefaultFillData() {
            return {
                labels: ['Low', 'Medium', 'High', 'Critical'],
                datasets: [{
                    data: [25, 35, 28, 12],
                    backgroundColor: [
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(251, 146, 60, 0.8)',
                        'rgba(239, 68, 68, 0.8)'
                    ]
                }]
            };
        }

        getDriverPerformanceData() {
            if (!window.dataManager) return this.getDefaultDriverData();

            const drivers = dataManager.getUsers().filter(u => u.type === 'driver');
            const collections = dataManager.getCollections();

            const driverStats = drivers.map(driver => {
                const driverCollections = collections.filter(c => c.driverId === driver.id);
                return {
                    name: driver.name.split(' ')[0],
                    collections: driverCollections.length
                };
            }).sort((a, b) => b.collections - a.collections).slice(0, 10);

            return {
                labels: driverStats.map(d => d.name),
                datasets: [{
                    label: 'Collections',
                    data: driverStats.map(d => d.collections),
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    borderColor: '#3b82f6',
                    borderWidth: 2
                }]
            };
        }

        getDefaultDriverData() {
            return {
                labels: ['Ali', 'Mohammed', 'Ahmed', 'Hassan', 'Omar'],
                datasets: [{
                    label: 'Collections',
                    data: [45, 39, 35, 32, 28],
                    backgroundColor: 'rgba(59, 130, 246, 0.8)'
                }]
            };
        }

        getRouteEfficiencyData() {
            if (!window.dataManager) {
                return {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [{
                        label: 'Efficiency %',
                        data: [92, 88, 95, 90, 87, 93, 94],
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                };
            }
            const routes = dataManager.getRoutes();
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const byDay = [0, 1, 2, 3, 4, 5, 6].map(dayIndex => {
                const dayRoutes = routes.filter(r => new Date(r.createdAt || r.timestamp || 0).getDay() === dayIndex);
                const completed = dayRoutes.filter(r => r.status === 'completed').length;
                return dayRoutes.length ? Math.round((completed / dayRoutes.length) * 100) : 90;
            });
            return {
                labels: days,
                datasets: [{
                    label: 'Efficiency %',
                    data: byDay,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            };
        }

        getDemandForecastData() {
            return {
                labels: ['Today', 'Tomorrow', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'],
                datasets: [
                    {
                        label: 'Actual',
                        data: [45, 52, null, null, null, null, null],
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'Forecast',
                        data: [null, 52, 48, 55, 51, 58, 54],
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderDash: [5, 5],
                        tension: 0.4
                    }
                ]
            };
        }

        getOverflowPredictionData() {
            if (!window.dataManager) return this.getDefaultOverflowData();

            const bins = dataManager.getBins();
            const criticalBins = bins
                .filter(b => (b.fill || b.fillLevel || 0) >= 70)
                .sort((a, b) => (b.fill || b.fillLevel || 0) - (a.fill || a.fillLevel || 0))
                .slice(0, 10);

            return {
                labels: criticalBins.map(b => b.id),
                datasets: [{
                    label: 'Fill Level %',
                    data: criticalBins.map(b => b.fill || b.fillLevel || 0),
                    backgroundColor: criticalBins.map(b => {
                        const fill = b.fill || b.fillLevel || 0;
                        if (fill >= 90) return 'rgba(239, 68, 68, 0.8)';
                        if (fill >= 80) return 'rgba(251, 146, 60, 0.8)';
                        return 'rgba(245, 158, 11, 0.8)';
                    }),
                    borderWidth: 2
                }]
            };
        }

        getDefaultOverflowData() {
            return {
                labels: ['BIN-001', 'BIN-007', 'BIN-012', 'BIN-023', 'BIN-031'],
                datasets: [{
                    label: 'Fill Level %',
                    data: [95, 92, 88, 85, 82],
                    backgroundColor: [
                        'rgba(239, 68, 68, 0.8)',
                        'rgba(239, 68, 68, 0.8)',
                        'rgba(251, 146, 60, 0.8)',
                        'rgba(251, 146, 60, 0.8)',
                        'rgba(245, 158, 11, 0.8)'
                    ]
                }]
            };
        }

        updateAllCharts() {
            const analyticsEl = document.getElementById('analytics');
            if (!analyticsEl || analyticsEl.style.display === 'none') return;
            Object.keys(this.charts).forEach(chartId => {
                const chart = this.charts[chartId];
                if (!chart || typeof chart.update !== 'function') return;
                const canvas = chart.canvas;
                if (!canvas || !document.body.contains(canvas)) {
                    try { chart.destroy(); } catch (e) {}
                    delete this.charts[chartId];
                    return;
                }
                try {
                    if (chartId === 'collections-trend-chart') {
                        chart.data = this.getCollectionsTrendData();
                    } else if (chartId === 'fill-distribution-chart') {
                        chart.data = this.getFillDistributionData();
                    } else if (chartId === 'driver-performance-chart') {
                        chart.data = this.getDriverPerformanceData();
                    } else if (chartId === 'overflow-prediction-chart') {
                        chart.data = this.getOverflowPredictionData();
                    }
                    chart.update('none');
                } catch (e) {
                    try { chart.destroy(); } catch (err) {}
                    delete this.charts[chartId];
                }
            });
        }

        startRealTimeMonitoring() {
            if (this.realTimeUpdateInterval) {
                clearInterval(this.realTimeUpdateInterval);
            }

            // Update every 10 seconds
            this.realTimeUpdateInterval = setInterval(() => {
                this.updateAllMetrics();
                this.updateAllCharts();
                this.updateActivityFeed();
            }, 10000);

            console.log('✅ Real-time monitoring started');
        }

        stopRealTimeMonitoring() {
            if (this.realTimeUpdateInterval) {
                clearInterval(this.realTimeUpdateInterval);
                this.realTimeUpdateInterval = null;
            }
            console.log('⏸️ Real-time monitoring paused');
        }

        updateActivityFeed() {
            const feedElement = document.getElementById('analyticsActivityFeed');
            if (!feedElement || !window.dataManager) return;

            const collections = dataManager.getCollections();
            const recentCollections = collections
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, 10);

            feedElement.innerHTML = recentCollections.map(c => {
                const driver = dataManager.getUserById(c.driverId);
                const bin = dataManager.getBinById(c.binId);
                const timeAgo = this.getTimeAgo(new Date(c.timestamp));

                return `
                    <div style="
                        padding: 1rem;
                        background: rgba(30, 41, 59, 0.5);
                        border-left: 3px solid #10b981;
                        border-radius: 8px;
                        margin-bottom: 0.75rem;
                    ">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <strong style="color: #f1f5f9;">${driver ? driver.name : 'Unknown Driver'}</strong> 
                                collected <strong style="color: #3b82f6;">${bin ? bin.id : c.binId}</strong>
                            </div>
                            <div style="color: #94a3b8; font-size: 0.875rem;">${timeAgo}</div>
                        </div>
                    </div>
                `;
            }).join('') || '<p style="text-align: center; color: #6b7280;">No recent activity</p>';
        }

        getTimeAgo(date) {
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            
            if (diffMins < 1) return 'Just now';
            if (diffMins < 60) return `${diffMins}m ago`;
            
            const diffHours = Math.floor(diffMins / 60);
            if (diffHours < 24) return `${diffHours}h ago`;
            
            const diffDays = Math.floor(diffHours / 24);
            return `${diffDays}d ago`;
        }

        setupWebSocketIntegration() {
            const wsm = window.webSocketManager || window.wsManager;
            if (!wsm) return;
            const refresh = () => {
                this.updateAllMetrics();
                this.updateAllCharts();
                if (typeof this.updateActivityFeed === 'function') this.updateActivityFeed();
                this.updateAnalyticsConnectionUI();
            };
            const refreshMetricsCharts = () => {
                this.updateAllMetrics();
                this.updateAllCharts();
                this.updateAnalyticsConnectionUI();
            };
            wsm.addEventListener('connection_state', () => this.updateAnalyticsConnectionUI());
            wsm.addEventListener('connected', () => this.updateAnalyticsConnectionUI());
            wsm.addEventListener('disconnected', () => this.updateAnalyticsConnectionUI());
            wsm.addEventListener('collection_update', refresh);
            wsm.addEventListener('bin_fill_update', refreshMetricsCharts);
            wsm.addEventListener('bin_update', refreshMetricsCharts);
            wsm.addEventListener('bin_added', refreshMetricsCharts);
            wsm.addEventListener('sensor_update', refreshMetricsCharts);
            wsm.addEventListener('driver_location', refreshMetricsCharts);
            wsm.addEventListener('driver_update', refresh);
            wsm.addEventListener('route_update', refresh);
            wsm.addEventListener('dataUpdate', refresh);
        }

        exportAnalyticsData() {
            if (!window.dataManager) {
                this.showToast('Data manager not available', 'error');
                return;
            }

            const data = {
                bins: dataManager.getBins(),
                collections: dataManager.getCollections(),
                drivers: dataManager.getUsers().filter(u => u.type === 'driver'),
                routes: dataManager.getRoutes(),
                exportDate: new Date().toISOString()
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showToast('Analytics report exported successfully', 'success');
        }

        showToast(message, type = 'info') {
            // Use app's showAlert if available
            if (window.app && typeof window.app.showAlert === 'function') {
                window.app.showAlert('Analytics', message, type);
            } else {
                console.log(`[${type.toUpperCase()}] ${message}`);
            }
        }

        // Public method to initialize analytics when section becomes visible
        initializeAnalytics() {
            console.log('📊 Analytics section activated');
            
            // Destroy any existing charts from other systems
            this.destroyAllExistingCharts();
            
            // Update metrics immediately
            this.updateAllMetrics();
            
            // Initialize overview charts with delay to ensure DOM is ready
            setTimeout(() => {
                this.initializeOverviewCharts();
                this.updateActivityFeed();
            }, this.chartInitDelay);
        }

        // Cleanup method
        destroy() {
            console.log('🧹 Cleaning up analytics integration...');
            
            // Stop real-time monitoring
            this.stopRealTimeMonitoring();
            
            // Destroy all charts
            Object.values(this.charts).forEach(chart => {
                if (chart && typeof chart.destroy === 'function') {
                    try {
                        chart.destroy();
                    } catch (e) {
                        // Silent fail
                    }
                }
            });
            
            this.charts = {};
            this.isInitialized = false;
            
            console.log('✅ Analytics integration cleaned up');
        }
    }

    // ============= INITIALIZATION =============

    // Initialize the analytics integration
    const analyticsIntegration = new WorldClassAnalyticsIntegration();

    // Make it globally accessible
    window.worldClassAnalytics = analyticsIntegration;

    // Ensure analytics section uses world-class integration when section is shown
    if (!window.analyticsManager) window.analyticsManager = {};
    window.analyticsManager.initializeAnalytics = () => analyticsIntegration.initializeAnalytics();
    window.analyticsManager.updateDashboardMetrics = () => analyticsIntegration.updateAllMetrics();
    window.analyticsManager.updateAllMetrics = () => analyticsIntegration.updateAllMetrics();
    window.analyticsManager.updateAllCharts = () => analyticsIntegration.updateAllCharts();
    // Lazy delegate to V2 when present (V2 may load after this script)
    window.analyticsManager.generatePDFReport = function() {
        if (window.analyticsManagerV2 && typeof window.analyticsManagerV2.generatePDFReport === 'function') {
            return window.analyticsManagerV2.generatePDFReport();
        }
        console.warn('PDF report not available (analyticsManagerV2 not loaded)');
    };
    window.analyticsManager.exportToCSV = function() {
        if (window.analyticsManagerV2 && typeof window.analyticsManagerV2.exportToCSV === 'function') {
            return window.analyticsManagerV2.exportToCSV();
        }
        console.warn('CSV export not available (analyticsManagerV2 not loaded)');
    };
    console.log('✅ Analytics Manager wired to World-Class Integration + MongoDB sync');

    console.log('🌍 World-Class Analytics Integration ready');

})();
