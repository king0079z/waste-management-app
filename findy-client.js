// findy-client.js - Frontend client for Findy IoT API integration

// Log Findy "not authenticated" only once per page to avoid console spam
let _findyNotAuthLogged = false;

class FindyClient {
    constructor() {
        this.baseUrl = '/api/findy'; // Proxy through our server
        this.authenticated = false;
        this.findyNotConfigured = false; // Set true after first "Not authenticated" so we can skip repeated logs
        this.deviceCache = new Map();
        this.trackedDevices = new Set();
        
        // Rate limiting and caching (increased to prevent API storm when map/popups refresh)
        this.requestCache = new Map(); // Cache responses for 30 seconds
        this.cacheTTL = 30000; // 30 second cache (was 10s)
        this.pendingRequests = new Map(); // Track in-flight requests
        this.lastRequestTime = new Map(); // Track last request time per device
        this.minRequestInterval = 15000; // Minimum 15 seconds between requests for same device (was 5s)
        
        console.log('🔧 FindyClient initialized');
    }
    
    /**
     * Check if we should throttle this request
     */
    shouldThrottleRequest(key) {
        const lastTime = this.lastRequestTime.get(key);
        if (lastTime && Date.now() - lastTime < this.minRequestInterval) {
            return true;
        }
        return false;
    }
    
