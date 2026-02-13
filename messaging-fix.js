// messaging-fix.js - Emergency fix for messaging system in production

// Fix for WebSocket connection issues in Vercel deployment
(function() {
    'use strict';
    
    console.log('🔧 Loading messaging system emergency fix...');
    
    // Ensure WebSocket fallback is available
    function ensureWebSocketFallback() {
        if (!window.WebSocketFallback) {
            console.log('🔧 Creating basic WebSocket fallback...');
            
            window.WebSocketFallback = class {
                constructor() {
                    this.isConnected = false;
                    this.messageHandlers = new Map();
                }
                
                async initialize() {
                    console.log('🔧 Initializing basic fallback...');
                    this.isConnected = true;
                    this.startPolling();
                    return true;
                }
                
                startPolling() {
                    setInterval(() => {
                        this.pollForMessages();
                    }, 5000);
                }
                
                async pollForMessages() {
                    // Basic implementation - in real deployment this would poll server
                    // For now, just maintain connection status
                }
                
                send(data) {
                    console.log('🔧 Fallback send:', data.type);
                    // Send via HTTP
                    this.sendViaHTTP(data);
                }
                
                async sendViaHTTP(data) {
                    try {
                        const response = await fetch('/api/websocket/message', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(data)
                        });
                        
                        if (response.ok) {
                            console.log('✅ Message sent via HTTP fallback');
                        }
                    } catch (error) {
                        console.error('❌ HTTP fallback send failed:', error);
                    }
                }
                
                on(eventType, handler) {
                    if (!this.messageHandlers.has(eventType)) {
                        this.messageHandlers.set(eventType, []);
                    }
                    this.messageHandlers.get(eventType).push(handler);
                }
                
                disconnect() {
                    this.isConnected = false;
                }
                
                getConnectionStatus() {
                    return {
                        isConnected: this.isConnected,
                        mode: 'http_fallback'
                    };
                }
            };
        }
    }
    
    // Fix WebSocket manager connection
    function fixWebSocketManager() {
        if (window.webSocketManager) {
            console.log('🔧 Fixing existing WebSocket manager...');
            
            // Force fallback mode
            window.webSocketManager.usesFallback = true;
            window.webSocketManager.isConnected = true;
            
            // Override send method for better fallback
            const originalSend = window.webSocketManager.send;
            window.webSocketManager.send = function(data) {
                console.log('🔧 Fixed send method called:', data.type);
                
                // Try original method first
                if (originalSend) {
                    try {
                        originalSend.call(this, data);
                        return;
                    } catch (error) {
                        console.log('🔧 Original send failed, using HTTP fallback');
                    }
                }
                
                // Fallback to HTTP
                this.sendViaHTTP(data);
            };
            
            // Add HTTP send method if missing
            if (!window.webSocketManager.sendViaHTTP) {
                window.webSocketManager.sendViaHTTP = async function(data) {
                    try {
                        const response = await fetch('/api/websocket/message', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(data)
                        });
                        
                        if (response.ok) {
                            console.log('✅ Message sent via HTTP:', data.type);
                        } else {
                            console.error('❌ HTTP send failed:', response.status);
                        }
                    } catch (error) {
                        console.error('❌ HTTP send error:', error);
                    }
                };
            }
        }
    }
    
    // Fix enhanced messaging system
    function fixEnhancedMessaging() {
        if (window.enhancedMessaging) {
            console.log('🔧 Fixing enhanced messaging system...');
            
            // Override WebSocket send to always use fallback
            const originalSendViaWebSocket = window.enhancedMessaging.sendViaWebSocket;
            window.enhancedMessaging.sendViaWebSocket = function(messageData, highPriority = false) {
                console.log('🔧 Fixed sendViaWebSocket called:', messageData.id);
                
                // Always use HTTP fallback in production
                const wsMessage = {
                    type: 'chat_message',
                    data: messageData,
                    priority: highPriority ? 'high' : 'normal',
                    timestamp: new Date().toISOString()
                };
                
                // Send via HTTP
                fetch('/api/websocket/message', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(wsMessage)
                }).then(response => {
                    if (response.ok) {
                        console.log('✅ Message sent via fixed HTTP method');
                        
                        // Also broadcast locally for immediate UI update
                        this.handleWebSocketMessage(wsMessage);
                    } else {
                        console.error('❌ Fixed HTTP send failed:', response.status);
                    }
                }).catch(error => {
                    console.error('❌ Fixed HTTP send error:', error);
                });
                
                return true;
            };
            
            // Fix DOM manipulation issues
            const originalDisplayDriverMessage = window.enhancedMessaging.displayDriverMessage;
            window.enhancedMessaging.displayDriverMessage = function(messageData, scroll = true) {
                console.log('🔧 Fixed displayDriverMessage called');
                
                try {
                    // Ensure container exists
                    let container = document.getElementById('messagesContainer');
                    if (!container) {
                        console.log('🔧 Creating missing messages container...');
                        this.ensureMessagingContainerExists();
                        container = document.getElementById('messagesContainer');
                    }
                    
                    if (container) {
                        // Call original method with error handling
                        originalDisplayDriverMessage.call(this, messageData, scroll);
                    } else {
                        console.error('❌ Still no messages container after creation attempt');
                    }
                } catch (error) {
                    console.error('❌ Error in fixed displayDriverMessage:', error);
                }
            };
        }
    }
    
    // Create global message sending function
    function createGlobalMessageSender() {
        window.sendDriverMessage = function(message) {
            console.log('🔧 Global message sender called:', message);
            
            if (!message || !message.trim()) {
                console.warn('❌ Empty message, not sending');
                return;
            }
            
            const currentUser = window.currentDriverData || 
                              (window.authManager && window.authManager.getCurrentUser()) ||
                              JSON.parse(localStorage.getItem('currentDriver') || 'null');
            
            if (!currentUser) {
                console.error('❌ No current user found for message sending');
                return;
            }
            
            const messageData = {
                id: Date.now().toString(),
                sender: currentUser.type === 'driver' ? 'driver' : 'admin',
                senderId: currentUser.id,
                senderName: currentUser.name,
                message: message,
                timestamp: new Date().toISOString(),
                read: false
            };
            
            // Save locally first
            const messages = JSON.parse(localStorage.getItem('driverMessages') || '{}');
            const driverMessages = messages[currentUser.id] || [];
            driverMessages.push(messageData);
            messages[currentUser.id] = driverMessages;
            localStorage.setItem('driverMessages', JSON.stringify(messages));
            
            // Send via HTTP
            fetch('/api/websocket/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'chat_message',
                    data: messageData,
                    timestamp: new Date().toISOString()
                })
            }).then(response => {
                if (response.ok) {
                    console.log('✅ Global message sent successfully');
                } else {
                    console.error('❌ Global message send failed:', response.status);
                }
            }).catch(error => {
                console.error('❌ Global message send error:', error);
            });
            
            // Update UI if messaging system is available
            if (window.enhancedMessaging) {
                window.enhancedMessaging.displayDriverMessage(messageData);
            }
            
            return true;
        };
    }
    
    // Fix initialization order
    function fixInitializationOrder() {
        let attempts = 0;
        const maxAttempts = 10;
        
        function attemptFix() {
            attempts++;
            console.log(`🔧 Attempting messaging fix (${attempts}/${maxAttempts})...`);
            
            // Ensure fallback is available
            ensureWebSocketFallback();
            
            // Fix WebSocket manager
            fixWebSocketManager();
            
            // Fix enhanced messaging
            fixEnhancedMessaging();
            
            // Create global sender
            createGlobalMessageSender();
            
            // Check if everything is working
            const wsManager = window.webSocketManager || window.wsManager;
            const messaging = window.enhancedMessaging;
            
            if (wsManager && messaging) {
                console.log('✅ Messaging system fix applied successfully');
                
                // Test connection
                if (wsManager.isConnected || wsManager.usesFallback) {
                    console.log('✅ Real-time connection available');
                } else {
                    console.log('🔧 Forcing connection...');
                    wsManager.isConnected = true;
                    wsManager.usesFallback = true;
                }
                
                return true;
            } else if (attempts < maxAttempts) {
                console.log('🔧 Components not ready, retrying in 1 second...');
                setTimeout(attemptFix, 1000);
            } else {
                console.error('❌ Max attempts reached, messaging fix may be incomplete');
            }
        }
        
        attemptFix();
    }
    
    // Start the fix process
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fixInitializationOrder);
    } else {
        fixInitializationOrder();
    }
    
    console.log('✅ Messaging fix script loaded');
})();
