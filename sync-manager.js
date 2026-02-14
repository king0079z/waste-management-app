// sync-manager.js - Cross-Device Data Synchronization Manager

class SyncManager {
    constructor() {
        this.baseUrl = window.location.origin;
        this.syncInterval = null;
        this.isOnline = navigator.onLine;
        this.lastSyncTime = null;
        this.pendingUpdates = [];
        this.syncEnabled = false;
        this.retryCount = 0;
        this.maxRetries = 3;
        
        // NEW: Intelligent sync features
        this.lastDataHash = null;
        this.isSyncing = false;
        this.syncQueue = [];
        this.connectionHealth = 'unknown';
        this.adaptiveInterval = 30000; // Start with 30s (increased from 10s to reduce load)
        this.lastActivity = Date.now();
        this.quietPeriodThreshold = 60000; // 1 minute of no activity = slower sync
        
        // NEW: Debouncing/throttling to prevent sync storms
        this.lastSyncToServer = 0;
        this.lastSyncFromServer = 0;
        this.minSyncInterval = 10000; // Minimum 10 seconds between syncs (increased from 5s)
        this.syncToServerDebounceTimer = null;
        this.isProcessingServerData = false; // Flag to prevent recursive syncs
        this.isSyncingToServer = false; // Lock to prevent concurrent syncToServer calls
        this.pendingSyncData = null; // Store pending data if sync is in progress
        
        this.init();
    }

    init() {
        console.log('🔄 Initializing Sync Manager...');
        
        // Check if server is available
        this.checkServerConnection().then(isAvailable => {
            if (isAvailable) {
                this.syncEnabled = true;
                console.log('✅ Server sync enabled');
                this.startPeriodicSync();
                this.setupEventListeners();
                // Defer initial sync so main thread stays responsive (avoids main_thread_freeze on driver)
                const doInitialSync = () => { this.syncFromServer(); };
                if (typeof requestIdleCallback !== 'undefined') {
                    requestIdleCallback(doInitialSync, { timeout: 8000 });
                } else {
                    setTimeout(doInitialSync, 500);
                }
            } else {
                console.log('⚠️ Server not available, using local storage only');
                this.syncEnabled = false;
            }
        });
    }

