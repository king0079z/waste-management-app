// sensor-status-manager.js - Real-time Sensor Status Management
// Handles fetching, caching, and real-time updates of sensor status

class SensorStatusManager {
    constructor() {
        this.statusCache = new Map(); // Cache sensor statuses
        this.updateCallbacks = new Map(); // Callbacks for status updates
        this.fetchQueue = []; // Queue for batch fetching
        this.isFetching = false;
        this.lastBatchFetch = 0;
        this.batchInterval = 15000; // Minimum 15s between batch fetches
        
        console.log('📊 Sensor Status Manager initialized');
    }
    
    /**
     * Get sensor status (with caching)
     * @param {string} imei - Sensor IMEI
     * @param {boolean} forceRefresh - Force fetch from API
     * @returns {Promise<object>} Sensor status
     */
    async getSensorStatus(imei, forceRefresh = false) {
        // Check cache first
        if (!forceRefresh) {
            const cached = this.statusCache.get(imei);
            if (cached && Date.now() - cached.timestamp < 30000) { // 30s cache
                return cached.status;
            }
        }
        
        try {
            console.log(`📡 Fetching status for sensor ${imei}...`);
            
            // Use findyClient to get device info
            const result = await findyClient.getDevice(imei);
            
            if (result && result.success && result.data) {
                let deviceData = result.data;
                
                // Handle array response
                if (Array.isArray(deviceData)) {
                    deviceData = deviceData[0] || {};
                }
                
                // Extract status information
                const status = this.parseDeviceStatus(deviceData);
                
                // Cache the status
                this.statusCache.set(imei, {
                    status,
                    timestamp: Date.now()
                });
                
                // Trigger callbacks
                this.triggerCallbacks(imei, status);
                
                return status;
            } else {
                // Sensor offline or not found
                const status = {
                    online: false,
                    status: 'offline',
                    lastSeen: null,
                    error: result.error || 'Sensor not responding'
                };
                
                this.statusCache.set(imei, {
                    status,
                    timestamp: Date.now()
                });
                
                return status;
            }
        } catch (error) {
            console.error(`❌ Error fetching sensor ${imei} status:`, error);
            
            const status = {
                online: false,
                status: 'error',
                lastSeen: null,
                error: error.message
            };
            
            return status;
        }
    }
    
