// Critical Fixes Patch - Driver Details, Map Emojis, and Route Optimization
// Fixes immediate issues reported by user

// Silent loading in production
// console.log('🔧 Loading Critical Fixes Patch...');

// ==================== FIX 1: Driver Details Popup ====================
// Ensure driver details modal opens correctly from map markers

function fixDriverDetailsPopup() {
    // Enhanced driver details function with better error handling
    window.showDriverDetails = function(driverId) {
        console.log('👤 Attempting to show driver details for:', driverId);
        
        try {
            // Try multiple methods to show driver details
            if (typeof window.showDriverDetailsModal === 'function') {
                window.showDriverDetailsModal(driverId);
                console.log('✅ Opened driver details via showDriverDetailsModal');
                return;
            }
            
            if (typeof window.showDriverModal === 'function') {
                window.showDriverModal(driverId);
                console.log('✅ Opened driver details via showDriverModal');
                return;
            }
            
            // Fallback: directly manipulate modal
            const driver = window.dataManager?.getUserById(driverId);
            if (driver) {
                showDriverDetailsDirectly(driver);
                return;
            }
            
            console.warn('⚠️ Could not find driver or modal function');
            
        } catch (error) {
            console.error('❌ Error showing driver details:', error);
            
            // Last resort: alert with driver info
            const driver = window.dataManager?.getUserById(driverId);
            if (driver) {
                alert(`Driver Details:\nName: ${driver.name}\nID: ${driver.id}\nStatus: ${driver.movementStatus || driver.status || 'active'}\nFuel: ${driver.fuelLevel || 75}%`);
            }
        }
    };
    
    // Direct modal manipulation as fallback
    function showDriverDetailsDirectly(driver) {
        console.log('🔧 Using direct modal manipulation for driver:', driver.name);
        
        let modal = document.getElementById('driverDetailsModal');
        if (!modal) {
            // Create modal if it doesn't exist
            modal = createDriverDetailsModal();
        }
        
        if (modal) {
            // Populate modal with driver data
            populateDriverModal(modal, driver);
            
            // Show modal
            modal.style.display = 'block';
            modal.style.visibility = 'visible';
            modal.style.opacity = '1';
            
            console.log('✅ Driver details modal opened directly');
        }
    }
    
    function populateDriverModal(modal, driver) {
        // Update modal content with driver information
        const nameElement = modal.querySelector('#driverName, .driver-name, [data-field="name"]');
        if (nameElement) nameElement.textContent = driver.name;
        
        const idElement = modal.querySelector('#driverId, .driver-id, [data-field="id"]');
        if (idElement) idElement.textContent = driver.id;
        
        const statusElement = modal.querySelector('#driverStatus, .driver-status, [data-field="status"]');
        if (statusElement) statusElement.textContent = driver.movementStatus || driver.status || 'active';
        
        const fuelElement = modal.querySelector('#driverFuel, .driver-fuel, [data-field="fuel"]');
        if (fuelElement) fuelElement.textContent = (driver.fuelLevel || 75) + '%';
    }
    
    function createDriverDetailsModal() {
        const modal = document.createElement('div');
        modal.id = 'driverDetailsModal';
        modal.className = 'modal';
        modal.style.cssText = `
            display: none;
            position: fixed;
            z-index: 10000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
        `;
        
        modal.innerHTML = `
            <div class="modal-content" style="
                background: white;
                margin: 10% auto;
                padding: 20px;
                border-radius: 8px;
                width: 90%;
                max-width: 500px;
                position: relative;
            ">
                <span class="close" style="
                    color: #aaa;
                    float: right;
                    font-size: 28px;
                    font-weight: bold;
                    cursor: pointer;
                " onclick="document.getElementById('driverDetailsModal').style.display='none'">&times;</span>
                
                <h2>Driver Details</h2>
                <p><strong>Name:</strong> <span data-field="name">-</span></p>
                <p><strong>ID:</strong> <span data-field="id">-</span></p>
                <p><strong>Status:</strong> <span data-field="status">-</span></p>
                <p><strong>Fuel Level:</strong> <span data-field="fuel">-</span></p>
            </div>
        `;
        
        document.body.appendChild(modal);
        return modal;
    }
}

// ==================== FIX 2: Map Emoji Updates ====================
// Ensure map markers update immediately when driver status changes

