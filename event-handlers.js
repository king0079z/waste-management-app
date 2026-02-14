// Event Handlers - Cleaned Version (Driver buttons moved to enhanced-driver-buttons.js)

function setupEventHandlers() {
    console.log('Setting up event handlers...');
    
    // Setup sync status updates
    setupSyncStatusUpdates();
    
    // Login error banner and reset-password panel refs
    const loginErrorBanner = document.getElementById('loginErrorBanner');
    const loginErrorText = document.getElementById('loginErrorText');
    function showLoginError(message) {
        if (loginErrorBanner && loginErrorText) {
            loginErrorText.textContent = message || 'Username or password is incorrect. Please try again.';
            loginErrorBanner.style.display = 'flex';
        }
    }
    function hideLoginError() {
        if (loginErrorBanner) loginErrorBanner.style.display = 'none';
    }

    // Login Form Handler
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            hideLoginError();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            console.log('Login attempt:', { username, userType: window.selectedUserType });
            try {
                const result = await authManager.login(username, password, window.selectedUserType);
                if (result.success) {
                    console.log('Login successful!');
                    if (window.app) window.app.handleSuccessfulLogin();
                } else {
                    console.error('Login failed:', result.error);
                    if (result.error === 'USER_OR_PASSWORD_INVALID') {
                        showLoginError('Username or password is incorrect. Please try again.');
                    } else if (window.app) {
                        window.app.showAlert('Login Failed', result.error, 'danger');
                    }
                }
            } catch (error) {
                console.error('Login error:', error);
                if (window.app) {
                    window.app.showAlert('Login Error', 'An unexpected error occurred. Please try again.', 'danger');
                }
            }
        });
    }
    // Clear login error when user types
    ['username', 'password'].forEach(function(id) {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', hideLoginError);
    });

    // Forgot password / Reset password
    const showResetPasswordLink = document.getElementById('showResetPasswordLink');
    const resetPasswordPanel = document.getElementById('resetPasswordPanel');
    const closeResetPasswordBtn = document.getElementById('closeResetPasswordBtn');
    const submitResetPasswordBtn = document.getElementById('submitResetPasswordBtn');
    const resetPasswordMessage = document.getElementById('resetPasswordMessage');
    const resetPasswordUsername = document.getElementById('resetPasswordUsername');
    const resetPasswordNew = document.getElementById('resetPasswordNew');
    const resetPasswordConfirm = document.getElementById('resetPasswordConfirm');
    function showResetPasswordPanel() {
        if (resetPasswordPanel) resetPasswordPanel.style.display = 'block';
        hideLoginError();
        if (resetPasswordUsername) { resetPasswordUsername.value = ''; resetPasswordUsername.focus(); }
        if (resetPasswordNew) resetPasswordNew.value = '';
        if (resetPasswordConfirm) resetPasswordConfirm.value = '';
        if (resetPasswordMessage) { resetPasswordMessage.style.display = 'none'; resetPasswordMessage.textContent = ''; }
    }
    function hideResetPasswordPanel() {
        if (resetPasswordPanel) resetPasswordPanel.style.display = 'none';
        if (resetPasswordMessage) { resetPasswordMessage.style.display = 'none'; resetPasswordMessage.textContent = ''; }
    }
    if (showResetPasswordLink) {
        showResetPasswordLink.addEventListener('click', function(e) { e.preventDefault(); showResetPasswordPanel(); });
    }
    if (closeResetPasswordBtn) {
        closeResetPasswordBtn.addEventListener('click', hideResetPasswordPanel);
    }
    if (submitResetPasswordBtn) {
        submitResetPasswordBtn.addEventListener('click', async function() {
            const username = (resetPasswordUsername && resetPasswordUsername.value) ? resetPasswordUsername.value.trim() : '';
            const newPwd = resetPasswordNew ? resetPasswordNew.value : '';
            const confirmPwd = resetPasswordConfirm ? resetPasswordConfirm.value : '';
            if (!resetPasswordMessage) return;
            resetPasswordMessage.style.display = 'block';
            resetPasswordMessage.style.background = '';
            resetPasswordMessage.style.color = '';
            if (!username) {
                resetPasswordMessage.textContent = 'Please enter your username.';
                resetPasswordMessage.style.background = 'rgba(239,68,68,0.15)';
                resetPasswordMessage.style.color = '#fca5a5';
                return;
            }
            if (newPwd.length < 6) {
                resetPasswordMessage.textContent = 'New password must be at least 6 characters.';
                resetPasswordMessage.style.background = 'rgba(239,68,68,0.15)';
                resetPasswordMessage.style.color = '#fca5a5';
                return;
            }
            if (newPwd !== confirmPwd) {
                resetPasswordMessage.textContent = 'New password and confirmation do not match.';
                resetPasswordMessage.style.background = 'rgba(239,68,68,0.15)';
                resetPasswordMessage.style.color = '#fca5a5';
                return;
            }
            if (typeof dataManager === 'undefined' || !dataManager.getUserByUsername) {
                resetPasswordMessage.textContent = 'System not ready. Please refresh and try again.';
                resetPasswordMessage.style.background = 'rgba(239,68,68,0.15)';
                resetPasswordMessage.style.color = '#fca5a5';
                return;
            }
            const user = dataManager.getUserByUsername(username);
            if (!user) {
                resetPasswordMessage.textContent = 'No account found with that username.';
                resetPasswordMessage.style.background = 'rgba(239,68,68,0.15)';
                resetPasswordMessage.style.color = '#fca5a5';
                return;
            }
            try {
                dataManager.updateUser(user.id, { password: newPwd });
                if (typeof syncManager !== 'undefined' && typeof syncManager.syncToServer === 'function') {
                    await syncManager.syncToServer({ users: dataManager.getUsers() }, 'partial');
                }
                resetPasswordMessage.textContent = 'Password updated. You can log in with your new password.';
                resetPasswordMessage.style.background = 'rgba(34,197,94,0.2)';
                resetPasswordMessage.style.color = '#86efac';
                resetPasswordUsername.value = '';
                resetPasswordNew.value = '';
                resetPasswordConfirm.value = '';
                setTimeout(hideResetPasswordPanel, 2000);
            } catch (err) {
                console.error('Reset password error:', err);
                resetPasswordMessage.textContent = 'Something went wrong. Please try again.';
                resetPasswordMessage.style.background = 'rgba(239,68,68,0.15)';
                resetPasswordMessage.style.color = '#fca5a5';
            }
        });
    }

    // New user? Register here – open registration modal
    const showRegistrationLink = document.getElementById('showRegistrationLink');
    const registrationModal = document.getElementById('registrationModal');
    const registrationForm = document.getElementById('registrationForm');
    const regUserTypeEl = document.getElementById('regUserType');
    if (showRegistrationLink) {
        showRegistrationLink.addEventListener('click', function(e) {
            e.preventDefault();
            if (registrationModal) {
                registrationModal.style.display = 'block';
                if (regUserTypeEl) regUserTypeEl.value = 'driver';
            }
        });
    }
    if (registrationForm) {
        registrationForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const userData = {
                userType: (document.getElementById('regUserType') && document.getElementById('regUserType').value) || 'driver',
                name: (document.getElementById('regFullName') && document.getElementById('regFullName').value) || '',
                username: (document.getElementById('regUsername') && document.getElementById('regUsername').value) || '',
                email: (document.getElementById('regEmail') && document.getElementById('regEmail').value) || '',
                phone: (document.getElementById('regPhone') && document.getElementById('regPhone').value) || '',
                password: (document.getElementById('regPassword') && document.getElementById('regPassword').value) || '',
                vehicleId: '',
                license: ''
            };
            try {
                const result = await authManager.register(userData);
                if (result.success) {
                    if (window.app) window.app.showAlert('Registration Submitted', result.message, 'success');
                    if (registrationModal) registrationModal.style.display = 'none';
                    registrationForm.reset();
                } else {
                    if (window.app) window.app.showAlert('Registration Failed', result.error, 'danger');
                }
            } catch (err) {
                console.error('Registration error:', err);
                if (window.app) window.app.showAlert('Registration Failed', err.message || 'An error occurred.', 'danger');
            }
        });
    }
    // Modal close buttons (e.g. registration modal X)
    document.querySelectorAll('.close[data-modal]').forEach(function(closeBtn) {
        closeBtn.addEventListener('click', function() {
            const modalId = this.getAttribute('data-modal');
            if (modalId) {
                const modal = document.getElementById(modalId);
                if (modal) modal.style.display = 'none';
            }
        });
    });
    window.addEventListener('click', function(e) {
        if (e.target.classList && e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
    
    // Initialize default user type (Manager is active by default)
    window.selectedUserType = 'manager';
    
    // User Type Selection (Manager, Driver, Admin buttons)
    document.querySelectorAll('.user-type-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.user-type-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            window.selectedUserType = this.getAttribute('data-user-type');
            console.log('Selected user type:', window.selectedUserType);
        });
    });
    
    // Demo accounts helper
    const demoAccountsBtn = document.getElementById('fixAccountsBtn');
    if (demoAccountsBtn) {
        demoAccountsBtn.addEventListener('click', function() {
            console.log('🔧 Demo accounts button clicked');
            if (typeof dataManager !== 'undefined' && typeof dataManager.ensureDemoAccounts === 'function') {
            dataManager.ensureDemoAccounts();
                if (window.app) {
                    window.app.showAlert('Demo Accounts', 'Demo accounts have been set up!\n\nManager: admin/password\nDriver: driver1/password', 'success');
                }
            } else {
                console.warn('Demo accounts function not available');
            }
        });
    }
    
    // Logout functionality
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            console.log('🚪 Logout clicked');
            if (typeof authManager !== 'undefined' && typeof authManager.logout === 'function') {
                authManager.logout();
                // Reload page to reset all states
                window.location.reload();
            }
        });
    }
    
    // Main navigation
    const sections = document.querySelectorAll('.nav-item');
    sections.forEach(section => {
        section.addEventListener('click', function(e) {
            e.preventDefault();
            if (this.dataset.section && window.app) {
                window.app.showSection(this.dataset.section);
            }
        });
    });

    // FAB Menu Buttons (Enhanced)
    const fabVehicleBtn = document.getElementById('fabVehicleBtn');
    if (fabVehicleBtn) {
        fabVehicleBtn.addEventListener('click', function() {
            console.log('📋 Vehicle Registration FAB clicked');
            if (typeof showVehicleRegistrationModal === 'function') {
                showVehicleRegistrationModal();
            } else {
                console.error('showVehicleRegistrationModal function not available');
                if (window.app) {
                    window.app.showAlert('Feature Error', 'Vehicle registration not available', 'error');
                }
            }
        });
    }
    
    const fabBinBtn = document.getElementById('fabBinBtn');
    if (fabBinBtn) {
        fabBinBtn.addEventListener('click', function() {
            console.log('🗑️ Bin Registration FAB clicked');
            if (typeof showBinRegistrationModal === 'function') {
                showBinRegistrationModal();
            } else {
                console.error('showBinRegistrationModal function not available');
                if (window.app) {
                    window.app.showAlert('Feature Error', 'Bin registration not available', 'error');
                }
            }
        });
    }
    
    const fabIssueBtn = document.getElementById('fabIssueBtn');
    if (fabIssueBtn) {
        fabIssueBtn.addEventListener('click', function() {
            console.log('🚨 Issue Reporting FAB clicked');
            if (typeof showIssueReportingModal === 'function') {
                showIssueReportingModal();
            } else {
                console.error('showIssueReportingModal function not available');
                if (window.app) {
                    window.app.showAlert('Feature Error', 'Issue reporting not available', 'error');
                }
            }
        });
    }
    
    const fabErrorBtn = document.getElementById('fabErrorBtn');
    if (fabErrorBtn) {
        fabErrorBtn.addEventListener('click', function() {
            console.log('📊 Error Logs FAB clicked');
            if (typeof showErrorLogsModal === 'function') {
                showErrorLogsModal();
            } else {
                console.error('showErrorLogsModal function not available');
                if (window.app) {
                    window.app.showAlert('Feature Error', 'Error logs not available', 'error');
                }
            }
        });
    }
    
    // Dashboard Quick Actions (City Dashboard: emergencyResponseBtn, optimizeRoutesBtn)
    const emergencyBtn = document.getElementById('emergencyResponseBtn');
    if (emergencyBtn) {
        emergencyBtn.addEventListener('click', function() {
            console.log('🚨 Emergency Response initiated');
            if (typeof showIssueReportingModal === 'function') {
                showIssueReportingModal();
                setTimeout(() => {
                    const typeSelect = document.getElementById('issueType');
                    const prioritySelect = document.getElementById('issuePriority');
                    if (typeSelect) typeSelect.value = 'safety_concern';
                    if (prioritySelect) prioritySelect.value = 'critical';
                }, 100);
                if (window.app) {
                    window.app.showAlert('Emergency Response', 'Report the emergency issue in the form. Supervisors will be notified.', 'warning');
                }
            } else {
                if (window.app) {
                    window.app.showAlert('Emergency Response', 'Emergency protocols initiated. All supervisors notified.', 'warning');
                }
            }
        });
    }

    const optimizeRoutesBtn = document.getElementById('optimizeRoutesBtn');
    if (optimizeRoutesBtn) {
        optimizeRoutesBtn.addEventListener('click', async function() {
            console.log('🔄 City Dashboard: Optimize All Routes clicked');
            if (typeof performComprehensiveRouteOptimization === 'function') {
                await performComprehensiveRouteOptimization();
                if (window.app) window.app.refreshDashboard();
            } else {
                if (window.app) {
                    window.app.showAlert('Route Optimization', 'Optimizing all routes across the system...', 'info');
                }
            }
        });
    }

    const optimizeBtn = document.getElementById('optimizeAllRoutesBtn');
    if (optimizeBtn) {
        optimizeBtn.addEventListener('click', function() {
            console.log('🎯 Optimize All Routes clicked');
            if (typeof performComprehensiveRouteOptimization === 'function') {
                performComprehensiveRouteOptimization();
            } else {
                console.log('⚠️ performComprehensiveRouteOptimization function not available, using fallback');
                if (window.app) {
                    window.app.showAlert('Route Optimization', 'Optimizing all routes across the system...', 'info');
                }
            }
        });
    }

    const analyticsBtn = document.getElementById('viewAnalyticsBtn');
    if (analyticsBtn) {
        analyticsBtn.addEventListener('click', function() {
            console.log('📊 View Analytics clicked');
            if (window.app) {
                window.app.showSection('analytics');
            }
        });
    }
    
    const refreshDashboardBtn = document.getElementById('refreshDashboardBtn');
    if (refreshDashboardBtn) {
        refreshDashboardBtn.addEventListener('click', function() {
            if (window.app && typeof window.app.refreshDashboard === 'function') {
                refreshDashboardBtn.classList.add('spin-once');
                window.app.refreshDashboard();
                setTimeout(function() { refreshDashboardBtn.classList.remove('spin-once'); }, 600);
            }
        });
    }

    const reportBtn = document.getElementById('generateReportBtn');
    if (reportBtn) {
        reportBtn.addEventListener('click', function() {
            console.log('📊 Generating comprehensive report...');
            
            // Call the PDF report generation function
            if (typeof generateComprehensiveReport === 'function') {
                generateComprehensiveReport();
            } else {
                // Fallback if function not available
                if (window.app) {
                    window.app.showAlert('Report Generation', 
                        'PDF report generation initiated. Please wait...', 'info');
                }
                console.log('⚠️ generateComprehensiveReport function not available');
            }
        });
    }
    
    // Driver Interface Buttons (Non-Action Buttons)
    const refreshGPSBtn = document.getElementById('refreshGPSBtn');
    if (refreshGPSBtn) {
        refreshGPSBtn.addEventListener('click', function() {
            if (typeof mapManager !== 'undefined') {
                mapManager.stopDriverTracking();
                mapManager.startDriverTracking();
            }
            if (window.app) {
                window.app.showAlert('GPS Refresh', 'Refreshing GPS location...', 'info');
            }
        });
    }
    
    // Note: Main Driver Action Buttons (Start Route, Register Pickup, Report Issue, Update Fuel) 
    // are now handled by enhanced-driver-buttons.js for better UI and functionality
    
    const openMapBtn = document.getElementById('openDriverMapBtn');
    if (openMapBtn) {
        openMapBtn.addEventListener('click', function() {
            if (window.app) window.app.openDriverMap();
        });
    }
    
    // Driver Quick Actions
    const scanQRBtn = document.getElementById('scanBinQRBtn');
    if (scanQRBtn) {
        scanQRBtn.addEventListener('click', function() {
            if (window.app) {
                window.app.showAlert('QR Scanner', 'Camera access required for QR scanning', 'info');
            }
        });
    }
    
    const callDispatchBtn = document.getElementById('callDispatchBtn');
    if (callDispatchBtn) {
        callDispatchBtn.addEventListener('click', function() {
            if (window.app) {
                window.app.showAlert('Calling Dispatch', 'Connecting to dispatch center...', 'info');
            }
        });
    }
    
    // ENHANCED: Take Break Button (Coffee Break) - FIXED TO UPDATE OPERATIONS
    const takeBreakBtn = document.getElementById('takeBreakBtn');
    if (takeBreakBtn) {
        takeBreakBtn.addEventListener('click', async function() {
            console.log('☕ Take break button clicked');
            
            // ENHANCED: Mark activity and use intelligent sync
            if (window.syncManager) {
                window.syncManager.markActivity();
            }
            
            // Update driver status to on-break via Driver System V3
            if (window.driverSystemV3Instance && window.driverSystemV3Instance.currentUser) {
                await window.driverSystemV3Instance.handleTakeBreak();
                
                // OPTIMIZED: Use intelligent sync instead of forcing multiple calls
                setTimeout(async () => {
                    if (window.syncManager) {
                        await window.syncManager.performIntelligentSync();
                    }
                    
                    // Intelligent monitoring page refresh
                    if (window.app && window.app.currentSection === 'monitoring') {
                        await window.app.performLiveMonitoringSync();
                    }
                }, 300);
                
            } else {
                // Fallback for non-driver users or when driver system not available
                if (window.app) {
                    window.app.showAlert('Break Time', 'Taking a coffee break...', 'info');
                }
            }
        });
    }
    
    // ENHANCED: End Shift Button - FIXED TO UPDATE OPERATIONS
    const endShiftBtn = document.getElementById('endShiftBtn');
    if (endShiftBtn) {
        endShiftBtn.addEventListener('click', async function() {
            console.log('🔴 End shift button clicked');
            
            // ENHANCED: Mark activity and use intelligent sync
            if (window.syncManager) {
                window.syncManager.markActivity();
            }
            
            if (window.driverSystemV3Instance && window.driverSystemV3Instance.currentUser) {
                await window.driverSystemV3Instance.handleEndShift();
                
                // OPTIMIZED: Use intelligent sync instead of forcing multiple calls
                setTimeout(async () => {
                    if (window.syncManager) {
                        await window.syncManager.performIntelligentSync();
                    }
                    
                    // Intelligent monitoring page refresh
                    if (window.app && window.app.currentSection === 'monitoring') {
                        await window.app.performLiveMonitoringSync();
                    }
                }, 300);
                
            } else {
                if (window.app) {
                    window.app.showAlert('End Shift', 'Ending work shift...', 'warning');
                }
            }
        });
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case 'm':
                    e.preventDefault();
                    if (window.app) window.app.showSection('map');
                    break;
                case 'd':
                    e.preventDefault();
                    if (window.app) window.app.showSection('dashboard');
                    break;
                case 'f':
                    e.preventDefault();
                    if (window.app) window.app.showSection('fleet');
                    break;
                case 'a':
                    e.preventDefault();
                    if (window.app) window.app.showSection('analytics');
                    break;
            }
        }
    });

    // Enhanced Quick Action Functions (for route optimization)
    console.log('✅ Event handlers setup complete (driver buttons handled separately)');
}

