// sensor-bin-map-bridge.js - Bridge between sensor data, bins, and map visualization

class SensorBinMapBridge {
    constructor() {
        this.sensors = new Map(); // IMEI -> sensor data
        this.binToSensor = new Map(); // binId -> IMEI
        this.sensorToBin = new Map(); // IMEI -> binId
        this.updateCallbacks = [];
        this.initialized = false;
        // Logging reduced for performance
    }

    /**
     * Initialize bridge with existing data
     */
    async initialize() {
        try {
            // Load sensors from sensorManagementAdmin if available
            if (typeof sensorManagementAdmin !== 'undefined' && sensorManagementAdmin.loadSensors) {
                try {
                    const sensorList = await sensorManagementAdmin.loadSensors();
                    // Handle both array and object responses
                    const sensors = Array.isArray(sensorList) ? sensorList : 
                                   (sensorList?.sensors || sensorList?.data || []);
                    if (Array.isArray(sensors)) {
                        for (const sensor of sensors) {
                            if (sensor && sensor.imei) {
                                this.sensors.set(sensor.imei, sensor);
                                if (sensor.binId) {
                                    this.linkSensorToBin(sensor.imei, sensor.binId);
                                }
                            }
                        }
                    }
                } catch (sensorError) {
                    // Silently handle sensor loading errors
                }
            }

            // Load bin-sensor mappings from dataManager
            if (typeof dataManager !== 'undefined' && dataManager.getBins) {
                const bins = dataManager.getBins() || [];
                for (const bin of bins) {
                    if (bin && bin.sensorIMEI) {
                        this.linkSensorToBin(bin.sensorIMEI, bin.id);
                    }
                }
            }

            this.initialized = true;
            return { success: true };
        } catch (error) {
            this.initialized = true; // Mark as initialized even on error to prevent retry loops
            return { success: false, error: error.message };
        }
    }

    /**
     * Link a sensor to a bin
     */
    linkSensorToBin(imei, binId) {
        if (!imei || !binId) {
            console.warn('⚠️ Cannot link: missing IMEI or binId');
            return { success: false, error: 'Missing IMEI or binId' };
        }

        this.sensorToBin.set(imei, binId);
        this.binToSensor.set(binId, imei);
        
        console.log(`🔗 Linked sensor ${imei} to bin ${binId}`);
        
        return { success: true, message: `Linked ${imei} to ${binId}` };
    }

    /**
     * Unlink a sensor from a bin
     */
    unlinkSensorFromBin(imei) {
        const binId = this.sensorToBin.get(imei);
        if (binId) {
            this.sensorToBin.delete(imei);
            this.binToSensor.delete(binId);
            console.log(`🔓 Unlinked sensor ${imei} from bin ${binId}`);
            return { success: true, message: `Unlinked ${imei} from ${binId}` };
        }
        return { success: false, message: 'Sensor not linked to any bin' };
    }

