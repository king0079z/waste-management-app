// findy-map-integration.js - Enhanced Map Integration for Findy IoT Sensors
// Displays sensor locations, live tracking, and real-time updates on the map

class FindyMapIntegration {
    constructor() {
        this.sensorMarkers = {}; // Track sensor markers on map
        this.trackingPolylines = {}; // Track movement paths
        this.sensorLocations = {}; // Cache sensor locations
        
        console.log('🗺️ Findy Map Integration initialized');
    }
    
    /**
     * Initialize integration with map manager
     */
    async initialize() {
        try {
            // Wait for map to be ready
            const mapManager = await this.waitForMap();
            
            if (!mapManager || !mapManager.map) {
                // Map not ready yet, but don't fail - will retry later
                console.log('ℹ️ Map not ready yet - Findy integration will retry when map initializes');
                
                // Set up a retry mechanism when map becomes available
                this.setupMapReadyListener();
                
                return false; // Not ready, but not an error
            }
            
            // Setup event listeners
            this.setupEventListeners();
            
            console.log('✅ Findy map integration ready');
            return true;
        } catch (error) {
            console.warn('⚠️ Findy map integration initialization issue (will retry):', error.message);
            
            // Set up retry mechanism
            this.setupMapReadyListener();
            
            return false;
        }
    }
    
    /**
     * Setup listener to retry initialization when map becomes ready
     */
    setupMapReadyListener() {
        // Remove any existing listener
        if (this.mapReadyListener) {
            window.removeEventListener('map:ready', this.mapReadyListener);
        }
        
        // Create new listener
        this.mapReadyListener = async () => {
            if (typeof mapManager !== 'undefined' && mapManager && mapManager.map) {
                console.log('🔄 Retrying Findy map integration initialization...');
                const initialized = await this.initialize();
                if (initialized) {
                    window.removeEventListener('map:ready', this.mapReadyListener);
                }
            }
        };
        
        // Listen for map ready event
        window.addEventListener('map:ready', this.mapReadyListener);
        
        // Also check periodically as fallback
        const checkInterval = setInterval(() => {
            if (typeof mapManager !== 'undefined' && mapManager && mapManager.map) {
                clearInterval(checkInterval);
                this.mapReadyListener();
            }
        }, 1000);
        
        // Clear interval after 60 seconds
        setTimeout(() => clearInterval(checkInterval), 60000);
    }
    
    /**
     * Wait for map to be initialized
     */
    async waitForMap() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 200; // 20 seconds (200 * 100ms)
            let timeoutId = null;
            
            const checkMap = () => {
                attempts++;
                
                // Check if mapManager exists and map is initialized
                if (typeof mapManager !== 'undefined' && mapManager && mapManager.map) {
                    if (timeoutId) clearTimeout(timeoutId);
                    resolve(mapManager);
                    return;
                }
                
                // Check if we've exceeded max attempts
                if (attempts >= maxAttempts) {
                    if (timeoutId) clearTimeout(timeoutId);
                    // Don't reject, just resolve with null to allow graceful degradation
                    console.warn('⚠️ Map initialization timeout - Findy integration will retry when map is ready');
                    resolve(null);
                    return;
                }
                
                setTimeout(checkMap, 100);
            };
            
            // Start checking
            checkMap();
            