// Sync Status Updates
function setupSyncStatusUpdates() {
    if (typeof syncManager !== 'undefined') {
        // Update sync status indicator more frequently and properly
        setInterval(updateSyncStatus, 3000);
        
        // Initial update
        setTimeout(updateSyncStatus, 1000);
    }
}

function updateSyncStatus() {
    const syncStatus = document.getElementById('syncStatus');
    const syncIcon = document.getElementById('syncIcon');
    const syncIndicator = document.getElementById('syncIndicator');
    
    if (!syncStatus || !syncIcon || !syncIndicator) return;
    
    if (typeof syncManager !== 'undefined') {
        const status = syncManager.getSyncStatus();
        
        if (status.enabled && status.online) {
            // ENHANCED: Show connection health and intelligent sync status
            const health = syncManager.connectionHealth || 'good';
            let healthText = '';
            let healthColor = '#10b981';
            
            switch (health) {
                case 'excellent':
                    healthText = '✨ Excellent';
                    healthColor = '#10b981';
                    break;
                case 'good':
                    healthText = '✓ Good';
                    healthColor = '#10b981';
                    break;
                case 'slow':
                    healthText = '⚡ Slow';
                    healthColor = '#f59e0b';
                    break;
                case 'poor':
                    healthText = '⚠️ Poor';
                    healthColor = '#ef4444';
                    break;
                default:
                    healthText = '✓ Connected';
                    healthColor = '#10b981';
            }
            
            // Add WebSocket status indicator
            const wsStatus = window.webSocketManager?.getStatus();
            if (wsStatus?.connected) {
                healthText += ' (RT)'; // Real-time indicator
                syncIcon.className = 'fas fa-bolt'; // Lightning for real-time
            } else {
                syncIcon.className = 'fas fa-cloud-upload-alt';
            }
            
            syncIcon.style.color = healthColor;
            syncIndicator.style.background = healthColor;
            
            if (status.pendingUpdates > 0) {
                syncStatus.innerHTML = `${healthText}<br><span style="font-size: 0.75rem;">Syncing ${status.pendingUpdates} updates...</span>`;
            } else {
                const lastSync = status.lastSync ? 
                    new Date(status.lastSync).toLocaleTimeString() : 'Never';
                
                // Add intelligent sync interval info
                const intervalInfo = syncManager.adaptiveInterval ? 
                    ` (${syncManager.adaptiveInterval/1000}s)` : '';
                
                syncStatus.innerHTML = `${healthText}<br><span style="font-size: 0.75rem;">Last: ${lastSync}${intervalInfo}</span>`;
            }
        } else if (status.enabled && !status.online) {
            // Offline mode
            syncIcon.className = 'fas fa-cloud-download-alt';
            syncIcon.style.color = '#f59e0b';
            syncIndicator.style.background = '#f59e0b';
            
            syncStatus.innerHTML = `⚠️ Offline<br><span style="font-size: 0.75rem;">Working in offline mode</span>`;
        } else {
            // Disabled
            syncIcon.className = 'fas fa-cloud-slash';
            syncIcon.style.color = '#ef4444';
            syncIndicator.style.background = '#ef4444';
            
            syncStatus.innerHTML = `❌ Disabled<br><span style="font-size: 0.75rem;">Sync is disabled</span>`;
            }
        } else {
        // SyncManager not available
        syncIcon.className = 'fas fa-exclamation-triangle';
        syncIcon.style.color = '#ef4444';
        syncIndicator.style.background = '#ef4444';
        
        syncStatus.innerHTML = `❌ Error<br><span style="font-size: 0.75rem;">Sync manager not found</span>`;
    }
}

