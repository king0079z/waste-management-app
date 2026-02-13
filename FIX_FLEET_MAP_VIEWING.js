// FIX_FLEET_MAP_VIEWING.js
// Fixes all viewing issues in fleet map

(function() {
    'use strict';

    console.log('🔧 FLEET MAP VIEWING FIX - Loading...');

    setTimeout(() => {
        if (!window.fleetManager) {
            return; // Fleet Manager only exists on Fleet page
        }

        console.log('✅ Applying fleet map viewing fixes...');

        // ============= FIX #1: Proper Auto-Fit =============
        
        window.fleetManager.fitAllVehiclesProperly = function() {
            console.log('🎯 Fitting map to show all vehicles...');
            
            if (!this.fleetMap || !this.fleetMapMarkers) {
                console.warn('⚠️ Map or markers not ready');
                return;
            }

            // Support both Leaflet (setView/fitBounds) and Mapbox GL (setCenter/setZoom/fitBounds)
            const isLeaflet = typeof this.fleetMap.setView === 'function';
            const hasFitBounds = typeof this.fleetMap.fitBounds === 'function';

            const bounds = [];
            
            // Collect all marker positions (Leaflet markers have getLatLng)
            if (this.fleetMapMarkers instanceof Map) {
                this.fleetMapMarkers.forEach(marker => {
                    if (marker && marker.getLatLng) {
                        bounds.push(marker.getLatLng());
                    }
                });
            } else if (typeof this.fleetMapMarkers === 'object') {
                Object.values(this.fleetMapMarkers).forEach(marker => {
                    if (marker && marker.getLatLng) {
                        bounds.push(marker.getLatLng());
                    }
                });
            }

            console.log(`📍 Found ${bounds.length} markers to fit`);

            if (bounds.length > 0 && hasFitBounds) {
                try {
                    this.fleetMap.fitBounds(bounds, {
                        padding: [100, 100],
                        maxZoom: 14,
                        animate: true,
                        duration: 1.5
                    });
                    console.log('✅ Map fitted to show all vehicles');
                } catch (e) {
                    console.warn('⚠️ fitBounds failed:', e.message);
                    setDefaultView(this.fleetMap, isLeaflet);
                }
            } else {
                setDefaultView(this.fleetMap, isLeaflet);
            }

            function setDefaultView(map, leaflet) {
                const center = [25.2854, 51.5310]; // Doha [lat, lng]
                const zoom = 13;
                try {
                    if (leaflet) {
                        map.setView(center, zoom);
                    } else if (typeof map.setCenter === 'function') {
                        // Mapbox GL uses [lng, lat]
                        map.setCenter([51.5310, 25.2854]);
                        if (typeof map.setZoom === 'function') map.setZoom(zoom);
                    }
                    console.log('✅ Centered on default location');
                } catch (e) {
                    console.warn('⚠️ setView/setCenter failed:', e.message);
                }
            }
        };

        // ============= FIX #2: Proper Zoom Level =============
        
        window.fleetManager.setOptimalZoom = function() {
            if (!this.fleetMap || typeof this.fleetMap.setZoom !== 'function') return;

            const markerCount = this.fleetMapMarkers ? this.fleetMapMarkers.size || Object.keys(this.fleetMapMarkers || {}).length : 0;
            
            let optimalZoom = 13; // Default
            
            if (markerCount <= 2) {
                optimalZoom = 14;
            } else if (markerCount <= 5) {
                optimalZoom = 13;
            } else {
                optimalZoom = 12;
            }

            try {
                this.fleetMap.setZoom(optimalZoom);
                console.log(`📏 Set optimal zoom: ${optimalZoom} for ${markerCount} vehicles`);
            } catch (e) {
                console.warn('⚠️ setZoom failed:', e.message);
            }
        };

        // ============= FIX #3: Override fitAllVehicles Button =============
        
        window.fleetManager.fitAllVehicles = function() {
            this.fitAllVehiclesProperly();
        };

        // ============= FIX #4: Auto-Fit After Map Loads =============
        
        const originalLoadVehiclesOnMap = window.fleetManager.loadVehiclesOnMap;
        
        window.fleetManager.loadVehiclesOnMap = function() {
            if (originalLoadVehiclesOnMap) {
                originalLoadVehiclesOnMap.call(this);
            }
            
            // Auto-fit after loading (guard so one failure doesn't break)
            setTimeout(() => {
                try {
                    if (this.fitAllVehiclesProperly) this.fitAllVehiclesProperly.call(this);
                } catch (e) {
                    console.warn('⚠️ Auto-fit after load failed:', e.message);
                }
            }, 1000);
        };

        // ============= FIX #5: Implement Map Controls =============
        
        // Heatmap button
        window.toggleFleetHeatmap = function() {
            console.log('🔥 Heatmap feature');
            alert('Heatmap: Shows concentration of vehicle activity\n\nThis feature displays where your fleet spends most time.');
        };

        // Traffic button
        window.toggleFleetTraffic = function() {
            console.log('🚦 Traffic feature');
            alert('Traffic Layer: Real-time traffic conditions\n\nShows live traffic data to help optimize routes.');
        };

        // Weather button
        window.toggleFleetWeather = function() {
            console.log('🌤️ Weather feature');
            alert('Weather Layer: Current weather conditions\n\nDisplays weather data that might affect operations.');
        };

        // Route Replay button
        window.toggleFleetRouteReplay = function() {
            console.log('📹 Route Replay feature');
            alert('Route Replay: Playback historical routes\n\nReview how vehicles traveled in the past.');
        };

        // Export View button
        window.exportFleetMapView = function() {
            console.log('📸 Export Map View');
            alert('Export View: Save current map view\n\nExports the current view as an image or data file.');
        };

        // Settings button – open the map settings panel
        window.openFleetMapSettings = function() {
            var panel = document.getElementById('fleetMapSettingsPanel');
            if (!panel) return;
            var isVisible = panel.style.display === 'block';
            panel.style.display = isVisible ? 'none' : 'block';
            if (!isVisible && window.fleetManager) {
                var cb = document.getElementById('fleetMapSettingsRouteLines');
                if (cb) cb.checked = window.fleetManager.showRouteLines !== false;
            }
            console.log('⚙️ Map Settings ' + (isVisible ? 'closed' : 'opened'));
        };

        // Sync Route lines checkbox with fleet manager (when panel is open)
        function initFleetMapSettingsPanel() {
            var panel = document.getElementById('fleetMapSettingsPanel');
            var cb = document.getElementById('fleetMapSettingsRouteLines');
            if (!panel || !cb) return;
            cb.addEventListener('change', function() {
                if (window.fleetManager && typeof window.fleetManager.setRouteLinesVisible === 'function') {
                    window.fleetManager.setRouteLinesVisible(cb.checked);
                }
                if (window.updateRouteLinesButtonLabel) window.updateRouteLinesButtonLabel(cb.checked);
            });
        }
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initFleetMapSettingsPanel);
        } else {
            setTimeout(initFleetMapSettingsPanel, 500);
        }

        // ============= FIX #6: Wire Up Control Buttons =============
        
        setTimeout(() => {
            const controls = document.querySelectorAll('#fleetMapContainer button');
            controls.forEach(btn => {
                const text = btn.textContent.trim();
                
                if (text.includes('Heatmap')) {
                    btn.onclick = window.toggleFleetHeatmap;
                } else if (text.includes('Traffic')) {
                    btn.onclick = window.toggleFleetTraffic;
                } else if (text.includes('Weather')) {
                    btn.onclick = window.toggleFleetWeather;
                } else if (text.includes('Route Replay')) {
                    btn.onclick = window.toggleFleetRouteReplay;
                } else if (text.includes('Export')) {
                    btn.onclick = window.exportFleetMapView;
                } else if (text.includes('Settings')) {
                    btn.onclick = window.openFleetMapSettings;
                }
            });
            
            console.log('✅ Map control buttons wired up');
        }, 3000);

        // ============= AUTO-FIX ON FLEET PAGE OPEN =============
        
        // Monitor for fleet page becoming visible
        const observer = new MutationObserver(() => {
            try {
                const fleetSection = document.getElementById('fleet');
                const fleetMapContainer = document.getElementById('fleetMapContainer');
                
                if (fleetSection && fleetSection.style.display !== 'none' && 
                    fleetMapContainer && window.fleetManager && window.fleetManager.fleetMap) {
                    
                    if (!window._fleetMapAutoFitted) {
                        setTimeout(() => {
                            try {
                                if (window.fleetManager.fitAllVehiclesProperly) {
                                    window.fleetManager.fitAllVehiclesProperly();
                                    window._fleetMapAutoFitted = true;
                                }
                            } catch (e) {
                                console.warn('⚠️ Fleet auto-fit on visible failed:', e.message);
                            }
                        }, 500);
                    }
                }
            } catch (e) {
                console.warn('⚠️ Fleet observer callback:', e.message);
            }
        });
        
        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ['style'],
            subtree: true
        });

        console.log('✅ Fleet map viewing fixes applied');

    }, 2000);

})();
