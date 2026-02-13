// ==============================================================================
// UPDATE COORDINATOR - Single Source of Truth for Driver Updates
// ==============================================================================
// Prevents duplicate updates, race conditions, and ensures consistent state
// across driver interface and main application
//
// Usage:
//   await window.updateCoordinator.updateDriver(driverId, { status: 'on-route' });
// ==============================================================================

class UpdateCoordinator {
    constructor() {
        this.pendingUpdates = new Map();
        this.updateHistory = [];
        this.maxHistorySize = 100;
        this.isProcessing = false;
        
        console.log('✅ Update Coordinator initialized');
    }
    
    /**
     * Single method for ALL driver updates
     * Prevents duplicates and ensures proper sequencing
     * 
     * @param {string} driverId - Driver user ID
     * @param {object} updates - Update data (status, fuel, location, etc.)
     * @param {object} options - Options (syncToServer, broadcast, immediate)
     * @returns {Promise<object>} Update result
     */
    async updateDriver(driverId, updates, options = {}) {
        const updateId = `${driverId}_${Date.now()}`;
        const timestamp = new Date().toISOString();
        
        console.log(`🔄 [UpdateCoordinator] Coordinating update for driver ${driverId}:`, updates);
        
        // Check for duplicate update already in progress
        if (this.pendingUpdates.has(driverId)) {
            const existingUpdate = this.pendingUpdates.get(driverId);
            console.log(`⏭️ [UpdateCoordinator] Update already in progress for ${driverId}, merging...`);
            
            // Merge updates instead of duplicating
            Object.assign(existingUpdate.updates, updates);
            return existingUpdate.promise;
        }
        
        // Create update context
        const updateContext = {
            id: updateId,
            driverId,
            updates,
            options,
            timestamp,
            promise: null
        };
        
        // Create and store promise
        updateContext.promise = this._executeUpdate(updateContext);
        this.pendingUpdates.set(driverId, updateContext);
        
        try {
            const result = await updateContext.promise;
            
            // Add to history for debugging
            this._addToHistory({
                updateId,
                driverId,
                updates,
                timestamp,
                success: true,
                duration: Date.now() - new Date(timestamp).getTime()
            });
            
            return result;
        } catch (error) {
            console.error(`❌ [UpdateCoordinator] Update failed for ${driverId}:`, error);
            
            this._addToHistory({
                updateId,
                driverId,
                updates,
                timestamp,
                success: false,
                error: error.message
            });
            
            throw error;
        } finally {
            this.pendingUpdates.delete(driverId);
        }
    }
    