    /**
     * Update bin from sensor data
     */
    async updateBinFromSensor(imei, sensorData) {
        try {
            console.log(`📊 Updating bin from sensor ${imei}`);

            // Get linked bin - try cached mapping first
            let binId = this.sensorToBin.get(imei);
            
            // If not found, try to get from findy-bin-sensor-integration
            if (!binId && typeof findyBinSensorIntegration !== 'undefined') {
                binId = findyBinSensorIntegration.sensorToBinMapping?.[imei];
                if (binId) {
                    // Cache the mapping for future use
                    this.linkSensorToBin(imei, binId);
                    console.log(`🔗 Loaded mapping from findy-bin-sensor-integration: ${imei} -> ${binId}`);
                }
            }
            
            // If still not found, try window.findyBinSensorIntegration
            if (!binId && window.findyBinSensorIntegration) {
                binId = window.findyBinSensorIntegration.sensorToBinMapping?.[imei];
                if (binId) {
                    this.linkSensorToBin(imei, binId);
                    console.log(`🔗 Loaded mapping from window.findyBinSensorIntegration: ${imei} -> ${binId}`);
                }
            }
            
            // If not found, try to load mapping from dataManager
            if (!binId && typeof dataManager !== 'undefined') {
                const bins = dataManager.getBins();
                const linkedBin = bins.find(b => b.sensorIMEI === imei);
                if (linkedBin) {
                    binId = linkedBin.id;
                    // Cache the mapping
                    this.linkSensorToBin(imei, binId);
                    console.log(`🔗 Dynamically linked sensor ${imei} to bin ${binId}`);
                }
            }
            
            if (!binId) {
                // Not an error - sensor might not be linked to any bin yet
                // Just update the sensor cache
                this.sensors.set(imei, {
                    ...this.sensors.get(imei),
                    ...sensorData,
                    lastUpdate: new Date().toISOString()
                });
                console.log(`ℹ️ Sensor ${imei} updated but not linked to any bin`);
                return { success: true, message: 'Sensor updated (not linked to a bin)' };
            }

            // Update sensor cache
            this.sensors.set(imei, {
                ...this.sensors.get(imei),
                ...sensorData,
                lastUpdate: new Date().toISOString()
            });

            // Calculate fill level from sensor data
            const fillLevel = this.calculateFillLevel(sensorData);

            // Update bin in dataManager
            if (typeof dataManager !== 'undefined') {
                const bins = dataManager.getBins();
                const binIndex = bins.findIndex(b => b.id === binId);
                
                if (binIndex >= 0) {
                    const bin = bins[binIndex];
                    
                    // Update bin properties
                    bin.fill = fillLevel;
                    bin.fillLevel = fillLevel;
                    bin.lastSensorUpdate = new Date().toISOString();
                    bin.sensorData = {
                        battery: sensorData.battery,
                        temperature: sensorData.temperature,
                        signal: sensorData.signal,
                        fillLevel: fillLevel,
                        lastSeen: sensorData.lastSeen || new Date().toISOString()
                    };

                    // Update GPS if available
                    if (sensorData.gps?.lat && sensorData.gps?.lng) {
                        bin.lat = sensorData.gps.lat;
                        bin.lng = sensorData.gps.lng;
                        bin.gpsUpdated = new Date().toISOString();
                    }

                    // Determine bin status based on fill level
                    if (fillLevel >= 85) {
                        bin.status = 'critical';
                    } else if (fillLevel >= 70) {
                        bin.status = 'warning';
                    } else {
                        bin.status = 'normal';
                    }

                    // Save updated bin
                    dataManager.setData('bins', bins);
                    
                    // Sync to server
                    if (typeof dataManager.syncToServer === 'function') {
                        await dataManager.syncToServer('bins', bins);
                    }

                    console.log(`✅ Updated bin ${binId}: fill=${fillLevel}%, status=${bin.status}`);

                    // Update map marker
                    await this.updateMapMarker(binId, bin);

                    // Trigger UI updates
                    this.notifyUpdate({
                        type: 'bin_update',
                        imei,
                        binId,
                        fillLevel,
                        sensorData,
                        bin
                    });

                    return { success: true, binId, fillLevel, bin };
                } else {
                    console.warn(`⚠️ Bin ${binId} not found in dataManager`);
                    return { success: false, error: 'Bin not found' };
                }
            }

            return { success: false, error: 'dataManager not available' };
        } catch (error) {
            console.error(`❌ Error updating bin from sensor ${imei}:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Update map marker for a bin - with debounce to prevent rapid updates
     */
    async updateMapMarker(binId, binData) {
        try {
            // DEBOUNCE: Prevent rapid repeated updates (within 3 seconds)
            if (!this._markerUpdateTime) this._markerUpdateTime = {};
            const now = Date.now();
            if (this._markerUpdateTime[binId] && (now - this._markerUpdateTime[binId]) < 3000) {
                return { success: true, message: 'Update debounced' };
            }
            this._markerUpdateTime[binId] = now;
            
            if (typeof mapManager === 'undefined') {
                return { success: false, error: 'mapManager not available' };
            }

            // Check if marker exists (TODO #2 fix: prevent duplicate markers)
            if (mapManager.markers?.bins?.[binId]) {
                // Update existing marker
                const marker = mapManager.markers.bins[binId];
                // Logging removed for performance
                
                // Update position if GPS changed
                if (binData.lat && binData.lng) {
                    const currentLatLng = marker.getLatLng();
                    if (currentLatLng.lat !== binData.lat || currentLatLng.lng !== binData.lng) {
                        marker.setLatLng([binData.lat, binData.lng]);
                    }
                }

                // Update popup content if popup exists
                if (marker.getPopup() && typeof mapManager.createBinPopup === 'function') {
                    const popupContent = mapManager.createBinPopup(binData);
                    marker.setPopupContent(popupContent);
                }

                // Update marker icon/color in-place to avoid flicker (no remove+re-add)
                if (typeof mapManager.updateBinMarkerIcon === 'function') {
                    mapManager.updateBinMarkerIcon(binId);
                } else if (typeof mapManager.getBinColor === 'function' && typeof mapManager.addBinMarker === 'function') {
                    const oldColor = marker.options.icon?.options?.html?.match(/background: linear-gradient[^;]+;/)?.[0];
                    const newColor = mapManager.getBinColor(binData);
                    if (oldColor && !oldColor.includes(newColor)) {
                        if (mapManager.layers?.bins?.hasLayer(marker)) {
                            mapManager.layers.bins.removeLayer(marker);
                        }
                        delete mapManager.markers.bins[binId];
                        mapManager.addBinMarker(binData);
                    }
                }

                return { success: true, message: `Marker updated for bin ${binId}` };
            } else {
                // Marker doesn't exist, create it
                if (typeof mapManager.addBinMarker === 'function') {
                    mapManager.addBinMarker(binData);
                    return { success: true, message: `Marker created for bin ${binId}` };
                } else {
                    console.error(`❌ mapManager.addBinMarker not available`);
                }
            }

            return { success: false, error: 'Cannot update marker' };
        } catch (error) {
            console.error(`❌ Error updating map marker for bin ${binId}:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Calculate fill level from sensor data
     */
    calculateFillLevel(sensorData) {
        // Priority 1: Direct fill level from sensor
        if (sensorData.fillLevel !== null && sensorData.fillLevel !== undefined) {
            return Math.max(0, Math.min(100, sensorData.fillLevel));
        }

        // Priority 2: Calculate from distance sensor
        if (sensorData.distance !== null && sensorData.distance !== undefined) {
            // Assuming bin height of 100cm, calculate fill percentage
            const binHeight = 100;
            const fillLevel = ((binHeight - sensorData.distance) / binHeight) * 100;
            return Math.max(0, Math.min(100, fillLevel));
        }

        // Priority 3: Use existing cached data
        const cachedSensor = this.sensors.get(sensorData.imei);
        if (cachedSensor?.fillLevel !== undefined) {
            return cachedSensor.fillLevel;
        }

        // Default: return 0 if no data available
        return 0;
    }

    /**
     * Get sensor data for a bin
     */
    getSensorForBin(binId) {
        const imei = this.binToSensor.get(binId);
        if (!imei) {
            return null;
        }
        return this.sensors.get(imei);
    }

    /**
     * Get bin ID for a sensor
     */
    getBinForSensor(imei) {
        return this.sensorToBin.get(imei) || null;
    }

    /**
     * Register update callback
     */
    onUpdate(callback) {
        if (typeof callback === 'function') {
            this.updateCallbacks.push(callback);
        }
    }

    /**
     * Notify all registered callbacks of updates
     */
    notifyUpdate(data) {
        // Dispatch DOM event
        if (typeof document !== 'undefined') {
            document.dispatchEvent(new CustomEvent('sensorDataUpdated', {
                detail: data
            }));
        }

        // Call registered callbacks
        this.updateCallbacks.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error('Error in update callback:', error);
            }
        });
    }

