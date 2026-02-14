// Enhanced Messaging System - Real-time Communication between Drivers and Management
// Integrates with existing WebSocket system and provides comprehensive chat functionality

class EnhancedMessagingSystem {
    constructor() {
        this.currentUser = null;
        this.currentDriverId = null;
        this.messages = {};
        this.unreadCounts = {};
        this.typingTimeouts = {};
        this.messageSound = null;
        this.isMessagingExpanded = true;
        this.driverMessagePollInterval = null; // Poll for new messages when driver (mobile WebSocket can be suspended)
        // Debounce and guard to prevent multiple concurrent loads from freezing the UI (e.g. when tab returns from background)
        this._loadDriverMessagesDebounceTimer = null;
        this._loadDriverMessagesInProgress = false;
        this._loadDriverMessagesPendingId = null;
        this._loadAdminMessagesDebounceTimer = null;
        this._loadAdminMessagesInProgress = false;
        this._loadAdminMessagesPendingId = null;
        this._handleStorageUpdateTimer = null;
        this._saveMessagesToStorageTimer = null;
        this._saveMessagesPending = false;
        this.MAX_STORED_MESSAGES_PER_DRIVER = 300;

        this.init();
    }

    init() {
        console.log('🎯 Initializing Enhanced Messaging System...');
        
        // Initialize message storage
        this.loadMessagesFromStorage();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize current user context
        this.updateCurrentUser();
        
        // Setup message sound
        this.setupMessageSound();
        
        // Initialize messaging interface
        this.initializeMessagingInterface();
        
        // So driver bottom nav message badge shows on load if there are unread messages
        setTimeout(() => {
            this.updateCurrentUser();
            this.updateUnreadBadges();
            document.dispatchEvent(new CustomEvent('driverNavBadgesRefresh'));
        }, 500);
        
        console.log('✅ Enhanced Messaging System initialized');
    }

