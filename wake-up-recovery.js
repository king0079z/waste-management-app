// wake-up-recovery.js - Automatic Recovery from PC Sleep/Wake

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
        this.mobileBackgroundThreshold = 1000; // 1s hidden = run driver reconnection (phone lock) – world-class: react quickly
        this.driverReconnectDebounce = 0;      // Avoid double-run when visibility + focus fire together
        this.driverReconnectOverlay = null;    // Lightweight "Reconnecting..." overlay so app never feels frozen
        this._reconnectOverlaySafetyTimer = null; // Always hide overlay after this time (avoid infinite "Reconnecting...")
        
        this.init();
    }
    
    init() {
        console.log('🔧 Initializing Wake-up Recovery System...');
        
        // 1. Monitor visibility changes (tab hidden/shown) – critical for mobile when driver locks phone
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.lastHiddenTime = Date.now();
            } else {
                // Yield to main thread first so browser can repaint (avoids frozen feel)
                const self = this;
                setTimeout(function runWhenVisible() {
                    self.reconnectDriverWhenVisible();
                    self.checkForWakeUp();
                }, 0);
            }
        });
        
        // 2. Monitor page focus (also fires when returning to app)
        window.addEventListener('focus', () => {
            const self = this;
            setTimeout(function runOnFocus() {
                self.reconnectDriverWhenVisible();
                self.checkForWakeUp();
            }, 0);
        });
        
        // 3. Monitor online/offline status
        window.addEventListener('online', () => {
            console.log('🌐 Network back online - recovering...');
            this.performRecovery('network_restored');
        });
        
        window.addEventListener('offline', () => {
            console.log('📴 Network offline detected');
        });
        
        // 3b. pageshow (mobile Safari/Android when returning to tab or from back-forward cache)
        window.addEventListener('pageshow', () => {
            const self = this;
            setTimeout(function onPageShow() { self.reconnectDriverWhenVisible(); self.checkForWakeUp(); }, 0);
        });
        
        // 4. Heartbeat monitoring (detect long pauses)
        this.startHeartbeat();
        
        // 5. Override setTimeout and setInterval to track them
        this.interceptTimers();
        
        console.log('✅ Wake-up Recovery System Active');
    }
    
    startHeartbeat() {
        // Check every 5 seconds if we've been away too long
        this.checkInterval = setInterval(() => {
            const now = Date.now();
            const timeSinceLastCheck = now - this.lastActiveTime;
            
            // If more than freeze threshold, we likely woke from sleep
            if (timeSinceLastCheck > this.freezeThreshold) {
                console.warn(`⚠️ Long pause detected: ${Math.round(timeSinceLastCheck / 1000)}s`);
                this.checkForWakeUp();
            }
            
            this.lastActiveTime = now;
        }, 5000);
    }
    
    checkForWakeUp() {
        const now = Date.now();
        const timeSinceLastCheck = now - this.lastActiveTime;
        if (timeSinceLastCheck > this.freezeThreshold && !this.isRecovering) {
            console.log(`🚨 Wake-up detected! Time gap: ${Math.round(timeSinceLastCheck / 1000)}s`);
            this.performRecovery('wake_from_sleep');
        }
        this.lastActiveTime = now;
    }
    
    /**
     * When ANY user (driver, admin, manager) returns from background, reconnect so the app never stays frozen.
     * World-class: run for all account types; show "Reconnecting..." overlay and refresh data.
     */
    reconnectDriverWhenVisible() {
        const now = Date.now();
        if (this.driverReconnectDebounce && (now - this.driverReconnectDebounce) < 2000) return;
        const auth = (typeof authManager !== 'undefined' && authManager != null && typeof authManager.getCurrentUser === 'function') ? authManager : null;
        const user = auth ? auth.getCurrentUser() : null;
        const wasInBackground = this.lastHiddenTime > 0 && (now - this.lastHiddenTime) >= this.mobileBackgroundThreshold;
        if (!wasInBackground) return;
        if (!user) return;

        this.driverReconnectDebounce = now;
        this.showDriverReconnectingOverlay();

        const self = this;
        const isDriver = user.type === 'driver';
        let doneCalled = false;
        const done = () => {
            if (doneCalled) return;
            doneCalled = true;
            self.hideDriverReconnectingOverlay();
        };

        var WAKE_SYNC_TIMEOUT_MS = 2500;
        setTimeout(function doReconnect() {
            try {
                if (window.webSocketManager && typeof window.webSocketManager.reconnect === 'function') {
                    window.webSocketManager.reconnect(true);
                }
                if (typeof window.updateWebSocketClientInfo === 'function') {
                    setTimeout(function () { window.updateWebSocketClientInfo(); }, 400);
                }
                if (typeof syncManager !== 'undefined' && typeof syncManager.syncFromServer === 'function') {
                    var syncPromise = syncManager.syncFromServer({ force: true, timeoutMs: WAKE_SYNC_TIMEOUT_MS });
                    var onDone = function () {
                        if (isDriver && window.app && typeof window.app.loadDriverRoutes === 'function') {
                            window.app.loadDriverRoutes();
                        }
                        if (!isDriver && window.app) {
                            if (typeof window.app.refreshDashboard === 'function') window.app.refreshDashboard();
                            if (window.app.currentSection === 'admin' && typeof window.app.loadAdminPanel === 'function') window.app.loadAdminPanel();
                            if (window.app.currentSection === 'monitoring' && window.mapManager && typeof window.mapManager.loadBinsOnMap === 'function') window.mapManager.loadBinsOnMap();
                            if (window.app.currentSection === 'fleet' && window.fleetManager && typeof window.fleetManager.refresh === 'function') window.fleetManager.refresh();
                        }
                        done();
                    };
                    if (syncPromise && typeof syncPromise.then === 'function') {
                        var timeoutPromise = new Promise(function (resolve) {
                            setTimeout(function () { resolve(); }, WAKE_SYNC_TIMEOUT_MS);
                        });
                        Promise.race([syncPromise, timeoutPromise]).then(onDone).catch(onDone);
                    } else {
                        onDone();
                    }
                } else {
                    if (isDriver && window.app && typeof window.app.loadDriverRoutes === 'function') {
                        window.app.loadDriverRoutes();
                    }
                    if (!isDriver && window.app) {
                        if (typeof window.app.refreshDashboard === 'function') window.app.refreshDashboard();
                        if (window.app.currentSection === 'admin' && typeof window.app.loadAdminPanel === 'function') window.app.loadAdminPanel();
                        if (window.app.currentSection === 'monitoring' && window.mapManager && typeof window.mapManager.loadBinsOnMap === 'function') window.mapManager.loadBinsOnMap();
                        if (window.app.currentSection === 'fleet' && window.fleetManager && typeof window.fleetManager.refresh === 'function') window.fleetManager.refresh();
                    }
                    done();
                }
                if (isDriver) {
                    if (window.mapManager && typeof window.mapManager.startDriverTracking === 'function') {
                        try { window.mapManager.startDriverTracking(); } catch (e) { }
                    }
                    if (user.id && window.enhancedMessaging && typeof window.enhancedMessaging.loadDriverMessages === 'function') {
                        window.enhancedMessaging.loadDriverMessages(user.id);
                    }
                }
            } catch (e) {
                console.warn('Reconnection step failed:', e && e.message);
                done();
            }
        }, 100);
    }
    
    showDriverReconnectingOverlay() {
        if (this.driverReconnectOverlay) return;
        const el = document.createElement('div');
        el.id = 'driver-reconnecting-overlay';
        el.setAttribute('aria-live', 'polite');
        el.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.9);z-index:999998;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;';
        el.innerHTML = '<div style="text-align:center;color:#fff;padding:24px;"><div style="width:40px;height:40px;border:3px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:driverReconnectSpin 0.8s linear infinite;margin:0 auto 12px;"></div><div style="font-size:1rem;font-weight:600;">Reconnecting...</div><div style="font-size:0.875rem;opacity:0.9;margin-top:4px;">Your app is updating</div><button type="button" id="driver-reload-app-btn" style="margin-top:20px;padding:12px 24px;font-size:0.95rem;background:rgba(59,130,246,0.9);color:#fff;border:none;border-radius:10px;cursor:pointer;font-weight:600;">Reload app</button></div>';
        const style = document.createElement('style');
        style.textContent = '@keyframes driverReconnectSpin{to{transform:rotate(360deg);}}';
        document.head.appendChild(style);
        document.body.appendChild(el);
        const btn = el.querySelector('#driver-reload-app-btn');
        if (btn) btn.addEventListener('click', function() {
            try { window.location.reload(); } catch (_) {}
            window.location.href = window.location.href;
        });
        this.driverReconnectOverlay = el;
        var self = this;
        if (this._reconnectOverlaySafetyTimer) clearTimeout(this._reconnectOverlaySafetyTimer);
        this._reconnectOverlaySafetyTimer = setTimeout(function() {
            self._reconnectOverlaySafetyTimer = null;
            self.hideDriverReconnectingOverlay();
        }, 5000);
    }
    
    hideDriverReconnectingOverlay() {
        if (this._reconnectOverlaySafetyTimer) {
            clearTimeout(this._reconnectOverlaySafetyTimer);
            this._reconnectOverlaySafetyTimer = null;
        }
        if (this.driverReconnectOverlay && this.driverReconnectOverlay.parentNode) {
            this.driverReconnectOverlay.remove();
        }
        this.driverReconnectOverlay = null;
    }
    
    async performRecovery(reason = 'unknown') {
        if (this.isRecovering) {
            console.log('⏳ Recovery already in progress...');
            return;
        }
        
        this.isRecovering = true;
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔄 STARTING RECOVERY PROCESS');
        console.log(`Reason: ${reason}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        try {
            this.showRecoveryNotification();
            // Yield to main thread so overlay can paint (world-class: avoid frozen UI)
            await new Promise(r => setTimeout(r, 0));
            
            await this.clearStuckTimers();
            await new Promise(r => setTimeout(r, 0));
            await this.reloadData();
            await new Promise(r => setTimeout(r, 0));
            await this.reconnectIntegrations();
            await new Promise(r => setTimeout(r, 0));
            await this.refreshUI();
            await new Promise(r => setTimeout(r, 0));
            await this.restartRealTimeUpdates();
            
            console.log('✅ Recovery Complete!');
            this.showSuccessNotification();
            
        } catch (error) {
            console.error('❌ Recovery failed:', error);
            this.showErrorNotification(error);
        } finally {
            this.isRecovering = false;
            this.lastActiveTime = Date.now();
        }
    }
    
    async clearStuckTimers() {
        console.log('🧹 Step 1: Clearing stuck timers...');
        
        // Clear all tracked intervals (except our heartbeat)
        this.activeIntervals.forEach(intervalId => {
            if (intervalId !== this.checkInterval) {
                try {
                    clearInterval(intervalId);
                    console.log(`  ✓ Cleared interval ${intervalId}`);
                } catch (e) {
                    console.warn(`  ⚠️ Failed to clear interval ${intervalId}:`, e);
                }
            }
        });
        
        // Clear all tracked timeouts
        this.activeTimers.forEach(timerId => {
            try {
                clearTimeout(timerId);
                console.log(`  ✓ Cleared timeout ${timerId}`);
            } catch (e) {
                console.warn(`  ⚠️ Failed to clear timeout ${timerId}:`, e);
            }
        });
        
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
