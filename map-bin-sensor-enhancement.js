// map-bin-sensor-enhancement.js - Enhance bin markers with sensor badges

(function() {
    // Map Bin-Sensor Enhancement - reduces logging for performance
    
    // Wait for mapManager to be available
    const waitForMapManager = setInterval(() => {
        if (typeof mapManager !== 'undefined' && mapManager.addBinMarker) {
            clearInterval(waitForMapManager);
            enhanceMapManager();
        }
    }, 50);
    
    // Try immediately in case mapManager is already available
    if (typeof mapManager !== 'undefined' && mapManager.addBinMarker) {
        clearInterval(waitForMapManager);
        enhanceMapManager();
    }
    
    function enhanceMapManager() {
        
        // Store original functions
        const originalAddBinMarker = mapManager.addBinMarker;
        const originalCreateBinPopup = mapManager.createBinPopup;
        
        /**
         * Enhanced addBinMarker with sensor badge
         */
        mapManager.addBinMarker = function(bin) {
            if (!this.map || !bin.lat || !bin.lng) return;
            
            // IMPROVED: Check if marker exists and if popup is open - DON'T replace if popup is open
            if (this.markers.bins && this.markers.bins[bin.id]) {
                const existingMarker = this.markers.bins[bin.id];
                
                // CRITICAL FIX: If popup is open, DO NOTHING - don't update, don't replace
                if (existingMarker.isPopupOpen && existingMarker.isPopupOpen()) {
                    console.log(`⏸️ Skipping marker update for ${bin.id} - popup is open`);
                    return; // Don't touch the marker or popup at all
                }
                
                // Remove existing marker since popup is not open
                try {
                    if (this.layers.bins && this.layers.bins.hasLayer(existingMarker)) {
                        this.layers.bins.removeLayer(existingMarker);
                    }
                    if (this.map && this.map.hasLayer(existingMarker)) {
                        this.map.removeLayer(existingMarker);
                    }
                } catch (error) {
                    // Silent error handling
                }
                
                delete this.markers.bins[bin.id];
            }
            
            // Get fill level - prioritize sensor data
            const sensorFillLevel = (bin.sensorData?.fillLevel !== null && bin.sensorData?.fillLevel !== undefined)
                ? bin.sensorData.fillLevel
                : null;
            const fillLevel = sensorFillLevel !== null ? sensorFillLevel : (bin.fill || bin.fillLevel || 0);
            const color = this.getBinColor(bin);
            const pulseClass = (bin.status === 'critical' || bin.status === 'fire-risk') ? 'pulse-danger' : '';
            
            // Calculate fill height for visual indicator
            const fillHeight = Math.max(10, (fillLevel / 100) * 40);
            
            // Status icon based on fill level
            let statusIcon = '🗑️';
            if (fillLevel >= 90) statusIcon = '🚨';
            else if (fillLevel >= 75) statusIcon = '⚠️';
            else if (fillLevel <= 25) statusIcon = '✅';
            
            // Check if bin has sensor
            const hasSensor = bin.hasSensor || bin.sensorIMEI;
            // Determine sensor status - consider online if sensor data exists and is recent
            const hasRecentData = bin.sensorData && (bin.sensorData.fillLevel !== undefined || bin.sensorData.battery);
            const lastUpdate = bin.lastSensorUpdate || bin.sensorData?.lastSeen;
            const isRecent = lastUpdate && (Date.now() - new Date(lastUpdate).getTime()) < 300000; // 5 minutes
            const sensorStatus = (hasRecentData || isRecent) ? 'online' : (bin.sensorData?.status || 'offline');
            const sensorBattery = bin.sensorData?.battery || bin.batteryLevel || 0;
            
            // Sensor badge
            const sensorBadge = hasSensor ? `
                <div style="
                    position: absolute;
                    top: -5px;
                    right: -5px;
                    width: 20px;
                    height: 20px;
                    background: ${sensorStatus === 'online' ? '#10b981' : '#6b7280'};
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.7rem;
                    z-index: 10;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
                    border: 2px solid white;
                " title="Sensor: ${sensorStatus}">
                    📡
                </div>
            ` : '';
            
            const icon = L.divIcon({
                className: 'custom-div-icon',
                html: `
                    <div class="${pulseClass}" style="
                        width: 55px; 
                        height: 55px; 
                        border-radius: 50%; 
                        display: flex; 
                        flex-direction: column;
                        align-items: center; 
                        justify-content: center; 
                        color: white; 
                        font-weight: bold; 
                        box-shadow: 0 6px 25px rgba(0,0,0,0.4); 
                        cursor: pointer; 
                        position: relative;
                        border: 3px solid ${hasSensor ? '#10b981' : 'rgba(255, 255, 255, 0.4)'};
                        transition: all 0.3s ease;
                        background: linear-gradient(180deg, rgba(0,0,0,0.1) 0%, ${color} 100%);
                        overflow: hidden;
                    ">
                        ${sensorBadge}
                        
                        <!-- Fill Level Visual Indicator -->
                        <div style="
                            position: absolute;
                            bottom: 3px;
                            left: 3px;
                            right: 3px;
                            height: ${fillHeight}px;
                            background: linear-gradient(180deg, ${color} 0%, rgba(255,255,255,0.2) 100%);
                            border-radius: 0 0 25px 25px;
                            transition: height 0.3s ease;
                            z-index: 1;
                        "></div>
                        
                        <!-- Content -->
                        <div style="
                            position: relative;
                            z-index: 2;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            text-shadow: 0 2px 6px rgba(0,0,0,0.8);
                        ">
                            <span style="font-size: 1.2rem; margin-bottom: -2px;">${statusIcon}</span>
                            <span style="font-size: 0.75rem; font-weight: bold;">${fillLevel}%</span>
                        </div>
                        
                        <!-- Glow effect for high priority -->
                        ${fillLevel >= 85 ? `
                            <div style="
                                position: absolute;
                                top: -2px; left: -2px; right: -2px; bottom: -2px;
                                border-radius: 50%;
                                background: radial-gradient(circle, ${color}40 0%, transparent 70%);
                                animation: pulse 2s infinite;
                                z-index: 0;
                            "></div>
                        ` : ''}
                    </div>
                `,
                iconSize: [55, 55],
                iconAnchor: [27, 27]
            });
            
            let popupContent;
            try {
                popupContent = this.createBinPopup(bin);
            } catch (error) {
                console.error(`❌ Error creating popup content for bin ${bin.id}:`, error);
                // Fallback popup content
                popupContent = `
                    <div style="padding: 15px; background: rgba(15, 23, 42, 0.95); border-radius: 8px; color: #e2e8f0; min-width: 200px;">
                        <h3 style="margin: 0 0 10px 0; color: #3b82f6;">🗑️ ${bin.id}</h3>
                        <p style="margin: 5px 0;">📍 ${bin.location || 'Unknown location'}</p>
                        <p style="margin: 5px 0;">📊 Fill Level: ${bin.fill || bin.fillLevel || 0}%</p>
                        <p style="margin: 5px 0; font-size: 0.8em; color: #94a3b8;">Click for more details</p>
                    </div>
                `;
            }
            
            const marker = L.marker([bin.lat, bin.lng], { icon })
                .bindPopup(popupContent, {
                    maxWidth: 420,
                    minWidth: 320,
                    className: 'bin-popup enhanced-popup',
                    closeButton: true,
                    autoPan: true,
                    autoPanPadding: [50, 50],
                    autoClose: false,       // Don't auto-close when another popup opens
                    closeOnClick: false,    // Don't close when clicking map
                    closeOnEscapeKey: true, // Allow closing with ESC
                    keepInView: true,
                    offset: [0, -10],
                    interactive: true       // Keep popup interactive
                });
            
            // Keep popup open when hovering over it
            // Track popup state to prevent premature closing
            let popupIsActive = false;
            let popupContainer = null;
            
            marker.on('popupopen', async function() {
                popupIsActive = true;
                
                const popup = this.getPopup();
                if (popup && popup._container) {
                    popupContainer = popup._container;
                    
                    // Prevent any click events from bubbling up to close the popup
                    popupContainer.addEventListener('click', function(e) {
                        e.stopPropagation();
                    });
                    popupContainer.addEventListener('mousedown', function(e) {
                        e.stopPropagation();
                    });
                    popupContainer.addEventListener('mouseup', function(e) {
                        e.stopPropagation();
                    });
                    popupContainer.addEventListener('mouseenter', function(e) {
                        e.stopPropagation();
                        popupIsActive = true;
                    });
                    popupContainer.addEventListener('mouseleave', function(e) {
                        e.stopPropagation();
                    });
                    
                    // Prevent L.DomEvent propagation to map - CRITICAL
                    L.DomEvent.disableClickPropagation(popupContainer);
                    L.DomEvent.disableScrollPropagation(popupContainer);
                    
                    // Additional safeguard: prevent any touch events on mobile
                    if ('ontouchstart' in window) {
                        popupContainer.addEventListener('touchstart', function(e) {
                            e.stopPropagation();
                        });
                        popupContainer.addEventListener('touchend', function(e) {
                            e.stopPropagation();
                        });
                    }
                }
            });
            
            marker.on('popupclose', function(e) {
                popupIsActive = false;
                popupContainer = null;
            });
            
            marker.on('click', function(e) {
                try {
                    // CRITICAL: Stop all event propagation
                    if (e) {
                        e.originalEvent?.stopPropagation();
                        e.originalEvent?.preventDefault();
                        if (L.DomEvent) {
                            L.DomEvent.stopPropagation(e);
                            L.DomEvent.preventDefault(e);
                        }
                    }
                    
                    // Prevent double-opening if already open
                    if (this.isPopupOpen && this.isPopupOpen()) {
                        console.log(`%cℹ️ Popup already open for ${bin.id}`, 'background: #3b82f6; color: white; padding: 2px 6px;');
                        return;
                    }
                    console.log(`%c🖱️ ENHANCED: Opening popup for ${bin.id}`, 'background: #8b5cf6; color: white; font-weight: bold; padding: 4px 8px;');
                    this.openPopup();
                    
                    // Lock popup open temporarily
                    const marker = this;
                    setTimeout(() => {
                        if (marker.isPopupOpen && marker.isPopupOpen()) {
                            const popup = marker.getPopup();
                            if (popup && popup._close) {
                                const originalClose = popup._close;
                                popup._close = function() {
                                    console.log(`%c⛔ BLOCKED close for ${bin.id}`, 'background: #dc2626; color: white; padding: 4px;');
                                };
                                setTimeout(() => { popup._close = originalClose; }, 3000);
                            }
                        }
                    }, 50);
                } catch (error) {
                    console.error(`❌ Error opening popup for bin ${bin.id}:`, error);
                }
            });
            
            // Add marker to bins layer or map
            if (this.layers.bins) {
                marker.addTo(this.layers.bins);
            } else if (this.map) {
                marker.addTo(this.map);
            }
            
            this.markers.bins[bin.id] = marker;
        };
        
        /**
         * Enhanced createBinPopup with sensor data
         */
        mapManager.createBinPopup = function(bin) {
            // Defensive: Ensure bin exists
            if (!bin) {
                console.error('❌ createBinPopup called with null/undefined bin');
                return '<div style="padding: 20px; color: #ef4444;">Error: Bin data not available</div>';
            }
            
            // Safely get color with fallback
            let color = '#10b981'; // Default green
            try {
                color = this.getBinColor(bin) || '#10b981';
            } catch (e) {
                console.warn('⚠️ Error getting bin color:', e);
            }
            
            // Get fill level - prioritize sensor data
            const sensorFillLevel = (bin.sensorData?.fillLevel !== null && bin.sensorData?.fillLevel !== undefined)
                ? bin.sensorData.fillLevel
                : null;
            const fillLevel = sensorFillLevel !== null ? sensorFillLevel : (bin.fill || bin.fillLevel || 0);
            
            // Safely get prediction
            let prediction = null;
            try {
                if (typeof dataManager !== 'undefined' && typeof dataManager.predictBinFillTime === 'function') {
                    prediction = dataManager.predictBinFillTime(bin.id);
                }
            } catch (e) {
                console.warn('⚠️ Error getting bin prediction:', e);
            }
            const statusIcon = fillLevel >= 85 ? '🔥' : fillLevel >= 70 ? '⚠️' : '✅';
            const statusText = fillLevel >= 85 ? 'Critical' : fillLevel >= 70 ? 'Warning' : 'Normal';
            
            // Get capacity and calculate available space
            const capacity = bin.capacity || 100;
            const available = Math.max(0, capacity - (capacity * fillLevel / 100));
            
            // Sensor data - always show battery and temperature if available on bin
            const hasSensor = bin.hasSensor || bin.sensorIMEI;
            const sensorIMEI = bin.sensorIMEI || 'N/A';
            // Determine sensor status - consider online if sensor data exists with valid readings
            const hasValidSensorData = bin.sensorData && (
                bin.sensorData.fillLevel !== undefined || 
                bin.sensorData.battery !== undefined ||
                bin.sensorData.temperature !== undefined
            );
            const lastSensorUpdate = bin.lastSensorUpdate || bin.sensorData?.lastSeen;
            const isRecentUpdate = lastSensorUpdate && (Date.now() - new Date(lastSensorUpdate).getTime()) < 300000;
            const sensorStatus = (hasValidSensorData || isRecentUpdate) ? 'online' : 'offline';
            
            // Get sensor data - prioritize sensorData (most accurate), fallback to bin properties
            // This ensures we show the latest sensor readings from the API
            let sensorBattery = null;
            if (bin.sensorData && bin.sensorData.battery !== null && bin.sensorData.battery !== undefined) {
                sensorBattery = parseFloat(bin.sensorData.battery);
            } else if (bin.batteryLevel !== null && bin.batteryLevel !== undefined) {
                sensorBattery = parseFloat(bin.batteryLevel);
            }
            // Validate battery value
            if (sensorBattery !== null && (isNaN(sensorBattery) || sensorBattery < 0 || sensorBattery > 100)) {
                sensorBattery = null;
            }
            
            let sensorTemperature = null;
            if (bin.sensorData && bin.sensorData.temperature !== null && bin.sensorData.temperature !== undefined) {
                sensorTemperature = parseFloat(bin.sensorData.temperature);
            } else if (bin.temperature !== null && bin.temperature !== undefined) {
                sensorTemperature = parseFloat(bin.temperature);
            }
            // Validate temperature value (reasonable range: -50 to 100°C)
            if (sensorTemperature !== null && (isNaN(sensorTemperature) || sensorTemperature < -50 || sensorTemperature > 100)) {
                sensorTemperature = null;
            }
            
            // Log what we're using for debugging
            if (hasSensor) {
                console.log(`📊 Bin ${bin.id} sensor data:`, {
                    battery: sensorBattery !== null ? `${sensorBattery}%` : 'N/A',
                    batterySource: bin.sensorData?.battery !== undefined ? 'sensorData.battery' : (bin.batteryLevel !== undefined ? 'bin.batteryLevel' : 'not found'),
                    temperature: sensorTemperature !== null ? `${sensorTemperature}°C` : 'N/A',
                    tempSource: bin.sensorData?.temperature !== undefined ? 'sensorData.temperature' : (bin.temperature !== undefined ? 'bin.temperature' : 'not found'),
                    fill: fillLevel,
                    fillSource: bin.sensorData?.fillLevel !== undefined ? 'sensorData.fillLevel' : (bin.fillLevel !== undefined ? 'bin.fillLevel' : (bin.fill !== undefined ? 'bin.fill' : 'not found'))
                });
            }
            const sensorSignal = bin.sensorData?.signal || bin.signalStrength || 0;
            const sensorLastSeen = bin.sensorData?.lastSeen || bin.lastUpdate || 'Never';
            const binType = bin.type || 'General';
            
            // Format last collection - calculate days ago
            let lastCollection = 'Never';
            if (bin.lastCollection && bin.lastCollection !== 'Never') {
                try {
                    const lastDate = new Date(bin.lastCollection);
                    // Check if date is valid
                    if (isNaN(lastDate.getTime())) {
                        // If date is invalid, try to use the original value or format it
                        if (typeof bin.lastCollection === 'string') {
                            lastCollection = bin.lastCollection;
                        } else {
                            lastCollection = 'Never';
                        }
                    } else {
                        const now = new Date();
                        const diffTime = Math.abs(now - lastDate);
                        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                        
                        // Check if diffDays is valid (not NaN)
                        if (isNaN(diffDays)) {
                            lastCollection = 'Never';
                        } else if (diffDays === 0) {
                            const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
                            if (isNaN(diffHours)) {
                                lastCollection = 'Today';
                            } else if (diffHours === 0) {
                                const diffMinutes = Math.floor(diffTime / (1000 * 60));
                                lastCollection = (isNaN(diffMinutes) || diffMinutes < 1) ? 'Just now' : `${diffMinutes} min ago`;
                            } else {
                                lastCollection = `${diffHours}h ago`;
                            }
                        } else if (diffDays === 1) {
                            lastCollection = '1 day ago';
                        } else {
                            lastCollection = `${diffDays} days ago`;
                        }
                    }
                } catch (e) {
                    // If error occurs, use original value or default
                    if (typeof bin.lastCollection === 'string' && bin.lastCollection !== 'Never') {
                        lastCollection = bin.lastCollection;
                    } else {
                        lastCollection = 'Never';
                    }
                }
            }
            
            // Helper functions for color manipulation
            const darkenColor = (color, percent) => {
                const num = parseInt(color.replace("#",""), 16);
                const amt = Math.round(2.55 * percent);
                const R = Math.max(0, Math.min(255, (num >> 16) + amt));
                const G = Math.max(0, Math.min(255, (num >> 8 & 0x00FF) + amt));
                const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
                return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
            };
            
            const lightenColor = (color, percent) => {
                const num = parseInt(color.replace("#",""), 16);
                const amt = Math.round(2.55 * percent);
                const R = Math.min(255, Math.max(0, (num >> 16) - amt));
                const G = Math.min(255, Math.max(0, (num >> 8 & 0x00FF) - amt));
                const B = Math.min(255, Math.max(0, (num & 0x0000FF) - amt));
                return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
            };
            
            // Sensor section HTML
            const sensorSection = hasSensor ? `
                <div style="
                    background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%);
                    border: 1px solid rgba(16, 185, 129, 0.3);
                    border-radius: 12px;
                    padding: 1rem;
                    margin-bottom: 1rem;
                    backdrop-filter: blur(10px);
                    box-shadow: 0 4px 16px rgba(16, 185, 129, 0.15);
                ">
                    <div style="
                        display: flex;
                        align-items: center;
                        gap: 0.75rem;
                        margin-bottom: 0.875rem;
                    ">
                        <div style="
                            width: 40px;
                            height: 40px;
                            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                            border-radius: 10px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 1.25rem;
                            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
                        ">
                            📡
                        </div>
                        <div>
                            <div style="
                                font-weight: 700;
                                color: #10b981;
                                font-size: 0.9rem;
                                margin-bottom: 0.125rem;
                            ">
                                IoT Sensor Connected
                            </div>
                            <div style="
                                font-size: 0.75rem;
                                color: #94a3b8;
                                font-family: monospace;
                            ">
                                ${sensorIMEI.length > 15 ? sensorIMEI.substring(0, 15) + '...' : sensorIMEI}
                            </div>
                        </div>
                    </div>
                    
                    <div style="
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 0.75rem;
                    ">
                        <div style="
                            background: rgba(255,255,255,0.05);
                            border-radius: 8px;
                            padding: 0.75rem;
                        ">
                            <div style="
                                color: #94a3b8;
                                font-size: 0.7rem;
                                font-weight: 500;
                                margin-bottom: 0.25rem;
                                text-transform: uppercase;
                                letter-spacing: 0.5px;
                            ">
                                Status
                            </div>
                            <div style="
                                font-weight: 700;
                                color: ${sensorStatus === 'online' ? '#10b981' : '#ef4444'};
                                font-size: 0.875rem;
                            ">
                                ${sensorStatus === 'online' ? '🟢 Online' : '🔴 Offline'}
                            </div>
                        </div>
                        
                        <div style="
                            background: rgba(255,255,255,0.05);
                            border-radius: 8px;
                            padding: 0.75rem;
                        ">
                            <div style="
                                color: #94a3b8;
                                font-size: 0.7rem;
                                font-weight: 500;
                                margin-bottom: 0.25rem;
                                text-transform: uppercase;
                                letter-spacing: 0.5px;
                            ">
                                Battery
                            </div>
                            <div style="
                                font-weight: 700;
                                color: ${sensorBattery > 20 ? '#10b981' : '#ef4444'};
                                font-size: 0.875rem;
                            ">
                                🔋 ${sensorBattery !== null && !isNaN(sensorBattery) ? `${Math.round(sensorBattery)}%` : 'N/A'}
                            </div>
                        </div>
                    </div>
                </div>
            ` : '';
            
            return `
                <div style="
                    min-width: 320px;
                    max-width: 380px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                ">
                    <!-- Header with gradient -->
                    <div style="
                        background: linear-gradient(135deg, ${color} 0%, ${darkenColor(color, 20)} 100%);
                        border-radius: 12px 12px 0 0;
                        padding: 1.25rem 1.5rem;
                        margin: -12px -12px 1rem -12px;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                        position: relative;
                        overflow: hidden;
                    ">
                        <div style="
                            position: absolute;
                            top: -50%;
                            right: -50%;
                            width: 200%;
                            height: 200%;
                            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
                            pointer-events: none;
                        "></div>
                        <div style="position: relative; z-index: 1;">
                            <div style="
                                display: flex;
                                align-items: center;
                                justify-content: space-between;
                                margin-bottom: 0.5rem;
                            ">
                                <h3 style="
                                    margin: 0;
                                    color: white;
                                    font-size: 1.1rem;
                                    font-weight: 700;
                                    text-shadow: 0 2px 4px rgba(0,0,0,0.2);
                                    letter-spacing: 0.3px;
                                ">
                                    🗑️ ${bin.id}
                                </h3>
                                <span style="
                                    background: rgba(255,255,255,0.25);
                                    backdrop-filter: blur(10px);
                                    padding: 0.25rem 0.75rem;
                                    border-radius: 20px;
                                    font-size: 0.75rem;
                                    font-weight: 600;
                                    color: white;
                                    text-transform: uppercase;
                                    letter-spacing: 0.5px;
                                ">
                                    ${statusText}
                                </span>
                            </div>
                            <p style="
                                margin: 0;
                                color: rgba(255,255,255,0.95);
                                font-size: 0.85rem;
                                font-weight: 400;
                                text-shadow: 0 1px 2px rgba(0,0,0,0.1);
                            ">
                                📍 ${bin.location || 'Location not specified'}
                            </p>
                        </div>
                    </div>
                    
                    ${sensorSection}
                    
                    <!-- Fill Level Progress Card -->
                    <div style="
                        background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%);
                        border: 1px solid rgba(255,255,255,0.1);
                        border-radius: 12px;
                        padding: 1.25rem;
                        margin-bottom: 1rem;
                        backdrop-filter: blur(10px);
                        box-shadow: 0 4px 16px rgba(0,0,0,0.1);
                    ">
                        <div style="
                            display: flex;
                            align-items: center;
                            justify-content: space-between;
                            margin-bottom: 0.75rem;
                        ">
                            <span style="
                                color: #cbd5e1;
                                font-size: 0.875rem;
                                font-weight: 500;
                                text-transform: uppercase;
                                letter-spacing: 0.5px;
                            ">
                                Fill Level
                            </span>
                            <span style="
                                font-size: 1.5rem;
                                font-weight: 700;
                                color: ${color};
                                text-shadow: 0 2px 8px ${color}40;
                            ">
                                ${fillLevel}%
                            </span>
                        </div>
                        
                        <!-- Progress Bar -->
                        <div style="
                            width: 100%;
                            height: 12px;
                            background: rgba(255,255,255,0.1);
                            border-radius: 10px;
                            overflow: hidden;
                            position: relative;
                            box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
                        ">
                            <div style="
                                width: ${fillLevel}%;
                                height: 100%;
                                background: linear-gradient(90deg, ${color} 0%, ${lightenColor(color, 10)} 100%);
                                border-radius: 10px;
                                transition: width 0.3s ease;
                                box-shadow: 0 0 12px ${color}60;
                                position: relative;
                                overflow: hidden;
                            ">
                                <div style="
                                    position: absolute;
                                    top: 0;
                                    left: 0;
                                    right: 0;
                                    bottom: 0;
                                    background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%);
                                    animation: shimmer 2s infinite;
                                "></div>
                            </div>
                        </div>
                        
                        <!-- Capacity Details -->
                        <div style="
                            display: flex;
                            justify-content: space-between;
                            margin-top: 0.75rem;
                            padding-top: 0.75rem;
                            border-top: 1px solid rgba(255,255,255,0.1);
                        ">
                            <div style="
                                color: #94a3b8;
                                font-size: 0.8rem;
                                font-weight: 500;
                            ">
                                Capacity: <span style="color: #f1f5f9; font-weight: 600;">${capacity}L</span>
                            </div>
                            <div style="
                                color: #94a3b8;
                                font-size: 0.8rem;
                                font-weight: 500;
                            ">
                                Available: <span style="color: #f1f5f9; font-weight: 600;">${Math.round(available)}L</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Status Badge -->
                    ${fillLevel >= 85 ? `
                    <div style="
                        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                        border-radius: 8px;
                        padding: 0.75rem 1rem;
                        margin-bottom: 1rem;
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
                    ">
                        <span style="font-size: 1.1rem;">⚠️</span>
                        <span style="
                            color: white;
                            font-weight: 700;
                            font-size: 0.875rem;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                        ">
                            Critical
                        </span>
                    </div>
                    ` : ''}
                    
                    <!-- Info Grid - 4 Cards -->
                    <div style="
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 0.75rem;
                        margin-bottom: 1rem;
                    ">
                        <!-- Last Collection Card -->
                        <div class="bin-popup-card" style="
                            background: rgba(255,255,255,0.05);
                            border-radius: 10px;
                            padding: 1rem;
                            border: 1px solid rgba(255,255,255,0.08);
                            transition: all 0.2s ease;
                        ">
                            <div style="
                                display: flex;
                                align-items: center;
                                gap: 0.5rem;
                                margin-bottom: 0.5rem;
                            ">
                                <span style="font-size: 1.1rem;">🕐</span>
                                <div style="
                                    color: #94a3b8;
                                    font-size: 0.7rem;
                                    font-weight: 600;
                                    text-transform: uppercase;
                                    letter-spacing: 0.5px;
                                ">
                                    Last Collection
                                </div>
                            </div>
                            <div style="
                                color: #f1f5f9;
                                font-size: 1rem;
                                font-weight: 700;
                            ">
                                ${lastCollection}
                            </div>
                        </div>
                        
                        <!-- Battery Card -->
                        <div class="bin-popup-card" style="
                            background: rgba(255,255,255,0.05);
                            border-radius: 10px;
                            padding: 1rem;
                            border: 1px solid rgba(255,255,255,0.08);
                            transition: all 0.2s ease;
                        ">
                            <div style="
                                display: flex;
                                align-items: center;
                                gap: 0.5rem;
                                margin-bottom: 0.5rem;
                            ">
                                <span style="font-size: 1.1rem;">🔋</span>
                                <div style="
                                    color: #94a3b8;
                                    font-size: 0.7rem;
                                    font-weight: 600;
                                    text-transform: uppercase;
                                    letter-spacing: 0.5px;
                                ">
                                    Battery
                                </div>
                            </div>
                            <div style="
                                color: ${sensorBattery !== null ? (sensorBattery > 20 ? '#10b981' : '#ef4444') : '#94a3b8'};
                                font-size: 1rem;
                                font-weight: 700;
                            ">
                                ${sensorBattery !== null && !isNaN(sensorBattery) && sensorBattery >= 0 && sensorBattery <= 100 ? `${Math.round(sensorBattery)}%` : 'N/A'}
                            </div>
                        </div>
                        
                        <!-- Temperature Card -->
                        <div class="bin-popup-card" style="
                            background: rgba(255,255,255,0.05);
                            border-radius: 10px;
                            padding: 1rem;
                            border: 1px solid rgba(255,255,255,0.08);
                            transition: all 0.2s ease;
                        ">
                            <div style="
                                display: flex;
                                align-items: center;
                                gap: 0.5rem;
                                margin-bottom: 0.5rem;
                            ">
                                <span style="font-size: 1.1rem;">🌡️</span>
                                <div style="
                                    color: #94a3b8;
                                    font-size: 0.7rem;
                                    font-weight: 600;
                                    text-transform: uppercase;
                                    letter-spacing: 0.5px;
                                ">
                                    Temperature
                                </div>
                            </div>
                            <div style="
                                color: ${sensorTemperature !== null ? (sensorTemperature > 35 ? '#ef4444' : sensorTemperature > 25 ? '#f59e0b' : '#10b981') : '#94a3b8'};
                                font-size: 1rem;
                                font-weight: 700;
                            ">
                                ${sensorTemperature !== null && !isNaN(sensorTemperature) && sensorTemperature >= -50 && sensorTemperature <= 100 ? `${Math.round(sensorTemperature * 10) / 10}°C` : 'N/A'}
                            </div>
                        </div>
                        
                        <!-- Type Card -->
                        <div class="bin-popup-card" style="
                            background: rgba(255,255,255,0.05);
                            border-radius: 10px;
                            padding: 1rem;
                            border: 1px solid rgba(255,255,255,0.08);
                            transition: all 0.2s ease;
                        ">
                            <div style="
                                display: flex;
                                align-items: center;
                                gap: 0.5rem;
                                margin-bottom: 0.5rem;
                            ">
                                <span style="font-size: 1.1rem;">🏷️</span>
                                <div style="
                                    color: #94a3b8;
                                    font-size: 0.7rem;
                                    font-weight: 600;
                                    text-transform: uppercase;
                                    letter-spacing: 0.5px;
                                ">
                                    Type
                                </div>
                            </div>
                            <div style="
                                color: #f1f5f9;
                                font-size: 1rem;
                                font-weight: 700;
                                text-transform: capitalize;
                            ">
                                ${binType}
                            </div>
                        </div>
                    </div>
                    
                    <!-- Action Buttons -->
                    <div style="
                        display: grid;
                        grid-template-columns: ${hasSensor ? '1fr 1fr 1fr' : '1fr 1fr'};
                        gap: 0.75rem;
                    ">
                        <button onclick="assignJob('${bin.id}')" style="
                            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                            border: none;
                            border-radius: 10px;
                            padding: 0.875rem 1rem;
                            color: white;
                            font-weight: 600;
                            font-size: 0.875rem;
                            cursor: pointer;
                            transition: all 0.2s ease;
                            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 0.5rem;
                        " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(239, 68, 68, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(239, 68, 68, 0.3)'">
                            <i class="fas fa-user-plus"></i>
                            <span>Assign</span>
                        </button>
                        
                        <button onclick="showBinDetails('${bin.id}')" style="
                            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                            border: none;
                            border-radius: 10px;
                            padding: 0.875rem 1rem;
                            color: white;
                            font-weight: 600;
                            font-size: 0.875rem;
                            cursor: pointer;
                            transition: all 0.2s ease;
                            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 0.5rem;
                        " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(59, 130, 246, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(59, 130, 246, 0.3)'">
                            <i class="fas fa-info-circle"></i>
                            <span>Details</span>
                        </button>
                        
                        ${hasSensor ? `
                            <button onclick="window.open('/sensor-management.html', '_blank')" style="
                                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                                border: none;
                                border-radius: 10px;
                                padding: 0.875rem 1rem;
                                color: white;
                                font-weight: 600;
                                font-size: 0.875rem;
                                cursor: pointer;
                                transition: all 0.2s ease;
                                box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                gap: 0.5rem;
                            " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(16, 185, 129, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(16, 185, 129, 0.3)'">
                                <i class="fas fa-cog"></i>
                                <span>Sensor</span>
                            </button>
                        ` : ''}
                    </div>
                </div>
                
                <style>
                    @keyframes shimmer {
                        0% { transform: translateX(-100%); }
                        100% { transform: translateX(100%); }
                    }
                </style>
            `;
        };
        
        console.log('✅ MapManager enhanced with sensor support');
    }
    
    console.log('✅ Map Bin-Sensor Enhancement loaded');
    
})();