    setupEventListeners() {
        // Driver message input event listeners
        const driverInput = document.getElementById('driverMessageInput');
        if (driverInput) {
            driverInput.addEventListener('input', (e) => {
                this.handleDriverMessageInput(e);
            });
            
            driverInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendDriverMessage();
                }
            });
        }

        // Admin message input event listeners
        const adminInput = document.getElementById('adminMessageInput');
        if (adminInput) {
            adminInput.addEventListener('input', (e) => {
                this.handleAdminMessageInput(e);
            });
            
            adminInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendAdminMessage();
                }
            });
        }

        // Listen for storage events to sync messages across tabs
        window.addEventListener('storage', (e) => {
            if (e.key === 'driverMessages') {
                this.handleStorageUpdate(e.newValue);
            }
        });

        // Listen for WebSocket messages
        if (window.webSocketManager) {
            window.webSocketManager.addEventListener('message', (data) => {
                this.handleWebSocketMessage(data);
            });
        }
        
        // When tab is hidden: stop polling. When visible: defer load so we don't block (avoids "page unresponsive" on mobile)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.stopDriverMessagePoll();
                return;
            }
            this.updateCurrentUser();
            if (this.currentUser && this.currentUser.type === 'driver' && this.currentUser.id) {
                const driverId = this.currentUser.id;
                setTimeout(() => this.loadDriverMessagesDebounced(driverId), 2800);
                setTimeout(() => this.startDriverMessagePoll(), 4500);
            }
        });
    }

    setupMessageSound() {
        try {
            // Create audio context for message notifications
            this.messageSound = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjeCzfLPfiMKJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjeCzfLPfiMKJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjeCzfLPfiMKJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjeCzfLPfiMKJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjeCzfLPfiMKJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjeCzfLPfiMKJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjeCzfLPfiMKJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjeCzfLPfiMKJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjeCzfLPfiMKJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjeCzfLPfiMKJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjeCzfLPfiMKJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjeCzfLPfiMKJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjeCzfLPfiMKJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjeCzfLPfiMKJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjeCzfLPfiMKJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjeCzfLPfiMKJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjeCzfLPfiMKJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjeCzfLPfiMKJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjeCzfLPfiMKJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjeCzfLPfiMKJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjeCzfLPfiMKJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjeCzfLPfiMK');
            this.messageSound.volume = 0.3;
        } catch (error) {
            console.warn('⚠️ Could not initialize message sound:', error);
        }
    }

    updateCurrentUser() {
        if (window.authManager) {
            this.currentUser = window.authManager.getCurrentUser();
            console.log('👤 Current user updated:', this.currentUser?.id, this.currentUser?.type);
        }
    }

    initializeMessagingInterface() {
        this.updateCurrentUser();
        
        if (this.currentUser) {
            if (this.currentUser.type === 'driver') {
                this.initializeDriverMessaging();
            } else {
                this.initializeAdminMessaging();
            }
        }
    }

    stopDriverMessagePoll() {
        if (this.driverMessagePollInterval) {
            clearInterval(this.driverMessagePollInterval);
            this.driverMessagePollInterval = null;
        }
    }

    startDriverMessagePoll() {
        if (document.hidden || !this.currentUser || this.currentUser.type !== 'driver' || !this.currentUser.id) return;
        this.stopDriverMessagePoll();
        const pollIntervalMs = 12000; // 12 seconds
        this.driverMessagePollInterval = setInterval(() => {
            if (document.hidden || !this.currentUser || this.currentUser.type !== 'driver' || !this.currentUser.id) return;
            const content = document.getElementById('messagingContent');
            if (content && !content.classList.contains('collapsed')) return;
            this.loadDriverMessagesDebounced(this.currentUser.id);
        }, pollIntervalMs);
    }

    initializeDriverMessaging() {
        console.log('🚛 Initializing driver messaging interface');
        
        this.stopDriverMessagePoll();
        
        // Load messages for driver (debounced so visibilitychange + init don't double-run)
        this.loadDriverMessagesDebounced(this.currentUser.id);
        
        // Poll only when tab is visible; when hidden we stop the poll so returning to tab doesn't fire many queued callbacks
        this.startDriverMessagePoll();
        
        // Show messaging system
        const messagingSystem = document.getElementById('driverMessagingSystem');
        if (messagingSystem) {
            messagingSystem.style.display = 'block';
            messagingSystem.style.visibility = 'visible';
            
            // Scroll to bottom to show input area after a short delay
            setTimeout(() => {
                messagingSystem.scrollTop = messagingSystem.scrollHeight;
                console.log('🔥 Scrolled driver messaging system to bottom for input access');
            }, 500);
        }
    }

    initializeAdminMessaging() {
        console.log('👨‍💼 Initializing admin messaging interface');
        
        if (this.driverMessagePollInterval) {
            clearInterval(this.driverMessagePollInterval);
            this.driverMessagePollInterval = null;
        }
        
        // Admin messaging will be initialized when driver details modal opens
        this.setupAdminMessagingForCurrentDriver();
    }

    loadMessagesFromStorage() {
        try {
            const storedMessages = localStorage.getItem('driverMessages');
            if (storedMessages) {
                this.messages = JSON.parse(storedMessages);
            }

            const storedUnreadCounts = localStorage.getItem('unreadMessageCounts');
            if (storedUnreadCounts) {
                this.unreadCounts = JSON.parse(storedUnreadCounts);
            }
        } catch (error) {
            console.error('❌ Error loading messages from storage:', error);
            this.messages = {};
            this.unreadCounts = {};
        }
    }

    saveMessagesToStorage() {
        try {
            localStorage.setItem('driverMessages', JSON.stringify(this.messages));
            localStorage.setItem('unreadMessageCounts', JSON.stringify(this.unreadCounts));
        } catch (error) {
            console.error('❌ Error saving messages to storage:', error);
        }
    }

    saveMessagesToStorageDebounced() {
        if (this._saveMessagesToStorageTimer) clearTimeout(this._saveMessagesToStorageTimer);
        this._saveMessagesPending = true;
        const self = this;
        this._saveMessagesToStorageTimer = setTimeout(function() {
            self._saveMessagesToStorageTimer = null;
            self._saveMessagesPending = false;
            const doWrite = function() {
                try {
                    localStorage.setItem('driverMessages', JSON.stringify(self.messages));
                    localStorage.setItem('unreadMessageCounts', JSON.stringify(self.unreadCounts));
                } catch (e) {
                    console.error('❌ Error saving messages to storage:', e);
                }
            };
            if (typeof requestIdleCallback !== 'undefined') {
                requestIdleCallback(doWrite, { timeout: 2000 });
            } else {
                setTimeout(doWrite, 0);
            }
        }, 600);
    }

    // ================== DRIVER MESSAGING FUNCTIONS ==================

    handleDriverMessageInput(event) {
        const input = event.target;
        const sendBtn = document.getElementById('sendMessageBtn');
        
        // Enable/disable send button based on input
        if (sendBtn) {
            sendBtn.disabled = input.value.trim().length === 0;
        }

        // Show typing indicator to admin
        this.sendTypingIndicator('driver', this.currentUser.id);
    }

    sendDriverMessage() {
        const input = document.getElementById('driverMessageInput');
        if (!input || !input.value.trim()) return;

        const message = input.value.trim();
        const messageData = {
            id: Date.now().toString(),
            sender: 'driver',
            senderName: this.currentUser.name || 'Driver',
            senderId: this.currentUser.id,
            message: message,
            timestamp: new Date().toISOString(),
            type: 'text',
            status: 'sent'
        };

        this.addMessage(this.currentUser.id, messageData);
        this.displayDriverMessage(messageData);
        
        // Clear input
        input.value = '';
        const sendBtn = document.getElementById('sendMessageBtn');
        if (sendBtn) sendBtn.disabled = true;

        // Send via WebSocket if available
        this.sendViaWebSocket(messageData);

        // Play send sound
        this.playMessageSound();

        console.log('📤 Driver message sent:', message);
    }

    sendQuickReply(message) {
        const now = Date.now();
        if (this._lastQuickReply && this._lastQuickReply.text === message && (now - this._lastQuickReply.at) < 2000) {
            return;
        }
        this._lastQuickReply = { text: message, at: now };

        const messageData = {
            id: Date.now().toString(),
            sender: 'driver',
            senderName: this.currentUser.name || 'Driver',
            senderId: this.currentUser.id,
            message: message,
            timestamp: new Date().toISOString(),
            type: 'quick_reply',
            status: 'sent'
        };

        this.addMessage(this.currentUser.id, messageData);
        this.displayDriverMessage(messageData);

        this.sendViaWebSocket(messageData);
        this.playMessageSound();

        console.log('⚡ Quick reply sent:', message);
    }

    sendEmergencyMessage() {
        const location = this.getCurrentLocation();
        const emergencyMessage = `🚨 EMERGENCY ALERT 🚨\n\nImmediate assistance required at my current location.\n\nLocation: ${location}\nTime: ${new Date().toLocaleString()}\n\nPlease respond ASAP.`;
        
        const messageData = {
            id: Date.now().toString(),
            sender: 'driver',
            senderName: this.currentUser.name || 'Driver',
            senderId: this.currentUser.id,
            message: emergencyMessage,
            timestamp: new Date().toISOString(),
            type: 'emergency',
            status: 'sent',
            priority: 'high'
        };

        this.addMessage(this.currentUser.id, messageData);
        this.displayDriverMessage(messageData, true);
        
        // Send via WebSocket with high priority
        this.sendViaWebSocket(messageData, true);
        
        // Play emergency sound
        this.playEmergencySound();

        // Show confirmation
        if (window.app) {
            window.app.showAlert('Emergency Alert Sent', 'Your emergency alert has been sent to management. Help is on the way.', 'error', 5000);
        }

        console.log('🚨 Emergency message sent');
    }

    loadDriverMessagesDebounced(driverId) {
        if (this._loadDriverMessagesDebounceTimer) clearTimeout(this._loadDriverMessagesDebounceTimer);
        this._loadDriverMessagesDebounceTimer = setTimeout(() => {
            this._loadDriverMessagesDebounceTimer = null;
            this.loadDriverMessages(driverId);
        }, 400);
    }

    async loadDriverMessages(driverId) {
        if (this._loadDriverMessagesInProgress) {
            this._loadDriverMessagesPendingId = driverId;
            return;
        }
        const container = document.getElementById('messagesContainer');
        if (!container) return;

        this._loadDriverMessagesInProgress = true;
        try {
            await this._loadDriverMessagesImpl(driverId);
        } finally {
            this._loadDriverMessagesInProgress = false;
            const pending = this._loadDriverMessagesPendingId;
            this._loadDriverMessagesPendingId = null;
            if (pending) this.loadDriverMessagesDebounced(pending);
        }
    }

    async _loadDriverMessagesImpl(driverId) {
        const container = document.getElementById('messagesContainer');
        if (!container) return;

        // World-class: always fetch full history from server so driver sees messages sent while offline
        const baseUrl = (typeof syncManager !== 'undefined' && syncManager.baseUrl) ? syncManager.baseUrl.replace(/\/$/, '') : '';
        const fetchTimeoutMs = 12000;
        let res;
        try {
            const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
            const timeoutId = ctrl ? setTimeout(() => ctrl.abort(), fetchTimeoutMs) : null;
            res = await fetch(`${baseUrl}/api/driver/${encodeURIComponent(driverId)}/messages`, { signal: ctrl ? ctrl.signal : undefined });
            if (timeoutId) clearTimeout(timeoutId);
            if (res.ok) {
                const data = await res.json();
                const serverMessages = Array.isArray(data.messages) ? data.messages : [];
                const localMessages = this.messages[driverId] || [];
                const byId = new Map();
                [...serverMessages, ...localMessages].forEach(m => {
                    const id = m.id || m.timestamp;
                    if (!byId.has(id) || (m.serverTimestamp && !byId.get(id).serverTimestamp)) byId.set(id, m);
                });
                const merged = Array.from(byId.values()).sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0));
                const max = this.MAX_STORED_MESSAGES_PER_DRIVER;
                this.messages[driverId] = merged.length > max ? merged.slice(-max) : merged;
                this.saveMessagesToStorageDebounced();
            }
        } catch (e) {
            console.warn('Could not load driver message history from server:', e.message);
        }

        const messages = this.messages[driverId] || [];
        const welcomeMessage = container.querySelector('.welcome-message');
        container.innerHTML = '';

        if (messages.length === 0) {
            if (welcomeMessage) container.appendChild(welcomeMessage);
        } else {
            const BATCH = 25;
            if (messages.length <= BATCH) {
                messages.forEach(message => this.displayDriverMessage(message, false));
                this.scrollToBottom(container);
            } else {
                let idx = 0;
                const renderBatch = () => {
                    const end = Math.min(idx + BATCH, messages.length);
                    for (; idx < end; idx++) this.displayDriverMessage(messages[idx], false);
                    if (idx < messages.length) requestAnimationFrame(renderBatch);
                    else this.scrollToBottom(container);
                };
                requestAnimationFrame(renderBatch);
            }
        }

        this.markMessagesAsRead(driverId, 'driver');
    }

    displayDriverMessage(messageData, scroll = true) {
        const container = document.getElementById('messagesContainer');
        if (!container) {
            console.error('❌ messagesContainer not found!');
            this.ensureMessagingContainerExists();
            return;
        }

        const welcomeMessage = container.querySelector('.welcome-message');
        if (welcomeMessage) welcomeMessage.remove();

        try {
            const messageElement = this.createMessageBubble(messageData);
            if (messageElement && container.ownerDocument) {
                container.appendChild(messageElement);
            } else {
                console.error('❌ Failed to create message element or container invalid');
                return;
            }
        } catch (error) {
            console.error('❌ Error creating/adding message bubble:', error);
            return;
        }

        if (scroll) this.scrollToBottom(container);
        
        const messagingSystem = document.getElementById('driverMessagingSystem');
        if (messagingSystem) {
            if (messagingSystem.style.display === 'none') messagingSystem.style.display = 'block';
            setTimeout(() => {
                try {
                    const inputContainer = messagingSystem.querySelector('.message-input-container');
                    if (inputContainer) messagingSystem.scrollTop = messagingSystem.scrollHeight;
                } catch (e) { /* ignore */ }
            }, 100);
        }
    }

    ensureMessagingContainerExists() {
        console.log('🔧 Ensuring messaging container exists...');
        
        let messagingSystem = document.getElementById('driverMessagingSystem');
        if (!messagingSystem) {
            console.log('🔧 Creating messaging system container...');
            messagingSystem = document.createElement('div');
            messagingSystem.id = 'driverMessagingSystem';
            messagingSystem.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 350px;
                height: 400px;
                background: white;
                border: 1px solid #ddd;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                display: flex;
                flex-direction: column;
                z-index: 1000;
            `;
            document.body.appendChild(messagingSystem);
        }
        
        let container = document.getElementById('messagesContainer');
        if (!container) {
            console.log('🔧 Creating messages container...');
            container = document.createElement('div');
            container.id = 'messagesContainer';
            container.style.cssText = `
                flex: 1;
                overflow-y: auto;
                padding: 10px;
            `;
            messagingSystem.appendChild(container);
        }
        
        console.log('✅ Messaging container ensured');
    }

    // ================== ADMIN MESSAGING FUNCTIONS ==================

    setupAdminMessagingForCurrentDriver() {
        // This will be called when opening driver details modal
        if (this.currentDriverId) {
            this.loadAdminMessages(this.currentDriverId);
        }
    }

    setCurrentDriverForAdmin(driverId) {
        this.currentDriverId = driverId;
        console.log('👨‍💼 Admin messaging set for driver:', driverId);
        
        // Load messages for this driver
        this.loadAdminMessages(driverId);
        
        // Update UI elements
        this.updateAdminDriverInfo(driverId);
    }

    handleAdminMessageInput(event) {
        const input = event.target;
        const sendBtn = document.getElementById('adminSendBtn');
        
        // Enable/disable send button
        if (sendBtn) {
            sendBtn.disabled = input.value.trim().length === 0;
        }

        // Show typing indicator to driver
        this.sendTypingIndicator('admin', this.currentDriverId);
    }

    sendAdminMessage() {
        const input = document.getElementById('adminMessageInput');
        if (!input || !input.value.trim() || !this.currentDriverId) return;

        const message = input.value.trim();
        const messageData = {
            id: Date.now().toString(),
            sender: 'admin',
            senderName: 'Management Team',
            senderId: 'admin',
            message: message,
            timestamp: new Date().toISOString(),
            type: 'text',
            status: 'sent'
        };

        this.addMessage(this.currentDriverId, messageData);
        this.displayAdminMessage(messageData);
        
        // Clear input
        input.value = '';
        const sendBtn = document.getElementById('adminSendBtn');
        if (sendBtn) sendBtn.disabled = true;

        // Send via WebSocket
        this.sendViaWebSocket(messageData);

        // Play send sound
        this.playMessageSound();

        // Update statistics
        this.updateMessageStatistics();
    }

    sendAdminQuickMessage(message) {
        if (!this.currentDriverId) return;

        const messageData = {
            id: Date.now().toString(),
            sender: 'admin',
            senderName: 'Management Team',
            senderId: 'admin',
            message: message,
            timestamp: new Date().toISOString(),
            type: 'quick_message',
            status: 'sent'
        };

        this.addMessage(this.currentDriverId, messageData);
        this.displayAdminMessage(messageData);
        
        // Send via WebSocket
        this.sendViaWebSocket(messageData);
        
        // Play send sound
        this.playMessageSound();

        // Update statistics
        this.updateMessageStatistics();
    }

    loadAdminMessagesDebounced(driverId) {
        if (this._loadAdminMessagesDebounceTimer) clearTimeout(this._loadAdminMessagesDebounceTimer);
        this._loadAdminMessagesDebounceTimer = setTimeout(() => {
            this._loadAdminMessagesDebounceTimer = null;
            this.loadAdminMessages(driverId);
        }, 400);
    }

    async loadAdminMessages(driverId) {
        if (this._loadAdminMessagesInProgress) {
            this._loadAdminMessagesPendingId = driverId;
            return;
        }
        const container = document.getElementById('adminMessagesHistory');
        if (!container) return;

        this._loadAdminMessagesInProgress = true;
        try {
            await this._loadAdminMessagesImpl(driverId);
        } finally {
            this._loadAdminMessagesInProgress = false;
            const pending = this._loadAdminMessagesPendingId;
            this._loadAdminMessagesPendingId = null;
            if (pending) this.loadAdminMessagesDebounced(pending);
        }
    }

    async _loadAdminMessagesImpl(driverId) {
        const container = document.getElementById('adminMessagesHistory');
        if (!container) return;

        // Fetch all previous communications from server so manager sees full history
        const baseUrl = (typeof syncManager !== 'undefined' && syncManager.baseUrl) ? syncManager.baseUrl.replace(/\/$/, '') : '';
        try {
            const res = await fetch(`${baseUrl}/api/driver/${encodeURIComponent(driverId)}/messages`);
            if (res.ok) {
                const data = await res.json();
                const serverMessages = Array.isArray(data.messages) ? data.messages : [];
                const localMessages = this.messages[driverId] || [];
                const byId = new Map();
                [...serverMessages, ...localMessages].forEach(m => {
                    const id = m.id || m.timestamp;
                    if (!byId.has(id) || (m.serverTimestamp && !byId.get(id).serverTimestamp)) byId.set(id, m);
                });
                const merged = Array.from(byId.values()).sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0));
                const max = this.MAX_STORED_MESSAGES_PER_DRIVER;
                this.messages[driverId] = merged.length > max ? merged.slice(-max) : merged;
                this.saveMessagesToStorageDebounced();
            }
        } catch (e) {
            console.warn('Could not load message history from server:', e.message);
        }

        const messages = this.messages[driverId] || [];
        container.innerHTML = '';

        if (messages.length === 0) {
            container.innerHTML = `
                <div class="no-messages-state">
                    <i class="fas fa-comment-dots"></i>
                    <p>No messages yet</p>
                    <small>Start a conversation with the driver</small>
                </div>
            `;
        } else {
            const BATCH = 40;
            if (messages.length <= BATCH) {
                messages.forEach(message => this.displayAdminMessage(message, false));
                this.scrollToBottom(container);
            } else {
                let idx = 0;
                const renderBatch = () => {
                    const end = Math.min(idx + BATCH, messages.length);
                    for (; idx < end; idx++) this.displayAdminMessage(messages[idx], false);
                    if (idx < messages.length) requestAnimationFrame(renderBatch);
                    else this.scrollToBottom(container);
                };
                requestAnimationFrame(renderBatch);
            }
        }

        this.updateMessageStatistics();
        this.markMessagesAsRead(driverId, 'admin');
    }

    displayAdminMessage(messageData, scroll = true) {
        const container = document.getElementById('adminMessagesHistory');
        if (!container) {
            console.error('❌ adminMessagesHistory container not found!');
            return;
        }
        const noMessages = container.querySelector('.no-messages-state');
        if (noMessages) noMessages.remove();
        const messageElement = this.createMessageBubble(messageData, true);
        container.appendChild(messageElement);
        if (scroll) this.scrollToBottom(container);
    }

    updateAdminDriverInfo(driverId) {
        // Update driver online status and info
        const driver = window.dataManager?.getUserById(driverId);
        if (driver && driver.type === 'driver') {
            const onlineText = document.getElementById('driverOnlineText');
            const onlineStatus = document.getElementById('driverOnlineStatus');
            const lastSeen = document.getElementById('lastSeenTime');

            if (onlineText) onlineText.textContent = `${driver.name} (${driverId})`;
            if (onlineStatus) {
                onlineStatus.className = `status-indicator ${driver.status === 'active' ? 'online' : 'offline'}`;
            }
            if (lastSeen) {
                lastSeen.textContent = `Last seen: ${this.formatTime(driver.lastUpdate)}`;
            }
        }
    }

    updateMessageStatistics() {
        if (!this.currentDriverId) return;

        const messages = this.messages[this.currentDriverId] || [];
        const totalMessages = messages.length;
        const adminMessages = messages.filter(m => m.sender === 'admin').length;
        
        // Calculate average response time (simplified)
        const avgResponseTime = this.calculateAverageResponseTime(messages);

        // Update UI elements
        const totalCount = document.getElementById('totalMessagesCount');
        const avgTime = document.getElementById('avgResponseTime');
        const callsCount = document.getElementById('totalCallsCount');

        if (totalCount) totalCount.textContent = totalMessages;
        if (avgTime) avgTime.textContent = avgResponseTime;
        if (callsCount) callsCount.textContent = '0'; // Placeholder for call tracking
    }

    calculateAverageResponseTime(messages) {
        // Simplified calculation - could be enhanced
        if (messages.length < 2) return '-';
        
        const responseTimes = [];
        for (let i = 1; i < messages.length; i++) {
            const current = new Date(messages[i].timestamp);
            const previous = new Date(messages[i-1].timestamp);
            const diff = Math.abs(current - previous) / (1000 * 60); // minutes
            if (diff < 60) { // Only count responses within an hour
                responseTimes.push(diff);
            }
        }

        if (responseTimes.length === 0) return '-';
        
        const avg = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
        return `${Math.round(avg)}m`;
    }

    // ================== SHARED MESSAGING FUNCTIONS ==================

    addMessage(driverId, messageData) {
        if (!this.messages[driverId]) {
            this.messages[driverId] = [];
        }
        this.messages[driverId].push(messageData);
        const max = this.MAX_STORED_MESSAGES_PER_DRIVER;
        if (this.messages[driverId].length > max) {
            this.messages[driverId] = this.messages[driverId].slice(-max);
        }

        const recipientType = messageData.sender === 'driver' ? 'admin' : 'driver';
        if (!this.unreadCounts[driverId]) {
            this.unreadCounts[driverId] = { admin: 0, driver: 0 };
        }
        this.unreadCounts[driverId][recipientType]++;

        this.saveMessagesToStorageDebounced();
        this.updateUnreadBadges();
        // Refresh driver bottom nav message badge (same-tab: storage event does not fire)
        document.dispatchEvent(new CustomEvent('driverNavBadgesRefresh'));
    }

    createMessageBubble(messageData, isAdminView = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message-bubble ${messageData.sender === (isAdminView ? 'admin' : 'driver') ? 'sent' : 'received'}`;
        messageDiv.setAttribute('data-message-id', messageData.id);

        const isEmergency = messageData.type === 'emergency';
        const bubbleClass = isEmergency ? 'message-content emergency' : 'message-content';

        messageDiv.innerHTML = `
            <div class="${bubbleClass}" ${isEmergency ? 'style="border: 2px solid #ef4444; background: linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%);"' : ''}>
                ${isEmergency ? '🚨 ' : ''}${this.formatMessageContent(messageData.message)}
            </div>
            <div class="message-time">
                ${this.formatTime(messageData.timestamp)}
                <span class="message-status">
                    ${messageData.sender === (isAdminView ? 'admin' : 'driver') ? this.getMessageStatusIcon(messageData.status) : ''}
                </span>
            </div>
        `;

        return messageDiv;
    }

    formatMessageContent(message) {
        // Basic text formatting
        return message
            .replace(/\n/g, '<br>')
            .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMinutes < 1) return 'Just now';
        if (diffMinutes < 60) return `${diffMinutes}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString();
    }

    getMessageStatusIcon(status) {
        switch (status) {
            case 'sent': return '✓';
            case 'delivered': return '✓✓';
            case 'read': return '✓✓';
            default: return '⏳';
        }
    }

    scrollToBottom(container) {
        setTimeout(() => {
            container.scrollTop = container.scrollHeight;
        }, 100);
    }

    markMessagesAsRead(driverId, userType) {
        if (this.unreadCounts[driverId]) {
            this.unreadCounts[driverId][userType] = 0;
            this.saveMessagesToStorageDebounced();
            this.updateUnreadBadges();
        }
    }

    updateUnreadBadges() {
        const currentUser = this.currentUser;
        if (!currentUser) return;

        if (currentUser.type === 'driver') {
            const unreadCount = this.unreadCounts[currentUser.id]?.driver || 0;
            const badge = document.getElementById('unreadMessageCount');
            if (badge) {
                if (unreadCount > 0) {
                    badge.textContent = unreadCount;
                    badge.style.display = 'flex';
                } else {
                    badge.style.display = 'none';
                }
            }
            // Update driver bottom nav and drawer message badges so notification shows on Messages icon
            const navBadge = document.getElementById('driverNavMessageBadge');
            const drawerBadge = document.getElementById('driverDrawerMessageBadge');
            for (const el of [navBadge, drawerBadge]) {
                if (!el) continue;
                if (unreadCount > 0) {
                    el.textContent = unreadCount > 99 ? '99+' : String(unreadCount);
                    el.style.display = 'flex';
                } else {
                    el.style.display = 'none';
                    el.textContent = '0';
                }
            }
        }
    }

    // ================== WEBSOCKET INTEGRATION ==================

    sendViaWebSocket(messageData, highPriority = false) {
        const wsManager = window.webSocketManager || window.wsManager;
        
        if (wsManager && (wsManager.isConnected || wsManager.usesFallback)) {
            // Add target driver ID for admin messages
            const enhancedMessageData = { ...messageData };
            if (messageData.sender === 'admin' && this.currentDriverId) {
                enhancedMessageData.targetDriverId = this.currentDriverId;
            }
            const wsMessage = {
                type: 'chat_message',
                data: enhancedMessageData,
                priority: highPriority ? 'high' : 'normal',
                timestamp: new Date().toISOString()
            };
            wsManager.send(wsMessage);
            return true;
        } else {
            console.warn('⚠️ No real-time connection available');
            // Try direct HTTP send as backup
            return this.sendViaHTTPDirect(messageData);
        }
    }

    async sendViaHTTPDirect(messageData) {
        try {
            // Ensure admin messages include target driver so server can persist to DB
            const payload = { ...messageData };
            if (payload.sender === 'admin' && this.currentDriverId) {
                payload.targetDriverId = this.currentDriverId;
                payload.driverId = this.currentDriverId;
            }
            const wsMessage = {
                type: 'chat_message',
                data: payload,
                timestamp: new Date().toISOString()
            };

            const response = await fetch('/api/websocket/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(wsMessage)
            });

            if (response.ok) return true;
            console.error('❌ HTTP message send failed:', response.status);
            return false;
        } catch (error) {
            console.error('❌ HTTP message send error:', error);
            return false;
        }
    }

    handleWebSocketMessage(data) {
        if (!this.currentUser) this.updateCurrentUser();
        if (data.type === 'typing_indicator') {
            this.handleTypingIndicator(data);
            return;
        }
        if (data.type !== 'chat_message') return;
        const messageData = data.data;
        if (!this.currentUser) {
            console.error('❌ No currentUser, cannot process chat message');
            return;
        }
        const isFromCurrentUser = (
            (this.currentUser.type === 'driver' && messageData.sender === 'driver' && messageData.senderId === this.currentUser.id) ||
            (this.currentUser.type !== 'driver' && messageData.sender === 'admin')
        );
        if (isFromCurrentUser) return;

        const isDriverView = this.currentUser.type === 'driver';
        const isForMe = isDriverView && messageData.targetDriverId === this.currentUser.id;
        const driverId = isForMe
            ? this.currentUser.id
            : (messageData.sender === 'driver' ? messageData.senderId : (this.currentDriverId || messageData.targetDriverId));
        if (!driverId) {
            console.error('❌ No valid driverId for message:', messageData);
            return;
        }
        this.addMessage(driverId, messageData);

        // Defer all DOM updates to next tick so WebSocket handler returns immediately and main thread does not block
        const self = this;
        setTimeout(function applyChatMessageToDOM() {
            if (self.currentUser.type === 'driver' && messageData.sender === 'admin') {
                self.displayDriverMessage(messageData);
                const messagingSystem = document.getElementById('driverMessagingSystem');
                if (messagingSystem && messagingSystem.style.display === 'none') messagingSystem.style.display = 'block';
            } else if (messageData.sender === 'admin' && self.currentUser.type === 'driver') {
                self.displayDriverMessage(messageData);
                const ms = document.getElementById('driverMessagingSystem');
                if (ms && ms.style.display === 'none') ms.style.display = 'block';
            } else if (messageData.sender === 'driver' && messageData.targetDriverId === self.currentUser.id) {
                self.displayDriverMessage(messageData);
                const ms = document.getElementById('driverMessagingSystem');
                if (ms && ms.style.display === 'none') ms.style.display = 'block';
            } else if (messageData.sender === 'driver' && self.currentUser.type !== 'driver') {
                const driverDetailsModal = document.getElementById('driverDetailsModal');
                const isDriverDetailsOpen = driverDetailsModal && driverDetailsModal.style.display !== 'none';
                if (!self.currentDriverId || self.currentDriverId === driverId || isDriverDetailsOpen) {
                    self.displayAdminMessage(messageData);
                    if (!self.currentDriverId) self.setCurrentDriverForAdmin(driverId);
                }
            }
            self.playNotificationSound();
            if (document.hidden && messageData.type !== 'quick_reply') self.showBrowserNotification(messageData);
        }, 0);
    }

    sendTypingIndicator(senderType, targetId) {
        if (window.webSocketManager && window.webSocketManager.ws) {
            const wsMessage = {
                type: 'typing_indicator',
                sender: senderType,
                target: targetId,
                timestamp: new Date().toISOString()
            };

            window.webSocketManager.send(wsMessage);

            // Clear existing timeout
            if (this.typingTimeouts[targetId]) {
                clearTimeout(this.typingTimeouts[targetId]);
            }

            // Set timeout to stop typing indicator
            this.typingTimeouts[targetId] = setTimeout(() => {
                const stopMessage = { ...wsMessage, action: 'stop' };
                window.webSocketManager.send(stopMessage);
            }, 3000);
        }
    }

    handleTypingIndicator(data) {
        const typingIndicator = document.getElementById('typingIndicator');
        
        // Ensure currentUser is available
        if (!this.currentUser) {
            this.updateCurrentUser();
        }
        
        if (typingIndicator && data.action !== 'stop' && this.currentUser) {
            const shouldShow = (
                (this.currentUser.type === 'driver' && data.sender === 'admin') ||
                (this.currentUser.type !== 'driver' && data.target === this.currentDriverId)
            );

            if (shouldShow) {
                typingIndicator.style.display = 'flex';
                
                // Auto-hide after 5 seconds
                setTimeout(() => {
                    typingIndicator.style.display = 'none';
                }, 5000);
            }
        } else if (typingIndicator) {
            typingIndicator.style.display = 'none';
        }
    }

    // ================== SOUND AND NOTIFICATIONS ==================

    playMessageSound() {
        try {
            if (this.messageSound) {
                this.messageSound.currentTime = 0;
                this.messageSound.play().catch(e => console.warn('Could not play message sound:', e));
            }
        } catch (error) {
            console.warn('Could not play message sound:', error);
        }
    }

    playNotificationSound() {
        // Different sound for incoming messages
        this.playMessageSound();
    }

    playEmergencySound() {
        // Play emergency sound multiple times
        for (let i = 0; i < 3; i++) {
            setTimeout(() => this.playMessageSound(), i * 500);
        }
    }

    showBrowserNotification(messageData) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const title = `New message from ${messageData.senderName}`;
            const options = {
                body: messageData.message.substring(0, 100),
                icon: '/favicon.ico',
                tag: `message-${messageData.senderId}`,
                requireInteraction: messageData.type === 'emergency'
            };

            new Notification(title, options);
        }
    }

    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                console.log('Notification permission:', permission);
            });
        }
    }

    // ================== UTILITY FUNCTIONS ==================

    getCurrentLocation() {
        // Try to get current location from dataManager or use placeholder
        if (window.dataManager && this.currentUser) {
            const location = window.dataManager.getDriverLocation(this.currentUser.id);
            if (location) {
                return `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
            }
        }
        return 'Location unavailable';
    }

    handleStorageUpdate(newValue) {
        if (this._handleStorageUpdateTimer) clearTimeout(this._handleStorageUpdateTimer);
        this._handleStorageUpdateTimer = setTimeout(() => {
            this._handleStorageUpdateTimer = null;
            this._handleStorageUpdateImpl(newValue);
        }, 300);
    }

    _handleStorageUpdateImpl(newValue) {
        try {
            const updatedMessages = JSON.parse(newValue || '{}');
            this.messages = updatedMessages;
            if (this.currentUser?.type === 'driver') {
                this.loadDriverMessagesDebounced(this.currentUser.id);
            } else if (this.currentDriverId) {
                this.loadAdminMessagesDebounced(this.currentDriverId);
            }
        } catch (error) {
            console.error('Error handling storage update:', error);
        }
    }
}