    /**
     * Parse device data to extract status information
     */
    parseDeviceStatus(deviceData) {
        console.log('🔍 RAW DEVICE DATA:', JSON.stringify(deviceData, null, 2));
        
        if (!deviceData) {
            console.warn('⚠️ No device data provided');
            return {
                online: false,
                status: 'unknown',
                lastSeen: null
            };
        }
        
        // Log all available keys
        console.log('📋 Available data keys:', Object.keys(deviceData));
        
        // Findy API returns "YYYY-MM-DD HH:mm:ss" without timezone - treat as UTC (server time)
        function parseFindyTimestamp(value) {
            if (!value || typeof value !== 'string') return null;
            const s = value.trim();
            if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}$/.test(s)) {
                const d = new Date(s + 'Z');
                return isNaN(d.getTime()) ? null : d;
            }
            const d = new Date(s);
            return isNaN(d.getTime()) ? null : d;
        }
        
        // Extract timestamp - use MOST RECENT from entire Findy payload (deviceInfo + report.settings)
        let lastSeenTimestamp = null;
        let latestDateMs = 0;
        
        function considerTimestamp(value) {
            if (!value) return;
            try {
                const d = parseFindyTimestamp(String(value));
                if (d && d.getFullYear() > 2020 && d.getTime() > latestDateMs) {
                    latestDateMs = d.getTime();
                    lastSeenTimestamp = value;
                }
            } catch (e) { /* skip */ }
        }
        
        // Collect from deviceInfo
        if (deviceData.deviceInfo && Array.isArray(deviceData.deviceInfo) && deviceData.deviceInfo.length > 0 && deviceData.deviceInfo[0].lastModTime) {
            console.log(`📅 deviceInfo[0].lastModTime: ${deviceData.deviceInfo[0].lastModTime}`);
            considerTimestamp(deviceData.deviceInfo[0].lastModTime);
        }
        
        // Collect from report.settings (GPS, fill, etc. often have newer timestamps than deviceInfo)
        if (deviceData.report && deviceData.report.settings && Array.isArray(deviceData.report.settings)) {
            for (const setting of deviceData.report.settings) {
                if (setting && setting.timestamp) considerTimestamp(setting.timestamp);
            }
        }
        
        if (lastSeenTimestamp) {
            console.log(`  ✅ USING most recent timestamp from payload: ${lastSeenTimestamp}`);
        }
        
        // PRIORITY 3: Fallback timestamp locations (GPS time, etc.)
        if (!lastSeenTimestamp) {
            const timestampLocations = [
                { path: 'ago', value: deviceData.ago },
                { path: 'ago_gps', value: deviceData.ago_gps },
                { path: 'timeIn', value: deviceData.timeIn },
                { path: 'ingps.timeIn', value: deviceData.ingps?.timeIn },
                { path: 'incell.timeIn', value: deviceData.incell?.timeIn },
                { path: 'report.time', value: deviceData.report?.time },
                { path: 'report.timestamp', value: deviceData.report?.timestamp },
                { path: 'lastUpdate', value: deviceData.lastUpdate },
                { path: 'timestamp', value: deviceData.timestamp }
            ];

            console.log('🔍 Checking fallback timestamp locations:');
            for (const loc of timestampLocations) {
                console.log(`  📍 ${loc.path}: ${loc.value || 'N/A'}`);
                if (loc.value && !lastSeenTimestamp) {
                    // Try to parse and validate
                    try {
                        const testDate = new Date(loc.value);
                        const year = testDate.getFullYear();
                        console.log(`    🗓️ Parsed year: ${year}`);
                        
                        if (!isNaN(testDate.getTime()) && year > 2020 && year < 2030) {
                            lastSeenTimestamp = loc.value;
                            console.log(`    ✅ Using fallback "${loc.path}": ${loc.value}`);
                            break;
                        } else {
                            console.log(`    ❌ Invalid (year ${year} out of range or NaN)`);
                        }
                    } catch (e) {
                        console.log(`    ❌ Parse error: ${e.message}`);
                    }
                }
            }
        }
        
        // If NO valid timestamp found, use current time
        if (!lastSeenTimestamp) {
            console.warn('⚠️ NO VALID TIMESTAMP FOUND! Using current time as fallback.');
            console.warn('⚠️ This sensor will appear as "Just now" which may not be accurate.');
            lastSeenTimestamp = new Date().toISOString();
        }
        
        // Extract key information
        const status = {
            online: true,
            status: 'online',
            lastSeen: lastSeenTimestamp,
            battery: null,
            fillLevel: null,
            temperature: null,
            operator: deviceData.operator || null,
            location: null,
            signal: null
        };
        
        // Extract battery from standard locations or report.settings
        if (deviceData.battery !== undefined && deviceData.battery !== null) {
            status.battery = parseFloat(deviceData.battery);
            console.log(`🔋 Battery from root: ${status.battery}%`);
        } else if (deviceData.deviceInfo && Array.isArray(deviceData.deviceInfo) && deviceData.deviceInfo[0]?.battery) {
            status.battery = parseFloat(deviceData.deviceInfo[0].battery);
            console.log(`🔋 Battery from deviceInfo[0]: ${status.battery}%`);
        } else if (deviceData.report && deviceData.report.settings && Array.isArray(deviceData.report.settings)) {
            // Check report.settings for battery (dataTypeID might be in there)
            for (const setting of deviceData.report.settings) {
                // Look for battery-related datatypeID or name
                if (setting && setting.dataType && 
                    (setting.dataType.name === 'Battery Level' || setting.dataType.datatypeID === '223') && 
                    setting.value !== null && setting.value !== undefined) {
                    status.battery = parseFloat(setting.value);
                    console.log(`🔋 Battery from report.settings: ${status.battery}%`);
                    break;
                }
            }
        }
        
        // Extract location from GPS or GSM
        if (deviceData.ingps && deviceData.ingps.lat && deviceData.ingps.lon) {
            status.location = {
                lat: parseFloat(deviceData.ingps.lat),
                lng: parseFloat(deviceData.ingps.lon || deviceData.ingps.lng),
                type: 'GPS',
                accuracy: deviceData.ingps.accuracy || null
            };
            console.log(`📍 Location from GPS: ${status.location.lat}, ${status.location.lng} (accuracy: ${status.location.accuracy}m)`);
        } else if (deviceData.incell && deviceData.incell.lat && deviceData.incell.lon) {
            status.location = {
                lat: parseFloat(deviceData.incell.lat),
                lng: parseFloat(deviceData.incell.lon || deviceData.incell.lng),
                type: 'GSM',
                accuracy: deviceData.incell.accuracy || null
            };
            console.log(`📍 Location from GSM: ${status.location.lat}, ${status.location.lng} (accuracy: ${status.location.accuracy}m)`);
        }
        
        // Extract operator
        if (deviceData.operator) {
            status.operator = deviceData.operator;
            console.log(`📡 Operator: ${status.operator}`);
        } else if (deviceData.deviceInfo?.operator) {
            status.operator = deviceData.deviceInfo.operator;
            console.log(`📡 Operator from deviceInfo: ${status.operator}`);
        }
        
        // Extract signal strength
        if (deviceData.incell) {
            status.signal = -70; // Good signal if GSM data available
        }
        
        console.log(`📅 Status before timestamp normalization: lastSeen = ${status.lastSeen}`);
        
        // Normalize to ISO (sensor-date-formatter treats Findy "YYYY-MM-DD HH:mm:ss" as UTC)
        if (status.lastSeen && typeof normalizeSensorTimestamp === 'function') {
            const normalized = normalizeSensorTimestamp(status.lastSeen);
            console.log(`🔄 Normalized: ${status.lastSeen} → ${normalized}`);
            status.lastSeen = normalized || status.lastSeen;
        } else if (status.lastSeen && typeof status.lastSeen === 'string' && /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}$/.test(status.lastSeen.trim())) {
            const d = parseFindyTimestamp(status.lastSeen);
            if (d) status.lastSeen = d.toISOString();
        }
        
        // Determine if sensor is actually online based on last seen time
        if (status.lastSeen) {
            try {
                const lastSeenDate = new Date(status.lastSeen);
                console.log(`📅 Parsed date object: ${lastSeenDate.toISOString()}`);
                
                if (!isNaN(lastSeenDate.getTime())) {
                    const now = new Date();
                    const diffMs = now - lastSeenDate;
                    const diffMinutes = Math.floor(diffMs / (1000 * 60));
                    const diffHours = Math.floor(diffMinutes / 60);
                    const diffDays = Math.floor(diffHours / 24);
                    
                    console.log(`⏱️ Time difference:`);
                    console.log(`   📊 ${diffMinutes} minutes (${diffHours} hours, ${diffDays} days)`);
                    console.log(`   📊 ${diffMs}ms total difference`);
                    
                    // Consider offline if not seen in last 90 minutes (Findy timestamps are UTC; avoid false offline)
                    const offlineThresholdMinutes = 90;
                    if (diffMinutes > offlineThresholdMinutes) {
                        status.online = false;
                        status.status = 'offline';
                        console.log(`   📴 MARKED AS OFFLINE (>${offlineThresholdMinutes}min threshold)`);
                    } else {
                        status.online = true;
                        status.status = 'online';
                        console.log(`   ✅ MARKED AS ONLINE (<${offlineThresholdMinutes}min threshold)`);
                    }
                } else {
                    console.warn('   ⚠️ Date parsing resulted in NaN, assuming online');
                    status.online = true;
                    status.status = 'online';
                }
            } catch (error) {
                console.error('   ❌ Date parsing error:', error);
                status.online = true;
                status.status = 'online';
            }
        } else {
            console.warn('   ⚠️ No lastSeen timestamp, assuming online (device responded)');
            status.online = true;
            status.status = 'online';
        }
        
        console.log('✅ FINAL STATUS:', {
            online: status.online,
            status: status.status,
            lastSeen: status.lastSeen,
            battery: status.battery,
            operator: status.operator,
            hasLocation: !!status.location
        });
        
        return status;
    }
    
    /**
     * Get status for multiple sensors (batch fetch)
     * @param {Array<string>} imeis - Array of sensor IMEIs
     * @returns {Promise<Map>} Map of IMEI to status
     */
    async getBatchSensorStatus(imeis) {
        console.log(`📊 Fetching batch status for ${imeis.length} sensors...`);
        
        const statusMap = new Map();
        
        // Process in parallel with rate limiting (3 at a time)
        const batchSize = 3;
        for (let i = 0; i < imeis.length; i += batchSize) {
            const batch = imeis.slice(i, i + batchSize);
            const promises = batch.map(imei => this.getSensorStatus(imei));
            const results = await Promise.all(promises);
            
            batch.forEach((imei, index) => {
                statusMap.set(imei, results[index]);
            });
            
            // Small delay between batches to avoid overwhelming API
            if (i + batchSize < imeis.length) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        
        console.log(`✅ Fetched batch status for ${imeis.length} sensors`);
        return statusMap;
    }
    
    /**
     * Register callback for status updates
     */
    onStatusUpdate(imei, callback) {
        if (!this.updateCallbacks.has(imei)) {
            this.updateCallbacks.set(imei, []);
        }
        this.updateCallbacks.get(imei).push(callback);
    }
    
    /**
     * Trigger callbacks for sensor status update
     */
    triggerCallbacks(imei, status) {
        const callbacks = this.updateCallbacks.get(imei);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(status);
                } catch (error) {
                    console.error(`Error in status callback for ${imei}:`, error);
                }
            });
        }
    }
    
    /**
     * Clear cache for sensor
     */
    clearCache(imei) {
        this.statusCache.delete(imei);
    }
    
    /**
     * Clear all caches
     */
    clearAllCaches() {
        this.statusCache.clear();
        console.log('🗑️ Cleared all sensor status caches');
    }
}

// Initialize global instance
const sensorStatusManager = new SensorStatusManager();
window.sensorStatusManager = sensorStatusManager;

console.log('✅ Sensor Status Manager loaded');
