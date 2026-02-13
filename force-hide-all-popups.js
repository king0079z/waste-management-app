/**
 * FORCE HIDE ALL POPUPS
 * Nuclear option - forcefully hides ANY popup that appears
 */

(function() {
    'use strict';
    
    console.log('💥 FORCE HIDE ALL POPUPS: Nuclear protection activated');
    
    // =================================================================
    // MONITOR AND DESTROY ANY POPUP WINDOWS
    // =================================================================
    
    let popupCheckInterval = null;
    let blockedPopupCount = 0;
    
    // Track all window.open calls
    const openedWindows = new Set();
    
    // Override window.open COMPLETELY
    const originalOpen = window.open;
    window.open = function(url, name, specs) {
        // Check if it's a Microsoft/Outlook URL
        if (url && (
            url.includes('microsoft') ||
            url.includes('outlook') ||
            url.includes('login.live') ||
            url.includes('oauth') ||
            url.includes('authorize') ||
            url.includes('account.live') ||
            url.includes('login.microsoftonline')
        )) {
            console.log('🚫 BLOCKED Microsoft popup:', url);
            blockedPopupCount++;
            return null;
        }
        
        // Allow internal navigation only
        if (url && (
            url.startsWith('/') ||
            url.includes('localhost') ||
            url.includes('127.0.0.1') ||
            url.includes('tel:') ||
            url.includes('maps.google.com')
        )) {
            console.log('✅ Allowing internal URL:', url);
            const win = originalOpen.call(window, url, name, specs);
            if (win) {
                openedWindows.add(win);
            }
            return win;
        }
        
        // Block everything else
        console.log('🚫 BLOCKED popup:', url || 'unknown');
        blockedPopupCount++;
        return null;
    };
    
    // =================================================================
    // SCAN AND CLOSE ANY UNAUTHORIZED WINDOWS
    // =================================================================
    
    function scanForUnauthorizedWindows() {
        openedWindows.forEach(win => {
            try {
                // Check if window is still open
                if (win.closed) {
                    openedWindows.delete(win);
                } else {
                    // Check if it's a Microsoft window
                    try {
                        const winUrl = win.location.href;
                        if (winUrl && (
                            winUrl.includes('microsoft') ||
                            winUrl.includes('outlook') ||
                            winUrl.includes('login.live')
                        )) {
                            console.log('🚫 CLOSING Microsoft window');
                            win.close();
                            openedWindows.delete(win);
                            blockedPopupCount++;
                        }
                    } catch (e) {
                        // Cross-origin, can't access URL, leave it
                    }
                }
            } catch (e) {
                // Error accessing window, remove from tracking
                openedWindows.delete(win);
            }
        });
    }
    
    // =================================================================
    // MONITOR FOR DIALOGS AND IFRAMES
    // =================================================================
    
    function monitorForMicrosoftDialogs() {
        // Check for Microsoft authentication dialogs/iframes
        const suspiciousElements = document.querySelectorAll('iframe, dialog, [role="dialog"]');
        
        suspiciousElements.forEach(element => {
            const src = element.src || element.dataset?.src || '';
            const content = element.innerHTML || '';
            
            // Check if it's Microsoft-related
            if (src.includes('microsoft') || 
                src.includes('outlook') || 
                src.includes('login.live') ||
                content.includes('Microsoft account') ||
                content.includes('Sign in with Microsoft') ||
                content.includes('Outlook')) {
                
                console.log('🚫 REMOVING Microsoft element:', element.tagName);
                element.remove();
                blockedPopupCount++;
            }
        });
    }
    
    // =================================================================
    // PREVENT PAGE REDIRECTS & MULTIPLE LOGIN OVERLAY SHOWS
    // =================================================================
    
    // Track if login overlay is already visible
    let loginOverlayVisible = false;
    let showLoginCallCount = 0;
    
    // Monitor loginOverlay display changes
    const loginOverlayObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                const target = mutation.target;
                if (target.id === 'loginOverlay') {
                    const displayStyle = window.getComputedStyle(target).display;
                    if (displayStyle === 'flex' || displayStyle === 'block') {
                        showLoginCallCount++;
                        
                        // If shown more than once in 2 seconds, it's a duplicate
                        if (showLoginCallCount > 1 && !loginOverlayVisible) {
                            console.log('🚫 BLOCKED duplicate login overlay show (attempt #' + showLoginCallCount + ')');
                            target.style.display = 'none';
                            return;
                        }
                        
                        loginOverlayVisible = true;
                        console.log('ℹ️ Login overlay shown (legitimate)');
                        
                        // Reset counter after 2 seconds
                        setTimeout(() => {
                            showLoginCallCount = 0;
                        }, 2000);
                    } else if (displayStyle === 'none') {
                        loginOverlayVisible = false;
                        showLoginCallCount = 0;
                    }
                }
            }
        });
    });
    
    // Start observing loginOverlay
    function observeLoginOverlay() {
        const loginOverlay = document.getElementById('loginOverlay');
        if (loginOverlay) {
            loginOverlayObserver.observe(loginOverlay, {
                attributes: true,
                attributeFilter: ['style']
            });
            console.log('✅ Login overlay monitor active (prevents duplicate shows)');
        } else {
            setTimeout(observeLoginOverlay, 100);
        }
    }
    
    observeLoginOverlay();
    
    // =================================================================
    // BLOCK POPUP VIA CSS (NUCLEAR OPTION)
    // =================================================================
    
    function injectBlockingCSS() {
        const style = document.createElement('style');
        style.id = 'popup-blocker-css';
        style.textContent = `
            /* Block Microsoft/Outlook authentication popups */
            iframe[src*="microsoft"],
            iframe[src*="outlook"],
            iframe[src*="login.live"],
            iframe[src*="oauth"],
            iframe[src*="authorize"],
            dialog[aria-label*="Microsoft"],
            dialog[aria-label*="Sign in"],
            [role="dialog"][aria-label*="Microsoft"],
            [role="dialog"][aria-label*="Sign in"] {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                pointer-events: none !important;
                position: absolute !important;
                left: -9999px !important;
                top: -9999px !important;
                width: 0 !important;
                height: 0 !important;
                z-index: -9999 !important;
            }
        `;
        document.head.appendChild(style);
        console.log('✅ Blocking CSS injected');
    }
    
    // =================================================================
    // INITIALIZE AND MONITOR
    // =================================================================
    
    function initialize() {
        // Inject CSS immediately
        injectBlockingCSS();
        
        // Start monitoring
        popupCheckInterval = setInterval(() => {
            scanForUnauthorizedWindows();
            monitorForMicrosoftDialogs();
        }, 100); // Check every 100ms
        
        console.log('✅ FORCE HIDE ALL POPUPS: Active');
        console.log('   💥 Checking every 100ms');
        console.log('   💥 Will close ANY Microsoft popup immediately');
        
        // Stop checking after 30 seconds (save resources)
        setTimeout(() => {
            if (popupCheckInterval) {
                clearInterval(popupCheckInterval);
                console.log(`✅ Popup monitoring complete. Blocked ${blockedPopupCount} popup(s)`);
            }
        }, 30000);
    }
    
    // Run immediately
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
    // Re-activate on logout
    window.addEventListener('logout', function() {
        console.log('🔄 Re-activating popup blocker after logout...');
        if (popupCheckInterval) {
            clearInterval(popupCheckInterval);
        }
        initialize();
    });
    
    // Export status checker
    window.getPopupBlockerStatus = function() {
        return {
            active: popupCheckInterval !== null,
            blockedCount: blockedPopupCount,
            monitoring: true
        };
    };
    
})();

console.log('✅ Force Hide All Popups loaded - Will destroy ANY popup');