// ================== GLOBAL FUNCTIONS FOR HTML ONCLICK EVENTS ==================

// Driver Functions
function toggleMessagingSystem() {
    const content = document.getElementById('messagingContent');
    const btn = document.getElementById('toggleMessagingBtn');
    
    if (content && btn) {
        const isExpanded = !content.classList.contains('collapsed');
        content.classList.toggle('collapsed', isExpanded);
        
        const icon = btn.querySelector('i');
        if (icon) {
            icon.className = isExpanded ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
        }
        
        if (window.enhancedMessaging) {
            window.enhancedMessaging.isMessagingExpanded = !isExpanded;
        }
    }
}

function sendDriverMessage() {
    if (window.enhancedMessaging) {
        window.enhancedMessaging.sendDriverMessage();
    }
}

function sendQuickReply(message) {
    if (window.enhancedMessaging) {
        window.enhancedMessaging.sendQuickReply(message);
    }
}

function sendEmergencyMessage() {
    if (window.enhancedMessaging) {
        window.enhancedMessaging.sendEmergencyMessage();
    }
}

function showEmojiPicker() {
    // Simple emoji picker implementation
    const emojis = ['😊', '👍', '👎', '❤️', '😢', '😡', '🆘', '✅', '❌', '⚠️'];
    const emoji = prompt('Select an emoji:\n' + emojis.join(' '));
    
    if (emoji && emojis.includes(emoji)) {
        const input = document.getElementById('driverMessageInput');
        if (input) {
            input.value += emoji;
            input.focus();
            
            // Trigger input event to enable send button
            input.dispatchEvent(new Event('input'));
        }
    }
}

