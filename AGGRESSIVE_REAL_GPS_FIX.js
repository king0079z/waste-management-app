// AGGRESSIVE_REAL_GPS_FIX.js
// CRITICAL: Forces system to get REAL GPS from driver's device, not simulated

(function() {
    'use strict';

    console.log('🛰️ AGGRESSIVE REAL GPS: Loading...');

    // ============= FORCE REAL GPS ACQUISITION =============
    
    if (window.MapManager && window.MapManager.prototype) {
        
        // Override startDriverTracking with AGGRESSIVE real GPS acquisition
        const originalStartDriverTracking = window.MapManager.prototype.startDriverTracking;
        
        window.MapManager.prototype.startDriverTracking = function() {
            if (window._gpsWatcherActive) {
                console.log('⚠️ GPS watcher already active');
                return;
            }

            if (!authManager || !authManager.isDriver()) {
                console.log('Not a driver account');
                return;
            }

            const currentDriver = authManager.getCurrentUser();
            this.currentDriverId = currentDriver.id;
            window._gpsWatcherActive = true;
            
            console.log('🛰️ AGGRESSIVE: Starting REAL GPS acquisition for:', currentDriver.name);
            
            // Set initial location
            let currentLocation = dataManager.getDriverLocation(currentDriver.id);
            if (!currentLocation || !currentLocation.lat || !currentLocation.lng) {
                currentLocation = {
                    lat: 25.2854,
                    lng: 51.5310,
                    timestamp: new Date().toISOString()
                };
                dataManager.updateDriverLocation(currentDriver.id, currentLocation.lat, currentLocation.lng);
            }
            
            // Update GPS status to show we're trying to get real GPS
            const gpsStatus = document.getElementById('gpsStatus');
            if (gpsStatus) {
                gpsStatus.innerHTML = `
                    <span style="color: #f59e0b;">
                        <i class="fas fa-circle-notch fa-spin"></i> Acquiring Real GPS...
                    </span>
                    <br>
                    <span style="font-size: 0.75rem; color: #94a3b8;">
                        Please allow location access
                    </span>
                `;
            }

            // AGGRESSIVE REAL GPS ACQUISITION - Multiple attempts with increasing timeout
            const attemptRealGPS = (attemptNumber = 1, maxAttempts = 3) => {
                if (!navigator.geolocation) {
                    console.warn('📍 Geolocation not supported by browser');
                    this.simulatedGPS = true;
                    this.startSimulatedGPSUpdates();
                    return;
                }

                const timeout = attemptNumber * 10000; // 10s, 20s, 30s
                console.log(`🛰️ AGGRESSIVE: GPS Attempt ${attemptNumber}/${maxAttempts} (timeout: ${timeout}ms)`);

                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        // SUCCESS - Got real GPS!
                        console.log('✅ AGGRESSIVE: REAL GPS OBTAINED!', position.coords);
                        console.log(`📍 Exact Location: ${position.coords.latitude}, ${position.coords.longitude}`);
                        console.log(`🎯 Accuracy: ±${Math.round(position.coords.accuracy)}m`);
                        
                        this.simulatedGPS = false;
                        
                        // Update GPS status to show REAL GPS
                        const gpsStatus = document.getElementById('gpsStatus');
                        if (gpsStatus) {
                            gpsStatus.innerHTML = `
                                <span style="color: #10b981;">
                                    <i class="fas fa-satellite-dish"></i> Real GPS Active
                                </span>
                                <br>
                                <span style="font-size: 0.75rem;">
                                    ${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}
                                </span>
                                <br>
                                <span style="font-size: 0.65rem; color: #6ee7b7;">
                                    ±${Math.round(position.coords.accuracy)}m accuracy
                                </span>
                            `;
                        }
                        
                        // Update position and start continuous watch
                        this.updateDriverPosition(position);
                        this.startRealGPSWatch();
                        
                        console.log('✅ AGGRESSIVE: Real GPS tracking active');
                    },
                    (error) => {
                        // ERROR - Failed to get GPS
                        console.warn(`⚠️ AGGRESSIVE: GPS Attempt ${attemptNumber} failed:`, error.message);
                        console.warn(`Error code: ${error.code}, Message: ${error.message}`);
                        
                        if (attemptNumber < maxAttempts) {
                            // Retry with longer timeout
                            console.log(`🔄 AGGRESSIVE: Retrying GPS acquisition (attempt ${attemptNumber + 1}/${maxAttempts})...`);
                            setTimeout(() => {
                                attemptRealGPS(attemptNumber + 1, maxAttempts);
                            }, 2000); // Wait 2 seconds before retry
                        } else {
                            // All attempts failed - fall back to simulated
                            console.warn('⚠️ AGGRESSIVE: All GPS attempts failed, using simulated GPS');
                            
                            const gpsStatus = document.getElementById('gpsStatus');
                            if (gpsStatus) {
                                gpsStatus.innerHTML = `
                                    <span style="color: #3b82f6;">
                                        <i class="fas fa-location-arrow"></i> Simulated GPS
                                    </span>
                                    <br>
                                    <span style="font-size: 0.75rem;">
                                        ${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)}
                                    </span>
                                    <br>
                                    <span style="font-size: 0.65rem; color: #94a3b8;">
                                        Real GPS unavailable
                                    </span>
                                `;
                            }
                            
                            this.simulatedGPS = true;
                            this.startSimulatedGPSUpdates();
                        }
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: timeout,
                        maximumAge: 0
                    }
                );
            };

            // Start GPS acquisition
            attemptRealGPS(1, 3);
        };

        // ============= ENHANCED startRealGPSWatch =============
        window.MapManager.prototype.startRealGPSWatch = function() {
            if (this.driverWatchId) {
                console.log('⚠️ GPS watcher already running, clearing old watcher');
                navigator.geolocation.clearWatch(this.driverWatchId);
                this.driverWatchId = null;
            }

            console.log('🛰️ AGGRESSIVE: Starting continuous real GPS watch');
            
            this.driverWatchId = navigator.geolocation.watchPosition(
                (position) => {
                    console.log(`📍 Real GPS update: ${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)} (±${Math.round(position.coords.accuracy)}m)`);
                    
                    this.simulatedGPS = false;
                    
                    // Update GPS status display with real coordinates
                    const gpsStatus = document.getElementById('gpsStatus');
                    if (gpsStatus) {
                        gpsStatus.innerHTML = `
                            <span style="color: #10b981;">
                                <i class="fas fa-satellite-dish"></i> Real GPS Active
                            </span>
                            <br>
                            <span style="font-size: 0.75rem;">
                                ${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}
                            </span>
                            <br>
                            <span style="font-size: 0.65rem; color: #6ee7b7;">
                                ±${Math.round(position.coords.accuracy)}m
                            </span>
                        `;
                    }
                    
                    this.updateDriverPosition(position);
                },
                (error) => {
                    console.warn('⚠️ GPS watch error:', error.message);
                    
                    // Only fall back to simulated if we lose GPS signal
                    if (!this.simulatedGPS && error.code === error.POSITION_UNAVAILABLE) {
                        console.warn('📍 Lost GPS signal, switching to simulated');
                        this.simulatedGPS = true;
                        this.startSimulatedGPSUpdates();
                    }
                },
                {
                    enableHighAccuracy: true,
                    timeout: 15000, // 15 seconds per update (generous)
                    maximumAge: 5000 // Use cached position if less than 5 seconds old
                }
            );
            
            console.log('✅ AGGRESSIVE: Real GPS watch active');
        };

        console.log('✅ AGGRESSIVE: GPS methods overridden');
    }

    // ============= GPS PERMISSION CHECK =============
    
    // Check and request GPS permissions explicitly
    async function checkGPSPermissions() {
        if (!navigator.permissions) {
            console.log('ℹ️ Permissions API not available');
            return 'prompt'; // Will prompt when we try to use it
        }

        try {
            const permission = await navigator.permissions.query({ name: 'geolocation' });
            console.log(`📍 GPS Permission status: ${permission.state}`);
            
            permission.onchange = () => {
                console.log(`📍 GPS Permission changed to: ${permission.state}`);
                
                if (permission.state === 'granted' && authManager && authManager.isDriver()) {
                    console.log('✅ GPS permission granted! Attempting to get real location...');
                    
                    // Try to get GPS again now that permission is granted
                    if (window.mapManager && window.mapManager.simulatedGPS) {
                        window.mapManager.stopDriverTracking();
                        setTimeout(() => {
                            window.mapManager.startDriverTracking();
                        }, 500);
                    }
                }
            };
            
            return permission.state;
        } catch (error) {
            console.warn('⚠️ Could not check GPS permissions:', error.message);
            return 'prompt';
        }
    }

    // Check permissions on load
    setTimeout(() => {
        if (authManager && authManager.isDriver()) {
            checkGPSPermissions().then(status => {
                if (status === 'denied') {
                    console.error('❌ GPS permission denied by user');
                    alert('⚠️ Location access is required for driver tracking. Please allow location access in your browser settings.');
                } else if (status === 'granted') {
                    console.log('✅ GPS permission already granted');
                } else {
                    console.log('📍 GPS permission will be requested when needed');
                }
            });
        }
    }, 1000);

    // ============= VISUAL FEEDBACK =============
    
    // Add visual indicator when using real vs simulated GPS
    setInterval(() => {
        if (!authManager || !authManager.isDriver()) return;
        if (!window.mapManager) return;
        
        const gpsStatus = document.getElementById('gpsStatus');
        if (!gpsStatus) return;
        
        const isSimulated = window.mapManager.simulatedGPS;
        const currentDriver = authManager.getCurrentUser();
        const location = dataManager.getDriverLocation(currentDriver.id);
        
        if (location && location.lat && location.lng) {
            if (isSimulated) {
                // Show simulated GPS with blue color
                gpsStatus.innerHTML = `
                    <span style="color: #3b82f6;">
                        <i class="fas fa-location-arrow"></i> Simulated GPS
                    </span>
                    <br>
                    <span style="font-size: 0.75rem;">
                        ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}
                    </span>
                    <br>
                    <span style="font-size: 0.65rem; color: #94a3b8;">
                        Click to enable real GPS
                    </span>
                `;
                
                // Allow clicking to retry real GPS
                gpsStatus.style.cursor = 'pointer';
                gpsStatus.onclick = () => {
                    console.log('🔄 User requested real GPS retry');
                    if (window.mapManager) {
                        window.mapManager.stopDriverTracking();
                        setTimeout(() => {
                            window.mapManager.startDriverTracking();
                        }, 500);
                    }
                };
            } else {
                // Show real GPS with green color
                gpsStatus.innerHTML = `
                    <span style="color: #10b981;">
                        <i class="fas fa-satellite-dish"></i> Real GPS Active
                    </span>
                    <br>
                    <span style="font-size: 0.75rem;">
                        ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}
                    </span>
                    <br>
                    <span style="font-size: 0.65rem; color: #6ee7b7;">
                        ±${location.accuracy ? Math.round(location.accuracy) : 20}m
                    </span>
                `;
                gpsStatus.style.cursor = 'default';
                gpsStatus.onclick = null;
            }
        }
    }, 3000); // Update every 3 seconds

    console.log('✅ AGGRESSIVE: Real GPS Fix Applied');
    console.log('🎯 System will now try 3 times with 10-30 second timeouts to get real GPS');
    console.log('📍 Only falls back to simulated if all attempts fail');

})();
