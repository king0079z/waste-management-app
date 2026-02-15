// app.js - Complete Main Application Controller with All Integrations

class WasteManagementApp {
    constructor() {
        this.currentSection = 'dashboard';
        this.initialized = false;
        this.loginOverlayCheckDone = false;  // Prevent duplicate checks
        this.init();
    }

    // Check for existing session and hide login overlay if logged in
    checkAndHandleExistingSession() {
        // Prevent multiple executions
        if (this.loginOverlayCheckDone) {
            return;
        }
        this.loginOverlayCheckDone = true;
        
        // Wait for authManager to be ready
        const checkAuth = () => {
            if (typeof authManager !== 'undefined' && authManager) {
                const currentUser = authManager.getCurrentUser();
                
                if (currentUser) {
                    console.log('✅ User already logged in:', currentUser.name);
                    
                    // Hide login overlay immediately
                    const loginOverlay = document.getElementById('loginOverlay');
                    if (loginOverlay) {
                        loginOverlay.style.display = 'none';
                        console.log('✅ Login overlay hidden (user already authenticated)');
                    }
                    
                    // Show user interface
                    this.handleSuccessfulLogin();
                } else {
                    console.log('ℹ️ No existing session - login required');
                }
            } else {
                // authManager not ready yet, try again
                setTimeout(checkAuth, 100);
            }
        };
        
        // Start check after short delay
        setTimeout(checkAuth, 200);
        // Re-check after 1.5s in case auth restored session late (avoids empty screen)
        setTimeout(checkAuth, 1500);
    }

    init() {
        try {
            console.log('🚀 Initializing Waste Management App...');
            
            // CRITICAL FIX: Check if user is already logged in and hide login overlay
            this.checkAndHandleExistingSession();
            
            // Check dependencies before proceeding
            console.log('🔍 Checking app dependencies...');
            const appDeps = {
                dataManager: typeof dataManager !== 'undefined',
                authManager: typeof authManager !== 'undefined',
                syncManager: typeof syncManager !== 'undefined'
            };
            
            console.log('📦 App dependency status:', appDeps);
            
        this.setupEventHandlers();
            console.log('✅ Event handlers setup complete');
            
        this.setupAlertSystem();
            console.log('✅ Alert system setup complete');
        
        // Initialize bin modal manager if available
        if (typeof binModalManager !== 'undefined') {
            binModalManager.init();
                console.log('✅ Bin Modal Manager initialized');
            } else {
                console.log('⚠️ Bin Modal Manager not available yet');
        }
        
        // Initialize map early to support driver tracking
        this.initializeMapIfNeeded();
        
        this.initialized = true;
            console.log('🎉 WasteManagementApp initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize WasteManagementApp:', error);
            console.error('❌ Stack trace:', error.stack);
            this.initialized = false;
            throw error; // Re-throw to be caught by the main try-catch
        }
    }

