// Enhanced Map Status Integration - Visual Status Indicators for Driver Markers
// Provides immediate visual feedback on map markers for driver status changes

class EnhancedMapStatusIntegration {
    constructor() {
        this.markerStatusCache = new Map();
        this.statusUpdateQueue = [];
        this.animationFrameId = null;
        this.mapReady = false;
        
        // Enhanced status configurations
        this.statusConfig = {
            'active': {
                emoji: '🟢',
                color: '#10b981',
                pulse: false,
                description: 'Active & Available'
            },
            'on-route': {
                emoji: '🚛',
                color: '#f59e0b',
                pulse: true,
                description: 'On Route'
            },
            'ai-route': {
                emoji: '🤖',
                color: '#8b5cf6',
                pulse: true,
                description: 'AI Route Active'
            },
            'collecting': {
                emoji: '🗑️',
                color: '#8b5cf6',
                pulse: true,
                description: 'Collecting Waste'
            },
            'returning': {
                emoji: '↩️',
                color: '#06b6d4',
                pulse: false,
                description: 'Returning to Base'
            },
            'stationary': {
                emoji: '⏸️',
                color: '#6b7280',
                pulse: false,
                description: 'Stationary'
            },
            'maintenance': {
                emoji: '🔧',
                color: '#ef4444',
                pulse: false,
                description: 'Under Maintenance'
            },
            'offline': {
                emoji: '🔴',
                color: '#374151',
                pulse: false,
                description: 'Offline'
            },
            'available': {
                emoji: '✅',
                color: '#10b981',
                pulse: false,
                description: 'Available'
            }
        };
        
        console.log('🗺️ Enhanced Map Status Integration initializing...');
        this.init();
    }
    
    async init() {
        await this.waitForMapManager();
        this.setupStatusListeners();
        this.enhanceExistingMarkers();
        this.injectStatusCSS();
        this.startAnimationLoop();
        
        console.log('✅ Enhanced Map Status Integration ready');
    }
    
