// FIX_BIN_POPUP_CLOSING.js
// Prevents bin popups from closing immediately after opening

(function() {
    'use strict';

    console.log('🔧 BIN POPUP FIX - Loading...');

    setTimeout(() => {
        if (!window.mapManager) {
            console.error('❌ MapManager not found');
            return;
        }

        console.log('✅ Applying bin popup persistence fix...');

        // ============= TRACK OPEN POPUPS =============
        
        window._openBinPopups = new Set();

        // Override addBinMarker to track popup state
        const originalAddBinMarker = window.mapManager.addBinMarker;
        
        window.mapManager.addBinMarker = function(bin) {
            const result = originalAddBinMarker.call(this, bin);
            
            // Track when popup opens/closes
            if (this.markers.bins && this.markers.bins[bin.id]) {
                const marker = this.markers.bins[bin.id];
                
                marker.on('popupopen', () => {
                    window._openBinPopups.add(bin.id);
                    console.log(`🔓 Popup opened: ${bin.id}`);
                });
                
                marker.on('popupclose', () => {
                    window._openBinPopups.delete(bin.id);
                    console.log(`🔒 Popup closed: ${bin.id}`);
                });
            }
            
            return result;
        };

        // ============= DISABLE AUTO-REFRESH WHILE POPUP IS OPEN =============
        
        // Override loadBinsOnMap to be more cautious
        const originalLoadBinsOnMap = window.mapManager.loadBinsOnMap;
        
        window.mapManager.loadBinsOnMap = function() {
            // Check if ANY popup is open
            if (window._openBinPopups && window._openBinPopups.size > 0) {
                console.log('⏸️ Skipping bin refresh - popup is open');
                return;
            }
            
            // Check using Leaflet's built-in method
            if (this.map) {
                let hasOpenPopup = false;
                
                if (this.markers && this.markers.bins) {
                    Object.values(this.markers.bins).forEach(marker => {
                        if (marker && marker.isPopupOpen && marker.isPopupOpen()) {
                            hasOpenPopup = true;
                        }
                    });
                }
                
                if (hasOpenPopup) {
                    console.log('⏸️ Skipping bin refresh - Leaflet popup detected');
                    return;
                }
            }
            
            // Safe to refresh
            if (originalLoadBinsOnMap) {
                originalLoadBinsOnMap.call(this);
            }
        };

        // ============= PAUSE UPDATES WHEN POPUP OPENS =============
        
        window.pauseMapUpdatesForPopup = function() {
            if (window.mapManager && window.mapManager.updateInterval) {
                clearInterval(window.mapManager.updateInterval);
                console.log('⏸️ Paused map updates');
                
                // Resume after 30 seconds
                setTimeout(() => {
                    if (window._openBinPopups.size === 0) {
                        window.mapManager.startMapUpdates();
                        console.log('▶️ Resumed map updates');
                    }
                }, 30000);
            }
        };

        // ============= CLICK HANDLER FIX =============
        
        // Prevent accidental closes from map clicks
        if (window.mapManager && window.mapManager.map) {
            window.mapManager.map.on('popupopen', (e) => {
                console.log('🔓 Popup opened on map');
                
                // Store reference to open popup
                window._currentOpenPopup = e.popup;
                
                // Pause automatic updates
                window.pauseMapUpdatesForPopup();
            });
            
            window.mapManager.map.on('popupclose', (e) => {
                console.log('🔒 Popup closed on map');
                window._currentOpenPopup = null;
            });
        }

        console.log('✅ Bin popup persistence fix applied');
        console.log('📌 Popups will now stay open');
        console.log('⏸️ Map updates pause when popup is open');

    }, 2000);

})();
