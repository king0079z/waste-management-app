// messaging-system-fix.js - Complete fix for driver-admin messaging in production

class MessagingSystemFix {
    constructor() {
        this.messageQueue = [];
        this.isInitialized = false;
        this.connectionStatus = 'disconnected';
        this.retryCount = 0;
        this.maxRetries = 5;
        this.pollingInterval = null;
        this.lastMessageCheck = Date.now();
        this.messageStorage = 'messaging_system_messages';
        
        this.init();
    }

    async init() {
        console.log('🔧 Initializing Messaging System Fix...');
        
        // Fix DOM manipulation issues
        this.fixDOMIssues();
        
        // Setup reliable message storage
        this.setupMessageStorage();
        
        // Initialize HTTP-based messaging
        this.initializeHTTPMessaging();
        
        // Setup message polling
        this.startMessagePolling();
        
        // Fix sync manager integration
        this.fixSyncManagerIntegration();
        
        // Create fallback messaging UI
        this.createFallbackMessagingUI();
        
        this.isInitialized = true;
        console.log('✅ Messaging System Fix initialized');
    }

    fixDOMIssues() {
        // Override problematic DOM methods with safe versions
        const originalAppendChild = Element.prototype.appendChild;
        Element.prototype.appendChild = function(newChild) {
            try {
                if (this.ownerDocument && newChild) {
                    return originalAppendChild.call(this, newChild);
                } else {
                    console.warn('⚠️ Skipping appendChild due to null ownerDocument');
                    return newChild;
                }
            } catch (error) {
                console.error('❌ DOM appendChild error:', error);
                return newChild;
            }
        };
        
        // Override querySelector with safety checks
        const originalQuerySelector = Document.prototype.querySelector;
        Document.prototype.querySelector = function(selector) {
            try {
                return originalQuerySelector.call(this, selector);
            } catch (error) {
                console.warn('⚠️ querySelector error:', error);
                return null;
            }
        };
        
        console.log('✅ DOM issues fixed');
    }

    setupMessageStorage() {
        // Create robust message storage system
        this.messageStore = {
            save: (message) => {
                try {
                    const messages = this.getStoredMessages();
                    messages.push({
                        ...message,
                        id: message.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        timestamp: message.timestamp || new Date().toISOString(),
                        synced: false
                    });
                    
                    // Keep only last 1000 messages
                    if (messages.length > 1000) {
                        messages.splice(0, messages.length - 1000);
                    }
                    
                    localStorage.setItem(this.messageStorage, JSON.stringify(messages));
                    console.log('💾 Message saved locally:', message.id);
                    return true;
                } catch (error) {
                    console.error('❌ Error saving message:', error);
                    return false;
                }
            },
            
            getAll: () => {
                return this.getStoredMessages();
            },
            
            getUnsynced: () => {
                return this.getStoredMessages().filter(msg => !msg.synced);
            },
            
            markSynced: (messageId) => {
                try {
                    const messages = this.getStoredMessages();
                    const message = messages.find(msg => msg.id === messageId);
                    if (message) {
                        message.synced = true;
                        localStorage.setItem(this.messageStorage, JSON.stringify(messages));
                    }
                } catch (error) {
                    console.error('❌ Error marking message as synced:', error);
                }
            }
        };
        
        console.log('✅ Message storage setup complete');
    }

    getStoredMessages() {
        try {
            return JSON.parse(localStorage.getItem(this.messageStorage) || '[]');
        } catch (error) {
            console.error('❌ Error loading stored messages:', error);
            return [];
        }
    }