// ENHANCED: Listen for connection health updates
document.addEventListener('connectionHealthChanged', function(event) {
    const { health, responseTime } = event.detail;
    console.log(`📊 Connection health updated: ${health} (${responseTime}ms)`);
    updateSyncStatus();
});

// ENHANCED: Listen for WebSocket connection updates
document.addEventListener('DOMContentLoaded', function() {
    // Wait for WebSocket manager to be available
    setTimeout(() => {
        if (window.webSocketManager) {
            window.webSocketManager.addEventListener('connected', () => {
                console.log('🔌 WebSocket connected - updating sync status');
                updateSyncStatus();
            });
            
            window.webSocketManager.addEventListener('disconnected', () => {
                console.log('🔌 WebSocket disconnected - updating sync status');
                updateSyncStatus();
            });
        }
    }, 3000);
});

// Route Optimization Functions
async function performComprehensiveRouteOptimization() {
    try {
        console.log('🎯 Starting comprehensive route optimization...');
        
        if (!dataManager) {
            throw new Error('DataManager not available');
        }

        const bins = dataManager.getBins();
        const drivers = dataManager.getUsers().filter(u => u.type === 'driver');
        
        if (bins.length === 0 || drivers.length === 0) {
            if (window.app) {
                window.app.showAlert('Optimization Error', 'No bins or drivers available for optimization', 'warning');
            }
            return;
        }

        // Clear existing routes
        drivers.forEach(driver => {
            const existingRoutes = dataManager.getDriverRoutes(driver.id);
            existingRoutes.forEach(route => {
                if (route.status === 'pending') {
                    dataManager.deleteRoute(route.id);
                }
            });
        });

        // Group bins by urgency and location
        const urgentBins = bins.filter(bin => bin.fill >= 80);
        const mediumBins = bins.filter(bin => bin.fill >= 50 && bin.fill < 80);
        const lowBins = bins.filter(bin => bin.fill < 50);

        let routeCounter = 1;
        const assignedBins = new Set();

        // Assign urgent bins first
        for (const driver of drivers) {
            if (urgentBins.length === 0) break;
            
            const nearestBins = urgentBins
                .filter(bin => !assignedBins.has(bin.id))
                .slice(0, 3); // Max 3 urgent bins per driver
                
            if (nearestBins.length > 0) {
                const route = {
                    id: `ROUTE-${Date.now()}-${routeCounter++}`,
                    driverId: driver.id,
                    binIds: nearestBins.map(bin => bin.id),
                    binDetails: nearestBins,
                    status: 'pending',
                    priority: 'high',
                    estimatedTime: nearestBins.length * 15, // 15 min per bin
                    createdAt: new Date().toISOString()
                };
                
                dataManager.addRoute(route);
                nearestBins.forEach(bin => assignedBins.add(bin.id));
                console.log(`✅ Assigned urgent route to ${driver.name}: ${nearestBins.length} bins`);
            }
        }

        // Assign medium priority bins
        for (const driver of drivers) {
            const availableMediumBins = mediumBins.filter(bin => !assignedBins.has(bin.id));
            if (availableMediumBins.length === 0) continue;
            
            const assignedBinsForDriver = availableMediumBins.slice(0, 4); // Max 4 medium bins
            
            if (assignedBinsForDriver.length > 0) {
                const route = {
                    id: `ROUTE-${Date.now()}-${routeCounter++}`,
                    driverId: driver.id,
                    binIds: assignedBinsForDriver.map(bin => bin.id),
                    binDetails: assignedBinsForDriver,
                    status: 'pending',
                    priority: 'medium',
                    estimatedTime: assignedBinsForDriver.length * 12, // 12 min per bin
                    createdAt: new Date().toISOString()
                };
                
                dataManager.addRoute(route);
                assignedBinsForDriver.forEach(bin => assignedBins.add(bin.id));
                console.log(`✅ Assigned medium route to ${driver.name}: ${assignedBinsForDriver.length} bins`);
            }
        }

        // Update all driver accounts
        await updateAllDriverAccounts();

        // Sync to server
        if (typeof syncManager !== 'undefined') {
            await syncManager.syncToServer();
        }

        const totalAssigned = assignedBins.size;
        const totalBins = bins.length;
            
            if (window.app) {
            window.app.showAlert(
                'Route Optimization Complete',
                `🎯 Successfully optimized routes!\n\nAssigned: ${totalAssigned}/${totalBins} bins\nDrivers: ${drivers.length}\nRoutes created: ${routeCounter - 1}`,
                'success'
            );
        }

        console.log(`🎯 Route optimization complete: ${totalAssigned}/${totalBins} bins assigned`);
        
    } catch (error) {
        console.error('❌ Route optimization failed:', error);
            if (window.app) {
            window.app.showAlert('Optimization Error', `Failed to optimize routes: ${error.message}`, 'error');
        }
    }
}

