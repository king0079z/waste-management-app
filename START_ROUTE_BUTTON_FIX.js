// 🔧 Start Route Button Complete Fix
// Fixes all route optimization and analytics errors

(function() {
    console.log('🔧 Applying Start Route Button fixes...');
    
    // Wait for systems to load
    function waitForSystems() {
        if (!window.mlRouteOptimizer) {
            setTimeout(waitForSystems, 100);
            return;
        }
        
        applyFixes();
    }
    
    function applyFixes() {
        // Fix 1: Ensure validateInputs handles non-array destinations
        if (window.mlRouteOptimizer && window.mlRouteOptimizer.validateInputs) {
            const originalValidate = window.mlRouteOptimizer.validateInputs;
            
            window.mlRouteOptimizer.validateInputs = function(startLocation, destinations) {
                // Ensure destinations is always an array
                if (!Array.isArray(destinations)) {
                    console.warn('🔧 Converting destinations to array...');
                    
                    if (!destinations) {
                        destinations = [];
                    } else if (typeof destinations === 'object') {
                        if (Array.isArray(destinations.bins)) {
                            destinations = destinations.bins;
                        } else if (Array.isArray(destinations.destinations)) {
                            destinations = destinations.destinations;
                        } else {
                            destinations = [];
                        }
                    } else {
                        destinations = [];
                    }
                }
                
                // Call original with corrected parameters
                return originalValidate.call(this, startLocation, destinations);
            };
            
            console.log('✅ Fixed validateInputs to handle non-array destinations');
        }
        
        // Fix 2: Add missing trackDriverOperation method
        if (window.analyticsManagerV2 && typeof window.analyticsManagerV2.trackDriverOperation !== 'function') {
            window.analyticsManagerV2.trackDriverOperation = function(operation) {
                console.log('📊 Tracking driver operation:', operation.type);
                
                // Store in analytics data
                if (!this.driverOperations) {
                    this.driverOperations = [];
                }
                
                this.driverOperations.push({
                    ...operation,
                    timestamp: operation.timestamp || new Date().toISOString()
                });
                
                // Keep last 1000 operations
                if (this.driverOperations.length > 1000) {
                    this.driverOperations = this.driverOperations.slice(-1000);
                }
                
                // Trigger analytics update
                if (typeof this.updateSystemMetrics === 'function') {
                    this.updateSystemMetrics();
                }
            };
            
            console.log('✅ Added trackDriverOperation method to analyticsManagerV2');
        }
        
        // Fix 3: Suppress repeated button update calls (ENHANCED)
        if (window.driverSystemV3Instance && window.driverSystemV3Instance.updateStartRouteButton) {
            const originalUpdate = window.driverSystemV3Instance.updateStartRouteButton.bind(window.driverSystemV3Instance);
            let lastUpdateTime = 0;
            let lastUpdateStatus = null;
            const debounceMs = 1000; // Only allow updates every 1 second
            
            window.driverSystemV3Instance.updateStartRouteButton = function() {
                const now = Date.now();
                const currentStatus = this.currentUser?.movementStatus || 'stationary';
                
                // Skip if updated recently AND status hasn't changed
                if (now - lastUpdateTime < debounceMs && lastUpdateStatus === currentStatus) {
                    console.log('ℹ️ Skipping redundant button update');
                    return;
                }
                
                lastUpdateTime = now;
                lastUpdateStatus = currentStatus;
                console.log(`🔘 Button update allowed - Status: ${currentStatus}`);
                return originalUpdate.call(this);
            };
            
            console.log('✅ Enhanced debounce for updateStartRouteButton');
        }
        
        // Fix 4: Prevent map initialization errors during route start (signature: driver, location)
        if (window.mapManager && window.mapManager.addDriverMarker) {
            const originalAddDriverMarker = window.mapManager.addDriverMarker;
            
            window.mapManager.addDriverMarker = function(driver, location) {
                if (!this.map) {
                    console.log('ℹ️ Map not ready, deferring marker addition');
                    return;
                }
                const monitoringSection = document.getElementById('monitoring');
                if (!monitoringSection || monitoringSection.style.display === 'none') {
                    console.log('ℹ️ Monitoring section not active, skipping marker');
                    return;
                }
                return originalAddDriverMarker.call(this, driver, location);
            };
            console.log('✅ Fixed addDriverMarker to check map visibility');
        }
        
        console.log('✅ All Start Route Button fixes applied!');
    }
    
    // Start waiting for systems
    waitForSystems();
    
})();

console.log('✅ Start Route Button Fix module loaded');
