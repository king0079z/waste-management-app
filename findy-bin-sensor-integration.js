// findy-bin-sensor-integration.js - Integrate Findy IoT Sensors with Waste Bins
// Sensors are installed on bins and should appear as enhanced bin markers

class FindyBinSensorIntegration {
    constructor() {
        this.binSensorMapping = {}; // Map bin IDs to sensor IMEIs
        this.sensorToBinMapping = {}; // Map sensor IMEIs to bin IDs
        this.sensorData = {}; // Cache sensor data
        this.updateIntervals = {}; // Track update intervals
        this.sensorErrorCounts = {}; // Track consecutive errors per bin
        this._missingValueWarnedAt = {}; // Throttle "missing fields" warning per bin (avoid console spam)
        
        // Debounce sync to prevent flooding during batch updates
        this._syncDebounceTimer = null;
        this._syncDebounceDelay = 3000; // Wait 3 seconds after last update before syncing
        
        console.log('🗑️ Findy Bin Sensor Integration initialized');
    }
    
    /**
     * Convert ultrasonic distance (cm) to fill percentage.
     * Max distance = empty bin (0%), min distance = full bin (100%).
     * Formula: fill% = 100 * (distanceEmptyCm - distanceCm) / (distanceEmptyCm - distanceFullCm).
     * @param {number} distanceCm - Distance from sensor to waste surface (cm)
     * @param {{ distanceEmptyCm: number, distanceFullCm: number }} calibration - Empty (0%) and full (100%) distances in cm
     * @returns {number} Fill percentage 0-100
     */
    distanceToFillPercent(distanceCm, calibration = {}) {
        const empty = calibration.distanceEmptyCm != null ? Number(calibration.distanceEmptyCm) : 200;
        const full = calibration.distanceFullCm != null ? Number(calibration.distanceFullCm) : 0;
        if (empty === full) return 50;
        const num = parseFloat(distanceCm);
        if (isNaN(num)) return null;
        const pct = 100 * (empty - num) / (empty - full);
        return Math.max(0, Math.min(100, pct));
    }
    
    /**
     * Get distance calibration for a bin (empty = 0%, full = 100%).
     * Store on bin: sensorDistanceEmptyCm, sensorDistanceFullCm (cm).
     */
    getCalibrationForBin(binId) {
        if (!binId || typeof dataManager === 'undefined') return { distanceEmptyCm: 200, distanceFullCm: 0 };
        const bin = dataManager.getBinById(binId);
        if (!bin) return { distanceEmptyCm: 200, distanceFullCm: 0 };
        const empty = bin.sensorDistanceEmptyCm != null ? Number(bin.sensorDistanceEmptyCm) : 200;
        const full = bin.sensorDistanceFullCm != null ? Number(bin.sensorDistanceFullCm) : 0;
        return { distanceEmptyCm: empty, distanceFullCm: full };
    }
    
    /**
     * Debounced sync to prevent flooding server during batch bin updates
     */
    _debouncedSync() {
        // Clear existing timer
        if (this._syncDebounceTimer) {
            clearTimeout(this._syncDebounceTimer);
        }
        
        // Set new timer - only sync once after all updates settle
        this._syncDebounceTimer = setTimeout(() => {
            if (typeof syncManager !== 'undefined' && syncManager.syncToServer) {
                console.log('💾 Debounced sync: Saving all bin updates to server');
                syncManager.syncToServer({ bins: dataManager.getBins() }, 'partial');
            }
            this._syncDebounceTimer = null;
        }, this._syncDebounceDelay);
    }
    
    /**
     * Initialize integration
     */
    async initialize() {
        try {
            // Load bin-sensor mappings from configuration
            await this.loadBinSensorMappings();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Start monitoring sensors
            await this.startMonitoringBinSensors();
            
            console.log('✅ Bin sensor integration ready');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize bin sensor integration:', error);
            return false;
        }
    }
    
    /**
     * Load bin-sensor mappings from configuration, bins (sensorIMEI), or sensors list (binId)
     */
    async loadBinSensorMappings() {
        try {
            this.binSensorMapping = {};
            this.sensorToBinMapping = {};

            if (typeof findyBinSensorConfig !== 'undefined' && findyBinSensorConfig.binMappings) {
                this.binSensorMapping = { ...findyBinSensorConfig.binMappings };
            }

            // From bins: bin.sensorIMEI
            if (typeof dataManager !== 'undefined') {
                const bins = dataManager.getBins();
                bins.forEach(bin => {
                    const imei = bin.sensorIMEI || (bin.hasSensor && bin.sensorId);
                    if (imei && bin.id) {
                        this.binSensorMapping[bin.id] = String(imei);
                    }
                });
            }

            // From sensors list: dataManager first, then API so we see server state (e.g. after another tab added sensor)
            let sensors = typeof dataManager !== 'undefined' && dataManager.getSensors ? dataManager.getSensors() : [];
            if (!Array.isArray(sensors) || sensors.length === 0) {
                try {
                    const res = await fetch('/api/sensors/list');
                    if (res.ok) {
                        const json = await res.json();
                        sensors = json.sensors || [];
                    }
                } catch (e) { /* ignore */ }
            }
            if (Array.isArray(sensors)) {
                sensors.forEach(s => {
                    if (s && s.imei && s.binId) {
                        this.binSensorMapping[s.binId] = String(s.imei);
                    }
                });
            }

            Object.keys(this.binSensorMapping).forEach(binId => {
                const imei = this.binSensorMapping[binId];
                this.sensorToBinMapping[imei] = binId;
            });

            console.log(`📋 Loaded ${Object.keys(this.binSensorMapping).length} bin-sensor mappings`);
        } catch (error) {
            console.error('Error loading bin-sensor mappings:', error);
        }
    }
    
    /**
     * Link a bin to a sensor
     */
    linkBinToSensor(binId, sensorIMEI) {
        this.binSensorMapping[binId] = sensorIMEI;
        this.sensorToBinMapping[sensorIMEI] = binId;
        
        console.log(`🔗 Linked bin ${binId} to sensor ${sensorIMEI}`);
        
        // Save to dataManager if available
        if (typeof dataManager !== 'undefined') {
            const bin = dataManager.getBinById(binId);
            if (bin) {
                bin.sensorIMEI = sensorIMEI;
                bin.hasSensor = true;
            }
        }
        
        // DEBOUNCED: Force refresh bins on map (prevent rapid refreshes)
        if (!this._mapRefreshTimeout) {
            this._mapRefreshTimeout = setTimeout(() => {
                if (typeof mapManager !== 'undefined' && mapManager.map) {
                    mapManager.loadBinsOnMap();
                }
                this._mapRefreshTimeout = null;
            }, 2000); // Wait 2 seconds before refreshing map
        }
    }
    
    /**
     * Unlink a bin from a sensor
     */
    unlinkBinSensor(binId) {
        const imei = this.binSensorMapping[binId];
        if (imei) {
            delete this.sensorToBinMapping[imei];
            delete this.binSensorMapping[binId];
            
            // Update dataManager
            if (typeof dataManager !== 'undefined') {
                const bin = dataManager.getBinById(binId);
                if (bin) {
                    delete bin.sensorIMEI;
                    bin.hasSensor = false;
                }
            }
            
            console.log(`🔓 Unlinked bin ${binId} from sensor ${imei}`);
        }
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for Findy sensor updates
        window.addEventListener('livetracking:update', (event) => {
            this.handleSensorUpdate(event.detail);
        });
        
        // Listen for bin additions
        window.addEventListener('bin:added', (event) => {
            const bin = event.detail;
            if (bin.sensorIMEI) {
                this.linkBinToSensor(bin.id, bin.sensorIMEI);
            }
        });
        
        console.log('✅ Bin sensor event listeners registered');
    }
    
