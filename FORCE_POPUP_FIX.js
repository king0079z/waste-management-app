// FORCE_POPUP_FIX.js - v6.0 - COMPLETE OVERRIDE - NO MAP-MANAGER HANDLERS

(function() {
    console.log(`%c🚨 POPUP FIX v6.2 + WORLD-CLASS UI`, 'background: #dc2626; color: white; font-weight: bold; padding: 12px 24px; font-size: 20px;');
    
    let currentOpenPopup = null;
    let currentOpenBinId = null;
    let currentOpenMarker = null;
    
    // Wait for everything to load
    let checkInterval = setInterval(() => {
        if (typeof L !== 'undefined' && typeof mapManager !== 'undefined' && mapManager.map) {
            clearInterval(checkInterval);
            setTimeout(applyFix, 1000); // Wait 1 second for all other scripts to load
        }
    }, 100);
    
    function applyFix() {
        console.log(`%c🔧 Applying TOTAL OVERRIDE...`, 'background: #f59e0b; color: white; font-weight: bold; padding: 8px;');
        
        // 1. Override Leaflet Popup close completely
        if (L.Popup && L.Popup.prototype) {
            L.Popup.prototype._close = function() {
                if (this._manualClose) {
                    console.log(`%c✅ Manual close allowed`, 'background: #10b981; color: white; padding: 4px;');
                    this._manualClose = false;
                    const map = this._map;
                    if (map) {
                        map.removeLayer(this);
                    }
                    this.fire('remove');
                    return;
                }
                // Block all automatic closes
                console.log(`%c⛔ Blocked automatic close`, 'background: #dc2626; color: white; padding: 4px;');
                return false;
            };
        }
        
        // 2. COMPLETELY REPLACE addBinMarker function
        mapManager.addBinMarker = function(bin) {
            if (!this.map || !bin.lat || !bin.lng) return;
            
            // Don't recreate if popup is open
            if (this.markers.bins && this.markers.bins[bin.id]) {
                const existing = this.markers.bins[bin.id];
                if (existing === currentOpenMarker && existing.isPopupOpen && existing.isPopupOpen()) {
                    return; // BLOCKED - popup is open
                }
                // Remove old marker
                if (this.layers.bins && this.layers.bins.hasLayer(existing)) {
                    this.layers.bins.removeLayer(existing);
                }
                delete this.markers.bins[bin.id];
            }
            
            // Recompute fill from distance + calibration when available (avoids showing stale 8% from server)
            const distanceCmVal = (bin.sensorData && bin.sensorData.distanceCm != null) ? Number(bin.sensorData.distanceCm) : null;
            const emptyCm = bin.sensorDistanceEmptyCm != null ? Number(bin.sensorDistanceEmptyCm) : 200;
            const fullCm = bin.sensorDistanceFullCm != null ? Number(bin.sensorDistanceFullCm) : 0;
            let fillLevel = bin.fill != null ? bin.fill : (bin.fillLevel != null ? bin.fillLevel : 0);
            if (distanceCmVal !== null && !isNaN(distanceCmVal) && emptyCm > fullCm) {
                fillLevel = Math.max(0, Math.min(100, 100 * (emptyCm - distanceCmVal) / (emptyCm - fullCm)));
            }
            const fillDisplay = Math.round(fillLevel * 10) / 10; // 1 decimal for marker (no long decimals)
            const color = this.getBinColor(bin);
            
            const icon = L.divIcon({
                className: '', // Clear default className to prevent Leaflet's default styling
                html: `
                    <div style="
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
                        background: linear-gradient(180deg, rgba(0,0,0,0.1) 0%, ${color} 100%);
                        border: 3px solid rgba(255,255,255,0.4);
                        position: relative;
                        overflow: hidden;
                    ">
                        <span style="font-size: 1.2rem; margin-bottom: -2px; text-shadow: 0 2px 6px rgba(0,0,0,0.8);">${fillLevel >= 90 ? '🚨' : fillLevel >= 75 ? '⚠️' : '✅'}</span>
                        <span style="font-size: 0.75rem; font-weight: bold; text-shadow: 0 2px 6px rgba(0,0,0,0.8);">${fillDisplay}%</span>
                    </div>
                `,
                iconSize: [55, 55],
                iconAnchor: [27, 27]
            });
            
            // Create popup content
            const popupContent = this.createBinPopup(bin);
            
            // Create marker
            const marker = L.marker([bin.lat, bin.lng], { icon })
                .bindPopup(popupContent, {
                    maxWidth: 400,
                    className: 'bin-popup',
                    closeButton: true,
                    autoPan: true,
                    autoClose: false,
                    closeOnClick: false,
                    keepInView: true
                });
            
            // Remove ALL existing event handlers
            marker.off();
            
            // Add ONLY our click handler
            marker.on('click', function(e) {
                if (e && e.originalEvent) {
                    e.originalEvent.stopPropagation();
                    e.originalEvent.preventDefault();
                }
                
                // Close current open popup if different
                if (currentOpenMarker && currentOpenMarker !== this && currentOpenPopup) {
                    currentOpenPopup._manualClose = true;
                    currentOpenMarker.closePopup();
                }
                
                // Open this popup
                if (!this.isPopupOpen || !this.isPopupOpen()) {
                    this.openPopup();
                }
            });
            
            // Track popup open
            marker.on('popupopen', function() {
                const popup = this.getPopup();
                currentOpenPopup = popup;
                currentOpenBinId = bin.id;
                currentOpenMarker = this;
                
                console.log(`%c🔓 OPENED: ${bin.id}`, 'background: #10b981; color: white; font-weight: bold; padding: 6px 12px;');
                
                // Setup X button IMMEDIATELY
                if (popup && popup._container) {
                    setTimeout(() => {
                        const closeBtn = popup._container.querySelector('.leaflet-popup-close-button');
                        if (closeBtn) {
                            closeBtn.onclick = function(e) {
                                e.preventDefault();
                                e.stopPropagation();
                                popup._manualClose = true;
                                
                                // Close popup safely
                                if (currentOpenMarker && typeof currentOpenMarker.closePopup === 'function') {
                                    currentOpenMarker.closePopup();
                                } else if (marker && typeof marker.closePopup === 'function') {
                                    marker.closePopup();
                                }
                                
                                return false;
                            };
                        }
                    }, 50);
                    
                    // Block events
                    L.DomEvent.disableClickPropagation(popup._container);
                    L.DomEvent.disableScrollPropagation(popup._container);
                }
            });
            
            // Track popup close
            marker.on('popupclose', function() {
                if (currentOpenBinId === bin.id) {
                    currentOpenPopup = null;
                    currentOpenBinId = null;
                    currentOpenMarker = null;
                }
                console.log(`%c🔒 CLOSED: ${bin.id}`, 'background: #ef4444; color: white; padding: 4px;');
            });
            
            // Add to map
            if (this.layers.bins) {
                marker.addTo(this.layers.bins);
            }
            
            this.markers.bins[bin.id] = marker;
        };
        
        // 3. Disable map closing popups
        if (mapManager.map) {
            mapManager.map.options.closePopupOnClick = false;
        }
        
        console.log(`%c✅ TOTAL OVERRIDE COMPLETE`, 'background: #10b981; color: white; font-weight: bold; padding: 8px 16px; font-size: 14px;');
    }
})();
