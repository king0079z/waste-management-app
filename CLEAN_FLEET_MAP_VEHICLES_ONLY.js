// CLEAN_FLEET_MAP_VEHICLES_ONLY.js
// Complete rebuild - Fleet map shows ONLY vehicles/drivers, NO BINS

(function() {
    'use strict';

    console.log('🚛 CLEAN FLEET MAP (VEHICLES ONLY) - Loading...');

    // Wait for everything to load
    setTimeout(() => {
        if (!window.fleetManager) {
            return; // Fleet Manager only exists on Fleet page
        }

        console.log('✅ Fleet Manager found, rebuilding fleet map...');

        // ============= COMPLETELY OVERRIDE loadVehiclesOnMap =============
        
        window.fleetManager.loadVehiclesOnMap = function() {
            console.log('📍 CLEAN loadVehiclesOnMap: VEHICLES ONLY (NO BINS)');
            
            if (!this.fleetMap || !this.fleetMapLayer) {
                console.warn('⚠️ Fleet map not ready');
                return;
            }
            
            // Clear everything
            this.fleetMapLayer.clearLayers();
            
            if (!(this.fleetMapMarkers instanceof Map)) {
                this.fleetMapMarkers = new Map();
            }
            this.fleetMapMarkers.clear();
            
            // Get ONLY driver data (NO bins!)
            const drivers = window.dataManager.getUsers().filter(u => u.type === 'driver');
            const locations = window.dataManager.getAllDriverLocations();
            
            console.log(`📍 Loading ${drivers.length} vehicles only...`);
            
            // Add ONLY drivers to map
            drivers.forEach(driver => {
                let location = locations[driver.id];
                
                if (!location || !location.lat || !location.lng) {
                    location = {
                        lat: 25.2854 + (Math.random() * 0.02 - 0.01),
                        lng: 51.5310 + (Math.random() * 0.02 - 0.01),
                        timestamp: new Date().toISOString()
                    };
                }
                
                this.addDriverToMap(driver, location);
            });
            
            console.log(`✅ CLEAN: Loaded ${this.fleetMapMarkers.size} vehicles ONLY (bins excluded)`);
            
            // Fit map to vehicles
            if (this.fleetMapMarkers.size > 0) {
                const bounds = [];
                this.fleetMapMarkers.forEach(m => bounds.push(m.getLatLng()));
                if (bounds.length > 0) {
                    this.fleetMap.fitBounds(bounds, { padding: [60, 60] });
                }
            }
        };

        // ============= PREVENT BINS FROM BEING ADDED =============
        
        // Override any function that might add bins
        const originalAddVehicleToMap = window.fleetManager.addVehicleToMap;
        window.fleetManager.addVehicleToMap = function(vehicle) {
            // Skip if this looks like a bin
            if (vehicle.fillLevel !== undefined || vehicle.fill !== undefined || vehicle.type === 'bin') {
                console.log('🚫 Blocked bin from being added to fleet map');
                return;
            }
            
            // Otherwise, add the vehicle
            if (originalAddVehicleToMap) {
                originalAddVehicleToMap.call(this, vehicle);
            }
        };

        // ============= FORCE CLEAN REFRESH =============
        
        window.forceCleanFleetMap = function() {
            console.log('🧹 FORCING CLEAN FLEET MAP (VEHICLES ONLY)...');
            
            if (!window.fleetManager || !window.fleetManager.fleetMap) {
                console.error('❌ Fleet map not initialized');
                return;
            }
            
            // Clear completely
            if (window.fleetManager.fleetMapLayer) {
                window.fleetManager.fleetMapLayer.clearLayers();
            }
            if (window.fleetManager.fleetMapMarkers) {
                window.fleetManager.fleetMapMarkers.clear();
            }
            
            // Reload ONLY vehicles
            window.fleetManager.loadVehiclesOnMap();
            
            console.log('✅ Fleet map cleaned - vehicles only!');
        };

        // ============= AUTO-CLEAN ON PAGE LOAD =============
        
        // Monitor for fleet page becoming visible
        const observer = new MutationObserver(() => {
            const fleetSection = document.getElementById('fleet');
            const fleetMapContainer = document.getElementById('fleetMapContainer');
            
            if (fleetSection && fleetSection.style.display !== 'none' && 
                fleetMapContainer && window.fleetManager.fleetMap) {
                
                // Check if bins are on the map
                if (window.fleetManager.fleetMapMarkers) {
                    const hasBins = Array.from(window.fleetManager.fleetMapMarkers.keys()).some(key => 
                        key.startsWith('BIN-') || key.includes('bin')
                    );
                    
                    if (hasBins) {
                        console.log('🚫 Detected bins on fleet map, cleaning...');
                        setTimeout(() => window.forceCleanFleetMap(), 100);
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

        console.log('✅ CLEAN FLEET MAP installed - vehicles only mode active');
        
        // Try to clean immediately if already on fleet page
        setTimeout(() => {
            const fleetSection = document.getElementById('fleet');
            if (fleetSection && fleetSection.style.display !== 'none') {
                console.log('🧹 Auto-cleaning fleet map on load...');
                if (window.fleetManager.fleetMap) {
                    window.forceCleanFleetMap();
                }
            }
        }, 3000);

    }, 2000);

    console.log('✅ Clean Fleet Map (Vehicles Only) loaded');

})();