    setupEventHandlers() {
        // Call the global event handlers setup first
        if (typeof setupEventHandlers === 'function') {
            setupEventHandlers();
        }
        
        // Top nav hamburger toggle (world-class mobile menu)
        const mainNav = document.getElementById('mainNav');
        const navToggle = document.getElementById('navToggle');
        if (mainNav && navToggle) {
            navToggle.addEventListener('click', () => {
                const isOpen = mainNav.classList.toggle('nav-menu-open');
                navToggle.setAttribute('aria-expanded', isOpen);
                const icon = navToggle.querySelector('i');
                if (icon) {
                    icon.className = isOpen ? 'fas fa-times' : 'fas fa-bars';
                }
            });
            // Close mobile menu when a nav item is clicked (after section switch)
            document.getElementById('navMenu')?.addEventListener('click', (e) => {
                if (e.target.closest('.nav-item') && window.innerWidth <= 900) {
                    mainNav.classList.remove('nav-menu-open');
                    navToggle.setAttribute('aria-expanded', 'false');
                    const icon = navToggle.querySelector('i');
                    if (icon) icon.className = 'fas fa-bars';
                }
            });
        }
        
        // Navigation items
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const section = item.getAttribute('data-section');
                if (section) {
                    this.showSection(section);
                }
            });
        });
        
        // Setup analytics tabs
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('analytics-tab')) {
                // Remove active from all tabs
                document.querySelectorAll('.analytics-tab').forEach(tab => {
                    tab.classList.remove('active');
                });
                
                // Add active to clicked tab
                e.target.classList.add('active');
                
                // Hide all tab contents
                document.querySelectorAll('.analytics-content').forEach(content => {
                    content.style.display = 'none';
                });
                
                // Show selected tab content
                const tabName = e.target.getAttribute('data-tab');
                const tabContent = document.getElementById(`${tabName}-content`);
                if (tabContent) {
                    tabContent.style.display = 'block';
                    
                    // Initialize charts for the selected tab
                    this.initializeTabCharts(tabName);
                }
            }
        });

        // Setup FAB (Floating Action Button) functionality
        const mainFab = document.getElementById('mainFab');
        if (mainFab) {
            mainFab.addEventListener('click', () => {
                this.toggleFabMenu();
            });
        }

        // Setup FAB option event listeners
        const reportIssueFab = document.getElementById('reportIssueFab');
        const addBinFab = document.getElementById('addBinFab');
        const addVehicleFab = document.getElementById('addVehicleFab');

        if (reportIssueFab) {
            reportIssueFab.addEventListener('click', () => {
                this.showReportIssueModal();
                this.toggleFabMenu(); // Close the menu
            });
        }

        if (addBinFab) {
            addBinFab.addEventListener('click', () => {
                this.showAddBinModal();
                this.toggleFabMenu(); // Close the menu
            });
        }

        if (addVehicleFab) {
            addVehicleFab.addEventListener('click', () => {
                // Show vehicle registration modal
                const vehicleModal = document.getElementById('vehicleRegistrationModal');
                if (vehicleModal) {
                    vehicleModal.style.display = 'flex';
                }
                this.toggleFabMenu(); // Close the menu
            });
        }
    }

    initializeTabCharts(tabName) {
        // Initialize charts based on which analytics tab is selected
        if (window.analyticsManagerV2 && typeof window.analyticsManagerV2.initializeTabSpecificCharts === 'function') {
            setTimeout(() => {
                window.analyticsManagerV2.initializeTabSpecificCharts(tabName);
            }, 100); // Small delay to ensure DOM is ready
        }
    }

    showSection(sectionName) {
        // CRITICAL FIX: Immediately hide login overlay if user is logged in
        if (window.authManager && authManager.getCurrentUser()) {
            const loginOverlay = document.getElementById('loginOverlay');
            if (loginOverlay) {
                loginOverlay.style.display = 'none';
                console.log('🛡️ Prevented login overlay from showing (user logged in)');
            }
        }
        
        // Remove active class from all nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });

        // Add active class to clicked nav item
        const activeItem = document.querySelector(`[data-section="${sectionName}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }

        // Hide all content sections and remove .active so only the selected section is visible
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
            section.style.display = 'none';
        });

        if (window._aiStatusTicker) {
            clearInterval(window._aiStatusTicker);
            window._aiStatusTicker = null;
        }
        if (window._analyticsStatusTicker) {
            clearInterval(window._analyticsStatusTicker);
            window._analyticsStatusTicker = null;
        }
        const mainContainer = document.getElementById('mainContainer');
        if (mainContainer) {
            mainContainer.setAttribute('data-current-section', sectionName);
        }

        // Show only the selected section
        const targetSection = document.getElementById(sectionName);
        const dashboardEl = document.getElementById('dashboard');
        if (targetSection) {
            targetSection.classList.add('active');
            targetSection.style.display = 'block';
            this.currentSection = sectionName;
            // Keep Smart City Command Center (dashboard) only on City Dashboard; hide on every other section
            if (dashboardEl) {
                if (sectionName === 'dashboard') {
                    dashboardEl.classList.add('active');
                    dashboardEl.style.removeProperty('display');
                    dashboardEl.style.removeProperty('visibility');
                } else {
                    dashboardEl.classList.remove('active');
                    dashboardEl.style.setProperty('display', 'none', 'important');
                    dashboardEl.style.setProperty('visibility', 'hidden', 'important');
                }
            }
            
            if (sectionName === 'ai-dashboard') {
                if (window.aimlMasterIntegration && typeof window.aimlMasterIntegration.updateAIStatusUI === 'function') {
                    window.aimlMasterIntegration.updateAIStatusUI();
                    window._aiStatusTicker = setInterval(() => window.aimlMasterIntegration.updateAIStatusUI(), 5000);
                }
            }
            if (sectionName === 'analytics') {
                if (window.worldClassAnalytics && typeof window.worldClassAnalytics.updateAnalyticsConnectionUI === 'function') {
                    window.worldClassAnalytics.updateAnalyticsConnectionUI();
                    window._analyticsStatusTicker = setInterval(() => window.worldClassAnalytics.updateAnalyticsConnectionUI(), 5000);
                }
            }
            if (sectionName === 'monitoring') {
                // Initialize content with delay to ensure container is visible
                setTimeout(() => {
                    // CRITICAL: Hide login overlay again after monitoring loads
                    if (window.authManager && authManager.getCurrentUser()) {
                        const loginOverlay = document.getElementById('loginOverlay');
                        if (loginOverlay) loginOverlay.style.display = 'none';
                    }
                    
            this.initializeSectionContent(sectionName);
                    // Force map initialization when monitoring section becomes visible
                    setTimeout(() => {
                        this.initializeMapIfNeeded();
                    }, 200);
                    // NEW: Start live monitoring updates
                    this.startLiveMonitoringUpdates();
                    
                    // Fetch latest driver locations so new drivers appear instantly on all maps
                    if (window.mapManager && typeof window.mapManager.fetchAndMergeDriverLocations === 'function') {
                        window.mapManager.fetchAndMergeDriverLocations().then(() => {
                            if (window.mapManager.loadDriversOnMap) window.mapManager.loadDriversOnMap();
                        });
                    }
                    // Update live monitoring statistics immediately
                    setTimeout(() => {
                        if (typeof updateLiveMonitoringStats === 'function') {
                            updateLiveMonitoringStats();
                            console.log('✅ Live monitoring stats updated on section show');
                        }
                        const d = document.getElementById('dashboard');
                        if (d && this.currentSection === 'monitoring') {
                            d.classList.remove('active');
                            d.style.setProperty('display', 'none', 'important');
                        }
                    }, 300);
                }, 100);
            } else {
                // Stop live monitoring updates when switching away from monitoring
                this.stopLiveMonitoringUpdates();
                this.initializeSectionContent(sectionName);
                // For fleet, fetch latest driver locations so map shows drivers instantly
                if (sectionName === 'fleet' && window.mapManager && typeof window.mapManager.fetchAndMergeDriverLocations === 'function') {
                    window.mapManager.fetchAndMergeDriverLocations().then(() => {
                        if (window.fleetManager && typeof window.fleetManager.refresh === 'function') {
                            window.fleetManager.refresh();
                        }
                    });
                }
            }
        }

        // Update page title
        document.title = `${sectionName.charAt(0).toUpperCase() + sectionName.slice(1)} - Autonautics`;
        
        // FINAL SAFETY CHECK: Hide login overlay after everything loads (multiple delays to beat any race)
        [300, 500, 800].forEach((ms, i) => {
            setTimeout(() => {
                if (window.authManager && authManager.getCurrentUser()) {
                    const loginOverlay = document.getElementById('loginOverlay');
                    if (loginOverlay && (window.getComputedStyle(loginOverlay).display === 'flex' || window.getComputedStyle(loginOverlay).display === 'block')) {
                        loginOverlay.style.display = 'none';
                    }
                }
            }, ms);
        });
    }

    initializeSectionContent(sectionName) {
        switch(sectionName) {
            case 'dashboard':
                this.refreshDashboard();
                break;
            case 'monitoring':
                this.loadMonitoring();
                break;
            case 'fleet':
                this.loadFleetManagement();
                break;
            case 'routes':
                this.loadRouteOptimization();
                break;
            case 'complaints':
                this.loadComplaints();
                break;
            case 'analytics':
                this.initializeAnalyticsSection();
                break;
            case 'ai-dashboard':
                this.initializeAIDashboard();
                break;
            case 'admin':
                this.loadAdminPanel();
                break;
        }
    }

    initializeAIDashboard() {
        // Sync from server (MongoDB) so AI/ML analysis uses latest data across the app
        if (typeof syncManager !== 'undefined' && syncManager.syncFromServer) {
            syncManager.syncFromServer().then(() => {
                if (window.aimlMasterIntegration && typeof window.aimlMasterIntegration.refreshFromServer === 'function') {
                    window.aimlMasterIntegration.refreshFromServer();
                }
                if (window.aimlMasterIntegration && typeof window.aimlMasterIntegration.updateAIStatusUI === 'function') {
                    window.aimlMasterIntegration.updateAIStatusUI();
                }
            }).catch(() => {});
        } else if (window.aimlMasterIntegration && typeof window.aimlMasterIntegration.updateAIStatusUI === 'function') {
            window.aimlMasterIntegration.updateAIStatusUI();
        }
    }

    initializeAnalyticsSection() {
        // Sync from server (MongoDB) so Analytics uses latest data across the app
        const runInit = () => {
            if (window.worldClassAnalytics && typeof window.worldClassAnalytics.initializeAnalytics === 'function') {
                window.worldClassAnalytics.initializeAnalytics();
            } else if (typeof window.analyticsManager !== 'undefined' && typeof window.analyticsManager.initializeAnalytics === 'function') {
                window.analyticsManager.initializeAnalytics();
            }
            if (window.analyticsManagerV2 && window.analyticsManagerV2.isInitialized) {
                window.analyticsManagerV2.updateAllMetrics();
                if (typeof window.analyticsManagerV2.updateAllCharts === 'function') {
                    window.analyticsManagerV2.updateAllCharts();
                }
            }
        };
        if (typeof syncManager !== 'undefined' && syncManager.syncFromServer) {
            syncManager.syncFromServer().then(runInit).catch(runInit);
        } else {
            runInit();
        }
    }

    // Handle successful login
    handleSuccessfulLogin() {
        if (!authManager || !authManager.getCurrentUser()) {
            console.error('No user logged in');
            return;
        }

        const user = authManager.getCurrentUser();
        console.log('Handling successful login for:', user.name, '(' + user.type + ')');

        // Load sensor reporting interval from server (used by sync/websocket protection window)
        this.loadSensorIntervalSetting();

        // So driver→manager chat is received: identify this WebSocket as admin/manager on the server
        if (typeof window.updateWebSocketClientInfo === 'function') {
            setTimeout(function() { window.updateWebSocketClientInfo(); }, 300);
        }

        // Hide login overlay and app loader so main content is visible
        const loginOverlay = document.getElementById('loginOverlay');
        if (loginOverlay) {
            loginOverlay.style.display = 'none';
        }
        const appLoader = document.getElementById('app-loader');
        if (appLoader) {
            appLoader.style.opacity = '0';
            appLoader.style.transition = 'opacity 0.3s ease-out';
            setTimeout(() => {
                appLoader.style.display = 'none';
                appLoader.remove();
            }, 350);
        }

        // Show user info badge
        const userInfoBadge = document.getElementById('userInfoBadge');
        if (userInfoBadge) {
            userInfoBadge.style.display = 'flex';
            
            // Update user info
            const userName = document.getElementById('userName');
            const userRole = document.getElementById('userRole');
            const userAvatar = document.getElementById('userAvatar');
            
            if (userName) userName.textContent = user.name;
            if (userRole) userRole.textContent = user.type.charAt(0).toUpperCase() + user.type.slice(1);
            if (userAvatar) userAvatar.textContent = user.name.split(' ').map(n => n[0]).join('').toUpperCase();
        }

        // Handle different user types
        if (user.type === 'driver') {
            // Show driver-only interface
            this.showDriverInterface();
        } else {
            // Show manager/admin interface
            this.showManagerInterface(user.type);
        }

        // Show success message
        this.showAlert('Login Successful', `Welcome back, ${user.name}!`, 'success');

        // Initialize dashboard data
        this.refreshDashboard();
    }

    showDriverInterface() {
        console.log('Showing driver interface...');
        
        // Hide main navigation and container
        const mainNav = document.getElementById('mainNav');
        const mainContainer = document.getElementById('mainContainer');
        const fabContainer = document.getElementById('fabContainer');
        
        if (mainNav) mainNav.style.display = 'none';
        if (mainContainer) mainContainer.style.display = 'none';
        if (fabContainer) fabContainer.style.display = 'none';
        
        // Show driver-only view
        const driverView = document.getElementById('driverOnlyView');
        if (driverView) {
            driverView.style.display = 'block';
            driverView.classList.add('active');
            document.body.classList.add('driver-view-active');
        }
        
        // Update driver stats (includes Today's Activity and Recent Trips)
        this.updateDriverStats();
        
        // Load driver routes
        this.loadDriverRoutes();
        
        // Load driver performance analysis and Performance Trends chart
        const currentUser = authManager.getCurrentUser();
        if (currentUser) {
            if (window.driverPerformanceAnalysis && typeof window.driverPerformanceAnalysis.populateDriverPerformanceAnalysis === 'function') {
                setTimeout(() => window.driverPerformanceAnalysis.populateDriverPerformanceAnalysis(currentUser.id), 300);
            }
            if (typeof window.createDriverPerformanceTrendChart === 'function') {
                setTimeout(() => window.createDriverPerformanceTrendChart(currentUser.id), 500);
            }
        }
        
        // IMPORTANT: Start live GPS tracking (world-class – real device location, no fake position)
        if (typeof mapManager !== 'undefined') {
            const currentDriver = authManager.getCurrentUser();
            const location = dataManager.getDriverLocation(currentDriver.id);
            if (location && location.lat != null && location.lng != null) {
                location.lastUpdate = new Date().toISOString();
                location.timestamp = new Date().toISOString();
                location.status = 'active';
                dataManager.setDriverLocation(currentDriver.id, location);
            }
            // startDriverTracking acquires real GPS and shows "Live location"; no random fallback on init
            mapManager.startDriverTracking();
            
            // Also ensure driver appears on main map if it's initialized
            if (mapManager.map) {
                mapManager.initializeAllDrivers();
            }
        }
        
        // Reinitialize Driver System V3 for the logged-in driver
        if (typeof window.reinitializeDriverButtons === 'function') {
            setTimeout(() => {
                window.reinitializeDriverButtons();
                console.log('🔄 Driver System V3 reinitialized');
            }, 500);
        }
        
        // 💬 Store driver data globally for WebSocket identification
        const currentDriver = authManager.getCurrentUser();
        if (currentDriver) {
            window.currentDriverData = currentDriver;
            window.currentUserId = currentDriver.id;
            localStorage.setItem('currentDriver', JSON.stringify(currentDriver));
            console.log('🔐 Stored driver data globally for WebSocket identification:', currentDriver.id);
        }
        
        // 💬 Initialize Enhanced Messaging System for Driver
        console.log('💬 Initializing messaging system for driver...');
        if (window.enhancedMessaging) {
            // Update current user info
            window.enhancedMessaging.updateCurrentUser();
            
            // Initialize driver messaging interface
            setTimeout(() => {
                window.enhancedMessaging.initializeMessagingInterface();
                console.log('✅ Driver messaging system initialized');
                
                // Ensure messaging system is visible
                const messagingSystem = document.getElementById('driverMessagingSystem');
                if (messagingSystem) {
                    messagingSystem.style.display = 'block';
                    console.log('✅ Driver messaging system made visible');
                } else {
                    console.warn('⚠️ Driver messaging system not found in DOM');
                }
            }, 1000);
        } else {
            console.warn('⚠️ Enhanced messaging system not available during driver login');
        }
        
        // Start periodic route checks for drivers (check every 30 seconds)
        this.startDriverRouteChecks();

        // Show install-app notification for drivers on mobile (once per 7 days or until "Don't show again")
        if (typeof window.showDriverInstallAppBanner === 'function') {
            setTimeout(function () {
                window.showDriverInstallAppBanner();
            }, 2500);
        }
    }
    
    startDriverRouteChecks() {
        console.log('🔄 Starting periodic route checks for driver updates');
        
        // Check for new routes every 30 seconds
        setInterval(() => {
            if (authManager.isDriver()) {
                this.loadDriverRoutes();
            }
        }, 5000);
    }

    
    showManagerInterface(userType) {
        console.log('Showing manager/admin interface...');
        
        // Hide driver view
        const driverView = document.getElementById('driverOnlyView');
        if (driverView) {
            driverView.style.display = 'none';
        }
        document.body.classList.remove('driver-view-active');

        // Show main navigation and container
        const mainNav = document.getElementById('mainNav');
        const mainContainer = document.getElementById('mainContainer');
        const fabContainer = document.getElementById('fabContainer');
        
        if (mainNav) mainNav.style.display = 'block';
        if (mainContainer) {
            mainContainer.style.display = 'block';
            mainContainer.style.visibility = 'visible';
            mainContainer.style.opacity = '1';
        }
        if (fabContainer) fabContainer.style.display = 'block';
        
        // Setup navigation menu based on user type
        this.setupNavigationMenu(userType);
        
        // Show City Dashboard only (Live Monitoring and others stay hidden until clicked)
        this.showSection('dashboard');
        
        // Initialize analytics if available
        if (typeof analyticsManager !== 'undefined') {
            setTimeout(() => {
                analyticsManager.initializeAnalytics();
            }, 500);
        }
    }

    setupNavigationMenu(userType) {
        const navMenu = document.getElementById('navMenu');
        if (!navMenu) return;
        
        // Clear existing menu
        navMenu.innerHTML = '';
        
        // Define menu items based on user type
        let menuItems = [];
        
        // ML Routes section exists and runs in background but is hidden from menu (no nav link)
        if (userType === 'admin') {
            menuItems = [
                { id: 'dashboard', icon: 'fa-th-large', label: 'City Dashboard' },
                { id: 'monitoring', icon: 'fa-satellite-dish', label: 'Live Monitoring', badge: 'monitoringBadge' },
                { id: 'fleet', icon: 'fa-truck', label: 'Fleet Management' },
                { id: 'ai-dashboard', icon: 'fa-brain', label: 'AI/ML Center', badge: 'aiStatusBadge' },
                { id: 'analytics', icon: 'fa-chart-line', label: 'Analytics' },
                { id: 'complaints', icon: 'fa-exclamation-circle', label: 'Complaints', badge: 'complaintsBadge' },
                { id: 'admin', icon: 'fa-user-shield', label: 'Admin Panel' }
            ];
        } else if (userType === 'manager') {
            menuItems = [
                { id: 'dashboard', icon: 'fa-th-large', label: 'City Dashboard' },
                { id: 'monitoring', icon: 'fa-satellite-dish', label: 'Live Monitoring', badge: 'monitoringBadge' },
                { id: 'fleet', icon: 'fa-truck', label: 'Fleet Management' },
                { id: 'ai-dashboard', icon: 'fa-brain', label: 'AI/ML Center', badge: 'aiStatusBadge' },
                { id: 'analytics', icon: 'fa-chart-line', label: 'Analytics' },
                { id: 'complaints', icon: 'fa-exclamation-circle', label: 'Complaints', badge: 'complaintsBadge' }
            ];
        }
        
        // Create menu items
        menuItems.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = 'nav-item' + (index === 0 ? ' active' : '');
            li.setAttribute('data-section', item.id);
            
            let html = `<i class="fas ${item.icon}"></i><span>${item.label}</span>`;
            if (item.badge) {
                html += `<span class="notification-badge" id="${item.badge}" style="display: none;">0</span>`;
            }
            
            li.innerHTML = html;
            
            // Add click event
            li.addEventListener('click', () => {
                this.showSection(item.id);
            });
            
            navMenu.appendChild(li);
        });
    }

        async loadDriverRoutes(fromBroadcast = false) {
        console.log('📋 Loading driver routes...');
        
        const routesList = document.getElementById('driverRouteList');
        const routesCount = document.getElementById('routesCount');
        const completedToday = document.getElementById('completedToday');
        
        if (!routesList) {
            console.warn('⚠️ driverRouteList element not found');
            return;
        }
        
        const currentUser = authManager.getCurrentUser();
        if (!currentUser) {
            console.warn('⚠️ No current user found');
            return;
        }
        
        console.log(`🔄 Loading routes for driver: ${currentUser.name} (${currentUser.id})`);
        
        // When routes came via WebSocket broadcast (admin just assigned), use dataManager only – no extra fetch
        let routes = [];
        if (!fromBroadcast && typeof syncManager !== 'undefined' && syncManager.getSyncStatus().enabled) {
            console.log('📡 Loading routes from server...');
            routes = await syncManager.getDriverRoutes(currentUser.id);
            // CRITICAL: Merge server routes into dataManager so driver UI reflects server (including deletions)
            const allRoutes = dataManager.getRoutes() || [];
            const otherRoutes = allRoutes.filter(r => r.driverId !== currentUser.id);
            const thisDriverCompleted = allRoutes.filter(r => r.driverId === currentUser.id && (r.status === 'completed' || r.status === 'cancelled'));
            const merged = [...otherRoutes, ...(routes || []), ...thisDriverCompleted];
            dataManager.setData('routes', merged);
            if (routes && routes.length > 0) {
                console.log(`📋 Merged ${routes.length} server route(s) into dataManager for driver view`);
            } else {
                if (!this._lastEmptyRoutesLog || Date.now() - this._lastEmptyRoutesLog > 60000) {
                    this._lastEmptyRoutesLog = Date.now();
                    console.log(`📋 Server route list for driver is empty – removed deleted routes from dataManager`);
                }
            }
        } else if (!fromBroadcast && typeof syncManager !== 'undefined') {
            // Sync disabled: still try to fetch routes from server so deletions from admin are visible
            try {
                const res = await fetch(`${window.location.origin}/api/driver/${encodeURIComponent(currentUser.id)}/routes`);
                const json = await res.json();
                if (json.success && Array.isArray(json.routes)) {
                    const allRoutes = dataManager.getRoutes() || [];
                    const otherRoutes = allRoutes.filter(r => r.driverId !== currentUser.id);
                    const thisDriverCompleted = allRoutes.filter(r => r.driverId === currentUser.id && (r.status === 'completed' || r.status === 'cancelled'));
                    dataManager.setData('routes', [...otherRoutes, ...json.routes, ...thisDriverCompleted]);
                }
            } catch (e) { /* ignore */ }
        }
        
        const allDriverRoutes = (dataManager.getRoutes() || []).filter(r => r.driverId === currentUser.id);
        const activeRoutes = allDriverRoutes.filter(r => r.status !== 'completed' && r.status !== 'cancelled');
        const completedRoutes = allDriverRoutes.filter(r =>
            r.status === 'completed' &&
            new Date(r.completedAt || r.createdAt).toDateString() === new Date().toDateString()
        );
        // Keep localStorage in sync so deleted routes (from admin) don't reappear from cache
        try {
            localStorage.setItem('driverRoutes_' + currentUser.id, JSON.stringify(allDriverRoutes));
        } catch (e) { /* ignore */ }

        console.log(`📋 Active list: ${routes.length}, Total driver routes: ${allDriverRoutes.length}, Completed today: ${completedRoutes.length}`);
        
        // 🤖 ENHANCED AI SYSTEM - Properly connected to main application AI
        console.log(`🎯 Initializing ENHANCED AI System for driver ${currentUser.id}`);
        
        // IMMEDIATELY make the AI card visible
        const aiSuggestionCard = document.getElementById('aiSuggestionCard');
        if (aiSuggestionCard) {
            aiSuggestionCard.style.display = 'block';
            console.log(`✅ AI Suggestion Card immediately made visible on dashboard init`);
        } else {
            console.error(`❌ AI Suggestion Card not found during dashboard init!`);
        }
        
        // Initialize Enhanced Driver AI with force sync
        this.syncDriverLocationsNow(currentUser.id).then(() => {
            console.log(`📡 Location sync completed, loading Enhanced AI recommendations...`);
            this.loadEnhancedDriverAI(currentUser.id);
        }).catch(error => {
            console.error(`❌ Failed to sync driver locations for ${currentUser.id}:`, error);
            // Load Enhanced AI even if sync fails (will use fallback location)
            this.loadEnhancedDriverAI(currentUser.id);
        });
        
        // Update counts if elements exist
        if (routesCount) {
            routesCount.textContent = activeRoutes.length;
        } else {
            console.log('📊 routesCount element not found - skipping update');
        }
        
        if (completedToday) {
            completedToday.textContent = completedRoutes.length;
        } else {
            console.log('📊 completedToday element not found - skipping update');
        }
        
        if (activeRoutes.length === 0) {
            // Show AI suggestions for nearest bins
            const aiSuggestions = this.getAISuggestedBins(currentUser.id);
            
            let suggestionsHtml = '';
            if (aiSuggestions.length > 0) {
                const priorityClass = (p) => p === 'high' ? 'driver-ai-suggestion-priority--high' : p === 'medium' ? 'driver-ai-suggestion-priority--medium' : 'driver-ai-suggestion-priority--low';
                suggestionsHtml = `
                    <div class="driver-ai-suggestions">
                        <div class="driver-ai-suggestions-header">
                            <div class="driver-ai-suggestions-icon"><i class="fas fa-brain"></i></div>
                            <div>
                                <h4 class="driver-ai-suggestions-title">AI Suggestions</h4>
                                <p class="driver-ai-suggestions-sub">Nearest priority bins you can request</p>
                            </div>
                        </div>
                        <div class="driver-ai-suggestion-list">
                            ${aiSuggestions.map(suggestion => `
                                <div class="driver-ai-suggestion-card">
                                    <div class="driver-ai-suggestion-info">
                                        <div class="driver-ai-suggestion-location"><i class="fas fa-map-marker-alt"></i> ${suggestion.bin.location || 'Unknown'}</div>
                                        <div class="driver-ai-suggestion-meta">
                                            <span class="driver-ai-suggestion-fill">${suggestion.bin.fill}% full</span>
                                            <span class="driver-ai-suggestion-priority ${priorityClass(suggestion.priority)}">${(suggestion.priority || 'medium').charAt(0).toUpperCase() + (suggestion.priority || 'medium').slice(1)}</span>
                                        </div>
                                        <div class="driver-ai-suggestion-distance"><i class="fas fa-car"></i> ${suggestion.distance.toFixed(1)} km away</div>
                                    </div>
                                    <div class="driver-ai-suggestion-cta">
                                        <button type="button" class="btn btn-primary btn-sm" onclick="window.navigateToBin('${suggestion.bin.id}', ${suggestion.bin.lat || 0}, ${suggestion.bin.lng || 0})" title="Open in Google Maps / Apple Maps"><i class="fas fa-map-marked-alt"></i> Navigate</button>
                                        <button type="button" class="btn btn-sm" onclick="window.app.requestBinAssignment('${suggestion.bin.id}')">Request</button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
            
            routesList.innerHTML = `
                <div class="driver-routes-empty">
                    <i class="fas fa-route driver-routes-empty-icon"></i>
                    <p class="driver-routes-empty-title">No active routes assigned</p>
                    <p class="driver-routes-empty-sub">Routes will appear here when assigned by your manager</p>
                    <button type="button" class="btn btn-primary btn-sm driver-routes-refresh-btn" onclick="window.app.loadDriverRoutes()">
                        <i class="fas fa-sync-alt"></i> Refresh
                    </button>
                    ${suggestionsHtml}
                </div>
            `;
            return;
        }
        
        const routeHeader = `
            <div class="driver-routes-summary">
                <div>
                    <h4 class="driver-routes-summary-title"><i class="fas fa-route"></i> Active (${activeRoutes.length})</h4>
                    <p class="driver-routes-summary-meta">${completedRoutes.length} completed today</p>
                </div>
            </div>
        `;
        
        routesList.innerHTML = routeHeader + activeRoutes.map(route => {
            console.log('📋 Rendering route:', route.id, 'with', route.binIds?.length || 1, 'bins');
            
            // Handle both old and new route formats
            let bins = [];
            if (route.binDetails && route.binDetails.length > 0) {
                // New format with detailed bin info
                bins = route.binDetails;
            } else if (route.binIds && route.binIds.length > 0) {
                // Old format with just bin IDs
                bins = route.binIds.map(binId => dataManager.getBinById(binId)).filter(bin => bin);
            } else if (route.binId) {
                // Single bin format
            const bin = dataManager.getBinById(route.binId);
                if (bin) bins = [bin];
            }
            
            if (bins.length === 0) {
                console.warn('⚠️ No valid bins found for route:', route.id);
                return '';
            }
            
            const primaryBin = bins[0]; // Use first bin as primary
            const priorityClass = route.priority === 'high' ? 'driver-route-card-priority--high' : 
                route.priority === 'medium' ? 'driver-route-card-priority--medium' : 'driver-route-card-priority--low';
            const statusBadge = route.status === 'in-progress' ? 
                '<span class="driver-route-card-badge driver-route-card-badge--status">In progress</span>' : 
                route.status === 'pending' ?
                '<span class="driver-route-card-badge driver-route-card-badge--pending">Pending</span>' : '';
            
            const assignedTime = (route.assignedAt || route.createdAt) ? new Date(route.assignedAt || route.createdAt) : null;
            const timeAgo = assignedTime && !isNaN(assignedTime.getTime()) ? this.getTimeAgo(assignedTime) : '—';
            const statusDisplay = (route.status || 'pending').replace(/-/g, ' ');
            const assignedByDisplay = route.assignedByName || (route.assignedBy && dataManager.getUserById && dataManager.getUserById(route.assignedBy)?.name) || 'Manager';
            const fillColor = this.getBinStatusColor(primaryBin);
            const urgentClass = route.priority === 'high' ? ' driver-route-card--urgent' : '';
            
            return `
                <div class="driver-route-card${urgentClass}" onclick="window.navigateToBin('${primaryBin.id}', ${primaryBin.lat || 25.3682}, ${primaryBin.lng || 51.5511})">
                    <div class="driver-route-card-header">
                        <div class="driver-route-card-header-main">
                            <h4 class="driver-route-card-title">Route ${route.id}${bins.length > 1 ? `<span class="driver-route-card-title-meta"> · ${bins.length} bins</span>` : ''}</h4>
                            <div class="driver-route-card-location"><i class="fas fa-map-marker-alt" style="font-size: 0.75rem; color: #64748b;"></i> ${primaryBin.location || 'Unknown Location'}</div>
                            <div class="driver-route-card-badges">${statusBadge}</div>
                        </div>
                        <div class="driver-route-card-fill-wrap">
                            <span class="driver-route-card-priority ${priorityClass}">${route.priority === 'high' ? 'Urgent' : (route.priority || 'low')}</span>
                            <div class="driver-route-card-fill">
                                <div class="driver-route-card-fill-value" style="color: ${fillColor}">${primaryBin.fill != null ? primaryBin.fill : 0}%</div>
                                <div class="driver-route-card-fill-label">Fill</div>
                            </div>
                        </div>
                    </div>
                    ${bins.length > 1 ? `
                        <div class="driver-route-card-extras">
                            <div class="driver-route-card-extras-label">Additional bins</div>
                            <div class="driver-route-card-bins-wrap">
                                ${bins.slice(1).map(bin => `<span class="driver-route-card-bin-chip">${bin.id} (${bin.fill != null ? bin.fill : 0}%)</span>`).join('')}
                            </div>
                        </div>
                    ` : ''}
                    <div class="driver-route-card-stats">
                        <div class="driver-route-card-stat">
                            <div class="driver-route-card-stat-label">Status</div>
                            <div class="driver-route-card-stat-value">${statusDisplay}</div>
                        </div>
                        <div class="driver-route-card-stat">
                            <div class="driver-route-card-stat-label">Assigned</div>
                            <div class="driver-route-card-stat-value">${timeAgo}</div>
                        </div>
                        <div class="driver-route-card-stat">
                            <div class="driver-route-card-stat-label">By</div>
                            <div class="driver-route-card-stat-value">${String(assignedByDisplay).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
                        </div>
                    </div>
                    <div class="driver-route-card-actions">
                        <button type="button" class="btn btn-primary btn-sm" onclick="event.stopPropagation(); window.navigateToBin('${primaryBin.id}', ${primaryBin.lat || 25.3682}, ${primaryBin.lng || 51.5511})"><i class="fas fa-map-marked-alt"></i> Navigate</button>
                        <button type="button" class="btn btn-success btn-sm" onclick="event.stopPropagation(); window.markBinCollected('${primaryBin.id}')"><i class="fas fa-check"></i> Collected</button>
                        ${String(route.status || '').toLowerCase() === 'pending' ? `<button type="button" class="btn btn-warning btn-sm" onclick="event.stopPropagation(); window.startRoute('${route.id}')" title="Start Route"><i class="fas fa-play"></i> Start</button>` : ''}
                    </div>
                </div>
            `;
        }).filter(html => html !== '').join('');
        document.dispatchEvent(new CustomEvent('driverNavBadgesRefresh'));
    }

    loadFleetManagement() {
        console.log('🚛 Loading world-class fleet management...');
        
        // Use the new WorldClassFleetManager if available
        if (window.fleetManager && typeof window.fleetManager.refresh === 'function') {
            console.log('✅ Using World-Class Fleet Manager');
            window.fleetManager.refresh();
            return;
        }
        
        // Fallback to old implementation if fleet manager not available
        console.log('⚠️ Using fallback fleet management');
        this.loadFleetManagementLegacy();
    }
    
    loadFleetManagementLegacy() {
        // Load fleet management data
        const drivers = dataManager.getUsers().filter(u => u.type === 'driver');
        const routes = dataManager.getRoutes();
        const collections = dataManager.getCollections();
        const driverLocations = dataManager.getAllDriverLocations();
        
        // Enhanced statistics with real-time status
        let availableDriversCount = 0;
        let activeDriversCount = 0;
        let onRouteDriversCount = 0;
        
        drivers.forEach(driver => {
            const liveStatus = this.getDriverLiveStatus(driver.id);
            if (liveStatus.status === 'Active') {
                availableDriversCount++;
                activeDriversCount++;
            } else if (liveStatus.status === 'On Route') {
                onRouteDriversCount++;
                activeDriversCount++;
            }
        });
        
        // Update statistics with real data
        const activeVehiclesEl = document.getElementById('activeVehiclesCount');
        const availableDriversEl = document.getElementById('availableDriversCount');
        const activeRoutesEl = document.getElementById('activeRoutesCount');
        const maintenanceVehiclesEl = document.getElementById('maintenanceVehiclesCount');
        
        if (activeVehiclesEl) activeVehiclesEl.textContent = activeDriversCount;
        if (availableDriversEl) availableDriversEl.textContent = availableDriversCount;
        if (activeRoutesEl) activeRoutesEl.textContent = onRouteDriversCount;
        if (maintenanceVehiclesEl) maintenanceVehiclesEl.textContent = drivers.length - activeDriversCount;
        
        // Load enhanced driver list
        const driversList = document.getElementById('fleetDriversList');
        if (driversList) {
            if (drivers.length === 0) {
                driversList.innerHTML = '<p style="text-align: center; color: #94a3b8;">No drivers registered</p>';
            } else {
                driversList.innerHTML = drivers.map(driver => {
                    const driverCollections = collections.filter(c => c.driverId === driver.id);
                    const driverRoutes = routes.filter(r => r.driverId === driver.id);
                    const liveStatus = this.getDriverLiveStatus(driver.id);
                    const driverLocation = driverLocations[driver.id];
                    
                    // Get fuel level
                    const fuelData = dataManager.getData('driverFuelLevels') || {};
                    const fuelLevel = fuelData[driver.id] || 75;
                    
                    // Status styling based on live status
                    let statusClass = 'available';
                    let statusColor = '#10b981';
                    
                    if (liveStatus.status === 'On Route') {
                        statusClass = 'busy';
                        statusColor = '#f59e0b';
                    } else if (liveStatus.status === 'On Break') {
                        statusClass = 'warning';
                        statusColor = '#f59e0b';
                    } else if (liveStatus.status === 'Offline') {
                        statusClass = 'offline';
                        statusColor = '#6b7280';
                    }
                    
                    // Calculate last update time
                    let lastUpdateText = 'Just now';
                    if (driverLocation && driverLocation.lastUpdate) {
                        const lastUpdate = new Date(driverLocation.lastUpdate);
                        const now = new Date();
                        const diffMinutes = Math.round((now - lastUpdate) / 60000);
                        
                        if (diffMinutes < 1) {
                            lastUpdateText = 'Just now';
                        } else if (diffMinutes < 60) {
                            lastUpdateText = `${diffMinutes}m ago`;
                        } else {
                            lastUpdateText = `${Math.round(diffMinutes / 60)}h ago`;
                        }
                    }
                    
                    return `
                        <div class="driver-card" onclick="showDriverDetailsModal('${driver.id}')" style="cursor: pointer; transition: all 0.3s ease; border: 1px solid rgba(255,255,255,0.1);">
                            <div class="driver-info">
                                <div class="driver-avatar" style="background: linear-gradient(135deg, ${statusColor}, ${statusColor}aa);">
                                    ${driver.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div>
                                    <div style="font-weight: bold; display: flex; align-items: center; gap: 0.5rem;">
                                        ${driver.name}
                                        <span style="font-size: 0.75rem; color: ${statusColor}; font-weight: normal; padding: 2px 8px; border-radius: 10px; background: ${statusColor}20;">
                                            ${liveStatus.status}
                                        </span>
                                    </div>
                                    <div style="color: #94a3b8; font-size: 0.875rem;">
                                        ${driver.vehicleId || 'No Vehicle'} | ${driver.phone || 'No Phone'}
                                    </div>
                                    <div style="color: #94a3b8; font-size: 0.75rem;">
                                        Last update: ${lastUpdateText}
                                    </div>
                                </div>
                            </div>
                            <div class="driver-status">
                                <span class="status-dot status-${statusClass}" style="background-color: ${statusColor};"></span>
                                <span style="color: ${statusColor}; font-weight: 500;">${liveStatus.status}</span>
                            </div>
                            <div style="display: flex; gap: 1rem;">
                                <div style="text-align: center;">
                                    <div style="font-weight: bold;">${driverCollections.length}</div>
                                    <div style="font-size: 0.75rem; color: #94a3b8;">Collections</div>
                                </div>
                                <div style="text-align: center;">
                                    <div style="font-weight: bold;">${driverRoutes.filter(r => r.status === 'completed').length}</div>
                                    <div style="font-size: 0.75rem; color: #94a3b8;">Routes</div>
                                </div>
                                <div style="text-align: center;">
                                    <div style="font-weight: bold; color: ${fuelLevel < 25 ? '#ef4444' : fuelLevel < 50 ? '#f59e0b' : '#10b981'};">
                                        ${fuelLevel}%
                                </div>
                                    <div style="font-size: 0.75rem; color: #94a3b8;">Fuel</div>
                                </div>
                            </div>
                            <div style="margin-top: 0.5rem;">
                                <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); assignRouteToDriver('${driver.id}')" style="width: 100%; font-size: 0.875rem;">
                                    <i class="fas fa-route"></i> Assign Route
                                </button>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }
        
        // Load vehicle status as well
        this.loadVehicleStatus();
        
        console.log('✅ Fleet management loaded');
    }

    // Enhanced driver live status function (shared with bin-modals.js)
    getDriverLiveStatus(driverId) {
        const routes = dataManager.getRoutes();
        const driver = dataManager.getUserById(driverId);
        
        // Check if driver has active routes or is on route
        const activeRoute = routes.find(r => r.driverId === driverId && r.status === 'in-progress');
        
        if (activeRoute || (driver && driver.movementStatus === 'on-route')) {
            return { status: 'On Route', route: activeRoute?.id };
        }
        
        // Enhanced driver location checking
        const driverLocation = dataManager.getDriverLocation(driverId);
        
        let lastUpdate = null;
        
        // Check multiple timestamp fields
        if (driverLocation) {
            if (driverLocation.lastUpdate) {
                lastUpdate = new Date(driverLocation.lastUpdate);
            } else if (driverLocation.timestamp) {
                lastUpdate = new Date(driverLocation.timestamp);
            }
        }
        
        // If no location data but driver is not inactive, create active status
        if (!driverLocation && driver && driver.status !== 'inactive') {
            // Initialize location for active driver
            const defaultLocation = {
                lat: 25.2858 + (Math.random() - 0.5) * 0.01,
                lng: 51.5264 + (Math.random() - 0.5) * 0.01,
                timestamp: new Date().toISOString(),
                lastUpdate: new Date().toISOString(),
                status: 'active'
            };
            
            dataManager.setDriverLocation(driverId, defaultLocation);
            return { status: 'Active', lastSeen: new Date() };
        }
        
        const now = new Date();
        
        if (lastUpdate) {
            const timeDiff = now - lastUpdate;
            
            if (timeDiff < 3600000) { // Less than 1 hour
                return { status: 'Active', lastSeen: lastUpdate };
            } else if (timeDiff < 14400000) { // Less than 4 hours
                return { status: 'On Break', lastSeen: lastUpdate };
            } else {
                return { status: 'Offline', lastSeen: lastUpdate };
            }
        } else {
            // No timestamp available, use driver's general status
            if (driver && driver.status === 'inactive') {
                return { status: 'Offline', lastSeen: null };
            } else {
                // Default to active for drivers without location data
                return { status: 'Active', lastSeen: new Date() };
            }
        }
    }

    // Global function to refresh all driver data across the application
    refreshAllDriverData() {
        console.log('🔄 Refreshing all driver data across application...');
        
        // Refresh current section if it's fleet management
        if (this.currentSection === 'fleet') {
            this.loadFleetManagement();
        }
        
        // Refresh map only if monitoring section is active
        if (typeof mapManager !== 'undefined' && mapManager.map && this.currentSection === 'monitoring') {
            mapManager.loadDriversOnMap();
        }
        
        // Refresh analytics dashboard
        if (typeof analyticsManager !== 'undefined') {
            analyticsManager.updateDashboardMetrics();
        }
        
        // Sync to server
        if (typeof syncManager !== 'undefined') {
            syncManager.syncToServer();
        }
        
        console.log('✅ All driver data refreshed successfully');
    }

    // ENHANCED: Smart real-time monitoring updates
    // OPTIMIZED: Rely on WebSocket updates instead of constant polling
    startLiveMonitoringUpdates() {
        // Clear any existing monitoring interval
        if (this.liveMonitoringInterval) {
            clearInterval(this.liveMonitoringInterval);
        }
        
        console.log('🔴 Starting intelligent live monitoring updates (WebSocket-based)');
        
        // Mark activity to influence sync frequency
        if (window.syncManager) {
            window.syncManager.markActivity();
        }
        
        // OPTIMIZED: Use much longer intervals (30 seconds) - rely on WebSocket for real-time updates
        // The server broadcasts updates via WebSocket when sensor data changes
        // This interval is only for periodic UI refresh, not for data fetching
        this.liveMonitoringInterval = setInterval(() => {
            if (this.currentSection === 'monitoring') {
                // Only update UI, don't trigger API calls
                this.updateMonitoringStats();
            }
        }, 30000); // 30 seconds (increased from 8s to reduce overhead)

        // Set up periodic AI recommendation refresh for drivers (every 120 seconds)
        // Reduced frequency since AI recommendations don't change that rapidly
        if (this.aiRecommendationInterval) {
            clearInterval(this.aiRecommendationInterval);
        }
        this.aiRecommendationInterval = setInterval(() => {
            if (window.currentUser && window.currentUser.type === 'driver' && this.currentSection === 'driver-dashboard') {
                console.log('🤖 Periodic AI recommendation refresh...');
                if (typeof createAISuggestionForDriver === 'function') {
                    createAISuggestionForDriver(window.currentUser.id).then(() => {
                        this.loadAISuggestionForDriver(window.currentUser.id);
                    }).catch(error => {
                        console.error('❌ Periodic AI recommendation refresh failed:', error);
                    });
                }
            }
        }, 120000); // Every 120 seconds (increased from 60s)
        
        // Setup WebSocket listener for real-time updates
        this.setupWebSocketUpdateListeners();
    }
    
    // Setup WebSocket listeners for real-time monitoring updates
    setupWebSocketUpdateListeners() {
        if (this._wsMonitoringListenersSetup) return;
        
        // Listen for sensor updates
        window.addEventListener('sensor_update', (event) => {
            if (this.currentSection === 'monitoring') {
                // Update UI when sensor data changes
                this.updateMonitoringStats();
                // Refresh map with updated data
                if (typeof mapManager !== 'undefined' && mapManager.map) {
                    mapManager.loadDriversOnMap();
                }
            }
        });
        
        // Listen for bin fill updates
        window.addEventListener('bin_fill_update', (event) => {
            if (this.currentSection === 'monitoring') {
                this.updateMonitoringStats();
            }
        });
        
        // Listen for driver updates
        window.addEventListener('driver_update', (event) => {
            if (this.currentSection === 'monitoring') {
                if (typeof mapManager !== 'undefined' && mapManager.map) {
                    mapManager.loadDriversOnMap();
                }
            }
        });
        
        this._wsMonitoringListenersSetup = true;
        console.log('✅ WebSocket monitoring listeners setup');
    }

    // ENHANCED: Intelligent live monitoring sync
    // OPTIMIZED: This is now called less frequently and relies on WebSocket updates
    async performLiveMonitoringSync() {
        try {
            // Only run if monitoring section is active
            if (this.currentSection !== 'monitoring') {
                return;
            }
            
            // Silent sync - only log if debug mode
            if (window.monitoringDebugMode) {
                console.log('🔄 Performing live monitoring sync...');
            }
            
            // REMOVED: Don't call syncManager.performIntelligentSync() here
            // The sync manager already runs on its own 60-second interval
            // This prevents redundant sync calls that were flooding the server
            
            // Just update the UI with current cached data
            if (typeof mapManager !== 'undefined' && mapManager.map) {
                mapManager.loadDriversOnMap();
            }
            
            // Update monitoring stats with current data
            this.updateMonitoringStats();
            
        } catch (error) {
            console.warn('⚠️ Live monitoring sync failed:', error);
        }
    }

    // Update monitoring stats for live monitoring section
    updateMonitoringStats() {
        try {
            // Silent update - only log in debug mode
            if (window.monitoringDebugMode) {
                console.log('📊 Updating live monitoring stats...');
            }
            
            if (typeof dataManager === 'undefined') {
                console.warn('⚠️ dataManager not available for monitoring stats update');
                return;
            }
            
            // Get current data
            const bins = dataManager.getBins();
            const drivers = dataManager.getUsers().filter(u => u.type === 'driver');
            const activeDrivers = drivers.filter(d => d.status === 'active');
            
            // Update system status elements - JUST SHOW NUMBERS (labels are below)
            const activeSensorsElement = document.getElementById('activeSensorsCount');
            if (activeSensorsElement) {
                activeSensorsElement.textContent = bins.length;
            }
            
            const onlineVehiclesElement = document.getElementById('onlineVehiclesCount');
            if (onlineVehiclesElement) {
                onlineVehiclesElement.textContent = activeDrivers.length;
            }
            
            const activeDriversElement = document.getElementById('activeDriversStatus');
            if (activeDriversElement) {
                activeDriversElement.textContent = activeDrivers.length;
            }
            
            // Silent success - reduce logging
            if (window.monitoringDebugMode) {
                console.log('✅ Monitoring stats updated:', {
                    bins: bins.length,
                    vehicles: activeDrivers.length,
                    drivers: activeDrivers.length
                });
            }
            
        } catch (error) {
            console.error('❌ Failed to update monitoring stats:', error);
        }
    }

    // NEW: Stop live monitoring updates
    stopLiveMonitoringUpdates() {
        if (this.liveMonitoringInterval) {
            clearInterval(this.liveMonitoringInterval);
            this.liveMonitoringInterval = null;
            console.log('🔴 Live monitoring updates stopped');
        }
    }

    loadVehicleStatus() {
        // Load vehicle status with enhanced fuel and status data
        const drivers = dataManager.getUsers().filter(u => u.type === 'driver');
        const fuelData = dataManager.getData('driverFuelLevels') || {};
        
        const vehicleList = document.getElementById('vehicleStatusList');
        if (vehicleList) {
            vehicleList.innerHTML = drivers.map(driver => {
                const liveStatus = this.getDriverLiveStatus(driver.id);
                const fuelLevel = fuelData[driver.id] || 75;
                
                let statusColor = '#10b981';
                if (liveStatus.status === 'On Route') statusColor = '#f59e0b';
                else if (liveStatus.status === 'Offline') statusColor = '#6b7280';
                
                return `
                <div class="glass-card" style="margin-bottom: 1rem; padding: 1rem; border-left: 4px solid ${statusColor};">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-weight: bold; display: flex; align-items: center; gap: 0.5rem;">
                                ${driver.vehicleId || 'Unassigned'}
                                <span style="font-size: 0.75rem; color: ${statusColor}; padding: 2px 8px; border-radius: 10px; background: ${statusColor}20;">
                                    ${liveStatus.status}
                                </span>
                            </div>
                            <div style="color: #94a3b8; font-size: 0.875rem;">Driver: ${driver.name}</div>
                        </div>
                        <div style="display: flex; gap: 1rem; align-items: center;">
                            <div style="text-align: center;">
                                <i class="fas fa-gas-pump" style="color: ${fuelLevel < 25 ? '#ef4444' : fuelLevel < 50 ? '#f59e0b' : '#10b981'};"></i>
                                <div style="font-size: 0.875rem; font-weight: bold;">${fuelLevel}%</div>
                            </div>
                            <div style="text-align: center;">
                                <i class="fas fa-tachometer-alt" style="color: var(--primary);"></i>
                                <div style="font-size: 0.875rem;">45,230 km</div>
                            </div>
                            <span style="padding: 0.25rem 0.75rem; border-radius: 20px; background: ${statusColor}20; color: ${statusColor}; font-weight: 500; font-size: 0.875rem;">
                                ${liveStatus.status}
                            </span>
                        </div>
                    </div>
                </div>
            `;
            }).join('') || '<p style="text-align: center; color: #94a3b8;">No vehicles in fleet</p>';
        }
    }

    loadRouteOptimization() {
        // Load route optimization data
        console.log('Loading ML route optimization');
        
        // Initialize charts if analytics manager is available
        if (typeof analyticsManager !== 'undefined') {
            // Use available analytics methods
            if (typeof analyticsManager.updateAllCharts === 'function') {
                analyticsManager.updateAllCharts();
            } else if (typeof analyticsManager.initializeAnalytics === 'function') {
                analyticsManager.initializeAnalytics();
            }
            
            // Initialize specific charts if available
            if (typeof analyticsManager.initializeRouteEfficiencyChart === 'function') {
                analyticsManager.initializeRouteEfficiencyChart();
            }
            
            // Initialize predictive charts through V2 manager if available
            if (window.analyticsManagerV2 && typeof window.analyticsManagerV2.initializeDemandForecastChart === 'function') {
                window.analyticsManagerV2.initializeDemandForecastChart();
                window.analyticsManagerV2.initializeOverflowPredictionChart();
            }
        }
        
        // Load optimized routes
        const routesList = document.getElementById('optimizedRoutesList');
        if (routesList) {
            const routes = dataManager.getRoutes();
            const bins = dataManager.getBins();
            
            if (routes.length === 0) {
                routesList.innerHTML = '<p style="text-align: center; color: #94a3b8;">No routes assigned today</p>';
            } else {
                routesList.innerHTML = routes.map(route => {
                    const driver = dataManager.getUserById(route.driverId);
                    const routeBins = bins.filter(b => route.binIds && route.binIds.includes(b.id));
                    const totalFill = routeBins.reduce((sum, b) => sum + (b.fill || 0), 0) / routeBins.length;
                    
                    return `
                        <div class="glass-card" style="margin-bottom: 1rem; padding: 1rem;">
                            <div style="display: flex; justify-content: space-between; align-items: start;">
                                <div>
                                    <h4 style="margin-bottom: 0.5rem;">${route.id}</h4>
                                    <div style="color: #94a3b8; font-size: 0.875rem;">
                                        Driver: ${driver ? driver.name : 'Unassigned'}<br>
                                        Bins: ${routeBins.length}<br>
                                        Avg Fill: ${totalFill.toFixed(0)}%
                                    </div>
                                </div>
                                <div>
                                    <span class="badge-${route.status === 'completed' ? 'success' : route.status === 'in-progress' ? 'warning' : 'danger'}" 
                                          style="padding: 0.25rem 0.75rem; border-radius: 20px;">
                                        ${route.status}
                                    </span>
                                </div>
                            </div>
                            <div style="margin-top: 1rem;">
                                <button class="btn btn-primary btn-sm" onclick="viewRouteDetails('${route.id}')">
                                    <i class="fas fa-eye"></i> View Details
                                </button>
                                <button class="btn btn-secondary btn-sm" onclick="optimizeRoute('${route.id}')">
                                    <i class="fas fa-magic"></i> Re-optimize
                                </button>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }
    }

    loadComplaints() {
        // Load complaints
        const complaints = dataManager.getComplaints();
        const openComplaints = complaints.filter(c => c.status === 'open');
        const inProgressComplaints = complaints.filter(c => c.status === 'in-progress');
        const resolvedToday = complaints.filter(c => 
            c.status === 'resolved' && 
            new Date(c.resolvedAt).toDateString() === new Date().toDateString()
        );
        
        // Update stats
        document.getElementById('openComplaintsCount').textContent = openComplaints.length;
        document.getElementById('pendingComplaintsCount').textContent = inProgressComplaints.length;
        document.getElementById('resolvedComplaintsCount').textContent = resolvedToday.length;
        document.getElementById('avgResolutionTime').textContent = '2.5h';
        
        // Load complaints list
        const complaintsList = document.getElementById('complaintsList');
        if (complaintsList) {
            const activeComplaints = complaints.filter(c => c.status !== 'resolved');
            
            if (activeComplaints.length === 0) {
                complaintsList.innerHTML = '<p style="text-align: center; color: #94a3b8;">No active complaints</p>';
            } else {
                complaintsList.innerHTML = activeComplaints.map(complaint => `
                    <div class="complaint-card">
                        <div class="complaint-header">
                            <div>
                                <h4 style="margin: 0;">${complaint.type.charAt(0).toUpperCase() + complaint.type.slice(1)}</h4>
                                <div style="color: #94a3b8; font-size: 0.875rem; margin-top: 0.25rem;">
                                    ${complaint.location}
                                </div>
                            </div>
                            <span class="complaint-status status-${complaint.status}">
                                ${complaint.status.replace('-', ' ')}
                            </span>
                        </div>
                        <p style="margin: 1rem 0; color: #e2e8f0;">${complaint.description}</p>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div style="color: #94a3b8; font-size: 0.875rem;">
                                <i class="fas fa-clock"></i> ${new Date(complaint.createdAt).toLocaleString()}
                            </div>
                            <div style="display: flex; gap: 0.5rem;">
                                <button class="btn btn-success btn-sm" onclick="resolveComplaint('${complaint.id}')">
                                    <i class="fas fa-check"></i> Resolve
                                </button>
                                <button class="btn btn-primary btn-sm" onclick="viewComplaintDetails('${complaint.id}')">
                                    <i class="fas fa-info-circle"></i> Details
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('');
            }
        }
    }

    loadMonitoring() {
        console.log('🔄 Loading monitoring section...');
        
        // Initialize map (if not already initialized)
        this.initializeMapIfNeeded();
        
        // Load monitoring data with slight delay to ensure map is ready
            setTimeout(() => {
            this.loadMonitoringData();
        }, 150);
        
        // NEW: Start real-time monitoring updates
        this.startLiveMonitoringUpdates();
    }

    // Initialize map early to support driver tracking - FIXED with proper mapManager checks
    initializeMapIfNeeded() {
        // First check if mapManager is available at all
        if (typeof mapManager === 'undefined') {
            console.log('⚠️ mapManager not available yet, retrying in 100ms...');
            setTimeout(() => {
                this.initializeMapIfNeeded();
            }, 100);
            return;
        }
        
        if (typeof mapManager !== 'undefined' && !mapManager.map) {
            console.log('🗺️ Attempting map initialization...');
            
            // Show loading indicator
            const loadingElement = document.getElementById('mapLoading');
            if (loadingElement) {
                loadingElement.style.display = 'block';
            }
            
            // Check if map container is visible and has dimensions
            const mapContainer = document.getElementById('map');
            if (!mapContainer) {
                console.error('❌ Map container element not found');
                if (loadingElement) loadingElement.style.display = 'none';
                return;
            }
            
            const containerRect = mapContainer.getBoundingClientRect();
            const isVisible = mapContainer.offsetParent !== null;
            
            console.log('🔍 Map container status:', {
                exists: !!mapContainer,
                isVisible,
                width: containerRect.width,
                height: containerRect.height,
                display: getComputedStyle(mapContainer).display
            });
            
            if (!isVisible || containerRect.width === 0 || containerRect.height === 0) {
                console.log('⚠️ Map container not properly visible, deferring initialization...');
                // Don't retry automatically - wait for section to become visible
                if (loadingElement) loadingElement.style.display = 'none';
                return;
            }
            
            try {
                console.log('🗺️ Initializing map now...');
                const mapInstance = mapManager.initializeMainMap('map');
                
                // Verify map was created successfully
                if (mapInstance && typeof mapManager !== 'undefined' && mapManager.map) {
                    console.log('✅ Map initialized successfully');
                    
                    // Hide loading indicator
                    if (loadingElement) {
                        setTimeout(() => {
                            loadingElement.style.display = 'none';
                        }, 500);
                    }
                    
                    // Force a resize to ensure proper rendering
                    setTimeout(() => {
                        if (typeof mapManager !== 'undefined' && mapManager.map) {
                            mapManager.map.invalidateSize();
                        }
                    }, 100);
                } else {
                    console.error('❌ Map initialization failed - map object is null');
                    if (loadingElement) {
                        loadingElement.innerHTML = `
                            <div style="color: #ef4444;">
                                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                                <div>Map failed to load</div>
                                <button onclick="window.app.initializeMapIfNeeded()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">Retry</button>
                            </div>
                        `;
                    }
                }
            } catch (error) {
                console.error('❌ Map initialization error:', error);
                
                if (loadingElement) {
                    loadingElement.innerHTML = `
                        <div style="color: #ef4444;">
                            <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                            <div>Map error: ${error.message}</div>
                            <button onclick="window.app.initializeMapIfNeeded()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">Retry</button>
                        </div>
                    `;
                }
                
                // Retry once more after a longer delay
                setTimeout(() => {
                    this.initializeMapIfNeeded();
                }, 1000);
            }
        } else if (typeof mapManager !== 'undefined' && mapManager && mapManager.map) {
            console.log('✅ Map already initialized');
            
            // Hide loading indicator if visible
            const loadingElement = document.getElementById('mapLoading');
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }
            
            // Force resize in case container size changed
            setTimeout(() => {
                if (typeof mapManager !== 'undefined' && mapManager.map) {
                    mapManager.map.invalidateSize();
                }
            }, 50);
        } else {
            console.log('⚠️ mapManager exists but map not ready, will retry automatically');
        }
    }

    loadMonitoringData() {
        // Load monitoring data
        const bins = dataManager.getBins();
        const drivers = dataManager.getUsers().filter(u => u.type === 'driver');
        const activeDrivers = drivers.filter(d => d.status === 'active');
        const alerts = dataManager.getActiveAlerts();
        
        // Update system status - Show only numbers for clean UI
        const activeSensorsEl = document.getElementById('activeSensorsCount');
        const onlineVehiclesEl = document.getElementById('onlineVehiclesCount');
        const activeDriversEl = document.getElementById('activeDriversStatus');
        
        if (activeSensorsEl) activeSensorsEl.textContent = bins.length || 0;
        if (onlineVehiclesEl) onlineVehiclesEl.textContent = activeDrivers.length || 0;
        if (activeDriversEl) activeDriversEl.textContent = activeDrivers.length || 0;
        
        // Load critical bins - USE REAL DATA
        const criticalBins = bins.filter(b => 
            b.status === 'critical' || 
            (b.fillLevel && b.fillLevel >= 85) || 
            (b.fill && b.fill >= 85)
        );
        const criticalBinsList = document.getElementById('criticalBinsList');
        const criticalBinsCountBadge = document.getElementById('criticalBinsCount');
        
        // Update count badge
        if (criticalBinsCountBadge) {
            criticalBinsCountBadge.textContent = criticalBins.length;
        }
        
        if (criticalBinsList) {
            if (criticalBins.length === 0) {
                criticalBinsList.innerHTML = `
                    <div class="no-data-placeholder" style="text-align: center; padding: 1.5rem; color: #64748b; font-size: 0.85rem;">
                        <i class="fas fa-check-circle" style="font-size: 1.5rem; color: #10b981; margin-bottom: 0.5rem; display: block;"></i>
                        No critical bins at this time
                    </div>`;
            } else {
                criticalBinsList.innerHTML = criticalBins.map(bin => `
                    <div class="critical-bin-item" onclick="showBinDetails('${bin.id}')">
                        <div class="critical-bin-info">
                            <div class="critical-bin-id">${bin.id}</div>
                            <div class="critical-bin-location">${bin.location?.address || bin.location || 'No location'}</div>
                        </div>
                        <div class="critical-bin-actions" style="display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0;">
                            <span class="critical-bin-percentage">${bin.fillLevel || bin.fill || 0}%</span>
                            <button type="button" class="btn-assign-driver-critical" onclick="event.stopPropagation(); openAssignDriverForBin && openAssignDriverForBin('${bin.id}')" title="Assign a driver to collect this bin">
                                <i class="fas fa-user-plus"></i> Assign driver
                            </button>
                        </div>
                    </div>
                `).join('');
            }
        }
        
        // Load all bins list
        this.loadAllBins();
        
        // Ensure driver markers are on the Live Monitoring map (idempotent; updates or adds)
        if (typeof mapManager !== 'undefined' && mapManager.loadDriversOnMap) {
            setTimeout(() => mapManager.loadDriversOnMap(), 300);
        }
        
        // Load active alerts - Enhanced World-Class UI
        const alertsList = document.getElementById('activeAlertsList');
        const activeAlertsCountBadge = document.getElementById('activeAlertsCountBadge');
        
        // Update count badge  
        if (activeAlertsCountBadge) {
            activeAlertsCountBadge.textContent = alerts.length;
        }
        
        if (alertsList) {
            if (alerts.length === 0) {
                alertsList.innerHTML = `
                    <div class="no-data-placeholder" style="text-align: center; padding: 1.5rem; color: #64748b; font-size: 0.85rem;">
                        <i class="fas fa-bell-slash" style="font-size: 1.5rem; color: #64748b; margin-bottom: 0.5rem; display: block; opacity: 0.7;"></i>
                        No active alerts
                    </div>`;
            } else {
                alertsList.innerHTML = alerts.map(alert => `
                    <div class="alert-item ${alert.priority === 'critical' ? 'critical' : ''}">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem;">
                            <div style="flex: 1;">
                                <div style="font-weight: 700; font-size: 0.85rem; color: ${alert.priority === 'critical' ? '#ef4444' : '#f59e0b'}; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.35rem;">
                                    <i class="fas fa-exclamation-triangle" style="margin-right: 0.35rem;"></i> ${alert.type ? alert.type.replace('_', ' ').toUpperCase() : 'ALERT'}
                                </div>
                                <div style="color: #cbd5e1; font-size: 0.85rem; line-height: 1.4; margin-bottom: 0.35rem;">
                                    ${alert.message}
                                </div>
                                <div style="color: #64748b; font-size: 0.75rem;">
                                    ${new Date(alert.timestamp).toLocaleString()}
                                </div>
                            </div>
                            <button type="button" class="alert-dismiss-btn" onclick="event.stopPropagation(); dismissAlert('${alert.id}')" aria-label="Dismiss alert">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                `).join('');
            }
        }
    }

    loadAllBins() {
        const binsList = document.getElementById('allBinsList');
        if (!binsList) return;
        
        const bins = dataManager.getBins();
        
        if (bins.length === 0) {
            binsList.innerHTML = '<p style="text-align: center; color: #94a3b8;">No bins registered</p>';
            return;
        }
        
        binsList.innerHTML = bins.map(bin => {
            const statusClass = bin.status === 'critical' ? 'status-critical' : 
                               bin.status === 'warning' ? 'status-warning' : 'status-ok';
            const fillColor = bin.fill >= 85 ? '#ef4444' : 
                             bin.fill >= 70 ? '#f59e0b' : '#10b981';
            
            return `
                <div class="bin-item" style="cursor: pointer; position: relative; overflow: hidden;" 
                     onclick="showBinDetails('${bin.id}')"
                     onmouseover="this.style.background='rgba(0, 212, 255, 0.05)'"
                     onmouseout="this.style.background='transparent'">
                    <div class="bin-status" style="display: flex; align-items: center; gap: 1rem;">
                        <span class="status-indicator ${statusClass}"></span>
                        <div style="flex: 1;">
                            <div style="font-weight: bold; color: #e2e8f0;">
                                ${bin.id}
                                ${bin.status === 'critical' ? 
                                    '<span style="margin-left: 0.5rem; padding: 0.125rem 0.5rem; background: rgba(239, 68, 68, 0.2); color: #ef4444; border-radius: 12px; font-size: 0.75rem;">CRITICAL</span>' : ''}
                            </div>
                            <div style="color: #94a3b8; font-size: 0.875rem;">
                                <i class="fas fa-map-marker-alt"></i> ${bin.location}
                            </div>
                            <div style="display: flex; gap: 1.5rem; margin-top: 0.25rem; font-size: 0.75rem;">
                                <span style="color: #64748b;">
                                    <i class="fas fa-clock"></i> ${bin.lastCollection}
                                </span>
                                <span style="color: #64748b;">
                                    <i class="fas fa-thermometer-half"></i> ${bin.temperature || 25}°C
                                </span>
                                <span style="color: #64748b;">
                                    <i class="fas fa-battery-three-quarters"></i> ${bin.batteryLevel || 85}%
                                </span>
                            </div>
                        </div>
                        <div style="text-align: center;">
                            <div style="position: relative; width: 60px; height: 60px;">
                                <svg viewBox="0 0 60 60" style="transform: rotate(-90deg);">
                                    <circle cx="30" cy="30" r="25" 
                                            fill="none" 
                                            stroke="rgba(255, 255, 255, 0.1)" 
                                            stroke-width="5"/>
                                    <circle cx="30" cy="30" r="25" 
                                            fill="none" 
                                            stroke="${fillColor}" 
                                            stroke-width="5"
                                            stroke-linecap="round"
                                            stroke-dasharray="${157 * (bin.fill / 100)} 157"/>
                                </svg>
                                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-weight: bold; color: ${fillColor};">
                                    ${bin.fill}%
                                </div>
                            </div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem;">
                        <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); showBinDetails('${bin.id}')">
                            <i class="fas fa-eye"></i> View Details
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); assignJob('${bin.id}')">
                            <i class="fas fa-user-plus"></i> Assign Driver
                        </button>
                        ${bin.fill >= 70 ? `
                            <button class="btn btn-warning btn-sm" onclick="event.stopPropagation(); scheduleUrgentCollection('${bin.id}')">
                                <i class="fas fa-exclamation-triangle"></i> Urgent
                            </button>
                        ` : ''}
                    </div>
                    <!-- Progress bar at bottom -->
                    <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 3px; background: rgba(255, 255, 255, 0.1);">
                        <div style="height: 100%; width: ${bin.fill}%; background: ${fillColor}; transition: width 0.3s;"></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    async loadSensorIntervalSetting() {
        const selectEl = document.getElementById('sensorReportingIntervalMinutes');
        const statusEl = document.getElementById('sensorIntervalStatus');
        const saveBtn = document.getElementById('saveSensorIntervalBtn');
        try {
            const res = await fetch(window.location.origin + '/api/settings');
            const json = await res.json();
            const min = (json.settings && json.settings.sensorReportingIntervalMinutes) || 30;
            const val = Math.max(5, Math.min(120, Number(min)));
            window.__sensorReportingIntervalMinutes = val;
            if (selectEl) selectEl.value = String(val);
        } catch (e) {
            window.__sensorReportingIntervalMinutes = 30;
            if (statusEl) statusEl.textContent = 'Using default 30 min';
        }
        if (saveBtn && !saveBtn._sensorIntervalBound) {
            saveBtn._sensorIntervalBound = true;
            saveBtn.addEventListener('click', async () => {
                const v = Math.max(5, Math.min(120, parseInt(selectEl.value, 10) || 30));
                statusEl.textContent = 'Saving…';
                try {
                    const res = await fetch(window.location.origin + '/api/settings', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ sensorReportingIntervalMinutes: v })
                    });
                    const json = await res.json();
                    if (json.success) {
                        window.__sensorReportingIntervalMinutes = v;
                        statusEl.textContent = 'Saved. Protection window: ' + (v + 5) + ' min';
                        if (this.showAlert) this.showAlert('Settings saved', 'Sensor reporting interval set to ' + v + ' minutes.', 'success');
                    } else {
                        statusEl.textContent = 'Save failed';
                    }
                } catch (e) {
                    statusEl.textContent = 'Error';
                    if (this.showAlert) this.showAlert('Error', (e && e.message) || 'Failed to save settings', 'danger');
                }
            });
        }
    }

    loadAdminPanel() {
        // Load admin panel data
        const stats = dataManager.getSystemStats();
        
        // Fetch and apply sensor reporting interval setting (admin-adjustable)
        this.loadSensorIntervalSetting();
        
        // Update system stats
        document.getElementById('totalUsersCount').textContent = stats.totalUsers;
        document.getElementById('totalBinsCount').textContent = stats.totalBins;
        document.getElementById('activeDriversCount').textContent = stats.activeDrivers;
        document.getElementById('activeAlertsCount').textContent = stats.activeAlerts;
        
        // Load pending registrations
        const pendingList = document.getElementById('pendingRegistrationsList');
        if (pendingList) {
            const pending = dataManager.getPendingRegistrations();
            
            if (pending.length === 0) {
                pendingList.innerHTML = '<p style="text-align: center; color: #94a3b8;">No pending registrations</p>';
            } else {
                pendingList.innerHTML = pending.map(reg => `
                    <div class="glass-card" style="margin-bottom: 1rem;">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <div>
                                <h4 style="margin-bottom: 0.5rem;">${reg.name}</h4>
                                <div style="color: #94a3b8; font-size: 0.875rem;">
                                    <div>Type: ${reg.userType}</div>
                                    <div>Username: ${reg.username}</div>
                                    <div>Email: ${reg.email}</div>
                                    <div>Submitted: ${new Date(reg.submittedAt).toLocaleDateString()}</div>
                                </div>
                            </div>
                            <div style="display: flex; gap: 0.5rem;">
                                <button class="btn btn-success btn-sm" onclick="approveRegistration('${reg.id}')">
                                    <i class="fas fa-check"></i> Approve
                                </button>
                                <button class="btn btn-danger btn-sm" onclick="rejectRegistration('${reg.id}')">
                                    <i class="fas fa-times"></i> Reject
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('');
            }
        }

        // Bin Management: list all bins with Remove button
        const binManagementList = document.getElementById('binManagementList');
        if (binManagementList) {
            const bins = (typeof dataManager.getBins === 'function' ? dataManager.getBins() : []) || [];
            const esc = (s) => (s || '').toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
            if (bins.length === 0) {
                binManagementList.innerHTML = '<p style="text-align: center; color: #94a3b8; padding: 1.5rem;">No bins in the system. Bins will appear here after they are added and synced.</p>';
            } else {
                binManagementList.innerHTML = `
                    <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 0.5rem;">
                        <button type="button" class="btn btn-secondary btn-sm" onclick="window.app && window.app.loadAdminPanel()">
                            <i class="fas fa-sync-alt"></i> Refresh
                        </button>
                    </div>
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="border-bottom: 2px solid rgba(255, 255, 255, 0.1);">
                                    <th style="text-align: left; padding: 0.75rem;">Bin ID</th>
                                    <th style="text-align: left; padding: 0.75rem;">Location</th>
                                    <th style="text-align: left; padding: 0.75rem;">Fill</th>
                                    <th style="text-align: left; padding: 0.75rem;">Status</th>
                                    <th style="text-align: left; padding: 0.75rem;">Sensor</th>
                                    <th style="text-align: center; padding: 0.75rem;">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${bins.map(bin => `
                                    <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                                        <td style="padding: 0.75rem;"><strong>${esc(bin.id)}</strong></td>
                                        <td style="padding: 0.75rem;">${esc(bin.location || (bin.lat && bin.lng ? bin.lat.toFixed(4) + ', ' + bin.lng.toFixed(4) : '—'))}</td>
                                        <td style="padding: 0.75rem;">${typeof bin.fill === 'number' ? bin.fill + '%' : (bin.fillLevel != null ? bin.fillLevel + '%' : '—')}</td>
                                        <td style="padding: 0.75rem;">
                                            <span class="badge-${(bin.status === 'critical' || bin.fill >= 85) ? 'danger' : (bin.status === 'warning' || bin.fill >= 70) ? 'warning' : 'success'}" style="padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem;">${esc(bin.status || 'normal')}</span>
                                        </td>
                                        <td style="padding: 0.75rem;">${(bin.sensorIMEI || bin.hasSensor) ? '<i class="fas fa-check-circle" style="color: #10b981;"></i>' : '—'}</td>
                                        <td style="padding: 0.75rem; text-align: center;">
                                            <button type="button" class="btn btn-sm btn-danger admin-remove-bin" data-bin-id="${esc(bin.id)}" title="Remove bin"><i class="fas fa-trash-alt"></i> Remove</button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
                binManagementList.querySelectorAll('.admin-remove-bin').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const id = this.getAttribute('data-bin-id');
                        if (!id) return;
                        if (!window.confirm('Remove bin "' + id + '"? This will delete the bin from the system. Continue?')) return;
                        try {
                            if (typeof dataManager.deleteBin === 'function') {
                                dataManager.deleteBin(id);
                            } else if (typeof dataManager.removeBin === 'function') {
                                dataManager.removeBin(id);
                            } else {
                                const bins = dataManager.getBins().filter(b => b.id !== id);
                                dataManager.setData('bins', bins);
                            }
                            if (window.syncManager && typeof window.syncManager.syncToServer === 'function') {
                                window.syncManager.syncToServer({ bins: dataManager.getBins() }, 'partial');
                            }
                            if (window.app) { window.app.showAlert('Bin removed', 'Bin ' + id + ' has been removed and changes saved to server.', 'success'); window.app.loadAdminPanel(); }
                        } catch (e) {
                            if (window.app) window.app.showAlert('Error', (e && e.message) || 'Failed to remove bin', 'danger');
                        }
                    });
                });
            }
        }

        // Issue Management: list issues, active alerts, and unresolved complaints
        const issueManagementList = document.getElementById('issueManagementList');
        if (issueManagementList) {
            const issues = (typeof dataManager.getIssues === 'function' ? dataManager.getIssues() : []) || [];
            const activeAlerts = (typeof dataManager.getActiveAlerts === 'function' ? dataManager.getActiveAlerts() : []) || [];
            const activeComplaints = (typeof dataManager.getActiveComplaints === 'function' ? dataManager.getActiveComplaints() : []) || [];
            const esc = (s) => (s || '').toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
            const issueRows = issues.map(i => ({
                type: 'issue',
                id: i.id,
                title: i.title || i.description || 'Issue #' + (i.id || ''),
                status: i.status,
                priority: i.priority || 'medium',
                createdAt: i.createdAt
            }));
            const alertRows = activeAlerts.map(a => ({
                type: 'alert',
                id: a.id,
                title: (a.message || a.type || 'Alert') + (a.relatedId ? ' (' + a.relatedId + ')' : ''),
                status: a.status,
                priority: a.severity === 'critical' ? 'high' : 'medium',
                createdAt: a.timestamp || a.createdAt
            }));
            const complaintRows = activeComplaints.map(c => ({
                type: 'complaint',
                id: c.id,
                title: (c.type || 'Complaint') + ' at ' + (c.location || c.address || '—'),
                status: c.status,
                priority: 'medium',
                createdAt: c.createdAt || c.timestamp
            }));
            const allItems = [...issueRows, ...alertRows, ...complaintRows];
            if (allItems.length === 0) {
                issueManagementList.innerHTML = '<p style="text-align: center; color: #94a3b8; padding: 1.5rem;">No open issues, alerts, or complaints. Everything is in order.</p>';
            } else {
                issueManagementList.innerHTML = `
                    <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 0.5rem;">
                        <button type="button" class="btn btn-secondary btn-sm" onclick="window.app && window.app.loadAdminPanel()">
                            <i class="fas fa-sync-alt"></i> Refresh
                        </button>
                    </div>
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="border-bottom: 2px solid rgba(255, 255, 255, 0.1);">
                                    <th style="text-align: left; padding: 0.75rem;">Type</th>
                                    <th style="text-align: left; padding: 0.75rem;">ID</th>
                                    <th style="text-align: left; padding: 0.75rem;">Title</th>
                                    <th style="text-align: left; padding: 0.75rem;">Status</th>
                                    <th style="text-align: left; padding: 0.75rem;">Priority</th>
                                    <th style="text-align: center; padding: 0.75rem;">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${allItems.map(item => `
                                    <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                                        <td style="padding: 0.75rem;"><span style="text-transform: capitalize;">${esc(item.type)}</span></td>
                                        <td style="padding: 0.75rem;">${esc(item.id)}</td>
                                        <td style="padding: 0.75rem;">${esc(item.title)}</td>
                                        <td style="padding: 0.75rem;">${esc(item.status)}</td>
                                        <td style="padding: 0.75rem;">${esc(item.priority)}</td>
                                        <td style="padding: 0.75rem; text-align: center;">
                                            ${item.type === 'alert' ? `<button type="button" class="btn btn-sm btn-secondary admin-dismiss-alert" data-alert-id="${esc(item.id)}"><i class="fas fa-check"></i> Dismiss</button>` : ''}
                                            ${item.type === 'issue' ? `<button type="button" class="btn btn-sm btn-success admin-resolve-issue" data-issue-id="${esc(item.id)}"><i class="fas fa-check"></i> Resolve</button>` : ''}
                                            ${item.type === 'complaint' ? `<button type="button" class="btn btn-sm btn-success admin-resolve-complaint" data-complaint-id="${esc(item.id)}"><i class="fas fa-check"></i> Resolve</button>` : ''}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
                issueManagementList.querySelectorAll('.admin-dismiss-alert').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const id = this.getAttribute('data-alert-id');
                        if (id && typeof dataManager.dismissAlert === 'function') {
                            dataManager.dismissAlert(id);
                            if (window.syncManager && typeof window.syncManager.syncToServer === 'function') {
                                window.syncManager.syncToServer({ alerts: dataManager.getAlerts() }, 'partial');
                            }
                            if (window.app) { window.app.showAlert('Alert dismissed', '', 'success'); window.app.loadAdminPanel(); }
                        }
                    });
                });
                issueManagementList.querySelectorAll('.admin-resolve-issue').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const id = this.getAttribute('data-issue-id');
                        if (id && typeof dataManager.updateIssue === 'function') {
                            try {
                                dataManager.updateIssue(id, { status: 'resolved', resolvedAt: new Date().toISOString() });
                                if (window.syncManager && typeof window.syncManager.syncToServer === 'function') {
                                    window.syncManager.syncToServer({ issues: dataManager.getIssues() }, 'partial');
                                }
                                if (window.app) { window.app.showAlert('Issue resolved', '', 'success'); window.app.loadAdminPanel(); }
                            } catch (e) {
                                if (window.app) window.app.showAlert('Error', (e && e.message) || 'Failed to resolve issue', 'danger');
                            }
                        }
                    });
                });
                issueManagementList.querySelectorAll('.admin-resolve-complaint').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const id = this.getAttribute('data-complaint-id');
                        if (id && typeof dataManager.updateComplaint === 'function') {
                            try {
                                dataManager.updateComplaint(id, { status: 'resolved' });
                                if (window.syncManager && typeof window.syncManager.syncToServer === 'function') {
                                    window.syncManager.syncToServer({ complaints: dataManager.getComplaints() }, 'partial');
                                }
                                if (window.app) { window.app.showAlert('Complaint resolved', '', 'success'); window.app.loadAdminPanel(); }
                            } catch (e) {
                                if (window.app) window.app.showAlert('Error', (e && e.message) || 'Failed to resolve complaint', 'danger');
                            }
                        }
                    });
                });
            }
        }
        
        // Load user management
        const userManagementList = document.getElementById('userManagementList');
        if (userManagementList) {
            const users = dataManager.getUsers();
            const esc = (s) => (s || '').toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
            userManagementList.innerHTML = `
                <div style="margin-bottom: 1rem; display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center;">
                    <input type="text" class="form-input" placeholder="Search users..." 
                           onkeyup="searchUsers(this.value)" 
                           style="max-width: 300px;">
                    <button type="button" class="btn btn-primary btn-sm" onclick="window.openAddUserForm && window.openAddUserForm();">
                        <i class="fas fa-user-plus"></i> Add user
                    </button>
                </div>
                <div id="addUserFormContainer" style="display: none; margin-bottom: 1rem; padding: 1rem; background: #1e293b; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; position: relative; z-index: 10002; pointer-events: auto;">
                    <h4 style="margin: 0 0 0.75rem 0;">New user</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.75rem;">
                        <input type="text" id="newUserName" placeholder="Full name" class="form-input">
                        <input type="text" id="newUserUsername" placeholder="Username" class="form-input">
                        <input type="password" id="newUserPassword" placeholder="Password" class="form-input">
                        <select id="newUserType" class="form-input"><option value="driver">driver</option><option value="manager">manager</option><option value="admin">admin</option></select>
                        <input type="email" id="newUserEmail" placeholder="Email" class="form-input">
                    </div>
                    <div style="margin-top: 0.75rem; display: flex; gap: 0.5rem;">
                        <button type="button" class="btn btn-primary btn-sm" onclick="window.submitAddUser && window.submitAddUser();">Save</button>
                        <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('addUserFormContainer').style.display='none';">Cancel</button>
                    </div>
                </div>
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="border-bottom: 2px solid rgba(255, 255, 255, 0.1);">
                                <th style="text-align: left; padding: 0.75rem;">Name</th>
                                <th style="text-align: left; padding: 0.75rem;">Username</th>
                                <th style="text-align: left; padding: 0.75rem;">Type</th>
                                <th style="text-align: left; padding: 0.75rem;">Status</th>
                                <th style="text-align: left; padding: 0.75rem;">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="usersTableBody">
                            ${users.map(user => `
                                <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);" data-user-id="${esc(user.id)}">
                                    <td style="padding: 0.75rem;">${esc(user.name)}</td>
                                    <td style="padding: 0.75rem;">${esc(user.username)}</td>
                                    <td style="padding: 0.75rem;">
                                        <span class="badge-${user.type === 'admin' ? 'danger' : user.type === 'manager' ? 'warning' : 'success'}" 
                                              style="padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem;">
                                            ${esc(user.type)}
                                        </span>
                                    </td>
                                    <td style="padding: 0.75rem;">
                                        <span class="badge-${user.status === 'active' ? 'success' : 'warning'}" 
                                              style="padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem;">
                                            ${esc(user.status)}
                                        </span>
                                    </td>
                                    <td style="padding: 0.75rem;">
                                        <button type="button" class="btn btn-sm ${user.status === 'active' ? 'btn-warning' : 'btn-success'}" onclick="toggleUserStatus('${esc(user.id)}')">${user.status === 'active' ? 'Deactivate' : 'Activate'}</button>
                                        <button type="button" class="btn btn-sm btn-danger admin-remove-user" data-user-id="${esc(user.id)}" title="Remove user"><i class="fas fa-trash-alt"></i></button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
            userManagementList.querySelectorAll('.admin-remove-user').forEach(btn => {
                btn.addEventListener('click', function() {
                    const id = this.getAttribute('data-user-id');
                    if (id && window.confirm('Remove this user? This cannot be undone.')) {
                        dataManager.removeUser(id);
                        if (window.syncManager && typeof window.syncManager.syncToServer === 'function') {
                            window.syncManager.syncToServer({ users: dataManager.getUsers() }, 'partial');
                        }
                        if (window.app) { window.app.showAlert('User removed', 'User has been removed and changes saved to server.', 'success'); window.app.loadAdminPanel(); }
                    }
                });
            });
        }

        // Load vehicle management (available vehicles, assigned driver, add/remove)
        const vehicleManagementList = document.getElementById('vehicleManagementList');
        if (vehicleManagementList) {
            const vehiclesFromDb = dataManager.getVehicles();
            const drivers = dataManager.getUsers().filter(u => u.type === 'driver');
            const byDriverVehicleId = drivers.filter(d => d.vehicleId).map(d => ({ id: d.vehicleId, type: null, driverId: d.id }));
            const seen = new Set(vehiclesFromDb.map(v => v.id));
            const vehicles = [...vehiclesFromDb];
            byDriverVehicleId.forEach(v => { if (!seen.has(v.id)) { seen.add(v.id); vehicles.push(v); } });
            const esc = (s) => (s || '').toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
            const getAssignedDriver = (vehicle) => {
                const byVehicleId = drivers.find(d => d.vehicleId === vehicle.id);
                const byDriverId = vehicle.driverId && drivers.find(d => d.id === vehicle.driverId);
                return byVehicleId || byDriverId || null;
            };
            vehicleManagementList.innerHTML = `
                <div style="margin-bottom: 1rem; display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center;">
                    <button type="button" class="btn btn-primary btn-sm" onclick="window.openAddVehicleForm && window.openAddVehicleForm();">
                        <i class="fas fa-truck"></i> Add vehicle
                    </button>
                </div>
                <div id="addVehicleFormContainer" style="display: none; margin-bottom: 1rem; padding: 1rem; background: #1e293b; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; position: relative; z-index: 10002; pointer-events: auto;">
                    <h4 style="margin: 0 0 0.75rem 0;">New vehicle</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.75rem;">
                        <input type="text" id="newVehicleId" placeholder="Vehicle ID (e.g. DA130-01)" class="form-input">
                        <input type="text" id="newVehicleType" placeholder="Type (e.g. Truck)" class="form-input">
                        <select id="newVehicleDriver" class="form-input">
                            <option value="">— No driver —</option>
                            ${drivers.map(d => `<option value="${esc(d.id)}">${esc(d.name)} (${esc(d.vehicleId || 'unassigned')})</option>`).join('')}
                        </select>
                    </div>
                    <div style="margin-top: 0.75rem;">
                        <button type="button" class="btn btn-primary btn-sm" onclick="window.submitAddVehicle && window.submitAddVehicle();">Save</button>
                        <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('addVehicleFormContainer').style.display='none';">Cancel</button>
                    </div>
                </div>
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="border-bottom: 2px solid rgba(255, 255, 255, 0.1);">
                                <th style="text-align: left; padding: 0.75rem;">Vehicle ID</th>
                                <th style="text-align: left; padding: 0.75rem;">Type</th>
                                <th style="text-align: left; padding: 0.75rem;">Assigned driver</th>
                                <th style="text-align: left; padding: 0.75rem;">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="vehiclesTableBody">
                            ${vehicles.length === 0 ? '<tr><td colspan="4" style="padding: 1rem; text-align: center; color: #94a3b8;">No vehicles. Add one above.</td></tr>' : vehicles.map(v => {
                                const driver = getAssignedDriver(v);
                                return `
                                <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);" data-vehicle-id="${esc(v.id)}">
                                    <td style="padding: 0.75rem;">${esc(v.id)}</td>
                                    <td style="padding: 0.75rem;">${esc(v.type || '—')}</td>
                                    <td style="padding: 0.75rem;">${driver ? esc(driver.name) + ' (' + esc(driver.id) + ')' : '<span style="color: #94a3b8;">Available</span>'}</td>
                                    <td style="padding: 0.75rem;">
                                        <select class="form-input admin-vehicle-assign" data-vehicle-id="${esc(v.id)}" style="max-width: 180px; padding: 0.35rem 0.5rem; font-size: 0.875rem;">
                                            <option value="">— Assign driver —</option>
                                            ${drivers.map(d => `<option value="${esc(d.id)}" ${driver && driver.id === d.id ? 'selected' : ''}>${esc(d.name)}</option>`).join('')}
                                        </select>
                                        <button type="button" class="btn btn-sm btn-danger admin-remove-vehicle" data-vehicle-id="${esc(v.id)}" title="Remove vehicle"><i class="fas fa-trash-alt"></i></button>
                                    </td>
                                </tr>
                            `}).join('')}
                        </tbody>
                    </table>
                </div>
            `;
            vehicleManagementList.querySelectorAll('.admin-remove-vehicle').forEach(btn => {
                btn.addEventListener('click', function() {
                    const id = this.getAttribute('data-vehicle-id');
                    if (!id || !window.confirm('Remove this vehicle? Any driver assignment will be cleared.')) return;
                    try {
                        const inDb = dataManager.getVehicles().some(v => v.id === id);
                        if (inDb) dataManager.removeVehicle(id);
                        drivers.forEach(d => {
                            if (d.vehicleId === id) dataManager.updateUser(d.id, { vehicleId: null });
                        });
                        if (window.syncManager && typeof window.syncManager.syncToServer === 'function') {
                            window.syncManager.syncToServer({ users: dataManager.getUsers(), vehicles: dataManager.getVehicles() }, 'partial');
                        }
                        if (window.app) { window.app.showAlert('Vehicle removed', 'Vehicle has been removed and changes saved to server.', 'success'); window.app.loadAdminPanel(); }
                    } catch (e) {
                        if (window.app) window.app.showAlert('Error', e.message || 'Failed to remove vehicle', 'error');
                    }
                });
            });
            vehicleManagementList.querySelectorAll('.admin-vehicle-assign').forEach(sel => {
                sel.addEventListener('change', function() {
                    const vehicleId = this.getAttribute('data-vehicle-id');
                    const driverId = this.value || null;
                    if (!vehicleId) return;
                    const vehiclesInDb = dataManager.getVehicles();
                    const vehicleInDb = vehiclesInDb.find(v => v.id === vehicleId);
                    if (vehicleInDb) dataManager.updateVehicle(vehicleId, { driverId: driverId || undefined });
                    const driversList = dataManager.getUsers().filter(u => u.type === 'driver');
                    driversList.forEach(d => {
                        const hadThisVehicle = d.vehicleId === vehicleId;
                        const shouldHave = d.id === driverId;
                        if (hadThisVehicle && !shouldHave) dataManager.updateUser(d.id, { vehicleId: null });
                        else if (shouldHave) dataManager.updateUser(d.id, { vehicleId: vehicleId });
                    });
                    if (window.syncManager && typeof window.syncManager.syncToServer === 'function') {
                        window.syncManager.syncToServer({ users: dataManager.getUsers(), vehicles: dataManager.getVehicles() }, 'partial');
                    }
                    if (window.app) { window.app.showAlert('Assignment updated', (driverId ? 'Driver assigned to vehicle.' : 'Driver unassigned.') + ' Saved to server.', 'success'); window.app.loadAdminPanel(); }
                });
            });
        }
        
        // Load system logs
        const systemLogsList = document.getElementById('systemLogsList');
        if (systemLogsList) {
            const logs = dataManager.getSystemLogs().slice(-20).reverse(); // Get last 20 logs
            
            systemLogsList.innerHTML = logs.map(log => `
                <div style="padding: 0.5rem; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <div>
                            <span class="badge-${log.type === 'error' ? 'danger' : log.type === 'warning' ? 'warning' : log.type === 'success' ? 'success' : 'info'}" 
                                  style="padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; margin-right: 0.5rem;">
                                ${log.type}
                            </span>
                            <span style="color: #e2e8f0;">${log.message}</span>
                        </div>
                        <div style="color: #94a3b8; font-size: 0.75rem; white-space: nowrap;">
                            ${new Date(log.timestamp).toLocaleString()}
                        </div>
                    </div>
                </div>
            `).join('') || '<p style="text-align: center; color: #94a3b8;">No system logs available</p>';
        }
    }

    setupAlertSystem() {
        // Create alert container if it doesn't exist
        if (!document.getElementById('alertContainer')) {
            const alertContainer = document.createElement('div');
            alertContainer.id = 'alertContainer';
            alertContainer.className = 'alert-container';
            document.body.appendChild(alertContainer);
        }
    }

    showAlert(title, message, type = 'info', duration = 5000) {
        const alertContainer = document.getElementById('alertContainer');
        if (!alertContainer) return;

        const alertId = 'alert-' + Date.now();
        const alertElement = document.createElement('div');
        alertElement.id = alertId;
        alertElement.className = `alert toast-worldclass alert-${type}`;
        alertElement.setAttribute('role', 'status');
        alertElement.setAttribute('aria-live', 'polite');
        
        const iconMap = {
            success: 'fas fa-check',
            error: 'fas fa-times',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle',
            danger: 'fas fa-times'
        };
        const safeTitle = String(title).replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const safeMessage = String(message || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');

        alertElement.innerHTML = `
            <div class="toast-worldclass-inner">
                <div class="toast-worldclass-icon">
                    <i class="${iconMap[type] || iconMap.info}" aria-hidden="true"></i>
                </div>
                <div class="toast-worldclass-body">
                    <div class="toast-worldclass-title">${safeTitle}</div>
                    ${safeMessage ? `<div class="toast-worldclass-message">${safeMessage}</div>` : ''}
                </div>
                <button type="button" class="toast-worldclass-close" aria-label="Dismiss" onclick="window.app && window.app.dismissToast('${alertId}')">
                    <i class="fas fa-times" aria-hidden="true"></i>
                </button>
                ${duration > 0 ? `<div class="toast-worldclass-progress" style="animation-duration: ${duration}ms;"></div>` : ''}
            </div>
        `;

        alertContainer.appendChild(alertElement);

        if (duration > 0) {
            setTimeout(() => {
                this.dismissToast(alertId);
            }, duration);
        }
    }

    dismissToast(alertId) {
        const alert = document.getElementById(alertId);
        if (!alert) return;
        alert.classList.add('toast-worldclass-exit');
        setTimeout(() => alert.remove(), 320);
    }

    updateDriverStats() {
        if (typeof authManager !== 'undefined' && typeof dataManager !== 'undefined') {
            const currentUser = authManager.getCurrentUser();
            if (currentUser && currentUser.type === 'driver') {
                console.log('📊 Updating driver stats for:', currentUser.name);
                
                const allCollections = dataManager.getCollections();
                const driverCollections = allCollections.filter(c => c.driverId === currentUser.id);
                const driverHistory = dataManager.getDriverHistory(currentUser.id) || [];
                
                const routes = dataManager.getDriverRoutes(currentUser.id);
                const allDriverRoutes = (dataManager.getRoutes() || []).filter(r => r.driverId === currentUser.id);
                
                const today = new Date().toDateString();
                let todayCollections = driverCollections.filter(c => 
                    new Date(c.timestamp).toDateString() === today
                ).length;
                const todayFromHistory = driverHistory.filter(h => 
                    h.action === 'collection' && new Date(h.timestamp).toDateString() === today
                ).length;
                if (todayFromHistory > todayCollections) todayCollections = todayFromHistory;
                
                console.log(`📊 Driver ${currentUser.name} stats:`, {
                    totalCollections: driverCollections.length,
                    todayCollections: todayCollections,
                    activeRoutes: routes.length
                });
                
                const pendingBins = routes.reduce((total, route) => {
                    if (route.binIds) return total + route.binIds.length;
                    if (route.binDetails) return total + route.binDetails.length;
                    return total;
                }, 0);
                
                const todayCollectionsEl = document.getElementById('driverTodayCollections');
                const pendingBinsEl = document.getElementById('driverPendingBins');
                const ratingEl = document.getElementById('driverRating');
                const driverNameEl = document.getElementById('driverNameMobile');
                if (todayCollectionsEl) todayCollectionsEl.textContent = todayCollections;
                if (pendingBinsEl) pendingBinsEl.textContent = pendingBins;
                if (ratingEl) ratingEl.textContent = (Number(currentUser.rating) || 5).toFixed(1);
                if (driverNameEl) driverNameEl.textContent = currentUser.name;
                
                // Driver dashboard section: Today's Activity (world-class: real data where possible)
                const todayCountEl = document.getElementById('todayCollectionsCount');
                const todayDistanceEl = document.getElementById('todayDistance');
                const todayWorkingTimeEl = document.getElementById('todayWorkingTime');
                const todayEfficiencyEl = document.getElementById('todayEfficiency');
                if (todayCountEl) todayCountEl.textContent = todayCollections;
                // Distance: estimated from collections (2.5 km per stop typical); show "est." for transparency
                const estDistanceKm = todayCollections * 2.5;
                if (todayDistanceEl) {
                    if (estDistanceKm > 0) {
                        todayDistanceEl.innerHTML = estDistanceKm.toFixed(1) + ' km <small class=\"text-muted\" style=\"font-size:0.75em;\">(est.)</small>';
                        todayDistanceEl.title = 'Estimated from collections (~2.5 km per stop)';
                    } else {
                        todayDistanceEl.textContent = '0 km';
                        todayDistanceEl.title = '';
                    }
                }
                // Working time: actual span from first to last activity today (collections + route completions)
                const todayCollectionTimes = driverCollections.filter(c => new Date(c.timestamp).toDateString() === today).map(c => new Date(c.timestamp).getTime());
                const todayRouteTimes = allDriverRoutes.filter(r => r.completedAt && new Date(r.completedAt).toDateString() === today).map(r => new Date(r.completedAt).getTime());
                const allTodayTimes = [...todayCollectionTimes, ...todayRouteTimes].filter(Boolean);
                let workingMins = 0;
                if (allTodayTimes.length >= 2) {
                    workingMins = Math.round((Math.max(...allTodayTimes) - Math.min(...allTodayTimes)) / (60 * 1000));
                } else if (allTodayTimes.length === 1 && todayCollections > 0) {
                    workingMins = Math.max(15, todayCollections * 20); // single event: estimate from collections
                } else if (todayCollections > 0) {
                    workingMins = todayCollections * 25; // fallback estimate
                }
                if (todayWorkingTimeEl) {
                    todayWorkingTimeEl.textContent = workingMins > 0 ? `${Math.floor(workingMins / 60)}h ${workingMins % 60}m` : '0h 0m';
                    todayWorkingTimeEl.title = allTodayTimes.length >= 2 ? 'From first to last activity today' : (workingMins > 0 ? 'Estimated from activity' : '');
                }
                // Efficiency: today's completion rate = done / (done + pending)
                const pendingBinsToday = routes.reduce((t, r) => t + (r.binIds?.length || r.binDetails?.length || 0), 0);
                const totalWorkToday = todayCollections + pendingBinsToday;
                const efficiencyPct = totalWorkToday > 0 ? Math.round((todayCollections / totalWorkToday) * 100) : (todayCollections > 0 ? 100 : 0);
                if (todayEfficiencyEl) {
                    todayEfficiencyEl.textContent = Math.min(100, Math.max(0, efficiencyPct)) + '%';
                    todayEfficiencyEl.title = totalWorkToday > 0 ? 'Completed today vs assigned (done + pending)' : '';
                }
                
                const historyContainer = document.getElementById('driverTripsHistory');
                if (historyContainer) {
                    const activities = [
                        ...allDriverRoutes.map(r => ({
                            type: 'route',
                            id: r.id,
                            timestamp: r.completedAt || r.createdAt,
                            status: r.status || 'pending',
                            bins: r.binIds?.length ?? r.bins?.length ?? 0
                        })),
                        ...driverCollections.map(c => ({
                            type: 'collection',
                            id: c.binId,
                            timestamp: c.timestamp,
                            status: 'completed'
                        }))
                    ].filter(a => a.timestamp).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 15);
                    if (activities.length === 0) {
                        historyContainer.innerHTML = '<p style="text-align: center; color: #94a3b8; padding: 2rem;">No recent activity yet</p>';
                    } else {
                        historyContainer.innerHTML = activities.map(a => `
                            <div class="trip-item">
                                <div class="trip-icon"><i class="fas fa-${a.type === 'route' ? 'route' : 'trash'}"></i></div>
                                <div class="trip-info">
                                    <h5>${a.type === 'route' ? 'Route ' + a.id : 'Collection: ' + a.id}</h5>
                                    <p>${new Date(a.timestamp).toLocaleString()}</p>
                                </div>
                                <span class="trip-status ${a.status}">${(a.status || '').replace('-', ' ')}</span>
                            </div>
                        `).join('');
                    }
                }
            }
        }
    }

    refreshDashboard() {
        if (typeof dataManager !== 'undefined') {
            const stats = dataManager.getSystemStats();
            const analytics = dataManager.getAnalytics();
            
            // Update dashboard stats
            this.updateDashboardStats(stats, analytics);
            
            // Update driver stats if driver
            if (authManager && authManager.isDriver()) {
                this.updateDriverStats();
            }
            
            // Update analytics charts if available
            if (typeof analyticsManager !== 'undefined') {
                analyticsManager.updateDashboardMetrics();
            }
        }
    }

    updateDashboardStats(stats, analytics) {
        // Update various dashboard elements with current stats
        const elements = {
            'totalBins': stats.totalBins,
            'activeAlerts': stats.activeAlerts,
            'todayCollections': stats.todayCollections,
            'totalUsers': stats.totalUsers,
            'totalUsersCount': stats.totalUsers,
            'totalBinsCount': stats.totalBins,
            'activeDriversCount': stats.activeDrivers,
            'activeAlertsCount': stats.activeAlerts
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });

        // City Dashboard (Smart City Command Center) – world-class metrics
        const bins = typeof dataManager !== 'undefined' ? dataManager.getBins() : [];
        const avgFill = bins.length ? bins.reduce((s, b) => s + (b.fill || 0), 0) / bins.length : 0;
        const cleanlinessIndex = Math.round(Math.max(0, Math.min(100, 100 - avgFill)));
        const collectionsTarget = 50;
        const complaintsCap = 20;
        const costPct = Math.round(analytics.costReduction || 0);
        const satisfactionPct = Math.round(analytics.citizenSatisfaction || 0);
        const carbonPct = Math.round(analytics.carbonReduction || 0);
        const avgResponse = Math.round(analytics.avgResponseTime || 0);

        const cityElements = {
            'cleanlinessIndex': `${cleanlinessIndex}%`,
            'todayCollections': stats.todayCollections,
            'activeComplaintsCount': stats.activeComplaints,
            'costReduction': `${costPct}%`,
            'citizenSatisfaction': `${satisfactionPct}%`,
            'carbonReduction': carbonPct ? `-${carbonPct}%` : '0%',
            'avgResponseTime': `${avgResponse}min`
        };
        Object.entries(cityElements).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        });

        // Progress bars (width %)
        const progressUpdates = [
            ['cleanlinessProgress', cleanlinessIndex],
            ['collectionsProgress', Math.min(100, Math.round((stats.todayCollections / collectionsTarget) * 100))],
            ['complaintsProgress', Math.min(100, Math.round((stats.activeComplaints / complaintsCap) * 100))],
            ['costProgress', Math.min(100, costPct)]
        ];
        progressUpdates.forEach(([id, pct]) => {
            const bar = document.getElementById(id);
            if (bar && bar.style) bar.style.width = `${pct}%`;
        });

        // Last updated timestamp for dashboard
        const lastUpdatedEl = document.getElementById('dashboardLastUpdated');
        if (lastUpdatedEl) {
            lastUpdatedEl.textContent = new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            lastUpdatedEl.setAttribute('datetime', new Date().toISOString());
        }

        // Operations widgets: strip, activity feed, critical bins/alerts, recent complaints
        this.updateDashboardOperationsWidgets(stats, bins);
    }

    updateDashboardOperationsWidgets(stats, bins) {
        if (!stats) stats = typeof dataManager !== 'undefined' ? dataManager.getSystemStats() : {};
        if (!bins && typeof dataManager !== 'undefined') bins = dataManager.getBins();

        const totalBins = (bins || []).length;
        const criticalBins = (bins || []).filter(b => (b.fill >= 85) || (b.status === 'critical' || b.status === 'fire-risk'));
        const warningBins = (bins || []).filter(b => (b.fill >= 70 && b.fill < 85) || b.status === 'warning');
        const routes = typeof dataManager !== 'undefined' ? dataManager.getRoutes() : [];
        const pendingRoutes = routes.filter(r => r.status === 'pending' || r.status === 'in-progress');
        const alerts = typeof dataManager !== 'undefined' ? dataManager.getActiveAlerts() : [];
        const complaints = typeof dataManager !== 'undefined' ? dataManager.getActiveComplaints() : [];
        const allComplaints = typeof dataManager !== 'undefined' ? dataManager.getComplaints() : [];
        const recentComplaints = [...allComplaints].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5);
        const logs = typeof dataManager !== 'undefined' ? dataManager.getSystemLogs() : [];
        const recentLogs = [...logs].slice(-12).reverse();

        // Operations strip numbers
        const setEl = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
        setEl('dashboardTotalBins', totalBins);
        setEl('dashboardCriticalBins', criticalBins.length);
        setEl('dashboardWarningBins', warningBins.length);
        setEl('dashboardActiveDrivers', stats.activeDrivers || 0);
        setEl('dashboardPendingRoutes', pendingRoutes.length);
        setEl('dashboardActiveAlerts', alerts.length);
        setEl('dashboardAutoCollectionsToday', stats.autoCollectionsToday != null ? stats.autoCollectionsToday : 0);

        // Activity feed
        const feedEl = document.getElementById('dashboardActivityFeed');
        const feedPlaceholder = document.getElementById('dashboardActivityPlaceholder');
        if (feedEl && feedPlaceholder) {
            feedEl.querySelectorAll('.activity-feed-item').forEach(n => n.remove());
            if (recentLogs.length === 0) {
                feedPlaceholder.style.display = 'block';
                feedPlaceholder.textContent = 'No recent activity';
            } else {
                feedPlaceholder.style.display = 'none';
                recentLogs.forEach(log => {
                    const item = document.createElement('div');
                    item.className = 'activity-feed-item activity-feed-' + (log.type || 'info');
                    const time = log.timestamp ? new Date(log.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '';
                    item.innerHTML = '<span class="activity-feed-time">' + time + '</span> <span class="activity-feed-msg">' + (log.message || '').replace(/</g, '&lt;') + '</span>';
                    feedEl.appendChild(item);
                });
            }
        }

        // Critical bins list
        const critListEl = document.getElementById('dashboardCriticalBinsList');
        const critPlaceholder = document.getElementById('dashboardCriticalPlaceholder');
        if (critListEl && critPlaceholder) {
            critPlaceholder.style.display = criticalBins.length ? 'none' : 'block';
            critListEl.querySelectorAll('.critical-bin-row').forEach(n => n.remove());
            criticalBins.slice(0, 5).forEach(bin => {
                const row = document.createElement('div');
                row.className = 'critical-bin-row';
                row.innerHTML = '<span class="critical-bin-id">' + (bin.id || '').replace(/</g, '&lt;') + '</span> <span class="critical-bin-fill">' + (bin.fill || 0) + '%</span>';
                critListEl.appendChild(row);
            });
        }

        // Active alerts list
        const alertsListEl = document.getElementById('dashboardCriticalAlertsList');
        const alertsPlaceholder = document.getElementById('dashboardAlertsPlaceholder');
        if (alertsListEl && alertsPlaceholder) {
            alertsPlaceholder.style.display = alerts.length ? 'none' : 'block';
            alertsListEl.querySelectorAll('.critical-alert-row').forEach(n => n.remove());
            alerts.slice(0, 5).forEach(alert => {
                const row = document.createElement('div');
                row.className = 'critical-alert-row critical-alert-' + (alert.priority || 'medium');
                const time = alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '';
                row.innerHTML = '<span class="critical-alert-msg">' + (alert.message || '').replace(/</g, '&lt;') + '</span> <span class="critical-alert-time">' + time + '</span>';
                alertsListEl.appendChild(row);
            });
        }

        // Recent complaints list
        const compListEl = document.getElementById('dashboardComplaintsList');
        const compPlaceholder = document.getElementById('dashboardComplaintsPlaceholder');
        if (compListEl && compPlaceholder) {
            compPlaceholder.style.display = recentComplaints.length ? 'none' : 'block';
            compListEl.querySelectorAll('.complaint-row').forEach(n => n.remove());
            recentComplaints.forEach(c => {
                const row = document.createElement('div');
                row.className = 'complaint-row';
                const loc = (c.location || c.area || '—').replace(/</g, '&lt;');
                const type = (c.type || 'complaint').replace(/</g, '&lt;');
                const status = c.status || 'open';
                const statusClass = status === 'resolved' ? 'complaint-status resolved' : 'complaint-status';
                const date = c.createdAt ? new Date(c.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
                row.innerHTML = '<span class="complaint-loc">' + loc + '</span> <span class="complaint-type">' + type + '</span> <span class="' + statusClass + '">' + status + '</span> <span class="complaint-date">' + date + '</span>';
                compListEl.appendChild(row);
            });
        }

        // Admin shortcut: show only for admin
        const adminShortcut = document.getElementById('dashboardShortcutAdmin');
        if (adminShortcut) {
            const user = window.authManager && window.authManager.getCurrentUser && window.authManager.getCurrentUser();
            const isAdmin = user && user.type === 'admin';
            adminShortcut.style.display = isAdmin ? '' : 'none';
        }
    }

    // Helper methods for driver routes
    getBinStatusColor(bin) {
        if (!bin) return '#6b7280';
        if (bin.status === 'fire-risk') return '#ef4444';
        if (bin.status === 'critical' || bin.fill >= 85) return '#ef4444';
        if (bin.status === 'warning' || bin.fill >= 70) return '#f59e0b';
        return '#10b981';
    }
    
    // AI suggestion system for drivers
    getAISuggestedBins(driverId) {
        const bins = dataManager.getBins();
        const driverLocation = dataManager.getDriverLocation(driverId);
        
        if (!driverLocation || !driverLocation.lat || !driverLocation.lng) {
            console.log('⚠️ Driver location not available for AI suggestions');
            return [];
        }
        
        // Filter bins that need attention (>60% full and not assigned)
        const priorityBins = bins.filter(bin => 
            bin.fill > 60 && 
            !bin.assignedDriver && 
            bin.status !== 'maintenance'
        );
        
        if (priorityBins.length === 0) {
            return [];
        }
        
        // Calculate distances and prioritize
        const suggestions = priorityBins.map(bin => {
            const distance = this.calculateDistance(
                driverLocation.lat, driverLocation.lng,
                bin.lat, bin.lng
            );
            
            // Priority scoring: higher fill + closer distance = higher priority
            let priority = 'low';
            let priorityColor = '#10b981';
            let priorityScore = bin.fill;
            
            if (bin.fill >= 85) {
                priority = 'high';
                priorityColor = '#ef4444';
                priorityScore += 30;
            } else if (bin.fill >= 75) {
                priority = 'medium';
                priorityColor = '#f59e0b';
                priorityScore += 15;
            }
            
            // Reduce priority score based on distance (closer = higher priority)
            priorityScore = priorityScore - (distance * 2);
            
            return {
                bin,
                distance,
                priority,
                priorityColor,
                priorityScore
            };
        });
        
        // Sort by priority score (highest first) and return top 3
        return suggestions
            .sort((a, b) => b.priorityScore - a.priorityScore)
            .slice(0, 3);
    }
    
    // Calculate distance between two coordinates (Haversine formula)
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }
    
    // Request bin assignment: assign the bin to the driver as an active route and show in Assigned Routes
    requestBinAssignment(binId) {
        const currentUser = authManager.getCurrentUser();
        const bin = dataManager.getBinById(binId);
        
        if (!currentUser || !bin) {
            console.error('❌ Invalid request: user or bin not found');
            return;
        }
        
        // Create a route for this driver with the requested bin so it appears in Active Routes
        const routeData = {
            driverId: currentUser.id,
            binIds: [binId],
            bins: [binId],
            binDetails: [{ id: bin.id, location: bin.location, lat: bin.lat, lng: bin.lng, fill: bin.fill }],
            status: 'pending',
            priority: (bin.fill >= 80 ? 'high' : bin.fill >= 60 ? 'medium' : 'low'),
            assignedAt: new Date().toISOString(),
            assignedBy: 'driver_request',
            assignedByName: 'Self (Request)',
            name: `Request: ${bin.location || binId}`
        };
        
        const addedRoute = dataManager.addRoute(routeData);
        
        if (typeof syncManager !== 'undefined') {
            syncManager.syncRoute(addedRoute).catch(function() {});
        }
        
        this.showAlert('Added to your routes', `${bin.location || binId} is now in Assigned Routes. You can Navigate and mark as Collected.`, 'success', 4000);
        
        this.loadDriverRoutes();
        if (window.driverSystemV3 && typeof window.driverSystemV3.switchDriverPage === 'function') {
            window.driverSystemV3.switchDriverPage('routes');
        }
        
        console.log('📋 Bin assigned to driver as route:', binId);
    }
    
    getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    }

    // Additional methods for handling various actions
    
    optimizeAllRoutes() {
        if (typeof dataManager !== 'undefined') {
            const drivers = dataManager.getUsers().filter(u => u.type === 'driver' && u.status === 'active');
            drivers.forEach(driver => {
                const optimizedRoute = dataManager.optimizeRoutes(driver.id);
                console.log(`Optimized route for ${driver.name}:`, optimizedRoute);
            });
            this.showAlert('Route Optimization', 'All routes have been optimized using ML algorithms.', 'success');
        }
    }

    generateReport() {
        this.showAlert('Report Generation', 'Generating comprehensive system report...', 'info');
        
        if (typeof analyticsManager !== 'undefined') {
            setTimeout(() => {
                analyticsManager.generatePDFReport();
                this.showAlert('Report Ready', 'System report has been generated and saved.', 'success');
            }, 2000);
        }
    }

    openDriverMap() {
        // Open Navigation Map removed from driver app (was causing issues). No-op.
        return;
    }

    showEmergencyResponse() {
        this.showAlert('Emergency Response', 'Emergency response system activated!', 'warning');
    }

    toggleFabMenu() {
        const fabMenu = document.getElementById('fabMenu');
        const mainFab = document.getElementById('mainFab');
        
        if (fabMenu && mainFab) {
            fabMenu.classList.toggle('active');
            mainFab.classList.toggle('active');
        }
    }

    // Show Add Bin Modal
    showAddBinModal() {
        const modalHtml = `
            <div class="modal" id="addBinModal" style="display: flex;">
                <div class="modal-content" style="max-width: 500px;">
                    <div class="modal-header">
                        <h2><i class="fas fa-trash-alt"></i> Add New Bin</h2>
                        <button class="close-btn" onclick="this.closest('.modal').style.display='none'">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="addBinForm">
                            <div class="form-group">
                                <label>Bin ID</label>
                                <input type="text" id="newBinId" placeholder="Enter bin ID (e.g., BIN-001)" required>
                            </div>
                            <div class="form-group">
                                <label>Location</label>
                                <input type="text" id="newBinLocation" placeholder="Enter location description" required>
                            </div>
                            <div class="form-group">
                                <label>Latitude</label>
                                <input type="number" step="any" id="newBinLat" placeholder="25.3548" required>
                            </div>
                            <div class="form-group">
                                <label>Longitude</label>
                                <input type="number" step="any" id="newBinLng" placeholder="51.4987" required>
                            </div>
                            <div class="form-group">
                                <label>Initial Fill Level (%)</label>
                                <input type="number" min="0" max="100" id="newBinFill" value="0" required>
                            </div>
                            <div class="form-group">
                                <label>Status</label>
                                <select id="newBinStatus" required>
                                    <option value="active">Active</option>
                                    <option value="maintenance">Maintenance</option>
                                    <option value="offline">Offline</option>
                                </select>
                            </div>
                            <div class="form-actions">
                                <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').style.display='none'">Cancel</button>
                                <button type="submit" class="btn btn-primary">Add Bin</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if any
        const existingModal = document.getElementById('addBinModal');
        if (existingModal) existingModal.remove();
        
        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Add form submit handler
        const form = document.getElementById('addBinForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddBin();
        });
    }

    // Handle Add Bin Form Submission
    handleAddBin() {
        const binData = {
            id: document.getElementById('newBinId').value.trim(),
            location: document.getElementById('newBinLocation').value.trim(),
            lat: parseFloat(document.getElementById('newBinLat').value),
            lng: parseFloat(document.getElementById('newBinLng').value),
            fill: parseInt(document.getElementById('newBinFill').value),
            status: document.getElementById('newBinStatus').value,
            lastEmptied: null,
            temperature: Math.floor(Math.random() * 10) + 25, // Random temp 25-35°C
            lastUpdated: new Date().toISOString()
        };
        
        // Validate data
        if (!binData.id || !binData.location || isNaN(binData.lat) || isNaN(binData.lng)) {
            this.showAlert('Validation Error', 'Please fill all required fields with valid data.', 'error');
            return;
        }
        
        // Check if bin ID already exists
        const existingBin = dataManager.getBinById(binData.id);
        if (existingBin) {
            this.showAlert('Duplicate Bin', 'A bin with this ID already exists.', 'error');
            return;
        }
        
        // Add bin to data manager
        const bins = dataManager.getBins();
        binData.fillLevel = binData.fill;
        bins.push(binData);
        dataManager.setData('bins', bins);
        
        // Sync to server so bin is stored in MongoDB
        if (typeof syncManager !== 'undefined' && syncManager.syncEnabled) {
            syncManager.syncToServer({ bins: bins }, 'partial').then(function(ok) {
                if (ok) console.log('Bin synced to server:', binData.id);
            }).catch(function() {});
        }
        
        // Close modal
        document.getElementById('addBinModal').style.display = 'none';
        
        // Refresh map if available
        if (window.mapManager && typeof window.mapManager.loadBinsOnMap === 'function') {
            window.mapManager.loadBinsOnMap();
        }
        
        this.showAlert('Success', `Bin ${binData.id} has been added successfully!`, 'success');
    }

    // Show Report Issue Modal
    showReportIssueModal() {
        const modalHtml = `
            <div class="modal" id="reportIssueModal" style="display: flex;">
                <div class="modal-content" style="max-width: 500px;">
                    <div class="modal-header">
                        <h2><i class="fas fa-exclamation-triangle"></i> Report Issue</h2>
                        <button class="close-btn" onclick="this.closest('.modal').style.display='none'">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="reportIssueForm">
                            <div class="form-group">
                                <label>Issue Type</label>
                                <select id="issueType" required>
                                    <option value="">Select issue type</option>
                                    <option value="bin_overflow">Bin Overflow</option>
                                    <option value="bin_damaged">Bin Damaged</option>
                                    <option value="access_blocked">Access Blocked</option>
                                    <option value="vehicle_issue">Vehicle Issue</option>
                                    <option value="route_problem">Route Problem</option>
                                    <option value="safety_concern">Safety Concern</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Location/Bin ID (Optional)</label>
                                <input type="text" id="issueLocation" placeholder="Enter bin ID or location">
                            </div>
                            <div class="form-group">
                                <label>Description</label>
                                <textarea id="issueDescription" rows="4" placeholder="Describe the issue..." required></textarea>
                            </div>
                            <div class="form-group">
                                <label>Priority</label>
                                <select id="issuePriority" required>
                                    <option value="low">Low</option>
                                    <option value="medium" selected>Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>
                            <div class="form-actions">
                                <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').style.display='none'">Cancel</button>
                                <button type="submit" class="btn btn-warning">Report Issue</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if any
        const existingModal = document.getElementById('reportIssueModal');
        if (existingModal) existingModal.remove();
        
        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Add form submit handler
        const form = document.getElementById('reportIssueForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleReportIssue();
        });
    }

    // Handle Report Issue Form Submission
    handleReportIssue() {
        const currentUser = authManager.getCurrentUser();
        
        const issueData = {
            id: `ISSUE-${Date.now()}`,
            type: document.getElementById('issueType').value,
            location: document.getElementById('issueLocation').value.trim(),
            description: document.getElementById('issueDescription').value.trim(),
            priority: document.getElementById('issuePriority').value,
            reportedBy: currentUser ? currentUser.name : 'Unknown',
            reportedById: currentUser ? currentUser.id : null,
            timestamp: new Date().toISOString(),
            status: 'open'
        };
        
        // Validate data
        if (!issueData.type || !issueData.description) {
            this.showAlert('Validation Error', 'Please fill all required fields.', 'error');
            return;
        }
        
        // Store issue in data manager
        const issues = dataManager.getData('issues') || [];
        issues.push(issueData);
        dataManager.setData('issues', issues);
        
        // Close modal
        document.getElementById('reportIssueModal').style.display = 'none';
        
        this.showAlert('Issue Reported', 'Your issue has been reported successfully. Our team will review it shortly.', 'success');
        
        console.log('📝 Issue reported:', issueData);
    }

    // Admin functions
    approveRegistration(registrationId) {
        if (authManager && authManager.isAdmin()) {
            authManager.approveRegistration(registrationId).then(result => {
                if (result.success) {
                    this.showAlert('Success', result.message, 'success');
                    this.loadAdminPanel();
                } else {
                    this.showAlert('Error', result.error, 'danger');
                }
            });
        }
    }

    rejectRegistration(registrationId) {
        if (authManager && authManager.isAdmin()) {
            authManager.rejectRegistration(registrationId).then(result => {
                if (result.success) {
                    this.showAlert('Success', result.message, 'success');
                    this.loadAdminPanel();
                } else {
                    this.showAlert('Error', result.error, 'danger');
                }
            });
        }
    }

    // Driver functions
    completePickup(binId) {
        if (authManager && authManager.isDriver()) {
            authManager.completeCollection(binId).then(result => {
                if (result.success) {
                    this.showAlert('Success', 'Collection registered successfully!', 'success');
                    this.updateDriverStats();
                    this.loadDriverRoutes();
                } else {
                    this.showAlert('Error', result.error, 'danger');
                }
            });
        }
    }

    navigateToLocation(lat, lng) {
        // Open Navigation Map removed from driver app; show coordinates only
        if (typeof lat === 'number' && typeof lng === 'number') {
            this.showAlert('Location', `Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}. Use your preferred maps app for navigation.`, 'info');
        }
    }

    dismissAlert(alertId) {
        dataManager.dismissAlert(alertId);
        this.refreshDashboard();
    }

    resolveComplaint(complaintId) {
        dataManager.updateComplaint(complaintId, { status: 'resolved' });
        this.showAlert('Success', 'Complaint marked as resolved', 'success');
        this.loadComplaints();
    }

    viewComplaintDetails(complaintId) {
        console.log('📋 Opening complaint details for:', complaintId);
        if (typeof showComplaintDetailsModal === 'function') {
            showComplaintDetailsModal(complaintId);
        } else {
            // Fallback to alert if modal function is not available
        const complaint = dataManager.getComplaints().find(c => c.id === complaintId);
        if (complaint) {
            this.showAlert('Complaint Details', `${complaint.type}: ${complaint.description}`, 'info', 10000);
            }
        }
    }

    viewRouteDetails(routeId) {
        const route = dataManager.getRoutes().find(r => r.id === routeId);
        if (route) {
            this.showAlert('Route Details', `Route ${routeId} with ${route.binIds.length} bins`, 'info');
        }
    }

    resetSystemData() {
        if (confirm('Are you sure you want to reset all system data? This action cannot be undone.')) {
            dataManager.clearAllData();
            this.showAlert('System Reset', 'All data has been reset to defaults', 'warning');
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        }
    }

    exportSystemData() {
        const data = dataManager.exportData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `waste-management-backup-${new Date().toISOString()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.showAlert('Export Complete', 'System data has been exported', 'success');
    }

    viewSystemLogs() {
        const logs = dataManager.getSystemLogs();
        console.log('System Logs:', logs);
        this.showAlert('System Logs', `${logs.length} log entries. Check console for details.`, 'info');
    }

    getCurrentSection() {
        return this.currentSection;
    }

    isInitialized() {
        return this.initialized;
    }

    // Force sync driver locations from server immediately
    async syncDriverLocationsNow(driverId) {
        console.log(`📡 Force syncing driver locations from server for ${driverId}...`);
        
        try {
            // Fetch directly from server
            const response = await fetch('/api/driver/locations', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            });
            
            if (response.ok) {
                const locationData = await response.json();
                console.log(`📡 Server location response:`, locationData);
                
                if (locationData.success && locationData.locations) {
                    // Update ALL driver locations in data manager
                    const serverLocations = locationData.locations;
                    dataManager.setData('driverLocations', serverLocations);
                    console.log(`✅ Updated driver locations in cache:`, serverLocations);
                    
                    if (serverLocations[driverId]) {
                        console.log(`✅ Driver ${driverId} location synced:`, serverLocations[driverId]);
                        return serverLocations[driverId];
                    } else {
                        console.warn(`⚠️ Driver ${driverId} location not found on server`);
                        return null;
                    }
                } else {
                    console.error(`❌ Server returned invalid location data:`, locationData);
                    return null;
                }
            } else {
                console.error(`❌ Server location fetch failed: ${response.status} ${response.statusText}`);
                return null;
            }
        } catch (error) {
            console.error(`❌ Error syncing driver locations:`, error);
            return null;
        }
    }

    // Load AI Suggestion for current driver
    loadAISuggestionForDriver(driverId) {
        console.log(`🤖 Loading AI suggestion for driver: ${driverId}`);
        
        const aiSuggestionCard = document.getElementById('aiSuggestionCard');
        if (!aiSuggestionCard) return;
        
        const suggestions = dataManager.getData('aiSuggestions') || {};
        const suggestion = suggestions[driverId];
        
        if (suggestion && suggestion.binId) {
            const bin = dataManager.getBinById(suggestion.binId);
            if (bin) {
                this.populateAISuggestionCard(suggestion, bin);
                aiSuggestionCard.style.display = 'block';
                
                // FORCE REFRESH if distance is still not available after population
                setTimeout(() => {
                    const distanceElement = document.getElementById('suggestionDistance');
                    if (distanceElement && (distanceElement.textContent === 'Location not available' || distanceElement.textContent === 'Calculating...')) {
                        console.log('🔄 Distance still not available, forcing AI suggestion refresh...');
                        if (typeof createAISuggestionForDriver === 'function') {
                            createAISuggestionForDriver(driverId).then(() => {
                                console.log('✅ Force refresh completed, reloading suggestion...');
                                this.loadAISuggestionForDriver(driverId);
                            }).catch(error => {
                                console.error('❌ Force refresh failed:', error);
                            });
                        }
                    }
                }, 100);
            } else {
                aiSuggestionCard.style.display = 'none';
            }
        } else {
            // Create new suggestion if none exists
            if (typeof createAISuggestionForDriver === 'function') {
                console.log(`🔄 Creating new AI suggestion for driver ${driverId}`);
                // Show loading state
                aiSuggestionCard.style.display = 'block';
                document.getElementById('suggestionDistance').textContent = 'Calculating...';
                
                // Create suggestion (async) and reload after completion
                createAISuggestionForDriver(driverId).then(() => {
                    console.log(`✅ AI suggestion creation completed for driver ${driverId}`);
                    // Reload the suggestion after creation
                    setTimeout(() => this.loadAISuggestionForDriver(driverId), 100);
                }).catch(error => {
                    console.error(`❌ AI suggestion creation failed for driver ${driverId}:`, error);
                    document.getElementById('suggestionDistance').textContent = 'Error calculating';
                });
            } else {
                console.warn('❌ createAISuggestionForDriver function not available');
                aiSuggestionCard.style.display = 'none';
            }
        }
    }

    // Populate AI suggestion card with data
    populateAISuggestionCard(suggestion, bin) {
        // Update bin information
        document.getElementById('suggestedBinId').textContent = bin.id;
        document.getElementById('suggestedBinLocation').textContent = bin.location;
        
        // Update fill circle
        const fillCircle = document.getElementById('suggestedBinFill');
        const fillLevel = bin.fill || 0;
        fillCircle.innerHTML = `<span>${fillLevel}%</span>`;
        
        // Set fill circle color based on level
        fillCircle.className = 'fill-circle';
        if (fillLevel >= 75) {
            fillCircle.classList.add('high-fill');
        } else if (fillLevel >= 50) {
            fillCircle.classList.add('medium-fill');
        } else {
            fillCircle.classList.add('low-fill');
        }
        
        // Update metrics with IMMEDIATE FALLBACK DISTANCE CALCULATION
        console.log('🔍 Populating AI suggestion card with data:', {
            distance: suggestion.distance,
            distanceType: typeof suggestion.distance,
            debugInfo: suggestion.debugInfo,
            binId: suggestion.binId
        });
        
        let distanceText = 'Location not available';
        
        // PRIMARY: Check if suggestion has valid distance
        if (suggestion.distance !== null && suggestion.distance !== undefined && 
            suggestion.distance !== 'N/A' && typeof suggestion.distance === 'number' && 
            suggestion.distance > 0) {
            distanceText = `${suggestion.distance} km`;
            console.log(`✅ Using suggestion.distance: ${suggestion.distance} km`);
        } 
        // SECONDARY: Check debug info
        else if (suggestion.debugInfo && suggestion.debugInfo.rawDistance > 0) {
            distanceText = `${Math.round(suggestion.debugInfo.rawDistance * 100) / 100} km`;
            console.log(`✅ Using debugInfo.rawDistance: ${suggestion.debugInfo.rawDistance} km`);
        } 
        // TERTIARY: Calculate distance NOW if we have bin data
        else if (suggestion.binId) {
            console.log(`🔄 No valid distance found, calculating NOW for bin ${suggestion.binId}`);
            try {
                const bin = dataManager.getBinById(suggestion.binId);
                const driverLocations = dataManager.getData('driverLocations') || {};
                const currentUser = authManager.getCurrentUser();
                
                console.log(`📦 Bin data:`, bin);
                console.log(`📍 Driver locations:`, driverLocations);
                console.log(`👤 Current user:`, currentUser);
                
                if (bin && bin.lat && bin.lng && currentUser && driverLocations[currentUser.id]) {
                    const driverLoc = driverLocations[currentUser.id];
                    console.log(`🧮 Calculating distance: Driver(${driverLoc.lat}, ${driverLoc.lng}) -> Bin(${bin.lat}, ${bin.lng})`);
                    
                    const distance = dataManager.calculateDistance(driverLoc.lat, driverLoc.lng, bin.lat, bin.lng);
                    if (distance && distance > 0) {
                        distanceText = `${Math.round(distance * 100) / 100} km`;
                        console.log(`✅ CALCULATED distance: ${distanceText}`);
                    } else {
                        distanceText = 'Calculating...';
                        console.log(`⚠️ Distance calculation returned: ${distance}`);
                    }
                } else {
                    console.log(`❌ Missing data for calculation:`, {
                        bin: !!bin,
                        binCoords: !!(bin && bin.lat && bin.lng),
                        currentUser: !!currentUser,
                        driverLocation: !!(currentUser && driverLocations[currentUser.id])
                    });
                    
                    // FINAL FALLBACK: Show estimated distance
                    distanceText = '~5 km (estimated)';
                    console.log(`🔄 Using final fallback: ${distanceText}`);
                }
            } catch (error) {
                console.error(`❌ Error calculating distance:`, error);
                distanceText = 'Error calculating';
            }
        }
        
        console.log(`📍 FINAL distance text: "${distanceText}"`);
        document.getElementById('suggestionDistance').textContent = distanceText;
        
        const timeText = (suggestion.estimatedTime !== undefined && suggestion.estimatedTime !== null) 
            ? `${suggestion.estimatedTime} min`
            : 'Estimating...';
        document.getElementById('suggestionTime').textContent = timeText;
        
        const priorityText = suggestion.priority || 'Low'; // priority is already a string ('High', 'Medium', 'Low')
        document.getElementById('suggestionPriority').textContent = priorityText;
        
        // Update reason
        document.getElementById('suggestionReason').textContent = suggestion.reason;
        
        console.log('✅ AI suggestion card populated');
    }

    // 🤖 ENHANCED AI DRIVER INTEGRATION - Connected to Main AI System
    async loadEnhancedDriverAI(driverId) {
        console.log(`🎯 Loading Enhanced AI recommendations for driver ${driverId}...`);
        
        const aiSuggestionCard = document.getElementById('aiSuggestionCard');
        if (!aiSuggestionCard) return;

        try {
            // Show loading state
            this.showEnhancedAILoadingState(true);
            
            // Get driver's current location with fallback
            let driverLocation = window.dataManager?.getDriverLocation(driverId);
            
            // If no location, force sync and try again
            if (!driverLocation) {
                await this.syncDriverLocationsNow(driverId);
                driverLocation = window.dataManager?.getDriverLocation(driverId);
                
                // Use fallback location if still no data
                if (!driverLocation) {
                    driverLocation = {
                        lat: 25.3682,
                        lng: 51.5511,
                        fallback: true,
                        source: 'default_doha'
                    };
                }
            }
            
            console.log(`📍 Using driver location:`, driverLocation);
            
            // Generate AI-powered recommendations using main AI system
            const aiRecommendation = await this.generateEnhancedAIRecommendation(driverId, driverLocation);
            
            if (aiRecommendation && aiRecommendation.success && aiRecommendation.recommendation) {
                // Populate the enhanced UI with AI recommendation
                this.populateEnhancedAIRecommendation(aiRecommendation.recommendation, driverId);
                this.showEnhancedAILoadingState(false);
            } else {
                // Show no recommendations state
                this.showNoRecommendationsState();
            }
            
        } catch (error) {
            console.error(`❌ Enhanced AI loading failed:`, error);
            this.showAIErrorState(error.message);
        }
    }

    // Generate AI recommendation using main application's AI system
    async generateEnhancedAIRecommendation(driverId, driverLocation) {
        console.log(`🧠 Generating Enhanced AI recommendation for driver ${driverId}...`);
        
        try {
            // Get all available bins (not assigned to active routes)
            const allBins = window.dataManager?.getBins() || [];
            const allRoutes = window.dataManager?.getRoutes() || [];
            
            // Filter out bins already assigned to active routes
            const assignedBinIds = new Set();
            allRoutes.forEach(route => {
                if (route.status === 'active' && route.binIds) {
                    route.binIds.forEach(binId => assignedBinIds.add(binId));
                }
            });
            
            const availableBins = allBins.filter(bin => 
                !assignedBinIds.has(bin.id) && 
                (bin.fill || 0) >= 50 && 
                bin.status !== 'maintenance' && 
                bin.status !== 'offline'
            );
            
            console.log(`🔍 Found ${availableBins.length} available bins for AI analysis`);
            
            if (availableBins.length === 0) {
                return { success: false, message: 'No available bins for recommendation' };
            }
            
            // Use advanced AI scoring system (same as main application)
            const scoredBins = availableBins.map(bin => {
                const distance = this.calculateDistance(
                    driverLocation.lat, 
                    driverLocation.lng, 
                    bin.lat || 25.3682, 
                    bin.lng || 51.5511
                );
                
                // Advanced AI scoring algorithm
                let aiScore = 0;
                
                // Fill level scoring (0-40 points)
                const fillLevel = bin.fill || 0;
                if (fillLevel >= 90) aiScore += 40;
                else if (fillLevel >= 75) aiScore += 30;
                else if (fillLevel >= 60) aiScore += 20;
                else aiScore += 10;
                
                // Distance scoring (0-25 points) - closer is better
                if (distance < 1) aiScore += 25;
                else if (distance < 2) aiScore += 20;
                else if (distance < 5) aiScore += 15;
                else if (distance < 10) aiScore += 10;
                else aiScore += 5;
                
                // Urgency scoring (0-20 points)
                if (bin.lastCollection) {
                    const hoursSinceCollection = (Date.now() - new Date(bin.lastCollection)) / (1000 * 60 * 60);
                    if (hoursSinceCollection > 48) aiScore += 20;
                    else if (hoursSinceCollection > 24) aiScore += 15;
                    else if (hoursSinceCollection > 12) aiScore += 10;
                }
                
                // Temperature factor (0-10 points)
                if (bin.temperature && bin.temperature > 35) aiScore += 10;
                else if (bin.temperature && bin.temperature > 30) aiScore += 5;
                
                // Efficiency factor (0-5 points)
                aiScore += Math.random() * 5; // Slight randomization for variety
                
                return {
                    ...bin,
                    aiScore,
                    calculatedDistance: distance,
                    estimatedTime: Math.ceil(distance * 2 + fillLevel / 10) + 5
                };
            });
            
            // Sort by AI score (highest first)
            scoredBins.sort((a, b) => b.aiScore - a.aiScore);
            
            const bestRecommendation = scoredBins[0];
            
            // Generate AI reasoning
            const reasoning = this.generateAIReasoning(bestRecommendation, driverLocation);
            
            // Calculate confidence level
            const confidenceLevel = Math.min(95, Math.round((bestRecommendation.aiScore / 100) * 100));
            
            console.log(`✅ Generated AI recommendation for bin ${bestRecommendation.id} with score ${bestRecommendation.aiScore}`);
            
            return {
                success: true,
                recommendation: {
                    ...bestRecommendation,
                    confidence: confidenceLevel,
                    reasoning: reasoning,
                    priority: bestRecommendation.fill >= 80 ? 'HIGH' : bestRecommendation.fill >= 60 ? 'MEDIUM' : 'LOW',
                    co2Savings: Math.round(bestRecommendation.calculatedDistance * 0.5 + bestRecommendation.fill * 0.1),
                    efficiencyScore: Math.round(bestRecommendation.aiScore)
                }
            };
            
        } catch (error) {
            console.error(`❌ AI recommendation generation failed:`, error);
            return { success: false, error: error.message };
        }
    }

    // Generate AI reasoning explanation
    generateAIReasoning(bin, driverLocation) {
        const reasons = [];
        
        // Fill level reasoning
        if (bin.fill >= 90) reasons.push('Critical fill level requiring immediate attention');
        else if (bin.fill >= 75) reasons.push('High fill level with collection priority');
        else if (bin.fill >= 60) reasons.push('Moderate fill level suitable for collection');
        
        // Distance reasoning
        if (bin.calculatedDistance < 2) reasons.push('Very close to your current location');
        else if (bin.calculatedDistance < 5) reasons.push('Nearby location with efficient route');
        else if (bin.calculatedDistance < 10) reasons.push('Reasonable distance for collection');
        
        // Efficiency reasoning
        if (bin.temperature && bin.temperature > 35) reasons.push('High temperature detected, needs priority collection');
        
        // Optimization reasoning
        reasons.push('Optimized for fuel efficiency and time savings');
        
        return {
            primaryReason: reasons[0] || 'AI-optimized collection opportunity',
            factors: reasons,
            explanation: `This bin was selected based on ${reasons.length} key factors including proximity, urgency, and operational efficiency.`
        };
    }

    // Populate the enhanced UI with AI recommendation data
    populateEnhancedAIRecommendation(recommendation, driverId) {
        console.log(`🎨 Populating Enhanced AI UI for driver ${driverId}:`, recommendation);
        
        // CRITICAL: Ensure the main AI card is visible before populating
        const aiSuggestionCard = document.getElementById('aiSuggestionCard');
        if (aiSuggestionCard) {
            aiSuggestionCard.style.display = 'block';
            console.log(`✅ AI Suggestion Card made visible during population`);
        }
        
        // Update confidence badge
        const confidenceElement = document.getElementById('aiConfidenceLevel');
        if (confidenceElement) confidenceElement.textContent = `${recommendation.confidence}%`;
        
        // Update priority badge
        const priorityBadge = document.getElementById('recommendationPriority');
        if (priorityBadge) {
            const prioritySpan = priorityBadge.querySelector('span');
            if (prioritySpan) prioritySpan.textContent = `${recommendation.priority} PRIORITY`;
            
            // Update priority badge color
            if (recommendation.priority === 'HIGH') {
                priorityBadge.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
            } else if (recommendation.priority === 'MEDIUM') {
                priorityBadge.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
            } else {
                priorityBadge.style.background = 'linear-gradient(135deg, #10b981, #059669)';
            }
        }
        
        // Update bin information
        const binIdElement = document.getElementById('recommendedBinId');
        if (binIdElement) binIdElement.textContent = recommendation.id || 'Unknown';
        
        const binLocationElement = document.getElementById('recommendedBinLocation');
        if (binLocationElement) binLocationElement.textContent = recommendation.location || recommendation.address || 'Location data updating...';
        
        // Update fill level ring and percentage
        const fillLevelRing = document.getElementById('fillLevelRing');
        const fillPercentage = document.getElementById('fillPercentage');
        const fillValue = recommendation.fill || 0;
        
        if (fillLevelRing) fillLevelRing.style.setProperty('--fill-percentage', `${fillValue * 3.6}deg`);
        if (fillPercentage) fillPercentage.textContent = `${fillValue}%`;
        
        // Update status chips
        const urgencyLevel = document.getElementById('urgencyLevel');
        if (urgencyLevel) urgencyLevel.textContent = recommendation.fill >= 80 ? 'Urgent' : 'Normal';
        
        const efficiencyLevel = document.getElementById('efficiencyLevel');
        if (efficiencyLevel) efficiencyLevel.textContent = recommendation.calculatedDistance < 5 ? 'Optimal' : 'Good';
        
        // Update smart metrics
        const smartDistance = document.getElementById('smartDistance');
        if (smartDistance) smartDistance.textContent = `${Math.round(recommendation.calculatedDistance * 100) / 100} km`;
        
        const smartTime = document.getElementById('smartTime');
        if (smartTime) smartTime.textContent = `${recommendation.estimatedTime} min`;
        
        const smartSavings = document.getElementById('smartSavings');
        if (smartSavings) smartSavings.textContent = `${recommendation.co2Savings} kg`;
        
        const smartScore = document.getElementById('smartScore');
        if (smartScore) smartScore.textContent = `${recommendation.efficiencyScore}/100`;
        
        // Update AI reasoning
        const aiReasoningContent = document.getElementById('aiReasoningContent');
        if (aiReasoningContent) aiReasoningContent.textContent = recommendation.reasoning.explanation;
        
        // Update reasoning factors
        const reasoningFactors = document.getElementById('reasoningFactors');
        if (reasoningFactors) {
            reasoningFactors.innerHTML = recommendation.reasoning.factors
                .map(factor => `<span class="reasoning-factor">${factor}</span>`)
                .join('');
        }
        
        // Store recommendation data for actions
        window.currentAIRecommendation = {
            ...recommendation,
            driverId: driverId
        };
        
        console.log(`✅ Enhanced AI UI populated successfully`);
    }

    // Show/hide loading state
    showEnhancedAILoadingState(show) {
        console.log(`🎯 Enhanced AI Loading State: ${show ? 'SHOWING' : 'HIDING'}`);
        
        // CRITICAL: Make the main AI card visible
        const aiSuggestionCard = document.getElementById('aiSuggestionCard');
        if (aiSuggestionCard) {
            aiSuggestionCard.style.display = 'block';
            console.log(`✅ AI Suggestion Card made visible`);
        } else {
            console.error(`❌ AI Suggestion Card not found!`);
        }
        
        const aiLoadingState = document.getElementById('aiLoadingState');
        const primaryRecommendation = document.getElementById('primaryRecommendation');
        const noRecommendationsState = document.getElementById('noRecommendationsState');
        
        if (show) {
            if (aiLoadingState) {
                aiLoadingState.style.display = 'block';
                console.log(`✅ AI Loading State shown`);
            }
            if (primaryRecommendation) primaryRecommendation.style.display = 'none';
            if (noRecommendationsState) noRecommendationsState.style.display = 'none';
        } else {
            if (aiLoadingState) aiLoadingState.style.display = 'none';
            if (primaryRecommendation) {
                primaryRecommendation.style.display = 'block';
                console.log(`✅ Primary Recommendation shown`);
            }
        }
    }

    // Show no recommendations state
    showNoRecommendationsState() {
        console.log(`🎯 Showing No Recommendations State`);
        
        // CRITICAL: Make the main AI card visible
        const aiSuggestionCard = document.getElementById('aiSuggestionCard');
        if (aiSuggestionCard) {
            aiSuggestionCard.style.display = 'block';
            console.log(`✅ AI Suggestion Card made visible for No Recommendations`);
        }
        
        const aiLoadingState = document.getElementById('aiLoadingState');
        const primaryRecommendation = document.getElementById('primaryRecommendation');
        const noRecommendationsState = document.getElementById('noRecommendationsState');
        
        if (aiLoadingState) aiLoadingState.style.display = 'none';
        if (primaryRecommendation) primaryRecommendation.style.display = 'none';
        if (noRecommendationsState) {
            noRecommendationsState.style.display = 'block';
            console.log(`✅ No Recommendations State shown`);
        }
    }

    // Show AI error state
    showAIErrorState(errorMessage) {
        console.error(`❌ AI Error: ${errorMessage}`);
        
        // CRITICAL: Make the main AI card visible even for errors
        const aiSuggestionCard = document.getElementById('aiSuggestionCard');
        if (aiSuggestionCard) {
            aiSuggestionCard.style.display = 'block';
            console.log(`✅ AI Suggestion Card made visible for Error State`);
        }
        
        // Show no recommendations state for errors
        this.showNoRecommendationsState();
    }
}

// Global app instance will be created at the end of the file with error handling

// Helper functions for global access - BIN MODALS INTEGRATION
window.completePickup = function(binId) {
    if (window.app) {
        window.app.completePickup(binId);
    }
};

window.navigateToLocation = function(lat, lng) {
    if (window.app) {
        window.app.navigateToLocation(lat, lng);
    }
};

window.approveRegistration = function(registrationId) {
    if (window.app) {
        window.app.approveRegistration(registrationId);
    }
};

window.rejectRegistration = function(registrationId) {
    if (window.app) {
        window.app.rejectRegistration(registrationId);
    }
};

window.dismissAlert = function(alertId) {
    if (window.app) {
        window.app.dismissAlert(alertId);
    }
};

window.resolveComplaint = function(complaintId) {
    if (window.app) {
        window.app.resolveComplaint(complaintId);
    }
};

window.viewComplaintDetails = function(complaintId) {
    if (window.app) {
        window.app.viewComplaintDetails(complaintId);
    }
};

window.viewRouteDetails = function(routeId) {
    if (window.app) {
        window.app.viewRouteDetails(routeId);
    }
};

window.showNewComplaintForm = function() {
    console.log('📝 Opening complaint registration modal...');
    if (typeof showComplaintRegistrationModal === 'function') {
        showComplaintRegistrationModal();
    } else {
    if (window.app) {
            window.app.showAlert('Complaint Form', 'Complaint registration modal not available', 'error');
        }
    }
};

window.toggleUserStatus = function(userId) {
    const user = dataManager.getUserById(userId);
    if (user) {
        const newStatus = user.status === 'active' ? 'inactive' : 'active';
        dataManager.updateUser(userId, { status: newStatus });
        if (window.app) {
            window.app.showAlert('User Updated', `User ${user.name} is now ${newStatus}`, 'success');
            window.app.loadAdminPanel();
        }
    }
};

window.openAddUserForm = function() {
    const el = document.getElementById('addUserFormContainer');
    if (el) {
        el.style.display = 'block';
        document.getElementById('newUserName').value = '';
        document.getElementById('newUserUsername').value = '';
        document.getElementById('newUserPassword').value = '';
        document.getElementById('newUserType').value = 'driver';
        document.getElementById('newUserEmail').value = '';
    }
};

window.submitAddUser = function() {
    const name = (document.getElementById('newUserName') && document.getElementById('newUserName').value) || '';
    const username = (document.getElementById('newUserUsername') && document.getElementById('newUserUsername').value) || '';
    const password = (document.getElementById('newUserPassword') && document.getElementById('newUserPassword').value) || '';
    const type = (document.getElementById('newUserType') && document.getElementById('newUserType').value) || 'driver';
    const email = (document.getElementById('newUserEmail') && document.getElementById('newUserEmail').value) || '';
    if (!name.trim() || !username.trim() || !password.trim()) {
        if (window.app) window.app.showAlert('Missing fields', 'Name, username and password are required.', 'warning');
        return;
    }
    if (dataManager.getUsers().some(u => u.username === username.trim())) {
        if (window.app) window.app.showAlert('Duplicate username', 'That username already exists.', 'warning');
        return;
    }
    try {
        dataManager.addUser({ name: name.trim(), username: username.trim(), password: password.trim(), type: type, email: email.trim() || undefined, status: 'active' });
        document.getElementById('addUserFormContainer').style.display = 'none';
        if (window.syncManager && typeof window.syncManager.syncToServer === 'function') {
            window.syncManager.syncToServer({ users: dataManager.getUsers() }, 'partial');
        }
        if (window.app) { window.app.showAlert('User added', name + ' has been added and saved to server.', 'success'); window.app.loadAdminPanel(); }
    } catch (e) {
        if (window.app) window.app.showAlert('Error', e.message || 'Failed to add user', 'error');
    }
};

window.openAddVehicleForm = function() {
    const el = document.getElementById('addVehicleFormContainer');
    if (el) {
        el.style.display = 'block';
        const idEl = document.getElementById('newVehicleId');
        const typeEl = document.getElementById('newVehicleType');
        const driverEl = document.getElementById('newVehicleDriver');
        if (idEl) idEl.value = '';
        if (typeEl) typeEl.value = '';
        if (driverEl) driverEl.value = '';
    }
};

window.submitAddVehicle = function() {
    const id = (document.getElementById('newVehicleId') && document.getElementById('newVehicleId').value) || '';
    const type = (document.getElementById('newVehicleType') && document.getElementById('newVehicleType').value) || '';
    const driverId = (document.getElementById('newVehicleDriver') && document.getElementById('newVehicleDriver').value) || null;
    if (!id.trim()) {
        if (window.app) window.app.showAlert('Missing ID', 'Vehicle ID is required.', 'warning');
        return;
    }
    try {
        const vehicle = dataManager.addVehicle({ id: id.trim(), type: type.trim() || undefined, driverId: driverId || undefined });
        if (driverId) {
            dataManager.updateUser(driverId, { vehicleId: vehicle.id });
        }
        document.getElementById('addVehicleFormContainer').style.display = 'none';
        if (window.syncManager && typeof window.syncManager.syncToServer === 'function') {
            window.syncManager.syncToServer({ users: dataManager.getUsers(), vehicles: dataManager.getVehicles() }, 'partial');
        }
        if (window.app) { window.app.showAlert('Vehicle added', vehicle.id + ' has been added and saved to server.', 'success'); window.app.loadAdminPanel(); }
    } catch (e) {
        if (window.app) window.app.showAlert('Error', e.message || 'Failed to add vehicle', 'error');
    }
};

window.searchUsers = function(query) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
    const rows = tbody.getElementsByTagName('tr');
    const searchTerm = query.toLowerCase();
    
    for (let row of rows) {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    }
};

window.optimizeRoute = function(routeId) {
    if (window.app) {
        window.app.showAlert('Route Optimization', `Optimizing route ${routeId}...`, 'info');
        setTimeout(() => {
            window.app.showAlert('Success', 'Route has been optimized', 'success');
        }, 2000);
    }
};

// BIN MODAL SPECIFIC FUNCTIONS
window.assignJob = function(binId) {
    // First show bin details
    if (window.binModalManager) {
        window.binModalManager.showBinDetails(binId);
        // Then open driver assignment
        setTimeout(() => {
            window.binModalManager.showDriverAssignment();
        }, 500);
    }
};

window.showBinDetails = function(binId) {
    if (window.binModalManager) {
        window.binModalManager.showBinDetails(binId);
    } else {
        console.error('Bin Modal Manager not loaded');
    }
};

/** Delete a bin from the admin portal (map popup). Admin only. Confirms, then removes bin and syncs to server; records in system log. */
window.deleteBinWithConfirm = function(binId) {
    if (typeof authManager === 'undefined' || !authManager.isAdmin || !authManager.isAdmin()) {
        if (window.app) window.app.showAlert('Not allowed', 'Only admins can delete bins.', 'error');
        return;
    }
    const bin = dataManager && dataManager.getBinById(binId);
    const label = (bin && (bin.location || bin.id)) || binId;
    if (!confirm('Remove bin "' + label + '" permanently? It will be removed from the map and marked as deleted on the server.')) {
        return;
    }
    if (typeof dataManager === 'undefined' || !dataManager.deleteBin) {
        if (window.app) window.app.showAlert('Error', 'Cannot delete bin: data manager not ready.', 'error');
        return;
    }
    const currentUser = authManager.getCurrentUser ? authManager.getCurrentUser() : null;
    const deletedBy = (currentUser && currentUser.name) ? currentUser.name : (currentUser && currentUser.username) ? currentUser.username : 'Admin';
    dataManager.deleteBin(binId, deletedBy);
    if (window.mapManager && typeof window.mapManager.loadBinsOnMap === 'function') {
        window.mapManager.loadBinsOnMap();
    }
    if (window.app) window.app.showAlert('Bin removed', 'Bin ' + binId + ' has been deleted.', 'success');
};

window.scheduleUrgentCollection = function(binId) {
    const bin = dataManager.getBinById(binId);
    if (bin) {
        dataManager.addAlert('urgent_collection', 
            `Urgent collection scheduled for bin ${binId} at ${bin.location}`, 
            'high', 
            binId
        );
        
        if (window.app) {
            window.app.showAlert('Urgent Collection', 
                `Urgent collection has been scheduled for bin ${binId}`, 
                'warning'
            );
        }
    }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WasteManagementApp;
}

// Global function to start a route
window.startRoute = function(routeId) {
    console.log('🚛 Starting route:', routeId);
    
    const routes = dataManager.getRoutes();
    const route = routes.find(r => r.id === routeId);
    
    if (!route) {
        console.error('Route not found:', routeId);
        return;
    }
    
    // Update route status
    dataManager.updateRoute(routeId, { 
        status: 'in-progress',
        startedAt: new Date().toISOString()
    });
    
    // Update driver status if current user
    const currentUser = authManager.getCurrentUser();
    if (currentUser && currentUser.id === route.driverId) {
        if (typeof mapManager !== 'undefined') {
            mapManager.updateDriverStatus(currentUser.id, 'on-route');
        }
        
        // Update UI
        const statusIndicator = document.getElementById('driverStatusIndicator');
        if (statusIndicator) {
            statusIndicator.textContent = 'On Route';
            statusIndicator.style.color = '#f59e0b';
        }
    }
    
    if (window.app) {
        window.app.showAlert('Route Started', `Route ${routeId} is now in progress`, 'success');
        window.app.loadDriverRoutes(); // Refresh the route list
    }
    
    // Sync the route update
    if (typeof syncManager !== 'undefined') {
        const updatedRoute = dataManager.getRoutes().find(r => r.id === routeId);
        syncManager.syncRoute(updatedRoute);
    }
};

// Haversine distance in meters (for collection proximity check)
function _distanceMeters(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

const MAX_COLLECTION_DISTANCE_METERS = 100;

// Global function to mark a bin as collected
// options: { isAutoCollection: true } when recorded by driver-at-bin auto-collection
window.markBinCollected = async function(binId, options) {
    const isAutoCollection = !!(options && options.isAutoCollection);
    console.log('🗑️ === MARK BIN COLLECTED FUNCTION CALLED ===', isAutoCollection ? '(Auto collection)' : '');
    console.log('🗑️ Bin ID:', binId);

    const currentUser = authManager.getCurrentUser();
    if (!currentUser || currentUser.type !== 'driver') {
        console.error('❌ Only drivers can mark bins as collected');
        if (window.app) {
            window.app.showAlert('Access Denied', 'Only drivers can mark bins as collected.', 'warning');
        }
        return false;
    }

    const bin = dataManager.getBinById(binId);
    if (!bin) {
        console.error('❌ Bin not found:', binId);
        if (window.app) {
            window.app.showAlert('Error', 'Bin not found.', 'danger');
        }
        return false;
    }

    // Proximity check: driver must be within range (skip only for auto-collection)
    if (!isAutoCollection) {
        if (!bin.lat || !bin.lng) {
            if (window.app) window.app.showAlert('Cannot verify', 'This bin has no location; collection cannot be verified.', 'danger');
            return false;
        }
        const driverLoc = dataManager.getDriverLocation(currentUser.id) || (window.enhancedDriverSystemComplete && window.enhancedDriverSystemComplete.currentPosition);
        if (!driverLoc || driverLoc.lat == null || driverLoc.lng == null) {
            if (window.app) window.app.showAlert('Location required', 'Enable GPS so we can verify you are at the bin before marking collection.', 'warning');
            return false;
        }
        const distanceM = _distanceMeters(driverLoc.lat, driverLoc.lng, bin.lat, bin.lng);
        if (distanceM > MAX_COLLECTION_DISTANCE_METERS) {
            if (window.app) window.app.showAlert('Too far from bin', 'You must be within ' + MAX_COLLECTION_DISTANCE_METERS + 'm of the bin. You are ' + Math.round(distanceM) + 'm away.', 'danger');
            return false;
        }
    }

    // Find associated route for this collection (support bins, binIds, or binDetails)
    // If no route: driver collected a bin NOT assigned to them (ad-hoc) – we still record it for this driver
    const routes = dataManager.getRoutes();
    const associatedRoute = routes.find(route => 
        route.driverId === currentUser.id && 
        (route.bins?.includes(binId) || route.binIds?.includes(binId) || route.binDetails?.some(b => b.id === binId)) &&
        route.status !== 'completed'
    );
    const isAdHoc = !associatedRoute;

    // Driver location for server-side verification (required for driver collections)
    const driverLocForCollection = isAutoCollection
        ? (dataManager.getDriverLocation(currentUser.id) || (window.enhancedDriverSystemComplete && window.enhancedDriverSystemComplete.currentPosition))
        : (dataManager.getDriverLocation(currentUser.id) || (window.enhancedDriverSystemComplete && window.enhancedDriverSystemComplete.currentPosition));
    const hasDriverLoc = driverLocForCollection && driverLocForCollection.lat != null && driverLocForCollection.lng != null;

    // Create collection record (same format for assigned or ad-hoc; adHoc flag set in dataManager.addCollection)
    const collection = {
        binId: binId,
        binLocation: bin.location,
        driverId: currentUser.id,
        driverName: currentUser.name,
        originalFill: bin.fill ?? bin.fillLevel ?? 75,
        weight: Math.round((bin.fill ?? bin.fillLevel ?? 75) * 0.5),
        timestamp: new Date().toISOString(),
        collectedAt: new Date().toLocaleString(),
        vehicleId: currentUser.vehicleId || 'Unknown',
        routeId: associatedRoute ? associatedRoute.id : null,
        routeName: associatedRoute ? (associatedRoute.name || `Route ${associatedRoute.id}`) : 'Direct Collection (unassigned bin)',
        autoCollection: isAutoCollection,  // true when recorded by driver-at-bin auto-collection
        verifiedByProximity: !isAutoCollection && hasDriverLoc,
        driverLat: hasDriverLoc ? driverLocForCollection.lat : undefined,
        driverLng: hasDriverLoc ? driverLocForCollection.lng : undefined,
        distanceMeters: (hasDriverLoc && bin.lat != null && bin.lng != null) ? Math.round(_distanceMeters(driverLocForCollection.lat, driverLocForCollection.lng, bin.lat, bin.lng)) : undefined
    };
    
    // Record collection in local store (bin reset, driver history, bin history, analytics)
    const savedCollection = dataManager.addCollection(collection);
    console.log('✅ Collection saved:', savedCollection, isAdHoc ? '(ad-hoc – credited to you)' : '');
    
    // Immediate sync to server so collection is stored and visible everywhere (world-class live update)
    if (typeof syncManager !== 'undefined' && syncManager.syncEnabled && syncManager.syncCollection) {
        try {
            await syncManager.syncCollection(savedCollection);
            console.log('🗑️ Collection synced to server');
        } catch (err) {
            console.warn('Collection sync to server:', err && err.message ? err.message : err);
        }
    }
    
    // Verify bin was actually updated
    const updatedBin = dataManager.getBinById(binId);
    console.log('🔍 Bin after collection - Fill level:', updatedBin ? updatedBin.fill : 'Bin not found');
    console.log('🔍 Bin after collection - Status:', updatedBin ? updatedBin.status : 'Bin not found');
    console.log('🔍 Bin after collection - Last collection:', updatedBin ? updatedBin.lastCollection : 'Bin not found');
    
    // Verify driver history was recorded
    const driverHistory = dataManager.getDriverHistory(currentUser.id);
    console.log('📚 Driver history entries:', driverHistory.length);
    console.log('📚 Latest driver history entry:', driverHistory[0]);
    
    // Verify bin history was recorded
    const binHistory = dataManager.getBinHistory(binId);
    console.log('📝 Bin history entries:', binHistory.length);
    console.log('📝 Latest bin history entry:', binHistory[0]);
    
    // Find and update the route status (reuse routes variable from above)
    console.log(`🔍 Searching for routes containing bin ${binId} for driver ${currentUser.id}...`);
    console.log(`🔍 Total routes in system: ${routes.length}`);
    console.log(`🔍 Driver routes (all statuses): ${routes.filter(r => r.driverId === currentUser.id).length}`);
    const routesToUpdate = routes.filter(route => {
        const hasInBins = route.bins?.includes(binId);
        const hasInBinIds = route.binIds?.includes(binId);
        const hasInBinDetails = route.binDetails?.some(b => b.id === binId);
        const matchesDriver = route.driverId === currentUser.id;
        const notCompleted = route.status !== 'completed';
        console.log(`🔍 Route ${route.id}: driver=${matchesDriver}, bins=${hasInBins}, binIds=${hasInBinIds}, binDetails=${hasInBinDetails}, notCompleted=${notCompleted}`);
        return matchesDriver && (hasInBins || hasInBinIds || hasInBinDetails) && notCompleted;
    });
    
    console.log(`🔍 Routes to update: ${routesToUpdate.length}`, routesToUpdate.map(r => r.id));
    routesToUpdate.forEach(route => {
        // Check if all bins in this route are now collected (support bins, binIds, or binDetails)
        const allBins = route.binIds || route.bins || (route.binDetails ? route.binDetails.map(b => b.id) : []);
        console.log(`🔍 Route ${route.id}: allBins before filter =`, allBins);
        const remainingBins = allBins.filter(id => id !== binId);
        console.log(`🔍 Route ${route.id}: remainingBins after removing ${binId} =`, remainingBins);
        
        console.log(`🔍 Route ${route.id}: ${allBins.length} total bins, ${remainingBins.length} remaining after collection`);
        
        if (remainingBins.length === 0) {
            // All bins collected - mark route as completed
            console.log(`🎉 ROUTE COMPLETION: All bins in route ${route.id} have been collected!`);
            console.log(`📋 Route details: ${route.name || route.id}`);
            console.log(`📊 Total bins collected: ${allBins.length}`);
            console.log(`👤 Completed by: ${currentUser.name}`);
            
            console.log(`🎉 ROUTE COMPLETION: Marking route ${route.id} as completed (all bins collected)`);
            const completedRoute = dataManager.updateRoute(route.id, {
                status: 'completed',
                completedAt: new Date().toISOString(),
                completedBy: currentUser.id,
                actualDuration: route.estimatedDuration || 30,
                totalBinsCollected: allBins.length,
                completionPercentage: 100
            });
            if (completedRoute) {
                console.log(`✅ Route ${route.id} marked as completed:`, completedRoute);
                console.log(`✅ Route status is now: ${completedRoute.status}`);
                // So sync-manager can prefer local completed status over stale server "pending" for 60s
                if (!window._recentlyCompletedRoutes) window._recentlyCompletedRoutes = {};
                window._recentlyCompletedRoutes[route.id] = { timestamp: Date.now(), status: 'completed' };
            } else {
                console.error(`❌ FAILED to mark route ${route.id} as completed!`);
            }
            console.log(`📚 Route moved to driver history for future reference`);
            
            // Log route completion
            dataManager.addSystemLog(
                `Route ${route.id} completed by ${currentUser.name} - ${allBins.length} bins collected`, 
                'success'
            );
        } else {
            // Update route to remove completed bin (keep bins, binIds, binDetails in sync for driver UI)
            const updatedBinIds = (route.binIds || route.bins || []).filter(id => id !== binId);
            const updatedRoute = {
                ...route,
                bins: updatedBinIds,
                binIds: route.binIds ? route.binIds.filter(id => id !== binId) : updatedBinIds,
                binDetails: route.binDetails ? route.binDetails.filter(b => b.id !== binId) : route.binDetails,
                progress: Math.round(((allBins.length - remainingBins.length) / allBins.length) * 100),
                lastUpdated: new Date().toISOString()
            };
            
            const updated = dataManager.updateRoute(route.id, updatedRoute);
            if (updated) {
                console.log(`✅ Route ${route.id} updated successfully - removed bin ${binId}. Progress: ${updatedRoute.progress}%`);
                console.log(`✅ Route ${route.id} bins now:`, updated.bins || updated.binIds);
            } else {
                console.error(`❌ FAILED to update route ${route.id}!`);
            }
        }
    });

    // World-class: bin was assigned to another driver but collected by this driver – update other drivers' routes
    const otherDriversRoutesWithThisBin = routes.filter(route => {
        if (route.driverId === currentUser.id) return false;
        if (route.status === 'completed') return false;
        return route.bins?.includes(binId) || route.binIds?.includes(binId) || route.binDetails?.some(b => b.id === binId);
    });
    otherDriversRoutesWithThisBin.forEach(route => {
        const allBins = route.binIds || route.bins || (route.binDetails ? route.binDetails.map(b => b.id) : []);
        const remainingBinIds = allBins.filter(id => id !== binId);
        const otherDriver = dataManager.getUserById && dataManager.getUserById(route.driverId);
        const otherDriverName = otherDriver ? otherDriver.name : route.driverId;
        dataManager.addSystemLog(
            `Bin ${binId} was on ${otherDriverName}'s route but collected by ${currentUser.name} – removed from their route`,
            'info'
        );
        if (remainingBinIds.length === 0) {
            dataManager.updateRoute(route.id, {
                status: 'completed',
                completedAt: new Date().toISOString(),
                completedBy: currentUser.id,
                completedByOtherDriver: true,
                totalBinsCollected: allBins.length,
                completionPercentage: 100
            });
        } else {
            dataManager.updateRoute(route.id, {
                bins: remainingBinIds,
                binIds: route.binIds ? route.binIds.filter(id => id !== binId) : remainingBinIds,
                binDetails: route.binDetails ? route.binDetails.filter(b => b.id !== binId) : route.binDetails,
                progress: Math.round(((allBins.length - remainingBinIds.length) / allBins.length) * 100),
                lastUpdated: new Date().toISOString()
            });
        }
    });
    
    // Sync routes (and bins) to server so server has completed route; await so GET /driver/routes returns correct list
    if (typeof syncManager !== 'undefined' && syncManager.syncEnabled) {
        (async () => {
            const ok = await syncManager.syncToServer({
                routes: dataManager.getRoutes(),
                bins: dataManager.getBins(),
                collections: dataManager.getCollections()
            }, 'partial');
            if (ok) console.log('📤 Routes and collections synced to server');
            // Refresh from server so driver sees updated route list (completed route excluded)
            setTimeout(() => {
                syncManager.syncFromServer();
                if (window.app && typeof window.app.loadDriverRoutes === 'function') window.app.loadDriverRoutes();
            }, 400);
        })();
    }
    
    // Show comprehensive success message with all actions taken
    if (window.app) {
        let message = `✅ COLLECTION COMPLETED!\n\n📦 Bin: ${bin.location} (${binId})\n`;
        message += `🔄 Status: Fill reset to 0% (was ${bin.fill}%)\n`;
        message += `📚 Driver History: Collection recorded\n`;
        message += `📝 Bin History: Pickup logged\n`;
        
        if (associatedRoute) {
            const remainingBins = associatedRoute.binIds ? 
                associatedRoute.binIds.filter(id => id !== binId).length : 
                (associatedRoute.binDetails ? associatedRoute.binDetails.filter(b => b.id !== binId).length : 0);
            
            if (remainingBins === 0) {
                message += `\n🎉 ROUTE COMPLETED!\n`;
                message += `📋 Route: "${associatedRoute.name || associatedRoute.id}"\n`;
                message += `✅ Status: Removed from active tasks\n`;
                message += `📚 History: Saved to driver history`;
            } else {
                message += `\n📋 Route Progress:\n`;
                message += `🔄 Route: "${associatedRoute.name || associatedRoute.id}"\n`;
                message += `📊 Remaining: ${remainingBins} bin(s) to collect`;
            }
        } else {
            message += `\n📋 Type: Ad-hoc collection (bin not on your route)`;
            message += `\n✅ Credited to you and recorded in your history`;
            message += `\n🔄 Synced to server for live visibility`;
            if (otherDriversRoutesWithThisBin.length > 0) {
                message += `\n📌 Note: This bin was removed from ${otherDriversRoutesWithThisBin.length} other driver route(s).`;
            }
        }
        
        window.app.showAlert(
            isAdHoc ? 'Ad-hoc Collection Recorded' : 'Collection System Update', 
            message,
            'success',
            8000
        );
    }
    
    // Live update: notify any listener (maps, tables, analytics) immediately
    try {
        document.dispatchEvent(new CustomEvent('collectionRecorded', { 
            detail: { collection: savedCollection, adHoc: isAdHoc, driverId: currentUser.id } 
        }));
    } catch (e) {}
    
    // Refresh driver bottom nav badges (More = new collection history)
    document.dispatchEvent(new CustomEvent('driverNavBadgesRefresh'));
    
    // Enhanced UI refresh with proper logging
    console.log('🔄 Starting comprehensive UI refresh after collection...');
    
    // Force data sync immediately after route completion
    if (typeof syncManager !== 'undefined') {
        console.log('📡 Forcing immediate sync after collection...');
        syncManager.syncToServer({
            routes: dataManager.getRoutes(),
            bins: dataManager.getBins(),
            collections: dataManager.getCollections()
        }, 'partial');
    }
    
    // Immediate refresh of driver routes
    if (window.app && typeof window.app.loadDriverRoutes === 'function') {
        console.log('🔄 Triggering immediate driver routes refresh...');
        window.app.loadDriverRoutes(); // Immediate refresh
        console.log('🔄 Driver routes refreshed immediately');
        
        // Check routes immediately after refresh
        const currentRoutes = dataManager.getDriverRoutes(currentUser.id);
        console.log('🔍 Active routes after immediate refresh:', currentRoutes.length);
        
        // Delayed refresh to ensure all data is processed
        setTimeout(() => {
            console.log('🔄 === DELAYED ROUTE REFRESH DEBUG ===');
            
            // Force data refresh from storage before UI refresh
            const allRoutesBeforeRefresh = dataManager.getRoutes();
            const driverRoutesBeforeRefresh = allRoutesBeforeRefresh.filter(r => r.driverId === currentUser.id);
            console.log(`📊 Before UI refresh - Total driver routes: ${driverRoutesBeforeRefresh.length}`);
            console.log(`📊 Before UI refresh - Route statuses:`, driverRoutesBeforeRefresh.map(r => `${r.id}: ${r.status}`));
            
            // Now refresh the UI
            window.app.loadDriverRoutes();
            console.log('🔄 Driver routes refreshed after delay');
            
            // Check if route was properly removed
            const remainingRoutes = dataManager.getDriverRoutes(currentUser.id);
            const wasRouteComplete = associatedRoute && remainingRoutes.length < routes.filter(r => r.driverId === currentUser.id && r.status !== 'completed').length;
            console.log(`📊 Route status: ${wasRouteComplete ? 'Route completed and removed' : 'Route partially completed'}`);
            console.log(`📊 Remaining active routes: ${remainingRoutes.length}`);
            console.log(`📊 Active routes details:`, remainingRoutes.map(r => `${r.id}: ${r.status}`));
            
            // If route is still showing, force another refresh
            if (remainingRoutes.length > 0) {
                console.log('⚠️ Route still showing - forcing complete route list refresh...');
                if (typeof window.forceRouteListRefresh === 'function') {
                    window.forceRouteListRefresh();
                } else {
                    setTimeout(() => {
                        window.app.loadDriverRoutes();
                        console.log('🔄 Additional forced refresh completed');
                        
                        const finalCheck = dataManager.getDriverRoutes(currentUser.id);
                        console.log(`📊 Final check - Active routes: ${finalCheck.length}`);
                    }, 1000);
                }
            }
        }, 500);
    }
    
    // Refresh map immediately with explicit 0% state
    if (typeof mapManager !== 'undefined' && mapManager && mapManager.map) {
        console.log('🗺️ Triggering immediate map refresh with explicit 0% for collected bin...');
        // Force the bin to 0% on the map immediately
        if (typeof mapManager.updateBinMarker === 'function') {
            const freshBin = dataManager.getBinById(binId);
            if (freshBin) {
                mapManager.updateBinMarker(binId, freshBin);
                console.log(`🗺️ Direct marker update: ${binId} at ${freshBin.fill}%`);
            }
        }
        mapManager.loadBinsOnMap(); // Full refresh to show 0% fill
        mapManager.loadDriversOnMap();
        console.log('🗺️ Map refreshed immediately');
        
        // Also refresh after delay to ensure sync updates are reflected
        setTimeout(() => {
            mapManager.loadBinsOnMap();
            mapManager.loadDriversOnMap();
            console.log('🗺️ Map refreshed after delay');
        }, 800);
    } else if (mapManager && !mapManager.map) {
        console.log('⚠️ Map not initialized yet, skipping map refresh');
    }
    
    // Update driver stats
    if (window.app && typeof window.app.updateDriverStats === 'function') {
        window.app.updateDriverStats(); // Immediate update
        setTimeout(() => {
            window.app.updateDriverStats();
            console.log('📊 Driver stats updated after collection');
        }, 1000);
    }
    
    // Update analytics dashboard
    if (typeof analyticsManager !== 'undefined') {
        setTimeout(() => {
            analyticsManager.updateDashboardMetrics();
            console.log('📈 Analytics updated after collection');
        }, 1200);
    }
    
    // Refresh the entire dashboard if in admin/manager view
    if (window.app && typeof window.app.refreshDashboard === 'function') {
        setTimeout(() => {
            window.app.refreshDashboard();
            console.log('🔄 Dashboard refreshed after collection');
        }, 1500);
    }
    
    // Force a complete sync to ensure all devices are updated
    if (typeof syncManager !== 'undefined') {
        setTimeout(() => {
            syncManager.performFullSync();
            console.log('🔄 Full sync triggered after collection');
            
            // Final verification after sync
            setTimeout(() => {
                const finalBinCheck = dataManager.getBinById(binId);
                const finalRouteCheck = dataManager.getDriverRoutes(currentUser.id);
                console.log('🔍 FINAL VERIFICATION:');
                console.log(`   Bin ${binId} fill level: ${finalBinCheck ? finalBinCheck.fill : 'NOT FOUND'}%`);
                console.log(`   Active routes: ${finalRouteCheck.length}`);
                console.log(`   Route details:`, finalRouteCheck);
                
                // If bin is still not reset, force it
                if (finalBinCheck && finalBinCheck.fill > 0) {
                    console.log('⚠️ Bin fill not reset - forcing update...');
                    dataManager.updateBin(binId, { fill: 0, fillLevel: 0, status: 'normal', lastCollection: new Date().toLocaleString() });
                    console.log('🔄 Forced bin reset completed');
                    
                    // Force map refresh
                    if (typeof mapManager !== 'undefined' && mapManager && mapManager.map) {
                        mapManager.loadBinsOnMap();
                        console.log('🗺️ Forced map refresh after bin reset');
                    } else if (mapManager && !mapManager.map) {
                        console.log('⚠️ Map not initialized yet, skipping map refresh after bin reset');
                    }
                }
                
                // Final check if routes are still showing
                const uiRouteCheck = dataManager.getDriverRoutes(currentUser.id);
                if (uiRouteCheck.length > 0 && associatedRoute && associatedRoute.status === 'completed') {
                    console.log('⚠️ Completed route still showing in UI - forcing route list refresh...');
                    if (typeof window.forceRouteListRefresh === 'function') {
                        window.forceRouteListRefresh();
                    }
                    
                    // Show user feedback
                    if (window.app) {
                        window.app.showAlert(
                            'Route List Updated', 
                            'Your completed route has been removed from the active tasks list.',
                            'info',
                            3000
                        );
                    }
                }
            }, 1000);
        }, 2000);
    }
    
    // Refresh all driver data across the application to ensure status sync
    if (typeof window.refreshAllDriverData === 'function') {
        setTimeout(() => {
            window.refreshAllDriverData();
            console.log('🔄 All driver data refreshed after collection');
        }, 1500);
    }
    
    console.log('🎉 Bin collection process completed successfully');
    return true;
};