async function updateAllDriverAccounts() {
    console.log('🔄 Updating all driver accounts...');
    
    // Refresh driver interface if currently shown
    if (window.app && window.app.currentSection === 'driver') {
        window.app.loadDriverRoutes();
    }
    
    // Update AI suggestions for each driver
    const drivers = dataManager.getUsers().filter(u => u.type === 'driver');
    for (const driver of drivers) {
        await createAISuggestionForDriver(driver.id);
    }
    
    console.log('✅ All driver accounts updated');
}

async function createAISuggestionForDriver(driverId) {
    try {
        console.log(`🤖 Creating AI suggestion for driver ${driverId}`);
        
        // Get all bins, not just from routes
        const allBins = dataManager.getBins();
        if (!allBins || allBins.length === 0) {
            console.log('⚠️ No bins available for AI recommendation');
            return null;
        }

        // Filter out bins already assigned to active routes (any driver)
        const allRoutes = dataManager.getRoutes();
        const assignedBinIds = new Set();
        
        allRoutes.forEach(route => {
            if (route.status !== 'completed' && route.status !== 'cancelled') {
                if (route.binIds && Array.isArray(route.binIds)) {
                    route.binIds.forEach(binId => assignedBinIds.add(binId));
                }
                if (route.binId) {
                    assignedBinIds.add(route.binId);
                }
            }
        });

        // Filter available bins (>= 50% full, not assigned, not in maintenance)
        const availableBins = allBins.filter(bin => 
            !assignedBinIds.has(bin.id) &&
            (bin.fill || 0) >= 50 &&
            bin.status !== 'maintenance' &&
            bin.status !== 'offline'
        );

        console.log(`📦 Found ${availableBins.length} available bins for AI recommendation`);
        
        if (availableBins.length === 0) {
            console.log('⚠️ No available bins for AI recommendation');
            return null;
        }

        // Find best bin suggestion from available bins
        const suggestion = await findBestBinSuggestion(availableBins, driverId);
        
        if (suggestion) {
            // Store suggestion
            const suggestions = dataManager.getData('aiSuggestions') || {};
            suggestions[driverId] = suggestion;
            dataManager.setData('aiSuggestions', suggestions);
            
            console.log(`✅ AI suggestion created for driver ${driverId}: ${suggestion.binId}`);
        }
        
        return suggestion;
        
    } catch (error) {
        console.error(`❌ Failed to create AI suggestion for driver ${driverId}:`, error);
        return null;
    }
}