    /**
     * Handle sensor update - ENHANCED to handle array responses
     * Includes debounce to prevent rapid duplicate updates
     */
    handleSensorUpdate(data) {
        try {
            if (!data || !data.imei) {
                return; // Silently ignore invalid data
            }
            
            const imei = data.imei;
            const binId = this.sensorToBinMapping[imei];
            
            // DEBOUNCE: Prevent rapid duplicate updates (within 2 seconds)
            const now = Date.now();
            if (!this._lastUpdateTime) this._lastUpdateTime = {};
            if (this._lastUpdateTime[imei] && (now - this._lastUpdateTime[imei]) < 2000) {
                return; // Skip duplicate update
            }
            this._lastUpdateTime[imei] = now;
            
            if (!binId) {
                console.log(`⚠️ Sensor ${imei} not linked to any bin`);
                return;
            }
            
            let deviceData = data.data;
            
            // Handle array response (Findy API sometimes returns arrays)
            if (Array.isArray(deviceData) && deviceData.length > 0) {
                // Logging removed for performance
                deviceData = deviceData[0];
            }
            
            // Extract sensor data with enhanced extraction (pass binId for distance→fill calibration)
            const sensorInfo = this.extractSensorData(deviceData, binId);
            
            // Add IMEI to sensorInfo for reference
            sensorInfo.imei = imei;
            
            // Store sensor data
            this.sensorData[imei] = {
                ...sensorInfo,
                lastUpdate: new Date().toISOString()
            };
            
            // Update bin with sensor data (this will update fill, temperature, battery)
            this.updateBinWithSensorData(binId, sensorInfo);
            
            // Update bin marker on map (this will refresh the popup with new data)
            this.updateBinMarkerOnMap(binId);
            
            // Force refresh the popup if it's currently open
            if (typeof mapManager !== 'undefined' && mapManager.map) {
                const marker = mapManager.markers?.bins?.[binId];
                if (marker && marker.isPopupOpen && marker.isPopupOpen()) {
                    // Popup is open, refresh its content
                    const updatedBin = dataManager.getBinById(binId);
                    if (updatedBin) {
                        const newPopupContent = mapManager.createBinPopup(updatedBin);
                        marker.setPopupContent(newPopupContent);
                        console.log(`🔄 Refreshed open popup for bin ${binId} with latest sensor data`);
                    }
                }
            }
            
            // Get bin again to check sensorData (bin variable is not in scope here)
            const updatedBin = dataManager.getBinById(binId);
            // Logging removed for performance
            
        } catch (error) {
            console.error('Error handling sensor update:', error);
        }
    }
    