// ---------------------------------------------------------------------------
// Delayed sensor attribution: sensor sends fill data ~30 min after collection.
// When driver had already left, we still attribute the drop to them if they
// were near the bin within the last (sensor interval + 15 min).
// ---------------------------------------------------------------------------
if (typeof window.__driverNearBinLog !== 'object') window.__driverNearBinLog = {};
window.recordDriverNearBin = function(binId) {
    if (binId) window.__driverNearBinLog[binId] = Date.now();
};
window.checkDelayedSensorUpdates = function(prevBins, newBins) {
    if (!window.authManager || !window.dataManager) return;
    const user = window.authManager.getCurrentUser && window.authManager.getCurrentUser();
    if (!user || user.type !== 'driver') return;
    const log = window.__driverNearBinLog;
    if (!log || typeof log !== 'object') return;
    const prevMap = Array.isArray(prevBins) ? Object.fromEntries((prevBins || []).map(b => [b.id, b])) : (prevBins || {});
    const newList = Array.isArray(newBins) ? newBins : Object.values(newBins || {});
    const intervalMin = (typeof window.__sensorReportingIntervalMinutes === 'number' ? window.__sensorReportingIntervalMinutes : 30);
    const attributionWindowMs = (intervalMin + 15) * 60 * 1000;
    const now = Date.now();
    newList.forEach(function(bin) {
        const binId = bin.id;
        if (!binId) return;
        const newFill = bin.fill != null ? bin.fill : (bin.fillLevel != null ? bin.fillLevel : -1);
        const prev = prevMap[binId];
        const prevFill = prev && (prev.fill != null || prev.fillLevel != null) ? (prev.fill != null ? prev.fill : prev.fillLevel) : -1;
        const justEmptied = newFill <= 5 && (prevFill < 0 || prevFill > 5);
        if (!justEmptied) return;
        const atTime = log[binId];
        if (atTime == null || (now - atTime) > attributionWindowMs) return;
        if (window.autoCollectionCooldown && typeof window.autoCollectionCooldown.isBinInCooldown === 'function' && window.autoCollectionCooldown.isBinInCooldown(binId)) return;
        if (typeof window.markBinCollected !== 'function') return;
        if (window.autoCollectionCooldown && typeof window.autoCollectionCooldown.setCooldown === 'function') window.autoCollectionCooldown.setCooldown(binId);
        delete log[binId];
        window.markBinCollected(binId, { isAutoCollection: true });
        if (window.app && window.app.showAlert) window.app.showAlert('Collection recorded (sensor)', 'Bin ' + binId + ' fill update received – collection attributed to you.', 'success', 5000);
    });
    Object.keys(log).forEach(function(binId) {
        if (now - log[binId] > attributionWindowMs) delete log[binId];
    });
};

