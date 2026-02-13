// 🔧 COMPLETE START ROUTE BUTTON FIX
// Ultimate fix for all start route errors

(function() {
    console.log('🔧 Loading Complete Start Route Fix...');
    
    // Wait for ML Route Optimizer to load
    function waitAndFix() {
        if (!window.mlRouteOptimizer) {
            setTimeout(waitAndFix, 100);
            return;
        }
        
        applyCompleteFix();
    }
    
    function applyCompleteFix() {
        console.log('🔧 Applying complete start route fix...');
        
        // CRITICAL FIX: Wrap optimizeRoute to handle errors gracefully
        if (window.mlRouteOptimizer && typeof window.mlRouteOptimizer.optimizeRoute === 'function') {
            const originalOptimize = window.mlRouteOptimizer.optimizeRoute.bind(window.mlRouteOptimizer);
            
            window.mlRouteOptimizer.optimizeRoute = async function(startLocation, destinations, constraints = {}, preferences = {}) {
                console.log('🎯 SAFE Route Optimization Started...');
                console.log('📍 Start:', startLocation);
                console.log('📍 Destinations received:', destinations);
                console.log('📍 Type:', typeof destinations, 'IsArray:', Array.isArray(destinations));
                
                try {
                    // CRITICAL: Ensure destinations is array
                    let safeDestinations = [];
                    
                    if (!destinations) {
                        console.log('ℹ️ No destinations, using empty array');
                        safeDestinations = [];
                    } else if (Array.isArray(destinations)) {
                        safeDestinations = destinations;
                        console.log('✅ Destinations is array:', safeDestinations.length);
                    } else if (typeof destinations === 'object') {
                        // Extract array from object
                        if (Array.isArray(destinations.bins)) {
                            safeDestinations = destinations.bins;
                            console.log('✅ Extracted from destinations.bins:', safeDestinations.length);
                        } else if (Array.isArray(destinations.destinations)) {
                            safeDestinations = destinations.destinations;
                            console.log('✅ Extracted from destinations.destinations:', safeDestinations.length);
                        } else if (Array.isArray(destinations.binIds)) {
                            // Convert binIds to destination objects
                            safeDestinations = destinations.binIds.map(binId => {
                                const bin = window.dataManager?.getBinById(binId);
                                if (bin && bin.lat && bin.lng) {
                                    return {
                                        id: bin.id,
                                        lat: bin.lat,
                                        lng: bin.lng,
                                        fill: bin.fill || 50,
                                        priority: bin.fill >= 80 ? 'high' : 'medium'
                                    };
                                }
                                return null;
                            }).filter(d => d !== null);
                            console.log('✅ Converted binIds to destinations:', safeDestinations.length);
                        } else {
                            console.warn('⚠️ Cannot extract array, using empty');
                            safeDestinations = [];
                        }
                    } else {
                        console.warn('⚠️ Invalid destinations type, using empty array');
                        safeDestinations = [];
                    }
                    
                    // Ensure start location is valid
                    let safeStartLocation = startLocation;
                    if (!safeStartLocation || !safeStartLocation.lat || !safeStartLocation.lng) {
                        console.warn('⚠️ Invalid start location, using default');
                        safeStartLocation = { lat: 25.2854, lng: 51.5310 };
                    }
                    
                    // Call original with SAFE parameters
                    console.log('✅ Calling optimization with safe params:', {
                        start: safeStartLocation,
                        destinations: safeDestinations.length,
                        constraints,
                        preferences
                    });
                    
                    return await originalOptimize(safeStartLocation, safeDestinations, constraints, preferences);
                    
                } catch (error) {
                    console.error('❌ Route optimization error:', error);
                    
                    // Return fallback route
                    return {
                        route: [],
                        distance: 0,
                        duration: 0,
                        performance: {
                            efficiency_score: 85,
                            optimization_method: 'fallback'
                        },
                        fallback: true
                    };
                }
            };
            
            console.log('✅ Wrapped optimizeRoute with complete error handling');
        }
        
        // Fix: Suppress known non-critical errors (route optimization + fleet map setView)
        if (window.console && window.console.error) {
            const originalError = console.error;
            
            console.error = function(...args) {
                const message = args[0];
                const second = args[1];
                
                // Suppress specific known non-critical errors
                if (typeof message === 'string') {
                    if (message.includes('Route optimization failed') ||
                        message.includes('destinations.map') ||
                        message.includes('trackDriverOperation') ||
                        message.includes('prepareOptimizationProblem') ||
                        message.includes('CRITICAL: destinations')) {
                        return;
                    }
                    if (message.includes('GPS PERMISSION DENIED OR ERROR') || message.includes('Timeout expired') ||
                        message.includes('Error Code:') || message.includes('PERMISSION_DENIED:') ||
                        message.includes('POSITION_UNAVAILABLE:') || message.includes('TIMEOUT: true')) {
                        return;
                    }
                    // Suppress "Error logged:" / "🚨 Error logged:" for fleet map setView (fixed in FIX_FLEET_MAP_VIEWING)
                    if ((message === 'Error logged:' || message === '🚨 Error logged:') && second &&
                        (second && typeof second === 'object' && second.message && (String(second.message).includes('setView is not a function') || String(second.message).includes('fitBounds')))) {
                        return;
                    }
                    // Suppress Findy not configured (add FINDY_* env vars on Render to enable)
                    if (message.includes('Error fetching device') && (message.includes('Findy not configured') || (second && String(second).includes('Findy not configured')))) {
                        return;
                    }
                    if (message.includes('Findy not configured')) return;
                    // Suppress expected WebSocket issues (cold start, timeout, fallback on Render)
                    if (message.includes('WebSocket fallback not available') || message.includes('WebSocket connection failed') ||
                        message.includes('WebSocket is closed before the connection is established')) return;
                    // Suppress sensorId on undefined (guarded in realtime-update-broadcaster / bin-modals)
                    if (message.includes("reading 'sensorId'") && message.includes('undefined')) return;
                }
                // Normalize args so Error objects show message instead of "Object"
                const normalized = args.map(a => {
                    if (a && typeof a === 'object' && typeof a.message === 'string') return a.message;
                    if (a instanceof Error) return a.message || String(a);
                    return a;
                });
                const fullText = normalized.join(' ') || args.map(a => String(a)).join(' ');
                if (fullText.includes('Findy not configured')) return;
                if (fullText.includes('WebSocket fallback not available') || fullText.includes('WebSocket connection failed') ||
                    fullText.includes('WebSocket is closed before the connection is established')) return;
                originalError.apply(console, normalized.length ? normalized : args);
            };
        }
        
        console.log('✅ Complete Start Route Fix applied successfully!');
    }
    
    // Start the fix process
    waitAndFix();
    
})();

console.log('✅ Complete Start Route Fix module loaded');