function attachImage() {
    // Placeholder for image attachment
    if (window.app) {
        window.app.showAlert('Feature Coming Soon', 'Image attachment will be available in the next update.', 'info');
    }
}

function shareLocation() {
    if (window.enhancedMessaging) {
        const location = window.enhancedMessaging.getCurrentLocation();
        const input = document.getElementById('driverMessageInput');
        if (input) {
            input.value = `📍 My current location: ${location}`;
            input.focus();
            input.dispatchEvent(new Event('input'));
        }
    }
}

// Admin Functions
function sendAdminMessage() {
    if (window.enhancedMessaging) {
        window.enhancedMessaging.sendAdminMessage();
    }
}

function sendAdminQuickMessage(message) {
    if (window.enhancedMessaging) {
        window.enhancedMessaging.sendAdminQuickMessage(message);
    }
}

function attachFileToMessage() {
    // Placeholder for file attachment
    if (window.app) {
        window.app.showAlert('Feature Coming Soon', 'File attachment will be available in the next update.', 'info');
    }
}

function sendLocationToDriver() {
    const input = document.getElementById('adminMessageInput');
    if (input) {
        input.value = '📍 Please proceed to the marked location on your map.';
        input.focus();
        input.dispatchEvent(new Event('input'));
    }
}

function sendPriorityMessage() {
    const input = document.getElementById('adminMessageInput');
    if (input) {
        input.value = '⭐ PRIORITY: ' + (input.value || '');
        input.focus();
        input.dispatchEvent(new Event('input'));
    }
}

