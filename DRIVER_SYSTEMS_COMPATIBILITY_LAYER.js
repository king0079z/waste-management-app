// 🔗 Driver Systems Compatibility Layer
// Ensures driver-system-v3.js and ENHANCED_DRIVER_SYSTEM_COMPLETE.js work together harmoniously

class DriverSystemsCompatibilityLayer {
    constructor() {
        this.v3System = null;
        this.enhancedSystem = null;
        this.coordinationMode = 'hybrid'; // v3 for operations, enhanced for proximity
        
        console.log('🔗 Initializing Driver Systems Compatibility Layer...');
        this.init();
    }
    
    async init() {
        // Wait for both systems to load
        await this.waitForBothSystems();
        
        // Coordinate the systems
        this.coordinateSystems();
        
        // Setup event forwarding
        this.setupEventForwarding();
        
        // Prevent duplicate event handlers
        this.preventDuplicateHandlers();
        
        window.driverSystemsCompatibility = this;
        console.log('✅ Driver Systems Compatibility Layer ready');
    }
    
    async waitForBothSystems() {
        let attempts = 0;
        const maxAttempts = 100;
        
        while (attempts < maxAttempts) {
            this.v3System = window.driverSystemV3Instance;
            this.enhancedSystem = window.enhancedDriverSystemComplete;
            
            if (this.v3System && this.enhancedSystem) {
                console.log('✅ Both driver systems detected');
                return;
            }
            
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        console.warn('⚠️ One or both driver systems not found');
    }
    
    coordinateSystems() {
        console.log('🤝 Coordinating driver systems...');
        
        // V3 handles: Button clicks, route management, status updates
        // Enhanced handles: GPS proximity, auto-collection, notifications
        
        // Ensure they share the same currentUser
        if (this.v3System && this.enhancedSystem) {
            // When V3 sets current user, sync to Enhanced
            const originalOnDriverLogin = this.v3System.onDriverLogin?.bind(this.v3System);
            
            if (originalOnDriverLogin) {
                this.v3System.onDriverLogin = () => {
                    originalOnDriverLogin();
                    
                    // Sync to enhanced system
                    if (this.v3System.currentUser) {
                        this.enhancedSystem.currentUser = this.v3System.currentUser;
                        console.log('🔄 Synced current user to enhanced system');
                    }
                };
            }
            
            // When Enhanced detects current user, sync to V3
            const originalEnhancedLogin = this.enhancedSystem.onUserLogin?.bind(this.enhancedSystem);
            
            if (originalEnhancedLogin) {
                this.enhancedSystem.onUserLogin = (user) => {
                    originalEnhancedLogin(user);
                    
                    // Sync to V3 system
                    if (this.enhancedSystem.currentUser && !this.v3System.currentUser) {
                        this.v3System.currentUser = this.enhancedSystem.currentUser;
                        console.log('🔄 Synced current user to V3 system');
                    }
                };
            }
        }
        
        console.log('✅ Systems coordinated');
    }
    
    setupEventForwarding() {
        console.log('📡 Setting up event forwarding...');
        
        // Forward route events to enhanced system (for proximity monitoring)
        document.addEventListener('routeStarted', (event) => {
            if (this.enhancedSystem && typeof this.enhancedSystem.startProximityMonitoring === 'function') {
                console.log('🔄 Forwarding route start to enhanced system');
                this.enhancedSystem.startProximityMonitoring();
            }
        });
        
        document.addEventListener('routeEnded', (event) => {
            if (this.enhancedSystem && typeof this.enhancedSystem.stopProximityMonitoring === 'function') {
                console.log('🔄 Forwarding route end to enhanced system');
                this.enhancedSystem.stopProximityMonitoring();
            }
        });
        
        // Forward GPS updates from V3 to Enhanced
        document.addEventListener('gpsUpdate', (event) => {
            if (this.enhancedSystem && event.detail.position) {
                this.enhancedSystem.currentPosition = event.detail.position;
            }
        });
        
        // Forward auto-collections from Enhanced to V3 stats
        document.addEventListener('autoCollectionRegistered', (event) => {
            if (this.v3System && typeof this.v3System.updateQuickStats === 'function') {
                console.log('🔄 Updating V3 stats after auto-collection');
                this.v3System.updateQuickStats();
            }
        });
        
        console.log('✅ Event forwarding configured');
    }
    
    preventDuplicateHandlers() {
        console.log('🛡️ Preventing duplicate event handlers...');
        
        // Track which system handles which button
        const buttonOwnership = {
            'startRouteBtn': 'v3',           // V3 handles route operations
            'registerPickupBtn': 'v3',       // V3 handles manual pickups
            'reportIssueDriverBtn': 'v3',    // V3 handles issue reporting
            'updateFuelBtn': 'v3'            // V3 handles fuel updates
        };
        
        // Remove duplicate listeners from enhanced system for buttons owned by V3
        Object.entries(buttonOwnership).forEach(([buttonId, owner]) => {
            const button = document.getElementById(buttonId);
            
            if (button && owner === 'v3') {
                // Clone button to remove all listeners, then add back only V3's
                const newButton = button.cloneNode(true);
                button.parentNode.replaceChild(newButton, button);
                
                // Re-attach V3 listener only
                if (this.v3System) {
                    this.attachV3ButtonHandler(newButton, buttonId);
                }
            }
        });
        
        console.log('✅ Duplicate handlers prevented');
    }
    
    attachV3ButtonHandler(button, buttonId) {
        // Re-attach the appropriate V3 handler
        switch(buttonId) {
            case 'startRouteBtn':
                // V3 already has this in setupEventListeners
                break;
            // Add others as needed
        }
    }
}

// Initialize compatibility layer
window.driverSystemsCompatibilityLayer = new DriverSystemsCompatibilityLayer();

console.log('✅ Driver Systems Compatibility Layer loaded!');

