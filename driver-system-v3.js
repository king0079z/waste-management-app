// Driver System V3.0 - Complete Reconstruction with Full Application Integration
// Ensures real-time synchronization across ALL application components

class DriverSystemV3 {
    constructor() {
        this.currentUser = null;
        this.buttons = {};
        this.initialized = false;
        this.syncInterval = null;
        this.statusInterval = null;
        
        // Button state management and debouncing
        this.isProcessingRouteAction = false;
        this.lastRouteActionTime = 0;
        this.routeActionDebounceTime = 2000; // 2 seconds
        this._lastSyncDriverStatusAt = 0;
        this._lastSyncDriverUpdateAt = 0;
        this._minStatusIntervalMs = 2500;
        this._minUpdateIntervalMs = 3000;
        
        console.log('🎯 Initializing Driver System V3.0 - Complete Reconstruction');
        this.init();
    }

    async init() {
        // Wait for required systems
        await this.waitForSystems();
        
        // Initialize driver buttons
        this.initializeButtons();
        
        // Setup event listeners  
        this.setupEventListeners();
        
        // Initialize mobile bottom navigation (world-class driver UI)
        this.initDriverMobileNav();
        
        // Start monitoring
        this.startMonitoring();
        
        this.initialized = true;
        
        // Set global instance with BOTH names for compatibility
        window.driverSystemV3Instance = this;
        window.enhancedDriverSystemComplete = this;
        
        console.log('✅ Driver System V3.0 initialized successfully');
    }

    async waitForSystems() {
        console.log('⏳ Waiting for required systems...');
        
        let attempts = 0;
        const maxAttempts = 50;
        
        while (attempts < maxAttempts) {
            if (typeof window !== 'undefined' && 
                window.dataManager && 
                window.authManager && 
                window.mapManager) {
                console.log('✅ All required systems ready');
                return;
            }
            
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        console.warn('⚠️ Some systems may not be ready, proceeding anyway');
    }

    initializeButtons() {
        this.buttons = {
            startRoute: document.getElementById('startRouteBtn'),
            registerPickup: document.getElementById('registerPickupBtn'),
            reportIssue: document.getElementById('reportIssueDriverBtn'),
            updateFuel: document.getElementById('updateFuelBtn')
        };

        // Validate buttons exist
        Object.entries(this.buttons).forEach(([key, button]) => {
            if (button) {
                console.log(`✅ Found ${key} button`);
                // Remove any existing event listeners
                button.removeEventListener('click', this.handleClick);
            } else {
                console.warn(`❌ Missing ${key} button`);
            }
        });
    }

    setupEventListeners() {
        console.log('🎯 Setting up enhanced event listeners...');
        
        // Start Route Button - Enhanced with state detection
        if (this.buttons.startRoute) {
            this.buttons.startRoute.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('🖱️ Start/End Route button clicked');
                
                // Check current state to determine action
                const currentStatus = this.getDriverMovementStatus();
                console.log('📍 Current driver status:', currentStatus);
                
                if (currentStatus === 'on-route') {
                    console.log('➡️ Driver is on route, ending route...');
                    await this.endRoute();
                } else {
                    console.log('➡️ Driver is stationary, starting route...');
                    await this.handleStartRoute();
                }
            });
            
            console.log('✅ Start/End Route button listener attached');
        }

