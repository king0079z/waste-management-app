// FLEET_MAP_COMPLETE_FIX.js
// Ensures Fleet Map loads with ALL data: bins, drivers, routes

console.log('🗺️ FLEET MAP COMPLETE FIX - Loading...');

// Wait for page load
window.addEventListener('load', () => {
    console.log('📄 Page loaded, initializing fleet map fix...');
    
    // Wait for fleetManager to be available
    function waitForFleetManager(callback) {
        let attempts = 0;
        const interval = setInterval(() => {
            attempts++;
            if (window.fleetManager) {
                clearInterval(interval);
                callback();
            } else if (attempts > 50) {
                clearInterval(interval);
                console.warn('⚠️ Fleet Manager not found after 50 attempts');
            }
        }, 200);
    }
    
    waitForFleetManager(() => {
        console.log('✅ Fleet Manager found, setting up auto-population...');
        
        // Override initializeFleetMap to ensure it loads our data
        const originalInit = window.fleetManager.initializeFleetMap;
        
        window.fleetManager.initializeFleetMap = function() {
            console.log('🗺️ Initializing Fleet Map with complete data...');
            
            const mapContainer = document.getElementById('fleetMap');
            if (!mapContainer) {
                console.error('❌ Fleet map container not found');
                return;
            }
            
            // Check if already initialized
            if (this.fleetMap && this.fleetMap._leaflet_id) {
                console.log('ℹ️ Fleet map already initialized, refreshing data...');
                this.loadCompleteFleetData();
                return;
            }
            
            try {
                // Initialize Leaflet map
                this.fleetMap = L.map('fleetMap', {
                    center: [25.2854, 51.5310],
                    zoom: 13,
                    zoomControl: true
                });
                
                // Add dark tile layer
                L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                    attribution: '© OpenStreetMap © CARTO',
                    maxZoom: 20
                }).addTo(this.fleetMap);
                
                // Create layer group
                this.fleetMapLayer = L.layerGroup().addTo(this.fleetMap);
                this.fleetMapMarkers = new Map();
                
                console.log('✅ Fleet map initialized');
                
                // Load complete data
                this.loadCompleteFleetData();
                
            } catch (error) {
                console.error('❌ Fleet map initialization error:', error);
            }
        };
        
        // Add method to load complete fleet data
        window.fleetManager.loadCompleteFleetData = function() {
            console.log('📊 Loading complete fleet data...');
            
            if (!this.fleetMap || !this.fleetMapLayer) {
                console.warn('⚠️ Fleet map not ready');
                return;
            }
            
            // Clear existing
            this.fleetMapLayer.clearLayers();
            if (this.fleetMapMarkers) {
                this.fleetMapMarkers.clear();
            } else {
                this.fleetMapMarkers = new Map();
            }
            
            const drivers = window.dataManager.getUsers().filter(u => u.type === 'driver');
            const bins = window.dataManager.getBins();
            const routes = window.dataManager.getRoutes();
            const locations = window.dataManager.getAllDriverLocations();
            
            console.log(`Loading: ${drivers.length} drivers, ${bins.length} bins, ${routes.length} routes`);
            
            // Add bins to map
            bins.forEach(bin => {
                if (!bin.lat || !bin.lng) return;
                
                const fillLevel = bin.fillLevel || bin.fill || 0;
                const color = fillLevel >= 80 ? '#ef4444' : fillLevel >= 50 ? '#f59e0b' : '#10b981';
                
                const icon = L.divIcon({
                    className: 'fleet-bin-marker',
                    html: `<div style="width:40px;height:40px;background:${color};border-radius:50%;border:3px solid white;box-shadow:0 4px 12px ${color}80,0 0 20px ${color}40;display:flex;align-items:center;justify-content:center;font-size:1.3rem;cursor:pointer;">🗑️</div>`,
                    iconSize: [40, 40],
                    iconAnchor: [20, 20]
                });
                
                const popup = `<div style="padding:15px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;"><h4 style="margin:0 0 10px 0;color:#1e293b;">${bin.location || bin.id}</h4><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;"><div style="padding:8px;background:#f1f5f9;border-radius:6px;"><div style="font-size:0.7rem;color:#64748b;">FILL LEVEL</div><div style="font-weight:700;color:${color};font-size:1.2rem;">${Math.round(fillLevel)}%</div></div><div style="padding:8px;background:#f1f5f9;border-radius:6px;"><div style="font-size:0.7rem;color:#64748b;">STATUS</div><div style="font-weight:700;color:#1e293b;font-size:0.85rem;">${bin.status || 'Normal'}</div></div></div><div style="padding:8px;background:#eff6ff;border-radius:6px;border:1px solid #bfdbfe;"><div style="font-size:0.7rem;color:#3b82f6;margin-bottom:5px;">📍 LOCATION</div><div style="font-weight:600;color:#1e40af;font-family:monospace;font-size:0.8rem;">${bin.lat.toFixed(6)}, ${bin.lng.toFixed(6)}</div></div></div>`;
                
                const marker = L.marker([bin.lat, bin.lng], { icon }).bindPopup(popup);
                marker.addTo(this.fleetMapLayer);
                this.fleetMapMarkers.set(bin.id, marker);
            });
            
            console.log(`✅ Added ${bins.length} bins to fleet map`);
            
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
                
                const icon = L.divIcon({
                    className: 'fleet-driver-marker-wc',
                    html: `<div style="position:relative;width:60px;height:60px;"><div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:80px;height:80px;border-radius:50%;background:radial-gradient(circle,${statusColor}40 0%,transparent 70%);pointer-events:none;"></div><div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,${statusColor} 0%,${statusColor}cc 50%,${statusColor}99 100%);box-shadow:0 10px 30px rgba(0,0,0,0.5),0 4px 12px ${statusColor}60,inset 0 2px 8px rgba(255,255,255,0.3),inset 0 -2px 8px rgba(0,0,0,0.3);border:3px solid rgba(255,255,255,0.9);display:flex;align-items:center;justify-content:center;cursor:pointer;"><div style="position:absolute;top:15%;left:15%;width:40%;height:40%;border-radius:50%;background:radial-gradient(circle at 30% 30%,rgba(255,255,255,0.6),transparent);pointer-events:none;"></div><div style="font-size:28px;z-index:2;position:relative;filter:drop-shadow(0 3px 6px rgba(0,0,0,0.7));">${statusIcon}</div></div>${isLive?`<div style="position:absolute;top:2px;left:2px;width:14px;height:14px;background:#ef4444;border-radius:50%;border:2px solid white;box-shadow:0 0 0 4px rgba(239,68,68,0.3);z-index:10;"></div>`:''}</div>`,
                    iconSize: [60, 60],
                    iconAnchor: [30, 30]
                });
                
                const popup = `<div style="padding:20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:350px;"><h3 style="margin:0 0 15px 0;color:#1e293b;">${statusIcon} ${driver.name}</h3><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:15px;"><div style="padding:10px;background:#f1f5f9;border-radius:8px;"><div style="font-size:0.75rem;color:#64748b;margin-bottom:5px;">STATUS</div><div style="font-weight:700;color:${statusColor};">${statusText}</div></div><div style="padding:10px;background:#f1f5f9;border-radius:8px;"><div style="font-size:0.75rem;color:#64748b;margin-bottom:5px;">DRIVER ID</div><div style="font-weight:700;color:#1e293b;font-size:0.85rem;">${driver.id}</div></div></div><div style="padding:12px;background:#eff6ff;border-radius:8px;border:1px solid #bfdbfe;margin-bottom:10px;"><div style="font-size:0.75rem;color:#3b82f6;font-weight:600;margin-bottom:5px;">📍 GPS COORDINATES</div><div style="font-weight:700;color:#1e40af;font-family:monospace;font-size:0.9rem;text-align:center;line-height:1.6;">${location.lat.toFixed(6)}<br>${location.lng.toFixed(6)}</div>${location.accuracy?`<div style="font-size:0.7rem;color:#64748b;margin-top:8px;text-align:center;">Accuracy: ±${Math.round(location.accuracy)}m</div>`:''}</div>${isLive?`<div style="padding:8px 12px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;text-align:center;"><span style="color:#ef4444;font-weight:700;font-size:0.75rem;">🔴 LIVE TRACKING</span></div>`:''}</div>`;
                
                const marker = L.marker([location.lat, location.lng], { icon }).bindPopup(popup);
                marker.addTo(this.fleetMapLayer);
                this.fleetMapMarkers.set(driver.id, marker);
            });
            
            console.log(`✅ Added ${drivers.length} drivers to fleet map`);
            
            // Add active routes as polylines
            routes.filter(r => r.status !== 'completed').forEach(route => {
                const driverLoc = locations[route.driverId];
                if (!driverLoc || !route.binIds || route.binIds.length === 0) return;
                
                const points = [[driverLoc.lat, driverLoc.lng]];
                route.binIds.forEach(binId => {
                    const bin = bins.find(b => b.id === binId);
                    if (bin && bin.lat && bin.lng) {
                        points.push([bin.lat, bin.lng]);
                    }
                });
                
                if (points.length > 1) {
                    const color = route.status === 'in-progress' ? '#f59e0b' : '#3b82f6';
                    const polyline = L.polyline(points, {
                        color: color,
                        weight: 4,
                        opacity: 0.7,
                        dashArray: route.status === 'pending' ? '10, 10' : null
                    });
                    polyline.addTo(this.fleetMapLayer);
                }
            });
            
            console.log('✅ Active routes added to fleet map');
            
            // Fit map to show all markers
            if (this.fleetMapMarkers.size > 0) {
                const bounds = [];
                this.fleetMapMarkers.forEach(marker => {
                    bounds.push(marker.getLatLng());
                });
                if (bounds.length > 0) {
                    this.fleetMap.fitBounds(bounds, { padding: [50, 50] });
                    console.log('✅ Map auto-fitted to show all markers');
                }
            }
            
            console.log(`✅ Fleet map complete: ${this.fleetMapMarkers.size} markers loaded`);
        };
        
        // Hook into tab switching to populate map when Fleet tab is opened
        const originalSwitchTab = window.fleetManager.switchTab;
        window.fleetManager.switchTab = function(tab) {
            originalSwitchTab.call(this, tab);
            
            if (tab === 'map') {
                setTimeout(() => {
                    if (!this.fleetMap || this.fleetMapMarkers.size === 0) {
                        console.log('🔄 Fleet map tab opened, initializing...');
                        this.initializeFleetMap();
                    } else {
                        console.log('🔄 Fleet map tab opened, refreshing...');
                        this.loadCompleteFleetData();
                    }
                }, 500);
            }
        };
        
        // Auto-initialize if already on map tab
        setTimeout(() => {
            const fleetSection = document.getElementById('fleet');
            const mapTab = document.getElementById('fleetTabContentMap');
            
            if (fleetSection && fleetSection.style.display !== 'none') {
                if (mapTab && mapTab.style.display !== 'none') {
                    console.log('🗺️ Auto-initializing fleet map (already on map tab)...');
                    window.fleetManager.initializeFleetMap();
                }
            }
        }, 2000);
        
        console.log('✅ Fleet map fix installed');
    });
});

console.log('✅ Fleet Map Complete Fix loaded');
