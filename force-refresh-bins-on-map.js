// force-refresh-bins-on-map.js - Force refresh bins on map when sensors are added
// This ensures bins with newly added sensors appear immediately

(function() {
    console.log('🗺️ Bin refresh helper loaded');
    var lastForceRefreshAt = 0;
    var FORCE_REFRESH_THROTTLE_MS = 2500;
    
    // Function to force refresh bins on map (throttled to reduce console spam)
    window.forceRefreshBinsOnMap = function() {
        try {
            var now = Date.now();
            if (now - lastForceRefreshAt < FORCE_REFRESH_THROTTLE_MS) return true;
            lastForceRefreshAt = now;
            if (typeof mapManager !== 'undefined' && mapManager.map) {
                if (typeof window._forceRefreshLogCount !== 'number') window._forceRefreshLogCount = 0;
                if (++window._forceRefreshLogCount <= 2) console.log('🔄 Force refreshing bins on map...');
                
                // Get bins from dataManager first
                if (typeof dataManager !== 'undefined') {
                    const bins = dataManager.getBins();
                    console.log(`📦 Found ${bins.length} bins in dataManager`);
                    
                    // Check for BIN-006 specifically
                    const bin006 = bins.find(b => b.id === 'BIN-006');
                    if (bin006) {
                        console.log(`✅ BIN-006 found in dataManager:`, {
                            id: bin006.id,
                            lat: bin006.lat,
                            lng: bin006.lng,
                            hasSensor: bin006.hasSensor || bin006.sensorIMEI
                        });
                    } else {
                        console.warn('⚠️ BIN-006 not found in dataManager bins');
                    }
                }
                
                // Clear existing bin markers
                if (mapManager.layers.bins) {
                    mapManager.layers.bins.clearLayers();
                }
                if (mapManager.markers.bins) {
                    Object.keys(mapManager.markers.bins).forEach(binId => {
                        if (mapManager.map && mapManager.markers.bins[binId]) {
                            mapManager.map.removeLayer(mapManager.markers.bins[binId]);
                        }
                    });
                    mapManager.markers.bins = {};
                }
                
                // Reload all bins (force so throttle does not skip)
                if (typeof mapManager.loadBinsOnMap === 'function') {
                    mapManager.loadBinsOnMap(true);
                }
                
                // Verify BIN-006 was added
                setTimeout(() => {
                    if (mapManager.markers?.bins?.['BIN-006']) {
                        console.log('✅ BIN-006 marker successfully added to map!');
                    } else {
                        console.warn('⚠️ BIN-006 marker not found after refresh');
                        // Try to add it directly if it exists in dataManager
                        if (typeof dataManager !== 'undefined') {
                            const bin006 = dataManager.getBinById('BIN-006');
                            if (bin006 && bin006.lat && bin006.lng) {
                                console.log('🔧 Attempting to add BIN-006 marker directly...');
                                mapManager.addBinMarker(bin006);
                            }
                        }
                    }
                }, 500);
                
                console.log('✅ Bins refreshed on map');
                
                if (typeof showNotification === 'function') {
                    showNotification('Map refreshed - bins with sensors updated', 'success');
                }
                
                return true;
            } else {
                console.warn('⚠️ Map not initialized yet');
                return false;
            }
        } catch (error) {
            console.error('Error refreshing bins on map:', error);
            return false;
        }
    };
    
    // Listen for sensor linked events
    window.addEventListener('bin:sensor-updated', (event) => {
        console.log('📡 Bin sensor updated, refreshing map...', event.detail);
        setTimeout(() => {
            window.forceRefreshBinsOnMap();
        }, 1000);
    });
    
    // Listen for bin added events
    window.addEventListener('bin:added', (event) => {
        console.log('📦 Bin added event received, refreshing map...', event.detail);
        setTimeout(() => {
            window.forceRefreshBinsOnMap();
        }, 500);
    });
    
    // Listen for data sync completion
    if (typeof syncManager !== 'undefined') {
        const originalSyncFromServer = syncManager.syncFromServer;
        if (originalSyncFromServer) {
            syncManager.syncFromServer = async function(...args) {
                const result = await originalSyncFromServer.apply(this, args);
                // Refresh map after sync
                setTimeout(() => {
                    console.log('🔄 Data synced, refreshing bins on map...');
                    window.forceRefreshBinsOnMap();
                }, 500);
                return result;
            };
        }
    }
    
    // When sensor management adds a sensor, refresh the map (only when findyBinSensorIntegration is loaded)
    function patchFindyLinkBinToSensor() {
        if (typeof findyBinSensorIntegration === 'undefined' || findyBinSensorIntegration == null) return;
        var integration = findyBinSensorIntegration;
        if (typeof integration.linkBinToSensor !== 'function') return;
        if (integration.linkBinToSensor._forceRefreshPatched) return;
        var originalLinkBinToSensor = integration.linkBinToSensor;
        integration.linkBinToSensor = function() {
            var result = originalLinkBinToSensor.apply(this, arguments);
            setTimeout(function() {
                console.log('🗺️ Auto-refreshing map after sensor link...');
                if (typeof window.forceRefreshBinsOnMap === 'function') window.forceRefreshBinsOnMap();
            }, 1500);
            return result;
        };
        integration.linkBinToSensor._forceRefreshPatched = true;
    }
    patchFindyLinkBinToSensor();
    setTimeout(patchFindyLinkBinToSensor, 2000);
    
    console.log('✅ Bin refresh helper ready');
})();

// No duplicate Refresh Bins button - use "Refresh All" in the Live Monitoring quick actions bar only


