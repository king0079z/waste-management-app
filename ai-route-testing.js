// AI Route Testing - Quick testing functions for AI route functionality
console.log('🧪 AI Route Testing loaded');

// Test functions for AI route functionality
window.aiRouteTestFunctions = {
    
    // Test AI route button toggle
    testSmartActionButton: function() {
        console.log('🧪 Testing smart action button...');
        
        const acceptBtn = document.getElementById('acceptBtn');
        if (!acceptBtn) {
            console.error('❌ Smart action button not found');
            return;
        }
        
        console.log('✅ Smart action button found');
        
        // Check current status
        const status = window.enhancedAIRouteManager?.getCurrentAIRouteStatus();
        console.log('Current AI route status:', status);
        
        // Simulate button click
        acceptBtn.click();
        
        console.log('✅ Button click simulated');
    },
    
    // Test AI route status change
    testStatusChange: function(newStatus = 'active') {
        console.log(`🧪 Testing AI route status change to: ${newStatus}`);
        
        if (!window.enhancedAIRouteManager) {
            console.error('❌ Enhanced AI Route Manager not found');
            return;
        }
        
        window.enhancedAIRouteManager.forceStatusUpdate(newStatus);
        console.log('✅ Status change test completed');
    },
    
    // Test map indicator update
    testMapIndicators: function() {
        console.log('🧪 Testing map indicators...');
        
        if (!window.enhancedAIRouteManager) {
            console.error('❌ Enhanced AI Route Manager not found');
            return;
        }
        
        // Force AI route status
        window.enhancedAIRouteManager.forceStatusUpdate('active');
        
        // Wait and check map
        setTimeout(() => {
            this.checkMapMarkers();
        }, 1000);
    },
    
    // Check map markers for AI route indicators
    checkMapMarkers: function() {
        console.log('🗺️ Checking map markers for AI route indicators...');
        
        if (!window.mapManager || !window.mapManager.markers) {
            console.error('❌ Map manager or markers not found');
            return;
        }
        
        const driverMarkers = window.mapManager.markers.drivers;
        console.log('Found driver markers:', Object.keys(driverMarkers));
        
        // Check for AI route status in enhanced map status
        if (window.enhancedMapStatus) {
            const statusConfig = window.enhancedMapStatus.statusConfig;
            console.log('AI route status config:', statusConfig['ai-route']);
        }
        
        console.log('✅ Map marker check completed');
    },
    
    // Test full AI route workflow
    testFullWorkflow: function(driverId = 'USR-003') {
        console.log(`🧪 Testing full AI route workflow for driver: ${driverId}`);
        
        // Step 1: Set up mock recommendation
        window.currentAIRecommendation = {
            id: 'BIN-TEST-001',
            priority: 'HIGH',
            confidence: 95,
            driverId: driverId,
            calculatedDistance: 1.2,
            estimatedTime: '8 minutes'
        };
        
        console.log('1. Mock AI recommendation created');
        
        // Step 2: Start AI route
        setTimeout(() => {
            this.testSmartActionButton();
            console.log('2. AI route start triggered');
            
            // Step 3: Check status after 2 seconds
            setTimeout(() => {
                const status = window.enhancedAIRouteManager?.getCurrentAIRouteStatus();
                console.log('3. AI route status after start:', status);
                
                // Step 4: Test end route after 3 more seconds
                setTimeout(() => {
                    console.log('4. Testing AI route completion...');
                    this.testSmartActionButton(); // Should prompt to end route
                }, 3000);
                
            }, 2000);
            
        }, 1000);
    },
    
    // Create mock AI recommendation for testing
    createMockRecommendation: function(binId = 'BIN-TEST-001') {
        console.log(`🧪 Creating mock AI recommendation for bin: ${binId}`);
        
        window.currentAIRecommendation = {
            id: binId,
            priority: 'HIGH',
            confidence: 87,
            driverId: window.enhancedAIRouteManager?.currentDriverId || 'USR-003',
            calculatedDistance: 0.8,
            estimatedTime: '6 minutes',
            reason: 'Bin is at 95% capacity',
            fillLevel: 95,
            location: {
                lat: 25.2854,
                lng: 51.5310
            }
        };
        
        console.log('✅ Mock AI recommendation created:', window.currentAIRecommendation);
    },
    
    // Check system status
    checkSystemStatus: function() {
        console.log('🧪 Checking AI route system status...');
        
        const status = {
            enhancedAIRouteManager: !!window.enhancedAIRouteManager,
            enhancedMapStatus: !!window.enhancedMapStatus,
            enhancedStatusManager: !!window.enhancedStatusManager,
            smartActionButton: !!document.getElementById('acceptBtn'),
            currentRecommendation: !!window.currentAIRecommendation,
            mapManager: !!window.mapManager,
            dataManager: !!window.dataManager
        };
        
        console.table(status);
        
        if (window.enhancedAIRouteManager) {
            const aiStatus = window.enhancedAIRouteManager.getCurrentAIRouteStatus();
            console.log('Current AI Route Status:', aiStatus);
        }
        
        return status;
    },
    
    // Reset AI route status for testing
    resetForTesting: function() {
        console.log('🧪 Resetting AI route system for testing...');
        
        if (window.enhancedAIRouteManager) {
            window.enhancedAIRouteManager.forceStatusUpdate('inactive');
            window.enhancedAIRouteManager.currentAIRoute = null;
        }
        
        // Clear localStorage
        const driverId = window.enhancedAIRouteManager?.currentDriverId;
        if (driverId) {
            localStorage.removeItem(`aiRouteStatus_${driverId}`);
        }
        
        console.log('✅ AI route system reset for testing');
    },
    
    // Show visual test results
    showTestResults: function() {
        console.log('📊 AI Route Test Results:');
        
        const results = {
            buttonExists: !!document.getElementById('acceptBtn'),
            managerExists: !!window.enhancedAIRouteManager,
            currentStatus: window.enhancedAIRouteManager?.aiRouteStatus || 'unknown',
            mapIntegration: !!window.enhancedMapStatus?.statusConfig['ai-route'],
            statusManagerIntegration: !!window.enhancedStatusManager?.statusEmojis['ai-route']
        };
        
        console.table(results);
        
        // Create visual indicator
        const indicator = document.createElement('div');
        indicator.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            background: linear-gradient(135deg, #8b5cf6, #7c3aed);
            color: white;
            padding: 1rem;
            border-radius: 8px;
            z-index: 10000;
            font-family: monospace;
            font-size: 12px;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;
        
        indicator.innerHTML = `
            <strong>🤖 AI Route Test Results</strong><br>
            Button: ${results.buttonExists ? '✅' : '❌'}<br>
            Manager: ${results.managerExists ? '✅' : '❌'}<br>
            Status: ${results.currentStatus}<br>
            Map Integration: ${results.mapIntegration ? '✅' : '❌'}<br>
            Status Integration: ${results.statusManagerIntegration ? '✅' : '❌'}
        `;
        
        document.body.appendChild(indicator);
        
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.parentNode.removeChild(indicator);
            }
        }, 10000);
        
        return results;
    }
};

// Console helper messages
console.log('🧪 AI Route test functions available:');
console.log('- aiRouteTestFunctions.testSmartActionButton()');
console.log('- aiRouteTestFunctions.testStatusChange("active")');
console.log('- aiRouteTestFunctions.testMapIndicators()');
console.log('- aiRouteTestFunctions.testFullWorkflow("USR-003")');
console.log('- aiRouteTestFunctions.createMockRecommendation("BIN-001")');
console.log('- aiRouteTestFunctions.checkSystemStatus()');
console.log('- aiRouteTestFunctions.resetForTesting()');
console.log('- aiRouteTestFunctions.showTestResults()');

// Auto-create mock recommendation for testing
setTimeout(() => {
    if (!window.currentAIRecommendation) {
        window.aiRouteTestFunctions.createMockRecommendation();
        console.log('🤖 Auto-created mock AI recommendation for testing');
    }
}, 2000);

console.log('🧪 AI Route Testing ready - Use aiRouteTestFunctions to test functionality');
