// REMOVE_CHECKING_TEXT_FIX.js
// Removes any "Checking...", "Loading...", or other unwanted text from driver markers

(function() {
    'use strict';

    console.log('🧹 CLEANUP: Removing unwanted marker text...');

    // ============= REMOVE ALL UNWANTED LEAFLET LABELS/TOOLTIPS =============
    
    function cleanupDriverMarkers() {
        if (!mapManager || !mapManager.markers || !mapManager.markers.drivers) return;
        
        const drivers = dataManager.getUsers().filter(u => u.type === 'driver');
        
        drivers.forEach(driver => {
            const marker = mapManager.markers.drivers[driver.id];
            if (!marker) return;
            
            // Remove any labels (if Leaflet.label plugin exists)
            if (marker._label) {
                try {
                    if (marker.unbindLabel) marker.unbindLabel();
                    if (marker.closeLabel) marker.closeLabel();
                    delete marker._label;
                } catch (e) {
                    // Ignore
                }
            }
            
            // Remove any temporary tooltips with "checking" or "loading" text
            if (marker.getTooltip && marker.getTooltip()) {
                const tooltipElement = marker.getTooltip()._container;
                if (tooltipElement) {
                    const text = tooltipElement.textContent || '';
                    if (text.toLowerCase().includes('checking') || 
                        text.toLowerCase().includes('loading') ||
                        text.toLowerCase().includes('wait')) {
                        marker.unbindTooltip();
                        console.log(`🧹 Removed unwanted tooltip from ${driver.name}`);
                    }
                }
            }
        });
    }

    // Run cleanup every 2 seconds
    setInterval(() => {
        cleanupDriverMarkers();
    }, 2000);

    // Also run immediately on load
    setTimeout(() => {
        cleanupDriverMarkers();
    }, 1000);

    // ============= HIDE ANY CHECKING/LOADING TEXT VIA CSS =============
    
    const style = document.createElement('style');
    style.textContent = `
        /* Hide any tooltips or labels containing "checking", "loading", etc. */
        .leaflet-tooltip:not(.driver-location-tooltip) {
            display: none !important;
        }
        
        .leaflet-label {
            display: none !important;
        }
        
        /* Ensure only our custom driver tooltips show */
        .leaflet-tooltip.driver-location-tooltip {
            display: block !important;
        }
        
        /* Hide default Leaflet marker labels */
        .leaflet-marker-icon::after,
        .leaflet-marker-icon::before {
            content: none !important;
        }
    `;
    document.head.appendChild(style);

    console.log('✅ CLEANUP: Unwanted marker text removal active');

})();
