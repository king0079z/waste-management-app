// sensor-management-admin.js - Admin Panel for Findy IoT Sensor Management
// Manage 3000+ sensors with easy add, link, and status monitoring

class SensorManagementAdmin {
    constructor() {
        this.sensors = new Map(); // All registered sensors
        this.sensorStatus = new Map(); // Real-time status
        this.refreshInterval = null;
        
        console.log('🔧 Sensor Management Admin initialized');
    }
    
    /**
     * Initialize the sensor management panel
     */
    async initialize() {
        try {
            console.log('🚀 Initializing Sensor Management Admin...');
            
            // Load existing sensors from database
            await this.loadSensors();
            
            // Check Findy API connection
            if (typeof findyClient !== 'undefined' && findyClient.healthCheck) {
                console.log('🔍 Checking Findy API health...');
                const health = await findyClient.healthCheck();
                this.updateAPIStatus(health);
                
                if (health.authenticated) {
                    console.log('✅ Findy API connected');
                    
                    // Always fetch fresh status from Findy when opening Sensor Management (clear cache)
                    if (typeof sensorStatusManager !== 'undefined' && sensorStatusManager.clearAllCaches) {
                        sensorStatusManager.clearAllCaches();
                    }
                    
                    // Fetch initial sensor statuses
                    if (this.sensors.size > 0) {
                        console.log(`📡 Fetching initial status for ${this.sensors.size} sensors...`);
                        await this.checkAllSensorStatus();
                    }
                } else {
                    console.warn('⚠️ Findy API not authenticated');
                }
            } else {
                console.warn('⚠️ FindyClient not available');
                this.updateAPIStatus({ authenticated: false });
            }
            
            // Start status monitoring
            this.startStatusMonitoring();
            
            // Initial table refresh
            this.refreshSensorTable();
            
            console.log('✅ Sensor management ready');
        } catch (error) {
            console.error('❌ Failed to initialize sensor management:', error);
            this.updateAPIStatus({ authenticated: false });
        }
    }
    
    /**
     * Load sensors from database
     */
    async loadSensors() {
        try {
            const response = await fetch('/api/sensors/list');
            const result = await response.json();
            
            if (result.success && result.sensors) {
                result.sensors.forEach(sensor => {
                    this.sensors.set(sensor.imei, sensor);
                });
                
                console.log(`📡 Loaded ${this.sensors.size} sensors`);
                this.refreshSensorTable();
            }
        } catch (error) {
            console.error('Error loading sensors:', error);
        }
    }
    
    /**
     * Add a new sensor
     */
    async addSensor(imei, binId = null, name = null) {
        try {
            // Validate IMEI
            if (!imei || imei.length < 10) {
                throw new Error('Invalid IMEI. Must be at least 10 characters.');
            }
            
            // Check if sensor already exists
            if (this.sensors.has(imei)) {
                throw new Error('Sensor with this IMEI already exists.');
            }
            
            console.log(`📡 Fetching complete sensor data for IMEI: ${imei}...`);
            
            // Step 1: Get full device info (all data types - no filter to get everything)
            // According to API docs, if DATA header is not provided, all data types are returned
            const deviceInfo = await findyClient.getDevice(imei);
            
            if (!deviceInfo.success) {
                throw new Error('Sensor not found in Findy IoT system. Please check IMEI.');
            }
            
            let deviceData = deviceInfo.data || {};
            
            // Handle case where API returns array instead of object
            if (Array.isArray(deviceData)) {
                console.log(`📊 API returned array with ${deviceData.length} items, extracting first item`);
                deviceData = deviceData[0] || {};
            }
            
            console.log(`📊 Device data keys:`, Object.keys(deviceData));
            console.log(`📊 Device data sample:`, JSON.stringify(deviceData).substring(0, 500));
            
            // Step 2: Get GPS coordinates (try multiple methods)
            let gpsData = null;
            let lat = null;
            let lng = null;
            
            // Method 1: Try live tracking (most recent GPS)
            try {
                const liveResult = await findyClient.getLiveTracking(imei);
                if (liveResult && liveResult.success && liveResult.data) {
                    let liveData = liveResult.data;
                    if (Array.isArray(liveData) && liveData.length > 0) {
                        liveData = liveData[0]; // Get most recent
                    }
                    if (liveData.lat && (liveData.lon || liveData.lng)) {
                        lat = parseFloat(liveData.lat);
                        lng = parseFloat(liveData.lon || liveData.lng);
                        gpsData = { lat, lng, source: 'liveTracking', timestamp: liveData.timeIn || new Date().toISOString() };
                        console.log(`✅ Got GPS from live tracking: ${lat}, ${lng}`);
                    }
                }
            } catch (error) {
                console.warn('⚠️ Live tracking GPS not available:', error.message);
            }
            
            // Method 2: Try device info GPS (ingps)
            if (!gpsData && deviceData.ingps) {
                const ingps = deviceData.ingps;
                if (ingps.lat && (ingps.lon || ingps.lng)) {
                    lat = parseFloat(ingps.lat);
                    lng = parseFloat(ingps.lon || ingps.lng);
                    gpsData = { lat, lng, source: 'deviceInfo', timestamp: deviceData.ago_gps || null };
                    console.log(`✅ Got GPS from device info: ${lat}, ${lng}`);
                }
            }
            
            // Method 3: Try incell (GSM positioning) as fallback
            if (!gpsData && deviceData.incell) {
                const incell = deviceData.incell;
                if (incell.lat && (incell.lon || incell.lng)) {
                    lat = parseFloat(incell.lat);
                    lng = parseFloat(incell.lon || incell.lng);
                    gpsData = { lat, lng, source: 'gsm', timestamp: deviceData.ago || null };
                    console.log(`✅ Got GPS from GSM positioning: ${lat}, ${lng}`);
                }
            }
            
            // Step 3: Extract all sensor data
            const sensor = {
                imei: imei,
                binId: binId,
                name: name || deviceData.deviceInfo?.name || `Sensor ${imei.substring(0, 8)}`,
                dateAdded: new Date().toISOString(),
                status: 'active',
                
                // Device Info
                deviceInfo: deviceData.deviceInfo || null,
                deviceOwnerID: deviceData.deviceInfo?.deviceOwnerID || null,
                deviceGroupID: deviceData.deviceInfo?.deviceGroupID || null,
                deviceStatusID: deviceData.deviceInfo?.deviceStatusID || null,
                deviceVersionID: deviceData.deviceInfo?.deviceVersionID || null,
                lastModTime: deviceData.deviceInfo?.lastModTime || null,
                
                // GPS Data
                gps: gpsData,
                lat: lat,
                lng: lng,
                ago_gps: deviceData.ago_gps || null,
                
                // GSM Data
                incell: deviceData.incell || null,
                ago: deviceData.ago || null,
                country: deviceData.country || null,
                operator: deviceData.operator || null,
                
                // Battery & Power
                battery: deviceData.battery || null,
                batteryLevel: deviceData.batteryLevel || deviceData.battery || null,
                
                // Device Settings
                deviceSettings: deviceData.deviceSettings || null,
                alarm: deviceData.deviceSettings?.alarm || null,
                liveSetTime: deviceData.deviceSettings?.liveSetTime || null,
                
                // Mode
                inmode: deviceData.inmode || null,
                lastReportType: deviceData.lastReportType || null,
                
                // Passport
                passport: deviceData.passport || null,
                phone: deviceData.passport?.phone || null,
                versionName: deviceData.passport?.versionName || null,
                
                // SIM Card
                simCard: deviceData.simCard || null,
                
                // Reports
                report: deviceData.report || null,
                pending: deviceData.pending || null,
                actionCommand: deviceData.actionCommand || null,
                
                // Location Name (from GPS reverse geocoding)
                locationName: null, // Will be filled below if GPS available
                
                // Timestamps - Enhanced extraction
                lastSeen: this.extractLastSeenTimestamp(deviceData),
                lastUpdate: new Date().toISOString(),
                
                // Full raw data (for reference)
                rawData: deviceData
            };
            
            // Get location name from GPS coordinates if available
            if (lat && lng) {
                try {
                    console.log('🌍 Getting location name from GPS coordinates...');
                    const locationName = await this.getLocationNameFromGPS(lat, lng);
                    if (locationName) {
                        sensor.locationName = locationName;
                        console.log(`✅ Got location name: ${locationName}`);
                    }
                } catch (error) {
                    console.warn('⚠️ Could not get location name from GPS:', error.message);
                }
            }
            
            console.log(`✅ Collected complete sensor data:`, {
                imei: sensor.imei,
                name: sensor.name,
                gps: sensor.gps,
                locationName: sensor.locationName,
                battery: sensor.battery,
                operator: sensor.operator,
                lastSeen: sensor.lastSeen
            });
            
            // Save to database
            const response = await fetch('/api/sensors/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sensor)
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.sensors.set(imei, sensor);
                
                // Link to bin if provided
                if (binId) {
                    // Update bin coordinates to match sensor GPS if available
                    if (lat && lng && typeof dataManager !== 'undefined') {
                        const bin = dataManager.getBinById(binId);
                        if (bin) {
                            bin.lat = lat;
                            bin.lng = lng;
                            bin.sensorIMEI = imei;
                            bin.hasSensor = true;
                            await dataManager.updateBin(bin);
                            console.log(`📍 Updated bin ${binId} coordinates to sensor GPS: ${lat}, ${lng}`);
                        }
                    }
                    
                    await findyBinSensorIntegration.linkBinToSensor(binId, imei);
                    await findyBinSensorIntegration.startMonitoringBinSensor(binId, imei);
                }
                
                this.refreshSensorTable();
                this.showNotification(`Sensor added successfully! GPS: ${lat && lng ? `${lat.toFixed(6)}, ${lng.toFixed(6)}` : 'Not available'}`, 'success');
                
                return sensor;
            } else {
                throw new Error(result.error || 'Failed to add sensor');
            }
            
        } catch (error) {
            console.error('Error adding sensor:', error);
            this.showNotification(error.message, 'error');
            throw error;
        }
    }
    
