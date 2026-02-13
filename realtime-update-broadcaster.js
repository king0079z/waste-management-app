/**
 * Real-Time Update Broadcaster
 * Ensures all data changes are immediately synchronized across entire application
 * - Updates map instantly
 * - Updates all tables/lists
 * - Broadcasts to all open tabs
 * - Syncs to server
 * - Updates sensor platform
 */

console.log('📡 Real-Time Update Broadcaster Loading...');

class RealtimeUpdateBroadcaster {
    constructor() {
        this.updateQueue = [];
        this.isProcessing = false;
        this.lastUpdate = {};
        this.debounceTimers = {};
        
        this.init();
    }
    
    init() {
        console.log('🔧 Initializing Real-Time Update Broadcaster...');
        
        // Intercept dataManager updates
        this.interceptDataManagerUpdates();
        
        // Listen for custom events
        this.setupEventListeners();
        
        // Setup WebSocket listeners for server broadcasts
        this.setupWebSocketListeners();
        
        // Setup storage listeners for cross-tab communication
        this.setupStorageListeners();
        
        console.log('✅ Real-Time Update Broadcaster initialized');
    }
    
    /**
     * Intercept all dataManager.updateBin() calls
     */
    interceptDataManagerUpdates() {
        if (typeof dataManager === 'undefined') {
            console.warn('⚠️ dataManager not available yet');
            setTimeout(() => this.interceptDataManagerUpdates(), 500);
            return;
        }
        
        // Wrap updateBin (supports both updateBin(binId, updates) and updateBin(binObject))
        const originalUpdateBin = dataManager.updateBin.bind(dataManager);
        dataManager.updateBin = (binIdOrBin, updates) => {
            const binId = (typeof binIdOrBin === 'object' && binIdOrBin && binIdOrBin.id) ? binIdOrBin.id : binIdOrBin;
            console.log(`📡 Bin update intercepted: ${binId}`, updates);
            
            const result = originalUpdateBin(binIdOrBin, updates);
            this.broadcastBinUpdate(binId, updates);
            return result;
        };
        
        // Wrap deleteBin (pass through deletedBy for system log)
        const originalDeleteBin = dataManager.deleteBin.bind(dataManager);
        dataManager.deleteBin = (binId, deletedBy) => {
            console.log(`📡 Bin deletion intercepted: ${binId}`);
            
            // Call original (records in system log when deletedBy provided)
            const result = originalDeleteBin(binId, deletedBy);
            
            // Broadcast deletion
            this.broadcastBinDeletion(binId);
            
            return result;
        };
        
        // Wrap setData
        const originalSetData = dataManager.setData.bind(dataManager);
        dataManager.setData = (key, value) => {
            console.log(`📡 Data change intercepted: ${key}`);
            
            // Call original
            const result = originalSetData(key, value);
            
            // Broadcast change
            this.broadcastDataChange(key, value);
            
            return result;
        };
        
        console.log('✅ DataManager updates intercepted');
    }
    
    /**
     * Broadcast bin update across entire application
     */
    async broadcastBinUpdate(binId, updates) {
        const id = (typeof binId === 'object' && binId && binId.id) ? binId.id : String(binId);
        console.log(`📡 Broadcasting bin update: ${id}`, updates);
        
        const bin = dataManager.getBins().find(b => b.id === id);
        if (!bin) {
            console.warn(`⚠️ Bin ${id} not found`);
            return;
        }
        
        // 1. Update map immediately
        this.updateMapMarker(id, bin);
        
        // 2. Update all tables/lists
        this.updateAllTables();
        
        // 3. Broadcast via CustomEvent
        window.dispatchEvent(new CustomEvent('binUpdated', {
            detail: { binId: id, updates, bin }
        }));
        
        // 4. Broadcast via localStorage (cross-tab)
        localStorage.setItem('lastBinUpdate', JSON.stringify({
            binId: id,
            updates,
            timestamp: Date.now()
        }));
        
        // 5. Sync to server
        await this.syncToServer();
        
        // 6. Update sensor platform if sensor-related (guard: updates may be undefined when updateBin(bin) is called)
        if (updates && (updates.sensorId || updates.sensorIMEI || updates.fillLevel !== undefined)) {
            this.updateSensorPlatform(id, updates);
        }
        
        console.log(`✅ Bin update broadcast complete: ${id}`);
    }
    
