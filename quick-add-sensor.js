// quick-add-sensor.js - Quick helper to add sensors

(function() {
    console.log('📡 Loading Quick Sensor Add Tool...');
    
    /**
     * Quick add a sensor
     */
    window.quickAddSensor = async function(imei, binId = null, name = null) {
        try {
            console.log(`📡 Adding sensor: ${imei}`);
            
            const sensor = {
                imei: imei,
                name: name || `Sensor ${imei.substring(0, 8)}`,
                binId: binId,
                status: 'online',
                battery: 85,
                signal: 92,
                operator: 'Ooredoo',
                lastSeen: new Date().toISOString(),
                addedAt: new Date().toISOString()
            };
            
            // Add to backend
            const response = await fetch('/api/sensors/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sensor)
            });
            
            const result = await response.json();
            
            if (result.success) {
                console.log('✅ Sensor added successfully!', result.sensor);
                
                // If binId provided, link it
                if (binId) {
                    console.log(`🔗 Linking sensor to bin ${binId}...`);
                    
                    // Update bin in dataManager
                    if (typeof dataManager !== 'undefined') {
                        const bin = dataManager.getBinById(binId);
                        if (bin) {
                            bin.sensorIMEI = imei;
                            bin.hasSensor = true;
                            bin.sensorData = {
                                battery: sensor.battery,
                                signal: sensor.signal,
                                status: sensor.status,
                                lastSeen: sensor.lastSeen
                            };
                            console.log(`✅ Bin ${binId} updated with sensor data`);
                        } else {
                            console.warn(`⚠️ Bin ${binId} not found`);
                        }
                    }
                    
                    // Update integration
                    if (typeof findyBinSensorIntegration !== 'undefined') {
                        findyBinSensorIntegration.linkBinToSensor(binId, imei);
                    }
                    
                    // Update sensor record with binId
                    await fetch('/api/sensors/update', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...sensor, binId: binId })
                    });
                    
                    console.log(`✅ Sensor ${imei} linked to bin ${binId}`);
                }
                
                // Refresh map
                setTimeout(async () => {
                    console.log('🗺️ Refreshing map...');
                    if (typeof window.forceRefreshBinsWithSensors === 'function') {
                        await window.forceRefreshBinsWithSensors();
                    }
                    if (typeof mapManager !== 'undefined' && mapManager.map) {
                        mapManager.loadBinsOnMap();
                    }
                }, 500);
                
                return result.sensor;
            } else {
                console.error('❌ Failed to add sensor:', result.error);
                return null;
            }
            
        } catch (error) {
            console.error('❌ Error adding sensor:', error);
            return null;
        }
    };
    
    /**
     * Add sensor from Findy API
     */
    window.addSensorFromFindy = async function(imei, binId = null) {
        try {
            console.log(`📡 Fetching sensor ${imei} from Findy API...`);
            
            // Get device info from Findy
            const deviceInfo = await findyClient.getDeviceInfo(imei);
            
            if (!deviceInfo) {
                console.error('❌ Could not fetch device from Findy API');
                return null;
            }
            
            console.log('✅ Device found in Findy:', deviceInfo);
            
            // Extract sensor data
            const sensor = {
                imei: imei,
                name: deviceInfo.name || `Sensor ${imei.substring(0, 8)}`,
                binId: binId,
                status: deviceInfo.online ? 'online' : 'offline',
                battery: deviceInfo.battery || 0,
                signal: deviceInfo.signal || 0,
                operator: deviceInfo.operator || 'Unknown',
                lastSeen: deviceInfo.lastUpdate || new Date().toISOString(),
                addedAt: new Date().toISOString(),
                deviceData: deviceInfo
            };
            
            // Add to backend
            const response = await fetch('/api/sensors/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sensor)
            });
            
            const result = await response.json();
            
            if (result.success) {
                console.log('✅ Sensor added from Findy API!', result.sensor);
                
                // Link to bin if provided
                if (binId) {
                    console.log(`🔗 Linking to bin ${binId}...`);
                    
                    if (typeof dataManager !== 'undefined') {
                        const bin = dataManager.getBinById(binId);
                        if (bin) {
                            bin.sensorIMEI = imei;
                            bin.hasSensor = true;
                            bin.sensorData = {
                                battery: sensor.battery,
                                signal: sensor.signal,
                                status: sensor.status,
                                lastSeen: sensor.lastSeen
                            };
                        }
                    }
                    
                    if (typeof findyBinSensorIntegration !== 'undefined') {
                        findyBinSensorIntegration.linkBinToSensor(binId, imei);
                    }
                    
                    await fetch('/api/sensors/update', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...sensor, binId: binId })
                    });
                }
                
                // Refresh map
                setTimeout(async () => {
                    if (typeof window.forceRefreshBinsWithSensors === 'function') {
                        await window.forceRefreshBinsWithSensors();
                    }
                    if (typeof mapManager !== 'undefined' && mapManager.map) {
                        mapManager.loadBinsOnMap();
                    }
                }, 500);
                
                return result.sensor;
            } else {
                console.error('❌ Failed to add sensor:', result.error);
                return null;
            }
            
        } catch (error) {
            console.error('❌ Error adding sensor from Findy:', error);
            return null;
        }
    };
    
    /**
     * List all sensors
     */
    window.listSensors = async function() {
        try {
            const response = await fetch('/api/sensors/list');
            const result = await response.json();
            
            if (result.success) {
                console.log(`📡 Total Sensors: ${result.sensors.length}`);
                result.sensors.forEach(sensor => {
                    console.log(`  - ${sensor.imei} (${sensor.name})`);
                    console.log(`    Status: ${sensor.status}`);
                    console.log(`    Linked to: ${sensor.binId || 'NOT LINKED'}`);
                    console.log(`    Battery: ${sensor.battery}%`);
                });
                return result.sensors;
            }
        } catch (error) {
            console.error('❌ Error listing sensors:', error);
        }
    };
    
    console.log('✅ Quick Sensor Add Tool loaded');
    console.log('');
    console.log('📡 AVAILABLE COMMANDS:');
    console.log('');
    console.log('  1. Add sensor (manual):');
    console.log('     await quickAddSensor("868324050123456", "BIN-001")');
    console.log('');
    console.log('  2. Add sensor from Findy API:');
    console.log('     await addSensorFromFindy("868324050123456", "BIN-001")');
    console.log('');
    console.log('  3. List all sensors:');
    console.log('     await listSensors()');
    console.log('');
    console.log('💡 Replace IMEI and BIN ID with your actual values!');
    console.log('');
    
})();