    /**
     * Extract sensor data from Findy response - ENHANCED with comprehensive extraction.
     * @param {object} data - Findy API device/report data
     * @param {string} [binId] - Bin ID for distance→fill calibration (sensorDistanceEmptyCm, sensorDistanceFullCm)
     */
    extractSensorData(data, binId) {
        if (!data) return {};
        
        const sensorInfo = {
            operator: data.operator,
            lastReport: data.deviceInfo?.lastModTime || data.deviceInfo?.[0]?.lastModTime
        };
        
        // Extract location (GPS preferred, GSM fallback)
        // Findy API may return ingps/incell as object or array; keys may be lat/lon, latitude/longitude, or lng
        const readLatLng = (obj) => {
            if (!obj || typeof obj !== 'object') return null;
            const lat = parseFloat(obj.lat ?? obj.latitude);
            const lng = parseFloat(obj.lon ?? obj.lng ?? obj.longitude);
            if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
            return { lat, lng };
        };
        const fromIngps = (src) => {
            const o = Array.isArray(src) ? src[0] : src;
            const ll = readLatLng(o);
            if (!ll) return null;
            return { ...ll, type: 'GPS', satellites: o?.satellites, accuracy: o?.accuracy, speed: o?.speed };
        };
        const fromIncell = (src) => {
            const o = Array.isArray(src) ? src[0] : src;
            const ll = readLatLng(o);
            if (!ll) return null;
            return { ...ll, type: 'GSM', accuracy: o?.accuracy };
        };
        if (data.ingps) {
            const loc = fromIngps(data.ingps);
            if (loc) sensorInfo.location = loc;
        }
        if (!sensorInfo.location && data.incell) {
            const loc = fromIncell(data.incell);
            if (loc) sensorInfo.location = loc;
        }
        
        // ========== EXTRACT BATTERY ==========
        let battery = null;
        let batterySource = 'not found';
        
        // Check top-level battery (multiple formats)
        if (data.battery !== undefined && data.battery !== null && data.battery !== 'null') {
            const batValue = parseFloat(data.battery);
            if (!isNaN(batValue)) {
                battery = batValue;
                batterySource = 'data.battery (top-level)';
            }
        }
        // Check deviceInfo for battery (handle array)
        if (battery === null && data.deviceInfo) {
            const deviceInfo = Array.isArray(data.deviceInfo) ? data.deviceInfo[0] : data.deviceInfo;
            if (deviceInfo) {
                // Check multiple possible battery fields
                if (deviceInfo.battery !== undefined && deviceInfo.battery !== null && deviceInfo.battery !== 'null') {
                    const batValue = parseFloat(deviceInfo.battery);
                    if (!isNaN(batValue)) {
                        battery = batValue;
                        batterySource = 'deviceInfo.battery';
                    }
                } else if (deviceInfo.bat !== undefined && deviceInfo.bat !== null) {
                    const batValue = parseFloat(deviceInfo.bat);
                    if (!isNaN(batValue)) {
                        battery = batValue;
                        batterySource = 'deviceInfo.bat';
                    }
                } else if (deviceInfo.batteryLevel !== undefined && deviceInfo.batteryLevel !== null) {
                    const batValue = parseFloat(deviceInfo.batteryLevel);
                    if (!isNaN(batValue)) {
                        battery = batValue;
                        batterySource = 'deviceInfo.batteryLevel';
                    }
                }
            }
        }
        // Check passport for battery
        if (battery === null && data.passport) {
            const passport = Array.isArray(data.passport) ? data.passport[0] : data.passport;
            if (passport && passport.battery !== undefined && passport.battery !== null) {
                const batValue = parseFloat(passport.battery);
                if (!isNaN(batValue)) {
                    battery = batValue;
                    batterySource = 'passport.battery';
                }
            }
        }
        // Check report.measurement for battery
        else if (data.report && data.report.measurement) {
            const measurement = data.report.measurement;
            if (typeof measurement === 'object') {
                // Check direct keys
                if (measurement.battery !== undefined) {
                    battery = parseFloat(measurement.battery);
                    batterySource = 'measurement.battery';
                } else if (measurement.bat !== undefined) {
                    battery = parseFloat(measurement.bat);
                    batterySource = 'measurement.bat';
                }
                // Search nested dataType objects for battery
                else {
                    // Recursive search through nested measurement structure
                    const searchForBattery = (obj, path = '') => {
                        if (!obj || typeof obj !== 'object') return null;
                        
                        // Check if this object has a value and dataType
                        if (obj.value !== undefined && obj.value !== null && obj.dataType) {
                            const dataTypeName = (obj.dataType.name || '').toLowerCase();
                            const dataTypeUri = (obj.dataType.uri || '').toLowerCase();
                            const numValue = parseFloat(obj.value);
                            
                            if (!isNaN(numValue) && 
                                (dataTypeName.includes('battery') || dataTypeName.includes('bat') ||
                                 dataTypeUri.includes('battery') || dataTypeUri.includes('bat'))) {
                                return { value: numValue, source: `measurement${path}.value` };
                            }
                        }
                        
                        // Recursively search nested objects
                        for (const key of Object.keys(obj)) {
                            if (key === 'imei' || key === 'name') continue;
                            const nested = obj[key];
                            if (typeof nested === 'object' && nested !== null) {
                                const result = searchForBattery(nested, path + `[${key}]`);
                                if (result) return result;
                            }
                        }
                        return null;
                    };
                    
                    const batteryResult = searchForBattery(measurement);
                    if (batteryResult) {
                        battery = batteryResult.value;
                        batterySource = batteryResult.source;
                    }
                }
            }
        }
        
        sensorInfo.battery = battery !== null && !isNaN(battery) ? battery : null;
        // Logging removed for performance
        
        // ========== EXTRACT TEMPERATURE ==========
        let temperature = null;
        let temperatureSource = 'not found';
        
        // Check top-level temperature (multiple formats)
        if (data.temperature !== undefined && data.temperature !== null && data.temperature !== 'null') {
            const tempValue = parseFloat(data.temperature);
            if (!isNaN(tempValue)) {
                // Convert from Kelvin if > 200 (likely Kelvin), otherwise assume Celsius
                temperature = tempValue > 200 ? tempValue - 273.15 : tempValue;
                temperatureSource = 'data.temperature (top-level)';
            }
        }
        // Check deviceInfo for temperature
        if (temperature === null && data.deviceInfo) {
            const deviceInfo = Array.isArray(data.deviceInfo) ? data.deviceInfo[0] : data.deviceInfo;
            if (deviceInfo) {
                if (deviceInfo.temperature !== undefined && deviceInfo.temperature !== null && deviceInfo.temperature !== 'null') {
                    const tempValue = parseFloat(deviceInfo.temperature);
                    if (!isNaN(tempValue)) {
                        temperature = tempValue > 200 ? tempValue - 273.15 : tempValue;
                        temperatureSource = 'deviceInfo.temperature';
                    }
                } else if (deviceInfo.temp !== undefined && deviceInfo.temp !== null) {
                    const tempValue = parseFloat(deviceInfo.temp);
                    if (!isNaN(tempValue)) {
                        temperature = tempValue > 200 ? tempValue - 273.15 : tempValue;
                        temperatureSource = 'deviceInfo.temp';
                    }
                }
            }
        }
        // Check report.temperature
        if (temperature === null && data.report && data.report.temperature !== undefined && data.report.temperature !== null) {
            const tempValue = parseFloat(data.report.temperature);
            if (!isNaN(tempValue)) {
                temperature = tempValue > 200 ? tempValue - 273.15 : tempValue;
                temperatureSource = 'report.temperature';
            }
        }
        // Check report.measurement
        else if (data.report && data.report.measurement) {
            const measurement = data.report.measurement;
            if (typeof measurement === 'object') {
                // Check direct keys
                if (measurement.temp !== undefined) {
                    temperature = parseFloat(measurement.temp);
                    temperatureSource = 'measurement.temp';
                } else if (measurement.temperature !== undefined) {
                    temperature = parseFloat(measurement.temperature);
                    temperatureSource = 'measurement.temperature';
                }
                // Search nested dataType objects for temperature
                else {
                    // Recursive search through nested measurement structure
                    const searchForTemperature = (obj, path = '') => {
                        if (!obj || typeof obj !== 'object') return null;
                        
                        // Check if this object has a value and dataType
                        if (obj.value !== undefined && obj.value !== null && obj.dataType) {
                            const dataTypeName = (obj.dataType.name || '').toLowerCase();
                            const dataTypeUri = (obj.dataType.uri || '').toLowerCase();
                            const numValue = parseFloat(obj.value);
                            
                            if (!isNaN(numValue) && 
                                (dataTypeName.includes('temp') || dataTypeName.includes('temperature') ||
                                 dataTypeUri.includes('temp') || dataTypeUri.includes('temperature'))) {
                                return { value: numValue, source: `measurement${path}.value` };
                            }
                        }
                        
                        // Recursively search nested objects
                        for (const key of Object.keys(obj)) {
                            if (key === 'imei' || key === 'name') continue;
                            const nested = obj[key];
                            if (typeof nested === 'object' && nested !== null) {
                                const result = searchForTemperature(nested, path + `[${key}]`);
                                if (result) return result;
                            }
                        }
                        return null;
                    };
                    
                    const tempResult = searchForTemperature(measurement);
                    if (tempResult) {
                        temperature = tempResult.value;
                        temperatureSource = tempResult.source;
                    }
                }
            }
        }
        // Check deviceInfo for temperature
        else if (data.deviceInfo) {
            const deviceInfo = Array.isArray(data.deviceInfo) ? data.deviceInfo[0] : data.deviceInfo;
            if (deviceInfo && deviceInfo.temperature !== undefined) {
                temperature = parseFloat(deviceInfo.temperature);
                temperatureSource = 'deviceInfo.temperature';
            }
        }
        
        sensorInfo.temperature = temperature !== null && !isNaN(temperature) ? temperature : null;
        if (sensorInfo.temperature !== null) {
            // Logging removed for performance
        }
        
        // ========== EXTRACT FILL LEVEL ==========
        // Platform records fill as Distance (cm) under dataTypeID 488. Max distance = empty (0%), min = full (100%).
        let fillLevel = null;
        let fillLevelSource = 'not found';
        let distanceCm = null;
        
        const calibration = binId ? this.getCalibrationForBin(binId) : { distanceEmptyCm: 200, distanceFullCm: 0 };
        
        // Priority 0: Explicit Distance (dataTypeID 488 or name "Distance") in report.settings or report.measurement
        const findDistance488 = (arr) => {
            if (!Array.isArray(arr)) return null;
            for (const item of arr) {
                const dt = item.dataType || item.dataTypeID;
                let id = null;
                if (dt != null && typeof dt === 'object') { id = dt.datatypeID != null ? dt.datatypeID : dt.dataTypeID; }
                if (id == null && typeof item.datatypeID !== 'undefined') { id = item.datatypeID; }
                const name = (typeof dt === 'object' && dt && (dt.name || dt.dataTypeName)) ? (dt.name || dt.dataTypeName) : (item.name || '');
                const isDistance = id === 488 || id === '488' || String(name).toLowerCase() === 'distance';
                if (isDistance && item.value !== undefined && item.value !== null && item.value !== '') {
                    const v = parseFloat(item.value);
                    if (!isNaN(v) && v >= 0 && v < 10000) return v;
                }
            }
            return null;
        };
        const searchDistanceInObject = (obj, depth = 0) => {
            if (!obj || typeof obj !== 'object' || depth > 6) return null;
            if (obj.value !== undefined && obj.value !== null && obj.value !== '') {
                const dt = obj.dataType || {};
                const id = dt.datatypeID != null ? dt.datatypeID : (dt.dataTypeID != null ? dt.dataTypeID : obj.datatypeID);
                const name = (dt.name || '').toLowerCase();
                if (name.includes('battery') || name.includes('bat')) return null;
                const isDistance = id === 488 || id === '488' || name === 'distance';
                if (isDistance) {
                    const v = parseFloat(obj.value);
                    if (!isNaN(v) && v >= 0 && v < 10000) return v;
                }
            }
            for (const key of Object.keys(obj)) {
                if (key === 'imei' || key === 'name') continue;
                const val = obj[key];
                if (typeof val === 'object' && val !== null) {
                    const found = searchDistanceInObject(val, depth + 1);
                    if (found != null) return found;
                }
            }
            return null;
        };
        
        if (data.report) {
            var d488 = findDistance488(data.report.settings);
            distanceCm = d488 != null ? d488 : searchDistanceInObject(data.report.settings);
            if (distanceCm == null && data.report.measurement) {
                distanceCm = searchDistanceInObject(data.report.measurement);
            }
        }
        if (distanceCm != null) {
            fillLevel = this.distanceToFillPercent(distanceCm, calibration);
            fillLevelSource = `Distance (488) ${distanceCm}cm → ${fillLevel != null ? fillLevel.toFixed(1) : '?'}%`;
            sensorInfo.distanceCm = distanceCm;
        }
        
        // Check top-level fillLevel (only if we didn't get fill from Distance)
        if (fillLevel === null && data.fillLevel !== undefined && data.fillLevel !== null) {
            fillLevel = parseFloat(data.fillLevel);
            fillLevelSource = 'data.fillLevel (top-level)';
        }
        // Check report object for fill level
        else if (fillLevel === null && data.report) {
            if (data.report.fillLevel !== undefined) {
                fillLevel = parseFloat(data.report.fillLevel);
                fillLevelSource = 'report.fillLevel';
            } else if (data.report.measurement) {
                const measurement = data.report.measurement;
                if (typeof measurement === 'object') {
                    // Check direct keys first
                    if (measurement.fillLevel !== undefined) {
                        fillLevel = parseFloat(measurement.fillLevel);
                        fillLevelSource = 'measurement.fillLevel';
                    } else if (measurement.fill !== undefined) {
                        fillLevel = parseFloat(measurement.fill);
                        fillLevelSource = 'measurement.fill';
                    } else if (measurement.level !== undefined) {
                        fillLevel = parseFloat(measurement.level);
                        fillLevelSource = 'measurement.level';
                    }
                    // Search nested dataType objects for fill level (comprehensive recursive search)
                    else {
                        // Recursive function to search nested measurement objects
                        const searchForFillLevel = (obj, path = '', depth = 0) => {
                            if (!obj || typeof obj !== 'object' || depth > 5) return null;
                            
                            // Check if this object has a value and dataType (actual sensor reading)
                            if (obj.value !== undefined && obj.value !== null && obj.value !== 'null' && obj.dataType) {
                                const value = obj.value;
                                const dataType = obj.dataType;
                                const dataTypeName = (dataType.name || '').toLowerCase();
                                const dataTypeUri = (dataType.uri || '').toLowerCase();
                                const numValue = parseFloat(value);
                                
                                if (!isNaN(numValue)) {
                                    // Check if this is fill level data
                                    const isFillLevel = 
                                        dataTypeName.includes('fill') ||
                                        dataTypeName.includes('level') ||
                                        dataTypeName.includes('ultrasonic') ||
                                        dataTypeName.includes('distance') ||
                                        dataTypeName.includes('height') ||
                                        dataTypeName.includes('depth') ||
                                        dataTypeName.includes('measurement') ||
                                        dataTypeUri.includes('fill') ||
                                        dataTypeUri.includes('level') ||
                                        dataTypeUri.includes('ultrasonic') ||
                                        dataTypeUri.includes('distance') ||
                                        dataTypeUri.includes('measurement');
                                    
                                    // Priority 1: Name/URI suggests fill level AND value is 0-100 (percentage)
                                    if (isFillLevel && numValue >= 0 && numValue <= 100) {
                                        return { value: numValue, source: `measurement${path}.value`, confidence: 'high' };
                                    }
                                    // Priority 2: Value is 0-100 and has timestamp/reportID (actual sensor reading)
                                    else if (numValue >= 0 && numValue <= 100 && (obj.timestamp || obj.reportID) && 
                                             !dataTypeName.includes('battery') && !dataTypeName.includes('memory')) {
                                        return { value: numValue, source: `measurement${path}.value`, confidence: 'medium' };
                                    }
                                    // Priority 3: Distance/ultrasonic (cm) → fill %: max distance = empty (0%), min = full (100%)
                                    else if (isFillLevel && !dataTypeName.includes('battery') && numValue > 0 && numValue < 10000) {
                                        const calculatedFill = this.distanceToFillPercent(numValue, calibration);
                                        if (calculatedFill != null) {
                                            return { value: calculatedFill, source: `measurement${path}.value (${numValue}cm→${calculatedFill.toFixed(0)}%)`, confidence: 'high' };
                                        }
                                    }
                                }
                            }
                            
                            // Recursively search nested objects
                            for (const key of Object.keys(obj)) {
                                if (key === 'imei' || key === 'name') continue;
                                const nested = obj[key];
                                if (typeof nested === 'object' && nested !== null) {
                                    const result = searchForFillLevel(nested, path + `[${key}]`, depth + 1);
                                    if (result && result.confidence === 'high') {
                                        return result; // Return immediately for high confidence
                                    }
                                }
                            }
                            return null;
                        };
                        
                        // Search through all top-level dataType IDs
                        let bestMatch = null;
                        let bestConfidence = 'low';
                        
                        for (const dataTypeId of Object.keys(measurement)) {
                            if (dataTypeId === 'imei' || dataTypeId === 'name') continue;
                            const result = searchForFillLevel(measurement[dataTypeId], `[${dataTypeId}]`);
                            
                            if (result) {
                                if (result.confidence === 'high') {
                                    fillLevel = result.value;
                                    fillLevelSource = result.source;
                                    break; // Stop searching, we found a high-confidence match
                                } else if (!bestMatch || bestConfidence === 'low') {
                                    bestMatch = result;
                                    bestConfidence = result.confidence || 'medium';
                                }
                            }
                        }
                        
                        // Use best match if we didn't find a high-confidence match
                        if (fillLevel === null && bestMatch) {
                            fillLevel = bestMatch.value;
                            fillLevelSource = bestMatch.source;
                        }
                    }
                } else if (typeof measurement === 'number' && measurement >= 0 && measurement <= 100) {
                    fillLevel = measurement;
                    fillLevelSource = 'measurement (direct number)';
                }
            }
        }
        
        sensorInfo.fillLevel = fillLevel !== null && !isNaN(fillLevel) ? Math.min(100, Math.max(0, fillLevel)) : null;
        if (sensorInfo.fillLevel !== null) {
            console.log(`📊 Fill level extracted: ${sensorInfo.fillLevel}% (source: ${fillLevelSource})`);
        }
        
        // Extract signal strength
        if (data.incell) {
            sensorInfo.signal = -70; // Good signal if GSM data available
        } else {
            sensorInfo.signal = -75; // Default
        }
        
        // Log extracted values for debugging
        console.log(`📊 Extracted sensor data summary:`, {
            battery: sensorInfo.battery !== null ? `${sensorInfo.battery}%` : 'N/A',
            temperature: sensorInfo.temperature !== null ? `${sensorInfo.temperature}°C` : 'N/A',
            fillLevel: sensorInfo.fillLevel !== null ? `${sensorInfo.fillLevel}%` : 'N/A',
            hasLocation: !!sensorInfo.location,
            operator: sensorInfo.operator || 'N/A'
        });
        
        // Validate extracted data
        if (sensorInfo.battery !== null && (sensorInfo.battery < 0 || sensorInfo.battery > 100)) {
            console.warn(`⚠️ Invalid battery value: ${sensorInfo.battery}%, clamping to 0-100`);
            sensorInfo.battery = Math.max(0, Math.min(100, sensorInfo.battery));
        }
        
        if (sensorInfo.temperature !== null && (sensorInfo.temperature < -50 || sensorInfo.temperature > 100)) {
            console.warn(`⚠️ Invalid temperature value: ${sensorInfo.temperature}°C, may be incorrect`);
        }
        
        if (sensorInfo.fillLevel !== null && (sensorInfo.fillLevel < 0 || sensorInfo.fillLevel > 100)) {
            console.warn(`⚠️ Invalid fill level value: ${sensorInfo.fillLevel}%, clamping to 0-100`);
            sensorInfo.fillLevel = Math.max(0, Math.min(100, sensorInfo.fillLevel));
        }
        
        return sensorInfo;
    }
    
