// websocket-manager.js - Real-time WebSocket Communication Manager

class WebSocketManager {
    constructor() {
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 0; // 0 = infinite reconnects for live operation
        this.reconnectDelay = 1000;
        this.maxReconnectDelay = 30000;
        this.isConnected = false;
        this.usesFallback = false;
        this.fallbackMode = null;
        this.messageQueue = [];
        this.eventListeners = new Map();
        this.lastLiveEventAt = 0; // For UI: last real-time message timestamp
        
        this.pongTimeoutId = null;
        this.PONG_TIMEOUT_MS = 12000; // If no pong within 12s, consider connection dead
        
        this.lastUserWarningTime = null;
        this.userIdentificationTimer = null;
        
        this.init();
    }
    
    init() {
        console.log('🔌 Initializing WebSocket Manager...');
        this.connect();
        
        this.pingInterval = setInterval(() => {
            if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.clearPongTimeout();
                this.pongTimeoutId = setTimeout(() => {
                    this.pongTimeoutId = null;
                    console.warn('⏱️ WebSocket pong timeout – reconnecting');
                    if (this.ws) this.ws.close(1000, 'pong timeout');
                }, this.PONG_TIMEOUT_MS);
                this.send({ type: 'ping' });
            }
        }, 28000); // Ping every 28s (server may also ping)
        
