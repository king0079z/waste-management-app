// wake-up-recovery.js - Automatic Recovery from PC Sleep/Wake
// World-class: never blocks main thread, no infinite recovery loop, cooldown and timeouts.

console.log('🛡️ Wake-up Recovery System Loading...');

class WakeUpRecoverySystem {
    constructor() {
        this.lastActiveTime = Date.now();
        this.lastHiddenTime = 0;       // When page went to background (for mobile lock)
        this.checkInterval = null;
        this.activeTimers = new Set();
        this.activeIntervals = new Set();
        this.isRecovering = false;
        this.freezeThreshold = 60000;  // 60 seconds = full recovery
        this.mobileBackgroundThreshold = 3000; // 3s hidden = run driver reconnection (phone lock)
        this.driverReconnectDebounce = 0;      // Avoid double-run when visibility + focus fire together
        this.lastRecoveryTime = 0;     // Cooldown: don't run full recovery more than once per 5 min
        this.recoveryCooldownMs = 5 * 60 * 1000; // 5 minutes
        this.wakeCheckScheduled = null; // Debounce visibility+focus to one delayed check
        this.stepTimeoutMs = 12000;    // Max 12s per recovery step so we never hang

        this.init();
    }

    init() {
        console.log('🔧 Initializing Wake-up Recovery System...');

        // 1. Visibility: when hidden stop heartbeat so browser doesn't queue ticks; when visible run lightweight reconnect and one delayed wake check
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.lastHiddenTime = Date.now();
                this.stopHeartbeat();
            } else {
                this.lastActiveTime = Date.now();
                this.reconnectDriverWhenVisible();
                this.scheduleSingleWakeCheck();
                this.startHeartbeat();
            }
        });

        // 2. Focus: same as visible – lightweight reconnect and one wake check (debounced with visibility)
        window.addEventListener('focus', () => {
            if (document.hidden) return;
            this.lastActiveTime = Date.now();
            this.reconnectDriverWhenVisible();
            this.scheduleSingleWakeCheck();
        });

        // 3. Network back online – trigger one recovery (cooldown still applies)
        window.addEventListener('online', () => {
            console.log('🌐 Network back online - recovering...');
            this.lastActiveTime = Date.now() - (this.freezeThreshold + 1000);
            this.scheduleSingleWakeCheck();
        });

        window.addEventListener('offline', () => {
            console.log('📴 Network offline detected');
        });

        // 4. Heartbeat only when tab is visible (started in visibilitychange when visible)
        this.startHeartbeat();

        // 5. Override setTimeout and setInterval to track them
        this.interceptTimers();

        console.log('✅ Wake-up Recovery System Active');
    }

    stopHeartbeat() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }

    startHeartbeat() {
        this.stopHeartbeat();
        this.checkInterval = setInterval(() => {
            if (document.hidden) return;
            const now = Date.now();
            const timeSinceLastCheck = now - this.lastActiveTime;
            if (timeSinceLastCheck > this.freezeThreshold) {
                console.warn(`⚠️ Long pause detected: ${Math.round(timeSinceLastCheck / 1000)}s`);
                this.checkForWakeUp();
            }
            this.lastActiveTime = now;
        }, 5000);
    }

    scheduleSingleWakeCheck() {
        if (this.wakeCheckScheduled) clearTimeout(this.wakeCheckScheduled);
        this.wakeCheckScheduled = setTimeout(() => {
            this.wakeCheckScheduled = null;
            this.checkForWakeUp();
        }, 2000);
    }

    checkForWakeUp() {
        const now = Date.now();
        const timeSinceLastCheck = now - this.lastActiveTime;
        const cooldownOk = (now - this.lastRecoveryTime) >= this.recoveryCooldownMs;
        const wasRecentlyHidden = this.lastHiddenTime > 0 && (now - this.lastHiddenTime) < 120000;

        if (timeSinceLastCheck > this.freezeThreshold && !this.isRecovering && cooldownOk && wasRecentlyHidden) {
            console.log(`🚨 Wake-up detected! Time gap: ${Math.round(timeSinceLastCheck / 1000)}s`);
            this.performRecovery('wake_from_sleep');
        } else if (timeSinceLastCheck > this.freezeThreshold && !wasRecentlyHidden) {
            // Main thread was busy (e.g. chat) but tab was not hidden – do not run recovery to avoid "Reconnecting..." stuck
            this.lastActiveTime = now;
            return;
        }

        this.lastActiveTime = now;
    }
    
    /**
     * When driver app returns from background (e.g. phone unlocked), reconnect to server immediately.
     * Runs every time page becomes visible if user is a driver – keeps driver app working after lock.
     */
    reconnectDriverWhenVisible() {
        const now = Date.now();
        if (this.driverReconnectDebounce && (now - this.driverReconnectDebounce) < 2000) return;
        const auth = (typeof authManager !== 'undefined' && authManager != null && typeof authManager.getCurrentUser === 'function') ? authManager : null;
        const user = auth ? auth.getCurrentUser() : null;
        if (!user || user.type !== 'driver') return;
        // Run when driver brings app back after being in background (e.g. phone lock) for at least 3s
        const wasInBackground = this.lastHiddenTime > 0 && (now - this.lastHiddenTime) >= this.mobileBackgroundThreshold;
        if (!wasInBackground) return;
        
        this.driverReconnectDebounce = now;
        
        const doReconnect = () => {
            try {
                // 1. Reconnect WebSocket so driver is connected to server again
                if (window.webSocketManager && typeof window.webSocketManager.reconnect === 'function') {
                    window.webSocketManager.reconnect();
                }
                // 2. Full sync from server (routes, data)
                if (typeof syncManager !== 'undefined' && typeof syncManager.syncFromServer === 'function') {
                    syncManager.syncFromServer().then(() => {
                        if (window.app && typeof window.app.loadDriverRoutes === 'function') {
                            window.app.loadDriverRoutes();
                        }
                    }).catch(() => {
                        if (window.app && typeof window.app.loadDriverRoutes === 'function') {
                            window.app.loadDriverRoutes();
                        }
                    });
                } else if (window.app && typeof window.app.loadDriverRoutes === 'function') {
                    window.app.loadDriverRoutes();
                }
                // 3. Re-identify WebSocket as driver (after a short delay so connection is up)
                if (typeof window.updateWebSocketClientInfo === 'function') {
                    setTimeout(() => { window.updateWebSocketClientInfo(); }, 800);
                }
                // 4. Restart GPS tracking so location is sent again
                if (window.mapManager && typeof window.mapManager.startDriverTracking === 'function') {
                    window.mapManager.startDriverTracking();
                }
                // 5. Refetch chat messages (debounced to avoid freeze)
                if (user && user.id && window.enhancedMessaging) {
                    if (typeof window.enhancedMessaging.loadDriverMessagesDebounced === 'function') {
                        window.enhancedMessaging.loadDriverMessagesDebounced(user.id);
                    } else if (typeof window.enhancedMessaging.loadDriverMessages === 'function') {
                        window.enhancedMessaging.loadDriverMessages(user.id);
                    }
                }
            } catch (e) {
                console.warn('Driver reconnection step failed:', e && e.message);
            }
        };
        
        doReconnect();
    }
    
    async performRecovery(reason = 'unknown') {
        if (this.isRecovering) {
            console.log('⏳ Recovery already in progress...');
            return;
        }

        this.isRecovering = true;
        this.lastRecoveryTime = Date.now();
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔄 STARTING RECOVERY PROCESS');
        console.log(`Reason: ${reason}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        this.sendHealthReportToServer('wake_up_recovery_started', { reason });

        const recoveryMaxMs = 25000;
        try {
            this.showRecoveryNotification();
            const self = this;
            self._recoveryFailSafeTimer = setTimeout(function() {
                if (self.isRecovering) {
                    self.isRecovering = false;
                    self.lastActiveTime = Date.now();
                    const notification = document.getElementById('wake-recovery-notification');
                    if (notification) notification.remove();
                }
            }, recoveryMaxMs);

            const step = (fn) => Promise.race([
                Promise.resolve(fn()),
                new Promise((_, reject) => setTimeout(() => reject(new Error('step_timeout')), this.stepTimeoutMs))
            ]).catch(err => {
                if (err && err.message === 'step_timeout') console.warn('⚠️ Recovery step timed out (continuing)');
                else console.warn('⚠️ Recovery step error:', err);
            });

            const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 0));

            await step(() => this.clearStuckTimers());
            await yieldToMain();

            await step(() => this.reloadData());
            await yieldToMain();

            await step(() => this.reconnectIntegrations());
            await yieldToMain();

            await step(() => this.refreshUI());
            await yieldToMain();

            await step(() => this.restartRealTimeUpdates());

            console.log('✅ Recovery Complete!');
            this.showSuccessNotification();
            this.sendHealthReportToServer('wake_up_recovery_complete', {});
        } catch (error) {
            console.error('❌ Recovery failed:', error);
            this.showErrorNotification(error);
            this.sendHealthReportToServer('wake_up_recovery_failed', { error: error && error.message });
        } finally {
            if (this._recoveryFailSafeTimer) clearTimeout(this._recoveryFailSafeTimer);
            this._recoveryFailSafeTimer = null;
            this.isRecovering = false;
            this.lastActiveTime = Date.now();
        }
    }

    sendHealthReportToServer(reason, context) {
        try {
            const auth = (typeof authManager !== 'undefined' && authManager != null && typeof authManager.getCurrentUser === 'function') ? authManager : null;
            const user = auth ? auth.getCurrentUser() : null;
            const payload = {
                reason,
                detectedAt: new Date().toISOString(),
                visibility: typeof document !== 'undefined' && document.hidden ? 'hidden' : 'visible',
                userId: user ? (user.id || '') : '',
                userType: user ? (user.type || '') : '',
                userName: user ? (user.name || '') : '',
                url: typeof location !== 'undefined' ? location.href : '',
                userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
                context
            };
            const url = (typeof syncManager !== 'undefined' && syncManager.baseUrl) ? syncManager.baseUrl.replace(/\/$/, '') + '/api/client-health' : '/api/client-health';
            fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), keepalive: true }).catch(function () {});
        } catch (e) {}
    }
    
    async clearStuckTimers() {
        console.log('🧹 Step 1: Clearing stuck timers...');
        const maxClear = 200; // Cap so we never block main thread for long
        let cleared = 0;

        const intervals = Array.from(this.activeIntervals);
        for (const intervalId of intervals) {
            if (intervalId === this.checkInterval) continue;
            if (cleared >= maxClear) break;
            try {
                clearInterval(intervalId);
                this.activeIntervals.delete(intervalId);
                cleared++;
            } catch (e) {
                this.activeIntervals.delete(intervalId);
            }
        }

        const timers = Array.from(this.activeTimers);
        for (const timerId of timers) {
            if (cleared >= maxClear) break;
            try {
                clearTimeout(timerId);
                this.activeTimers.delete(timerId);
                cleared++;
            } catch (e) {
                this.activeTimers.delete(timerId);
            }
        }

        if (cleared > 0) console.log(`  ✓ Cleared ${cleared} timer(s)`);
        console.log('✅ Timers cleared');
    }
    
    async reloadData() {
        console.log('📊 Step 2: Reloading data...');
        
        // Reload dataManager
        if (typeof dataManager !== 'undefined' && typeof dataManager.loadFromLocalStorage === 'function') {
            try {
                await dataManager.loadFromLocalStorage();
                console.log('  ✓ DataManager reloaded');
            } catch (e) {
                console.warn('  ⚠️ DataManager reload failed:', e);
            }
        }
        
        // Reload bins
        if (typeof dataManager !== 'undefined' && typeof dataManager.getBins === 'function') {
            try {
                const bins = dataManager.getBins();
                console.log(`  ✓ Bins loaded: ${bins.length}`);
            } catch (e) {
                console.warn('  ⚠️ Bins reload failed:', e);
            }
        }
        
        console.log('✅ Data reloaded');
    }
    
    async reconnectIntegrations() {
        console.log('🔌 Step 3: Reconnecting integrations...');
        
        // Reconnect WebSocket first (driver and dashboard need server connection)
        if (window.webSocketManager && typeof window.webSocketManager.reconnect === 'function') {
            try {
                window.webSocketManager.reconnect();
                console.log('  ✓ WebSocket reconnect triggered');
            } catch (e) {
                console.warn('  ⚠️ WebSocket reconnect failed:', e);
            }
        }
        
        // Reconnect Findy integration
        if (typeof findyBinSensorIntegration !== 'undefined') {
            try {
                if (typeof findyBinSensorIntegration.testConnection === 'function') {
                    const connected = await findyBinSensorIntegration.testConnection();
                    console.log(`  ${connected ? '✓' : '⚠️'} Findy integration: ${connected ? 'Connected' : 'Failed'}`);
                }
                
                // Restart sensor monitoring if available
                if (typeof findyBinSensorIntegration.startRealTimeMonitoring === 'function') {
                    findyBinSensorIntegration.startRealTimeMonitoring();
                    console.log('  ✓ Real-time monitoring restarted');
                }
            } catch (e) {
                console.warn('  ⚠️ Findy reconnection failed:', e);
            }
        }
        
        console.log('✅ Integrations reconnected');
    }
    
    async refreshUI() {
        console.log('🎨 Step 4: Refreshing UI...');
        
        // Refresh map if available
        if (typeof refreshMap === 'function') {
            try {
                await refreshMap();
                console.log('  ✓ Map refreshed');
            } catch (e) {
                console.warn('  ⚠️ Map refresh failed:', e);
            }
        } else if (typeof map !== 'undefined' && map && typeof map.invalidateSize === 'function') {
            try {
                map.invalidateSize();
                console.log('  ✓ Map invalidated');
            } catch (e) {
                console.warn('  ⚠️ Map invalidate failed:', e);
            }
        }
        
        // Refresh stats
        if (typeof updateDashboardStats === 'function') {
            try {
                await updateDashboardStats();
                console.log('  ✓ Dashboard stats refreshed');
            } catch (e) {
                console.warn('  ⚠️ Stats refresh failed:', e);
            }
        }
        
        // Refresh admin stats if on admin panel
        if (typeof updateAdminSensorStats === 'function') {
            try {
                await updateAdminSensorStats();
                console.log('  ✓ Admin stats refreshed');
            } catch (e) {
                console.warn('  ⚠️ Admin stats refresh failed:', e);
            }
        }
        
        // Refresh sensor management if available
        if (typeof sensorManagementAdmin !== 'undefined' && 
            typeof sensorManagementAdmin.refreshSensorTable === 'function') {
            try {
                sensorManagementAdmin.refreshSensorTable();
                console.log('  ✓ Sensor table refreshed');
            } catch (e) {
                console.warn('  ⚠️ Sensor table refresh failed:', e);
            }
        }
        
        // Refresh bins list if on sensor management page
        if (typeof refreshBinsList === 'function') {
            try {
                await refreshBinsList();
                console.log('  ✓ Bins list refreshed');
            } catch (e) {
                console.warn('  ⚠️ Bins list refresh failed:', e);
            }
        }
        
        // Driver app: refresh routes and sync from server after wake-up
        const auth = (typeof authManager !== 'undefined' && authManager != null && typeof authManager.getCurrentUser === 'function') ? authManager : null;
        const user = auth ? auth.getCurrentUser() : null;
        if (user && user.type === 'driver') {
            if (typeof syncManager !== 'undefined' && typeof syncManager.syncFromServer === 'function') {
                try {
                    await syncManager.syncFromServer();
                    console.log('  ✓ Driver sync from server');
                } catch (e) {
                    console.warn('  ⚠️ Driver sync failed:', e);
                }
            }
            if (window.app && typeof window.app.loadDriverRoutes === 'function') {
                try {
                    await window.app.loadDriverRoutes();
                    console.log('  ✓ Driver routes refreshed');
                } catch (e) {
                    console.warn('  ⚠️ Driver routes refresh failed:', e);
                }
            }
        }
        
        console.log('✅ UI refreshed');
    }
    
    async restartRealTimeUpdates() {
        console.log('⚡ Step 5: Restarting real-time updates...');
        
        // Restart any polling mechanisms
        if (typeof startPolling === 'function') {
            try {
                startPolling();
                console.log('  ✓ Polling restarted');
            } catch (e) {
                console.warn('  ⚠️ Polling restart failed:', e);
            }
        }
        
        // Restart sensor updates
        if (typeof startSensorUpdates === 'function') {
            try {
                startSensorUpdates();
                console.log('  ✓ Sensor updates restarted');
            } catch (e) {
                console.warn('  ⚠️ Sensor updates restart failed:', e);
            }
        }
        
        // Driver app: restart GPS tracking so location is sent to server again
        if (window.mapManager && typeof window.mapManager.startDriverTracking === 'function') {
            try {
                window.mapManager.startDriverTracking();
                console.log('  ✓ Driver GPS tracking restarted');
            } catch (e) {
                console.warn('  ⚠️ Driver tracking restart failed:', e);
            }
        }
        
        console.log('✅ Real-time updates restarted');
    }
    
    interceptTimers() {
        // Track all setTimeouts and setIntervals
        const originalSetTimeout = window.setTimeout;
        const originalSetInterval = window.setInterval;
        const self = this;
        
        window.setTimeout = function(...args) {
            const id = originalSetTimeout.apply(this, args);
            self.activeTimers.add(id);
            return id;
        };
        
        window.setInterval = function(...args) {
            const id = originalSetInterval.apply(this, args);
            self.activeIntervals.add(id);
            return id;
        };
        
        console.log('✅ Timer interception active');
    }
    
    showRecoveryNotification() {
        // Create a visible notification
        const notification = document.createElement('div');
        notification.id = 'wake-recovery-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 999999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            font-size: 14px;
            animation: slideIn 0.3s ease-out;
        `;
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <div class="spinner" style="
                    border: 2px solid rgba(255,255,255,0.3);
                    border-top: 2px solid white;
                    border-radius: 50%;
                    width: 16px;
                    height: 16px;
                    animation: spin 1s linear infinite;
                "></div>
                <span><strong>System Recovery</strong><br>Reconnecting after wake-up...</span>
            </div>
        `;
        
        // Add animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(400px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(notification);
    }
    
    showSuccessNotification() {
        const notification = document.getElementById('wake-recovery-notification');
        if (notification) {
            notification.style.background = 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)';
            notification.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 20px;">✅</span>
                    <span><strong>System Recovered</strong><br>All systems operational</span>
                </div>
            `;
            
            setTimeout(() => {
                notification.style.animation = 'slideIn 0.3s ease-out reverse';
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }
    }
    
    showErrorNotification(error) {
        const notification = document.getElementById('wake-recovery-notification');
        if (notification) {
            notification.style.background = 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)';
            notification.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 20px;">⚠️</span>
                    <span><strong>Recovery Issue</strong><br>Please refresh the page</span>
                </div>
            `;
            
            setTimeout(() => {
                notification.style.animation = 'slideIn 0.3s ease-out reverse';
                setTimeout(() => notification.remove(), 300);
            }, 5000);
        }
    }
    
    // Manual recovery trigger
    forceRecovery() {
        console.log('🔧 Manual recovery triggered');
        this.performRecovery('manual_trigger');
    }
}

// Initialize the system
const wakeUpRecoverySystem = new WakeUpRecoverySystem();

// Make it globally accessible
window.wakeUpRecoverySystem = wakeUpRecoverySystem;

// Add a manual recovery button (Ctrl+Shift+R)
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        console.log('🔧 Manual recovery shortcut triggered (Ctrl+Shift+R)');
        wakeUpRecoverySystem.forceRecovery();
    }
});

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ WAKE-UP RECOVERY SYSTEM READY');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');
console.log('🛡️ Protections Active:');
console.log('  ✓ Sleep/Wake detection');
console.log('  ✓ Network disconnect recovery');
console.log('  ✓ Stuck timer cleanup');
console.log('  ✓ Automatic UI refresh');
console.log('  ✓ Data reload');
console.log('');
console.log('🔧 Manual Recovery: Press Ctrl+Shift+R');
console.log('   Or run: wakeUpRecoverySystem.forceRecovery()');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