    async waitForMapManager() {
        let attempts = 0;
        const maxAttempts = 100;
        
        while (attempts < maxAttempts) {
            if (window.mapManager && window.mapManager.map && window.mapManager.markers) {
                this.mapReady = true;
                console.log('🗺️ Map manager detected and ready');
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
            console.log('ℹ️ Map initialization deferred until container is visible');
    }
    
    setupStatusListeners() {
        console.log('🎯 Setting up map status listeners...');
        
        // Listen for driver status broadcasts
        document.addEventListener('driverStatusBroadcast', (event) => {
            this.handleStatusBroadcast(event.detail);
        });
        
        // Listen for WebSocket driver updates (with type checking)
        if (window.wsManager && typeof window.wsManager.on === 'function') {
            window.wsManager.on('driver_update', (data) => {
                this.handleDriverUpdate(data);
            });
            
            window.wsManager.on('driver_status_update', (data) => {
                this.handleStatusUpdate(data.data || data);
            });
        } else {
            // Fallback: listen to custom events instead
            document.addEventListener('driver_update', (event) => {
                if (event.detail) this.handleDriverUpdate(event.detail);
            });
            document.addEventListener('driver_status_update', (event) => {
                if (event.detail) this.handleStatusUpdate(event.detail.data || event.detail);
            });
        }
        
        // Override mapManager's addDriverMarker to include status enhancements
        if (window.mapManager && typeof window.mapManager.addDriverMarker === 'function') {
            this.enhanceMapManagerMethods();
        }
    }
    
    enhanceMapManagerMethods() {
        const originalAddDriverMarker = window.mapManager.addDriverMarker.bind(window.mapManager);
        
        window.mapManager.addDriverMarker = (driver, location) => {
            // Call original method first
            const result = originalAddDriverMarker(driver, location);
            
            // Then enhance with status indicators
            setTimeout(() => {
                this.enhanceDriverMarker(driver.id, driver);
            }, 100);
            
            return result;
        };
        
        console.log('✅ Enhanced mapManager.addDriverMarker method');
    }
    
    enhanceExistingMarkers() {
        if (!window.mapManager || !window.mapManager.markers || !window.mapManager.markers.drivers) {
            console.log('No existing markers to enhance');
            return;
        }
        
        console.log('🔧 Enhancing existing driver markers...');
        
        Object.keys(window.mapManager.markers.drivers).forEach(driverId => {
            const driver = window.dataManager?.getUserById(driverId);
            if (driver) {
                this.enhanceDriverMarker(driverId, driver);
            }
        });
    }
    
    enhanceDriverMarker(driverId, driver) {
        if (!this.mapReady || !window.mapManager || !window.mapManager.markers) {
            // Queue for later processing
            this.statusUpdateQueue.push({ driverId, driver, action: 'enhance' });
            return;
        }
        
        const marker = window.mapManager.markers.drivers[driverId];
        if (!marker) {
            console.log(`No marker found for driver ${driverId}, skipping enhancement`);
            return;
        }
        
        const status = driver.movementStatus || driver.status || 'active';
        const config = this.statusConfig[status] || this.statusConfig['active'];
        
        if (window.mapDebugMode) {
            console.log(`🎨 Enhancing marker for driver ${driverId} with status: ${status}`);
        }
        
        // Keep single driver marker style: only update popup/tooltip, do NOT replace icon
        // (Replacing icon here caused "two types" of driver markers and visual glitches.)
        this.updateMarkerPopup(marker, driver, status, config);
        
        this.markerStatusCache.set(driverId, {
            status,
            config,
            lastUpdate: Date.now()
        });
    }
    
    createEnhancedMarkerHTML(driver, status, config) {
        const pulseClass = config.pulse ? 'status-pulse' : '';
        
        return `
            <div class="enhanced-marker-container ${pulseClass}" data-status="${status}">
                <!-- Main marker circle -->
                <div class="marker-main" style="
                    width: 36px; height: 36px;
                    background: ${config.color};
                    border: 3px solid white;
                    border-radius: 50%;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.25);
                    display: flex; align-items: center; justify-content: center;
                    position: relative;
                    z-index: 2;
                ">
                    <span style="font-size: 18px; filter: drop-shadow(0 1px 1px rgba(0,0,0,0.3));">
                        🚛
                    </span>
                </div>
                
                <!-- Status indicator badge -->
                <div class="status-badge" style="
                    position: absolute;
                    top: -4px; right: -4px;
                    background: white;
                    border: 2px solid ${config.color};
                    border-radius: 50%;
                    width: 20px; height: 20px;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 12px;
                    box-shadow: 0 1px 4px rgba(0,0,0,0.2);
                    z-index: 3;
                ">
                    ${config.emoji}
                </div>
                
                <!-- Pulse animation ring for active status -->
                ${config.pulse ? `
                    <div class="pulse-ring" style="
                        position: absolute;
                        top: 50%; left: 50%;
                        transform: translate(-50%, -50%);
                        width: 50px; height: 50px;
                        border: 2px solid ${config.color};
                        border-radius: 50%;
                        opacity: 0.6;
                        z-index: 1;
                    "></div>
                ` : ''}
                
                <!-- Driver name label -->
                <div class="driver-label" style="
                    position: absolute;
                    top: 100%; left: 50%;
                    transform: translateX(-50%);
                    background: rgba(0,0,0,0.8);
                    color: white;
                    padding: 2px 6px;
                    border-radius: 10px;
                    font-size: 10px;
                    font-weight: 500;
                    white-space: nowrap;
                    margin-top: 2px;
                    pointer-events: none;
                ">
                    ${driver.name || `Driver ${driver.id}`}
                </div>
            </div>
        `;
    }
    
    updateMarkerPopup(marker, driver, status, config) {
        // Use mapManager's createDriverPopup for consistent UI
        if (window.mapManager && typeof window.mapManager.createDriverPopup === 'function') {
            const location = window.dataManager?.getDriverLocation?.(driver.id);
            const collections = window.dataManager?.getDriverCollections?.(driver.id) || [];
            const todayCollections = collections.filter(c => 
                new Date(c.timestamp).toDateString() === new Date().toDateString()
            ).length;
            const isCurrentDriver = window.authManager?.getCurrentUser?.()?.id === driver.id;
            
            if (location) {
                const popupContent = window.mapManager.createDriverPopup(
                    driver,
                    location,
                    todayCollections,
                    isCurrentDriver,
                    config.description || status
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
                return;
            }
        }
        
        // Fallback to old UI if mapManager not available (shouldn't happen)
        const collections = window.dataManager?.getDriverCollections(driver.id) || [];
        const todayCollections = collections.filter(c => 
            new Date(c.timestamp).toDateString() === new Date().toDateString()
        ).length;
        
        const lastUpdate = driver.lastStatusUpdate ? 
            new Date(driver.lastStatusUpdate).toLocaleTimeString() : 
            'Never';
        
        const popupHTML = `
            <div class="enhanced-driver-popup" style="
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                min-width: 250px;
            ">
                <!-- Driver header -->
                <div class="popup-header" style="
                    display: flex; 
                    align-items: center; 
                    gap: 10px;
                    margin-bottom: 12px;
                    padding-bottom: 8px;
                    border-bottom: 1px solid #e5e7eb;
                ">
                    <div style="font-size: 24px;">${config.emoji}</div>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; font-size: 16px; color: #111827;">
                            ${driver.name}
                        </div>
                        <div style="font-size: 12px; color: #6b7280;">
                            ID: ${driver.id}
                        </div>
                    </div>
                </div>
                
                <!-- Status display -->
                <div class="status-display" style="
                    background: ${config.color};
                    color: white;
                    padding: 8px 12px;
                    border-radius: 8px;
                    text-align: center;
                    font-weight: 600;
                    margin-bottom: 12px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                ">
                    ${config.emoji} ${config.description}
                </div>
                
                <!-- Driver details -->
                <div class="driver-details" style="
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 8px;
                    font-size: 13px;
                ">
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span>⛽</span>
                        <span style="color: #6b7280;">Fuel:</span>
                        <span style="font-weight: 500;">${driver.fuelLevel || 75}%</span>
                    </div>
                    
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span>🗑️</span>
                        <span style="color: #6b7280;">Today:</span>
                        <span style="font-weight: 500;">${todayCollections}</span>
                    </div>
                    
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span>📞</span>
                        <span style="color: #6b7280;">Phone:</span>
                        <span style="font-weight: 500;">${driver.phone || 'N/A'}</span>
                    </div>
                    
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span>⏰</span>
                        <span style="color: #6b7280;">Updated:</span>
                        <span style="font-weight: 500;">${lastUpdate}</span>
                    </div>
                </div>
                
                <!-- Quick actions -->
                <div class="popup-actions" style="
                    margin-top: 12px;
                    padding-top: 8px;
                    border-top: 1px solid #e5e7eb;
                    display: flex;
                    gap: 6px;
                ">
                    <button onclick="window.showDriverDetails('${driver.id}')" style="
                        flex: 1;
                        background: #3b82f6;
                        color: white;
                        border: none;
                        padding: 6px 12px;
                        border-radius: 6px;
                        font-size: 12px;
                        cursor: pointer;
                        font-weight: 500;
                    ">
                        View Details
                    </button>
                    
                    <button onclick="window.callDriver('${driver.phone || ''}')" style="
                        flex: 1;
                        background: #10b981;
                        color: white;
                        border: none;
                        padding: 6px 12px;
                        border-radius: 6px;
                        font-size: 12px;
                        cursor: pointer;
                        font-weight: 500;
                    ">
                        📞 Call
                    </button>
                </div>
            </div>
        `;
        
        marker.bindPopup(popupHTML, {
            maxWidth: 280,
            closeButton: true,
            autoClose: true,
            closeOnClick: false
        });
    }
    
    handleStatusBroadcast(statusData) {
        console.log('📡 Map received status broadcast:', statusData);
        this.updateDriverMarkerStatus(statusData.driverId, statusData.movementStatus || statusData.status);
    }
    
    handleDriverUpdate(data) {
        console.log('📡 Map received driver update:', data);
        const status = data.movementStatus || data.status || data.driverData?.movementStatus || data.driverData?.status;
        if (data.driverId && status) {
            this.updateDriverMarkerStatus(data.driverId, status);
        }
    }
    
    handleStatusUpdate(data) {
        console.log('📡 Map received status update:', data);
        if (data.driverId && (data.movementStatus || data.status)) {
            this.updateDriverMarkerStatus(data.driverId, data.movementStatus || data.status);
        }
    }
    
    updateDriverMarkerStatus(driverId, newStatus) {
        if (!this.mapReady) {
            // Queue for later processing
            this.statusUpdateQueue.push({ 
                driverId, 
                status: newStatus, 
                action: 'update',
                timestamp: Date.now()
            });
            return;
        }
        
        const driver = window.dataManager?.getUserById(driverId);
        if (!driver) {
            console.warn(`Driver ${driverId} not found in dataManager`);
            return;
        }
        
        // Update driver object
        driver.movementStatus = newStatus;
        driver.lastStatusUpdate = new Date().toISOString();
        
        console.log(`🎨 Updating map marker status for driver ${driverId}: ${newStatus}`);
        
        // Re-enhance the marker with new status
        this.enhanceDriverMarker(driverId, driver);
        
        // Trigger visual feedback
        this.showStatusChangeEffect(driverId, newStatus);
    }
    
    showStatusChangeEffect(driverId, status) {
        if (!this.mapReady || !window.mapManager?.markers?.drivers) return;
        
        const marker = window.mapManager.markers.drivers[driverId];
        if (!marker) return;
        
        // Add temporary effect class
        const markerElement = marker.getElement();
        if (markerElement) {
            markerElement.classList.add('status-change-effect');
            
            // Remove effect after animation
            setTimeout(() => {
                markerElement.classList.remove('status-change-effect');
            }, 1000);
        }
        
        // Show brief notification if marker is visible
        if (window.mapManager.map.getBounds().contains(marker.getLatLng())) {
            this.showMapNotification(driverId, status);
        }
    }
    
    showMapNotification(driverId, status) {
        const driver = window.dataManager?.getUserById(driverId);
        if (!driver) return;
        
        const config = this.statusConfig[status] || this.statusConfig['active'];
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'map-status-notification';
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: ${config.color};
            color: white;
            padding: 10px 16px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10000;
            font-size: 14px;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 8px;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        notification.innerHTML = `
            <span style="font-size: 16px;">${config.emoji}</span>
            <span>${driver.name}: ${config.description}</span>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(0)';
        });
        
        // Remove after 2 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 2000);
    }
    
    injectStatusCSS() {
        if (document.getElementById('enhancedMapStatusCSS')) return;
        
        const style = document.createElement('style');
        style.id = 'enhancedMapStatusCSS';
        style.textContent = `
            @keyframes statusPulse {
                0% { transform: scale(1); opacity: 0.6; }
                50% { transform: scale(1.3); opacity: 0.3; }
                100% { transform: scale(1); opacity: 0.6; }
            }
            
            @keyframes statusChange {
                0% { transform: scale(1); }
                50% { transform: scale(1.2); }
                100% { transform: scale(1); }
            }
            
            .enhanced-marker-container.status-pulse .pulse-ring {
                animation: statusPulse 1.5s infinite;
            }
            
            .enhanced-status-marker {
                z-index: 1000 !important;
            }
            
            .status-change-effect {
                animation: statusChange 0.5s ease-out !important;
            }
            
            .enhanced-driver-popup {
                user-select: none;
            }
            
            .enhanced-driver-popup button:hover {
                opacity: 0.9;
                transform: translateY(-1px);
                transition: all 0.2s ease;
            }
            
            .map-status-notification {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            
            .leaflet-popup-content {
                margin: 8px !important;
            }
        `;
        
        document.head.appendChild(style);
        console.log('✅ Enhanced map status CSS injected');
    }
    
    startAnimationLoop() {
        const processQueue = () => {
            if (this.statusUpdateQueue.length > 0 && this.mapReady) {
                const updates = [...this.statusUpdateQueue];
                this.statusUpdateQueue = [];
                
                updates.forEach(update => {
                    if (update.action === 'enhance') {
                        this.enhanceDriverMarker(update.driverId, update.driver);
                    } else if (update.action === 'update') {
                        this.updateDriverMarkerStatus(update.driverId, update.status);
                    }
                });
            }
            
            this.animationFrameId = requestAnimationFrame(processQueue);
        };
        
        processQueue();
        console.log('🎬 Map status animation loop started');
    }
    
    // Public API methods
    forceMarkerUpdate(driverId) {
        const driver = window.dataManager?.getUserById(driverId);
        if (driver) {
            this.enhanceDriverMarker(driverId, driver);
            console.log(`🔧 Forced marker update for driver ${driverId}`);
        }
    }
    
    updateAllMarkers() {
        if (!window.dataManager) return;
        
        const drivers = window.dataManager.getUsers().filter(u => u.type === 'driver');
        drivers.forEach(driver => {
            this.enhanceDriverMarker(driver.id, driver);
        });
        
        console.log(`🔄 Updated ${drivers.length} driver markers`);
    }
    
    getMarkerStatus(driverId) {
        return this.markerStatusCache.get(driverId) || null;
    }
    
    cleanup() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        this.markerStatusCache.clear();
        this.statusUpdateQueue = [];
    }
}

// Helper functions for popup actions
window.showDriverDetails = function(driverId) {
    if (window.showDriverDetailsModal) {
        window.showDriverDetailsModal(driverId);
    } else if (window.showDriverModal) {
        window.showDriverModal(driverId);
    } else {
        console.log(`Show details for driver: ${driverId}`);
        // Fallback: try to show driver details through other available methods
        if (window.app && window.app.showDriverDetails) {
            window.app.showDriverDetails(driverId);
        }
    }
};

window.callDriver = function(phone) {
    if (phone && phone !== 'N/A') {
        window.open(`tel:${phone}`);
    } else {
        alert('Phone number not available');
    }
};

// Initialize enhanced map status integration
window.enhancedMapStatus = new EnhancedMapStatusIntegration();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedMapStatusIntegration;
}

console.log('🗺️ Enhanced Map Status Integration loaded and ready');
