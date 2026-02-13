// WORLDCLASS_DRIVER_MARKER_UI.js
// Premium driver marker design - Enterprise-grade UI like Uber, Google Maps

(function() {
    'use strict';

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎨 WORLD-CLASS DRIVER MARKER UI - LOADING');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');

    // ============= PREMIUM DRIVER MARKER DESIGN =============
    
    if (window.MapManager && window.MapManager.prototype) {
        const originalAddDriverMarker = window.MapManager.prototype.addDriverMarker;
        
        window.MapManager.prototype.addDriverMarker = function(driver, location) {
            // Validate inputs
            if (!this.map || !driver || !location || !location.lat || !location.lng) {
                console.warn('⚠️ Cannot add driver marker - invalid data');
                return;
            }

            // Remove existing marker
            if (this.markers.drivers && this.markers.drivers[driver.id]) {
                this.layers.drivers.removeLayer(this.markers.drivers[driver.id]);
                delete this.markers.drivers[driver.id];
            }

            const collections = dataManager.getDriverCollections(driver.id);
            const todayCollections = collections.filter(c => 
                new Date(c.timestamp).toDateString() === new Date().toDateString()
            ).length;

            const isCurrentDriver = driver.id === this.currentDriverId;
            
            // Determine status and colors
            let statusText = 'READY';
            let statusColor = '#10b981';
            let statusIcon = '🚛';
            let markerColor = '#3b82f6';
            
            if (driver.movementStatus === 'on-route' || driver.movementStatus === 'ai-route') {
                statusText = 'ON ROUTE';
                statusColor = '#f59e0b';
                statusIcon = '🚚';
                markerColor = '#f59e0b';
            } else if (driver.movementStatus === 'driving') {
                statusText = 'DRIVING';
                statusColor = '#3b82f6';
                statusIcon = '🚗';
                markerColor = '#3b82f6';
            } else if (driver.movementStatus === 'on-break') {
                statusText = 'BREAK';
                statusColor = '#8b5cf6';
                statusIcon = '☕';
                markerColor = '#8b5cf6';
            } else if (driver.status === 'inactive') {
                statusText = 'OFFLINE';
                statusColor = '#6b7280';
                statusIcon = '🛑';
                markerColor = '#6b7280';
            }
            
            if (isCurrentDriver) {
                markerColor = '#00d4ff';
            }
            
            // Check if location is live (< 60 seconds old)
            let isLive = false;
            if (location.timestamp) {
                const updateTime = new Date(location.timestamp);
                const now = new Date();
                const diffSeconds = Math.floor((now - updateTime) / 1000);
                isLive = diffSeconds < 60;
            }

            // ============= PREMIUM MARKER ICON (3D EFFECT) =============
            
            const icon = L.divIcon({
                className: 'worldclass-driver-marker',
                html: `
                    <div style="
                        position: relative;
                        width: ${isCurrentDriver ? '70px' : '60px'};
                        height: ${isCurrentDriver ? '70px' : '60px'};
                    ">
                        <!-- Outer glow ring (animated if current driver) -->
                        <div style="
                            position: absolute;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%);
                            width: ${isCurrentDriver ? '85px' : '75px'};
                            height: ${isCurrentDriver ? '85px' : '75px'};
                            border-radius: 50%;
                            background: radial-gradient(circle, ${markerColor}40 0%, transparent 70%);
                            ${isCurrentDriver ? 'animation: pulse-ring 2s ease-out infinite;' : ''}
                            pointer-events: none;
                        "></div>
                        
                        <!-- Main marker circle (3D effect) -->
                        <div style="
                            position: absolute;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%);
                            width: ${isCurrentDriver ? '70px' : '60px'};
                            height: ${isCurrentDriver ? '70px' : '60px'};
                            border-radius: 50%;
                            background: linear-gradient(135deg, ${markerColor} 0%, ${markerColor}cc 50%, ${markerColor}99 100%);
                            box-shadow: 
                                0 10px 30px rgba(0,0,0,0.5),
                                0 4px 12px ${markerColor}60,
                                inset 0 2px 8px rgba(255,255,255,0.3),
                                inset 0 -2px 8px rgba(0,0,0,0.3);
                            border: 3px solid rgba(255,255,255,0.9);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            cursor: pointer;
                            ${isCurrentDriver ? 'animation: float 3s ease-in-out infinite;' : ''}
                            transition: all 0.3s ease;
                        " onmouseover="this.style.transform='translate(-50%, -50%) scale(1.1)'" onmouseout="this.style.transform='translate(-50%, -50%) scale(1)'">
                            
                            <!-- Inner highlight (gives 3D depth) -->
                            <div style="
                                position: absolute;
                                top: 15%;
                                left: 15%;
                                width: 40%;
                                height: 40%;
                                border-radius: 50%;
                                background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.6), transparent);
                                pointer-events: none;
                            "></div>
                            
                            <!-- Status pulse (if on route) -->
                            ${driver.movementStatus === 'on-route' || driver.movementStatus === 'driving' ? `
                                <div style="
                                    position: absolute;
                                    top: 0; left: 0; right: 0; bottom: 0;
                                    border-radius: 50%;
                                    background: ${statusColor};
                                    opacity: 0.5;
                                    animation: pulse-wave 2s ease-out infinite;
                                    pointer-events: none;
                                "></div>
                            ` : ''}
                            
                            <!-- Main icon with shadow -->
                            <div style="
                                font-size: ${isCurrentDriver ? '32px' : '28px'};
                                z-index: 2;
                                position: relative;
                                filter: drop-shadow(0 3px 6px rgba(0,0,0,0.7));
                            ">${statusIcon}</div>
                        </div>
                        
                        <!-- Collections count badge (top-right) -->
                        ${todayCollections > 0 ? `
                            <div style="
                                position: absolute;
                                top: 0;
                                right: 0;
                                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                                color: white;
                                font-size: 0.7rem;
                                padding: 4px 8px;
                                border-radius: 14px;
                                font-weight: 800;
                                box-shadow: 
                                    0 4px 12px rgba(16, 185, 129, 0.6),
                                    inset 0 1px 2px rgba(255,255,255,0.3);
                                z-index: 10;
                                border: 2px solid white;
                                min-width: 24px;
                                text-align: center;
                            ">${todayCollections}</div>
                        ` : ''}
                        
                        <!-- Live indicator (top-left) -->
                        ${isLive ? `
                            <div style="
                                position: absolute;
                                top: 2px;
                                left: 2px;
                                width: 14px;
                                height: 14px;
                                background: #ef4444;
                                border-radius: 50%;
                                border: 2px solid white;
                                box-shadow: 
                                    0 0 0 4px rgba(239, 68, 68, 0.3),
                                    0 4px 12px rgba(239, 68, 68, 0.5);
                                animation: pulse-dot 1.5s ease-in-out infinite;
                                z-index: 10;
                            "></div>
                        ` : ''}
                        
                        <!-- YOU badge (current driver) -->
                        ${isCurrentDriver ? `
                            <div style="
                                position: absolute;
                                bottom: -12px;
                                left: 50%;
                                transform: translateX(-50%);
                                background: linear-gradient(135deg, #00d4ff 0%, #0ea5e9 100%);
                                color: white;
                                font-size: 0.65rem;
                                padding: 3px 10px;
                                border-radius: 12px;
                                font-weight: 800;
                                white-space: nowrap;
                                box-shadow: 
                                    0 4px 12px rgba(0, 212, 255, 0.6),
                                    inset 0 1px 2px rgba(255,255,255,0.3);
                                border: 2px solid white;
                                z-index: 10;
                                letter-spacing: 0.5px;
                            ">YOU</div>
                        ` : ''}
                    </div>
                `,
                iconSize: [isCurrentDriver ? 70 : 60, isCurrentDriver ? 70 : 60],
                iconAnchor: [isCurrentDriver ? 35 : 30, isCurrentDriver ? 35 : 30]
            });

            // ============= PREMIUM PERMANENT TOOLTIP =============
            
            const tooltipContent = `
                <div style="
                    background: linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(20, 20, 30, 0.95) 100%);
                    backdrop-filter: blur(20px) saturate(180%);
                    padding: 12px 16px;
                    border-radius: 12px;
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    box-shadow: 
                        0 8px 32px rgba(0, 0, 0, 0.7),
                        0 0 0 1px rgba(255, 255, 255, 0.05),
                        inset 0 1px 2px rgba(255, 255, 255, 0.1);
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'SF Pro Display', sans-serif;
                    min-width: 220px;
                    max-width: 280px;
                ">
                    <!-- Header with driver name and live indicator -->
                    <div style="
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        margin-bottom: 10px;
                        padding-bottom: 10px;
                        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    ">
                        <div style="
                            display: flex;
                            align-items: center;
                            gap: 8px;
                        ">
                            <div style="
                                font-size: 1.3rem;
                                filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
                            ">${statusIcon}</div>
                            <div>
                                <div style="
                                    color: white;
                                    font-weight: 700;
                                    font-size: 1rem;
                                    letter-spacing: -0.02em;
                                ">${driver.name}</div>
                                <div style="
                                    color: rgba(255, 255, 255, 0.5);
                                    font-size: 0.7rem;
                                    font-weight: 500;
                                    margin-top: 2px;
                                ">${driver.id}</div>
                            </div>
                        </div>
                        ${isLive ? `
                            <div style="
                                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                                padding: 4px 10px;
                                border-radius: 20px;
                                font-size: 0.65rem;
                                font-weight: 800;
                                color: white;
                                text-transform: uppercase;
                                letter-spacing: 0.5px;
                                box-shadow: 
                                    0 0 16px rgba(239, 68, 68, 0.8),
                                    inset 0 1px 2px rgba(255,255,255,0.3);
                                animation: pulse-glow-text 2s ease-in-out infinite;
                                display: flex;
                                align-items: center;
                                gap: 4px;
                            ">
                                <span style="
                                    width: 6px;
                                    height: 6px;
                                    background: white;
                                    border-radius: 50%;
                                    animation: pulse-dot 1s ease-in-out infinite;
                                "></span>
                                LIVE
                            </div>
                        ` : ''}
                    </div>
                    
                    <!-- Status badge (modern chip design) -->
                    <div style="
                        background: linear-gradient(135deg, ${statusColor}30 0%, ${statusColor}15 100%);
                        border: 1px solid ${statusColor}60;
                        color: ${statusColor};
                        padding: 6px 12px;
                        border-radius: 20px;
                        font-size: 0.75rem;
                        font-weight: 700;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                        margin-bottom: 10px;
                        box-shadow: 0 2px 8px ${statusColor}20;
                    ">
                        <span style="
                            width: 6px;
                            height: 6px;
                            background: ${statusColor};
                            border-radius: 50%;
                            box-shadow: 0 0 8px ${statusColor};
                        "></span>
                        ${statusText}
                    </div>
                    
                    <!-- GPS Coordinates (premium monospace design) -->
                    <div style="
                        background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.08) 100%);
                        border: 1px solid rgba(59, 130, 246, 0.3);
                        padding: 10px 12px;
                        border-radius: 10px;
                        margin-bottom: 8px;
                        position: relative;
                        overflow: hidden;
                    ">
                        <!-- Animated scan line -->
                        ${isLive ? `
                            <div style="
                                position: absolute;
                                top: 0;
                                left: -100%;
                                width: 100%;
                                height: 2px;
                                background: linear-gradient(90deg, transparent 0%, #3b82f6 50%, transparent 100%);
                                animation: scan-line 3s linear infinite;
                            "></div>
                        ` : ''}
                        
                        <div style="
                            color: rgba(255, 255, 255, 0.5);
                            font-size: 0.65rem;
                            font-weight: 600;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                            margin-bottom: 6px;
                            display: flex;
                            align-items: center;
                            gap: 6px;
                        ">
                            <span style="font-size: 0.8rem;">📍</span>
                            GPS COORDINATES
                        </div>
                        <div style="
                            color: #60a5fa;
                            font-weight: 700;
                            font-size: 0.85rem;
                            font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
                            line-height: 1.6;
                            text-align: center;
                            text-shadow: 0 0 10px rgba(96, 165, 250, 0.5);
                        ">
                            ${location.lat.toFixed(6)}<br>
                            ${location.lng.toFixed(6)}
                        </div>
                    </div>
                    
                    <!-- Accuracy badge -->
                    ${location.accuracy ? `
                        <div style="
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 6px;
                            padding: 6px 10px;
                            background: rgba(16, 185, 129, 0.1);
                            border: 1px solid rgba(16, 185, 129, 0.3);
                            border-radius: 8px;
                            margin-bottom: 8px;
                        ">
                            <span style="
                                font-size: 0.9rem;
                                filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
                            ">🎯</span>
                            <span style="
                                color: #6ee7b7;
                                font-size: 0.7rem;
                                font-weight: 600;
                            ">±${Math.round(location.accuracy)}m</span>
                        </div>
                    ` : ''}
                    
                    <!-- Collections info (if any today) -->
                    ${todayCollections > 0 ? `
                        <div style="
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 6px;
                            padding: 6px 10px;
                            background: rgba(16, 185, 129, 0.1);
                            border: 1px solid rgba(16, 185, 129, 0.3);
                            border-radius: 8px;
                        ">
                            <span style="font-size: 0.9rem;">✅</span>
                            <span style="
                                color: #6ee7b7;
                                font-size: 0.7rem;
                                font-weight: 600;
                            ">${todayCollections} ${todayCollections === 1 ? 'Collection' : 'Collections'} Today</span>
                        </div>
                    ` : ''}
                </div>
            `;

            const popupContent = this.createDriverPopup(driver, location, todayCollections, isCurrentDriver, statusText);
            
            const marker = L.marker([location.lat, location.lng], { icon })
                .bindPopup(popupContent, {
                    maxWidth: 420,
                    className: 'vehicle-popup',
                    closeButton: true,
                    autoPan: true,
                    autoPanPadding: [50, 50],
                    autoClose: false,
                    closeOnClick: false,
                    keepInView: true
                });
            
            // Bind permanent tooltip with premium design
            marker.bindTooltip(tooltipContent, {
                permanent: true,
                direction: 'bottom',
                offset: [0, 45],
                className: 'worldclass-driver-tooltip',
                opacity: 1.0
            });

            marker.on('click', function() {
                this.openPopup();
            });

            if (this.layers.drivers) {
                marker.addTo(this.layers.drivers);
            }

            this.markers.drivers[driver.id] = marker;
            
            console.log(`✅ World-class marker added for ${driver.name} at: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`);
        };
        
        console.log('✅ Premium driver marker UI applied');
    }

    // ============= PREMIUM CSS ANIMATIONS & STYLES =============
    
    const style = document.createElement('style');
    style.textContent = `
        /* World-class driver marker styles */
        .worldclass-driver-marker {
            border: none !important;
            background: transparent !important;
        }
        
        .worldclass-driver-tooltip {
            border: none !important;
            background: transparent !important;
            box-shadow: none !important;
            padding: 0 !important;
        }
        
        .worldclass-driver-tooltip::before {
            display: none !important;
        }
        
        /* Pulse ring animation (for current driver) */
        @keyframes pulse-ring {
            0% {
                transform: translate(-50%, -50%) scale(0.8);
                opacity: 0.8;
            }
            50% {
                transform: translate(-50%, -50%) scale(1.2);
                opacity: 0.4;
            }
            100% {
                transform: translate(-50%, -50%) scale(0.8);
                opacity: 0.8;
            }
        }
        
        /* Floating animation (for current driver) */
        @keyframes float {
            0%, 100% {
                transform: translate(-50%, -50%) translateY(0px);
            }
            50% {
                transform: translate(-50%, -50%) translateY(-5px);
            }
        }
        
        /* Pulse wave animation (for active drivers) */
        @keyframes pulse-wave {
            0% {
                transform: scale(1);
                opacity: 0.6;
            }
            100% {
                transform: scale(1.5);
                opacity: 0;
            }
        }
        
        /* Pulse dot animation (live indicator) */
        @keyframes pulse-dot {
            0%, 100% {
                box-shadow: 
                    0 0 0 0 rgba(239, 68, 68, 0.7),
                    0 4px 12px rgba(239, 68, 68, 0.5);
            }
            50% {
                box-shadow: 
                    0 0 0 8px rgba(239, 68, 68, 0),
                    0 4px 12px rgba(239, 68, 68, 0.8);
            }
        }
        
        /* Pulse glow text animation (LIVE badge) */
        @keyframes pulse-glow-text {
            0%, 100% {
                box-shadow: 
                    0 0 16px rgba(239, 68, 68, 0.8),
                    inset 0 1px 2px rgba(255,255,255,0.3);
            }
            50% {
                box-shadow: 
                    0 0 24px rgba(239, 68, 68, 1),
                    0 0 32px rgba(239, 68, 68, 0.6),
                    inset 0 1px 2px rgba(255,255,255,0.4);
            }
        }
        
        /* Scan line animation */
        @keyframes scan-line {
            0% {
                left: -100%;
            }
            100% {
                left: 200%;
            }
        }
        
        /* Hover effect on vehicle popup */
        .vehicle-popup .leaflet-popup-content-wrapper {
            background: linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%) !important;
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 
                0 20px 60px rgba(0, 0, 0, 0.8),
                0 0 0 1px rgba(255, 255, 255, 0.05) !important;
            backdrop-filter: blur(20px) saturate(180%);
            border-radius: 16px !important;
        }
        
        .vehicle-popup .leaflet-popup-tip {
            background: rgba(15, 23, 42, 0.98) !important;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
    `;
    document.head.appendChild(style);

    console.log('✅ Premium animations and styles applied');
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎨 WORLD-CLASS DRIVER MARKER UI - READY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('Features:');
    console.log('  ✅ 3D marker with depth and shadows');
    console.log('  ✅ Animated pulse for active drivers');
    console.log('  ✅ Floating animation for current driver');
    console.log('  ✅ Premium tooltip with exact coordinates');
    console.log('  ✅ Live indicator with animated dot');
    console.log('  ✅ Collection count badge');
    console.log('  ✅ Status-based colors');
    console.log('  ✅ Hover scale effect');
    console.log('  ✅ Professional typography');
    console.log('');

})();
