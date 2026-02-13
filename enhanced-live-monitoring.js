// enhanced-live-monitoring.js - World-Class Live Monitoring Features
// Version 1.0

(function() {
    console.log('🎨 Initializing Enhanced Live Monitoring UI...');
    
    // Wait for page to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    function init() {
        // Wait for monitoring section to be visible
        const checkMonitoring = setInterval(() => {
            const monitoringSection = document.getElementById('monitoring');
            if (monitoringSection && monitoringSection.style.display !== 'none') {
                clearInterval(checkMonitoring);
                enhanceMonitoringPage();
            }
        }, 500);
    }
    
    function enhanceMonitoringPage() {
        console.log('✨ Enhancing Live Monitoring UI...');
        
        // 1. Add Quick Actions Bar
        addQuickActionsBar();
        
        // 2. Add Filters and Search
        addFiltersSection();
        
        // 3. Enhance System Status Cards
        enhanceSystemStatusCards();
        
        // 4. Add Live Activity Feed
        addLiveActivityFeed();
        
        // 5. Add Performance Metrics
        addPerformanceMetrics();
        
        // 6. Add Real-Time Indicators
        addRealTimeIndicators();
        
        console.log('✅ Live Monitoring UI Enhanced!');
    }
    
    function addQuickActionsBar() {
        const monitoringSection = document.getElementById('monitoring');
        if (!monitoringSection) return;
        
        const mapContainer = monitoringSection.querySelector('#map')?.parentElement;
        if (!mapContainer) return;
        
        const quickActionsHTML = `
            <div class="quick-actions-bar">
                <div class="quick-action-btn" onclick="refreshAllData()">
                    <div class="icon">🔄</div>
                    <div class="label">Refresh All</div>
                </div>
                <div class="quick-action-btn" onclick="focusCriticalBins()" title="Filter map to critical bins">
                    <div class="icon">🎯</div>
                    <div class="label">Show Critical</div>
                </div>
                <div class="quick-action-btn" onclick="trackDrivers()">
                    <div class="icon">🚛</div>
                    <div class="label">Track Drivers</div>
                </div>
                <div class="quick-action-btn" onclick="viewAnalytics()">
                    <div class="icon">📊</div>
                    <div class="label">Analytics</div>
                </div>
                <div class="quick-action-btn" onclick="exportReport()">
                    <div class="icon">📥</div>
                    <div class="label">Export</div>
                </div>
            </div>
        `;
        
        mapContainer.insertAdjacentHTML('beforebegin', quickActionsHTML);
    }
    
    function addFiltersSection() {
        const monitoringSection = document.getElementById('monitoring');
        if (!monitoringSection) return;
        
        const mapContainer = monitoringSection.querySelector('#map')?.parentElement;
        if (!mapContainer) return;
        
        const filtersHTML = `
            <div class="filters-section">
                <div class="search-box">
                    <input type="text" placeholder="Search bins, locations, or sensors..." id="binSearch" />
                </div>
                <div class="filter-chips">
                    <div class="filter-chip active" data-filter="all">All Bins</div>
                    <div class="filter-chip" data-filter="critical">Critical (>85%)</div>
                    <div class="filter-chip" data-filter="warning">Warning (>70%)</div>
                    <div class="filter-chip" data-filter="sensors">With Sensors</div>
                    <div class="filter-chip" data-filter="empty">Empty (<25%)</div>
                </div>
            </div>
        `;
        
        mapContainer.insertAdjacentHTML('beforebegin', filtersHTML);
        
        // Add filter functionality
        document.querySelectorAll('.filter-chip').forEach(chip => {
            chip.addEventListener('click', function() {
                document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
                this.classList.add('active');
                const filter = this.dataset.filter;
                filterBinsOnMap(filter);
            });
        });
        
        // Add search functionality
        const searchInput = document.getElementById('binSearch');
        if (searchInput) {
            searchInput.addEventListener('input', function(e) {
                searchBins(e.target.value);
            });
        }
    }
    
    function enhanceSystemStatusCards() {
        // This enhances existing status cards with better styling
        const statusCards = document.querySelectorAll('.stat-card, [class*="stat"]');
        statusCards.forEach(card => {
            if (!card.classList.contains('stat-card-enhanced')) {
                card.classList.add('stat-card-enhanced', 'fade-in');
            }
        });
    }
    
    function addLiveActivityFeed() {
        const sidebar = document.querySelector('.sidebar, #monitoring .col-md-4, #monitoring [class*="col-"]');
        if (!sidebar) return;
        
        const activityHTML = `
            <div class="activity-feed slide-in-right">
                <h3>Recent Activity</h3>
                <div id="activityList">
                    <!-- Activities will be added here dynamically -->
                </div>
            </div>
        `;
        
        sidebar.insertAdjacentHTML('beforeend', activityHTML);
        
        // Start activity feed updates
        updateActivityFeed();
        setInterval(updateActivityFeed, 30000); // Update every 30 seconds
    }
    
    function addPerformanceMetrics() {
        const sidebar = document.querySelector('.sidebar, #monitoring .col-md-4, #monitoring [class*="col-"]');
        if (!sidebar) return;
        
        const metricsHTML = `
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-label">Avg Fill Level</div>
                    <div class="metric-value" id="avgFillLevel">--</div>
                    <div class="metric-trend" id="fillTrend">-- </div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">Collection Rate</div>
                    <div class="metric-value" id="collectionRate">--</div>
                    <div class="metric-trend" id="collectionTrend">--</div>
                </div>
            </div>
        `;
        
        sidebar.insertAdjacentHTML('afterbegin', metricsHTML);
        
        // Update metrics
        updatePerformanceMetrics();
        setInterval(updatePerformanceMetrics, 10000); // Update every 10 seconds
    }
    
    function addRealTimeIndicators() {
        // Single LIVE badge is in the page header (index.html) - no duplicate
    }
    
    // ===== HELPER FUNCTIONS =====
    
    function filterBinsOnMap(filter) {
        if (typeof mapManager === 'undefined' || !mapManager.markers) return;
        
        const bins = typeof dataManager !== 'undefined' ? dataManager.getBins() : [];
        
        Object.entries(mapManager.markers.bins || {}).forEach(([binId, marker]) => {
            const bin = bins.find(b => b.id === binId);
            if (!bin) return;
            
            let show = true;
            const fillLevel = bin.fill || bin.fillLevel || 0;
            
            switch(filter) {
                case 'critical':
                    show = fillLevel > 85;
                    break;
                case 'warning':
                    show = fillLevel > 70 && fillLevel <= 85;
                    break;
                case 'sensors':
                    show = bin.hasSensor || bin.sensorIMEI;
                    break;
                case 'empty':
                    show = fillLevel < 25;
                    break;
                default:
                    show = true;
            }
            
            if (show) {
                marker.setOpacity(1);
            } else {
                marker.setOpacity(0.2);
            }
        });
    }
    
    function searchBins(query) {
        if (!query || typeof mapManager === 'undefined') {
            // Show all bins
            Object.values(mapManager.markers.bins || {}).forEach(marker => {
                marker.setOpacity(1);
            });
            return;
        }
        
        const bins = typeof dataManager !== 'undefined' ? dataManager.getBins() : [];
        const lowerQuery = query.toLowerCase();
        
        Object.entries(mapManager.markers.bins || {}).forEach(([binId, marker]) => {
            const bin = bins.find(b => b.id === binId);
            if (!bin) return;
            
            const searchText = [
                bin.id,
                bin.location,
                bin.sensorIMEI,
                bin.type
            ].join(' ').toLowerCase();
            
            if (searchText.includes(lowerQuery)) {
                marker.setOpacity(1);
            } else {
                marker.setOpacity(0.2);
            }
        });
    }
    
    function updateActivityFeed() {
        const activityList = document.getElementById('activityList');
        if (!activityList || typeof dataManager === 'undefined') return;
        
        const bins = dataManager.getBins();
        const activities = [];
        
        // Get recent collections
        bins.forEach(bin => {
            if (bin.lastCollection && bin.lastCollection !== 'Never') {
                try {
                    const lastDate = new Date(bin.lastCollection);
                    const hoursAgo = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60));
                    if (hoursAgo < 24) {
                        activities.push({
                            type: 'success',
                            icon: '✅',
                            title: `${bin.id} Collected`,
                            details: `Fill level reset to 0%`,
                            time: hoursAgo === 0 ? 'Just now' : `${hoursAgo}h ago`
                        });
                    }
                } catch (e) {}
            }
        });
        
        // Get critical bins
        const criticalBins = bins.filter(b => (b.fill || b.fillLevel || 0) >= 85);
        criticalBins.slice(0, 3).forEach(bin => {
            activities.push({
                type: 'danger',
                icon: '🚨',
                title: `${bin.id} Critical`,
                details: `Fill level: ${bin.fill || bin.fillLevel}%`,
                time: 'Now'
            });
        });
        
        // Sort by time and limit to 10
        const activityHTML = activities.slice(0, 10).map(activity => `
            <div class="activity-item">
                <div class="activity-icon ${activity.type}">
                    ${activity.icon}
                </div>
                <div class="activity-content">
                    <div class="activity-title">${activity.title}</div>
                    <div class="activity-details">${activity.details}</div>
                    <div class="activity-time">${activity.time}</div>
                </div>
            </div>
        `).join('');
        
        activityList.innerHTML = activityHTML || '<div style="color: #64748b; text-align: center; padding: 2rem;">No recent activity</div>';
    }
    
    function updatePerformanceMetrics() {
        if (typeof dataManager === 'undefined') return;
        
        const bins = dataManager.getBins();
        if (bins.length === 0) return;
        
        // Calculate average fill level
        const totalFill = bins.reduce((sum, bin) => sum + (bin.fill || bin.fillLevel || 0), 0);
        const avgFill = Math.round(totalFill / bins.length);
        
        const avgElement = document.getElementById('avgFillLevel');
        if (avgElement) {
            avgElement.textContent = `${avgFill}%`;
        }
        
        const trendElement = document.getElementById('fillTrend');
        if (trendElement) {
            if (avgFill > 70) {
                trendElement.textContent = '↗ Increasing';
                trendElement.className = 'metric-trend negative';
            } else {
                trendElement.textContent = '↘ Stable';
                trendElement.className = 'metric-trend';
            }
        }
        
        // Calculate collection rate (bins collected today)
        const today = new Date().toDateString();
        const collectedToday = bins.filter(bin => {
            if (!bin.lastCollection || bin.lastCollection === 'Never') return false;
            try {
                const lastDate = new Date(bin.lastCollection);
                return lastDate.toDateString() === today;
            } catch (e) {
                return false;
            }
        }).length;
        
        const rateElement = document.getElementById('collectionRate');
        if (rateElement) {
            rateElement.textContent = collectedToday;
        }
        
        const rateTrendElement = document.getElementById('collectionTrend');
        if (rateTrendElement) {
            rateTrendElement.textContent = `${collectedToday} today`;
            rateTrendElement.className = 'metric-trend';
        }
    }
    
    // ===== GLOBAL QUICK ACTION FUNCTIONS =====
    
    window.refreshAllData = function() {
        console.log('🔄 Refreshing all data...');
        if (typeof window.forceRefreshBinsOnMap === 'function') {
            window.forceRefreshBinsOnMap();
        }
        if (typeof syncManager !== 'undefined' && syncManager.syncFromServer) {
            syncManager.syncFromServer();
        }
        if (typeof app !== 'undefined' && app.updateMonitoringStats) {
            app.updateMonitoringStats();
        }
    };
    
    window.focusCriticalBins = function() {
        console.log('🎯 Focusing on critical bins...');
        filterBinsOnMap('critical');
        
        // Activate critical filter chip
        document.querySelectorAll('.filter-chip').forEach(chip => {
            chip.classList.remove('active');
            if (chip.dataset.filter === 'critical') {
                chip.classList.add('active');
            }
        });
        
        // Zoom to critical bins
        if (typeof mapManager !== 'undefined' && typeof dataManager !== 'undefined') {
            const bins = dataManager.getBins();
            const criticalBins = bins.filter(b => (b.fill || b.fillLevel || 0) >= 85);
            if (criticalBins.length > 0 && criticalBins[0].lat && criticalBins[0].lng) {
                mapManager.map.setView([criticalBins[0].lat, criticalBins[0].lng], 14);
            }
        }
    };
    
    window.trackDrivers = function() {
        console.log('🚛 Tracking drivers...');
        if (typeof mapManager !== 'undefined' && mapManager.loadDriversOnMap) {
            mapManager.loadDriversOnMap();
        }
    };
    
    window.viewAnalytics = function() {
        console.log('📊 Switching to analytics...');
        if (typeof app !== 'undefined' && app.showSection) {
            app.showSection('analytics');
        }
    };
    
    window.exportReport = function() {
        console.log('📥 Exporting report...');
        if (typeof dataManager !== 'undefined') {
            const bins = dataManager.getBins();
            const report = {
                timestamp: new Date().toISOString(),
                totalBins: bins.length,
                criticalBins: bins.filter(b => (b.fill || 0) >= 85).length,
                averageFill: Math.round(bins.reduce((sum, b) => sum + (b.fill || 0), 0) / bins.length),
                bins: bins.map(b => ({
                    id: b.id,
                    location: b.location,
                    fill: b.fill || 0,
                    status: b.status,
                    lastCollection: b.lastCollection
                }))
            };
            
            const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `monitoring-report-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }
    };
    
    // ===== AUTO-UPDATE SYSTEM =====
    setInterval(() => {
        updateActivityFeed();
        updatePerformanceMetrics();
    }, 15000); // Update every 15 seconds
    
})();