    /**
     * Broadcast bin deletion across entire application
     */
    async broadcastBinDeletion(binId) {
        console.log(`📡 Broadcasting bin deletion: ${binId}`);
        
        // 0. Add to deletedBins blacklist (local + MongoDB via server)
        try {
            const deletedBins = JSON.parse(localStorage.getItem('deletedBins') || '[]');
            if (!deletedBins.includes(binId)) {
                deletedBins.push(binId);
                localStorage.setItem('deletedBins', JSON.stringify(deletedBins));
            }
            const baseUrl = (typeof syncManager !== 'undefined' && syncManager.baseUrl) ? syncManager.baseUrl.replace(/\/$/, '') : '';
            if (baseUrl) {
                fetch(`${baseUrl}/api/bins/deleted`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ add: binId })
                }).catch(() => {});
            }
        } catch (e) { /* ignore */ }
        
        // 1. Remove from map immediately
        this.removeMapMarker(binId);
        
        // 2. Update all tables/lists
        this.updateAllTables();
        
        // 3. Broadcast via CustomEvent
        window.dispatchEvent(new CustomEvent('binDeleted', {
            detail: { binId }
        }));
        
        // 4. Broadcast via localStorage (cross-tab)
        localStorage.setItem('lastBinDeleted', JSON.stringify({
            binId,
            timestamp: Date.now()
        }));
        
        // 5. Sync to server
        await this.syncToServer();
        
        console.log(`✅ Bin deletion broadcast complete: ${binId}`);
    }
    
    /**
     * Broadcast data change across entire application
     */
    async broadcastDataChange(key, value) {
        console.log(`📡 Broadcasting data change: ${key}`);
        
        // Debounce to avoid flooding
        if (this.debounceTimers[key]) {
            clearTimeout(this.debounceTimers[key]);
        }
        
        this.debounceTimers[key] = setTimeout(async () => {
            // 1. Update UI components
            if (key === 'bins') {
                this.updateAllTables();
                this.refreshMap();
            } else if (key === 'sensors') {
                this.updateAllTables();
            } else if (key === 'collections') {
                this.updateCollectionsUI();
            }
            
            // 2. Broadcast via CustomEvent
            window.dispatchEvent(new CustomEvent('dataChanged', {
                detail: { key, value }
            }));
            
            // 3. Sync to server
            await this.syncToServer();
            
            console.log(`✅ Data change broadcast complete: ${key}`);
        }, 100);
    }
    
    /**
     * Update map marker in real-time
     */
    updateMapMarker(binId, bin) {
        console.log(`🗺️ Updating map marker: ${binId}`);
        
        // Try multiple map update methods
        try {
            // Method 1: mapManager (if available)
            if (typeof mapManager !== 'undefined' && mapManager.updateBinMarker) {
                mapManager.updateBinMarker(binId, bin);
                console.log('  ✓ Updated via mapManager');
                return;
            }
            
            // Method 2: Direct Leaflet access
            if (typeof L !== 'undefined' && window.binMarkers) {
                const marker = window.binMarkers[binId];
                if (marker) {
                    // Update marker icon
                    const fillLevel = bin.fillLevel || bin.fill || 0;
                    const color = this.getBinColor(fillLevel);
                    marker.setIcon(this.createBinIcon(color, fillLevel));
                    
                    // Update popup
                    marker.bindPopup(this.createBinPopup(bin));
                    
                    console.log('  ✓ Updated via Leaflet');
                    return;
                }
            }
            
            // Method 3: Trigger map refresh event
            window.dispatchEvent(new CustomEvent('refreshMap', {
                detail: { binId, bin }
            }));
            console.log('  ✓ Triggered map refresh event');
            
        } catch (error) {
            console.warn('⚠️ Could not update map marker:', error.message);
        }
    }
    
    /**
     * Remove map marker in real-time
     */
    removeMapMarker(binId) {
        console.log(`🗺️ Removing map marker: ${binId}`);
        
        try {
            // Try multiple methods
            if (typeof mapManager !== 'undefined' && mapManager.removeBinMarker) {
                mapManager.removeBinMarker(binId);
            } else if (typeof L !== 'undefined' && window.binMarkers && window.binMarkers[binId]) {
                window.binMarkers[binId].remove();
                delete window.binMarkers[binId];
            }
            
            console.log('  ✓ Marker removed');
        } catch (error) {
            console.warn('⚠️ Could not remove map marker:', error.message);
        }
    }
    
    /**
     * Refresh entire map
     */
    refreshMap() {
        console.log('🗺️ Refreshing entire map...');
        
        try {
            if (typeof mapManager !== 'undefined' && mapManager.loadBinsOnMap) {
                mapManager.loadBinsOnMap();
            } else if (typeof window.forceRefreshBinsOnMap === 'function') {
                window.forceRefreshBinsOnMap();
            } else {
                window.dispatchEvent(new CustomEvent('refreshMap'));
            }
            console.log('  ✓ Map refresh triggered');
        } catch (error) {
            console.warn('⚠️ Could not refresh map:', error.message);
        }
    }
    
    /**
     * Update all tables and lists in real-time
     */
    updateAllTables() {
        console.log('📊 Updating all tables...');
        
        // Update bins table (if on sensor management page)
        if (typeof refreshBinsList === 'function') {
            refreshBinsList();
            console.log('  ✓ Bins table refreshed');
        }
        
        // Update sensor table
        if (typeof sensorManagementAdmin !== 'undefined' && 
            typeof sensorManagementAdmin.refreshSensorTable === 'function') {
            sensorManagementAdmin.refreshSensorTable();
            console.log('  ✓ Sensor table refreshed');
        }
        
        // Update dashboard stats
        if (typeof window.updateDashboardStats === 'function') {
            window.updateDashboardStats();
            console.log('  ✓ Dashboard stats refreshed');
        }
        
        // Broadcast table update event
        window.dispatchEvent(new CustomEvent('tablesUpdated'));
    }
    
    /**
     * Update collections UI
     */
    updateCollectionsUI() {
        console.log('📦 Updating collections UI...');
        
        if (typeof window.refreshCollections === 'function') {
            window.refreshCollections();
        }
        
        window.dispatchEvent(new CustomEvent('collectionsUpdated'));
    }
    
    /**
     * Sync to server
     */
    async syncToServer() {
        if (typeof syncManager === 'undefined' || !syncManager.syncToServer) {
            return;
        }
        
        try {
            await syncManager.syncToServer();
            console.log('  ✓ Synced to server');
        } catch (error) {
            console.warn('  ⚠️ Server sync failed:', error.message);
        }
    }
    
    /**
     * Update sensor platform (Findy)
     */
    async updateSensorPlatform(binId, updates) {
        console.log(`📡 Updating sensor platform for bin ${binId}...`);
        
        const bin = dataManager.getBins().find(b => b.id === binId);
        if (!bin || !bin.sensorId) {
            return;
        }
        
        try {
            // Update sensor data via Findy integration
            if (typeof findyBinSensorIntegration !== 'undefined' && 
                findyBinSensorIntegration.refreshSensorData) {
                await findyBinSensorIntegration.refreshSensorData(binId);
                console.log('  ✓ Sensor platform updated');
            }
        } catch (error) {
            console.warn('  ⚠️ Sensor platform update failed:', error.message);
        }
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for manual update triggers
        window.addEventListener('triggerUpdate', (event) => {
            const { type, data } = event.detail;
            console.log(`📡 Manual update triggered: ${type}`);
            
            if (type === 'bin') {
                this.broadcastBinUpdate(data.binId, data.updates);
            } else if (type === 'sensor') {
                this.updateAllTables();
                this.syncToServer();
            }
        });
        
        // Immediate live update when a collection is recorded (assigned or ad-hoc)
        document.addEventListener('collectionRecorded', (event) => {
            const { collection, adHoc } = event.detail || {};
            console.log(`📦 Collection recorded (live update)${adHoc ? ' [ad-hoc]' : ''}:`, collection?.binId);
            this.updateCollectionsUI();
            if (collection && collection.binId) {
                const bin = typeof dataManager !== 'undefined' && dataManager.getBinById ? dataManager.getBinById(collection.binId) : null;
                if (bin) this.updateMapMarker(collection.binId, bin);
                else this.refreshMap();
            }
            this.updateAllTables();
        });
        
        // Also listen on window for collectionRecorded (dispatched by data-manager)
        window.addEventListener('collectionRecorded', (event) => {
            const { collection, adHoc } = event.detail || {};
            if (!collection) return;
            console.log(`📦 Collection recorded (window, live update)${adHoc ? ' [ad-hoc]' : ''}:`, collection.binId);
            this.updateCollectionsUI();
            this.updateAllTables();
        });
        
        console.log('✅ Event listeners setup');
    }
    
    /**
     * Setup WebSocket listeners for server broadcasts
     */
    setupWebSocketListeners() {
        // Wait for WebSocket to be ready
        setTimeout(() => {
            if (typeof window.ws !== 'undefined' && window.ws.readyState === WebSocket.OPEN) {
                window.ws.addEventListener('message', (event) => {
                    try {
                        const message = JSON.parse(event.data);
                        
                        if (message.type === 'binUpdate') {
                            console.log('📡 Received bin update from server:', message.binId);
                            this.handleServerBinUpdate(message);
                        } else if (message.type === 'dataUpdate') {
                            console.log('📡 Received data update from server:', message.key);
                            this.handleServerDataUpdate(message);
                        }
                    } catch (error) {
                        // Ignore non-JSON messages
                    }
                });
                console.log('✅ WebSocket listeners setup');
            }
        }, 1000);
    }
    
    /**
     * Handle bin update from server
     */
    handleServerBinUpdate(message) {
        const { binId, updates } = message;
        
        // Update local data
        dataManager.updateBin(binId, updates);
        
        // Update UI (without re-syncing to server)
        this.updateMapMarker(binId, dataManager.getBins().find(b => b.id === binId));
        this.updateAllTables();
    }
    
    /**
     * Handle data update from server
     * Server sends: { type: 'dataUpdate', data: { bins: [...], ... } }
     * Applying server data ensures deleted bins stay deleted across tabs.
     */
    handleServerDataUpdate(message) {
        let binsUpdated = false;
        // Server format: message.data is an object (e.g. { bins: [...] })
        if (message.data && typeof message.data === 'object') {
            Object.keys(message.data).forEach(key => {
                if (message.data[key] !== undefined) {
                    dataManager.setData(key, message.data[key]);
                    if (key === 'bins') binsUpdated = true;
                }
            });
        }
        // Legacy format: message.key and message.value
        if (message.key !== undefined && message.value !== undefined) {
            dataManager.setData(message.key, message.value);
            if (message.key === 'bins') binsUpdated = true;
        }
        if (binsUpdated) {
            this.refreshMap();
            this.updateAllTables();
        }
    }
    
    /**
     * Setup storage listeners for cross-tab communication
     */
    setupStorageListeners() {
        window.addEventListener('storage', (event) => {
            if (event.key === 'lastBinUpdate') {
                const update = JSON.parse(event.newValue);
                console.log(`📡 Bin update from another tab: ${update.binId}`);
                
                // Update this tab
                const bin = dataManager.getBins().find(b => b.id === update.binId);
                if (bin) {
                    this.updateMapMarker(update.binId, bin);
                    this.updateAllTables();
                }
            } else if (event.key === 'lastBinDeleted') {
                const deletion = JSON.parse(event.newValue);
                console.log(`📡 Bin deletion from another tab: ${deletion.binId}`);
                
                // Update this tab
                this.removeMapMarker(deletion.binId);
                this.updateAllTables();
            }
        });
        
        console.log('✅ Storage listeners setup');
    }
    
    /**
     * Helper: Get bin color based on fill level
     */
    getBinColor(fillLevel) {
        if (fillLevel >= 80) return '#ef4444'; // Red
        if (fillLevel >= 60) return '#f59e0b'; // Orange
        if (fillLevel >= 40) return '#eab308'; // Yellow
        return '#10b981'; // Green
    }
    
    /**
     * Helper: Create bin icon
     */
    createBinIcon(color, fillLevel) {
        if (typeof L === 'undefined') return null;
        
        return L.divIcon({
            className: 'custom-bin-icon',
            html: `
                <div style="
                    background-color: ${color};
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    border: 3px solid white;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                    font-size: 11px;
                ">
                    ${fillLevel}%
                </div>
            `,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });
    }
    
    /**
     * Helper: Create bin popup
     */
    createBinPopup(bin) {
        const fillPct = Math.round((bin.fillLevel || bin.fill || 0) * 10) / 10; // 1 decimal (no long decimals)
        const distanceCm = (bin.sensorData && bin.sensorData.distanceCm != null) ? Math.round(Number(bin.sensorData.distanceCm)) : null;
        return `
            <div style="min-width: 200px;">
                <h3 style="margin: 0 0 10px 0; color: #667eea;">${bin.id}</h3>
                <p style="margin: 5px 0;"><strong>Location:</strong> ${bin.location?.address || 'No location'}</p>
                <p style="margin: 5px 0;"><strong>Fill Level:</strong> ${fillPct}%${distanceCm !== null ? ' <span style="background: rgba(102,126,234,0.2); padding: 0.15rem 0.4rem; border-radius: 6px; font-size: 0.8rem;">📏 ' + distanceCm + ' cm</span>' : ''}</p>
                <p style="margin: 5px 0;"><strong>Type:</strong> ${bin.type || 'general'}</p>
                <p style="margin: 5px 0;"><strong>Capacity:</strong> ${bin.capacity || 100}L</p>
                ${bin.sensorId ? `<p style="margin: 5px 0;"><strong>Sensor:</strong> ${bin.sensorId}</p>` : ''}
            </div>
        `;
    }
    
    /**
     * Force immediate update of everything
     */
    forceUpdateAll() {
        console.log('🔄 Force updating entire application...');
        
        this.refreshMap();
        this.updateAllTables();
        this.updateCollectionsUI();
        this.syncToServer();
        
        console.log('✅ Force update complete');
    }
}

// Initialize broadcaster
const realtimeUpdateBroadcaster = new RealtimeUpdateBroadcaster();

// Expose globally
window.realtimeUpdateBroadcaster = realtimeUpdateBroadcaster;

// Expose helper function
window.forceUpdateAll = () => realtimeUpdateBroadcaster.forceUpdateAll();

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ REAL-TIME UPDATE BROADCASTER READY');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');
console.log('🚀 Features:');
console.log('  ✓ Instant map updates');
console.log('  ✓ Instant table updates');
console.log('  ✓ Cross-tab synchronization');
console.log('  ✓ Server synchronization');
console.log('  ✓ Sensor platform updates');
console.log('');
console.log('💡 Manual update: forceUpdateAll()');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
