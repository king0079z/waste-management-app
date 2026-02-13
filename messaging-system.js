// Messaging System for Main Application (Manager Side)
// Allows management to send messages to drivers

console.log('📨 Loading Messaging System for Management');

class MessagingSystem {
    constructor() {
        this.drivers = [];
        this.messageContainer = null;
        this.init();
    }

    init() {
        console.log('🎯 Initializing Management Messaging System');
        this.createMessageInterface();
        this.loadDrivers();
        this.setupMessageListener();
    }

    createMessageInterface() {
        // Create messaging button in main interface
        const existingBtn = document.getElementById('messagingSystemBtn');
        if (existingBtn) existingBtn.remove();

        const messagingBtn = document.createElement('button');
        messagingBtn.id = 'messagingSystemBtn';
        messagingBtn.style.cssText = `
            position: fixed;
            bottom: 8rem;
            right: 2rem;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            border: none;
            border-radius: 50%;
            width: 60px;
            height: 60px;
            cursor: pointer;
            box-shadow: 0 4px 20px rgba(16, 185, 129, 0.4);
            z-index: 9998;
            transition: all 0.3s ease;
        `;
        messagingBtn.innerHTML = `<i class="fas fa-comments" style="font-size: 24px;"></i>`;
        messagingBtn.title = 'Driver Messaging System';
        messagingBtn.onclick = () => this.toggleMessageInterface();

        document.body.appendChild(messagingBtn);

        // Create message interface (world-class + mobile-friendly)
        this.messageContainer = document.createElement('div');
        this.messageContainer.id = 'managementMessageSystem';
        this.messageContainer.className = 'management-message-system';
        this.messageContainer.setAttribute('aria-label', 'Driver messages');
        this.messageContainer.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            width: 400px;
            max-width: calc(100vw - 20px);
            max-height: 600px;
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.15);
            z-index: 9999;
            display: none;
            overflow: hidden;
            border: 1px solid #e5e7eb;
        `;

        this.messageContainer.innerHTML = `
            <div class="management-msg-header" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 1rem 1.25rem; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h3 style="margin: 0; font-size: 1.1rem;">💬 Driver Messages</h3>
                    <p style="margin: 0.25rem 0 0; font-size: 0.875rem; opacity: 0.9;">Send messages to drivers</p>
                </div>
                <button type="button" class="management-msg-close" onclick="this.closest('#managementMessageSystem').style.display='none'" aria-label="Close">&times;</button>
            </div>
            <div class="management-msg-body" style="padding: 1rem 1.25rem; overflow-y: auto;">
                <div class="management-msg-field" style="margin-bottom: 1rem;">
                    <label for="driverSelect" style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #1f2937;">Select Driver:</label>
                    <select id="driverSelect" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 8px; font-size: 16px;">
                        <option value="">Select a driver...</option>
                    </select>
                </div>
                <div class="management-msg-field" style="margin-bottom: 1rem;">
                    <h4 style="margin: 0 0 0.5rem; color: #1f2937; font-size: 1rem;">Message History</h4>
                    <div id="messageHistory" class="management-msg-history" style="max-height: 200px; overflow-y: auto; border: 1px solid #e5e7eb; border-radius: 8px; padding: 1rem; background: #f9fafb;">
                        <div style="text-align: center; color: #6b7280; font-size: 14px;">Select a driver to view messages</div>
                    </div>
                </div>
                <div class="management-msg-field">
                    <label for="messageInput" style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #1f2937;">Send Message:</label>
                    <div style="display: flex; gap: 0.5rem;">
                        <input type="text" id="messageInput" placeholder="Type your message..." style="flex: 1; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 8px; font-size: 16px; min-width: 0;">
                        <button type="button" onclick="window.messagingSystem.sendMessage()" class="management-msg-send" style="background: #10b981; color: white; border: none; padding: 0.75rem 1.25rem; border-radius: 8px; cursor: pointer; font-weight: 600;">Send</button>
                    </div>
                </div>
                <div class="management-msg-broadcast" style="margin-top: 1.25rem; padding-top: 1.25rem; border-top: 1px solid #e5e7eb;">
                    <h4 style="margin: 0 0 0.5rem; color: #1f2937; font-size: 1rem;">Broadcast Message</h4>
                    <div style="display: flex; gap: 0.5rem;">
                        <input type="text" id="broadcastInput" placeholder="Message all drivers..." style="flex: 1; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 8px; font-size: 16px; min-width: 0;">
                        <button type="button" onclick="window.messagingSystem.broadcastMessage()" class="management-msg-broadcast-btn" style="background: #3b82f6; color: white; border: none; padding: 0.75rem 1.25rem; border-radius: 8px; cursor: pointer; font-weight: 600;">Broadcast</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(this.messageContainer);

