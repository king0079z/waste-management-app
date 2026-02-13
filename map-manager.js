// map-manager.js - FIXED Complete Map and Location Management with Driver Markers

class MapManager {
    constructor() {
        // 🚨 VERSION BANNER
        console.log(`%c🗺️ MAP MANAGER v3.0 LOADED - ULTRA POPUP PROTECTION`, 'background: #059669; color: white; font-weight: bold; padding: 8px 16px; border-radius: 4px; font-size: 14px;');
        
        this.map = null;
        this.driverMap = null;
        this.popupLockActive = false; // Flag to prevent popup closing
        this.markers = {
            bins: {},
            drivers: {},
            alerts: {}
        };
        this.layers = {
            bins: null,
            drivers: null,
            routes: null
        };
        this.defaultCenter = [25.2854, 51.5310]; // Doha, Qatar
        this.defaultZoom = 13;
        this.driverWatchId = null;
        this.routePolylines = [];
        this.driverPositionMarker = null;
        this.driverBinMarkers = {};
        this.currentDriverId = null;
        this.simulatedGPS = false;
        this.initRetryCount = 0;
        this.maxRetries = 5;
        this.lastDriverLoadTime = 0; // For debouncing driver loading
        this.lastDriverLocationSendTime = 0; // Throttle driver GPS push to server (2s for faster map updates)
        this.liveDriverPollingInterval = null; // Fallback polling when WebSocket is down
        this.isPollingDrivers = false; // Track polling state
        // World-class: keep map marker fill % in sync whenever any code updates a bin (sync, admin, sensor, new bin)
        if (typeof window !== 'undefined') {
            window.addEventListener('bin:updated', (e) => {
                const binId = e.detail && e.detail.binId;
                if (binId && typeof this.updateBinMarkerIcon === 'function') this.updateBinMarkerIcon(binId);
            });
        }
    }

    // Initialize main monitoring map
    async initializeMainMap(elementId = 'map') {
        const mapElement = document.getElementById(elementId);
        if (!mapElement) {
            console.error('❌ Map element not found:', elementId);
            return null;
        }
        
        if (this.map) {
            console.log('ℹ️ Map already initialized, skipping...');
            return this.map;
        }

        // Check if container has proper dimensions
        const rect = mapElement.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
            // Increment retry counter
            this.initRetryCount++;
            
            if (this.initRetryCount > this.maxRetries) {
                console.warn(`⚠️ Map initialization abandoned after ${this.maxRetries} attempts. Container may not be visible.`);
                this.initRetryCount = 0; // Reset for future attempts
                return null;
            }
            
            console.warn(`⚠️ Map container has invalid dimensions (attempt ${this.initRetryCount}/${this.maxRetries})`, rect);
            
            // Check if the container is actually supposed to be visible
            const containerParent = mapElement.parentElement;
            const isContainerVisible = mapElement.offsetParent !== null || 
                                     (containerParent && containerParent.offsetParent !== null);
            
            if (!isContainerVisible) {
                console.warn('⚠️ Map container or its parent is not visible, skipping initialization');
                this.initRetryCount = 0; // Reset counter since we're not retrying
                return null;
            }
            
            // Try to force container dimensions
            mapElement.style.width = '100%';
            mapElement.style.height = '400px';
            mapElement.style.minHeight = '400px';
            mapElement.style.display = 'block';
            mapElement.style.visibility = 'visible';
            
            // Wait a bit for CSS to apply, then check again
            await new Promise(resolve => setTimeout(resolve, 200));
            
            const newRect = mapElement.getBoundingClientRect();
            if (newRect.width === 0 || newRect.height === 0) {
                console.error(`❌ Cannot fix map container dimensions (attempt ${this.initRetryCount}/${this.maxRetries}):`, newRect);
                
                // Only retry if we haven't exceeded max attempts
                if (this.initRetryCount < this.maxRetries) {
                    setTimeout(() => {
                        console.log(`🔄 Retrying map initialization (${this.initRetryCount + 1}/${this.maxRetries})...`);
                        this.initializeMainMap(elementId).catch(error => {
                            console.error('❌ Map retry failed:', error);
                        });
                    }, 2000); // Increase delay between retries
                } else {
                    console.warn(`⚠️ Map initialization failed after ${this.maxRetries} attempts`);
                    this.initRetryCount = 0; // Reset for future attempts
                }
                
                return null;
            }
            
            console.log('✅ Map container dimensions fixed:', newRect.width, 'x', newRect.height);
        }

        const finalRect = mapElement.getBoundingClientRect();
        console.log('🗺️ Initializing map with container size:', finalRect.width, 'x', finalRect.height);

