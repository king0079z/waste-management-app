// findy-api-service.js - Findy IoT API Integration Service
// Updated to match the correct UAC API structure from Postman collection
//
// SENSOR DATA CADENCE: Sensors send bin data to the Findy platform every 30 minutes.
// Bin fill levels and other sensor readings from Findy are therefore updated at most
// every 30 min; the app should not assume real-time sub-30-min updates from Findy.
const FINDY_SENSOR_PUSH_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

class FindyAPIService {
    constructor() {
        // On Render (and similar platforms), always use process.env so Dashboard env vars work like local .env
        const useEnvOnly = !!(process.env.RENDER || process.env.VERCEL);
        
        if (useEnvOnly) {
            this.baseUrl = process.env.FINDY_API_URL || 'https://uac.higps.org';
            this.apiKey = process.env.FINDY_API_KEY || 'BEdRCeAZ8Wog47s5YpBhu0ZZV4hLrsV1234';
            this.server = process.env.FINDY_SERVER || 'findyIoT_serverApi';
            this.username = process.env.FINDY_API_USERNAME || '';
            this.password = process.env.FINDY_API_PASSWORD || '';
        } else {
            // Local: load from findy-config.js (which uses env-loader / .env) or fallback to process.env
            let config = null;
            try {
                config = require('./findy-config.js');
            } catch (e) {
                // Config file not available
            }
            if (config && config.findy) {
                this.baseUrl = config.findy.baseURL || 'https://uac.higps.org';
                this.apiKey = config.findy.apiKey;
                this.server = config.findy.server || 'findyIoT_serverApi';
                this.username = config.findy.credentials?.username || '';
                this.password = config.findy.credentials?.password || '';
            } else {
                this.baseUrl = process.env.FINDY_API_URL || 'https://uac.higps.org';
                this.apiKey = process.env.FINDY_API_KEY || 'BEdRCeAZ8Wog47s5YpBhu0ZZV4hLrsV1234';
                this.server = process.env.FINDY_SERVER || 'findyIoT_serverApi';
                this.username = process.env.FINDY_API_USERNAME || '';
                this.password = process.env.FINDY_API_PASSWORD || '';
            }
        }
        // Allow process.env to override credentials when set (e.g. Render env vars)
        if (process.env.FINDY_API_USERNAME) this.username = process.env.FINDY_API_USERNAME;
        if (process.env.FINDY_API_PASSWORD) this.password = process.env.FINDY_API_PASSWORD;
        
        this.token = null; // Hash/token from login
        this.tokenExpiry = null;
        this.trackedDevices = new Map();
        this.liveTrackingIntervals = new Map();
        
        // Request cache to prevent excessive API calls
        // Cache entries expire after 5 seconds to allow fresh data while preventing spam
        this.requestCache = new Map();
        this.cacheTTL = 5000; // 5 seconds cache TTL
        this.pendingRequests = new Map(); // Track in-flight requests to prevent duplicates
        this._notConfiguredLogged = false; // Log "not configured" only once per process
        
        console.log(`🌐 Findy API Service initialized`);
        console.log(`   Base URL: ${this.baseUrl}`);
        console.log(`   Server: ${this.server}`);
        console.log(`   API Key: ${this.apiKey ? '***' + this.apiKey.slice(-4) : 'Not set'}`);
        console.log(`   Username: ${this.username || 'Not set'}`);
    }
    
    /**
     * True when username and password are set (credentials available for login)
     */
    isConfigured() {
        return !!(this.username && this.password);
    }