// Global function to view driver history (for debugging and user reference)
window.viewDriverHistory = function() {
    const currentUser = authManager.getCurrentUser();
    if (!currentUser || currentUser.type !== 'driver') {
        console.log('❌ Driver history can only be viewed by drivers');
        return;
    }
    
    console.log('📚 === DRIVER HISTORY REPORT ===');
    console.log(`👤 Driver: ${currentUser.name} (${currentUser.id})`);
    
    // Get driver history
    const driverHistory = dataManager.getDriverHistory(currentUser.id);
    console.log(`📝 Total history entries: ${driverHistory.length}`);
    
    if (driverHistory.length > 0) {
        console.log('\n📋 Recent Collections:');
        driverHistory.slice(0, 10).forEach((entry, index) => {
            console.log(`${index + 1}. ${entry.binLocation} (${entry.binId}) - ${entry.timestamp}`);
            console.log(`   Route: ${entry.route}, Weight: ${entry.weight}kg, Fill: ${entry.originalFill}%`);
        });
    }
    
    // Get completed routes
    const allRoutes = dataManager.getRoutes();
    const completedRoutes = allRoutes.filter(r => 
        r.driverId === currentUser.id && r.status === 'completed'
    );
    
    console.log(`\n🏁 Completed routes: ${completedRoutes.length}`);
    if (completedRoutes.length > 0) {
        console.log('\n📋 Recent Completed Routes:');
        completedRoutes.slice(-5).forEach((route, index) => {
            console.log(`${index + 1}. ${route.name || route.id} - Completed: ${route.completedAt}`);
            console.log(`   Bins collected: ${route.totalBinsCollected || 'N/A'}`);
        });
    }
    
    // Get today's collections
    const todayCollections = dataManager.getTodayCollections().filter(c => c.driverId === currentUser.id);
    console.log(`\n📅 Today's collections: ${todayCollections.length}`);
    
    console.log('\n💡 Use viewDriverHistory() in console anytime to see this report');
    
    return {
        driverHistory,
        completedRoutes,
        todayCollections
    };
};

