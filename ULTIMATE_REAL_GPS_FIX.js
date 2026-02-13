// ULTIMATE_REAL_GPS_FIX.js
// NUCLEAR OPTION: Forces REAL GPS acquisition, bypasses all simulated GPS

(function() {
    'use strict';

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🛰️ ULTIMATE REAL GPS FIX - LOADING');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');

    // ============= IMMEDIATE GPS PERMISSION REQUEST =============
    
    function requestGPSPermissionNow() {
        console.log('🔐 Requesting GPS permission NOW...');
        
        if (!navigator.geolocation) {
            console.error('❌ Geolocation not supported by this browser');
            alert('⚠️ Your browser does not support GPS/Location services. Please use a modern browser like Chrome, Edge, or Firefox.');
            return;
        }

        // Request GPS permission immediately
        navigator.geolocation.getCurrentPosition(
            (position) => {
                console.log('✅ GPS PERMISSION GRANTED!');
                console.log('📍 Initial GPS Position:', position.coords);
                console.log(`   Latitude: ${position.coords.latitude}`);
                console.log(`   Longitude: ${position.coords.longitude}`);
                console.log(`   Accuracy: ±${Math.round(position.coords.accuracy)}m`);
                
                // Store this position immediately
                if (authManager && authManager.isDriver()) {
                    const driver = authManager.getCurrentUser();
                    const realLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        timestamp: new Date().toISOString(),
                        lastUpdate: new Date().toISOString(),
                        accuracy: position.coords.accuracy,
                        speed: position.coords.speed || 0,
                        heading: position.coords.heading || 0,
                        source: 'real_gps_initial'
                    };
                    
                    dataManager.setDriverLocation(driver.id, realLocation);
                    console.log('✅ Real GPS location saved to dataManager');
                    
                    // Update GPS status display
                    const gpsStatus = document.getElementById('gpsStatus');
                    if (gpsStatus) {
                        gpsStatus.innerHTML = `
                            <span style="color: #10b981;">
                                <i class="fas fa-satellite-dish"></i> Real GPS Active
                            </span>
                            <br>
                            <span style="font-size: 0.75rem; font-weight: 600;">
                                ${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}
                            </span>
                            <br>
                            <span style="font-size: 0.65rem; color: #6ee7b7;">
                                ±${Math.round(position.coords.accuracy)}m accuracy
                            </span>
                        `;
                    }
                }
            },
            (error) => {
                if (error.code === 1) {
                    console.error('❌ GPS PERMISSION DENIED:', error.message);
                    alert(`⚠️ GPS PERMISSION DENIED\n\nPlease allow location access:\n1. Click the lock icon in the address bar\n2. Set "Location" to "Allow"\n3. Reload the page (F5)`);
                } else if (error.code === 2) {
                    console.warn('⚠️ GPS position unavailable (might be indoors or GPS disabled)');
                } else if (error.code === 3) {
                    console.warn('⚠️ GPS timeout - will retry with longer timeout');
                } else {
                    console.warn('⚠️ GPS error:', error.message, '(code:', error.code + ')');
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 60000, // 60 seconds - allow slow/first-fix and desktop WiFi location
                maximumAge: 0
            }
        );
    }

    // ============= FORCE REAL GPS ON DRIVER LOGIN =============
    
    // Wait for page to fully load
    window.addEventListener('load', () => {
        console.log('📄 Page loaded, checking for driver login...');
        
        // Check every second if driver has logged in
        const checkInterval = setInterval(() => {
            if (authManager && authManager.isDriver()) {
                console.log('✅ Driver detected! Forcing real GPS acquisition...');
                clearInterval(checkInterval);
                
                // Request GPS permission immediately
                setTimeout(() => {
                    requestGPSPermissionNow();
                }, 1000);
            }
        }, 1000);
        
        // Stop checking after 30 seconds
        setTimeout(() => {
            clearInterval(checkInterval);
        }, 30000);
    });

    // ============= OVERRIDE SIMULATED GPS COMPLETELY =============
    
    if (window.MapManager && window.MapManager.prototype) {
        // Disable simulated GPS entirely - force real GPS only
        window.MapManager.prototype.startSimulatedGPSUpdates = function() {
            console.warn('⚠️ BLOCKED: Simulated GPS disabled - will retry real GPS instead');
            
            const gpsStatus = document.getElementById('gpsStatus');
            if (gpsStatus) {
                gpsStatus.innerHTML = `
                    <span style="color: #ef4444;">
                        <i class="fas fa-exclamation-triangle"></i> GPS Required
                    </span>
                    <br>
                    <span style="font-size: 0.75rem; color: #fca5a5;">
                        Click to enable location access
                    </span>
                `;
                gpsStatus.style.cursor = 'pointer';
                gpsStatus.onclick = () => {
                    console.log('🔄 User clicked to enable GPS');
                    requestGPSPermissionNow();
                };
            }
            
            // Don't start simulated GPS - keep trying for real GPS
            console.log('🔄 Will retry real GPS in 5 seconds...');
            setTimeout(() => {
                if (this.simulatedGPS) {
                    console.log('🔄 Retrying real GPS acquisition...');
                    requestGPSPermissionNow();
                }
            }, 5000);
        };
        
        console.log('✅ Simulated GPS BLOCKED - Real GPS only mode activated');
    }

    // ============= GPS DIAGNOSTIC TOOL =============
    
    window.testDriverGPS = function() {
        console.log('');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('🧪 GPS DIAGNOSTIC TEST');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('');
        
        console.log('1. Checking browser support...');
        if (!navigator.geolocation) {
            console.error('❌ Geolocation NOT supported');
            return;
        }
        console.log('✅ Geolocation supported');
        
        console.log('');
        console.log('2. Checking permissions...');
        if (navigator.permissions) {
            navigator.permissions.query({ name: 'geolocation' }).then(permission => {
                console.log(`📍 Permission status: ${permission.state}`);
                if (permission.state === 'denied') {
                    console.error('❌ PERMISSION DENIED - User must enable location in browser settings');
                } else if (permission.state === 'granted') {
                    console.log('✅ Permission granted');
                } else {
                    console.log('⚠️ Permission will be prompted');
                }
            });
        } else {
            console.log('ℹ️ Permissions API not available');
        }
        
        console.log('');
        console.log('3. Attempting GPS acquisition...');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                console.log('');
                console.log('✅✅✅ GPS ACQUISITION SUCCESS! ✅✅✅');
                console.log('');
                console.log('📍 Your exact location:');
                console.log(`   Latitude:  ${position.coords.latitude}`);
                console.log(`   Longitude: ${position.coords.longitude}`);
                console.log(`   Accuracy:  ±${Math.round(position.coords.accuracy)} meters`);
                if (position.coords.altitude) {
                    console.log(`   Altitude:  ${Math.round(position.coords.altitude)} meters`);
                }
                if (position.coords.speed) {
                    console.log(`   Speed:     ${Math.round(position.coords.speed * 3.6)} km/h`);
                }
                if (position.coords.heading) {
                    console.log(`   Heading:   ${Math.round(position.coords.heading)}°`);
                }
                console.log('');
                console.log('✅ GPS is working correctly on this device!');
                console.log('═══════════════════════════════════════════════════════════');
            },
            (error) => {
                console.log('');
                console.error('❌❌❌ GPS ACQUISITION FAILED ❌❌❌');
                console.log('');
                console.error(`Error: ${error.message}`);
                console.error(`Code: ${error.code}`);
                console.log('');
                
                if (error.code === 1) {
                    console.error('❌ PERMISSION DENIED');
                    console.log('');
                    console.log('👉 TO FIX:');
                    console.log('   1. Click the lock icon (🔒) in address bar');
                    console.log('   2. Find "Location" permission');
                    console.log('   3. Change to "Allow"');
                    console.log('   4. Reload page (F5)');
                } else if (error.code === 2) {
                    console.error('❌ POSITION UNAVAILABLE');
                    console.log('');
                    console.log('👉 POSSIBLE CAUSES:');
                    console.log('   - GPS/Location services disabled on device');
                    console.log('   - Poor GPS signal (try moving outdoors)');
                    console.log('   - Hardware GPS not available');
                } else if (error.code === 3) {
                    console.error('❌ TIMEOUT');
                    console.log('');
                    console.log('👉 GPS taking too long, try:');
                    console.log('   - Moving to location with better sky visibility');
                    console.log('   - Ensuring device GPS is enabled');
                    console.log('   - Running test again');
                }
                
                console.log('');
                console.log('═══════════════════════════════════════════════════════════');
            },
            {
                enableHighAccuracy: true,
                timeout: 30000,
                maximumAge: 0
            }
        );
        
        console.log('⏳ Waiting for GPS... (up to 30 seconds)');
    };

    // ============= AUTO-REQUEST GPS ON DRIVER LOGIN =============
    
    // Monitor for driver login
    const originalShowDriverInterface = window.App && window.App.prototype && window.App.prototype.showDriverInterface;
    
    if (originalShowDriverInterface) {
        window.App.prototype.showDriverInterface = function() {
            console.log('🚗 Driver interface shown - requesting GPS permission NOW');
            
            // Call original
            originalShowDriverInterface.call(this);
            
            // Immediately request GPS
            setTimeout(() => {
                console.log('🛰️ ULTIMATE: Forcing real GPS request...');
                requestGPSPermissionNow();
            }, 500);
        };
    }

    // ============= HELP MESSAGE =============
    
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 GPS TROUBLESHOOTING');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('If you see "Simulated GPS" instead of "Real GPS":');
    console.log('');
    console.log('1️⃣  RUN GPS TEST:');
    console.log('   Type in console: testDriverGPS()');
    console.log('');
    console.log('2️⃣  CHECK PERMISSIONS:');
    console.log('   - Click lock icon (🔒) in address bar');
    console.log('   - Set Location to "Allow"');
    console.log('   - Reload page');
    console.log('');
    console.log('3️⃣  ENABLE DEVICE GPS:');
    console.log('   - Windows: Settings → Privacy → Location → On');
    console.log('   - Mobile: Settings → Location/GPS → On');
    console.log('');
    console.log('4️⃣  USE HTTPS:');
    console.log('   - Modern browsers require HTTPS for GPS');
    console.log('   - localhost is OK for testing');
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');

})();
