/**
 * IMMEDIATE FIX: Block login overlay on Live Monitoring page
 * This runs IMMEDIATELY and continuously blocks the popup
 */

console.log('🚨 EMERGENCY POPUP BLOCKER FOR LIVE MONITORING - LOADING');

// IMMEDIATE: Hide login overlay if user is logged in
function forceHideLoginIfLoggedIn() {
    try {
        if (window.authManager && authManager.getCurrentUser()) {
            const loginOverlay = document.getElementById('loginOverlay');
            if (loginOverlay) {
                const currentDisplay = window.getComputedStyle(loginOverlay).display;
                if (currentDisplay === 'flex' || currentDisplay === 'block') {
                    console.log('🚫 EMERGENCY: Hiding login overlay (user IS logged in)');
                    loginOverlay.style.display = 'none';
                    loginOverlay.style.visibility = 'hidden';
                    loginOverlay.style.opacity = '0';
                    loginOverlay.style.pointerEvents = 'none';
                }
            }
        }
    } catch (e) {
        // Silent
    }
}

// Run IMMEDIATELY
forceHideLoginIfLoggedIn();

// Run continuously for first 10 seconds
let count = 0;
const emergencyInterval = setInterval(() => {
    forceHideLoginIfLoggedIn();
    count++;
    if (count >= 100) {  // 100 * 100ms = 10 seconds
        clearInterval(emergencyInterval);
        console.log('✅ Emergency popup blocker: Monitoring complete');
    }
}, 100);

// Watch for Live Monitoring section becoming visible
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
            const target = mutation.target;
            if (target.id === 'monitoring') {
                const display = window.getComputedStyle(target).display;
                if (display !== 'none') {
                    console.log('📡 Live Monitoring section shown - forcing login overlay check');
                    // Force hide login overlay
                    setTimeout(forceHideLoginIfLoggedIn, 0);
                    setTimeout(forceHideLoginIfLoggedIn, 50);
                    setTimeout(forceHideLoginIfLoggedIn, 100);
                    setTimeout(forceHideLoginIfLoggedIn, 200);
                    setTimeout(forceHideLoginIfLoggedIn, 500);
                }
            }
        }
    });
});

// Start observing after DOM loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const monitoring = document.getElementById('monitoring');
        if (monitoring) {
            observer.observe(monitoring, { attributes: true, attributeFilter: ['style'] });
            console.log('✅ Live Monitoring section observer active');
        }
    });
} else {
    const monitoring = document.getElementById('monitoring');
    if (monitoring) {
        observer.observe(monitoring, { attributes: true, attributeFilter: ['style'] });
        console.log('✅ Live Monitoring section observer active');
    }
}

console.log('✅ EMERGENCY POPUP BLOCKER READY - Will prevent Live Monitoring popup');