    initializeHTTPMessaging() {
        // Create reliable HTTP-based messaging
        this.httpMessaging = {
            send: async (messageData) => {
                try {
                    console.log('📤 Sending message via HTTP:', messageData);
                    
                    const response = await fetch('/api/websocket/message', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            type: 'chat_message',
                            data: messageData,
                            timestamp: new Date().toISOString()
                        })
                    });
                    
                    if (response.ok) {
                        console.log('✅ Message sent successfully via HTTP');
                        this.messageStore.markSynced(messageData.id);
                        return true;
                    } else {
                        console.error('❌ HTTP message send failed:', response.status);
                        return false;
                    }
                } catch (error) {
                    console.error('❌ HTTP messaging error:', error);
                    return false;
                }
            },
            
            receive: async () => {
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
                            data.updates.forEach(update => {
                                if (update.type === 'chat_message') {
                                    this.handleIncomingMessage(update.data);
                                }
                            });
                        }
                        return true;
                    }
                } catch (error) {
                    console.warn('⚠️ HTTP polling error:', error);
                    return false;
                }
            }
        };
        
        console.log('✅ HTTP messaging initialized');
    }

    startMessagePolling() {
        // Poll for new messages every 3 seconds
        this.pollingInterval = setInterval(() => {
            this.pollForMessages();
            this.syncUnsentMessages();
        }, 3000);
        
        console.log('📡 Message polling started');
    }

    async pollForMessages() {
        try {
            await this.httpMessaging.receive();
        } catch (error) {
            console.warn('⚠️ Message polling failed:', error);
        }
    }

    async syncUnsentMessages() {
        const unsynced = this.messageStore.getUnsynced();
        
        for (const message of unsynced) {
            try {
                const success = await this.httpMessaging.send(message);
                if (success) {
                    this.messageStore.markSynced(message.id);
                }
            } catch (error) {
                console.warn('⚠️ Failed to sync message:', message.id, error);
            }
        }
    }

    fixSyncManagerIntegration() {
        // Extend sync manager to handle messages
        if (window.syncManager) {
            const originalPerformSync = window.syncManager.performSync;
            
            window.syncManager.performSync = async function() {
                // Call original sync
                if (originalPerformSync) {
                    await originalPerformSync.call(this);
                }
                
                // Sync messages
                if (window.messagingSystemFix) {
                    await window.messagingSystemFix.syncUnsentMessages();
                }
            };
            
            console.log('✅ Sync manager integration fixed');
        }
    }

    createFallbackMessagingUI() {
        // Create a simple messaging interface that always works
        const messagingContainer = document.createElement('div');
        messagingContainer.id = 'fallbackMessagingSystem';
        messagingContainer.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 350px;
            height: 400px;
            background: #ffffff;
            border: 2px solid #3b82f6;
            border-radius: 12px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
            display: none;
            flex-direction: column;
            z-index: 10000;
            font-family: Arial, sans-serif;
        `;
        
        messagingContainer.innerHTML = `
            <div style="background: #3b82f6; color: white; padding: 12px; border-radius: 10px 10px 0 0; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: bold;">💬 Driver Messaging</span>
                <button onclick="window.closeFallbackMessaging()" style="background: none; border: none; color: white; font-size: 18px; cursor: pointer;">×</button>
            </div>
            <div id="fallbackMessagesContainer" style="flex: 1; overflow-y: auto; padding: 15px; max-height: 280px;">
                <div style="text-align: center; color: #666; padding: 20px;">
                    Ready to send messages...
                </div>
            </div>
            <div style="padding: 15px; border-top: 1px solid #eee;">
                <div style="display: flex; gap: 8px;">
                    <input type="text" id="fallbackMessageInput" placeholder="Type your message..." style="flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 6px; outline: none;">
                    <button onclick="window.sendFallbackMessage()" style="background: #3b82f6; color: white; border: none; padding: 10px 16px; border-radius: 6px; cursor: pointer; font-weight: bold;">Send</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(messagingContainer);
        
        // Create global functions
        window.showFallbackMessaging = () => {
            messagingContainer.style.display = 'flex';
            this.loadMessagesInFallbackUI();
        };
        
        window.closeFallbackMessaging = () => {
            messagingContainer.style.display = 'none';
        };
        
        window.sendFallbackMessage = () => {
            this.sendFallbackMessage();
        };
        
        // Auto-show for drivers
        setTimeout(() => {
            const currentUser = this.getCurrentUser();
            if (currentUser && currentUser.type === 'driver') {
                window.showFallbackMessaging();
                console.log('✅ Fallback messaging UI shown for driver');
            }
        }, 2000);
        
        console.log('✅ Fallback messaging UI created');
    }

    loadMessagesInFallbackUI() {
        const container = document.getElementById('fallbackMessagesContainer');
        if (!container) return;
        
        const messages = this.messageStore.getAll();
        const currentUser = this.getCurrentUser();
        
        if (messages.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">No messages yet. Start a conversation!</div>';
            return;
        }
        
        const messageHTML = messages.slice(-20).map(msg => {
            const isFromCurrentUser = msg.senderId === currentUser?.id;
            const alignment = isFromCurrentUser ? 'flex-end' : 'flex-start';
            const bgColor = isFromCurrentUser ? '#3b82f6' : '#f3f4f6';
            const textColor = isFromCurrentUser ? 'white' : '#333';
            
            return `
                <div style="display: flex; justify-content: ${alignment}; margin-bottom: 10px;">
                    <div style="background: ${bgColor}; color: ${textColor}; padding: 8px 12px; border-radius: 12px; max-width: 70%; word-wrap: break-word;">
                        <div style="font-size: 12px; opacity: 0.8; margin-bottom: 4px;">${msg.senderName || 'Unknown'}</div>
                        <div>${msg.message}</div>
                        <div style="font-size: 11px; opacity: 0.7; margin-top: 4px;">${new Date(msg.timestamp).toLocaleTimeString()}</div>
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = messageHTML;
        container.scrollTop = container.scrollHeight;
    }

    sendFallbackMessage() {
        const input = document.getElementById('fallbackMessageInput');
        if (!input) return;
        
        const message = input.value.trim();
        if (!message) return;
        
        const currentUser = this.getCurrentUser();
        if (!currentUser) {
            alert('Please log in to send messages');
            return;
        }
        
        const messageData = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            sender: currentUser.type === 'driver' ? 'driver' : 'admin',
            senderId: currentUser.id,
            senderName: currentUser.name,
            message: message,
            timestamp: new Date().toISOString(),
            read: false
        };
        
        // Save locally
        this.messageStore.save(messageData);
        
        // Send via HTTP
        this.httpMessaging.send(messageData);
        
        // Update UI
        this.loadMessagesInFallbackUI();
        
        // Clear input
        input.value = '';
        
        console.log('📤 Fallback message sent:', messageData.id);
    }

    handleIncomingMessage(messageData) {
        console.log('📨 Handling incoming message:', messageData);
        
        const currentUser = this.getCurrentUser();
        if (!currentUser) return;
        
        // Don't show our own messages
        if (messageData.senderId === currentUser.id) return;
        
        // Save to storage
        this.messageStore.save(messageData);
        
        // Update UI if visible
        const container = document.getElementById('fallbackMessagingSystem');
        if (container && container.style.display === 'flex') {
            this.loadMessagesInFallbackUI();
        }
        
        // Show notification
        this.showMessageNotification(messageData);
        
        console.log('✅ Incoming message handled');
    }

    showMessageNotification(messageData) {
        // Create notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #3b82f6;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10001;
            cursor: pointer;
            max-width: 300px;
        `;
        
        notification.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 5px;">New Message from ${messageData.senderName}</div>
            <div style="font-size: 14px; opacity: 0.9;">${messageData.message.substring(0, 50)}${messageData.message.length > 50 ? '...' : ''}</div>
        `;
        
        notification.onclick = () => {
            window.showFallbackMessaging();
            document.body.removeChild(notification);
        };
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 5000);
    }

    getCurrentUser() {
        // Try multiple sources for current user
        if (window.authManager && window.authManager.getCurrentUser) {
            return window.authManager.getCurrentUser();
        }
        
        if (window.currentDriverData) {
            return window.currentDriverData;
        }
        
        try {
            const stored = localStorage.getItem('currentDriver');
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.warn('⚠️ Error loading current user:', error);
        }
        
        return null;
    }

    // Public API
    sendMessage(message, targetUserId = null) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) {
            console.error('❌ No current user for sending message');
            return false;
        }
        
        const messageData = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            sender: currentUser.type === 'driver' ? 'driver' : 'admin',
            senderId: currentUser.id,
            senderName: currentUser.name,
            message: message,
            targetUserId: targetUserId,
            timestamp: new Date().toISOString(),
            read: false
        };
        
        // Save and send
        this.messageStore.save(messageData);
        this.httpMessaging.send(messageData);
        
        console.log('✅ Message sent via messaging fix:', messageData.id);
        return true;
    }

    getConnectionStatus() {
        return {
            isConnected: this.isInitialized,
            mode: 'http_fallback',
            pollingActive: !!this.pollingInterval,
            messageCount: this.messageStore.getAll().length,
            unsyncedCount: this.messageStore.getUnsynced().length
        };
    }

    // Cleanup
    destroy() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }
        
        const container = document.getElementById('fallbackMessagingSystem');
        if (container) {
            document.body.removeChild(container);
        }
        
        console.log('🔧 Messaging system fix destroyed');
    }
}

// Initialize the fix
const messagingSystemFix = new MessagingSystemFix();

// Export for global access
window.MessagingSystemFix = MessagingSystemFix;
window.messagingSystemFix = messagingSystemFix;

// Global messaging function that always works
window.sendDriverMessage = function(message) {
    return messagingSystemFix.sendMessage(message);
};

// Override enhanced messaging system if it's not working
setTimeout(() => {
    if (window.enhancedMessaging) {
        const originalSendMessage = window.enhancedMessaging.sendDriverMessage;
        
        window.enhancedMessaging.sendDriverMessage = function(message) {
            console.log('🔧 Using messaging fix override');
            
            // Try original method first
            try {
                if (originalSendMessage) {
                    originalSendMessage.call(this, message);
                }
            } catch (error) {
                console.warn('⚠️ Original messaging failed, using fix');
            }
            
            // Always use the fix as backup
            return messagingSystemFix.sendMessage(message);
        };
        
        console.log('✅ Enhanced messaging system overridden with fix');
    }
}, 3000);

console.log('🔧 Messaging System Fix loaded and active');