    /**
     * Update bin with sensor data - ENHANCED to update all sensor properties
     */
    updateBinWithSensorData(binId, sensorInfo) {
        try {
            if (typeof dataManager === 'undefined') return;
            
            const bin = dataManager.getBinById(binId);
            if (!bin) {
                console.warn(`⚠️ Bin ${binId} not found when updating sensor data`);
                return;
            }
            
            // Update bin properties with sensor data
            bin.sensorData = sensorInfo;
            bin.hasSensor = true;
            bin.sensorIMEI = sensorInfo.imei || bin.sensorIMEI;
            
            // Update location if sensor provides it (so displayed location matches new position, not old e.g. "Barwa Madinatna")
            if (sensorInfo.location) {
                var lat = sensorInfo.location.lat;
                var lng = sensorInfo.location.lng;
                bin.lat = lat;
                bin.lng = lng;
                var coordLabel = (typeof lat === 'number' && typeof lng === 'number') ? (lat.toFixed(4) + ', ' + lng.toFixed(4)) : 'GPS (sensor)';
                var newAddress = sensorInfo.location.address || sensorInfo.location.placeName || sensorInfo.location.name || coordLabel;
                if (!bin.location || typeof bin.location === 'string') {
                    bin.location = {};
                }
                if (typeof bin.location === 'object' && bin.location !== null) {
                    bin.location.lat = lat;
                    bin.location.lng = lng;
                    bin.location.address = newAddress;
                }
                bin.locationName = newAddress;
            }
            
            // Update fill level if sensor provides it (store rounded to 1 decimal so no long decimals anywhere)
            if (sensorInfo.fillLevel !== null && sensorInfo.fillLevel !== undefined) {
                const fillValue = parseFloat(sensorInfo.fillLevel);
                // Validate fill level (0-100%)
                if (!isNaN(fillValue) && fillValue >= 0 && fillValue <= 100) {
                    const fillLevel = Math.round(Math.min(100, Math.max(0, fillValue)) * 10) / 10; // Clamp and round to 1 decimal
                    bin.fillLevel = fillLevel;
                    bin.fill = fillLevel; // Also update bin.fill for compatibility
                    // Also store in sensorData for popup display
                    if (!bin.sensorData) bin.sensorData = {};
                    bin.sensorData.fillLevel = fillLevel;
                    // Logging removed for performance
                } else {
                    console.warn(`⚠️ Invalid fill level value for bin ${binId}: ${fillValue}% (expected 0-100)`);
                }
            }
            
            // Update temperature if sensor provides it - ensure accurate value
            if (sensorInfo.temperature !== null && sensorInfo.temperature !== undefined) {
                const tempValue = parseFloat(sensorInfo.temperature);
                // Validate temperature (reasonable range: -50 to 100°C)
                if (!isNaN(tempValue) && tempValue >= -50 && tempValue <= 100) {
                    // Store temperature in both locations for compatibility
                    bin.temperature = tempValue;
                    // Also store in sensorData for popup display (this is the primary source)
                    if (!bin.sensorData) bin.sensorData = {};
                    bin.sensorData.temperature = tempValue;
                    console.log(`🌡️ Updated bin ${binId} temperature: ${tempValue}°C (from sensor)`);
                } else {
                    console.warn(`⚠️ Invalid temperature value for bin ${binId}: ${tempValue}°C (out of range -50 to 100)`);
                }
            } else {
                // If temperature not found, log for debugging
                // Logging removed for performance
            }
            
            // Update battery if sensor provides it - ensure accurate value
            if (sensorInfo.battery !== null && sensorInfo.battery !== undefined) {
                const batteryValue = parseFloat(sensorInfo.battery);
                // Validate battery value (0-100%)
                if (!isNaN(batteryValue) && batteryValue >= 0 && batteryValue <= 100) {
                    // Clamp to valid range (extra safety)
                    const clampedBattery = Math.max(0, Math.min(100, batteryValue));
                    bin.batteryLevel = clampedBattery;
                    // Also store in sensorData for popup display (this is the primary source)
                    if (!bin.sensorData) bin.sensorData = {};
                    bin.sensorData.battery = clampedBattery;
                    // Logging removed for performance
                } else {
                    console.warn(`⚠️ Invalid battery value for bin ${binId}: ${batteryValue}% (expected 0-100)`);
                }
            } else {
                // If battery not found, log for debugging
                // Logging removed for performance
            }
            
            // Update signal strength
            if (sensorInfo.signal !== undefined) {
                bin.signalStrength = sensorInfo.signal;
                if (!bin.sensorData) bin.sensorData = {};
                bin.sensorData.signal = bin.signalStrength;
            }
            
            // Update operator
            if (sensorInfo.operator) {
                if (!bin.sensorData) bin.sensorData = {};
                bin.sensorData.operator = sensorInfo.operator;
            }
            
            // Update last sensor update time
            bin.lastSensorUpdate = new Date().toISOString();
            bin.lastUpdate = new Date().toISOString();
            
            // Save bin update to dataManager - ensure all sensor data is persisted
            const updates = {
                fill: bin.fill,
                fillLevel: bin.fillLevel,
                sensorData: bin.sensorData, // This contains all sensor data including temperature and battery
                hasSensor: true,
                lastSensorUpdate: bin.lastSensorUpdate,
                sensorIMEI: bin.sensorIMEI || sensorInfo.imei
            };
            
            // Always include temperature and battery if they exist in sensorData (even if null, to clear old values)
            if (bin.sensorData && bin.sensorData.temperature !== undefined) {
                updates.temperature = bin.sensorData.temperature;
            } else if (bin.temperature !== undefined && bin.temperature !== null) {
                updates.temperature = bin.temperature;
            }
            
            if (bin.sensorData && bin.sensorData.battery !== undefined) {
                updates.batteryLevel = bin.sensorData.battery;
            } else if (bin.batteryLevel !== undefined && bin.batteryLevel !== null) {
                updates.batteryLevel = bin.batteryLevel;
            }
            
            // Also ensure fillLevel is in sensorData for consistency
            if (bin.sensorData && bin.fillLevel !== undefined) {
                bin.sensorData.fillLevel = bin.fillLevel;
                updates.sensorData = bin.sensorData;
            }
            
            console.log(`💾 Saving bin ${binId} updates:`, {
                fill: updates.fill,
                fillLevel: updates.fillLevel,
                temperature: updates.temperature,
                battery: updates.batteryLevel,
                hasSensorData: !!updates.sensorData
            });
            
            dataManager.updateBin(binId, updates);
            
            // Also save to server to persist across sessions
            // FIXED: Use debounced sync to prevent flooding during batch updates
            if (typeof syncManager !== 'undefined' && syncManager.syncToServer) {
                this._debouncedSync();
            }
            
            // Trigger bin update event
            window.dispatchEvent(new CustomEvent('bin:sensor-updated', {
                detail: { binId, sensorInfo }
            }));
            
            // Logging removed for performance
            
        } catch (error) {
            console.error('Error updating bin with sensor data:', error);
        }
    }
    
