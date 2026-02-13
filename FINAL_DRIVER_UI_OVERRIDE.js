// FINAL_DRIVER_UI_OVERRIDE.js
// NUCLEAR OVERRIDE: Loads LAST and forces world-class UI with 100% priority

(function() {
    'use strict';

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🚀 FINAL UI OVERRIDE - WORLD-CLASS DRIVER MARKERS');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');

    // Wait for MapManager to be fully loaded and ready
    function waitForMapManager(callback, maxAttempts = 50) {
        let attempts = 0;
        
        const checkInterval = setInterval(() => {
            attempts++;
            
            if (window.MapManager && window.MapManager.prototype && window.mapManager) {
                clearInterval(checkInterval);
                console.log(`✅ MapManager ready after ${attempts} checks`);
                callback();
            } else if (attempts >= maxAttempts) {
                clearInterval(checkInterval);
                console.error('❌ MapManager not found after max attempts');
            } else if (attempts % 10 === 0) {
                console.log(`⏳ Waiting for MapManager... (attempt ${attempts}/${maxAttempts})`);
            }
        }, 200); // Check every 200ms
    }

    // Wait for MapManager, then apply our UI
    waitForMapManager(() => {
        console.log('🎨 Applying world-class driver marker UI (final override)...');

        // ============= FINAL OVERRIDE: addDriverMarker =============
        
        window.MapManager.prototype.addDriverMarker = function(driver, location) {
            // Validate
            if (!this.map || !driver || !location || !location.lat || !location.lng) {
                console.warn('⚠️ Invalid driver marker data');
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
            
            // Status determination
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
            
            // Check if live
            let isLive = false;
            if (location.timestamp) {
                const diffSeconds = Math.floor((new Date() - new Date(location.timestamp)) / 1000);
                isLive = diffSeconds < 60;
            }

            // ============= WORLD-CLASS 3D MARKER =============
            
            const icon = L.divIcon({
                className: 'final-worldclass-driver-marker',
                html: `
                    <div style="position: relative; width: ${isCurrentDriver ? '70px' : '60px'}; height: ${isCurrentDriver ? '70px' : '60px'};">
                        <!-- Outer pulse ring -->
                        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: ${isCurrentDriver ? '90px' : '80px'}; height: ${isCurrentDriver ? '90px' : '80px'}; border-radius: 50%; background: radial-gradient(circle, ${markerColor}40 0%, transparent 70%); ${isCurrentDriver ? 'animation: pulse-ring 2s ease-out infinite;' : ''} pointer-events: none;"></div>
                        
                        <!-- Main 3D marker -->
                        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: ${isCurrentDriver ? '70px' : '60px'}; height: ${isCurrentDriver ? '70px' : '60px'}; border-radius: 50%; background: linear-gradient(135deg, ${markerColor} 0%, ${markerColor}cc 50%, ${markerColor}99 100%); box-shadow: 0 10px 30px rgba(0,0,0,0.5), 0 4px 12px ${markerColor}60, inset 0 2px 8px rgba(255,255,255,0.3), inset 0 -2px 8px rgba(0,0,0,0.3); border: 3px solid rgba(255,255,255,0.9); display: flex; align-items: center; justify-content: center; cursor: pointer; ${isCurrentDriver ? 'animation: float 3s ease-in-out infinite;' : ''} transition: all 0.3s ease;" onmouseover="this.style.transform='translate(-50%, -50%) scale(1.1)'" onmouseout="this.style.transform='translate(-50%, -50%) scale(1)'">
                            <div style="position: absolute; top: 15%; left: 15%; width: 40%; height: 40%; border-radius: 50%; background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.6), transparent); pointer-events: none;"></div>
                            ${(driver.movementStatus === 'on-route' || driver.movementStatus === 'driving') ? `<div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; border-radius: 50%; background: ${statusColor}; opacity: 0.5; animation: pulse-wave 2s ease-out infinite; pointer-events: none;"></div>` : ''}
                            <div style="font-size: ${isCurrentDriver ? '32px' : '28px'}; z-index: 2; position: relative; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.7));">${statusIcon}</div>
                        </div>
                        
                        ${todayCollections > 0 ? `<div style="position: absolute; top: 0; right: 0; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; font-size: 0.7rem; padding: 4px 8px; border-radius: 14px; font-weight: 800; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.6), inset 0 1px 2px rgba(255,255,255,0.3); z-index: 10; border: 2px solid white; min-width: 24px; text-align: center;">${todayCollections}</div>` : ''}
                        
                        ${isLive ? `<div style="position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; background: #ef4444; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.3), 0 4px 12px rgba(239, 68, 68, 0.5); animation: pulse-dot 1.5s ease-in-out infinite; z-index: 10;"></div>` : ''}
                        
                        ${isCurrentDriver ? `<div style="position: absolute; bottom: -12px; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, #00d4ff 0%, #0ea5e9 100%); color: white; font-size: 0.65rem; padding: 3px 10px; border-radius: 12px; font-weight: 800; white-space: nowrap; box-shadow: 0 4px 12px rgba(0, 212, 255, 0.6), inset 0 1px 2px rgba(255,255,255,0.3); border: 2px solid white; z-index: 10; letter-spacing: 0.5px;">YOU</div>` : ''}
                    </div>
                `,
                iconSize: [isCurrentDriver ? 70 : 60, isCurrentDriver ? 70 : 60],
                iconAnchor: [isCurrentDriver ? 35 : 30, isCurrentDriver ? 35 : 30]
            });

            // ============= PREMIUM TOOLTIP =============
            
            const tooltipContent = `<div style="background: linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(20, 20, 30, 0.95) 100%); backdrop-filter: blur(20px) saturate(180%); padding: 12px 16px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.15); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05), inset 0 1px 2px rgba(255, 255, 255, 0.1); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; min-width: 220px; max-width: 280px;"><div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid rgba(255, 255, 255, 0.1);"><div style="display: flex; align-items: center; gap: 8px;"><div style="font-size: 1.3rem; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">${statusIcon}</div><div><div style="color: white; font-weight: 700; font-size: 1rem; letter-spacing: -0.02em;">${driver.name}</div><div style="color: rgba(255, 255, 255, 0.5); font-size: 0.7rem; font-weight: 500; margin-top: 2px;">${driver.id}</div></div></div>${isLive ? `<div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 4px 10px; border-radius: 20px; font-size: 0.65rem; font-weight: 800; color: white; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 0 16px rgba(239, 68, 68, 0.8), inset 0 1px 2px rgba(255,255,255,0.3); animation: pulse-glow-text 2s ease-in-out infinite; display: flex; align-items: center; gap: 4px;"><span style="width: 6px; height: 6px; background: white; border-radius: 50%; animation: pulse-dot 1s ease-in-out infinite;"></span>LIVE</div>` : ''}</div><div style="background: linear-gradient(135deg, ${statusColor}30 0%, ${statusColor}15 100%); border: 1px solid ${statusColor}60; color: ${statusColor}; padding: 6px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; display: inline-flex; align-items: center; gap: 6px; margin-bottom: 10px; box-shadow: 0 2px 8px ${statusColor}20;"><span style="width: 6px; height: 6px; background: ${statusColor}; border-radius: 50%; box-shadow: 0 0 8px ${statusColor};"></span>${statusText}</div><div style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.08) 100%); border: 1px solid rgba(59, 130, 246, 0.3); padding: 10px 12px; border-radius: 10px; margin-bottom: 8px; position: relative; overflow: hidden;">${isLive ? `<div style="position: absolute; top: 0; left: -100%; width: 100%; height: 2px; background: linear-gradient(90deg, transparent 0%, #3b82f6 50%, transparent 100%); animation: scan-line 3s linear infinite;"></div>` : ''}<div style="color: rgba(255, 255, 255, 0.5); font-size: 0.65rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;"><span style="font-size: 0.8rem;">📍</span>GPS COORDINATES</div><div style="color: #60a5fa; font-weight: 700; font-size: 0.85rem; font-family: 'SF Mono', 'Monaco', 'Courier New', monospace; line-height: 1.6; text-align: center; text-shadow: 0 0 10px rgba(96, 165, 250, 0.5);">${location.lat.toFixed(6)}<br>${location.lng.toFixed(6)}</div></div>${location.accuracy ? `<div style="display: flex; align-items: center; justify-content: center; gap: 6px; padding: 6px 10px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; margin-bottom: 8px;"><span style="font-size: 0.9rem; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">🎯</span><span style="color: #6ee7b7; font-size: 0.7rem; font-weight: 600;">±${Math.round(location.accuracy)}m</span></div>` : ''}${todayCollections > 0 ? `<div style="display: flex; align-items: center; justify-content: center; gap: 6px; padding: 6px 10px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px;"><span style="font-size: 0.9rem;">✅</span><span style="color: #6ee7b7; font-size: 0.7rem; font-weight: 600;">${todayCollections} ${todayCollections === 1 ? 'Collection' : 'Collections'} Today</span></div>` : ''}</div>`;

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
            
            // CRITICAL: Remove ALL labels and bind ONLY our premium tooltip
            if (marker._label) delete marker._label;
            if (marker.unbindLabel && typeof marker.unbindLabel === 'function') {
                try { marker.unbindLabel(); } catch(e) {}
            }
            marker.unbindTooltip();
            
            marker.bindTooltip(tooltipContent, {
                permanent: true,
                direction: 'bottom',
                offset: [0, 45],
                className: 'final-worldclass-tooltip',
                opacity: 1.0
            });

            marker.on('click', function() { this.openPopup(); });

            if (this.layers.drivers) {
                marker.addTo(this.layers.drivers);
            }

            this.markers.drivers[driver.id] = marker;
            
            console.log(`✅ World-class marker: ${driver.name} at ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`);
        };

        // Force refresh all driver markers with new UI - multiple attempts
        function forceRefreshMarkers() {
            if (window.mapManager && window.mapManager.map && window.mapManager.layers && window.mapManager.layers.drivers) {
                console.log('🔄 Refreshing all driver markers with world-class UI...');
                
                // Clear all existing driver markers
                if (window.mapManager.markers.drivers) {
                    Object.keys(window.mapManager.markers.drivers).forEach(driverId => {
                        const marker = window.mapManager.markers.drivers[driverId];
                        if (marker) {
                            window.mapManager.layers.drivers.removeLayer(marker);
                        }
                    });
                    window.mapManager.markers.drivers = {};
                    console.log('🧹 Cleared all old driver markers');
                }
                
                // Re-add with new UI
                window.mapManager.initializeAllDrivers();
                console.log('✅ All driver markers refreshed with world-class UI');
                return true;
            }
            return false;
        }
        
        // Try to refresh immediately
        setTimeout(() => {
            if (!forceRefreshMarkers()) {
                console.log('⏳ Map not ready yet, will retry...');
                // Retry every 2 seconds up to 5 times
                let retryCount = 0;
                const retryInterval = setInterval(() => {
                    retryCount++;
                    if (forceRefreshMarkers()) {
                        clearInterval(retryInterval);
                    } else if (retryCount >= 5) {
                        clearInterval(retryInterval);
                        console.warn('⚠️ Could not refresh markers automatically - markers will update on next interaction');
                    }
                }, 2000);
            }
        }, 1000);

    });

    // ============= REMOVE "CHECKING..." TEXT PERMANENTLY =============
    
    // Aggressive removal every 500ms
    setInterval(() => {
        // Remove from any leaflet tooltips
        document.querySelectorAll('.leaflet-tooltip').forEach(el => {
            const text = el.textContent || '';
            if (text.toLowerCase().includes('checking') || 
                text.toLowerCase().includes('loading') ||
                text.toLowerCase().includes('wait')) {
                // If it's not our custom tooltip, hide it
                if (!el.classList.contains('final-worldclass-tooltip') &&
                    !el.classList.contains('worldclass-driver-tooltip') &&
                    !el.classList.contains('driver-location-tooltip')) {
                    el.style.display = 'none';
                }
            }
        });
        
        // Remove from any leaflet labels
        document.querySelectorAll('.leaflet-label').forEach(el => {
            el.style.display = 'none';
        });
        
        // Remove from marker divs
        document.querySelectorAll('.custom-div-icon').forEach(el => {
            const text = el.textContent || '';
            if (text.toLowerCase().includes('checking') || text.toLowerCase().includes('loading')) {
                // Find and remove the offending text node
                Array.from(el.childNodes).forEach(node => {
                    if (node.nodeType === Node.TEXT_NODE) {
                        const nodeText = node.textContent || '';
                        if (nodeText.toLowerCase().includes('checking') || nodeText.toLowerCase().includes('loading')) {
                            node.remove();
                        }
                    }
                });
            }
        });
    }, 500);

    // ============= PREMIUM CSS =============
    
    const style = document.createElement('style');
    style.textContent = `
        .final-worldclass-driver-marker, .final-worldclass-tooltip {
            border: none !important;
            background: transparent !important;
            box-shadow: none !important;
            padding: 0 !important;
        }
        .final-worldclass-tooltip::before { display: none !important; }
        
        /* Hide ALL non-custom tooltips and labels */
        .leaflet-tooltip:not(.final-worldclass-tooltip):not(.worldclass-driver-tooltip):not(.driver-location-tooltip) {
            display: none !important;
        }
        .leaflet-label { display: none !important; }
        .leaflet-marker-icon::after, .leaflet-marker-icon::before {
            content: none !important;
            display: none !important;
        }
        
        /* Premium animations */
        @keyframes pulse-ring { 0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.8; } 50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.4; } 100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.8; } }
        @keyframes float { 0%, 100% { transform: translate(-50%, -50%) translateY(0px); } 50% { transform: translate(-50%, -50%) translateY(-5px); } }
        @keyframes pulse-wave { 0% { transform: scale(1); opacity: 0.6; } 100% { transform: scale(1.5); opacity: 0; } }
        @keyframes pulse-dot { 0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7), 0 4px 12px rgba(239, 68, 68, 0.5); } 50% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0), 0 4px 12px rgba(239, 68, 68, 0.8); } }
        @keyframes pulse-glow-text { 0%, 100% { box-shadow: 0 0 16px rgba(239, 68, 68, 0.8), inset 0 1px 2px rgba(255,255,255,0.3); } 50% { box-shadow: 0 0 24px rgba(239, 68, 68, 1), 0 0 32px rgba(239, 68, 68, 0.6), inset 0 1px 2px rgba(255,255,255,0.4); } }
        @keyframes scan-line { 0% { left: -100%; } 100% { left: 200%; } }
    `;
    document.head.appendChild(style);

    console.log('✅ FINAL UI OVERRIDE COMPLETE');
    console.log('🎨 World-class driver markers are now active!');

})();
