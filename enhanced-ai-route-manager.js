// Enhanced AI Route Manager - Smart action buttons with status tracking and visual indicators
console.log('🤖 Loading Enhanced AI Route Manager...');

class EnhancedAIRouteManager {
    constructor() {
        this.currentDriverId = null;
        this.aiRouteStatus = 'inactive'; // 'inactive', 'active', 'completing'
        this.currentAIRoute = null;
        this.aiRouteHistory = [];
        this.statusChangeCallbacks = new Set();
        this.detectionRetries = 0;
        this.maxDetectionRetries = 5; // Limit retry attempts to prevent infinite loops
        this.isInitialized = false;
        
        // AI Route status emojis
        this.statusEmojis = {
            'inactive': '🚛',
            'active': '🤖',
            'completing': '🏁',
            'ai-route': '🤖'
        };
        
        // Delay initialization until DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            // DOM is already loaded, initialize after a short delay
            setTimeout(() => this.init(), 1000);
        }
    }
    
    init() {
        if (this.isInitialized) {
            console.log('⚠️ Enhanced AI Route Manager already initialized');
            return;
        }
        
        console.log('🔧 Initializing Enhanced AI Route Manager...');
        
        this.detectCurrentDriver();
        this.enhanceSmartActionButton();
        this.setupStatusTracking();
        this.enhanceMapIndicators();
        this.setupHistoryTracking();
        this.isInitialized = true;
        
        console.log('✅ Enhanced AI Route Manager initialized');
    }
    
    detectCurrentDriver() {
        // Silent detection - only log if successful or on error
        
        // Try multiple sources to detect current driver
        const detectionMethods = [
            () => window.currentDriverData?.id,
            () => window.authManager?.getCurrentUser()?.type === 'driver' ? window.authManager.getCurrentUser().id : null,
            () => {
                try {
                    const stored = localStorage.getItem('currentDriver');
                    return stored ? JSON.parse(stored).id : null;
                } catch (error) {
                    return null;
                }
            },
            () => {
                try {
                    const stored = localStorage.getItem('currentUser');
                    if (stored) {
                        const userData = JSON.parse(stored);
                        return userData.type === 'driver' ? userData.id : null;
                    }
                } catch (error) {
                    return null;
                }
            },
            () => {
                // Try to get from app object
                return window.app?.currentUser?.type === 'driver' ? window.app.currentUser.id : null;
            },
            () => {
                // Try to get from driver system
                return window.driverSystem?.currentDriverId || window.driverSystemV3?.currentDriverId;
            },
            () => {
                // Try to get from URL parameters (for driver interface)
                const urlParams = new URLSearchParams(window.location.search);
                return urlParams.get('driverId');
            },
            () => {
                // Try to get from session storage
                try {
                    const sessionData = sessionStorage.getItem('currentUser');
                    if (sessionData) {
                        const userData = JSON.parse(sessionData);
                        return userData.type === 'driver' ? userData.id : null;
                    }
                } catch (error) {
                    return null;
                }
            },
            () => {
                // Check if we're in driver interface mode
                if (window.location.href.includes('driver') || document.body.classList.contains('driver-interface')) {
                    // Try to find driver data from data manager
                    if (window.dataManager?.getUsers) {
                        const users = window.dataManager.getUsers();
                        const drivers = users.filter(user => user.type === 'driver');
                        if (drivers.length > 0) {
                            console.log('🔧 Using first available driver as fallback:', drivers[0].id);
                            return drivers[0].id;
                        }
                    }
                }
                return null;
            }
        ];
        
        // Try each method until we find a driver ID
        for (const method of detectionMethods) {
            try {
                const driverId = method();
                if (driverId) {
                    this.currentDriverId = driverId;
                    this.detectionRetries = 0; // Reset retry count on successful detection
                    const driver = window.dataManager?.getUserById(this.currentDriverId);
                    const driverName = driver ? driver.name : this.currentDriverId;
                    console.log(`✅ AI Route Manager detected driver: ${driverName}`);
                    this.loadDriverAIRouteStatus();
                    return;
                }
            } catch (error) {
                console.warn('Error in driver detection method:', error);
            }
        }
        
        // If no driver found, retry after a delay (with max retry limit)
        if (this.detectionRetries < this.maxDetectionRetries) {
            this.detectionRetries++;
            
            // Silent retry - will auto-detect after login
            setTimeout(() => {
                if (!this.currentDriverId) {
                    this.detectCurrentDriver();
                }
            }, 3000);
        } else {
            // Silent - will auto-detect after login
            console.log('ℹ️ AI Route Manager will auto-detect driver after login');
            
            // Listen for login event to auto-detect
            document.addEventListener('userLoggedIn', () => {
                this.detectionRetries = 0;
                this.detectCurrentDriver();
            }, { once: true });
        }
    }
    
    enhanceSmartActionButton() {
        console.log('🔧 Enhancing smart action button...');
        
        // Store original function
        const originalAcceptRecommendation = window.acceptSmartRecommendation;
        
        // Enhanced version with AI route status management
        window.acceptSmartRecommendation = () => {
            console.log('🤖 Enhanced AI route action triggered');
            
            if (this.aiRouteStatus === 'inactive') {
                this.startAIRoute();
            } else if (this.aiRouteStatus === 'active') {
                this.promptEndAIRoute();
            } else if (this.aiRouteStatus === 'completing') {
                console.log('🔄 AI route completion in progress...');
                return;
            }
        };
        
        // Update button appearance based on status
        this.updateSmartActionButtonAppearance();
        
        console.log('✅ Smart action button enhanced');
    }
    
    async startAIRoute() {
        console.log('🚀 Starting AI route...');
        
        if (!this.currentDriverId) {
            console.warn('⚠️ No driver ID detected, attempting re-detection...');
            this.detectCurrentDriver();
            
            // Wait a bit and check again
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            if (!this.currentDriverId) {
                this.showDriverIdentificationDialog();
                return;
            }
        }
        
        const currentRecommendation = window.currentAIRecommendation;
        if (!currentRecommendation) {
            this.showAlert('No Recommendation', 'No active AI recommendation available', 'warning');
            return;
        }
        
        try {
            // Set status to active
            this.setAIRouteStatus('active');
            
            // Create AI route data
            const aiRouteData = {
                id: `ai-route-${Date.now()}`,
                driverId: this.currentDriverId,
                binIds: [currentRecommendation.id],
                status: 'active',
                priority: currentRecommendation.priority?.toLowerCase() || 'medium',
                createdAt: new Date().toISOString(),
                aiGenerated: true,
                confidence: currentRecommendation.confidence || 85,
                estimatedDistance: currentRecommendation.calculatedDistance || 0,
                estimatedTime: currentRecommendation.estimatedTime || '15 minutes',
                routeType: 'ai-optimized',
                aiRecommendation: currentRecommendation
            };
            
            this.currentAIRoute = aiRouteData;
            
            // Add route to data manager
            if (window.dataManager?.addRoute) {
                window.dataManager.addRoute(aiRouteData);
            }
            
            // Update driver status
            if (window.enhancedStatusManager) {
                await window.enhancedStatusManager.updateDriverStatus(
                    this.currentDriverId,
                    'active',
                    'ai-route',
                    {
                        aiRoute: true,
                        aiRouteId: aiRouteData.id,
                        aiRouteStartTime: new Date().toISOString()
                    }
                );
            }
            
            // Record in history
            this.recordAIRouteUsage('started', aiRouteData);
            
            // Update UI
            this.updateSmartActionButtonAppearance();
            this.updateMapIndicators();
            
            // Sync to server
            if (window.syncManager?.syncToServer) {
                window.syncManager.syncToServer();
            }
            
            // Show success message
            this.showAlert(
                '🤖 AI Route Started!',
                `AI-optimized route to ${currentRecommendation.id} is now active`,
                'success'
            );
            
            console.log('✅ AI route started successfully');
            
        } catch (error) {
            console.error('❌ Error starting AI route:', error);
            this.setAIRouteStatus('inactive');
            this.showAlert('Error', 'Failed to start AI route', 'error');
        }
    }
    
    promptEndAIRoute() {
        console.log('🤖 Prompting to end AI route...');
        
        // Create confirmation dialog
        const modal = document.createElement('div');
        modal.className = 'ai-route-end-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        modal.innerHTML = `
            <div class="modal-content" style="
                background: white;
                padding: 2rem;
                border-radius: 12px;
                max-width: 400px;
                width: 90%;
                text-align: center;
                box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            ">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🤖</div>
                <h2 style="margin: 0 0 1rem 0; color: #1e293b;">End AI Route?</h2>
                <p style="color: #64748b; margin-bottom: 2rem;">
                    Are you ready to complete your AI-optimized collection route?
                </p>
                
                <div style="display: flex; gap: 1rem;">
                    <button onclick="this.closest('.ai-route-end-modal').remove()" style="
                        flex: 1;
                        background: #e2e8f0;
                        color: #64748b;
                        border: none;
                        padding: 0.75rem 1rem;
                        border-radius: 8px;
                        font-weight: 600;
                        cursor: pointer;
                    ">
                        Cancel
                    </button>
                    <button onclick="window.enhancedAIRouteManager.endAIRoute(); this.closest('.ai-route-end-modal').remove();" style="
                        flex: 1;
                        background: linear-gradient(135deg, #ef4444, #dc2626);
                        color: white;
                        border: none;
                        padding: 0.75rem 1rem;
                        border-radius: 8px;
                        font-weight: 600;
                        cursor: pointer;
                    ">
                        🏁 Complete Route
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    async endAIRoute() {
        console.log('🏁 Ending AI route...');
        
        if (!this.currentAIRoute) {
            console.warn('⚠️ No active AI route to end');
            return;
        }
        
        try {
            this.setAIRouteStatus('completing');
            this.updateSmartActionButtonAppearance();
            
            // Mark route as completed
            const completedRoute = {
                ...this.currentAIRoute,
                status: 'completed',
                completedAt: new Date().toISOString(),
                duration: this.calculateRouteDuration()
            };
            
            // Update route in data manager
            if (window.dataManager?.updateRoute) {
                window.dataManager.updateRoute(this.currentAIRoute.id, completedRoute);
            }
            
            // Update driver status back to available
            if (window.enhancedStatusManager) {
                await window.enhancedStatusManager.updateDriverStatus(
                    this.currentDriverId,
                    'available',
                    'stationary',
                    {
                        aiRoute: false,
                        aiRouteCompleted: true,
                        aiRouteEndTime: new Date().toISOString()
                    }
                );
            }
            
            // Record completion in history
            this.recordAIRouteUsage('completed', completedRoute);
            
            // Reset status
            this.setAIRouteStatus('inactive');
            this.currentAIRoute = null;
            
            // Update UI
            this.updateSmartActionButtonAppearance();
            this.updateMapIndicators();
            
            // Show completion message
            this.showAlert(
                '🎉 AI Route Completed!',
                'Your AI-optimized collection route has been successfully completed',
                'success'
            );
            
            console.log('✅ AI route completed successfully');
            
        } catch (error) {
            console.error('❌ Error ending AI route:', error);
            this.setAIRouteStatus('active'); // Revert status
            this.showAlert('Error', 'Failed to complete AI route', 'error');
        }
    }
    
    setAIRouteStatus(status) {
        const oldStatus = this.aiRouteStatus;
        this.aiRouteStatus = status;
        
        console.log(`🤖 AI route status changed: ${oldStatus} → ${status}`);
        
        // Store in localStorage for persistence
        if (this.currentDriverId) {
            localStorage.setItem(`aiRouteStatus_${this.currentDriverId}`, status);
        }
        
        // Notify callbacks
        this.statusChangeCallbacks.forEach(callback => {
            try {
                callback(status, oldStatus);
            } catch (error) {
                console.error('Error in status change callback:', error);
            }
        });
        
        // Update driver data
        if (window.currentDriverData) {
            window.currentDriverData.aiRouteStatus = status;
            window.currentDriverData.aiRouteActive = status === 'active';
        }
    }
    
    updateSmartActionButtonAppearance() {
        const acceptBtn = document.getElementById('acceptBtn');
        if (!acceptBtn) return;
        
        const btnTitle = acceptBtn.querySelector('.btn-title');
        const btnSubtitle = acceptBtn.querySelector('.btn-subtitle');
        const btnIcon = acceptBtn.querySelector('.fas');
        
        if (!btnTitle || !btnSubtitle || !btnIcon) return;
        
        switch (this.aiRouteStatus) {
            case 'inactive':
                btnTitle.textContent = 'Start AI Route';
                btnSubtitle.textContent = 'Accept AI recommendation';
                btnIcon.className = 'fas fa-route';
                acceptBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
                acceptBtn.disabled = false;
                break;
                
            case 'active':
                btnTitle.textContent = 'End AI Route';
                btnSubtitle.textContent = 'Complete AI collection';
                btnIcon.className = 'fas fa-flag-checkered';
                acceptBtn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
                acceptBtn.disabled = false;
                break;
                
            case 'completing':
                btnTitle.textContent = 'Completing...';
                btnSubtitle.textContent = 'Finalizing AI route';
                btnIcon.className = 'fas fa-spinner fa-spin';
                acceptBtn.style.background = 'linear-gradient(135deg, #64748b, #475569)';
                acceptBtn.disabled = true;
                break;
        }
        
        console.log(`🎨 Updated smart action button for status: ${this.aiRouteStatus}`);
    }
    
    setupStatusTracking() {
        // Listen for driver status changes
        document.addEventListener('driverStatusChange', (event) => {
            const { driverId, movementStatus } = event.detail;
            
            if (driverId === this.currentDriverId) {
                console.log('👤 Driver status changed, checking AI route status...');
                
                // If driver goes offline or inactive, pause AI route
                if (movementStatus === 'offline' && this.aiRouteStatus === 'active') {
                    console.log('⏸️ Pausing AI route due to driver going offline');
                    // Could implement pause functionality here
                }
            }
        });
    }
    
    enhanceMapIndicators() {
        console.log('🗺️ Enhancing map indicators for AI routes...');
        
        // Override the enhanced map status to include AI route indicators
        if (window.enhancedMapStatus) {
            this.statusChangeCallbacks.add((status) => {
                if (this.currentDriverId) {
                    // Force map marker update with AI route status
                    const mapStatus = status === 'active' ? 'ai-route' : 'stationary';
                    window.enhancedMapStatus.updateDriverMarkerStatus(this.currentDriverId, mapStatus);
                }
            });
        }
        
        // Add AI route status to status config
        if (window.enhancedMapStatus?.statusConfig) {
            window.enhancedMapStatus.statusConfig['ai-route'] = {
                emoji: '🤖',
                color: '#8b5cf6',
                pulse: true,
                description: 'AI Route Active'
            };
        }
    }
    
    updateMapIndicators() {
        if (!this.currentDriverId) return;
        
        console.log('🗺️ Updating map indicators for AI route status');
        
        // Update enhanced map status
        if (window.enhancedMapStatus) {
            const mapStatus = this.aiRouteStatus === 'active' ? 'ai-route' : 'stationary';
            window.enhancedMapStatus.forceMarkerUpdate(this.currentDriverId);
        }
        
        // Update enhanced status manager
        if (window.enhancedStatusManager) {
            const movementStatus = this.aiRouteStatus === 'active' ? 'ai-route' : 'stationary';
            window.enhancedStatusManager.updateMapMarkerStatus(this.currentDriverId, movementStatus);
        }
    }
    
    setupHistoryTracking() {
        console.log('📜 Setting up AI route history tracking...');
        
        // Enhance collection recording to include AI route flag
        this.enhanceCollectionRecording();
        
        // Enhance driver history display
        this.enhanceDriverHistory();
    }
    
    enhanceCollectionRecording() {
        // Override bin collection recording to mark AI route collections
        const originalRecordCollection = window.recordBinCollection || function() {};
        
        window.recordBinCollection = (binId, driverId, additionalData = {}) => {
            const enhancedData = {
                ...additionalData,
                aiRoute: this.aiRouteStatus === 'active',
                aiRouteId: this.currentAIRoute?.id || null,
                collectionMethod: this.aiRouteStatus === 'active' ? 'ai-optimized' : 'manual'
            };
            
            console.log('📝 Recording collection with AI route data:', enhancedData);
            
            return originalRecordCollection(binId, driverId, enhancedData);
        };
    }
    
    enhanceDriverHistory() {
        // Add AI route filter to driver history
        if (window.driverHistoryButtonFix) {
            const originalPopulateHistory = window.driverHistoryButtonFix.populateDriverHistoryContent;
            
            if (originalPopulateHistory) {
                window.driverHistoryButtonFix.populateDriverHistoryContent = (driver, collections) => {
                    // Mark AI route collections
                    const enhancedCollections = collections?.map(collection => ({
                        ...collection,
                        aiRoute: collection.aiRoute || false,
                        displayBadge: collection.aiRoute ? '🤖 AI Route' : null
                    }));
                    
                    originalPopulateHistory(driver, enhancedCollections);
                    
                    // Add AI route indicators to history items
                    this.addAIRouteHistoryIndicators();
                };
            }
        }
    }
    
    addAIRouteHistoryIndicators() {
        setTimeout(() => {
            const historyItems = document.querySelectorAll('.history-item');
            historyItems.forEach(item => {
                // Check if this collection was part of an AI route
                // This would be determined by the collection data
                // For now, we'll add a sample indicator
                if (Math.random() < 0.3) { // 30% chance for demo
                    const badge = document.createElement('div');
                    badge.style.cssText = `
                        position: absolute;
                        top: 0.5rem;
                        right: 0.5rem;
                        background: linear-gradient(135deg, #8b5cf6, #7c3aed);
                        color: white;
                        padding: 0.25rem 0.5rem;
                        border-radius: 12px;
                        font-size: 0.75rem;
                        font-weight: 600;
                        display: flex;
                        align-items: center;
                        gap: 0.25rem;
                    `;
                    badge.innerHTML = '🤖 AI Route';
                    
                    item.style.position = 'relative';
                    item.appendChild(badge);
                }
            });
        }, 500);
    }
    
    recordAIRouteUsage(action, routeData) {
        const historyEntry = {
            id: `ai-route-${Date.now()}`,
            driverId: this.currentDriverId,
            action: action, // 'started', 'completed', 'cancelled'
            routeData: routeData,
            timestamp: new Date().toISOString(),
            aiRoute: true
        };
        
        this.aiRouteHistory.push(historyEntry);
        
        // Store in localStorage
        try {
            localStorage.setItem(`aiRouteHistory_${this.currentDriverId}`, JSON.stringify(this.aiRouteHistory));
        } catch (error) {
            console.warn('Error storing AI route history:', error);
        }
        
        console.log(`📊 Recorded AI route usage: ${action}`, historyEntry);
    }
    
    calculateRouteDuration() {
        if (!this.currentAIRoute?.createdAt) return 0;
        
        const startTime = new Date(this.currentAIRoute.createdAt);
        const endTime = new Date();
        return Math.round((endTime - startTime) / 1000 / 60); // Duration in minutes
    }
    
    loadDriverAIRouteStatus() {
        if (!this.currentDriverId) return;
        
        try {
            const savedStatus = localStorage.getItem(`aiRouteStatus_${this.currentDriverId}`);
            if (savedStatus && ['inactive', 'active', 'completing'].includes(savedStatus)) {
                this.aiRouteStatus = savedStatus;
                console.log(`📊 Loaded AI route status: ${savedStatus}`);
                
                // Update UI
                setTimeout(() => {
                    this.updateSmartActionButtonAppearance();
                    this.updateMapIndicators();
                }, 1000);
            }
            
            // Load history
            const savedHistory = localStorage.getItem(`aiRouteHistory_${this.currentDriverId}`);
            if (savedHistory) {
                this.aiRouteHistory = JSON.parse(savedHistory);
                console.log(`📜 Loaded ${this.aiRouteHistory.length} AI route history entries`);
            }
            
        } catch (error) {
            console.warn('Error loading AI route status:', error);
        }
    }
    
    showDriverIdentificationDialog() {
        console.log('🔧 Showing driver identification dialog...');
        
        // Create identification dialog
        const modal = document.createElement('div');
        modal.className = 'driver-id-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        // Get available drivers
        let driverOptions = '';
        if (window.dataManager?.getUsers) {
            const users = window.dataManager.getUsers();
            const drivers = users.filter(user => user.type === 'driver');
            driverOptions = drivers.map(driver => 
                `<option value="${driver.id}">${driver.name} (${driver.id})</option>`
            ).join('');
        }
        
        modal.innerHTML = `
            <div class="modal-content" style="
                background: white;
                padding: 2rem;
                border-radius: 12px;
                max-width: 450px;
                width: 90%;
                text-align: center;
                box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            ">
                <div style="font-size: 3rem; margin-bottom: 1rem;">👤</div>
                <h2 style="margin: 0 0 1rem 0; color: #1e293b;">Driver Identification Required</h2>
                <p style="color: #64748b; margin-bottom: 2rem;">
                    Please select your driver account to start the AI route:
                </p>
                
                <select id="driverSelect" style="
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid #d1d5db;
                    border-radius: 8px;
                    margin-bottom: 2rem;
                    font-size: 1rem;
                ">
                    <option value="">Select Driver...</option>
                    ${driverOptions}
                </select>
                
                <div style="display: flex; gap: 1rem;">
                    <button onclick="this.closest('.driver-id-modal').remove()" style="
                        flex: 1;
                        background: #e2e8f0;
                        color: #64748b;
                        border: none;
                        padding: 0.75rem 1rem;
                        border-radius: 8px;
                        font-weight: 600;
                        cursor: pointer;
                    ">
                        Cancel
                    </button>
                    <button onclick="window.enhancedAIRouteManager.setDriverIdManually(document.getElementById('driverSelect').value); this.closest('.driver-id-modal').remove();" style="
                        flex: 1;
                        background: linear-gradient(135deg, #10b981, #059669);
                        color: white;
                        border: none;
                        padding: 0.75rem 1rem;
                        border-radius: 8px;
                        font-weight: 600;
                        cursor: pointer;
                    ">
                        👤 Set Driver
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    setDriverIdManually(driverId) {
        if (!driverId) {
            this.showAlert('Error', 'Please select a driver', 'error');
            return;
        }
        
        console.log(`👤 Manually setting driver ID: ${driverId}`);
        
        this.currentDriverId = driverId;
        
        // Store in localStorage for future use
        try {
            const driverData = { id: driverId };
            localStorage.setItem('currentDriver', JSON.stringify(driverData));
            localStorage.setItem('manualDriverId', driverId);
        } catch (error) {
            console.warn('Error storing manual driver ID:', error);
        }
        
        // Update current driver data if available
        if (window.dataManager?.getUsers) {
            const users = window.dataManager.getUsers();
            const driver = users.find(user => user.id === driverId);
            if (driver) {
                window.currentDriverData = driver;
            }
        }
        
        // Load AI route status
        this.loadDriverAIRouteStatus();
        
        // Update UI
        this.updateSmartActionButtonAppearance();
        this.updateMapIndicators();
        
        this.showAlert('Success', `Driver ${driverId} identified successfully`, 'success');
        
        console.log('✅ Driver ID set manually and system updated');
    }
    
    showAlert(title, message, type, duration = 3000) {
        // Use app's alert system if available
        if (window.app?.showAlert) {
            window.app.showAlert(title, message, type, duration);
        } else {
            console.log(`${type.toUpperCase()}: ${title} - ${message}`);
        }
    }
    
    // Public API methods
    getCurrentAIRouteStatus() {
        return {
            status: this.aiRouteStatus,
            currentRoute: this.currentAIRoute,
            driverId: this.currentDriverId,
            historyCount: this.aiRouteHistory.length
        };
    }
    
    forceStatusUpdate(status) {
        console.log(`🔧 Force updating AI route status to: ${status}`);
        this.setAIRouteStatus(status);
        this.updateSmartActionButtonAppearance();
        this.updateMapIndicators();
    }
    
    getAIRouteHistory() {
        return this.aiRouteHistory;
    }
    
    setDriverIdManually(driverId) {
        console.log(`👤 Manually setting driver ID to: ${driverId}`);
        this.currentDriverId = driverId;
        this.detectionRetries = 0; // Reset retry count
        this.loadDriverAIRouteStatus();
        return this.getCurrentAIRouteStatus();
    }
    
    onStatusChange(callback) {
        this.statusChangeCallbacks.add(callback);
        return () => this.statusChangeCallbacks.delete(callback);
    }
}

// Initialize the enhanced AI route manager
window.enhancedAIRouteManager = new EnhancedAIRouteManager();

// Add global debug functions
window.debugAIRoute = function() {
    const status = window.enhancedAIRouteManager.getCurrentAIRouteStatus();
    console.table(status);
    return status;
};

window.setAIRouteDriver = function(driverId) {
    if (!driverId) {
        console.error('❌ Please provide a driver ID: setAIRouteDriver("USR-003")');
        return;
    }
    
    console.log(`👤 Setting AI route driver to: ${driverId}`);
    window.enhancedAIRouteManager.setDriverIdManually(driverId);
    return window.enhancedAIRouteManager.getCurrentAIRouteStatus();
};

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedAIRouteManager;
}

console.log('🤖 Enhanced AI Route Manager loaded and ready');
console.log('🧪 Debug Commands:');
console.log('  - debugAIRoute() - Check AI route status');
console.log('  - setAIRouteDriver("USR-003") - Manually set driver ID');
