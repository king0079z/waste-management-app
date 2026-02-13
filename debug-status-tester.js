// Debug Status Tester - Quick testing functions for status updates and fixes
console.log('🧪 Debug Status Tester loaded');

// Global debug functions for testing
window.debugFunctions = {
    
    // Test driver status update
    testStatusUpdate: function(driverId, status) {
        console.log(`🧪 Testing status update: ${driverId} -> ${status}`);
        
        if (window.enhancedStatusManager) {
            window.enhancedStatusManager.updateDriverStatus(driverId, 'active', status);
        }
        
        if (window.enhancedMapStatus) {
            window.enhancedMapStatus.forceMarkerUpdate(driverId);
        }
        
        // Dispatch manual event
        document.dispatchEvent(new CustomEvent('driverStatusChange', {
            detail: { driverId, status, movementStatus: status }
        }));
        
        console.log(`✅ Status update test completed for ${driverId}`);
    },
    
    // Force all markers to update
    forceUpdateAllMarkers: function() {
        console.log('🧪 Force updating all driver markers...');
        
        if (window.dataManager) {
            const drivers = window.dataManager.getUsers().filter(u => u.type === 'driver');
            drivers.forEach(driver => {
                if (window.enhancedMapStatus) {
                    window.enhancedMapStatus.forceMarkerUpdate(driver.id);
                }
            });
            console.log(`✅ Updated ${drivers.length} driver markers`);
        }
    },
    
    // Test driver details popup
    testDriverPopup: function(driverId = 'USR-003') {
        console.log(`🧪 Testing driver popup for: ${driverId}`);
        
        if (window.showDriverDetails) {
            window.showDriverDetails(driverId);
        } else {
            console.warn('❌ showDriverDetails function not found');
        }
    },
    
    // Simulate route start for testing
    simulateRouteStart: function(driverId = 'USR-003') {
        console.log(`🧪 Simulating route start for driver: ${driverId}`);
        
        // Update driver status
        this.testStatusUpdate(driverId, 'on-route');
        
        // Update driver data
        if (window.dataManager) {
            const driver = window.dataManager.getUserById(driverId);
            if (driver) {
                driver.movementStatus = 'on-route';
                driver.status = 'active';
                driver.lastStatusUpdate = new Date().toISOString();
            }
        }
        
        // Force UI updates
        this.forceUpdateAllMarkers();
        
        console.log('✅ Route start simulation completed');
    },
    
    // Simulate route end for testing  
    simulateRouteEnd: function(driverId = 'USR-003') {
        console.log(`🧪 Simulating route end for driver: ${driverId}`);
        
        // Update driver status
        this.testStatusUpdate(driverId, 'stationary');
        
        // Update driver data
        if (window.dataManager) {
            const driver = window.dataManager.getUserById(driverId);
            if (driver) {
                driver.movementStatus = 'stationary';
                driver.status = 'available';
                driver.lastStatusUpdate = new Date().toISOString();
            }
        }
        
        // Force UI updates
        this.forceUpdateAllMarkers();
        
        console.log('✅ Route end simulation completed');
    },
    
    // Check system status
    checkSystemStatus: function() {
        console.log('🧪 Checking system status...');
        
        const status = {
            dataManager: !!window.dataManager,
            mapManager: !!window.mapManager,
            enhancedStatusManager: !!window.enhancedStatusManager,
            enhancedMapStatus: !!window.enhancedMapStatus,
            wsManager: !!window.wsManager,
            showDriverDetails: !!window.showDriverDetails,
            showDriverDetailsModal: !!window.showDriverDetailsModal,
            mlRouteOptimizer: !!window.mlRouteOptimizer
        };
        
        console.table(status);
        
        // Check drivers
        if (window.dataManager) {
            const drivers = window.dataManager.getUsers().filter(u => u.type === 'driver');
            console.log(`📊 Found ${drivers.length} drivers:`, drivers.map(d => ({ id: d.id, name: d.name, status: d.movementStatus || d.status })));
        }
        
        return status;
    },
    
    // Fix all issues immediately
    applyImmediateFixes: function() {
        console.log('🚀 Applying immediate fixes...');
        
        // Force reload critical fixes
        if (window.applyCriticalFixes) {
            window.applyCriticalFixes();
        }
        
        // Update all markers
        this.forceUpdateAllMarkers();
        
        // Test driver popup function
        window.showDriverDetails = function(driverId) {
            console.log('🔧 FIXED: showDriverDetails called for', driverId);
            if (window.showDriverDetailsModal) {
                window.showDriverDetailsModal(driverId);
            } else {
                alert(`Driver Details for ${driverId}\nClick OK to open driver info.`);
            }
        };
        
        console.log('✅ Immediate fixes applied');
    }
};

// Console helper messages
console.log('🧪 Debug functions available:');
console.log('- debugFunctions.testStatusUpdate("USR-003", "on-route")');
console.log('- debugFunctions.simulateRouteStart("USR-003")');
console.log('- debugFunctions.simulateRouteEnd("USR-003")');
console.log('- debugFunctions.testDriverPopup("USR-003")');
console.log('- debugFunctions.forceUpdateAllMarkers()');
console.log('- debugFunctions.checkSystemStatus()');
console.log('- debugFunctions.applyImmediateFixes()');

// Auto-apply immediate fixes after 3 seconds
setTimeout(() => {
    if (window.debugFunctions) {
        window.debugFunctions.applyImmediateFixes();
        console.log('🔧 Auto-applied immediate fixes');
    }
}, 3000);