// Call Functions
function callDriver() {
    const currentDriverId = window.currentDriverDetailsId || (window.enhancedMessaging ? window.enhancedMessaging.currentDriverId : null);
    
    if (!currentDriverId) {
        if (window.app) {
            window.app.showAlert('No Driver Selected', 'Please select a driver first.', 'warning');
        }
        return;
    }

    // Get driver info
    const driver = window.dataManager?.getUserById(currentDriverId);
    if (!driver || driver.type !== 'driver') {
        if (window.app) {
            window.app.showAlert('Driver Not Found', 'Could not find driver information.', 'error');
        }
        return;
    }

    // Simulate call functionality
    const phoneNumber = driver.phone || '+974-XXXX-XXXX';
    const confirmCall = confirm(`Call ${driver.name}?\n\nPhone: ${phoneNumber}\n\nThis will attempt to initiate a call using your device's phone app.`);
    
    if (confirmCall) {
        // Try to initiate phone call
        try {
            window.open(`tel:${phoneNumber}`, '_self');
            
            // Log call attempt
            console.log(`📞 Call initiated to driver ${driver.name} (${currentDriverId})`);
            
            // Update call statistics
            if (window.enhancedMessaging) {
                const callsCount = document.getElementById('totalCallsCount');
                if (callsCount) {
                    const current = parseInt(callsCount.textContent) || 0;
                    callsCount.textContent = current + 1;
                }
            }
            
            // Show success message
            if (window.app) {
                window.app.showAlert('Call Initiated', `Calling ${driver.name}...`, 'success');
            }
            
        } catch (error) {
            console.error('Error initiating call:', error);
            if (window.app) {
                window.app.showAlert('Call Failed', 'Could not initiate call. Please dial manually: ' + phoneNumber, 'error');
            }
        }
    }
}

