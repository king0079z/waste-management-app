// Enhanced Real-time Status Manager - Immediate Status Updates with Visual Indicators
// Fixes delayed status updates and adds visual map indicators

class EnhancedRealtimeStatusManager {
    constructor() {
        this.statusUpdateQueue = [];
        this.isProcessing = false;
        this.currentStatus = {};
        this.statusHistory = [];
        this.visualIndicators = {};
        
        // Status-to-emoji mapping for visual indicators
        this.statusEmojis = {
            'active': '🟢',
            'on-route': '🚛',
            'ai-route': '🤖',
            'stationary': '⏸️', 
            'collecting': '🗑️',
            'returning': '↩️',
            'maintenance': '🔧',
            'offline': '🔴',
            'available': '✅'
        };
        
        // Status colors for map markers
        this.statusColors = {
            'active': '#10b981',      // Green
            'on-route': '#f59e0b',    // Orange
            'ai-route': '#8b5cf6',    // Purple (AI)
            'stationary': '#6b7280',  // Gray
            'collecting': '#8b5cf6',  // Purple
            'returning': '#06b6d4',   // Cyan
            'maintenance': '#ef4444', // Red
            'offline': '#374151',     // Dark gray
            'available': '#10b981'    // Green
        };
        
        this.init();
    }
    
    init() {
        console.log('🚀 Enhanced Realtime Status Manager initializing...');
        
        // Wait for required systems
        this.waitForSystems().then(() => {
            this.setupStatusListeners();
            this.enhanceMapMarkers();
            this.startStatusMonitoring();
            console.log('✅ Enhanced Realtime Status Manager ready');
        });
    }
    