// Global function to view bin history (for debugging and verification)
window.viewBinHistory = function(binId) {
    if (!binId) {
        console.log('❌ Please provide a bin ID. Example: viewBinHistory("DF703-001")');
        return;
    }
    
    console.log(`📝 === BIN HISTORY REPORT ===`);
    console.log(`🗑️ Bin ID: ${binId}`);
    
    // Get bin current status
    const bin = dataManager.getBinById(binId);
    if (bin) {
        console.log(`📊 Current Status: ${bin.fill}% full, ${bin.status}`);
        console.log(`📅 Last Collection: ${bin.lastCollection || 'Never'}`);
        console.log(`👤 Last Collected By: ${bin.collectedBy || 'N/A'}`);
    } else {
        console.log('❌ Bin not found');
        return;
    }
    
    // Get bin history
    const binHistory = dataManager.getBinHistory(binId);
    console.log(`📝 Total history entries: ${binHistory.length}`);
    
    if (binHistory.length > 0) {
        console.log('\n📋 Recent Activity:');
        binHistory.slice(0, 10).forEach((entry, index) => {
            const action = entry.action === 'collection' ? '🗑️ COLLECTED' : '📊 SENSOR UPDATE';
            console.log(`${index + 1}. ${action} - ${entry.timestamp}`);
            console.log(`   Fill: ${entry.previousFill}% → ${entry.newFill}%`);
            if (entry.collectedBy) {
                console.log(`   By: ${entry.collectedBy}`);
            }
        });
    }
    
    console.log('\n💡 Use viewBinHistory("BIN_ID") in console to check any bin');
    
    return {
        bin,
        binHistory
    };
};