function startVideoCall() {
    if (window.app) {
        window.app.showAlert('Feature Coming Soon', 'Video calling will be available in the next update.', 'info');
    }
}

// Contact Driver (alternative name for the same function)
function contactDriver() {
    callDriver();
}

// ================== INITIALIZATION ==================

// Initialize Enhanced Messaging System when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Wait a moment for other systems to initialize
    setTimeout(() => {
        window.enhancedMessaging = new EnhancedMessagingSystem();
        
        // Request notification permissions
        window.enhancedMessaging.requestNotificationPermission();
        
        console.log('✅ Enhanced Messaging System ready');
    }, 1000);
});

// Update messaging system when user changes
window.addEventListener('userChanged', function(event) {
    if (window.enhancedMessaging) {
        window.enhancedMessaging.updateCurrentUser();
        window.enhancedMessaging.initializeMessagingInterface();
    }
});

// Handle driver details modal opening
window.addEventListener('driverDetailsOpened', function(event) {
    console.log('🔥 driverDetailsOpened event received:', event);
    if (window.enhancedMessaging && event.detail && event.detail.driverId) {
        console.log('🔥 Setting current driver for admin:', event.detail.driverId);
        window.enhancedMessaging.setCurrentDriverForAdmin(event.detail.driverId);
    }
});

// Global function to set driver for messaging (fallback)
window.setDriverForMessaging = function(driverId) {
    console.log('🔥 setDriverForMessaging called with:', driverId);
    if (window.enhancedMessaging) {
        window.enhancedMessaging.setCurrentDriverForAdmin(driverId);
    } else {
        console.warn('⚠️ Enhanced messaging system not available');
    }
};

// Global debug function to test messaging system
window.debugMessagingSystem = function() {
    console.log('🔧 MESSAGING SYSTEM DEBUG INFO:');
    console.log('  - enhancedMessaging exists:', !!window.enhancedMessaging);
    console.log('  - webSocketManager exists:', !!window.webSocketManager);
    console.log('  - authManager exists:', !!window.authManager);
    
    if (window.enhancedMessaging) {
        console.log('  - currentUser:', window.enhancedMessaging.currentUser);
        console.log('  - currentDriverId:', window.enhancedMessaging.currentDriverId);
        console.log('  - messages:', window.enhancedMessaging.messages);
    }
    
    // Test DOM elements
    const driverMessaging = document.getElementById('driverMessagingSystem');
    const messagesContainer = document.getElementById('messagesContainer');
    const adminMessagesHistory = document.getElementById('adminMessagesHistory');
    
    console.log('  - driverMessagingSystem element:', !!driverMessaging, driverMessaging?.style.display);
    console.log('  - messagesContainer element:', !!messagesContainer);
    console.log('  - adminMessagesHistory element:', !!adminMessagesHistory);
    
    if (window.webSocketManager?.ws) {
        console.log('  - WebSocket status:', window.webSocketManager.ws.readyState === 1 ? 'CONNECTED' : 'NOT CONNECTED');
    }
};

// Global function to force show driver messaging system
window.forceShowDriverMessaging = function() {
    console.log('🔧 Forcing driver messaging system to show...');
    const messagingSystem = document.getElementById('driverMessagingSystem');
    if (messagingSystem) {
        messagingSystem.style.display = 'block';
        messagingSystem.style.visibility = 'visible';
        console.log('✅ Driver messaging system forced visible');
        
        // Auto-scroll to input area
        setTimeout(() => {
            messagingSystem.scrollTop = messagingSystem.scrollHeight;
            console.log('✅ Scrolled to bottom after showing');
        }, 100);
    } else {
        console.error('❌ Driver messaging system not found!');
    }
};

// Global function to scroll to message input area
window.scrollToMessageInput = function() {
    console.log('🔧 Scrolling to message input...');
    const messagingSystem = document.getElementById('driverMessagingSystem');
    if (messagingSystem) {
        messagingSystem.scrollTop = messagingSystem.scrollHeight;
        console.log('✅ Scrolled to message input area');
        
        // Focus the input if available
        const input = document.getElementById('driverMessageInput');
        if (input) {
            input.focus();
            console.log('✅ Focused message input');
        }
    } else {
        console.error('❌ Driver messaging system not found');
    }
};

// Global function to set current driver for admin messaging
window.setAdminMessagingDriver = function(driverId) {
    console.log('🔧 Setting admin messaging driver to:', driverId);
    if (window.enhancedMessaging) {
        window.enhancedMessaging.setCurrentDriverForAdmin(driverId);
        console.log('✅ Admin messaging driver set to:', driverId);
    } else {
        console.error('❌ Enhanced messaging system not available');
    }
};

// Global function to test admin message reception
window.testAdminMessageReception = function() {
    console.log('🔧 Testing admin message reception...');
    if (window.enhancedMessaging) {
        const currentDriver = window.enhancedMessaging.currentDriverId;
        const currentUser = window.enhancedMessaging.currentUser;
        const driverDetailsModal = document.getElementById('driverDetailsModal');
        
        console.log('📊 Admin Message Reception Status:');
        console.log('  - Current user type:', currentUser?.type);
        console.log('  - Current driver ID:', currentDriver);
        console.log('  - Driver details modal open:', driverDetailsModal?.style.display !== 'none');
        console.log('  - Admin messages container exists:', !!document.getElementById('adminMessagesHistory'));
        console.log('  - WebSocket status:', window.webSocketManager?.ws?.readyState === 1 ? 'CONNECTED' : 'NOT CONNECTED');
        
        // Test message display with driver USR-003 as default
        const testDriverId = currentDriver || 'USR-003';
        const testMessage = {
            id: 'test-' + Date.now(),
            sender: 'driver',
            senderName: 'Test Driver',
            senderId: testDriverId,
            message: 'Test message from driver - ' + new Date().toLocaleTimeString(),
            timestamp: new Date().toISOString(),
            type: 'text',
            status: 'sent'
        };
        
        console.log('🔧 Sending test driver message:', testMessage);
        
        // Simulate the same process as WebSocket message handling
        window.enhancedMessaging.handleWebSocketMessage({
            type: 'chat_message',
            data: testMessage
        });
        
        // Also try direct display
        if (!currentDriver) {
            console.log('🔧 Setting test driver and trying direct display...');
            window.enhancedMessaging.setCurrentDriverForAdmin(testDriverId);
            window.enhancedMessaging.displayAdminMessage(testMessage);
        }
    } else {
        console.error('❌ Enhanced messaging system not available');
    }
};

// Global function to force admin view for driver messages
window.forceAdminMessageView = function(driverId = 'USR-003') {
    console.log('🔧 Forcing admin message view for driver:', driverId);
    if (window.enhancedMessaging) {
        // Clear current user to force admin view
        window.enhancedMessaging.currentUser = null;
        
        // Set the driver for messaging
        window.enhancedMessaging.setCurrentDriverForAdmin(driverId);
        
        // Ensure driver details modal is shown
        const driverDetailsModal = document.getElementById('driverDetailsModal');
        if (driverDetailsModal) {
            driverDetailsModal.style.display = 'block';
        }
        
        console.log('✅ Admin view forced for driver:', driverId);
        
        // Test with a message
        setTimeout(() => {
            window.testAdminMessageReception();
        }, 500);
    }
};