    /**
     * Bulk import sensors from CSV or text
     */
    async bulkImportSensors(data) {
        try {
            const lines = data.split('\n').filter(line => line.trim());
            const results = {
                success: 0,
                failed: 0,
                errors: []
            };
            
            this.showNotification(`Processing ${lines.length} sensors...`, 'info');
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                
                // Skip empty lines and headers
                if (!line || line.toLowerCase().includes('imei')) continue;
                
                // Parse line (support: IMEI, IMEI,BinID, IMEI,BinID,Name)
                const parts = line.split(',').map(p => p.trim());
                const imei = parts[0];
                const binId = parts[1] || null;
                const name = parts[2] || null;
                
                try {
                    await this.addSensor(imei, binId, name);
                    results.success++;
                } catch (error) {
                    results.failed++;
                    results.errors.push(`Line ${i + 1}: ${error.message}`);
                }
                
                // Update progress
                if (i % 10 === 0) {
                    this.updateBulkProgress(i + 1, lines.length);
                }
            }
            
            this.showNotification(
                `Import complete! Success: ${results.success}, Failed: ${results.failed}`,
                results.failed === 0 ? 'success' : 'warning'
            );
            
            if (results.errors.length > 0) {
                console.error('Import errors:', results.errors);
            }
            
            return results;
            
        } catch (error) {
            console.error('Bulk import error:', error);
            this.showNotification('Bulk import failed: ' + error.message, 'error');
            throw error;
        }
    }
    
    /**
     * Link sensor to bin
     */
    async linkSensorToBin(imei, binId) {
        try {
            const sensor = this.sensors.get(imei);
            if (!sensor) {
                throw new Error('Sensor not found');
            }
            
            console.log(`🔗 Linking sensor ${imei} to bin ${binId}...`);
            
            // Get sensor GPS coordinates and update bin location
            const sensorCoords = await this.getSensorCoordinates(imei);
            
            // ⭐ CRITICAL: Update bin with sensor information (DATA INTEGRITY)
            if (typeof dataManager !== 'undefined') {
                const bin = dataManager.getBinById(binId);
                if (bin) {
                    // ⭐ Set sensorId - THIS IS CRITICAL FOR DATA INTEGRITY
                    bin.sensorId = imei;
                    bin.sensorIMEI = imei; // Also set legacy property
                    
                    // Update coordinates if sensor has GPS
                    if (sensorCoords) {
                        console.log(`📍 Updating bin ${binId} coordinates to match sensor: ${sensorCoords.lat}, ${sensorCoords.lng}`);
                        bin.lat = sensorCoords.lat;
                        bin.lng = sensorCoords.lng;
                    }
                    
                    // Save bin with all updates
                    dataManager.updateBin(bin);
                    console.log(`✅ Bin ${binId} updated: sensorId=${imei}, coordinates=${sensorCoords ? 'updated' : 'unchanged'}`);
                    
                    // Force save to server to ensure persistence
                    try {
                        await fetch('/api/data/sync', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                bins: dataManager.getBins(),
                                updateType: 'partial'
                            })
                        });
                        console.log(`✅ Bin saved to server`);
                    } catch (error) {
                        console.warn('⚠️ Could not save bin to server:', error);
                    }
                } else {
                    console.warn(`⚠️ Bin ${binId} not found in dataManager`);
                }
            } else {
                console.warn('⚠️ dataManager not available');
            }
            
            // Update sensor record
            sensor.binId = binId;
            sensor.linkedAt = new Date().toISOString();
            
            // Save to database
            await fetch('/api/sensors/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sensor)
            });
            
            // Link in bin sensor integration
            await findyBinSensorIntegration.linkBinToSensor(binId, imei);
            await findyBinSensorIntegration.startMonitoringBinSensor(binId, imei);
            
            this.refreshSensorTable();
            this.showNotification(`Sensor ${imei} linked to ${binId} (coordinates updated)`, 'success');
            
            // Dispatch event to refresh map
            window.dispatchEvent(new CustomEvent('bin:sensor-updated', {
                detail: { binId, imei, action: 'linked' }
            }));
            
            // Force refresh bins on map
            setTimeout(() => {
                if (typeof window.forceRefreshBinsOnMap === 'function') {
                    window.forceRefreshBinsOnMap();
                }
            }, 1000);
            
        } catch (error) {
            console.error('Error linking sensor:', error);
            this.showNotification(error.message, 'error');
        }
    }
    
    /**
     * Unlink sensor from bin (WORLD-CLASS with confirmation & feedback)
     * Works across the entire application with full synchronization
     */
    async unlinkSensor(imei) {
        try {
            const sensor = this.sensors.get(imei);
            if (!sensor || !sensor.binId) {
                this.showNotification('Sensor is not linked to any bin', 'info');
                console.warn(`⚠️ Unlink attempted but sensor ${imei} has no binId`);
                return;
            }
            
            const binId = sensor.binId;
            
            // Get bin details for better confirmation message (with safety checks)
            let binName = binId;
            let binDetails = binId;
            if (typeof dataManager !== 'undefined') {
                const bins = dataManager.getBins();
                const bin = bins.find(b => b.id === binId);
                if (bin) {
                    if (bin.location && bin.location.address) {
                        binName = `${binId} (${bin.location.address})`;
                        binDetails = `${binId}\n📍 ${bin.location.address}`;
                    }
                    if (bin.fillLevel !== undefined) {
                        binDetails += `\n📊 Current Fill: ${bin.fillLevel}%`;
                    }
                }
            }
            
            // World-class confirmation dialog
            const confirmed = confirm(
                `🔓 UNLINK SENSOR FROM BIN\n\n` +
                `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                `Sensor: ${sensor.name || 'Unnamed'}\n` +
                `IMEI: ${imei}\n` +
                `ID: ...${imei.slice(-4)}\n\n` +
                `Bin: ${binDetails}\n\n` +
                `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                `⚠️ This will stop receiving sensor data\n` +
                `⚠️ Fill level updates will cease\n` +
                `⚠️ Real-time monitoring will stop\n\n` +
                `Do you want to continue?`
            );
            
            if (!confirmed) {
                console.log(`❌ Unlink cancelled by user for sensor ${imei}`);
                return;
            }
            
            console.log(`🔓 Unlinking sensor ${imei} from bin ${binId}...`);
            console.log(`📋 Step 1/5: Updating sensor record...`);
            
            // Update sensor record
            sensor.binId = null;
            sensor.unlinkedAt = new Date().toISOString();
            
            console.log(`✅ Step 1/5: Sensor record updated`);
            
            // Step 2/5: Save to database
            console.log(`📋 Step 2/5: Updating database...`);
            const response = await fetch('/api/sensors/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imei,
                    binId: null,
                    unlinkedAt: new Date().toISOString()
                })
            });
            
            if (!response.ok) {
                throw new Error(`Database update failed: ${response.status}`);
            }
            
            console.log(`✅ Step 2/5: Database updated`);
            
            // Step 3/5: Update bin record
            console.log(`📋 Step 3/5: Updating bin record...`);
            if (typeof dataManager !== 'undefined') {
                const bins = dataManager.getBins();
                const bin = bins.find(b => b.id === binId);
                if (bin) {
                    bin.sensorId = null;
                    bin.lastUnlinked = new Date().toISOString();
                    if (typeof dataManager.saveBin === 'function') {
                        await dataManager.saveBin(bin);
                        console.log(`✅ Step 3/5: Bin ${binId} updated`);
                    }
                } else {
                    console.warn(`⚠️ Bin ${binId} not found in dataManager`);
                }
            } else {
                console.warn(`⚠️ dataManager not available, skipping bin update`);
            }
            
            // Step 4/5: Unlink in integration system
            console.log(`📋 Step 4/5: Updating integration system...`);
            if (typeof findyBinSensorIntegration !== 'undefined') {
                try {
                    await findyBinSensorIntegration.unlinkBinSensor(binId);
                    console.log(`✅ Step 4/5: Integration updated`);
                } catch (integrationError) {
                    console.warn(`⚠️ Integration update failed (non-critical):`, integrationError.message);
                }
            } else {
                console.warn(`⚠️ findyBinSensorIntegration not available`);
            }
            
            // Step 5/5: Trigger cross-application updates
            console.log(`📋 Step 5/5: Broadcasting updates across application...`);
            
            // Trigger multiple events for different parts of the app
            window.dispatchEvent(new CustomEvent('sensor:unlinked', {
                detail: { imei, binId, timestamp: new Date().toISOString() }
            }));
            
            window.dispatchEvent(new CustomEvent('bin:sensor-updated', {
                detail: { binId, imei: null, action: 'unlinked' }
            }));
            
            window.dispatchEvent(new CustomEvent('admin:sensor-unlinked', {
                detail: { imei, binId, timestamp: new Date().toISOString() }
            }));
            
            console.log(`✅ Step 5/5: Events broadcasted`);
            
            // Refresh UI
            this.refreshSensorTable();
            
            // Force refresh bins on map (if function exists)
            setTimeout(() => {
                if (typeof window.forceRefreshBinsOnMap === 'function') {
                    console.log(`🗺️ Forcing map refresh...`);
                    window.forceRefreshBinsOnMap();
                }
                
                // Also refresh admin panel if updateAdminSensorStats exists
                if (typeof window.updateAdminSensorStats === 'function') {
                    console.log(`📊 Refreshing admin stats...`);
                    window.updateAdminSensorStats();
                }
            }, 500);
            
            // Show success notification
            this.showNotification(
                `✅ Sensor ${sensor.name || `...${imei.slice(-4)}`} successfully unlinked from ${binId}`, 
                'success'
            );
            
            console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            console.log(`🎉 UNLINK COMPLETE!`);
            console.log(`   Sensor: ${imei}`);
            console.log(`   Bin: ${binId}`);
            console.log(`   All systems updated successfully`);
            console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            
        } catch (error) {
            console.error(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            console.error(`❌ UNLINK FAILED!`);
            console.error(`   Sensor: ${imei}`);
            console.error(`   Error: ${error.message}`);
            console.error(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            console.error(error);
            
            this.showNotification(
                `❌ Failed to unlink sensor: ${error.message}\n\nPlease try again or check the console for details.`, 
                'error'
            );
        }
    }
    
    /**
     * Remove sensor
     */
    async removeSensor(imei) {
        try {
            if (!confirm(`Are you sure you want to remove sensor ${imei}?`)) {
                return;
            }
            
            const sensor = this.sensors.get(imei);
            
            // Unlink if linked to bin
            if (sensor && sensor.binId) {
                await this.unlinkSensor(imei);
            }
            
            // Remove from database
            await fetch('/api/sensors/remove', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imei })
            });
            
            // Stop tracking
            await findyClient.stopLiveTracking(imei);
            
            this.sensors.delete(imei);
            this.sensorStatus.delete(imei);
            
            this.refreshSensorTable();
            this.showNotification('Sensor removed', 'success');
            
        } catch (error) {
            console.error('Error removing sensor:', error);
            this.showNotification(error.message, 'error');
        }
    }
    
    /**
     * Start monitoring sensor status
     * OPTIMIZED: Rely on WebSocket updates from server instead of constant polling
     * The server already polls sensors every 60 seconds and broadcasts updates
     */
    startStatusMonitoring() {
        // REMOVED: Constant polling that was causing excessive API calls
        // The server handles sensor polling every 60 seconds and broadcasts updates via WebSocket
        
        // Listen for WebSocket sensor updates instead of polling
        this.setupWebSocketListener();
        
        // Only check sensor status when admin panel becomes visible
        // This prevents unnecessary API calls when the panel is not being used
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isAdminPanelVisible) {
                // Debounced status check - only if 2 minutes have passed since last check
                const now = Date.now();
                if (!this.lastStatusCheck || now - this.lastStatusCheck > 120000) {
                    console.log('📡 Admin panel visible, performing deferred sensor status check');
                    this.checkAllSensorStatus();
                    this.lastStatusCheck = now;
                }
            }
        });
        
        console.log('✅ Sensor monitoring setup (WebSocket-based, no excessive polling)');
    }
    
    /**
     * Setup WebSocket listener for sensor updates
     */
    setupWebSocketListener() {
        // Listen for sensor updates from WebSocket
        if (typeof window.addEventListener === 'function') {
            window.addEventListener('sensor_update', (event) => {
                const data = event.detail;
                if (data && data.imei) {
                    this.handleSensorUpdate(data);
                }
            });
            
            // Also listen for the bin_fill_update events
            window.addEventListener('bin_fill_update', (event) => {
                const data = event.detail;
                if (data && data.sensorIMEI) {
                    this.handleSensorUpdate({
                        imei: data.sensorIMEI,
                        fillLevel: data.fillLevel,
                        status: 'online'
                    });
                }
            });
        }
    }
    
    /**
     * Handle sensor update from WebSocket
     */
    handleSensorUpdate(data) {
        const sensor = this.sensors.get(data.imei);
        if (sensor) {
            // Update sensor status
            this.sensorStatus.set(data.imei, {
                online: true,
                battery: data.battery,
                fillLevel: data.fillLevel,
                lastSeen: new Date().toISOString()
            });
            
            // Refresh the table row for this sensor
            this.updateSensorRow(data.imei);
        }
    }
    
    /**
     * Update a single sensor row in the table
     */
    updateSensorRow(imei) {
        const row = document.querySelector(`tr[data-imei="${imei}"]`);
        if (row) {
            const status = this.sensorStatus.get(imei);
            const statusCell = row.querySelector('.sensor-status');
            if (statusCell && status) {
                statusCell.innerHTML = status.online 
                    ? '<span class="status-badge online">🟢 Online</span>'
                    : '<span class="status-badge offline">🔴 Offline</span>';
            }
        }
    }
    
    /**
     * Track if admin panel is visible
     */
    isAdminPanelVisible = false;
    lastStatusCheck = null;
    
    /**
     * Check status of all sensors
     * Uses enhanced sensor status manager with batch fetching
     */
    async checkAllSensorStatus() {
        console.log('🔄 Checking status for all sensors...');
        
        const sensors = Array.from(this.sensors.entries());
        
        if (sensors.length === 0) {
            console.log('ℹ️ No sensors to check');
            return;
        }
        
        // Show loading indicator
        const statusBadges = document.querySelectorAll('.status-badge');
        statusBadges.forEach(badge => {
            badge.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking...';
        });
        
        // Use sensor status manager for efficient batch fetching
        if (typeof sensorStatusManager !== 'undefined') {
            const imeis = sensors.map(([imei]) => imei);
            const statusMap = await sensorStatusManager.getBatchSensorStatus(imeis);
            
            // Update all sensor statuses
            for (const [imei, sensor] of sensors) {
                const status = statusMap.get(imei);
                
                if (status) {
                    this.sensorStatus.set(imei, status);
                    
                    // Update sensor record
                    sensor.status = status.status || (status.online ? 'online' : 'offline');
                    sensor.lastSeen = status.lastSeen || new Date().toISOString();
                    sensor.battery = status.battery;
                    sensor.operator = status.operator;
                    sensor.location = status.location;
                }
            }
            
            console.log(`✅ Updated status for ${sensors.length} sensors`);
        } else {
            // Fallback to sequential fetching
            for (let i = 0; i < sensors.length; i++) {
                const [imei, sensor] = sensors[i];
                
                try {
                    const result = await findyClient.getDevice(imei);
                    
                    if (result.success && result.data) {
                        let deviceData = result.data;
                        if (Array.isArray(deviceData)) {
                            deviceData = deviceData[0];
                        }
                        
                        const status = {
                            online: true,
                            status: 'online',
                            battery: deviceData.battery,
                            operator: deviceData.operator,
                            lastSeen: deviceData.deviceInfo?.lastModTime,
                            location: deviceData.ingps || deviceData.incell,
                            checkedAt: new Date().toISOString()
                        };
                        
                        this.sensorStatus.set(imei, status);
                        sensor.status = 'online';
                        sensor.lastSeen = status.lastSeen || deviceData.deviceInfo?.lastModTime || new Date().toISOString();
                        sensor.battery = status.battery;
                        sensor.operator = status.operator;
                        
                        console.log(`✅ Updated sensor ${imei} status:`, {
                            status: sensor.status,
                            lastSeen: sensor.lastSeen,
                            battery: sensor.battery
                        });
                    } else {
                        this.sensorStatus.set(imei, {
                            online: false,
                            status: 'offline',
                            checkedAt: new Date().toISOString()
                        });
                        sensor.status = 'offline';
                    }
                } catch (error) {
                    console.error(`Status check failed for ${imei}:`, error);
                    sensor.status = 'error';
                }
                
                // Small delay between requests
                if (i < sensors.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
        }
        
        // Refresh display
        this.updateStatusDisplay();
        this.refreshSensorTable();
    }
    
    /**
     * Refresh sensor table display
     */
    refreshSensorTable() {
        const tbody = document.getElementById('sensorTableBody');
        if (!tbody) return;
        
        if (this.sensors.size === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 2rem; color: #94a3b8;">
                        No sensors added yet. Click "Add Sensor" to get started.
                    </td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        let index = 1;
        
        for (const [imei, sensor] of this.sensors) {
            const status = this.sensorStatus.get(imei);
            const statusColor = this.getStatusColor(sensor.status);
            const statusIcon = this.getStatusIcon(sensor.status);
            
            html += `
                <tr>
                    <td>${index++}</td>
                    <td>
                        <strong>${sensor.name || 'Unnamed'}</strong><br>
                        <small style="color: #64748b;">${imei}</small>
                    </td>
                    <td>
                        <span style="
                            display: inline-flex;
                            align-items: center;
                            gap: 0.5rem;
                            padding: 0.25rem 0.75rem;
                            background: ${statusColor};
                            color: white;
                            border-radius: 12px;
                            font-size: 0.85rem;
                            font-weight: 600;
                        ">
                            ${statusIcon} ${sensor.status || 'unknown'}
                        </span>
                    </td>
                    <td>${this.getBinDisplay(sensor.binId)}</td>
                    <td>
                        ${status?.battery ? 
                            `<span style="color: ${this.getBatteryColor(status.battery)}">${status.battery}%</span>` : 
                            'N/A'
                        }
                    </td>
                    <td>${status?.operator || 'N/A'}</td>
                    <td>${this.formatDate(sensor.lastSeen)}</td>
                    <td>
                        <div style="display: flex; gap: 0.5rem;">
                            ${!sensor.binId ? `
                                <button class="btn-mini btn-primary" onclick="(async () => await sensorManagementAdmin.showLinkDialog('${imei}'))()" title="Link to Bin">
                                    <i class="fas fa-link"></i>
                                </button>
                            ` : `
                                <button class="btn-mini btn-warning" onclick="sensorManagementAdmin.unlinkSensor('${imei}')" title="Unlink">
                                    <i class="fas fa-unlink"></i>
                                </button>
                            `}
                            <button class="btn-mini btn-info" onclick="sensorManagementAdmin.showSensorDetails('${imei}')" title="Details">
                                <i class="fas fa-info-circle"></i>
                            </button>
                            <button class="btn-mini btn-danger" onclick="sensorManagementAdmin.removeSensor('${imei}')" title="Remove">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }
        
        tbody.innerHTML = html;
        
        // Update statistics
        this.updateStatistics();
    }
    
    /**
     * Update status display
     */
    updateStatusDisplay() {
        // Refresh the table to show updated status
        this.refreshSensorTable();
    }
    
    /**
     * Update statistics panel
     */
    updateStatistics() {
        const stats = {
            total: this.sensors.size,
            online: 0,
            offline: 0,
            linked: 0,
            unlinked: 0
        };
        
        for (const sensor of this.sensors.values()) {
            if (sensor.status === 'online') stats.online++;
            else if (sensor.status === 'offline') stats.offline++;
            
            if (sensor.binId) stats.linked++;
            else stats.unlinked++;
        }
        
        // Update DOM
        document.getElementById('totalSensors').textContent = stats.total;
        document.getElementById('onlineSensors').textContent = stats.online;
        document.getElementById('offlineSensors').textContent = stats.offline;
        document.getElementById('linkedSensors').textContent = stats.linked;
    }
    
    /**
     * Show add sensor dialog
     */
    async showAddSensorDialog() {
        const modal = document.getElementById('addSensorModal');
        if (modal) {
            modal.style.display = 'flex';
            document.getElementById('sensorIMEI').value = '';
            document.getElementById('sensorName').value = '';
            document.getElementById('sensorBinId').value = '';
            
            // Populate bin dropdown
            await this.populateAddSensorBinDropdown();
        }
    }
    
    /**
     * Populate bin dropdown in "Add Sensor" modal
     */
    async populateAddSensorBinDropdown() {
        const select = document.getElementById('sensorBinId');
        if (!select) {
            console.error('❌ sensorBinId select element not found');
            return;
        }
        
        console.log('🔍 Populating "Add Sensor" bin dropdown...');
        
        let bins = [];
        
        // Try dataManager first
        if (typeof dataManager !== 'undefined') {
            bins = dataManager.getBins();
            console.log(`📦 Got ${bins.length} bins from dataManager`);
        }
        
        // If no bins, fetch from API
        if (bins.length === 0) {
            try {
                const response = await fetch('/api/bins');
                const result = await response.json();
                if (result.success) {
                    bins = result.bins;
                    console.log(`📦 Got ${bins.length} bins from API`);
                }
            } catch (error) {
                console.error('❌ Error fetching bins:', error);
            }
        }
        
        // Build dropdown HTML
        let html = '<option value="">-- Link Later --</option>';
        
        if (bins.length > 0) {
            bins.forEach(bin => {
                // Only show bins without sensors
                const hasSensor = Array.from(this.sensors.values()).some(s => s.binId === bin.id);
                if (!hasSensor) {
                    html += `<option value="${bin.id}">${bin.id} - ${bin.location || bin.name || 'Unknown'} (${bin.fill || 0}% full)</option>`;
                } else {
                    html += `<option value="${bin.id}" disabled>${bin.id} - ${bin.location || bin.name || 'Unknown'} (${bin.fill || 0}% full) 📡</option>`;
                }
            });
        } else {
            html += '<option value="" disabled>No bins available</option>';
        }
        
        select.innerHTML = html;
        console.log(`✅ Populated "Add Sensor" bin dropdown with ${bins.length} bins`);
    }
    
    /**
     * Show bulk import dialog
     */
    showBulkImportDialog() {
        const modal = document.getElementById('bulkImportModal');
        if (modal) {
            modal.style.display = 'flex';
            document.getElementById('bulkImportData').value = '';
        }
    }
    
    /**
     * Show link to bin dialog
     */
    async showLinkDialog(imei) {
        const modal = document.getElementById('linkSensorModal');
        if (modal) {
            modal.style.display = 'flex';
            document.getElementById('linkSensorIMEI').value = imei;
            document.getElementById('linkBinId').value = '';
            
            // Reset create bin form
            this.hideCreateBinForm();
            document.getElementById('newBinLocation').value = '';
            document.getElementById('newBinLat').value = '';
            document.getElementById('newBinLng').value = '';
            document.getElementById('newBinType').value = 'general';
            document.getElementById('newBinCapacity').value = '100';
            
            // Reset button
            const linkButton = document.getElementById('linkButton');
            if (linkButton) {
                linkButton.textContent = 'Link';
                linkButton.style.background = '';
            }
            
            // Populate bin dropdown (async)
            await this.populateBinDropdown();
            
            console.log(`✅ Link modal opened for sensor ${imei}`);
        }
    }
    
    /**
     * Show create bin form
     */
    async showCreateBinForm() {
        const form = document.getElementById('createBinForm');
        if (!form) {
            console.error('❌ createBinForm element not found');
            return;
        }
        
        form.style.display = 'block';
        
        // Show loading state
        const latInput = document.getElementById('newBinLat');
        const lngInput = document.getElementById('newBinLng');
        const locationInput = document.getElementById('newBinLocation');
        
        if (latInput) latInput.value = 'Loading...';
        if (lngInput) lngInput.value = 'Loading...';
        if (locationInput) locationInput.placeholder = 'Loading location from sensor...';
        
        // Auto-generate bin ID
        const binId = await this.generateBinId();
        const idInput = document.getElementById('newBinId');
        if (idInput) {
            idInput.value = binId;
        }
        
        // Auto-fill coordinates from sensor GPS
        const imei = document.getElementById('linkSensorIMEI').value;
        const statusEl = document.getElementById('coordinatesStatus');
        
        if (!imei) {
            console.error('❌ No IMEI found in form');
            if (latInput) latInput.value = '';
            if (lngInput) lngInput.value = '';
            if (statusEl) {
                statusEl.innerHTML = '<span style="color: #ef4444;"><i class="fas fa-exclamation-circle"></i> No sensor IMEI found</span>';
            }
            return;
        }
        
        console.log(`📍 Fetching sensor GPS for IMEI: ${imei}...`);
        
        if (statusEl) {
            statusEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Fetching sensor GPS coordinates...';
        }
        
        try {
            const sensorCoords = await this.getSensorCoordinates(imei);
            
            if (sensorCoords && sensorCoords.lat && sensorCoords.lng) {
                if (latInput) {
                    latInput.value = sensorCoords.lat.toFixed(6);
                    latInput.style.background = 'rgba(16, 185, 129, 0.1)';
                    latInput.placeholder = 'Auto-filled from sensor';
                }
                if (lngInput) {
                    lngInput.value = sensorCoords.lng.toFixed(6);
                    lngInput.style.background = 'rgba(16, 185, 129, 0.1)';
                    lngInput.placeholder = 'Auto-filled from sensor';
                }
                
                if (statusEl) {
                    statusEl.innerHTML = `<span style="color: #10b981;"><i class="fas fa-check-circle"></i> Coordinates auto-filled from sensor GPS: ${sensorCoords.lat.toFixed(6)}, ${sensorCoords.lng.toFixed(6)}</span>`;
                }
                
                console.log(`✅ Auto-filled coordinates: ${sensorCoords.lat}, ${sensorCoords.lng}`);
                
                // Get location name from GPS coordinates (reverse geocoding)
                if (sensorCoords.lat && sensorCoords.lng) {
                    try {
                        console.log('📍 Getting location name from GPS coordinates...');
                        const locationName = await this.getLocationNameFromGPS(sensorCoords.lat, sensorCoords.lng);
                        
                        if (locationName && locationInput && !locationInput.value) {
                            locationInput.value = locationName;
                            locationInput.style.background = 'rgba(16, 185, 129, 0.1)';
                            console.log(`✅ Auto-filled location name from GPS: ${locationName}`);
                            
                            if (statusEl) {
                                statusEl.innerHTML += `<br><span style="color: #10b981;"><i class="fas fa-map-marker-alt"></i> Location: ${locationName}</span>`;
                            }
                        }
                    } catch (error) {
                        console.warn('⚠️ Could not get location name from GPS:', error);
                    }
                }
                
                // Also try to get location name from sensor if available (as fallback)
                try {
                    if (typeof findyClient !== 'undefined') {
                        const deviceResult = await findyClient.getDevice(imei);
                        if (deviceResult && deviceResult.success && deviceResult.data) {
                            let deviceData = deviceResult.data;
                            if (Array.isArray(deviceData) && deviceData.length > 0) {
                                deviceData = deviceData[0];
                            }
                            
                            const locationName = deviceData.name || deviceData.location || 
                                               deviceData.address || deviceData.placeName ||
                                               deviceData.vehicleName || deviceData.label ||
                                               deviceData.deviceInfo?.name;
                            
                            if (locationName && locationInput && !locationInput.value) {
                                locationInput.value = locationName;
                                locationInput.style.background = 'rgba(16, 185, 129, 0.1)';
                                console.log(`✅ Auto-filled location name from sensor: ${locationName}`);
                            }
                        }
                    }
                } catch (error) {
                    console.warn('⚠️ Could not get location name from sensor:', error);
                }
                
            } else {
                console.warn('⚠️ Could not get sensor coordinates');
                
                // Use default Doha coordinates as fallback
                const defaultLat = 25.2854;
                const defaultLng = 51.5310;
                
                if (latInput) {
                    latInput.value = defaultLat;
                    latInput.placeholder = 'Default Doha location';
                    latInput.style.background = 'rgba(245, 158, 11, 0.1)';
                }
                if (lngInput) {
                    lngInput.value = defaultLng;
                    lngInput.placeholder = 'Default Doha location';
                    lngInput.style.background = 'rgba(245, 158, 11, 0.1)';
                }
                if (statusEl) {
                    statusEl.innerHTML = `<span style="color: #f59e0b;"><i class="fas fa-exclamation-triangle"></i> Sensor GPS not available yet. Using default Doha location (${defaultLat}, ${defaultLng}). You can edit these coordinates or they will update automatically when sensor sends GPS data.</span>`;
                }
                
                console.log(`📍 Using default coordinates: ${defaultLat}, ${defaultLng}`);
            }
        } catch (error) {
            console.error('❌ Error fetching sensor coordinates:', error);
            if (latInput) {
                latInput.value = '';
                latInput.placeholder = 'Enter manually';
            }
            if (lngInput) {
                lngInput.value = '';
                lngInput.placeholder = 'Enter manually';
            }
            if (statusEl) {
                statusEl.innerHTML = `<span style="color: #ef4444;"><i class="fas fa-times-circle"></i> Error: ${error.message}. Please enter coordinates manually.</span>`;
            }
        }
    }
    
    /**
     * Hide create bin form
     */
    hideCreateBinForm() {
        const form = document.getElementById('createBinForm');
        if (form) {
            form.style.display = 'none';
        }
    }
    
    /**
     * Generate next available bin ID
     */
    async generateBinId() {
        let bins = [];
        
        if (typeof dataManager !== 'undefined') {
            bins = dataManager.getBins();
        } else {
            try {
                const response = await fetch('/api/data/sync');
                const data = await response.json();
                bins = data.bins || [];
            } catch (error) {
                console.error('Error fetching bins:', error);
            }
        }
        
        // Find highest BIN-XXX number
        let maxNum = 0;
        bins.forEach(bin => {
            const match = bin.id.match(/^BIN-(\d+)$/);
            if (match) {
                const num = parseInt(match[1]);
                if (num > maxNum) maxNum = num;
            }
        });
        
        // Generate next ID
        const nextNum = maxNum + 1;
        const binId = `BIN-${String(nextNum).padStart(3, '0')}`;
        
        console.log(`🔢 Generated bin ID: ${binId}`);
        return binId;
    }
    
    /**
     * Get sensor GPS coordinates from Findy API
     */
    async getSensorCoordinates(imei) {
        try {
            console.log(`📍 Fetching GPS coordinates for sensor ${imei}...`);
            
                // Method 1: Try live tracking (most recent location)
            if (typeof findyClient !== 'undefined') {
                try {
                    console.log('  🔍 Trying live tracking...');
                    const liveResult = await findyClient.getLiveTracking(imei);
                    
                    if (liveResult && liveResult.success && liveResult.data) {
                        let data = liveResult.data;
                        
                        console.log('  📊 Live tracking raw data type:', typeof data);
                        console.log('  📊 Live tracking raw data sample:', typeof data === 'string' ? data.substring(0, 200) : JSON.stringify(data).substring(0, 200));
                        
                        // Handle string response (JSON string that needs parsing)
                        if (typeof data === 'string') {
                            // Check if it's the string "null"
                            if (data === 'null' || data.trim() === 'null') {
                                console.log('  ⚠️ Live tracking returned null (no GPS data available yet)');
                                data = null;
                            } else {
                                try {
                                    data = JSON.parse(data);
                                    console.log('  📊 Parsed JSON string, new type:', Array.isArray(data) ? 'array' : typeof data);
                                } catch (parseError) {
                                    console.warn('  ⚠️ Failed to parse JSON string:', parseError.message);
                                    data = null;
                                }
                            }
                        }
                        
                        // Handle null response
                        if (data === null || data === undefined) {
                            console.log('  ⚠️ Live tracking returned null/undefined');
                            data = null;
                        }
                        // Handle array response (most recent entry is first)
                        else if (Array.isArray(data)) {
                            if (data.length > 0) {
                                console.log('  📊 Extracting first item from array of', data.length, 'items');
                                console.log('  📊 First item:', JSON.stringify(data[0]).substring(0, 200));
                                data = data[0]; // Get most recent entry
                            } else {
                                console.log('  ⚠️ Live tracking returned empty array');
                                data = null;
                            }
                        }
                        
                        if (data && typeof data === 'object' && data !== null) {
                            console.log('  📊 Looking for GPS in keys:', Object.keys(data));
                            
                            // Check various possible GPS field names (including "lon" for longitude)
                            const lat = data.lat || data.latitude || data.gpsLat || 
                                       data.location?.lat || data.gps?.lat || 
                                       data.position?.lat || data.coords?.lat ||
                                       data.gpsData?.lat || data.positionData?.lat;
                            const lng = data.lng || data.lon || data.longitude || data.gpsLng || 
                                       data.location?.lng || data.location?.lon || data.gps?.lng || 
                                       data.position?.lng || data.coords?.lng ||
                                       data.gpsData?.lng || data.positionData?.lng;
                            
                            console.log('  📍 Found lat:', lat, 'lng:', lng);
                            
                            if (lat && lng) {
                                const latNum = parseFloat(lat);
                                const lngNum = parseFloat(lng);
                                
                                // Validate coordinates (basic sanity check)
                                if (!isNaN(latNum) && !isNaN(lngNum) && 
                                    latNum >= -90 && latNum <= 90 && 
                                    lngNum >= -180 && lngNum <= 180) {
                                    console.log(`✅ Got sensor GPS from live tracking: ${latNum}, ${lngNum}`);
                                    return { lat: latNum, lng: lngNum };
                                } else {
                                    console.log(`  ⚠️ Invalid GPS coordinates: ${lat}, ${lng}`);
                                }
                            } else {
                                console.log('  ⚠️ Live tracking data found but no GPS fields');
                            }
                        } else {
                            console.log('  ⚠️ Live tracking data is not an object:', typeof data);
                        }
                    } else {
                        console.log('  ⚠️ Live tracking response not successful');
                    }
                } catch (error) {
                    console.warn('  ⚠️ Live tracking failed:', error.message);
                }
                
                // Method 2: Try device info
                try {
                    console.log('  🔍 Trying device info...');
                    const deviceResult = await findyClient.getDevice(imei);
                    
                    if (deviceResult && deviceResult.success && deviceResult.data) {
                        let data = deviceResult.data;
                        
                        console.log('  📊 Device info data type:', typeof data);
                        console.log('  📊 Device info keys:', data && typeof data === 'object' ? Object.keys(data) : 'N/A');
                        
                        // Handle array response
                        if (Array.isArray(data) && data.length > 0) {
                            console.log('  📊 Device info is array, extracting first item');
                            data = data[0];
                        }
                        
                        // Handle string response
                        if (typeof data === 'string') {
                            if (data === 'null' || data.trim() === 'null') {
                                console.log('  ⚠️ Device info returned null');
                                data = null;
                            } else {
                                try {
                                    data = JSON.parse(data);
                                } catch (e) {
                                    console.warn('  ⚠️ Failed to parse device info string');
                                    data = null;
                                }
                            }
                        }
                        
                        if (data && typeof data === 'object' && data !== null) {
                            // Check ingps field (GPS information from device)
                            if (data.ingps) {
                                const ingps = data.ingps;
                                const lat = ingps.lat || ingps.latitude;
                                const lng = ingps.lon || ingps.lng || ingps.longitude;
                                
                                if (lat && lng) {
                                    const latNum = parseFloat(lat);
                                    const lngNum = parseFloat(lng);
                                    
                                    if (!isNaN(latNum) && !isNaN(lngNum)) {
                                        console.log(`✅ Got sensor GPS from device info (ingps): ${latNum}, ${lngNum}`);
                                        return { lat: latNum, lng: lngNum };
                                    }
                                }
                            }
                            
                            // Check incell field (GSM positioning)
                            if (data.incell) {
                                const incell = data.incell;
                                const lat = incell.lat || incell.latitude;
                                const lng = incell.lon || incell.lng || incell.longitude;
                                
                                if (lat && lng) {
                                    const latNum = parseFloat(lat);
                                    const lngNum = parseFloat(lng);
                                    
                                    if (!isNaN(latNum) && !isNaN(lngNum)) {
                                        console.log(`✅ Got sensor GPS from device info (incell/GSM): ${latNum}, ${lngNum}`);
                                        return { lat: latNum, lng: lngNum };
                                    }
                                }
                            }
                            
                            // Check various possible GPS field names (including "lon" for longitude)
                            const lat = data.lat || data.latitude || data.gpsLat || 
                                       data.location?.lat || data.gps?.lat || 
                                       data.position?.lat || data.coords?.lat ||
                                       data.lastLat || data.lastLatitude;
                            const lng = data.lng || data.lon || data.longitude || data.gpsLng || 
                                       data.location?.lng || data.location?.lon || data.gps?.lng || 
                                       data.position?.lng || data.coords?.lng ||
                                       data.lastLng || data.lastLongitude || data.lastLon;
                            
                            if (lat && lng) {
                                const latNum = parseFloat(lat);
                                const lngNum = parseFloat(lng);
                                
                                if (!isNaN(latNum) && !isNaN(lngNum) && 
                                    latNum >= -90 && latNum <= 90 && 
                                    lngNum >= -180 && lngNum <= 180) {
                                    console.log(`✅ Got sensor GPS from device info: ${latNum}, ${lngNum}`);
                                    return { lat: latNum, lng: lngNum };
                                }
                            } else {
                                console.log('  ⚠️ Device info found but no GPS fields');
                            }
                        }
                    }
                } catch (error) {
                    console.warn('  ⚠️ Device info failed:', error.message);
                }
                
                // Method 3: Try device history (last 24 hours)
                try {
                    console.log('  🔍 Trying device history...');
                    const fromDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
                    const toDate = new Date().toISOString();
                    
                    const historyResult = await findyClient.getDeviceHistory(imei, fromDate, toDate);
                    
                    if (historyResult && historyResult.success && historyResult.data) {
                        const history = Array.isArray(historyResult.data) ? historyResult.data : 
                                      (historyResult.data.history || historyResult.data.data || []);
                        
                        if (history.length > 0) {
                            // Get most recent entry (first in array, or last if sorted differently)
                            const latest = history[0] || history[history.length - 1];
                            
                            // Check various possible GPS field names (including "lon")
                            const lat = latest.lat || latest.latitude || latest.gpsLat || 
                                       latest.location?.lat || latest.gps?.lat;
                            const lng = latest.lng || latest.lon || latest.longitude || latest.gpsLng || 
                                       latest.location?.lng || latest.location?.lon || latest.gps?.lng;
                            
                            if (lat && lng) {
                                const latNum = parseFloat(lat);
                                const lngNum = parseFloat(lng);
                                
                                if (!isNaN(latNum) && !isNaN(lngNum) && 
                                    latNum >= -90 && latNum <= 90 && 
                                    lngNum >= -180 && lngNum <= 180) {
                                    console.log(`✅ Got sensor GPS from history: ${latNum}, ${lngNum}`);
                                    return { lat: latNum, lng: lngNum };
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.warn('  ⚠️ Device history failed:', error.message);
                }
            }
            
            // Method 4: Try backend API directly
            try {
                console.log('  🔍 Trying backend API directly...');
                const response = await fetch(`/api/findy/device/${imei}/livetracking`);
                const result = await response.json();
                
                if (result && result.success && result.data) {
                    let data = result.data;
                    
                    console.log('  📊 Backend API data type:', typeof data);
                    console.log('  📊 Backend API data sample:', typeof data === 'string' ? data.substring(0, 200) : JSON.stringify(data).substring(0, 200));
                    
                    // Handle string response (JSON string that needs parsing)
                    if (typeof data === 'string') {
                        // Check if it's the string "null"
                        if (data === 'null' || data.trim() === 'null') {
                            console.log('  ⚠️ Backend API returned null (no GPS data available yet)');
                            data = null;
                        } else {
                            try {
                                data = JSON.parse(data);
                                console.log('  📊 Parsed JSON string, new type:', Array.isArray(data) ? 'array' : typeof data);
                            } catch (parseError) {
                                console.warn('  ⚠️ Failed to parse JSON string:', parseError.message);
                                data = null;
                            }
                        }
                    }
                    
                    // Handle null response
                    if (data === null || data === undefined) {
                        console.log('  ⚠️ Backend API returned null/undefined');
                        data = null;
                    }
                    // Handle array response (most recent entry is first)
                    else if (Array.isArray(data)) {
                        if (data.length > 0) {
                            console.log('  📊 Backend API returned array with', data.length, 'items');
                            console.log('  📊 First item:', JSON.stringify(data[0]).substring(0, 200));
                            data = data[0]; // Get most recent entry
                        } else {
                            console.log('  ⚠️ Backend API returned empty array');
                            data = null;
                        }
                    }
                    
                    if (data && typeof data === 'object' && data !== null) {
                        console.log('  📊 Available keys:', Object.keys(data));
                        
                        // Check various possible GPS field names (including "lon" for longitude)
                        const lat = data.lat || data.latitude || data.gpsLat || 
                                   data.location?.lat || data.gps?.lat;
                        const lng = data.lng || data.lon || data.longitude || data.gpsLng || 
                                   data.location?.lng || data.location?.lon || data.gps?.lng;
                        
                        console.log('  📍 Found lat:', lat, 'lng:', lng);
                        
                        if (lat && lng) {
                            const latNum = parseFloat(lat);
                            const lngNum = parseFloat(lng);
                            
                            // Validate coordinates
                            if (!isNaN(latNum) && !isNaN(lngNum) && 
                                latNum >= -90 && latNum <= 90 && 
                                lngNum >= -180 && lngNum <= 180) {
                                console.log(`✅ Got sensor GPS from backend API: ${latNum}, ${lngNum}`);
                                return { lat: latNum, lng: lngNum };
                            } else {
                                console.log(`  ⚠️ Invalid GPS coordinates from backend: ${lat}, ${lng}`);
                            }
                        } else {
                            console.log('  ⚠️ Backend API data found but no GPS fields');
                        }
                    } else {
                        console.log('  ⚠️ Backend API data is not an object:', typeof data);
                    }
                }
            } catch (error) {
                console.warn('  ⚠️ Backend API failed:', error.message);
            }
            
            // Method 5: Check sensor record in database
            try {
                console.log('  🔍 Checking sensor record in database...');
                const sensor = this.sensors.get(imei);
                if (sensor) {
                    console.log('  📊 Sensor record found:', {
                        hasLat: !!sensor.lat,
                        hasLng: !!sensor.lng,
                        hasGps: !!sensor.gps,
                        gpsSource: sensor.gps?.source
                    });
                    
                    // Try GPS object first
                    if (sensor.gps && sensor.gps.lat && sensor.gps.lng) {
                        console.log(`✅ Got sensor GPS from database GPS object: ${sensor.gps.lat}, ${sensor.gps.lng}`);
                        return { lat: parseFloat(sensor.gps.lat), lng: parseFloat(sensor.gps.lng) };
                    }
                    
                    // Try direct lat/lng fields
                    const lat = sensor.lat || sensor.latitude || sensor.gpsLat || sensor.location?.lat;
                    const lng = sensor.lng || sensor.lon || sensor.longitude || sensor.gpsLng || sensor.location?.lng;
                    
                    if (lat && lng) {
                        console.log(`✅ Got sensor GPS from database record: ${lat}, ${lng}`);
                        return { lat: parseFloat(lat), lng: parseFloat(lng) };
                    } else {
                        console.log('  ⚠️ Sensor record found but no GPS data');
                    }
                } else {
                    console.log('  ⚠️ Sensor record not found in database');
                }
            } catch (error) {
                console.warn('  ⚠️ Database check failed:', error.message);
            }
            
            // Method 6: Try to start live tracking first, then get data
            try {
                console.log('  🔍 Starting live tracking to get GPS...');
                if (typeof findyClient !== 'undefined') {
                    await findyClient.startLiveTracking(imei);
                    
                    // Wait a bit for data to come in
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    const liveResult = await findyClient.getLiveTracking(imei);
                    if (liveResult && liveResult.success && liveResult.data) {
                        const data = liveResult.data;
                        const lat = data.lat || data.latitude || data.gpsLat;
                        const lng = data.lng || data.longitude || data.gpsLng;
                        
                        if (lat && lng) {
                            console.log(`✅ Got sensor GPS after starting live tracking: ${lat}, ${lng}`);
                            return { lat: parseFloat(lat), lng: parseFloat(lng) };
                        }
                    }
                }
            } catch (error) {
                console.warn('  ⚠️ Live tracking start failed:', error.message);
            }
            
            console.warn('⚠️ Could not get sensor GPS coordinates from any source');
            console.log('💡 The sensor may need to send GPS data first, or GPS may not be available yet');
            return null;
            
        } catch (error) {
            console.error('❌ Error fetching sensor coordinates:', error);
            return null;
        }
    }
    
    /**
     * Extract last seen timestamp from device data
     * Handles multiple possible timestamp formats and locations
     */
    extractLastSeenTimestamp(deviceData) {
        console.log('🔍 [ADMIN] Extracting timestamp from device data...');
        
        if (!deviceData) {
            console.warn('⚠️ [ADMIN] No device data provided');
            return new Date().toISOString();
        }
        
        // Handle array response
        if (Array.isArray(deviceData)) {
            console.log('📦 [ADMIN] Device data is array, using first element');
            deviceData = deviceData[0] || {};
        }
        
        console.log('📋 [ADMIN] Device data keys:', Object.keys(deviceData));
        
        // PRIORITY 1: Check deviceInfo[0].lastModTime (deviceInfo is an ARRAY!)
        if (deviceData.deviceInfo && Array.isArray(deviceData.deviceInfo) && deviceData.deviceInfo.length > 0) {
            const deviceInfo = deviceData.deviceInfo[0];
            if (deviceInfo.lastModTime) {
                console.log(`📅 [ADMIN] Found deviceInfo[0].lastModTime: ${deviceInfo.lastModTime}`);
                try {
                    const testDate = new Date(deviceInfo.lastModTime);
                    const year = testDate.getFullYear();
                    
                    if (!isNaN(testDate.getTime()) && year > 2020 && year < 2030) {
                        const isoString = testDate.toISOString();
                        console.log(`  ✅ [ADMIN] USING deviceInfo[0].lastModTime: ${isoString}`);
                        return isoString;
                    }
                } catch (e) {
                    console.log(`  ❌ [ADMIN] Parse failed: ${e.message}`);
                }
            }
        }
        
        // PRIORITY 2: Check report.settings for latest timestamp
        if (deviceData.report && deviceData.report.settings && Array.isArray(deviceData.report.settings)) {
            console.log('📊 [ADMIN] Checking report.settings for latest timestamp');
            let latestTimestamp = null;
            let latestDate = null;
            
            for (const setting of deviceData.report.settings) {
                if (setting && setting.timestamp) {
                    try {
                        const testDate = new Date(setting.timestamp);
                        if (!isNaN(testDate.getTime()) && testDate.getFullYear() > 2020) {
                            if (!latestDate || testDate > latestDate) {
                                latestDate = testDate;
                                latestTimestamp = setting.timestamp;
                            }
                        }
                    } catch (e) {
                        continue;
                    }
                }
            }
            
            if (latestTimestamp) {
                const isoString = new Date(latestTimestamp).toISOString();
                console.log(`  ✅ [ADMIN] USING latest from report.settings: ${isoString}`);
                return isoString;
            }
        }
        
        // PRIORITY 3: Fallback to other locations
        const possibleTimestamps = [
            { path: 'lastModTime', value: deviceData.lastModTime },
            { path: 'ago', value: deviceData.ago },
            { path: 'ago_gps', value: deviceData.ago_gps },
            { path: 'timeIn', value: deviceData.timeIn },
            { path: 'timestamp', value: deviceData.timestamp },
            { path: 'lastUpdate', value: deviceData.lastUpdate },
            { path: 'ingps.timeIn', value: deviceData.ingps?.timeIn },
            { path: 'incell.timeIn', value: deviceData.incell?.timeIn },
            { path: 'report.timestamp', value: deviceData.report?.timestamp },
            { path: 'report.timeIn', value: deviceData.report?.timeIn },
            { path: 'report.time', value: deviceData.report?.time }
        ];
        
        console.log('🔍 [ADMIN] Checking timestamp locations:');
        // Find first valid timestamp
        for (const ts of possibleTimestamps) {
            console.log(`  📍 ${ts.path}: ${ts.value || 'N/A'}`);
            
            if (ts.value && ts.value !== 'null' && ts.value !== 'undefined') {
                // Test if it's valid
                try {
                    const date = new Date(ts.value);
                    const year = date.getFullYear();
                    
                    console.log(`    🗓️ Year: ${year}`);
                    
                    if (!isNaN(date.getTime()) && year > 2020 && year < 2030) {
                        const isoString = date.toISOString();
                        console.log(`    ✅ [ADMIN] VALID! Using "${ts.path}": ${isoString}`);
                        return isoString;
                    } else {
                        console.log(`    ❌ Invalid (year ${year} out of range)`);
                    }
                } catch (error) {
                    console.log(`    ❌ Parse error: ${error.message}`);
                    continue;
                }
            }
        }
        
        // If no timestamp found, use current time as fallback
        console.warn('⚠️ [ADMIN] NO VALID timestamp found, using current time (sensor will show as "Just now")');
        return new Date().toISOString();
    }
    
    /**
     * Get bin display HTML with name and status (with safety checks)
     */
    getBinDisplay(binId) {
        if (!binId) {
            return '<span style="color: #94a3b8; font-style: italic;"><i class="fas fa-circle-notch" style="font-size: 0.7rem;"></i> Not linked</span>';
        }
        
        // Get bin from dataManager with safety checks
        if (typeof dataManager !== 'undefined') {
            const bins = dataManager.getBins();
            const bin = bins.find(b => b.id === binId);
            if (bin) {
                const fillColor = bin.fillLevel >= 80 ? '#ef4444' : bin.fillLevel >= 50 ? '#f59e0b' : '#10b981';
                const fillIcon = bin.fillLevel >= 80 ? 'fa-exclamation-circle' : 'fa-check-circle';
                
                return `
                    <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <i class="fas fa-trash-alt" style="color: #3b82f6;"></i>
                            <span style="font-weight: 600; color: #1e293b;">${binId}</span>
                            <i class="fas ${fillIcon}" style="color: ${fillColor}; font-size: 0.75rem;" title="Fill: ${bin.fillLevel}%"></i>
                        </div>
                        ${bin.location && bin.location.address ? `
                            <div style="font-size: 0.75rem; color: #64748b; padding-left: 1.25rem;">
                                <i class="fas fa-map-marker-alt" style="font-size: 0.65rem;"></i> ${bin.location.address}
                            </div>
                        ` : ''}
                        <div style="font-size: 0.75rem; color: #64748b; padding-left: 1.25rem;">
                            Fill: <span style="color: ${fillColor}; font-weight: 600;">${bin.fillLevel}%</span>
                        </div>
                    </div>
                `;
            }
        }
        
        // Fallback if dataManager not ready or bin not found
        return `<span style="color: #3b82f6; font-weight: 600;"><i class="fas fa-trash-alt"></i> ${binId}</span>`;
    }
    
    /**
     * Get location name from GPS coordinates using reverse geocoding
     */
    async getLocationNameFromGPS(lat, lng) {
        try {
            console.log(`🌍 Reverse geocoding coordinates: ${lat}, ${lng}...`);
            
            // Use OpenStreetMap Nominatim API (free, no API key required)
            const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
            
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'WasteManagementSystem/1.0' // Required by Nominatim
                }
            });
            
            if (!response.ok) {
                throw new Error(`Reverse geocoding failed: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data && data.address) {
                // Build location name from address components
                const address = data.address;
                
                // Try different combinations to get a good location name
                let locationName = null;
                
                // Priority 1: Road/Street + Suburb/Neighborhood
                if (address.road && address.suburb) {
                    locationName = `${address.road}, ${address.suburb}`;
                }
                // Priority 2: Road/Street + City
                else if (address.road && address.city) {
                    locationName = `${address.road}, ${address.city}`;
                }
                // Priority 3: Suburb/Neighborhood + City
                else if (address.suburb && address.city) {
                    locationName = `${address.suburb}, ${address.city}`;
                }
                // Priority 4: City + State/Country
                else if (address.city) {
                    locationName = address.city;
                    if (address.state) {
                        locationName += `, ${address.state}`;
                    }
                }
                // Priority 5: Village/Town
                else if (address.village) {
                    locationName = address.village;
                }
                // Priority 6: Town
                else if (address.town) {
                    locationName = address.town;
                }
                // Priority 7: Display name (fallback)
                else if (data.display_name) {
                    // Extract first part of display name (usually the most specific)
                    locationName = data.display_name.split(',')[0];
                }
                
                if (locationName) {
                    console.log(`✅ Got location name: ${locationName}`);
                    return locationName;
                } else {
                    console.log('⚠️ Could not build location name from address components');
                    return data.display_name || null;
                }
            } else {
                console.log('⚠️ No address data in reverse geocoding response');
                return data.display_name || null;
            }
            
        } catch (error) {
            console.warn('⚠️ Reverse geocoding failed:', error.message);
            return null;
        }
    }
    
    /**
     * Create new bin and link sensor
     */
    async createBinAndLink(imei, binData) {
        try {
            console.log(`📦 Creating new bin: ${binData.id}`);
            
            // Get sensor GPS coordinates
            let lat = binData.lat;
            let lng = binData.lng;
            
            if (!lat || !lng) {
                console.log('📍 Fetching sensor GPS coordinates...');
                const sensorCoords = await this.getSensorCoordinates(imei);
                
                if (sensorCoords) {
                    lat = sensorCoords.lat;
                    lng = sensorCoords.lng;
                    console.log(`✅ Using sensor GPS: ${lat}, ${lng}`);
                } else {
                    // Fallback to default Doha coordinates
                    lat = 25.2854;
                    lng = 51.5310;
                    console.warn('⚠️ Using default Doha coordinates');
                }
            }
            
            // Create bin object with sensor coordinates
            const newBin = {
                id: binData.id,
                location: binData.location || binData.id,
                lat: lat,
                lng: lng,
                fill: 0,
                status: 'normal',
                type: binData.type || 'general',
                lastCollection: 'Never',
                capacity: binData.capacity || 100,
                hasSensor: false,
                sensorIMEI: null
            };
            
            console.log(`📍 Bin coordinates set to sensor GPS: ${lat}, ${lng}`);
            
            // Check if bin already exists in dataManager
            let binExists = false;
            if (typeof dataManager !== 'undefined') {
                const existingBin = dataManager.getBinById(newBin.id);
                if (existingBin) {
                    console.log(`ℹ️ Bin ${newBin.id} already exists in dataManager, updating instead`);
                    dataManager.updateBin(newBin.id, newBin);
                    binExists = true;
                } else {
                    dataManager.addBin(newBin);
                    console.log(`✅ Bin added to dataManager: ${newBin.id}`);
                }
            }
            
            // Save bin to server using dedicated endpoint
            // This will update if it already exists, or add if new
            try {
                const response = await fetch('/api/bins/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newBin)
                });
                
                if (!response.ok) {
                    // If 400 error, check if it's "already exists" - that's fine, continue
                    if (response.status === 400) {
                        const result = await response.json();
                        if (result.error && result.error.includes('already exists')) {
                            console.log(`ℹ️ Bin ${newBin.id} already exists on server, continuing...`);
                        } else {
                            throw new Error(result.error || 'Failed to save bin');
                        }
                    } else {
                        throw new Error(`Server error: ${response.status}`);
                    }
                } else {
                    const result = await response.json();
                    if (result.success) {
                        console.log(`✅ Bin ${result.message || 'saved'} to server: ${newBin.id}`);
                    } else {
                        console.warn('⚠️ Server returned non-success:', result.error);
                    }
                }
            } catch (error) {
                console.warn('⚠️ Error saving bin to server:', error.message);
                // Don't throw - bin is already in dataManager, continue with linking
                // The bin will be synced on next data sync anyway
            }
            
// Now link the sensor to this new bin
            await this.linkSensorToBin(imei, newBin.id);
            
            // Force refresh bins on map - ensure bin is in dataManager first
            const refreshMap = async () => {
                // Force data sync first to ensure bin is in dataManager
                // Wait a bit for server to save the bin first
                await new Promise(resolve => setTimeout(resolve, 500));
                
                if (typeof syncManager !== 'undefined' && syncManager.syncFromServer) {
                    try {
                        console.log('🔄 Syncing data from server to get BIN-006...');
                        await syncManager.syncFromServer();
                        console.log('✅ Data sync completed');
                        
                        // Verify BIN-006 is now in dataManager
                        if (typeof dataManager !== 'undefined') {
                            const bins = dataManager.getBins();
                            const bin006 = bins.find(b => b.id === newBin.id);
                            if (bin006) {
                                console.log(`✅ BIN-006 confirmed in dataManager after sync: ${bin006.id} at ${bin006.lat}, ${bin006.lng}`);
                            } else {
                                console.warn(`⚠️ BIN-006 still not in dataManager after sync. Total bins: ${bins.length}`);
                                // Try one more sync
                                setTimeout(async () => {
                                    await syncManager.syncFromServer();
                                }, 1000);
                            }
                        }
                    } catch (error) {
                        console.warn('⚠️ Data sync error:', error);
                    }
                }
                
                // Wait for bin to be in dataManager
                let attempts = 0;
                while (attempts < 15) {
                    if (typeof dataManager !== 'undefined') {
                        const bin = dataManager.getBinById(newBin.id);
                        if (bin && bin.lat && bin.lng) {
                            console.log(`✅ Bin ${newBin.id} found in dataManager with coordinates: ${bin.lat}, ${bin.lng}`);
                            break;
                        } else if (bin) {
                            console.warn(`⚠️ Bin ${newBin.id} found but missing coordinates: lat=${bin.lat}, lng=${bin.lng}`);
                        }
                    }
                    await new Promise(resolve => setTimeout(resolve, 200));
                    attempts++;
                }
                
                // Refresh map
                if (typeof mapManager !== 'undefined' && mapManager.map) {
                    console.log(`🔄 Refreshing map to show bin ${newBin.id}...`);
                    
                    // Clear and reload
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
                    
                    mapManager.loadBinsOnMap();
                    
                    // Verify bin was added
                    setTimeout(() => {
                        const bins = dataManager.getBins();
                        console.log(`📊 Total bins in dataManager: ${bins.length}`);
                        console.log(`📊 Bin IDs:`, bins.map(b => b.id));
                        
                        const binOnMap = mapManager.markers?.bins?.[newBin.id];
                        if (binOnMap) {
                            console.log(`✅ Bin ${newBin.id} marker added to map successfully`);
                            // Pan to bin location
                            const bin = dataManager.getBinById(newBin.id);
                            if (bin && bin.lat && bin.lng) {
                                mapManager.map.setView([bin.lat, bin.lng], 15);
                            }
                        } else {
                            console.warn(`⚠️ Bin ${newBin.id} marker not found on map. Total bins in dataManager: ${bins.length}`);
                            const bin = bins.find(b => b.id === newBin.id);
                            if (bin && bin.lat && bin.lng) {
                                console.log(`🔧 Attempting to add bin ${newBin.id} marker directly...`);
                                mapManager.addBinMarker(bin);
                            } else {
                                console.error(`❌ Bin ${newBin.id} not found or missing coordinates in dataManager`);
                            }
                        }
                    }, 1000);
                } else {
                    console.warn('⚠️ Map not ready, will refresh when map initializes');
                }
                
                // Also call global refresh function if available
                if (typeof window.forceRefreshBinsWithSensors === 'function') {
                    window.forceRefreshBinsWithSensors();
                }
                if (typeof window.forceRefreshBinsOnMap === 'function') {
                    window.forceRefreshBinsOnMap();
                }
            };
            
            // Refresh immediately and also after delays to ensure sync
            setTimeout(refreshMap, 500);
            setTimeout(refreshMap, 2000);
            setTimeout(refreshMap, 5000);
            
            this.showNotification(`✅ Created bin ${newBin.id} and linked sensor ${imei}`, 'success');
            
            return newBin;
            
        } catch (error) {
            console.error('Error creating bin:', error);
            this.showNotification('Failed to create bin: ' + error.message, 'error');
            throw error;
        }
    }
    
    /**
     * Show sensor details
     */
    async showSensorDetails(imei) {
        try {
            const result = await findyClient.getDevice(imei);
            
            if (result.success) {
                alert(JSON.stringify(result.data, null, 2));
                // TODO: Create a proper modal for details
            }
        } catch (error) {
            this.showNotification('Failed to load sensor details', 'error');
        }
    }
    
    /**
     * Populate bin dropdown
     */
    async populateBinDropdown() {
        const select = document.getElementById('linkBinId');
        if (!select) {
            console.error('❌ linkBinId select element not found');
            return;
        }
        
        console.log('🔍 Populating bin dropdown...');
        console.log('📦 dataManager available:', typeof dataManager !== 'undefined');
        
        let bins = [];
        
        // Try dataManager first
        if (typeof dataManager !== 'undefined') {
            bins = dataManager.getBins();
            console.log(`📦 Got ${bins.length} bins from dataManager`);
        }
        
        // If no bins, fetch from API
        if (bins.length === 0) {
            try {
                console.log('📡 Fetching bins from API...');
                const response = await fetch('/api/data/sync');
                const data = await response.json();
                bins = data.bins || [];
                console.log(`📡 Got ${bins.length} bins from API`);
            } catch (error) {
                console.error('❌ Error fetching bins from API:', error);
            }
        }
        
        console.log(`📦 Total bins for dropdown: ${bins.length}`, bins);
        
        // Add "Create New Bin" option at the top
        let html = '<option value="">Select a bin...</option>';
        html += '<option value="__CREATE_NEW__">➕ Create New Bin (Auto-Generate ID)</option>';
        html += '<option disabled>───────────</option>';
        
        console.log(`🔍 Found ${bins.length} total bins for dropdown`);
        
        bins.forEach(bin => {
            // Only show bins without sensors (or allow re-linking)
            const hasSensor = Array.from(this.sensors.values()).some(s => s.binId === bin.id);
            
            // Use location instead of name
            const binLabel = bin.location || bin.name || bin.id;
            const binType = bin.type || 'Bin';
            const fillLevel = bin.fill || 0;
            
            // Show all bins (including those with sensors)
            html += `<option value="${bin.id}">${bin.id} - ${binLabel} (${fillLevel}% full) ${hasSensor ? '📡' : ''}</option>`;
            
            console.log(`  ✅ Added bin to dropdown: ${bin.id} - ${binLabel}`);
        });
        
        select.innerHTML = html;
        
        // Add change listener to show create bin form
        select.onchange = () => {
            const linkButton = document.getElementById('linkButton');
            
            if (select.value === '__CREATE_NEW__') {
                this.showCreateBinForm();
                if (linkButton) {
                    linkButton.textContent = 'Create & Link';
                    linkButton.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                }
            } else {
                this.hideCreateBinForm();
                if (linkButton) {
                    linkButton.textContent = 'Link';
                    linkButton.style.background = '';
                }
            }
        };
        
        console.log(`✅ Populated dropdown with ${bins.length} bins + Create New option`);
    }
    
    /**
     * Update API status display
     */
    updateAPIStatus(health) {
        const statusEl = document.getElementById('findyAPIStatus');
        if (!statusEl) {
            console.warn('⚠️ findyAPIStatus element not found');
            return;
        }
        
        if (health.authenticated) {
            statusEl.className = 'api-status-indicator connected';
            statusEl.innerHTML = '<i class="fas fa-check-circle"></i> Connected';
            console.log('✅ API Status updated: Connected');
        } else {
            statusEl.className = 'api-status-indicator disconnected';
            statusEl.innerHTML = '<i class="fas fa-times-circle"></i> Not Connected';
            console.log('⚠️ API Status updated: Not Connected');
        }
    }
    
    /**
     * Update sensor status from WebSocket updates
     * @param {string} imei - Sensor IMEI
     * @param {object} statusData - Status data from WebSocket
     */
    updateSensorStatus(imei, statusData) {
        try {
            // Update status map
            this.sensorStatus.set(imei, {
                ...this.sensorStatus.get(imei),
                ...statusData,
                lastUpdate: new Date().toISOString()
            });
            
            // Update sensor data in sensors map if exists
            if (this.sensors.has(imei)) {
                const sensor = this.sensors.get(imei);
                this.sensors.set(imei, {
                    ...sensor,
                    status: statusData.status || sensor.status,
                    battery: statusData.battery ?? sensor.battery,
                    fillLevel: statusData.fillLevel ?? sensor.fillLevel,
                    temperature: statusData.temperature ?? sensor.temperature,
                    lastSeen: statusData.lastUpdate || new Date().toISOString()
                });
            }
            
            // Refresh the sensor table row if visible
            this.updateSensorTableRow(imei, statusData);
            
            console.log(`📡 Sensor ${imei} status updated:`, statusData);
        } catch (error) {
            console.error(`❌ Error updating sensor ${imei} status:`, error);
        }
    }
    
    /**
     * Update a specific sensor row in the table
     */
    updateSensorTableRow(imei, statusData) {
        const row = document.querySelector(`tr[data-imei="${imei}"]`);
        if (!row) return;
        
        // Update status badge
        const statusCell = row.querySelector('.sensor-status');
        if (statusCell && statusData.status) {
            const statusClass = statusData.status === 'online' ? 'success' : 
                               statusData.status === 'offline' ? 'danger' : 'warning';
            statusCell.innerHTML = `<span class="badge badge-${statusClass}">${statusData.status}</span>`;
        }
        
        // Update battery if shown
        const batteryCell = row.querySelector('.sensor-battery');
        if (batteryCell && statusData.battery !== undefined) {
            batteryCell.textContent = `${statusData.battery}%`;
        }
        
        // Update fill level if shown
        const fillCell = row.querySelector('.sensor-fill');
        if (fillCell && statusData.fillLevel !== undefined) {
            fillCell.textContent = `${statusData.fillLevel}%`;
        }
    }
    
    /**
     * Helper functions
     */
    getStatusColor(status) {
        switch (status) {
            case 'online': return '#10b981';
            case 'offline': return '#ef4444';
            case 'active': return '#3b82f6';
            default: return '#94a3b8';
        }
    }
    
    getStatusIcon(status) {
        switch (status) {
            case 'online': return '🟢';
            case 'offline': return '🔴';
            case 'active': return '🔵';
            default: return '⚪';
        }
    }
    
    getBatteryColor(level) {
        if (level > 60) return '#10b981';
        if (level > 30) return '#f59e0b';
        return '#ef4444';
    }
    
    formatDate(dateString) {
        // Use global sensor date formatter if available
        if (typeof formatSensorDate === 'function') {
            return formatSensorDate(dateString);
        }
        
        // Fallback to basic formatting
        if (!dateString || dateString === 'null' || dateString === 'undefined') {
            return '<span style="color: #94a3b8; font-style: italic;">Never</span>';
        }
        
        try {
            const date = new Date(dateString);
            
            if (isNaN(date.getTime())) {
                return '<span style="color: #f59e0b; font-style: italic;">Unknown</span>';
            }
            
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            
            if (diffMs < 0 || diffMins < 1) return '<span style="color: #34d399; font-weight: 600;">Just now</span>';
            if (diffMins < 60) return `<span style="color: #34d399;">${diffMins}m ago</span>`;
            
            const diffHours = Math.floor(diffMins / 60);
            if (diffHours < 24) return `<span style="color: #60a5fa;">${diffHours}h ago</span>`;
            
            const diffDays = Math.floor(diffHours / 24);
            if (diffDays < 7) return `<span style="color: #a78bfa;">${diffDays}d ago</span>`;
            
            return `<span style="color: #94a3b8;">${date.toLocaleDateString()}</span>`;
            
        } catch (error) {
            console.error('Error formatting date:', error);
            return '<span style="color: #ef4444;">Error</span>';
        }
    }
    
    showNotification(message, type = 'info') {
        if (typeof showNotification === 'function') {
            showNotification(message, type);
        } else {
            alert(message);
        }
    }
    
    updateBulkProgress(current, total) {
        const progressEl = document.getElementById('bulkImportProgress');
        if (progressEl) {
            const percent = Math.round((current / total) * 100);
            progressEl.textContent = `Processing: ${current}/${total} (${percent}%)`;
        }
    }
    
    /**
     * Cleanup
     */
    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
    }
}

// Initialize global instance
const sensorManagementAdmin = new SensorManagementAdmin();
window.sensorManagementAdmin = sensorManagementAdmin;

console.log('✅ Sensor Management Admin loaded');