    async waitForSystems() {
        let attempts = 0;
        const maxAttempts = 100;
        
        while (attempts < maxAttempts) {
            if (window.dataManager && window.mapManager && window.wsManager) {
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        console.warn('⚠️ Some systems not ready, proceeding anyway');
    }
    
    setupStatusListeners() {
        console.log('🎯 Setting up enhanced status listeners...');
        
        // Listen for WebSocket status updates
        if (window.wsManager && typeof window.wsManager.on === 'function') {
            window.wsManager.on('driver_update', (data) => {
                console.log('📡 Received driver update via WebSocket:', data);
                this.handleIncomingStatusUpdate(data);
            });
        } else if (window.websocketManager) {
            // Fallback to websocketManager if wsManager doesn't have .on() method
            console.log('⚠️ Using websocketManager fallback for status updates');
        }
        
        // Listen for local status changes
        document.addEventListener('driverStatusChange', (event) => {
            console.log('🔄 Local driver status change detected:', event.detail);
            this.handleLocalStatusChange(event.detail);
        });
    }
    
    // ENHANCED: Immediate status update with visual feedback
    async updateDriverStatus(driverId, status, movementStatus, extraData = {}) {
        console.log(`🚛 IMMEDIATE Status Update: Driver ${driverId} -> Status: ${status}, Movement: ${movementStatus}`);
        
        const statusUpdate = {
            driverId,
            status,
            movementStatus,
            timestamp: new Date().toISOString(),
            id: `status_${Date.now()}`,
            ...extraData
        };
        
        // 1. IMMEDIATE local update (no waiting)
        this.applyStatusUpdateLocally(statusUpdate);
        
        // 2. Update visual indicators immediately
        this.updateMapMarkerStatus(driverId, movementStatus || status);
        
        // 3. Broadcast to all clients immediately via WebSocket
        this.broadcastStatusUpdate(statusUpdate);
        
        // 4. Save to server (async, doesn't block UI)
        this.saveStatusToServer(statusUpdate);
        
        // 5. Update driver in dataManager
        if (window.dataManager) {
            const driver = window.dataManager.getUserById(driverId);
            if (driver) {
                Object.assign(driver, {
                    status,
                    movementStatus,
                    lastStatusUpdate: statusUpdate.timestamp,
                    ...extraData
                });
                
                // Trigger local data update event
                window.dataManager.triggerDataUpdate('driver_status', {
                    driverId,
                    driver,
                    changes: { status, movementStatus, ...extraData }
                });
            }
        }
        
        console.log(`✅ Driver ${driverId} status updated immediately across all components`);
        return statusUpdate;
    }
    
    applyStatusUpdateLocally(statusUpdate) {
        const { driverId, status, movementStatus } = statusUpdate;
        
        // Store current status
        this.currentStatus[driverId] = {
            status,
            movementStatus,
            lastUpdate: statusUpdate.timestamp
        };
        
        // Add to history
        this.statusHistory.push(statusUpdate);
        
        // Keep history manageable (last 100 updates)
        if (this.statusHistory.length > 100) {
            this.statusHistory = this.statusHistory.slice(-100);
        }
        
        // Update UI elements immediately
        this.updateDriverStatusDisplays(driverId, status, movementStatus);
    }
    
    updateDriverStatusDisplays(driverId, status, movementStatus) {
        // Update driver details modal if open
        const modal = document.querySelector(`.driver-modal[data-driver-id="${driverId}"]`);
        if (modal) {
            const statusElement = modal.querySelector('.driver-status');
            const movementElement = modal.querySelector('.movement-status');
            
            if (statusElement) {
                statusElement.textContent = status || 'active';
                statusElement.className = `driver-status status-${status || 'active'}`;
            }
            
            if (movementElement) {
                const emoji = this.statusEmojis[movementStatus] || this.statusEmojis[status] || '🚛';
                movementElement.innerHTML = `${emoji} ${this.formatStatus(movementStatus || status)}`;
                movementElement.className = `movement-status status-${movementStatus || status}`;
            }
        }
        
        // Update live monitoring cards
        const liveCard = document.querySelector(`.driver-card[data-driver-id="${driverId}"]`);
        if (liveCard) {
            const statusBadge = liveCard.querySelector('.status-badge');
            if (statusBadge) {
                const emoji = this.statusEmojis[movementStatus] || this.statusEmojis[status] || '🟢';
                statusBadge.innerHTML = `${emoji} ${this.formatStatus(movementStatus || status)}`;
                statusBadge.className = `status-badge status-${movementStatus || status}`;
            }
        }
        
        // Update driver table rows
        const tableRow = document.querySelector(`tr[data-driver-id="${driverId}"]`);
        if (tableRow) {
            const statusCell = tableRow.querySelector('.driver-status-cell');
            if (statusCell) {
                const emoji = this.statusEmojis[movementStatus] || this.statusEmojis[status] || '🟢';
                statusCell.innerHTML = `${emoji} ${this.formatStatus(movementStatus || status)}`;
                statusCell.className = `driver-status-cell status-${movementStatus || status}`;
            }
        }
    }
    
    formatStatus(status) {
        const statusMap = {
            'on-route': 'On Route',
            'ai-route': 'AI Route Active',
            'stationary': 'Stationary', 
            'collecting': 'Collecting',
            'returning': 'Returning',
            'maintenance': 'Maintenance',
            'offline': 'Offline',
            'available': 'Available',
            'active': 'Active'
        };
        
        return statusMap[status] || status.charAt(0).toUpperCase() + status.slice(1);
    }
    
    // ENHANCED: Update map marker with visual status indicators
    updateMapMarkerStatus(driverId, status) {
        if (!window.mapManager || !window.mapManager.markers) return;
        
        const marker = window.mapManager.markers.drivers[driverId];
        if (!marker) {
            console.log(`No marker found for driver ${driverId}, will create when location updates`);
            return;
        }
        
        console.log(`🗺️ Updating map marker for driver ${driverId} with status: ${status}`);
        
        const emoji = this.statusEmojis[status] || '🚛';
        const color = this.statusColors[status] || '#3b82f6';
        const statusText = this.formatStatus(status);
        
        // Create enhanced marker HTML with status indicator
        const markerHTML = `
            <div style="position: relative; display: flex; align-items: center; justify-content: center;">
                <!-- Main marker circle -->
                <div style="
                    width: 32px; height: 32px; 
                    background: ${color}; 
                    border: 3px solid white; 
                    border-radius: 50%; 
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    display: flex; align-items: center; justify-content: center;
                    font-size: 16px; color: white; font-weight: bold;
                ">
                    🚛
                </div>
                <!-- Status indicator badge -->
                <div style="
                    position: absolute; 
                    top: -8px; right: -8px;
                    background: white; 
                    border: 2px solid ${color};
                    border-radius: 50%; 
                    width: 24px; height: 24px;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 14px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                    z-index: 1000;
                ">
                    ${emoji}
                </div>
                <!-- Status pulse animation for active states -->
                ${status === 'on-route' || status === 'collecting' ? `
                <div style="
                    position: absolute; 
                    width: 50px; height: 50px; 
                    border: 2px solid ${color}; 
                    border-radius: 50%; 
                    animation: statusPulse 1.5s infinite;
                    opacity: 0.6;
                "></div>
                ` : ''}
            </div>
        `;
        
        // Update marker icon
        const newIcon = L.divIcon({
            className: 'enhanced-driver-marker',
            html: markerHTML,
            iconSize: [40, 40],
            iconAnchor: [20, 20],
            popupAnchor: [0, -20]
        });
        
        marker.setIcon(newIcon);
        
        // Update popup content with status - use mapManager's createDriverPopup for consistent UI
        const driver = window.dataManager?.getUserById(driverId);
        if (driver && window.mapManager) {
            // Get location and other data needed for popup
            const location = window.dataManager?.getDriverLocation(driverId);
            const todayCollections = window.dataManager?.getTodayCollections?.()?.filter(c => c.driverId === driverId).length || 0;
            const isCurrentDriver = window.authManager?.getCurrentUser?.()?.id === driverId;
            
            // Use mapManager's createDriverPopup method for consistent UI
            if (location && typeof window.mapManager.createDriverPopup === 'function') {
                const popupContent = window.mapManager.createDriverPopup(
                    driver, 
                    location, 
                    todayCollections, 
                    isCurrentDriver, 
                    statusText
                );
                
                // Update popup content instead of rebinding
                if (marker.getPopup()) {
                    marker.setPopupContent(popupContent);
                } else {
                    marker.bindPopup(popupContent, {
                        maxWidth: 420,
                        className: 'vehicle-popup',
                        closeButton: true,
                        autoPan: true,
                        autoPanPadding: [50, 50],
                        autoClose: false,
                        closeOnClick: false,
                        keepInView: true
                    });
                }
            }
        }
        
        // Store visual indicator data
        this.visualIndicators[driverId] = {
            status,
            emoji,
            color,
            lastUpdate: new Date().toISOString()
        };
        
        console.log(`✅ Map marker updated for driver ${driverId} with ${emoji} ${statusText}`);
    }
    
    // ENHANCED: Immediate WebSocket broadcasting
    broadcastStatusUpdate(statusUpdate) {
        if (!window.wsManager) {
            console.warn('WebSocket manager not available for broadcasting');
            return;
        }
        
        const broadcastData = {
            type: 'driver_status_update',
            data: statusUpdate,
            timestamp: new Date().toISOString(),
            immediate: true
        };
        
        console.log('📡 Broadcasting status update immediately:', broadcastData);
        
        // Send via WebSocket if available
        if (window.wsManager.isConnected) {
            window.wsManager.send(broadcastData);
        } else {
            // Use fallback method
            if (window.wsManager.fallback) {
                window.wsManager.fallback.send(broadcastData);
            }
        }
        
        // Also dispatch local event for same-page updates
        document.dispatchEvent(new CustomEvent('driverStatusBroadcast', {
            detail: statusUpdate
        }));
    }
    
    // ENHANCED: Async server save that doesn't block UI
    async saveStatusToServer(statusUpdate) {
        try {
            const response = await fetch('/api/driver/' + statusUpdate.driverId + '/status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: statusUpdate.status,
                    movementStatus: statusUpdate.movementStatus,
                    timestamp: statusUpdate.timestamp
                })
            });
            
            if (response.ok) {
                console.log(`✅ Status saved to server for driver ${statusUpdate.driverId}`);
            } else {
                console.warn('Server save failed, status remains local only');
            }
        } catch (error) {
            console.warn('Error saving status to server:', error.message);
        }
    }
    
    handleIncomingStatusUpdate(data) {
        if (!data.driverId) return;
        
        console.log('📥 Handling incoming status update:', data);
        
        // Update local status tracking
        this.currentStatus[data.driverId] = {
            status: data.status || data.driverData?.status,
            movementStatus: data.movementStatus || data.driverData?.movementStatus,
            lastUpdate: data.timestamp
        };
        
        // Update visual indicators
        const status = data.movementStatus || data.status || data.driverData?.movementStatus || data.driverData?.status;
        if (status) {
            this.updateMapMarkerStatus(data.driverId, status);
            this.updateDriverStatusDisplays(data.driverId, data.status || data.driverData?.status, status);
        }
    }
    
    handleLocalStatusChange(detail) {
        const { driverId, status, movementStatus } = detail;
        this.updateDriverStatus(driverId, status, movementStatus, { source: 'local' });
    }
    
    enhanceMapMarkers() {
        if (!document.getElementById('statusPulseCSS')) {
            const style = document.createElement('style');
            style.id = 'statusPulseCSS';
            style.textContent = `
                @keyframes statusPulse {
                    0% { transform: scale(1); opacity: 0.6; }
                    50% { transform: scale(1.2); opacity: 0.3; }
                    100% { transform: scale(1); opacity: 0.6; }
                }
                
                .enhanced-driver-marker {
                    z-index: 1000 !important;
                }
                
                .status-active { color: #10b981; }
                .status-on-route { color: #f59e0b; }
                .status-stationary { color: #6b7280; }
                .status-collecting { color: #8b5cf6; }
                .status-returning { color: #06b6d4; }
                .status-maintenance { color: #ef4444; }
                .status-offline { color: #374151; }
                
                .driver-popup {
                    max-width: 200px;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    startStatusMonitoring() {
        // Monitor for status changes every second for immediate updates
        setInterval(() => {
            if (this.statusUpdateQueue.length > 0 && !this.isProcessing) {
                this.processStatusQueue();
            }
        }, 1000);
        
        console.log('🔄 Real-time status monitoring started');
    }
    
    processStatusQueue() {
        if (this.isProcessing || this.statusUpdateQueue.length === 0) return;
        
        this.isProcessing = true;
        const updates = [...this.statusUpdateQueue];
        this.statusUpdateQueue = [];
        
        updates.forEach(update => {
            this.applyStatusUpdateLocally(update);
        });
        
        this.isProcessing = false;
    }
    
    // API for external use
    getCurrentStatus(driverId) {
        return this.currentStatus[driverId] || null;
    }
    
    getStatusHistory(driverId = null) {
        if (driverId) {
            return this.statusHistory.filter(h => h.driverId === driverId);
        }
        return this.statusHistory;
    }
    
    getVisualIndicator(driverId) {
        return this.visualIndicators[driverId] || null;
    }
}

// Initialize enhanced status manager
window.enhancedStatusManager = new EnhancedRealtimeStatusManager();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedRealtimeStatusManager;
}

console.log('🚀 Enhanced Realtime Status Manager loaded and ready');
