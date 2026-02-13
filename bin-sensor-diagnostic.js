// bin-sensor-diagnostic.js - Diagnose and fix bin-sensor display issues

(function() {
    console.log('🔍 Loading Bin-Sensor Diagnostic Tool...');
    
    /**
     * Check sensor and bin status
     */
    async function diagnoseBinSensors() {
        console.log('\n========================================');
        console.log('🔍 BIN-SENSOR DIAGNOSTIC REPORT');
        console.log('========================================\n');
        
        // 1. Check sensors
        console.log('📡 SENSORS:');
        try {
            const response = await fetch('/api/sensors/list');
            const result = await response.json();
            const sensors = result.sensors || [];
            
            console.log(`  Total Sensors: ${sensors.length}`);
            sensors.forEach(sensor => {
                console.log(`  - IMEI: ${sensor.imei}`);
                console.log(`    Status: ${sensor.status}`);
                console.log(`    Linked to: ${sensor.binId || 'NOT LINKED'}`);
                console.log(`    Battery: ${sensor.battery || 'N/A'}%`);
            });
        } catch (error) {
            console.error('  ❌ Error loading sensors:', error);
        }
        
        // 2. Check bins
        console.log('\n🗑️ BINS:');
        if (typeof dataManager !== 'undefined') {
            const bins = dataManager.getBins();
            console.log(`  Total Bins: ${bins.length}`);
            bins.forEach(bin => {
                console.log(`  - ${bin.id} (${bin.location})`);
                console.log(`    Has Sensor: ${bin.hasSensor ? 'YES ✅' : 'NO'}`);
                console.log(`    Sensor IMEI: ${bin.sensorIMEI || 'NOT SET'}`);
                console.log(`    Fill: ${bin.fill}%`);
            });
        } else {
            console.log('  ❌ dataManager not available');
        }
        
        // 3. Check mappings
        console.log('\n🔗 MAPPINGS:');
        if (typeof findyBinSensorIntegration !== 'undefined') {
            console.log('  Bin → Sensor Mapping:', findyBinSensorIntegration.binSensorMapping);
            console.log('  Sensor → Bin Mapping:', findyBinSensorIntegration.sensorToBinMapping);
        } else {
            console.log('  ❌ findyBinSensorIntegration not available');
        }
        
        // 4. Check map markers
        console.log('\n🗺️ MAP STATUS:');
        if (typeof mapManager !== 'undefined') {
            console.log(`  Map Initialized: ${mapManager.map ? 'YES ✅' : 'NO ❌'}`);
            if (mapManager.markers && mapManager.markers.bins) {
                console.log(`  Bin Markers on Map: ${Object.keys(mapManager.markers.bins).length}`);
                Object.keys(mapManager.markers.bins).forEach(binId => {
                    console.log(`    - ${binId}`);
                });
            }
        } else {
            console.log('  ❌ mapManager not available');
        }
        
        // 5. Check Findy API
        console.log('\n🌐 FINDY API:');
        try {
            const health = await fetch('/api/findy/health').then(r => r.json());
            console.log(`  Connected: ${health.authenticated ? 'YES ✅' : 'NO ❌'}`);
            console.log(`  Status:`, health);
        } catch (error) {
            console.error('  ❌ Error checking Findy API:', error);
        }
        
        console.log('\n========================================\n');
    }
    
    /**
     * Force refresh bins with sensors on map
     */
    async function forceRefreshBinsWithSensors() {
        console.log('🔄 Force refreshing bins with sensors...');
        
        try {
            // 1. Reload sensor mappings
            if (typeof findyBinSensorIntegration !== 'undefined') {
                await findyBinSensorIntegration.loadBinSensorMappings();
            }
            
            // 2. Get all sensors
            const response = await fetch('/api/sensors/list');
            const result = await response.json();
            const sensors = result.sensors || [];
            
            console.log(`📡 Found ${sensors.length} sensors`);
            
            // 3. Link sensors to bins
            for (const sensor of sensors) {
                if (sensor.binId) {
                    console.log(`🔗 Linking sensor ${sensor.imei} to bin ${sensor.binId}`);
                    
                    // Update dataManager
                    if (typeof dataManager !== 'undefined') {
                        const bin = dataManager.getBinById(sensor.binId);
                        if (bin) {
                            bin.sensorIMEI = sensor.imei;
                            bin.hasSensor = true;
                            bin.sensorData = {
                                battery: sensor.battery,
                                signal: sensor.signal,
                                status: sensor.status,
                                lastSeen: sensor.lastSeen
                            };
                        }
                    }
                    
                    // Update integration
                    if (typeof findyBinSensorIntegration !== 'undefined') {
                        findyBinSensorIntegration.linkBinToSensor(sensor.binId, sensor.imei);
                    }
                }
            }
            
            // 4. Force map refresh
            await new Promise(resolve => setTimeout(resolve, 500));
            
            if (typeof mapManager !== 'undefined' && mapManager.map) {
                console.log('🗺️ Reloading bins on map...');
                
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
                
                console.log('✅ Bins reloaded on map');
            }
            
            // 5. Call global refresh if available
            if (typeof window.forceRefreshBinsOnMap === 'function') {
                setTimeout(() => window.forceRefreshBinsOnMap(), 1000);
            }
            
            console.log('✅ Refresh complete!');
            
        } catch (error) {
            console.error('❌ Error refreshing bins with sensors:', error);
        }
    }
    
    /**
     * Create bins if they don't exist
     */
    function createMissingBins() {
        if (typeof dataManager === 'undefined') {
            console.log('❌ dataManager not available');
            return;
        }
        
        const existingBins = dataManager.getBins();
        const existingIds = existingBins.map(b => b.id);
        
        // Default bins in Doha
        const defaultBins = [
            { id: 'BIN-001', location: 'Al Wakrah', lat: 25.1714, lng: 51.5991, fill: 45 },
            { id: 'BIN-002', location: 'West Bay', lat: 25.3213, lng: 51.5320, fill: 78 },
            { id: 'BIN-003', location: 'The Pearl-Qatar', lat: 25.3716, lng: 51.5378, fill: 59 },
            { id: 'BIN-004', location: 'Doha Corniche', lat: 25.2854, lng: 51.5310, fill: 23 },
            { id: 'BIN-005', location: 'Lusail City', lat: 25.4364, lng: 51.4839, fill: 64 },
        ];
        
        let created = 0;
        defaultBins.forEach(binData => {
            if (!existingIds.includes(binData.id)) {
                dataManager.addBin(binData);
                created++;
                console.log(`✅ Created bin: ${binData.id}`);
            }
        });
        
        if (created > 0) {
            console.log(`✅ Created ${created} missing bins`);
        } else {
            console.log('✅ All bins already exist');
        }
    }
    
    // Initialize: auto-run diagnostic after 5 seconds (no floating button)
    setTimeout(async () => {
        console.log('🔍 Running automatic bin-sensor diagnostic...');
        await forceRefreshBinsWithSensors();
    }, 5000);
    
    // Expose global functions
    window.diagnoseBinSensors = diagnoseBinSensors;
    window.forceRefreshBinsWithSensors = forceRefreshBinsWithSensors;
    window.createMissingBins = createMissingBins;
    
    console.log('✅ Bin-Sensor Diagnostic Tool loaded');
    console.log('💡 Commands:');
    console.log('  - diagnoseBinSensors() - Full diagnostic report');
    console.log('  - forceRefreshBinsWithSensors() - Force refresh bins on map');
    console.log('  - createMissingBins() - Create default bins');
    
})();