async function findBestBinSuggestion(bins, driverId) {
    if (!bins || bins.length === 0) {
        console.log(`❌ No bins provided for ${driverId}`);
        return null;
    }
    
    console.log(`🔍 Finding best bin suggestion for driver ${driverId} from ${bins.length} bins`);
    
    // COMPREHENSIVE LOCATION RETRIEVAL SYSTEM
    let driverLocation = null;
    let locationSource = 'unknown';
    
    // Step 1: Try data manager first
    try {
        driverLocation = dataManager.getDriverLocation(driverId);
        if (driverLocation && driverLocation.lat && driverLocation.lng) {
            locationSource = 'local_cache';
            console.log(`✅ Found driver location in local cache:`, driverLocation);
            } else {
            console.log(`⚠️ No valid location in local cache for driver ${driverId}`);
        }
    } catch (error) {
        console.error(`❌ Error accessing local driver location:`, error);
    }
    
    // Step 2: Force sync driver locations from server if not found locally
    if (!driverLocation) {
        console.log(`🔄 Force syncing driver locations from server...`);
        try {
            const response = await fetch('/api/driver/locations', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            });
            
            if (response.ok) {
                const locationData = await response.json();
                console.log(`📡 Server locations response:`, locationData);
                
                if (locationData.success && locationData.locations) {
                    // Update ALL driver locations in data manager
                    const serverLocations = locationData.locations;
                    dataManager.setData('driverLocations', serverLocations);
                    console.log(`💾 Updated all driver locations in cache:`, serverLocations);
                    
                    // Now get specific driver location
                    if (serverLocations[driverId]) {
                        driverLocation = serverLocations[driverId];
                        locationSource = 'server_fresh';
                        console.log(`✅ Found driver ${driverId} location from server:`, driverLocation);
                    }
                }
            } else {
                console.error(`❌ Server location fetch failed: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            console.error(`❌ Error fetching locations from server:`, error);
        }
    }
    
    // Step 3: Use fallback location if still no location found
    if (!driverLocation || !driverLocation.lat || !driverLocation.lng) {
        console.warn(`⚠️ Using fallback location for driver ${driverId}`);
        driverLocation = {
            lat: 25.3682,
            lng: 51.5511,
            fallback: true,
            source: 'fallback'
        };
        locationSource = 'fallback';
    }
    
    console.log(`📍 Final driver location (source: ${locationSource}):`, driverLocation);
    
    // Enhanced scoring algorithm with distance calculation
    const scoredBins = bins.map(bin => {
        let score = 0;
        let distance = 0;
        
        console.log(`📦 Processing bin ${bin.id} (${bin.fill}% full) at location:`, { lat: bin.lat, lng: bin.lng });
        
        // Calculate distance if driver location is available
        if (driverLocation && driverLocation.lat && driverLocation.lng && bin.lat && bin.lng) {
            try {
                distance = dataManager.calculateDistance(
                    driverLocation.lat, driverLocation.lng,
                    bin.lat, bin.lng
                );
                console.log(`📏 Calculated distance from driver to bin ${bin.id}: ${distance.toFixed(2)} km`);
                
                // Distance factor (closer = higher priority)
                if (distance < 2) score += 25;
                else if (distance < 5) score += 15;
                else if (distance < 10) score += 5;
            } catch (error) {
                console.error(`❌ Distance calculation failed for bin ${bin.id}:`, error);
                distance = 0;
            }
        } else {
            console.log(`⚠️ Missing coordinates for distance calculation - Driver: ${!!driverLocation}, Bin: ${!!(bin.lat && bin.lng)}`);
        }
        
        // Fill level priority (higher fill = higher priority)
        score += bin.fill * 0.4;
        
        // Urgency based on fill level
        if (bin.fill >= 90) score += 30;
        else if (bin.fill >= 75) score += 20;
        else if (bin.fill >= 50) score += 10;
        
        // Temperature factor (higher temp = higher priority)
        if (bin.temperature && bin.temperature > 35) score += 15;
        else if (bin.temperature && bin.temperature > 30) score += 10;
        
        // Random factor for variety
        score += Math.random() * 5;
        
        console.log(`🎯 Bin ${bin.id} scored: ${score.toFixed(2)} (distance: ${distance.toFixed(2)} km)`);
        
        return { ...bin, score, calculatedDistance: distance };
    });
    
    // Sort by score (highest first)
    scoredBins.sort((a, b) => b.score - a.score);
    
    const bestBin = scoredBins[0];
    console.log(`🏆 Best bin selected: ${bestBin.id} with score ${bestBin.score.toFixed(2)}`);
    
    const finalDistance = bestBin.calculatedDistance > 0 ? Math.round(bestBin.calculatedDistance * 100) / 100 : null;
    
    const suggestion = {
        binId: bestBin.id,
        binLocation: bestBin.location,
        fillLevel: bestBin.fill,
        distance: finalDistance,
        priority: bestBin.fill >= 75 ? 'High' : bestBin.fill >= 50 ? 'Medium' : 'Low',
        reason: generateSuggestionReason(bestBin, bestBin.calculatedDistance),
        estimatedTime: Math.ceil((bestBin.calculatedDistance || 5) * 2 + bestBin.fill / 10) + 5, // Travel time + collection time
        timestamp: new Date().toISOString(),
        debugInfo: {
            locationSource: locationSource,
            driverLocation: driverLocation,
            binLocation: { lat: bestBin.lat, lng: bestBin.lng },
            rawDistance: bestBin.calculatedDistance
        }
    };
    
    console.log(`✅ Created suggestion with distance ${finalDistance}km:`, suggestion);
    return suggestion;
}

function generateSuggestionReason(bin, distance) {
    const reasons = [];
    
    if (bin.fill >= 90) {
        reasons.push('Critical fill level');
    } else if (bin.fill >= 75) {
        reasons.push('High fill level');
    } else if (bin.fill >= 50) {
        reasons.push('Moderate fill level');
    }
    
    if (distance && distance < 2) {
        reasons.push('Very close to you');
    } else if (distance && distance < 5) {
        reasons.push('Nearby location');
    }
    
    if (bin.temperature && bin.temperature > 35) {
        reasons.push('High temperature detected');
    }
    
    if (reasons.length === 0) {
        reasons.push('Optimal collection opportunity');
    }
    
    return reasons.join(' • ');
}

// Initialize event handlers when DOM loads
document.addEventListener('DOMContentLoaded', setupEventHandlers);

// Export for global access
window.setupEventHandlers = setupEventHandlers;
window.performComprehensiveRouteOptimization = performComprehensiveRouteOptimization;
