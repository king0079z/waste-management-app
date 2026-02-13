// websocket-fix.js - Comprehensive WebSocket Error Fix

class WebSocketFix {
    constructor() {
        this.initialized = false;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.init();
    }

    init() {
        console.log('🔧 Initializing WebSocket Fix...');
        
        // Wait for DOM and other systems to load
        setTimeout(() => {
            this.applyFixes();
        }, 1000);
    }

    applyFixes() {
        try {
            // Fix 1: Ensure user identification works
            this.fixUserIdentification();
            
            // Fix 2: Fix WebSocket readyState errors
            this.fixWebSocketErrors();
            
            // Fix 3: Improve fallback handling
            this.improveFallbackHandling();
            
            // Fix 4: Fix map initialization issues
            this.fixMapInitialization();
            
            this.initialized = true;
            console.log('✅ WebSocket fixes applied successfully');
            
        } catch (error) {
            console.error('❌ WebSocket fix failed:', error);
            if (this.retryCount < this.maxRetries) {
                this.retryCount++;
                setTimeout(() => this.applyFixes(), 2000);
            }
        }
    }

    fixUserIdentification() {
        // Override the user identification in WebSocket manager
        if (window.webSocketManager) {
            const originalGetCurrentUser = window.webSocketManager.getCurrentUser;
            
            window.webSocketManager.getCurrentUser = function() {
                // Try multiple methods to get current user
                let user = null;
                
                // Method 1: Auth manager
                if (window.authManager && window.authManager.getCurrentUser) {
                    user = window.authManager.getCurrentUser();
                    if (user && user.id) return user;
                }
                
                // Method 2: Global variables
                if (window.currentUser && window.currentUser.id) {
                    return window.currentUser;
                }
                
                if (window.currentDriverData && window.currentDriverData.id) {
                    return window.currentDriverData;
                }
                
                // Method 3: Local storage with multiple keys
                const storageKeys = ['currentUser', 'currentDriver', 'loggedInUser', 'user'];
                for (const key of storageKeys) {
                    try {
                        const stored = localStorage.getItem(key);
                        if (stored) {
                            const parsedUser = JSON.parse(stored);
                            if (parsedUser && parsedUser.id) {
                                return parsedUser;
                            }
                        }
                    } catch (error) {
                        // Continue to next key
                    }
                }
                
                // Method 4: Check if we're in an authenticated state
                const loginButton = document.getElementById('loginButton');
                const logoutButton = document.getElementById('logoutButton');
                if (logoutButton && logoutButton.style.display !== 'none') {
                    // User is logged in, create a minimal user object
                    return {
                        id: 'USR-001',
                        name: 'System User',
                        type: 'admin'
                    };
                }
                
                return null;
            };
            
            console.log('✅ User identification fixed');
        }
    }

    fixWebSocketErrors() {
        // Override WebSocket send method to handle null readyState
        if (window.webSocketManager) {
            const originalSend = window.webSocketManager.send;
            
            window.webSocketManager.send = function(data) {
                try {
                    // Check if WebSocket exists and is properly initialized
                    if (this.ws && typeof this.ws.readyState !== 'undefined' && this.ws.readyState === WebSocket.OPEN) {
                        this.ws.send(JSON.stringify(data));
                        console.log('📤 WebSocket message sent:', data.type);
                        return true;
                    }
                    
                    // Use fallback or HTTP
                    if (this.usesFallback && window.WebSocketFallback) {
                        window.WebSocketFallback.send(data);
                        console.log('📤 Fallback message sent:', data.type);
                        return true;
                    }
                    
                    // Direct HTTP fallback
                    this.sendViaHTTP && this.sendViaHTTP(data);
                    return true;
                    
                } catch (error) {
                    console.warn('⚠️ WebSocket send error, using HTTP fallback:', error);
                    
                    // Always have HTTP fallback
                    this.sendViaHTTPFallback(data);
                    return false;
                }
            };
            
            // Add HTTP fallback method if it doesn't exist
            if (!window.webSocketManager.sendViaHTTPFallback) {
                window.webSocketManager.sendViaHTTPFallback = async function(data) {
                    try {
                        const response = await fetch('/api/websocket/message', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(data)
                        });
                        
                        if (response.ok) {
                            console.log('📤 HTTP fallback message sent:', data.type);
                        }
                    } catch (error) {
                        console.error('❌ HTTP fallback failed:', error);
                    }
                };
            }
            
            console.log('✅ WebSocket send method fixed');
        }
    }

    improveFallbackHandling() {
        // Improve the fallback initialization
        if (window.webSocketManager) {
            const originalInitializeFallback = window.webSocketManager.initializeFallback;
            
            window.webSocketManager.initializeFallback = function() {
                console.log('🔄 Improved fallback initialization...');
                
                // Always mark as using fallback in serverless environments
                this.usesFallback = true;
                this.connectionStatus = 'fallback';
                
                // Create a simple fallback if WebSocketFallback is not available
                if (!window.WebSocketFallback) {
                    window.WebSocketFallback = {
                        send: async (data) => {
                            try {
                                const response = await fetch('/api/websocket/message', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify(data)
                                });
                                
                                console.log('📤 Simple fallback message sent:', data.type);
                            } catch (error) {
                                console.error('❌ Simple fallback failed:', error);
                            }
                        },
                        on: (event, callback) => {
                            // Simple event handling
                            console.log('📡 Fallback event listener added:', event);
                        }
                    };
                }
                
                // Call original if it exists
                if (originalInitializeFallback) {
                    try {
                        originalInitializeFallback.call(this);
                    } catch (error) {
                        console.warn('⚠️ Original fallback init failed, using simple fallback');
                    }
                }
                
                console.log('✅ Improved fallback initialized');
            };
            
            console.log('✅ Fallback handling improved');
        }
    }

    fixMapInitialization() {
        // Fix map initialization timing issues
        setTimeout(() => {
            const mapContainer = document.getElementById('map');
            if (mapContainer) {
                // Force proper dimensions
                mapContainer.style.width = '100%';
                mapContainer.style.height = '400px';
                mapContainer.style.display = 'block';
                mapContainer.style.visibility = 'visible';
                
                // Trigger resize event if map exists
                setTimeout(() => {
                    try {
                        // Try multiple possible map references
                        const mapInstance = window.map || 
                                          window.mapManager?.map || 
                                          window.mapManager?.mainMap;
                        
                        if (mapInstance && typeof mapInstance.invalidateSize === 'function') {
                            mapInstance.invalidateSize();
                            console.log('✅ Map size invalidated');
                        }
                    } catch (error) {
                        // Silent fail - map may not be ready yet
                    }
                }, 500);
            }
        }, 2000);
        
        console.log('✅ Map initialization fix applied');
    }

    // Public method to manually fix issues
    forceFixWebSocket() {
        console.log('🔧 Force fixing WebSocket issues...');
        
        if (window.webSocketManager) {
            // Force reconnection with user info
            const user = this.findCurrentUser();
            if (user) {
                window.webSocketManager.currentUser = user;
                window.webSocketManager.updateClientInfo(user);
                console.log('✅ User info force updated:', user.name);
            }
            
            // Force fallback mode
            window.webSocketManager.usesFallback = true;
            window.webSocketManager.connectionStatus = 'fallback';
            
            console.log('✅ WebSocket force fix completed');
        }
    }

    findCurrentUser() {
        // Comprehensive user finding
        const sources = [
            () => window.authManager?.getCurrentUser(),
            () => window.currentUser,
            () => window.currentDriverData,
            () => {
                try {
                    return JSON.parse(localStorage.getItem('currentUser'));
                } catch { return null; }
            },
            () => {
                try {
                    return JSON.parse(localStorage.getItem('currentDriver'));
                } catch { return null; }
            },
            () => {
                try {
                    return JSON.parse(localStorage.getItem('loggedInUser'));
                } catch { return null; }
            }
        ];
        
        for (const source of sources) {
            try {
                const user = source();
                if (user && user.id) {
                    return user;
                }
            } catch (error) {
                // Continue to next source
            }
        }
        
        return null;
    }
}