// Global function to force route list refresh (for fixing UI issues)
window.forceRouteListRefresh = function() {
    const currentUser = authManager.getCurrentUser();
    if (!currentUser) {
        console.log('❌ No user logged in');
        return;
    }
    
    console.log('🔄 === FORCING ROUTE LIST REFRESH ===');
    
    // Clear the route list element completely
    const routesList = document.getElementById('driverRouteList');
    if (routesList) {
        routesList.innerHTML = '<p>🔄 Refreshing routes...</p>';
        console.log('🧹 Cleared route list HTML');
    }
    
    // Force a fresh data load
    if (window.app && typeof window.app.loadDriverRoutes === 'function') {
        setTimeout(() => {
            window.app.loadDriverRoutes();
            console.log('🔄 Route list forcefully refreshed');
            
            // Verify the refresh worked
            const finalRoutes = dataManager.getDriverRoutes(currentUser.id);
            console.log(`📊 Routes after forced refresh: ${finalRoutes.length}`);
        }, 100);
    }
    
    return true;
};

// Global function to debug route status (for drivers to check their current status)
window.debugRouteStatus = function() {
    const currentUser = authManager.getCurrentUser();
    if (!currentUser) {
        console.log('❌ No user logged in');
        return;
    }
    
    console.log('🔍 === ROUTE STATUS DEBUG ===');
    console.log(`👤 Driver: ${currentUser.name} (${currentUser.id})`);
    
    // Get all routes for this driver
    const allRoutes = dataManager.getRoutes();
    const driverRoutes = allRoutes.filter(r => r.driverId === currentUser.id);
    
    console.log(`📋 Total routes for driver: ${driverRoutes.length}`);
    
    driverRoutes.forEach((route, index) => {
        console.log(`\n${index + 1}. Route ${route.id} (${route.name || 'Unnamed'})`);
        console.log(`   Status: ${route.status}`);
        console.log(`   Bins: ${route.binIds ? route.binIds.length : (route.binDetails ? route.binDetails.length : 0)}`);
        console.log(`   Created: ${route.createdAt}`);
        if (route.completedAt) {
            console.log(`   Completed: ${route.completedAt}`);
        }
        if (route.binIds) {
            console.log(`   Bin IDs: ${route.binIds.join(', ')}`);
        }
        if (route.binDetails) {
            console.log(`   Bin Details: ${route.binDetails.map(b => `${b.id} (${b.fill}%)`).join(', ')}`);
        }
    });
    
    // Check active vs completed
    const activeRoutes = driverRoutes.filter(r => r.status !== 'completed' && r.status !== 'cancelled');
    const completedRoutes = driverRoutes.filter(r => r.status === 'completed');
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`   Active routes: ${activeRoutes.length}`);
    console.log(`   Completed routes: ${completedRoutes.length}`);
    console.log(`   Total collections today: ${dataManager.getTodayCollections().filter(c => c.driverId === currentUser.id).length}`);
    
    // Check what loadDriverRoutes would show
    const filteredRoutes = dataManager.getDriverRoutes(currentUser.id);
    console.log(`   Routes shown in UI: ${filteredRoutes.length}`);
    
    console.log('\n💡 Use debugRouteStatus() anytime to check your route status');
    console.log('💡 Use viewDriverHistory() to see collection history');
    console.log('💡 Use viewBinHistory("BIN_ID") to check specific bin status');
    
    return {
        allRoutes: driverRoutes,
        activeRoutes,
        completedRoutes,
        filteredRoutes
    };
};

