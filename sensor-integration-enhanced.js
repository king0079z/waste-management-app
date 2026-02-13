// sensor-integration-enhanced.js - World-Class Sensor Integration
// Comprehensive integration between sensors, bins, and the application

class SensorIntegrationEnhanced {
    constructor() {
        this.initialized = false;
        this.realTimeUpdates = true;
        this.updateInterval = null;
        this.websocketConnected = false;
        
        console.log('🌐 Sensor Integration Enhanced initialized');
    }
    
    /**
     * Initialize enhanced integration
     */
    async initialize() {
        if (this.initialized) {
            console.log('ℹ️ Sensor Integration already initialized');
            return;
        }
        
        try {
            console.log('🚀 Starting Sensor Integration Enhanced...');
            
            // Wait for dependencies
            await this.waitForDependencies();
            
            // Setup WebSocket connection for real-time updates
            this.setupWebSocketConnection();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Start periodic status checks
            this.startPeriodicStatusChecks();
            
            // Setup cross-page communication
            this.setupCrossPageCommunication();
            
            this.initialized = true;
            console.log('✅ Sensor Integration Enhanced ready');
            
        } catch (error) {
            console.error('❌ Failed to initialize Sensor Integration Enhanced:', error);
        }
    }
    
    /**
     * Wait for required dependencies to load
     */
    async waitForDependencies() {
        const maxWait = 10000; // 10 seconds
        const checkInterval = 500;
        let waited = 0;
        
        while (waited < maxWait) {
            if (typeof findyClient !== 'undefined' && 
                typeof dataManager !== 'undefined' &&
                typeof findyBinSensorIntegration !== 'undefined') {
                console.log('✅ All dependencies loaded');
                return;
            }
            
            await new Promise(resolve => setTimeout(resolve, checkInterval));
            waited += checkInterval;
        }
        
        console.warn('⚠️ Some dependencies not loaded after 10s, continuing anyway...');
    }
    
    /**
     * Setup WebSocket connection for real-time updates
     */
    setupWebSocketConnection() {
        // Listen for sensor updates from WebSocket
        window.addEventListener('sensor_update', (event) => {
            this.handleRealTimeUpdate(event.detail);
        });
        
        window.addEventListener('bin_fill_update', (event) => {
            this.handleBinFillUpdate(event.detail);
        });
        
        console.log('✅ WebSocket listeners registered');
        this.websocketConnected = true;
    }
    
    /**
     * Handle real-time sensor update
     */
    handleRealTimeUpdate(data) {
        console.log('📡 Real-time sensor update received:', data);
        
        // Update sensor status manager cache
        if (typeof sensorStatusManager !== 'undefined' && data.imei) {
            const status = this.parseUpdateData(data);
            sensorStatusManager.statusCache.set(data.imei, {
                status,
                timestamp: Date.now()
            });
            
            // Trigger callbacks
            sensorStatusManager.triggerCallbacks(data.imei, status);
        }
        
        // Update bin sensor integration
        if (typeof findyBinSensorIntegration !== 'undefined') {
            findyBinSensorIntegration.handleSensorUpdate(data);
        }
        
        // Update sensor management UI if on that page
        if (typeof sensorManagementAdmin !== 'undefined' && sensorManagementAdmin.sensors) {
            const sensor = sensorManagementAdmin.sensors.get(data.imei);
            if (sensor) {
                sensorManagementAdmin.handleSensorUpdate(data);
                sensorManagementAdmin.updateSensorRow(data.imei);
            }
        }
        
        // Dispatch custom event for other components
        window.dispatchEvent(new CustomEvent('sensor:updated', {
            detail: data
        }));
    }
    
    /**
     * Handle bin fill update
     */
    handleBinFillUpdate(data) {
        console.log('📊 Bin fill update received:', data);
        
        // Update bin in data manager
        if (typeof dataManager !== 'undefined' && data.binId) {
            const bin = dataManager.getBinById(data.binId);
            if (bin) {
                if (data.fillLevel !== undefined) {
                    bin.fill = data.fillLevel;
                    bin.fillLevel = data.fillLevel;
                }
                if (data.battery !== undefined) {
                    bin.batteryLevel = data.battery;
                }
                if (data.temperature !== undefined) {
                    bin.temperature = data.temperature;
                }
                bin.lastUpdate = new Date().toISOString();
                
                // Update map marker
                if (typeof findyBinSensorIntegration !== 'undefined') {
                    findyBinSensorIntegration.updateBinMarkerOnMap(data.binId);
                }
            }
        }
    }
    