        this.healthMonitorInterval = setInterval(() => {
            this.monitorConnectionHealth();
        }, 45000);
    }
    
    clearPongTimeout() {
        if (this.pongTimeoutId) {
            clearTimeout(this.pongTimeoutId);
            this.pongTimeoutId = null;
        }
    }
    
    monitorConnectionHealth() {
        if (!this.isConnected && !this.usesFallback && this.ws === null) {
            this.reconnectAttempts = 0;
            this.connect();
        }
    }
    
    emitConnectionState() {
        const mode = this.usesFallback ? (this.fallbackMode === 'polling' ? 'polling' : 'fallback') : 'websocket';
        const state = {
            connected: this.isConnected,
            mode,
            reconnectAttempts: this.reconnectAttempts,
            queuedMessages: this.messageQueue.length,
            lastLiveEventAt: this.lastLiveEventAt
        };
        this.dispatchEvent('connection_state', state);
    }
    
    getCurrentUser() {
        // Try to get user from different sources
        
        // 1. Check if user is logged in through authManager (admin/management)
        const authUser = window.authManager?.getCurrentUser();
        if (authUser && authUser.id) {
            return authUser;
        }
        
        // 2. Check if this is a driver session
        if (window.currentDriverData) {
            return window.currentDriverData;
        }
        
        // 3. Check localStorage for driver data
        const storedDriver = localStorage.getItem('currentDriver');
        if (storedDriver) {
            try {
                return JSON.parse(storedDriver);
            } catch (error) {
                console.warn('Error parsing stored driver data:', error);
            }
        }
        
        // 4. Check if we can identify from URL or global variables
        if (window.location.pathname.includes('driver') || window.currentUserId) {
            return {
                id: window.currentUserId || 'USR-003', // Fallback to default driver
                type: 'driver',
                name: 'Driver User'
            };
        }
        
        // Only log warning once every 30 seconds to reduce spam
        if (!window._wsUserWarningTime || Date.now() - window._wsUserWarningTime > 30000) {
            console.log('ℹ️ WebSocket waiting for user login...');
            window._wsUserWarningTime = Date.now();
        }
        return null;
    }
    
    updateClientInfo() {
        if (!this.isConnected) {
            return;  // Silent skip if not connected
        }
        
        const currentUser = this.getCurrentUser();
        
        if (currentUser?.id) {
            console.log('✅ WebSocket identified user:', currentUser.name);
            
            const updateInfo = {
                type: 'client_info',
                userAgent: navigator.userAgent,
                timestamp: Date.now(),
                userId: currentUser.id,
                userType: currentUser.type,
                updated: true
            };
            
            this.send(updateInfo);
            
            // Stop retrying once user identified
            if (window._wsUserRetryTimer) {
                clearTimeout(window._wsUserRetryTimer);
                window._wsUserRetryTimer = null;
            }
        } else {
            // Retry with longer interval (10 seconds) to reduce spam
            if (!window._wsUserRetryTimer) {
                window._wsUserRetryTimer = setTimeout(() => {
                    window._wsUserRetryTimer = null;
                    this.updateClientInfo();
                }, 10000);
            }
        }
    }
    
    connect() {
        try {
            // Check if we're in a serverless environment
            const isServerless = window.location.hostname.includes('vercel.app') || 
                               window.location.hostname.includes('netlify.app') ||
                               window.location.hostname.includes('herokuapp.com');
            
            if (isServerless) {
                console.log('🔄 Serverless environment detected, using fallback connection');
                this.initializeFallback();
                return;
            }
            
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}/ws`;
            
            console.log(`🔌 Connecting to WebSocket: ${wsUrl}`);
            this.ws = new WebSocket(wsUrl);
            
            // Set a connection timeout
            const connectionTimeout = setTimeout(() => {
                if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
                    console.log('⏰ WebSocket connection timeout, switching to fallback');
                    this.ws.close();
                    this.initializeFallback();
                }
            }, 5000);
            
            this.ws.onopen = (event) => {
                clearTimeout(connectionTimeout);
                this._wsErrorLogged = false;
                this.handleOpen(event);
            };
            this.ws.onmessage = this.handleMessage.bind(this);
            this.ws.onclose = this.handleClose.bind(this);
            this.ws.onerror = (error) => {
                clearTimeout(connectionTimeout);
                if (!this._wsErrorLogged) {
                    this._wsErrorLogged = true;
                    console.warn('⚠️ WebSocket connection failed (using fallback). Common on cold start or timeout.');
                }
                this.initializeFallback();
            };
            
        } catch (error) {
            if (!this._wsErrorLogged) {
                this._wsErrorLogged = true;
                console.warn('⚠️ WebSocket connection failed (using fallback):', error && error.message);
            }
            this.initializeFallback();
        }
    }

    initializeFallback() {
        if (this.ws) { try { this.ws.close(); } catch (_) {} this.ws = null; }
        this.isConnected = false;
        this.clearPongTimeout();
        
        if (window.mapManager && typeof window.mapManager.startLiveDriverPolling === 'function') {
            window.mapManager.startLiveDriverPolling();
        }
        
        if (window.WebSocketFallback) {
            this.fallback = new window.WebSocketFallback();
            this.fallback.initialize().then((success) => {
                if (success) {
                    this.isConnected = true;
                    this.usesFallback = true;
                    this.fallbackMode = 'fallback';
                    this.emitConnectionState();
                    this.setupFallbackHandlers();
                    this.updateClientInfo();
                    this.processMessageQueue();
                } else {
                    this.initializeBasicPolling();
                }
            });
        } else {
            this.initializeBasicPolling();
        }
    }

    setupFallbackHandlers() {
        if (!this.fallback) return;
        
        // Handle incoming messages from fallback
        this.fallback.on('chat_message', (data) => {
            this.handleMessage({ data: JSON.stringify(data) });
        });
        
        this.fallback.on('driver_update', (data) => {
            this.handleMessage({ data: JSON.stringify(data) });
        });
        
        this.fallback.on('route_completion', (data) => {
            this.handleMessage({ data: JSON.stringify(data) });
        });
        
        this.fallback.on('typing_indicator', (data) => {
            this.handleMessage({ data: JSON.stringify(data) });
        });
    }

    initializeBasicPolling() {
        this.isConnected = true;
        this.usesFallback = true;
        this.fallbackMode = 'polling';
        this.emitConnectionState();
        this.updateClientInfo();
        this.startPolling();
    }

    startPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }
        
        this.pollingInterval = setInterval(() => {
            this.pollForUpdates();
        }, 3000); // Poll every 3 seconds
        
        console.log('📡 HTTP polling started');
    }

    async pollForUpdates() {
        try {
            const response = await fetch('/api/polling/updates', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.updates && data.updates.length > 0) {
                    data.updates.forEach(update => {
                        this.handleMessage({ data: JSON.stringify(update) });
                    });
                }
            }
        } catch (error) {
            console.warn('⚠️ Polling failed:', error);
        }
    }
    
    handleOpen() {
        console.log('✅ WebSocket connected successfully');
        this.isConnected = true;
        this.usesFallback = false;
        this.fallbackMode = null;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        this.clearPongTimeout();
        
        this.flushMessageQueue();
        this.dispatchEvent('connected', { timestamp: Date.now() });
        this.emitConnectionState();
        
        if (window.mapManager && typeof window.mapManager.stopLiveDriverPolling === 'function') {
            window.mapManager.stopLiveDriverPolling();
        }
        
        // Send connection info (only if user is authenticated)
        const currentUser = this.getCurrentUser();
        
        if (currentUser?.id) {
            console.log('📡 Sending WebSocket client info - User ID:', currentUser.id, 'Type:', currentUser.type);
            
            const clientInfo = {
                type: 'client_info',
                userAgent: navigator.userAgent,
                timestamp: Date.now(),
                userId: currentUser.id,
                userType: currentUser.type
            };
            
            this.send(clientInfo);
        } else {
            console.log('⏱️ User not authenticated yet, will send client info after login...');
            
            // Set up a periodic check to send client info once user logs in
            const checkInterval = setInterval(() => {
                const user = this.getCurrentUser();
                if (user?.id) {
                    console.log('✅ User authenticated, sending client info now');
                    this.updateClientInfo();
                    clearInterval(checkInterval);
                }
            }, 2000);
            
            // Stop checking after 30 seconds
            setTimeout(() => clearInterval(checkInterval), 30000);
        }
    }
    
    handleMessage(event) {
        try {
            const data = JSON.parse(event.data);
            if (data.type === 'pong') {
                this.clearPongTimeout();
                return;
            }
            if (data.type !== 'ping' && data.type !== 'connected') {
                this.lastLiveEventAt = Date.now();
            }
            
            switch (data.type) {
                case 'driver_update':
                    this.handleDriverUpdate(data);
                    break;
                case 'bin_update':
                    this.handleBinUpdate(data);
                    break;
                case 'bin_added':
                    this.handleBinAdded(data);
                    break;
                case 'route_update':
                    this.handleRouteUpdate(data);
                    break;
                case 'collection_update':
                    this.handleCollectionUpdate(data);
                    break;
                case 'route_completion':
                    this.handleRouteCompletion(data);
                    break;
                case 'chat_message':
                    this.handleChatMessage(data);
                    break;
                case 'typing_indicator':
                    this.handleTypingIndicator(data);
                    break;
                case 'sensor_update':
                    this.handleSensorUpdate(data);
                    break;
                case 'bin_fill_update':
                    this.handleBinFillUpdate(data);
                    break;
                case 'driver_location':
                    this.handleDriverLocation(data);
                    break;
                case 'findy_livetracking_update':
                    this.handleFindyLiveTrackingUpdate(data);
                    break;
                case 'sensor_tracking_started':
                    this.handleSensorTrackingStarted(data);
                    break;
                case 'sensor_tracking_stopped':
                    this.handleSensorTrackingStopped(data);
                    break;
                case 'connected':
                    console.log('✅ WebSocket connection confirmed');
                    break;
                case 'dataUpdate':
                    this.handleDataUpdate(data);
                    break;
                default:
                    console.log('🔔 Unknown message type:', data.type);
            }
            
            // Dispatch to custom listeners
            this.dispatchEvent(data.type, data);
            
        } catch (error) {
            console.error('❌ Error parsing WebSocket message:', error);
        }
    }
    
    handleClose(event) {
        this.clearPongTimeout();
        if (this.ws) { this.ws = null; }
        this.isConnected = false;
        this.usesFallback = false;
        this.emitConnectionState();
        this.dispatchEvent('disconnected', { code: event.code, reason: event.reason, timestamp: Date.now() });
        
        if (window.mapManager && typeof window.mapManager.startLiveDriverPolling === 'function') {
            window.mapManager.startLiveDriverPolling();
        }
        
        if (event && event.code !== 1000) {
            this.scheduleReconnect();
        }
    }
    
    handleError(error) {
        console.error('❌ WebSocket error:', error);
        this.isConnected = false;
    }
    
    scheduleReconnect() {
        if (this.maxReconnectAttempts > 0 && this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('❌ Max reconnection attempts reached');
            return;
        }
        this.reconnectAttempts++;
        this.emitConnectionState();
        const delay = this.reconnectDelay;
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
        setTimeout(() => { this.connect(); }, delay);
    }
    
    send(data) {
        // Handle fallback mode (HTTP polling or SSE)
        if (this.usesFallback && this.isConnected) {
            if (this.fallback && typeof this.fallback.send === 'function') {
                this.fallback.send(data);
                return true;
            } else if (this.fallbackMode === 'polling') {
                // Send via HTTP POST for polling mode
                this.sendViaHttp(data);
                return true;
            }
        }
        
        // Handle WebSocket mode
        if (this.ws && this.isConnected && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
            return true;
        } else {
            // Queue message for later
            this.messageQueue.push(data);
            if (this.messageQueue.length <= 5) {
                console.log('📤 Message queued (WebSocket not connected)');
            } else if (this.messageQueue.length === 6) {
                console.log('📤 Additional messages queued (suppressing further logs)');
            }
            return false;
        }
    }
    
    async sendViaHttp(data) {
        try {
            await fetch('/api/websocket/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } catch (error) {
            console.warn('⚠️ HTTP send failed:', error.message);
        }
    }
    
    flushMessageQueue() {
        if (this.messageQueue.length > 0) {
            console.log(`📤 Sending ${this.messageQueue.length} queued messages`);
            
            while (this.messageQueue.length > 0) {
                const message = this.messageQueue.shift();
                this.send(message);
            }
        }
    }
    
    // Handle live GPS driver location (world-class: instant map update)
    handleDriverLocation(data) {
        const { driverId, lat, lng, timestamp, accuracy, speed, heading } = data;
        if (!driverId || lat == null || lng == null) return;
        if (window.dataManager && typeof window.dataManager.updateDriverLocation === 'function') {
            const loc = {
                lat: parseFloat(lat),
                lng: parseFloat(lng),
                timestamp: timestamp || new Date().toISOString(),
                accuracy: accuracy != null ? parseFloat(accuracy) : null,
                speed: speed != null ? parseFloat(speed) : null,
                heading: heading != null ? parseFloat(heading) : null
            };
            window.dataManager.updateDriverLocation(driverId, loc.lat, loc.lng, loc);
        }
        if (window.mapManager && window.mapManager.map && window.mapManager.markers.drivers) {
            const marker = window.mapManager.markers.drivers[driverId];
            if (marker) {
                marker.setLatLng([parseFloat(lat), parseFloat(lng)]);
                if (marker.isPopupOpen && marker.isPopupOpen()) {
                    const driver = window.dataManager.getUserById(driverId);
                    const location = window.dataManager.getDriverLocation(driverId);
                    if (driver && location && typeof window.mapManager.createDriverPopup === 'function') {
                        const popupContent = window.mapManager.createDriverPopup(driver, location, 0, false, 'Active');
                        marker.setPopupContent(popupContent);
                    }
                }
            } else {
                const driver = window.dataManager ? window.dataManager.getUserById(driverId) : null;
                const location = window.dataManager ? window.dataManager.getDriverLocation(driverId) : { lat: parseFloat(lat), lng: parseFloat(lng), timestamp };
                if (driver && location) window.mapManager.addDriverMarker(driver, location);
            }
        }
        window.dispatchEvent(new CustomEvent('driver_location', { detail: data }));
    }

    // Handle real-time driver updates
    handleDriverUpdate(data) {
        console.log('🚛 Real-time driver update received:', data.driverId);
        
        // Update local data
        if (window.dataManager && data.driverData) {
            window.dataManager.updateUser(data.driverData);
        }
        
        // Trigger immediate UI updates
        if (window.mapManager && window.mapManager.map) {
            window.mapManager.updateDriverStatus(data.driverId, data.status);
            window.mapManager.updateDriverDataUI(data.driverId);
        }
        
        // Update monitoring page if active
        if (window.app && window.app.currentSection === 'monitoring') {
            window.app.updateMonitoringStats();
        }
        
        // Dispatch custom event
        document.dispatchEvent(new CustomEvent('driverDataUpdated', {
            detail: {
                driverId: data.driverId,
                status: data.status,
                fuelLevel: data.fuelLevel,
                timestamp: data.timestamp,
                source: 'websocket'
            }
        }));
    }
    
    // Handle sensor updates
    handleSensorUpdate(data) {
        console.log(`📡 Sensor update received: ${data.imei}`);
        
        // Update sensor data through the bridge
        if (window.sensorBinMapBridge && data.data) {
            window.sensorBinMapBridge.updateBinFromSensor(data.imei, data.data);
        }
        
        // Update through findy bin sensor integration (primary handler)
        if (window.findyBinSensorIntegration) {
            window.findyBinSensorIntegration.handleSensorUpdate({
                imei: data.imei,
                data: data.data || data
            });
        }
        
        // Update sensor management UI if available
        if (window.sensorManagementAdmin && typeof window.sensorManagementAdmin.updateSensorStatus === 'function') {
            window.sensorManagementAdmin.updateSensorStatus(data.imei, data.data);
        }
        
        // Update monitoring stats
        if (window.app && window.app.currentSection === 'monitoring') {
            window.app.updateMonitoringStats();
        }
        
        // Dispatch custom events (multiple formats for compatibility)
        document.dispatchEvent(new CustomEvent('sensorDataUpdated', {
            detail: { imei: data.imei, data: data.data, timestamp: data.timestamp, source: 'websocket' }
        }));
        
        window.dispatchEvent(new CustomEvent('sensor_update', {
            detail: { imei: data.imei, data: data.data, timestamp: data.timestamp }
        }));
        
        window.dispatchEvent(new CustomEvent('livetracking:update', {
            detail: { imei: data.imei, data: data.data }
        }));
    }
    
    // Handle bin fill level updates (including live GPS position from Findy sensor)
    handleBinFillUpdate(data) {
        // Update bin data including position when server sends lat/lng (sensor GPS)
        if (window.dataManager) {
            const bins = window.dataManager.getBins();
            const binIndex = bins.findIndex(bin => bin.id === data.binId);
            if (binIndex >= 0) {
                bins[binIndex].fill = data.fillLevel;
                bins[binIndex].fillLevel = data.fillLevel;
                bins[binIndex].status = data.status;
                bins[binIndex].lastSensorUpdate = data.timestamp;
                // Apply live GPS position from Findy sensor so map shows current location
                const lat = data.lat != null ? parseFloat(data.lat) : (data.gps && data.gps.lat != null ? parseFloat(data.gps.lat) : null);
                const lng = data.lng != null ? parseFloat(data.lng) : (data.gps && data.gps.lng != null ? parseFloat(data.gps.lng) : null);
                if (lat != null && lng != null && !isNaN(lat) && !isNaN(lng)) {
                    bins[binIndex].lat = lat;
                    bins[binIndex].lng = lng;
                    var loc = bins[binIndex].location;
                    if (!loc || typeof loc === 'string') bins[binIndex].location = {};
                    loc = bins[binIndex].location;
                    loc.lat = lat;
                    loc.lng = lng;
                    var coordLabel = lat.toFixed(4) + ', ' + lng.toFixed(4);
                    loc.address = data.locationAddress || data.gps && (data.gps.address || data.gps.placeName) || coordLabel;
                    bins[binIndex].locationName = loc.address;
                }
                if (data.sensorData) {
                    bins[binIndex].sensorData = data.sensorData;
                }
                if (data.temperature !== undefined) {
                    bins[binIndex].temperature = data.temperature;
                }
                if (data.battery !== undefined) {
                    bins[binIndex].batteryLevel = data.battery;
                }
                window.dataManager.setData('bins', bins);
            }
        }
        
        // Refresh map so bin marker moves to current sensor position (Live Monitoring map)
        if (window.mapManager && window.mapManager.map) {
            const bin = window.dataManager?.getBins().find(b => b.id === data.binId);
            if (bin) {
                if (window.sensorBinMapBridge && typeof window.sensorBinMapBridge.updateMapMarker === 'function') {
                    window.sensorBinMapBridge.updateMapMarker(data.binId, bin);
                }
                if (window.findyBinSensorIntegration && typeof window.findyBinSensorIntegration.updateBinMarkerOnMap === 'function') {
                    window.findyBinSensorIntegration.updateBinMarkerOnMap(data.binId);
                }
                if (typeof window.mapManager.updateBinMarker === 'function') {
                    window.mapManager.updateBinMarker(data.binId);
                }
                // Ensure marker position is updated: re-add marker at new lat/lng (moves bin on map)
                if (typeof window.mapManager.addBinMarker === 'function') {
                    window.mapManager.addBinMarker(bin);
                }
            }
        }
        
        // Update monitoring stats
        if (window.app && window.app.currentSection === 'monitoring') {
            window.app.updateMonitoringStats();
        }
        
        // Dispatch custom events (multiple formats for compatibility)
        document.dispatchEvent(new CustomEvent('binFillUpdated', {
            detail: {
                binId: data.binId,
                fillLevel: data.fillLevel,
                status: data.status,
                sensorIMEI: data.sensorIMEI,
                timestamp: data.timestamp,
                source: 'websocket'
            }
        }));
        
        window.dispatchEvent(new CustomEvent('bin_fill_update', {
            detail: { binId: data.binId, fillLevel: data.fillLevel, status: data.status }
        }));
    }
    
    /**
     * Handle full data update from server (e.g. after sync merge).
     * Applies server bins (with sensor lat/lng) so Live Monitoring map reflects current positions.
     */
    handleDataUpdate(data) {
        if (!window.dataManager || !data.data || typeof data.data !== 'object') return;
        let binsUpdated = false;
        Object.keys(data.data).forEach(key => {
            if (data.data[key] !== undefined) {
                // CRITICAL: Protect recently collected bins from server/Findy overwrites.
                // Sensor reporting interval is admin-configurable (default 30 min); protection = interval + 5 min.
                if (key === 'bins' && Array.isArray(data.data[key]) && window._recentlyCollectedBins) {
                    const now = Date.now();
                    const intervalMin = (typeof window.__sensorReportingIntervalMinutes === 'number' ? window.__sensorReportingIntervalMinutes : 30);
                    const protectionWindow = (intervalMin + 5) * 60 * 1000;
                    data.data[key] = data.data[key].map(serverBin => {
                        const recent = window._recentlyCollectedBins[serverBin.id];
                        if (recent && (now - recent.timestamp) < protectionWindow && serverBin.fill !== 0) {
                            console.log(`🛡️ Protecting recently collected bin ${serverBin.id} from server overwrite (server=${serverBin.fill}%, keeping local=${recent.fill}%)`);
                            return { ...serverBin, fill: recent.fill, fillLevel: recent.fill, status: 'normal', lastCollection: serverBin.lastCollection || new Date().toLocaleString() };
                        }
                        return serverBin;
                    });
                    // Clean up old entries
                    Object.keys(window._recentlyCollectedBins).forEach(binId => {
                        if ((now - window._recentlyCollectedBins[binId].timestamp) > protectionWindow) {
                            delete window._recentlyCollectedBins[binId];
                        }
                    });
                }
                
                // CRITICAL: Protect recently completed routes from server overwrites
                if (key === 'routes' && Array.isArray(data.data[key]) && window._recentlyCompletedRoutes) {
                    const now = Date.now();
                    const protectionWindow = 60000; // 60 seconds
                    data.data[key] = data.data[key].map(serverRoute => {
                        const recent = window._recentlyCompletedRoutes[serverRoute.id];
                        if (recent && (now - recent.timestamp) < protectionWindow && serverRoute.status !== 'completed') {
                            console.log(`🛡️ Protecting recently completed route ${serverRoute.id} from server overwrite (server=${serverRoute.status}, keeping local=completed)`);
                            return { ...serverRoute, status: 'completed', completedAt: serverRoute.completedAt || new Date().toISOString() };
                        }
                        return serverRoute;
                    });
                    // Clean up old entries
                    Object.keys(window._recentlyCompletedRoutes).forEach(routeId => {
                        if ((now - window._recentlyCompletedRoutes[routeId].timestamp) > protectionWindow) {
                            delete window._recentlyCompletedRoutes[routeId];
                        }
                    });
                }
                if (key === 'bins') {
                    const prevBins = window.dataManager.getBins ? window.dataManager.getBins().slice() : [];
                    window.dataManager.setData(key, data.data[key]);
                    binsUpdated = true;
                    if (typeof window.checkDelayedSensorUpdates === 'function') {
                        window.checkDelayedSensorUpdates(prevBins, data.data[key]);
                    }
                } else {
                    window.dataManager.setData(key, data.data[key]);
                }
                // Keep driver route cache in sync when server sends route updates (e.g. admin deleted a route)
                if (key === 'routes' && Array.isArray(data.data[key])) {
                    const routes = data.data[key];
                    const byDriver = {};
                    routes.forEach(r => {
                        const did = r.driverId;
                        if (!byDriver[did]) byDriver[did] = [];
                        byDriver[did].push(r);
                    });
                    Object.keys(byDriver).forEach(driverId => {
                        try {
                            localStorage.setItem('driverRoutes_' + driverId, JSON.stringify(byDriver[driverId]));
                        } catch (e) { /* ignore */ }
                    });
                    // Ensure current user (if driver) has cache updated even when their list is now empty
                    const cu = window.authManager && typeof window.authManager.getCurrentUser === 'function' ? window.authManager.getCurrentUser() : null;
                    if (cu && cu.type === 'driver' && cu.id) {
                        try {
                            localStorage.setItem('driverRoutes_' + cu.id, JSON.stringify(byDriver[cu.id] || []));
                        } catch (e) { /* ignore */ }
                    }
                }
            }
        });
        if (binsUpdated && window.mapManager) {
            if (typeof window.mapManager.loadBinsOnMap === 'function') {
                window.mapManager.loadBinsOnMap();
            } else if (typeof window.mapManager.refreshMap === 'function') {
                window.mapManager.refreshMap();
            }
            if (window.app && window.app.currentSection === 'monitoring') {
                if (typeof window.app.updateMonitoringStats === 'function') {
                    window.app.updateMonitoringStats();
                }
            }
        }
        // Driver: refresh route list immediately when routes update (assign/cancel from admin) – no extra fetch, instant UI
        const user = window.authManager && typeof window.authManager.getCurrentUser === 'function' ? window.authManager.getCurrentUser() : null;
        const isDriver = (user && user.type === 'driver') || (window.authManager && window.authManager.isDriver && window.authManager.isDriver());
        if (data.data.routes !== undefined && isDriver) {
            if (window.app && typeof window.app.loadDriverRoutes === 'function') {
                window.app.loadDriverRoutes(true); // fromBroadcast: use dataManager only, no server fetch
            }
        }
    }
    
    // Handle Findy live tracking updates
    handleFindyLiveTrackingUpdate(data) {
        console.log(`🎯 Findy live tracking update: ${data.imei}`);
        
        // Update through the bridge
        if (window.sensorBinMapBridge && data.data) {
            window.sensorBinMapBridge.updateBinFromSensor(data.imei, data.data);
        }
        
        // Dispatch custom event
        document.dispatchEvent(new CustomEvent('findyLiveTrackingUpdate', {
            detail: {
                imei: data.imei,
                data: data.data,
                timestamp: data.timestamp,
                source: 'websocket'
            }
        }));
    }
    
    // Handle sensor tracking started confirmation
    handleSensorTrackingStarted(data) {
        console.log(`✅ Sensor tracking started: ${data.imei}`);
        
        if (window.sensorManagementAdmin) {
            window.sensorManagementAdmin.onTrackingStarted(data.imei, data.success, data.message);
        }
        
        document.dispatchEvent(new CustomEvent('sensorTrackingStarted', {
            detail: data
        }));
    }
    
    // Handle sensor tracking stopped confirmation
    handleSensorTrackingStopped(data) {
        console.log(`🛑 Sensor tracking stopped: ${data.imei}`);
        
        if (window.sensorManagementAdmin) {
            window.sensorManagementAdmin.onTrackingStopped(data.imei, data.success, data.message);
        }
        
        document.dispatchEvent(new CustomEvent('sensorTrackingStopped', {
            detail: data
        }));
    }
    
    // Handle real-time bin updates
    handleBinUpdate(data) {
        console.log('🗑️ Real-time bin update received:', data.binId);
        
        // Update local data
        if (window.dataManager && data.binData) {
            const bins = window.dataManager.getBins();
            const binIndex = bins.findIndex(bin => bin.id === data.binId);
            if (binIndex >= 0) {
                bins[binIndex] = { ...bins[binIndex], ...data.binData };
                window.dataManager.saveToStorage('bins');
            }
        }
        
        // Update map
        if (window.mapManager && window.mapManager.map) {
            window.mapManager.updateBinMarker(data.binId);
        }
    }
    
    handleBinAdded(data) {
        console.log('📦 Real-time bin added notification received:', data.binId);
        console.log(`📦 Server now has ${data.totalBins} bins`);
        
        // Sync from server to get the new bin (skip for driver to avoid main_thread_freeze)
        const user = this.getCurrentUser();
        if (user && user.type === 'driver') return;
        if (typeof syncManager !== 'undefined' && syncManager.syncFromServer) {
            console.log('🔄 Syncing from server to get new bin...');
            syncManager.syncFromServer().then(() => {
                console.log('✅ Sync completed after bin addition');
                
                // Refresh map after sync
                setTimeout(() => {
                    if (typeof mapManager !== 'undefined' && mapManager.map && mapManager.loadBinsOnMap) {
                        console.log(`🗺️ Refreshing map to show new bin ${data.binId}...`);
                        mapManager.loadBinsOnMap();
                        
                        // Pan to new bin location if available
                        if (data.bin && data.bin.lat && data.bin.lng) {
                            setTimeout(() => {
                                mapManager.map.setView([data.bin.lat, data.bin.lng], 15);
                            }, 1000);
                        }
                    }
                    if (typeof window.forceRefreshBinsOnMap === 'function') {
                        window.forceRefreshBinsOnMap();
                    }
                }, 500);
            }).catch(error => {
                console.error('❌ Error syncing after bin addition:', error);
            });
        } else {
            // Fallback: add bin directly if sync manager not available
            if (window.dataManager && data.bin) {
                const bins = window.dataManager.getBins();
                const exists = bins.find(b => b.id === data.binId);
                if (!exists) {
                    window.dataManager.addBin(data.bin);
                    console.log(`✅ Added bin ${data.binId} directly to dataManager`);
                    
                    // Refresh map
                    if (typeof mapManager !== 'undefined' && mapManager.map && mapManager.loadBinsOnMap) {
                        mapManager.loadBinsOnMap();
                    }
                }
            }
        }
    }
    
    // Handle real-time route completion updates
    handleRouteCompletion(data) {
        console.log('🏁 Real-time route completion received for driver:', data.driverId);
        
        // Update local driver data
        if (window.dataManager && data.driverData) {
            window.dataManager.updateUser(data.driverData);
        }
        
        // Update map immediately with stationary status
        if (window.mapManager && window.mapManager.map) {
            window.mapManager.updateDriverStatus(data.driverId, 'stationary');
            window.mapManager.updateDriverDataUI(data.driverId);
            window.mapManager.refreshDriverPopup(data.driverId);
        }
        
        // Update monitoring page if active
        if (window.app && window.app.currentSection === 'monitoring') {
            window.app.updateMonitoringStats();
            // Force refresh the live monitoring
            setTimeout(() => {
                window.app.performLiveMonitoringSync();
            }, 100);
        }
        
        // Update driver interface if this is the current user
        const currentUser = window.authManager?.getCurrentUser();
        if (currentUser && currentUser.id === data.driverId && window.driverSystemV3Instance) {
            // Update button state
            window.driverSystemV3Instance.updateStartRouteButton();
        }
        
        // Dispatch custom events
        document.dispatchEvent(new CustomEvent('driverDataUpdated', {
            detail: {
                driverId: data.driverId,
                status: data.status,
                action: 'route_completed',
                timestamp: data.timestamp,
                source: 'websocket'
            }
        }));
        
        document.dispatchEvent(new CustomEvent('routeCompleted', {
            detail: {
                driverId: data.driverId,
                completionTime: data.timestamp,
                source: 'websocket'
            }
        }));
    }

    // Handle real-time route updates
    handleRouteUpdate(data) {
        console.log('🛣️ Real-time route update received:', data.routeId);
        
        // Update local data
        if (window.dataManager && data.routeData) {
            const routes = window.dataManager.getRoutes();
            const routeIndex = routes.findIndex(route => route.id === data.routeId);
            if (routeIndex >= 0) {
                routes[routeIndex] = { ...routes[routeIndex], ...data.routeData };
                window.dataManager.saveToStorage('routes');
            }
        }
        
        // Refresh route displays
        if (window.app && window.app.currentSection === 'fleet') {
            window.app.refreshAllDriverData();
        }
    }
    
    // Handle real-time collection updates
    handleCollectionUpdate(data) {
        console.log('📦 Real-time collection update received');
        
        // Update local data
        if (window.dataManager && data.collectionData) {
            window.dataManager.addCollection(data.collectionData);
        }
        
        // Update analytics if on dashboard
        if (window.app && window.app.currentSection === 'dashboard') {
            if (typeof analyticsManager !== 'undefined') {
                analyticsManager.updateDashboardMetrics();
            }
        }
    }
    
    // Event listener system
    addEventListener(eventType, callback) {
        if (!this.eventListeners.has(eventType)) {
            this.eventListeners.set(eventType, []);
        }
        this.eventListeners.get(eventType).push(callback);
    }
    
    removeEventListener(eventType, callback) {
        const listeners = this.eventListeners.get(eventType);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }
    
    dispatchEvent(eventType, data) {
        const listeners = this.eventListeners.get(eventType);
        if (listeners) {
            listeners.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in WebSocket event listener for ${eventType}:`, error);
                }
            });
        }
    }
    
    getStatus() {
        const mode = this.usesFallback ? (this.fallbackMode === 'polling' ? 'polling' : 'fallback') : 'websocket';
        return {
            connected: this.isConnected,
            mode,
            reconnectAttempts: this.reconnectAttempts,
            queuedMessages: this.messageQueue.length,
            lastLiveEventAt: this.lastLiveEventAt
        };
    }
    
    // Manual reconnect
    reconnect() {
        if (this.ws) {
            this.ws.close();
        }
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        this.connect();
    }
    
    destroy() {
        this.clearPongTimeout();
        if (this.pingInterval) { clearInterval(this.pingInterval); this.pingInterval = null; }
        if (this.pollingInterval) { clearInterval(this.pollingInterval); this.pollingInterval = null; }
        if (this.healthMonitorInterval) { clearInterval(this.healthMonitorInterval); this.healthMonitorInterval = null; }
        if (this.ws) { this.ws.close(1000, 'Client shutting down'); this.ws = null; }
        this.eventListeners.clear();
        this.messageQueue = [];
    }

    // ================== MESSAGING SYSTEM HANDLERS ==================
    
    handleChatMessage(data) {
        
        // Forward to enhanced messaging system if available
        if (window.enhancedMessaging && typeof window.enhancedMessaging.handleWebSocketMessage === 'function') {
            window.enhancedMessaging.handleWebSocketMessage(data);
        }
        
        // Also forward to legacy messaging system for compatibility
        if (window.messagingSystem && typeof window.messagingSystem.handleWebSocketMessage === 'function') {
            window.messagingSystem.handleWebSocketMessage(data);
        }
        
        // Show notification if message is high priority
        if (data.priority === 'high') {
            this.showHighPriorityNotification(data);
        }
    }
    
    handleTypingIndicator(data) {
        
        // Forward to enhanced messaging system if available
        if (window.enhancedMessaging && typeof window.enhancedMessaging.handleWebSocketMessage === 'function') {
            window.enhancedMessaging.handleWebSocketMessage(data);
        }
    }
    
    showHighPriorityNotification(data) {
        try {
            const messageData = data.data;
            if (messageData && messageData.type === 'emergency') {
                // Show urgent notification
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification('🚨 EMERGENCY ALERT', {
                        body: `${messageData.senderName}: ${messageData.message.substring(0, 100)}`,
                        icon: '/favicon.ico',
                        tag: 'emergency',
                        requireInteraction: true,
                        vibrate: [300, 100, 300, 100, 300]
                    });
                }
                
                // Also trigger app alert if available
                if (window.app && typeof window.app.showAlert === 'function') {
                    window.app.showAlert('EMERGENCY ALERT', 
                        `${messageData.senderName}: ${messageData.message}`, 
                        'error', 10000);
                }
            }
        } catch (error) {
            console.error('Error showing high priority notification:', error);
        }
    }
}

