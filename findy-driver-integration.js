// findy-driver-integration.js - Findy IoT Sensor Integration for Driver Application
// Provides sensor data integration for waste collection vehicles

class FindyDriverIntegration {
    constructor() {
        this.currentDriver = null;
        this.vehicleIMEI = null;
        this.liveTrackingActive = false;
        this.sensorUpdateInterval = null;
        this.updateFrequency = 60000; // 60 seconds (aligned with server sensor polling; was 5s and caused excessive API calls)
        
        console.log('🚛 Findy Driver Integration initialized');
    }
    
    /**
     * Initialize integration for a specific driver
     */
    async initialize(driverId, vehicleIMEI = null) {
        try {
            this.currentDriver = driverId;
            this.vehicleIMEI = vehicleIMEI;
            
            console.log(`🔌 Initializing Findy integration for driver ${driverId}`);
            
            // Check Findy API health
            const health = await findyClient.healthCheck();
            
            if (!health.authenticated) {
                console.log('⚠️ Findy API not authenticated - sensor features will be limited');
                return {
                    success: false,
                    authenticated: false,
                    message: 'Findy API authentication required'
                };
            }
            
            // If vehicle has IMEI, get device information
            if (this.vehicleIMEI) {
                await this.loadVehicleSensorData();
            }
            
            // Setup event listeners
            this.setupEventListeners();
            
            console.log('✅ Findy driver integration ready');
            
            return {
                success: true,
                authenticated: true,
                vehicleIMEI: this.vehicleIMEI
            };
            
        } catch (error) {
            console.error('❌ Failed to initialize Findy driver integration:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Load vehicle sensor data
     */
    async loadVehicleSensorData() {
        try {
            if (!this.vehicleIMEI) {
                console.log('⚠️ No vehicle IMEI configured for this driver');
                return null;
            }
            
            console.log(`📡 Loading sensor data for vehicle ${this.vehicleIMEI}`);
            
            const deviceData = await findyClient.getDevice(this.vehicleIMEI);
            
            if (deviceData.success) {
                // Process and display vehicle sensor data
                this.processVehicleSensorData(deviceData.data);
                return deviceData.data;
            }
            
            return null;
        } catch (error) {
            console.error('Failed to load vehicle sensor data:', error);
            return null;
        }
    }
    
    /**
     * Process vehicle sensor data
     */
    processVehicleSensorData(sensorData) {
        try {
            // Extract relevant sensor information
            const vehicleInfo = {
                imei: sensorData.deviceInfo?.imei,
                lastReport: sensorData.deviceInfo?.lastModTime,
                battery: sensorData.battery,
                location: sensorData.ingps || sensorData.incell,
                status: sensorData.deviceInfo?.deviceStatusID,
                operator: sensorData.operator,
                signalStrength: sensorData.ingps?.satellites || 0
            };
            
            // Update UI with sensor information
            this.updateVehicleSensorUI(vehicleInfo);
            
            // Trigger custom event
            window.dispatchEvent(new CustomEvent('findy:vehicle-data-updated', {
                detail: vehicleInfo
            }));
            
            return vehicleInfo;
        } catch (error) {
            console.error('Error processing vehicle sensor data:', error);
            return null;
        }
    }
    
    /**
     * Update UI with vehicle sensor information
     */
    updateVehicleSensorUI(vehicleInfo) {
        try {
            // Create or update sensor info panel
            let sensorPanel = document.getElementById('findyVehicleSensorPanel');
            
            if (!sensorPanel) {
                // Create sensor panel
                sensorPanel = document.createElement('div');
                sensorPanel.id = 'findyVehicleSensorPanel';
                sensorPanel.className = 'glass-card';
                sensorPanel.style.cssText = `
                    margin: 1rem 0;
                    padding: 1rem;
                    background: rgba(59, 130, 246, 0.1);
                    border-left: 4px solid #3b82f6;
                `;
                
                // Find appropriate location to insert
                const driverDashboard = document.querySelector('.section[data-section="dashboard"]');
                if (driverDashboard) {
                    driverDashboard.insertBefore(sensorPanel, driverDashboard.firstChild);
                }
            }
            
            // Update panel content
            sensorPanel.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                    <h3 style="margin: 0; color: #3b82f6;">
                        <i class="fas fa-satellite"></i> Vehicle Sensor Status
                    </h3>
                    <span style="font-size: 0.8rem; color: #94a3b8;">
                        IMEI: ${vehicleInfo.imei || 'N/A'}
                    </span>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-top: 1rem;">
                    <div>
                        <div style="font-size: 0.8rem; color: #94a3b8; margin-bottom: 0.25rem;">Battery</div>
                        <div style="font-size: 1.2rem; font-weight: bold; color: ${this.getBatteryColor(vehicleInfo.battery)};">
                            <i class="fas fa-battery-${this.getBatteryIcon(vehicleInfo.battery)}"></i> ${vehicleInfo.battery || 'N/A'}%
                        </div>
                    </div>
                    
                    <div>
                        <div style="font-size: 0.8rem; color: #94a3b8; margin-bottom: 0.25rem;">Signal</div>
                        <div style="font-size: 1.2rem; font-weight: bold; color: #10b981;">
                            <i class="fas fa-signal"></i> ${vehicleInfo.signalStrength || 0} satellites
                        </div>
                    </div>
                    
                    <div>
                        <div style="font-size: 0.8rem; color: #94a3b8; margin-bottom: 0.25rem;">Operator</div>
                        <div style="font-size: 1.2rem; font-weight: bold; color: #8b5cf6;">
                            <i class="fas fa-sim-card"></i> ${vehicleInfo.operator || 'N/A'}
                        </div>
                    </div>
                    
                    <div>
                        <div style="font-size: 0.8rem; color: #94a3b8; margin-bottom: 0.25rem;">Last Update</div>
                        <div style="font-size: 0.9rem; font-weight: bold; color: #f59e0b;">
                            <i class="fas fa-clock"></i> ${this.formatTimestamp(vehicleInfo.lastReport)}
                        </div>
                    </div>
                </div>
                
                <div style="margin-top: 1rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    <button class="btn btn-sm btn-primary" onclick="findyDriverIntegration.startLiveTracking()">
                        <i class="fas fa-satellite-dish"></i> Start Live Tracking
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="findyDriverIntegration.refreshSensorData()">
                        <i class="fas fa-sync-alt"></i> Refresh
                    </button>
                </div>
            `;
            
        } catch (error) {
            console.error('Error updating sensor UI:', error);
        }
    }
    
    /**
     * Get battery color based on level
     */
    getBatteryColor(level) {
        if (!level) return '#94a3b8';
        if (level > 60) return '#10b981';
        if (level > 30) return '#f59e0b';
        return '#ef4444';
    }
    
    /**
     * Get battery icon based on level
     */
    getBatteryIcon(level) {
        if (!level) return 'empty';
        if (level > 75) return 'full';
        if (level > 50) return 'three-quarters';
        if (level > 25) return 'half';
        return 'quarter';
    }
    
    /**
     * Format timestamp for display
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
     * Start live tracking for the vehicle
     */
    async startLiveTracking() {
        try {
            if (!this.vehicleIMEI) {
                if (typeof showNotification === 'function') {
                    showNotification('No vehicle IMEI configured', 'warning');
                }
                return;
            }
            
            if (this.liveTrackingActive) {
                if (typeof showNotification === 'function') {
                    showNotification('Live tracking already active', 'info');
                }
                return;
            }
            
            console.log('🎯 Starting live tracking for vehicle...');
            
            const result = await findyClient.startLiveTracking(this.vehicleIMEI, this.updateFrequency);
            
            if (result.success) {
                this.liveTrackingActive = true;
                this.startSensorUpdateLoop();
                
                if (typeof showNotification === 'function') {
                    showNotification('Live tracking started', 'success');
                }
            }
            
        } catch (error) {
            console.error('Failed to start live tracking:', error);
            
            if (typeof showNotification === 'function') {
                showNotification('Failed to start live tracking: ' + error.message, 'error');
            }
        }
    }
    
    /**
     * Stop live tracking
     */
    async stopLiveTracking() {
        try {
            if (!this.liveTrackingActive) {
                return;
            }
            
            console.log('🛑 Stopping live tracking...');
            
            if (this.vehicleIMEI) {
                await findyClient.stopLiveTracking(this.vehicleIMEI);
            }
            
            this.liveTrackingActive = false;
            this.stopSensorUpdateLoop();
            
            if (typeof showNotification === 'function') {
                showNotification('Live tracking stopped', 'info');
            }
            
        } catch (error) {
            console.error('Failed to stop live tracking:', error);
        }
    }
    
    /**
     * Start sensor update loop
     */
    startSensorUpdateLoop() {
        if (this.sensorUpdateInterval) {
            clearInterval(this.sensorUpdateInterval);
        }
        
        this.sensorUpdateInterval = setInterval(async () => {
            await this.refreshSensorData();
        }, this.updateFrequency);
    }
    
    /**
     * Stop sensor update loop
     */
    stopSensorUpdateLoop() {
        if (this.sensorUpdateInterval) {
            clearInterval(this.sensorUpdateInterval);
            this.sensorUpdateInterval = null;
        }
    }
    
    /**
     * Refresh sensor data
     */
    async refreshSensorData() {
        try {
            if (!this.vehicleIMEI) {
                return;
            }
            
            await this.loadVehicleSensorData();
            
        } catch (error) {
            console.error('Failed to refresh sensor data:', error);
        }
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for live tracking updates
        window.addEventListener('livetracking:update', (event) => {
            if (event.detail.imei === this.vehicleIMEI) {
                this.handleLiveTrackingUpdate(event.detail);
            }
        });
        
        // Listen for route start/end events
        window.addEventListener('route:started', () => {
            this.startLiveTracking();
        });
        
        window.addEventListener('route:completed', () => {
            this.stopLiveTracking();
        });
    }
    
    /**
     * Handle live tracking updates
     */
    handleLiveTrackingUpdate(data) {
        try {
            console.log('📍 Live tracking update received:', data);
            
            // Process location data
            if (data.data && data.data.ingps) {
                const location = {
                    lat: parseFloat(data.data.ingps.lat),
                    lng: parseFloat(data.data.ingps.lon || data.data.ingps.lng),
                    speed: data.data.ingps.speed,
                    satellites: data.data.ingps.satellites,
                    accuracy: data.data.ingps.accuracy,
                    timestamp: data.timestamp
                };
                
                // Update map via Findy map integration (preferred)
                if (typeof findyMapIntegration !== 'undefined') {
                    findyMapIntegration.updateDriverLocation(this.currentDriver, location);
                } else if (typeof mapManager !== 'undefined' && mapManager.map) {
                    // Fallback to direct map update
                    if (typeof dataManager !== 'undefined' && dataManager.updateDriverLocation) {
                        dataManager.updateDriverLocation(this.currentDriver, location.lat, location.lng);
                    }
                    
                    // Update marker if exists
                    if (mapManager.markers.drivers[this.currentDriver]) {
                        mapManager.markers.drivers[this.currentDriver].setLatLng([location.lat, location.lng]);
                    }
                }
                
                // Trigger custom event
                window.dispatchEvent(new CustomEvent('findy:location-updated', {
                    detail: location
                }));
            }
            
        } catch (error) {
            console.error('Error handling live tracking update:', error);
        }
    }
    
    /**
     * Get vehicle history
     */
    async getVehicleHistory(startDate, endDate) {
        try {
            if (!this.vehicleIMEI) {
                throw new Error('No vehicle IMEI configured');
            }
            
            const history = await findyClient.getDeviceHistory(
                this.vehicleIMEI,
                startDate,
                endDate
            );
            
            return history;
        } catch (error) {
            console.error('Failed to get vehicle history:', error);
            throw error;
        }
    }
    
    /**
     * Send command to vehicle
     */
    async sendVehicleCommand(commandData) {
        try {
            if (!this.vehicleIMEI) {
                throw new Error('No vehicle IMEI configured');
            }
            
            const result = await findyClient.sendCommand(this.vehicleIMEI, commandData);
            
            return result;
        } catch (error) {
            console.error('Failed to send vehicle command:', error);
            throw error;
        }
    }
    
    /**
     * Cleanup when driver logs out
     */
    cleanup() {
        this.stopLiveTracking();
        this.currentDriver = null;
        this.vehicleIMEI = null;
        
        // Remove sensor panel
        const sensorPanel = document.getElementById('findyVehicleSensorPanel');
        if (sensorPanel) {
            sensorPanel.remove();
        }
        
        console.log('🧹 Findy driver integration cleaned up');
    }
}

// Initialize global instance
const findyDriverIntegration = new FindyDriverIntegration();

// Expose to window
window.findyDriverIntegration = findyDriverIntegration;

// Auto-initialize for driver users
document.addEventListener('DOMContentLoaded', () => {
    // Check if current user is a driver
    if (typeof currentUser !== 'undefined' && currentUser?.type === 'driver') {
        // Get vehicle IMEI from driver profile (if available)
        const vehicleIMEI = currentUser.vehicleIMEI || currentUser.imei || null;
        
        // Initialize integration
        findyDriverIntegration.initialize(currentUser.id, vehicleIMEI).then(result => {
            if (result.success) {
                console.log('✅ Findy driver integration ready for', currentUser.name);
            } else {
                console.log('⚠️ Findy integration limited:', result.message);
            }
        });
    }
});

console.log('✅ Findy Driver Integration loaded successfully');