    /**
     * Parse update data to status format
     */
    parseUpdateData(data) {
        return {
            online: true,
            status: 'online',
            lastSeen: data.lastSeen || new Date().toISOString(),
            battery: data.battery,
            fillLevel: data.fillLevel,
            temperature: data.temperature,
            operator: data.operator,
            location: data.location
        };
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for bin added/updated events
        window.addEventListener('bin:added', (event) => {
            this.handleBinAdded(event.detail);
        });
        
        window.addEventListener('bin:updated', (event) => {
            this.handleBinUpdated(event.detail);
        });
        
        // Listen for sensor added/removed events
        window.addEventListener('sensor:added', (event) => {
            this.handleSensorAdded(event.detail);
        });
        
        window.addEventListener('sensor:removed', (event) => {
            this.handleSensorRemoved(event.detail);
        });
        
        console.log('✅ Event listeners registered');
    }
    
    /**
     * Handle bin added event
     */
    handleBinAdded(bin) {
        if (bin.sensorIMEI && typeof findyBinSensorIntegration !== 'undefined') {
            console.log(`🔗 New bin ${bin.id} has sensor ${bin.sensorIMEI}, starting monitoring...`);
            findyBinSensorIntegration.linkBinToSensor(bin.id, bin.sensorIMEI);
            findyBinSensorIntegration.startMonitoringBinSensor(bin.id, bin.sensorIMEI);
        }
    }
    
    /**
     * Handle bin updated event
     */
    handleBinUpdated(bin) {
        // Update map marker if needed
        if (typeof findyBinSensorIntegration !== 'undefined') {
            findyBinSensorIntegration.updateBinMarkerOnMap(bin.id);
        }
    }
    
    /**
     * Handle sensor added event
     */
    handleSensorAdded(sensor) {
        console.log('📡 Sensor added event:', sensor);
        
        // If sensor is linked to bin, start monitoring
        if (sensor.binId && typeof findyBinSensorIntegration !== 'undefined') {
            findyBinSensorIntegration.linkBinToSensor(sensor.binId, sensor.imei);
            findyBinSensorIntegration.startMonitoringBinSensor(sensor.binId, sensor.imei);
        }
        
        // Fetch initial status
        if (typeof sensorStatusManager !== 'undefined') {
            sensorStatusManager.getSensorStatus(sensor.imei, true);
        }
    }
    
    /**
     * Handle sensor removed event
     */
    handleSensorRemoved(sensor) {
        console.log('🗑️ Sensor removed event:', sensor);
        
        // Unlink from bin if linked
        if (sensor.binId && typeof findyBinSensorIntegration !== 'undefined') {
            findyBinSensorIntegration.unlinkBinSensor(sensor.binId);
        }
        
        // Clear cache
        if (typeof sensorStatusManager !== 'undefined') {
            sensorStatusManager.clearCache(sensor.imei);
        }
    }
    
