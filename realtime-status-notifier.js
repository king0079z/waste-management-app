// realtime-status-notifier.js - World-Class Status Change Notifications

/**
 * World-Class Real-Time Status Notifier
 * Provides visual and audio feedback when sensor status changes
 */
class RealtimeStatusNotifier {
    constructor() {
        this.previousStates = new Map(); // Track previous sensor states
        this.soundEnabled = true;
        this.notificationsEnabled = true;
        this.changeHistory = [];
        this.maxHistorySize = 50;
        
        console.log('🔔 Real-Time Status Notifier initialized');
    }
    
    /**
     * Check for status changes and notify
     */
    checkStatusChange(imei, currentStatus) {
        const previousState = this.previousStates.get(imei);
        
        if (!previousState) {
            // First time seeing this sensor
            this.previousStates.set(imei, {
                status: currentStatus.status,
                online: currentStatus.online,
                battery: currentStatus.battery,
                lastSeen: currentStatus.lastSeen,
                timestamp: Date.now()
            });
            return null;
        }
        
        // Detect changes
        const changes = {
            imei,
            timestamp: Date.now(),
            changes: []
        };
        
        // Status change (offline → online or online → offline)
        if (previousState.online !== currentStatus.online) {
            changes.changes.push({
                type: 'status',
                from: previousState.online ? 'online' : 'offline',
                to: currentStatus.online ? 'online' : 'offline',
                priority: 'high'
            });
        }
        
        // Battery change (significant drop)
        if (previousState.battery && currentStatus.battery) {
            const batteryDiff = previousState.battery - currentStatus.battery;
            if (Math.abs(batteryDiff) >= 5) { // 5% change
                changes.changes.push({
                    type: 'battery',
                    from: previousState.battery,
                    to: currentStatus.battery,
                    diff: batteryDiff,
                    priority: batteryDiff > 0 ? 'medium' : 'low'
                });
            }
        }
        
        // Last seen update
        if (previousState.lastSeen !== currentStatus.lastSeen) {
            changes.changes.push({
                type: 'lastSeen',
                from: previousState.lastSeen,
                to: currentStatus.lastSeen,
                priority: 'low'
            });
        }
        
        // Update stored state
        this.previousStates.set(imei, {
            status: currentStatus.status,
            online: currentStatus.online,
            battery: currentStatus.battery,
            lastSeen: currentStatus.lastSeen,
            timestamp: Date.now()
        });
        
        // If there are changes, notify
        if (changes.changes.length > 0) {
            this.notifyChanges(changes);
            this.addToHistory(changes);
            return changes;
        }
        
        return null;
    }
    
    /**
     * Notify user of status changes
     */
    notifyChanges(changes) {
        if (!this.notificationsEnabled) return;
        
        const highPriorityChanges = changes.changes.filter(c => c.priority === 'high');
        
        // Show toast notification for high priority changes
        if (highPriorityChanges.length > 0) {
            highPriorityChanges.forEach(change => {
                if (change.type === 'status') {
                    const isNowOnline = change.to === 'online';
                    const message = isNowOnline 
                        ? `Sensor ${changes.imei.slice(-4)} is now ONLINE`
                        : `Sensor ${changes.imei.slice(-4)} went OFFLINE`;
                    
                    this.showToast(message, isNowOnline ? 'success' : 'warning');
                    
                    // Play sound for status changes
                    if (this.soundEnabled && isNowOnline) {
                        this.playNotificationSound('online');
                    }
                }
            });
        }
        
        // Log all changes
        console.log('📊 Sensor status changed:', changes);
    }
    
    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        // Create toast container if doesn't exist
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.style.cssText = `
                position: fixed;
                top: 80px;
                right: 20px;
                z-index: 10001;
                display: flex;
                flex-direction: column;
                gap: 10px;
                max-width: 350px;
            `;
            document.body.appendChild(container);
        }
        
        // Create toast
        const toast = document.createElement('div');
        toast.className = `status-toast toast-${type}`;
        
        const colors = {
            success: { bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', icon: 'fa-check-circle' },
            warning: { bg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', icon: 'fa-exclamation-circle' },
            info: { bg: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', icon: 'fa-info-circle' },
            error: { bg: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', icon: 'fa-times-circle' }
        };
        
        const color = colors[type] || colors.info;
        
        toast.innerHTML = `
            <i class="fas ${color.icon}" style="font-size: 1.2rem;"></i>
            <span>${message}</span>
        `;
        
        toast.style.cssText = `
            background: ${color.bg};
            color: white;
            padding: 12px 18px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 0.9rem;
            font-weight: 600;
            animation: slideInRight 0.3s ease-out;
            cursor: pointer;
        `;
        
        container.appendChild(toast);
        
        // Auto-remove after 4 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 4000);
        
        // Click to dismiss
        toast.addEventListener('click', () => {
            toast.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        });
    }
    
    /**
     * Play notification sound
     */
    playNotificationSound(type) {
        if (!this.soundEnabled) return;
        
        try {
            // Create audio context for sound generation
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Different sounds for different events
            if (type === 'online') {
                // Pleasant ascending tone for online
                oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
                oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
                oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
            } else {
                // Single tone for other events
                oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4
            }
            
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (error) {
            console.warn('Could not play notification sound:', error);
        }
    }
    
    /**
     * Add change to history
     */
    addToHistory(change) {
        this.changeHistory.unshift(change);
        
        // Limit history size
        if (this.changeHistory.length > this.maxHistorySize) {
            this.changeHistory = this.changeHistory.slice(0, this.maxHistorySize);
        }
    }
    
    /**
     * Get change history
     */
    getHistory() {
        return this.changeHistory;
    }
    
    /**
     * Clear history
     */
    clearHistory() {
        this.changeHistory = [];
        console.log('🗑️ Change history cleared');
    }
    
    /**
     * Enable/disable sound
     */
    setSoundEnabled(enabled) {
        this.soundEnabled = enabled;
        console.log(`🔊 Sound notifications ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    /**
     * Enable/disable notifications
     */
    setNotificationsEnabled(enabled) {
        this.notificationsEnabled = enabled;
        console.log(`🔔 Visual notifications ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    /**
     * Get sensor state summary
     */
    getSummary() {
        return {
            trackedSensors: this.previousStates.size,
            recentChanges: this.changeHistory.length,
            soundEnabled: this.soundEnabled,
            notificationsEnabled: this.notificationsEnabled
        };
    }
}

// Create global instance
const realtimeStatusNotifier = new RealtimeStatusNotifier();
window.realtimeStatusNotifier = realtimeStatusNotifier;

// Add CSS animations
(function() {
    const notifierStyle = document.createElement('style');
    notifierStyle.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(notifierStyle);
})();

console.log('✅ Real-Time Status Notifier loaded');