    /**
     * Refresh all bins with sensor data
     */
    async refreshAllBins() {
        console.log('🔄 Refreshing all bins with sensor data...');
        
        const updates = [];
        for (const [imei, binId] of this.sensorToBin) {
            const sensor = this.sensors.get(imei);
            if (sensor) {
                updates.push(this.updateBinFromSensor(imei, sensor));
            }
        }

        const results = await Promise.allSettled(updates);
        const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
        
        console.log(`✅ Refreshed ${successful}/${results.length} bins`);
        
        return {
            success: true,
            total: results.length,
            successful
        };
    }

    /**
     * Get bridge statistics
     */
    getStatistics() {
        return {
            totalSensors: this.sensors.size,
            linkedSensors: this.sensorToBin.size,
            linkedBins: this.binToSensor.size,
            unlinkedSensors: this.sensors.size - this.sensorToBin.size,
            sensors: Array.from(this.sensors.values()),
            links: Array.from(this.sensorToBin.entries()).map(([imei, binId]) => ({
                imei,
                binId,
                sensor: this.sensors.get(imei)
            }))
        };
    }
}

// Create global instance
if (typeof window !== 'undefined') {
    window.sensorBinMapBridge = new SensorBinMapBridge();
    
    // Initialize when document is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.sensorBinMapBridge.initialize();
        });
    } else {
        window.sensorBinMapBridge.initialize();
    }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SensorBinMapBridge;
}