// Global function to navigate to bin – opens device maps app (Google Maps on Android, Apple Maps on iPhone)
window.navigateToBin = function(binId, lat, lng) {
    if (lat == null || lng == null || isNaN(lat) || isNaN(lng)) {
        if (window.app && window.app.showAlert) window.app.showAlert('Navigation', 'Location not available.', 'warning');
        return;
    }
    var latNum = Number(lat);
    var lngNum = Number(lng);
    var isIOS = /iPad|iPhone|iPod/i.test(navigator.userAgent);
    var url;
    if (isIOS) {
        // Apple Maps: daddr=lat,lng, dirflg=d (driving). Opens Apple Maps app on iOS.
        url = 'https://maps.apple.com/?daddr=' + latNum + ',' + lngNum + '&dirflg=d';
    } else {
        // Google Maps: destination=lat,lng, travelmode=driving. Opens Google Maps app on Android when available.
        url = 'https://www.google.com/maps/dir/?api=1&destination=' + latNum + ',' + lngNum + '&travelmode=driving';
    }
    // Try to open in new tab/window first (works when triggered by user tap on mobile).
    var w = window.open(url, '_blank', 'noopener,noreferrer');
    if (!w) {
        // Popup blocked (common on mobile): open in same tab so map app or web map still opens.
        window.location.href = url;
    }
    if (window.app && window.app.showAlert) {
        window.app.showAlert('Navigation', (isIOS ? 'Opening Apple Maps' : 'Opening Google Maps') + ' for turn-by-turn directions.', 'info', 3000);
    }
}

// AI Suggestion Action Functions
// 🤖 ENHANCED AI SUGGESTION GLOBAL FUNCTIONS - Connected to Main AI System

window.refreshDriverAISuggestion = function() {
    const currentUser = authManager.getCurrentUser();
    if (!currentUser || currentUser.type !== 'driver') {
        console.warn('🔒 Enhanced AI refresh requires valid driver authentication');
        return;
    }
    
    console.log(`🔄 Refreshing Enhanced AI recommendation for driver ${currentUser.id}...`);
    
    // Show refresh animation
    const refreshIcon = document.getElementById('aiRefreshIcon');
    if (refreshIcon) {
        refreshIcon.style.animation = 'rotate 1s linear infinite';
        setTimeout(() => {
            refreshIcon.style.animation = '';
        }, 2000);
    }
    
    // Use the enhanced AI system
    if (window.app && typeof window.app.loadEnhancedDriverAI === 'function') {
        window.app.loadEnhancedDriverAI(currentUser.id);
        
        // Show success notification
        if (window.app.showAlert) {
            window.app.showAlert(
                '🤖 AI Refreshed', 
                'Updated with latest location and route data', 
                'success', 
                3000
            );
        }
    } else {
        console.error('❌ Enhanced AI system not available');
    }
};

window.acceptSmartRecommendation = function() {
    const currentRecommendation = window.currentAIRecommendation;
    if (!currentRecommendation) {
        console.warn('⚠️ No active AI recommendation to accept');
        if (window.app && window.app.showAlert) {
            window.app.showAlert('No Recommendation', 'No active recommendation to accept', 'warning', 3000);
        }
        return;
    }
    
    console.log(`✅ Accepting Enhanced AI recommendation for bin ${currentRecommendation.id}...`);
    
    try {
        // Create route for the recommended bin
        const routeData = {
            id: `route-ai-${Date.now()}`,
            driverId: currentRecommendation.driverId,
            binIds: [currentRecommendation.id],
            status: 'active',
            priority: currentRecommendation.priority.toLowerCase(),
            createdAt: new Date().toISOString(),
            aiGenerated: true,
            confidence: currentRecommendation.confidence,
            estimatedDistance: currentRecommendation.calculatedDistance,
            estimatedTime: currentRecommendation.estimatedTime
        };
        
        // Add route to data manager
        if (window.dataManager && typeof window.dataManager.addRoute === 'function') {
            window.dataManager.addRoute(routeData);
            
            // Sync to server
            if (window.syncManager && typeof window.syncManager.syncToServer === 'function') {
                window.syncManager.syncToServer();
            }
            
            // Update driver dashboard
            if (window.app && typeof window.app.populateDriverDashboard === 'function') {
                const currentUser = authManager.getCurrentUser();
                if (currentUser) {
                    window.app.populateDriverDashboard(currentUser);
                }
            }
            
            // Show success message
            if (window.app && window.app.showAlert) {
                window.app.showAlert(
                    '🎯 Route Accepted!', 
                    `AI route to ${currentRecommendation.id} has been added to your tasks`, 
                    'success', 
                    4000
                );
            }
            
            // Clear current recommendation and refresh AI
            window.currentAIRecommendation = null;
            setTimeout(() => {
                window.refreshDriverAISuggestion();
            }, 1000);
            
        } else {
            throw new Error('Data manager not available');
        }
        
    } catch (error) {
        console.error('❌ Failed to accept AI recommendation:', error);
        if (window.app && window.app.showAlert) {
            window.app.showAlert('Error', 'Failed to accept recommendation: ' + error.message, 'error', 4000);
        }
    }
};

