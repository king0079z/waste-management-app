// force-save-bin-sensor-link.js - Force save bin-sensor links to database

(function() {
    console.log('💾 Loading Force Save Bin-Sensor Link Fix...');
    
    /**
     * Force save a bin with sensor data to database
     */
    window.forceSaveBinWithSensor = async function(binId, sensorIMEI) {
        try {
            console.log(`💾 Force saving bin ${binId} with sensor ${sensorIMEI}...`);
            
            // Get bin from dataManager
            if (typeof dataManager === 'undefined') {
                console.error('❌ dataManager not available');
                return false;
            }
            
            const bin = dataManager.getBinById(binId);
            if (!bin) {
                console.error(`❌ Bin ${binId} not found`);
                return false;
            }
            
            // Update bin with sensor data
            bin.sensorIMEI = sensorIMEI;
            bin.hasSensor = true;
            
            // Get sensor data if available
            try {
                const sensorResponse = await fetch('/api/sensors/list');
                const sensorResult = await sensorResponse.json();
                const sensor = sensorResult.sensors.find(s => s.imei === sensorIMEI);
                
                if (sensor) {
                    bin.sensorData = {
                        battery: sensor.battery || 85,
                        signal: sensor.signal || 92,
                        status: sensor.status || 'online',
                        lastSeen: sensor.lastSeen || new Date().toISOString()
                    };
                    console.log(`📡 Added sensor data to bin:`, bin.sensorData);
                }
            } catch (error) {
                console.warn('⚠️ Could not fetch sensor data:', error);
            }
            
            // Save to dataManager
            if (bin && bin.id) {
                const updated = dataManager.updateBin(bin);
                console.log(`💾 Bin updated in dataManager:`, updated);
            } else {
                console.warn(`⚠️ Cannot update bin - missing bin or bin.id:`, bin);
            }
            
            // Force save to server/database
            try {
                const saveResponse = await fetch('/api/data/sync', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        bins: dataManager.getBins(),
                        _forceUpdate: true
                    })
                });
                
                const saveResult = await saveResponse.json();
                console.log(`💾 Saved to server:`, saveResult);
            } catch (error) {
                console.warn('⚠️ Could not save to server:', error);
            }
            
            // Update integration mapping
            if (typeof findyBinSensorIntegration !== 'undefined') {
                findyBinSensorIntegration.linkBinToSensor(binId, sensorIMEI);
                console.log(`🔗 Updated integration mapping`);
            }
            
            // Force refresh map
            await new Promise(resolve => setTimeout(resolve, 500));
            
            if (typeof mapManager !== 'undefined' && mapManager.map) {
                // Clear existing markers
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
                
                // Reload bins
                mapManager.loadBinsOnMap();
                console.log(`🗺️ Map reloaded with updated bins`);
            }
            
            console.log(`✅ Bin ${binId} saved with sensor ${sensorIMEI}!`);
            return true;
            
        } catch (error) {
            console.error('❌ Error force saving bin:', error);
            return false;
        }
    };
    
    /**
     * Check and fix all bin-sensor links
     */
    window.checkAndFixAllBinSensorLinks = async function() {
        try {
            console.log('🔍 Checking all bin-sensor links...');
            
            // Get all sensors
            const response = await fetch('/api/sensors/list');
            const result = await response.json();
            const sensors = result.sensors || [];
            
            console.log(`📡 Found ${sensors.length} sensors`);
            
            let fixed = 0;
            for (const sensor of sensors) {
                if (sensor.binId) {
                    console.log(`🔧 Fixing link: ${sensor.imei} → ${sensor.binId}`);
                    const success = await forceSaveBinWithSensor(sensor.binId, sensor.imei);
                    if (success) fixed++;
                    
                    // Wait a bit between saves
                    await new Promise(resolve => setTimeout(resolve, 300));
                }
            }
            
            console.log(`✅ Fixed ${fixed} bin-sensor links`);
            
            // Final map refresh
            if (typeof mapManager !== 'undefined' && mapManager.map) {
                await new Promise(resolve => setTimeout(resolve, 500));
                mapManager.loadBinsOnMap();
            }
            
            return fixed;
            
        } catch (error) {
            console.error('❌ Error checking bin-sensor links:', error);
            return 0;
        }
    };
    
    // Auto-fix on load
    setTimeout(async () => {
        console.log('🔧 Auto-checking bin-sensor links...');
        const fixed = await checkAndFixAllBinSensorLinks();
        if (fixed > 0) {
            console.log(`🎉 Auto-fixed ${fixed} bin-sensor links!`);
        }
    }, 8000);
    
    console.log('✅ Force Save Bin-Sensor Link Fix loaded');
    console.log('💡 Commands:');
    console.log('  - forceSaveBinWithSensor("BIN-001", "865456059002301")');
    console.log('  - checkAndFixAllBinSensorLinks()');
    
})();