    /**
     * Execute update in proper sequence
     * Phase 1: Optimistic UI (immediate)
     * Phase 2: Local data (immediate)
     * Phase 3: Event dispatch (immediate)
     * Phase 4: Server sync (async)
     * Phase 5: WebSocket broadcast (async)
     */
    async _executeUpdate(context) {
        const { driverId, updates, options, timestamp } = context;
        
        // =============================================================================
        // PHASE 1: OPTIMISTIC UI UPDATE (Immediate - 0ms)
        // =============================================================================
        console.log('📱 [Phase 1] Optimistic UI update');
        this._updateUI(driverId, updates);
        
        // =============================================================================
        // PHASE 2: LOCAL DATA UPDATE (Immediate - ~1ms)
        // =============================================================================
        console.log('💾 [Phase 2] Local data update');
        
        if (window.dataManager) {
            // Add timestamp to updates
            const enrichedUpdates = {
                ...updates,
                lastStatusUpdate: timestamp
            };
            
            window.dataManager.updateUser(driverId, enrichedUpdates);
            
            // Update driver location if needed
            if (updates.lat && updates.lng) {
                window.dataManager.updateDriverLocation(
                    driverId, 
                    updates.lat, 
                    updates.lng,
                    {
                        status: updates.movementStatus || updates.status,
                        timestamp
                    }
                );
            }
        } else {
            console.warn('⚠️ dataManager not available');
        }
        
        // =============================================================================
        // PHASE 3: MAP UPDATE (Immediate - ~5ms)
        // =============================================================================
        console.log('🗺️ [Phase 3] Map update');
        
        if (updates.movementStatus && window.mapManager) {
            try {
                window.mapManager.updateDriverStatus(driverId, updates.movementStatus);
                
                // Also update driver data UI if available
                if (typeof window.mapManager.updateDriverDataUI === 'function') {
                    window.mapManager.updateDriverDataUI(driverId);
                }
            } catch (error) {
                console.warn('⚠️ Map update failed:', error);
                // Don't block update flow on map errors
            }
        }
        
        // =============================================================================
        // PHASE 4: EVENT DISPATCH (Immediate - ~1ms)
        // =============================================================================
        console.log('📢 [Phase 4] Event dispatch');
        
        const eventDetail = {
            driverId,
            ...updates,
            timestamp,
            source: 'update_coordinator'
        };
        
        // Dispatch generic driver update event
        document.dispatchEvent(new CustomEvent('driverDataUpdated', {
            detail: eventDetail,
            bubbles: true
        }));
        
        // Dispatch specific events based on update type
        if (updates.movementStatus === 'on-route') {
            document.dispatchEvent(new CustomEvent('routeStarted', {
                detail: eventDetail,
                bubbles: true
            }));
        } else if (updates.movementStatus === 'stationary' && updates.routeEndTime) {
            document.dispatchEvent(new CustomEvent('routeCompleted', {
                detail: eventDetail,
                bubbles: true
            }));
        }
        
        if (updates.fuelLevel !== undefined) {
            document.dispatchEvent(new CustomEvent('fuelLevelUpdated', {
                detail: eventDetail,
                bubbles: true
            }));
        }
        
        // =============================================================================
        // PHASE 5: SERVER SYNC (Async - background)
        // =============================================================================
        const syncPromises = [];
        
        if (options.syncToServer !== false) {
            console.log('☁️ [Phase 5] Server sync (async)');
            
            const serverSyncPromise = fetch(`/api/driver/${driverId}/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    driverData: updates,
                    timestamp
                })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Server returned ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('✅ Server sync successful:', data);
                return data;
            })
            .catch(error => {
                console.error('❌ Server sync failed:', error);
                // Don't throw - offline mode should work
                return { success: false, error: error.message };
            });
            
            syncPromises.push(serverSyncPromise);
        }
        
        // =============================================================================
        // PHASE 6: WEBSOCKET BROADCAST (Async - background)
        // =============================================================================
        if (options.broadcast !== false && window.websocketManager) {
            console.log('📡 [Phase 6] WebSocket broadcast (async)');
            
            const wsPromise = window.websocketManager.send({
                type: 'driver_update',
                driverId,
                driverData: updates,
                timestamp
            }).catch(error => {
                console.error('❌ WebSocket broadcast failed:', error);
                return { success: false, error: error.message };
            });
            
            syncPromises.push(wsPromise);
        }
        
        // Wait for background operations (non-blocking for UI)
        const syncResults = await Promise.allSettled(syncPromises);
        
        // Check results
        const serverSynced = syncResults[0]?.status === 'fulfilled';
        const broadcasted = syncResults[1]?.status === 'fulfilled';
        
        console.log(`✅ [UpdateCoordinator] Update complete for ${driverId}:`, {
            serverSynced,
            broadcasted,
            updates
        });
        
        return {
            success: true,
            driverId,
            updates,
            timestamp,
            serverSynced,
            broadcasted
        };
    }
    
    /**
     * Update UI elements immediately (optimistic update)
     */
    _updateUI(driverId, updates) {
        // Update status indicator
        if (updates.movementStatus || updates.status) {
            const statusText = updates.movementStatus || updates.status;
            const statusElements = document.querySelectorAll('.driver-status-indicator, #driverStatusIndicator');
            
            statusElements.forEach(element => {
                if (element) {
                    element.textContent = this._formatStatus(statusText);
                    element.style.color = this._getStatusColor(statusText);
                }
            });
        }
        
        // Update fuel display
        if (updates.fuelLevel !== undefined) {
            const fuelElements = document.querySelectorAll('.fuel-level-display, #fuelLevelDisplay');
            
            fuelElements.forEach(element => {
                if (element) {
                    element.textContent = `${updates.fuelLevel}%`;
                    element.style.color = this._getFuelColor(updates.fuelLevel);
                }
            });
        }
        
        // Update quick stats if on driver dashboard
        if (updates.collectionsToday !== undefined) {
            const collectionsElement = document.getElementById('collectionsToday');
            if (collectionsElement) {
                collectionsElement.textContent = updates.collectionsToday;
            }
        }
    }
    
    /**
     * Get color for status
     */
    _getStatusColor(status) {
        const colors = {
            'on-route': '#f59e0b',      // Amber
            'stationary': '#10b981',     // Green
            'on-break': '#8b5cf6',       // Purple
            'off-duty': '#ef4444',       // Red
            'active': '#10b981',         // Green
            'idle': '#6b7280'            // Gray
        };
        return colors[status] || '#6b7280';
    }
    
    /**
     * Get color for fuel level
     */
    _getFuelColor(fuelLevel) {
        if (fuelLevel >= 50) return '#10b981';  // Green
        if (fuelLevel >= 25) return '#f59e0b';  // Amber
        return '#ef4444';  // Red
    }
    
    /**
     * Format status text for display
     */
    _formatStatus(status) {
        const formatted = {
            'on-route': 'On Route',
            'stationary': 'Stationary',
            'on-break': 'On Break',
            'off-duty': 'Off Duty',
            'active': 'Active',
            'idle': 'Idle'
        };
        return formatted[status] || status.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    
    /**
     * Add update to history for debugging
     */
    _addToHistory(entry) {
        this.updateHistory.push(entry);
        
        // Limit history size
        if (this.updateHistory.length > this.maxHistorySize) {
            this.updateHistory.shift();
        }
    }
    
    /**
     * Get update history for debugging
     */
    getHistory(driverId = null) {
        if (driverId) {
            return this.updateHistory.filter(entry => entry.driverId === driverId);
        }
        return this.updateHistory;
    }
    
    /**
     * Check if update is pending for driver
     */
    isPending(driverId) {
        return this.pendingUpdates.has(driverId);
    }
    
    /**
     * Get statistics
     */
    getStats() {
        const totalUpdates = this.updateHistory.length;
        const successfulUpdates = this.updateHistory.filter(e => e.success).length;
        const failedUpdates = totalUpdates - successfulUpdates;
        const avgDuration = this.updateHistory.reduce((sum, e) => sum + (e.duration || 0), 0) / totalUpdates || 0;
        
        return {
            totalUpdates,
            successfulUpdates,
            failedUpdates,
            successRate: totalUpdates > 0 ? (successfulUpdates / totalUpdates * 100).toFixed(2) + '%' : '0%',
            averageDuration: avgDuration.toFixed(0) + 'ms',
            pendingUpdates: this.pendingUpdates.size
        };
    }
    
    /**
     * Clear history
     */
    clearHistory() {
        this.updateHistory = [];
        console.log('🗑️ Update history cleared');
    }
}

// =============================================================================
// CREATE GLOBAL INSTANCE
// =============================================================================
window.updateCoordinator = new UpdateCoordinator();

// =============================================================================
// EXPORT FOR MODULE SYSTEMS
// =============================================================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UpdateCoordinator;
}

console.log('✅ Update Coordinator loaded successfully');