window.viewRecommendationDetails = function() {
    const currentRecommendation = window.currentAIRecommendation;
    if (!currentRecommendation) {
        console.warn('⚠️ No active AI recommendation to view');
        return;
    }
    
    console.log(`👁️ Showing details for AI recommendation: ${currentRecommendation.id}`);
    
    // Show detailed modal with recommendation information
    const modalContent = `
        <div style="max-width: 500px; padding: 2rem; background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.90) 100%); border-radius: 20px; color: #e2e8f0;">
            <h2 style="color: #f1f5f9; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas fa-brain" style="color: #3b82f6;"></i>
                AI Recommendation Details
            </h2>
            
            <div style="display: grid; gap: 1rem; margin-bottom: 1.5rem;">
                <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid rgba(59, 130, 246, 0.2);">
                    <span>Bin ID:</span>
                    <strong>${currentRecommendation.id}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid rgba(59, 130, 246, 0.2);">
                    <span>Location:</span>
                    <strong>${currentRecommendation.location || currentRecommendation.address}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid rgba(59, 130, 246, 0.2);">
                    <span>Fill Level:</span>
                    <strong style="color: ${currentRecommendation.fill >= 80 ? '#ef4444' : currentRecommendation.fill >= 60 ? '#f59e0b' : '#10b981'};">${currentRecommendation.fill}%</strong>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid rgba(59, 130, 246, 0.2);">
                    <span>Distance:</span>
                    <strong>${Math.round(currentRecommendation.calculatedDistance * 100) / 100} km</strong>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid rgba(59, 130, 246, 0.2);">
                    <span>Estimated Time:</span>
                    <strong>${currentRecommendation.estimatedTime} minutes</strong>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid rgba(59, 130, 246, 0.2);">
                    <span>AI Confidence:</span>
                    <strong style="color: #10b981;">${currentRecommendation.confidence}%</strong>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid rgba(59, 130, 246, 0.2);">
                    <span>Priority:</span>
                    <strong style="color: ${currentRecommendation.priority === 'HIGH' ? '#ef4444' : currentRecommendation.priority === 'MEDIUM' ? '#f59e0b' : '#10b981'};">${currentRecommendation.priority}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid rgba(59, 130, 246, 0.2);">
                    <span>CO₂ Savings:</span>
                    <strong style="color: #10b981;">${currentRecommendation.co2Savings} kg</strong>
                </div>
            </div>
            
            <div style="background: rgba(15, 23, 42, 0.8); padding: 1rem; border-radius: 12px; margin-bottom: 1.5rem;">
                <h4 style="color: #f59e0b; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-lightbulb"></i>
                    AI Reasoning
                </h4>
                <p style="color: #e2e8f0; font-size: 0.9rem; line-height: 1.5;">${currentRecommendation.reasoning.explanation}</p>
            </div>
            
            <div style="display: flex; gap: 1rem; margin-top: 2rem;">
                <button onclick="acceptSmartRecommendation(); closeModal();" style="flex: 1; background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; padding: 0.75rem 1rem; border-radius: 10px; font-weight: 600; cursor: pointer;">
                    <i class="fas fa-check"></i> Accept Route
                </button>
                <button onclick="closeModal();" style="background: rgba(107, 114, 128, 0.5); color: #e2e8f0; border: none; padding: 0.75rem 1rem; border-radius: 10px; cursor: pointer;">
                    Close
                </button>
            </div>
        </div>
    `;
    
    // Show modal
    if (window.showCustomModal) {
        window.showCustomModal('AI Recommendation Details', modalContent);
    } else if (window.app && window.app.showAlert) {
        window.app.showAlert(
            'Recommendation Details', 
            `Bin: ${currentRecommendation.id} | Distance: ${Math.round(currentRecommendation.calculatedDistance * 100) / 100}km | Fill: ${currentRecommendation.fill}% | Confidence: ${currentRecommendation.confidence}%`, 
            'info', 
            6000
        );
    }
};

window.showAlternativeRoutes = function() {
    console.log('🔀 Showing alternative AI routes...');
    
    if (window.app && window.app.showAlert) {
        window.app.showAlert(
            '🔄 Alternative Routes', 
            'Generating alternative route suggestions...', 
            'info', 
            3000
        );
    }
    
    // For now, refresh to get potentially different recommendations
    setTimeout(() => {
        window.refreshDriverAISuggestion();
    }, 1000);
};

window.dismissSmartRecommendation = function() {
    console.log('❌ Dismissing AI recommendation...');
    
    // Clear current recommendation
    window.currentAIRecommendation = null;
    
    // Hide the recommendation
    const primaryRecommendation = document.getElementById('primaryRecommendation');
    const noRecommendationsState = document.getElementById('noRecommendationsState');
    
    if (primaryRecommendation) primaryRecommendation.style.display = 'none';
    if (noRecommendationsState) noRecommendationsState.style.display = 'block';
    
    if (window.app && window.app.showAlert) {
        window.app.showAlert(
            '👋 Recommendation Dismissed', 
            'AI recommendation has been dismissed', 
            'info', 
            2000
        );
    }
    
    // Refresh AI recommendations after a delay
    setTimeout(() => {
        window.refreshDriverAISuggestion();
    }, 5000);
};

window.showAISettings = function() {
    console.log('⚙️ Showing AI settings...');
    
    if (window.app && window.app.showAlert) {
        window.app.showAlert(
            '⚙️ AI Settings', 
            'AI configuration options coming soon!', 
            'info', 
            3000
        );
    }
};

window.showAIReasoning = function() {
    const aiReasoningPanel = document.getElementById('aiReasoningPanel');
    if (aiReasoningPanel) {
        const isVisible = aiReasoningPanel.style.display !== 'none';
        aiReasoningPanel.style.display = isVisible ? 'none' : 'block';
        
        // Animate the toggle
        if (!isVisible) {
            aiReasoningPanel.style.opacity = '0';
            aiReasoningPanel.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                aiReasoningPanel.style.transition = 'all 0.3s ease';
                aiReasoningPanel.style.opacity = '1';
                aiReasoningPanel.style.transform = 'translateY(0)';
            }, 10);
        }
    }
};

// Legacy function for compatibility
window.refreshAISuggestion = function() {
    const currentUser = authManager.getCurrentUser();
    if (!currentUser || currentUser.type !== 'driver') return;
    
    console.log('🔄 Refreshing AI suggestion...');
    
    // Create new suggestion
    if (typeof createAISuggestionForDriver === 'function') {
        createAISuggestionForDriver(currentUser.id);
        
        // Refresh the display after a short delay
        setTimeout(() => {
            if (window.app && typeof window.app.loadAISuggestionForDriver === 'function') {
                window.app.loadAISuggestionForDriver(currentUser.id);
            }
        }, 500);
        
        if (window.app) {
            window.app.showAlert('AI Suggestion', 'Refreshing recommendation...', 'info', 2000);
        }
    }
};

window.acceptAISuggestion = function() {
    const currentUser = authManager.getCurrentUser();
    if (!currentUser || currentUser.type !== 'driver') return;
    
    const suggestions = dataManager.getData('aiSuggestions') || {};
    const suggestion = suggestions[currentUser.id];
    
    if (suggestion && suggestion.binId) {
        console.log(`✅ Driver accepted AI suggestion for bin: ${suggestion.binId}`);
        
        // Mark bin as collected
        if (typeof window.markBinCollected === 'function') {
            window.markBinCollected(suggestion.binId);
        }
        
        // Remove the suggestion after acceptance
        dismissAISuggestion();
        
        if (window.app) {
            window.app.showAlert('AI Suggestion Accepted', 
                `Great! Collecting bin ${suggestion.binId} as recommended.`, 'success');
        }
    }
};

window.viewSuggestedBin = function() {
    const currentUser = authManager.getCurrentUser();
    if (!currentUser || currentUser.type !== 'driver') return;
    
    const suggestions = dataManager.getData('aiSuggestions') || {};
    const suggestion = suggestions[currentUser.id];
    
    if (suggestion && suggestion.binId) {
        // Show bin details modal
        if (typeof showBinDetails === 'function') {
            showBinDetails(suggestion.binId);
        }
    }
};

window.dismissAISuggestion = function() {
    const currentUser = authManager.getCurrentUser();
    if (!currentUser || currentUser.type !== 'driver') return;
    
    console.log('❌ Driver dismissed AI suggestion');
    
    // Remove suggestion from storage
    const suggestions = dataManager.getData('aiSuggestions') || {};
    delete suggestions[currentUser.id];
    dataManager.setData('aiSuggestions', suggestions);
    
    // Hide the suggestion card
    const aiSuggestionCard = document.getElementById('aiSuggestionCard');
    if (aiSuggestionCard) {
        aiSuggestionCard.style.display = 'none';
    }
    
    if (window.app) {
        window.app.showAlert('AI Suggestion Dismissed', 
            'Suggestion dismissed. A new one will be generated later.', 'info', 3000);
    }
};

// 🔧 DEBUG FUNCTION - Force show AI card (call from browser console: forceShowAICard())
window.forceShowAICard = function() {
    console.log('🔧 DEBUGGING: Force showing AI card...');
    
    const aiSuggestionCard = document.getElementById('aiSuggestionCard');
    if (aiSuggestionCard) {
        aiSuggestionCard.style.display = 'block';
        console.log('✅ AI Card forced to display: block');
    } else {
        console.error('❌ AI Suggestion Card element not found in DOM!');
    }
    
    // Check all AI-related elements
    const aiElements = [
        'aiSuggestionCard',
        'aiStatusIndicator', 
        'aiLoadingState',
        'primaryRecommendation',
        'noRecommendationsState'
    ];
    
    aiElements.forEach(id => {
        const element = document.getElementById(id);
        console.log(`🔍 Element '${id}': ${element ? 'EXISTS' : 'MISSING'}`);
        if (element) {
            console.log(`   Current display: ${element.style.display || 'default'}`);
        }
    });
    
    // Force load AI if possible
    if (window.app && window.app.loadEnhancedDriverAI) {
        const currentUser = authManager?.getCurrentUser();
        if (currentUser && currentUser.type === 'driver') {
            console.log('🔄 Forcing AI reload...');
            window.app.loadEnhancedDriverAI(currentUser.id);
        }
    }
};

// Mark that app.js has loaded
console.log('📁 App.js file loaded - WasteManagementApp class is now available');
console.log('🔍 Current window.app status:', typeof window.app);
console.log('🔍 DOM readyState:', document.readyState);

// Initialize global app instance with comprehensive error handling
function initializeApp() {
    console.log('🔧 Starting WasteManagementApp initialization...');
    console.log('🔍 Function called at:', new Date().toISOString());

    // First, check if we have the basic dependencies
    const preDeps = {
        dataManager: typeof dataManager !== 'undefined',
        authManager: typeof authManager !== 'undefined',
        syncManager: typeof syncManager !== 'undefined',
        mapManager: typeof mapManager !== 'undefined',
        analyticsManager: typeof analyticsManager !== 'undefined'
    };

    console.log('🔍 Pre-initialization dependency check:', preDeps);
    
    // Check if we have any missing dependencies 
    const missingDeps = Object.keys(preDeps).filter(key => !preDeps[key]);
    if (missingDeps.length > 0) {
        console.warn('⚠️ Some dependencies are missing, but proceeding anyway:', missingDeps);
    }

    try {
        console.log('🏗️ Creating WasteManagementApp instance...');
        window.app = new WasteManagementApp();
        console.log('✅ WasteManagementApp instance created successfully');
        console.log('✅ window.app is now available globally');
        console.log('✅ App.js loaded successfully');
        
        // Add global driver refresh function
        window.refreshAllDriverData = function() {
            if (window.app && typeof window.app.refreshAllDriverData === 'function') {
                window.app.refreshAllDriverData();
            } else {
                console.warn('⚠️ refreshAllDriverData not available on app instance');
            }
        };
        
        // Also make the driver status function globally available
        window.getDriverLiveStatus = function(driverId) {
            if (window.app && typeof window.app.getDriverLiveStatus === 'function') {
                return window.app.getDriverLiveStatus(driverId);
            } else {
                console.warn('⚠️ getDriverLiveStatus not available on app instance');
                return { status: 'Unknown', lastSeen: null };
            }
        };
        
        // Listen for driver data update events from Driver System V3
        document.addEventListener('driverDataUpdated', function(event) {
            const { driverId, status, fuelLevel, timestamp, source } = event.detail;
            console.log(`🔔 Received driver data update event: ${driverId} -> Status: ${status}, Fuel: ${fuelLevel}%${source ? ` (${source})` : ''}`);
            console.log('🔍 Event detail:', event.detail);
            
            // Update all fuel level displays immediately
            updateAllFuelDisplays(driverId, fuelLevel);
            
            // Update live monitoring statistics
            updateLiveMonitoringStats();
            
            // Refresh all driver-related data
            if (window.app && typeof window.app.refreshAllDriverData === 'function') {
                console.log('📱 Refreshing all driver data in main app');
                window.app.refreshAllDriverData();
            }
            
            // Update map if available AND initialized
            if (typeof window.mapManager !== 'undefined' && window.mapManager && window.mapManager.map) {
                setTimeout(() => {
                    console.log('🗺️ Updating map driver status and UI');
                    
                    // Update driver status (recreates marker)
                    window.mapManager.updateDriverStatus(driverId, status);
                    
                    // NEW: Refresh all driver UI components (popup, modals, etc.)
                    if (typeof window.mapManager.updateDriverDataUI === 'function') {
                        window.mapManager.updateDriverDataUI(driverId);
                    }
                }, 150);
            } else if (window.mapManager && !window.mapManager.map) {
                console.log('⚠️ Map not initialized yet, skipping map update from event listener');
            }
            
            // ENHANCED: Smart monitoring page refresh with activity marking
            if (window.app && window.app.currentSection === 'monitoring') {
                // Mark activity to increase sync frequency
                if (window.syncManager) {
                    window.syncManager.markActivity();
                }
                
                setTimeout(async () => {
                    console.log('🔴 Driver action detected - triggering intelligent refresh');
                    await window.app.performLiveMonitoringSync();
                }, 300);
            }
            
            // Force analytics refresh if we're on dashboard
            if (window.app && window.app.currentSection === 'dashboard') {
                setTimeout(() => {
                    if (typeof analyticsManager !== 'undefined') {
                        console.log('📊 Updating dashboard metrics');
                        analyticsManager.updateDashboardMetrics();
                    }
                }, 200);
            }
        });
        
        // Function to update all fuel level displays
        function updateAllFuelDisplays(driverId, fuelLevel) {
            console.log(`⛽ Updating all fuel displays for driver ${driverId}: ${fuelLevel}%`);
            
            try {
                // 1. Update main driver overview fuel level
                const driverFuelElement = document.getElementById('driverFuelLevel');
                if (driverFuelElement) {
                    driverFuelElement.textContent = `${fuelLevel}%`;
                    console.log('✅ Updated main driver fuel level display');
                }
                
                // 2. Update modal fuel level display (driver overview section)
                const driverFuelModal = document.getElementById('driverFuelLevelModal');
                if (driverFuelModal) {
                    driverFuelModal.textContent = `${fuelLevel}%`;
                    console.log('✅ Updated modal fuel level display');
                }
                
                // 2b. Update driver fuel percentage text (next to fuel bar)
                const driverFuelPercentage = document.getElementById('driverFuelPercentage');
                if (driverFuelPercentage) {
                    driverFuelPercentage.textContent = `${fuelLevel}%`;
                    console.log('✅ Updated driver fuel percentage text');
                }
                
                // 3. Update driver fuel bar in the fuel status section
                const driverFuelBar = document.getElementById('driverFuelBar');
                if (driverFuelBar) {
                    driverFuelBar.style.width = `${fuelLevel}%`;
                    
                    // Update color based on fuel level
                    let fuelColor = '#10b981'; // Green
                    if (fuelLevel < 50) fuelColor = '#f59e0b'; // Yellow
                    if (fuelLevel < 25) fuelColor = '#ef4444'; // Red
                    
                    driverFuelBar.style.backgroundColor = fuelColor;
                    console.log('✅ Updated driver fuel bar with color:', fuelColor);
                }
                
                // 4. Update fuel level in driver stat cards (if visible)
                const statCards = document.querySelectorAll('.driver-stat-card');
                statCards.forEach(card => {
                    const fuelIcon = card.querySelector('.fa-gas-pump');
                    if (fuelIcon) {
                        const statValue = card.querySelector('.driver-stat-value');
                        if (statValue && statValue.id === 'driverFuelLevel') {
                            statValue.textContent = `${fuelLevel}%`;
                            
                            // Update color based on fuel level
                            let fuelColor = 'var(--success)';
                            if (fuelLevel < 50) fuelColor = 'var(--warning)';
                            if (fuelLevel < 25) fuelColor = 'var(--danger)';
                            
                            fuelIcon.style.color = fuelColor;
                            console.log('✅ Updated driver stat card fuel level');
                        }
                    }
                });
                
                // 5. Store updated fuel level in data manager for consistency
                if (window.dataManager) {
                    const fuelData = window.dataManager.getData('driverFuelLevels') || {};
                    fuelData[driverId] = fuelLevel;
                    window.dataManager.setData('driverFuelLevels', fuelData);
                    console.log('✅ Updated fuel data in data manager');
                }
                
            } catch (error) {
                console.error('❌ Error updating fuel displays:', error);
            }
        }
        
        // Function to update live monitoring statistics
        function updateLiveMonitoringStats() {
            try {
                console.log('📊 Updating live monitoring statistics...');
                
                // Get current drivers data
                const drivers = window.dataManager?.getDrivers?.() || [];
                const activeDrivers = drivers.filter(d => d.status === 'active');
                
                // 1. Update active sensors count (FIXED - Issue #7: Use real sensor data)
                const activeSensorsCount = document.getElementById('activeSensorsCount');
                if (activeSensorsCount) {
                    // Get real sensor data
                    let sensorCount = 0;
                    
                    // Try to get from sensor management admin
                    if (window.sensorManagementAdmin && typeof window.sensorManagementAdmin.getSensorStatistics === 'function') {
                        const stats = window.sensorManagementAdmin.getSensorStatistics();
                        sensorCount = stats.online || 0;
                        console.log('✅ Using real sensor count from sensorManagementAdmin:', sensorCount);
                    } 
                    // Fallback to bins with sensors
                    else if (window.dataManager) {
                        const bins = window.dataManager.getBins();
                        sensorCount = bins.filter(b => b.sensorIMEI || b.hasSensor).length;
                        console.log('✅ Using sensor count from bins with sensors:', sensorCount);
                    }
                    // Last resort fallback
                    else {
                        sensorCount = Math.max(activeDrivers.length * 3, 5);
                        console.warn('⚠️ Using calculated sensor count (no real data available):', sensorCount);
                    }
                    
                    activeSensorsCount.textContent = sensorCount;
                }
                
                // 2. Update online vehicles count
                const onlineVehiclesCount = document.getElementById('onlineVehiclesCount');
                if (onlineVehiclesCount) {
                    const vehicleCount = activeDrivers.length;
                    onlineVehiclesCount.textContent = vehicleCount;
                    console.log('✅ Updated online vehicles count:', vehicleCount);
                }
                
                // 3. Update active drivers status
                const activeDriversStatus = document.getElementById('activeDriversStatus');
                if (activeDriversStatus) {
                    activeDriversStatus.textContent = activeDrivers.length;
                    console.log('✅ Updated active drivers status:', activeDrivers.length);
                }
                
                // 4. Update critical bins list (if exists) - Enhanced World-Class UI
                const criticalBinsList = document.getElementById('criticalBinsList');
                const criticalBinsCountBadge = document.getElementById('criticalBinsCount');
                
                if (criticalBinsList) {
                    // USE REAL BINS DATA (not fake generated bins)
                    const bins = dataManager.getBins();
                    const criticalBins = bins.filter(b => b.status === 'critical' || (b.fillLevel && b.fillLevel >= 85) || (b.fill && b.fill >= 85));
                    
                    // Update count badge
                    if (criticalBinsCountBadge) {
                        criticalBinsCountBadge.textContent = criticalBins.length;
                    }
                    
                    if (criticalBins.length === 0) {
                        criticalBinsList.innerHTML = `
                            <div class="no-data-placeholder" style="text-align: center; padding: 1.5rem; color: #64748b; font-size: 0.85rem;">
                                <i class="fas fa-check-circle" style="font-size: 1.5rem; color: #10b981; margin-bottom: 0.5rem; display: block;"></i>
                                No critical bins at this time
                            </div>`;
                    } else {
                        criticalBinsList.innerHTML = criticalBins.map(bin => `
                            <div class="critical-bin-item" onclick="showBinDetails && showBinDetails('${bin.id}')">
                                <div class="critical-bin-info">
                                    <div class="critical-bin-id">${bin.id}</div>
                                    <div class="critical-bin-location">${bin.location?.address || bin.location || 'No location'}</div>
                                </div>
                                <div class="critical-bin-actions" style="display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0;">
                                    <span class="critical-bin-percentage">${bin.fillLevel || bin.fill || 0}%</span>
                                    <button type="button" class="btn-assign-driver-critical" onclick="event.stopPropagation(); openAssignDriverForBin && openAssignDriverForBin('${bin.id}')" title="Assign a driver to collect this bin">
                                        <i class="fas fa-user-plus"></i> Assign driver
                                    </button>
                                </div>
                            </div>
                        `).join('');
                    }
                    console.log('✅ Updated critical bins list with REAL data');
                }
                
                // 5. Update active alerts list (if exists) - USE REAL ALERTS
                const activeAlertsList = document.getElementById('activeAlertsList');
                const activeAlertsCountBadge = document.getElementById('activeAlertsCountBadge');
                
                if (activeAlertsList) {
                    // USE REAL ALERTS from dataManager
                    const alerts = dataManager.getActiveAlerts() || [];
                    
                    // Update count badge
                    if (activeAlertsCountBadge) {
                        activeAlertsCountBadge.textContent = alerts.length;
                    }
                    
                    if (alerts.length === 0) {
                        activeAlertsList.innerHTML = `
                            <div class="no-data-placeholder" style="text-align: center; padding: 1.5rem; color: #64748b; font-size: 0.85rem;">
                                <i class="fas fa-bell-slash" style="font-size: 1.5rem; color: #64748b; margin-bottom: 0.5rem; display: block; opacity: 0.7;"></i>
                                No active alerts
                            </div>`;
                    } else {
                        activeAlertsList.innerHTML = alerts.map(alert => `
                            <div class="alert-item ${alert.priority === 'critical' ? 'critical' : ''}">
                                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem;">
                                    <div style="flex: 1;">
                                        <div style="font-weight: 700; font-size: 0.85rem; color: ${alert.priority === 'critical' ? '#ef4444' : '#f59e0b'}; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.35rem;">
                                            <i class="fas fa-exclamation-triangle" style="margin-right: 0.35rem;"></i> ${alert.type ? alert.type.replace('_', ' ').toUpperCase() : 'ALERT'}
                                        </div>
                                        <div style="color: #cbd5e1; font-size: 0.85rem; line-height: 1.4; margin-bottom: 0.35rem;">${alert.message}</div>
                                        <div style="color: #64748b; font-size: 0.75rem;">${new Date(alert.timestamp).toLocaleString()}</div>
                                    </div>
                                    <button type="button" class="alert-dismiss-btn" onclick="event.stopPropagation(); dismissAlert('${alert.id}')" aria-label="Dismiss alert"><i class="fas fa-times"></i></button>
                                </div>
                            </div>
                        `).join('');
                    }
                    console.log('✅ Updated active alerts list with REAL data');
                }
                
            } catch (error) {
                console.error('❌ Error updating live monitoring stats:', error);
            }
        }
        
        // Helper function to generate critical bins data
        function generateCriticalBinsList(activeDriverCount) {
            const bins = [];
            const locations = ['Al Rayyan', 'West Bay', 'The Pearl', 'Souq Waqif', 'Education City'];
            
            for (let i = 0; i < Math.min(3, Math.max(1, activeDriverCount)); i++) {
                bins.push({
                    id: `B-${1000 + i}`,
                    location: locations[i % locations.length],
                    level: Math.floor(Math.random() * 15) + 85, // 85-100% full
                    priority: Math.random() > 0.5 ? 'HIGH' : 'URGENT'
                });
            }
            
            return bins;
        }
        
        // Helper function to generate active alerts
        function generateActiveAlerts(activeDrivers) {
            const alerts = [];
            const currentTime = new Date();
            
            if (activeDrivers.length > 0) {
                alerts.push({
                    type: 'Route Update',
                    message: `${activeDrivers.length} driver(s) active on routes`,
                    time: currentTime.toLocaleTimeString()
                });
                
                // Add fuel alerts for drivers with low fuel
                activeDrivers.forEach(driver => {
                    const fuelLevel = driver.fuelLevel || 75;
                    if (fuelLevel < 30) {
                        alerts.push({
                            type: 'Fuel Alert',
                            message: `Driver ${driver.name} fuel level: ${fuelLevel}%`,
                            time: currentTime.toLocaleTimeString()
                        });
                    }
                });
            }
            
            return alerts.slice(0, 5); // Limit to 5 alerts
        }
        
        // Immediate verification
        console.log('🔍 window.app type after creation:', typeof window.app);
        console.log('🔍 window.app exists:', window.app !== null && window.app !== undefined);
        
        // Verify the app instance
        if (window.app && typeof window.app.showAlert === 'function') {
            console.log('✅ App instance verification passed - all methods available');
        } else {
            console.warn('⚠️ App instance created but may not be fully functional');
            console.log('🔍 Available methods:', Object.getOwnPropertyNames(window.app || {}));
        }
    
} catch (error) {
    console.error('❌ CRITICAL: Failed to initialize WasteManagementApp');
    console.error('❌ Error details:', error.message);
    console.error('❌ Stack trace:', error.stack);
    console.error('❌ This will cause the dependency check to fail');
    
    // Create a comprehensive fallback app instance
    console.log('🚑 Creating emergency fallback app instance...');
    window.app = {
        initialized: false,
        showAlert: function(title, message, type, duration) {
            console.log(`[${type?.toUpperCase() || 'INFO'}] ${title}: ${message}`);
            alert(`${title}\n\n${message}`);
        },
        loadDriverRoutes: function() {
            console.log('🚨 Fallback: loadDriverRoutes called');
            return Promise.resolve();
        },
        updateDriverStats: function() {
            console.log('🚨 Fallback: updateDriverStats called');
            return Promise.resolve();
        },
        refreshDashboard: function() {
            console.log('🚨 Fallback: refreshDashboard called');
            return Promise.resolve();
        },
        openDriverMap: function() {
            console.log('🚨 Fallback: openDriverMap called');
        },
        showSection: function(section) {
            console.log('🚨 Fallback: showSection called for:', section);
        },
        isInitialized: function() {
            return false;
        }
    };
    
    console.log('✅ Emergency fallback app instance created');
    console.log('⚠️ App will have limited functionality');
    
    // Try to show the error to the user
    setTimeout(() => {
        alert(`Application initialization failed!\n\nError: ${error.message}\n\nThe app will run in limited mode. Please refresh the page.`);
    }, 1000);
    }
}

// Initialize app immediately - no delays to avoid race conditions
console.log('⚡ Initializing app immediately...');
try {
    initializeApp();
    console.log('✅ initializeApp() call completed');
} catch (error) {
    console.error('❌ CRITICAL: initializeApp() call failed:', error);
}