    /**
     * Get cached response if still valid
     */
    getCachedResponse(key) {
        const cached = this.requestCache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
            return cached.data;
        }
        return null;
    }
    
    /**
     * Cache a response
     */
    setCachedResponse(key, data) {
        this.requestCache.set(key, { data, timestamp: Date.now() });
        this.lastRequestTime.set(key, Date.now());
    }

    /**
     * Check authentication status
     */
    async checkAuth() {
        try {
            const response = await fetch(`${this.baseUrl}/health`);
            if (!response.ok) {
                this.authenticated = false;
                return false;
            }
            const data = await response.json();
            this.authenticated = data.success && data.authenticated;
            return this.authenticated;
        } catch (error) {
            console.error('❌ Error checking auth status:', error);
            this.authenticated = false;
            return false;
        }
    }

    /**
     * Health check - used by sensor management admin
     */
    async healthCheck() {
        try {
            const response = await fetch(`${this.baseUrl}/health`);
            if (!response.ok) {
                return { success: false, error: 'Health check failed' };
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('❌ Health check error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get device information
     */
    async getDevice(imei) {
        try {
            const cacheKey = `device:${imei}`;
            
            // Check cache first
            const cachedResponse = this.getCachedResponse(cacheKey);
            if (cachedResponse) {
                // Return cached data silently to reduce log spam
                return cachedResponse;
            }
            
            // Check if we should throttle this request
            if (this.shouldThrottleRequest(cacheKey)) {
                // Return cached device data if available, or a pending indicator
                const deviceData = this.deviceCache.get(imei);
                if (deviceData) {
                    return { success: true, data: deviceData, device: deviceData, cached: true };
                }
            }
            
            // Check if there's already a pending request for this device
            if (this.pendingRequests.has(cacheKey)) {
                return await this.pendingRequests.get(cacheKey);
            }
            
            console.log(`📡 Fetching device ${imei}...`);
            const fetchStartTime = Date.now();
            
            // Create the request promise and track it
            const requestPromise = (async () => {
                const response = await fetch(`${this.baseUrl}/device/${imei}`);
                
                if (!response.ok) {
                    throw new Error(`Failed to fetch device: ${response.statusText}`);
                }
                
                const data = await response.json();
                const responseTime = Date.now() - fetchStartTime;
                
                // Record response time for connection quality monitoring (WORLD-CLASS)
                if (typeof connectionStatusIndicator !== 'undefined') {
                    connectionStatusIndicator.recordResponseTime(responseTime);
                }
                
                if (data.success) {
                    // Update cache
                    this.deviceCache.set(imei, data.data);
                    console.log(`✅ Device ${imei} data received (${responseTime}ms)`);
                    // Return with 'data' key for compatibility with findy-bin-sensor-integration.js
                    const result = { success: true, data: data.data, device: data.data };
                    this.setCachedResponse(cacheKey, result);
                    return result;
                } else {
                    throw new Error(data.error || 'Unknown error');
                }
            })();
            
            this.pendingRequests.set(cacheKey, requestPromise);
            
            try {
                return await requestPromise;
            } finally {
                this.pendingRequests.delete(cacheKey);
            }
        } catch (error) {
            const msg = error && (error.message || String(error));
            const isNotConfigured = /not authenticated|please login first|findy not configured/i.test(msg);
            if (isNotConfigured) {
                this.findyNotConfigured = true;
                if (!_findyNotAuthLogged) {
                    _findyNotAuthLogged = true;
                    console.warn('⚠️ Findy API not configured on server. Add FINDY_API_USERNAME, FINDY_API_PASSWORD (and other Findy vars) in Render → Environment, then redeploy. Sensor data will show when configured.');
                }
            } else {
                console.error(`❌ Error fetching device ${imei}:`, error);
            }
            return { success: false, error: msg };
        }
    }

    /**
     * Get live tracking data
     */
    async getLiveTracking(imei) {
        try {
            const cacheKey = `livetracking:${imei}`;
            
            // Check cache first
            const cachedResponse = this.getCachedResponse(cacheKey);
            if (cachedResponse) {
                return cachedResponse;
            }
            
            // Check if we should throttle
            if (this.shouldThrottleRequest(cacheKey)) {
                const deviceData = this.deviceCache.get(imei);
                if (deviceData) {
                    return { success: true, data: deviceData, cached: true };
                }
            }
            
            // Check for pending request
            if (this.pendingRequests.has(cacheKey)) {
                return await this.pendingRequests.get(cacheKey);
            }
            
            const requestPromise = (async () => {
                const response = await fetch(`${this.baseUrl}/device/${imei}/livetracking`);
                
                if (!response.ok) {
                    throw new Error(`Failed to fetch live tracking: ${response.statusText}`);
                }
                
                const data = await response.json();
                
                if (data.success) {
                    // Update cache
                    this.deviceCache.set(imei, data.data);
                    const result = { success: true, data: data.data };
                    this.setCachedResponse(cacheKey, result);
                    return result;
                } else {
                    throw new Error(data.error || 'Unknown error');
                }
            })();
            
            this.pendingRequests.set(cacheKey, requestPromise);
            
            try {
                return await requestPromise;
            } finally {
                this.pendingRequests.delete(cacheKey);
            }
        } catch (error) {
            console.error(`❌ Error fetching live tracking for ${imei}:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Start live tracking via WebSocket
     */
    startLiveTracking(imei) {
        console.log(`🎯 Starting live tracking for ${imei}`);
        
        // Send request through WebSocket
        if (window.wsManager && window.wsManager.isConnected) {
            window.wsManager.send({
                type: 'start_sensor_tracking',
                imei
            });
            
            this.trackedDevices.add(imei);
            return { success: true, message: `Tracking started for ${imei}` };
        } else {
            console.warn('⚠️ WebSocket not connected, cannot start live tracking');
            return { success: false, error: 'WebSocket not connected' };
        }
    }

    /**
     * Stop live tracking
     */
    stopLiveTracking(imei) {
        console.log(`🛑 Stopping live tracking for ${imei}`);
        
        // Send request through WebSocket
        if (window.wsManager && window.wsManager.isConnected) {
            window.wsManager.send({
                type: 'stop_sensor_tracking',
                imei
            });
            
            this.trackedDevices.delete(imei);
            return { success: true, message: `Tracking stopped for ${imei}` };
        } else {
            console.warn('⚠️ WebSocket not connected');
            return { success: false, error: 'WebSocket not connected' };
        }
    }

    /**
     * Get list of tracked devices
     */
    async getTrackedDevices() {
        try {
            const response = await fetch(`${this.baseUrl}/tracked-devices`);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch tracked devices: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                return { success: true, devices: data.devices || [] };
            } else {
                throw new Error(data.error || 'Unknown error');
            }
        } catch (error) {
            console.error('❌ Error fetching tracked devices:', error);
            return { success: false, error: error.message, devices: [] };
        }
    }

    /**
     * Get device from cache
     */
    getCachedDevice(imei) {
        return this.deviceCache.get(imei) || null;
    }

    /**
     * Clear device cache
     */
    clearCache() {
        this.deviceCache.clear();
        console.log('🧹 Device cache cleared');
    }

    /**
     * Get tracking statistics
     */
    getStats() {
        return {
            cachedDevices: this.deviceCache.size,
            trackedDevices: this.trackedDevices.size,
            authenticated: this.authenticated
        };
    }

    /**
     * Subscribe to sensor updates
     */
    onSensorUpdate(callback) {
        if (typeof callback !== 'function') {
            console.warn('⚠️ onSensorUpdate requires a function callback');
            return;
        }

        document.addEventListener('sensorDataUpdated', (event) => {
            callback(event.detail);
        });

        console.log('✅ Subscribed to sensor updates');
    }

    /**
     * Subscribe to bin fill updates
     */
    onBinFillUpdate(callback) {
        if (typeof callback !== 'function') {
            console.warn('⚠️ onBinFillUpdate requires a function callback');
            return;
        }

        document.addEventListener('binFillUpdated', (event) => {
            callback(event.detail);
        });

        console.log('✅ Subscribed to bin fill updates');
    }

    /**
     * Subscribe to Findy live tracking updates
     */
    onFindyLiveTrackingUpdate(callback) {
        if (typeof callback !== 'function') {
            console.warn('⚠️ onFindyLiveTrackingUpdate requires a function callback');
            return;
        }

        document.addEventListener('findyLiveTrackingUpdate', (event) => {
            callback(event.detail);
        });

        console.log('✅ Subscribed to Findy live tracking updates');
    }
}

// Create global instance
if (typeof window !== 'undefined') {
    window.findyClient = new FindyClient();
    
    // Initialize on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.findyClient.checkAuth();
        });
    } else {
        window.findyClient.checkAuth();
    }
}