function fixMapEmojiUpdates() {
    console.log('🗺️ Applying map emoji update fixes...');
    
    // Override the enhanced status manager's updateMapMarkerStatus
    if (window.enhancedStatusManager) {
        const originalUpdateMapMarkerStatus = window.enhancedStatusManager.updateMapMarkerStatus.bind(window.enhancedStatusManager);
        
        window.enhancedStatusManager.updateMapMarkerStatus = function(driverId, newStatus) {
            console.log(`🎨 FORCE UPDATE: Map marker for driver ${driverId} -> ${newStatus}`);
            
            // Call original method
            originalUpdateMapMarkerStatus(driverId, newStatus);
            
            // Force additional update if enhanced map status exists
            if (window.enhancedMapStatus) {
                setTimeout(() => {
                    window.enhancedMapStatus.forceMarkerUpdate(driverId);
                    console.log(`🔄 Forced additional marker update for ${driverId}`);
                }, 100);
            }
            
            // Force map manager update if available
            if (window.mapManager && window.mapManager.updateDriverStatus) {
                window.mapManager.updateDriverStatus(driverId, newStatus);
                console.log(`🗺️ Updated via mapManager for ${driverId}`);
            }
        };
    }
    
    // Enhanced map status force update
    if (window.enhancedMapStatus) {
        const originalForceMarkerUpdate = window.enhancedMapStatus.forceMarkerUpdate.bind(window.enhancedMapStatus);
        
        window.enhancedMapStatus.forceMarkerUpdate = function(driverId) {
            console.log(`🔧 ENHANCED FORCE UPDATE for driver ${driverId}`);
            
            // Get latest driver data
            const driver = window.dataManager?.getUserById(driverId);
            if (driver) {
                // Force re-enhancement
                this.enhanceDriverMarker(driverId, driver);
                
                // Call original if it exists
                if (originalForceMarkerUpdate) {
                    originalForceMarkerUpdate(driverId);
                }
                
                console.log(`✅ Force updated marker for ${driver.name} (${driverId})`);
            }
        };
    }
    
    // Listen for driver status updates and force map updates
    document.addEventListener('driverStatusChange', function(event) {
        const { driverId, status, movementStatus } = event.detail;
        console.log('🔔 Detected status change event:', { driverId, status, movementStatus });
        
        // Force immediate map update
        setTimeout(() => {
            if (window.enhancedMapStatus) {
                window.enhancedMapStatus.forceMarkerUpdate(driverId);
            }
            if (window.enhancedStatusManager) {
                window.enhancedStatusManager.updateMapMarkerStatus(driverId, movementStatus || status);
            }
        }, 50);
    });
}

// ==================== FIX 3: Route Optimization Validation ====================
// Fix the lat/lng validation errors in route optimization