// Global function to test bidirectional messaging
window.testBidirectionalMessaging = function() {
    console.log('🔧 Testing bidirectional messaging...');
    
    if (!window.enhancedMessaging) {
        console.error('❌ Enhanced messaging system not available');
        return;
    }
    
    const currentUser = window.enhancedMessaging.currentUser;
    console.log('📊 Current user:', currentUser);
    console.log('📊 Current driver ID:', window.enhancedMessaging.currentDriverId);
    console.log('📊 WebSocket status:', window.webSocketManager?.ws?.readyState === 1 ? 'CONNECTED' : 'NOT CONNECTED');
    
    // Test driver message (should show on admin side)
    const testDriverMessage = {
        type: 'chat_message',
        data: {
            id: 'test-driver-' + Date.now(),
            sender: 'driver',
            senderName: 'Test Driver',
            senderId: 'USR-003',
            message: '🚛 Test driver message - ' + new Date().toLocaleTimeString(),
            timestamp: new Date().toISOString(),
            type: 'text',
            status: 'sent'
        }
    };
    
    // Test admin message (should show on driver side)
    const testAdminMessage = {
        type: 'chat_message',
        data: {
            id: 'test-admin-' + Date.now(),
            sender: 'admin',
            senderName: 'Test Admin',
            senderId: 'admin',
            message: '📱 Test admin message - ' + new Date().toLocaleTimeString(),
            timestamp: new Date().toISOString(),
            type: 'text',
            status: 'sent',
            targetDriverId: 'USR-003'
        }
    };
    
    console.log('🔧 Testing driver message routing...');
    window.enhancedMessaging.handleWebSocketMessage(testDriverMessage);
    
    setTimeout(() => {
        console.log('🔧 Testing admin message routing...');
        window.enhancedMessaging.handleWebSocketMessage(testAdminMessage);
    }, 1000);
    
    // Also test with different user contexts
    setTimeout(() => {
        console.log('🔧 Testing with driver user context...');
        const originalUser = window.enhancedMessaging.currentUser;
        window.enhancedMessaging.currentUser = { id: 'USR-003', type: 'driver', name: 'Test Driver' };
        window.enhancedMessaging.handleWebSocketMessage(testAdminMessage);
        
        setTimeout(() => {
            console.log('🔧 Testing with admin user context...');
            window.enhancedMessaging.currentUser = null; // Admin view
            window.enhancedMessaging.handleWebSocketMessage(testDriverMessage);
            
            // Restore original user
            window.enhancedMessaging.currentUser = originalUser;
        }, 1000);
    }, 2000);
};

/** Normalize audit/log message to common shape { id, sender, senderName, message, timestamp, serverTimestamp, type }. */
function normalizeMsgForReport(m, driverId) {
    const ts = m.timestamp || m.serverTimestamp || '';
    const fromDriver = (m.sender === 'driver' || m.senderId === driverId);
    return {
        id: m.id || ts || Math.random().toString(36).slice(2),
        sender: fromDriver ? 'driver' : 'manager',
        senderName: m.senderName || (fromDriver ? 'Driver' : 'Management'),
        message: m.message || '',
        timestamp: ts,
        serverTimestamp: m.serverTimestamp || ts,
        type: m.type || 'text'
    };
}