            // Set a safety timeout (longer than max attempts)
            timeoutId = setTimeout(() => {
                console.warn('⚠️ Map initialization safety timeout - Findy integration will retry when map is ready');
                resolve(null);
            }, 30000); // 30 seconds safety timeout
        });
    }
    
    /**
     * Setup event listeners for Findy updates
     */
    setupEventListeners() {
        // Listen for live tracking updates
        window.addEventListener('livetracking:update', (event) => {
            this.handleLiveTrackingUpdate(event.detail);
        });
        
        // Listen for Findy location updates
        window.addEventListener('findy:location-updated', (event) => {
            this.handleLocationUpdate(event.detail);
        });
        
        // Listen for vehicle data updates
        window.addEventListener('findy:vehicle-data-updated', (event) => {
            this.handleVehicleDataUpdate(event.detail);
        });
        
        console.log('✅ Findy map event listeners registered');
    }
    
    /**
     * Handle live tracking update
     */
    handleLiveTrackingUpdate(data) {
        try {
            if (!data || !data.data) return;
            
            const imei = data.imei;
            const sensorData = data.data;
            
            // Extract GPS data
            let location = null;
            
            if (sensorData.ingps) {
                location = {
                    lat: parseFloat(sensorData.ingps.lat),
                    lng: parseFloat(sensorData.ingps.lon || sensorData.ingps.lng),
                    speed: sensorData.ingps.speed,
                    satellites: sensorData.ingps.satellites,
                    accuracy: sensorData.ingps.accuracy
                };
            } else if (sensorData.incell) {
                // Fallback to GSM location
                location = {
                    lat: parseFloat(sensorData.incell.lat),
                    lng: parseFloat(sensorData.incell.lon || sensorData.incell.lng),
                    type: 'gsm'
                };
            }
            
            if (location && location.lat && location.lng) {
                this.updateSensorMarker(imei, location, sensorData);
            }
            
        } catch (error) {
            console.error('Error handling live tracking update:', error);
        }
    }
    
    /**
     * Handle direct location update
     */
    handleLocationUpdate(location) {
        try {
            if (!location || !location.lat || !location.lng) return;
            
            // Try to find associated driver
            if (findyDriverIntegration && findyDriverIntegration.currentDriver) {
                const driverId = findyDriverIntegration.currentDriver;
                this.updateDriverLocation(driverId, location);
            }
            
        } catch (error) {
            console.error('Error handling location update:', error);
        }
    }
    
    /**
     * Handle vehicle data update
     */
    handleVehicleDataUpdate(vehicleInfo) {
        try {
            if (!vehicleInfo || !vehicleInfo.location) return;
            
            const location = vehicleInfo.location;
            
            if (location.lat && location.lng) {
                const imei = vehicleInfo.imei;
                this.updateSensorMarker(imei, {
                    lat: parseFloat(location.lat),
                    lng: parseFloat(location.lng)
                }, vehicleInfo);
            }
            
        } catch (error) {
            console.error('Error handling vehicle data update:', error);
        }
    }
    
    /**
     * Update sensor marker on map
     */
    updateSensorMarker(imei, location, sensorData = {}) {
        try {
            if (!mapManager || !mapManager.map) {
                console.warn('Map not ready for sensor marker update');
                return;
            }
            
            // Cache location
            this.sensorLocations[imei] = location;
            
            // Create or update marker
            if (this.sensorMarkers[imei]) {
                // Update existing marker
                this.sensorMarkers[imei].setLatLng([location.lat, location.lng]);
                
                // Update popup content
                this.updateMarkerPopup(imei, location, sensorData);
                
                // Add to tracking path
                this.addToTrackingPath(imei, location);
            } else {
                // Create new marker
                this.createSensorMarker(imei, location, sensorData);
            }
            
            console.log(`📍 Sensor ${imei} updated on map:`, location.lat, location.lng);
            
        } catch (error) {
            console.error('Error updating sensor marker:', error);
        }
    }
    
    /**
     * Create sensor marker on map
     */
    createSensorMarker(imei, location, sensorData = {}) {
        try {
            if (!mapManager || !mapManager.map) return;
            
            // Determine icon based on sensor type
            const icon = this.getSensorIcon(sensorData);
            
            // Create Leaflet marker
            const marker = L.marker([location.lat, location.lng], {
                icon: L.divIcon({
                    className: 'findy-sensor-marker',
                    html: icon,
                    iconSize: [32, 32],
                    iconAnchor: [16, 32],
                    popupAnchor: [0, -32]
                }),
                title: `Sensor ${imei}`
            });
            
            // Create popup
            const popupContent = this.createSensorPopup(imei, location, sensorData);
            marker.bindPopup(popupContent);
            
            // Add to map
            marker.addTo(mapManager.map);
            
            // Store marker reference
            this.sensorMarkers[imei] = marker;
            
            console.log(`✅ Created sensor marker for ${imei}`);
            
        } catch (error) {
            console.error('Error creating sensor marker:', error);
        }
    }
    
    /**
     * Get icon for sensor type
     */
    getSensorIcon(sensorData) {
        const battery = sensorData.battery || 100;
        const isGPS = sensorData.ingps ? true : false;
        
        let color = '#10b981'; // Green by default
        if (battery < 30) color = '#ef4444'; // Red for low battery
        else if (battery < 60) color = '#f59e0b'; // Orange for medium battery
        
        let icon = 'fa-satellite-dish';
        if (!isGPS) icon = 'fa-broadcast-tower'; // GSM only
        
        return `
            <div style="
                background: ${color};
                width: 32px;
                height: 32px;
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 3px 10px rgba(0,0,0,0.3);
                border: 3px solid white;
            ">
                <i class="fas ${icon}" style="
                    color: white;
                    font-size: 14px;
                    transform: rotate(45deg);
                "></i>
            </div>
        `;
    }
    
    /**
     * Create sensor popup content
     */
    createSensorPopup(imei, location, sensorData = {}) {
        const battery = sensorData.battery || 'N/A';
        const operator = sensorData.operator || 'Unknown';
        const satellites = location.satellites || sensorData.ingps?.satellites || 0;
        const speed = location.speed || 0;
        const locationType = location.type || (sensorData.ingps ? 'GPS' : 'GSM');
        
        return `
            <div style="min-width: 200px;">
                <h3 style="margin: 0 0 0.5rem 0; color: #1e40af; font-size: 1rem;">
                    <i class="fas fa-satellite"></i> Sensor ${imei.substring(0, 10)}...
                </h3>
                
                <div style="font-size: 0.85rem;">
                    <div style="margin: 0.25rem 0;">
                        <strong>📍 Location:</strong> ${locationType}
                    </div>
                    <div style="margin: 0.25rem 0; font-size: 0.75rem; color: #64748b;">
                        ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}
                    </div>
                    <div style="margin: 0.25rem 0;">
                        <strong>🔋 Battery:</strong> ${battery}${typeof battery === 'number' ? '%' : ''}
                    </div>
                    <div style="margin: 0.25rem 0;">
                        <strong>📡 Operator:</strong> ${operator}
                    </div>
                    ${satellites > 0 ? `
                        <div style="margin: 0.25rem 0;">
                            <strong>🛰️ Satellites:</strong> ${satellites}
                        </div>
                    ` : ''}
                    ${speed > 0 ? `
                        <div style="margin: 0.25rem 0;">
                            <strong>⚡ Speed:</strong> ${speed} km/h
                        </div>
                    ` : ''}
                </div>
                
                <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #e2e8f0;">
                    <button onclick="findyMapIntegration.centerOnSensor('${imei}')" 
                            style="background: #3b82f6; color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 4px; cursor: pointer; font-size: 0.8rem; width: 100%;">
                        <i class="fas fa-crosshairs"></i> Center on Map
                    </button>
                </div>
            </div>
        `;
    }
    
    /**
     * Update marker popup content
     */
    updateMarkerPopup(imei, location, sensorData) {
        const marker = this.sensorMarkers[imei];
        if (!marker) return;
        
        const newPopupContent = this.createSensorPopup(imei, location, sensorData);
        marker.setPopupContent(newPopupContent);
    }
    
    /**
     * Add location to tracking path
     */
    addToTrackingPath(imei, location) {
        try {
            if (!mapManager || !mapManager.map) return;
            
            // Initialize polyline if doesn't exist
            if (!this.trackingPolylines[imei]) {
                this.trackingPolylines[imei] = L.polyline([], {
                    color: '#3b82f6',
                    weight: 3,
                    opacity: 0.7,
                    smoothFactor: 1
                }).addTo(mapManager.map);
            }
            
            // Add new point to path
            const latlng = [location.lat, location.lng];
            this.trackingPolylines[imei].addLatLng(latlng);
            
            // Limit path to last 50 points
            const points = this.trackingPolylines[imei].getLatLngs();
            if (points.length > 50) {
                this.trackingPolylines[imei].setLatLngs(points.slice(-50));
            }
            
        } catch (error) {
            console.error('Error adding to tracking path:', error);
        }
    }
    
    /**
     * Update driver location on map
     */
    updateDriverLocation(driverId, location) {
        try {
            if (!mapManager || !mapManager.map) return;
            
            // Get driver data
            const driver = typeof dataManager !== 'undefined' 
                ? dataManager.getUserById(driverId)
                : null;
            
            if (!driver) {
                console.warn(`Driver ${driverId} not found`);
                return;
            }
            
            // Update driver marker
            if (mapManager.markers.drivers[driverId]) {
                // Update existing marker
                mapManager.markers.drivers[driverId].setLatLng([location.lat, location.lng]);
            } else {
                // Create new driver marker
                mapManager.addDriverMarker(driver, location);
            }
            
            // Update in data manager
            if (typeof dataManager !== 'undefined' && dataManager.updateDriverLocation) {
                dataManager.updateDriverLocation(driverId, location.lat, location.lng);
            }
            
            console.log(`✅ Driver ${driver.name} location updated on map`);
            
        } catch (error) {
            console.error('Error updating driver location:', error);
        }
    }
    
    /**
     * Center map on sensor
     */
    centerOnSensor(imei) {
        try {
            const location = this.sensorLocations[imei];
            if (location && mapManager && mapManager.map) {
                mapManager.map.setView([location.lat, location.lng], 16);
                
                // Open popup if marker exists
                if (this.sensorMarkers[imei]) {
                    this.sensorMarkers[imei].openPopup();
                }
            }
        } catch (error) {
            console.error('Error centering on sensor:', error);
        }
    }
    
    /**
     * Clear tracking path for sensor
     */
    clearTrackingPath(imei) {
        if (this.trackingPolylines[imei]) {
            mapManager.map.removeLayer(this.trackingPolylines[imei]);
            delete this.trackingPolylines[imei];
        }
    }
    
    /**
     * Remove sensor marker from map
     */
    removeSensorMarker(imei) {
        try {
            if (this.sensorMarkers[imei]) {
                mapManager.map.removeLayer(this.sensorMarkers[imei]);
                delete this.sensorMarkers[imei];
            }
            
            this.clearTrackingPath(imei);
            delete this.sensorLocations[imei];
            
            console.log(`✅ Removed sensor marker for ${imei}`);
        } catch (error) {
            console.error('Error removing sensor marker:', error);
        }
    }
    
    /**
     * Show all tracked sensors on map
     */
    async showAllTrackedSensors() {
        try {
            // Get list of tracked devices
            const result = await findyClient.getTrackedDevices();
            
            if (result.success && result.devices) {
                console.log(`📍 Showing ${result.devices.length} tracked sensors on map`);
                
                for (const imei of result.devices) {
                    // Get latest tracking data
                    try {
                        const trackingData = await findyClient.getLiveTracking(imei);
                        if (trackingData.success && trackingData.data) {
                            this.handleLiveTrackingUpdate({
                                imei: imei,
                                data: trackingData.data
                            });
                        }
                    } catch (error) {
                        console.error(`Failed to get tracking data for ${imei}:`, error);
                    }
                }
            }
        } catch (error) {
            console.error('Error showing tracked sensors:', error);
        }
    }
    
    /**
     * Clear all sensor markers
     */
    clearAllSensorMarkers() {
        Object.keys(this.sensorMarkers).forEach(imei => {
            this.removeSensorMarker(imei);
        });
        
        console.log('🧹 All sensor markers cleared');
    }
    
    /**
     * Get sensor marker by IMEI
     */
    getSensorMarker(imei) {
        return this.sensorMarkers[imei];
    }
    
    /**
     * Check if sensor is on map
     */
    hasSensorMarker(imei) {
        return !!this.sensorMarkers[imei];
    }
}

// Initialize global instance
const findyMapIntegration = new FindyMapIntegration();

// Expose to window
window.findyMapIntegration = findyMapIntegration;

// Auto-initialize when map is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for map to initialize
    setTimeout(async () => {
        try {
            const initialized = await findyMapIntegration.initialize();
            
            if (initialized) {
                console.log('✅ Findy map integration initialized');
                
                // Show any currently tracked sensors
                findyMapIntegration.showAllTrackedSensors();
            }
        } catch (error) {
            console.error('Failed to initialize Findy map integration:', error);
        }
    }, 2000);
});

console.log('✅ Findy Map Integration loaded successfully');


