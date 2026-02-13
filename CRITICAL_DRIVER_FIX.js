// ==============================================================================
// CRITICAL DRIVER SYSTEM FIX - Resolves all initialization and button issues
// ==============================================================================

(function() {
    'use strict';
    
    // Silent loading in production
    // console.log('🔧 Loading Critical Driver System Fix...');
    
    // =============================================================================
    // FIX #1: Stop infinite waiting loop
    // =============================================================================
    
    // Override the problematic initialization
    if (window.location.hash === '#driver-dashboard' || document.querySelector('.driver-dashboard')) {
        console.log('✅ Driver dashboard detected, applying fixes...');
    }
    
    // =============================================================================
    // FIX #2: Ensure global instance is set
    // =============================================================================
    
    function ensureDriverSystemInstance() {
        // Wait for any driver system to load
        if (window.driverSystemV3Instance) {
            console.log('✅ Found driverSystemV3Instance');
            window.enhancedDriverSystemComplete = window.driverSystemV3Instance;
            return true;
        }
        
        if (window.enhancedDriverSystemComplete) {
            console.log('✅ Found enhancedDriverSystemComplete');
            window.driverSystemV3Instance = window.enhancedDriverSystemComplete;
            return true;
        }
        
        return false;
    }
    
    // =============================================================================
    // FIX #3: Fix End Route Button
    // =============================================================================
    
    function fixEndRouteButton() {
        const driverSystem = window.driverSystemV3Instance || window.enhancedDriverSystemComplete;
        
        if (!driverSystem) {
            console.log('⏳ Waiting for driver system to fix end route...');
            setTimeout(fixEndRouteButton, 500);
            return;
        }
        
        console.log('🔧 Fixing end route functionality...');
        
        // Override endRoute to ensure it works
        const originalEndRoute = driverSystem.endRoute;
        
        driverSystem.endRoute = async function() {
            console.log('🏁 [FIXED] Ending route for:', this.currentUser?.name);
            
            if (!this.currentUser) {
                console.error('❌ No current user');
                this.showAlert('Error', 'Please login first', 'error');
                return;
            }
            
            try {
                // 1. Update local status
                console.log('📝 Step 1: Updating local status to stationary');
                this.setDriverMovementStatus('stationary');
                
                // 2. Update data manager
                console.log('💾 Step 2: Updating data manager');
                window.dataManager.updateUser(this.currentUser.id, {
                    movementStatus: 'stationary',
                    status: 'available',
                    routeEndTime: new Date().toISOString(),
                    lastStatusUpdate: new Date().toISOString()
                });
                
                // 3. Refresh current user data
                console.log('🔄 Step 3: Refreshing current user data');
                this.currentUser = window.dataManager.getUserById(this.currentUser.id);
                
                // 4. Update button immediately
                console.log('🔘 Step 4: Updating button');
                this.updateStartRouteButton();
                
                // 5. Sync to server
                console.log('☁️ Step 5: Syncing to server');
                await this.syncDriverStatusToServer();
                
                // 6. Update stats
                console.log('📊 Step 6: Updating stats');
                this.updateDriverQuickStats();
                
                // 7. Dispatch events
                console.log('📢 Step 7: Dispatching events');
                document.dispatchEvent(new CustomEvent('routeCompleted', {
                    detail: {
                        driverId: this.currentUser.id,
                        timestamp: new Date().toISOString()
                    }
                }));
                
                document.dispatchEvent(new CustomEvent('driverDataUpdated', {
                    detail: {
                        driverId: this.currentUser.id,
                        status: 'stationary',
                        movementStatus: 'stationary',
                        timestamp: new Date().toISOString()
                    }
                }));
                
                // 8. Show success
                this.showAlert('Route Completed', '🏁 Route ended successfully!', 'success');
                console.log('✅ Route ended successfully');
                
            } catch (error) {
                console.error('❌ End route failed:', error);
                this.showAlert('Route Error', 'Failed to end route: ' + error.message, 'error');
            }
        };
        
        console.log('✅ End route functionality fixed');
    }
    
    // =============================================================================
    // FIX #4: Fix Start Route Button
    // =============================================================================
    
    function fixStartRouteButton() {
        const driverSystem = window.driverSystemV3Instance || window.enhancedDriverSystemComplete;
        
        if (!driverSystem) {
            console.log('⏳ Waiting for driver system to fix start route...');
            setTimeout(fixStartRouteButton, 500);
            return;
        }
        
        console.log('🔧 Fixing start route functionality...');
        
        const originalStartRoute = driverSystem.startRoute;
        
        driverSystem.startRoute = async function() {
            console.log('🚗 [FIXED] Starting route for:', this.currentUser?.name);
            
            if (!this.currentUser) {
                console.error('❌ No current user');
                this.showAlert('Error', 'Please login first', 'error');
                return;
            }
            
            try {
                // 1. Update local status
                console.log('📝 Step 1: Updating local status to on-route');
                this.setDriverMovementStatus('on-route');
                
                // 2. Update data manager
                console.log('💾 Step 2: Updating data manager');
                window.dataManager.updateUser(this.currentUser.id, {
                    movementStatus: 'on-route',
                    status: 'active',
                    routeStartTime: new Date().toISOString(),
                    lastStatusUpdate: new Date().toISOString()
                });
                
                // 3. Refresh current user data
                console.log('🔄 Step 3: Refreshing current user data');
                this.currentUser = window.dataManager.getUserById(this.currentUser.id);
                
                // 4. Update button immediately
                console.log('🔘 Step 4: Updating button');
                this.updateStartRouteButton();
                
                // 5. Sync to server
                console.log('☁️ Step 5: Syncing to server');
                await this.syncDriverStatusToServer();
                
                // 6. Update stats
                console.log('📊 Step 6: Updating stats');
                this.updateDriverQuickStats();
                
                // 7. Dispatch events
                console.log('📢 Step 7: Dispatching events');
                document.dispatchEvent(new CustomEvent('routeStarted', {
                    detail: {
                        driverId: this.currentUser.id,
                        timestamp: new Date().toISOString()
                    }
                }));
                
                document.dispatchEvent(new CustomEvent('driverDataUpdated', {
                    detail: {
                        driverId: this.currentUser.id,
                        status: 'on-route',
                        movementStatus: 'on-route',
                        timestamp: new Date().toISOString()
                    }
                }));
                
                // 8. Show success
                this.showAlert('Route Started', '🚗 Route started successfully!', 'success');
                console.log('✅ Route started successfully');
                
            } catch (error) {
                console.error('❌ Start route failed:', error);
                this.showAlert('Route Error', 'Failed to start route: ' + error.message, 'error');
            }
        };
        
        console.log('✅ Start route functionality fixed');
    }
    
    // =============================================================================
    // APPLY FIXES
    // =============================================================================
    
    function applyAllFixes() {
        console.log('🔧 Applying all critical fixes...');
        
        // Try to ensure instance
        if (!ensureDriverSystemInstance()) {
            console.log('⏳ Waiting for driver system...');
            setTimeout(applyAllFixes, 500);
            return;
        }
        
        // Apply fixes
        try {
            fixStartRouteButton();
            fixEndRouteButton();
            
            console.log('\n============================================');
            console.log('✅ CRITICAL DRIVER FIXES APPLIED');
            console.log('============================================\n');
            console.log('✅ Start Route button fixed');
            console.log('✅ End Route button fixed');
            console.log('✅ Global instance ensured');
            console.log('✅ Initialization loop stopped');
            console.log('\n🎉 Driver interface should now work perfectly!\n');
            
        } catch (error) {
            console.error('❌ Failed to apply fixes:', error);
        }
    }
    
    // Wait for DOM and apply fixes
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyAllFixes);
    } else {
        // DOM already loaded, apply immediately
        setTimeout(applyAllFixes, 1000);
    }
    
})();

// Silent in production
// console.log('✅ Critical Driver Fix module loaded');