    /**
     * Update bin marker on map - ENHANCED to refresh popup with latest sensor data
     */
    updateBinMarkerOnMap(binId) {
        try {
            if (typeof mapManager === 'undefined' || !mapManager.map) return;
            
            const bin = typeof dataManager !== 'undefined' 
                ? dataManager.getBinById(binId) 
                : null;
            
            if (!bin) {
                console.warn(`⚠️ Bin ${binId} not found when updating marker`);
                return;
            }
            
            // Check if marker exists
            const existingMarker = mapManager.markers.bins[binId];
            
            if (existingMarker) {
                // Update marker position if location changed
                if (bin.lat && bin.lng) {
                    existingMarker.setLatLng([bin.lat, bin.lng]);
                }
                // World-class: update the marker icon (fill % circle) so it shows correct % immediately
                if (typeof mapManager.updateBinMarkerIcon === 'function') {
                    mapManager.updateBinMarkerIcon(binId);
                }
                // CRITICAL FIX: Only update popup content if popup is NOT currently open
                const isPopupOpen = existingMarker.isPopupOpen && existingMarker.isPopupOpen();
                if (!isPopupOpen) {
                    const popupContent = typeof mapManager.createBinPopup === 'function' 
                        ? mapManager.createBinPopup(bin)
                        : this.createEnhancedBinPopup(bin);
                    existingMarker.setPopupContent(popupContent);
                }
                
            } else {
                // Create new marker when we have coordinates (sensor or stored bin lat/lng)
                const hasLocation = (bin.location && bin.location.lat != null && bin.location.lng != null) ||
                    (bin.lat != null && bin.lng != null);
                if (hasLocation) this.createBinMarkerWithSensor(bin);
            }
            
        } catch (error) {
            console.error('Error updating bin marker:', error);
        }
    }
    