        // Setup driver selection change
        const driverSelect = document.getElementById('driverSelect');
        if (driverSelect) {
            driverSelect.addEventListener('change', () => {
                this.loadMessageHistory(driverSelect.value);
            });
        }
    }

    toggleMessageInterface() {
        const isVisible = this.messageContainer.style.display !== 'none';
        this.messageContainer.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible) {
            this.loadDrivers();
        }
    }

    loadDrivers() {
        const driverSelect = document.getElementById('driverSelect');
        if (!driverSelect) return;

        try {
            const users = dataManager.getUsers();
            this.drivers = users.filter(user => user.type === 'driver');

            driverSelect.innerHTML = '<option value="">Select a driver...</option>';
            
            this.drivers.forEach(driver => {
                const option = document.createElement('option');
                option.value = driver.id;
                option.textContent = `${driver.name} (${driver.id})`;
                driverSelect.appendChild(option);
            });

            console.log(`📋 Loaded ${this.drivers.length} drivers for messaging`);
        } catch (error) {
            console.error('❌ Failed to load drivers:', error);
        }
    }

    loadMessageHistory(driverId) {
        const messageHistory = document.getElementById('messageHistory');
        if (!messageHistory) return;

        if (!driverId) {
            messageHistory.innerHTML = '<div style="text-align: center; color: #6b7280; font-size: 14px;">Select a driver to view messages</div>';
            return;
        }

        try {
            const allMessages = JSON.parse(localStorage.getItem('driverMessages') || '{}');
            const driverMessages = allMessages[driverId] || [];
            
            if (driverMessages.length === 0) {
                messageHistory.innerHTML = '<div style="text-align: center; color: #6b7280; font-size: 14px;">No messages yet</div>';
                return;
            }

            messageHistory.innerHTML = driverMessages.map(msg => `
                <div style="margin-bottom: 1rem; padding: 0.75rem; background: ${msg.sender === 'driver' ? '#eff6ff' : '#f0fdf4'}; border-radius: 8px; border-left: 4px solid ${msg.sender === 'driver' ? '#3b82f6' : '#10b981'};">
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 0.25rem;">
                        <strong>${msg.sender === 'driver' ? msg.driverName || 'Driver' : 'Management'}</strong> • ${new Date(msg.timestamp).toLocaleString()}
                    </div>
                    <div style="font-size: 14px; color: #1f2937;">${msg.message}</div>
                </div>
            `).join('');

            // Scroll to bottom
            messageHistory.scrollTop = messageHistory.scrollHeight;
        } catch (error) {
            console.error('❌ Failed to load message history:', error);
            messageHistory.innerHTML = '<div style="color: #ef4444; font-size: 14px;">Error loading messages</div>';
        }
    }

    sendMessage() {
        const driverSelect = document.getElementById('driverSelect');
        const messageInput = document.getElementById('messageInput');
        
        if (!driverSelect || !messageInput) return;

        const driverId = driverSelect.value;
        const message = messageInput.value.trim();
        
        if (!driverId || !message) {
            if (window.app) {
                window.app.showAlert('Message Error', 'Please select a driver and enter a message', 'error');
            }
            return;
        }

        const messageData = {
            id: Date.now().toString(),
            sender: 'admin',
            senderName: 'Management',
            message: message,
            timestamp: new Date().toISOString(),
            targetDriverId: driverId,
            driverId: driverId
        };

        messageInput.value = '';
        this.loadMessageHistory(driverId);

        // Send via server so all drivers receive in real time (WebSocket broadcast)
        this.sendMessageToServer(messageData, () => {
            const allMessages = JSON.parse(localStorage.getItem('driverMessages') || '{}');
            if (!allMessages[driverId]) allMessages[driverId] = [];
            allMessages[driverId].push(messageData);
            localStorage.setItem('driverMessages', JSON.stringify(allMessages));
            window.dispatchEvent(new StorageEvent('storage', { key: 'driverMessages', newValue: JSON.stringify(allMessages) }));
            if (window.app) window.app.showAlert('Message Sent', `Message sent to ${this.drivers.find(d => d.id === driverId)?.name}`, 'success');
            this.loadMessageHistory(driverId);
        });
    }

    broadcastMessage() {
        const broadcastInput = document.getElementById('broadcastInput');
        if (!broadcastInput) return;

        const message = broadcastInput.value.trim();
        if (!message) {
            if (window.app) window.app.showAlert('Broadcast Error', 'Please enter a message to broadcast', 'error');
            return;
        }

        const messageData = {
            id: Date.now().toString(),
            sender: 'admin',
            senderName: 'Management',
            message: message,
            timestamp: new Date().toISOString(),
            broadcast: true
        };

        broadcastInput.value = '';

        this.sendBroadcastToServer(messageData, (count) => {
            const allMessages = JSON.parse(localStorage.getItem('driverMessages') || '{}');
            this.drivers.forEach(driver => {
                if (!allMessages[driver.id]) allMessages[driver.id] = [];
                allMessages[driver.id].push({ ...messageData, targetDriverId: driver.id, driverId: driver.id });
            });
            localStorage.setItem('driverMessages', JSON.stringify(allMessages));
            window.dispatchEvent(new StorageEvent('storage', { key: 'driverMessages', newValue: JSON.stringify(allMessages) }));
            if (window.app) window.app.showAlert('Broadcast Sent', `Message sent to all ${count} drivers`, 'success');
            const driverSelect = document.getElementById('driverSelect');
            if (driverSelect && driverSelect.value) this.loadMessageHistory(driverSelect.value);
        });
    }

    sendMessageToServer(messageData, onSuccess) {
        const baseUrl = (typeof syncManager !== 'undefined' && syncManager.baseUrl) ? syncManager.baseUrl.replace(/\/$/, '') : '';
        fetch(`${baseUrl}/api/websocket/message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'chat_message', data: messageData })
        }).then(res => {
            if (res.ok && typeof onSuccess === 'function') onSuccess();
            else if (!res.ok && window.app) window.app.showAlert('Message Error', 'Server could not deliver message', 'error');
        }).catch(err => {
            console.error('Send message error:', err);
            if (window.app) window.app.showAlert('Message Error', 'Failed to send message', 'error');
        });
    }

    sendBroadcastToServer(messageData, onSuccess) {
        const baseUrl = (typeof syncManager !== 'undefined' && syncManager.baseUrl) ? syncManager.baseUrl.replace(/\/$/, '') : '';
        fetch(`${baseUrl}/api/websocket/message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'broadcast_to_drivers', data: messageData })
        }).then(res => {
            if (res.ok && typeof onSuccess === 'function') onSuccess(this.drivers.length);
            else if (!res.ok && window.app) window.app.showAlert('Broadcast Error', 'Server could not broadcast', 'error');
        }).catch(err => {
            console.error('Broadcast error:', err);
            if (window.app) window.app.showAlert('Broadcast Error', 'Failed to broadcast message', 'error');
        });
    }

    setupMessageListener() {
        // Listen for new messages from drivers
        window.addEventListener('storage', (e) => {
            if (e.key === 'systemMessages') {
                // Show notification for new driver messages
                const messages = JSON.parse(e.newValue || '[]');
                const latestMessage = messages[messages.length - 1];
                
                if (latestMessage && latestMessage.sender === 'driver') {
                    this.showMessageNotification(latestMessage);
                }
            }
        });

        // Check for new messages periodically
        setInterval(() => {
            this.checkForNewMessages();
        }, 10000);
    }

    checkForNewMessages() {
        try {
            const messages = JSON.parse(localStorage.getItem('systemMessages') || '[]');
            const driverMessages = messages.filter(msg => msg.sender === 'driver');
            
            // Check if there are new unread messages (simple implementation)
            const lastCheck = localStorage.getItem('lastMessageCheck');
            const newMessages = driverMessages.filter(msg => 
                !lastCheck || new Date(msg.timestamp) > new Date(lastCheck)
            );
            
            if (newMessages.length > 0) {
                const btn = document.getElementById('messagingSystemBtn');
                if (btn) {
                    btn.style.animation = 'pulse 1s infinite';
                    btn.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.8)';
                }
            }
            
            localStorage.setItem('lastMessageCheck', new Date().toISOString());
        } catch (error) {
            console.error('❌ Failed to check for new messages:', error);
        }
    }

    showMessageNotification(message) {
        if (window.app && window.app.showAlert) {
            window.app.showAlert(
                `New Message from ${message.driverName}`, 
                message.message.substring(0, 100) + (message.message.length > 100 ? '...' : ''),
                'info'
            );
        }
    }
}

// Initialize messaging system when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if we're not in driver mode
    if (authManager && authManager.getCurrentUser && authManager.getCurrentUser()?.type !== 'driver') {
        console.log('🎯 DOM ready, initializing Management Messaging System');
        window.messagingSystem = new MessagingSystem();
    }
});

// Also initialize if DOM is already loaded
if (document.readyState !== 'loading') {
    // Only initialize if we're not in driver mode
    setTimeout(() => {
        if (authManager && authManager.getCurrentUser && authManager.getCurrentUser()?.type !== 'driver') {
            console.log('🎯 DOM already loaded, initializing Management Messaging System');
            window.messagingSystem = new MessagingSystem();
        }
    }, 1000);
}

console.log('✅ Management Messaging System loaded successfully');


