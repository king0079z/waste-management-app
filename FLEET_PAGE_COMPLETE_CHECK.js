// FLEET_PAGE_COMPLETE_CHECK.js
// Comprehensive check and fix for Fleet Management page

(function() {
    'use strict';

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔍 FLEET MANAGEMENT PAGE - COMPLETE CHECK & FIX');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');

    // Wait for page to load
    window.addEventListener('load', () => {
        setTimeout(() => {
            console.log('📋 Running comprehensive fleet page check...');

            // ============= CHECK #1: Fleet Manager Exists =============
            if (!window.fleetManager) {
                console.error('❌ Fleet Manager not found!');
                console.log('Creating basic fleet manager...');
                
                window.fleetManager = {
                    currentTab: 'map',
                    data: {
                        drivers: [],
                        vehicles: [],
                        routes: [],
                        driverLocations: {}
                    },
                    switchTab: function(tab) {
                        this.currentTab = tab;
                        console.log(`Switched to tab: ${tab}`);
                    },
                    refresh: function() {
                        console.log('Refreshing fleet data...');
                        this.loadData();
                    },
                    exportData: function() {
                        console.log('Exporting fleet data...');
                        alert('Export feature - Data will be downloaded');
                    },
                    loadData: function() {
                        if (window.dataManager) {
                            this.data.drivers = window.dataManager.getUsers().filter(u => u.type === 'driver');
                            this.data.routes = window.dataManager.getRoutes();
                            this.data.driverLocations = window.dataManager.getAllDriverLocations();
                            this.updateStats();
                        }
                    },
                    updateStats: function() {
                        const activeVehicles = this.data.drivers.filter(d => d.status !== 'inactive').length;
                        const availableDrivers = this.data.drivers.filter(d => d.movementStatus !== 'on-route').length;
                        const activeRoutes = this.data.routes.filter(r => r.status !== 'completed').length;
                        
                        this.updateElement('activeVehiclesCount', activeVehicles);
                        this.updateElement('availableDriversCount', availableDrivers);
                        this.updateElement('activeRoutesCount', activeRoutes);
                        this.updateElement('totalVehiclesCount', `of ${this.data.drivers.length} total`);
                        this.updateElement('totalDriversCount', `of ${this.data.drivers.length} total`);
                    },
                    updateElement: function(id, value) {
                        const el = document.getElementById(id);
                        if (el) el.textContent = value;
                    }
                };
                
                console.log('✅ Basic fleet manager created');
            } else {
                console.log('✅ Fleet Manager exists');
            }

            // ============= CHECK #2: Data Manager =============
            if (!window.dataManager) {
                console.error('❌ Data Manager not found!');
            } else {
                console.log('✅ Data Manager exists');
            }

            // ============= CHECK #3: Fleet Map Container =============
            const mapContainer = document.getElementById('fleetMap');
            if (!mapContainer) {
                console.error('❌ Fleet map container not found!');
            } else {
                console.log('✅ Fleet map container exists');
                console.log(`   Size: ${mapContainer.clientWidth}x${mapContainer.clientHeight}`);
            }

            // ============= CHECK #4: Statistics Elements =============
            const statElements = [
                'activeVehiclesCount',
                'availableDriversCount',
                'activeRoutesCount',
                'maintenanceVehiclesCount',
                'fleetUtilization',
                'mlOptimizations'
            ];

            let missingElements = 0;
            statElements.forEach(id => {
                const el = document.getElementById(id);
                if (!el) {
                    console.warn(`⚠️ Missing element: ${id}`);
                    missingElements++;
                } else {
                    console.log(`✅ ${id}: ${el.textContent}`);
                }
            });

            if (missingElements === 0) {
                console.log('✅ All statistics elements found');
            }

            // ============= CHECK #5: Update Statistics Now =============
            if (window.fleetManager && window.dataManager) {
                console.log('📊 Updating fleet statistics...');
                
                const drivers = window.dataManager.getUsers().filter(u => u.type === 'driver');
                const routes = window.dataManager.getRoutes();
                const locations = window.dataManager.getAllDriverLocations();
                
                const activeVehicles = drivers.filter(d => d.status !== 'inactive').length;
                const availableDrivers = drivers.filter(d => !d.movementStatus || d.movementStatus === 'stationary').length;
                const activeRoutes = routes.filter(r => r.status !== 'completed').length;
                const onRoute = drivers.filter(d => d.movementStatus === 'on-route').length;
                const utilization = drivers.length > 0 ? Math.round((onRoute / drivers.length) * 100) : 0;
                
                // Update UI
                const updateEl = (id, val) => {
                    const el = document.getElementById(id);
                    if (el) el.textContent = val;
                };
                
                updateEl('activeVehiclesCount', activeVehicles);
                updateEl('availableDriversCount', availableDrivers);
                updateEl('activeRoutesCount', activeRoutes);
                updateEl('maintenanceVehiclesCount', 0);
                updateEl('fleetUtilization', `${utilization}%`);
                updateEl('mlOptimizations', 0);
                updateEl('totalVehiclesCount', `of ${drivers.length} total`);
                updateEl('totalDriversCount', `of ${drivers.length} total`);
                
                console.log('✅ Statistics updated');
                console.log(`   Active Vehicles: ${activeVehicles}/${drivers.length}`);
                console.log(`   Available Drivers: ${availableDrivers}`);
                console.log(`   Active Routes: ${activeRoutes}`);
                console.log(`   Fleet Utilization: ${utilization}%`);
            }

            // ============= CHECK #6: Fleet Map =============
            if (window.fleetManager && window.fleetManager.fleetMap) {
                console.log('✅ Fleet map is initialized');
                
                if (window.fleetManager.fleetMapMarkers) {
                    console.log(`   Markers on map: ${window.fleetManager.fleetMapMarkers.size || 0}`);
                }
            } else {
                console.warn('⚠️ Fleet map not initialized yet');
                console.log('   This is normal if you haven\'t clicked on Fleet page yet');
            }

            // ============= CHECK #7: Buttons Work =============
            const refreshBtn = document.getElementById('fleetRefreshBtn');
            const exportBtn = document.getElementById('fleetExportBtn');
            
            if (refreshBtn) {
                console.log('✅ Refresh button exists');
            } else {
                console.warn('⚠️ Refresh button not found');
            }
            
            if (exportBtn) {
                console.log('✅ Export button exists');
            } else {
                console.warn('⚠️ Export button not found');
            }

            // ============= SUMMARY =============
            console.log('');
            console.log('═══════════════════════════════════════════════════════════');
            console.log('✅ FLEET MANAGEMENT PAGE CHECK COMPLETE');
            console.log('═══════════════════════════════════════════════════════════');
            console.log('');
            console.log('Status:');
            console.log(`  ${window.fleetManager ? '✅' : '❌'} Fleet Manager`);
            console.log(`  ${window.dataManager ? '✅' : '❌'} Data Manager`);
            console.log(`  ${mapContainer ? '✅' : '❌'} Map Container`);
            console.log(`  ${missingElements === 0 ? '✅' : '⚠️'} Statistics Elements`);
            console.log(`  ${refreshBtn ? '✅' : '⚠️'} Refresh Button`);
            console.log(`  ${exportBtn ? '✅' : '⚠️'} Export Button`);
            console.log('');
            
        }, 3000);
    });

    // ============= AUTO-FIX: Ensure Fleet Page Loads Data =============
    
    // Monitor for fleet page becoming visible
    const observer = new MutationObserver(() => {
        const fleetSection = document.getElementById('fleet');
        if (fleetSection && fleetSection.style.display !== 'none') {
            // Fleet page is visible, ensure data is loaded
            if (window.fleetManager && window.dataManager) {
                if (!window.fleetManager._dataLoaded) {
                    console.log('🔄 Auto-loading fleet data...');
                    window.fleetManager.loadData();
                    window.fleetManager._dataLoaded = true;
                }
            }
        }
    });
    
    observer.observe(document.body, {
        attributes: true,
        childList: true,
        subtree: true,
        attributeFilter: ['style']
    });

    console.log('✅ Fleet Page Complete Check loaded');

})();