    /**
     * Get cached response or null if not cached/expired
     */
    getCachedResponse(cacheKey) {
        const cached = this.requestCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
            return cached.data;
        }
        // Clean up expired entry
        if (cached) {
            this.requestCache.delete(cacheKey);
        }
        return null;
    }
    
    /**
     * Store response in cache
     */
    setCachedResponse(cacheKey, data) {
        this.requestCache.set(cacheKey, {
            data: data,
            timestamp: Date.now()
        });
        
        // Clean old cache entries periodically
        if (this.requestCache.size > 100) {
            const now = Date.now();
            for (const [key, value] of this.requestCache) {
                if (now - value.timestamp > this.cacheTTL) {
                    this.requestCache.delete(key);
                }
            }
        }
    }

    /**
     * Get common headers for API requests
     */
    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-API-KEY': this.apiKey,
            'Server': this.server
        };
        
        if (includeAuth && this.token) {
            headers['KEY'] = this.token;
        }
        
        return headers;
    }

    /**
     * Authenticate with Findy IoT API
     * POST /login with username/password in body
     * Returns hash/token to use in KEY header for subsequent requests
     */
    async login(username, password) {
        try {
            console.log('🔐 Attempting Findy API login...');

            const user = username || this.username;
            const pass = password || this.password;

            if (!user || !pass) {
                console.error('❌ Findy API Error: Username and password are required');
                console.error('   Username:', user ? 'SET' : 'MISSING');
                console.error('   Password:', pass ? `SET (length: ${pass.length})` : 'MISSING');
                throw new Error('Username and password are required');
            }

            console.log('📡 Login: URL=', this.baseUrl + '/login', 'User=', user, 'Password length=', pass.length, 'API Key=', this.apiKey ? '✓' : '✗');

            const response = await fetch(`${this.baseUrl}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-API-KEY': this.apiKey
                },
                body: JSON.stringify({
                    username: user,
                    password: pass
                })
            });

            console.log('📥 Login response status:', response.status, response.statusText);

            if (response.status === 401) {
                console.error('❌ AUTHENTICATION FAILED (401 Unauthorized)');
                console.error('   Possible causes: wrong credentials, account locked, or invalid API key');
                try {
                    const errorBody = await response.text();
                    if (errorBody) console.error('   Server message:', errorBody);
                } catch (e) {}
                throw new Error('Authentication failed - check credentials');
            }
            if (response.status === 400) {
                const errorBody = await response.text();
                console.error('❌ BAD REQUEST (400):', errorBody);
                throw new Error('Bad request: ' + (errorBody || 'unknown'));
            }
            if (response.status === 403) {
                console.error('❌ FORBIDDEN (403) - Account may not have API access');
                throw new Error('Forbidden - check account permissions');
            }
            if (!response.ok) {
                const errorBody = await response.text();
                console.error('❌ Login failed:', response.status, errorBody);
                throw new Error(`Login failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            const possibleTokenFields = ['hash', 'token', 'key', 'KEY', 'access_token', 'sessionId'];
            for (const field of possibleTokenFields) {
                if (data[field]) {
                    this.token = typeof data[field] === 'string' ? data[field] : String(data[field]);
                    this.tokenExpiry = Date.now() + (24 * 60 * 60 * 1000);
                    console.log('✅ Findy API login successful, token from', field);
                    return { success: true, token: this.token };
                }
            }
            if (typeof data === 'string') {
                this.token = data;
                this.tokenExpiry = Date.now() + (24 * 60 * 60 * 1000);
                console.log('✅ Findy API login successful (string token)');
                return { success: true, token: this.token };
            }

            console.warn('⚠️ Login response did not contain expected token; keys:', Object.keys(data));
            throw new Error('No token received from login - unexpected response format');
        } catch (error) {
            console.error('❌ Findy API login error:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Ensure we have a valid token
     */
    async ensureAuthenticated() {
        // Check if token is valid
        if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry) {
            return true;
        }
        
        // Try to login
        if (this.username && this.password) {
            const result = await this.login();
            return result.success;
        }
        
        return false;
    }

    /**
     * Refresh authentication token
     */
    async refreshToken() {
        if (!this.username || !this.password) {
            console.warn('⚠️ Cannot refresh token: credentials not stored');
            return { success: false, error: 'No credentials available' };
        }

        console.log('🔄 Refreshing Findy API token...');
        return await this.login(this.username, this.password);
    }

    /**
     * Health check for Findy API connection
     */
    async healthCheck() {
        try {
            // Check if all credentials are configured
            if (!this.apiKey || !this.username || !this.password) {
                return {
                    success: false,
                    authenticated: false,
                    message: 'Findy API credentials not fully configured',
                    details: {
                        hasApiKey: !!this.apiKey,
                        hasUsername: !!this.username,
                        hasPassword: !!this.password
                    }
                };
            }

            // Try to login to verify credentials
            const loginResult = await this.login();
            
            if (loginResult.success) {
                return {
                    success: true,
                    authenticated: true,
                    message: 'Findy API configured and authenticated'
                };
            } else {
                return {
                    success: false,
                    authenticated: false,
                    message: 'Login failed: ' + loginResult.error
                };
            }
        } catch (error) {
            console.error('❌ Findy API health check error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Set credentials without logging in (for initialization)
     */
    setCredentials(username, password) {
        this.username = username;
        this.password = password;
        console.log('🔑 Findy API credentials set for user:', username);
    }

    /**
     * Check if authenticated
     */
    isAuthenticated() {
        return !!this.token && (!this.tokenExpiry || Date.now() < this.tokenExpiry);
    }

    /**
     * Get device information from Findy API
     * GET /device/{imei}
     * Optional DATA header for specific dataTypeIDs: [111,333]
     */
    async getDevice(imei, dataTypes = null, retryCount = 0) {
        try {
            // Check cache first to prevent excessive API calls
            const cacheKey = `device:${imei}:${dataTypes ? JSON.stringify(dataTypes) : 'all'}`;
            const cachedResponse = this.getCachedResponse(cacheKey);
            if (cachedResponse) {
                return cachedResponse;
            }
            
            // Check if there's already a pending request for this device
            if (this.pendingRequests.has(cacheKey)) {
                // Wait for the pending request to complete
                return await this.pendingRequests.get(cacheKey);
            }
            
            // Return cleanly when credentials not set (avoids log spam)
            if (!this.isConfigured()) {
                if (!this._notConfiguredLogged) {
                    this._notConfiguredLogged = true;
                    console.warn('⚠️ Findy API credentials not set (FINDY_API_USERNAME, FINDY_API_PASSWORD). Set them in Render → Environment and redeploy for sensor data.');
                }
                return { success: false, error: 'Findy not configured', configured: false };
            }
            
            // Ensure we're authenticated
            if (!await this.ensureAuthenticated()) {
                throw new Error('Not authenticated - please login first');
            }

            console.log(`📡 Fetching device data for IMEI: ${imei}`);
            
            const headers = this.getHeaders();
            
            // Add DATA header if specific data types requested
            if (dataTypes && Array.isArray(dataTypes) && dataTypes.length > 0) {
                headers['DATA'] = JSON.stringify(dataTypes);
            }

            console.log(`🔗 Calling: GET ${this.baseUrl}/device/${imei}`);

            const response = await fetch(`${this.baseUrl}/device/${imei}`, {
                method: 'GET',
                headers: headers
            });

            console.log(`📥 Response status: ${response.status} ${response.statusText}`);

            // Handle token expiration - automatically refresh and retry
            if (response.status === 401) {
                const errorText = await response.text();
                console.warn(`⚠️ Token expired for device ${imei}, attempting refresh...`);
                
                // Allow up to 2 retries (initial + 2 retries) to handle token propagation delay
                if (retryCount < 2) {
                    // Force token refresh by invalidating current token
                    this.token = null;
                    this.tokenExpiry = null;
                    this.requestCache.clear(); // Don't reuse cached responses with old token
                    
                    const refreshResult = await this.refreshToken();
                    if (refreshResult.success) {
                        console.log(`🔄 Token refreshed, retrying request for ${imei}...`);
                        // Brief delay so new token is fully accepted by API
                        await new Promise(r => setTimeout(r, 400));
                        return this.getDevice(imei, dataTypes, retryCount + 1);
                    } else {
                        console.error(`❌ Failed to refresh token: ${refreshResult.error}`);
                        throw new Error(`Token expired and refresh failed: ${refreshResult.error}`);
                    }
                } else {
                    console.error(`❌ API error response: ${errorText}`);
                    throw new Error(`API request failed after token refresh: 401 Unauthorized`);
                }
            }

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ API error response: ${errorText}`);
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }

            // Get response as text first to handle empty responses
            const responseText = await response.text();
            
            if (!responseText || responseText.trim() === '' || responseText.trim() === 'null') {
                console.warn(`⚠️ Empty response from API for IMEI: ${imei}`);
                return {
                    success: false,
                    error: 'Empty response from API - device may not exist or may not be accessible'
                };
            }

            // Parse JSON
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error(`❌ Failed to parse JSON response: ${responseText.substring(0, 200)}`);
                throw new Error(`Invalid JSON response: ${parseError.message}`);
            }
            
            // Check if response indicates error (sometimes 401 comes as JSON error)
            if (data && Array.isArray(data) && data[0] && data[0]._type === 'error' && data[0].errorCode === 401) {
                console.warn(`⚠️ Token expired (JSON error) for device ${imei}, attempting refresh...`);
                if (retryCount < 1) {
                    this.token = null;
                    this.tokenExpiry = null;
                    const refreshResult = await this.refreshToken();
                    if (refreshResult.success) {
                        console.log(`🔄 Token refreshed, retrying request for ${imei}...`);
                        return this.getDevice(imei, dataTypes, retryCount + 1);
                    }
                }
                throw new Error(data[0].message || 'Token expired');
            }
            
            // Check if response indicates other errors
            if (data.error || data.status === 'error') {
                throw new Error(data.message || data.error || 'API returned error');
            }
            
            // Check if data is empty or device not found
            if (!data || (Array.isArray(data) && data.length === 0)) {
                return {
                    success: false,
                    error: 'Device not found or no data available'
                };
            }

            console.log(`✅ Device data received for ${imei}`);
            
            const result = {
                success: true,
                data: data
            };
            
            // Cache the successful response
            this.setCachedResponse(cacheKey, result);
            
            return result;
        } catch (error) {
            console.error(`❌ Error fetching device ${imei}:`, error);
            return { success: false, error: error.message };
        } finally {
            // Clean up pending request tracking
            const cacheKey = `device:${imei}:${dataTypes ? JSON.stringify(dataTypes) : 'all'}`;
            this.pendingRequests.delete(cacheKey);
        }
    }

    /**
     * Get device history
     * GET /device/{imei}/history/{startDate}/{endDate}
     * Dates in format: YYYY-MM-DD HH:MM:SS
     * Optional DATA header for specific dataTypeIDs: [222]
     */
    async getDeviceHistory(imei, startDate, endDate, dataTypes = null) {
        try {
            if (!await this.ensureAuthenticated()) {
                throw new Error('Not authenticated - please login first');
            }

            console.log(`📡 Fetching device history for IMEI: ${imei}`);
            console.log(`   Period: ${startDate} to ${endDate}`);
            
            const headers = this.getHeaders();
            
            // Add DATA header if specific data types requested
            if (dataTypes && Array.isArray(dataTypes) && dataTypes.length > 0) {
                headers['DATA'] = JSON.stringify(dataTypes);
            }

            // URL encode the dates (spaces become %20)
            const encodedStartDate = encodeURIComponent(startDate);
            const encodedEndDate = encodeURIComponent(endDate);
            
            const url = `${this.baseUrl}/device/${imei}/history/${encodedStartDate}/${encodedEndDate}`;
            console.log(`🔗 Calling: GET ${url}`);

            const response = await fetch(url, {
                method: 'GET',
                headers: headers
            });

            if (!response.ok) {
                throw new Error(`History request failed: ${response.status}`);
            }

            const data = await response.json();
            
            return {
                success: true,
                history: Array.isArray(data) ? data : (data.history || data.data || [])
            };
        } catch (error) {
            console.error('❌ Error fetching device history:', error);
            return { success: false, error: error.message, history: [] };
        }
    }

    /**
     * Get live tracking data for a device
     * GET /device/{imei}/livetracking
     * Returns GPS position if available, null otherwise
     */
    async getLiveTracking(imei, retryCount = 0) {
        try {
            // Check cache first
            const cacheKey = `livetracking:${imei}`;
            const cachedResponse = this.getCachedResponse(cacheKey);
            if (cachedResponse) {
                return cachedResponse;
            }
            
            // Check if there's already a pending request
            if (this.pendingRequests.has(cacheKey)) {
                return await this.pendingRequests.get(cacheKey);
            }
            
            if (!await this.ensureAuthenticated()) {
                throw new Error('Not authenticated - please login first');
            }

            console.log(`📡 Fetching live tracking for IMEI: ${imei}`);

            const response = await fetch(`${this.baseUrl}/device/${imei}/livetracking`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            // Handle token expiration - automatically refresh and retry
            if (response.status === 401) {
                console.warn(`⚠️ Token expired for live tracking ${imei}, attempting refresh...`);
                if (retryCount < 1) {
                    this.token = null;
                    this.tokenExpiry = null;
                    const refreshResult = await this.refreshToken();
                    if (refreshResult.success) {
                        console.log(`🔄 Token refreshed, retrying live tracking for ${imei}...`);
                        return this.getLiveTracking(imei, retryCount + 1);
                    }
                }
                throw new Error('Token expired and refresh failed');
            }

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ API error response: ${errorText}`);
                throw new Error(`Live tracking request failed: ${response.status} ${response.statusText}`);
            }

            // Get response as text first
            const responseText = await response.text();
            
            // API returns null if GPS positioning is not available
            if (!responseText || responseText.trim() === '' || responseText.trim() === 'null') {
                console.log(`ℹ️ No GPS data available for ${imei} (this is normal if device hasn't reported yet)`);
                return {
                    success: true,
                    data: null,
                    message: 'GPS positioning not available'
                };
            }

            // Parse JSON
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error(`❌ Failed to parse JSON: ${responseText.substring(0, 200)}`);
                throw new Error(`Invalid JSON response: ${parseError.message}`);
            }
            
            // Check for token expiration in JSON response
            if (data && Array.isArray(data) && data[0] && data[0]._type === 'error' && data[0].errorCode === 401) {
                console.warn(`⚠️ Token expired (JSON) for live tracking ${imei}, attempting refresh...`);
                if (retryCount < 1) {
                    this.token = null;
                    this.tokenExpiry = null;
                    const refreshResult = await this.refreshToken();
                    if (refreshResult.success) {
                        return this.getLiveTracking(imei, retryCount + 1);
                    }
                }
                throw new Error(data[0].message || 'Token expired');
            }
            
            // Check for errors in response
            if (data && (data.error || data.status === 'error')) {
                throw new Error(data.message || data.error || 'API returned error');
            }
            
            const result = {
                success: true,
                data: this.parseLiveTrackingData(data, imei)
            };
            
            // Cache the response
            this.setCachedResponse(cacheKey, result);
            
            return result;
        } catch (error) {
            console.error(`❌ Error fetching live tracking for ${imei}:`, error);
            return { success: false, error: error.message };
        } finally {
            // Clean up pending request tracking
            const cacheKey = `livetracking:${imei}`;
            this.pendingRequests.delete(cacheKey);
        }
    }

    /**
     * Start live tracking for a device
     * POST /device/{imei}/livetracking
     * Returns requestID
     */
    async startLiveTrackingRequest(imei) {
        try {
            if (!await this.ensureAuthenticated()) {
                throw new Error('Not authenticated - please login first');
            }

            console.log(`🎯 Sending start live tracking request for ${imei}`);

            const response = await fetch(`${this.baseUrl}/device/${imei}/livetracking`, {
                method: 'POST',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error(`Start live tracking failed: ${response.status}`);
            }

            const data = await response.json();
            console.log(`✅ Live tracking started for ${imei}, requestID:`, data.requestID || data);
            
            return {
                success: true,
                requestID: data.requestID || data,
                message: `Live tracking started for ${imei}`
            };
        } catch (error) {
            console.error(`❌ Error starting live tracking for ${imei}:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Stop live tracking for a device
     * DELETE /device/{imei}/livetracking
     */
    async stopLiveTrackingRequest(imei) {
        try {
            if (!await this.ensureAuthenticated()) {
                throw new Error('Not authenticated - please login first');
            }

            console.log(`🛑 Sending stop live tracking request for ${imei}`);

            const response = await fetch(`${this.baseUrl}/device/${imei}/livetracking`, {
                method: 'DELETE',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error(`Stop live tracking failed: ${response.status}`);
            }

            console.log(`✅ Live tracking stopped for ${imei}`);
            
            return {
                success: true,
                message: `Live tracking stopped for ${imei}`
            };
        } catch (error) {
            console.error(`❌ Error stopping live tracking for ${imei}:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Start live tracking with polling (calls GET /device/{imei}/livetracking at intervals)
     */
    async startLiveTracking(imei, callback, interval = 60000) {
        console.log(`🎯 Starting live tracking for ${imei} (interval: ${interval}ms)`);
        
        // Stop existing tracking if any
        this.stopLiveTracking(imei);

        // Send start request to API
        await this.startLiveTrackingRequest(imei);

        // Initial fetch
        const initialData = await this.getLiveTracking(imei);
        if (initialData.success && callback) {
            callback(initialData.data);
        }

        // Set up periodic polling
        const intervalId = setInterval(async () => {
            const data = await this.getLiveTracking(imei);
            if (data.success && callback) {
                callback(data.data);
            }
        }, interval);

        this.liveTrackingIntervals.set(imei, intervalId);
        this.trackedDevices.set(imei, { interval, callback });

        return { success: true, message: `Live tracking started for ${imei}` };
    }

    /**
     * Stop live tracking for a device
     */
    stopLiveTracking(imei) {
        const intervalId = this.liveTrackingIntervals.get(imei);
        if (intervalId) {
            clearInterval(intervalId);
            this.liveTrackingIntervals.delete(imei);
            this.trackedDevices.delete(imei);
            
            // Send stop request to API
            this.stopLiveTrackingRequest(imei).catch(err => {
                console.warn(`⚠️ Could not send stop tracking request: ${err.message}`);
            });
            
            console.log(`🛑 Stopped live tracking for ${imei}`);
            return { success: true, message: `Live tracking stopped for ${imei}` };
        }
        return { success: false, message: `No active tracking for ${imei}` };
    }

    /**
     * Search devices
     * POST /search
     */
    async searchDevices(criteria) {
        try {
            if (!await this.ensureAuthenticated()) {
                throw new Error('Not authenticated - please login first');
            }

            console.log(`🔍 Searching devices with criteria:`, criteria);

            const response = await fetch(`${this.baseUrl}/search`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(criteria)
            });

            if (!response.ok) {
                throw new Error(`Search request failed: ${response.status}`);
            }

            const data = await response.json();
            
            return {
                success: true,
                devices: Array.isArray(data) ? data : (data.devices || [])
            };
        } catch (error) {
            console.error('❌ Error searching devices:', error);
            return { success: false, error: error.message, devices: [] };
        }
    }

    /**
     * Send command to device
     * POST /device/{imei}/command
     * Body: { body: "*SET,265", commandId: "cmd", via: "GPRS" }
     */
    async sendCommand(imei, commandData) {
        try {
            if (!await this.ensureAuthenticated()) {
                throw new Error('Not authenticated - please login first');
            }

            console.log(`📤 Sending command to device ${imei}:`, commandData);

            const response = await fetch(`${this.baseUrl}/device/${imei}/command`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(commandData)
            });

            if (response.status === 400) {
                throw new Error('Bad Request - commandId is not integer, command is not sent');
            }
            if (response.status === 409) {
                throw new Error('This command is already set and waiting to be executed');
            }
            if (!response.ok) {
                throw new Error(`Command send failed: ${response.status}`);
            }

            const data = await response.json();
            console.log(`✅ Command sent to ${imei}`);
            
            return {
                success: true,
                data: data
            };
        } catch (error) {
            console.error('❌ Error sending command:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Delete pending command
     * DELETE /device/{imei}/command
     * Body: { requestID: "641" }
     */
    async deleteCommand(imei, requestID) {
        try {
            if (!await this.ensureAuthenticated()) {
                throw new Error('Not authenticated - please login first');
            }

            const response = await fetch(`${this.baseUrl}/device/${imei}/command`, {
                method: 'DELETE',
                headers: this.getHeaders(),
                body: JSON.stringify({ requestID: requestID })
            });

            if (!response.ok) {
                throw new Error(`Delete command failed: ${response.status}`);
            }

            return { success: true, message: 'Command deleted' };
        } catch (error) {
            console.error('❌ Error deleting command:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Check pending commands
     * GET /device/{imei}/checkPendingCommand/
     */
    async checkPendingCommands(imei) {
        try {
            if (!await this.ensureAuthenticated()) {
                throw new Error('Not authenticated - please login first');
            }

            const response = await fetch(`${this.baseUrl}/device/${imei}/checkPendingCommand/`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error(`Check pending commands failed: ${response.status}`);
            }

            const data = await response.json();
            
            return {
                success: true,
                pending: data
            };
        } catch (error) {
            console.error('❌ Error checking pending commands:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Install device (add vehicle info)
     * POST /device/{imei}/install
     */
    async installDevice(imei, vehicleInfo) {
        try {
            if (!await this.ensureAuthenticated()) {
                throw new Error('Not authenticated - please login first');
            }

            const response = await fetch(`${this.baseUrl}/device/${imei}/install`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(vehicleInfo)
            });

            if (!response.ok) {
                throw new Error(`Install device failed: ${response.status}`);
            }

            const data = await response.json();
            
            return {
                success: true,
                data: data
            };
        } catch (error) {
            console.error('❌ Error installing device:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Uninstall device
     * DELETE /device/{imei}/install
     */
    async uninstallDevice(imei) {
        try {
            if (!await this.ensureAuthenticated()) {
                throw new Error('Not authenticated - please login first');
            }

            const response = await fetch(`${this.baseUrl}/device/${imei}/install`, {
                method: 'DELETE',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error(`Uninstall device failed: ${response.status}`);
            }

            return { success: true, message: 'Device uninstalled' };
        } catch (error) {
            console.error('❌ Error uninstalling device:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Update vehicle info
     * PUT /device/{imei}/car
     */
    async updateVehicleInfo(imei, vehicleInfo) {
        try {
            if (!await this.ensureAuthenticated()) {
                throw new Error('Not authenticated - please login first');
            }

            const response = await fetch(`${this.baseUrl}/device/${imei}/car`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(vehicleInfo)
            });

            if (!response.ok) {
                throw new Error(`Update vehicle info failed: ${response.status}`);
            }

            const data = await response.json();
            
            return {
                success: true,
                data: data
            };
        } catch (error) {
            console.error('❌ Error updating vehicle info:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get M-Bus data
     * POST /device/mbus
     */
    async getMBusData(fromDate, toDate, dataTypes = [], organization = 'ruse') {
        try {
            if (!await this.ensureAuthenticated()) {
                throw new Error('Not authenticated - please login first');
            }

            const response = await fetch(`${this.baseUrl}/device/mbus`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    fDate: fromDate,
                    tDate: toDate,
                    data: dataTypes,
                    organization: organization
                })
            });

            if (!response.ok) {
                throw new Error(`M-Bus data request failed: ${response.status}`);
            }

            const data = await response.json();
            
            return {
                success: true,
                data: data
            };
        } catch (error) {
            console.error('❌ Error fetching M-Bus data:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Batch fetch multiple devices
     */
    async getBatchDevices(imeis) {
        console.log(`📦 Fetching batch data for ${imeis.length} devices`);
        
        const results = await Promise.allSettled(
            imeis.map(imei => this.getDevice(imei))
        );

        const successful = [];
        const failed = [];

        results.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value.success) {
                successful.push({ imei: imeis[index], data: result.value.data });
            } else {
                failed.push({
                    imei: imeis[index],
                    error: result.reason || result.value?.error
                });
            }
        });

        console.log(`✅ Batch fetch complete: ${successful.length} successful, ${failed.length} failed`);

        return {
            success: true,
            devices: successful,
            failed,
            summary: {
                total: imeis.length,
                successful: successful.length,
                failed: failed.length
            }
        };
    }

    /**
     * Parse live tracking data to standardized format
     */
    parseLiveTrackingData(rawData, imei) {
        if (!rawData) return null;
        
        const data = rawData;
        
        return {
            imei: imei || data.imei || data.deviceId || data.IMEI,
            gps: {
                lat: parseFloat(data.lat || data.latitude || data.Latitude || 0),
                lng: parseFloat(data.lon || data.lng || data.longitude || data.Longitude || 0),
                speed: parseFloat(data.speed || data.Speed || 0),
                heading: parseFloat(data.heading || data.course || data.Direction || 0),
                accuracy: parseFloat(data.accuracy || data.Accuracy || 0),
                timestamp: data.timeIn || data.timestamp || data.dt_tracker
            },
            fillLevel: parseFloat(data.fillLevel || data.fill || data.distance || 0),
            battery: parseFloat(data.battery || data.batteryLevel || data.Vbat || 0),
            temperature: parseFloat(data.temperature || data.temp || 0),
            signal: parseFloat(data.signal || data.signalStrength || 0),
            status: this.determineStatus(data),
            lastUpdate: data.timestamp || data.dt_tracker || new Date().toISOString(),
            rawData: data
        };
    }

    /**
     * Determine device status from data
     */
    determineStatus(data) {
        // Check various status indicators
        if (data.status) return data.status;
        if (data.online === true || data.Online === true) return 'online';
        if (data.online === false || data.Online === false) return 'offline';
        
        // Check by timestamp - if recent, assume online
        const lastSeen = data.timestamp || data.dt_tracker || data.lastSeen || data.lastModTime;
        if (lastSeen) {
            const timeDiff = Date.now() - new Date(lastSeen).getTime();
            if (timeDiff < 3600000) return 'online'; // < 1 hour
            if (timeDiff < 86400000) return 'idle'; // < 24 hours
            return 'offline';
        }
        
        return 'unknown';
    }

    /**
     * Stop all live tracking
     */
    stopAllTracking() {
        console.log(`🛑 Stopping all live tracking (${this.liveTrackingIntervals.size} devices)`);
        
        for (const [imei, intervalId] of this.liveTrackingIntervals) {
            clearInterval(intervalId);
            // Send stop request
            this.stopLiveTrackingRequest(imei).catch(() => {});
        }
        
        this.liveTrackingIntervals.clear();
        this.trackedDevices.clear();
        
        return { success: true, message: 'All live tracking stopped' };
    }

    /**
     * Get tracking statistics
     */
    getTrackingStats() {
        return {
            activeTracking: this.trackedDevices.size,
            devices: Array.from(this.trackedDevices.keys())
        };
    }

    /**
     * Get tracked devices list
     */
    getTrackedDevices() {
        return Array.from(this.trackedDevices.keys());
    }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FindyAPIService;
}