/** Build world-class audit report HTML for driver–manager conversations. Never throws; returns HTML string. */
window.getDriverConversationReportHtml = async function(driverId) {
    var driver = window.dataManager && window.dataManager.getUserById && window.dataManager.getUserById(driverId);
    var driverName = (driver && driver.name) ? String(driver.name) : String(driverId || '');
    var baseUrl = (typeof syncManager !== 'undefined' && syncManager.baseUrl) ? String(syncManager.baseUrl).replace(/\/$/, '') : '';

    var messages = [];
    try {
        var res = await fetch(baseUrl + '/api/driver/' + encodeURIComponent(driverId) + '/messages');
        if (res && res.ok) {
            var data = await res.json();
            messages = Array.isArray(data.messages) ? data.messages : [];
        }
    } catch (e) {
        console.warn('Could not fetch messages from server:', e.message);
    }

    try {
        var asSender = await fetch(baseUrl + '/api/chat/audit?senderId=' + encodeURIComponent(driverId) + '&limit=1000').then(function(r) { return r && r.ok ? r.json() : { entries: [] }; }).catch(function() { return { entries: [] }; });
        var asReceiver = await fetch(baseUrl + '/api/chat/audit?receiverId=' + encodeURIComponent(driverId) + '&limit=1000').then(function(r) { return r && r.ok ? r.json() : { entries: [] }; }).catch(function() { return { entries: [] }; });
        var auditEntries = (asSender.entries || []).concat(asReceiver.entries || []);
        for (var i = 0; i < auditEntries.length; i++) {
            var e = auditEntries[i];
            var norm = normalizeMsgForReport(e, driverId);
            var has = messages.some(function(m) { return (m.id || m.timestamp) === norm.id; });
            if (!has) messages.push(norm);
        }
    } catch (e) {
        console.warn('Could not fetch chat audit:', e.message);
    }

    var localMessages = (window.enhancedMessaging && window.enhancedMessaging.messages && window.enhancedMessaging.messages[driverId]) || [];
    var byId = new Map();
    var all = messages.map(function(m) { return normalizeMsgForReport(m, driverId); }).concat(localMessages.map(function(m) { return normalizeMsgForReport(m, driverId); }));
    for (var j = 0; j < all.length; j++) {
        var m = all[j];
        var id = m.id || m.timestamp || m.serverTimestamp;
        if (!byId.has(id) || (m.serverTimestamp && !byId.get(id).serverTimestamp)) byId.set(id, m);
    }
    var sorted = Array.from(byId.values()).sort(function(a, b) {
        var ta = new Date(a.timestamp || a.serverTimestamp || 0).getTime();
        var tb = new Date(b.timestamp || b.serverTimestamp || 0).getTime();
        return ta - tb;
    });

    var reportDate = new Date().toLocaleString();
    var rows = sorted.map(function(m, i) {
        var dt = (m.serverTimestamp || m.timestamp) ? new Date(m.serverTimestamp || m.timestamp).toLocaleString() : '—';
        var side = m.sender === 'driver' ? 'driver' : 'manager';
        var msg = (m.message || '').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
        var type = (m.type || 'text') === 'quick_message' ? 'Quick message' : (m.type || 'text');
        var from = (m.senderName || '').replace(/</g, '&lt;');
        return '<tr class="msg-row msg-' + side + '"><td>' + (i + 1) + '</td><td>' + dt + '</td><td>' + from + '</td><td class="msg-type">' + type + '</td><td class="msg-body">' + msg + '</td></tr>';
    }).join('') || '<tr><td colspan="5" class="no-msg">No messages in this conversation.</td></tr>';

    var safeName = (driverName || '—').replace(/</g, '&lt;');
    var safeId = String(driverId).replace(/</g, '&lt;');
    var contact = (driver && driver.phone) ? String(driver.phone).replace(/</g, '&lt;') : '—';

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Driver–Manager Conversation Report – ${safeName}</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<style>
* { box-sizing: border-box; }
body { font-family: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, Roboto, sans-serif; margin: 0; padding: 0; color: #0f172a; background: #f8fafc; font-size: 15px; line-height: 1.5; }
.report-page { max-width: 900px; margin: 0 auto; padding: 32px 24px; background: #fff; min-height: 100vh; box-shadow: 0 0 0 1px rgba(0,0,0,.06); }
@media print { body { background: #fff; } .report-page { max-width: none; box-shadow: none; padding: 20px; } .no-print { display: none !important; } }
.cover { text-align: center; padding: 48px 24px 40px; border-bottom: 3px solid #0ea5e9; margin-bottom: 32px; }
.cover h1 { font-size: 1.75rem; font-weight: 700; color: #0c4a6e; margin: 0 0 8px 0; letter-spacing: -0.02em; }
.cover .sub { font-size: 0.95rem; color: #64748b; margin: 0; }
.cover .date { font-size: 0.875rem; color: #94a3b8; margin-top: 16px; }
.driver-card { background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-left: 4px solid #0284c7; padding: 20px 24px; border-radius: 12px; margin-bottom: 28px; display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; }
.driver-card label { display: block; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b; margin-bottom: 4px; font-weight: 600; }
.driver-card span { font-size: 1rem; font-weight: 600; color: #0f172a; }
.section-title { font-size: 1.05rem; font-weight: 600; color: #059669; margin-bottom: 12px; border-bottom: 2px solid #10b981; padding-bottom: 8px; display: flex; align-items: center; gap: 8px; }
table { width: 100%; border-collapse: collapse; font-size: 0.9rem; margin-bottom: 24px; }
th, td { border: 1px solid #e2e8f0; padding: 12px 14px; text-align: left; vertical-align: top; }
th { background: #0c4a6e; color: #fff; font-weight: 600; }
tr:nth-child(even) { background: #f8fafc; }
.msg-row.msg-driver { background: #ecfdf5 !important; border-left: 3px solid #10b981; }
.msg-row.msg-manager { background: #eff6ff !important; border-left: 3px solid #3b82f6; }
.msg-type { font-size: 0.75rem; color: #64748b; text-transform: capitalize; }
.msg-body { max-width: 480px; word-break: break-word; }
.no-msg { text-align: center; color: #64748b; font-style: italic; padding: 24px !important; }
.footer { margin-top: 40px; font-size: 0.8rem; color: #94a3b8; padding-top: 16px; border-top: 1px solid #e2e8f0; }
.actions { margin-bottom: 20px; display: flex; gap: 10px; flex-wrap: wrap; }
.actions button { padding: 10px 18px; border-radius: 8px; font-weight: 600; cursor: pointer; border: none; font-size: 0.9rem; }
.actions .btn-print { background: #0ea5e9; color: #fff; }
.actions .btn-open { background: #0f172a; color: #fff; }
</style>
</head>
<body>
<div class="report-page">
  <div class="cover">
    <h1><i class="fas fa-comments"></i> Driver–Manager Conversation Report</h1>
    <p class="sub">Audit report – all communications between driver and management</p>
    <p class="date">Generated ${reportDate}</p>
  </div>
  <div class="driver-card">
    <div><label>Driver name</label><span>${safeName}</span></div>
    <div><label>Driver ID</label><span>${safeId}</span></div>
    <div><label>Contact</label><span>${contact}</span></div>
    <div><label>Total messages</label><span>${sorted.length}</span></div>
  </div>
  <div class="section-title"><i class="fas fa-list"></i> Conversation history (${sorted.length} messages)</div>
  <table>
    <thead><tr><th>#</th><th>Date & time</th><th>From</th><th>Type</th><th>Message</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">Waste Management System – Driver–Manager Communication Audit – ${safeName} – ${reportDate}</div>
</div>
</body>
</html>`;
};

/** Show the audit report in a fullscreen overlay on the current page (no new tab). */
function showAuditReportInOverlay(html) {
    var existing = document.getElementById('auditReportOverlay');
    if (existing) existing.remove();
    var overlay = document.createElement('div');
    overlay.id = 'auditReportOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.55);display:flex;flex-direction:column;align-items:stretch;justify-content:stretch;padding:16px;box-sizing:border-box;';
    var toolbar = document.createElement('div');
    toolbar.style.cssText = 'flex:0 0 auto;display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:#1e293b;color:#fff;border-radius:8px 8px 0 0;';
    var title = document.createElement('span');
    title.style.cssText = 'font-weight:600;font-size:1rem;';
    title.textContent = 'Driver–Manager Audit Report';
    var btnWrap = document.createElement('div');
    btnWrap.style.cssText = 'display:flex;gap:10px;';
    var printBtn = document.createElement('button');
    printBtn.textContent = 'Print';
    printBtn.style.cssText = 'padding:8px 16px;border:none;border-radius:6px;background:#059669;color:#fff;cursor:pointer;font-weight:600;';
    printBtn.onclick = function() {
        var f = document.getElementById('auditReportFrame');
        if (f && f.contentWindow) try { f.contentWindow.print(); } catch (err) { console.warn(err); }
    };
    var closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.style.cssText = 'padding:8px 16px;border:none;border-radius:6px;background:#0ea5e9;color:#fff;cursor:pointer;font-weight:600;';
    closeBtn.onclick = function() { overlay.remove(); };
    btnWrap.appendChild(printBtn);
    btnWrap.appendChild(closeBtn);
    toolbar.appendChild(title);
    toolbar.appendChild(btnWrap);
    var iframe = document.createElement('iframe');
    iframe.id = 'auditReportFrame';
    iframe.setAttribute('title', 'Audit report');
    iframe.style.cssText = 'flex:1 1 auto;min-height:0;width:100%;border:none;background:#fff;border-radius:0 0 8px 8px;';
    overlay.appendChild(toolbar);
    overlay.appendChild(iframe);
    document.body.appendChild(overlay);
    try {
        var doc = iframe.contentWindow.document;
        doc.open();
        doc.write(html);
        doc.close();
    } catch (e) {
        console.error('Could not write report to iframe:', e);
        overlay.querySelector('#auditReportFrame').style.display = 'none';
        var err = document.createElement('p');
        err.style.cssText = 'padding:20px;color:#dc2626;';
        err.textContent = 'Could not display report: ' + (e.message || 'Unknown error');
        overlay.appendChild(err);
    }
}

/** Show loading state in the audit report overlay. */
function showAuditReportLoadingOverlay() {
    var existing = document.getElementById('auditReportOverlay');
    if (existing) existing.remove();
    var overlay = document.createElement('div');
    overlay.id = 'auditReportOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;';
    var box = document.createElement('div');
    box.style.cssText = 'background:#fff;padding:32px 40px;border-radius:12px;text-align:center;box-shadow:0 20px 40px rgba(0,0,0,.2);';
    box.innerHTML = '<p style="margin:0 0 16px 0;font-size:1.1rem;color:#1e293b;">Loading audit report...</p><p style="margin:0;color:#64748b;font-size:0.9rem;">Fetching driver–manager conversation data</p>';
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    return overlay;
}

/** Export / Print driver–manager conversation report for audit. openInNewTab = true: show in overlay on same page (reliable). false: print via hidden iframe. */
window.printDriverConversationReport = async function(openInNewTab) {
    var driverId = window.currentDriverDetailsId || (window.enhancedMessaging && window.enhancedMessaging.currentDriverId) || null;
    if (!driverId) {
        var msg = 'Please select a driver first (open a driver from the map or fleet list).';
        if (window.app && window.app.showAlert) {
            window.app.showAlert('No Driver Selected', msg, 'warning');
        } else {
            alert(msg);
        }
        return;
    }

    // View Audit Report: always show in-page overlay (no new tab) so it works everywhere
    if (openInNewTab) {
        var loadingOverlay = showAuditReportLoadingOverlay();
        var html;
        try {
            html = await window.getDriverConversationReportHtml(driverId);
        } catch (e) {
            console.error('Audit report error:', e);
            if (loadingOverlay && loadingOverlay.parentNode) loadingOverlay.remove();
            if (window.app && window.app.showAlert) {
                window.app.showAlert('Report failed', 'Could not generate report: ' + (e.message || 'Unknown error'), 'error');
            } else {
                alert('Could not generate report: ' + (e.message || 'Unknown error'));
            }
            return;
        }
        if (loadingOverlay && loadingOverlay.parentNode) loadingOverlay.remove();
        if (!html) {
            if (window.app && window.app.showAlert) window.app.showAlert('Report', 'No report content could be generated.', 'warning');
            return;
        }
        showAuditReportInOverlay(html);
        return;
    }

    // Print Report: generate HTML then print in hidden iframe
    var html;
    try {
        html = await window.getDriverConversationReportHtml(driverId);
    } catch (e) {
        console.error('Audit report error:', e);
        if (window.app && window.app.showAlert) {
            window.app.showAlert('Report failed', 'Could not generate report: ' + (e.message || 'Unknown error'), 'error');
        } else {
            alert('Could not generate report: ' + (e.message || 'Unknown error'));
        }
        return;
    }
    if (!html) return;

    const iframe = document.createElement('iframe');
    iframe.setAttribute('style', 'position:absolute;width:0;height:0;border:0;visibility:hidden;');
    document.body.appendChild(iframe);
    const win = iframe.contentWindow;
    if (!win || !win.document) {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
        if (window.app && window.app.showAlert) window.app.showAlert('Print', 'Print is not available. Please allow popups or try again.', 'warning');
        return;
    }
    const doc = win.document;
    doc.open();
    doc.write(html);
    doc.close();
    function doPrint() {
        try {
            win.focus();
            win.print();
        } catch (e) {
            console.warn('Print failed:', e);
        }
        setTimeout(function() {
            if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
        }, 600);
    }
    win.onload = doPrint;
    if (doc.readyState === 'complete') setTimeout(doPrint, 100);
    else setTimeout(doPrint, 350);
};

// Ensure View Audit Report button works (in case script load order or modal is dynamic)
function bindAuditReportButtons() {
    var viewBtn = document.getElementById('viewConversationReportBtn');
    if (viewBtn && !viewBtn._auditBound) {
        viewBtn._auditBound = true;
        viewBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (typeof window.printDriverConversationReport === 'function') {
                window.printDriverConversationReport(true);
            } else {
                alert('Report not ready. Please refresh the page and try again.');
            }
        });
    }
    var printBtn = document.getElementById('printConversationReportBtn');
    if (printBtn && !printBtn._auditBound) {
        printBtn._auditBound = true;
        printBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (typeof window.printDriverConversationReport === 'function') window.printDriverConversationReport(false);
        });
    }
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindAuditReportButtons);
} else {
    bindAuditReportButtons();
}
document.addEventListener('driverDetailsOpened', bindAuditReportButtons);

// Export for global access
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedMessagingSystem;
}
