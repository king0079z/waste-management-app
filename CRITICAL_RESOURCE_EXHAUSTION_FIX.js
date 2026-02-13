// CRITICAL_RESOURCE_EXHAUSTION_FIX.js - Fix ERR_INSUFFICIENT_RESOURCES
// Prevents excessive GPS location requests that flood the browser and server

(function() {
    'use strict';

    console.log('🚨 CRITICAL: Applying Resource Exhaustion Fix...');

    // ============= GLOBAL THROTTLING MECHANISM =============
    
    // Global flag to prevent multiple watchers
    if (!window._gpsWatcherActive) {
        window._gpsWatcherActive = false;
    }

    // Global timestamp for throttling (shared across all instances)
    if (!window._lastLocationSendTime) {
        window._lastLocationSendTime = 0;
    }

    // Circuit breaker to stop updates if too many errors
    if (!window._locationUpdateErrors) {
        window._locationUpdateErrors = 0;
    }

    // Maximum errors before circuit breaker activates
    const MAX_ERRORS = 10;
    const ERROR_RESET_TIME = 60000; // Reset error count after 1 minute
    let lastErrorResetTime = Date.now();

    // ============= OVERRIDE MAP MANAGER METHODS =============

    if (window.mapManager && window.MapManager) {
        
        // Store original methods
        const originalUpdateDriverPosition = window.MapManager.prototype.updateDriverPosition;
        const originalStartDriverTracking = window.MapManager.prototype.startDriverTracking;
        const originalStartRealGPSWatch = window.MapManager.prototype.startRealGPSWatch;
        const originalStartSimulatedGPSUpdates = window.MapManager.prototype.startSimulatedGPSUpdates;
        const originalStopDriverTracking = window.MapManager.prototype.stopDriverTracking;

        // ============= ENHANCED stopDriverTracking =============
        window.MapManager.prototype.stopDriverTracking = function() {
            console.log('🛑 STOPPING DRIVER TRACKING (Enhanced)');
            
            // Clear geolocation watcher
            if (this.driverWatchId) {
                navigator.geolocation.clearWatch(this.driverWatchId);
                this.driverWatchId = null;
            }
            
            // Clear simulated GPS interval
            if (this.simulatedInterval) {
                clearInterval(this.simulatedInterval);
                this.simulatedInterval = null;
            }
            
            // Clear update interval
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
                this.updateInterval = null;
            }
            
            // Reset global flag
            window._gpsWatcherActive = false;
            
            console.log('✅ Driver tracking stopped successfully');
        };

        // ============= ENHANCED updateDriverPosition =============
        window.MapManager.prototype.updateDriverPosition = function(position) {
            // CRITICAL: Global throttling check (not just instance-level)
            const now = Date.now();
            const timeSinceLastSend = now - window._lastLocationSendTime;
            
            // Only process update if at least 5 seconds have passed
            if (timeSinceLastSend < 5000) {
                // Silent skip - don't log to reduce console spam
                return;
            }

            // Check circuit breaker
            if (window._locationUpdateErrors >= MAX_ERRORS) {
                // Reset error count if enough time has passed
                if (now - lastErrorResetTime > ERROR_RESET_TIME) {
                    console.log('🔄 Resetting circuit breaker');
                    window._locationUpdateErrors = 0;
                    lastErrorResetTime = now;
                } else {
                    // Circuit breaker active - skip update
                    return;
                }
            }

            const { latitude, longitude, accuracy } = position.coords;
            
            if (!authManager || !authManager.getCurrentUser()) {
                return;
            }
            
            const currentDriver = authManager.getCurrentUser();
            const driverId = currentDriver.id;
            
            // Update in dataManager (local only)
            dataManager.updateDriverLocation(driverId, latitude, longitude, {
                accuracy,
                simulated: this.simulatedGPS
            });
            
            // Update GPS status display
            const gpsStatus = document.getElementById('gpsStatus');
            if (gpsStatus) {
                gpsStatus.innerHTML = `
                    <span style="color: #10b981;">
                        <i class="fas fa-check-circle"></i> Connected ${this.simulatedGPS ? '(Simulated)' : ''}
                    </span>
                    <br>
                    <span style="font-size: 0.75rem;">
                        ${latitude.toFixed(6)}, ${longitude.toFixed(6)}
                        ${accuracy ? ` (±${accuracy.toFixed(0)}m)` : ''}
                    </span>
                `;
            }
            
            // Update driver marker on main map (visual only, no server)
            if (this.map) {
                if (this.markers.drivers[driverId]) {
                    this.markers.drivers[driverId].setLatLng([latitude, longitude]);
                } else {
                    const location = { lat: latitude, lng: longitude, timestamp: new Date().toISOString() };
                    this.addDriverMarker(currentDriver, location);
                }
            }
            
            // CRITICAL: Update global timestamp FIRST to prevent race conditions
            window._lastLocationSendTime = now;
            
            // Send to server (throttled to once every 5 seconds)
            const payload = { 
                lat: latitude, 
                lng: longitude, 
                timestamp: new Date().toISOString(), 
                accuracy: accuracy || null 
            };
            
            // Send via HTTP POST (with error tracking)
            fetch(`/api/driver/${driverId}/location`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).then(() => {
                // Success - reset error count
                if (window._locationUpdateErrors > 0) {
                    window._locationUpdateErrors = 0;
                }
            }).catch((error) => {
                // Track errors for circuit breaker
                window._locationUpdateErrors++;
                console.warn(`⚠️ Location update failed (${window._locationUpdateErrors}/${MAX_ERRORS}):`, error.message);
                
                // Stop all tracking if circuit breaker activates
                if (window._locationUpdateErrors >= MAX_ERRORS) {
                    console.error('🚨 CIRCUIT BREAKER ACTIVATED - Too many location update failures');
                    this.stopDriverTracking();
                }
            });
            
            // Send via WebSocket if available (optional, for real-time)
            if (window.webSocketManager && window.webSocketManager.isConnected && window.webSocketManager.send) {
                window.webSocketManager.send({ 
                    type: 'driver_location', 
                    driverId: driverId, 
                    lat: latitude, 
                    lng: longitude, 
                    timestamp: payload.timestamp, 
                    accuracy: payload.accuracy 
                });
            }
            
            // Update driver's own map
            if (this.driverMap) {
                if (!this.driverPositionMarker) {
                    this.driverPositionMarker = L.marker([latitude, longitude], {
                        icon: L.divIcon({
                            className: 'driver-position',
                            html: '<i class="fas fa-location-arrow" style="color: #00d4ff; font-size: 24px;"></i>',
                            iconSize: [24, 24],
                            iconAnchor: [12, 12]
                        })
                    }).addTo(this.driverMap);
                } else {
                    this.driverPositionMarker.setLatLng([latitude, longitude]);
                }
                
                this.driverMap.setView([latitude, longitude], 15);
                this.loadNearbyBins(latitude, longitude);
            }
        };

        // ============= ENHANCED startDriverTracking =============
        window.MapManager.prototype.startDriverTracking = function() {
            // PREVENT DUPLICATE WATCHERS
            if (window._gpsWatcherActive) {
                console.log('⚠️ GPS watcher already active, skipping duplicate initialization');
                return;
            }

            if (!authManager || !authManager.isDriver()) {
                console.log('Not a driver account, skipping GPS tracking');
                return;
            }

            const currentDriver = authManager.getCurrentUser();
            this.currentDriverId = currentDriver.id;
            
            console.log('🚀 Starting GPS tracking for driver:', currentDriver.name);
            
            // Set global flag IMMEDIATELY
            window._gpsWatcherActive = true;

            // Initialize location if needed
            let currentLocation = dataManager.getDriverLocation(currentDriver.id);
            
            if (!currentLocation || !currentLocation.lat || !currentLocation.lng) {
                currentLocation = {
                    lat: 25.2854 + (Math.random() * 0.02 - 0.01),
                    lng: 51.5310 + (Math.random() * 0.02 - 0.01),
                    timestamp: new Date().toISOString()
                };
                
                dataManager.updateDriverLocation(currentDriver.id, currentLocation.lat, currentLocation.lng);
            }
            
            // Update GPS status
            const gpsStatus = document.getElementById('gpsStatus');
            if (gpsStatus) {
                gpsStatus.innerHTML = `
                    <span style="color: #10b981;">
                        <i class="fas fa-check-circle"></i> Connected
                    </span>
                    <br>
                    <span style="font-size: 0.75rem;">
                        ${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)}
                    </span>
                `;
            }

            // Try to get real GPS
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        console.log('✅ Real GPS obtained');
                        this.simulatedGPS = false;
                        this.updateDriverPosition(position);
                        this.startRealGPSWatch();
                    },
                    (error) => {
                        console.warn('⚠️ GPS not available, using simulated:', error.message);
                        this.simulatedGPS = true;
                        this.startSimulatedGPSUpdates();
                    },
                    { 
                        enableHighAccuracy: true,
                        timeout: 5000,
                        maximumAge: 0
                    }
                );
            } else {
                console.log('📍 Geolocation not supported, using simulated');
                this.simulatedGPS = true;
                this.startSimulatedGPSUpdates();
            }
        };

        // ============= ENHANCED startSimulatedGPSUpdates =============
        window.MapManager.prototype.startSimulatedGPSUpdates = function() {
            // PREVENT DUPLICATE INTERVALS
            if (this.simulatedInterval) {
                console.log('⚠️ Simulated GPS already running, skipping');
                return;
            }

            console.log('📍 Starting simulated GPS updates (every 5 seconds)');
            
            // Update ONLY every 5 seconds to match throttle
            this.simulatedInterval = setInterval(() => {
                if (!this.simulatedGPS || !authManager.getCurrentUser()) {
                    clearInterval(this.simulatedInterval);
                    this.simulatedInterval = null;
                    window._gpsWatcherActive = false;
                    return;
                }
                
                const currentDriver = authManager.getCurrentUser();
                const currentLocation = dataManager.getDriverLocation(currentDriver.id);
                
                if (!currentLocation) return;
                
                // Simulate small movement
                const lat = currentLocation.lat + (Math.random() * 0.002 - 0.001);
                const lng = currentLocation.lng + (Math.random() * 0.002 - 0.001);
                
                const position = {
                    coords: {
                        latitude: lat,
                        longitude: lng,
                        accuracy: 50
                    }
                };
                
                this.updateDriverPosition(position);
            }, 5000); // MATCH the throttle interval exactly
        };

        // ============= ENHANCED startRealGPSWatch =============
        window.MapManager.prototype.startRealGPSWatch = function() {
            // PREVENT DUPLICATE WATCHERS
            if (this.driverWatchId) {
                console.log('⚠️ GPS watcher already running, clearing old watcher');
                navigator.geolocation.clearWatch(this.driverWatchId);
                this.driverWatchId = null;
            }

            console.log('🛰️ Starting real GPS watch');
            
            this.driverWatchId = navigator.geolocation.watchPosition(
                (position) => {
                    this.simulatedGPS = false;
                    this.updateDriverPosition(position);
                },
                (error) => {
                    console.warn('⚠️ GPS watch error:', error.message);
                    if (!this.simulatedGPS) {
                        this.simulatedGPS = true;
                        this.startSimulatedGPSUpdates();
                    }
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 5000 // Use cached position if less than 5 seconds old
                }
            );
        };

        console.log('✅ Map Manager methods patched for resource management');
    }

    // ============= GLOBAL CLEANUP ON PAGE UNLOAD =============
    
    window.addEventListener('beforeunload', () => {
        console.log('🧹 Cleaning up GPS tracking before page unload...');
        
        if (window.mapManager) {
            window.mapManager.stopDriverTracking();
        }
        
        window._gpsWatcherActive = false;
        window._lastLocationSendTime = 0;
        window._locationUpdateErrors = 0;
    });

    // ============= PERIODIC HEALTH CHECK =============
    
    // Check for runaway location updates every 10 seconds
    setInterval(() => {
        const now = Date.now();
        
        // Reset error count if enough time has passed
        if (now - lastErrorResetTime > ERROR_RESET_TIME && window._locationUpdateErrors > 0) {
            console.log('🔄 Resetting location update error count');
            window._locationUpdateErrors = 0;
            lastErrorResetTime = now;
        }
        
        // Log status if errors are accumulating
        if (window._locationUpdateErrors > 0) {
            console.log(`⚠️ Location update errors: ${window._locationUpdateErrors}/${MAX_ERRORS}`);
        }
    }, 10000);

    // ============= INITIALIZATION COMPLETE =============
    
    // NOTE: Do NOT automatically stop/restart tracking on load
    // Reason: This was causing repeated "Driver tracking stopped" messages
    // Reason: app.js already handles driver tracking initialization properly
    // 
    // The safety mechanisms are now in place via method overrides:
    // - Global throttling prevents spam
    // - Duplicate prevention stops multiple watchers
    // - Circuit breaker handles errors
    // 
    // Let the normal application flow handle tracking start/stop

    console.log('✅ CRITICAL Resource Exhaustion Fix Applied');
    console.log('📊 GPS Updates now limited to: 1 update every 5 seconds');
    console.log('🛡️ Circuit breaker: Stops after ' + MAX_ERRORS + ' consecutive errors');

})();