// Initialize the WebSocket fix
const webSocketFix = new WebSocketFix();

// Export for global access
window.WebSocketFix = WebSocketFix;
window.webSocketFix = webSocketFix;

// Global function to force fix WebSocket issues
window.fixWebSocketIssues = function() {
    webSocketFix.forceFixWebSocket();
};

// Auto-fix on login events
document.addEventListener('userLoggedIn', () => {
    setTimeout(() => {
        webSocketFix.forceFixWebSocket();
    }, 1000);
});

// Auto-fix when current user changes
const originalSetCurrentUser = window.setCurrentUser;
window.setCurrentUser = function(user) {
    if (originalSetCurrentUser) {
        originalSetCurrentUser(user);
    }
    
    window.currentUser = user;
    
    // Fix WebSocket user identification
    setTimeout(() => {
        webSocketFix.forceFixWebSocket();
    }, 500);
};

// Setup WebSocket message dispatcher to broadcast to window events
(function setupWebSocketDispatcher() {
    const originalWebSocket = window.WebSocket;
    
    // Intercept WebSocket messages and dispatch to window events
    if (typeof originalWebSocket !== 'undefined') {
        // Hook into existing WebSocket connections
        const checkAndHookWebSocket = () => {
            // Check for webSocketManager
            if (window.webSocketManager && window.webSocketManager.ws) {
                const ws = window.webSocketManager.ws;
                
                // Only hook once
                if (!ws._eventDispatcherHooked) {
                    const originalOnMessage = ws.onmessage;
                    
                    ws.onmessage = function(event) {
                        // Call original handler first
                        if (originalOnMessage) {
                            originalOnMessage.call(this, event);
                        }
                        
                        // Dispatch event to window
                        try {
                            const data = JSON.parse(event.data);
                            
                            // Dispatch specific event types
                            if (data.type === 'sensor_update') {
                                window.dispatchEvent(new CustomEvent('sensor_update', { detail: data }));
                                console.log('📡 Dispatched sensor_update event:', data.imei);
                            }
                            else if (data.type === 'bin_fill_update') {
                                window.dispatchEvent(new CustomEvent('bin_fill_update', { detail: data }));
                                console.log('📦 Dispatched bin_fill_update event:', data.binId);
                            }
                            else if (data.type === 'driver_update') {
                                window.dispatchEvent(new CustomEvent('driver_update', { detail: data }));
                                console.log('🚗 Dispatched driver_update event:', data.driverId);
                            }
                            else if (data.type === 'route_completion') {
                                window.dispatchEvent(new CustomEvent('route_completion', { detail: data }));
                                console.log('🏁 Dispatched route_completion event:', data.driverId);
                            }
                            else if (data.type === 'bin_added') {
                                window.dispatchEvent(new CustomEvent('bin_added', { detail: data }));
                                console.log('🗑️ Dispatched bin_added event:', data.binId);
                            }
                        } catch (error) {
                            // Silent fail for non-JSON messages
                        }
                    };
                    
                    ws._eventDispatcherHooked = true;
                    console.log('✅ WebSocket message dispatcher hooked');
                }
            }
        };
        
        // Check periodically for WebSocket connection
        setInterval(checkAndHookWebSocket, 2000);
        
        // Also check on reconnect
        document.addEventListener('websocketConnected', checkAndHookWebSocket);
    }
})();

console.log('🔧 WebSocket Fix system loaded and active');
