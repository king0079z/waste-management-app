// websocket-fallback.js - Fallback mechanism for serverless WebSocket connections
// Provides Server-Sent Events (SSE) and polling alternatives for Vercel deployment

class WebSocketFallback {
    constructor() {
        this.connections = new Map();
        this.eventSource = null;
        this.pollingInterval = null;
        this.currentMode = 'polling'; // 'websocket', 'sse', 'polling'
        this.maxReconnectAttempts = 5;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        this.isConnected = false;
        this.eventHandlers = new Map();
        this.lastHeartbeat = null;
        this.heartbeatInterval = null;
    }

    async initialize() {
        console.log('🔄 Initializing WebSocket fallback system...');
        
        // Try connection methods in order of preference
        const connectionMethods = ['websocket', 'sse', 'polling'];
        
        for (const method of connectionMethods) {
            try {
                console.log(`🔍 Attempting connection via ${method}...`);
                const success = await this.attemptConnection(method);
                if (success) {
                    this.currentMode = method;
                    console.log(`✅ Connected successfully via ${method}`);
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    this.startHeartbeat();
                    return true;
                }
            } catch (error) {
                console.warn(`⚠️ ${method} connection failed:`, error.message);
            }
        }
        
        console.error('❌ All connection methods failed, operating in offline mode');
        return false;
    }

    async attemptConnection(method) {
        switch (method) {
            case 'websocket':
                return await this.connectWebSocket();
            case 'sse':
                return await this.connectSSE();
            case 'polling':
                return this.connectPolling();
            default:
                throw new Error(`Unknown connection method: ${method}`);
        }
    }

    async connectWebSocket() {
        return new Promise((resolve, reject) => {
            try {
                const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                const wsUrl = `${protocol}//${window.location.host}/ws`;
                
                const ws = new WebSocket(wsUrl);
                
                const timeout = setTimeout(() => {
                    ws.close();
                    reject(new Error('WebSocket connection timeout'));
                }, 5000);
                
                ws.onopen = () => {
                    clearTimeout(timeout);
                    this.ws = ws;
                    this.setupWebSocketHandlers();
                    resolve(true);
                };
                
                ws.onerror = (error) => {
                    clearTimeout(timeout);
                    reject(error);
                };
                
            } catch (error) {
                reject(error);
            }
        });
    }

    async connectSSE() {
        return new Promise((resolve, reject) => {
            try {
                const sseUrl = '/api/sse';
                const eventSource = new EventSource(sseUrl);
                
                const timeout = setTimeout(() => {
                    eventSource.close();
                    reject(new Error('SSE connection timeout'));
                }, 5000);
                
                eventSource.onopen = () => {
                    clearTimeout(timeout);
                    this.eventSource = eventSource;
                    this.setupSSEHandlers();
                    resolve(true);
                };
                
                eventSource.onerror = (error) => {
                    clearTimeout(timeout);
                    reject(error);
                };
                
            } catch (error) {
                reject(error);
            }
        });
    }

    connectPolling() {
        console.log('🔄 Setting up polling connection...');
        this.pollingInterval = setInterval(() => {
            this.pollForUpdates();
        }, 30000); // Poll every 30 seconds (reduced from 3s to prevent server overload)
        
        // Initial poll
        this.pollForUpdates();
        return true;
    }

