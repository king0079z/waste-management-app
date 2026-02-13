// MAPBOX_FLEET_MAP.js
// Premium Mapbox GL JS implementation for Fleet Management Map
// Replace 'YOUR_MAPBOX_TOKEN_HERE' with your actual token from https://account.mapbox.com

(function() {
    'use strict';

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🗺️ MAPBOX FLEET MAP - LOADING');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');

    // ============= MAPBOX CONFIGURATION =============
    
    // Mapbox Access Token (FREE - 50,000 loads/month)
    const MAPBOX_TOKEN = 'pk.eyJ1Ijoia2luZzAwODl6IiwiYSI6ImNtbDQ1eTV5ZzB0Z3YzY3NiNnludzNpNW8ifQ.VzMRsrI2SjN_BvqGNMUcCA';
    
    // Set Mapbox access token
    if (typeof mapboxgl !== 'undefined') {
        mapboxgl.accessToken = MAPBOX_TOKEN;
        console.log('✅ Mapbox GL JS loaded');
    } else {
        console.error('❌ Mapbox GL JS not loaded! Check if script tag is in index.html');
        return;
    }

    // Wait for fleet manager
    function waitForFleetManager(callback) {
        let attempts = 0;
        const interval = setInterval(() => {
            attempts++;
            if (window.fleetManager && window.dataManager) {
                clearInterval(interval);
                callback();
            } else if (attempts > 100) {
                clearInterval(interval);
                console.warn('⚠️ Fleet Manager not found');
            }
        }, 200);
    }

    waitForFleetManager(() => {
        console.log('✅ Fleet Manager ready, applying Mapbox...');

        // ============= MAPBOX FLEET MAP INITIALIZATION =============
        
        window.fleetManager.initializeMapboxFleetMap = function() {
            const mapContainer = document.getElementById('fleetMap');
            if (!mapContainer) {
                console.error('❌ Fleet map container not found');
                return;
            }

            // Check if Mapbox token is set
            if (MAPBOX_TOKEN === 'YOUR_MAPBOX_TOKEN_HERE') {
                console.error('❌ Mapbox token not set!');
                console.error('Please replace YOUR_MAPBOX_TOKEN_HERE in MAPBOX_FLEET_MAP.js with your actual token');
                alert('⚠️ Mapbox Token Required\n\nPlease:\n1. Sign up at https://account.mapbox.com\n2. Get your token\n3. Replace YOUR_MAPBOX_TOKEN_HERE in MAPBOX_FLEET_MAP.js');
                return;
            }

            // Remove old map if exists
            if (this.fleetMap) {
                try {
                    if (this.fleetMap.remove) {
                        this.fleetMap.remove();
                    }
                } catch (e) {
                    console.warn('Could not remove old map:', e.message);
                }
            }

            console.log('🗺️ Initializing Mapbox fleet map...');

            try {
                // Defer style load until page is visible to avoid ajax.send race in Mapbox internals
                if (typeof document !== 'undefined' && document.hidden) {
                    const fm = this;
                    const onVisible = () => {
                        document.removeEventListener('visibilitychange', onVisible);
                        if (fm.fleetMap) return;
                        fm.initializeMapboxFleetMap();
                    };
                    document.addEventListener('visibilitychange', onVisible);
                    return;
                }

                // Create Mapbox GL JS map with premium dark style
                this.fleetMap = new mapboxgl.Map({
                    container: 'fleetMap',
                    style: 'mapbox://styles/mapbox/dark-v11', // Premium dark theme
                    center: [51.5310, 25.2854], // Note: Mapbox uses [lng, lat] order!
                    zoom: 12.5,
                    pitch: 0, // Can be 45-60 for 3D view
                    bearing: 0, // Rotation angle
                    attributionControl: true,
                    logoPosition: 'bottom-left'
                });

                // Add navigation controls (zoom, rotate, pitch)
                this.fleetMap.addControl(new mapboxgl.NavigationControl({
                    showCompass: true,
                    showZoom: true,
                    visualizePitch: true
                }), 'top-right');

                // Add scale control
                this.fleetMap.addControl(new mapboxgl.ScaleControl({
                    maxWidth: 100,
                    unit: 'metric'
                }), 'bottom-left');

                // Add fullscreen control
                this.fleetMap.addControl(new mapboxgl.FullscreenControl(), 'top-right');

                // Initialize marker storage
                this.mapboxMarkers = {
                    bins: [],
                    drivers: [],
                    routes: []
                };
                // Route lines visibility (orange = in-progress, blue = pending) – off by default
                this.showRouteLines = false;
                this.mapboxRouteLayerIds = [];
                this.mapboxRouteSourceIds = [];

                console.log('✅ Mapbox map initialized');

                // Wait for map to load, then add data
                this.fleetMap.on('load', () => {
                    console.log('✅ Mapbox map loaded');
                    this.loadMapboxFleetData();
                    this.startMapboxRealTimeUpdates();
                    // Critical: resize so map fills container (fixes small-map-in-corner)
                    requestAnimationFrame(() => {
                        if (this.fleetMap && this.fleetMap.resize) this.fleetMap.resize();
                    });
                    setTimeout(() => {
                        if (this.fleetMap && this.fleetMap.resize) this.fleetMap.resize();
                    }, 100);
                    setTimeout(() => {
                        if (this.fleetMap && this.fleetMap.resize) this.fleetMap.resize();
                    }, 500);
                });

                // Error handling (suppress internal ajax/vector_tile send errors)
                this.fleetMap.on('error', (e) => {
                    const msg = (e && e.error && e.error.message) ? String(e.error.message) : String(e);
                    if (msg.indexOf("'send'") !== -1 && (msg.indexOf('undefined') !== -1 || msg.indexOf('null') !== -1)) return;
                    console.error('❌ Mapbox error:', e);
                });

            } catch (error) {
                this.fleetMap = null;
                if (error && String(error.message || '').indexOf("'send'") !== -1) return;
                console.error('❌ Mapbox map initialization error:', error);
            }
        };

        // ============= LOAD FLEET DATA ON MAPBOX =============
        
        window.fleetManager.loadMapboxFleetData = function() {
            console.log('📊 Loading fleet data on Mapbox...');

            if (!this.fleetMap) {
                console.warn('⚠️ Mapbox map not initialized');
                return;
            }

            // Get data
            const drivers = window.dataManager.getUsers().filter(u => u.type === 'driver');
            const bins = window.dataManager.getBins();
            const routes = window.dataManager.getRoutes();
            const locations = window.dataManager.getAllDriverLocations();

            console.log(`📊 Data: ${drivers.length} drivers, ${bins.length} bins, ${routes.length} routes`);

            // Clear existing markers
            if (this.mapboxMarkers) {
                this.mapboxMarkers.bins.forEach(m => m.remove());
                this.mapboxMarkers.drivers.forEach(m => m.remove());
                this.mapboxMarkers.bins = [];
                this.mapboxMarkers.drivers = [];
            } else {
                this.mapboxMarkers = { bins: [], drivers: [], routes: [] };
            }

            // FLEET MAP: Show ONLY vehicles/drivers (NO bins)
            console.log('📍 Fleet map configured to show vehicles only (no bins)');

            // Add drivers to map
            drivers.forEach(driver => {
                let location = locations[driver.id];
                
                if (!location || !location.lat || !location.lng) {
                    location = {
                        lat: 25.2854 + (Math.random() * 0.02 - 0.01),
                        lng: 51.5310 + (Math.random() * 0.02 - 0.01),
                        timestamp: new Date().toISOString()
                    };
                }

                const isLive = location.timestamp && (new Date() - new Date(location.timestamp)) / 1000 < 60;
                const collections = window.dataManager.getDriverCollections(driver.id);
                const todayCollections = collections.filter(c => 
                    new Date(c.timestamp).toDateString() === new Date().toDateString()
                ).length;

                let statusColor = '#3b82f6', statusIcon = '🚛', statusText = 'READY';

                if (driver.movementStatus === 'on-route' || driver.movementStatus === 'ai-route') {
                    statusColor = '#f59e0b';
                    statusIcon = '🚚';
                    statusText = 'ON ROUTE';
                } else if (driver.movementStatus === 'driving') {
                    statusColor = '#3b82f6';
                    statusIcon = '🚗';
                    statusText = 'DRIVING';
                }

                // Create custom marker element
                const el = document.createElement('div');
                el.className = 'mapbox-driver-marker';
                el.innerHTML = `
                    <div style="position: relative; width: 70px; height: 70px;">
                        <div style="
                            position: absolute;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%);
                            width: 90px;
                            height: 90px;
                            border-radius: 50%;
                            background: radial-gradient(circle, ${statusColor}35 0%, transparent 70%);
                            ${(driver.movementStatus === 'on-route' || driver.movementStatus === 'driving') ? 'animation: pulse-ring 2s ease-out infinite;' : ''}
                            pointer-events: none;
                        "></div>
                        
                        <div style="
                            position: absolute;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%);
                            width: 70px;
                            height: 70px;
                            border-radius: 50%;
                            background: linear-gradient(135deg, ${statusColor} 0%, ${statusColor}cc 50%, ${statusColor}99 100%);
                            box-shadow: 
                                0 12px 35px rgba(0,0,0,0.6),
                                0 5px 15px ${statusColor}70,
                                inset 0 2px 8px rgba(255,255,255,0.35),
                                inset 0 -3px 8px rgba(0,0,0,0.35);
                            border: 3px solid rgba(255,255,255,0.95);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            cursor: pointer;
                            transition: transform 0.3s ease;
                        " onmouseover="this.style.transform='translate(-50%, -50%) scale(1.12)'"
                           onmouseout="this.style.transform='translate(-50%, -50%) scale(1)'">
                            
                            <div style="
                                position: absolute;
                                top: 12%;
                                left: 12%;
                                width: 45%;
                                height: 45%;
                                border-radius: 50%;
                                background: radial-gradient(circle at 35% 35%, rgba(255,255,255,0.7), transparent);
                                pointer-events: none;
                            "></div>
                            
                            <div style="
                                font-size: 34px;
                                z-index: 2;
                                position: relative;
                                filter: drop-shadow(0 4px 8px rgba(0,0,0,0.8));
                            ">${statusIcon}</div>
                        </div>
                        
                        ${isLive ? `
                            <div style="
                                position: absolute;
                                top: 0;
                                left: 0;
                                width: 16px;
                                height: 16px;
                                background: #ef4444;
                                border-radius: 50%;
                                border: 3px solid white;
                                box-shadow: 0 0 0 5px rgba(239, 68, 68, 0.3), 0 4px 12px rgba(239, 68, 68, 0.6);
                                animation: pulse-dot 1.5s ease-in-out infinite;
                                z-index: 10;
                            "></div>
                        ` : ''}
                        
                        ${todayCollections > 0 ? `
                            <div style="
                                position: absolute;
                                top: -2px;
                                right: -2px;
                                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                                color: white;
                                font-size: 0.7rem;
                                padding: 4px 8px;
                                border-radius: 14px;
                                font-weight: 800;
                                box-shadow: 0 4px 12px rgba(16, 185, 129, 0.6);
                                border: 2px solid white;
                                z-index: 10;
                                min-width: 26px;
                                text-align: center;
                            ">${todayCollections}</div>
                        ` : ''}
                    </div>
                `;

                // Create popup
                const activeRoutes = routes.filter(r => r.driverId === driver.id && r.status !== 'completed').length;
                const fuelLevel = driver.fuelLevel || 75;

                const popupHTML = `
                    <div style="padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; min-width: 320px;">
                        <div style="background: linear-gradient(135deg, ${statusColor} 0%, ${statusColor}dd 100%); padding: 16px; border-radius: 8px 8px 0 0;">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="width: 55px; height: 55px; background: rgba(255,255,255,0.25); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.6rem; border: 2px solid rgba(255,255,255,0.4);">
                                    ${driver.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div style="flex: 1;">
                                    <h3 style="margin: 0 0 4px 0; color: white; font-size: 1.2rem; font-weight: 800;">${driver.name}</h3>
                                    <div style="color: rgba(255,255,255,0.9); font-size: 0.8rem;">🆔 ${driver.id}</div>
                                </div>
                                ${isLive ? `<div style="background: rgba(239, 68, 68, 0.95); padding: 5px 10px; border-radius: 16px; font-size: 0.65rem; font-weight: 800; color: white; text-transform: uppercase;">🔴 LIVE</div>` : ''}
                            </div>
                        </div>
                        <div style="padding: 16px;">
                            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 12px;">
                                <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); padding: 10px; border-radius: 8px; text-align: center;">
                                    <div style="color: #6ee7b7; font-size: 0.65rem; margin-bottom: 4px;">COLLECTIONS</div>
                                    <div style="color: #10b981; font-size: 1.3rem; font-weight: 800;">${todayCollections}</div>
                                </div>
                                <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); padding: 10px; border-radius: 8px; text-align: center;">
                                    <div style="color: #fcd34d; font-size: 0.65rem; margin-bottom: 4px;">ROUTES</div>
                                    <div style="color: #f59e0b; font-size: 1.3rem; font-weight: 800;">${activeRoutes}</div>
                                </div>
                                <div style="background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.3); padding: 10px; border-radius: 8px; text-align: center;">
                                    <div style="color: #c4b5fd; font-size: 0.65rem; margin-bottom: 4px;">FUEL</div>
                                    <div style="color: ${fuelLevel > 50 ? '#10b981' : '#f59e0b'}; font-size: 1.3rem; font-weight: 800;">${fuelLevel}%</div>
                                </div>
                            </div>
                            <div style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(37, 99, 235, 0.06) 100%); border: 1px solid rgba(59, 130, 246, 0.25); padding: 12px; border-radius: 8px; margin-bottom: 12px;">
                                <div style="color: rgba(96, 165, 250, 0.7); font-size: 0.65rem; font-weight: 600; text-transform: uppercase; margin-bottom: 6px;">📍 GPS COORDINATES</div>
                                <div style="color: #60a5fa; font-weight: 700; font-size: 0.9rem; font-family: 'Courier New', monospace; line-height: 1.6; text-align: center;">${location.lat.toFixed(6)}<br>${location.lng.toFixed(6)}</div>
                                ${location.accuracy ? `<div style="color: rgba(96, 165, 250, 0.6); font-size: 0.65rem; text-align: center; margin-top: 6px;">±${Math.round(location.accuracy)}m</div>` : ''}
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                                <button onclick="window.assignRouteToDriver('${driver.id}')" style="padding: 10px; background: linear-gradient(135deg, #3b82f6 0%, #7c3aed 100%); color: white; border: none; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 0.8rem;">🤖 Assign</button>
                                <button onclick="window.viewDriverDetails('${driver.id}')" style="padding: 10px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border: none; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 0.8rem;">📊 Details</button>
                            </div>
                        </div>
                    </div>
                `;

                const popup = new mapboxgl.Popup({ 
                    offset: 35,
                    className: 'mapbox-fleet-popup',
                    closeButton: true,
                    closeOnClick: false,
                    maxWidth: '360px'
                }).setHTML(popupHTML);

                // Create marker
                const marker = new mapboxgl.Marker({
                    element: el,
                    anchor: 'center'
                })
                .setLngLat([location.lng, location.lat])
                .setPopup(popup)
                .addTo(this.fleetMap);

                this.mapboxMarkers.drivers.push(marker);
            });

            console.log(`✅ ${drivers.length} drivers added to Mapbox`);

            // Remove existing route lines (so we don't duplicate when data refreshes)
            if (this.mapboxRouteLayerIds && this.mapboxRouteLayerIds.length > 0) {
                this.mapboxRouteLayerIds.forEach(layerId => {
                    if (this.fleetMap.getLayer(layerId)) this.fleetMap.removeLayer(layerId);
                });
                this.mapboxRouteLayerIds = [];
            }
            if (this.mapboxRouteSourceIds && this.mapboxRouteSourceIds.length > 0) {
                this.mapboxRouteSourceIds.forEach(sourceId => {
                    if (this.fleetMap.getSource(sourceId)) this.fleetMap.removeSource(sourceId);
                });
                this.mapboxRouteSourceIds = [];
            }

            // Add routes as lines (orange = in-progress, blue = pending) – only if route lines are enabled
            const activeRoutes = routes.filter(r => r.status !== 'completed');
            
            activeRoutes.forEach((route, index) => {
                const driverLoc = locations[route.driverId];
                if (!driverLoc || !route.binIds || route.binIds.length === 0) return;

                const coordinates = [[driverLoc.lng, driverLoc.lat]]; // Note: [lng, lat] for Mapbox
                
                route.binIds.forEach(binId => {
                    const bin = bins.find(b => b.id === binId);
                    if (bin && bin.lat && bin.lng) {
                        coordinates.push([bin.lng, bin.lat]);
                    }
                });

                if (coordinates.length > 1) {
                    const color = route.status === 'in-progress' ? '#f59e0b' : '#3b82f6';
                    const sourceId = `route-${route.id || index}`;
                    const layerId = `route-layer-${route.id || index}`;

                    this.fleetMap.addSource(sourceId, {
                        'type': 'geojson',
                        'data': {
                            'type': 'Feature',
                            'properties': {},
                            'geometry': {
                                'type': 'LineString',
                                'coordinates': coordinates
                            }
                        }
                    });
                    this.mapboxRouteSourceIds.push(sourceId);

                    this.fleetMap.addLayer({
                        'id': layerId,
                        'type': 'line',
                        'source': sourceId,
                        'layout': {
                            'line-join': 'round',
                            'line-cap': 'round',
                            'visibility': this.showRouteLines ? 'visible' : 'none'
                        },
                        'paint': {
                            'line-color': color,
                            'line-width': 5,
                            'line-opacity': 0.75,
                            'line-dasharray': route.status === 'pending' ? [2, 1] : [1, 0]
                        }
                    });
                    this.mapboxRouteLayerIds.push(layerId);
                }
            });

            console.log(`✅ ${activeRoutes.length} routes added to Mapbox (route lines ${this.showRouteLines ? 'on' : 'off'})`);
            if (window.updateRouteLinesButtonLabel) window.updateRouteLinesButtonLabel(this.showRouteLines);

            // Auto-fit to show all vehicle markers
            if (this.mapboxMarkers.drivers.length > 0) {
                const bounds = new mapboxgl.LngLatBounds();
                
                this.mapboxMarkers.drivers.forEach(m => bounds.extend(m.getLngLat()));
                
                this.fleetMap.fitBounds(bounds, {
                    padding: {top: 80, bottom: 80, left: 80, right: 80},
                    maxZoom: 15,
                    duration: 1500
                });
                
                console.log('✅ Map auto-fitted to show all vehicles');
            }

            console.log('✅ Mapbox fleet map fully loaded!');
        };

        // ============= REAL-TIME UPDATES =============
        
        window.fleetManager.startMapboxRealTimeUpdates = function() {
            if (this.mapboxUpdateInterval) {
                clearInterval(this.mapboxUpdateInterval);
            }

            this.mapboxUpdateInterval = setInterval(() => {
                if (this.fleetMap && this.currentTab === 'map') {
                    this.updateMapboxDriverPositions();
                }
            }, 5000);

            console.log('✅ Mapbox real-time updates started (every 5 seconds)');
        };

        window.fleetManager.updateMapboxDriverPositions = function() {
            if (!this.fleetMap || !this.mapboxMarkers) return;

            const locations = window.dataManager.getAllDriverLocations();
            const drivers = window.dataManager.getUsers().filter(u => u.type === 'driver');

            // Update driver marker positions
            this.mapboxMarkers.drivers.forEach((marker, index) => {
                const driver = drivers[index];
                if (driver) {
                    const location = locations[driver.id];
                    if (location && location.lat && location.lng) {
                        // Smooth animated transition to new position
                        marker.setLngLat([location.lng, location.lat]);
                    }
                }
            });
        };

        // ============= REFRESH METHODS =============
        
        window.fleetManager.refreshMapboxMap = function() {
            console.log('🔄 Refreshing Mapbox fleet map...');
            this.loadMapboxFleetData();
        };

        window.fleetManager.fitAllMapboxVehicles = function() {
            if (!this.fleetMap || !this.mapboxMarkers) return;

            const bounds = new mapboxgl.LngLatBounds();
            let hasMarkers = false;

            // Only fit to vehicle/driver markers
            if (this.mapboxMarkers.drivers) {
                this.mapboxMarkers.drivers.forEach(m => {
                    bounds.extend(m.getLngLat());
                    hasMarkers = true;
                });
            }

            if (hasMarkers) {
                this.fleetMap.fitBounds(bounds, {
                    padding: {top: 80, bottom: 80, left: 80, right: 80},
                    maxZoom: 15,
                    duration: 1500
                });
                console.log('✅ Fitted to all vehicles');
            }
        };

        // ============= ROUTE LINES TOGGLE (show/hide blue & orange route lines) =============
        
        window.fleetManager.setRouteLinesVisible = function(visible) {
            this.showRouteLines = !!visible;
            if (!this.fleetMap || !this.mapboxRouteLayerIds) return;
            this.mapboxRouteLayerIds.forEach(layerId => {
                if (this.fleetMap.getLayer(layerId)) {
                    this.fleetMap.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
                }
            });
            if (window.updateRouteLinesButtonLabel) window.updateRouteLinesButtonLabel(this.showRouteLines);
        };

        window.fleetManager.toggleRouteLines = function() {
            this.showRouteLines = !this.showRouteLines;
            this.setRouteLinesVisible(this.showRouteLines);
            console.log('🛣️ Route lines ' + (this.showRouteLines ? 'on' : 'off'));
        };

        window.updateRouteLinesButtonLabel = function(visible) {
            var el = document.getElementById('fleetMapRouteLinesLabel');
            if (el) el.textContent = visible ? 'Route lines (on)' : 'Route lines (off)';
        };

        // ============= OVERRIDE switchTab =============
        
        const originalSwitchTab = window.fleetManager.switchTab;
        window.fleetManager.switchTab = function(tab) {
            if (originalSwitchTab) {
                originalSwitchTab.call(this, tab);
            } else {
                this.currentTab = tab;
            }

            if (tab === 'map') {
                setTimeout(() => {
                    if (!this.fleetMap || !this.fleetMap._loaded) {
                        console.log('🗺️ Initializing Mapbox fleet map...');
                        this.initializeMapboxFleetMap();
                    } else if (!this.mapboxMarkers || this.mapboxMarkers.bins.length === 0) {
                        console.log('🔄 Reloading Mapbox fleet data...');
                        this.loadMapboxFleetData();
                    }
                    // Resize map so it fills the full area (tab just became visible)
                    [100, 300, 600].forEach(delay => {
                        setTimeout(() => {
                            if (this.fleetMap && this.fleetMap.resize) this.fleetMap.resize();
                        }, delay);
                    });
                }, 500);
            }
        };

        // ============= OVERRIDE refreshMap & fitAllVehicles =============
        
        window.fleetManager.refreshMap = function() {
            if (this.fleetMap && this.fleetMap._loaded) {
                this.refreshMapboxMap();
            }
        };

        window.fleetManager.fitAllVehicles = function() {
            if (this.fleetMap && this.fleetMap._loaded) {
                this.fitAllMapboxVehicles();
            }
        };

        console.log('✅ Mapbox fleet map methods installed');

        // ============= FORCE MAPBOX INITIALIZATION =============
        
        // Override the original initializeFleetMap to use Mapbox
        window.fleetManager.initializeFleetMap = function() {
            console.log('🗺️ initializeFleetMap called - using Mapbox instead...');
            this.initializeMapboxFleetMap();
        };
        
        // Only initialize when fleet section AND map tab are visible (so container has real size)
        function isFleetMapContainerVisible() {
            const fleetSection = document.getElementById('fleet');
            const mapTabContent = document.getElementById('fleetTabContentMap');
            const mapContainer = document.getElementById('fleetMap');
            if (!fleetSection || !mapTabContent || !mapContainer) return false;
            const sectionVisible = fleetSection.style.display !== 'none' && window.getComputedStyle(fleetSection).display !== 'none';
            const tabVisible = mapTabContent.style.display !== 'none' && window.getComputedStyle(mapTabContent).display !== 'none';
            const containerWidth = mapContainer.offsetWidth || mapContainer.clientWidth;
            const containerHeight = mapContainer.offsetHeight || mapContainer.clientHeight;
            return sectionVisible && tabVisible && containerWidth > 100 && containerHeight > 100;
        }

        function tryInitializeMapbox() {
            const mapContainer = document.getElementById('fleetMap');
            if (!mapContainer) return false;
            if (window.fleetManager.fleetMap && window.fleetManager.fleetMap._loaded) {
                console.log('✅ Mapbox already initialized');
                if (window.fleetManager.fleetMap.resize) window.fleetManager.fleetMap.resize();
                return true;
            }
            // Only init when container is visible and has size (prevents tiny map)
            if (!isFleetMapContainerVisible()) {
                console.log('⏳ Fleet map container not visible/sized yet, skipping init');
                return false;
            }
            console.log('🗺️ Initializing Mapbox fleet map...');
            window.fleetManager.initializeMapboxFleetMap();
            return true;
        }
        
        // Try immediately
        setTimeout(() => tryInitializeMapbox(), 1000);
        
        // Try again after 3 seconds
        setTimeout(() => {
            if (!window.fleetManager.fleetMap || !window.fleetManager.fleetMap._loaded) {
                tryInitializeMapbox();
            }
        }, 3000);
        
        // Try again after 5 seconds (final)
        setTimeout(() => {
            if (!window.fleetManager.fleetMap || !window.fleetManager.fleetMap._loaded) {
                tryInitializeMapbox();
            }
        }, 5000);
        
        // Resize map when fleet section or map tab becomes visible (fixes small map)
        function resizeMapboxIfNeeded() {
            if (window.fleetManager && window.fleetManager.fleetMap && window.fleetManager.fleetMap.resize) {
                requestAnimationFrame(() => window.fleetManager.fleetMap.resize());
            }
        }

        // Monitor for fleet section visibility: init if needed, then resize
        const observer = new MutationObserver(() => {
            const fleetSection = document.getElementById('fleet');
            const fleetMapEl = document.getElementById('fleetMap');
            if (!fleetSection || !fleetMapEl) return;
            const sectionVisible = fleetSection.style.display !== 'none' && window.getComputedStyle(fleetSection).display !== 'none';
            if (!sectionVisible) return;
            if (!window.fleetManager.fleetMap || !window.fleetManager.fleetMap._loaded) {
                setTimeout(() => tryInitializeMapbox(), 300);
            } else {
                setTimeout(resizeMapboxIfNeeded, 50);
                setTimeout(resizeMapboxIfNeeded, 200);
                setTimeout(resizeMapboxIfNeeded, 500);
            }
        });

        if (document.body) {
            observer.observe(document.body, {
                attributes: true,
                childList: true,
                subtree: true,
                attributeFilter: ['style']
            });
        }

        // Resize map when container size changes (window resize, layout change)
        const fleetMapContainer = document.getElementById('fleetMapContainer') || document.getElementById('fleetMap');
        if (fleetMapContainer && typeof ResizeObserver !== 'undefined') {
            const resizeObserver = new ResizeObserver(() => {
                if (window.fleetManager && window.fleetManager.fleetMap && window.fleetManager.fleetMap.resize) {
                    requestAnimationFrame(() => window.fleetManager.fleetMap.resize());
                }
            });
            resizeObserver.observe(fleetMapContainer);
        }
    });

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ MAPBOX FLEET MAP - READY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('⚠️  IMPORTANT: Set your Mapbox token!');
    console.log('Replace YOUR_MAPBOX_TOKEN_HERE with your actual token');
    console.log('Get token at: https://account.mapbox.com');
    console.log('');

})();