    async checkServerConnection() {
        try {
            const response = await fetch(`${this.baseUrl}/api/health`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 5000
            });
            
            return response.ok;
        } catch (error) {
            console.warn('Server connection check failed:', error.message);
            return false;
        }
    }

    setupEventListeners() {
        // Online/offline detection
        window.addEventListener('online', () => {
            console.log('🌐 Connection restored');
            this.isOnline = true;
            if (this.syncEnabled) {
                this.processPendingUpdates();
                this.syncFromServer();
            }
        });

        window.addEventListener('offline', () => {
            console.log('📡 Connection lost - operating offline');
            this.isOnline = false;
        });

        // Page visibility: run sync when tab becomes visible, but NOT for driver (causes main_thread_freeze on Android)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden || !this.syncEnabled || !this.isOnline) return;
            const user = (typeof authManager !== 'undefined' && authManager && typeof authManager.getCurrentUser === 'function') ? authManager.getCurrentUser() : null;
            if (user && user.type === 'driver') return;
            this.syncFromServer();
        });
    }

    startPeriodicSync() {
        // ENHANCED: Use fixed reasonable interval (60 seconds) to prevent sync storms
        // The server already polls sensors every 60s and broadcasts updates via WebSocket
        const syncIntervalMs = 60000; // 60 seconds (increased from 30s)
        
        this.syncInterval = setInterval(() => {
            if (!this.isOnline || !this.syncEnabled || this.isSyncing) return;
            const user = (typeof authManager !== 'undefined' && authManager && typeof authManager.getCurrentUser === 'function') ? authManager.getCurrentUser() : null;
            if (user && user.type === 'driver') return;
            this.performIntelligentSync();
        }, syncIntervalMs);
        
        console.log(`🔄 Periodic sync started (${syncIntervalMs/1000}s interval)`);
    }
    
    // NEW: Intelligent sync that adapts to activity levels
    async performIntelligentSync() {
        const now = Date.now();
        const timeSinceLastActivity = now - this.lastActivity;
        
        // Throttle: Skip if we synced recently
        if (now - this.lastSyncFromServer < this.minSyncInterval) {
            return;
        }
        
        // Adapt sync interval based on activity
        if (timeSinceLastActivity > this.quietPeriodThreshold) {
            // Quiet period - reduce sync frequency to save resources
            this.adaptiveInterval = 60000; // 60 seconds (was 30s)
        } else {
            // Active period - more frequent syncing (but still reasonable)
            this.adaptiveInterval = 30000; // 30 seconds (was 10s)
        }
        
        // DON'T restart interval here - it causes issues. Let it run at original frequency.
        
        // Only sync FROM server - don't automatically sync TO server
        // The syncToServer will be called when user actually makes changes
        await this.syncFromServer();
        
        // Update hash for change detection, but don't auto-sync to server
        this.lastDataHash = this.generateDataHash();
    }
    
    // NEW: Generate hash of current data to detect changes
    generateDataHash() {
        try {
            const data = {
                users: dataManager?.users?.length || 0,
                bins: dataManager?.bins?.length || 0,
                routes: dataManager?.routes?.length || 0,
                collections: dataManager?.collections?.length || 0,
                lastUserActivity: this.lastActivity
            };
            return JSON.stringify(data);
        } catch (error) {
            return Date.now().toString(); // Fallback to timestamp
        }
    }
    
    // NEW: Mark activity to influence sync frequency
    markActivity() {
        this.lastActivity = Date.now();
        console.log('🎯 User activity detected - adjusting sync frequency');
    }

    stopPeriodicSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
            console.log('⏹️ Periodic sync stopped');
        }
    }

    // Sync all data from server to local
    async syncFromServer() {
        if (!this.syncEnabled || !this.isOnline) return;
        
        // ENHANCED: Prevent concurrent syncing
        if (this.isSyncing) {
            return false;
        }
        
        // Throttle: Skip if we synced recently
        const now = Date.now();
        if (now - this.lastSyncFromServer < this.minSyncInterval) {
            return false;
        }
        
        this.isSyncing = true;
        this.isProcessingServerData = true; // Prevent recursive syncs
        this.lastSyncFromServer = now;
        
        try {
            console.log('📥 Syncing from server...');
            
            // Enhanced connection health check with timeout
            const startTime = Date.now();
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
            
            const response = await fetch(`${this.baseUrl}/api/data/sync`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            const responseTime = Date.now() - startTime;
            this.updateConnectionHealth(response.ok, responseTime);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            if (result.success && result.data) {
                let hasChanges = false;
                const keys = Object.keys(result.data).filter(k => result.data[k] !== undefined && k !== 'lastUpdate');
                const yieldToMain = () => new Promise(r => setTimeout(r, 0));

                // Process one key per tick so main thread can respond to freeze-detector ping (avoids 15s freeze)
                for (let idx = 0; idx < keys.length; idx++) {
                    const key = keys[idx];
                    const serverData = result.data[key];
                    const localData = dataManager.getData(key);

                    if (!this.hasDataChanged(key, serverData, localData)) continue;

                    // For users array, merge instead of overwrite to preserve demo accounts
                    if (key === 'users' && Array.isArray(serverData) && Array.isArray(localData)) {
                            if (serverData.length === 0 && localData.length > 0) {
                                console.log(`📝 Preserving local ${key} data (${localData.length} items)`);
                                await yieldToMain();
                                continue;
                            }
                            
                            // Merge users by ID/username
                            const merged = [...localData];
                            serverData.forEach(serverItem => {
                                const existingIndex = merged.findIndex(local => 
                                    local.id === serverItem.id || local.username === serverItem.username
                                );
                                if (existingIndex >= 0) {
                                    merged[existingIndex] = serverItem;
                                } else {
                                    merged.push(serverItem);
                                }
                            });
                            dataManager.setData(key, merged);
                            console.log(`🔄 Merged ${key}: ${merged.length} items`);
                            hasChanges = true;
                        } else if (key === 'bins' && Array.isArray(serverData)) {
                            // SERVER IS SOURCE OF TRUTH: Use server deletedBins when present (MongoDB), else local blacklist.
                            const serverDeleted = Array.isArray(result.data?.deletedBins) ? result.data.deletedBins : [];
                            let deletedBins = serverDeleted;
                            if (serverDeleted.length === 0) {
                                try {
                                    const stored = localStorage.getItem('deletedBins');
                                    deletedBins = stored ? JSON.parse(stored) : [];
                                } catch (e) {
                                    deletedBins = [];
                                }
                            } else {
                                try { localStorage.setItem('deletedBins', JSON.stringify(serverDeleted)); } catch (e) {}
                            }
                            let finalBins = (serverData || []).filter(bin => !deletedBins.includes(bin.id));
                            const localData = dataManager.getData(key) || [];
                            
                            // CRITICAL: Protect recently collected bins from server/Findy overwrites.
                            // Sensor reporting interval is admin-configurable (default 30 min); protection = interval + 5 min.
                            if (window._recentlyCollectedBins) {
                                const now = Date.now();
                                const intervalMin = (typeof window.__sensorReportingIntervalMinutes === 'number' ? window.__sensorReportingIntervalMinutes : 30);
                                const protectionWindow = (intervalMin + 5) * 60 * 1000;
                                finalBins = finalBins.map(serverBin => {
                                    const recent = window._recentlyCollectedBins[serverBin.id];
                                    if (recent && (now - recent.timestamp) < protectionWindow && serverBin.fill !== 0) {
                                        console.log(`🛡️ syncFromServer: Protecting recently collected bin ${serverBin.id} from server overwrite (server=${serverBin.fill}%, keeping local=${recent.fill}%)`);
                                        return { ...serverBin, fill: recent.fill, fillLevel: recent.fill, status: 'normal', lastCollection: serverBin.lastCollection || new Date().toLocaleString() };
                                    }
                                    return serverBin;
                                });
                            }
                            
                            if (deletedBins.length > 0) {
                                console.log(`🛡️ Excluding ${deletedBins.length} deleted bins from server list`);
                            }
                            
                            var prevBinsForAttribution = (dataManager.getData(key) || []).slice();
                            dataManager.setData(key, finalBins);
                            if (typeof window.checkDelayedSensorUpdates === 'function') {
                                window.checkDelayedSensorUpdates(prevBinsForAttribution, finalBins);
                            }
                            console.log(`🔄 Merged ${key}: ${finalBins.length} items (${localData.length} local, ${serverData.length} server)`);
                            if (finalBins.length < serverData.length) {
                                console.log(`🗑️ Removed ${serverData.length - finalBins.length} deleted bin(s) from server data`);
                            }
                            if (finalBins.length > localData.length) {
                                const newIds = finalBins.filter(b => !localData.some(l => l.id === b.id)).map(b => b.id);
                                if (newIds.length > 0) {
                                    console.log(`🆕 New bins from server: ${newIds.join(', ')}`);
                                }
                            }
                            // Always force map refresh when bins are updated from sync (fixes bins not showing when Tracking Prevention blocks storage or throttle skipped)
                            setTimeout(() => {
                                if (typeof mapManager !== 'undefined' && mapManager.map && mapManager.loadBinsOnMap) {
                                    mapManager.loadBinsOnMap(true);
                                }
                                if (typeof window.forceRefreshBinsOnMap === 'function') {
                                    window.forceRefreshBinsOnMap();
                                }
                            }, 400);
                            hasChanges = true;
                        } else if (key === 'sensors' && Array.isArray(serverData)) {
                            // Handle sensors - merge by IMEI and update bin-sensor mappings
                            const localSensors = localData || [];
                            const merged = [...localSensors];
                            serverData.forEach(serverSensor => {
                                const existingIndex = merged.findIndex(local => local.imei === serverSensor.imei);
                                if (existingIndex >= 0) {
                                    merged[existingIndex] = serverSensor;
                                } else {
                                    merged.push(serverSensor);
                                }
                            });
                            dataManager.setData(key, merged);
                            console.log(`📡 Synced ${merged.length} sensors from server`);
                            
                            // Update bin-sensor integration if available
                            if (window.findyBinSensorIntegration && typeof window.findyBinSensorIntegration.loadBinSensorMappings === 'function') {
                                setTimeout(() => {
                                    window.findyBinSensorIntegration.loadBinSensorMappings();
                                }, 500);
                            }
                            hasChanges = true;
                        } else {
                            // For other data types, use server data if available
                            if (Array.isArray(serverData) && serverData.length > 0) {
                                let dataToSet = serverData;
                                // CRITICAL: Protect recently completed routes from server overwrites
                                if (key === 'routes' && window._recentlyCompletedRoutes) {
                                    const now = Date.now();
                                    const protectionWindow = 60000; // 60 seconds
                                    dataToSet = serverData.map(serverRoute => {
                                        const recent = window._recentlyCompletedRoutes[serverRoute.id];
                                        if (recent && (now - recent.timestamp) < protectionWindow && serverRoute.status !== 'completed') {
                                            console.log(`🛡️ syncFromServer: Protecting recently completed route ${serverRoute.id} from server overwrite (server=${serverRoute.status}, keeping local=completed)`);
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
                                
                                dataManager.setData(key, dataToSet);
                                console.log(`📥 Updated ${key}: ${dataToSet.length} items`);
                                hasChanges = true;
                            } else if (!Array.isArray(serverData) && serverData !== null) {
                                dataManager.setData(key, serverData);
                                console.log(`📥 Updated ${key}:`, serverData);
                                hasChanges = true;
                                
                                // Debug driver locations specifically
                                if (key === 'driverLocations') {
                                    console.log(`🔍 Driver locations synced from server:`, serverData);
                                    console.log(`💾 Verified in dataManager:`, dataManager.getData(key));
                                    console.log(`📍 Available drivers:`, Object.keys(serverData || {}));
                                    
                                    // Trigger AI recommendation refresh for current driver when locations update
                                    if (window.currentUser && window.currentUser.type === 'driver') {
                                        console.log(`🤖 Refreshing AI recommendations due to location update`);
                                        setTimeout(() => {
                                            if (typeof createAISuggestionForDriver === 'function') {
                                                createAISuggestionForDriver(window.currentUser.id).then(() => {
                                                    if (window.app && typeof window.app.loadAISuggestionForDriver === 'function') {
                                                        window.app.loadAISuggestionForDriver(window.currentUser.id);
                                                    }
                                                }).catch(error => {
                                                    console.error('❌ AI recommendation refresh failed:', error);
                                                });
                                            }
                                        }, 1000); // Small delay to ensure data is fully synced
                                    }
                                }
                            }
                        }
                    await yieldToMain();
                }

                this.lastSyncTime = result.timestamp || Date.now();
                this.retryCount = 0;
                
                console.log('✅ Sync from server completed');
                
                // Notify AI/ML and other systems that MongoDB data is fresh
                if (typeof document !== 'undefined') {
                    document.dispatchEvent(new CustomEvent('syncCompleted', { detail: { hasChanges } }));
                }
                
                // Defer UI updates so main thread can process pings (avoids main_thread_freeze report)
                if (hasChanges) {
                    console.log('🎯 Changes detected - triggering UI updates');
                    const self = this;
                    if (typeof requestIdleCallback !== 'undefined') {
                        requestIdleCallback(() => self.triggerUIUpdates(), { timeout: 2000 });
                    } else {
                        setTimeout(() => self.triggerUIUpdates(), 0);
                    }
                }
                // Silently skip UI updates when no changes detected
                
                return true;
            } else {
                throw new Error(result.error || 'Sync failed');
            }
        } catch (error) {
            console.error('❌ Sync from server failed:', error.message);
            this.updateConnectionHealth(false, 0);
            this.handleSyncError();
            return false;
        } finally {
            this.isSyncing = false;
            // Keep isProcessingServerData true briefly so debounced syncToServer from setData don't fire (avoids 429 on load)
            setTimeout(() => { this.isProcessingServerData = false; }, 800);
        }
    }
    
    // NEW: Enhanced change detection for specific data types
    hasDataChanged(type, serverData, localData) {
        try {
            if (!localData && !serverData) return false;
            if (!localData || !serverData) return true;
            
            // For arrays, compare length and last update times
            if (Array.isArray(serverData) && Array.isArray(localData)) {
                if (serverData.length !== localData.length) return true;
                
                // Compare checksums of important fields
                const serverHash = this.generateArrayHash(serverData);
                const localHash = this.generateArrayHash(localData);
                return serverHash !== localHash;
            }
            
            // For objects, do deep comparison
            return JSON.stringify(serverData) !== JSON.stringify(localData);
        } catch (error) {
            console.warn(`Error comparing ${type} data:`, error);
            return true; // If we can't compare, assume it changed
        }
    }
    
    // NEW: Generate hash for array comparison
    generateArrayHash(arr) {
        return arr.map(item => ({
            id: item.id,
            lastUpdate: item.lastUpdate || item.timestamp,
            checksum: (item.name || '') + (item.status || '') + (item.fuelLevel || '')
        })).sort((a, b) => a.id?.localeCompare(b.id)).map(item => JSON.stringify(item)).join('|');
    }
    
    // NEW: Update connection health metrics
    updateConnectionHealth(success, responseTime) {
        if (success) {
            if (responseTime < 1000) {
                this.connectionHealth = 'excellent';
            } else if (responseTime < 3000) {
                this.connectionHealth = 'good';
            } else {
                this.connectionHealth = 'slow';
            }
        } else {
            this.connectionHealth = 'poor';
        }
        
        // Dispatch connection health event for UI updates
        document.dispatchEvent(new CustomEvent('connectionHealthChanged', {
            detail: { 
                health: this.connectionHealth, 
                responseTime,
                timestamp: Date.now()
            }
        }));
    }

    // Upload local data to server
    async syncToServer(data = null, updateType = 'partial') {
        if (!this.syncEnabled || !this.isOnline) {
            // Add to pending updates if offline
            if (data) {
                this.addToPendingUpdates(data, updateType);
            }
            return false;
        }
        
        // Prevent sync loops: don't sync to server while processing server data
        if (this.isProcessingServerData) {
            return false;
        }
        
        // CRITICAL: Prevent concurrent sync operations using a lock
        if (this.isSyncingToServer) {
            // Store the latest data for when current sync completes
            this.pendingSyncData = { data, updateType };
            console.log('⏳ Sync already in progress, queuing this request');
            return false;
        }
        
        // Throttle: Skip if we synced recently
        const now = Date.now();
        if (now - this.lastSyncToServer < this.minSyncInterval) {
            // Debounce: Schedule for later instead of skipping entirely
            if (!this.syncToServerDebounceTimer) {
                this.syncToServerDebounceTimer = setTimeout(() => {
                    this.syncToServerDebounceTimer = null;
                    // Only sync if not already syncing
                    if (!this.isSyncingToServer) {
                        this.syncToServer(data, updateType);
                    }
                }, this.minSyncInterval);
            }
            return false;
        }
        
        // Acquire lock and update timestamp BEFORE async operation
        this.isSyncingToServer = true;
        this.lastSyncToServer = now;

        try {
            // If no data provided, get all current data from dataManager
            let syncData = data;
            if (!syncData && typeof dataManager !== 'undefined') {
                console.log('📤 No data provided, syncing all current data...');
                syncData = {
                    users: dataManager.getUsers(),
                    vehicles: dataManager.getVehicles(),
                    bins: dataManager.getBins(),
                    routes: dataManager.getRoutes(),
                    collections: dataManager.getCollections(),
                    driverLocations: dataManager.getAllDriverLocations(),
                    complaints: dataManager.getComplaints(),
                    alerts: dataManager.getAlerts()
                };
                updateType = 'full';
            }
            
            // If still no data, skip sync
            if (!syncData) {
                console.log('⚠️ No data to sync, skipping...');
                return true;
            }
            
            console.log(`📤 Syncing to server (${updateType})...`);
            // Safe JSON serialization to prevent circular references
            let jsonBody;
            try {
                // Reset seen objects for this serialization
                this.seenObjects = new Set();
                
                jsonBody = JSON.stringify({
                    data: syncData,
                    updateType: updateType,
                    timestamp: new Date().toISOString()
                }, this.jsonReplacer.bind(this));
            } catch (jsonError) {
                console.error('❌ JSON serialization error:', jsonError);
                throw new Error(`Failed to serialize data: ${jsonError.message}`);
            }
            
            const response = await fetch(`${this.baseUrl}/api/data/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: jsonBody
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (result.success) {
                console.log('✅ Sync to server completed');
                this.retryCount = 0;
                return true;
            } else {
                throw new Error(result.error || 'Upload failed');
            }
        } catch (error) {
            console.error('❌ Sync to server failed:', error.message);
            this.addToPendingUpdates(data, updateType);
            this.handleSyncError();
            return false;
        } finally {
            // Release the lock
            this.isSyncingToServer = false;
            
            // Process any pending sync data that was queued during this sync
            if (this.pendingSyncData) {
                const pending = this.pendingSyncData;
                this.pendingSyncData = null;
                // Use a small delay to prevent tight loops
                setTimeout(() => {
                    this.syncToServer(pending.data, pending.updateType);
                }, 100);
            }
        }
    }

    // Specific sync functions for real-time data

    async syncDriverLocation(driverId, location) {
        if (!this.syncEnabled || !this.isOnline) {
            console.log('📱 Saving location locally (offline)');
            return false;
        }

        try {
            const response = await fetch(`${this.baseUrl}/api/driver/${driverId}/location`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(location)
            });

            const result = await response.json();
            
            if (result.success) {
                console.log(`📍 Location synced for driver ${driverId}`);
                return true;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('❌ Location sync failed:', error.message);
            return false;
        }
    }

    async syncRoute(route) {
        if (!this.syncEnabled || !this.isOnline) {
            console.log('📱 Saving route locally (offline)');
            return false;
        }

        try {
            const response = await fetch(`${this.baseUrl}/api/routes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(route)
            });

            const result = await response.json();
            
            if (result.success) {
                console.log(`🛣️ Route synced: ${route.id}`);
                return true;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('❌ Route sync failed:', error.message);
            return false;
        }
    }

    async syncCollection(collection) {
        if (!this.syncEnabled || !this.isOnline) {
            console.log('📱 Saving collection locally (offline)');
            return false;
        }

        try {
            const response = await fetch(`${this.baseUrl}/api/collections`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(collection)
            });

            const result = await response.json();
            if (result.success) {
                console.log(`🗑️ Collection synced: ${collection.binId}`);
                return true;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('❌ Collection sync failed:', error.message);
            return false;
        }
    }

    async getDriverRoutes(driverId) {
        // Active routes only (exclude completed) – used when offline or as fallback
        const localActiveRoutes = dataManager.getDriverRoutes(driverId);
        // All driver routes including completed – needed to detect recently completed for protection
        const allDriverRoutesLocal = (dataManager.getRoutes() || []).filter(r => r.driverId === driverId);

        if (!this.syncEnabled || !this.isOnline) {
            return localActiveRoutes;
        }

        try {
            const response = await fetch(`${this.baseUrl}/api/driver/${driverId}/routes`);
            const result = await response.json();

            if (result.success) {
                console.log(`📋 Routes retrieved for driver ${driverId}: ${result.routes.length} from server`);

                // Merge server routes with local protection for recently completed routes
                const serverRoutes = result.routes;
                const protectedRoutes = serverRoutes.map(serverRoute => {
                    // Use full driver list (including completed) so we can find the route we just completed
                    const localRoute = allDriverRoutesLocal.find(r => r.id === serverRoute.id);

                    if (localRoute && localRoute.status === 'completed' && serverRoute.status !== 'completed') {
                        const recent = window._recentlyCompletedRoutes?.[serverRoute.id];
                        const recentTs = recent && (recent.timestamp != null ? recent.timestamp : recent);
                        if (recentTs && (Date.now() - recentTs < 60000)) {
                            console.log(`🛡️ Protecting route ${serverRoute.id} - using local 'completed' status instead of server '${serverRoute.status}'`);
                            return { ...serverRoute, status: 'completed', completedAt: localRoute.completedAt, completedBy: localRoute.completedBy };
                        }
                    }

                    return serverRoute;
                });

                // Return only active routes so completed routes are not shown in "Active assigned routes"
                const activeOnly = protectedRoutes.filter(r => r.status !== 'completed' && r.status !== 'cancelled');
                console.log(`📋 Returning ${activeOnly.length} routes (with local protection)`);
                return activeOnly;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('❌ Failed to get routes from server, using local data');
            return localActiveRoutes;
        }
    }

    // Pending updates management for offline operations
    addToPendingUpdates(data, updateType) {
        this.pendingUpdates.push({
            data: data,
            updateType: updateType,
            timestamp: new Date().toISOString()
        });
        
        console.log(`📋 Added to pending updates (${this.pendingUpdates.length} pending)`);
    }

    async processPendingUpdates() {
        if (this.pendingUpdates.length === 0) return;

        console.log(`🔄 Processing ${this.pendingUpdates.length} pending updates...`);
        
        const updates = [...this.pendingUpdates];
        this.pendingUpdates = [];

        for (const update of updates) {
            const success = await this.syncToServer(update.data, update.updateType);
            if (!success) {
                // Re-add failed updates
                this.pendingUpdates.push(update);
            }
        }

        if (this.pendingUpdates.length > 0) {
            console.log(`⚠️ ${this.pendingUpdates.length} updates still pending`);
        } else {
            console.log('✅ All pending updates processed');
        }
    }

    handleSyncError() {
        this.retryCount++;
        
        if (this.retryCount >= this.maxRetries) {
            console.log('❌ Max sync retries reached, will retry later');
            this.retryCount = 0;
            
            // Show user notification
            if (window.app) {
                window.app.showAlert(
                    'Sync Warning', 
                    'Unable to sync with server. Operating in offline mode.', 
                    'warning'
                );
            }
        }
    }

    triggerUIUpdates() {
        // Refresh driver routes if driver is logged in
        if (authManager && authManager.isDriver() && window.app) {
            window.app.loadDriverRoutes();
        }

        // Update map if available
        if (typeof mapManager !== 'undefined') {
            mapManager.loadDriversOnMap();
        }

        // Update analytics
        if (typeof analyticsManager !== 'undefined') {
            analyticsManager.updateDashboardMetrics();
        }
    }

    // Full sync for initialization
    async performFullSync() {
        if (!this.syncEnabled) return false;

        console.log('🔄 Performing full sync...');
        
        // First sync from server
        const serverSyncSuccess = await this.syncFromServer();
        
        // Then upload any local changes
        const localData = {
            users: dataManager.getUsers(),
            bins: dataManager.getBins(),
            routes: dataManager.getRoutes(),
            collections: dataManager.getCollections(),
            complaints: dataManager.getComplaints(),
            alerts: dataManager.getAlerts(),
            driverLocations: dataManager.getAllDriverLocations(),
            analytics: dataManager.getAnalytics(),
            binHistory: dataManager.getAllBinHistory(),
            driverHistory: dataManager.getAllDriverHistory()
        };
        
        const uploadSuccess = await this.syncToServer(localData, 'full');
        
        return serverSyncSuccess && uploadSuccess;
    }

    // Get sync status for UI
    getSyncStatus() {
        return {
            enabled: this.syncEnabled,
            online: this.isOnline,
            lastSync: this.lastSyncTime,
            pendingUpdates: this.pendingUpdates.length,
            retryCount: this.retryCount
        };
    }

    // Enable/disable sync
    setEnabled(enabled) {
        this.syncEnabled = enabled;
        
        if (enabled && this.isOnline) {
            this.startPeriodicSync();
            this.syncFromServer();
        } else {
            this.stopPeriodicSync();
        }
        
        console.log(`🔄 Sync ${enabled ? 'enabled' : 'disabled'}`);
    }

    // Cleanup
    // JSON replacer to handle circular references and functions
    jsonReplacer(key, value) {
        // Initialize seenObjects set if not exists
        if (!this.seenObjects) {
            this.seenObjects = new Set();
        }
        
        // Skip functions
        if (typeof value === 'function') {
            return undefined;
        }
        
        // Skip circular references
        if (typeof value === 'object' && value !== null) {
            if (this.seenObjects.has(value)) {
                return '[Circular]';
            }
            this.seenObjects.add(value);
        }
        
        return value;
    }

    destroy() {
        this.stopPeriodicSync();
        this.syncEnabled = false;
        console.log('🗑️ Sync Manager destroyed');
    }
}

// Create global instance
window.syncManager = new SyncManager();

// Integrate with existing data manager
if (typeof dataManager !== 'undefined') {
    // Override methods to include sync
    const originalUpdateDriverLocation = dataManager.updateDriverLocation;
    dataManager.updateDriverLocation = function(driverId, latitude, longitude, additionalData = {}) {
        const result = originalUpdateDriverLocation.call(this, driverId, latitude, longitude, additionalData);
        
        // CRITICAL FIX: Do NOT auto-sync driver location to server
        // Reason: map-manager.js already sends GPS updates directly (line 776-789)
        // Reason: websocket-manager.js receives updates from server (don't echo back)
        // Reason: Multiple redundant POSTs were causing resource exhaustion
        // 
        // Only map-manager should send GPS to server (it has proper throttling)
        // All other systems should only update local dataManager
        
        return result;
    };

    const originalAddRoute = dataManager.addRoute;
    dataManager.addRoute = function(route) {
        const result = originalAddRoute.call(this, route);
        
        // Sync to server
        if (window.syncManager) {
            window.syncManager.syncRoute(result);
        }
        
        return result;
    };

    const originalAddCollection = dataManager.addCollection;
    dataManager.addCollection = function(collection) {
        const result = originalAddCollection.call(this, collection);
        
        // Sync to server
        if (window.syncManager) {
            window.syncManager.syncCollection(result);
        }
        
        return result;
    };
}

console.log('🔄 Sync Manager loaded successfully');
