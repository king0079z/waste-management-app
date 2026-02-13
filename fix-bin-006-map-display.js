// fix-bin-006-map-display.js
// Fix to ensure BIN-006 appears on the map after being created and linked to sensor

(function() {
    console.log('🔧 Loading BIN-006 map display fix...');
    
    // Function to force refresh and verify BIN-006 is on map
    window.forceRefreshBin006 = function() {
        console.log('🔄 Force refreshing map to show BIN-006...');
        
        if (typeof dataManager === 'undefined') {
            console.error('❌ dataManager not available');
            return false;
        }
        
        if (typeof mapManager === 'undefined' || !mapManager.map) {
            console.error('❌ mapManager or map not available');
            return false;
        }
        
        // Get all bins from dataManager
        const bins = dataManager.getBins();
        console.log(`📦 Found ${bins.length} bins in dataManager`);
        
        // Check if BIN-006 exists
        const bin006 = bins.find(b => b.id === 'BIN-006');
        if (!bin006) {
            console.error('❌ BIN-006 not found in dataManager bins!');
            console.log('Available bin IDs:', bins.map(b => b.id));
            return false;
        }
        
        console.log(`✅ BIN-006 found:`, {
            id: bin006.id,
            location: bin006.location,
            lat: bin006.lat,
            lng: bin006.lng,
            hasSensor: bin006.hasSensor || bin006.sensorIMEI,
            sensorIMEI: bin006.sensorIMEI
        });
        
        if (!bin006.lat || !bin006.lng) {
            console.error('❌ BIN-006 missing coordinates!');
            return false;
        }
        
        // Clear existing bin markers
        if (mapManager.layers.bins) {
            mapManager.layers.bins.clearLayers();
        }
        if (mapManager.markers.bins) {
            Object.values(mapManager.markers.bins).forEach(marker => {
                if (mapManager.map) {
                    mapManager.map.removeLayer(marker);
                }
            });
            mapManager.markers.bins = {};
        }
        
        // Reload all bins
        mapManager.loadBinsOnMap();
        
        // Verify BIN-006 was added
        setTimeout(() => {
            const bin006Marker = mapManager.markers?.bins?.['BIN-006'];
            if (bin006Marker) {
                console.log('✅ BIN-006 marker successfully added to map!');
                // Pan to BIN-006 location
                mapManager.map.setView([bin006.lat, bin006.lng], 15);
            } else {
                console.error('❌ BIN-006 marker still not on map after refresh!');
                console.log('Current markers:', Object.keys(mapManager.markers?.bins || {}));
                // Try adding it directly
                if (bin006.lat && bin006.lng) {
                    console.log('🔧 Attempting to add BIN-006 marker directly...');
                    mapManager.addBinMarker(bin006);
                }
            }
        }, 1000);
        
        return true;
    };
    
    // Auto-refresh when page loads if BIN-006 exists
    setTimeout(() => {
        if (typeof dataManager !== 'undefined' && typeof mapManager !== 'undefined') {
            const bins = dataManager.getBins();
            const bin006 = bins.find(b => b.id === 'BIN-006');
            if (bin006 && mapManager.map) {
                console.log('🔄 Auto-refreshing map to show BIN-006...');
                window.forceRefreshBin006();
            }
        }
    }, 2000);
    
    console.log('✅ BIN-006 map display fix loaded. Call window.forceRefreshBin006() to manually refresh.');
})();