    setupWebSocketHandlers() {
        if (!this.ws) return;
        
        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handleMessage(data);
            } catch (error) {
                console.error('❌ Error parsing WebSocket message:', error);
            }
        };
        
        this.ws.onclose = () => {
            console.log('🔌 WebSocket connection closed');
            this.isConnected = false;
            this.attemptReconnect();
        };
        
        this.ws.onerror = (error) => {
            console.error('❌ WebSocket error:', error);
            this.isConnected = false;
        };
        
        // Send initial client info
        this.sendClientInfo();
    }

    setupSSEHandlers() {
        if (!this.eventSource) return;
        
        this.eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handleMessage(data);
            } catch (error) {
                console.error('❌ Error parsing SSE message:', error);
            }
        };
        
        this.eventSource.onerror = () => {
            console.log('📡 SSE connection error');
            this.isConnected = false;
            this.attemptReconnect();
        };
        
        // Send initial client info via HTTP
        this.sendClientInfoHTTP();
    }

    async pollForUpdates() {
        try {
            const response = await fetch('/api/polling/updates', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.updates && data.updates.length > 0) {
                    data.updates.forEach(update => this.handleMessage(update));
                }
                this.lastHeartbeat = new Date();
            }
        } catch (error) {
            console.warn('⚠️ Polling update failed:', error);
        }
    }

    handleMessage(data) {
        console.log('📨 Received message:', data.type);
        
        // Update last heartbeat
        this.lastHeartbeat = new Date();
        
        // Handle different message types
        switch (data.type) {
            case 'connected':
                console.log('✅ Connection established');
                break;
            case 'pong':
                console.log('🏓 Pong received');
                break;
            case 'driver_update':
                this.handleDriverUpdate(data);
                break;
            case 'route_completion':
                this.handleRouteCompletion(data);
                break;
            case 'chat_message':
                this.handleChatMessage(data);
                break;
            case 'typing_indicator':
                this.handleTypingIndicator(data);
                break;
            default:
                console.log('❓ Unknown message type:', data.type);
        }
        
        // Emit custom events for other parts of the application
        this.emitEvent(data.type, data);
    }

    handleDriverUpdate(data) {
        console.log(`🚛 Driver update received for ${data.driverId}`);
        
        // Update driver data in local storage if applicable
        if (window.currentDriverData && window.currentDriverData.id === data.driverId) {
            window.currentDriverData = { ...window.currentDriverData, ...data.driverData };
            localStorage.setItem('currentDriver', JSON.stringify(window.currentDriverData));
        }
        
        // Trigger UI updates
        if (window.app && typeof window.app.updateDriverDisplay === 'function') {
            window.app.updateDriverDisplay(data.driverData);
        }
    }

    handleRouteCompletion(data) {
        console.log(`🏁 Route completion received for ${data.driverId}`);
        
        // Update local driver data
        if (window.currentDriverData && window.currentDriverData.id === data.driverId) {
            window.currentDriverData.movementStatus = data.status;
            localStorage.setItem('currentDriver', JSON.stringify(window.currentDriverData));
        }
        
        // Trigger UI updates
        if (window.app && typeof window.app.handleRouteCompletion === 'function') {
            window.app.handleRouteCompletion(data);
        }
    }

    handleChatMessage(data) {
        console.log('💬 Chat message received');
        
        // Forward to messaging system
        if (window.enhancedMessaging && typeof window.enhancedMessaging.handleIncomingMessage === 'function') {
            window.enhancedMessaging.handleIncomingMessage(data);
        }
    }

    handleTypingIndicator(data) {
        console.log('⌨️ Typing indicator received');
        
        // Forward to messaging system
        if (window.enhancedMessaging && typeof window.enhancedMessaging.handleTypingIndicator === 'function') {
            window.enhancedMessaging.handleTypingIndicator(data);
        }
    }

    // Event system for other components to listen to
    on(eventType, handler) {
        if (!this.eventHandlers.has(eventType)) {
            this.eventHandlers.set(eventType, []);
        }
        this.eventHandlers.get(eventType).push(handler);
    }

    off(eventType, handler) {
        if (this.eventHandlers.has(eventType)) {
            const handlers = this.eventHandlers.get(eventType);
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }

    emitEvent(eventType, data) {
        if (this.eventHandlers.has(eventType)) {
            this.eventHandlers.get(eventType).forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`Error in event handler for ${eventType}:`, error);
                }
            });
        }
    }

    // Send methods
    send(data) {
        switch (this.currentMode) {
            case 'websocket':
                this.sendWebSocket(data);
                break;
            case 'sse':
            case 'polling':
                this.sendHTTP(data);
                break;
        }
    }

    sendWebSocket(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        } else {
            console.warn('⚠️ WebSocket not ready, falling back to HTTP');
            this.sendHTTP(data);
        }
    }

    async sendHTTP(data) {
        try {
            const response = await fetch('/api/websocket/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            console.error('❌ HTTP send failed:', error);
        }
    }

    sendClientInfo() {
        const currentUser = this.getCurrentUser();
        if (currentUser) {
            this.send({
                type: 'client_info',
                userId: currentUser.id,
                userType: currentUser.type,
                userName: currentUser.name,
                timestamp: new Date().toISOString()
            });
        }
    }

    async sendClientInfoHTTP() {
        const currentUser = this.getCurrentUser();
        if (currentUser) {
            await this.sendHTTP({
                type: 'client_info',
                userId: currentUser.id,
                userType: currentUser.type,
                userName: currentUser.name,
                timestamp: new Date().toISOString()
            });
        }
    }

    getCurrentUser() {
        // Try to get user from different sources
        if (window.authManager?.getCurrentUser()) {
            return window.authManager.getCurrentUser();
        }
        
        if (window.currentDriverData) {
            return window.currentDriverData;
        }
        
        const storedDriver = localStorage.getItem('currentDriver');
        if (storedDriver) {
            try {
                return JSON.parse(storedDriver);
            } catch (error) {
                console.warn('Error parsing stored driver data:', error);
            }
        }
        
        return null;
    }

    // Heartbeat and reconnection
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            this.sendHeartbeat();
        }, 30000); // Every 30 seconds
    }

    sendHeartbeat() {
        this.send({
            type: 'ping',
            timestamp: new Date().toISOString()
        });
    }

    async attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('❌ Max reconnection attempts reached');
            return;
        }
        
        this.reconnectAttempts++;
        console.log(`🔄 Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);
        
        setTimeout(async () => {
            const success = await this.initialize();
            if (!success) {
                this.attemptReconnect();
            }
        }, this.reconnectDelay * this.reconnectAttempts);
    }

    // Cleanup
    disconnect() {
        this.isConnected = false;
        
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
        
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
        
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
        
        console.log('🔌 WebSocket fallback disconnected');
    }

    // Status methods
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            mode: this.currentMode,
            lastHeartbeat: this.lastHeartbeat,
            reconnectAttempts: this.reconnectAttempts
        };
    }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebSocketFallback;
} else {
    window.WebSocketFallback = WebSocketFallback;
}