    /**
     * Create bin marker with sensor data
     */
    createBinMarkerWithSensor(bin) {
        try {
            if (!mapManager || !mapManager.map) return;
            
            // Remove existing marker if it exists to prevent duplicates
            if (mapManager.markers.bins && mapManager.markers.bins[bin.id]) {
                const existingMarker = mapManager.markers.bins[bin.id];
                if (mapManager.layers.bins && mapManager.layers.bins.hasLayer(existingMarker)) {
                    mapManager.layers.bins.removeLayer(existingMarker);
                }
                if (mapManager.map && mapManager.map.hasLayer(existingMarker)) {
                    mapManager.map.removeLayer(existingMarker);
                }
                delete mapManager.markers.bins[bin.id];
            }
            
            const lat = bin.location?.lat ?? bin.lat;
            const lng = bin.location?.lng ?? bin.lng;
            if (lat == null || lng == null || isNaN(parseFloat(lat)) || isNaN(parseFloat(lng))) {
                console.warn(`⚠️ Bin ${bin.id} missing location data (sensor and stored bin have no lat/lng)`);
                return;
            }
            const location = { lat: parseFloat(lat), lng: parseFloat(lng) };
            
            // Create marker icon based on fill level and sensor status
            const icon = this.createSensorBinIcon(bin);
            
            // Create marker
            const marker = L.marker([location.lat, location.lng], {
                icon: L.divIcon({
                    className: 'sensor-bin-marker',
                    html: icon,
                    iconSize: [40, 40],
                    iconAnchor: [20, 40],
                    popupAnchor: [0, -40]
                }),
                title: bin.name || `Bin ${bin.id}`
            });
            
            // Create popup
            const popupContent = this.createEnhancedBinPopup(bin);
            marker.bindPopup(popupContent);
            
            // Add to map layer if available, otherwise directly to map
            if (mapManager.layers && mapManager.layers.bins) {
                marker.addTo(mapManager.layers.bins);
            } else {
                marker.addTo(mapManager.map);
            }
            
            // Store marker reference
            if (!mapManager.markers.bins) {
                mapManager.markers.bins = {};
            }
            mapManager.markers.bins[bin.id] = marker;
            
            console.log(`✅ Created sensor-enabled bin marker for ${bin.id}`);
            
        } catch (error) {
            console.error('Error creating bin marker with sensor:', error);
        }
    }
    
    /**
     * Create sensor-enabled bin icon
     */
    createSensorBinIcon(bin) {
        const fillLevel = bin.fillLevel || 0;
        const hasSensor = bin.hasSensor || bin.sensorIMEI;
        const battery = bin.sensorData?.battery;
        
        // Determine color based on fill level
        let color = '#10b981'; // Green
        if (fillLevel >= 80) color = '#ef4444'; // Red
        else if (fillLevel >= 60) color = '#f59e0b'; // Orange
        else if (fillLevel >= 40) color = '#fbbf24'; // Yellow
        
        // Add battery indicator if sensor active
        let batteryIndicator = '';
        if (hasSensor && battery !== undefined) {
            const batteryColor = battery > 60 ? '#10b981' : battery > 30 ? '#f59e0b' : '#ef4444';
            batteryIndicator = `
                <div style="
                    position: absolute;
                    top: -5px;
                    right: -5px;
                    background: ${batteryColor};
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    border: 2px solid white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                " title="Battery: ${battery}%"></div>
            `;
        }
        
        // Sensor indicator
        const sensorBadge = hasSensor ? `
            <div style="
                position: absolute;
                top: -8px;
                left: -8px;
                background: #3b82f6;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 2px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            ">
                <i class="fas fa-satellite-dish" style="color: white; font-size: 8px;"></i>
            </div>
        ` : '';
        
        return `
            <div style="position: relative; width: 40px; height: 40px;">
                ${sensorBadge}
                <div style="
                    background: ${color};
                    width: 32px;
                    height: 32px;
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.3);
                    border: 3px solid white;
                    position: absolute;
                    top: 4px;
                    left: 4px;
                ">
                    <i class="fas fa-trash-alt" style="color: white; font-size: 16px;"></i>
                </div>
                ${batteryIndicator}
            </div>
        `;
    }
    