// Initialize WebSocket manager
let webSocketManager = null;

// Auto-initialize when DOM is ready (single instance only)
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (window.webSocketManager) return; // Prevent double initialization
        try {
            webSocketManager = new WebSocketManager();
            window.webSocketManager = webSocketManager;
            window.wsManager = webSocketManager;
            console.log('✅ WebSocket Manager initialized successfully');
        } catch (error) {
            console.warn('⚠️ WebSocket Manager initialization failed:', error);
        }
    }, 1000);
});

// Initialize immediately if DOM is already loaded (single instance only)
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(() => {
        if (window.webSocketManager) return; // Prevent double initialization
        try {
            webSocketManager = new WebSocketManager();
            window.webSocketManager = webSocketManager;
            window.wsManager = webSocketManager;
            console.log('✅ WebSocket Manager initialized (DOM already ready)');
        } catch (error) {
            console.warn('⚠️ WebSocket Manager initialization failed:', error);
        }
    }, 500);
}

// Export for global access
window.WebSocketManager = WebSocketManager;

// Global function to manually trigger client info update for testing
window.updateWebSocketClientInfo = function() {
    if (window.webSocketManager) {
        window.webSocketManager.updateClientInfo();
        return;
    }
    // Manager may not be initialized yet (e.g. right after login); retry once after delay
    setTimeout(function() {
        if (window.webSocketManager) {
            window.webSocketManager.updateClientInfo();
        }
    }, 1500);
};

// Global function to check current WebSocket user identification
window.debugWebSocketUser = function() {
    console.log('🔍 WebSocket user identification debug:');
    if (window.webSocketManager) {
        const currentUser = window.webSocketManager.getCurrentUser();
        console.log('  - Current user from WebSocket manager:', currentUser);
        console.log('  - WebSocket connected:', window.webSocketManager.isConnected);
        console.log('  - window.currentDriverData:', window.currentDriverData);
        console.log('  - window.currentUserId:', window.currentUserId);
        console.log('  - localStorage currentDriver:', localStorage.getItem('currentDriver'));
        console.log('  - authManager getCurrentUser:', window.authManager?.getCurrentUser());
    } else {
        console.debug('WebSocket manager not available');
    }
};