        try {
            // Create map with better error handling
            this.map = L.map(elementId, {
                center: this.defaultCenter,
                zoom: this.defaultZoom,
                zoomControl: true,
                preferCanvas: false,
                renderer: L.svg(),
                closePopupOnClick: false,  // CRITICAL: Don't close popups when clicking map
                tapTolerance: 20  // Increase touch tolerance
            });
            
            // ULTRA-AGGRESSIVE: Disable map click closing popups
            this.map.on('click', function(e) {
                // Don't close popups on map click
                console.log('🗺️ Map clicked - NOT closing popups');
                e.originalEvent?.stopPropagation();
            });

            // Add tile layer with error handling
            const tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '© OpenStreetMap contributors © CARTO',
                subdomains: 'abcd',
                maxZoom: 20,
                errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
            });

            tileLayer.on('tileerror', function(error) {
                console.warn('Tile loading error:', error);
            });

            tileLayer.addTo(this.map);

            // Create layer groups
            this.layers.bins = L.layerGroup().addTo(this.map);
            this.layers.drivers = L.layerGroup().addTo(this.map);
            this.layers.routes = L.layerGroup().addTo(this.map);

            // Add map event listeners
            this.map.on('load', () => {
                console.log('✅ Map tiles loaded successfully');
            });

            this.map.on('error', (error) => {
                console.error('❌ Map error:', error);
            });

            // Force initial size calculation
            setTimeout(() => {
                if (this.map) {
                    this.map.invalidateSize();
                }
            }, 100);

            // Load existing data with delay - fetch real driver locations first for instant display (world-class)
            setTimeout(async () => {
                console.log('🗺️ Loading bins and drivers on map...');
                this.loadBinsOnMap();
                await this.fetchAndMergeDriverLocations();
                this.initializeAllDrivers();
                this.processPendingDriverMarkers();
                this.startMapUpdates();
            }, 500);

            console.log('✅ Map initialized successfully');
            this.initRetryCount = 0; // Reset retry counter on success
            return this.map;
        } catch (error) {
            console.error('❌ Error initializing map:', error);
            this.map = null;
            return null;
        }
    }

    // Fetch driver locations from server and merge into dataManager (world-class: new drivers get real position instantly)
    async fetchAndMergeDriverLocations() {
        try {
            const response = await fetch('/api/driver/locations', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' }
            });
            if (!response.ok) return;
            const data = await response.json();
            const serverLocs = data.locations && typeof data.locations === 'object' ? data.locations : {};
            if (Object.keys(serverLocs).length === 0) return;
            const current = dataManager.getData('driverLocations') || {};
            Object.keys(serverLocs).forEach(driverId => {
                const loc = serverLocs[driverId];
                if (loc && loc.lat != null && loc.lng != null) {
                    current[driverId] = {
                        ...loc,
                        lastUpdate: loc.lastUpdate || loc.timestamp || new Date().toISOString()
                    };
                }
            });
            dataManager.setData('driverLocations', current);
        } catch (e) {
            console.warn('Fetch driver locations:', e.message);
        }
    }

    // Initialize all drivers with default locations if needed
    initializeAllDrivers() {
        console.log('Initializing all drivers on map...');
        
        const drivers = dataManager.getUsers().filter(u => u.type === 'driver');
        const locations = dataManager.getAllDriverLocations();
        
        drivers.forEach(driver => {
            let location = locations[driver.id];
            
            // If no location exists, create one
            if (!location || !location.lat || !location.lng) {
                // Generate unique position for each driver
                const offsetLat = (Math.random() - 0.5) * 0.05;
                const offsetLng = (Math.random() - 0.5) * 0.05;
                location = {
                    lat: 25.2854 + offsetLat,
                    lng: 51.5310 + offsetLng,
                    timestamp: new Date().toISOString()
                };
                
                // Save location to dataManager
                dataManager.updateDriverLocation(driver.id, location.lat, location.lng);
                console.log(`Initialized location for driver ${driver.name}: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`);
            }
            
            // Add marker for this driver
            this.addDriverMarker(driver, location);
        });
        
        // If current user is a driver, highlight their marker
        if (authManager && authManager.isDriver()) {
            const currentDriver = authManager.getCurrentUser();
            this.currentDriverId = currentDriver.id;
            this.highlightCurrentDriver();
        }
    }

    // Highlight current driver's marker
    highlightCurrentDriver() {
        if (!this.currentDriverId) return;
        
        const driver = dataManager.getUserById(this.currentDriverId);
        const location = dataManager.getDriverLocation(this.currentDriverId);
        
        if (driver && location) {
            // Remove and re-add with special styling
            if (this.markers.drivers[this.currentDriverId]) {
                this.layers.drivers.removeLayer(this.markers.drivers[this.currentDriverId]);
                delete this.markers.drivers[this.currentDriverId];
            }
            
            this.addDriverMarker(driver, location);
        }
    }
    
    // Process any driver markers that were queued before map initialization
    processPendingDriverMarkers() {
        if (!this.pendingDriverMarkers || this.pendingDriverMarkers.length === 0) {
            return;
        }
        
        console.log(`📍 Processing ${this.pendingDriverMarkers.length} pending driver markers...`);
        
        this.pendingDriverMarkers.forEach(({ driver, location }) => {
            this.addDriverMarker(driver, location);
        });
        
        // Clear the pending markers
        this.pendingDriverMarkers = [];
        
        console.log('✅ All pending driver markers processed');
    }
    
    // Reset initialization retry counter (useful when changing pages)
    resetRetryCounter() {
        this.initRetryCount = 0;
        console.log('🔄 Map initialization retry counter reset');
    }

    // Load drivers on map (with debouncing to prevent excessive calls)
    loadDriversOnMap() {
        if (!this.map) return;

        // Debounce to prevent excessive loading
        const now = Date.now();
        if (this.lastDriverLoadTime && (now - this.lastDriverLoadTime) < 3000) {
            // Skip if called within 3 seconds of last load (reduce spam)
            return;
        }
        this.lastDriverLoadTime = now;

        // Silent operation - only log in debug mode
        if (window.mapDebugMode) {
            console.log('🗺️ Refreshing driver markers on map...');
        }
        
        // Don't clear all markers, just update them
        const drivers = dataManager.getUsers().filter(u => u.type === 'driver');
        const locations = dataManager.getAllDriverLocations();

        drivers.forEach(driver => {
            let location = locations[driver.id];
            
            // Initialize location if missing
            if (!location || !location.lat || !location.lng) {
                const offsetLat = (Math.random() - 0.5) * 0.05;
                const offsetLng = (Math.random() - 0.5) * 0.05;
                location = {
                    lat: 25.2854 + offsetLat,
                    lng: 51.5310 + offsetLng,
                    timestamp: new Date().toISOString()
                };
                dataManager.updateDriverLocation(driver.id, location.lat, location.lng);
            }
            
            // Update or add marker
            if (this.markers.drivers[driver.id]) {
                // Update existing marker position
                this.markers.drivers[driver.id].setLatLng([location.lat, location.lng]);
            } else {
                // Add new marker
                this.addDriverMarker(driver, location);
            }
        });
        
        // Initialize live driver tracking monitoring (WebSocket + polling fallback) - only once
        if (!this._liveTrackingInitialized) {
            this.initializeLiveDriverTracking();
            this._liveTrackingInitialized = true;
        }
    }
    
    // Initialize live driver tracking (WebSocket + polling fallback)
    initializeLiveDriverTracking() {
        console.log('📡 Initializing live driver tracking system...');
        
        // Check WebSocket status and start appropriate tracking method
        this.monitorWebSocketForDriverTracking();
        
        // Set up periodic monitoring (every 10 seconds) to ensure proper fallback
        if (!this._wsMonitorInterval) {
            this._wsMonitorInterval = setInterval(() => {
                this.monitorWebSocketForDriverTracking();
            }, 10000); // Check every 10 seconds
            
            console.log('✅ Live driver tracking monitoring started');
        }
    }

    // Add single driver marker - ENHANCED
    addDriverMarker(driver, location) {
        // Detailed validation and error reporting
        if (!this.map) {
            console.warn('⚠️ Cannot add driver marker - map not initialized yet, will retry when map is ready');
            
            // Queue this marker to be added when map is ready
            if (!this.pendingDriverMarkers) {
                this.pendingDriverMarkers = [];
            }
            this.pendingDriverMarkers.push({ driver, location });
            
            // Only try to initialize map if we haven't exceeded retry attempts and the element exists
            const mapElement = document.getElementById('map');
            if (mapElement && this.initRetryCount < this.maxRetries) {
                // Check if we're on a page that should show the map (monitoring page)
                const isMonitoringPage = document.querySelector('.monitoring-section, #monitoring, .map-container');
                if (isMonitoringPage) {
                    this.initializeMainMap('map').catch(error => {
                        console.error('❌ Failed to initialize map:', error);
                    });
                } else {
                    console.log('ℹ️ Not on monitoring page, skipping map initialization for driver marker');
                }
            }
            
            return;
        }
        
        if (!driver) {
            console.error('❌ Cannot add driver marker - driver is null/undefined');
            return;
        }
        
        if (!driver.id) {
            console.error('❌ Cannot add driver marker - driver has no ID:', driver);
            return;
        }
        
        if (!location) {
            console.error('❌ Cannot add driver marker - location is null/undefined for driver:', driver.name || driver.id);
            return;
        }
        
        if (!location.lat || !location.lng) {
            console.error('❌ Cannot add driver marker - location missing lat/lng for driver:', driver.name || driver.id, 'Location:', location);
            return;
        }
        
        if (typeof location.lat !== 'number' || typeof location.lng !== 'number') {
            console.error('❌ Cannot add driver marker - lat/lng are not numbers for driver:', driver.name || driver.id, 'Location:', location);
            return;
        }
        
        console.log(`✅ Adding driver marker for ${driver.name || driver.id} at valid location:`, { lat: location.lat, lng: location.lng });

        // Remove existing marker if present
        if (this.markers.drivers[driver.id]) {
            this.layers.drivers.removeLayer(this.markers.drivers[driver.id]);
            delete this.markers.drivers[driver.id];
        }

        const collections = dataManager.getDriverCollections(driver.id);
        const todayCollections = collections.filter(c => 
            new Date(c.timestamp).toDateString() === new Date().toDateString()
        ).length;

        const isCurrentDriver = driver.id === this.currentDriverId;
        
        // Determine driver status and color
        let statusColor = '#3b82f6'; // Default blue
        let statusText = 'Active';
        
        if (driver.movementStatus === 'on-route') {
            statusColor = '#f59e0b'; // Orange for on route
            statusText = 'On Route';
        } else if (driver.status === 'inactive') {
            statusColor = '#6b7280'; // Gray for inactive
            statusText = 'Inactive';
        }
        
        if (isCurrentDriver) {
            statusColor = '#00d4ff'; // Cyan for current driver
        }

        // Enhanced driver status indicators
        const driverMovementStatus = driver.movementStatus || 'stationary';
        let statusIcon = '🚛';
        statusText = ''; // Reuse the statusText variable declared above
        let statusBadgeColor = '#6b7280';
        
        switch(driverMovementStatus) {
            case 'on-route':
                statusIcon = '🚚';
                statusText = 'ON ROUTE';
                statusBadgeColor = '#f59e0b';
                break;
            case 'on-break':
                statusIcon = '☕';
                statusText = 'BREAK';
                statusBadgeColor = '#8b5cf6';
                break;
            case 'off-duty':
                statusIcon = '🛑';
                statusText = 'OFF DUTY';
                statusBadgeColor = '#ef4444';
                break;
            case 'stationary':
            default:
                statusIcon = '🚛';
                statusText = 'READY';
                statusBadgeColor = '#10b981';
                break;
        }

        // Check if location is live (updated within 60 seconds)
        let isLive = false;
        if (location.timestamp) {
            const updateTime = new Date(location.timestamp);
            const now = new Date();
            const diffSeconds = Math.floor((now - updateTime) / 1000);
            isLive = diffSeconds < 60;
        }

        const icon = L.divIcon({
            className: 'worldclass-driver-marker-v2',
            html: `
                <div style="position: relative; width: ${isCurrentDriver ? '70px' : '60px'}; height: ${isCurrentDriver ? '70px' : '60px'};">
                    <!-- Outer pulse ring -->
                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: ${isCurrentDriver ? '90px' : '80px'}; height: ${isCurrentDriver ? '90px' : '80px'}; border-radius: 50%; background: radial-gradient(circle, ${statusColor}40 0%, transparent 70%); ${isCurrentDriver ? 'animation: pulse-ring 2s ease-out infinite;' : ''} pointer-events: none;"></div>
                    
                    <!-- Main 3D marker circle -->
                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: ${isCurrentDriver ? '70px' : '60px'}; height: ${isCurrentDriver ? '70px' : '60px'}; border-radius: 50%; background: linear-gradient(135deg, ${statusColor} 0%, ${statusColor}cc 50%, ${statusColor}99 100%); box-shadow: 0 10px 30px rgba(0,0,0,0.5), 0 4px 12px ${statusColor}60, inset 0 2px 8px rgba(255,255,255,0.3), inset 0 -2px 8px rgba(0,0,0,0.3); border: 3px solid rgba(255,255,255,0.9); display: flex; align-items: center; justify-content: center; cursor: pointer; ${isCurrentDriver ? 'animation: float 3s ease-in-out infinite;' : ''} transition: transform 0.3s ease;" onmouseover="this.style.transform='translate(-50%, -50%) scale(1.1)'" onmouseout="this.style.transform='translate(-50%, -50%) scale(1)'">
                        <!-- Inner highlight -->
                        <div style="position: absolute; top: 15%; left: 15%; width: 40%; height: 40%; border-radius: 50%; background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.6), transparent); pointer-events: none;"></div>
                        
                        <!-- Status pulse wave -->
                        ${(driverMovementStatus === 'on-route' || driverMovementStatus === 'driving') ? `<div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; border-radius: 50%; background: ${statusBadgeColor}; opacity: 0.5; animation: pulse-wave 2s ease-out infinite; pointer-events: none;"></div>` : ''}
                        
                        <!-- Main icon with shadow -->
                        <div style="font-size: ${isCurrentDriver ? '32px' : '28px'}; z-index: 2; position: relative; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.7));">${statusIcon}</div>
                    </div>
                    
                    <!-- Live indicator (top-left red pulsing dot) -->
                    ${isLive ? `<div style="position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; background: #ef4444; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.3), 0 4px 12px rgba(239, 68, 68, 0.5); animation: pulse-dot 1.5s ease-in-out infinite; z-index: 10;"></div>` : ''}
                    
                    <!-- Collections count badge (top-right) -->
                    ${todayCollections > 0 ? `<div style="position: absolute; top: 0; right: 0; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; font-size: 0.7rem; padding: 4px 8px; border-radius: 14px; font-weight: 800; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.6), inset 0 1px 2px rgba(255,255,255,0.3); z-index: 10; border: 2px solid white; min-width: 24px; text-align: center;">${todayCollections}</div>` : ''}
                    
                    <!-- YOU badge (bottom, current driver only) -->
                    ${isCurrentDriver ? `<div style="position: absolute; bottom: -12px; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, #00d4ff 0%, #0ea5e9 100%); color: white; font-size: 0.65rem; padding: 3px 10px; border-radius: 12px; font-weight: 800; white-space: nowrap; box-shadow: 0 4px 12px rgba(0, 212, 255, 0.6), inset 0 1px 2px rgba(255,255,255,0.3); border: 2px solid white; z-index: 10; letter-spacing: 0.5px;">YOU</div>` : ''}
                </div>
            `,
            iconSize: [isCurrentDriver ? 70 : 60, isCurrentDriver ? 70 : 60],
            iconAnchor: [isCurrentDriver ? 35 : 30, isCurrentDriver ? 35 : 30]
        });

        const popupContent = this.createDriverPopup(driver, location, todayCollections, isCurrentDriver, statusText);
        
        // WORLD-CLASS: Premium permanent tooltip with exact GPS coordinates
        const tooltipContent = `<div style="background: linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(20, 20, 30, 0.95) 100%); backdrop-filter: blur(20px) saturate(180%); padding: 12px 16px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.15); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.7), inset 0 1px 2px rgba(255, 255, 255, 0.1); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; min-width: 220px; max-width: 280px;"><div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid rgba(255, 255, 255, 0.1);"><div style="display: flex; align-items: center; gap: 8px;"><div style="font-size: 1.3rem; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">${statusIcon}</div><div><div style="color: white; font-weight: 700; font-size: 1rem;">${driver.name}</div><div style="color: rgba(255, 255, 255, 0.5); font-size: 0.7rem; margin-top: 2px;">${driver.id}</div></div></div>${isLive ? `<div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 4px 10px; border-radius: 20px; font-size: 0.65rem; font-weight: 800; color: white; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 0 16px rgba(239, 68, 68, 0.8); animation: pulse-glow-text 2s ease-in-out infinite; display: flex; align-items: center; gap: 4px;"><span style="width: 6px; height: 6px; background: white; border-radius: 50%; animation: pulse-dot 1s ease-in-out infinite;"></span>LIVE</div>` : ''}</div><div style="background: linear-gradient(135deg, ${statusBadgeColor}30 0%, ${statusBadgeColor}15 100%); border: 1px solid ${statusBadgeColor}60; color: ${statusBadgeColor}; padding: 6px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; display: inline-flex; align-items: center; gap: 6px; margin-bottom: 10px; box-shadow: 0 2px 8px ${statusBadgeColor}20;"><span style="width: 6px; height: 6px; background: ${statusBadgeColor}; border-radius: 50%; box-shadow: 0 0 8px ${statusBadgeColor};"></span>${statusText}</div><div style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.08) 100%); border: 1px solid rgba(59, 130, 246, 0.3); padding: 10px 12px; border-radius: 10px; margin-bottom: 8px; position: relative; overflow: hidden;">${isLive ? `<div style="position: absolute; top: 0; left: -100%; width: 100%; height: 2px; background: linear-gradient(90deg, transparent 0%, #3b82f6 50%, transparent 100%); animation: scan-line 3s linear infinite;"></div>` : ''}<div style="color: rgba(255, 255, 255, 0.5); font-size: 0.65rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;"><span style="font-size: 0.8rem;">📍</span>GPS COORDINATES</div><div style="color: #60a5fa; font-weight: 700; font-size: 0.85rem; font-family: 'SF Mono', 'Monaco', 'Courier New', monospace; line-height: 1.6; text-align: center; text-shadow: 0 0 10px rgba(96, 165, 250, 0.5);">${location.lat.toFixed(6)}<br>${location.lng.toFixed(6)}</div></div>${location.accuracy ? `<div style="display: flex; align-items: center; justify-content: center; gap: 6px; padding: 6px 10px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; margin-bottom: 8px;"><span style="font-size: 0.9rem;">🎯</span><span style="color: #6ee7b7; font-size: 0.7rem; font-weight: 600;">±${Math.round(location.accuracy)}m</span></div>` : ''}${todayCollections > 0 ? `<div style="display: flex; align-items: center; justify-content: center; gap: 6px; padding: 6px 10px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px;"><span style="font-size: 0.9rem;">✅</span><span style="color: #6ee7b7; font-size: 0.7rem; font-weight: 600;">${todayCollections} ${todayCollections === 1 ? 'Collection' : 'Collections'} Today</span></div>` : ''}</div>`;
        
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
            })
            .bindTooltip(tooltipContent, {
                permanent: false,
                direction: 'bottom',
                offset: [0, 45],
                className: 'worldclass-driver-tooltip-v2',
                opacity: 1.0,
                sticky: true
            });
        
        // Keep popup open when hovering over it
        marker.on('popupopen', function() {
            const popup = this.getPopup();
            if (popup && popup._container) {
                const container = popup._container;
                if (!container) return;
                container.addEventListener('mouseenter', function(e) {
                    e.stopPropagation();
                });
                container.addEventListener('mouseleave', function(e) {
                    e.stopPropagation();
                });
            }
        });

        marker.on('click', function() {
            this.openPopup();
        });

        if (this.layers.drivers) {
            marker.addTo(this.layers.drivers);
        }

        this.markers.drivers[driver.id] = marker;
        
        console.log(`Added marker for driver ${driver.name} at: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`);
    }

    // Start driver location tracking - WORLD-CLASS: real GPS first, no fake initial position
    startDriverTracking() {
        if (!authManager || !authManager.isDriver()) {
            console.log('Not a driver account, skipping GPS tracking');
            return;
        }

        const currentDriver = authManager.getCurrentUser();
        this.currentDriverId = currentDriver.id;
        this.simulatedGPS = false;
        this._gpsRetried = false;
        
        console.log('Starting live GPS tracking for driver:', currentDriver.name);

        // Show "Acquiring live GPS..." – do NOT set random/simulated position
        const gpsStatus = document.getElementById('gpsStatus');
        if (gpsStatus) {
            gpsStatus.innerHTML = `
                <span style="color: #f59e0b;">
                    <i class="fas fa-satellite-dish fa-spin"></i> Acquiring live GPS...
                </span>
                <br>
                <span style="font-size: 0.75rem; color: #94a3b8;">Using device location for accurate map</span>
            `;
        }

        if (!navigator.geolocation) {
            console.warn('Geolocation not supported');
            if (gpsStatus) gpsStatus.innerHTML = `<span style="color: #ef4444;">GPS not supported</span>`;
            return;
        }

        const onRealSuccess = (position) => {
            this.simulatedGPS = false;
            if (this._gpsFallbackTimer) {
                clearTimeout(this._gpsFallbackTimer);
                this._gpsFallbackTimer = null;
            }
            if (this.driverWatchId != null) {
                navigator.geolocation.clearWatch(this.driverWatchId);
                this.driverWatchId = null;
            }
            this.updateDriverPosition(position);
            this.startRealGPSWatch();
        };

        // Prefer watchPosition so we get first fix + continuous updates (world-class accuracy)
        const watchOptions = { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 };
        this.driverWatchId = navigator.geolocation.watchPosition(
            onRealSuccess,
            (err) => {
                if (this._gpsRetried) {
                    console.warn('GPS unavailable after retry, using fallback');
                    this.simulatedGPS = true;
                    this.startSimulatedGPSUpdates();
                    return;
                }
                this._gpsRetried = true;
                if (this.driverWatchId != null) {
                    navigator.geolocation.clearWatch(this.driverWatchId);
                    this.driverWatchId = null;
                }
                console.warn('First GPS attempt failed, retrying getCurrentPosition (60s)...');
                if (gpsStatus) gpsStatus.innerHTML = `<span style="color: #f59e0b;"><i class="fas fa-satellite-dish fa-spin"></i> Retrying GPS (60s)...</span>`;
                navigator.geolocation.getCurrentPosition(
                    onRealSuccess,
                    () => {
                        this.simulatedGPS = true;
                        this.startSimulatedGPSUpdates();
                    },
                    { enableHighAccuracy: true, timeout: 60000, maximumAge: 0 }
                );
            },
            watchOptions
        );
        // Fallback: if no fix in 70s, switch to simulated only then
        this._gpsFallbackTimer = setTimeout(() => {
            this._gpsFallbackTimer = null;
            if (this.simulatedGPS) return;
            const loc = dataManager.getDriverLocation(currentDriver.id);
            if (loc && loc.lat && loc.lng) return; // We already got real GPS
            console.warn('GPS took too long, enabling simulated fallback');
            if (this.driverWatchId != null) {
                navigator.geolocation.clearWatch(this.driverWatchId);
                this.driverWatchId = null;
            }
            this.simulatedGPS = true;
            this.startSimulatedGPSUpdates();
        }, 70000);
    }

    // Start simulated GPS updates (only when real GPS unavailable)
    startSimulatedGPSUpdates() {
        const currentDriver = authManager.getCurrentUser();
        if (!currentDriver) return;
        let currentLocation = dataManager.getDriverLocation(currentDriver.id);
        if (!currentLocation || !currentLocation.lat || !currentLocation.lng) {
            dataManager.updateDriverLocation(currentDriver.id, 25.2854, 51.5310, { simulated: true });
            currentLocation = { lat: 25.2854, lng: 51.5310 };
        }
        this.simulatedInterval = setInterval(() => {
            if (!this.simulatedGPS || !authManager.getCurrentUser()) {
                if (this.simulatedInterval) clearInterval(this.simulatedInterval);
                return;
            }
            const cur = authManager.getCurrentUser();
            const loc = dataManager.getDriverLocation(cur.id);
            if (!loc) return;
            const lat = loc.lat + (Math.random() * 0.002 - 0.001);
            const lng = loc.lng + (Math.random() * 0.002 - 0.001);
            this.updateDriverPosition({ coords: { latitude: lat, longitude: lng, accuracy: 40 } });
        }, 2000);
    }

    // Start real GPS watch – world-class: high accuracy, frequent updates for exact live location
    startRealGPSWatch() {
        if (this.driverWatchId != null) {
            navigator.geolocation.clearWatch(this.driverWatchId);
            this.driverWatchId = null;
        }
        this.driverWatchId = navigator.geolocation.watchPosition(
            (position) => {
                this.simulatedGPS = false;
                this.updateDriverPosition(position);
            },
            (error) => {
                console.warn('GPS watch error:', error.code, error.message);
                if (!this.simulatedGPS) {
                    this.simulatedGPS = true;
                    this.startSimulatedGPSUpdates();
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 2000
            }
        );
    }

    // Update driver position
    updateDriverPosition(position) {
        const { latitude, longitude, accuracy } = position.coords;
        
        if (!authManager || !authManager.getCurrentUser()) {
            console.error('No authenticated user for position update');
            return;
        }
        
        const currentDriver = authManager.getCurrentUser();
        const driverId = currentDriver.id;
        
        // Update in database
        dataManager.updateDriverLocation(driverId, latitude, longitude, {
            accuracy,
            simulated: this.simulatedGPS
        });
        
        // Update GPS status display – world-class: clear "Live location" vs "Simulated"
        const gpsStatus = document.getElementById('gpsStatus');
        if (gpsStatus) {
            if (this.simulatedGPS) {
                gpsStatus.innerHTML = `
                    <span style="color: #3b82f6;">
                        <i class="fas fa-location-arrow"></i> Simulated
                    </span>
                    <br>
                    <span style="font-size: 0.75rem;">${latitude.toFixed(6)}, ${longitude.toFixed(6)}</span>
                `;
            } else {
                gpsStatus.innerHTML = `
                    <span style="color: #10b981;">
                        <i class="fas fa-satellite-dish"></i> Live location
                    </span>
                    <br>
                    <span style="font-size: 0.75rem;">
                        ${latitude.toFixed(6)}, ${longitude.toFixed(6)}
                        ${accuracy != null && !isNaN(accuracy) ? ` (±${Math.round(accuracy)}m)` : ''}
                    </span>
                `;
            }
        }
        
        // Update driver marker on main map
        if (this.map) {
            if (this.markers.drivers[driverId]) {
                this.markers.drivers[driverId].setLatLng([latitude, longitude]);
            } else {
                const location = { lat: latitude, lng: longitude, timestamp: new Date().toISOString() };
                this.addDriverMarker(currentDriver, location);
            }
        }
        
        // Push GPS to server every 2.5s to avoid 429 and keep map live
        const now = Date.now();
        const locationThrottleMs = 2500;
        if (now - this.lastDriverLocationSendTime >= locationThrottleMs) {
            this.lastDriverLocationSendTime = now;
            const payload = { lat: latitude, lng: longitude, timestamp: new Date().toISOString(), accuracy: accuracy || null };
            fetch(`/api/driver/${driverId}/location`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).catch(function () { /* ignore network errors */ });
            if (window.websocketManager && window.websocketManager.isConnected && window.websocketManager.send) {
                window.websocketManager.send({ type: 'driver_location', driverId: driverId, lat: latitude, lng: longitude, timestamp: payload.timestamp, accuracy: payload.accuracy });
            }
        }
        
        // Update driver's own map
        if (this.driverMap) {
            if (!this.driverPositionMarker) {
                this.driverPositionMarker = L.marker([latitude, longitude], {
                    icon: L.divIcon({
                        className: 'driver-position',
                        html: '<i class="fas fa-location-arrow" style="color: #00d4ff; font-size: 24px;"></i>',
                        iconSize: [24, 24],
                        iconAnchor: [12, 12]
                    })
                }).addTo(this.driverMap);
            } else {
                this.driverPositionMarker.setLatLng([latitude, longitude]);
            }
            
            this.driverMap.setView([latitude, longitude], 15);
            this.loadNearbyBins(latitude, longitude);
        }
    }

    // Create driver popup content - ENHANCED VERSION WITH REAL-TIME DATA
    createDriverPopup(driver, location, todayCollections, isCurrentDriver = false, statusText = 'Active') {
        
        // Get real-time data
        const routes = dataManager.getRoutes();
        const activeRoutes = routes.filter(r => r.driverId === driver.id && r.status !== 'completed').length;
        const activeRoute = routes.find(r => r.driverId === driver.id && r.status === 'in-progress');
        
        // Get fuel level from multiple sources (Driver System V3 priority)
        let fuelLevel = 75; // Default
        if (driver.fuelLevel !== undefined) {
            fuelLevel = driver.fuelLevel; // From Driver System V3 updates
        } else {
            const fuelData = dataManager.getData('driverFuelLevels') || {};
            fuelLevel = fuelData[driver.id] || 75;
        }
        
        // Determine real-time status with enhanced logic (Driver System V3 priority)
        let driverStatus = { text: 'Active', color: '#10b981' };
        
        // Check driver movement status first (updated by Driver System V3)
        if (driver.movementStatus === 'on-route') {
            driverStatus = { text: 'On Route', color: '#f59e0b' };
        } else if (driver.movementStatus === 'stationary') {
            driverStatus = { text: 'Stationary', color: '#6b7280' };
        } else if (activeRoute) {
            driverStatus = { text: 'On Route', color: '#f59e0b' };
        } else {
            // Enhanced driver location checking (use lastUpdate/timestamp for live status)
            const driverLocation = dataManager.getDriverLocation(driver.id);
            if (window.mapDebugMode) console.log(`🔍 Status for driver ${driver.id}:`, { driverLocation, driver });
            
            let lastUpdate = null;
            
            // Check multiple timestamp fields
            if (driverLocation) {
                if (driverLocation.lastUpdate) {
                    lastUpdate = new Date(driverLocation.lastUpdate);
                } else if (driverLocation.timestamp) {
                    lastUpdate = new Date(driverLocation.timestamp);
                } else if (location && location.timestamp) {
                    lastUpdate = new Date(location.timestamp);
                }
            }
            
            const now = new Date();
            
            // If no location data at all, create default location for active drivers
            if (!driverLocation && driver.status !== 'inactive') {
                console.log(`📍 Creating default location for active driver: ${driver.name}`);
                const defaultLocation = {
                    lat: 25.2858 + (Math.random() - 0.5) * 0.01, // Small random offset
                    lng: 51.5264 + (Math.random() - 0.5) * 0.01,
                    timestamp: new Date().toISOString(),
                    lastUpdate: new Date().toISOString(),
                    status: 'active'
                };
                
                dataManager.setDriverLocation(driver.id, defaultLocation);
                driverStatus = { text: 'Active', color: '#10b981' };
            } else if (lastUpdate) {
                const timeDiff = now - lastUpdate;
                console.log(`⏰ Time since last update for ${driver.name}: ${Math.round(timeDiff / 60000)} minutes`);
                
                if (timeDiff < 3600000) { // Less than 1 hour
                    driverStatus = { text: 'Active', color: '#10b981' };
                } else if (timeDiff < 14400000) { // Less than 4 hours
                    driverStatus = { text: 'On Break', color: '#f59e0b' };
                } else {
                    driverStatus = { text: 'Offline', color: '#6b7280' };
                }
            } else {
                // No timestamp available, use driver's general status
                if (driver.status === 'inactive') {
                    driverStatus = { text: 'Offline', color: '#6b7280' };
                } else {
                    // Default to active for drivers without location data
                    driverStatus = { text: 'Active', color: '#10b981' };
                }
            }
        }
        
        // Format last update time
        let lastUpdateText = 'Never';
        if (location && location.timestamp) {
            const updateTime = new Date(location.timestamp);
            const now = new Date();
            const diffMinutes = Math.floor((now - updateTime) / 60000);
            
            if (diffMinutes < 1) {
                lastUpdateText = 'Just now';
            } else if (diffMinutes < 60) {
                lastUpdateText = `${diffMinutes} min ago`;
            } else if (diffMinutes < 1440) {
                lastUpdateText = `${Math.floor(diffMinutes/60)}h ago`;
            } else {
                lastUpdateText = updateTime.toLocaleDateString();
            }
        }
        
        // Get additional driver info
        const driverPhone = driver.phone || driver.phoneNumber || 'N/A';
        const vehicleInfo = driver.vehicleId || driver.vehicle || 'No Vehicle';
        const driverEmail = driver.email || 'N/A';
        
        // Calculate fuel level color
        const fuelColor = fuelLevel > 50 ? '#10b981' : fuelLevel > 20 ? '#f59e0b' : '#ef4444';
        
        return `
            <div style="
                min-width: 400px;
                max-width: 420px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            ">
                <!-- Header with gradient -->
                <div style="
                    background: linear-gradient(135deg, ${isCurrentDriver ? '#00d4ff' : '#3b82f6'} 0%, ${isCurrentDriver ? '#0ea5e9' : '#7c3aed'} 100%);
                    border-radius: 12px 12px 0 0;
                    padding: 1.5rem;
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
                            gap: 1rem;
                            margin-bottom: 1rem;
                        ">
                            <div style="
                                width: 70px;
                                height: 70px;
                                background: rgba(255,255,255,0.25);
                                backdrop-filter: blur(10px);
                                border-radius: 50%;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                color: white;
                                font-size: 1.75rem;
                                font-weight: 700;
                                text-shadow: 0 2px 4px rgba(0,0,0,0.2);
                                box-shadow: 0 8px 20px rgba(0,0,0,0.3);
                                border: 3px solid rgba(255,255,255,0.3);
                                position: relative;
                            ">
                                ${driver.name.split(' ').map(n => n[0]).join('')}
                                <div style="
                                    position: absolute;
                                    top: -4px;
                                    right: -4px;
                                    width: 22px;
                                    height: 22px;
                                    background: ${driverStatus.color};
                                    border-radius: 50%;
                                    border: 3px solid white;
                                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                                "></div>
                            </div>
                            <div style="flex: 1;">
                                <h3 style="
                                    margin: 0 0 0.5rem 0;
                                    color: white;
                                    font-size: 1.35rem;
                                    font-weight: 800;
                                    text-shadow: 0 2px 4px rgba(0,0,0,0.2);
                                    display: flex;
                                    align-items: center;
                                    gap: 0.5rem;
                                    flex-wrap: wrap;
                                ">
                                    <span>${driver.name}</span>
                                    ${isCurrentDriver ? '<span style="background: rgba(255,255,255,0.25); backdrop-filter: blur(10px); padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600;">YOU</span>' : ''}
                                    ${(() => {
                                        // Show LIVE badge if location updated within last 60 seconds (world-class real-time indicator)
                                        if (location && location.timestamp) {
                                            const updateTime = new Date(location.timestamp);
                                            const now = new Date();
                                            const diffSeconds = Math.floor((now - updateTime) / 1000);
                                            if (diffSeconds < 60) {
                                                return '<span style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 700; animation: pulse 2s ease-in-out infinite; box-shadow: 0 0 12px rgba(239, 68, 68, 0.6);">🔴 LIVE</span>';
                                            }
                                        }
                                        return '';
                                    })()}
                                </h3>
                                <div style="
                                    color: rgba(255,255,255,0.95);
                                    font-size: 0.85rem;
                                    margin-bottom: 0.5rem;
                                    display: flex;
                                    align-items: center;
                                    gap: 0.5rem;
                                ">
                                    <span>🚛 ${vehicleInfo}</span>
                                    <span>•</span>
                                    <span>🆔 ${driver.id}</span>
                                </div>
                                <div style="
                                    background: rgba(255,255,255,0.25);
                                    backdrop-filter: blur(10px);
                                    padding: 0.4rem 0.75rem;
                                    border-radius: 20px;
                                    font-size: 0.8rem;
                                    font-weight: 600;
                                    color: white;
                                    display: inline-flex;
                                    align-items: center;
                                    gap: 0.5rem;
                                ">
                                    <span style="
                                        width: 8px;
                                        height: 8px;
                                        background: ${driverStatus.color};
                                        border-radius: 50%;
                                        box-shadow: 0 0 8px ${driverStatus.color};
                                    "></span>
                                    ${driverStatus.text}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Stats Grid - 4 Cards -->
                <div style="
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 0.75rem;
                    margin-bottom: 1rem;
                ">
                    <!-- Collections Today Card -->
                    <div class="driver-popup-card" style="
                        background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%);
                        border: 1px solid rgba(16, 185, 129, 0.3);
                        border-radius: 12px;
                        padding: 1rem;
                        text-align: center;
                        position: relative;
                        overflow: hidden;
                    ">
                        <div style="
                            position: absolute;
                            top: 0;
                            left: 0;
                            right: 0;
                            height: 2px;
                            background: linear-gradient(90deg, transparent 0%, #10b981 50%, transparent 100%);
                            animation: shimmer 2s ease-in-out infinite;
                        "></div>
                        <div style="
                            color: #6ee7b7;
                            font-size: 0.7rem;
                            font-weight: 700;
                            margin-bottom: 0.5rem;
                            letter-spacing: 0.5px;
                            text-transform: uppercase;
                        ">
                            Collections
                        </div>
                        <div style="
                            color: #f1f5f9;
                            font-size: 1.8rem;
                            font-weight: 800;
                            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
                        ">
                            ${todayCollections}
                        </div>
                    </div>
                    
                    <!-- Active Routes Card -->
                    <div class="driver-popup-card" style="
                        background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(180, 83, 9, 0.1) 100%);
                        border: 1px solid rgba(245, 158, 11, 0.3);
                        border-radius: 12px;
                        padding: 1rem;
                        text-align: center;
                        position: relative;
                        overflow: hidden;
                    ">
                        <div style="
                            position: absolute;
                            top: 0;
                            left: 0;
                            right: 0;
                            height: 2px;
                            background: linear-gradient(90deg, transparent 0%, #f59e0b 50%, transparent 100%);
                            animation: shimmer 2s ease-in-out infinite;
                        "></div>
                        <div style="
                            color: #fcd34d;
                            font-size: 0.7rem;
                            font-weight: 700;
                            margin-bottom: 0.5rem;
                            letter-spacing: 0.5px;
                            text-transform: uppercase;
                        ">
                            Active Routes
                        </div>
                        <div style="
                            color: #f1f5f9;
                            font-size: 1.8rem;
                            font-weight: 800;
                            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
                        ">
                            ${activeRoutes}
                        </div>
                    </div>
                    
                    <!-- Fuel Level Card -->
                    <div class="driver-popup-card" style="
                        background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(124, 58, 237, 0.1) 100%);
                        border: 1px solid rgba(139, 92, 246, 0.3);
                        border-radius: 12px;
                        padding: 1rem;
                        text-align: center;
                        position: relative;
                        overflow: hidden;
                    ">
                        <div style="
                            position: absolute;
                            top: 0;
                            left: 0;
                            right: 0;
                            height: 2px;
                            background: linear-gradient(90deg, transparent 0%, #8b5cf6 50%, transparent 100%);
                            animation: shimmer 2s ease-in-out infinite;
                        "></div>
                        <div style="
                            color: #c4b5fd;
                            font-size: 0.7rem;
                            font-weight: 700;
                            margin-bottom: 0.5rem;
                            letter-spacing: 0.5px;
                            text-transform: uppercase;
                        ">
                            Fuel Level
                        </div>
                        <div style="
                            color: ${fuelColor};
                            font-size: 1.8rem;
                            font-weight: 800;
                            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
                        ">
                            ${fuelLevel}%
                        </div>
                    </div>
                    
                    <!-- Last Update Card -->
                    <div class="driver-popup-card" style="
                        background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.1) 100%);
                        border: 1px solid rgba(59, 130, 246, 0.3);
                        border-radius: 12px;
                        padding: 1rem;
                        text-align: center;
                        position: relative;
                        overflow: hidden;
                    ">
                        <div style="
                            position: absolute;
                            top: 0;
                            left: 0;
                            right: 0;
                            height: 2px;
                            background: linear-gradient(90deg, transparent 0%, #3b82f6 50%, transparent 100%);
                            animation: shimmer 2s ease-in-out infinite;
                        "></div>
                        <div style="
                            color: #93c5fd;
                            font-size: 0.7rem;
                            font-weight: 700;
                            margin-bottom: 0.5rem;
                            letter-spacing: 0.5px;
                            text-transform: uppercase;
                        ">
                            Last Update
                        </div>
                        <div style="
                            color: #f1f5f9;
                            font-size: 1rem;
                            font-weight: 700;
                            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
                        ">
                            ${lastUpdateText}
                        </div>
                    </div>
                </div>
                
                <!-- Additional Info Grid -->
                <div style="
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 0.75rem;
                    margin-bottom: 1rem;
                ">
                    <!-- Phone Card -->
                    <div class="driver-popup-card" style="
                        background: rgba(255,255,255,0.05);
                        border-radius: 10px;
                        padding: 1rem;
                        border: 1px solid rgba(255,255,255,0.08);
                    ">
                        <div style="
                            display: flex;
                            align-items: center;
                            gap: 0.5rem;
                            margin-bottom: 0.5rem;
                        ">
                            <span style="font-size: 1.1rem;">📞</span>
                            <div style="
                                color: #94a3b8;
                                font-size: 0.7rem;
                                font-weight: 600;
                                text-transform: uppercase;
                                letter-spacing: 0.5px;
                            ">
                                Phone
                            </div>
                        </div>
                        <div style="
                            color: #f1f5f9;
                            font-size: 0.95rem;
                            font-weight: 700;
                        ">
                            ${driverPhone}
                        </div>
                    </div>
                    
                    <!-- Vehicle Card -->
                    <div class="driver-popup-card" style="
                        background: rgba(255,255,255,0.05);
                        border-radius: 10px;
                        padding: 1rem;
                        border: 1px solid rgba(255,255,255,0.08);
                    ">
                        <div style="
                            display: flex;
                            align-items: center;
                            gap: 0.5rem;
                            margin-bottom: 0.5rem;
                        ">
                            <span style="font-size: 1.1rem;">🚛</span>
                            <div style="
                                color: #94a3b8;
                                font-size: 0.7rem;
                                font-weight: 600;
                                text-transform: uppercase;
                                letter-spacing: 0.5px;
                            ">
                                Vehicle
                            </div>
                        </div>
                        <div style="
                            color: #f1f5f9;
                            font-size: 0.95rem;
                            font-weight: 700;
                        ">
                            ${vehicleInfo}
                        </div>
                    </div>
                </div>
                
                <!-- Action Buttons -->
                <div style="
                    display: grid;
                    grid-template-columns: ${!isCurrentDriver ? '1fr 1fr' : '1fr'};
                    gap: 0.75rem;
                ">
                    ${!isCurrentDriver ? `
                    <button onclick="window.assignRouteToDriver('${driver.id}')" class="driver-popup-button" style="
                        background: linear-gradient(135deg, #3b82f6 0%, #7c3aed 100%);
                        color: white;
                        border: none;
                        padding: 0.875rem 1rem;
                        border-radius: 10px;
                        font-size: 0.875rem;
                        font-weight: 700;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 0.5rem;
                    ">
                        <span>🤖</span>
                        <span>Smart Assign</span>
                    </button>
                    ` : ''}
                    <button onclick="window.viewDriverDetails('${driver.id}')" class="driver-popup-button" style="
                        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                        color: white;
                        border: none;
                        padding: 0.875rem 1rem;
                        border-radius: 10px;
                        font-size: 0.875rem;
                        font-weight: 700;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 0.5rem;
                    ">
                        <span>📊</span>
                        <span>Full Details</span>
                    </button>
                </div>
            </div>
        `;
    }

    /** #12 Get current monitoring quick filter values from DOM (returns null if not on monitoring page) */
    getMonitoringFilters() {
        const mon = document.getElementById('monitoring');
        if (!mon || mon.style.display === 'none') return null;
        const fillEl = document.getElementById('monitoringFilterFill');
        const sensorEl = document.getElementById('monitoringFilterSensor');
        const assignedEl = document.getElementById('monitoringFilterAssigned');
        const driverEl = document.getElementById('monitoringFilterDriver');
        if (!fillEl || !sensorEl || !assignedEl || !driverEl) return null;
        return {
            fill: fillEl.value || 'all',
            sensor: sensorEl.value || 'all',
            assigned: assignedEl.value || 'all',
            driverId: (driverEl.value || '').trim() || null
        };
    }

    // Load bins on map - ULTRA-AGGRESSIVE FIX to prevent popup closing
    loadBinsOnMap(force) {
        if (!this.map) {
            console.warn('⚠️ Map not initialized, cannot load bins');
            return;
        }
        // Throttle to reduce "Fetching sensor data" / refresh spam (allow force to bypass)
        var LOAD_BINS_THROTTLE_MS = 2200;
        var now = Date.now();
        if (!force && this._lastLoadBinsAt != null && (now - this._lastLoadBinsAt < LOAD_BINS_THROTTLE_MS)) {
            return;
        }
        this._lastLoadBinsAt = now;

        // ULTRA-CRITICAL FIX: If ANY popup is open, DON'T refresh the map at all
        let anyPopupOpen = false;
        let openPopupBinId = null;
        
        if (this.markers.bins) {
            for (const [binId, marker] of Object.entries(this.markers.bins)) {
                if (marker.isPopupOpen && marker.isPopupOpen()) {
                    anyPopupOpen = true;
                    openPopupBinId = binId;
                    break;
                }
            }
        }
        
        // If any popup is open, skip the entire refresh
        if (anyPopupOpen) {
            return; // Don't touch anything if a popup is open
        }

        // CRITICAL FIX: Store which bins have open popups before clearing
        const binsWithOpenPopups = new Set();
        if (this.markers.bins) {
            Object.entries(this.markers.bins).forEach(([binId, marker]) => {
                if (marker.isPopupOpen && marker.isPopupOpen()) {
                    binsWithOpenPopups.add(binId);
                }
            });
        }

        if (this.layers.bins) {
            this.layers.bins.clearLayers();
        }
        
        // Clear existing markers (except those with open popups)
        if (this.markers.bins) {
            Object.entries(this.markers.bins).forEach(([binId, marker]) => {
                // Don't remove markers with open popups
                if (!binsWithOpenPopups.has(binId)) {
                    if (this.map) {
                        this.map.removeLayer(marker);
                    }
                    delete this.markers.bins[binId];
                }
            });
        }

        let bins = dataManager.getBins();
        // #12 Apply monitoring quick filters (fill, sensor, assigned, driver)
        const filters = this.getMonitoringFilters();
        if (filters) {
            const routes = (typeof dataManager.getRoutes === 'function' ? dataManager.getRoutes() : []) || [];
            const assignedBinIds = new Set();
            routes.forEach(r => {
                const ids = r.binIds || [];
                const binRefs = r.bins || r.binDetails || [];
                ids.forEach(id => assignedBinIds.add(id));
                binRefs.forEach(b => { const id = typeof b === 'object' && b != null ? (b.id || b) : b; if (id) assignedBinIds.add(id); });
            });
            bins = bins.filter(bin => {
                const fill = bin.fill != null ? bin.fill : (bin.fillLevel != null ? bin.fillLevel : 0);
                if (filters.fill !== 'all') {
                    const minFill = parseInt(filters.fill, 10) || 0;
                    if (fill < minFill) return false;
                }
                const hasSensor = !!(bin.sensorIMEI || bin.hasSensor);
                if (filters.sensor === 'yes' && !hasSensor) return false;
                if (filters.sensor === 'no' && hasSensor) return false;
                const assigned = assignedBinIds.has(bin.id);
                if (filters.assigned === 'assigned' && !assigned) return false;
                if (filters.assigned === 'unassigned' && assigned) return false;
                if (filters.driverId) {
                    const routeForDriver = routes.find(r => {
                        if (r.driverId !== filters.driverId) return false;
                        if ((r.binIds || []).includes(bin.id)) return true;
                        return (r.bins || r.binDetails || []).some(b => (typeof b === 'object' && b != null && b.id === bin.id) || b === bin.id);
                    });
                    if (!routeForDriver) return false;
                }
                return true;
            });
            console.log(`📦 After filters: ${bins.length} bins (fill=${filters.fill}, sensor=${filters.sensor}, assigned=${filters.assigned}, driver=${filters.driverId || 'all'})`);
        } else {
            console.log(`📦 Loading ${bins.length} bins on map from dataManager...`);
        }
        
        const binsWithSensors = [];
        const binsWithoutSensors = [];
        bins.forEach(bin => {
            if (!bin.lat || !bin.lng) {
                console.warn(`⚠️ Skipping bin ${bin.id} - missing coordinates`);
                return;
            }
            if (binsWithOpenPopups.has(bin.id)) return;
            if (bin.sensorIMEI || bin.hasSensor) {
                binsWithSensors.push(bin);
            } else {
                binsWithoutSensors.push(bin);
            }
        });
        
        // 1) Add non-sensor bins immediately (no stale fill)
        let loadedCount = 0;
        binsWithoutSensors.forEach(bin => {
            this.addBinMarker(bin);
            loadedCount++;
        });
        
        // 2) World-class: fetch sensor data for sensor bins BEFORE first paint so correct fill % shows (no 8%→31% glitch)
        const addSensorBinsAfterRefresh = async () => {
            if (binsWithSensors.length === 0) return;
            const findy = typeof findyBinSensorIntegration !== 'undefined' ? findyBinSensorIntegration : null;
            if (!findy || typeof findy.refreshBinSensor !== 'function') {
                binsWithSensors.forEach(bin => { this.addBinMarker(bin); loadedCount++; });
                console.log(`✅ Loaded ${loadedCount} bins (sensor integration not available, showing stored fill)`);
                return;
            }
            if (!this._loggedSensorFetchOnce) {
                this._loggedSensorFetchOnce = true;
                console.log(`🔄 Fetching sensor data for ${binsWithSensors.length} bins before first paint...`);
            }
            const refreshOne = (binId) => {
                return (findy.refreshBinSensor(binId) || Promise.resolve()).catch(() => {});
            };
            const timeoutMs = 4000;
            await Promise.race([
                Promise.all(binsWithSensors.map(b => refreshOne(b.id))),
                new Promise(r => setTimeout(r, timeoutMs))
            ]);
            binsWithSensors.forEach(bin => {
                const updated = dataManager.getBinById(bin.id);
                if (updated && updated.lat && updated.lng) {
                    this.addBinMarker(updated);
                    loadedCount++;
                }
            });
            console.log(`✅ Loaded ${loadedCount} bins (sensor bins shown with current fill %)`);
        };
        
        addSensorBinsAfterRefresh();
    }

    /**
     * World-class: SINGLE SOURCE OF TRUTH for bin fill % (sensor distance or stored fill).
     * Use this for any UI that displays bin fill (map marker, popup, lists) so the value is never stale.
     * New bins, new sensors, and existing bins all stay correct when all code uses this or createBinMarkerIcon.
     */
    getBinFillForDisplay(bin) {
        const distanceCmVal = (bin.sensorData && bin.sensorData.distanceCm != null) ? Number(bin.sensorData.distanceCm) : null;
        const emptyCm = bin.sensorDistanceEmptyCm != null ? Number(bin.sensorDistanceEmptyCm) : 200;
        const fullCm = bin.sensorDistanceFullCm != null ? Number(bin.sensorDistanceFullCm) : 0;
        let fillLevel = bin.fillLevel != null ? bin.fillLevel : (bin.fill != null ? bin.fill : 0);
        if (distanceCmVal !== null && !isNaN(distanceCmVal) && emptyCm > fullCm) {
            fillLevel = Math.max(0, Math.min(100, 100 * (emptyCm - distanceCmVal) / (emptyCm - fullCm)));
        }
        return Math.round(fillLevel * 10) / 10; // 1 decimal, no long decimals
    }

    /**
     * Create the div icon for a bin marker (fill %, color, status icon). Used by addBinMarker and updateBinMarkerIcon.
     */
    createBinMarkerIcon(bin) {
        const distanceCmVal = (bin.sensorData && bin.sensorData.distanceCm != null) ? Number(bin.sensorData.distanceCm) : null;
        const emptyCm = bin.sensorDistanceEmptyCm != null ? Number(bin.sensorDistanceEmptyCm) : 200;
        const fullCm = bin.sensorDistanceFullCm != null ? Number(bin.sensorDistanceFullCm) : 0;
        let fillLevel = bin.fillLevel != null ? bin.fillLevel : (bin.fill != null ? bin.fill : 0);
        if (distanceCmVal !== null && !isNaN(distanceCmVal) && emptyCm > fullCm) {
            fillLevel = Math.max(0, Math.min(100, 100 * (emptyCm - distanceCmVal) / (emptyCm - fullCm)));
        }
        const fillDisplay = Math.round(fillLevel * 10) / 10;
        const color = this.getBinColor(bin);
        const pulseClass = (bin.status === 'critical' || bin.status === 'fire-risk') ? 'pulse-danger' : '';
        const fillHeight = Math.max(10, (fillLevel / 100) * 40);
        let statusIcon = '🗑️';
        if (fillLevel >= 90) statusIcon = '🚨';
        else if (fillLevel >= 75) statusIcon = '⚠️';
        else if (fillLevel <= 25) statusIcon = '✅';

        return L.divIcon({
            className: 'custom-div-icon',
            html: `
                <div class="${pulseClass}" style="
                    width: 55px; height: 55px; border-radius: 50%; display: flex; flex-direction: column;
                    align-items: center; justify-content: center; color: white; font-weight: bold;
                    box-shadow: 0 6px 25px rgba(0,0,0,0.4); cursor: pointer; position: relative;
                    border: 3px solid rgba(255, 255, 255, 0.4); transition: all 0.3s ease;
                    background: linear-gradient(180deg, rgba(0,0,0,0.1) 0%, ${color} 100%); overflow: hidden;
                ">
                    <div style="position: absolute; bottom: 3px; left: 3px; right: 3px; height: ${fillHeight}px;
                        background: linear-gradient(180deg, ${color} 0%, rgba(255,255,255,0.2) 100%);
                        border-radius: 0 0 25px 25px; transition: height 0.3s ease; z-index: 1;"></div>
                    <div style="position: relative; z-index: 2; display: flex; flex-direction: column; align-items: center; text-shadow: 0 2px 6px rgba(0,0,0,0.8);">
                        <span style="font-size: 1.2rem; margin-bottom: -2px;">${statusIcon}</span>
                        <span style="font-size: 0.75rem; font-weight: bold;">${fillDisplay}%</span>
                    </div>
                    ${fillLevel >= 85 ? `<div style="position: absolute; top: -2px; left: -2px; right: -2px; bottom: -2px; border-radius: 50%; background: radial-gradient(circle, ${color}40 0%, transparent 70%); animation: pulse 2s infinite; z-index: 0;"></div>` : ''}
                </div>
            `,
            iconSize: [55, 55],
            iconAnchor: [27, 27]
        });
    }

    // Add bin marker with enhanced visual fill level indication (uses createBinMarkerIcon for single source of truth)
    addBinMarker(bin) {
        if (!this.map || !bin.lat || !bin.lng) return;
        
        // Remove existing marker if it exists to prevent duplicates
        if (this.markers.bins && this.markers.bins[bin.id]) {
            const existingMarker = this.markers.bins[bin.id];
            if (this.layers.bins && this.layers.bins.hasLayer(existingMarker)) {
                this.layers.bins.removeLayer(existingMarker);
            }
            if (this.map && this.map.hasLayer(existingMarker)) {
                this.map.removeLayer(existingMarker);
            }
            delete this.markers.bins[bin.id];
        }

        const icon = this.createBinMarkerIcon(bin);

        const popupContent = this.createBinPopup(bin);
        
        const marker = L.marker([bin.lat, bin.lng], { icon })
            .bindPopup(popupContent, {
                maxWidth: 400,
                className: 'bin-popup',
                closeButton: true,
                autoPan: true,
                autoPanPadding: [50, 50],
                autoClose: false,
                closeOnClick: false,
                closeOnEscapeKey: false, // Don't close on ESC either
                keepInView: true
            });
        
        // CRITICAL: Override the popup's close method with delay
        const popup = marker.getPopup();
        if (popup) {
            const originalClose = popup._close;
            popup._close = function() {
                console.log(`%c⚠️ Popup close requested for ${bin.id}`, 'background: #f59e0b; color: white; padding: 2px 6px;');
                // Allow close only if user clicks the X button
                if (this._closeButton && this._closeButton.classList.contains('clicked')) {
                    console.log(`%c✅ Allowing close via X button for ${bin.id}`, 'background: #10b981; color: white; padding: 2px 6px;');
                    originalClose.call(this);
                } else {
                    // Block automatic close when user didn't click X
                }
            };
        }
        
        // Keep popup open when hovering over it
        marker.on('popupopen', function() {
            const popup = this.getPopup();
            if (popup && popup._container) {
                const container = popup._container;
                if (!container) return;

                // Mark close button when clicked
                const closeButton = container.querySelector('.leaflet-popup-close-button');
                if (closeButton) {
                    closeButton.addEventListener('click', function() {
                        this.classList.add('clicked');
                    });
                }
                
                // Block events from bubbling to the map (so map doesn't pan/zoom) but allow
                // the close button and other popup content to receive clicks. Use BUBBLE phase
                // (not capture) so the close button gets the click first, then we stop propagation
                // as the event bubbles up to the container.
                const events = ['click', 'mousedown', 'mouseup', 'touchstart', 'touchend', 'dblclick'];
                events.forEach(eventType => {
                    container.addEventListener(eventType, function(e) {
                        e.stopPropagation();
                    }, false); // Bubble phase: target (e.g. close button) handles first, then we stop bubble to map
                });
                
                container.addEventListener('mouseenter', function(e) {
                    e.stopPropagation();
                });
                container.addEventListener('mouseleave', function(e) {
                    e.stopPropagation();
                });
                
                // Disable Leaflet's event handling on the popup
                L.DomEvent.disableClickPropagation(container);
                L.DomEvent.disableScrollPropagation(container);
            }
        });
        
        marker.on('popupclose', function() {});

        marker.on('click', function(e) {
            // CRITICAL: Stop event propagation immediately
            if (e) {
                e.originalEvent?.stopPropagation();
                e.originalEvent?.preventDefault();
                L.DomEvent.stopPropagation(e);
            }
            
            // Prevent double-opening if already open
            if (this.isPopupOpen && this.isPopupOpen()) {
                console.log(`%cℹ️ Popup already open for ${bin.id}`, 'background: #3b82f6; color: white; padding: 2px 6px;');
                return;
            }
            console.log(`%c🖱️ CLICKING BIN ${bin.id}`, 'background: #8b5cf6; color: white; font-weight: bold; padding: 4px 8px; border-radius: 4px;');
            
            // Force popup to stay open
            this.openPopup();
            
            // Lock the popup open for 500ms
            const marker = this;
            setTimeout(() => {
                if (marker.isPopupOpen && marker.isPopupOpen()) {
                    console.log(`%c🔒 LOCKING popup for ${bin.id}`, 'background: #f59e0b; color: white; padding: 2px 6px;');
                    const popup = marker.getPopup();
                    if (popup && popup._close) {
                        // Override close temporarily
                        const originalClose = popup._close;
                        popup._close = function() {
                            console.log(`%c⛔ BLOCKED popup close attempt for ${bin.id}`, 'background: #dc2626; color: white; font-weight: bold; padding: 4px 8px;');
                        };
                        
                        // Restore after 2 seconds
                        setTimeout(() => {
                            popup._close = originalClose;
                        }, 2000);
                    }
                }
            }, 100);
        });

        if (this.layers.bins) {
            marker.addTo(this.layers.bins);
        }

        this.markers.bins[bin.id] = marker;
        // World-class: for sensor bins added outside loadBinsOnMap (new bin, single add), refresh fill then update icon
        if ((bin.sensorIMEI || bin.hasSensor) && typeof findyBinSensorIntegration !== 'undefined' && typeof findyBinSensorIntegration.refreshBinSensor === 'function') {
            findyBinSensorIntegration.refreshBinSensor(bin.id).then(() => {
                if (this.markers.bins && this.markers.bins[bin.id]) this.updateBinMarkerIcon(bin.id);
            }).catch(() => {});
        }
    }

    /**
     * World-class: update only the marker icon (fill % circle) when sensor data arrives, without replacing the whole marker.
     * Prevents the "8% then 31%" glitch when sensor refresh runs after first paint.
     */
    updateBinMarkerIcon(binId) {
        if (!this.map || !this.markers.bins) return;
        const marker = this.markers.bins[binId];
        if (!marker) return;
        const bin = typeof dataManager !== 'undefined' ? dataManager.getBinById(binId) : null;
        if (!bin) return;
        const icon = this.createBinMarkerIcon(bin);
        marker.setIcon(icon);
    }

    // Create bin popup (uses same fill logic as marker via getBinFillForDisplay)
    createBinPopup(bin) {
        const isAdmin = typeof authManager !== 'undefined' && authManager.isAdmin && authManager.isAdmin();
        const color = this.getBinColor(bin);
        const fillDisplay = this.getBinFillForDisplay(bin);
        const fillLevel = fillDisplay; // for status text
        const prediction = dataManager.predictBinFillTime(bin.id);
        const statusIcon = fillLevel >= 85 ? '🔥' : fillLevel >= 70 ? '⚠️' : '✅';
        const statusText = fillLevel >= 85 ? 'Critical' : fillLevel >= 70 ? 'Warning' : 'Normal';
        
        // Get capacity and calculate available space
        const capacity = bin.capacity || 100;
        const available = Math.max(0, capacity - (capacity * fillLevel / 100));
        
        // Get sensor data - always show battery and temperature if available on bin
        const hasSensor = bin.hasSensor || bin.sensorIMEI;
        const sensorBattery = bin.sensorData?.battery ?? bin.batteryLevel ?? null;
        const sensorTemperature = bin.sensorData?.temperature ?? bin.temperature ?? null;
        const distanceCm = (bin.sensorData && bin.sensorData.distanceCm != null) ? Number(bin.sensorData.distanceCm) : null;
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
        
        return `
            <div style="
                min-width: 320px;
                max-width: 380px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            ">
                <!-- Header with gradient -->
                <div style="
                    background: linear-gradient(135deg, ${color} 0%, ${this.darkenColor(color, 20)} 100%);
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
                            📍 ${(typeof dataManager !== 'undefined' && dataManager.getBinLocationDisplay && dataManager.getBinLocationDisplay(bin)) || bin.location?.address || bin.locationName || bin.location || 'Location not specified'}
                        </p>
                    </div>
                </div>
                
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
                            ${fillDisplay}%
                        </span>
                    </div>
                    ${distanceCm !== null && !isNaN(distanceCm) ? `
                    <div style="
                        display: inline-flex;
                        align-items: center;
                        gap: 0.35rem;
                        font-size: 0.75rem;
                        font-weight: 600;
                        color: rgba(255,255,255,0.85);
                        background: rgba(255,255,255,0.12);
                        padding: 0.2rem 0.5rem;
                        border-radius: 999px;
                        margin-bottom: 0.5rem;
                    ">
                        <i class="fas fa-ruler-vertical" style="font-size: 0.65rem; opacity: 0.9;"></i>
                        <span>${Math.round(distanceCm)} cm</span> to surface
                    </div>
                    ` : ''}
                    
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
                            background: linear-gradient(90deg, ${color} 0%, ${this.lightenColor(color, 10)} 100%);
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
                            ${sensorBattery !== null ? `${sensorBattery}%` : 'N/A'}
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
                            ${sensorTemperature !== null ? `${sensorTemperature}°C` : 'N/A'}
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
                    grid-template-columns: 1fr 1fr;
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
                    
                    ${isAdmin ? `<button onclick="window.deleteBinWithConfirm && window.deleteBinWithConfirm('${bin.id}')" style="
                        grid-column: 1 / -1;
                        background: linear-gradient(135deg, #64748b 0%, #475569 100%);
                        border: none;
                        border-radius: 10px;
                        padding: 0.75rem 1rem;
                        color: white;
                        font-weight: 600;
                        font-size: 0.8rem;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 0.5rem;
                    " onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
                        <i class="fas fa-trash-alt"></i>
                        <span>Delete bin</span>
                    </button>` : ''}
                </div>
            </div>
            
            <style>
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            </style>
        `;
    }
    
    // Helper function to darken color
    darkenColor(color, percent) {
        const num = parseInt(color.replace("#",""), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, Math.min(255, (num >> 16) + amt));
        const G = Math.max(0, Math.min(255, (num >> 8 & 0x00FF) + amt));
        const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
        return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }
    
    // Helper function to lighten color
    lightenColor(color, percent) {
        const num = parseInt(color.replace("#",""), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, Math.max(0, (num >> 16) - amt));
        const G = Math.min(255, Math.max(0, (num >> 8 & 0x00FF) - amt));
        const B = Math.min(255, Math.max(0, (num & 0x0000FF) - amt));
        return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }

    // Get bin color based on status
    getBinColor(bin) {
        if (bin.status === 'fire-risk') return '#ef4444';
        if (bin.status === 'critical' || bin.fill >= 85) return '#ef4444';
        if (bin.status === 'warning' || bin.fill >= 70) return '#f59e0b';
        return '#10b981';
    }

    // Calculate distance
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    // Start real-time map updates (drivers only; bins updated via bin:updated event to prevent flicker)
    startMapUpdates() {
        this.updateInterval = setInterval(() => {
            this.loadDriversOnMap();
            // Do NOT call loadBinsOnMap() here: it clears and re-adds all bin markers every 5s causing visible flicker.
            // Bin markers are updated in-place via bin:updated → updateBinMarkerIcon() and when new bins are added.
        }, 5000);
        console.log('Real-time map updates started (drivers only; bins use event-driven updates)');
    }

    // Initialize driver map
    initializeDriverMap(elementId = 'driverMap') {
        const mapElement = document.getElementById(elementId);
        if (!mapElement || this.driverMap) return;

        try {
            this.driverMap = L.map(elementId).setView(this.defaultCenter, 15);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19
            }).addTo(this.driverMap);

            this.startDriverTracking();

            console.log('Driver map initialized successfully');
            return this.driverMap;
        } catch (error) {
            console.error('Error initializing driver map:', error);
            return null;
        }
    }

    // Load nearby bins
    loadNearbyBins(driverLat, driverLng) {
        if (!this.driverMap) return;
        
        const bins = dataManager.getBins();
        const nearbyBins = bins.filter(bin => {
            if (!bin.lat || !bin.lng) return false;
            const distance = this.calculateDistance(driverLat, driverLng, bin.lat, bin.lng);
            return distance <= 5;
        });
        
        nearbyBins.forEach(bin => {
            if (!this.driverBinMarkers[bin.id]) {
                const marker = L.marker([bin.lat, bin.lng], {
                    icon: L.divIcon({
                        className: 'bin-marker',
                        html: `
                            <div style="
                                background: ${this.getBinColor(bin)}; 
                                width: 40px; 
                                height: 40px; 
                                border-radius: 50%; 
                                display: flex; 
                                align-items: center; 
                                justify-content: center; 
                                color: white; 
                                font-weight: bold; 
                                font-size: 12px;
                                box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                            ">${bin.fill || 0}%</div>
                        `,
                        iconSize: [40, 40],
                        iconAnchor: [20, 20]
                    })
                }).addTo(this.driverMap);
                
                marker.bindPopup(`
                    <div>
                        <strong>${bin.id}</strong><br>
                        ${(dataManager && dataManager.getBinLocationDisplay && dataManager.getBinLocationDisplay(bin)) || bin.location || '—'}<br>
                        Fill: ${bin.fill || 0}%<br>
                        <button class="btn btn-success btn-sm" onclick="navigateToBin('${bin.id}', ${bin.lat}, ${bin.lng})">
                            Navigate
                        </button>
                    </div>
                `);
                
                this.driverBinMarkers[bin.id] = marker;
            }
        });
    }

    // Update driver status on map - ENHANCED WITH POPUP REFRESH
    updateDriverStatus(driverId, status) {
        console.log(`Updating driver ${driverId} status to: ${status}`);
        
        const driver = dataManager.getUserById(driverId);
        if (!driver) {
            console.error('Driver not found:', driverId);
            return;
        }
        
        // Update driver's movement status in dataManager
        driver.movementStatus = status;
        driver.lastStatusUpdate = new Date().toISOString();
        dataManager.updateUser(driverId, { 
            movementStatus: status,
            lastStatusUpdate: new Date().toISOString()
        });
        
        // Force update the driver's location timestamp
        let location = dataManager.getDriverLocation(driverId);
        
        // Validate and fix location data
        if (!location || !location.lat || !location.lng) {
            console.warn(`⚠️ Invalid location for driver ${driverId}, creating default location`);
            // Create default location in Doha
            location = {
                lat: 25.2854 + (Math.random() * 0.01 - 0.005), // Small random offset
                lng: 51.5310 + (Math.random() * 0.01 - 0.005),
                timestamp: new Date().toISOString(),
                status: status || 'active'
            };
            
            // Save the default location
            dataManager.setDriverLocation(driverId, location);
        } else {
            // Update existing location timestamp and status
            location.timestamp = new Date().toISOString();
            location.status = status || location.status || 'active';
            dataManager.updateDriverLocation(driverId, location.lat, location.lng, location);
        }
        
        // Remove and recreate marker with new status
        if (this.markers.drivers[driverId] && this.layers.drivers) {
            this.layers.drivers.removeLayer(this.markers.drivers[driverId]);
            delete this.markers.drivers[driverId];
        }
        
        // Recreate marker with updated status - ensure location is valid
        if (location && location.lat && location.lng) {
            console.log(`📍 Adding driver marker for ${driver.name} at ${location.lat}, ${location.lng}`);
            this.addDriverMarker(driver, location);
        } else {
            console.error(`❌ Cannot create marker - invalid location for driver ${driver.name}:`, location);
        }
        
        console.log(`Driver ${driver.name} status updated to: ${status}`);
    }

    // NEW: Refresh driver popup content with live data
    refreshDriverPopup(driverId) {
        const marker = this.markers.drivers[driverId];
        if (!marker) {
            console.log(`No marker found for driver ${driverId}`);
            return;
        }

        const driver = dataManager.getUserById(driverId);
        if (!driver) {
            console.error('Driver not found for popup refresh:', driverId);
            return;
        }

        const location = dataManager.getDriverLocation(driverId);
        if (!location) {
            console.warn('No location found for driver popup refresh:', driverId);
            return;
        }

        // Get fresh data for popup
        const todayCollections = dataManager.getTodayCollections().filter(c => c.driverId === driverId).length;
        const isCurrentDriver = window.authManager && window.authManager.getCurrentUser()?.id === driverId;
        
        // Generate fresh popup content
        const newPopupContent = this.createDriverPopup(driver, location, todayCollections, isCurrentDriver);
        
        // Update the popup content
        marker.setPopupContent(newPopupContent);
        
        console.log(`🔄 Refreshed popup content for driver ${driver.name}`);
    }

    // NEW: Update all driver-related UI components
    updateDriverDataUI(driverId) {
        console.log(`🔄 Updating all UI components for driver ${driverId}`);
        
        // 1. Refresh map popup
        this.refreshDriverPopup(driverId);
        
        // 2. Refresh Driver Details modal if it's open for this driver
        if (window.currentDriverDetailsId === driverId) {
            const driver = dataManager.getUserById(driverId);
            if (driver && typeof populateDriverDetailsModal === 'function') {
                console.log('🔄 Refreshing Driver Details modal');
                populateDriverDetailsModal(driver);
            }
        }
        
        // 3. Trigger fleet management refresh if visible
        if (window.app && window.app.currentSection === 'fleet') {
            setTimeout(() => {
                if (window.app.refreshAllDriverData) {
                    window.app.refreshAllDriverData();
                }
            }, 100);
        }
    }

    // Update bin marker
    updateBinMarker(binId) {
        const bin = dataManager.getBinById(binId);
        if (!bin) return;
        
        // ULTRA-CRITICAL FIX: If popup is open, DO NOTHING
        if (this.markers.bins[binId]) {
            const marker = this.markers.bins[binId];
            
            // If popup is open, don't touch anything
            if (marker.isPopupOpen && marker.isPopupOpen()) {
                return; // Don't touch the marker at all
            }
            
            // Popup is not open, safe to remove and recreate
            this.layers.bins.removeLayer(marker);
        }
        
        this.addBinMarker(bin);
    }

    // Center map
    centerMap(lat, lng, zoom = 15) {
        if (this.map) {
            this.map.setView([lat, lng], zoom);
        }
        if (this.driverMap) {
            this.driverMap.setView([lat, lng], zoom);
        }
    }

    // Stop driver tracking
    stopDriverTracking() {
        if (this._gpsFallbackTimer) {
            clearTimeout(this._gpsFallbackTimer);
            this._gpsFallbackTimer = null;
        }
        if (this.driverWatchId) {
            navigator.geolocation.clearWatch(this.driverWatchId);
            this.driverWatchId = null;
        }
        if (this.simulatedInterval) {
            clearInterval(this.simulatedInterval);
            this.simulatedInterval = null;
        }
        
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        
        console.log('Driver tracking stopped');
    }

    // Clear all markers
    clearAllMarkers() {
        if (this.layers.bins) this.layers.bins.clearLayers();
        if (this.layers.drivers) this.layers.drivers.clearLayers();
        if (this.layers.routes) this.layers.routes.clearLayers();
        
        this.markers = {
            bins: {},
            drivers: {},
            alerts: {}
        };
    }

    // Destroy map instances
    destroy() {
        this.stopDriverTracking();
        this.stopLiveDriverPolling(); // Stop live polling on cleanup
        this.clearAllMarkers();
        
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
        
        if (this.driverMap) {
            this.driverMap.remove();
            this.driverMap = null;
        }

        console.log('Map manager destroyed');
    }

    // ============= WORLD-CLASS LIVE DRIVER TRACKING =============
    
    /**
     * Start polling for driver locations when WebSocket is disconnected (fallback)
     * Ensures continuous live tracking even without WebSocket
     */
    startLiveDriverPolling() {
        if (this.isPollingDrivers) {
            console.log('🔄 Driver polling already active');
            return;
        }
        
        console.log('🔄 Starting live driver location polling (WebSocket fallback)');
        this.isPollingDrivers = true;
        
        // Poll every 3 seconds for world-class real-time experience
        this.liveDriverPollingInterval = setInterval(async () => {
            try {
                const response = await fetch('/api/driver/locations', {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    const locs = data.success && data.locations ? data.locations : null;
                    if (locs && typeof locs === 'object') {
                        // Server returns { driverId: { lat, lng, timestamp, ... } }
                        Object.keys(locs).forEach(driverId => {
                            const loc = locs[driverId];
                            if (!loc || loc.lat == null || loc.lng == null) return;
                            // Update dataManager
                            if (window.dataManager && typeof window.dataManager.updateDriverLocation === 'function') {
                                window.dataManager.updateDriverLocation(driverId, loc.lat, loc.lng, {
                                    timestamp: loc.timestamp,
                                    accuracy: loc.accuracy,
                                    speed: loc.speed,
                                    lastUpdate: loc.lastUpdate || loc.timestamp
                                });
                            }
                            // Update map marker
                            if (this.markers.drivers && this.markers.drivers[driverId]) {
                                this.markers.drivers[driverId].setLatLng([loc.lat, loc.lng]);
                                if (this.markers.drivers[driverId].isPopupOpen && this.markers.drivers[driverId].isPopupOpen()) {
                                    const driver = window.dataManager?.getUserById(driverId);
                                    const location = window.dataManager?.getDriverLocation(driverId);
                                    if (driver && location && typeof this.createDriverPopup === 'function') {
                                        const todayCollections = window.dataManager?.getCollections()
                                            .filter(c => c.driverId === driverId && new Date(c.timestamp).toDateString() === new Date().toDateString()).length || 0;
                                        this.markers.drivers[driverId].setPopupContent(this.createDriverPopup(driver, location, todayCollections, false, 'Active'));
                                    }
                                }
                            } else if (this.map && window.dataManager) {
                                const driver = window.dataManager.getUserById(driverId);
                                const location = window.dataManager.getDriverLocation(driverId) || { lat: loc.lat, lng: loc.lng, timestamp: loc.timestamp };
                                if (driver) this.addDriverMarker(driver, location);
                            }
                        });
                    }
                }
            } catch (error) {
                console.warn('⚠️ Driver polling failed:', error.message);
            }
        }, 2000); // Poll every 2s when WebSocket is down (instant when WebSocket is up)
        
        console.log('✅ Live driver polling started (polling every 3s)');
    }
    
    /**
     * Stop polling for driver locations when WebSocket reconnects
     */
    stopLiveDriverPolling() {
        if (!this.isPollingDrivers) {
            return;
        }
        
        console.log('🛑 Stopping live driver location polling (WebSocket reconnected)');
        
        if (this.liveDriverPollingInterval) {
            clearInterval(this.liveDriverPollingInterval);
            this.liveDriverPollingInterval = null;
        }
        
        this.isPollingDrivers = false;
        console.log('✅ Driver polling stopped');
    }
    
    /**
     * Monitor WebSocket connection and switch to polling fallback if needed
     */
    monitorWebSocketForDriverTracking() {
        // Check WebSocket status and start/stop polling accordingly
        if (window.webSocketManager) {
            const wsStatus = window.webSocketManager.getStatus();
            
            if (!wsStatus.connected && !this.isPollingDrivers) {
                console.log('📡 WebSocket disconnected, starting polling fallback for drivers');
                this.startLiveDriverPolling();
            } else if (wsStatus.connected && this.isPollingDrivers) {
                console.log('📡 WebSocket reconnected, stopping polling fallback for drivers');
                this.stopLiveDriverPolling();
            }
        } else if (!this.isPollingDrivers) {
            // WebSocket manager not available, use polling
            console.log('📡 WebSocket not available, using polling for driver tracking');
            this.startLiveDriverPolling();
        }
    }
}

// Create global instance
window.mapManager = new MapManager();

// Global helper functions
window.assignRouteToDriver = function(driverId) {
    console.log('🚛 Opening enhanced route assignment for driver:', driverId);
    
    try {
        const driver = dataManager.getUserById(driverId);
        if (!driver) {
            console.error('❌ Driver not found:', driverId);
    if (window.app) {
                window.app.showAlert('Error', 'Driver not found', 'error');
            }
            return;
        }

        // Get driver location
        const driverLocation = dataManager.getDriverLocation(driverId);
        
        if (!driverLocation || !driverLocation.lat || !driverLocation.lng) {
            console.warn('⚠️ Driver location not available, using default location');
            // Use default location in Doha
            const defaultLocation = {
                lat: 25.2858,
                lng: 51.5264,
                lastUpdate: new Date().toISOString()
            };
            
            // Set default location for driver
            dataManager.setDriverLocation(driverId, defaultLocation);
            window.assignRouteToDriver(driverId); // Retry with default location
            return;
        }

        // Get available bins that need collection
        const bins = dataManager.getBins();
        const routes = dataManager.getRoutes();
        
        // Filter bins that are not already assigned to active routes
        const assignedBinIds = new Set();
        routes.forEach(route => {
            if (route.status !== 'completed' && route.status !== 'cancelled') {
                (route.bins || []).forEach(binId => assignedBinIds.add(binId));
            }
        });

        const availableBins = bins
            .filter(bin => !assignedBinIds.has(bin.id) && (bin.fill || 0) >= 25) // Not assigned and has some fill
            .map(bin => {
                const distance = dataManager.calculateDistance(
                    driverLocation.lat, driverLocation.lng,
                    bin.lat || 25.3682, bin.lng || 51.5511
                );
                
                // Enhanced AI Priority Score: fill level + urgency + distance
                const fillScore = (bin.fill || 0) / 100;
                const urgencyScore = getUrgencyScore(bin);
                const distanceScore = 1 / (distance + 0.1);
                const priorityScore = (fillScore * 0.4) + (urgencyScore * 0.4) + (distanceScore * 0.2);
                
                return {
                    ...bin,
                    distance: Math.round(distance * 100) / 100,
                    priorityScore: priorityScore,
                    estimatedTime: Math.ceil(distance * 2 + 10) // Travel time + collection time
                };
            })
            .sort((a, b) => b.priorityScore - a.priorityScore) // Sort by AI priority
            .slice(0, 15); // Take top 15 for variety

        console.log(`📦 Found ${availableBins.length} available bins for assignment`);

        if (availableBins.length === 0) {
            if (window.app) {
                window.app.showAlert('No Bins Available', 
                    'No bins currently need collection or all bins are already assigned to other drivers.', 
                    'info');
            }
            return;
        }

        console.log('🔍 Debug info:', {
            showRouteAssignmentModal: typeof showRouteAssignmentModal,
            modalElement: document.getElementById('routeAssignmentModal') ? 'EXISTS' : 'NOT FOUND',
            binModalManager: typeof window.binModalManager,
            availableBinsCount: availableBins.length
        });

        // Check if showRouteAssignmentModal function exists
        if (typeof showRouteAssignmentModal === 'function') {
            console.log('✅ Calling showRouteAssignmentModal with:', {
                driver: driver.name,
                binsCount: availableBins.length,
                location: driverLocation
            });
            
            showRouteAssignmentModal(driver, availableBins, driverLocation);
            
            console.log('✅ showRouteAssignmentModal called successfully');
        
        // Refresh driver data after showing modal
        if (typeof window.refreshAllDriverData === 'function') {
            setTimeout(() => {
                window.refreshAllDriverData();
            }, 1000);
        }
        } else {
            console.error('❌ showRouteAssignmentModal function not found');
            console.log('🔍 Available functions:', Object.keys(window).filter(key => key.includes('Modal')));
            
            if (window.app) {
                window.app.showAlert('System Error', 
                    'Route assignment feature is not available. Please refresh the page.', 
                    'error');
            }
        }
        
    } catch (error) {
        console.error('❌ Error in assignRouteToDriver:', error);
        if (window.app) {
            window.app.showAlert('Assignment Error', 
                `Failed to open route assignment: ${error.message}`, 'error');
        }
    }
};

// Helper function for urgency scoring
function getUrgencyScore(bin) {
    const fill = bin.fill || 0;
    if (fill >= 90) return 1.0; // Critical
    if (fill >= 75) return 0.8; // High
    if (fill >= 50) return 0.6; // Medium
    if (fill >= 25) return 0.4; // Low
    return 0.2; // Very low
}

window.viewDriverDetails = function(driverId) {
    console.log('👤 Opening comprehensive driver details for:', driverId);
    
    if (typeof showDriverDetailsModal === 'function') {
        showDriverDetailsModal(driverId);
    } else {
        // Fallback to old behavior if modal function not available
    const driver = dataManager.getUserById(driverId);
    if (driver && window.app) {
        window.app.showAlert('Driver Details', 
            `${driver.name}\nVehicle: ${driver.vehicleId || 'None'}\nPhone: ${driver.phone || 'None'}`, 
            'info');
        }
    }
};

// Route Assignment Modal Function
window.showRouteAssignmentModal = function(driver, availableBins, driverLocation) {
    console.log('🎯 Showing route assignment modal for:', driver.name);
    console.log('📦 Available bins:', availableBins.length);
    console.log('📍 Driver location:', driverLocation);
    
    // Store data globally for modal functions
    window.selectedDriverForRoute = driver.id;
    window.selectedBinsForRoute = [];
    window.recommendedBinsForRoute = availableBins.slice(0, 5).map(b => b.id);
    
    // Populate driver info
    const driverInfo = document.getElementById('routeAssignmentDriverInfo');
    if (driverInfo) {
        driverInfo.innerHTML = `
            <div style="display: flex; align-items: center; gap: 1rem;">
                <div class="driver-avatar" style="
                    width: 60px; 
                    height: 60px; 
                    background: linear-gradient(135deg, #3b82f6 0%, #7c3aed 100%); 
                    border-radius: 50%; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    color: white; 
                    font-weight: bold; 
                    font-size: 1.25rem;
                ">${driver.name.split(' ').map(n => n[0]).join('')}</div>
                <div>
                    <div style="font-weight: bold; font-size: 1.125rem; color: #e2e8f0;">${driver.name}</div>
                    <div style="color: #94a3b8; margin-top: 0.25rem;">
                        <i class="fas fa-truck"></i> Vehicle: ${driver.vehicleId || 'Not Assigned'} • 
                        <i class="fas fa-id-badge"></i> ID: ${driver.id}
                    </div>
                    <div style="color: #94a3b8; margin-top: 0.25rem;">
                        <i class="fas fa-map-marker-alt"></i> Current Location: ${driverLocation.lat.toFixed(4)}, ${driverLocation.lng.toFixed(4)}
                    </div>
                    <div style="color: #10b981; margin-top: 0.25rem; font-weight: bold;">
                        <i class="fas fa-check-circle"></i> Available for Assignment
                    </div>
                </div>
            </div>
        `;
    }
    
    // Show AI recommendation
    if (availableBins.length > 0) {
        const recommendation = document.getElementById('routeAIRecommendation');
        const text = document.getElementById('routeRecommendationText');
        if (recommendation && text) {
            const topBins = availableBins.slice(0, 3);
            const avgDistance = (topBins.reduce((sum, bin) => sum + bin.distance, 0) / topBins.length).toFixed(1);
            
            text.innerHTML = `
                <strong>AI Recommends:</strong> ${topBins.map(b => b.id).join(', ')} 
                - High priority bins within ${avgDistance}km (Estimated time: ${Math.ceil(avgDistance * 3)} mins)
            `;
            recommendation.style.display = 'flex';
        }
    }
    
    // Load available bins
    const binsList = document.getElementById('availableBinsList');
    if (binsList) {
        binsList.innerHTML = availableBins.map((bin, index) => {
            const priorityColor = bin.fill >= 85 ? '#ef4444' : bin.fill >= 70 ? '#f59e0b' : '#10b981';
            const isRecommended = index < 5; // Top 5 are recommended
            const priorityText = bin.fill >= 85 ? 'URGENT' : bin.fill >= 70 ? 'HIGH' : 'MEDIUM';
            
            return `
                <div class="bin-selection-card" data-bin-id="${bin.id}" style="
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid ${isRecommended ? 'rgba(0, 212, 255, 0.5)' : 'rgba(255, 255, 255, 0.1)'};
                    border-radius: 12px;
                    padding: 1rem;
                    margin-bottom: 0.75rem;
                    cursor: pointer;
                    transition: all 0.3s;
                    position: relative;
                " onclick="toggleBinSelection('${bin.id}')">
                    ${isRecommended ? `
                        <div style="
                            position: absolute;
                            top: -8px;
                            right: 10px;
                            background: linear-gradient(135deg, #00d4ff 0%, #0ea5e9 100%);
                            color: white;
                            padding: 2px 8px;
                            border-radius: 10px;
                            font-size: 0.75rem;
                            font-weight: bold;
                        ">
                            ⭐ AI RECOMMENDED
                        </div>
                    ` : ''}
                    
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <div style="flex: 1;">
                            <div style="font-weight: bold; font-size: 1.1rem; color: #e2e8f0;">
                                ${bin.id}
                                <span style="
                                    margin-left: 0.5rem;
                                    padding: 2px 8px;
                                    background: ${priorityColor};
                                    color: white;
                                    border-radius: 12px;
                                    font-size: 0.75rem;
                                    font-weight: bold;
                                ">${priorityText}</span>
                            </div>
                            <div style="color: #94a3b8; font-size: 0.875rem; margin-top: 0.25rem;">
                                <i class="fas fa-map-marker-alt"></i> ${(dataManager && dataManager.getBinLocationDisplay && dataManager.getBinLocationDisplay(bin)) || bin.location || '—'}
                            </div>
                            
                            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; margin-top: 0.75rem;">
                                <div style="text-align: center; background: rgba(0, 0, 0, 0.2); padding: 0.5rem; border-radius: 6px;">
                                    <div style="color: ${priorityColor}; font-weight: bold; font-size: 1.1rem;">
                                        ${bin.fill}%
                                    </div>
                                    <div style="color: #94a3b8; font-size: 0.75rem;">Fill Level</div>
                                </div>
                                <div style="text-align: center; background: rgba(0, 0, 0, 0.2); padding: 0.5rem; border-radius: 6px;">
                                    <div style="color: #3b82f6; font-weight: bold; font-size: 1.1rem;">
                                        ${bin.distance.toFixed(1)} km
                                    </div>
                                    <div style="color: #94a3b8; font-size: 0.75rem;">Distance</div>
                                </div>
                                <div style="text-align: center; background: rgba(0, 0, 0, 0.2); padding: 0.5rem; border-radius: 6px;">
                                    <div style="color: #10b981; font-weight: bold; font-size: 1.1rem;">
                                        ${bin.estimatedTime}m
                                    </div>
                                    <div style="color: #94a3b8; font-size: 0.75rem;">ETA</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bin-checkbox" style="
                            width: 30px;
                            height: 30px;
                            border: 2px solid rgba(255, 255, 255, 0.3);
                            border-radius: 6px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            margin-left: 1rem;
                        ">
                            <i class="fas fa-check" style="display: none; color: #10b981; font-size: 1.2rem;"></i>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    // Reset selected bins list
    if (typeof updateSelectedBinsList === 'function') {
        updateSelectedBinsList();
    } else {
        // Initialize selected bins list if function doesn't exist
        const selectedList = document.getElementById('selectedBinsList');
        if (selectedList) {
            selectedList.innerHTML = '<p style="color: #6b7280; text-align: center; padding: 1rem;">No bins selected yet</p>';
        }
    }
    
    // Show the modal
    const modal = document.getElementById('routeAssignmentModal');
    if (modal) {
        modal.style.display = 'block';
        console.log('✅ Route assignment modal displayed');
        
        // Debug: Log which elements were found/not found
        const driverInfo = document.getElementById('routeAssignmentDriverInfo');
        const binsList = document.getElementById('availableBinsList');
        const selectedList = document.getElementById('selectedBinsList');
        const recommendation = document.getElementById('routeAIRecommendation');
        
        console.log('🔍 Modal elements check:');
        console.log('  - Driver Info:', driverInfo ? '✅ FOUND' : '❌ NOT FOUND');
        console.log('  - Bins List:', binsList ? '✅ FOUND' : '❌ NOT FOUND');
        console.log('  - Selected List:', selectedList ? '✅ FOUND' : '❌ NOT FOUND');
        console.log('  - AI Recommendation:', recommendation ? '✅ FOUND' : '❌ NOT FOUND');
    } else {
        console.error('❌ Route assignment modal not found in DOM');
        
        // Fallback: show a simple alert with bin list
        const binList = availableBins.slice(0, 5).map(bin => 
            `${bin.id} (${bin.fill}%, ${bin.distance.toFixed(1)}km)`
        ).join('\n');
        
        if (window.app) {
            window.app.showAlert(
                'Available Bins for ' + driver.name, 
                'Top recommended bins:\n' + binList + '\n\nModal not available - using fallback display.', 
                'info', 
                8000
            );
        }
        
        // Also create a simple assignment function as emergency fallback
        window.quickAssignBin = function(binId) {
            const bin = dataManager.getBinById(binId);
            if (bin && driver) {
                // Use the bin modal manager for assignment
                if (typeof binModalManager !== 'undefined') {
                    binModalManager.currentBin = bin;
                    binModalManager.selectedDriver = driver;
                    binModalManager.confirmAssignment();
                    console.log('🚀 Emergency assignment completed via binModalManager');
                } else {
                    console.error('❌ No assignment method available');
                }
            }
        };
        
        console.log('💡 Emergency assignment function created: quickAssignBin(binId)');
    }
};

// Route Assignment Modal Functions
window.toggleBinSelection = function(binId) {
    console.log('Toggle bin selection:', binId);
    
    if (!window.selectedBinsForRoute) {
        window.selectedBinsForRoute = [];
    }
    
    const binCard = document.querySelector(`[data-bin-id="${binId}"]`);
    const checkIcon = binCard?.querySelector('.fas.fa-check');
    
    if (window.selectedBinsForRoute.includes(binId)) {
        // Deselect bin
        window.selectedBinsForRoute = window.selectedBinsForRoute.filter(id => id !== binId);
        if (binCard) {
            binCard.style.border = '1px solid rgba(255, 255, 255, 0.1)';
            binCard.style.background = 'rgba(255, 255, 255, 0.05)';
        }
        if (checkIcon) {
            checkIcon.style.display = 'none';
        }
    } else {
        // Select bin
        window.selectedBinsForRoute.push(binId);
        if (binCard) {
            binCard.style.border = '2px solid #10b981';
            binCard.style.background = 'rgba(16, 185, 129, 0.1)';
        }
        if (checkIcon) {
            checkIcon.style.display = 'block';
        }
    }
    
    updateSelectedBinsList();
};

window.updateSelectedBinsList = function() {
    const selectedList = document.getElementById('selectedBinsList');
    if (!selectedList) return;
    
    const count = (window.selectedBinsForRoute && window.selectedBinsForRoute.length) || 0;
    const countEl = document.getElementById('bulkSelectedCount');
    if (countEl) countEl.textContent = count ? count + ' selected' : '';
    const confirmBtn = document.getElementById('confirmAssignmentBtn');
    if (confirmBtn) confirmBtn.disabled = !count || !window.selectedDriverForRoute;
    
    if (!window.selectedBinsForRoute || window.selectedBinsForRoute.length === 0) {
        selectedList.innerHTML = '<p style="color: #6b7280; text-align: center; padding: 1rem;">No bins selected yet</p>';
        return;
    }
    
    const bins = dataManager.getBins();
    const selectedBins = bins.filter(bin => window.selectedBinsForRoute.includes(bin.id));
    
    selectedList.innerHTML = selectedBins.map(bin => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: rgba(16, 185, 129, 0.1); border-radius: 8px; margin-bottom: 0.5rem;">
            <div>
                <strong>${bin.id}</strong> - ${(dataManager.getBinLocationDisplay && dataManager.getBinLocationDisplay(bin)) || bin.location || '—'}<br>
                <small style="color: #6b7280;">${bin.fill}% full</small>
            </div>
            <button onclick="toggleBinSelection('${bin.id}')" style="background: #ef4444; color: white; border: none; border-radius: 4px; padding: 0.25rem 0.5rem; cursor: pointer;">
                Remove
            </button>
        </div>
    `).join('');
};

/** #8 Bulk actions: select all bins currently shown in the list */
window.selectAllBinsInList = function() {
    if (!window.selectedBinsForRoute) window.selectedBinsForRoute = [];
    const list = document.getElementById('availableBinsList');
    if (!list) return;
    const cards = list.querySelectorAll('.bin-selection-card[data-bin-id]');
    const ids = [];
    cards.forEach(card => { const id = card.getAttribute('data-bin-id'); if (id) ids.push(id); });
    window.selectedBinsForRoute = [...new Set([...window.selectedBinsForRoute, ...ids])];
    cards.forEach(card => {
        const id = card.getAttribute('data-bin-id');
        if (id && window.selectedBinsForRoute.includes(id)) {
            card.style.border = '2px solid #10b981';
            card.style.background = 'rgba(16, 185, 129, 0.1)';
            const check = card.querySelector('.fas.fa-check'); if (check) check.style.display = 'block';
        }
    });
    if (typeof updateSelectedBinsList === 'function') updateSelectedBinsList();
};

/** #8 Bulk actions: deselect all */
window.deselectAllBinsInList = function() {
    window.selectedBinsForRoute = [];
    const list = document.getElementById('availableBinsList');
    if (list) {
        list.querySelectorAll('.bin-selection-card[data-bin-id]').forEach(card => {
            card.style.border = '1px solid rgba(255, 255, 255, 0.1)';
            card.style.background = 'rgba(255, 255, 255, 0.05)';
            const check = card.querySelector('.fas.fa-check'); if (check) check.style.display = 'none';
        });
    }
    if (typeof updateSelectedBinsList === 'function') updateSelectedBinsList();
};

/** #8 Bulk actions: export selected bins as CSV */
window.exportSelectedBinsCsv = function() {
    if (!window.selectedBinsForRoute || window.selectedBinsForRoute.length === 0) {
        if (window.app) window.app.showAlert('No selection', 'Select at least one bin to export.', 'info');
        return;
    }
    const bins = (dataManager.getBins() || []).filter(b => window.selectedBinsForRoute.includes(b.id));
    const headers = ['id', 'location', 'fill', 'status', 'lat', 'lng'];
    const rows = [headers.join(',')].concat(bins.map(b => {
        return headers.map(h => {
            let v = (b[h] != null ? b[h] : '');
            if (typeof v === 'string' && (v.indexOf(',') >= 0 || v.indexOf('"') >= 0)) v = '"' + v.replace(/"/g, '""') + '"';
            return v;
        }).join(',');
    }));
    const csv = rows.join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'bins-export-' + (new Date().toISOString().slice(0, 10)) + '.csv';
    a.click();
    URL.revokeObjectURL(a.href);
    if (window.app) window.app.showAlert('Exported', bins.length + ' bins exported as CSV.', 'success', 3000);
};

window.confirmRouteAssignment = async function() {
    console.log('Confirming route assignment');
    
    if (!window.selectedDriverForRoute || !window.selectedBinsForRoute || window.selectedBinsForRoute.length === 0) {
        if (window.app) {
            window.app.showAlert('Selection Required', 'Please select at least one bin to assign.', 'warning');
        }
        return;
    }
    
    const driver = dataManager.getUserById(window.selectedDriverForRoute);
    const bins = dataManager.getBins().filter(bin => window.selectedBinsForRoute.includes(bin.id));
    
    if (!driver || bins.length === 0) {
        if (window.app) {
            window.app.showAlert('Error', 'Invalid driver or bin selection.', 'danger');
        }
        return;
    }
    
    // Create route with multiple bins
    const priority = Math.max(...bins.map(bin => bin.fill)) >= 85 ? 'high' : 
                    Math.max(...bins.map(bin => bin.fill)) >= 70 ? 'medium' : 'low';
    
    const route = {
        id: dataManager.generateId('RTE'),
        driverId: driver.id,
        driverName: driver.name,
        binIds: bins.map(bin => bin.id),
        binDetails: bins.map(bin => ({
            id: bin.id,
            location: (dataManager.getBinLocationDisplay && dataManager.getBinLocationDisplay(bin)) || bin.location,
            fill: bin.fill,
            status: bin.status,
            lat: bin.lat,
            lng: bin.lng
        })),
        priority: priority,
        status: 'pending',
        assignedBy: authManager.getCurrentUser()?.id || 'system',
        assignedByName: authManager.getCurrentUser()?.name || 'System',
        assignedAt: new Date().toISOString(),
        estimatedDuration: bins.length * 15, // 15 minutes per bin
        createdAt: new Date().toISOString()
    };
    
    // World-class fast: save route to server first so it broadcasts immediately – driver sees it instantly
    let savedRoute = null;
    const base = window.location.origin || '';
    try {
        const res = await fetch(`${base}/api/routes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(route)
        });
        const result = res.ok ? await res.json() : null;
        if (result && result.route) savedRoute = result.route;
    } catch (e) {
        console.warn('Route save via API failed, falling back to local + sync:', e && e.message);
    }
    if (!savedRoute) {
        savedRoute = dataManager.addRoute(route);
        if (typeof syncManager !== 'undefined' && syncManager.syncEnabled) {
            syncManager.syncToServer({ routes: [savedRoute] }, 'partial');
        }
    } else {
        dataManager.addRoute(savedRoute);
    }
    
    // Update bins as assigned
    bins.forEach(bin => {
        dataManager.updateBin(bin.id, {
            assignedDriver: driver.id,
            assignedDriverName: driver.name,
            assignedAt: new Date().toISOString(),
            status: 'assigned'
        });
    });
    
    // Show success message
    if (window.app) {
        window.app.showAlert(
            'Assignment Successful', 
            `Driver ${driver.name} has been assigned to ${bins.length} bin(s). Route ID: ${savedRoute.id}`,
            'success'
        );
    }
    
    // Close modal
    closeRouteAssignmentModal();
    
    // Refresh UI
    if (typeof mapManager !== 'undefined') {
        mapManager.loadDriversOnMap();
        mapManager.loadBinsOnMap();
    }
    
    // If current user is the assigned driver, refresh routes (broadcast may have already updated)
    const currentUser = authManager.getCurrentUser();
    if (currentUser && currentUser.id === driver.id && window.app && typeof window.app.loadDriverRoutes === 'function') {
        window.app.loadDriverRoutes();
    }
    
    console.log('✅ Route assignment completed:', savedRoute);
};

window.closeRouteAssignmentModal = function() {
    const modal = document.getElementById('routeAssignmentModal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Clear selections
    window.selectedDriverForRoute = null;
    window.selectedBinsForRoute = [];
    window.recommendedBinsForRoute = [];
};

window.selectAllRecommended = function() {
    if (window.recommendedBinsForRoute) {
        window.selectedBinsForRoute = [...window.recommendedBinsForRoute];
        
        // Update UI for all bins
        document.querySelectorAll('[data-bin-id]').forEach(card => {
            const binId = card.getAttribute('data-bin-id');
            const checkIcon = card.querySelector('.fas.fa-check');
            
            if (window.selectedBinsForRoute.includes(binId)) {
                card.style.border = '2px solid #10b981';
                card.style.background = 'rgba(16, 185, 129, 0.1)';
                if (checkIcon) checkIcon.style.display = 'block';
            }
        });
        
        updateSelectedBinsList();
    }
};

window.assignRecommendedBins = function() {
    console.log('🚀 Auto-assigning recommended bins');
    
    // Select all recommended bins
    selectAllRecommended();
    
    // Small delay to ensure UI updates, then confirm assignment
    setTimeout(() => {
        confirmRouteAssignment();
    }, 300);
};

// DOM Elements Check for Route Assignment
window.checkRouteAssignmentElements = function() {
    const elements = {
        'routeAssignmentModal': document.getElementById('routeAssignmentModal'),
        'routeAssignmentDriverInfo': document.getElementById('routeAssignmentDriverInfo'),
        'availableBinsList': document.getElementById('availableBinsList'),
        'selectedBinsList': document.getElementById('selectedBinsList'),
        'routeAIRecommendation': document.getElementById('routeAIRecommendation'),
        'driverRouteList': document.getElementById('driverRouteList')
    };
    
    console.log('🔍 DOM Elements Check for Route Assignment:');
    Object.keys(elements).forEach(key => {
        console.log(`  - ${key}: ${elements[key] ? '✅ FOUND' : '❌ NOT FOUND'}`);
    });
    
    return elements;
};

// Auto-check on load
setTimeout(() => {
    console.log('🔧 Performing automatic DOM elements check...');
    checkRouteAssignmentElements();
}, 2000);

// Create global instance
window.mapManager = new MapManager();

// Global helper to reset map retry counter
window.resetMapRetryCounter = function() {
    if (window.mapManager) {
        window.mapManager.resetRetryCounter();
    }
};

console.log('Map Manager loaded with complete driver integration');