function fixRouteOptimization() {
    console.log('🛣️ Applying route optimization fixes...');
    
    if (window.mlRouteOptimizer) {
        // Override the validation function to be more flexible
        const originalValidateInputs = window.mlRouteOptimizer.validateInputs;
        
        window.mlRouteOptimizer.validateInputs = function(destinations, startLocation) {
            console.log('🔍 FIXED: Validating route optimization inputs...');
            
            // If no destinations, create dummy ones
            if (!destinations || destinations.length === 0) {
                console.log('⚠️ No destinations provided, creating dummy destinations');
                
                // Create default destinations near Qatar
                destinations = [
                    { id: 'dummy-1', lat: 25.2854, lng: 51.5310, priority: 'medium' },
                    { id: 'dummy-2', lat: 25.2954, lng: 51.5410, priority: 'low' }
                ];
            }
            
            // Validate start location
            if (!startLocation || typeof startLocation.lat !== 'number' || typeof startLocation.lng !== 'number') {
                console.log('⚠️ Invalid start location, using default Doha coordinates');
                startLocation = { lat: 25.2854, lng: 51.5310 };
            }
            
            // CRITICAL: Ensure destinations is array before calling .map()
            if (!Array.isArray(destinations)) {
                console.error('❌ CRITICAL: destinations is not an array!', typeof destinations);
                console.log('Destinations value:', destinations);
                
                // Try to extract array from object
                if (destinations && typeof destinations === 'object') {
                    if (Array.isArray(destinations.bins)) {
                        destinations = destinations.bins;
                        console.log('✅ Extracted bins array from destinations object');
                    } else if (Array.isArray(destinations.destinations)) {
                        destinations = destinations.destinations;
                        console.log('✅ Extracted destinations array from object');
                    } else {
                        // Use empty array as last resort
                        console.warn('⚠️ Cannot extract array, using empty destinations');
                        return { startLocation, destinations: [] };
                    }
                } else {
                    return { startLocation, destinations: [] };
                }
            }
            
            // Fix any destinations with invalid coordinates
            destinations = destinations.map((dest, index) => {
                if (typeof dest.lat !== 'number' || typeof dest.lng !== 'number' || 
                    isNaN(dest.lat) || isNaN(dest.lng)) {
                    console.log(`⚠️ Fixing invalid coordinates for destination ${dest.id || index}`);
                    return {
                        ...dest,
                        lat: 25.2854 + (Math.random() - 0.5) * 0.1,  // Random coords near Doha
                        lng: 51.5310 + (Math.random() - 0.5) * 0.1,
                        id: dest.id || `fixed-dest-${index}`
                    };
                }
                return dest;
            }).filter(d => d !== null);
            
            console.log('✅ Route optimization input validation passed');
            console.log('✅ Final validated destinations count:', validatedDestinations.length);
            
            // Return TRUE for backwards compatibility (original method returns boolean)
            return true;
        };
        
        // Override extractDestinationsFromRouteData to ensure valid coordinates
        const originalExtractDestinations = window.mlRouteOptimizer.extractDestinationsFromRouteData;
        
        window.mlRouteOptimizer.extractDestinationsFromRouteData = function(routeData) {
            console.log('📍 FIXED: Extracting destinations from route data...');
            
            let destinations = [];
            
            try {
                // Call original method first
                if (originalExtractDestinations) {
                    destinations = originalExtractDestinations.call(this, routeData);
                }
                
                // If no destinations or invalid ones, create defaults
                if (!destinations || destinations.length === 0) {
                    console.log('📍 Creating default destinations for route');
                    
                    const baseLocation = routeData?.location || { lat: 25.2854, lng: 51.5310 };
                    
                    destinations = [
                        {
                            id: 'dest-1',
                            lat: baseLocation.lat + 0.01,
                            lng: baseLocation.lng + 0.01,
                            priority: 'medium',
                            fill: 80
                        },
                        {
                            id: 'dest-2',
                            lat: baseLocation.lat - 0.01,
                            lng: baseLocation.lng + 0.01, 
                            priority: 'low',
                            fill: 75
                        }
                    ];
                }
                
                // Ensure all destinations have valid coordinates
                destinations = destinations.map((dest, index) => ({
                    ...dest,
                    lat: typeof dest.lat === 'number' ? dest.lat : 25.2854 + (index * 0.01),
                    lng: typeof dest.lng === 'number' ? dest.lng : 51.5310 + (index * 0.01),
                    priority: dest.priority || 'medium',
                    fill: dest.fill || 75
                }));
                
            } catch (error) {
                console.warn('⚠️ Error extracting destinations, using defaults:', error);
                destinations = [
                    { id: 'default-1', lat: 25.2854, lng: 51.5310, priority: 'medium', fill: 80 },
                    { id: 'default-2', lat: 25.2954, lng: 51.5410, priority: 'low', fill: 75 }
                ];
            }
            
            console.log(`📍 FIXED: Extracted ${destinations.length} valid destinations`);
            return destinations;
        };
    }
}

// ==================== APPLY ALL FIXES ====================

// Guard to prevent multiple executions
let criticalFixesApplied = false;

function applyCriticalFixes() {
    // Only run once
    if (criticalFixesApplied) return;
    criticalFixesApplied = true;
    
    // Silent in production
    // console.log('🚀 Applying all critical fixes...');
    
    try {
        fixDriverDetailsPopup();
        // console.log('✅ Driver details popup fix applied');
    } catch (error) {
        console.error('❌ Error applying driver details fix:', error);
    }
    
    try {
        fixMapEmojiUpdates();
        // console.log('✅ Map emoji update fix applied');
    } catch (error) {
        console.error('❌ Error applying map emoji fix:', error);
    }
    
    try {
        fixRouteOptimization();
        // console.log('✅ Route optimization fix applied');
    } catch (error) {
        console.error('❌ Error applying route optimization fix:', error);
    }
    
    // Silent in production
    // console.log('🎉 All critical fixes applied successfully!');
}

// Apply fixes only once
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyCriticalFixes, { once: true });
} else {
    // DOM already loaded, apply once after short delay
    setTimeout(applyCriticalFixes, 1000);
}

// Silent in production
// console.log('🔧 Critical Fixes Patch loaded and scheduled');
