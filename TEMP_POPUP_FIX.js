/**
 * TEMPORARY FIX: Hide login overlay when clicking Live Monitoring
 * This ensures the login overlay doesn't reappear when navigating to monitoring page
 */

(function() {
    'use strict';
    
    console.log('🔧 Loading Live Monitoring popup fix...');
    
    // Intercept navigation to monitoring section
    function interceptMonitoringNavigation() {
        // Find Live Monitoring nav item
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            const section = item.getAttribute('data-section');
            if (section === 'monitoring') {
                // Add click listener that prevents any popup
                item.addEventListener('click', function(e) {
                    console.log('📡 Live Monitoring clicked - ensuring no popup');
                    
                    // Force hide login overlay if it tries to show
                    setTimeout(() => {
                        const loginOverlay = document.getElementById('loginOverlay');
                        if (loginOverlay && window.authManager && window.authManager.getCurrentUser()) {
                            // User is logged in, hide overlay if it shows
                            const display = window.getComputedStyle(loginOverlay).display;
                            if (display === 'flex' || display === 'block') {
                                console.log('🚫 BLOCKED login overlay from showing on Live Monitoring page');
                                loginOverlay.style.display = 'none';
                            }
                        }
                    }, 50);
                    
                    // Check again after 200ms
                    setTimeout(() => {
                        const loginOverlay = document.getElementById('loginOverlay');
                        if (loginOverlay && window.authManager && window.authManager.getCurrentUser()) {
                            const display = window.getComputedStyle(loginOverlay).display;
                            if (display === 'flex' || display === 'block') {
                                console.log('🚫 BLOCKED login overlay (2nd check) on Live Monitoring page');
                                loginOverlay.style.display = 'none';
                            }
                        }
                    }, 200);
                    
                }, true); // Capture phase - runs first
            }
        });
        
        console.log('✅ Live Monitoring navigation intercepted');
    }
    
    // Wait for DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', interceptMonitoringNavigation);
    } else {
        setTimeout(interceptMonitoringNavigation, 500);
    }
    
})();

console.log('✅ Live Monitoring popup fix loaded');
