// Enhanced Driver Interface V2 - Immediate Status Updates with Visual Feedback
// Fixes route button status reversion and ensures immediate status reflection

class EnhancedDriverInterfaceV2 {
    constructor() {
        this.currentUser = null;
        this.buttons = {};
        this.statusLocked = false;
        this.pendingStatusChanges = new Map();
        this.visualFeedbackEnabled = true;
        
        console.log('🚗 Initializing Enhanced Driver Interface V2...');
        this.init();
    }
    
    async init() {
        await this.waitForSystems();
        this.detectCurrentUser();
        this.initializeButtons();
        this.setupEnhancedEventListeners();
        this.startStatusMonitoring();
        
        console.log('✅ Enhanced Driver Interface V2 ready');
    }
    
    async waitForSystems() {
        let attempts = 0;
        const maxAttempts = 100;
        
        while (attempts < maxAttempts) {
            if (window.dataManager && window.enhancedStatusManager) {
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        console.warn('⚠️ Some systems not ready, proceeding anyway');
    }
    
    detectCurrentUser() {
        // Try multiple methods to detect current user
        this.currentUser = window.currentDriverData || 
                          window.authManager?.getCurrentUser() ||
                          this.getStoredDriverData() ||
                          this.detectFromUI();
        
        console.log('👤 Current user detected:', this.currentUser?.id || 'Unknown');
        
        if (this.currentUser) {
            // Initialize user status tracking
            this.initializeUserStatus();
        }
    }
    
    getStoredDriverData() {
        try {
            const stored = localStorage.getItem('currentDriver');
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.warn('Error parsing stored driver data:', error);
            return null;
        }
    }
    
    detectFromUI() {
        // Try to detect from driver name display or other UI elements
        const driverNameElement = document.querySelector('.driver-name, #driverName, .current-driver-name');
        if (driverNameElement && driverNameElement.textContent) {
            // Look up driver by name
            const drivers = window.dataManager?.getUsers()?.filter(u => u.type === 'driver') || [];
            return drivers.find(d => d.name === driverNameElement.textContent.trim());
        }
        return null;
    }
    
    initializeUserStatus() {
        if (!this.currentUser) return;
        
        // Set initial status if not set
        if (!this.currentUser.status) {
            this.currentUser.status = 'active';
        }
        if (!this.currentUser.movementStatus) {
            this.currentUser.movementStatus = 'stationary';
        }
        
        console.log(`📊 Initialized status for ${this.currentUser.name}: ${this.currentUser.status} / ${this.currentUser.movementStatus}`);
    }
    
    initializeButtons() {
        this.buttons = {
            startRoute: document.getElementById('startRouteBtn'),
            registerPickup: document.getElementById('registerPickupBtn'),
            reportIssue: document.getElementById('reportIssueDriverBtn'),
            updateFuel: document.getElementById('updateFuelBtn'),
            completeRoute: document.getElementById('completeRouteBtn')
        };
        
        // Log button status
        Object.entries(this.buttons).forEach(([key, button]) => {
            if (button) {
                console.log(`✅ Found ${key} button`);
                // Add visual enhancements
                this.enhanceButton(button, key);
            } else {
                console.warn(`❌ Missing ${key} button in DOM`);
            }
        });
        
        // Update button states based on current status
        this.updateButtonStates();
    }
    
    enhanceButton(button, buttonType) {
        // Add loading state capability
        button.dataset.originalContent = button.innerHTML;
        
        // Add visual feedback classes
        button.classList.add('enhanced-driver-button');
        
        // Add status indicator if it's the route button
        if (buttonType === 'startRoute') {
            this.enhanceRouteButton(button);
        }
    }
    
    enhanceRouteButton(button) {
        if (!this.currentUser) return;
        
        const isOnRoute = this.currentUser.movementStatus === 'on-route';
        const statusEmoji = isOnRoute ? '🛑' : '🚛';
        const statusText = isOnRoute ? 'End Route' : 'Start Route';
        const statusColor = isOnRoute ? '#ef4444' : '#10b981';
        
        button.innerHTML = `
            <div class="button-content" style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                <span class="button-emoji">${statusEmoji}</span>
                <span class="button-text">${statusText}</span>
            </div>
        `;
        
        button.style.background = `linear-gradient(135deg, ${statusColor} 0%, ${this.darkenColor(statusColor, 0.1)} 100%)`;
        button.style.transition = 'all 0.3s ease';
    }
    
    darkenColor(color, amount) {
        // Simple color darkening function
        const hex = color.replace('#', '');
        const r = Math.max(0, parseInt(hex.substring(0, 2), 16) - amount * 255);
        const g = Math.max(0, parseInt(hex.substring(2, 4), 16) - amount * 255);
        const b = Math.max(0, parseInt(hex.substring(4, 6), 16) - amount * 255);
        return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
    }
    
    setupEnhancedEventListeners() {
        console.log('🎯 Setting up enhanced driver event listeners...');
        
        // Start Route Button with immediate feedback
        if (this.buttons.startRoute) {
            this.buttons.startRoute.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Prevent double-clicks
                if (this.statusLocked) {
                    console.log('Status change in progress, ignoring click');
                    return;
                }
                
                await this.handleRouteButtonClick();
            });
        }
        
        // Register Pickup Button
        if (this.buttons.registerPickup) {
            this.buttons.registerPickup.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                await this.handlePickupButtonClick();
            });
        }
        
        // Complete Route Button
        if (this.buttons.completeRoute) {
            this.buttons.completeRoute.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                await this.handleCompleteRouteClick();
            });
        }
        
        // Listen for external status updates
        document.addEventListener('driverStatusBroadcast', (event) => {
            if (event.detail.driverId === this.currentUser?.id) {
                console.log('📡 Received status broadcast for current driver:', event.detail);
                this.handleExternalStatusUpdate(event.detail);
            }
        });
    }
    
    async handleRouteButtonClick() {
        if (!this.currentUser) {
            console.error('No current user for route action');
            return;
        }
        
        console.log('🚛 Route button clicked - Current status:', this.currentUser.movementStatus);
        
        // Lock to prevent concurrent updates
        this.statusLocked = true;
        
        try {
            const currentStatus = this.currentUser.movementStatus || 'stationary';
            const isCurrentlyOnRoute = currentStatus === 'on-route';
            
            // Show immediate visual feedback
            this.showButtonLoading(this.buttons.startRoute);
            
            if (isCurrentlyOnRoute) {
                // End the route
                await this.endRoute();
            } else {
                // Start the route
                await this.startRoute();
            }
            
        } catch (error) {
            console.error('Error handling route button:', error);
            this.showVisualFeedback('error', 'Route action failed');
        } finally {
            this.statusLocked = false;
            this.hideButtonLoading(this.buttons.startRoute);
        }
    }
    
    async startRoute() {
        console.log('🚛 Starting route for driver:', this.currentUser.id);
        
        // 1. IMMEDIATE local status update
        this.currentUser.status = 'active';
        this.currentUser.movementStatus = 'on-route';
        this.currentUser.lastStatusUpdate = new Date().toISOString();
        
        // 2. Update button immediately
        this.enhanceRouteButton(this.buttons.startRoute);
        
        // 3. Show success feedback
        this.showVisualFeedback('success', '🚛 Route Started!');
        
        // 4. Update via enhanced status manager (handles WebSocket broadcast and server sync)
        if (window.enhancedStatusManager) {
            await window.enhancedStatusManager.updateDriverStatus(
                this.currentUser.id,
                'active',
                'on-route',
                {
                    routeStartTime: new Date().toISOString(),
                    action: 'route_started'
                }
            );
        }
        
        // 5. Update location to show movement
        if (navigator.geolocation) {
            this.updateLocationWithStatus('on-route');
        }
        
        // 6. Update local storage
        this.updateStoredDriverData();
        
        console.log('✅ Route started successfully');
    }
    
    async endRoute() {
        console.log('🛑 Ending route for driver:', this.currentUser.id);
        
        // 1. IMMEDIATE local status update
        this.currentUser.status = 'available';
        this.currentUser.movementStatus = 'stationary';
        this.currentUser.lastStatusUpdate = new Date().toISOString();
        
        // 2. Update button immediately
        this.enhanceRouteButton(this.buttons.startRoute);
        
        // 3. Show success feedback
        this.showVisualFeedback('success', '🛑 Route Completed!');
        
        // 4. Update via enhanced status manager
        if (window.enhancedStatusManager) {
            await window.enhancedStatusManager.updateDriverStatus(
                this.currentUser.id,
                'available',
                'stationary',
                {
                    routeEndTime: new Date().toISOString(),
                    action: 'route_completed'
                }
            );
        }
        
        // 5. Send route completion to server
        this.notifyRouteCompletion();
        
        // 6. Update local storage
        this.updateStoredDriverData();
        
        console.log('✅ Route ended successfully');
    }
    
    async handlePickupButtonClick() {
        if (!this.currentUser) return;
        
        console.log('🗑️ Pickup button clicked');
        
        this.showButtonLoading(this.buttons.registerPickup);
        
        try {
            // Update status to collecting
            this.currentUser.movementStatus = 'collecting';
            this.currentUser.lastStatusUpdate = new Date().toISOString();
            
            if (window.enhancedStatusManager) {
                await window.enhancedStatusManager.updateDriverStatus(
                    this.currentUser.id,
                    this.currentUser.status,
                    'collecting',
                    { action: 'pickup_started' }
                );
            }
            
            this.showVisualFeedback('success', '🗑️ Pickup registered!');
            
            // Auto-revert to on-route after 10 seconds
            setTimeout(() => {
                if (this.currentUser.movementStatus === 'collecting') {
                    this.currentUser.movementStatus = 'on-route';
                    if (window.enhancedStatusManager) {
                        window.enhancedStatusManager.updateDriverStatus(
                            this.currentUser.id,
                            this.currentUser.status,
                            'on-route',
                            { action: 'pickup_completed' }
                        );
                    }
                }
            }, 10000);
            
        } catch (error) {
            console.error('Error registering pickup:', error);
            this.showVisualFeedback('error', 'Pickup registration failed');
        } finally {
            this.hideButtonLoading(this.buttons.registerPickup);
        }
    }
    
    async handleCompleteRouteClick() {
        await this.endRoute();
    }
    
    showButtonLoading(button) {
        if (!button || !this.visualFeedbackEnabled) return;
        
        button.disabled = true;
        button.style.opacity = '0.7';
        
        const originalContent = button.innerHTML;
        button.dataset.originalContent = originalContent;
        
        button.innerHTML = `
            <div class="loading-spinner" style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                <div class="spinner" style="
                    width: 16px; height: 16px; 
                    border: 2px solid rgba(255,255,255,0.3); 
                    border-top: 2px solid white; 
                    border-radius: 50%; 
                    animation: spin 0.8s linear infinite;
                "></div>
                <span>Processing...</span>
            </div>
        `;
    }
    
    hideButtonLoading(button) {
        if (!button) return;
        
        button.disabled = false;
        button.style.opacity = '1';
        
        if (button.dataset.originalContent) {
            button.innerHTML = button.dataset.originalContent;
        }
        
        // Re-enhance if it's the route button
        if (button === this.buttons.startRoute) {
            setTimeout(() => this.enhanceRouteButton(button), 100);
        }
    }
    
    showVisualFeedback(type, message) {
        if (!this.visualFeedbackEnabled) return;
        
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            info: '#3b82f6',
            warning: '#f59e0b'
        };
        
        const toast = document.createElement('div');
        toast.className = 'driver-toast';
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type] || colors.info};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10000;
            font-weight: 500;
            transition: all 0.3s ease;
            transform: translateX(100%);
        `;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // Animate in
        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(0)';
        });
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
    
    updateLocationWithStatus(status) {
        if (!navigator.geolocation) return;
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                
                console.log(`📍 Updating location for ${status}: ${latitude}, ${longitude}`);
                
                // Update dataManager
                if (window.dataManager) {
                    window.dataManager.updateDriverLocation(
                        this.currentUser.id,
                        latitude,
                        longitude
                    );
                }
                
                // Update map if available
                if (window.mapManager) {
                    window.mapManager.updateDriverLocation(
                        this.currentUser.id,
                        { lat: latitude, lng: longitude }
                    );
                }
                
                // Send to server
                this.sendLocationToServer(latitude, longitude, status);
            },
            (error) => {
                console.warn('Geolocation error:', error.message);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }
    
    async sendLocationToServer(lat, lng, status) {
        try {
            const response = await fetch(`/api/driver/${this.currentUser.id}/location`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lat,
                    lng,
                    timestamp: new Date().toISOString(),
                    status,
                    accuracy: 10,
                    speed: 0
                })
            });
            
            if (response.ok) {
                console.log('📍 Location sent to server successfully');
            }
        } catch (error) {
            console.warn('Error sending location to server:', error);
        }
    }
    
    async notifyRouteCompletion() {
        try {
            const response = await fetch(`/api/driver/${this.currentUser.id}/route-completion`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    completionTime: new Date().toISOString(),
                    status: 'completed',
                    movementStatus: 'stationary'
                })
            });
            
            if (response.ok) {
                console.log('✅ Route completion notified to server');
            }
        } catch (error) {
            console.warn('Error notifying route completion:', error);
        }
    }
    
    updateStoredDriverData() {
        try {
            localStorage.setItem('currentDriver', JSON.stringify(this.currentUser));
        } catch (error) {
            console.warn('Error updating stored driver data:', error);
        }
    }
    
    updateButtonStates() {
        if (!this.currentUser) return;
        
        const isOnRoute = this.currentUser.movementStatus === 'on-route';
        
        // Update route button
        if (this.buttons.startRoute) {
            this.enhanceRouteButton(this.buttons.startRoute);
        }
        
        // Enable/disable other buttons based on status
        if (this.buttons.registerPickup) {
            this.buttons.registerPickup.disabled = !isOnRoute;
            this.buttons.registerPickup.style.opacity = isOnRoute ? '1' : '0.5';
        }
    }
    
    handleExternalStatusUpdate(statusData) {
        if (!statusData.driverId || statusData.driverId !== this.currentUser?.id) return;
        
        console.log('📡 Handling external status update for current driver:', statusData);
        
        // Update local user data
        if (statusData.status) this.currentUser.status = statusData.status;
        if (statusData.movementStatus) this.currentUser.movementStatus = statusData.movementStatus;
        
        // Update UI
        this.updateButtonStates();
        this.updateStoredDriverData();
    }
    
    startStatusMonitoring() {
        // Monitor status changes every 5 seconds
        setInterval(() => {
            if (this.currentUser) {
                this.syncStatusWithServer();
            }
        }, 5000);
        
        console.log('🔄 Driver status monitoring started');
    }
    
    async syncStatusWithServer() {
        try {
            const response = await fetch(`/api/driver/${this.currentUser.id}`);
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.driver) {
                    // Only update if server has newer data
                    const serverTime = new Date(data.driver.lastStatusUpdate || 0);
                    const localTime = new Date(this.currentUser.lastStatusUpdate || 0);
                    
                    if (serverTime > localTime) {
                        console.log('📥 Server has newer status data, syncing...');
                        Object.assign(this.currentUser, data.driver);
                        this.updateButtonStates();
                        this.updateStoredDriverData();
                    }
                }
            }
        } catch (error) {
            console.warn('Error syncing status with server:', error);
        }
    }
    
    // Public API
    getCurrentStatus() {
        return {
            status: this.currentUser?.status,
            movementStatus: this.currentUser?.movementStatus,
            lastUpdate: this.currentUser?.lastStatusUpdate
        };
    }
    
    forceStatusUpdate(status, movementStatus) {
        if (!this.currentUser) return;
        
        console.log(`🔧 Force status update: ${status} / ${movementStatus}`);
        
        this.currentUser.status = status;
        this.currentUser.movementStatus = movementStatus;
        this.currentUser.lastStatusUpdate = new Date().toISOString();
        
        if (window.enhancedStatusManager) {
            window.enhancedStatusManager.updateDriverStatus(
                this.currentUser.id,
                status,
                movementStatus,
                { source: 'manual' }
            );
        }
        
        this.updateButtonStates();
        this.updateStoredDriverData();
    }
}

// Add CSS for spinner animation
if (!document.getElementById('driverInterfaceCSS')) {
    const style = document.createElement('style');
    style.id = 'driverInterfaceCSS';
    style.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .enhanced-driver-button {
            transition: all 0.3s ease !important;
        }
        
        .enhanced-driver-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        
        .enhanced-driver-button:disabled {
            cursor: not-allowed !important;
        }
        
        .driver-toast {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
    `;
    document.head.appendChild(style);
}

// Initialize enhanced driver interface
window.enhancedDriverInterface = new EnhancedDriverInterfaceV2();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedDriverInterfaceV2;
}

console.log('🚗 Enhanced Driver Interface V2 loaded and ready');
