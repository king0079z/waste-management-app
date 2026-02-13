// connection-status-indicator.js - World-Class Connection Status Indicator

/**
 * Connection Status Indicator - Shows API health and update status
 */
class ConnectionStatusIndicator {
    constructor() {
        this.isOnline = true;
        this.lastUpdateTime = Date.now();
        this.apiResponseTimes = [];
        this.maxResponseTimeSamples = 10;
        this.indicator = null;
        
        this.init();
        console.log('📡 Connection Status Indicator initialized');
    }
    
    /**
     * Initialize the indicator
     */
    init() {
        // Create indicator element
        this.indicator = document.createElement('div');
        this.indicator.id = 'connection-status-indicator';
        this.indicator.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(10px);
            color: white;
            padding: 10px 16px;
            border-radius: 8px;
            font-size: 0.8rem;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: 10px;
            cursor: pointer;
            transition: all 0.3s ease;
        `;
        
        this.indicator.addEventListener('click', () => {
            this.showDetailedStatus();
        });
        
        document.body.appendChild(this.indicator);
        
        // Update indicator
        this.updateIndicator();
        
        // Monitor online/offline status
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.updateIndicator();
            this.showToast('Connection restored', 'success');
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.updateIndicator();
            this.showToast('Connection lost', 'error');
        });
        
        // Update indicator every 5 seconds
        setInterval(() => {
            this.updateIndicator();
        }, 5000);
    }
    
    /**
     * Update the indicator display
     */
    updateIndicator() {
        const timeSinceUpdate = Date.now() - this.lastUpdateTime;
        const seconds = Math.floor(timeSinceUpdate / 1000);
        
        const avgResponseTime = this.getAverageResponseTime();
        const quality = this.getConnectionQuality();
        
        let statusIcon, statusColor, statusText;
        
        if (!this.isOnline) {
            statusIcon = '🔴';
            statusColor = '#ef4444';
            statusText = 'Offline';
        } else if (quality === 'excellent') {
            statusIcon = '🟢';
            statusColor = '#10b981';
            statusText = 'Excellent';
        } else if (quality === 'good') {
            statusIcon = '🟡';
            statusColor = '#f59e0b';
            statusText = 'Good';
        } else {
            statusIcon = '🟠';
            statusColor = '#f97316';
            statusText = 'Slow';
        }
        
        this.indicator.innerHTML = `
            <span style="font-size: 1.2rem;">${statusIcon}</span>
            <div style="display: flex; flex-direction: column; line-height: 1.2;">
                <span style="font-size: 0.75rem; opacity: 0.8;">Connection</span>
                <span style="color: ${statusColor};">${statusText}</span>
            </div>
            ${avgResponseTime > 0 ? `
                <div style="font-size: 0.7rem; opacity: 0.7;">
                    ${avgResponseTime}ms
                </div>
            ` : ''}
        `;
    }
    
    /**
     * Record API response time
     */
    recordResponseTime(ms) {
        this.apiResponseTimes.push(ms);
        
        // Keep only last N samples
        if (this.apiResponseTimes.length > this.maxResponseTimeSamples) {
            this.apiResponseTimes.shift();
        }
        
        this.lastUpdateTime = Date.now();
        this.updateIndicator();
    }
    
    /**
     * Get average response time
     */
    getAverageResponseTime() {
        if (this.apiResponseTimes.length === 0) return 0;
        
        const sum = this.apiResponseTimes.reduce((a, b) => a + b, 0);
        return Math.round(sum / this.apiResponseTimes.length);
    }
    
    /**
     * Get connection quality
     */
    getConnectionQuality() {
        const avg = this.getAverageResponseTime();
        
        if (avg === 0) return 'unknown';
        if (avg < 500) return 'excellent';
        if (avg < 1500) return 'good';
        return 'slow';
    }
    
    /**
     * Show detailed status modal
     */
    showDetailedStatus() {
        const avg = this.getAverageResponseTime();
        const quality = this.getConnectionQuality();
        const timeSinceUpdate = Math.floor((Date.now() - this.lastUpdateTime) / 1000);
        
        const detailsHTML = `
            <div style="background: white; border-radius: 12px; padding: 24px; max-width: 400px; box-shadow: 0 20px 50px rgba(0,0,0,0.3);">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
                    <i class="fas fa-chart-line" style="font-size: 2rem; color: #667eea;"></i>
                    <div>
                        <h3 style="margin: 0; color: #1f2937;">Connection Status</h3>
                        <p style="margin: 4px 0 0 0; font-size: 0.9rem; color: #6b7280;">Real-time monitoring</p>
                    </div>
                </div>
                
                <div style="display: grid; gap: 16px;">
                    <div style="display: flex; justify-content: space-between; padding: 12px; background: #f3f4f6; border-radius: 8px;">
                        <span style="color: #6b7280; font-weight: 600;">Status</span>
                        <span style="font-weight: 700; color: ${this.isOnline ? '#10b981' : '#ef4444'};">
                            ${this.isOnline ? '🟢 Online' : '🔴 Offline'}
                        </span>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; padding: 12px; background: #f3f4f6; border-radius: 8px;">
                        <span style="color: #6b7280; font-weight: 600;">Quality</span>
                        <span style="font-weight: 700; color: #667eea; text-transform: capitalize;">${quality}</span>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; padding: 12px; background: #f3f4f6; border-radius: 8px;">
                        <span style="color: #6b7280; font-weight: 600;">Avg Response Time</span>
                        <span style="font-weight: 700; color: #1f2937;">${avg > 0 ? avg + 'ms' : 'N/A'}</span>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; padding: 12px; background: #f3f4f6; border-radius: 8px;">
                        <span style="color: #6b7280; font-weight: 600;">Last Update</span>
                        <span style="font-weight: 700; color: #1f2937;">${timeSinceUpdate}s ago</span>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; padding: 12px; background: #f3f4f6; border-radius: 8px;">
                        <span style="color: #6b7280; font-weight: 600;">Samples</span>
                        <span style="font-weight: 700; color: #1f2937;">${this.apiResponseTimes.length}</span>
                    </div>
                </div>
                
                <button onclick="this.parentElement.parentElement.remove()" style="
                    margin-top: 20px;
                    width: 100%;
                    padding: 12px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: transform 0.2s ease;
                " onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
                    Close
                </button>
            </div>
        `;
        
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10002;
            animation: fadeIn 0.2s ease;
        `;
        modal.innerHTML = detailsHTML;
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        document.body.appendChild(modal);
    }
    
    /**
     * Show toast message
     */
    showToast(message, type) {
        if (typeof realtimeStatusNotifier !== 'undefined') {
            realtimeStatusNotifier.showToast(message, type);
        }
    }
}

// Create global instance
const connectionStatusIndicator = new ConnectionStatusIndicator();
window.connectionStatusIndicator = connectionStatusIndicator;

// Add CSS
(function() {
    const connectionStyle = document.createElement('style');
    connectionStyle.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
    `;
    document.head.appendChild(connectionStyle);
})();

console.log('✅ Connection Status Indicator loaded');