    /**
     * Start periodic status checks (WORLD-CLASS with Smart Adaptive Polling)
     */
    startPeriodicStatusChecks() {
        // SMART POLLING: Aggressive when active, conservative when idle
        let pollInterval = 15000; // 15 seconds (world-class speed)
        let idleInterval = 60000; // 60 seconds when idle
        let lastActivity = Date.now();
        
        // Track user activity
        ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, () => {
                lastActivity = Date.now();
            }, { passive: true });
        });
        
        // Adaptive polling function
        const performStatusCheck = async () => {
            const timeSinceActivity = Date.now() - lastActivity;
            const isUserActive = timeSinceActivity < 120000; // Active in last 2 minutes
            const currentInterval = isUserActive ? pollInterval : idleInterval;
            
            if (!document.hidden && this.realTimeUpdates) {
                const activityLabel = isUserActive ? '🟢 ACTIVE' : '🟡 IDLE';
                console.log(`⏰ ${activityLabel} status check (${currentInterval/1000}s interval)...`);
                
                // Only refresh if sensor management is active
                if (typeof sensorManagementAdmin !== 'undefined' && 
                    sensorManagementAdmin.sensors.size > 0) {
                    
                    // Show subtle loading indicator
                    this.showUpdateIndicator();
                    
                    try {
                        await sensorManagementAdmin.checkAllSensorStatus();
                        console.log('✅ Status check complete');
                    } catch (error) {
                        console.error('❌ Status check failed:', error);
                    } finally {
                        this.hideUpdateIndicator();
                    }
                }
            }
            
            // Schedule next check with adaptive interval
            setTimeout(performStatusCheck, currentInterval);
        };
        
        // Start first check
        performStatusCheck();
        
        console.log('✅ WORLD-CLASS periodic status checks enabled');
        console.log('   📊 Active polling: Every 15 seconds');
        console.log('   💤 Idle polling: Every 60 seconds');
        console.log('   🎯 Smart adaptation based on user activity');
    }
    
    /**
     * Show subtle update indicator
     */
    showUpdateIndicator() {
        let indicator = document.getElementById('realtime-update-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'realtime-update-indicator';
            indicator.innerHTML = '<i class="fas fa-sync fa-spin"></i> Updating...';
            indicator.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 8px 16px;
                border-radius: 8px;
                font-size: 0.85rem;
                font-weight: 600;
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
                z-index: 10000;
                opacity: 0;
                transition: opacity 0.3s ease;
                pointer-events: none;
            `;
            document.body.appendChild(indicator);
        }
        
        setTimeout(() => indicator.style.opacity = '1', 10);
    }
    
    /**
     * Hide update indicator
     */
    hideUpdateIndicator() {
        const indicator = document.getElementById('realtime-update-indicator');
        if (indicator) {
            indicator.style.opacity = '0';
            setTimeout(() => {
                if (indicator.parentNode) {
                    indicator.parentNode.removeChild(indicator);
                }
            }, 300);
        }
    }
    
    /**
     * Setup cross-page communication using localStorage
     */
    setupCrossPageCommunication() {
        // Listen for storage events (updates from other tabs/windows)
        window.addEventListener('storage', (event) => {
            if (event.key === 'sensor_update') {
                try {
                    const data = JSON.parse(event.newValue);
                    this.handleRealTimeUpdate(data);
                } catch (error) {
                    console.error('Error parsing storage event:', error);
                }
            }
        });
        
        console.log('✅ Cross-page communication enabled');
    }
    
    /**
     * Broadcast sensor update to other tabs/windows
     */
    broadcastSensorUpdate(data) {
        try {
            localStorage.setItem('sensor_update', JSON.stringify({
                ...data,
                timestamp: Date.now()
            }));
            
            // Clear after 1 second to allow other tabs to read
            setTimeout(() => {
                localStorage.removeItem('sensor_update');
            }, 1000);
        } catch (error) {
            console.error('Error broadcasting sensor update:', error);
        }
    }
    
    /**
     * Get all sensors with their current status
     */
    async getAllSensorsWithStatus() {
        const sensors = [];
        
        if (typeof sensorManagementAdmin !== 'undefined') {
            for (const [imei, sensor] of sensorManagementAdmin.sensors) {
                const status = await sensorStatusManager.getSensorStatus(imei);
                sensors.push({
                    ...sensor,
                    currentStatus: status
                });
            }
        }
        
        return sensors;
    }
    
    /**
     * Sync all sensor data with bins
     */
    async syncAllSensorDataWithBins() {
        console.log('🔄 Syncing all sensor data with bins...');
        
        if (typeof findyBinSensorIntegration === 'undefined') {
            console.warn('⚠️ Bin sensor integration not available');
            return;
        }
        
        const binSensorMap = findyBinSensorIntegration.binSensorMapping;
        let syncedCount = 0;
        
        for (const [binId, imei] of Object.entries(binSensorMap)) {
            try {
                await findyBinSensorIntegration.refreshBinSensor(binId);
                syncedCount++;
            } catch (error) {
                console.error(`Error syncing bin ${binId}:`, error);
            }
            
            // Small delay to avoid overwhelming API
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        console.log(`✅ Synced ${syncedCount} bins with sensor data`);
    }
    
    /**
     * Cleanup
     */
    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        console.log('🛑 Sensor Integration Enhanced destroyed');
    }
}

// Initialize global instance
const sensorIntegrationEnhanced = new SensorIntegrationEnhanced();
window.sensorIntegrationEnhanced = sensorIntegrationEnhanced;

// Auto-initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Wait a bit for other scripts to load
    setTimeout(async () => {
        await sensorIntegrationEnhanced.initialize();
    }, 2000);
});

console.log('✅ Sensor Integration Enhanced loaded');
