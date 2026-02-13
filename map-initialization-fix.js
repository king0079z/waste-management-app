// map-initialization-fix.js - Comprehensive Map Initialization Fix

(function() {
    console.log('🗺️ Loading Map Initialization Fix...');
    
    // Track initialization attempts
    let initAttempts = 0;
    const MAX_ATTEMPTS = 20;
    const RETRY_INTERVAL = 1000;
    
    /**
     * Check if map container is visible and has valid dimensions
     * @param {boolean} silent - if true, only log when ready or every 5th call to reduce spam
     */
    function isMapContainerReady(silent) {
        const container = document.getElementById('map');
        if (!container) {
            if (!silent) console.log('⚠️ Map container not found in DOM');
            return false;
        }
        
        const rect = container.getBoundingClientRect();
        const style = window.getComputedStyle(container);
        
        const isVisible = style.display !== 'none' && 
                         style.visibility !== 'hidden' && 
                         rect.width > 0 && 
                         rect.height > 0;
        
        // Log only when visible, or every 5th attempt to avoid console spam
        if (!silent || isVisible || (initAttempts > 0 && initAttempts % 5 === 0)) {
            console.log('🔍 Map container check:', {
                exists: true,
                width: rect.width,
                height: rect.height,
                display: style.display,
                visibility: style.visibility,
                isVisible: isVisible
            });
        }
        
        return isVisible;
    }
    
    /**
     * Force initialize the map
     */
    async function forceInitializeMap() {
        try {
            console.log('🚀 Force initializing map...');
            
            if (typeof mapManager === 'undefined') {
                console.warn('⚠️ mapManager not available yet');
                return false;
            }
            
            // Check if map already initialized
            if (mapManager.map) {
                console.log('✅ Map already initialized');
                return true;
            }
            
            // Check container (silent = true to reduce log spam)
            if (!isMapContainerReady(true)) {
                if (initAttempts % 5 === 1) console.log('⚠️ Map container not ready yet (will retry when visible)');
                return false;
            }
            
            // Initialize map
            await mapManager.initializeMainMap();
            
            if (mapManager.map) {
                console.log('✅ Map initialized successfully!');
                
                // Load bins after 500ms
                setTimeout(() => {
                    console.log('📦 Loading bins on map...');
                    mapManager.loadBinsOnMap();
                }, 500);
                
                // Load drivers after 1000ms
                setTimeout(() => {
                    console.log('🚗 Loading drivers on map...');
                    if (typeof dataManager !== 'undefined') {
                        const drivers = dataManager.getDrivers();
                        drivers.forEach(driver => {
                            if (driver.currentLocation) {
                                mapManager.addDriverMarker(driver, driver.currentLocation);
                            }
                        });
                    }
                }, 1000);
                
                return true;
            }
            
            return false;
            
        } catch (error) {
            console.error('❌ Error force initializing map:', error);
            return false;
        }
    }
    
    /**
     * Retry map initialization
     */
    function retryMapInitialization(resetAttempts) {
        if (resetAttempts) initAttempts = 0;
        if (initAttempts >= MAX_ATTEMPTS) {
            console.warn('⚠️ Max map init attempts reached. Open the map tab and call forceInitializeMap() if needed.');
            return;
        }
        
        initAttempts++;
        // Log only every 5th attempt to reduce spam
        if (initAttempts === 1 || initAttempts % 5 === 0 || initAttempts === MAX_ATTEMPTS) {
            console.log(`🔄 Map initialization attempt ${initAttempts}/${MAX_ATTEMPTS}`);
        }
        
        forceInitializeMap().then(success => {
            if (!success && initAttempts < MAX_ATTEMPTS) {
                setTimeout(retryMapInitialization, RETRY_INTERVAL);
            } else if (success) {
                console.log('🎉 Map successfully initialized after', initAttempts, 'attempts');
            }
        });
    }
    
    /**
     * Watch for map container size (when tab becomes visible it gets dimensions)
     */
    function watchMapContainerResize() {
        const container = document.getElementById('map');
        if (!container || typeof ResizeObserver === 'undefined') return;
        const ro = new ResizeObserver(() => {
            const rect = container.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0 && typeof mapManager !== 'undefined' && !mapManager.map) {
                ro.disconnect();
                console.log('👁️ Map container has size, retrying init...');
                retryMapInitialization(true);
            }
        });
        ro.observe(container);
    }
    
    /**
     * Watch for monitoring section visibility and page visibility
     */
    function watchMonitoringSection() {
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && typeof mapManager !== 'undefined' && !mapManager.map && initAttempts < MAX_ATTEMPTS) {
                initAttempts = 0;
                setTimeout(() => retryMapInitialization(false), 300);
            }
        });
        
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.id === 'monitoring' || 
                        (node.nodeType === 1 && node.querySelector && node.querySelector('#monitoring'))) {
                        setTimeout(() => retryMapInitialization(true), 500);
                    }
                });
                
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    const target = mutation.target;
                    if ((target.id === 'monitoring' || (target.querySelector && target.querySelector('#map'))) && 
                        target.style && !String(target.style.display || '').includes('none')) {
                        setTimeout(() => retryMapInitialization(true), 500);
                    }
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class']
        });
    }
    
    /**
     * Initialize fix
     */
    function initialize() {
        console.log('🚀 Initializing map fix...');
        
        watchMonitoringSection();
        setTimeout(watchMapContainerResize, 1500);
        
        setTimeout(() => retryMapInitialization(false), 3000);
        
        // Expose global function
        window.forceInitializeMap = forceInitializeMap;
        window.retryMapInitialization = retryMapInitialization;
        
        console.log('✅ Map initialization fix loaded');
        console.log('💡 Use forceInitializeMap() to manually trigger initialization');
    }
    
    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
})();