    /**
     * Create enhanced bin popup with sensor data
     */
    createEnhancedBinPopup(bin) {
        const fillLevel = bin.fillLevel || 0;
        const fillDisplay = Math.round(fillLevel * 10) / 10; // 1 decimal for popup (no long decimals)
        const sensor = bin.sensorData;
        const imei = bin.sensorIMEI;
        
        let sensorSection = '';
        
        if (sensor && imei) {
            sensorSection = `
                <div style="margin-top: 1rem; padding-top: 1rem; border-top: 2px solid #e2e8f0;">
                    <h4 style="margin: 0 0 0.5rem 0; color: #3b82f6; font-size: 0.9rem;">
                        <i class="fas fa-satellite-dish"></i> Sensor Data
                    </h4>
                    <div style="font-size: 0.85rem;">
                        ${sensor.battery ? `
                            <div style="margin: 0.25rem 0;">
                                <strong>🔋 Battery:</strong> ${sensor.battery}%
                            </div>
                        ` : ''}
                        ${sensor.operator ? `
                            <div style="margin: 0.25rem 0;">
                                <strong>📡 Operator:</strong> ${sensor.operator}
                            </div>
                        ` : ''}
                        ${sensor.location ? `
                            <div style="margin: 0.25rem 0;">
                                <strong>📍 Type:</strong> ${sensor.location.type}
                                ${sensor.location.satellites ? `(${sensor.location.satellites} sats)` : ''}
                            </div>
                            <div style="margin: 0.25rem 0; font-size: 0.75rem; color: #64748b;">
                                ${sensor.location.lat.toFixed(6)}, ${sensor.location.lng.toFixed(6)}
                            </div>
                        ` : ''}
                        ${sensor.lastReport ? `
                            <div style="margin: 0.25rem 0; font-size: 0.75rem; color: #64748b;">
                                Last: ${this.formatTimestamp(sensor.lastReport)}
                            </div>
                        ` : ''}
                    </div>
                    <div style="margin-top: 0.5rem; font-size: 0.7rem; color: #94a3b8;">
                        IMEI: ${imei}
                    </div>
                </div>
            `;
        }
        
        return `
            <div style="min-width: 250px;">
                <h3 style="margin: 0 0 0.5rem 0; color: #1e40af; font-size: 1.1rem;">
                    <i class="fas fa-trash-alt"></i> ${bin.name || `Bin ${bin.id}`}
                </h3>
                
                <div style="font-size: 0.9rem;">
                    <div style="margin: 0.5rem 0;">
                        <strong>Fill Level:</strong> ${fillDisplay}%
                        <div style="
                            background: #e2e8f0;
                            height: 8px;
                            border-radius: 4px;
                            margin-top: 0.25rem;
                            overflow: hidden;
                        ">
                            <div style="
                                background: ${this.getFillLevelColor(fillLevel)};
                                height: 100%;
                                width: ${fillLevel}%;
                                transition: width 0.3s;
                            "></div>
                        </div>
                    </div>
                    
                    ${bin.type ? `
                        <div style="margin: 0.25rem 0;">
                            <strong>Type:</strong> ${bin.type}
                        </div>
                    ` : ''}
                    
                    ${bin.address ? `
                        <div style="margin: 0.25rem 0;">
                            <strong>📍 Location:</strong> ${bin.address}
                        </div>
                    ` : ''}
                </div>
                
                ${sensorSection}
                
                <div style="margin-top: 1rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    <button onclick="showBinDetails('${bin.id}')" 
                            style="flex: 1; background: #3b82f6; color: white; border: none; padding: 0.5rem; border-radius: 4px; cursor: pointer; font-size: 0.85rem;">
                        <i class="fas fa-info-circle"></i> Details
                    </button>
                    ${imei ? `
                        <button onclick="findyBinSensorIntegration.refreshBinSensor('${bin.id}')" 
                                style="flex: 1; background: #10b981; color: white; border: none; padding: 0.5rem; border-radius: 4px; cursor: pointer; font-size: 0.85rem;">
                            <i class="fas fa-sync-alt"></i> Refresh
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    /**
     * Get fill level color
     */
    getFillLevelColor(fillLevel) {
        if (fillLevel >= 80) return '#ef4444';
        if (fillLevel >= 60) return '#f59e0b';
        if (fillLevel >= 40) return '#fbbf24';
        return '#10b981';
    }
    
    /**
     * Format timestamp
     */
    formatTimestamp(timestamp) {
        if (!timestamp) return 'N/A';
        
        try {
            const date = new Date(timestamp);
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            
            if (diffMins < 1) return 'Just now';
            if (diffMins < 60) return `${diffMins}m ago`;
            
            const diffHours = Math.floor(diffMins / 60);
            if (diffHours < 24) return `${diffHours}h ago`;
            
            const diffDays = Math.floor(diffHours / 24);
            return `${diffDays}d ago`;
        } catch (error) {
            return 'N/A';
        }
    }
    
    /**
     * Start monitoring bin sensors
     */
    async startMonitoringBinSensors() {
        try {
            // Start tracking all bins with sensors
            for (const binId in this.binSensorMapping) {
                const imei = this.binSensorMapping[binId];
                await this.startMonitoringBinSensor(binId, imei);
            }
            
            console.log(`✅ Started monitoring ${Object.keys(this.binSensorMapping).length} bin sensors`);
            
        } catch (error) {
            console.error('Error starting bin sensor monitoring:', error);
        }
    }
    
    /**
     * Start monitoring specific bin sensor
     * OPTIMIZED: Rely on server polling (every 60s) instead of per-bin frontend polling
     * This dramatically reduces API calls when there are many bins
     */
    async startMonitoringBinSensor(binId, imei) {
        try {
            // Initialize error tracking for this sensor
            if (!this.sensorErrorCounts) {
                this.sensorErrorCounts = {};
            }
            this.sensorErrorCounts[binId] = 0;
            
            // REMOVED: Per-bin interval polling that was causing excessive API calls
            // The server already polls all sensors every 60 seconds and broadcasts updates via WebSocket
            // Frontend should listen for WebSocket 'sensor_update' and 'bin_fill_update' events
            
            // Only get initial sensor data if we don't have any cached data
            const bin = typeof dataManager !== 'undefined' ? dataManager.getBinById(binId) : null;
            if (bin && (!bin.sensorData || !bin.sensorData.lastUpdate)) {
                // Initial data fetch only if no cached data exists
                await this.refreshBinSensor(binId);
            }
            
            // Setup WebSocket listener for this bin if not already done
            if (!this._wsListenersSetup) {
                this.setupWebSocketListeners();
            }
            
            console.log(`✅ Started monitoring bin ${binId} with sensor ${imei} (WebSocket-based)`);
            
            // Force map refresh to show the bin (only once on initial setup)
            setTimeout(() => {
                if (typeof mapManager !== 'undefined' && mapManager.map) {
                    mapManager.loadBinsOnMap();
                }
            }, 1000);
            
        } catch (error) {
            console.error(`Error starting monitoring for bin ${binId}:`, error);
        }
    }
    
    /**
     * Setup WebSocket listeners for sensor updates
     * Called once to handle all sensor updates from server
     */
    setupWebSocketListeners() {
        if (this._wsListenersSetup) return;
        
        // Listen for WebSocket sensor update events
        window.addEventListener('sensor_update', (event) => {
            const data = event.detail;
            if (data && data.imei) {
                const binId = this.sensorToBinMapping[data.imei];
                if (binId) {
                    console.log(`📡 WebSocket sensor update for bin ${binId}:`, data);
                    this.handleSensorUpdate(data);
                }
            }
        });
        
        // Listen for bin fill update events
        window.addEventListener('bin_fill_update', (event) => {
            const data = event.detail;
            if (data && data.binId) {
                console.log(`📦 WebSocket bin update for ${data.binId}:`, data);
                this.updateBinMarkerOnMap(data.binId);
            }
        });
        
        this._wsListenersSetup = true;
        console.log('✅ WebSocket listeners setup for sensor updates');
    }
    
    /**
     * Refresh bin sensor data - fetches latest data from Findy API and updates bin
     * ENHANCED to request all data types for comprehensive sensor readings
     */
    async refreshBinSensor(binId) {
        try {
            const imei = this.binSensorMapping[binId];
            if (!imei) {
                console.warn(`⚠️ No sensor linked to bin ${binId}`);
                return;
            }
            
            console.log(`🔄 Refreshing sensor data for bin ${binId} (IMEI: ${imei})...`);
            
            // Ensure findyClient is available
            const client = window.findyClient || (typeof findyClient !== 'undefined' ? findyClient : null);
            if (!client) {
                console.warn(`⚠️ FindyClient not available, skipping refresh for bin ${binId}`);
                return;
            }
            
            // Request all data types to get comprehensive sensor readings
            // Findy API supports requesting specific data types, but requesting all gives us everything
            let result;
            try {
                result = await client.getDevice(imei);
            } catch (fetchError) {
                console.error(`❌ Exception fetching device ${imei}:`, fetchError);
                result = { success: false, error: fetchError.message };
            }
            
            // Debug: Log the full result to understand what we're getting
            console.log(`📦 Findy API result for ${imei}:`, {
                success: result?.success,
                hasData: !!result?.data,
                dataType: result?.data ? (Array.isArray(result.data) ? 'Array' : typeof result.data) : 'null',
                dataLength: Array.isArray(result?.data) ? result.data.length : 'N/A',
                error: result?.error,
                cached: result?.cached
            });
            
            if (result && result.success && result.data) {
                let deviceData = result.data;
                
                // Handle array response
                if (Array.isArray(deviceData) && deviceData.length > 0) {
                    deviceData = deviceData[0];
                }
                
                // Log raw data structure for debugging
                console.log(`📊 Raw sensor data structure for ${imei}:`, {
                    hasDeviceInfo: !!deviceData.deviceInfo,
                    hasReport: !!deviceData.report,
                    hasPassport: !!deviceData.passport,
                    hasIngps: !!deviceData.ingps,
                    topLevelKeys: Object.keys(deviceData).slice(0, 10),
                    battery: deviceData.battery,
                    temperature: deviceData.temperature,
                    fillLevel: deviceData.fillLevel
                });
                
                // Process and update bin with fresh data
                this.handleSensorUpdate({
                    imei: imei,
                    data: deviceData
                });
                
                // Verify data was updated and log what we got
                if (typeof dataManager !== 'undefined') {
                    const bin = dataManager.getBinById(binId);
                    if (bin) {
                        const sensorData = bin.sensorData || {};
                        console.log(`✅ Sensor data refreshed for bin ${binId}:`, {
                            fill: bin.fill || bin.fillLevel || sensorData.fillLevel || 'N/A',
                            fillSource: bin.fillLevel ? 'bin.fillLevel' : (sensorData.fillLevel ? 'sensorData.fillLevel' : 'not found'),
                            temperature: bin.temperature || sensorData.temperature || 'N/A',
                            tempSource: bin.temperature ? 'bin.temperature' : (sensorData.temperature ? 'sensorData.temperature' : 'not found'),
                            battery: bin.batteryLevel || sensorData.battery || 'N/A',
                            batterySource: bin.batteryLevel ? 'bin.batteryLevel' : (sensorData.battery ? 'sensorData.battery' : 'not found'),
                            sensorDataKeys: Object.keys(sensorData),
                            hasSensorData: !!bin.sensorData
                        });
                        
                        // If values are still missing, log warning at most once per bin per 5 min (avoid console spam)
                        const missingValues = [];
                        if (!bin.fill && !bin.fillLevel && !sensorData.fillLevel) missingValues.push('fill level');
                        if (!bin.temperature && !sensorData.temperature) missingValues.push('temperature');
                        if (!bin.batteryLevel && !sensorData.battery) missingValues.push('battery');
                        
                        if (missingValues.length > 0) {
                            const now = Date.now();
                            const last = this._missingValueWarnedAt[binId] || 0;
                            if (now - last > 300000) { // 5 minutes
                                this._missingValueWarnedAt[binId] = now;
                                console.warn(`⚠️ Missing sensor values for bin ${binId}: ${missingValues.join(', ')}. Findy API may use different field locations.`);
                            }
                        } else {
                            console.log(`✅ All sensor values present for bin ${binId}`);
                        }
                        
                        // Force map marker update to refresh popup
                        this.updateBinMarkerOnMap(binId);
                    }
                }
                // Reset error count on success
                if (this.sensorErrorCounts) {
                    this.sensorErrorCounts[binId] = 0;
                }
            } else {
                // Track errors to pause polling for invalid devices
                if (this.sensorErrorCounts) {
                    this.sensorErrorCounts[binId] = (this.sensorErrorCounts[binId] || 0) + 1;
                }
                // Only log warning on first few errors to reduce console spam
                if (!this.sensorErrorCounts || this.sensorErrorCounts[binId] <= 3) {
                    console.warn(`⚠️ Failed to fetch sensor data for bin ${binId}:`, result.error || 'Unknown error');
                }
            }
            
        } catch (error) {
            // Track errors
            if (this.sensorErrorCounts) {
                this.sensorErrorCounts[binId] = (this.sensorErrorCounts[binId] || 0) + 1;
            }
            console.error(`❌ Error refreshing sensor for bin ${binId}:`, error);
        }
    }
    
    /**
     * Alias for refreshBinSensor for compatibility
     */
    async refreshSensorForBin(binId) {
        return this.refreshBinSensor(binId);
    }
    
    /**
     * Stop monitoring all bin sensors
     */
    async stopMonitoringAll() {
        // Clear all intervals
        for (const binId in this.updateIntervals) {
            clearInterval(this.updateIntervals[binId]);
        }
        this.updateIntervals = {};
        
        // Stop all live tracking
        for (const imei in this.sensorToBinMapping) {
            try {
                await findyClient.stopLiveTracking(imei);
            } catch (error) {
                console.error(`Error stopping tracking for ${imei}:`, error);
            }
        }
        
        console.log('🛑 Stopped monitoring all bin sensors');
    }
    
    /**
     * Get bin by sensor IMEI
     */
    getBinBySensor(imei) {
        const binId = this.sensorToBinMapping[imei];
        if (!binId) return null;
        
        return typeof dataManager !== 'undefined' 
            ? dataManager.getBinById(binId)
            : null;
    }
    
    /**
     * Get sensor by bin ID
     */
    getSensorByBin(binId) {
        return this.binSensorMapping[binId];
    }
}

// Initialize global instance
const findyBinSensorIntegration = new FindyBinSensorIntegration();

// Expose to window
window.findyBinSensorIntegration = findyBinSensorIntegration;

// Auto-initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Wait for dependencies
    setTimeout(async () => {
        try {
            await findyBinSensorIntegration.initialize();
            console.log('✅ Bin sensor integration ready');
        } catch (error) {
            console.error('Failed to initialize bin sensor integration:', error);
        }
    }, 3000);
});

console.log('✅ Findy Bin Sensor Integration loaded successfully');

