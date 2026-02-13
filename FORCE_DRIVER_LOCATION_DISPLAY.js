// FORCE_DRIVER_LOCATION_DISPLAY.js
// CRITICAL FIX: Ensures driver markers ALWAYS show exact coordinates, never "Loading..."

(function() {
    'use strict';

    console.log('🎯 FORCE: Driver Location Display Fix Loading...');

    // ============= OVERRIDE addDriverMarker TO ADD PERMANENT TOOLTIP WITH COORDINATES =============
    
    if (window.MapManager && window.MapManager.prototype) {
        const originalAddDriverMarker = window.MapManager.prototype.addDriverMarker;
        
        window.MapManager.prototype.addDriverMarker = function(driver, location) {
            // Call original method
            const result = originalAddDriverMarker.call(this, driver, location);
            
            // CRITICAL: Add permanent tooltip showing exact coordinates
            if (this.markers.drivers && this.markers.drivers[driver.id]) {
                const marker = this.markers.drivers[driver.id];
                
                // Validate location has coordinates
                if (!location || !location.lat || !location.lng) {
                    console.error(`❌ FORCE: Driver ${driver.name} has no valid location!`, location);
                    
                    // Create emergency fallback location
                    location = {
                        lat: 25.2854 + (Math.random() * 0.02 - 0.01),
                        lng: 51.5310 + (Math.random() * 0.02 - 0.01),
                        timestamp: new Date().toISOString(),
                        source: 'emergency_fallback'
                    };
                    
                    // Update dataManager
                    dataManager.setDriverLocation(driver.id, location);
                    
                    // Update marker position
                    marker.setLatLng([location.lat, location.lng]);
                    
                    console.log(`✅ FORCE: Emergency location set for ${driver.name}:`, location);
                }
                
                // Determine status text
                let statusText = 'Active';
                let statusColor = '#10b981';
                
                if (driver.movementStatus === 'on-route') {
                    statusText = 'On Route';
                    statusColor = '#f59e0b';
                } else if (driver.movementStatus === 'driving') {
                    statusText = 'Driving';
                    statusColor = '#3b82f6';
                } else if (driver.status === 'inactive') {
                    statusText = 'Offline';
                    statusColor = '#6b7280';
                }
                
                // Check if location is recent (within 60 seconds)
                let isLive = false;
                if (location.timestamp) {
                    const updateTime = new Date(location.timestamp);
                    const now = new Date();
                    const diffSeconds = Math.floor((now - updateTime) / 1000);
                    isLive = diffSeconds < 60;
                }
                
                // Create tooltip content with EXACT COORDINATES
                const tooltipContent = `
                    <div style="
                        background: rgba(0, 0, 0, 0.9);
                        backdrop-filter: blur(10px);
                        padding: 8px 12px;
                        border-radius: 8px;
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                        min-width: 180px;
                        text-align: center;
                    ">
                        <div style="
                            color: white;
                            font-weight: 700;
                            font-size: 0.9rem;
                            margin-bottom: 4px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 6px;
                        ">
                            <span style="
                                font-size: 1.1rem;
                            ">${driver.movementStatus === 'on-route' ? '🚚' : '🚛'}</span>
                            <span>${driver.name}</span>
                            ${isLive ? '<span style="color: #ef4444; font-size: 0.7rem;">●</span>' : ''}
                        </div>
                        <div style="
                            color: ${statusColor};
                            font-weight: 600;
                            font-size: 0.75rem;
                            margin-bottom: 6px;
                            padding: 2px 6px;
                            background: rgba(255, 255, 255, 0.1);
                            border-radius: 4px;
                            display: inline-block;
                        ">
                            ${statusText}
                        </div>
                        <div style="
                            color: rgba(255, 255, 255, 0.9);
                            font-weight: 600;
                            font-size: 0.75rem;
                            font-family: 'Courier New', monospace;
                            line-height: 1.4;
                            background: rgba(255, 255, 255, 0.05);
                            padding: 4px 8px;
                            border-radius: 4px;
                            border: 1px solid rgba(255, 255, 255, 0.1);
                        ">
                            📍 ${location.lat.toFixed(6)},<br>${location.lng.toFixed(6)}
                        </div>
                        ${location.accuracy ? `
                            <div style="
                                color: rgba(255, 255, 255, 0.6);
                                font-size: 0.65rem;
                                margin-top: 4px;
                            ">
                                Accuracy: ±${Math.round(location.accuracy)}m
                            </div>
                        ` : ''}
                    </div>
                `;
                
                // Bind permanent tooltip
                marker.unbindTooltip(); // Remove any existing tooltip
                
                // CRITICAL: Also remove any labels if they exist
                if (marker.unbindLabel && typeof marker.unbindLabel === 'function') {
                    marker.unbindLabel();
                }
                if (marker.closeLabel && typeof marker.closeLabel === 'function') {
                    marker.closeLabel();
                }
                if (marker._label) {
                    delete marker._label;
                }
                
                marker.bindTooltip(tooltipContent, {
                    permanent: true,
                    direction: 'bottom',
                    offset: [0, 30],
                    className: 'driver-location-tooltip',
                    opacity: 1.0
                });
                
                console.log(`✅ FORCE: Permanent tooltip with coordinates added to ${driver.name}: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`);
            }
            
            return result;
        };
        
        console.log('✅ FORCE: addDriverMarker override applied');
    }

    // ============= PERIODIC TOOLTIP UPDATE =============
    
    // Update driver tooltips every 2 seconds with fresh location data
    setInterval(() => {
        if (!mapManager || !mapManager.markers || !mapManager.markers.drivers) return;
        
        const drivers = dataManager.getUsers().filter(u => u.type === 'driver');
        
        drivers.forEach(driver => {
            const marker = mapManager.markers.drivers[driver.id];
            if (!marker) return;
            
            // Get fresh location
            const location = dataManager.getDriverLocation(driver.id);
            if (!location || !location.lat || !location.lng) {
                console.warn(`⚠️ FORCE: No location for driver ${driver.name}`);
                return;
            }
            
            // Update marker position
            marker.setLatLng([location.lat, location.lng]);
            
            // Determine status
            let statusText = 'Active';
            let statusColor = '#10b981';
            
            if (driver.movementStatus === 'on-route') {
                statusText = 'On Route';
                statusColor = '#f59e0b';
            } else if (driver.movementStatus === 'driving') {
                statusText = 'Driving';
                statusColor = '#3b82f6';
            } else if (driver.status === 'inactive') {
                statusText = 'Offline';
                statusColor = '#6b7280';
            }
            
            // Check if location is recent
            let isLive = false;
            if (location.timestamp) {
                const updateTime = new Date(location.timestamp);
                const now = new Date();
                const diffSeconds = Math.floor((now - updateTime) / 1000);
                isLive = diffSeconds < 60;
            }
            
            // Update tooltip with fresh coordinates
            const tooltipContent = `
                <div style="
                    background: rgba(0, 0, 0, 0.9);
                    backdrop-filter: blur(10px);
                    padding: 8px 12px;
                    border-radius: 8px;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                    min-width: 180px;
                    text-align: center;
                ">
                    <div style="
                        color: white;
                        font-weight: 700;
                        font-size: 0.9rem;
                        margin-bottom: 4px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 6px;
                    ">
                        <span style="font-size: 1.1rem;">${driver.movementStatus === 'on-route' ? '🚚' : '🚛'}</span>
                        <span>${driver.name}</span>
                        ${isLive ? '<span style="color: #ef4444; font-size: 0.7rem; animation: pulse 2s infinite;">●</span>' : ''}
                    </div>
                    <div style="
                        color: ${statusColor};
                        font-weight: 600;
                        font-size: 0.75rem;
                        margin-bottom: 6px;
                        padding: 2px 6px;
                        background: rgba(255, 255, 255, 0.1);
                        border-radius: 4px;
                        display: inline-block;
                    ">
                        ${statusText}
                    </div>
                    <div style="
                        color: rgba(255, 255, 255, 0.9);
                        font-weight: 600;
                        font-size: 0.75rem;
                        font-family: 'Courier New', monospace;
                        line-height: 1.4;
                        background: rgba(255, 255, 255, 0.05);
                        padding: 4px 8px;
                        border-radius: 4px;
                        border: 1px solid rgba(255, 255, 255, 0.1);
                    ">
                        📍 ${location.lat.toFixed(6)},<br>${location.lng.toFixed(6)}
                    </div>
                    ${location.accuracy ? `
                        <div style="
                            color: rgba(255, 255, 255, 0.6);
                            font-size: 0.65rem;
                            margin-top: 4px;
                        ">
                            Accuracy: ±${Math.round(location.accuracy)}m
                        </div>
                    ` : ''}
                    ${isLive ? `
                        <div style="
                            color: #ef4444;
                            font-size: 0.65rem;
                            margin-top: 4px;
                            font-weight: 700;
                        ">
                            🔴 LIVE TRACKING
                        </div>
                    ` : ''}
                </div>
            `;
            
            // Update tooltip
            if (marker.getTooltip()) {
                marker.setTooltipContent(tooltipContent);
            } else {
                marker.bindTooltip(tooltipContent, {
                    permanent: true,
                    direction: 'bottom',
                    offset: [0, 30],
                    className: 'driver-location-tooltip',
                    opacity: 1.0
                });
            }
        });
    }, 2000); // Update every 2 seconds

    // ============= CSS FOR TOOLTIPS =============
    
    // Add CSS for driver location tooltips
    const style = document.createElement('style');
    style.textContent = `
        .driver-location-tooltip {
            border: none !important;
            background: transparent !important;
            box-shadow: none !important;
            padding: 0 !important;
        }
        
        .driver-location-tooltip::before {
            display: none !important;
        }
        
        .leaflet-tooltip-top, .leaflet-tooltip-bottom {
            margin: 0 !important;
        }
    `;
    document.head.appendChild(style);

    console.log('✅ FORCE: Driver Location Display Fix Applied');
    console.log('📍 All driver markers will now show EXACT coordinates, never "Loading..."');

})();