        // Register Pickup Button
        if (this.buttons.registerPickup) {
            this.buttons.registerPickup.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                await this.handleRegisterPickup();
            });
        }

        // Report Issue Button
        if (this.buttons.reportIssue) {
            this.buttons.reportIssue.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                await this.handleReportIssue();
            });
        }

        // Update Fuel Button
        if (this.buttons.updateFuel) {
            this.buttons.updateFuel.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                await this.handleUpdateFuel();
            });
        }

        // Refresh nav badges when collection is recorded or messages change
        document.addEventListener('driverNavBadgesRefresh', () => this.updateDriverNavBadges());
        window.addEventListener('storage', (e) => {
            if (e.key === 'driverMessages' && this.currentUser) this.updateDriverNavBadges();
        });

        console.log('✅ All event listeners setup complete');
    }

    /**
     * World-class mobile UI: bottom nav + left drawer, separate pages (Home, Routes, AI, Messages, More).
     * No long scrolling - each section is one tap away.
     */
    initDriverMobileNav() {
        const nav = document.getElementById('driverBottomNav');
        const navItems = nav ? nav.querySelectorAll('.driver-nav-item') : [];
        
        navItems.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const page = btn.getAttribute('data-page');
                if (page) this.switchDriverPage(page);
            });
        });
        
        // Left drawer: open/close and item clicks
        const menuBtn = document.getElementById('driverMenuBtn');
        const drawer = document.getElementById('driverDrawer');
        const drawerOverlay = document.getElementById('driverDrawerOverlay');
        const drawerClose = document.getElementById('driverDrawerClose');
        const drawerItems = document.querySelectorAll('.driver-drawer-item');
        
        const openDrawer = () => {
            if (drawer) drawer.classList.add('driver-drawer-open');
            if (drawerOverlay) drawerOverlay.classList.add('driver-drawer-open');
            if (drawerOverlay) drawerOverlay.setAttribute('aria-hidden', 'false');
        };
        const closeDrawer = () => {
            if (drawer) drawer.classList.remove('driver-drawer-open');
            if (drawerOverlay) drawerOverlay.classList.remove('driver-drawer-open');
            if (drawerOverlay) drawerOverlay.setAttribute('aria-hidden', 'true');
        };
        
        if (menuBtn) menuBtn.addEventListener('click', openDrawer);
        if (drawerClose) drawerClose.addEventListener('click', closeDrawer);
        if (drawerOverlay) drawerOverlay.addEventListener('click', closeDrawer);
        
        drawerItems.forEach(btn => {
            btn.addEventListener('click', () => {
                const page = btn.getAttribute('data-page');
                if (page) {
                    this.switchDriverPage(page);
                    closeDrawer();
                }
            });
        });
        
        console.log('✅ Driver mobile navigation initialized');
    }

    switchDriverPage(pageId) {
        const pages = document.querySelectorAll('.driver-page');
        const navItems = document.querySelectorAll('#driverBottomNav .driver-nav-item');
        const drawerItems = document.querySelectorAll('.driver-drawer-item');
        
        pages.forEach(p => {
            const isActive = p.getAttribute('data-page') === pageId;
            p.classList.toggle('active', isActive);
        });
        
        navItems.forEach(btn => {
            const isActive = btn.getAttribute('data-page') === pageId;
            btn.classList.toggle('active', isActive);
        });
        
        drawerItems.forEach(btn => {
            const isActive = btn.getAttribute('data-page') === pageId;
            btn.classList.toggle('active', isActive);
        });
        
        // Mark page as seen so notification badge clears for this tab
        if (this.currentUser && ['home', 'messages', 'more'].includes(pageId)) {
            this.setDriverNavLastSeen(this.currentUser.id, pageId);
            this.updateDriverNavBadges();
        }

        // World-class: when driver opens Messages tab, mark as read (clear badge) and sync from server
        if (pageId === 'messages' && this.currentUser) {
            if (window.enhancedMessaging) {
                if (typeof window.enhancedMessaging.markMessagesAsRead === 'function') {
                    window.enhancedMessaging.markMessagesAsRead(this.currentUser.id, 'driver');
                }
                if (typeof window.enhancedMessaging.loadDriverMessages === 'function') {
                    window.enhancedMessaging.updateCurrentUser();
                    window.enhancedMessaging.loadDriverMessages(this.currentUser.id);
                }
            }
        }
        
        if (pageId === 'ai' && this.currentUser) {
            setTimeout(() => this.updateSmartCollectionAssistant(), 100);
        }
    }

    startMonitoring() {
        // Monitor user status every 2 seconds
        this.statusInterval = setInterval(() => {
            this.checkUserStatus();
        }, 2000);
        
        // Sync complete driver data to server every 10 seconds
        this.syncInterval = setInterval(() => {
            if (this.currentUser) {
                this.syncCompleteDriverDataToServer();
            }
        }, 10000);
        
        // Periodic full sync every 30 seconds
        this.fullSyncInterval = setInterval(() => {
            if (this.currentUser) {
                this.performFullSync();
            }
        }, 30000);
    }

    checkUserStatus() {
        try {
            const newUser = window.authManager ? window.authManager.getCurrentUser() : null;
            
            if (newUser && newUser.type === 'driver') {
                if (!this.currentUser || this.currentUser.id !== newUser.id) {
                    this.currentUser = newUser;
                    this.onDriverLogin();
                }
            } else {
                if (this.currentUser) {
                    this.currentUser = null;
                    this.onDriverLogout();
                }
            }
        } catch (error) {
            console.warn('⚠️ Error checking user status:', error);
        }
    }

    onDriverLogin() {
        console.log('👤 Driver logged in:', this.currentUser.name);
        this.enableButtons();
        this.updateAllButtonStates();
        this.initializeDriverLocation();
        // Sync dashboard stats (e.g. fuel %) from actual stored values, not HTML default
        this.updateDriverQuickStats();
        // Show notification badges (new assignments, unread messages, new collection history)
        this.updateDriverNavBadges();

        // Immediate full sync
        setTimeout(() => {
            this.performFullSync();
        }, 500);
    }

    onDriverLogout() {
        console.log('👤 Driver logged out');
        this.disableButtons();
    }

    // ==================== BUTTON HANDLERS ====================

    async handleStartRoute() {
        if (!this.currentUser) {
            this.showAlert('Authentication Error', 'Please log in to manage routes', 'error');
            return;
        }

        // Debouncing: Prevent rapid successive clicks
        const now = Date.now();
        if (this.isProcessingRouteAction || (now - this.lastRouteActionTime) < this.routeActionDebounceTime) {
            console.log('⏳ Route action in progress or too soon, ignoring click');
            this.showAlert('Please Wait', 'Route action in progress...', 'info');
            return;
        }

        this.isProcessingRouteAction = true;
        this.lastRouteActionTime = now;

        console.log('🚗 Start Route button clicked for:', this.currentUser.name);

        try {
            const currentStatus = this.getDriverMovementStatus();
            const isOnRoute = currentStatus === 'on-route';
            
            console.log(`🔍 Current driver status: ${currentStatus}, isOnRoute: ${isOnRoute}`);

            // Immediate button visual feedback
            this.setButtonLoadingState(true);

            if (isOnRoute) {
                console.log('🏁 Ending current route...');
                await this.endRoute();
            } else {
                console.log('🚀 Starting new route...');
                await this.startRoute();
            }
        } catch (error) {
            console.error('❌ Route action failed:', error);
            this.showAlert('Route Error', 'Failed to update route status', 'error');
        } finally {
            // Reset processing state
            this.isProcessingRouteAction = false;
            this.setButtonLoadingState(false);
        }
    }

    async startRoute() {
        console.log('🚀 Starting route for driver:', this.currentUser.name);

        // 1. Create and store route ID
        const routeId = `route-${Date.now()}`;
        this.currentUser.currentRouteId = routeId;
        
        // 2. Update driver movement status locally
        this.setDriverMovementStatus('on-route');
        
            // 2. IMMEDIATE button update to reflect the change
            this.updateStartRouteButton();
            
            // 2.5. Force another update after delay
            setTimeout(() => {
                this.updateStartRouteButton();
            }, 100);
        
        // 2.5. Force another update after a short delay to ensure visibility
        setTimeout(() => {
            this.updateStartRouteButton();
        }, 100);
        
        // 3. Update driver location status
        const location = this.getCurrentLocation();
        if (location) {
            location.status = 'on-route';
            location.movementStatus = 'on-route';
            this.updateDriverLocation(location);
        }

        // 4. Update driver in data manager with route ID
        window.dataManager.updateUser(this.currentUser.id, {
            movementStatus: 'on-route',
            currentRouteId: routeId,
            lastStatusUpdate: new Date().toISOString(),
            status: 'active'
        });

        // 5. Sync status to server immediately
        await this.syncDriverStatusToServer();

        // 6. Update quick stats immediately
        this.updateDriverQuickStats();

        // 7. Confirm button state again after server sync
        this.updateStartRouteButton();
        
        // 7.5. Final confirmation after brief delay
        setTimeout(() => {
            this.updateStartRouteButton();
        }, 200);

        // 8. Force full sync across all systems (but delay to prevent race conditions)
        setTimeout(async () => {
            await this.performFullSync();
        }, 500);
        
        // 8.5. Dispatch route start event for analytics with the SAME route ID
        const routeStartEvent = new CustomEvent('routeStarted', {
            detail: {
                driverId: this.currentUser.id,
                routeId: routeId,  // Use the same route ID created above
                startTime: new Date().toISOString(),
                status: 'started',
                driver: this.currentUser,
                location: this.getCurrentLocation()
            }
        });
        document.dispatchEvent(routeStartEvent);
        
        // Update analytics with route start
        if (window.analyticsManagerV2) {
            window.analyticsManagerV2.handleRouteStart(routeStartEvent.detail);
        }
        
        // Update AI bridge with route start
        if (window.aiIntegrationBridge) {
            window.aiIntegrationBridge.handleRouteStart(routeStartEvent.detail);
        }

        // 9. Show success notification
        this.showAlert('Route Started', '🚗 Route started and synced to server!', 'success');
        
        console.log('✅ Route started successfully - status:', this.getDriverMovementStatus());
        
        // 10. FINAL button state confirmation - single update only
        setTimeout(() => {
            console.log('🔄 Final button update');
            this.updateStartRouteButton();
        }, 300);
    }

    async endRoute() {
        console.log('🏁 Ending route for driver:', this.currentUser.name);

        try {
            // 1. Clear route ID and update driver status locally
            this.currentUser.currentRouteId = null;
            this.setDriverMovementStatus('stationary');
            
            // 2. Update driver location status
            const location = this.getCurrentLocation();
            if (location) {
                location.status = 'stationary';
                location.movementStatus = 'stationary';
                this.updateDriverLocation(location);
            }

            // 3. Update driver in data manager with proper route completion
            window.dataManager.updateUser(this.currentUser.id, {
                movementStatus: 'stationary',
                currentRouteId: null,  // Clear route ID
                lastStatusUpdate: new Date().toISOString(),
                status: 'available',
                routeEndTime: new Date().toISOString(),
                lastRouteCompletion: new Date().toISOString()
            });

            // 4. Complete any active routes for this driver
            await this.completeActiveRoutes();

            // 5. Sync status to server immediately with route completion
            await this.syncDriverStatusToServer();
            await this.syncRouteCompletionToServer();

            // 6. Update button state immediately
            this.updateStartRouteButton();
            
            // 6.5. Confirm button state with delay
            setTimeout(() => {
                this.updateStartRouteButton();
            }, 200);

            // 7. Force immediate sync across all systems with route update
            await this.performFullSyncWithRouteUpdate();

            // 8. Trigger immediate UI updates across all components
            this.dispatchDriverUpdateEvent();
            
            // 8.5. Dispatch route completion event for analytics
            const routeCompletionEvent = new CustomEvent('routeCompleted', {
                detail: {
                    driverId: this.currentUser.id,
                    routeId: `route-${Date.now()}`,
                    completionTime: new Date().toISOString(),
                    status: 'completed',
                    driver: this.currentUser
                }
            });
            document.dispatchEvent(routeCompletionEvent);
            
            // Update analytics with route completion
            if (window.analyticsManagerV2 && typeof window.analyticsManagerV2.handleRouteCompletion === 'function') {
                window.analyticsManagerV2.handleRouteCompletion(routeCompletionEvent.detail);
            }
            
            // Update AI bridge with route completion
            if (window.aiIntegrationBridge) {
                window.aiIntegrationBridge.handleRouteCompletion(routeCompletionEvent.detail);
            }

            // 9. Show success notification
            this.showAlert('Route Completed', '✅ Route ended successfully and synced!', 'success');
            
            console.log('✅ Route ended successfully for driver:', this.currentUser.name);
            
            // 10. FINAL button state confirmation with cascading updates
            setTimeout(() => {
                this.updateStartRouteButton();
                console.log('🔄 Button update #1 (immediate) after endRoute');
            }, 50);
            
            setTimeout(() => {
                this.updateStartRouteButton();
                console.log('🔄 Button update #2 (delayed) after endRoute');
            }, 300);
            
            setTimeout(() => {
                this.updateStartRouteButton();
                console.log('🔄 Button update #3 (final) after endRoute');
            }, 800);
            
        } catch (error) {
            console.error('❌ Failed to end route:', error);
            this.showAlert('Route Error', 'Failed to end route. Please try again.', 'error');
        }
    }

    async completeActiveRoutes() {
        console.log('🏁 Completing active routes for driver:', this.currentUser.id);
        
        try {
            // Get active routes for this driver
            const response = await fetch(`/api/driver/${this.currentUser.id}/routes`);
            if (response.ok) {
                const data = await response.json();
                const activeRoutes = data.routes || [];
                
                // Mark all active routes as completed
                for (const route of activeRoutes) {
                    if (route.status === 'active' || route.status === 'in-progress') {
                        route.status = 'completed';
                        route.completedAt = new Date().toISOString();
                        route.completedBy = this.currentUser.id;
                        
                        // Update route on server
                        await fetch('/api/routes', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(route)
                        });
                    }
                }
                
                console.log(`✅ Completed ${activeRoutes.length} routes for driver ${this.currentUser.id}`);
            }
        } catch (error) {
            console.error('❌ Failed to complete active routes:', error);
        }
    }

    async syncRouteCompletionToServer() {
        console.log('🔄 Syncing route completion to server...');
        
        try {
            const response = await fetch(`/api/driver/${this.currentUser.id}/route-completion`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    driverId: this.currentUser.id,
                    completionTime: new Date().toISOString(),
                    status: 'completed',
                    movementStatus: 'stationary'
                })
            });
            
            if (response.ok) {
                console.log('✅ Route completion synced to server');
            } else {
                console.warn('⚠️ Route completion sync failed:', response.status);
            }
        } catch (error) {
            console.error('❌ Route completion sync error:', error);
        }
    }

    async performFullSyncWithRouteUpdate() {
        console.log('🔄 Performing full sync with route updates...');
        
        // Mark activity for intelligent sync
        if (window.syncManager) {
            window.syncManager.markActivity();
        }
        
        // Perform the standard full sync
        await this.performFullSync();
        
        // Additional route-specific sync
        setTimeout(async () => {
            // Force immediate map update for route status
            if (window.mapManager && window.mapManager.map) {
                window.mapManager.loadDriversOnMap();
                window.mapManager.updateDriverStatus(this.currentUser.id, 'stationary');
            }
            
            // Update live monitoring if active
            if (window.app && window.app.currentSection === 'monitoring') {
                await window.app.performLiveMonitoringSync();
            }
            
            // Force intelligent sync
            if (window.syncManager) {
                await window.syncManager.performIntelligentSync();
            }
        }, 200);
    }

    dispatchDriverUpdateEvent() {
        console.log('📢 Dispatching driver update event...');
        
        // Refresh user data to get CURRENT status
        const freshUser = window.dataManager.getUserById(this.currentUser.id);
        if (freshUser) {
            this.currentUser = freshUser;
        }
        
        const currentStatus = this.currentUser.movementStatus || 'stationary';
        console.log(`📍 Dispatching event with FRESH status: ${currentStatus}`);
        
        // Dispatch custom event for immediate UI updates
        const updateEvent = new CustomEvent('driverDataUpdated', {
            detail: {
                driverId: this.currentUser.id,
                driver: this.currentUser,
                status: currentStatus,  // Include current status
                action: 'route_completed',
                timestamp: new Date().toISOString()
            }
        });
        
        document.dispatchEvent(updateEvent);
        
        // Update analytics system if available
        if (window.analyticsManagerV2) {
            window.analyticsManagerV2.handleDriverUpdate(updateEvent.detail);
        }
        
        // Update AI integration bridge if available
        if (window.aiIntegrationBridge) {
            window.aiIntegrationBridge.handleDriverStatusChange(updateEvent.detail);
        }
        
        // Update driver quick stats immediately
        this.updateDriverQuickStats();
        
        // Also trigger map updates directly
        setTimeout(() => {
            if (window.mapManager) {
                window.mapManager.updateDriverDataUI(this.currentUser.id);
                window.mapManager.refreshDriverPopup(this.currentUser.id);
                
                // Force driver marker update with new status
                window.mapManager.updateDriverStatus(this.currentUser.id, this.currentUser.movementStatus || 'stationary');
            }
        }, 100);
    }

    updateDriverQuickStats() {
        console.log('📊 Updating driver quick stats...');
        
        try {
            // Update fuel level in driver stats
            const fuelElement = document.getElementById('driverFuelLevel');
            if (fuelElement) {
                const currentFuel = this.getDriverFuelLevel();
                fuelElement.textContent = `${currentFuel}%`;
            }
            
            // Update collections count
            const collectionsElement = document.getElementById('driverTodayCollections');
            if (collectionsElement) {
                const collections = window.dataManager.getTodayCollections().filter(c => c.driverId === this.currentUser.id);
                collectionsElement.textContent = collections.length;
            }
            
            // Update pending bins
            const pendingBinsElement = document.getElementById('driverPendingBins');
            if (pendingBinsElement) {
                const routes = window.dataManager.getRoutes().filter(r => 
                    r.driverId === this.currentUser.id && 
                    (r.status === 'active' || r.status === 'in-progress')
                );
                const pendingBins = routes.reduce((total, route) => total + (route.bins?.length || 0), 0);
                pendingBinsElement.textContent = pendingBins;
            }
            
            // Update driver rating
            const ratingElement = document.getElementById('driverRating');
            if (ratingElement) {
                ratingElement.textContent = (Number(this.currentUser.rating) || 5).toFixed(1);
            }
            
            // Update Smart Collection Assistant
            this.updateSmartCollectionAssistant();
            
            // Update driver quick stats in modal if it's open
            this.updateDriverModalQuickStats();
            
            // Update bottom nav / drawer notification badges
            this.updateDriverNavBadges();
            
            console.log('✅ Driver quick stats updated successfully');
        } catch (error) {
            console.error('❌ Failed to update driver quick stats:', error);
        }
    }

    /** Notification badges: Home = new assignments, Messages = unread chat, More = new collection history */
    getDriverNavLastSeenKey(driverId, page) {
        return `driverNavLastSeen_${driverId}_${page}`;
    }
    setDriverNavLastSeen(driverId, page) {
        try {
            localStorage.setItem(this.getDriverNavLastSeenKey(driverId, page), new Date().toISOString());
        } catch (e) {}
    }
    getDriverNavLastSeen(driverId, page) {
        try {
            const s = localStorage.getItem(this.getDriverNavLastSeenKey(driverId, page));
            return s ? new Date(s).getTime() : 0;
        } catch (e) { return 0; }
    }
    getNewAssignmentsCount(driverId) {
        const routes = window.dataManager.getDriverRoutes(driverId) || [];
        const lastSeen = this.getDriverNavLastSeen(driverId, 'home');
        return routes.filter(r => {
            const t = (r.assignedAt || r.createdAt) ? new Date(r.assignedAt || r.createdAt).getTime() : 0;
            return t > lastSeen && r.status !== 'completed' && r.status !== 'cancelled';
        }).length;
    }
    getUnreadMessagesCount(driverId) {
        try {
            const raw = localStorage.getItem('driverMessages');
            const all = raw ? JSON.parse(raw) : {};
            const list = all[driverId] || [];
            const lastSeen = this.getDriverNavLastSeen(driverId, 'messages');
            // Count messages from admin/management to this driver that are newer than last time they opened Messages
            return list.filter(m => {
                const fromAdmin = m.sender === 'admin' || m.sender === 'management' || m.broadcast;
                const after = new Date(m.timestamp || 0).getTime() > lastSeen;
                return fromAdmin && after;
            }).length;
        } catch (e) { return 0; }
    }
    getNewHistoryCount(driverId) {
        const history = window.dataManager.getDriverHistory(driverId) || [];
        const lastSeen = this.getDriverNavLastSeen(driverId, 'more');
        return history.filter(h => new Date(h.timestamp || 0).getTime() > lastSeen).length;
    }
    setBadge(el, count) {
        if (!el) return;
        if (count <= 0) {
            el.style.display = 'none';
            el.textContent = '0';
        } else {
            el.style.display = 'flex';
            el.textContent = count > 99 ? '99+' : String(count);
        }
    }
    updateDriverNavBadges() {
        if (!this.currentUser) return;
        const id = this.currentUser.id;
        const home = this.getNewAssignmentsCount(id);
        const messages = this.getUnreadMessagesCount(id);
        const more = this.getNewHistoryCount(id);
        this.setBadge(document.getElementById('driverNavHomeBadge'), home);
        this.setBadge(document.getElementById('driverNavMessageBadge'), messages);
        this.setBadge(document.getElementById('driverNavMoreBadge'), more);
        this.setBadge(document.getElementById('driverDrawerHomeBadge'), home);
        this.setBadge(document.getElementById('driverDrawerMessageBadge'), messages);
        this.setBadge(document.getElementById('driverDrawerMoreBadge'), more);
    }

    updateSmartCollectionAssistant() {
        const assistantPanel = document.getElementById('v3SmartCollectionPanel');
        if (!assistantPanel) {
            console.log('⚠️ Smart Collection Assistant panel not found in DOM');
            return;
        }

        try {
            // Get driver location
            const driverLocation = window.dataManager?.getDriverLocation(this.currentUser.id);
            if (!driverLocation || !driverLocation.lat || !driverLocation.lng) {
                assistantPanel.innerHTML = `
                    <div style="padding: 1rem; text-align: center; color: #64748b;">
                        <i class="fas fa-location-crosshairs" style="font-size: 2rem; margin-bottom: 0.5rem; opacity: 0.5;"></i>
                        <p>📍 Waiting for GPS location...</p>
                    </div>
                `;
                return;
            }

            // Get all bins that need collection (>= 75% full)
            const allBins = window.dataManager?.getBins() || [];
            const binsNeedingCollection = allBins.filter(bin => {
                const fillLevel = bin.fill || bin.fillLevel || 0;
                return fillLevel >= 75 && !bin.deleted;
            });

            if (binsNeedingCollection.length === 0) {
                assistantPanel.innerHTML = `
                    <div style="padding: 1rem; text-align: center; color: #10b981;">
                        <i class="fas fa-check-circle" style="font-size: 2rem; margin-bottom: 0.5rem;"></i>
                        <p>✅ All bins are below 75% capacity!</p>
                    </div>
                `;
                return;
            }

            // Calculate distance to each bin
            const binsWithDistance = binsNeedingCollection.map(bin => {
                const distance = this.calculateDistance(
                    driverLocation.lat,
                    driverLocation.lng,
                    bin.lat,
                    bin.lng
                );
                return { ...bin, distance };
            }).sort((a, b) => a.distance - b.distance);

            // Show top 3 nearest bins
            const nearestBins = binsWithDistance.slice(0, 3);
            
            const binsHTML = nearestBins.map((bin, index) => `
                <div style="
                    padding: 0.75rem;
                    background: ${index === 0 ? 'linear-gradient(135deg, #10b981, #059669)' : '#f1f5f9'};
                    color: ${index === 0 ? 'white' : '#1e293b'};
                    border-radius: 8px;
                    margin-bottom: 0.5rem;
                    cursor: pointer;
                    transition: transform 0.2s;
                " onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="flex: 1;">
                            <strong>${index === 0 ? '🎯 ' : ''}${bin.id}</strong>
                            <div style="font-size: 0.875rem; opacity: 0.9;">
                                📍 ${bin.location || 'Unknown'} • ${bin.distance.toFixed(2)} km away
                            </div>
                            <div style="font-size: 0.875rem; margin-top: 0.25rem;">
                                ${this.getFillLevelIcon(bin.fill || bin.fillLevel)} ${bin.fill || bin.fillLevel}% Full
                            </div>
                        </div>
                        <button onclick="window.mapManager?.map?.flyTo([${bin.lat}, ${bin.lng}], 16)" style="
                            background: ${index === 0 ? 'rgba(255,255,255,0.2)' : '#3b82f6'};
                            color: white;
                            border: none;
                            padding: 0.5rem 1rem;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 0.875rem;
                        ">
                            <i class="fas fa-map-marker-alt"></i> Navigate
                        </button>
                    </div>
                </div>
            `).join('');

            assistantPanel.innerHTML = `
                <div style="padding: 0.5rem;">
                    <h4 style="margin: 0 0 0.75rem 0; color: #059669; font-size: 0.9rem;">
                        🎯 Smart Collection Assistant
                    </h4>
                    ${binsHTML}
                    <div style="margin-top: 0.5rem; padding: 0.5rem; background: #eff6ff; border-radius: 6px; font-size: 0.75rem; color: #3b82f6;">
                        <i class="fas fa-info-circle"></i> Showing ${nearestBins.length} of ${binsNeedingCollection.length} bins needing collection
                    </div>
                </div>
            `;

            console.log(`✅ Smart Collection Assistant updated: ${nearestBins.length} nearest bins shown`);
        } catch (error) {
            console.error('❌ Failed to update Smart Collection Assistant:', error);
            assistantPanel.innerHTML = `
                <div style="padding: 1rem; text-align: center; color: #ef4444;">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Error loading recommendations</p>
                </div>
            `;
        }
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        // Haversine formula to calculate distance in kilometers
        const R = 6371; // Radius of Earth in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    getFillLevelIcon(fillLevel) {
        if (fillLevel >= 90) return '🔴';
        if (fillLevel >= 75) return '🟠';
        if (fillLevel >= 50) return '🟡';
        return '🟢';
    }

    updateDriverModalQuickStats() {
        // Update stats in the driver details modal if it's open
        const currentFuel = this.getDriverFuelLevel();
        const modalStats = {
            'driverTotalTrips': this.currentUser.totalTrips || 0,
            'driverTotalCollections': this.currentUser.totalCollections || 0,
            'driverFuelLevel': `${currentFuel}%`,
            'driverFuelLevelModal': `${currentFuel}%`,
            'driverFuelPercentage': `${currentFuel}%`
        };
        
        Object.entries(modalStats).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }

    async handleRegisterPickup() {
        if (!this.currentUser) {
            this.showAlert('Authentication Error', 'Please log in to register pickups', 'error');
            return;
        }

        console.log('📦 Register Pickup button clicked for:', this.currentUser.name);

        // Get available bins for pickup
        const bins = this.getAvailableBins();
        
        if (bins.length === 0) {
            this.showAlert('No Bins Available', 'No bins are currently available for pickup', 'warning');
            return;
        }

        // Show pickup modal
        this.showPickupModal(bins);
    }

    async handleReportIssue() {
        if (!this.currentUser) {
            this.showAlert('Authentication Error', 'Please log in to report issues', 'error');
            return;
        }

        console.log('🚨 Report Issue button clicked for:', this.currentUser.name);
        this.showIssueModal();
    }

    async handleUpdateFuel() {
        if (!this.currentUser) {
            this.showAlert('Authentication Error', 'Please log in to update fuel level', 'error');
            return;
        }

        console.log('⛽ Update Fuel button clicked for:', this.currentUser.name);
        this.showFuelModal();
    }

    // ==================== FUEL MANAGEMENT ====================

    showFuelModal() {
        const currentFuel = this.getDriverFuelLevel();

        const modal = document.createElement('div');
        modal.id = 'v3FuelModal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
            background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; 
            z-index: 10000; animation: fadeIn 0.3s ease;
        `;

        modal.innerHTML = `
            <div style="background: white; border-radius: 20px; padding: 2.5rem; max-width: 450px; width: 90%; box-shadow: 0 25px 50px rgba(0,0,0,0.3);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <h3 style="margin: 0; color: #1f2937; font-size: 1.5rem; display: flex; align-items: center;">
                        ⛽ <span style="margin-left: 0.5rem;">Update Fuel Level</span>
                    </h3>
                    <button onclick="this.closest('#v3FuelModal').remove()" style="background: none; border: none; font-size: 1.5rem; color: #6b7280; cursor: pointer;">&times;</button>
                </div>

                <div style="margin-bottom: 2rem;">
                    <label style="display: block; margin-bottom: 1rem; font-weight: 600; color: #374151;">Current Fuel Level: ${currentFuel}%</label>
                    
                    <div style="margin-bottom: 1rem;">
                        <input type="range" id="fuelSlider" min="0" max="100" value="${currentFuel}" 
                               style="width: 100%; height: 8px; border-radius: 10px; background: #e5e7eb; outline: none;"
                               oninput="document.getElementById('fuelValue').textContent = this.value + '%'">
                    </div>
                    
                    <div style="text-align: center; font-size: 1.2rem; font-weight: bold; color: #059669; margin-bottom: 1rem;">
                        <span id="fuelValue">${currentFuel}%</span>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; margin-bottom: 2rem;">
                        <button onclick="document.getElementById('fuelSlider').value = 25; document.getElementById('fuelValue').textContent = '25%'" 
                                style="padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 8px; background: white; cursor: pointer;">25%</button>
                        <button onclick="document.getElementById('fuelSlider').value = 50; document.getElementById('fuelValue').textContent = '50%'" 
                                style="padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 8px; background: white; cursor: pointer;">50%</button>
                        <button onclick="document.getElementById('fuelSlider').value = 75; document.getElementById('fuelValue').textContent = '75%'" 
                                style="padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 8px; background: white; cursor: pointer;">75%</button>
                        <button onclick="document.getElementById('fuelSlider').value = 100; document.getElementById('fuelValue').textContent = '100%'" 
                                style="padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 8px; background: white; cursor: pointer;">100%</button>
                    </div>
                </div>

                <div style="display: flex; gap: 1rem;">
                    <button onclick="this.closest('#v3FuelModal').remove()" 
                            style="flex: 1; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 10px; background: white; color: #374151; cursor: pointer;">
                        Cancel
                    </button>
                    <button id="updateFuelBtn" 
                            style="flex: 1; padding: 0.75rem; border: none; border-radius: 10px; background: linear-gradient(135deg, #059669, #047857); color: white; cursor: pointer; font-weight: 600;">
                        Update Fuel
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Setup update button
        modal.querySelector('#updateFuelBtn').addEventListener('click', async () => {
            const newFuelLevel = parseInt(document.getElementById('fuelSlider').value);
            await this.updateFuelLevel(newFuelLevel);
            modal.remove();
        });
    }

    async updateFuelLevel(level) {
        console.log(`⛽ Updating fuel level to ${level}% for driver:`, this.currentUser.name);
        console.log(`🔍 Before update - Current fuel level:`, this.getDriverFuelLevel());

        try {
            // 1. Update driver fuel level locally
            this.setDriverFuelLevel(level);
            console.log(`✅ Fuel level set locally to: ${level}%`);

            // 2. Update driver in data manager
            window.dataManager.updateUser(this.currentUser.id, {
                fuelLevel: level,
                lastFuelUpdate: new Date().toISOString()
            });

            // 3. Sync fuel level to server immediately
            await this.syncFuelLevelToServer(level);

            // 4. Update button state
            this.updateFuelButton();

            // 5. Force full sync across all systems
            await this.performFullSync();

            // 6. Force immediate UI updates for all fuel displays
            this.updateDriverModalQuickStats();
            this.updateQuickStats();
            
            // 7. Force trigger app-level fuel display updates
            setTimeout(() => {
                const forceUpdateEvent = new CustomEvent('driverDataUpdated', {
                    detail: {
                        driverId: this.currentUser.id,
                        status: this.getDriverMovementStatus(),
                        fuelLevel: level, // Use the new level directly
                        timestamp: new Date().toISOString(),
                        source: 'fuel_update'
                    }
                });
                document.dispatchEvent(forceUpdateEvent);
                console.log(`🚨 FORCE fuel update event dispatched: ${level}%`);
            }, 100);
            
            // 8. Show success notification
            this.showAlert('Fuel Updated', `⛽ Fuel level updated to ${level}% and synced to server!`, 'success');

        } catch (error) {
            console.error('❌ Fuel update failed:', error);
            this.showAlert('Fuel Update Error', 'Failed to update fuel level', 'error');
        }
    }

    // ==================== PICKUP MANAGEMENT ====================

    getAvailableBins() {
        const routes = window.dataManager.getDriverRoutes(this.currentUser.id);
        const availableBins = [];

        routes.forEach(route => {
            if (route.status === 'active' && route.bins) {
                route.bins.forEach(binId => {
                    const bin = window.dataManager.getBinById(binId);
                    if (bin && bin.fill > 0) {
                        availableBins.push(bin);
                    }
                });
            }
        });

        return availableBins;
    }

    showPickupModal(bins) {
        const modal = document.createElement('div');
        modal.id = 'v3PickupModal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
            background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; 
            z-index: 10000; animation: fadeIn 0.3s ease;
        `;

        const binsList = bins.map(bin => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; border: 1px solid #e5e7eb; border-radius: 10px; margin-bottom: 1rem; background: #f9fafb;">
                <div>
                    <div style="font-weight: 600; color: #1f2937;">Bin ${bin.id}</div>
                    <div style="font-size: 0.875rem; color: #6b7280;">${bin.location}</div>
                    <div style="font-size: 0.875rem; color: #059669;">Fill Level: ${bin.fill}%</div>
                </div>
                <button onclick="window.driverSystemV3.collectBin('${bin.id}')" 
                        style="padding: 0.5rem 1rem; background: linear-gradient(135deg, #059669, #047857); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                    Collect
                </button>
            </div>
        `).join('');

        modal.innerHTML = `
            <div style="background: white; border-radius: 20px; padding: 2.5rem; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto; box-shadow: 0 25px 50px rgba(0,0,0,0.3);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <h3 style="margin: 0; color: #1f2937; font-size: 1.5rem; display: flex; align-items: center;">
                        📦 <span style="margin-left: 0.5rem;">Register Pickup</span>
                    </h3>
                    <button onclick="this.closest('#v3PickupModal').remove()" style="background: none; border: none; font-size: 1.5rem; color: #6b7280; cursor: pointer;">&times;</button>
                </div>

                <div style="margin-bottom: 2rem;">
                    <p style="color: #6b7280; margin-bottom: 1.5rem;">Select bins to collect:</p>
                    ${binsList}
                </div>

                <div style="text-align: center;">
                    <button onclick="this.closest('#v3PickupModal').remove()" 
                            style="padding: 0.75rem 2rem; border: 1px solid #d1d5db; border-radius: 10px; background: white; color: #374151; cursor: pointer;">
                        Close
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    async collectBin(binId) {
        console.log(`📦 Collecting bin ${binId} for driver:`, this.currentUser.name);

        try {
            // 1. Mark bin as collected
            const success = window.markBinCollected(binId);
            
            if (success) {
                // 2. IMMEDIATE UI refresh (use local data, not server)
                console.log('🔄 Immediately refreshing driver UI after collection...');
                
                // Force reload route list from LOCAL data (before server sync)
                if (window.app && typeof window.app.loadDriverRoutes === 'function') {
                    window.app.loadDriverRoutes();
                    console.log('✅ Route list refreshed immediately from local data');
                }
                
                this.updatePickupButton();
                this.updateDriverQuickStats();

                // 3. Force full sync
                await this.performFullSync();

                // 4. Show success notification
                this.showAlert('Pickup Registered', `✅ Bin ${binId} collected! Assignment removed from your task list.`, 'success');

                // 5. Close modal
                const modal = document.getElementById('v3PickupModal');
                if (modal) modal.remove();

                // 6. Final refresh after sync to ensure consistency
                setTimeout(() => {
                    if (window.app && typeof window.app.loadDriverRoutes === 'function') {
                        window.app.loadDriverRoutes();
                    }
                    this.updatePickupButton();
                    this.updateDriverQuickStats();
                    console.log('✅ Final UI refresh complete after server sync');
                }, 600);
            } else {
                this.showAlert('Collection Error', 'Failed to register bin pickup', 'error');
            }

        } catch (error) {
            console.error('❌ Bin collection failed:', error);
            this.showAlert('Collection Error', 'Failed to register bin pickup', 'error');
        }
    }

    // ==================== ISSUE REPORTING ====================

    showIssueModal() {
        const modal = document.createElement('div');
        modal.id = 'v3IssueModal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
            background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; 
            z-index: 10000; animation: fadeIn 0.3s ease;
        `;

        modal.innerHTML = `
            <div style="background: white; border-radius: 20px; padding: 2.5rem; max-width: 500px; width: 90%; box-shadow: 0 25px 50px rgba(0,0,0,0.3);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <h3 style="margin: 0; color: #1f2937; font-size: 1.5rem; display: flex; align-items: center;">
                        🚨 <span style="margin-left: 0.5rem;">Report Issue</span>
                    </h3>
                    <button onclick="this.closest('#v3IssueModal').remove()" style="background: none; border: none; font-size: 1.5rem; color: #6b7280; cursor: pointer;">&times;</button>
                </div>

                <div style="margin-bottom: 2rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #374151;">Issue Type:</label>
                    <select id="issueType" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 8px; margin-bottom: 1rem;">
                        <option value="vehicle">Vehicle Problem</option>
                        <option value="route">Route Issue</option>
                        <option value="bin">Bin Problem</option>
                        <option value="emergency">Emergency</option>
                        <option value="other">Other</option>
                    </select>

                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #374151;">Priority:</label>
                    <select id="issuePriority" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 8px; margin-bottom: 1rem;">
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                    </select>

                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #374151;">Description:</label>
                    <textarea id="issueDescription" rows="4" placeholder="Describe the issue in detail..." 
                              style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 8px; resize: vertical;"></textarea>
                </div>

                <div style="display: flex; gap: 1rem;">
                    <button onclick="this.closest('#v3IssueModal').remove()" 
                            style="flex: 1; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 10px; background: white; color: #374151; cursor: pointer;">
                        Cancel
                    </button>
                    <button id="submitIssueBtn" 
                            style="flex: 1; padding: 0.75rem; border: none; border-radius: 10px; background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; cursor: pointer; font-weight: 600;">
                        Report Issue
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Setup submit button
        modal.querySelector('#submitIssueBtn').addEventListener('click', async () => {
            const type = document.getElementById('issueType').value;
            const priority = document.getElementById('issuePriority').value;
            const description = document.getElementById('issueDescription').value;

            if (!description.trim()) {
                this.showAlert('Validation Error', 'Please provide a description', 'error');
                return;
            }

            await this.reportIssue(type, priority, description);
            modal.remove();
        });
    }

    async reportIssue(type, priority, description) {
        console.log(`🚨 Reporting ${priority} priority ${type} issue for driver:`, this.currentUser.name);

        try {
            // 1. Create issue data
            const issueData = {
                id: 'ISS-' + Date.now(),
                type: type,
                priority: priority,
                description: description,
                driverId: this.currentUser.id,
                driverName: this.currentUser.name,
                timestamp: new Date().toISOString(),
                status: 'open',
                location: this.getCurrentLocation()
            };

            // 2. Save issue
            const issues = window.dataManager.getData('issues') || [];
            issues.push(issueData);
            window.dataManager.setData('issues', issues);

            // 3. Add alert
            window.dataManager.addAlert('driver_issue', 
                `${priority.toUpperCase()} PRIORITY: ${type} issue reported by ${this.currentUser.name}`, 
                priority === 'critical' ? 'critical' : 'high', 
                this.currentUser.id
            );

            // 4. Force full sync
            await this.performFullSync();

            // 5. Show success notification
            this.showAlert('Issue Reported', `🚨 ${priority.toUpperCase()} priority issue reported and synced across entire system!`, 'success');

        } catch (error) {
            console.error('❌ Issue reporting failed:', error);
            this.showAlert('Report Error', 'Failed to report issue', 'error');
        }
    }

    // ==================== DATA MANAGEMENT ====================

    getDriverMovementStatus() {
        const driver = window.dataManager.getUserById(this.currentUser.id);
        return driver ? (driver.movementStatus || 'active') : 'active';
    }

    setDriverMovementStatus(status) {
        if (!this.currentUser) return;
        
        // Update current user object
        this.currentUser.movementStatus = status;
        this.currentUser.lastStatusUpdate = new Date().toISOString();
        
        // Update in data manager
        window.dataManager.updateUser(this.currentUser.id, {
            movementStatus: status,
            lastStatusUpdate: new Date().toISOString()
        });
    }

    getDriverFuelLevel() {
        const driver = window.dataManager.getUserById(this.currentUser.id);
        return driver ? (driver.fuelLevel || 75) : 75;
    }

    setDriverFuelLevel(level) {
        if (!this.currentUser) return;
        
        // Update current user object
        this.currentUser.fuelLevel = level;
        this.currentUser.lastFuelUpdate = new Date().toISOString();
        
        // Update in data manager
        window.dataManager.updateUser(this.currentUser.id, {
            fuelLevel: level,
            lastFuelUpdate: new Date().toISOString()
        });
    }

    getCurrentLocation() {
        if (!this.currentUser) return null;
        
        let location = window.dataManager.getDriverLocation(this.currentUser.id);
        
        if (!location) {
            // Create default location
            location = {
                lat: 25.2854 + (Math.random() * 0.01 - 0.005),
                lng: 51.5310 + (Math.random() * 0.01 - 0.005),
                timestamp: new Date().toISOString(),
                status: 'active'
            };
        }
        
        return location;
    }

    updateDriverLocation(location) {
        if (!this.currentUser) return;
        
        const fullLocation = {
            ...location,
            timestamp: new Date().toISOString(),
            lastUpdate: new Date().toISOString()
        };
        
        window.dataManager.setDriverLocation(this.currentUser.id, fullLocation);
    }

    initializeDriverLocation() {
        if (!this.currentUser) return;
        
        let location = this.getCurrentLocation();
        if (location) {
            location.status = this.getDriverMovementStatus();
            this.updateDriverLocation(location);
        }
    }

    // ==================== SYNCHRONIZATION ====================

    async performFullSync() {
        console.log('🔄 Performing FULL synchronization across all systems');

        try {
            // 1. Sync driver status to server
            await this.syncDriverStatusToServer();

            // 2. Update map if available
            if (window.mapManager && window.mapManager.updateDriverStatus) {
                console.log('🗺️ Updating map driver status');
                window.mapManager.updateDriverStatus(this.currentUser.id, this.getDriverMovementStatus());
            }

            // 3. Trigger app refresh if available
            if (window.app && typeof window.app.refreshAllDriverData === 'function') {
                console.log('📱 Refreshing app driver data');
                window.app.refreshAllDriverData();
            }

            // 4. Sync to general server endpoint
            if (window.syncManager && typeof window.syncManager.syncToServer === 'function') {
                console.log('☁️ Syncing to server');
                window.syncManager.syncToServer();
            }

            // 5. Update sync status if available
            if (typeof updateSyncStatus === 'function') {
                setTimeout(updateSyncStatus, 500);
            }

        // 6. DON'T dispatch event here - it causes status desync!
        // The event will be dispatched by the components that need it
        // This prevents the "stationary" status from overriding "on-route"
        
        console.log('ℹ️ Skipping performFullSync event dispatch to prevent status desync');
            
            // 7. IMMEDIATE UI updates for map popup and driver overview
            setTimeout(() => {
                if (window.mapManager && typeof window.mapManager.updateDriverDataUI === 'function') {
                    console.log('🔄 Triggering immediate map popup refresh');
                    window.mapManager.updateDriverDataUI(this.currentUser.id);
                }
            }, 200);
            
            // 8. ENHANCED: Smart live monitoring refresh with activity marking
            setTimeout(async () => {
                console.log('🔴 Triggering intelligent monitoring refresh...');
                
                // Mark activity to prioritize sync frequency
                if (window.syncManager) {
                    window.syncManager.markActivity();
                    
                    // Use intelligent sync instead of forcing multiple sync calls
                    await window.syncManager.performIntelligentSync();
                }
                
                // Trigger monitoring page refresh if user is on monitoring page
                if (window.app && window.app.currentSection === 'monitoring') {
                    await window.app.performLiveMonitoringSync();
                }
                
                console.log('✅ Intelligent monitoring refresh completed');
            }, 500); // Reduced delay since intelligent sync is faster

            console.log('✅ Full synchronization completed');

        } catch (error) {
            console.error('❌ Synchronization failed:', error);
        }
    }

    // Sync driver status specifically to server
    async syncDriverStatusToServer() {
        if (!this.currentUser) return;
        const now = Date.now();
        if (now - this._lastSyncDriverStatusAt < this._minStatusIntervalMs) return;
        this._lastSyncDriverStatusAt = now;

        try {
            const response = await fetch(`/api/driver/${this.currentUser.id}/status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    movementStatus: this.getDriverMovementStatus(),
                    status: 'active'
                })
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Driver status synced to server:', result.message);
            } else {
                console.error('❌ Failed to sync driver status to server:', response.status);
            }
        } catch (error) {
            console.error('❌ Error syncing driver status to server:', error);
        }
    }

    // Sync fuel level specifically to server
    async syncFuelLevelToServer(fuelLevel) {
        if (!this.currentUser) return;

        try {
            const response = await fetch(`/api/driver/${this.currentUser.id}/fuel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fuelLevel: fuelLevel
                })
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Fuel level synced to server:', result.message);
            } else {
                console.error('❌ Failed to sync fuel level to server:', response.status);
            }
        } catch (error) {
            console.error('❌ Error syncing fuel level to server:', error);
        }
    }

    // Sync complete driver data to server - FIXED TO PRESERVE STATUS
    async syncCompleteDriverDataToServer() {
        if (!this.currentUser) return;
        const now = Date.now();
        if (now - this._lastSyncDriverUpdateAt < this._minUpdateIntervalMs) return;
        this._lastSyncDriverUpdateAt = now;

        try {
            // CRITICAL FIX: Get movement status from current user object, not dataManager
            // This prevents race conditions that reset status to 'stationary'
            const currentMovementStatus = this.currentUser.movementStatus || this.getDriverMovementStatus();
            
            const driverData = {
                movementStatus: currentMovementStatus,
                fuelLevel: this.getDriverFuelLevel(),
                lastUpdate: new Date().toISOString(),
                lastStatusUpdate: this.currentUser.lastStatusUpdate || new Date().toISOString(),
                lastFuelUpdate: this.currentUser.lastFuelUpdate || new Date().toISOString()
            };

            console.log(`🔄 Syncing driver data - Status: ${currentMovementStatus}`);

            const response = await fetch(`/api/driver/${this.currentUser.id}/update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(driverData)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Complete driver data synced to server:', result.message);
            } else {
                console.error('❌ Failed to sync complete driver data to server:', response.status);
            }
        } catch (error) {
            console.error('❌ Error syncing complete driver data to server:', error);
        }
    }

    // ==================== BUTTON STATE MANAGEMENT ====================

    enableButtons() {
        Object.values(this.buttons).forEach(button => {
            if (button) {
                button.disabled = false;
                button.style.opacity = '1';
                button.style.pointerEvents = 'auto';
                button.style.cursor = 'pointer';
            }
        });
    }

    disableButtons() {
        Object.values(this.buttons).forEach(button => {
            if (button) {
                button.disabled = true;
                button.style.opacity = '0.5';
                button.style.pointerEvents = 'none';
            }
        });
    }

    updateAllButtonStates() {
        if (!this.currentUser) return;

        this.updateStartRouteButton();
        this.updatePickupButton();
        this.updateFuelButton();
        this.updateIssueButton();
    }

    setButtonLoadingState(isLoading) {
        if (!this.buttons.startRoute) return;

        if (isLoading) {
            this.buttons.startRoute.innerHTML = `
                <div class="action-icon-container">
                    <i class="fas fa-spinner fa-spin"></i>
                    <div class="action-status-dot" style="background: #f59e0b;"></div>
                </div>
                <div class="action-content">
                    <h4 class="action-title">Processing...</h4>
                    <p class="action-subtitle">Please wait</p>
                </div>
                <div class="action-arrow">
                    <i class="fas fa-chevron-right"></i>
                </div>
            `;
            this.buttons.startRoute.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
            this.buttons.startRoute.style.pointerEvents = 'none';
        } else {
            this.buttons.startRoute.style.pointerEvents = 'auto';
            // Update to the correct state
            this.updateStartRouteButton();
        }
    }

    updateStartRouteButton() {
        console.log('🔘 updateStartRouteButton called');
        
        // Get fresh button reference
        const button = document.getElementById('startRouteBtn');
        if (!button) {
            console.warn('⚠️ Start Route button element not found!');
            return;
        }

        // Get fresh user data
        if (!this.currentUser) {
            console.warn('⚠️ No current user found!');
            return;
        }

        // Refresh user data from dataManager
        const freshUserData = window.dataManager.getUserById(this.currentUser.id);
        const userToCheck = freshUserData || this.currentUser;  // CRITICAL: Define userToCheck!
        
        if (freshUserData) {
            this.currentUser = freshUserData;
        }

        // CRITICAL FIX: Check if driver has active route ID, not movementStatus!
        // movementStatus changes with GPS (highway, city, stationary) but route stays active
        const hasActiveRoute = userToCheck.currentRouteId && userToCheck.currentRouteId !== null;
        const currentStatus = userToCheck.movementStatus || 'stationary';
        
        console.log(`🔄 Button Update - User: ${userToCheck.name}, Status: ${currentStatus}, HasActiveRoute: ${hasActiveRoute}, RouteID: ${userToCheck.currentRouteId}`);

        // Get or create child elements with IDs for reliable access
        let icon = button.querySelector('.fa-play-circle, .fa-stop-circle');
        let statusDot = button.querySelector('.action-status-dot');
        let title = button.querySelector('.action-title');
        let subtitle = button.querySelector('.action-subtitle');

        // Complete button rebuild based on ACTIVE ROUTE, not movementStatus
        if (hasActiveRoute) {
            // END ROUTE STATE (driver has active route)
            console.log('🔴 Setting button to: END ROUTE (Red Stop) - Active Route ID:', userToCheck.currentRouteId);
            
            button.innerHTML = `
                <div class="action-icon-container">
                    <i class="fas fa-stop-circle" style="color: #fff; font-size: 1.5rem;"></i>
                    <div class="action-status-dot" style="background: #ef4444; box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);"></div>
                </div>
                <div class="action-content">
                    <h4 class="action-title" style="color: #fff; font-weight: 600;">End Route</h4>
                    <p class="action-subtitle" style="color: rgba(255,255,255,0.9);">Currently on route</p>
                </div>
                <div class="action-arrow">
                    <i class="fas fa-chevron-right" style="color: #fff;"></i>
                </div>
            `;
            
            // Style the button for "end route" state
            button.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
            button.style.borderColor = '#ef4444';
            button.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
            button.setAttribute('data-state', 'on-route');
            
        } else {
            // START ROUTE STATE (driver has no active route)
            console.log('🟢 Setting button to: START ROUTE (Green Play) - No Active Route');
            
            button.innerHTML = `
                <div class="action-icon-container">
                    <i class="fas fa-play-circle" style="color: #fff; font-size: 1.5rem;"></i>
                    <div class="action-status-dot" style="background: #10b981; box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);"></div>
                </div>
                <div class="action-content">
                    <h4 class="action-title" style="color: #fff; font-weight: 600;">Start Route</h4>
                    <p class="action-subtitle" style="color: rgba(255,255,255,0.9);">Ready to begin</p>
                </div>
                <div class="action-arrow">
                    <i class="fas fa-chevron-right" style="color: #fff;"></i>
                </div>
            `;
            
            // Style the button for "start route" state
            button.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
            button.style.borderColor = '#10b981';
            button.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
            button.setAttribute('data-state', 'stationary');
        }

        // Force reflow to ensure changes are applied
        button.offsetHeight;
        
        // Log final state
        const finalState = button.getAttribute('data-state');
        console.log(`✅ Button updated | HasActiveRoute: ${hasActiveRoute}, RouteID: ${userToCheck.currentRouteId || 'none'} | Visual: ${hasActiveRoute ? '🔴 END ROUTE (Red)' : '🟢 START ROUTE (Green)'}`);
    }

    updatePickupButton() {
        if (!this.buttons.registerPickup || !this.currentUser) return;
        
        const availableBins = this.getAvailableBins();
        const count = availableBins.length;
        
        this.buttons.registerPickup.innerHTML = `
            <div class="action-icon-container">
                <i class="fas fa-trash-alt"></i>
                <div class="action-status-dot" style="background: ${count > 0 ? '#f59e0b' : '#6b7280'};"></div>
            </div>
            <div class="action-content">
                <h4 class="action-title">Register Pickup</h4>
                <p class="action-subtitle">${count > 0 ? `${count} bins available` : 'No active routes'}</p>
            </div>
            <div class="action-arrow">
                <i class="fas fa-chevron-right"></i>
            </div>
        `;
    }

    updateFuelButton() {
        if (!this.buttons.updateFuel || !this.currentUser) return;
        
        const fuelLevel = this.getDriverFuelLevel();
        let color = '#10b981'; // Green
        if (fuelLevel < 50) color = '#f59e0b'; // Yellow
        if (fuelLevel < 25) color = '#ef4444'; // Red
        
        this.buttons.updateFuel.innerHTML = `
            <div class="action-icon-container">
                <i class="fas fa-gas-pump"></i>
                <div class="action-status-dot" style="background: ${color};"></div>
            </div>
            <div class="action-content">
                <h4 class="action-title">Update Fuel</h4>
                <p class="action-subtitle">Current: ${fuelLevel}%</p>
            </div>
            <div class="action-arrow">
                <i class="fas fa-chevron-right"></i>
            </div>
        `;
    }

    updateIssueButton() {
        if (!this.buttons.reportIssue || !this.currentUser) return;
        
        this.buttons.reportIssue.innerHTML = `
            <div class="action-icon-container">
                <i class="fas fa-exclamation-triangle"></i>
                <div class="action-status-dot" style="background: #ef4444;"></div>
            </div>
            <div class="action-content">
                <h4 class="action-title">Report Issue</h4>
                <p class="action-subtitle">Emergency & problems</p>
            </div>
            <div class="action-arrow">
                <i class="fas fa-chevron-right"></i>
            </div>
        `;
    }

    // ==================== UTILITY FUNCTIONS ====================

    showAlert(title, message, type = 'info') {
        // Try to use main app alert system first
        if (window.app && typeof window.app.showAlert === 'function') {
            window.app.showAlert(title, message, type);
            return;
        }

        // Fallback alert system
        console.log(`${type.toUpperCase()}: ${title} - ${message}`);
        
        const alertDiv = document.createElement('div');
        alertDiv.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 10001;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
            color: white; padding: 1rem 2rem; border-radius: 10px; box-shadow: 0 10px 25px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease;
        `;
        
        alertDiv.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 0.25rem;">${title}</div>
            <div style="font-size: 0.875rem; opacity: 0.9;">${message}</div>
        `;
        
        document.body.appendChild(alertDiv);
        
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }

    // NEW: Handle coffee break functionality
    async handleTakeBreak() {
        if (!this.currentUser) {
            this.showAlert('Authentication Error', 'Please log in to take a break', 'error');
            return;
        }

        console.log('☕ Taking break for driver:', this.currentUser.name);

        try {
            // 1. Update driver movement status locally
            this.setDriverMovementStatus('on-break');
            
            // 2. Update driver location status
            const location = this.getCurrentLocation();
            if (location) {
                location.status = 'on-break';
                location.movementStatus = 'on-break';
                this.updateDriverLocation(location);
            }

            // 3. Update driver in data manager
            window.dataManager.updateUser(this.currentUser.id, {
                movementStatus: 'on-break',
                lastStatusUpdate: new Date().toISOString(),
                status: 'active',
                breakStartTime: new Date().toISOString()
            });

            // 4. Sync status to server immediately
            await this.syncDriverStatusToServer();

            // 5. Update button states
            this.updateAllButtonStates();

            // 6. Force full sync
            await this.performFullSync();

            this.showAlert('Break Started', '☕ Enjoy your coffee break!', 'success');

        } catch (error) {
            console.error('❌ Break action failed:', error);
            this.showAlert('Break Error', 'Failed to start break', 'error');
        }
    }

    // NEW: Handle end shift functionality
    async handleEndShift() {
        if (!this.currentUser) {
            this.showAlert('Authentication Error', 'Please log in to end shift', 'error');
            return;
        }

        console.log('🔴 Ending shift for driver:', this.currentUser.name);

        try {
            // 1. Update driver movement status locally
            this.setDriverMovementStatus('off-duty');
            
            // 2. Update driver location status
            const location = this.getCurrentLocation();
            if (location) {
                location.status = 'off-duty';
                location.movementStatus = 'off-duty';
                this.updateDriverLocation(location);
            }

            // 3. Update driver in data manager
            window.dataManager.updateUser(this.currentUser.id, {
                movementStatus: 'off-duty',
                lastStatusUpdate: new Date().toISOString(),
                status: 'inactive',
                shiftEndTime: new Date().toISOString()
            });

            // 4. Sync status to server immediately
            await this.syncDriverStatusToServer();

            // 5. Update button states
            this.updateAllButtonStates();

            // 6. Force full sync
            await this.performFullSync();

            this.showAlert('Shift Ended', '🔴 Have a great day!', 'success');

        } catch (error) {
            console.error('❌ End shift action failed:', error);
            this.showAlert('Shift Error', 'Failed to end shift', 'error');
        }
    }

    cleanup() {
        console.log('🧹 Cleaning up Driver System V3.0');
        
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        
        if (this.statusInterval) {
            clearInterval(this.statusInterval);
            this.statusInterval = null;
        }
        
        if (this.fullSyncInterval) {
            clearInterval(this.fullSyncInterval);
            this.fullSyncInterval = null;
        }
        
        this.initialized = false;
    }
}

// ==================== GLOBAL INITIALIZATION ====================

let driverSystemV3Instance = null;

function initializeDriverSystemV3() {
    // Cleanup existing instance
    if (driverSystemV3Instance) {
        driverSystemV3Instance.cleanup();
    }
    
    console.log('🎯 Initializing Driver System V3.0 - Complete Reconstruction');
    driverSystemV3Instance = new DriverSystemV3();
    
    // Make globally available
    window.driverSystemV3 = driverSystemV3Instance;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDriverSystemV3);
} else {
    initializeDriverSystemV3();
}

// Global reinitialize function
window.reinitializeDriverButtons = function() {
    console.log('🔄 Reinitializing Driver System V3.0');
    initializeDriverSystemV3();
};

console.log('✅ Driver System V3.0 loaded successfully');
